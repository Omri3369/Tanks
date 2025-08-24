class ControllerClient {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.playerId = null;
        this.playerColor = '#4CAF50'; // Default color
        this.pressedButtons = new Set();
        this.vibrationSupported = 'vibrate' in navigator;
        this.joystickActive = false;
        this.joystickData = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        this.connectWebSocket();
        this.setupControls();
    }
    
    connectWebSocket() {
        const wsUrl = `ws://${window.location.hostname}:8081`;
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('Connected to server');
            this.connected = true;
            this.updateStatus('Connected - Player 1', true);
            
            // Register as controller
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
            
            // Try to reconnect after 2 seconds
            setTimeout(() => this.connectWebSocket(), 2000);
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateStatus('Connection Error', false);
        };
    }
    
    updateStatus(text, connected) {
        const statusEl = document.getElementById('status');
        statusEl.textContent = text;
        statusEl.className = connected ? 'status connected' : 'status disconnected';
        
        // Apply player color to status if connected
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
        
        // Prevent default touch behaviors
        document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('gesturestart', (e) => e.preventDefault());
    }
    
    setupJoystick() {
        const joystick = document.getElementById('joystick');
        const joystickBase = document.querySelector('.joystick-base');
        const baseRect = joystickBase.getBoundingClientRect();
        const baseRadius = baseRect.width / 2;
        const maxDistance = baseRadius - 40; // Account for knob size
        
        let isDragging = false;
        
        const handleStart = (e) => {
            e.preventDefault();
            isDragging = true;
            joystick.classList.add('active');
            this.joystickActive = true;
        };
        
        const handleMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
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
            
            // Normalize to -1 to 1
            const normalizedX = deltaX / maxDistance;
            const normalizedY = deltaY / maxDistance;
            
            // Update movement based on joystick position
            this.updateMovementFromJoystick(normalizedX, normalizedY);
        };
        
        const handleEnd = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            isDragging = false;
            joystick.classList.remove('active');
            joystick.style.transform = 'translate(-50%, -50%)';
            this.joystickActive = false;
            
            // Stop all movement
            this.stopAllMovement();
        };
        
        // Touch events
        joystick.addEventListener('touchstart', handleStart);
        document.addEventListener('touchmove', handleMove);
        document.addEventListener('touchend', handleEnd);
        
        // Mouse events
        joystick.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    }
    
    setupShootButton() {
        const shootButton = document.querySelector('.shoot-button');
        
        const handleShootStart = (e) => {
            e.preventDefault();
            this.handleButtonPress('shoot', shootButton);
        };
        
        const handleShootEnd = (e) => {
            e.preventDefault();
            this.handleButtonRelease('shoot', shootButton);
        };
        
        // Touch events
        shootButton.addEventListener('touchstart', handleShootStart);
        shootButton.addEventListener('touchend', handleShootEnd);
        
        // Mouse events
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
            'w': 'up',
            's': 'down',
            'a': 'left',
            'd': 'right',
            'W': 'up',
            'S': 'down',
            'A': 'left',
            'D': 'right',
            ' ': 'shoot',
            'Enter': 'shoot'
        };
        
        document.addEventListener('keydown', (e) => {
            const action = keyMap[e.key];
            if (action && !this.pressedButtons.has(action)) {
                e.preventDefault();
                
                if (action === 'shoot') {
                    const shootButton = document.querySelector('.shoot-button');
                    this.handleButtonPress('shoot', shootButton);
                } else {
                    // Movement keys
                    this.handleButtonPress(action, null);
                    this.updateJoystickVisual();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            const action = keyMap[e.key];
            if (action && this.pressedButtons.has(action)) {
                e.preventDefault();
                
                if (action === 'shoot') {
                    const shootButton = document.querySelector('.shoot-button');
                    this.handleButtonRelease('shoot', shootButton);
                } else {
                    // Movement keys
                    this.handleButtonRelease(action, null);
                    this.updateJoystickVisual();
                }
            }
        });
    }
    
    updateJoystickVisual() {
        const joystick = document.getElementById('joystick');
        const maxDistance = 60; // Visual displacement for keyboard input
        
        let x = 0, y = 0;
        
        if (this.pressedButtons.has('left')) x -= 1;
        if (this.pressedButtons.has('right')) x += 1;
        if (this.pressedButtons.has('up')) y -= 1;
        if (this.pressedButtons.has('down')) y += 1;
        
        // Normalize diagonal movement
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
        const currentDirections = new Set();
        
        if (Math.abs(x) > threshold || Math.abs(y) > threshold) {
            if (x < -threshold) currentDirections.add('left');
            if (x > threshold) currentDirections.add('right');
            if (y < -threshold) currentDirections.add('up');
            if (y > threshold) currentDirections.add('down');
        }
        
        // Release directions that are no longer active
        ['up', 'down', 'left', 'right'].forEach(dir => {
            if (this.pressedButtons.has(dir) && !currentDirections.has(dir)) {
                this.handleButtonRelease(dir, null);
            }
        });
        
        // Press new directions
        currentDirections.forEach(dir => {
            if (!this.pressedButtons.has(dir)) {
                this.handleButtonPress(dir, null);
            }
        });
    }
    
    stopAllMovement() {
        ['up', 'down', 'left', 'right'].forEach(dir => {
            if (this.pressedButtons.has(dir)) {
                this.handleButtonRelease(dir, null);
            }
        });
    }
    
    handleButtonPress(action, buttonElement) {
        if (!this.connected) return;
        
        // Add visual feedback
        if (buttonElement) {
            buttonElement.classList.add('pressed');
        }
        
        // Add to pressed buttons set
        this.pressedButtons.add(action);
        
        // Send control command
        this.sendControl(action, true);
        
        // Haptic feedback
        this.vibrate(10);
    }
    
    handleButtonRelease(action, buttonElement) {
        if (!this.connected) return;
        
        // Remove visual feedback
        if (buttonElement) {
            buttonElement.classList.remove('pressed');
        }
        
        // Remove from pressed buttons set
        this.pressedButtons.delete(action);
        
        // Send control command
        this.sendControl(action, false);
    }
    
    sendControl(action, pressed) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'control',
                playerId: this.playerId,
                action: action,
                pressed: pressed
            }));
        }
    }
    
    vibrate(duration) {
        if (this.vibrationSupported) {
            navigator.vibrate(duration);
        }
    }
    
    applyPlayerColor() {
        // Update background gradient with player color
        document.body.style.background = `linear-gradient(135deg, ${this.playerColor}88 0%, ${this.playerColor}44 100%)`;
        
        // Update status bar color
        const statusEl = document.getElementById('status');
        if (statusEl.classList.contains('connected')) {
            statusEl.style.background = `${this.playerColor}66`;
        }
        
        // Update shoot button color
        const shootButton = document.querySelector('.shoot-button');
        if (shootButton) {
            const darkerColor = this.darkenColor(this.playerColor, 20);
            const darkestColor = this.darkenColor(this.playerColor, 40);
            shootButton.style.background = `radial-gradient(circle at 30% 30%, ${this.playerColor}, ${darkerColor}, ${darkestColor})`;
            shootButton.style.borderColor = this.darkenColor(this.playerColor, 60);
        }
    }
    
    darkenColor(color, percent) {
        // Convert hex to RGB
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

// Initialize controller when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ControllerClient();
});