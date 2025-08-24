// Enhanced Room-based Controller JavaScript
let enhancedController = null;
let ws = null;
let reconnectTimeout = null;
let playerId = null;
let playerName = null;
let playerColor = '#4CAF50';
let roomCode = null;
let connected = false;
let gameActive = false;

// Get parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const roomCodeFromUrl = urlParams.get('room');
const playerIdFromUrl = urlParams.get('player');

// Initialize enhanced controller if available
function initializeEnhancedController() {
    try {
        if (window.EnhancedController && roomCode && playerId) {
            console.log('Initializing enhanced controller...');
            enhancedController = new window.EnhancedController();
            enhancedController.init(roomCode, playerId);
            
            // Override the WebSocket connection to use our existing one
            enhancedController.ws = ws;
            
            // Apply player color to UI
            applyPlayerColor(playerColor);
            console.log('Enhanced controller initialized successfully');
        } else {
            console.log('Enhanced controller not available or missing required data');
            console.log('EnhancedController:', !!window.EnhancedController, 'roomCode:', roomCode, 'playerId:', playerId);
        }
    } catch (error) {
        console.error('Error initializing enhanced controller:', error);
        // Continue without enhanced features
    }
}

// Apply player color to controller UI
function applyPlayerColor(color) {
    // Update controller background with player color
    document.body.style.background = `linear-gradient(135deg, ${color}22, #222)`;
    
    // Update action buttons with player color
    const shootBtn = document.getElementById('shootBtn');
    const specialBtn = document.getElementById('specialBtn');
    
    if (shootBtn) {
        shootBtn.style.background = `linear-gradient(135deg, ${color}, ${color}cc)`;
    }
    if (specialBtn) {
        specialBtn.style.background = `linear-gradient(135deg, ${color}aa, ${color}88)`;
    }
    
    // Update joystick color
    const joystickContainer = document.getElementById('joystickContainer');
    if (joystickContainer) {
        joystickContainer.style.borderColor = color;
    }
    
    // Store color for enhanced controller
    if (enhancedController) {
        enhancedController.playerColor = color;
    }
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
        
        // If enhanced controller exists, update its WebSocket
        if (enhancedController) {
            enhancedController.ws = ws;
        }
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
    // Only log non-update messages to reduce console spam
    if (data.type !== 'GAME_UPDATE' && data.type !== 'GAME_STATE') {
        console.log('Received message:', data.type, data);
    }
    
    // Forward to enhanced controller if available
    if (enhancedController && enhancedController.handleServerMessage) {
        try {
            enhancedController.handleServerMessage(data);
        } catch (error) {
            console.error('Error in enhanced controller:', error);
        }
    }
    
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
        case 'GAME_ENDED':
            handleGameEnded(data);
            break;
        case 'GAME_UPDATE':
            // Handle game state updates from server
            if (enhancedController && data.gameState) {
                enhancedController.updateTankState(data.gameState);
            }
            break;
        case 'GAME_STATE':
            // Handle game state updates
            if (enhancedController && data.gameState) {
                enhancedController.updateTankState(data.gameState);
            }
            break;
        case 'ROOM_CLOSED':
            handleRoomClosed();
            break;
    }
}

// Handle joining room
function joinRoom() {
    const nameInput = document.getElementById('playerName');
    const codeInput = document.getElementById('roomCode');
    
    playerName = nameInput.value.trim() || 'Player';
    roomCode = (codeInput.value.trim() || roomCodeFromUrl || '').toUpperCase();
    
    if (!roomCode || roomCode.length !== 6) {
        showError('Please enter a valid 6-character room code');
        return;
    }
    
    // Generate unique player ID
    playerId = playerIdFromUrl || generatePlayerId();
    
    // Send join request
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'JOIN_ROOM',
            roomCode: roomCode,
            playerName: playerName,
            playerId: playerId
        }));
    } else {
        showError('Not connected to server');
    }
}

