class GameInitializer {
    constructor(gameState, roundManager, scoreManager) {
        this.gameState = gameState;
        this.roundManager = roundManager;
        this.scoreManager = scoreManager;
    }
    
    init() {
        // Reset game state
        this.gameState.reset();
        
        // Set grace period (3 seconds at 60fps)
        this.gameState.graceTimer = 180;
        
        // Initialize ring of fire
        this.gameState.ringOfFire = new RingOfFire();
        
        // Initialize game systems
        if (typeof aiSystem !== 'undefined') {
            aiSystem.initialize(CONFIG, this.gameState);
        }
        if (typeof inputHandler !== 'undefined') {
            inputHandler.initialize(CONFIG);
        }
        
        // Set up remote input handler
        this.setupRemoteHandler();
        
        // Generate terrain for battlefield
        if (typeof generateTerrainTiles !== 'undefined') {
            generateTerrainTiles();
        }
        
        // Initialize based on game mode
        this.initializeByGameMode();
        
        // Initialize score manager
        if (this.scoreManager) {
            this.scoreManager.reset();
        }
    }
    
    setupRemoteHandler() {
        // Set the shared remote input handler
        if (typeof inputHandler !== 'undefined' && inputHandler.remoteHandler && typeof remoteInputHandler !== 'undefined') {
            // Replace with our global instance that can send color updates
            inputHandler.remoteHandler = remoteInputHandler;
        }
        if (typeof remoteInputHandler !== 'undefined') {
            remoteInputHandler.connect();
        }
    }
    
    initializeByGameMode() {
        switch (this.gameState.gameMode) {
            case 0:
                this.initializeTrainingMode();
                break;
            case 1:
                this.initializeSinglePlayerMode();
                break;
            case 2:
                this.initializeMultiPlayerMode();
                break;
            default:
                this.initializeTrainingMode();
        }
    }
    
    initializeTrainingMode() {
        // Training mode - only player 1, no AI or other players
        
        // Generate random spawn position for player 1
        const player1Pos = this.generateSafeSpawnPosition();
        const player1Tank = new Tank(player1Pos.x, player1Pos.y, PLAYER1_COLOR, {
            up: 'ArrowUp',
            down: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            shoot: 'm'
        }, 1, PLAYER1_SECONDARY_COLOR);
        this.gameState.addTank(player1Tank);
        
        // Send player 1 color to controller
        if (typeof remoteInputHandler !== 'undefined') {
            remoteInputHandler.sendPlayerColorUpdate(1, PLAYER1_COLOR);
        }
        
        // Add targets for practice
        this.addTrainingTargets(player1Pos);
    }
    
    initializeSinglePlayerMode() {
        // Add player 1
        const player1Pos = this.generateSafeSpawnPosition();
        const player1Tank = new Tank(player1Pos.x, player1Pos.y, PLAYER1_COLOR, {
            up: 'ArrowUp',
            down: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            shoot: 'm'
        }, 1, PLAYER1_SECONDARY_COLOR);
        this.gameState.addTank(player1Tank);
        
        // Send player 1 color to controller
        if (typeof remoteInputHandler !== 'undefined') {
            remoteInputHandler.sendPlayerColorUpdate(1, PLAYER1_COLOR);
        }
        
        // Add AI tanks
        this.addAITanks();
    }
    
    initializeMultiPlayerMode() {
        // Add player 1
        const player1Pos = this.generateSafeSpawnPosition();
        const player1Tank = new Tank(player1Pos.x, player1Pos.y, PLAYER1_COLOR, {
            up: 'ArrowUp',
            down: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            shoot: 'm'
        }, 1, PLAYER1_SECONDARY_COLOR);
        this.gameState.addTank(player1Tank);
        
        // Add player 2
        const player2Pos = this.generateSafeSpawnPosition();
        const player2Tank = new Tank(player2Pos.x, player2Pos.y, PLAYER2_COLOR, {
            up: 'w',
            down: 's',
            left: 'a',
            right: 'd',
            shoot: 'q'
        }, 2, PLAYER2_SECONDARY_COLOR);
        this.gameState.addTank(player2Tank);
        
        // Send player colors to controllers
        if (typeof remoteInputHandler !== 'undefined') {
            remoteInputHandler.sendPlayerColorUpdate(1, PLAYER1_COLOR);
            remoteInputHandler.sendPlayerColorUpdate(2, PLAYER2_COLOR);
        }
    }
    
