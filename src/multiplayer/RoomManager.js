const { v4: uuidv4 } = require('uuid');

class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.playerRooms = new Map(); // Maps player ID to room ID
        this.ROOM_TIMEOUT = 30 * 60 * 1000; // 30 minutes
        this.MAX_PLAYERS = 8;
        this.ROOM_CODE_LENGTH = 6;
        
        // Start cleanup interval
        setInterval(() => this.cleanupInactiveRooms(), 60000); // Check every minute
    }
    
    generateRoomCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code;
        do {
            code = '';
            for (let i = 0; i < this.ROOM_CODE_LENGTH; i++) {
                code += characters.charAt(Math.floor(Math.random() * characters.length));
            }
        } while (this.rooms.has(code));
        return code;
    }
    
    createRoom(hostId, settings = {}) {
        const roomCode = this.generateRoomCode();
        const room = {
            id: roomCode,
            hostId: hostId,
            players: [],
            presenter: null,
            state: 'WAITING', // WAITING, IN_GAME, FINISHED
            gameSettings: {
                gameMode: settings.gameMode || 0,
                mapSize: settings.mapSize || 'medium',
                aiCount: settings.aiCount || 0,
                powerUpsEnabled: settings.powerUpsEnabled !== false,
                friendlyFire: settings.friendlyFire || false,
                ...settings
            },
            createdAt: Date.now(),
            lastActivity: Date.now(),
            gameState: null // Will hold the actual game state when playing
        };
        
        this.rooms.set(roomCode, room);
        return room;
    }
    
    joinRoom(roomCode, playerId, playerName, isHost = false) {
        const room = this.rooms.get(roomCode);
        if (!room) {
            return { success: false, error: 'Room not found' };
        }
        
        // Check if player is already in room first (before checking game state)
        console.log(`Looking for existing player ${playerId} in room ${roomCode}`);
        console.log('Room players:', room.players.map(p => ({ id: p.id, name: p.name, connected: p.connected })));
        
        const existingPlayer = room.players.find(p => p.id === playerId);
        if (existingPlayer) {
            console.log(`Found existing player ${playerId}, reconnecting`);
            existingPlayer.connected = true;
            this.updateActivity(roomCode);
            return { success: true, room, player: existingPlayer };
        }
        
        console.log(`Player ${playerId} not found in room, checking if new join is allowed`);
        
        if (room.state === 'IN_GAME') {
            return { success: false, error: 'Game already in progress' };
        }
        
        if (room.players.length >= this.MAX_PLAYERS) {
            return { success: false, error: 'Room is full' };
        }
        
        
        // Assign player color based on join order
        const playerColors = [
            '#4CAF50', // Green
            '#ff9800', // Orange  
            '#2196F3', // Blue
            '#f44336', // Red
            '#9C27B0', // Purple
            '#FFEB3B', // Yellow
            '#00BCD4', // Cyan
            '#FF5722'  // Deep Orange
        ];
        
        const player = {
            id: playerId,
            name: playerName || `Player ${room.players.length + 1}`,
            color: playerColors[room.players.length % playerColors.length],
            ready: false,
            connected: true,
            isHost: isHost || playerId === room.hostId,
            tankId: null, // Will be assigned when game starts
            score: 0,
            kills: 0
        };
        
        room.players.push(player);
        this.playerRooms.set(playerId, roomCode);
        this.updateActivity(roomCode);
        
        return { success: true, room, player };
    }
    
    leaveRoom(playerId) {
        const roomCode = this.playerRooms.get(playerId);
        if (!roomCode) return null;
        
        const room = this.rooms.get(roomCode);
        if (!room) return null;
        
        const playerIndex = room.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            if (room.state === 'IN_GAME') {
                // Mark as disconnected but don't remove during game
                room.players[playerIndex].connected = false;
            } else {
                // Remove from room if in waiting state
                room.players.splice(playerIndex, 1);
                
                // If host left, assign new host
                if (room.hostId === playerId && room.players.length > 0) {
                    room.hostId = room.players[0].id;
                    room.players[0].isHost = true;
                }
            }
        }
        
        this.playerRooms.delete(playerId);
        this.updateActivity(roomCode);
        
        // Delete room if empty
        if (room.players.length === 0 && !room.presenter) {
            this.deleteRoom(roomCode);
            return null;
        }
        
        return room;
    }
    
    setPresenter(roomCode, presenterId) {
        const room = this.rooms.get(roomCode);
        if (!room) return false;
        
        room.presenter = {
            id: presenterId,
            connected: true,
            lastHeartbeat: Date.now()
        };
        
        this.updateActivity(roomCode);
        return true;
    }
    
    removePresenter(presenterId) {
        for (const [code, room] of this.rooms.entries()) {
            if (room.presenter && room.presenter.id === presenterId) {
                room.presenter = null;
                this.updateActivity(code);
                
                // Delete room if empty
                if (room.players.length === 0) {
                    this.deleteRoom(code);
                }
                return room;
            }
        }
        return null;
    }
    
    startGame(roomCode, forceWithAI = false) {
        const room = this.rooms.get(roomCode);
        if (!room) return false;
        
        // Allow single player + AI if forceWithAI is true and aiCount is set
        if (room.players.length < 1) {
            return { success: false, error: 'Not enough players' };
        }
        
        if (room.players.length === 1 && !forceWithAI && !room.gameSettings.aiCount) {
            return { success: false, error: 'Need more players or AI opponents' };
        }
        
        room.state = 'IN_GAME';
        room.gameStartTime = Date.now();
        this.updateActivity(roomCode);
        
        // Initialize game state
        room.gameState = {
            tanks: [],
            bullets: [],
            powerUps: [],
            walls: [],
            particles: [],
            explosions: [],
            roundNumber: 1,
            roundStartTime: Date.now()
        };
        
        return { success: true, room };
    }
    
    endGame(roomCode) {
        const room = this.rooms.get(roomCode);
        if (!room) return false;
        
        room.state = 'FINISHED';
        room.gameEndTime = Date.now();
        this.updateActivity(roomCode);
        
        return true;
    }
    
    updateGameState(roomCode, gameState) {
        const room = this.rooms.get(roomCode);
        if (!room || room.state !== 'IN_GAME') return false;
        
        room.gameState = gameState;
        room.lastGameUpdate = Date.now();
        this.updateActivity(roomCode);
        
        return true;
    }
    
    getRoom(roomCode) {
        return this.rooms.get(roomCode);
    }
    
    getRoomByPlayerId(playerId) {
        const roomCode = this.playerRooms.get(playerId);
        return roomCode ? this.rooms.get(roomCode) : null;
    }
    
    getRoomByPresenterId(presenterId) {
        for (const room of this.rooms.values()) {
            if (room.presenter && room.presenter.id === presenterId) {
                return room;
            }
        }
        return null;
    }
    
    updateActivity(roomCode) {
        const room = this.rooms.get(roomCode);
        if (room) {
            room.lastActivity = Date.now();
        }
    }
    
    cleanupInactiveRooms() {
        const now = Date.now();
        for (const [code, room] of this.rooms.entries()) {
            if (now - room.lastActivity > this.ROOM_TIMEOUT) {
                console.log(`Cleaning up inactive room: ${code}`);
                this.deleteRoom(code);
            }
        }
    }
    
    deleteRoom(roomCode) {
        const room = this.rooms.get(roomCode);
        if (!room) return;
        
        // Clean up player mappings
        room.players.forEach(player => {
            this.playerRooms.delete(player.id);
        });
        
        this.rooms.delete(roomCode);
        console.log(`Room ${roomCode} deleted`);
    }
    
    setPlayerReady(playerId, ready) {
        const room = this.getRoomByPlayerId(playerId);
        if (!room) return false;
        
        const player = room.players.find(p => p.id === playerId);
        if (player) {
            player.ready = ready;
            this.updateActivity(room.id);
            return true;
        }
        
        return false;
    }
    
    updatePlayerName(playerId, name) {
        const room = this.getRoomByPlayerId(playerId);
        if (!room) return false;
        
        const player = room.players.find(p => p.id === playerId);
        if (player) {
            player.name = name;
            this.updateActivity(room.id);
            return true;
        }
        
        return false;
    }
    
    updatePlayerColor(playerId, color) {
        const room = this.getRoomByPlayerId(playerId);
        if (!room) return false;
        
        const player = room.players.find(p => p.id === playerId);
        if (player) {
            player.color = color;
            this.updateActivity(room.id);
            return true;
        }
        
        return false;
    }
    
    getAllRooms() {
        return Array.from(this.rooms.values()).map(room => ({
            id: room.id,
            playerCount: room.players.length,
            maxPlayers: this.MAX_PLAYERS,
            state: room.state,
            hasPresenter: !!room.presenter,
            createdAt: room.createdAt
        }));
    }
    
    getRoomStats(roomCode) {
        const room = this.rooms.get(roomCode);
        if (!room) return null;
        
        return {
            id: room.id,
            playerCount: room.players.length,
            connectedPlayers: room.players.filter(p => p.connected).length,
            state: room.state,
            hasPresenter: !!room.presenter,
            presenterConnected: room.presenter ? room.presenter.connected : false,
            duration: Date.now() - room.createdAt,
            lastActivity: room.lastActivity
        };
    }
}

module.exports = RoomManager;