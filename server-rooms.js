const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const RoomManager = require('./src/multiplayer/RoomManager');

const PORT = process.env.PORT || 8080;
const WS_PORT = process.env.WS_PORT || 8081;

// Initialize room manager
const roomManager = new RoomManager();

// Create HTTP server for serving static files
const server = http.createServer(async (req, res) => {
    // Handle QR code generation endpoint
    if (req.url.startsWith('/api/qrcode/')) {
        const roomCode = req.url.split('/').pop();
        const joinUrl = `${req.headers.host}/join/${roomCode}`;
        
        try {
            const qrCodeDataUrl = await QRCode.toDataURL(joinUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ qrCode: qrCodeDataUrl, joinUrl }));
        } catch (err) {
            res.writeHead(500);
            res.end('Error generating QR code');
        }
        return;
    }
    
    // Handle room stats endpoint
    if (req.url === '/api/rooms') {
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(roomManager.getAllRooms()));
        return;
    }
    
    // Handle join redirect
    if (req.url.startsWith('/join/')) {
        const roomCode = req.url.split('/').pop();
        res.writeHead(302, { 'Location': `/controller-room.html?room=${roomCode}` });
        res.end();
        return;
    }
    
    // Serve static files
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './lobby.html'; // Default to lobby page
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
const wss = process.env.NODE_ENV === 'production' 
    ? new WebSocket.Server({ server })
    : new WebSocket.Server({ port: WS_PORT });

// Track WebSocket connections
const connections = new Map(); // Maps connection ID to { ws, type, roomCode, playerId }

wss.on('connection', (ws) => {
    const connectionId = uuidv4();
    connections.set(connectionId, { ws, type: null, roomCode: null, playerId: null });
    
    console.log(`New WebSocket connection: ${connectionId}`);
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            const connection = connections.get(connectionId);
            
            switch (data.type) {
                case 'CREATE_ROOM':
                    handleCreateRoom(connectionId, data);
                    break;
                    
                case 'JOIN_ROOM':
                    handleJoinRoom(connectionId, data);
                    break;
                    
                case 'LEAVE_ROOM':
                    handleLeaveRoom(connectionId);
                    break;
                    
                case 'REGISTER_PRESENTER':
                    handleRegisterPresenter(connectionId, data);
                    break;
                    
                case 'PLAYER_READY':
                    handlePlayerReady(connectionId, data);
                    break;
                    
                case 'UPDATE_PLAYER':
                    handleUpdatePlayer(connectionId, data);
                    break;
                    
                case 'START_GAME':
                    handleStartGame(connectionId);
                    break;
                    
                case 'PLAYER_INPUT':
                    handlePlayerInput(connectionId, data);
                    break;
                    
                case 'GAME_STATE':
                    handleGameState(connectionId, data);
                    break;
                    
                case 'END_GAME':
                    handleEndGame(connectionId);
                    break;
                    
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (err) {
            console.error('Error handling message:', err);
        }
    });
    
    ws.on('close', () => {
        handleDisconnect(connectionId);
        connections.delete(connectionId);
    });
    
    ws.on('error', (error) => {
        console.error(`WebSocket error for ${connectionId}:`, error);
    });
});

// Message handlers
function handleCreateRoom(connectionId, data) {
    const connection = connections.get(connectionId);
    const playerId = uuidv4();
    
    const room = roomManager.createRoom(playerId, data.settings);
    
    // Join the creator to the room as host
    const joinResult = roomManager.joinRoom(room.id, playerId, data.playerName, true);
    
    if (joinResult.success) {
        connection.type = 'player';
        connection.roomCode = room.id;
        connection.playerId = playerId;
        
        connection.ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            room: room,
            playerId: playerId,
            player: joinResult.player
        }));
        
        broadcastRoomState(room.id);
    }
}

function handleJoinRoom(connectionId, data) {
    const connection = connections.get(connectionId);
    const playerId = data.playerId || uuidv4();
    
    const joinResult = roomManager.joinRoom(data.roomCode, playerId, data.playerName);
    
    if (joinResult.success) {
        connection.type = 'player';
        connection.roomCode = data.roomCode;
        connection.playerId = playerId;
        
        connection.ws.send(JSON.stringify({
            type: 'JOINED_ROOM',
            room: joinResult.room,
            playerId: playerId,
            player: joinResult.player
        }));
        
        broadcastRoomState(data.roomCode);
    } else {
        connection.ws.send(JSON.stringify({
            type: 'JOIN_ERROR',
            error: joinResult.error
        }));
    }
}

function handleLeaveRoom(connectionId) {
    const connection = connections.get(connectionId);
    if (!connection.playerId) return;
    
    const room = roomManager.leaveRoom(connection.playerId);
    
    connection.type = null;
    connection.roomCode = null;
    connection.playerId = null;
    
    if (room) {
        broadcastRoomState(room.id);
    }
}

