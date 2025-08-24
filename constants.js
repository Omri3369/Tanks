// DOM Element Constants
const DOM_ELEMENTS = {
    canvas: 'gameCanvas',
    startScreen: 'startScreen',
    scoreBoard: 'scoreBoard',
    controls: 'controls'
};

// Asset Paths
const ASSETS = {
    images: {
        grass: './assets/images/grass.png',
        wall: './assets/images/wall.png',
        water: './assets/images/water.png',
        sand: './assets/images/sand.png'
    }
};

// Map Size Configurations
const MAP_SIZES = {
    small: { width: 800, height: 600 },
    medium: { width: 1200, height: 800 },
    large: { width: 1600, height: 1000 }
};

// Default Player Colors
const DEFAULT_COLORS = {
    PLAYER1_COLOR: '#4CAF50',
    PLAYER2_COLOR: '#ff9800',
    PLAYER1_SECONDARY_COLOR: '#2E7D32',
    PLAYER2_SECONDARY_COLOR: '#E65100'
};

// Terrain Constants
const TERRAIN = {
    TILE_SIZE: 64  // Original tile size
};

// Global constants for backward compatibility
const TILE_SIZE = 64;
const TANK_SIZE = 30;
const BULLET_SIZE = 5;
const BULLET_SPEED = 10;
const BULLET_LIFETIME = 100;
// const TANK_SPEED = 3; // Now using CONFIG.TANK_SPEED
// const TANK_TURN_SPEED = 0.05; // Now using CONFIG.TANK_TURN_SPEED
const POWERUP_SIZE = 20;

// Player colors
let PLAYER1_COLOR = '#4CAF50';
let PLAYER2_COLOR = '#ff9800';
let PLAYER1_SECONDARY_COLOR = '#2E7D32';
let PLAYER2_SECONDARY_COLOR = '#E65100';

// Export everything for use in game.js
const GAME_CONSTANTS = {
    DOM_ELEMENTS,
    ASSETS,
    MAP_SIZES,
    DEFAULT_COLORS,
    TERRAIN
};

// Make constants available globally
if (typeof window !== 'undefined') {
    window.DOM_ELEMENTS = DOM_ELEMENTS;
    window.ASSETS = ASSETS;
    window.MAP_SIZES = MAP_SIZES;
    window.DEFAULT_COLORS = DEFAULT_COLORS;
    window.TERRAIN = TERRAIN;
    window.GAME_CONSTANTS = GAME_CONSTANTS;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GAME_CONSTANTS;
}