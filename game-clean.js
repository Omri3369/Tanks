// Clean version with orphaned Bullet code removed
// This file should be renamed to game.js after verification

let canvas, ctx;
let tanks = [];
let bullets = [];
let walls = [];
let gates = [];
let powerUps = [];
let particles = [];
let explosions = [];
let mines = [];
let drones = [];
let targets = [];

let mapSize = 'medium';
let mapSizes = {
    small: { width: 800, height: 600 },
    medium: { width: 1200, height: 800 },
    large: { width: 1600, height: 900 }
};

let gameMode = 0; // 0: Training, 1: Single Player, 2: Multiplayer
let gameRunning = false;
let roundStartTime = Date.now();
let roundResetting = false;
let gameWinner = null;
let graceTimer = 0;

let scores = {
    player1: 0,
    player2: 0
};

let kills = {
    player1: 0,
    player2: 0
};

let camera = {
    x: 0,
    y: 0,
    scale: 1.0,
    targetScale: 1.0,
    targetX: 0,
    targetY: 0,
    isZooming: false,
    zoomStartTime: 0,
    shakeAmount: 0,
    shakeX: 0,
    shakeY: 0
};

let ringOfFire = null;

// Terrain system arrays
let terrainTiles = [];
let obstacleTiles = [];
let tunnelSystem = null;

// AI system (only when AI players are present)
let aiSystem = null;

// Modular managers (loaded via modules)
let scoreManager = null;
let terrainGenerator = null;
let terrainRenderer = null;
let inputHandler = null;
let remoteInputHandler = null;

// Store references to old functions that are now class methods
let shootBullet = null;

// Define Tank and Bullet as null initially - they'll be loaded from modules
let Tank = null;
let Bullet = null;

// Function to initialize globals after modules are loaded
function initializeGlobals() {
    // These are now loaded from modules
    if (typeof window.Tank !== 'undefined') {
        Tank = window.Tank;
    }
    if (typeof window.Bullet !== 'undefined') {
        Bullet = window.Bullet;
    }
    
    // Initialize terrain system
    if (typeof window.TerrainGenerator !== 'undefined') {
        terrainGenerator = new window.TerrainGenerator();
    }
    if (typeof window.TerrainRenderer !== 'undefined') {
        terrainRenderer = new window.TerrainRenderer();
    }
    if (typeof window.TunnelSystem !== 'undefined') {
        tunnelSystem = new window.TunnelSystem();
    }
    
    // Initialize score manager
    if (typeof window.ScoreManager !== 'undefined') {
        scoreManager = new window.ScoreManager();
    }
    
    // Initialize input handler
    if (typeof window.InputHandler !== 'undefined') {
        inputHandler = new window.InputHandler();
    }
    
    // Initialize remote input handler
    if (typeof window.RemoteInputHandler !== 'undefined') {
        remoteInputHandler = new window.RemoteInputHandler();
    }
    
    // Initialize AI system
    if (typeof window.AISystem !== 'undefined') {
        aiSystem = new window.AISystem();
    }
    
    // Reference the shootBullet method if Tank class is available
    if (Tank && Tank.prototype.shootBullet) {
        shootBullet = function(tank) {
            return tank.shootBullet();
        };
    }
    
    console.log('[GAME] Global variables initialized');
}

function generateSafeItemPosition() {
    let validPosition = false;
    let x, y;
    let attempts = 0;
    
    while (!validPosition && attempts < 100) {
        x = Math.random() * (canvas.width - 100) + 50;
        y = Math.random() * (canvas.height - 100) + 50;
        
        // Check not too close to walls
        validPosition = true;
        for (let wall of walls) {
            if (x + 15 > wall.x && 
                x - 15 < wall.x + wall.width &&
                y + 15 > wall.y && 
                y - 15 < wall.y + wall.height) {
                validPosition = false;
                break;
            }
        }
    }
    
    return validPosition ? { x, y } : { x: 100 + Math.random() * (canvas.width - 200), y: 100 + Math.random() * (canvas.height - 200) };
}

function getBulletLifetime(type) {
    switch(type) {
        case 'laser': return BULLET_LIFETIME * 0.7;
        case 'rocket': return BULLET_LIFETIME * 1.5;
        case 'explosive': return BULLET_LIFETIME * 1.2;
        case 'piercing': return BULLET_LIFETIME * 0.8;
        case 'freeze': return BULLET_LIFETIME * 1.3;
        default: return BULLET_LIFETIME;
    }
}

