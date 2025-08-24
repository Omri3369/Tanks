// Presenter (TV Display) JavaScript
let ws = null;
let currentRoom = null;
let gameState = null;
let canvas = null;
let ctx = null;
let gameRunning = false;

// Get room code from URL if provided
const urlParams = new URLSearchParams(window.location.search);
const roomCodeFromUrl = urlParams.get('room');

// WebSocket connection
function connectWebSocket() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsPort = window.location.hostname === 'localhost' ? ':8081' : '';
    const wsUrl = `${wsProtocol}//${window.location.hostname}${wsPort}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('Connected to server');
        
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
        console.log('Disconnected from server');
        showError('Connection lost. Reconnecting...');
        setTimeout(connectWebSocket, 2000);
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
        
        const score = document.createElement('div');
        score.className = 'player-score';
        score.textContent = player.score || 0;
        
        const status = document.createElement('div');
        status.className = `player-status ${player.connected ? 'connected' : 'disconnected'}`;
        status.textContent = player.connected ? '●' : '○';
        
        playerDiv.appendChild(colorIndicator);
        playerDiv.appendChild(name);
        playerDiv.appendChild(score);
        playerDiv.appendChild(status);
        container.appendChild(playerDiv);
    });
}

// Handle game started
function handleGameStarted(data) {
    currentRoom = data.room;
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
    
    // Initialize game state
    gameState = {
        tanks: [],
        bullets: [],
        walls: [],
        powerUps: [],
        particles: [],
        explosions: []
    };
    
    // Generate map
    generateMap();
    
    // Start game loop
    gameRunning = true;
    gameLoop();
    
    // Request fullscreen
    requestFullscreen();
}

// Generate map (simplified version)
function generateMap() {
    // This is a simplified map generation
    // In production, this would sync with the actual game server
    
    // Add some walls
    const wallCount = 10 + Math.floor(Math.random() * 10);
    for (let i = 0; i < wallCount; i++) {
        gameState.walls.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            width: 50 + Math.random() * 100,
            height: 20 + Math.random() * 30
        });
    }
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw walls
    ctx.fillStyle = '#444';
    gameState.walls.forEach(wall => {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    });
    
    // Draw tanks
    gameState.tanks.forEach(tank => {
        drawTank(tank);
    });
    
    // Draw bullets
    ctx.fillStyle = '#ffff00';
    gameState.bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw power-ups
    gameState.powerUps.forEach(powerUp => {
        drawPowerUp(powerUp);
    });
    
    // Draw particles
    gameState.particles.forEach(particle => {
        ctx.fillStyle = particle.color || '#ff6600';
        ctx.globalAlpha = particle.alpha || 1;
        ctx.fillRect(particle.x, particle.y, particle.size || 2, particle.size || 2);
        ctx.globalAlpha = 1;
    });
    
    requestAnimationFrame(gameLoop);
}

// Draw tank
function drawTank(tank) {
    ctx.save();
    ctx.translate(tank.x, tank.y);
    ctx.rotate(tank.angle);
    
    // Tank body
    ctx.fillStyle = tank.color;
    ctx.fillRect(-20, -15, 40, 30);
    
    // Tank barrel
    ctx.fillStyle = '#333';
    ctx.fillRect(0, -3, 30, 6);
    
    ctx.restore();
    
    // Draw player name
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(tank.playerName || 'Player', tank.x, tank.y - 25);
}

// Draw power-up
function drawPowerUp(powerUp) {
    ctx.fillStyle = '#00ff00';
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    
    // Draw star shape
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const x = powerUp.x + Math.cos(angle) * 15;
        const y = powerUp.y + Math.sin(angle) * 15;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
}

// Handle player input
function handlePlayerInput(data) {
    // This would normally update the game state
    // For now, we'll just log it
    console.log('Player input:', data.playerId, data.input);
    
    // Find the tank for this player
    const tank = gameState.tanks.find(t => t.playerId === data.playerId);
    if (tank) {
        // Update tank based on input
        if (data.input.forward) tank.y -= 2;
        if (data.input.backward) tank.y += 2;
        if (data.input.left) tank.angle -= 0.1;
        if (data.input.right) tank.angle += 0.1;
        
        if (data.input.shoot) {
            // Create bullet
            gameState.bullets.push({
                x: tank.x + Math.cos(tank.angle) * 30,
                y: tank.y + Math.sin(tank.angle) * 30,
                vx: Math.cos(tank.angle) * 5,
                vy: Math.sin(tank.angle) * 5
            });
        }
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