// Handle successful room join
function handleJoinedRoom(data) {
    console.log('Joined room:', data);
    console.log('Room state:', data.room ? data.room.state : 'no room');
    
    // Get room info
    roomCode = data.room ? data.room.id : data.roomCode;
    playerId = data.playerId;
    playerColor = data.player ? data.player.color : '#4CAF50';
    playerName = data.player ? data.player.name : 'Player';
    
    // Apply player color to UI
    applyPlayerColor(playerColor);
    
    // Update display name to match server assignment
    const nameDisplay = document.getElementById('playerNameDisplay');
    if (nameDisplay) {
        nameDisplay.textContent = playerName;
        nameDisplay.style.color = playerColor;
    }
    
    // Check if game is already in progress
    if (data.room && data.room.state === 'IN_GAME') {
        // Game is active, go directly to controller
        console.log('Game already in progress, showing controller');
        gameActive = true;
        
        // Make sure DOM is ready before manipulating elements
        const showController = () => {
            const connectScreen = document.getElementById('connectScreen');
            const lobbyScreen = document.getElementById('lobbyScreen');
            const controllerScreen = document.getElementById('controllerScreen');
            
            if (connectScreen) connectScreen.style.display = 'none';
            if (lobbyScreen) lobbyScreen.style.display = 'none';
            if (controllerScreen) {
                controllerScreen.style.display = 'block';
                console.log('Controller screen shown');
            } else {
                console.error('Controller screen element not found!');
            }
        };
        
        // Execute immediately if DOM is ready, otherwise wait
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', showController);
        } else {
            showController();
        }
        
        // Update controller display
        const controllerName = document.getElementById('controllerPlayerName');
        if (controllerName) {
            controllerName.textContent = playerName;
            controllerName.style.color = playerColor;
        }
        
        // Enable controls immediately
        if (enhancedController) {
            enhancedController.gameActive = true;
        }
    } else {
        // Show lobby for waiting
        console.log('Game not started, showing lobby');
        
        const connectScreen = document.getElementById('connectScreen');
        const lobbyScreen = document.getElementById('lobbyScreen');
        
        if (connectScreen) connectScreen.style.display = 'none';
        if (lobbyScreen) {
            lobbyScreen.style.display = 'flex';
            
            // Update room info
            const roomCodeDisplay = document.getElementById('roomCodeDisplay');
            const lobbyPlayerName = document.getElementById('lobbyPlayerName');
            
            if (roomCodeDisplay) roomCodeDisplay.textContent = roomCode;
            if (lobbyPlayerName) {
                lobbyPlayerName.textContent = playerName;
                lobbyPlayerName.style.color = playerColor;
            }
        }
    }
    
    // Initialize enhanced controller now that we have all info
    initializeEnhancedController();
}

// Handle room state updates
function updateRoomState(room) {
    if (!room) return;
    
    // Update player list
    const playersList = document.getElementById('playersList');
    if (playersList) {
        playersList.innerHTML = '';
        room.players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'lobby-player';
            playerDiv.style.borderColor = player.color;
            playerDiv.innerHTML = `
                <span style="color: ${player.color}">${player.name}</span>
                ${player.ready ? '<span style="color: #4CAF50">✓</span>' : '<span style="color: #FFC107">⏳</span>'}
            `;
            playersList.appendChild(playerDiv);
        });
    }
    
    // Enable/disable ready button based on state
    const readyBtn = document.getElementById('readyBtn');
    if (readyBtn) {
        const ourPlayer = room.players.find(p => p.id === playerId);
        if (ourPlayer) {
            readyBtn.textContent = ourPlayer.ready ? 'Not Ready' : 'Ready';
            readyBtn.style.background = ourPlayer.ready ? '#f44336' : '#4CAF50';
        }
    }
}

// Toggle ready state
function toggleReady() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'TOGGLE_READY'
        }));
    }
}

// Handle game started
function handleGameStarted(data) {
    console.log('Game started!');
    gameActive = true;
    
    // Hide lobby, show controller
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('controllerScreen').style.display = 'block';
    
    // Update controller display with player info
    const controllerName = document.getElementById('controllerPlayerName');
    if (controllerName) {
        controllerName.textContent = playerName;
        controllerName.style.color = playerColor;
    }
    
    // Enable enhanced controller features
    if (enhancedController) {
        enhancedController.gameActive = true;
    }
}

