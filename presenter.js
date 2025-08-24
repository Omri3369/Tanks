// Presenter (TV Display) JavaScript
let ws = null;
let reconnectTimeout = null;
let currentRoom = null;
let presenterGameState = null;
// canvas, ctx, and gameRunning are declared globally in game.js
// let canvas = null;
// let ctx = null;
// let gameRunning = false;

// Load terrain images
let grassImage = new Image();
grassImage.src = ASSETS.images.grass;
let grassLoaded = false;
grassImage.onload = () => { grassLoaded = true; };

let wallImage = new Image();
wallImage.src = ASSETS.images.wall;
let wallLoaded = false;
wallImage.onload = () => { wallLoaded = true; };

let waterImage = new Image();
waterImage.src = ASSETS.images.water;
let waterLoaded = false;
waterImage.onload = () => { 
    waterLoaded = true; 
};

let sandImage = new Image();
sandImage.src = ASSETS.images.sand;
let sandLoaded = false;
sandImage.onload = () => { sandLoaded = true; };

// Get room code from URL if provided (support both 'room' and 'roomcode' parameters)
const urlParams = new URLSearchParams(window.location.search);
const roomCodeFromUrl = urlParams.get('roomcode') || urlParams.get('room');

// WebSocket connection
function connectWebSocket() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsPort = window.location.hostname === 'localhost' ? ':8081' : '';
    const wsUrl = `${wsProtocol}//${window.location.hostname}${wsPort}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        
        // Auto-connect if room code in URL
        if (roomCodeFromUrl) {
            document.getElementById('roomCodeInput').value = roomCodeFromUrl;
            connectToRoom();
        }
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
    };
    
    ws.onclose = () => {
        showError('Connection lost. Reconnecting...');
        // Clear any existing timeout before setting a new one
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
        }
        reconnectTimeout = setTimeout(connectWebSocket, 2000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        showError('Connection error');
    };
}

// Handle messages from server
function handleServerMessage(data) {
    switch (data.type) {
        case 'PRESENTER_REGISTERED':
            handlePresenterRegistered(data);
            break;
        case 'PRESENTER_ERROR':
            showConnectError(data.error);
            break;
        case 'ROOM_STATE':
            updateRoomState(data.room);
            break;
        case 'GAME_STARTED':
            handleGameStarted(data);
            break;
        case 'PLAYER_INPUT':
            handlePlayerInput(data);
            break;
        case 'GAME_ENDED':
            handleGameEnded(data);
            break;
    }
}

// Connect to room
function connectToRoom() {
    const roomCode = document.getElementById('roomCodeInput').value.trim().toUpperCase();
    
    if (!roomCode || roomCode.length !== 6) {
        showConnectError('Please enter a valid 6-character room code');
        return;
    }
    
    ws.send(JSON.stringify({
        type: 'REGISTER_PRESENTER',
        roomCode: roomCode
    }));
}

// Handle successful presenter registration
function handlePresenterRegistered(data) {
    currentRoom = data.room;
    
    // Update URL with room code
    const url = new URL(window.location);
    url.searchParams.set('roomcode', currentRoom.id);
    window.history.replaceState({}, '', url);
    
    // Initialize multiplayer engine for presenter
    if (window.multiplayerEngine) {
        window.multiplayerEngine.connectWebSocket(ws, 'presenter');
        
        // Initialize multiplayer game with room data
        if (currentRoom.state === 'IN_GAME') {
            const settings = {
                roomCode: currentRoom.id,
                players: currentRoom.players,
                gameSettings: currentRoom.gameSettings
            };
            window.multiplayerEngine.initializeMultiplayerGame(settings);
        }
    }
    
    // Hide connect screen
    document.getElementById('connectScreen').style.display = 'none';
    
    // Show waiting or game screen based on room state
    if (currentRoom.state === 'WAITING') {
        showWaitingScreen();
    } else if (currentRoom.state === 'IN_GAME') {
        startGame();
    }
    
    updateRoomDisplay();
}

// Show waiting screen
function showWaitingScreen() {
    const waitingScreen = document.getElementById('waitingScreen');
    waitingScreen.style.display = 'flex';
    
    document.getElementById('waitingRoomCode').textContent = currentRoom.id;
    updateWaitingPlayers();
}

// Hide waiting screen
function hideWaitingScreen() {
    document.getElementById('waitingScreen').style.display = 'none';
}

// Update waiting players display
function updateWaitingPlayers() {
    if (!currentRoom) return;
    
    const container = document.getElementById('waitingPlayers');
    container.innerHTML = '';
    
    currentRoom.players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'waiting-player';
        
        const avatar = document.createElement('div');
        avatar.className = 'waiting-player-avatar';
        avatar.style.backgroundColor = player.color;
        
        const name = document.createElement('div');
        name.className = 'waiting-player-name';
        name.textContent = player.name;
        
        const ready = document.createElement('div');
        ready.className = 'waiting-player-ready';
        ready.textContent = player.ready ? '✓ Ready' : 'Waiting...';
        ready.style.color = player.ready ? '#4CAF50' : '#FFC107';
        
        playerDiv.appendChild(avatar);
        playerDiv.appendChild(name);
        playerDiv.appendChild(ready);
        container.appendChild(playerDiv);
    });
}

// Update room state
function updateRoomState(room) {
    currentRoom = room;
    
    if (currentRoom.state === 'WAITING') {
        updateWaitingPlayers();
    } else {
        updateRoomDisplay();
        updatePlayersList();
    }
}

// Update room display
function updateRoomDisplay() {
    if (!currentRoom) return;
    
    document.getElementById('roomCode').textContent = currentRoom.id;
    document.getElementById('roomStatus').textContent = `${currentRoom.players.length} Players Connected`;
}

// Update players list
function updatePlayersList() {
    if (!currentRoom) return;
    
    const container = document.getElementById('playersContainer');
    container.innerHTML = '';
    
    currentRoom.players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-entry';
        
        const colorIndicator = document.createElement('div');
        colorIndicator.className = 'player-color-indicator';
        colorIndicator.style.backgroundColor = player.color;
        
        const name = document.createElement('div');
        name.className = 'player-name';
        name.textContent = player.name;
        
        const kills = document.createElement('div');
        kills.className = 'player-kills';
        kills.innerHTML = `<span style="color: #ff5722;">⚔️</span> ${player.kills || 0}`;
        
        const status = document.createElement('div');
        status.className = `player-status ${player.connected ? 'connected' : 'disconnected'}`;
        status.textContent = player.connected ? '●' : '○';
        
        playerDiv.appendChild(colorIndicator);
        playerDiv.appendChild(name);
        playerDiv.appendChild(kills);
        playerDiv.appendChild(status);
        container.appendChild(playerDiv);
    });
}

// Handle game started
function handleGameStarted(data) {
    currentRoom = data.room;
    
    // Initialize multiplayer engine with room data
    if (window.multiplayerEngine) {
        const settings = {
            roomCode: currentRoom.id,
            players: currentRoom.players,
            gameSettings: currentRoom.gameSettings
        };
        window.multiplayerEngine.initializeMultiplayerGame(settings);
    }
    
    hideWaitingScreen();
    startGame();
}

// Start game
function startGame() {
    document.getElementById('gameContainer').style.display = 'block';
    
    // Initialize canvas
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size based on room settings
    const mapSizes = {
        small: { width: 800, height: 600 },
        medium: { width: 1200, height: 800 },
        large: { width: 1600, height: 900 }
    };
    
    const mapSize = currentRoom.gameSettings.mapSize || 'medium';
    canvas.width = mapSizes[mapSize].width;
    canvas.height = mapSizes[mapSize].height;
    
    // Make canvas and context available globally for the game engine
    window.canvas = canvas;
    window.ctx = ctx;
    
    // Initialize core game systems now that canvas is available
    if (typeof window.initializeCoreGameSystems === 'function') {
        window.initializeCoreGameSystems();
    }
    
    // Ensure Tank class is loaded before starting
    function tryStartGame() {
        if (!window.Tank) {
            console.log('Waiting for Tank class to load...');
            setTimeout(tryStartGame, 100);
            return;
        }
        
        // Start the multiplayer game using the real game engine
        if (window.multiplayerEngine) {
            gameRunning = window.multiplayerEngine.startGame();
        } else {
            console.error('Multiplayer engine not available');
        }
    }
    
    tryStartGame();
    
    // Request fullscreen
    requestFullscreen();
}

// Note: Map generation and game loop are now handled by the real game engine

// Handle player input
function handlePlayerInput(data) {
    // Forward input to multiplayer engine
    if (window.multiplayerEngine) {
        window.multiplayerEngine.handlePlayerInput(data.playerId, data.input);
    }
}

// Handle game ended
function handleGameEnded(data) {
    gameRunning = false;
    
    // Show victory screen
    const victoryScreen = document.getElementById('victoryScreen');
    victoryScreen.style.display = 'flex';
    
    // TODO: Display winner information
    document.getElementById('winnerName').textContent = 'Game Over!';
    document.getElementById('finalScore').textContent = '0';
    
    // Return to waiting screen after 5 seconds
    setTimeout(() => {
        victoryScreen.style.display = 'none';
        showWaitingScreen();
    }, 5000);
}

// Request fullscreen
function requestFullscreen() {
    const elem = document.documentElement;
    
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

// Error handling
function showError(message) {
    console.error(message);
    // TODO: Show error in UI
}

function showConnectError(message) {
    const errorDiv = document.getElementById('connectError');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 5000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    
    // Pre-fill room code if available
    if (roomCodeFromUrl) {
        const roomCodeInput = document.getElementById('roomCodeInput');
        roomCodeInput.value = roomCodeFromUrl.toUpperCase();
    }
    
    connectWebSocket();
    
    // Auto-uppercase room code input
    const roomCodeInput = document.getElementById('roomCodeInput');
    roomCodeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
    
    // Enter key to connect
    roomCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            connectToRoom();
        }
    });
    
    // ESC key to exit fullscreen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.fullscreenElement) {
            document.exitFullscreen();
        }
    });
});