function handleRegisterPresenter(connectionId, data) {
    const connection = connections.get(connectionId);
    
    if (roomManager.setPresenter(data.roomCode, connectionId)) {
        connection.type = 'presenter';
        connection.roomCode = data.roomCode;
        
        const room = roomManager.getRoom(data.roomCode);
        
        connection.ws.send(JSON.stringify({
            type: 'PRESENTER_REGISTERED',
            room: room
        }));
        
        broadcastRoomState(data.roomCode);
    } else {
        connection.ws.send(JSON.stringify({
            type: 'PRESENTER_ERROR',
            error: 'Room not found'
        }));
    }
}

function handlePlayerReady(connectionId, data) {
    const connection = connections.get(connectionId);
    if (!connection.playerId) return;
    
    if (roomManager.setPlayerReady(connection.playerId, data.ready)) {
        broadcastRoomState(connection.roomCode);
    }
}

function handleUpdatePlayer(connectionId, data) {
    const connection = connections.get(connectionId);
    if (!connection.playerId) return;
    
    let updated = false;
    
    if (data.name) {
        updated = roomManager.updatePlayerName(connection.playerId, data.name) || updated;
    }
    
    if (data.color) {
        updated = roomManager.updatePlayerColor(connection.playerId, data.color) || updated;
    }
    
    if (updated) {
        broadcastRoomState(connection.roomCode);
    }
}

function handleStartGame(connectionId) {
    const connection = connections.get(connectionId);
    if (!connection.playerId) return;
    
    const room = roomManager.getRoomByPlayerId(connection.playerId);
    if (!room) return;
    
    // Only host can start game
    const player = room.players.find(p => p.id === connection.playerId);
    if (!player || !player.isHost) {
        connection.ws.send(JSON.stringify({
            type: 'START_ERROR',
            error: 'Only host can start the game'
        }));
        return;
    }
    
    const result = roomManager.startGame(room.id);
    
    if (result.success) {
        broadcastToRoom(room.id, {
            type: 'GAME_STARTED',
            room: result.room
        });
    } else {
        connection.ws.send(JSON.stringify({
            type: 'START_ERROR',
            error: result.error
        }));
    }
}

function handlePlayerInput(connectionId, data) {
    const connection = connections.get(connectionId);
    if (!connection.playerId || !connection.roomCode) return;
    
    // Forward input to presenter
    const room = roomManager.getRoom(connection.roomCode);
    if (!room || !room.presenter) return;
    
    broadcastToPresenter(connection.roomCode, {
        type: 'PLAYER_INPUT',
        playerId: connection.playerId,
        input: data.input
    });
}

function handleGameState(connectionId, data) {
    const connection = connections.get(connectionId);
    if (connection.type !== 'presenter' || !connection.roomCode) return;
    
    // Update game state in room
    roomManager.updateGameState(connection.roomCode, data.gameState);
    
    // Broadcast simplified state to controllers
    broadcastToPlayers(connection.roomCode, {
        type: 'GAME_UPDATE',
        gameState: {
            scores: data.gameState.scores,
            roundNumber: data.gameState.roundNumber,
            timeRemaining: data.gameState.timeRemaining
        }
    });
}

function handleEndGame(connectionId) {
    const connection = connections.get(connectionId);
    if (!connection.roomCode) return;
    
    if (roomManager.endGame(connection.roomCode)) {
        broadcastToRoom(connection.roomCode, {
            type: 'GAME_ENDED'
        });
    }
}

function handleDisconnect(connectionId) {
    const connection = connections.get(connectionId);
    if (!connection) return;
    
    if (connection.type === 'player' && connection.playerId) {
        const room = roomManager.leaveRoom(connection.playerId);
        if (room) {
            broadcastRoomState(room.id);
        }
    } else if (connection.type === 'presenter') {
        const room = roomManager.removePresenter(connectionId);
        if (room) {
            broadcastRoomState(room.id);
        }
    }
    
    console.log(`Connection ${connectionId} disconnected`);
}

// Broadcast helpers
function broadcastRoomState(roomCode) {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;
    
    broadcastToRoom(roomCode, {
        type: 'ROOM_STATE',
        room: room
    });
}

function broadcastToRoom(roomCode, message) {
    connections.forEach((connection) => {
        if (connection.roomCode === roomCode && connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.send(JSON.stringify(message));
        }
    });
}

function broadcastToPlayers(roomCode, message) {
    connections.forEach((connection) => {
        if (connection.roomCode === roomCode && connection.type === 'player' && connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.send(JSON.stringify(message));
        }
    });
}

function broadcastToPresenter(roomCode, message) {
    connections.forEach((connection) => {
        if (connection.roomCode === roomCode && connection.type === 'presenter' && connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.send(JSON.stringify(message));
        }
    });
}

// Start server
server.listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the lobby`);
});

if (process.env.NODE_ENV !== 'production') {
    console.log(`WebSocket Server running on port ${WS_PORT}`);
}