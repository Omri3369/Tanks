const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const WS_PORT = process.env.WS_PORT || 8081;

// Create HTTP server for serving static files
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }
    
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
    }
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });
            res.end(content, 'utf-8');
        }
    });
});

// Create WebSocket server
// In production, use the same port for both HTTP and WebSocket
const wss = process.env.NODE_ENV === 'production' 
    ? new WebSocket.Server({ server })
    : new WebSocket.Server({ port: WS_PORT });

let gameClient = null;
let controllerClients = new Set();

wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'register') {
                if (data.role === 'game') {
                    gameClient = ws;
                    console.log('Game client connected');
                    ws.send(JSON.stringify({ type: 'registered', role: 'game' }));
                } else if (data.role === 'controller') {
                    controllerClients.add(ws);
                    console.log('Controller client connected');
                    // Default colors matching game.js defaults
                    const playerColors = ['#4CAF50', '#ff9800'];
                    const playerId = controllerClients.size;
                    ws.playerId = playerId;
                    ws.send(JSON.stringify({ 
                        type: 'registered', 
                        role: 'controller', 
                        playerId: playerId,
                        color: playerColors[playerId - 1] || '#999999'
                    }));
                }
            } else if (data.type === 'control') {
                // Forward control commands from controller to game
                if (gameClient && gameClient.readyState === WebSocket.OPEN) {
                    gameClient.send(JSON.stringify(data));
                }
            } else if (data.type === 'updatePlayerColor') {
                // Forward color update from game to appropriate controller
                controllerClients.forEach(client => {
                    if (client.playerId === data.playerId && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'colorUpdate',
                            color: data.color
                        }));
                    }
                });
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
    
    ws.on('close', () => {
        if (ws === gameClient) {
            gameClient = null;
            console.log('Game client disconnected');
        } else if (controllerClients.has(ws)) {
            controllerClients.delete(ws);
            console.log('Controller client disconnected');
        }
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Get local IP address
const os = require('os');
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

// Get host to bind to
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '0.0.0.0';

server.listen(PORT, host, () => {
    console.log('\n=== Tanks Game Server Started ===' );
    console.log(`\nLocal access:`);
    console.log(`  Game: http://localhost:${PORT}/game.html`);
    console.log(`  Controller: http://localhost:${PORT}/controller.html`);
    console.log(`\nNetwork access (share with friends on same WiFi):`);
    console.log(`  Game: http://${localIP}:${PORT}/game.html`);
    console.log(`  Controller: http://${localIP}:${PORT}/controller.html`);
    if (process.env.NODE_ENV !== 'production') {
        console.log(`\nWebSocket Server running on port ${WS_PORT}`);
    } else {
        console.log('\nWebSocket Server running on same port as HTTP');
    }
    console.log('\n==================================\n');
});