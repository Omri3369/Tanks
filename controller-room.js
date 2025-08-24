// Room-based Controller JavaScript
let ws = null;
let playerId = null;
let playerName = null;
let playerColor = '#4CAF50';
let roomCode = null;
let connected = false;
let gameActive = false;

// Input state
let inputState = {
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

// Get parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const roomCodeFromUrl = urlParams.get('room');
const playerIdFromUrl = urlParams.get('player');

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
        case 'JOINED_ROOM':
            handleJoinedRoom(data);
            break;
        case 'JOIN_ERROR':
            showError(data.error);
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
    playerId = data.playerId;
    playerColor = data.player.color;
    
    // Hide connect screen and show controller
    document.getElementById('connectScreen').style.display = 'none';
    document.getElementById('controllerScreen').style.display = 'flex';
    
    // Update UI
    document.getElementById('playerName').textContent = playerName;
    document.getElementById('playerColor').style.backgroundColor = playerColor;
    
    // Enable haptic feedback if available
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
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
    }
}

// Handle game started
function handleGameStarted(data) {
    gameActive = true;
    document.getElementById('gameMessage').textContent = 'Game Active!';
    document.getElementById('waitingMessage').style.display = 'none';
    
    // Haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }
}

// Update game state
function updateGameState(gameState) {
    if (gameState.scores) {
        const playerScore = gameState.scores[playerId] || 0;
        document.getElementById('gameScore').textContent = `Score: ${playerScore}`;
    }
    
    if (gameState.roundNumber) {
        document.getElementById('gameMessage').textContent = `Round ${gameState.roundNumber}`;
    }
    
    if (gameState.timeRemaining) {
        const minutes = Math.floor(gameState.timeRemaining / 60);
        const seconds = gameState.timeRemaining % 60;
        document.getElementById('gameTimer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Handle game ended
function handleGameEnded(data) {
    gameActive = false;
    document.getElementById('gameMessage').textContent = 'Game Over!';
    document.getElementById('waitingMessage').style.display = 'block';
    
    // Reset input state
    resetInputState();
}

// Input handling
function sendInput() {
    if (!connected || !gameActive || !playerId) return;
    
    ws.send(JSON.stringify({
        type: 'PLAYER_INPUT',
        input: { ...inputState }
    }));
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
    sendInput();
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
    
    // Limit movement to circle
    let knobX = dx;
    let knobY = dy;
    
    if (distance > maxDistance) {
        knobX = (dx / distance) * maxDistance;
        knobY = (dy / distance) * maxDistance;
    }
    
    // Update knob position
    joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
    
    // Convert to input state
    const threshold = 15;
    
    inputState.forward = knobY < -threshold;
    inputState.backward = knobY > threshold;
    inputState.left = knobX < -threshold;
    inputState.right = knobX > threshold;
    
    sendInput();
}

// Button handling
function setupButtons() {
    const shootButton = document.getElementById('shootButton');
    const specialButton = document.getElementById('specialButton');
    
    // Shoot button
    shootButton.addEventListener('touchstart', () => {
        shootButton.classList.add('active');
        inputState.shoot = true;
        sendInput();
        
        if (navigator.vibrate) navigator.vibrate(25);
    }, { passive: true });
    
    shootButton.addEventListener('touchend', () => {
        shootButton.classList.remove('active');
        inputState.shoot = false;
        sendInput();
    }, { passive: true });
    
    // Special button
    specialButton.addEventListener('touchstart', () => {
        specialButton.classList.add('active');
        inputState.special = true;
        sendInput();
        
        if (navigator.vibrate) navigator.vibrate(50);
    }, { passive: true });
    
    specialButton.addEventListener('touchend', () => {
        specialButton.classList.remove('active');
        inputState.special = false;
        sendInput();
    }, { passive: true });
    
    // Mouse events for testing
    shootButton.addEventListener('mousedown', () => {
        shootButton.classList.add('active');
        inputState.shoot = true;
        sendInput();
    });
    
    shootButton.addEventListener('mouseup', () => {
        shootButton.classList.remove('active');
        inputState.shoot = false;
        sendInput();
    });
    
    specialButton.addEventListener('mousedown', () => {
        specialButton.classList.add('active');
        inputState.special = true;
        sendInput();
    });
    
    specialButton.addEventListener('mouseup', () => {
        specialButton.classList.remove('active');
        inputState.special = false;
        sendInput();
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
        sendInput();
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
        sendInput();
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
    
    // Send input every 50ms (20fps) when game is active
    setInterval(() => {
        if (gameActive) {
            sendInput();
        }
    }, 50);
});