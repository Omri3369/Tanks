/**
 * Multiplayer Game Engine
 * Integrates the existing Tank Trouble game with room-based multiplayer
 */

class MultiplayerGameEngine {
    constructor() {
        this.isMultiplayer = false;
        this.roomCode = null;
        this.playerIds = new Map(); // Maps player IDs to tank indices
        this.localPlayerInputs = new Map(); // Maps player IDs to input states
        this.gameState = null;
        this.ws = null;
        this.isPresenter = false;
        this.isController = false;
        this.syncInterval = null;
        this.lastSyncTime = 0;
        this.SYNC_RATE = 1000 / 15; // 15 FPS sync rate (reduced from 20 for better performance)
        
        this.bindToExistingGame();
    }
    
    bindToExistingGame() {
        // Store reference to existing game variables
        this.gameVars = {
            get tanks() { return window.tanks || []; },
            get bullets() { return window.bullets || []; },
            get walls() { return window.walls || []; },
            get powerUps() { return window.powerUps || []; },
            get particles() { return window.particles || []; },
            get explosions() { return window.explosions || []; },
            get scores() { return window.scores || {}; },
            get kills() { return window.kills || {}; },
            get gameRunning() { return window.gameRunning || false; },
            set gameRunning(value) { window.gameRunning = value; }
        };
    }
    
    initializeMultiplayerGame(settings) {
        this.isMultiplayer = true;
        this.roomCode = settings.roomCode;
        this.players = settings.players;
        this.gameSettings = settings.gameSettings; // Store game settings for later use
        
        console.log('Initializing multiplayer game with settings:', settings);
        
        // Set up player mappings
        this.setupPlayerMappings();
        
        // Initialize game with room settings
        this.applyGameSettings(settings.gameSettings);
        
        // Set up input handling
        this.setupInputHandling();
        
        // Don't initialize tanks here - wait for startGame()
        // this.initializeMultiplayerTanks();
        
        return true;
    }
    
    setupPlayerMappings() {
        this.playerIds.clear();
        this.players.forEach((player, index) => {
            this.playerIds.set(player.id, index);
        });
    }
    
    applyGameSettings(gameSettings) {
        // Apply room game settings to the existing game
        if (gameSettings.mapSize && window.setMapSize) {
            window.setMapSize(gameSettings.mapSize);
        }
        
        if (typeof window.gameMode !== 'undefined') {
            window.gameMode = gameSettings.gameMode || 0;
        }
        
        if (typeof window.CONFIG !== 'undefined' && gameSettings.aiCount) {
            window.CONFIG.AI_TANK_COUNT = gameSettings.aiCount;
        }
        
        // Apply other settings
        if (typeof window.CONFIG !== 'undefined') {
            window.CONFIG.FRIENDLY_FIRE_ENABLED = gameSettings.friendlyFire || false;
            // Disable some power-ups if not enabled
            if (!gameSettings.powerUpsEnabled) {
                Object.keys(window.CONFIG.POWERUP_TYPES).forEach(key => {
                    window.CONFIG.POWERUP_TYPES[key].enabled = false;
                });
            }
        }
    }
    
    setupInputHandling() {
        if (this.isPresenter) {
            // Presenter receives input from controllers
            this.setupPresenterInputHandling();
        } else if (this.isController) {
            // Controller sends input to presenter
            this.setupControllerInputHandling();
        }
    }
    
    setupPresenterInputHandling() {
        console.log('Setting up presenter input handling...');
        console.log('inputHandler available:', !!window.inputHandler);
        
        // Override existing input handler to use multiplayer inputs
        if (window.inputHandler) {
            const originalHandleTankInput = window.inputHandler.handleTankInput.bind(window.inputHandler);
            
            window.inputHandler.handleTankInput = (tank) => {
                if (!tank) return;
                
                // Check AI tanks first - they should use AI behavior regardless of multiplayer status
                if (tank.isAI) {
                    // Use original AI input handling
                    originalHandleTankInput(tank);
                } else if (tank.isMultiplayer || tank.playerId) {
                    // For multiplayer tanks, use network inputs
                    const playerId = this.getPlayerIdForTank(tank);
                    if (playerId && this.localPlayerInputs.has(playerId)) {
                        const input = this.localPlayerInputs.get(playerId);
                        this.applyInputToTank(tank, input);
                    } else {
                        // console.log(`No input found for tank ${tank.playerName}, playerId: ${playerId}`);
                    }
                } else {
                    // Regular local tank
                    originalHandleTankInput(tank);
                }
            };
            
        } else {
            console.error('No inputHandler found to override!');
        }
    }
    
