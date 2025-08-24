// Room-based Controller JavaScript with Enhanced Features
let ws = null;
let reconnectTimeout = null;
let playerId = null;
let playerName = null;
let playerColor = '#4CAF50';
let roomCode = null;
let connected = false;
let gameActive = false;

// Controller settings
let settings = {
    sensitivity: 0.4,
    deadZone: 0.25,
    hapticEnabled: false, // Disable haptics to reduce processing
    autoFire: false,
    sendRate: 33 // ms between input sends (30fps instead of 60fps)
};

// Tank state tracking
let tankState = {
    kills: 0,
    wins: 0,
    specialAmmo: 0,
    alive: true
};

// Input state
let inputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    shoot: false,
    special: false
};

// Previous input state for change detection
let previousInputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    shoot: false,
    special: false
};

// Touch/joystick state
let joystickActive = false;
let joystickCenter = { x: 0, y: 0 };
let currentTouch = null;

// Performance optimization
let animationFrameId = null;
let lastSendTime = 0;
const SEND_RATE = 33; // ms between sends (30fps max)
const THROTTLE_RATE = 100; // ms minimum between sends (increased throttling)

// Auto-fire
let autoFireInterval = null;

// Get parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const roomCodeFromUrl = urlParams.get('room');
const playerIdFromUrl = urlParams.get('player');

