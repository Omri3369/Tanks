const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8080;
const WS_PORT = 8081;

// Enhanced logging with colors and timestamps
class Logger {
    constructor(debugMode = false) {
        this.debugMode = debugMode;
        this.startTime = Date.now();
        
        // ANSI color codes
        this.colors = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            dim: '\x1b[2m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m',
            bgRed: '\x1b[41m',
            bgGreen: '\x1b[42m',
            bgYellow: '\x1b[43m',
            bgBlue: '\x1b[44m'
        };
    }
    
    timestamp() {
        const now = new Date();
        return `[${now.toTimeString().split(' ')[0]}.${now.getMilliseconds().toString().padStart(3, '0')}]`;
    }
    
    uptime() {
        const elapsed = Date.now() - this.startTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    
    info(message, ...args) {
        console.log(`${this.colors.cyan}${this.timestamp()}${this.colors.reset} ${this.colors.blue}[INFO]${this.colors.reset} ${message}`, ...args);
    }
    
    success(message, ...args) {
        console.log(`${this.colors.cyan}${this.timestamp()}${this.colors.reset} ${this.colors.green}[SUCCESS]${this.colors.reset} ${message}`, ...args);
    }
    
    warn(message, ...args) {
        console.log(`${this.colors.cyan}${this.timestamp()}${this.colors.reset} ${this.colors.yellow}[WARN]${this.colors.reset} ${message}`, ...args);
    }
    
    error(message, ...args) {
        console.error(`${this.colors.cyan}${this.timestamp()}${this.colors.reset} ${this.colors.red}[ERROR]${this.colors.reset} ${message}`, ...args);
    }
    
    debug(message, ...args) {
        if (this.debugMode) {
            console.log(`${this.colors.cyan}${this.timestamp()}${this.colors.reset} ${this.colors.magenta}[DEBUG]${this.colors.reset} ${this.colors.dim}${message}${this.colors.reset}`, ...args);
        }
    }
    
    metric(label, value, unit = '') {
        console.log(`${this.colors.cyan}${this.timestamp()}${this.colors.reset} ${this.colors.yellow}[METRIC]${this.colors.reset} ${label}: ${this.colors.bright}${value}${unit}${this.colors.reset}`);
    }
    
    connection(action, details) {
        const icon = action === 'connect' ? '🔗' : '❌';
        const color = action === 'connect' ? this.colors.green : this.colors.red;
        console.log(`${this.colors.cyan}${this.timestamp()}${this.colors.reset} ${color}[${action.toUpperCase()}]${this.colors.reset} ${icon} ${details}`);
    }
}

// Performance tracking
class PerformanceMonitor {
    constructor(logger) {
        this.logger = logger;
        this.metrics = {
            messagesReceived: 0,
            messagesSent: 0,
            bytesReceived: 0,
            bytesSent: 0,
            avgLatency: 0,
            connections: 0,
            errors: 0
        };
        this.latencyBuffer = [];
        this.maxLatencyBufferSize = 100;
        
        // Start periodic metrics reporting
        this.startMetricsReporting();
    }
    
    trackMessage(direction, size) {
        if (direction === 'in') {
            this.metrics.messagesReceived++;
            this.metrics.bytesReceived += size;
        } else {
            this.metrics.messagesSent++;
            this.metrics.bytesSent += size;
        }
    }
    
    trackLatency(latency) {
        this.latencyBuffer.push(latency);
        if (this.latencyBuffer.length > this.maxLatencyBufferSize) {
            this.latencyBuffer.shift();
        }
        this.metrics.avgLatency = this.latencyBuffer.reduce((a, b) => a + b, 0) / this.latencyBuffer.length;
    }
    
    startMetricsReporting() {
        setInterval(() => {
            this.logger.info('📊 Performance Metrics:');
            this.logger.metric('  Active Connections', this.metrics.connections);
            this.logger.metric('  Messages (In/Out)', `${this.metrics.messagesReceived}/${this.metrics.messagesSent}`);
            this.logger.metric('  Data Transfer', `↓${this.formatBytes(this.metrics.bytesReceived)} ↑${this.formatBytes(this.metrics.bytesSent)}`);
            if (this.metrics.avgLatency > 0) {
                this.logger.metric('  Avg Latency', this.metrics.avgLatency.toFixed(2), 'ms');
            }
            this.logger.metric('  Uptime', this.logger.uptime());
            if (this.metrics.errors > 0) {
                this.logger.warn(`  Errors: ${this.metrics.errors}`);
            }
        }, 30000); // Every 30 seconds
    }
    
    formatBytes(bytes) {
        if (bytes < 1024) return bytes + 'B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
        return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
    }
}

