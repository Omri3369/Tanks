class EnhancedController {
    constructor() {
        this.ws = null;
        this.playerId = null;
        this.roomCode = null;
        
        // Controller settings
        this.settings = {
            sensitivity: 1.0,
            deadZone: 0.15,
            hapticEnabled: true,
            autoFire: false,
            sendRate: 16 // ms between input sends (60fps)
        };
        
        // Input state
        this.currentInput = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            shoot: false,
            special: false
        };
        
        // Previous input for change detection
        this.previousInput = { ...this.currentInput };
        
        // Visual feedback elements
        this.visualElements = {};
        
        // Performance optimization
        this.inputThrottle = null;
        this.lastSendTime = 0;
        
        // Tank state from server
        this.tankState = {
            health: 100,
            ammo: 100,
            specialAmmo: 0,
            reloadTime: 0
        };
        
        // Joystick instance
        this.joystick = null;
        
        // Auto-fire interval
        this.autoFireInterval = null;
    }
    
    // Haptic feedback methods
    vibrate(pattern = 'short') {
        if (!this.settings.hapticEnabled || !navigator.vibrate) return;
        
        const patterns = {
            short: 20,
            medium: 50,
            long: 100,
            double: [20, 20, 20],
            hit: [100, 30, 100],
            powerup: [30, 30, 30, 30, 30],
            damage: [200],
            destroy: [50, 50, 150, 50, 300]
        };
        
        navigator.vibrate(patterns[pattern] || patterns.short);
    }
    
    // Initialize controller
    init(roomCode, playerId) {
        this.roomCode = roomCode;
        this.playerId = playerId;
        
        // Load saved settings
        this.loadSettings();
        
        // Setup WebSocket connection
        this.connectWebSocket();
        
        // Setup UI
        this.setupUI();
        
        // Setup controls
        this.setupControls();
        
        // Start input loop
        this.startInputLoop();
    }
    
    // Load settings from localStorage
    loadSettings() {
        const saved = localStorage.getItem('controllerSettings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Failed to load settings:', e);
            }
        }
    }
    
    // Save settings to localStorage
    saveSettings() {
        localStorage.setItem('controllerSettings', JSON.stringify(this.settings));
    }
    
    // Setup UI with visual feedback
    setupUI() {
        // Create settings panel
        const settingsHTML = `
            <div id="settingsPanel" class="settings-panel" style="display: none;">
                <h3>Controller Settings</h3>
                
                <div class="setting-item">
                    <label>Sensitivity</label>
                    <input type="range" id="sensitivitySlider" min="0.5" max="2" step="0.1" value="${this.settings.sensitivity}">
                    <span id="sensitivityValue">${this.settings.sensitivity}x</span>
                </div>
                
                <div class="setting-item">
                    <label>Dead Zone</label>
                    <input type="range" id="deadZoneSlider" min="0.05" max="0.3" step="0.05" value="${this.settings.deadZone}">
                    <span id="deadZoneValue">${Math.round(this.settings.deadZone * 100)}%</span>
                </div>
                
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="hapticToggle" ${this.settings.hapticEnabled ? 'checked' : ''}>
                        Vibration Feedback
                    </label>
                </div>
                
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="autoFireToggle" ${this.settings.autoFire ? 'checked' : ''}>
                        Auto-Fire Mode
                    </label>
                </div>
                
                <button id="closeSettings" class="btn-primary">Done</button>
            </div>
        `;
        
        // Create HUD overlay - Tank Trouble specific (no health bar)
        const hudHTML = `
            <div id="controllerHUD" class="controller-hud">
                <div class="hud-top">
                    <div class="player-stats">
                        <div class="stat-item">
                            <span class="stat-icon">⚔️</span>
                            <span id="killCount" class="stat-value">0</span>
                            <span class="stat-label">Kills</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">🏆</span>
                            <span id="winCount" class="stat-value">0</span>
                            <span class="stat-label">Wins</span>
                        </div>
                    </div>
                </div>
                
                <div class="hud-bottom">
                    <div class="ammo-display">
                        <div class="ammo-special" id="specialAmmoDisplay" style="display: none;">
                            <span class="ammo-icon">🚀</span>
                            <span id="specialAmmoCount">0</span>
                        </div>
                    </div>
                    
                    <button id="settingsBtn" class="settings-btn">⚙️</button>
                </div>
                
                <div id="reloadIndicator" class="reload-indicator" style="display: none;">
                    RELOADING...
                </div>
                
                <div id="statusIndicator" class="status-indicator" style="display: none;">
                    <span id="statusText">ELIMINATED</span>
                </div>
            </div>
        `;
        
        // Add to page
        const container = document.createElement('div');
        container.innerHTML = settingsHTML + hudHTML;
        document.body.appendChild(container);
        
        // Setup settings listeners
        this.setupSettingsListeners();
        
        // Store visual elements
        this.visualElements = {
            killCount: document.getElementById('killCount'),
            winCount: document.getElementById('winCount'),
            specialAmmoCount: document.getElementById('specialAmmoCount'),
            specialAmmoDisplay: document.getElementById('specialAmmoDisplay'),
            reloadIndicator: document.getElementById('reloadIndicator'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText')
        };
    }
    
    // Setup settings panel listeners
    setupSettingsListeners() {
        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            document.getElementById('settingsPanel').style.display = 'flex';
            this.vibrate('short');
        });
        
        // Close settings
        document.getElementById('closeSettings').addEventListener('click', () => {
            document.getElementById('settingsPanel').style.display = 'none';
            this.saveSettings();
            this.vibrate('short');
        });
        
        // Sensitivity slider
        document.getElementById('sensitivitySlider').addEventListener('input', (e) => {
            this.settings.sensitivity = parseFloat(e.target.value);
            document.getElementById('sensitivityValue').textContent = `${this.settings.sensitivity}x`;
        });
        
        // Dead zone slider
        document.getElementById('deadZoneSlider').addEventListener('input', (e) => {
            this.settings.deadZone = parseFloat(e.target.value);
            document.getElementById('deadZoneValue').textContent = `${Math.round(this.settings.deadZone * 100)}%`;
            
            // Update joystick dead zone if it exists
            if (this.joystick) {
                // Recreate joystick with new dead zone
                this.setupJoystick();
            }
        });
        
        // Haptic toggle
        document.getElementById('hapticToggle').addEventListener('change', (e) => {
            this.settings.hapticEnabled = e.target.checked;
            if (e.target.checked) {
                this.vibrate('short');
            }
        });
        
        // Auto-fire toggle
        document.getElementById('autoFireToggle').addEventListener('change', (e) => {
            this.settings.autoFire = e.target.checked;
            if (e.target.checked) {
                this.startAutoFire();
            } else {
                this.stopAutoFire();
            }
            this.vibrate('short');
        });
    }
    
    // Setup enhanced controls
    setupControls() {
        this.setupJoystick();
        this.setupButtons();
    }
    
    // Setup joystick with sensitivity and dead zone
    setupJoystick() {
        const joystickContainer = document.getElementById('joystickContainer');
        if (!joystickContainer) return;
        
        // Clear existing joystick
        joystickContainer.innerHTML = '';
        
        // Create new joystick with settings
        this.joystick = nipplejs.create({
            zone: joystickContainer,
            mode: 'static',
            position: { left: '100px', bottom: '100px' },
            color: 'white',
            size: 150,
            threshold: this.settings.deadZone, // Use dead zone setting
            multitouch: false
        });
        
        this.joystick.on('move', (evt, data) => {
            const force = Math.min(data.force * this.settings.sensitivity, 1);
            const angle = data.angle.radian;
            
            // Calculate movement with sensitivity
            const moveX = Math.cos(angle) * force;
            const moveY = Math.sin(angle) * force;
            
            // Reset movement
            this.currentInput.forward = false;
            this.currentInput.backward = false;
            this.currentInput.left = false;
            this.currentInput.right = false;
            
            // Apply movement based on angle and force
            if (force > this.settings.deadZone) {
                if (moveY > 0.3) this.currentInput.forward = true;
                if (moveY < -0.3) this.currentInput.backward = true;
                if (moveX > 0.3) this.currentInput.right = true;
                if (moveX < -0.3) this.currentInput.left = true;
                
                // Haptic feedback for movement start
                if (!this.previousInput.forward && !this.previousInput.backward && 
                    !this.previousInput.left && !this.previousInput.right) {
                    this.vibrate('short');
                }
            }
        });
        
        this.joystick.on('end', () => {
            this.currentInput.forward = false;
            this.currentInput.backward = false;
            this.currentInput.left = false;
            this.currentInput.right = false;
        });
    }
    
    // Setup action buttons with visual feedback
    setupButtons() {
        const shootBtn = document.getElementById('shootBtn');
        const specialBtn = document.getElementById('specialBtn');
        
        if (shootBtn) {
            // Enhanced shoot button
            shootBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!this.settings.autoFire) {
                    this.currentInput.shoot = true;
                    shootBtn.classList.add('pressed');
                    this.vibrate('short');
                }
            });
            
            shootBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (!this.settings.autoFire) {
                    this.currentInput.shoot = false;
                    shootBtn.classList.remove('pressed');
                }
            });
        }
        
        if (specialBtn) {
            // Enhanced special button
            specialBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.tankState.specialAmmo > 0) {
                    this.currentInput.special = true;
                    specialBtn.classList.add('pressed');
                    this.vibrate('medium');
                }
            });
            
            specialBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.currentInput.special = false;
                specialBtn.classList.remove('pressed');
            });
        }
    }
    
    // Auto-fire management
    startAutoFire() {
        if (this.autoFireInterval) return;
        
        this.autoFireInterval = setInterval(() => {
            if (this.tankState.reloadTime <= 0) {
                this.currentInput.shoot = true;
                setTimeout(() => {
                    this.currentInput.shoot = false;
                }, 50);
            }
        }, 100);
    }
    
    stopAutoFire() {
        if (this.autoFireInterval) {
            clearInterval(this.autoFireInterval);
            this.autoFireInterval = null;
        }
        this.currentInput.shoot = false;
    }
    
    // Optimized input loop
    startInputLoop() {
        const sendInput = () => {
            const now = Date.now();
            
            // Only send if enough time has passed and input changed
            if (now - this.lastSendTime >= this.settings.sendRate) {
                if (this.hasInputChanged() || this.currentInput.shoot) {
                    this.sendInput();
                    this.lastSendTime = now;
                }
            }
            
            this.previousInput = { ...this.currentInput };
            requestAnimationFrame(sendInput);
        };
        
        requestAnimationFrame(sendInput);
    }
    
    // Check if input has changed
    hasInputChanged() {
        return Object.keys(this.currentInput).some(key => 
            this.currentInput[key] !== this.previousInput[key]
        );
    }
    
    // Send input to server
    sendInput() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        
        this.ws.send(JSON.stringify({
            type: 'PLAYER_INPUT',
            input: this.currentInput
        }));
    }
    
    // WebSocket connection
    connectWebSocket() {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsPort = window.location.hostname === 'localhost' ? ':8081' : '';
        const wsUrl = `${wsProtocol}//${window.location.hostname}${wsPort}`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            // Register as controller
            this.ws.send(JSON.stringify({
                type: 'REGISTER_CONTROLLER',
                roomCode: this.roomCode,
                playerId: this.playerId
            }));
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleServerMessage(data);
        };
        
        this.ws.onclose = () => {
            setTimeout(() => this.connectWebSocket(), 2000);
        };
    }
    
    // Handle server messages
    handleServerMessage(data) {
        switch (data.type) {
            case 'GAME_STATE':
                this.updateTankState(data.gameState);
                break;
            case 'TANK_HIT':
                this.vibrate('hit');
                break;
            case 'TANK_DESTROYED':
                this.vibrate('destroy');
                break;
            case 'POWERUP_COLLECTED':
                this.vibrate('powerup');
                break;
            case 'TOOK_DAMAGE':
                this.vibrate('damage');
                break;
        }
    }
    
    // Update tank state and HUD
    updateTankState(gameState) {
        if (!gameState || !gameState.tanks) return;
        
        // Find our tank
        const ourTank = gameState.tanks.find(t => t.id === this.playerId);
        if (!ourTank) return;
        
        // Update state
        const prevHealth = this.tankState.health;
        this.tankState = {
            health: ourTank.health || 100,
            ammo: ourTank.ammo || 100,
            specialAmmo: ourTank.specialAmmo || 0,
            reloadTime: ourTank.reloadTime || 0
        };
        
        // Update HUD
        this.updateHUD();
        
        // Vibrate on damage
        if (this.tankState.health < prevHealth) {
            this.vibrate('damage');
        }
    }
    
    // Update HUD elements for Tank Trouble
    updateHUD() {
        // Update kills and wins
        if (this.visualElements.killCount && this.tankState.kills !== undefined) {
            this.visualElements.killCount.textContent = this.tankState.kills;
        }
        
        if (this.visualElements.winCount && this.tankState.wins !== undefined) {
            this.visualElements.winCount.textContent = this.tankState.wins;
        }
        
        // Special ammo (power-ups)
        if (this.visualElements.specialAmmoDisplay) {
            if (this.tankState.specialAmmo > 0) {
                this.visualElements.specialAmmoDisplay.style.display = 'block';
                this.visualElements.specialAmmoCount.textContent = this.tankState.specialAmmo;
            } else {
                this.visualElements.specialAmmoDisplay.style.display = 'none';
            }
        }
        
        // Reload indicator
        if (this.visualElements.reloadIndicator) {
            this.visualElements.reloadIndicator.style.display = 
                this.tankState.reloadTime > 0 ? 'block' : 'none';
        }
        
        // Status indicator (alive/eliminated)
        if (this.visualElements.statusIndicator) {
            if (this.tankState.alive === false) {
                this.visualElements.statusIndicator.style.display = 'block';
                this.visualElements.statusText.textContent = 'ELIMINATED';
                // Disable controls when eliminated
                this.gameActive = false;
            } else {
                this.visualElements.statusIndicator.style.display = 'none';
                this.gameActive = true;
            }
        }
    }
}

// Initialize enhanced controller
if (typeof window !== 'undefined') {
    window.EnhancedController = EnhancedController;
}