    setupControllerInputHandling() {
        // Controllers don't need to handle input directly - they send to server
    }
    
    initializeMultiplayerTanks() {
        console.log('Initializing multiplayer tanks...');
        console.log('Players to create:', this.players);
        console.log('Tank class available:', !!window.Tank);
        
        // Check if Tank class is available
        if (!window.Tank) {
            console.error('Tank class not available! Cannot create tanks.');
            return;
        }
        
        // Reset spawn positions for new multiplayer game
        if (typeof window.resetSpawnPositions === 'function') {
            window.resetSpawnPositions();
        }
        
        // Use the global tanks array from game state
        if (!window.tanks) {
            window.tanks = [];
        }
        
        // Clear existing tanks completely
        window.tanks.length = 0;
        
        // Sync with gameState
        if (window.gameState) {
            window.gameState.tanks = window.tanks;
        }
        
        // Create tanks for each player
        this.players.forEach((player, index) => {
            try {
                const spawnPoint = this.getSpawnPoint(index);
                console.log(`Creating tank for ${player.name} at (${spawnPoint.x}, ${spawnPoint.y})`);
                
                const tank = new window.Tank(
                    spawnPoint.x,
                    spawnPoint.y,
                    player.color,
                    {}, // Empty controls object - handled by multiplayer system
                    index + 1,
                    this.getSecondaryColor(player.color)
                );
                
                tank.playerId = player.id;
                tank.playerName = player.name;
                tank.isAI = false;
                tank.isMultiplayer = true;
                
                window.tanks.push(tank);
                console.log(`Tank created for ${player.name}, total tanks: ${window.tanks.length}`);
            } catch (error) {
                console.error(`Failed to create tank for player ${player.name}:`, error);
            }
        });
        
        // Add AI tanks if specified
        const aiCount = this.gameSettings?.aiCount || window.CONFIG?.AI_TANK_COUNT || 0;
        console.log('Adding AI tanks:', aiCount);
        for (let i = 0; i < aiCount; i++) {
            try {
                const spawnPoint = this.getSpawnPoint(this.players.length + i);
                const aiTank = new window.Tank(
                    spawnPoint.x,
                    spawnPoint.y,
                    this.getAIColor(i),
                    {},
                    this.players.length + i + 1
                );
                
                aiTank.isAI = true;
                aiTank.playerName = `AI ${i + 1}`;
                
                window.tanks.push(aiTank);
                console.log(`AI tank ${i + 1} created, total tanks: ${window.tanks.length}`);
            } catch (error) {
                console.error(`Failed to create AI tank ${i + 1}:`, error);
            }
        }
        
        // Final sync with gameState
        if (window.gameState) {
            window.gameState.tanks = window.tanks;
            console.log('Synced tanks with gameState');
        }
        
        console.log('Tank initialization complete. Total tanks:', window.tanks.length);
        console.log('Tanks array:', window.tanks);
        if (window.gameState) {
            console.log('GameState tanks:', window.gameState.tanks.length);
        }
    }
    
    getSpawnPoint(index) {
        // Use the game's safe spawn position generator for random, valid positions
        if (typeof window.generateSafeSpawnPosition === 'function') {
            return window.generateSafeSpawnPosition();
        }
        
        // Fallback to semi-random positions if function not available
        const mapWidth = window.canvas ? window.canvas.width : 1200;
        const mapHeight = window.canvas ? window.canvas.height : 800;
        const margin = 150;
        
        // Add some randomness to the spawn positions
        const basePositions = [
            { x: margin, y: margin },
            { x: mapWidth - margin, y: margin },
            { x: margin, y: mapHeight - margin },
            { x: mapWidth - margin, y: mapHeight - margin },
            { x: mapWidth / 2, y: margin },
            { x: mapWidth / 2, y: mapHeight - margin },
            { x: margin, y: mapHeight / 2 },
            { x: mapWidth - margin, y: mapHeight / 2 }
        ];
        
        const basePos = basePositions[index % basePositions.length];
        // Add random offset to make positions less predictable
        const randomOffset = 50;
        return {
            x: basePos.x + (Math.random() - 0.5) * randomOffset * 2,
            y: basePos.y + (Math.random() - 0.5) * randomOffset * 2
        };
    }
    