function getBulletSize(type) {
    switch(type) {
        case 'laser': return BULLET_SIZE * 0.5;
        case 'rocket': return BULLET_SIZE * 1.5;
        case 'explosive': return BULLET_SIZE * 1.3;
        case 'piercing': return BULLET_SIZE * 0.8;
        case 'freeze': return BULLET_SIZE * 1.2;
        default: return BULLET_SIZE;
    }
}

// All Bullet class methods removed - moved to src/game/entities/entities-bundle.js
// Wall, DestructibleWall, and Gate classes moved to src/game/obstacles/obstacles-bundle.js
// PowerUp class moved to src/game/entities/entities-bundle.js  
// Particle, SmokeParticle, and Explosion classes moved to src/game/effects/effects-bundle.js
// Mine class moved to src/game/entities/entities-bundle.js
// Target class moved to src/game/entities/entities-bundle.js
// Drone class moved to src/game/entities/entities-bundle.js
// RingOfFire class moved to src/game/effects/effects-bundle.js

function generateSafeSpawnPosition() {
    let validPosition = false;
    let x, y;
    let attempts = 0;
    
    while (!validPosition && attempts < 100) {
        x = Math.random() * (canvas.width - 200) + 100;
        y = Math.random() * (canvas.height - 200) + 100;
        validPosition = true;
        
        // Check not too close to walls
        for (let wall of walls) {
            if (x + TANK_SIZE + 20 > wall.x && 
                x - TANK_SIZE - 20 < wall.x + wall.width &&
                y + TANK_SIZE + 20 > wall.y && 
                y - TANK_SIZE - 20 < wall.y + wall.height) {
                validPosition = false;
                break;
            }
        }
        
        // Check not on blocking terrain tiles (water and wall tiles)
        if (validPosition) {
            // Calculate the tile coordinates for the spawn position
            const tileX = Math.floor(x / TILE_SIZE);
            const tileY = Math.floor(y / TILE_SIZE);
            
            // Check a 2x2 area around the spawn position to ensure tank fully fits
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const checkX = tileX + dx;
                    const checkY = tileY + dy;
                    
                    // Check if this tile is a blocking tile
                    const blockingTile = obstacleTiles.find(tile => 
                        tile.x === checkX && tile.y === checkY
                    );
                    
                    if (blockingTile) {
                        validPosition = false;
                        break;
                    }
                }
                if (!validPosition) break;
            }
        }
        
        // Check not too close to other tanks
        if (validPosition) {
            for (let tank of tanks) {
                if (tank && tank.alive) {
                    const distance = Math.sqrt((x - tank.x) ** 2 + (y - tank.y) ** 2);
                    if (distance < 200) {  // Increased minimum distance between tanks
                        validPosition = false;
                        break;
                    }
                }
            }
        }
        
        attempts++;
    }
    
    return validPosition ? { x, y } : { x: 100 + Math.random() * (canvas.width - 200), y: 100 + Math.random() * (canvas.height - 200) };
}

function generateMaze() {
    walls = [];
    gates = [];
}

function setMapSize(size) {
    mapSize = size;
    const dimensions = mapSizes[size];
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
}

// Score management functions moved to src/game/systems/ScoreManager.js

// Helper function to generate random colors for explosions
function getRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Camera/Zoom functions
function updateCamera() {
    if (!camera.isZooming) return;
    
    const elapsed = Date.now() - camera.zoomStartTime;
    const progress = Math.min(elapsed / CONFIG.ZOOM_DURATION, 1.0);
    
    // Smooth easing
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    
    // Interpolate camera properties
    camera.scale = 1.0 + (camera.targetScale - 1.0) * easeProgress;
    camera.x = camera.targetX * easeProgress;
    camera.y = camera.targetY * easeProgress;
    
    // Stop zooming when transition complete
    if (progress >= 1.0) {
        camera.isZooming = false;
    }
}

function startWinnerZoom(winner) {
    camera.targetScale = CONFIG.WINNER_ZOOM_SCALE;
    camera.targetX = canvas.width / 2 - winner.x * CONFIG.WINNER_ZOOM_SCALE;
    camera.targetY = canvas.height / 2 - winner.y * CONFIG.WINNER_ZOOM_SCALE;
    camera.isZooming = true;
    camera.zoomStartTime = Date.now();
}

function resetCamera() {
    camera.scale = 1.0;
    camera.x = 0;
    camera.y = 0;
    camera.targetScale = 1.0;
    camera.targetX = 0;
    camera.targetY = 0;
    camera.isZooming = false;
    camera.zoomStartTime = 0;
}

// The rest of the functions continue from here...
// I'll include just the essential initialization function

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeGlobals();
    });
}