// Initialize logger and monitor
const DEBUG_MODE = process.argv.includes('--debug');
const logger = new Logger(DEBUG_MODE);
const monitor = new PerformanceMonitor(logger);

if (DEBUG_MODE) {
    logger.info('🔍 Debug mode enabled - verbose logging active');
}

// Client tracking with enhanced metadata
class ClientManager {
    constructor(logger, monitor) {
        this.logger = logger;
        this.monitor = monitor;
        this.gameClient = null;
        this.controllers = new Map(); // Use Map for better tracking
        this.clientIdCounter = 0;
    }
    
    addGameClient(ws) {
        this.gameClient = {
            ws,
            id: ++this.clientIdCounter,
            connectedAt: Date.now(),
            messagesReceived: 0,
            messagesSent: 0,
            type: 'game'
        };
        
        this.monitor.metrics.connections++;
        this.logger.success(`Game client connected [ID: ${this.gameClient.id}]`);
        this.logger.debug(`Total connections: ${this.monitor.metrics.connections}`);
        
        return this.gameClient.id;
    }
    
    addController(ws, playerId) {
        const controller = {
            ws,
            id: ++this.clientIdCounter,
            playerId,
            connectedAt: Date.now(),
            messagesReceived: 0,
            messagesSent: 0,
            lastActivity: Date.now(),
            type: 'controller'
        };
        
        this.controllers.set(ws, controller);
        this.monitor.metrics.connections++;
        
        this.logger.success(`Controller ${playerId} connected [ID: ${controller.id}]`);
        this.logger.debug(`Active controllers: ${this.controllers.size}`);
        
        return controller.id;
    }
    
    removeClient(ws) {
        if (this.gameClient && this.gameClient.ws === ws) {
            const duration = ((Date.now() - this.gameClient.connectedAt) / 1000).toFixed(1);
            this.logger.connection('disconnect', `Game client [ID: ${this.gameClient.id}] (session: ${duration}s)`);
            this.gameClient = null;
        } else if (this.controllers.has(ws)) {
            const controller = this.controllers.get(ws);
            const duration = ((Date.now() - controller.connectedAt) / 1000).toFixed(1);
            this.logger.connection('disconnect', `Controller ${controller.playerId} [ID: ${controller.id}] (session: ${duration}s)`);
            this.controllers.delete(ws);
        }
        
        this.monitor.metrics.connections--;
        this.logger.debug(`Remaining connections: ${this.monitor.metrics.connections}`);
    }
    
    getClientInfo(ws) {
        if (this.gameClient && this.gameClient.ws === ws) {
            return this.gameClient;
        }
        return this.controllers.get(ws);
    }
    
    updateActivity(ws) {
        const client = this.getClientInfo(ws);
        if (client) {
            client.lastActivity = Date.now();
            client.messagesReceived++;
        }
    }
    
    broadcastToControllers(message, excludeWs = null) {
        let sent = 0;
        this.controllers.forEach((controller, ws) => {
            if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
                ws.send(message);
                controller.messagesSent++;
                sent++;
            }
        });
        if (sent > 0) {
            this.logger.debug(`Broadcast sent to ${sent} controller(s)`);
        }
    }
}

const clientManager = new ClientManager(logger, monitor);

// HTTP Server with enhanced logging
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }
    
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': contentType = 'image/jpg'; break;
    }
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
                logger.warn(`404 - File not found: ${filePath}`);
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
                logger.error(`500 - Server error: ${error.code} for ${filePath}`);
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });
            res.end(content, 'utf-8');
            logger.debug(`Served: ${filePath} (${content.length} bytes)`);
        }
    });
});