    getSecondaryColor(primaryColor) {
        // Generate darker version of primary color
        const hex = primaryColor.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    getAIColor(index) {
        const aiColors = ['#666666', '#888888', '#AAAAAA', '#CCCCCC'];
        return aiColors[index % aiColors.length];
    }
    
    connectWebSocket(ws, role) {
        this.ws = ws;
        this.isPresenter = (role === 'presenter');
        this.isController = (role === 'controller');
        
        if (this.isPresenter) {
            this.startGameStateSync();
        }
    }
    
    handlePlayerInput(playerId, input) {
        // Store input for this player
        this.localPlayerInputs.set(playerId, input);
        
        // Log when we get non-zero input
        if (input.forward || input.backward || input.left || input.right || input.shoot) {
            console.log(`Received input from ${playerId}:`, input);
            console.log('Stored inputs:', this.localPlayerInputs.size);
        }
    }
    
    applyInputToTank(tank, input) {
        if (!tank || !input) return;
        
        // Reset movement
        tank.speed = 0;
        tank.turnSpeed = 0;
        
        // Apply movement input
        if (input.forward) {
            tank.speed = window.TANK_SPEED || 3;
            // console.log(`Tank ${tank.playerName} moving forward at speed ${tank.speed}`);
        }
        if (input.backward) {
            tank.speed = -(window.TANK_SPEED || 3) * 0.7;
            // console.log(`Tank ${tank.playerName} moving backward at speed ${tank.speed}`);
        }
        if (input.left) {
            tank.turnSpeed = -(window.TANK_TURN_SPEED || 0.05);
            // console.log(`Tank ${tank.playerName} turning left`);
        }
        if (input.right) {
            tank.turnSpeed = (window.TANK_TURN_SPEED || 0.05);
            // console.log(`Tank ${tank.playerName} turning right`);
        }
        
        // Handle shooting
        if (input.shoot && tank.reloadTime <= 0) {
            this.shootBullet(tank);
            tank.reloadTime = window.CONFIG ? window.CONFIG.TANK_RELOAD_TIME : 20;
        }
        
        // Handle special attacks
        if (input.special && tank.specialAmmo > 0) {
            this.useSpecialWeapon(tank);
            tank.specialAmmo--;
        }
    }
    
    shootBullet(tank) {
        if (!window.bullets) window.bullets = [];
        
        const bulletX = tank.x + Math.cos(tank.angle) * (window.TANK_SIZE || 30);
        const bulletY = tank.y + Math.sin(tank.angle) * (window.TANK_SIZE || 30);
        
        if (window.Bullet) {
            const bullet = new window.Bullet(bulletX, bulletY, tank.angle, tank, tank.powerUp);
            window.bullets.push(bullet);
        }
    }
    
    useSpecialWeapon(tank) {
        if (tank.powerUp && window.weaponSystem) {
            const bullets = window.weaponSystem.createBullets(
                tank.x, tank.y, tank.angle, tank, tank.powerUp, tank
            );
            if (bullets && window.bullets) {
                window.bullets.push(...bullets);
            }
        }
    }
    
    getPlayerIdForTank(tank) {
        const id = tank.playerId || null;
        // console.log(`Getting player ID for tank ${tank.playerName}: ${id}`);
        return id;
    }
    
    startGameStateSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(() => {
            this.syncGameState();
        }, this.SYNC_RATE);
    }
    
    stopGameStateSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
    
    syncGameState() {
        if (!this.ws || !this.isPresenter || !this.gameVars.gameRunning) return;
        
        const now = performance.now();
        if (now - this.lastSyncTime < this.SYNC_RATE) return;
        
        // Check for round end conditions in multiplayer
        this.checkMultiplayerRoundEnd();
        
        const gameState = this.serializeGameState();
        
        this.ws.send(JSON.stringify({
            type: 'GAME_STATE',
            gameState: gameState
        }));
        
        this.lastSyncTime = now;
    }
    
    checkMultiplayerRoundEnd() {
        // Skip if already resetting
        if (window.roundResetting) return;
        
        const aliveTanks = this.gameVars.tanks.filter(t => t.alive && !t.isAI);
        const aliveAITanks = this.gameVars.tanks.filter(t => t.alive && t.isAI);
        
        // Check if all human players are dead
        if (aliveTanks.length === 0 && this.gameVars.tanks.some(t => !t.isAI)) {
            console.log('All human players eliminated - restarting round');
            this.handleRoundEnd(null); // No winner
        }
        // Check if only one human player remains (and no AI or AI are all dead)
        else if (aliveTanks.length === 1 && aliveAITanks.length === 0) {
            console.log('Round winner:', aliveTanks[0].playerName);
            this.handleRoundEnd(aliveTanks[0]);
        }
    }
    
