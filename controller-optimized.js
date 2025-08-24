class ControllerClient {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.playerId = null;
        this.playerColor = '#4CAF50';
        this.pressedButtons = new Set();
        this.vibrationSupported = 'vibrate' in navigator;
        this.joystickActive = false;
        this.joystickData = { x: 0, y: 0 };
        
        // Optimization: State tracking and batching
        this.currentState = {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false
        };
        this.lastSentState = { ...this.currentState };
        this.sendQueue = [];
        this.sendInterval = null;
        this.lastJoystickUpdate = 0;
        this.joystickThrottle = 16; // ~60fps
        
        this.init();
    }
    
    init() {
        this.connectWebSocket();
        this.setupControls();
        this.startBatchedSending();
    }
    
    connectWebSocket() {
        const wsUrl = `ws://${window.location.hostname}:8081`;
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('Connected to server');
            this.connected = true;
            this.updateStatus('Connected - Player 1', true);
            
            this.ws.send(JSON.stringify({
                type: 'register',
                role: 'controller'
            }));
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'registered') {
                this.playerId = data.playerId;
                this.playerColor = data.color || '#4CAF50';
                this.updateStatus(`Connected - Player ${this.playerId}`, true);
                this.applyPlayerColor();
            } else if (data.type === 'colorUpdate') {
                this.playerColor = data.color;
                this.applyPlayerColor();
            }
        };
        
        this.ws.onclose = () => {
            console.log('Disconnected from server');
            this.connected = false;
            this.updateStatus('Disconnected', false);
            
            // Reduced reconnection delay for better responsiveness
            setTimeout(() => this.connectWebSocket(), 500);
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateStatus('Connection Error', false);
        };
    }
    
    // Batch sending at 60fps
    startBatchedSending() {
        this.sendInterval = setInterval(() => {
            if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
            
            // Check for state changes
            const stateChanged = Object.keys(this.currentState).some(
                key => this.currentState[key] !== this.lastSentState[key]
            );
            
            if (stateChanged) {
                // Send only changed states
                const changes = {};
                for (const key in this.currentState) {
                    if (this.currentState[key] !== this.lastSentState[key]) {
                        changes[key] = this.currentState[key];
                    }
                }
                
                this.ws.send(JSON.stringify({
                    type: 'control_batch',
                    playerId: this.playerId,
                    changes: changes,
                    timestamp: Date.now()
                }));
                
                this.lastSentState = { ...this.currentState };
            }
        }, 16); // 60fps update rate
    }
    
    updateStatus(text, connected) {
        const statusEl = document.getElementById('status');
        statusEl.textContent = text;
        statusEl.className = connected ? 'status connected' : 'status disconnected';
        
        if (connected && this.playerColor) {
            statusEl.style.background = `${this.playerColor}66`;
        } else {
            statusEl.style.background = '';
        }
    }
    
    setupControls() {
        this.setupJoystick();
        this.setupShootButton();
        this.setupKeyboardControls();
        
        document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('gesturestart', (e) => e.preventDefault());
    }
    
    setupJoystick() {
        const joystick = document.getElementById('joystick');
        const joystickBase = document.querySelector('.joystick-base');
        const baseRect = joystickBase.getBoundingClientRect();
        const baseRadius = baseRect.width / 2;
        const maxDistance = baseRadius - 40;
        
        let isDragging = false;
        let rafId = null;
        
        const handleStart = (e) => {
            e.preventDefault();
            isDragging = true;
            joystick.classList.add('active');
            this.joystickActive = true;
        };
        
        const handleMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            // Throttle joystick updates
            const now = Date.now();
            if (now - this.lastJoystickUpdate < this.joystickThrottle) return;
            this.lastJoystickUpdate = now;
            
            // Cancel previous RAF if exists
            if (rafId) cancelAnimationFrame(rafId);
            
            rafId = requestAnimationFrame(() => {
                const currentBaseRect = joystickBase.getBoundingClientRect();
                const centerX = currentBaseRect.left + currentBaseRect.width / 2;
                const centerY = currentBaseRect.top + currentBaseRect.height / 2;
                
                let clientX, clientY;
                if (e.touches) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }
                
                let deltaX = clientX - centerX;
                let deltaY = clientY - centerY;
                
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                if (distance > maxDistance) {
                    const angle = Math.atan2(deltaY, deltaX);
                    deltaX = Math.cos(angle) * maxDistance;
                    deltaY = Math.sin(angle) * maxDistance;
                }
                
                joystick.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
                
                const normalizedX = deltaX / maxDistance;
                const normalizedY = deltaY / maxDistance;
                
                this.updateMovementFromJoystick(normalizedX, normalizedY);
            });
        };
        
        const handleEnd = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            isDragging = false;
            joystick.classList.remove('active');
            joystick.style.transform = 'translate(-50%, -50%)';
            this.joystickActive = false;
            
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            
            this.stopAllMovement();
        };
        
        joystick.addEventListener('touchstart', handleStart);
        document.addEventListener('touchmove', handleMove);
        document.addEventListener('touchend', handleEnd);
        
        joystick.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    }
    
    setupShootButton() {
        const shootButton = document.querySelector('.shoot-button');
        
        const handleShootStart = (e) => {
            e.preventDefault();
            this.updateState('shoot', true);
            shootButton.classList.add('pressed');
            this.vibrate(10);
        };
        
        const handleShootEnd = (e) => {
            e.preventDefault();
            this.updateState('shoot', false);
            shootButton.classList.remove('pressed');
        };
        
        shootButton.addEventListener('touchstart', handleShootStart);
        shootButton.addEventListener('touchend', handleShootEnd);
        shootButton.addEventListener('mousedown', handleShootStart);
        shootButton.addEventListener('mouseup', handleShootEnd);
        shootButton.addEventListener('mouseleave', handleShootEnd);
    }
    
    setupKeyboardControls() {
        const keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'w': 'up', 's': 'down', 'a': 'left', 'd': 'right',
            'W': 'up', 'S': 'down', 'A': 'left', 'D': 'right',
            ' ': 'shoot',
            'Enter': 'shoot'
        };
        
        document.addEventListener('keydown', (e) => {
            const action = keyMap[e.key];
            if (action && !this.pressedButtons.has(action)) {
                e.preventDefault();
                this.pressedButtons.add(action);
                this.updateState(action, true);
                
                if (action === 'shoot') {
                    document.querySelector('.shoot-button').classList.add('pressed');
                } else {
                    this.updateJoystickVisual();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            const action = keyMap[e.key];
            if (action && this.pressedButtons.has(action)) {
                e.preventDefault();
                this.pressedButtons.delete(action);
                this.updateState(action, false);
                
                if (action === 'shoot') {
                    document.querySelector('.shoot-button').classList.remove('pressed');
                } else {
                    this.updateJoystickVisual();
                }
            }
        });
    }
    
    updateJoystickVisual() {
        const joystick = document.getElementById('joystick');
        const maxDistance = 60;
        
        let x = 0, y = 0;
        
        if (this.pressedButtons.has('left')) x -= 1;
        if (this.pressedButtons.has('right')) x += 1;
        if (this.pressedButtons.has('up')) y -= 1;
        if (this.pressedButtons.has('down')) y += 1;
        
        if (x !== 0 && y !== 0) {
            x *= 0.707;
            y *= 0.707;
        }
        
        const deltaX = x * maxDistance;
        const deltaY = y * maxDistance;
        
        if (x === 0 && y === 0) {
            joystick.style.transform = 'translate(-50%, -50%)';
            joystick.classList.remove('active');
        } else {
            joystick.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
            joystick.classList.add('active');
        }
    }
    
    updateMovementFromJoystick(x, y) {
        const threshold = 0.2;
        
        // Update state directly instead of individual messages
        this.currentState.left = x < -threshold;
        this.currentState.right = x > threshold;
        this.currentState.up = y < -threshold;
        this.currentState.down = y > threshold;
    }
    
    stopAllMovement() {
        this.currentState.up = false;
        this.currentState.down = false;
        this.currentState.left = false;
        this.currentState.right = false;
    }
    
    updateState(action, pressed) {
        if (!this.connected) return;
        this.currentState[action] = pressed;
    }
    
    vibrate(duration) {
        if (this.vibrationSupported) {
            navigator.vibrate(duration);
        }
    }
    
    applyPlayerColor() {
        document.body.style.background = `linear-gradient(135deg, ${this.playerColor}88 0%, ${this.playerColor}44 100%)`;
        
        const statusEl = document.getElementById('status');
        if (statusEl.classList.contains('connected')) {
            statusEl.style.background = `${this.playerColor}66`;
        }
        
        const shootButton = document.querySelector('.shoot-button');
        if (shootButton) {
            const darkerColor = this.darkenColor(this.playerColor, 20);
            const darkestColor = this.darkenColor(this.playerColor, 40);
            shootButton.style.background = `radial-gradient(circle at 30% 30%, ${this.playerColor}, ${darkerColor}, ${darkestColor})`;
            shootButton.style.borderColor = this.darkenColor(this.playerColor, 60);
        }
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R < 0 ? 0 : R) * 0x10000 + 
                     (G < 0 ? 0 : G) * 0x100 + 
                     (B < 0 ? 0 : B)).toString(16).slice(1);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ControllerClient();
});