// Enhanced haptic feedback
function vibrate(pattern = 'short') {
    if (!settings.hapticEnabled || !navigator.vibrate) return;
    
    const patterns = {
        short: 20,
        medium: 50,
        long: 100,
        double: [20, 20, 20],
        hit: [100, 30, 100],
        powerup: [30, 30, 30, 30, 30],
        damage: [200],
        destroy: [50, 50, 150, 50, 300],
        connect: 50,
        shoot: 25,
        special: 75,
        win: [100, 50, 100, 50, 200, 100, 300] // Victory pattern
    };
    
    navigator.vibrate(patterns[pattern] || patterns.short);
}

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('controllerSettings');
    if (saved) {
        try {
            settings = { ...settings, ...JSON.parse(saved) };
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('controllerSettings', JSON.stringify(settings));
}

// WebSocket connection
function connectWebSocket() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsPort = window.location.hostname === 'localhost' ? ':8081' : '';
    const wsUrl = `${wsProtocol}//${window.location.hostname}${wsPort}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('Connected to server');
        updateConnectionStatus(true);
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
    };
    
    ws.onclose = () => {
        console.log('Disconnected from server');
        updateConnectionStatus(false);
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
    console.log('Received message:', data.type, data);
    switch (data.type) {
        case 'JOINED_ROOM':
            handleJoinedRoom(data);
            break;
        case 'JOIN_ERROR':
            showError(data.error);
            // Redirect to main screen after showing error
            setTimeout(() => {
                window.location.href = 'http://localhost:8080/';
            }, 2000);
            break;
        case 'ROOM_STATE':
            updateRoomState(data.room);
            break;
        case 'GAME_STARTED':
            handleGameStarted(data);
            break;
        case 'GAME_UPDATE':
            updateGameState(data.gameState);
            break;
        case 'GAME_ENDED':
            handleGameEnded(data);
            break;
        case 'ROUND_END':
            handleRoundEnd(data);
            break;
        case 'TANK_HIT':
            vibrate('hit');
            break;
        case 'TANK_DESTROYED':
            vibrate('destroy');
            tankState.alive = false;
            updateTankStateDisplay();
            break;
        case 'POWERUP_COLLECTED':
            vibrate('powerup');
            break;
        case 'TOOK_DAMAGE':
            vibrate('damage');
            break;
    }
}

// Connect to room
function connectToRoom() {
    const name = document.getElementById('playerNameInput').value.trim();
    
    if (!name) {
        showError('Please enter your name');
        return;
    }
    
    if (!roomCode) {
        showError('Room code not found');
        return;
    }
    
    playerName = name;
    document.getElementById('connectBtn').disabled = true;
    document.getElementById('connectBtn').textContent = 'Connecting...';
    
    ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomCode: roomCode,
        playerName: name,
        playerId: playerIdFromUrl
    }));
}

// Handle successful room join
function handleJoinedRoom(data) {
    console.log('Joined room, data:', data);
    console.log('Room state:', data.room ? data.room.state : 'no room data');
    
    playerId = data.playerId;
    playerColor = data.player.color;
    
    // Initialize multiplayer engine for controller
    if (window.multiplayerEngine) {
        window.multiplayerEngine.connectWebSocket(ws, 'controller');
    }
    
    // Hide connect screen and show controller
    document.getElementById('connectScreen').style.display = 'none';
    document.getElementById('controllerScreen').style.display = 'flex';
    
    // Update UI
    document.getElementById('playerName').textContent = playerName;
    document.getElementById('playerColor').style.backgroundColor = playerColor;
    
    // Check if game is already in progress
    if (data.room && data.room.state === 'IN_GAME') {
        console.log('Game already in progress, activating controls');
        handleGameStarted(data);
    } else {
        console.log('Game not started, showing waiting state');
        // Show waiting state
        document.getElementById('gameMessage').textContent = 'Waiting for game to start...';
        document.getElementById('waitingMessage').style.display = 'block';
        gameActive = false;
    }
    
    // Enable haptic feedback if available
    vibrate('connect');
}

// Update room state
function updateRoomState(room) {
    const player = room.players.find(p => p.id === playerId);
    if (player) {
        document.getElementById('gameScore').textContent = `Score: ${player.score || 0}`;
        playerColor = player.color;
        document.getElementById('playerColor').style.backgroundColor = playerColor;
    }
    
    // Update game message based on room state
    if (room.state === 'WAITING') {
        document.getElementById('gameMessage').textContent = 'Waiting for game to start...';
        document.getElementById('waitingMessage').style.display = 'block';
        gameActive = false;
    } else if (room.state === 'IN_GAME') {
        document.getElementById('gameMessage').textContent = 'Game Active!';
        document.getElementById('waitingMessage').style.display = 'none';
        gameActive = true;
    }
}

// Handle game started
function handleGameStarted(data) {
    gameActive = true;
    tankState.alive = true;
    document.getElementById('gameMessage').textContent = 'Game Active!';
    document.getElementById('waitingMessage').style.display = 'none';
    
    // Start auto-fire if enabled
    if (settings.autoFire) {
        startAutoFire();
    }
    
    // Haptic feedback
    vibrate('double');
}

// Update game state
function updateGameState(gameState) {
    if (gameState.scores) {
        const playerScore = gameState.scores[playerId] || 0;
        document.getElementById('gameScore').textContent = `Score: ${playerScore}`;
        tankState.kills = playerScore;
    }
    
    if (gameState.roundNumber) {
        document.getElementById('gameMessage').textContent = `Round ${gameState.roundNumber}`;
    }
    
    if (gameState.timeRemaining) {
        const minutes = Math.floor(gameState.timeRemaining / 60);
        const seconds = gameState.timeRemaining % 60;
        document.getElementById('gameTimer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Update tank-specific state if available
    if (gameState.tanks) {
        const ourTank = gameState.tanks.find(t => t.id === playerId);
        if (ourTank) {
            tankState.specialAmmo = ourTank.specialAmmo || 0;
            tankState.alive = ourTank.alive !== false;
            updateTankStateDisplay();
        }
    }
}

// Update tank state display
function updateTankStateDisplay() {
    // Update alive/eliminated status
    const waitingMessage = document.getElementById('waitingMessage');
    if (!tankState.alive && gameActive) {
        if (waitingMessage) {
            waitingMessage.style.display = 'block';
            waitingMessage.textContent = 'ELIMINATED - Waiting for next round...';
        }
    }
    
    // Update special ammo indicator if we add it to the UI
    // This can be expanded later
}

// Handle game ended
function handleGameEnded(data) {
    gameActive = false;
    tankState.alive = false;
    document.getElementById('gameMessage').textContent = 'Game Over!';
    document.getElementById('waitingMessage').style.display = 'block';
    
    // Stop auto-fire
    stopAutoFire();
    
    // Reset input state
    resetInputState();
}

// Handle round end (death/respawn)
function handleRoundEnd(data) {
    console.log('Round ended:', data);
    
    // Show winner message
    if (data.winner) {
        const winnerMessage = data.winner.id === playerId ? 
            'You Win This Round!' : 
            `${data.winner.name} Wins!`;
        document.getElementById('gameMessage').textContent = winnerMessage;
        
        // Special vibration for winner
        if (data.winner.id === playerId) {
            vibrate('win');
        }
    } else {
        document.getElementById('gameMessage').textContent = 'Round Draw!';
    }
    
    // Show message temporarily
    document.getElementById('waitingMessage').style.display = 'block';
    
    // Hide message after delay - game will continue
    setTimeout(() => {
        document.getElementById('waitingMessage').style.display = 'none';
        document.getElementById('gameMessage').textContent = '';
        
        // Reset tank state for new round
        tankState.alive = true;
        tankState.health = 100;
        updateTankStateDisplay();
    }, 2500);
}

// Check if input has changed
function hasInputChanged() {
    return Object.keys(inputState).some(key => 
        inputState[key] !== previousInputState[key]
    );
}

// Input handling with change detection and throttling
function sendInput(force = false) {
    if (!connected || !gameActive || !playerId) return;
    
    const now = Date.now();
    const timeSinceLastSend = now - lastSendTime;
    
    // Only send if input changed or forced, and throttle rate allows
    if ((force || hasInputChanged()) && timeSinceLastSend >= THROTTLE_RATE) {
        ws.send(JSON.stringify({
            type: 'PLAYER_INPUT',
            input: { ...inputState }
        }));
        
        // Update previous state and last send time
        previousInputState = { ...inputState };
        lastSendTime = now;
    }
}

// Optimized input loop using setTimeout for better performance
function startInputLoop() {
    function loop() {
        if (gameActive) {
            sendInput();
        }
        // Use setTimeout instead of requestAnimationFrame for more control
        animationFrameId = setTimeout(loop, SEND_RATE);
    }
    
    // Start the loop if not already running
    if (!animationFrameId) {
        loop();
    }
}

// Stop the input loop
function stopInputLoop() {
    if (animationFrameId) {
        clearTimeout(animationFrameId);
        animationFrameId = null;
    }
}

// Auto-fire management
function startAutoFire() {
    if (autoFireInterval) return;
    
    autoFireInterval = setInterval(() => {
        inputState.shoot = true;
        setTimeout(() => {
            inputState.shoot = false;
        }, 50);
    }, 200); // Fire every 200ms
}

function stopAutoFire() {
    if (autoFireInterval) {
        clearInterval(autoFireInterval);
        autoFireInterval = null;
    }
    inputState.shoot = false;
}

function resetInputState() {
    inputState = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        shoot: false,
        special: false
    };
    // Force send the reset state
    sendInput(true);
}

// Joystick handling
function setupJoystick() {
    const joystickArea = document.getElementById('joystickArea');
    const joystickKnob = document.getElementById('joystickKnob');
    
    // Get joystick center
    const rect = joystickArea.getBoundingClientRect();
    joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
    
    // Touch events
    joystickArea.addEventListener('touchstart', handleJoystickStart, { passive: false });
    joystickArea.addEventListener('touchmove', handleJoystickMove, { passive: false });
    joystickArea.addEventListener('touchend', handleJoystickEnd, { passive: false });
    
    // Mouse events for testing
    joystickArea.addEventListener('mousedown', handleJoystickStart);
    document.addEventListener('mousemove', handleJoystickMove);
    document.addEventListener('mouseup', handleJoystickEnd);
}

function handleJoystickStart(event) {
    event.preventDefault();
    joystickActive = true;
    
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    currentTouch = { x: clientX, y: clientY };
    
    updateJoystick(clientX, clientY);
}

function handleJoystickMove(event) {
    if (!joystickActive) return;
    event.preventDefault();
    
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    
    updateJoystick(clientX, clientY);
}

function handleJoystickEnd(event) {
    if (!joystickActive) return;
    event.preventDefault();
    
    joystickActive = false;
    currentTouch = null;
    
    // Reset joystick position
    const joystickKnob = document.getElementById('joystickKnob');
    joystickKnob.style.transform = 'translate(-50%, -50%)';
    
    // Reset movement input
    inputState.forward = false;
    inputState.backward = false;
    inputState.left = false;
    inputState.right = false;
    
    sendInput();
}

function updateJoystick(clientX, clientY) {
    const joystickKnob = document.getElementById('joystickKnob');
    
    // Calculate offset from center
    const dx = clientX - joystickCenter.x;
    const dy = clientY - joystickCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 45; // Maximum knob distance from center
    
    // Apply sensitivity
    const sensitivityMultiplier = settings.sensitivity;
    
    // Limit movement to circle
    let knobX = dx;
    let knobY = dy;
    
    if (distance > maxDistance) {
        knobX = (dx / distance) * maxDistance;
        knobY = (dy / distance) * maxDistance;
    }
    
    // Update knob position
    joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
    
    // Apply dead zone and sensitivity
    const normalizedDistance = distance / maxDistance;
    const threshold = settings.deadZone * maxDistance;
    
    if (normalizedDistance > settings.deadZone) {
        // Apply sensitivity to the input
        const adjustedX = knobX * sensitivityMultiplier;
        const adjustedY = knobY * sensitivityMultiplier;
        
        inputState.forward = adjustedY < -threshold;
        inputState.backward = adjustedY > threshold;
        inputState.left = adjustedX < -threshold;
        inputState.right = adjustedX > threshold;
    } else {
        // Within dead zone - no movement
        inputState.forward = false;
        inputState.backward = false;
        inputState.left = false;
        inputState.right = false;
    }
}

// Button handling
function setupButtons() {
    const shootButton = document.getElementById('shootButton');
    const specialButton = document.getElementById('specialButton');
    
    // Shoot button
    shootButton.addEventListener('touchstart', () => {
        if (!settings.autoFire) {
            shootButton.classList.add('active');
            inputState.shoot = true;
            vibrate('shoot');
        }
    }, { passive: true });
    
    shootButton.addEventListener('touchend', () => {
        if (!settings.autoFire) {
            shootButton.classList.remove('active');
            inputState.shoot = false;
        }
    }, { passive: true });
    
    // Special button
    specialButton.addEventListener('touchstart', () => {
        specialButton.classList.add('active');
        inputState.special = true;
        vibrate('special');
    }, { passive: true });
    
    specialButton.addEventListener('touchend', () => {
        specialButton.classList.remove('active');
        inputState.special = false;
    }, { passive: true });
    
    // Mouse events for testing
    shootButton.addEventListener('mousedown', () => {
        if (!settings.autoFire) {
            shootButton.classList.add('active');
            inputState.shoot = true;
        }
    });
    
    shootButton.addEventListener('mouseup', () => {
        if (!settings.autoFire) {
            shootButton.classList.remove('active');
            inputState.shoot = false;
        }
    });
    
    specialButton.addEventListener('mousedown', () => {
        specialButton.classList.add('active');
        inputState.special = true;
    });
    
    specialButton.addEventListener('mouseup', () => {
        specialButton.classList.remove('active');
        inputState.special = false;
    });
}

// Keyboard controls (for testing)
function setupKeyboard() {
    document.addEventListener('keydown', (event) => {
        switch (event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                inputState.forward = true;
                break;
            case 's':
            case 'arrowdown':
                inputState.backward = true;
                break;
            case 'a':
            case 'arrowleft':
                inputState.left = true;
                break;
            case 'd':
            case 'arrowright':
                inputState.right = true;
                break;
            case ' ':
                inputState.shoot = true;
                event.preventDefault();
                break;
            case 'shift':
                inputState.special = true;
                event.preventDefault();
                break;
        }
    });
    
    document.addEventListener('keyup', (event) => {
        switch (event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                inputState.forward = false;
                break;
            case 's':
            case 'arrowdown':
                inputState.backward = false;
                break;
            case 'a':
            case 'arrowleft':
                inputState.left = false;
                break;
            case 'd':
            case 'arrowright':
                inputState.right = false;
                break;
            case ' ':
                inputState.shoot = false;
                break;
            case 'shift':
                inputState.special = false;
                break;
        }
    });
}

// Update connection status
function updateConnectionStatus(isConnected) {
    connected = isConnected;
    const indicator = document.getElementById('connectionStatus');
    const text = document.getElementById('connectionText');
    
    if (isConnected) {
        indicator.classList.add('connected');
        text.textContent = 'Connected';
    } else {
        indicator.classList.remove('connected');
        text.textContent = 'Disconnected';
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load saved settings
    loadSettings();
    
    // Get room code from URL
    roomCode = roomCodeFromUrl;
    if (roomCode) {
        document.getElementById('roomCodeDisplay').textContent = roomCode;
    } else {
        showError('No room code found in URL');
        return;
    }
    
    // Connect WebSocket
    connectWebSocket();
    
    // Start auto-fire if enabled
    if (settings.autoFire) {
        startAutoFire();
    }
    
    // Auto-join if player ID is provided in URL (from redirect after game start)
    if (playerIdFromUrl) {
        // Set a default name and auto-connect
        playerName = 'Player'; // Will be updated from server with actual name
        document.getElementById('playerNameInput').value = playerName;
        
        // Wait for WebSocket to connect, then auto-join
        const autoJoinInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                clearInterval(autoJoinInterval);
                connectToRoom();
            }
        }, 100);
    }
    
    // Setup controls
    setupJoystick();
    setupButtons();
    setupKeyboard();
    
    // Enter key to connect
    document.getElementById('playerNameInput').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            connectToRoom();
        }
    });
    
    // Update joystick center on resize
    window.addEventListener('resize', () => {
        setTimeout(() => {
            const joystickArea = document.getElementById('joystickArea');
            const rect = joystickArea.getBoundingClientRect();
            joystickCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        }, 100);
    });
    
    // Prevent scrolling and zooming
    document.addEventListener('touchmove', (event) => {
        event.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchstart', (event) => {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });
    
    // Start optimized input loop using requestAnimationFrame
    startInputLoop();
});