    handleRoundEnd(winner) {
        if (window.roundResetting) return;
        window.roundResetting = true;
        
        // Update scores if there's a winner
        if (winner) {
            if (!window.scores[`player${winner.playerNum}`]) {
                window.scores[`player${winner.playerNum}`] = 0;
            }
            window.scores[`player${winner.playerNum}`]++;
            
            // Store winner for display
            window.gameWinner = winner;
            
            // Start zoom effect if function exists
            if (window.startWinnerZoom) {
                window.startWinnerZoom(winner);
            }
        }
        
        // Send round end message to all clients
        if (this.ws) {
            this.ws.send(JSON.stringify({
                type: 'ROUND_END',
                winner: winner ? {
                    id: winner.playerId,
                    name: winner.playerName,
                    color: winner.color
                } : null
            }));
        }
        
        // Reset round after delay
        setTimeout(() => {
            this.resetMultiplayerRound();
        }, winner ? 3000 : 2000);
    }
    
    resetMultiplayerRound() {
        console.log('Resetting multiplayer round...');
        
        // Reset camera if function exists
        if (window.resetCamera) {
            window.resetCamera();
        }
        
        // Clear projectiles and effects
        window.bullets = [];
        window.particles = [];
        window.explosions = [];
        if (window.mines) window.mines = [];
        if (window.drones) window.drones = [];
        
        // Reset grace timer
        window.graceTimer = 180;
        
        // Respawn all tanks
        this.respawnMultiplayerTanks();
        
        // Reset round flags
        window.roundResetting = false;
        window.gameWinner = null;
        window.roundStartTime = Date.now();
        
        console.log('Multiplayer round reset complete');
    }
    
    respawnMultiplayerTanks() {
        // Respawn all multiplayer tanks
        this.gameVars.tanks.forEach(tank => {
            const spawnPoint = this.getSpawnPoint(tank.playerNum - 1);
            tank.x = spawnPoint.x;
            tank.y = spawnPoint.y;
            tank.angle = Math.random() * Math.PI * 2;
            tank.alive = true;
            tank.health = tank.maxHealth || 100;
            tank.powerUp = null;
            tank.specialAmmo = 0;
            tank.frozen = false;
            tank.frozenTime = 0;
            tank.speed = 0;
            tank.turnSpeed = 0;
            tank.reloadTime = 0;
            
            console.log(`Respawned tank ${tank.playerName} at (${tank.x}, ${tank.y})`);
        });
        
        // Respawn powerups
        if (window.powerUps) {
            window.powerUps = [];
            for (let i = 0; i < 3; i++) {
                if (window.generateSafeItemPosition && window.PowerUp) {
                    const pos = window.generateSafeItemPosition();
                    window.powerUps.push(new window.PowerUp(pos.x, pos.y));
                }
            }
        }
    }
    
    serializeGameState() {
        return {
            tanks: this.gameVars.tanks.map(tank => ({
                id: tank.playerId || tank.playerName,
                x: tank.x,
                y: tank.y,
                angle: tank.angle,
                color: tank.color,
                playerName: tank.playerName,
                health: tank.health,
                alive: tank.alive,
                powerUp: tank.powerUp,
                specialAmmo: tank.specialAmmo
            })),
            bullets: this.gameVars.bullets.map(bullet => ({
                x: bullet.x,
                y: bullet.y,
                angle: bullet.angle,
                type: bullet.type,
                owner: bullet.owner ? (bullet.owner.playerId || bullet.owner.playerName || null) : null
            })),
            powerUps: this.gameVars.powerUps.map(powerUp => ({
                x: powerUp.x,
                y: powerUp.y,
                type: powerUp.type,
                visible: powerUp.visible
            })),
            scores: this.generateScores(),
            roundNumber: window.roundNumber || 1,
            timeRemaining: this.calculateTimeRemaining(),
            gameRunning: this.gameVars.gameRunning
        };
    }
    
    generateScores() {
        const scores = {};
        this.gameVars.tanks.forEach(tank => {
            if (tank.playerId) {
                scores[tank.playerId] = {
                    score: window.scores[`player${tank.playerNum}`] || window.scores[tank.playerName] || 0,
                    kills: window.kills[`player${tank.playerNum}`] || window.kills[tank.playerName] || 0,
                    alive: tank.alive,
                    health: tank.health || 100,
                    powerUp: tank.powerUp || null,
                    specialAmmo: tank.specialAmmo || 0
                };
            }
        });
        return scores;
    }
    
    calculateTimeRemaining() {
        // Calculate time remaining based on round system
        if (window.roundStartTime) {
            const elapsed = Date.now() - window.roundStartTime;
            const roundDuration = 180000; // 3 minutes default
            return Math.max(0, Math.floor((roundDuration - elapsed) / 1000));
        }
        return 0;
    }
    
