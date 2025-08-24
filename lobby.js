// Lobby JavaScript
let ws = null;
let currentRoom = null;
let playerId = null;
let isHost = false;
let playerReady = false;

// WebSocket connection
function connectWebSocket() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsPort = window.location.hostname === 'localhost' ? ':8081' : '';
    const wsUrl = `${wsProtocol}//${window.location.hostname}${wsPort}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('Connected to server');
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
    };
    
    ws.onclose = () => {
        console.log('Disconnected from server');
        setTimeout(connectWebSocket, 2000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

// Handle messages from server
function handleServerMessage(data) {
    switch (data.type) {
        case 'ROOM_CREATED':
            handleRoomCreated(data);
            break;
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
        case 'START_ERROR':
            showError(data.error);
            break;
    }
}

// UI Navigation
function showMainMenu() {
    hideAllSections();
    document.getElementById('mainMenu').classList.add('active');
}

function showCreateRoom() {
    hideAllSections();
    document.getElementById('createRoom').classList.add('active');
}

function showJoinRoom() {
    hideAllSections();
    document.getElementById('joinRoom').classList.add('active');
}

function showRoomLobby() {
    hideAllSections();
    document.getElementById('roomLobby').classList.add('active');
}

function hideAllSections() {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
}

// Room Management
function createRoom() {
    const name = document.getElementById('playerName').value.trim();
    if (!name) {
        showError('Please enter your name');
        return;
    }
    
    const settings = {
        mapSize: document.getElementById('mapSize').value,
        aiCount: parseInt(document.getElementById('aiCount').value),
        powerUpsEnabled: document.getElementById('powerUps').value === 'true',
        friendlyFire: document.getElementById('friendlyFire').value === 'true'
    };
    
    ws.send(JSON.stringify({
        type: 'CREATE_ROOM',
        playerName: name,
        settings: settings
    }));
}

function joinRoom() {
    const name = document.getElementById('joinPlayerName').value.trim();
    const code = document.getElementById('roomCodeInput').value.trim().toUpperCase();
    
    if (!name) {
        showError('Please enter your name');
        return;
    }
    
    if (!code || code.length !== 6) {
        showError('Please enter a valid 6-character room code');
        return;
    }
    
    ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomCode: code,
        playerName: name
    }));
}

function leaveRoom() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'LEAVE_ROOM' }));
    }
    
    currentRoom = null;
    playerId = null;
    isHost = false;
    playerReady = false;
    
    showMainMenu();
}

// Room Updates
function handleRoomCreated(data) {
    currentRoom = data.room;
    playerId = data.playerId;
    isHost = true;
    
    showRoomLobby();
    updateRoomDisplay();
    loadQRCode();
}

function handleJoinedRoom(data) {
    currentRoom = data.room;
    playerId = data.playerId;
    isHost = data.player.isHost;
    
    showRoomLobby();
    updateRoomDisplay();
    loadQRCode();
}

function updateRoomState(room) {
    currentRoom = room;
    updateRoomDisplay();
}

function updateRoomDisplay() {
    if (!currentRoom) return;
    
    // Update room code
    document.getElementById('roomCodeDisplay').textContent = currentRoom.id;
    
    // Update players list
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';
    
    currentRoom.players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'player-name';
        
        const colorDiv = document.createElement('div');
        colorDiv.className = 'player-color';
        colorDiv.style.backgroundColor = player.color;
        
        const nameText = document.createElement('span');
        nameText.textContent = player.name;
        
        nameDiv.appendChild(colorDiv);
        nameDiv.appendChild(nameText);
        
        if (player.isHost) {
            const hostBadge = document.createElement('span');
            hostBadge.className = 'host-badge';
            hostBadge.textContent = 'HOST';
            nameDiv.appendChild(hostBadge);
        }
        
        const statusDiv = document.createElement('div');
        statusDiv.className = `player-status ${player.ready ? 'ready' : 'waiting'}`;
        statusDiv.textContent = player.ready ? 'Ready' : 'Waiting';
        
        playerDiv.appendChild(nameDiv);
        playerDiv.appendChild(statusDiv);
        playersList.appendChild(playerDiv);
    });
    
    // Update player count
    const playersTitle = playersList.previousElementSibling;
    if (playersTitle) {
        playersTitle.textContent = `Players (${currentRoom.players.length}/8)`;
    }
    
    // Update presenter status
    const presenterStatus = document.getElementById('presenterStatus');
    const presenterStatusText = document.getElementById('presenterStatusText');
    
    if (currentRoom.presenter) {
        presenterStatus.classList.add('connected');
        presenterStatusText.textContent = 'Connected';
    } else {
        presenterStatus.classList.remove('connected');
        presenterStatusText.textContent = 'Not Connected';
    }
    
    // Show/hide start button for host
    const startBtn = document.getElementById('startGameBtn');
    const readyBtn = document.getElementById('readyBtn');
    
    if (isHost) {
        startBtn.style.display = 'block';
        readyBtn.style.display = 'none';
        
        // Enable start button if all players are ready and presenter is connected
        const allReady = currentRoom.players.every(p => p.ready || p.isHost);
        startBtn.disabled = !allReady || !currentRoom.presenter;
        
        if (!currentRoom.presenter) {
            startBtn.textContent = 'Waiting for TV Display...';
        } else if (!allReady) {
            startBtn.textContent = 'Waiting for Players...';
        } else {
            startBtn.textContent = 'Start Game';
        }
    } else {
        startBtn.style.display = 'none';
        readyBtn.style.display = 'block';
        
        const currentPlayer = currentRoom.players.find(p => p.id === playerId);
        if (currentPlayer) {
            playerReady = currentPlayer.ready;
            readyBtn.textContent = playerReady ? 'Not Ready' : 'Ready';
            readyBtn.className = playerReady ? 'btn back-button' : 'btn';
        }
    }
}

// QR Code
async function loadQRCode() {
    if (!currentRoom) return;
    
    try {
        const response = await fetch(`/api/qrcode/${currentRoom.id}`);
        const data = await response.json();
        
        const qrContainer = document.getElementById('qrCodeContainer');
        qrContainer.innerHTML = `<img src="${data.qrCode}" alt="QR Code">`;
        
        const joinUrl = document.getElementById('joinUrl');
        joinUrl.textContent = data.joinUrl;
    } catch (error) {
        console.error('Error loading QR code:', error);
    }
}

// Game Actions
function toggleReady() {
    playerReady = !playerReady;
    
    ws.send(JSON.stringify({
        type: 'PLAYER_READY',
        ready: playerReady
    }));
}

function startGame() {
    if (!isHost) return;
    
    ws.send(JSON.stringify({
        type: 'START_GAME'
    }));
}

function handleGameStarted(data) {
    // Store game settings in session storage
    sessionStorage.setItem('gameSettings', JSON.stringify({
        roomCode: currentRoom.id,
        playerId: playerId,
        isMultiplayer: true,
        players: currentRoom.players,
        gameSettings: currentRoom.gameSettings
    }));
    
    // Redirect to controller
    window.location.href = `controller-room.html?room=${currentRoom.id}&player=${playerId}`;
}

// Presenter
function openPresenter() {
    // Open presenter page for selecting a room
    window.open('presenter.html', '_blank');
}

function openPresenterForRoom() {
    if (!currentRoom) return;
    
    // Open presenter page with room code
    window.open(`presenter.html?room=${currentRoom.id}`, '_blank');
}

// Error Handling
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        
        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 5000);
    } else {
        alert(message);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    connectWebSocket();
    
    // Auto-uppercase room code input
    const roomCodeInput = document.getElementById('roomCodeInput');
    if (roomCodeInput) {
        roomCodeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }
    
    // Enter key handlers
    document.getElementById('playerName')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createRoom();
    });
    
    document.getElementById('joinPlayerName')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('roomCodeInput')?.focus();
        }
    });
    
    document.getElementById('roomCodeInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinRoom();
    });
});