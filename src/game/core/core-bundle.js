// Core Game Logic Bundle
// This file imports and exposes all core game logic modules

// Import and expose all core classes
// Note: In a browser environment, these are loaded via script tags
// and automatically available on the global window object

// Core game logic classes (loaded via script tags):
// - GameState: src/game/core/GameState.js
// - GameLoop: src/game/core/GameLoop.js  
// - Renderer: src/game/core/Renderer.js
// - GameInitializer: src/game/core/GameInitializer.js

// System classes (loaded via script tags):
// - RoundManager: src/game/systems/RoundManager.js
// - ScoreManager: src/game/systems/ScoreManager.js
// - SettingsManager: src/game/systems/SettingsManager.js

// Global instances for backward compatibility
let gameState = null;
let gameLoop = null;
let renderer = null;
let gameInitializer = null;
let roundManager = null;
let settingsManager = null;

// Initialize core game systems
function initializeCoreGameSystems() {
    // Create game state
    gameState = new GameState();
    
    // Create managers
    roundManager = new RoundManager(gameState);
    settingsManager = new SettingsManager();
    
    // Create renderer
    if (typeof canvas !== 'undefined') {
        renderer = new Renderer(canvas, gameState);
    }
    
    // Create game loop
    gameLoop = new GameLoop(gameState, renderer);
    
    // Create game initializer
    gameInitializer = new GameInitializer(gameState, roundManager, scoreManager);
    
    // Expose globally for backward compatibility
    window.gameState = gameState;
    window.gameLoop = gameLoop;
    window.renderer = renderer;
    window.gameInitializer = gameInitializer;
    window.roundManager = roundManager;
    window.settingsManager = settingsManager;
    
    // Map legacy global variables to new system
    setupLegacyGlobalMappings();
    
    console.log('[CORE SYSTEMS] All core game systems initialized');
}

// Map legacy global variables to new modular system
function setupLegacyGlobalMappings() {
    // Legacy game state mappings
    if (typeof window !== 'undefined') {
        Object.defineProperty(window, 'tanks', {
            get: () => gameState.tanks,
            set: (value) => { gameState.tanks = value; }
        });
        
        Object.defineProperty(window, 'bullets', {
            get: () => gameState.bullets,
            set: (value) => { gameState.bullets = value; }
        });
        
        Object.defineProperty(window, 'walls', {
            get: () => gameState.walls,
            set: (value) => { gameState.walls = value; }
        });
        
        Object.defineProperty(window, 'gates', {
            get: () => gameState.gates,
            set: (value) => { gameState.gates = value; }
        });
        
        Object.defineProperty(window, 'powerUps', {
            get: () => gameState.powerUps,
            set: (value) => { gameState.powerUps = value; }
        });
        
        Object.defineProperty(window, 'particles', {
            get: () => gameState.particles,
            set: (value) => { gameState.particles = value; }
        });
        
        Object.defineProperty(window, 'explosions', {
            get: () => gameState.explosions,
            set: (value) => { gameState.explosions = value; }
        });
        
        Object.defineProperty(window, 'mines', {
            get: () => gameState.mines,
            set: (value) => { gameState.mines = value; }
        });
        
        Object.defineProperty(window, 'drones', {
            get: () => gameState.drones,
            set: (value) => { gameState.drones = value; }
        });
        
        Object.defineProperty(window, 'targets', {
            get: () => gameState.targets,
            set: (value) => { gameState.targets = value; }
        });
        
        Object.defineProperty(window, 'scores', {
            get: () => gameState.scores,
            set: (value) => { gameState.scores = value; }
        });
        
        Object.defineProperty(window, 'kills', {
            get: () => gameState.kills,
            set: (value) => { gameState.kills = value; }
        });
        
        Object.defineProperty(window, 'ringOfFire', {
            get: () => gameState.ringOfFire,
            set: (value) => { gameState.ringOfFire = value; }
        });
        
        Object.defineProperty(window, 'roundStartTime', {
            get: () => gameState.roundStartTime,
            set: (value) => { gameState.roundStartTime = value; }
        });
        
        Object.defineProperty(window, 'roundResetting', {
            get: () => gameState.roundResetting,
            set: (value) => { gameState.roundResetting = value; }
        });
        
        Object.defineProperty(window, 'gameWinner', {
            get: () => gameState.gameWinner,
            set: (value) => { gameState.gameWinner = value; }
        });
        
        Object.defineProperty(window, 'graceTimer', {
            get: () => gameState.graceTimer,
            set: (value) => { gameState.graceTimer = value; }
        });
        
        Object.defineProperty(window, 'gameMode', {
            get: () => gameState.gameMode,
            set: (value) => { gameState.gameMode = value; }
        });
        
        Object.defineProperty(window, 'gameRunning', {
            get: () => gameState.gameRunning,
            set: (value) => { gameState.gameRunning = value; }
        });
        
        Object.defineProperty(window, 'mapSize', {
            get: () => gameState.mapSize,
            set: (value) => { gameState.mapSize = value; }
        });
        
        Object.defineProperty(window, 'mapSizes', {
            get: () => gameState.mapSizes,
            set: (value) => { gameState.mapSizes = value; }
        });
        
        Object.defineProperty(window, 'camera', {
            get: () => gameState.camera,
            set: (value) => { gameState.camera = value; }
        });
        
        // Legacy function mappings
        window.init = () => gameInitializer.init();
        window.update = () => gameLoop.update();
        window.draw = () => renderer.draw();
        window.resetRound = () => roundManager.resetRound();
        window.resetCamera = () => roundManager.resetCamera();
        window.startWinnerZoom = (winner) => roundManager.startWinnerZoom(winner);
        window.addScreenShake = (amount) => roundManager.addScreenShake(amount);
        
        // Legacy settings functions
        window.updateSettingsFromPopup = (settings) => settingsManager.updateSettings(settings);
        window.loadSettingsFromStorage = () => settingsManager.loadFromStorage();
        window.loadCurrentSettings = () => settingsManager.loadFormWithCurrentSettings();
        window.resetToDefaults = () => settingsManager.resetToDefaults();
    }
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCoreGameSystems);
    } else {
        // DOM already ready
        setTimeout(initializeCoreGameSystems, 0);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GameState,
        GameLoop,
        Renderer,
        GameInitializer,
        RoundManager,
        SettingsManager,
        initializeCoreGameSystems,
        setupLegacyGlobalMappings
    };
}