// WebSocket Server with enhanced tracking
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws, req) => {
    const clientIP = req.socket.remoteAddress;
    logger.connection('connect', `New WebSocket connection from ${clientIP}`);
    
    ws.on('message', (message) => {
        try {
            const messageSize = Buffer.byteLength(message);
            monitor.trackMessage('in', messageSize);
            clientManager.updateActivity(ws);
            
            const data = JSON.parse(message);
            logger.debug(`Received: ${data.type} from ${clientManager.getClientInfo(ws)?.type || 'unknown'} (${messageSize} bytes)`);
            
            if (data.type === 'register') {
                if (data.role === 'game') {
                    const clientId = clientManager.addGameClient(ws);
                    ws.send(JSON.stringify({ type: 'registered', role: 'game', clientId }));
                    monitor.trackMessage('out', 50);
                    
                } else if (data.role === 'controller') {
                    const playerId = clientManager.controllers.size + 1;
                    const playerColors = ['#4CAF50', '#ff9800'];
                    const clientId = clientManager.addController(ws, playerId);
                    
                    const response = JSON.stringify({ 
                        type: 'registered', 
                        role: 'controller', 
                        playerId,
                        clientId,
                        color: playerColors[playerId - 1] || '#999999'
                    });
                    
                    ws.send(response);
                    monitor.trackMessage('out', Buffer.byteLength(response));
                }
                
            } else if (data.type === 'control' || data.type === 'control_batch') {
                // Track latency if timestamp is provided
                if (data.timestamp) {
                    const latency = Date.now() - data.timestamp;
                    monitor.trackLatency(latency);
                    logger.debug(`Input latency: ${latency}ms`);
                }
                
                // Forward to game
                if (clientManager.gameClient && clientManager.gameClient.ws.readyState === WebSocket.OPEN) {
                    const forwardMessage = JSON.stringify(data);
                    clientManager.gameClient.ws.send(forwardMessage);
                    clientManager.gameClient.messagesSent++;
                    monitor.trackMessage('out', Buffer.byteLength(forwardMessage));
                    
                    logger.debug(`Forwarded control from Player ${data.playerId} to game`);
                } else {
                    logger.warn('No game client connected to receive controls');
                }
                
            } else if (data.type === 'updatePlayerColor') {
                clientManager.controllers.forEach((controller, clientWs) => {
                    if (controller.playerId === data.playerId && clientWs.readyState === WebSocket.OPEN) {
                        const colorMessage = JSON.stringify({
                            type: 'colorUpdate',
                            color: data.color
                        });
                        clientWs.send(colorMessage);
                        controller.messagesSent++;
                        monitor.trackMessage('out', Buffer.byteLength(colorMessage));
                        
                        logger.debug(`Color update sent to Controller ${data.playerId}`);
                    }
                });
            }
            
        } catch (error) {
            monitor.metrics.errors++;
            logger.error('Error processing message:', error.message);
            logger.debug('Message content:', message.toString());
        }
    });
    
    ws.on('close', (code, reason) => {
        clientManager.removeClient(ws);
        logger.debug(`Connection closed - Code: ${code}, Reason: ${reason || 'No reason provided'}`);
    });
    
    ws.on('error', (error) => {
        monitor.metrics.errors++;
        logger.error('WebSocket error:', error.message);
    });
    
    // Ping-pong for connection health
    ws.isAlive = true;
    ws.on('pong', () => {
        ws.isAlive = true;
        logger.debug('Pong received');
    });
});

// Connection health monitoring
const connectionHealthCheck = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            logger.warn('Terminating unresponsive connection');
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wss.on('close', () => {
    clearInterval(connectionHealthCheck);
});

// Get local IP address
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const localIP = getLocalIP();

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('\n📛 Shutting down server...');
    
    // Close all connections
    wss.clients.forEach((ws) => {
        ws.close(1000, 'Server shutting down');
    });
    
    wss.close(() => {
        logger.success('WebSocket server closed');
    });
    
    server.close(() => {
        logger.success('HTTP server closed');
        logger.info('Goodbye! 👋\n');
        process.exit(0);
    });
    
    setTimeout(() => {
        logger.warn('Forced shutdown');
        process.exit(1);
    }, 5000);
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.clear();
    console.log(`
${logger.colors.cyan}╔════════════════════════════════════════════╗
║     ${logger.colors.bright}${logger.colors.yellow}🎮 TANKS GAME SERVER v2.0 🎮${logger.colors.reset}${logger.colors.cyan}     ║
╚════════════════════════════════════════════╝${logger.colors.reset}
    `);
    
    logger.success('Server started successfully!');
    logger.info(`Debug mode: ${DEBUG_MODE ? 'ENABLED' : 'DISABLED'} (use --debug flag to enable)`);
    
    console.log(`
${logger.colors.green}📡 Local Access:${logger.colors.reset}
   Game:       ${logger.colors.bright}http://localhost:${PORT}/game.html${logger.colors.reset}
   Controller: ${logger.colors.bright}http://localhost:${PORT}/controller.html${logger.colors.reset}

${logger.colors.blue}🌐 Network Access (WiFi):${logger.colors.reset}
   Game:       ${logger.colors.bright}http://${localIP}:${PORT}/game.html${logger.colors.reset}
   Controller: ${logger.colors.bright}http://${localIP}:${PORT}/controller.html${logger.colors.reset}

${logger.colors.yellow}⚡ WebSocket:${logger.colors.reset} Port ${WS_PORT}
${logger.colors.magenta}📊 Metrics:${logger.colors.reset} Every 30 seconds

${logger.colors.dim}Press Ctrl+C to stop the server${logger.colors.reset}
${logger.colors.cyan}${'─'.repeat(46)}${logger.colors.reset}
`);
});