    startGame() {
        if (!this.isMultiplayer) return false;
        
        console.log('Starting multiplayer game...');
        console.log('Tank class available at start:', !!window.Tank);
        console.log('Canvas available:', !!window.canvas);
        console.log('Players:', this.players);
        
        // Check prerequisites
        if (!window.Tank) {
            console.error('Tank class not available! Game cannot start.');
            return false;
        }
        
        // Set game mode to Battle Royale or standard multiplayer
        window.gameMode = 1; // Battle Royale mode (or whatever mode is best for multiplayer)
        
        // IMPORTANT: Don't call init() as it resets game state
        // Instead, manually do what init() needs to do without resetting tanks
        
        // Initialize gameState if not already initialized
        if (!window.gameState) {
            console.log('GameState not found, creating new instance');
            if (window.GameState) {
                window.gameState = new window.GameState();
            }
        }
        
        // Initialize game systems that need initialization
        if (window.aiSystem) {
            window.aiSystem.initialize(window.CONFIG, window.gameState);
        }
        
        // Initialize inputHandler if not already initialized
        if (!window.inputHandler) {
            console.log('InputHandler not found, trying to initialize from InputHandler class');
            if (window.InputHandler) {
                window.inputHandler = new window.InputHandler();
                window.inputHandler.initialize(window.CONFIG);
            }
        } else if (window.inputHandler && window.inputHandler.initialize) {
            window.inputHandler.initialize(window.CONFIG);
        }
        
        // Now setup input handling after inputHandler is initialized
        if (window.inputHandler) {
            this.setupInputHandling();
        } else {
            console.error('Failed to initialize inputHandler!');
        }
        
        // Generate terrain
        if (window.generateTerrainTiles) {
            window.generateTerrainTiles();
        }
        
        // Clear only bullets and effects, not tanks
        window.bullets = [];
        window.particles = [];
        window.powerUps = [];
        window.drones = [];
        window.targets = [];
        window.graceTimer = 180;
        
        // Initialize ring of fire
        if (window.RingOfFire) {
            window.ringOfFire = new window.RingOfFire();
        }
        
        // NOW initialize our multiplayer tanks
        this.initializeMultiplayerTanks();
        
        // Re-setup input handling AFTER tanks are created
        this.setupInputHandling();
        
        // Add some initial powerups
        for (let i = 0; i < 2; i++) {
            if (window.generateSafeItemPosition && window.PowerUp) {
                const powerUpPos = window.generateSafeItemPosition();
                window.powerUps.push(new window.PowerUp(powerUpPos.x, powerUpPos.y));
            }
        }
        
        // Create scoreboard - comment out for now as it might be causing issues
        // if (window.scoreManager && window.scoreManager.createScoreBoard) {
        //     window.scoreManager.createScoreBoard(window.tanks);
        // }
        
        // Start game running
        this.gameVars.gameRunning = true;
        window.gameRunning = true;
        window.roundStartTime = Date.now();
        
        // Start the game loop
        console.log('Starting game loop...');
        console.log('legacyGameLoop available:', typeof window.legacyGameLoop);
        console.log('gameLoop available:', typeof window.gameLoop);
        
        if (window.legacyGameLoop) {
            console.log('Starting legacyGameLoop');
            window.legacyGameLoop();
        } else if (window.gameLoop) {
            if (typeof window.gameLoop === 'function') {
                console.log('Starting gameLoop function');
                window.gameLoop();
            } else if (window.gameLoop.start) {
                console.log('Starting gameLoop.start');
                window.gameLoop.start();
            }
        } else {
            console.error('No game loop available!');
        }
        
        console.log('Multiplayer game started successfully');
        console.log('Total tanks in game:', window.tanks ? window.tanks.length : 0);
        console.log('GameState exists:', !!window.gameState);
        console.log('GameState.tanks property:', window.gameState ? window.gameState.tanks : 'N/A');
        console.log('GameState tanks count:', window.gameState && window.gameState.tanks ? window.gameState.tanks.length : 0);
        console.log('Game running:', window.gameRunning);
        console.log('Canvas:', window.canvas);
        console.log('Context:', window.ctx);
        return true;
    }
    
    endGame() {
        this.gameVars.gameRunning = false;
        this.stopGameStateSync();
        
        if (window.gameLoop && window.gameLoop.stop) {
            window.gameLoop.stop();
        }
    }
    
    cleanup() {
        this.stopGameStateSync();
        this.localPlayerInputs.clear();
        this.playerIds.clear();
        this.isMultiplayer = false;
        this.ws = null;
    }
}

// Create global multiplayer engine instance
if (typeof window !== 'undefined') {
    window.multiplayerEngine = new MultiplayerGameEngine();
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiplayerGameEngine;
}