// Handle controller registration
function handleControllerRegistered(data) {
    console.log('Controller registered successfully', data);
    
    // Get player info from data if available
    if (data.player) {
        playerName = data.player.name || playerName;
        playerColor = data.player.color || playerColor;
        playerId = data.player.id || playerId;
        
        // Apply player color to UI
        applyPlayerColor(playerColor);
    }
    
    // Check game state
    if (data.room && data.room.state === 'IN_GAME') {
        gameActive = true;
        
        // Show controller screen immediately
        document.getElementById('connectScreen').style.display = 'none';
        document.getElementById('lobbyScreen').style.display = 'none';
        document.getElementById('controllerScreen').style.display = 'block';
        
        // Update controller display
        const controllerName = document.getElementById('controllerPlayerName');
        if (controllerName) {
            controllerName.textContent = playerName;
            controllerName.style.color = playerColor;
        }
        
        // Initialize enhanced controller if not already done
        if (!enhancedController) {
            initializeEnhancedController();
        }
    } else {
        // Game not started yet, show lobby
        document.getElementById('connectScreen').style.display = 'none';
        document.getElementById('lobbyScreen').style.display = 'flex';
        
        // Update room info
        document.getElementById('roomCodeDisplay').textContent = roomCode;
        document.getElementById('lobbyPlayerName').textContent = playerName;
        document.getElementById('lobbyPlayerName').style.color = playerColor;
    }
}

// Handle game ended
function handleGameEnded(data) {
    console.log('Game ended');
    gameActive = false;
    
    // Show results or return to lobby
    if (data.winner) {
        showGameResult(data.winner === playerId ? 'Victory!' : 'Defeat');
    }
    
    // Return to lobby after delay
    setTimeout(() => {
        document.getElementById('controllerScreen').style.display = 'none';
        document.getElementById('lobbyScreen').style.display = 'flex';
    }, 3000);
}

// Handle room closed
function handleRoomClosed() {
    showError('Room has been closed');
    gameActive = false;
    
    // Return to connect screen
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('controllerScreen').style.display = 'none';
    document.getElementById('connectScreen').style.display = 'flex';
}

// Show game result
function showGameResult(result) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'game-result';
    resultDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 30px;
        border-radius: 15px;
        font-size: 32px;
        font-weight: bold;
        z-index: 1000;
        text-align: center;
        border: 3px solid ${result === 'Victory!' ? '#4CAF50' : '#f44336'};
    `;
    resultDiv.textContent = result;
    document.body.appendChild(resultDiv);
    
    // Vibrate on result
    if (enhancedController) {
        enhancedController.vibrate(result === 'Victory!' ? 'powerup' : 'destroy');
    }
    
    setTimeout(() => {
        resultDiv.remove();
    }, 3000);
}

// Update connection status
function updateConnectionStatus(isConnected) {
    connected = isConnected;
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        statusElement.textContent = isConnected ? '🟢 Connected' : '🔴 Disconnected';
    }
}

// Show error message
function showError(message) {
    console.error('Error:', message);
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

// Generate unique player ID
function generatePlayerId() {
    return 'player_' + Math.random().toString(36).substr(2, 9);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded');
    console.log('Room from URL:', roomCodeFromUrl);
    console.log('Player from URL:', playerIdFromUrl);
    
    // Auto-fill room code if provided
    if (roomCodeFromUrl) {
        const roomCodeInput = document.getElementById('roomCode');
        if (roomCodeInput) {
            roomCodeInput.value = roomCodeFromUrl.toUpperCase();
        }
    }
    
    connectWebSocket();
    
    // Auto-join if we have both room code and player ID from URL
    if (roomCodeFromUrl && playerIdFromUrl) {
        playerId = playerIdFromUrl;
        roomCode = roomCodeFromUrl.toUpperCase();
        playerName = 'Player'; // Default name for auto-rejoin
        
        // Wait for WebSocket connection then auto-register
        const checkConnection = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                clearInterval(checkConnection);
                
                // Rejoin the room using JOIN_ROOM
                console.log('Auto-rejoining room with existing player ID');
                ws.send(JSON.stringify({
                    type: 'JOIN_ROOM',
                    roomCode: roomCode,
                    playerId: playerId,
                    playerName: playerName
                }));
            }
        }, 100);
    }
    
    // Setup event listeners
    const joinBtn = document.getElementById('joinBtn');
    if (joinBtn) {
        joinBtn.addEventListener('click', joinRoom);
    }
    
    const readyBtn = document.getElementById('readyBtn');
    if (readyBtn) {
        readyBtn.addEventListener('click', toggleReady);
    }
    
    // Enter key to join
    const roomCodeInput = document.getElementById('roomCode');
    const playerNameInput = document.getElementById('playerName');
    
    if (roomCodeInput) {
        roomCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                joinRoom();
            }
        });
    }
    
    if (playerNameInput) {
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                joinRoom();
            }
        });
    }
});

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.controllerRoom = {
        ws,
        playerId,
        playerName,
        playerColor,
        roomCode,
        gameActive,
        applyPlayerColor
    };
}