    addTrainingTargets(playerPos) {
        // Add stationary targets
        for (let i = 0; i < CONFIG.TRAINING_STATIONARY_TARGETS; i++) {
            let validPosition = false;
            let x, y;
            let attempts = 0;
            const maxAttempts = 50;
            
            while (!validPosition && attempts < maxAttempts) {
                x = Math.random() * (canvas.width - 200) + 100;
                y = Math.random() * (canvas.height - 200) + 100;
                
                // Make sure target doesn't spawn too close to player
                const distanceToPlayer = Math.sqrt(
                    Math.pow(x - playerPos.x, 2) + Math.pow(y - playerPos.y, 2)
                );
                
                if (distanceToPlayer > 150) {
                    const testTarget = new Target(x, y, 'stationary');
                    validPosition = !testTarget.checkWallCollision(x, y);
                }
                attempts++;
            }
            
            if (validPosition) {
                this.gameState.addTarget(new Target(x, y, 'stationary'));
            }
        }
        
        // Add moving targets
        for (let i = 0; i < CONFIG.TRAINING_MOVING_TARGETS; i++) {
            let validPosition = false;
            let x, y;
            let attempts = 0;
            const maxAttempts = 50;
            
            while (!validPosition && attempts < maxAttempts) {
                x = Math.random() * (canvas.width - 300) + 150;
                y = Math.random() * (canvas.height - 300) + 150;
                
                // Make sure target doesn't spawn too close to player
                const distanceToPlayer = Math.sqrt(
                    Math.pow(x - playerPos.x, 2) + Math.pow(y - playerPos.y, 2)
                );
                
                if (distanceToPlayer > 200) {
                    const testTarget = new Target(x, y, 'moving');
                    validPosition = !testTarget.checkWallCollision(x, y);
                }
                attempts++;
            }
            
            if (validPosition) {
                this.gameState.addTarget(new Target(x, y, 'moving'));
            }
        }
    }
    
    addAITanks() {
        const aiColors = ['#ff9800', '#9c27b0', '#f44336', '#e91e63', '#2196f3', '#ff5722', '#795548'];
        
        for (let i = 0; i < CONFIG.AI_TANK_COUNT; i++) {
            const aiPos = this.generateSafeSpawnPosition();
            const aiTank = new Tank(aiPos.x, aiPos.y, aiColors[i % aiColors.length], {}, i + 2);
            aiTank.isAI = true;
            this.gameState.addTank(aiTank);
        }
    }
    
    generateSafeSpawnPosition() {
        // Use global function if available
        if (typeof generateSafeSpawnPosition !== 'undefined') {
            return generateSafeSpawnPosition();
        }
        
        // Fallback safe spawn logic
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            const x = 100 + Math.random() * (canvas.width - 200);
            const y = 100 + Math.random() * (canvas.height - 200);
            
            let validPosition = true;
            
            // Check distance from other tanks
            for (let tank of this.gameState.tanks) {
                const distance = Math.sqrt(Math.pow(x - tank.x, 2) + Math.pow(y - tank.y, 2));
                if (distance < (CONFIG.SPAWN_MIN_DISTANCE || 200)) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                return { x, y };
            }
            
            attempts++;
        }
        
        // Fallback to center if no safe position found
        return { x: canvas.width / 2, y: canvas.height / 2 };
    }
    
    addInitialPowerUps() {
        const powerUpCount = CONFIG.POWERUP_COUNT || 2;
        for (let i = 0; i < powerUpCount; i++) {
            const powerUpPos = this.generateSafeItemPosition();
            this.gameState.addPowerUp(new PowerUp(powerUpPos.x, powerUpPos.y));
        }
    }
    
    generateSafeItemPosition() {
        // Use global function if available
        if (typeof generateSafeItemPosition !== 'undefined') {
            return generateSafeItemPosition();
        }
        
        // Fallback safe item spawn logic
        let attempts = 0;
        const maxAttempts = 30;
        
        while (attempts < maxAttempts) {
            const x = 50 + Math.random() * (canvas.width - 100);
            const y = 50 + Math.random() * (canvas.height - 100);
            
            let validPosition = true;
            
            // Check distance from tanks
            for (let tank of this.gameState.tanks) {
                const distance = Math.sqrt(Math.pow(x - tank.x, 2) + Math.pow(y - tank.y, 2));
                if (distance < 100) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                return { x, y };
            }
            
            attempts++;
        }
        
        // Fallback position
        return { x: canvas.width / 3, y: canvas.height / 3 };
    }
    
    initializeAssets() {
        // Initialize asset loading state
        this.gameState.assetsLoaded = {
            grass: false,
            wall: false,
            water: false,
            sand: false
        };
        
        // Load assets (these should be loaded globally)
        if (typeof grassImage !== 'undefined' && grassImage.complete) {
            this.gameState.assetsLoaded.grass = true;
        }
        if (typeof wallImage !== 'undefined' && wallImage.complete) {
            this.gameState.assetsLoaded.wall = true;
        }
        if (typeof waterImage !== 'undefined' && waterImage.complete) {
            this.gameState.assetsLoaded.water = true;
        }
        if (typeof sandImage !== 'undefined' && sandImage.complete) {
            this.gameState.assetsLoaded.sand = true;
        }
    }
    
    setGameMode(mode) {
        this.gameState.gameMode = mode;
    }
    
    setMapSize(size) {
        this.gameState.mapSize = size;
        
        // Update canvas size based on map size
        if (this.gameState.mapSizes[size] && typeof canvas !== 'undefined') {
            canvas.width = this.gameState.mapSizes[size].width;
            canvas.height = this.gameState.mapSizes[size].height;
        }
    }
    
    setupCanvasSize() {
        // Set up canvas size based on current map size
        if (typeof canvas !== 'undefined') {
            const currentMapSize = this.gameState.mapSizes[this.gameState.mapSize];
            if (currentMapSize) {
                canvas.width = currentMapSize.width;
                canvas.height = currentMapSize.height;
            }
        }
    }
}

// Make it globally available
if (typeof window !== 'undefined') {
    window.GameInitializer = GameInitializer;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameInitializer;
}