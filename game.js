// Clean version with orphaned Bullet code removed
// This file should be renamed to game.js after verification

// Game constants from CONFIG - will be set in initializeGlobals()
let TANK_SPEED;
let TANK_TURN_SPEED;

let canvas, ctx;
let tanks = [];
let bullets = [];
let killLog = []; // Array to store kill log entries
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
// scoreManager is created globally in ScoreManager.js
let terrainGenerator = null;
let terrainRenderer = null;
let inputHandler = null;
let remoteInputHandler = null;

// Store references to old functions that are now class methods
let shootBullet = null;

// Tank and Bullet classes are loaded from their respective modules
// Tank is defined in src/game/Tank.js
// Bullet is defined in src/game/entities/entities-bundle.js

// Function to initialize globals after modules are loaded
// Kill Log System
function addKillLogEntry(killer, victim, method = 'killed') {
    const timestamp = new Date().toLocaleTimeString();
    
    let entry = {
        killer: killer,
        victim: victim,
        method: method,
        timestamp: timestamp
    };
    
    // Add to kill log array
    killLog.unshift(entry);
    
    // Keep only last 20 entries
    if (killLog.length > 20) {
        killLog.pop();
    }
    
    // Update UI
    updateKillLogDisplay();
}

function updateKillLogDisplay() {
    const killLogElement = document.getElementById('killLogEntries');
    if (!killLogElement) return;
    
    killLogElement.innerHTML = '';
    
    killLog.forEach((entry, index) => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'kill-entry';
        
        let html = '';
        
        if (entry.method === 'fire') {
            // Fire kill - no killer
            html = `<span class="fire-kill">🔥 ${entry.victim}</span> <span class="method">burned to death</span>`;
        } else {
            // Regular kill
            const killerName = entry.killer ? `Player ${entry.killer}` : 'Unknown';
            const victimName = `Player ${entry.victim}`;
            html = `<span class="killer">${killerName}</span> <span class="method">${entry.method}</span> <span class="victim">${victimName}</span>`;
        }
        
        html += `<small style="margin-left: auto; color: #666;">${entry.timestamp}</small>`;
        
        entryDiv.innerHTML = html;
        killLogElement.appendChild(entryDiv);
    });
}

function clearKillLog() {
    killLog = [];
    updateKillLogDisplay();
}

function initializeGlobals() {
    // Initialize game constants from CONFIG
    TANK_SPEED = CONFIG.TANK_SPEED;
    TANK_TURN_SPEED = CONFIG.TANK_TURN_SPEED;
    
    // Also set on window for other modules that check window.TANK_SPEED
    window.TANK_SPEED = TANK_SPEED;
    window.TANK_TURN_SPEED = TANK_TURN_SPEED;
    
    console.log('[GAME] Initialized TANK_SPEED to:', TANK_SPEED, 'window.TANK_SPEED:', window.TANK_SPEED);
    
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
        window.inputHandler = inputHandler; // Make it globally accessible
    }
    
    // Initialize remote input handler
    if (typeof window.RemoteInputHandler !== 'undefined') {
        remoteInputHandler = new window.RemoteInputHandler();
    }
    
    // Initialize AI system
    if (typeof window.AIBehavior !== 'undefined') {
        aiSystem = new window.AIBehavior();
        window.aiSystem = aiSystem; // Make it globally accessible
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
        
        // Check not on water or wall tiles
        if (validPosition) {
            const tileX = Math.floor(x / TILE_SIZE);
            const tileY = Math.floor(y / TILE_SIZE);
            
            // Check if this tile is an obstacle
            const blockingTile = obstacleTiles.find(tile => 
                tile.x === tileX && tile.y === tileY && 
                (tile.type === 'water' || tile.type === 'wall')
            );
            
            if (blockingTile) {
                validPosition = false;
            }
        }
        
        attempts++;
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

// Track used spawn positions to prevent duplicates
let usedSpawnPositions = [];

function generateSafeSpawnPosition() {
    let validPosition = false;
    let x, y;
    let attempts = 0;
    const maxAttempts = 200; // Increased attempts to find valid position
    const minDistanceFromUsedPositions = 80; // Reduced minimum distance for easier spawning
    
    console.log(`[SPAWN] Starting spawn generation. ObstacleTiles: ${obstacleTiles ? obstacleTiles.length : 0}, Walls: ${walls ? walls.length : 0}`);
    
    while (!validPosition && attempts < maxAttempts) {
        // Generate random position with good buffer from edges
        x = Math.random() * (canvas.width - 200) + 100;
        y = Math.random() * (canvas.height - 200) + 100;
        validPosition = true;
        
        // Check not too close to previously used spawn positions
        for (let usedPos of usedSpawnPositions) {
            const distance = Math.sqrt((x - usedPos.x) ** 2 + (y - usedPos.y) ** 2);
            if (distance < minDistanceFromUsedPositions) {
                validPosition = false;
                break;
            }
        }
        
        // Check not too close to walls
        if (validPosition && walls && walls.length > 0) {
            for (let wall of walls) {
                if (wall && x + TANK_SIZE + 20 > wall.x && 
                    x - TANK_SIZE - 20 < wall.x + wall.width &&
                    y + TANK_SIZE + 20 > wall.y && 
                    y - TANK_SIZE - 20 < wall.y + wall.height) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        // Check not on blocking terrain tiles (water and wall tiles)
        if (validPosition && obstacleTiles && obstacleTiles.length > 0) {
            // Check multiple points around the tank to ensure it doesn't overlap obstacles
            const tankRadius = TANK_SIZE;
            const checkPoints = [
                { dx: 0, dy: 0 },           // Center
                { dx: -tankRadius, dy: 0 },  // Left
                { dx: tankRadius, dy: 0 },   // Right
                { dx: 0, dy: -tankRadius },  // Top
                { dx: 0, dy: tankRadius },   // Bottom
                { dx: -tankRadius, dy: -tankRadius }, // Top-left
                { dx: tankRadius, dy: -tankRadius },  // Top-right
                { dx: -tankRadius, dy: tankRadius },  // Bottom-left
                { dx: tankRadius, dy: tankRadius }    // Bottom-right
            ];
            
            for (let point of checkPoints) {
                const checkX = Math.floor((x + point.dx) / TILE_SIZE);
                const checkY = Math.floor((y + point.dy) / TILE_SIZE);
                
                // Check if this position has a blocking tile
                for (let tile of obstacleTiles) {
                    if (tile && tile.x === checkX && tile.y === checkY &&
                        (tile.type === 'water' || tile.type === 'wall')) {
                        validPosition = false;
                        if (attempts < 5) { // Only log first few attempts
                            console.log(`[SPAWN] Position ${x.toFixed(0)},${y.toFixed(0)} blocked by ${tile.type} at tile ${checkX},${checkY}`);
                        }
                        break;
                    }
                }
                
                if (!validPosition) break;
            }
        }
        
        // Check not too close to other tanks
        if (validPosition && tanks && tanks.length > 0) {
            for (let tank of tanks) {
                if (tank && tank.alive) {
                    const distance = Math.sqrt((x - tank.x) ** 2 + (y - tank.y) ** 2);
                    if (distance < 100) {  // Reduced minimum distance between tanks
                        validPosition = false;
                        break;
                    }
                }
            }
        }
        
        attempts++;
    }
    
    // If we still couldn't find a valid position after many attempts,
    // try a few more times with more relaxed constraints
    if (!validPosition) {
        console.warn(`[SPAWN] Could not find valid spawn position after ${maxAttempts} attempts, trying fallback`);
        
        // Try 50 more times with just basic obstacle checking but wider range
        for (let i = 0; i < 50; i++) {
            x = Math.random() * (canvas.width - 100) + 50;
            y = Math.random() * (canvas.height - 100) + 50;
            
            // Check center position and immediate surroundings for obstacles
            const tankRadius = TANK_SIZE;
            const checkPoints = [
                { dx: 0, dy: 0 },           // Center
                { dx: -tankRadius/2, dy: 0 },  // Left
                { dx: tankRadius/2, dy: 0 },   // Right
                { dx: 0, dy: -tankRadius/2 },  // Top
                { dx: 0, dy: tankRadius/2 }    // Bottom
            ];
            
            let blocked = false;
            for (let point of checkPoints) {
                const tileX = Math.floor((x + point.dx) / TILE_SIZE);
                const tileY = Math.floor((y + point.dy) / TILE_SIZE);
                
                for (let tile of obstacleTiles) {
                    if (tile && tile.x === tileX && tile.y === tileY &&
                        (tile.type === 'water' || tile.type === 'wall')) {
                        blocked = true;
                        break;
                    }
                }
                if (blocked) break;
            }
            
            if (!blocked) {
                console.log(`[SPAWN] Found fallback position at ${x.toFixed(0)},${y.toFixed(0)}`);
                validPosition = true;
                break;
            }
        }
        
        // Last resort - find ANY free tile systematically
        if (!validPosition) {
            console.error(`[SPAWN] CRITICAL: Searching for any free tile systematically`);
            
            // Create a grid of all tiles
            const gridWidth = Math.ceil(canvas.width / TILE_SIZE);
            const gridHeight = Math.ceil(canvas.height / TILE_SIZE);
            const freeTiles = [];
            
            // Find all free tiles
            for (let gx = 1; gx < gridWidth - 1; gx++) {
                for (let gy = 1; gy < gridHeight - 1; gy++) {
                    let tileBlocked = false;
                    
                    // Check if this tile is blocked
                    for (let tile of obstacleTiles) {
                        if (tile && tile.x === gx && tile.y === gy &&
                            (tile.type === 'water' || tile.type === 'wall')) {
                            tileBlocked = true;
                            break;
                        }
                    }
                    
                    if (!tileBlocked) {
                        freeTiles.push({ x: gx, y: gy });
                    }
                }
            }
            
            if (freeTiles.length > 0) {
                // Pick a random free tile
                const randomTile = freeTiles[Math.floor(Math.random() * freeTiles.length)];
                x = randomTile.x * TILE_SIZE + TILE_SIZE / 2;
                y = randomTile.y * TILE_SIZE + TILE_SIZE / 2;
                validPosition = true;
                console.log(`[SPAWN] Found free tile at grid ${randomTile.x},${randomTile.y} -> position ${x.toFixed(0)},${y.toFixed(0)}`);
            } else {
                // Absolutely no free tiles - this should never happen
                console.error(`[SPAWN] FATAL: No free tiles found! Using center of map`);
                x = canvas.width / 2;
                y = canvas.height / 2;
            }
        }
    }
    
    // Store this position as used
    usedSpawnPositions.push({ x, y });
    
    console.log(`[SPAWN] Final position: ${x.toFixed(0)},${y.toFixed(0)} (valid: ${validPosition})`);
    return { x, y };
}

// Function to reset spawn positions for a new round
function resetSpawnPositions() {
    usedSpawnPositions = [];
}

function generateMaze() {
    walls = [];
    gates = [];
}

function setMapSize(size) {
    mapSize = size;
    const dimensions = mapSizes[size];
    // Only set canvas dimensions if canvas exists
    if (canvas) {
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
    }
}

// Score management functions moved to src/game/systems/ScoreManager.js

// Helper function to generate random colors for explosions
function getRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function generateRandomRGBColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Camera/Zoom functions
function updateCamera() {
    if (!camera.isZooming) return;
    
    const elapsed = Date.now() - camera.zoomStartTime;
    const progress = Math.min(elapsed / (CONFIG.WINNER_ZOOM_TRANSITION_TIME || CONFIG.ZOOM_DURATION || 2000), 1.0);
    
    // Smooth easing function (ease-out)
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    
    // Interpolate scale and position
    camera.scale = 1.0 + (camera.targetScale - 1.0) * easedProgress;
    camera.x = camera.targetX * easedProgress;
    camera.y = camera.targetY * easedProgress;
    
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
    camera.targetScale = 1.0;
    camera.x = 0;
    camera.y = 0;
    camera.targetX = 0;
    camera.targetY = 0;
    camera.isZooming = false;
    camera.zoomStartTime = 0;
}

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeGlobals();
    });
}


// selectMapSize function moved to menu.js

// startGame function moved to menu.js

function init() {
    // Check if multiplayer engine is handling initialization
    const isMultiplayer = window.multiplayerEngine && window.multiplayerEngine.isMultiplayer;
    
    if (!isMultiplayer) {
        // Only reset arrays if not in multiplayer mode
        tanks = [];
        bullets = [];
        particles = [];
        powerUps = [];
        drones = [];
        targets = [];
    } else {
        // In multiplayer, just clear projectiles and effects
        bullets = [];
        particles = [];
        powerUps = [];
        drones = [];
        targets = [];
        // Keep tanks from multiplayer initialization
    }
    
    // Set grace period (3 seconds at 60fps)
    graceTimer = 180;
    
    // Initialize ring of fire
    ringOfFire = new RingOfFire();
    
    // Initialize game systems
    aiSystem.initialize(CONFIG, gameState);
    inputHandler.initialize(CONFIG);
    
    // Set the shared remote input handler (but not in multiplayer mode)
    if (!isMultiplayer && inputHandler && inputHandler.remoteHandler !== undefined) {
        // Replace with our global instance that can send color updates
        inputHandler.remoteHandler = remoteInputHandler;
    }
    if (!isMultiplayer && remoteInputHandler) {
        remoteInputHandler.connect();
    }
    
    // Reset spawn positions for the new game
    resetSpawnPositions();
    
    // Generate terrain for battlefield
    generateTerrainTiles();
    
    // Only create default tanks if not in multiplayer mode
    if (!isMultiplayer) {
        // Generate random spawn position for player 1
        const player1Pos = generateSafeSpawnPosition();
        const player1Tank = new Tank(player1Pos.x, player1Pos.y, PLAYER1_COLOR, {
            up: 'ArrowUp',
            down: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            shoot: 'm'
        }, 1, PLAYER1_SECONDARY_COLOR);
        tanks.push(player1Tank);
        
        // Send player 1 color to controller
        if (remoteInputHandler) {
            remoteInputHandler.sendPlayerColorUpdate(1, PLAYER1_COLOR);
        }
    }
    
    if (gameMode === 0 && !isMultiplayer) {
        // Training mode - only player 1, no AI or other players
        // Add targets for practice
        
        // Add stationary targets
        for (let i = 0; i < CONFIG.TRAINING_STATIONARY_TARGETS; i++) {
            let validPosition = false;
            let x, y;
            while (!validPosition) {
                x = Math.random() * (canvas.width - 200) + 100;
                y = Math.random() * (canvas.height - 200) + 100;
                
                // Make sure target doesn't spawn too close to player
                const distanceToPlayer = Math.sqrt(
                    Math.pow(x - player1Pos.x, 2) + Math.pow(y - player1Pos.y, 2)
                );
                
                if (distanceToPlayer > 150) {
                    const testTarget = new Target(x, y, 'stationary');
                    validPosition = !testTarget.checkWallCollision(x, y);
                }
            }
            targets.push(new Target(x, y, 'stationary'));
        }
        
        // Add moving targets
        for (let i = 0; i < CONFIG.TRAINING_MOVING_TARGETS; i++) {
            let validPosition = false;
            let x, y;
            while (!validPosition) {
                x = Math.random() * (canvas.width - 300) + 150;
                y = Math.random() * (canvas.height - 300) + 150;
                
                // Make sure target doesn't spawn too close to player
                const distanceToPlayer = Math.sqrt(
                    Math.pow(x - player1Pos.x, 2) + Math.pow(y - player1Pos.y, 2)
                );
                
                if (distanceToPlayer > 200) {
                    const testTarget = new Target(x, y, 'moving');
                    validPosition = !testTarget.checkWallCollision(x, y);
                }
            }
            targets.push(new Target(x, y, 'moving'));
        }
    } else if (gameMode === 1 && !isMultiplayer) {
        // Add AI tanks in single player mode (not in multiplayer)
        const aiColors = ['#ff9800', '#9c27b0', '#f44336', '#e91e63', '#2196f3', '#ff5722', '#795548'];
        
        for (let i = 0; i < CONFIG.AI_TANK_COUNT; i++) {
            const aiPos = generateSafeSpawnPosition();
            const aiTank = new Tank(aiPos.x, aiPos.y, aiColors[i % aiColors.length], {}, i + 2);
            aiTank.isAI = true;
            tanks.push(aiTank);
        }
    } else if (!isMultiplayer) {
        const player2Pos = generateSafeSpawnPosition();
        const player2Tank = new Tank(player2Pos.x, player2Pos.y, PLAYER2_COLOR, {
            up: 'e',
            down: 'd',
            left: 's',
            right: 'f',
            shoot: 'q'
        }, 2, PLAYER2_SECONDARY_COLOR);
        tanks.push(player2Tank);
        
        // Send player 2 color to controller
        if (remoteInputHandler) {
            remoteInputHandler.sendPlayerColorUpdate(2, PLAYER2_COLOR);
        }
    }
    
    for (let i = 0; i < 2; i++) {
        const powerUpPos = generateSafeItemPosition();
        powerUps.push(new PowerUp(powerUpPos.x, powerUpPos.y));
    }
    
    
    // Create scoreboard after tanks are initialized
    // createScoreBoard(); // Commenting out - causing issues in multiplayer
    
    legacyGameLoop();
}

function update() {
    try {
        // Update grace timer
        try {
            if (graceTimer > 0) {
                graceTimer--;
            }
        } catch (error) {
            console.error('[UPDATE ERROR] Grace timer update failed:', error);
        }
        
        // Update tanks, targets, and drones
        try {
            tanks.forEach(tank => {
                try {
                    tank.update();
                } catch (error) {
                    console.error('[UPDATE ERROR] Tank update failed:', error);
                }
            });
            
            targets.forEach(target => {
                try {
                    target.update();
                } catch (error) {
                    console.error('[UPDATE ERROR] Target update failed:', error);
                }
            });
            
            drones.forEach(drone => {
                try {
                    drone.update();
                } catch (error) {
                    console.error('[UPDATE ERROR] Drone update failed:', error);
                }
            });
            
            // Remove dead drones
            drones = drones.filter(drone => drone.alive);
        } catch (error) {
            console.error('[UPDATE ERROR] Entity updates failed:', error);
        }
        
        // Update UI elements
        try {
            updateReloadBars();
            updateAmmoDisplays();
        } catch (error) {
            console.error('[UPDATE ERROR] UI updates failed:', error);
        }
        
        // Update ring of fire
        try {
            if (ringOfFire) {
                ringOfFire.update();
            }
        } catch (error) {
            console.error('[UPDATE ERROR] Ring of fire update failed:', error);
        }
        
        // Update camera
        try {
            updateCamera();
        } catch (error) {
            console.error('[UPDATE ERROR] Camera update failed:', error);
        }
        
        
        // Check for game over
        try {
            const aliveTanks = tanks.filter(t => t.alive);
            if (aliveTanks.length === 1 && !roundResetting && gameMode !== 0) {
                roundResetting = true;
                const winner = aliveTanks[0];
                scores[`player${winner.playerNum}`]++;
                const scoreElement = document.getElementById(`score${winner.playerNum}`);
                if (scoreElement) {
                    scoreElement.textContent = scores[`player${winner.playerNum}`];
                }
                
                // Store winner for display
                gameWinner = winner;
                
                // Start zoom effect on winner
                startWinnerZoom(winner);
                
                // Show winner message
                setTimeout(() => {
                    try {
                        gameWinner = null;
                        resetCamera();
                        resetRound();
                        roundResetting = false;
                    } catch (error) {
                        console.error('[UPDATE ERROR] Game over cleanup failed:', error);
                    }
                }, 3000);
            }
        } catch (error) {
            console.error('[UPDATE ERROR] Game over check failed:', error);
        }
        
        // Update bullets and collisions
        try {
            bullets = bullets.filter(bullet => {
                try {
                    const alive = bullet.update();
                    
                    for (let tank of tanks) {
                        try {
                            if (bullet.checkTankCollision(tank)) {
                                // Check if tank has energy shield
                                if (tank.hasEnergyShield) {
                                    // Shield blocks the bullet
                                    // Create shield impact effect
                                    for (let i = 0; i < 8; i++) {
                                        particles.push(new Particle(
                                            bullet.x + (Math.random() - 0.5) * 10,
                                            bullet.y + (Math.random() - 0.5) * 10,
                                            '#00DDFF',
                                            15
                                        ));
                                    }
                                    return false; // Destroy bullet but not tank
                                } else {
                                    // Determine kill method based on bullet type
                                    let killMethod = 'killed';
                                    if (bullet.type === 'rocket') killMethod = 'blasted';
                                    else if (bullet.type === 'laser') killMethod = 'vaporized';
                                    else if (bullet.type === 'scatter') killMethod = 'riddled';
                                    
                                    tank.destroy(bullet.owner, killMethod);
                                    return false;
                                }
                            }
                        } catch (error) {
                            console.error('[UPDATE ERROR] Bullet-tank collision check failed:', error);
                        }
                    }
                    
                    // Check target collisions
                    for (let target of targets) {
                        try {
                            if (bullet.checkTargetCollision(target)) {
                                target.takeDamage();
                                return false;
                            }
                        } catch (error) {
                            console.error('[UPDATE ERROR] Bullet-target collision check failed:', error);
                        }
                    }
                    
                    // Check drone collisions
                    for (let drone of drones) {
                        try {
                            if (bullet.checkDroneCollision(drone)) {
                                drone.takeDamage();
                                return false;
                            }
                        } catch (error) {
                            console.error('[UPDATE ERROR] Bullet-drone collision check failed:', error);
                        }
                    }
                    
                    return alive;
                } catch (error) {
                    console.error('[UPDATE ERROR] Bullet update failed:', error);
                    return false; // Remove problematic bullet
                }
            });
        } catch (error) {
            console.error('[UPDATE ERROR] Bullet system update failed:', error);
        }
        
        // Update powerups
        try {
            powerUps.forEach(powerUp => {
                try {
                    powerUp.update();
                    tanks.forEach(tank => {
                        try {
                            powerUp.checkCollision(tank);
                        } catch (error) {
                            console.error('[UPDATE ERROR] PowerUp collision check failed:', error);
                        }
                    });
                } catch (error) {
                    console.error('[UPDATE ERROR] PowerUp update failed:', error);
                }
            });
        } catch (error) {
            console.error('[UPDATE ERROR] PowerUp system failed:', error);
        }
        
        
        // Update particles
        try {
            particles = particles.filter(particle => {
                try {
                    if (particle instanceof SmokeParticle) {
                        return particle.update();
                    }
                    return particle.update();
                } catch (error) {
                    console.error('[UPDATE ERROR] Particle update failed:', error);
                    return false; // Remove problematic particle
                }
            });
        } catch (error) {
            console.error('[UPDATE ERROR] Particle system failed:', error);
        }
        
        // Update explosions
        try {
            explosions = explosions.filter(explosion => {
                try {
                    return explosion.update();
                } catch (error) {
                    console.error('[UPDATE ERROR] Explosion update failed:', error);
                    return false; // Remove problematic explosion
                }
            });
        } catch (error) {
            console.error('[UPDATE ERROR] Explosion system failed:', error);
        }
        
        // Update mines
        try {
            mines = mines.filter(mine => {
                try {
                    return mine.update();
                } catch (error) {
                    console.error('[UPDATE ERROR] Mine update failed:', error);
                    return false; // Remove problematic mine
                }
            });
        } catch (error) {
            console.error('[UPDATE ERROR] Mine system failed:', error);
        }
    } catch (error) {
        console.error('[UPDATE ERROR] Critical error in update function:', error);
        console.error('Stack trace:', error.stack);
    }
}

function resetRound() {
    // Clear kill log for new round
    clearKillLog();
    // Clear all bullets, particles, explosions and mines
    bullets = [];
    particles = [];
    explosions = [];
    mines = [];
    
    // Set grace period (3 seconds at 60fps)
    graceTimer = 180;
    
    // Reset spawn positions for the new round
    resetSpawnPositions();
    
    // Regenerate terrain for new round
    generateTerrainTiles();
    
    
    // Reset ring of fire
    ringOfFire = new RingOfFire();
    
    // Reset power-ups to new positions
    powerUps = [];
    
    for (let i = 0; i < 2; i++) {
        const powerUpPos = generateSafeItemPosition();
        powerUps.push(new PowerUp(powerUpPos.x, powerUpPos.y));
    }
    
    
    // Respawn all tanks at random positions
    tanks.forEach(tank => {
        const spawnPos = generateSafeSpawnPosition();
        tank.alive = true;
        tank.x = spawnPos.x;
        tank.y = spawnPos.y;
        tank.angle = Math.random() * Math.PI * 2;
        tank.powerUp = null;
        tank.powerUpTime = 0;
        tank.specialAmmo = 0; // Reset special ammo
    });
}

function addScreenShake(amount) {
    camera.shakeAmount = Math.max(camera.shakeAmount, amount);
}

function updateScreenShake() {
    if (camera.shakeAmount > 0) {
        camera.shakeX = (Math.random() - 0.5) * camera.shakeAmount * 2;
        camera.shakeY = (Math.random() - 0.5) * camera.shakeAmount * 2;
        camera.shakeAmount *= 0.9; // Decay shake
        if (camera.shakeAmount < 0.1) {
            camera.shakeAmount = 0;
            camera.shakeX = 0;
            camera.shakeY = 0;
        }
    }
}

function draw() {
    try {
        // Update screen shake
        updateScreenShake();
        
        // Apply camera transformation
    ctx.save();
    ctx.translate(camera.x + camera.shakeX, camera.y + camera.shakeY);
    ctx.scale(camera.scale, camera.scale);
    
    // Draw battlefield terrain with varied tiles and features
    drawBattlefieldTerrain();
    
    // Note: Walls are now drawn as organic shapes in drawBattlefieldTerrain()
    gates.forEach(gate => gate.draw());
    powerUps.forEach(powerUp => powerUp.draw());
    particles.forEach(particle => particle.draw());
    bullets.forEach(bullet => bullet.draw());
    mines.forEach(mine => mine.draw());
    targets.forEach(target => target.draw(ctx));
    drones.forEach(drone => drone.draw(ctx));
    
    
    tanks.forEach(tank => tank.draw());
    explosions.forEach(explosion => explosion.draw());
    
    // Draw and update teleport effects
    drawTeleportEffects();
    
    // Draw training aiming helper (before restoring camera transformation)
    if (gameMode === 0 && CONFIG.TRAINING_AIMING_HELPER && tanks.length > 0) {
        const playerTank = tanks[0];
        if (playerTank && playerTank.alive) {
            drawAimingLine(playerTank);
            highlightTargetsInRange(playerTank);
        }
    }
    
    // Draw ring of fire on top
    if (ringOfFire) {
        ringOfFire.draw();
    }
    
    // Restore camera transformation for UI elements
    ctx.restore();
    
    // Draw grace period countdown
    if (graceTimer > 0) {
        ctx.save();
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        
        const seconds = Math.ceil(graceTimer / 60);
        const message = seconds > 1 ? `Get Ready! ${seconds}` : 'GO!';
        ctx.strokeText(message, canvas.width / 2, canvas.height / 2 - 50);
        ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Find your position and prepare for battle!', canvas.width / 2, canvas.height / 2 + 20);
        
        ctx.restore();
    }
    
    // Draw victory message with dramatic effects
    if (gameWinner) {
        ctx.save();
        
        // Calculate animation progress based on zoom progress
        const timeSinceWin = Date.now() - camera.zoomStartTime;
        const fadeProgress = Math.min(timeSinceWin / 1000, 1.0); // Fade in over 1 second
        const pulseTime = timeSinceWin / 100; // Pulsing speed
        
        // Semi-transparent black overlay with fade-in
        ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * fadeProgress})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (fadeProgress > 0.3) { // Start text after 300ms
            // Text scaling and pulsing effects
            const textProgress = Math.min((fadeProgress - 0.3) / 0.7, 1.0);
            const pulseScale = 1 + Math.sin(pulseTime) * 0.1; // Gentle pulsing
            const textScale = 0.3 + (textProgress * 0.7 * pulseScale); // Scale from small to normal
            
            // Glow effect
            ctx.shadowColor = gameWinner.color;
            ctx.shadowBlur = 20 + Math.sin(pulseTime) * 10;
            
            // Main text
            const fontSize = 72 * textScale;
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.fillStyle = gameWinner.color;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4 * textScale;
            ctx.textAlign = 'center';
            ctx.globalAlpha = textProgress;
            
            const message = `Player ${gameWinner.playerNum} Wins!`;
            const textY = canvas.height / 4; // Move text to upper quarter
            
            // Draw text with glow
            ctx.strokeText(message, canvas.width / 2, textY);
            ctx.fillText(message, canvas.width / 2, textY);
            
            // Additional sparkle effect
            if (textProgress > 0.8) {
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#FFD700';
                ctx.globalAlpha = (Math.sin(pulseTime * 2) + 1) / 2;
                
                // Draw sparkling stars around the text
                for (let i = 0; i < 8; i++) {
                    const angle = (pulseTime + i) * 0.5;
                    const radius = 200 + Math.sin(pulseTime + i) * 50;
                    const starX = canvas.width / 2 + Math.cos(angle) * radius;
                    const starY = textY + Math.sin(angle) * radius * 0.3;
                    
                    ctx.font = `${20 + Math.sin(pulseTime + i) * 5}px Arial`;
                    ctx.fillText('✨', starX, starY);
                }
            }
        }
        
        ctx.restore();
    }
    } catch (error) {
        console.error('[DRAW ERROR] Critical error in draw function:', error);
        console.error('Stack trace:', error.stack);
    }
}

function drawTrainingAimingHelper() {
    if (gameMode !== 0 || !CONFIG.TRAINING_AIMING_HELPER || tanks.length === 0) {
        return;
    }
    
    const playerTank = tanks[0];
    if (!playerTank || !playerTank.alive) {
        return;
    }
    
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.scale, camera.scale);
    
    drawAimingLine(playerTank);
    highlightTargetsInRange(playerTank);
    
    ctx.restore();
}

function drawAimingLine(tank) {
    const lineLength = 300;
    const startX = tank.x + Math.cos(tank.angle) * (tank.radius + 5);
    const startY = tank.y + Math.sin(tank.angle) * (tank.radius + 5);
    const endX = startX + Math.cos(tank.angle) * lineLength;
    const endY = startY + Math.sin(tank.angle) * lineLength;
    
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    for (let i = 1; i <= 5; i++) {
        const markerX = startX + Math.cos(tank.angle) * (lineLength / 5) * i;
        const markerY = startY + Math.sin(tank.angle) * (lineLength / 5) * i;
        
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(markerX, markerY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${i * 60}px`, markerX, markerY - 8);
    }
    
    ctx.restore();
}

function highlightTargetsInRange(tank) {
    targets.forEach(target => {
        if (!target.alive) return;
        
        const dx = target.x - tank.x;
        const dy = target.y - tank.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angleToTarget = Math.atan2(dy, dx);
        const angleDiff = Math.abs(angleToTarget - tank.angle);
        const normalizedAngleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
        
        if (distance <= 300 && normalizedAngleDiff <= 0.3) {
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.strokeStyle = distance <= 150 ? '#ff4444' : '#ffaa00';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            
            ctx.beginPath();
            ctx.arc(target.x, target.y, target.size + 10, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
        }
    });
}

function legacyGameLoop() {
    // Use the new modular game loop if available, otherwise fallback to legacy
    if (typeof window.gameLoop !== 'undefined' && window.gameLoop.isRunning) {
        // The modular system handles its own loop
        console.log('Modular game loop is running, skipping legacy loop');
        return;
    }
    
    try {
        // Check both local and global gameRunning variables
        if (!gameRunning && !window.gameRunning) {
            console.log('Game not running, stopping loop. Local:', gameRunning, 'Global:', window.gameRunning);
            return;
        }
        
        update();
        draw();
        requestAnimationFrame(legacyGameLoop);
    } catch (error) {
        console.error('[GAME LOOP ERROR] Critical error in main game loop:', error);
        console.error('Stack trace:', error.stack);
        
        // Try to continue the game loop to prevent complete freeze
        try {
            requestAnimationFrame(legacyGameLoop);
        } catch (retryError) {
            console.error('[GAME LOOP ERROR] Failed to restart game loop:', retryError);
        }
    }
}

// Make it available globally
window.legacyGameLoop = legacyGameLoop;

// gameLoop is defined in core-bundle.js as the modular game loop
// Use legacyGameLoop for the old implementation


// openSettings function moved to menu.js

// Function to update settings from popup window
function updateSettingsFromPopup(settings) {
    // Update all the game variables with the new settings
    TANK_SPEED = settings.TANK_SPEED !== undefined ? settings.TANK_SPEED : TANK_SPEED;
    TANK_TURN_SPEED = settings.TANK_TURN_SPEED !== undefined ? settings.TANK_TURN_SPEED : TANK_TURN_SPEED;
    TANK_SIZE = settings.TANK_SIZE !== undefined ? settings.TANK_SIZE : TANK_SIZE;
    
    // Also update CONFIG object
    CONFIG.TANK_SPEED = TANK_SPEED;
    CONFIG.TANK_TURN_SPEED = TANK_TURN_SPEED;
    CONFIG.TANK_SIZE = TANK_SIZE;
    CONFIG.TANK_MAX_SPECIAL_AMMO = settings.TANK_MAX_SPECIAL_AMMO !== undefined ? settings.TANK_MAX_SPECIAL_AMMO : CONFIG.TANK_MAX_SPECIAL_AMMO;
    CONFIG.TANK_RELOAD_TIME = settings.TANK_RELOAD_TIME !== undefined ? settings.TANK_RELOAD_TIME : CONFIG.TANK_RELOAD_TIME;
    
    BULLET_SPEED = settings.BULLET_SPEED !== undefined ? settings.BULLET_SPEED : BULLET_SPEED;
    BULLET_SIZE = settings.BULLET_SIZE !== undefined ? settings.BULLET_SIZE : BULLET_SIZE;
    BULLET_LIFETIME = settings.BULLET_LIFETIME !== undefined ? settings.BULLET_LIFETIME : BULLET_LIFETIME;
    
    // Also update CONFIG object
    CONFIG.BULLET_SPEED = BULLET_SPEED;
    CONFIG.BULLET_SIZE = BULLET_SIZE;
    CONFIG.BULLET_LIFETIME = BULLET_LIFETIME;
    
    CONFIG.POWERUP_COUNT = settings.POWERUP_COUNT !== undefined ? settings.POWERUP_COUNT : CONFIG.POWERUP_COUNT;
    POWERUP_SIZE = settings.POWERUP_SIZE !== undefined ? settings.POWERUP_SIZE : POWERUP_SIZE;
    CONFIG.POWERUP_SIZE = POWERUP_SIZE;
    CONFIG.POWERUP_RESPAWN_TIME = settings.POWERUP_RESPAWN_TIME !== undefined ? settings.POWERUP_RESPAWN_TIME : CONFIG.POWERUP_RESPAWN_TIME;
    
    CONFIG.GRACE_PERIOD = settings.GRACE_PERIOD !== undefined ? settings.GRACE_PERIOD : CONFIG.GRACE_PERIOD;
    CONFIG.AI_TANK_COUNT = settings.AI_TANK_COUNT !== undefined ? settings.AI_TANK_COUNT : CONFIG.AI_TANK_COUNT;
    
    CONFIG.RING_OF_FIRE_ENABLED = settings.RING_OF_FIRE_ENABLED !== undefined ? settings.RING_OF_FIRE_ENABLED : CONFIG.RING_OF_FIRE_ENABLED;
    CONFIG.RING_WARNING_TIME = (settings.RING_OF_FIRE_WARNING_TIME !== undefined ? settings.RING_OF_FIRE_WARNING_TIME : 30) * 1000;
    CONFIG.RING_MIN_RADIUS_MULT = (settings.RING_OF_FIRE_SAFE_ZONE_SIZE !== undefined ? settings.RING_OF_FIRE_SAFE_ZONE_SIZE : 20) / 100;
    
    CONFIG.FRIENDLY_FIRE = settings.FRIENDLY_FIRE !== undefined ? settings.FRIENDLY_FIRE : CONFIG.FRIENDLY_FIRE;
    
    PLAYER1_COLOR = settings.PLAYER1_COLOR !== undefined ? settings.PLAYER1_COLOR : PLAYER1_COLOR;
    PLAYER1_SECONDARY_COLOR = settings.PLAYER1_SECONDARY_COLOR !== undefined ? settings.PLAYER1_SECONDARY_COLOR : PLAYER1_SECONDARY_COLOR;
    PLAYER2_COLOR = settings.PLAYER2_COLOR !== undefined ? settings.PLAYER2_COLOR : PLAYER2_COLOR;
    PLAYER2_SECONDARY_COLOR = settings.PLAYER2_SECONDARY_COLOR !== undefined ? settings.PLAYER2_SECONDARY_COLOR : PLAYER2_SECONDARY_COLOR;
    
    CONFIG.TRAINING_STATIONARY_TARGETS = settings.TRAINING_STATIONARY_TARGETS !== undefined ? settings.TRAINING_STATIONARY_TARGETS : CONFIG.TRAINING_STATIONARY_TARGETS;
    CONFIG.TRAINING_MOVING_TARGETS = settings.TRAINING_MOVING_TARGETS !== undefined ? settings.TRAINING_MOVING_TARGETS : CONFIG.TRAINING_MOVING_TARGETS;
    CONFIG.TRAINING_TARGET_HEALTH = settings.TRAINING_TARGET_HEALTH !== undefined ? settings.TRAINING_TARGET_HEALTH : CONFIG.TRAINING_TARGET_HEALTH;
    CONFIG.TRAINING_TARGET_SIZE = settings.TRAINING_TARGET_SIZE !== undefined ? settings.TRAINING_TARGET_SIZE : CONFIG.TRAINING_TARGET_SIZE;
    CONFIG.TRAINING_TARGET_RESPAWN_TIME = settings.TRAINING_TARGET_RESPAWN_TIME !== undefined ? settings.TRAINING_TARGET_RESPAWN_TIME : CONFIG.TRAINING_TARGET_RESPAWN_TIME;
    CONFIG.TRAINING_MOVING_TARGET_SPEED = settings.TRAINING_MOVING_SPEED !== undefined ? settings.TRAINING_MOVING_SPEED : CONFIG.TRAINING_MOVING_TARGET_SPEED;
    CONFIG.TRAINING_MOVING_TARGET_RANGE = settings.TRAINING_MOVING_RANGE !== undefined ? settings.TRAINING_MOVING_RANGE : CONFIG.TRAINING_MOVING_TARGET_RANGE;
    CONFIG.TRAINING_AIMING_HELPER = settings.TRAINING_AIMING_HELPER !== undefined ? settings.TRAINING_AIMING_HELPER : CONFIG.TRAINING_AIMING_HELPER;
    
    CONFIG.DRONE_SIZE = settings.DRONE_SIZE !== undefined ? settings.DRONE_SIZE : CONFIG.DRONE_SIZE;
    CONFIG.DRONE_SPEED = settings.DRONE_SPEED !== undefined ? settings.DRONE_SPEED : CONFIG.DRONE_SPEED;
    CONFIG.DRONE_ORBIT_DISTANCE = settings.DRONE_ORBIT_DISTANCE !== undefined ? settings.DRONE_ORBIT_DISTANCE : CONFIG.DRONE_ORBIT_DISTANCE;
    CONFIG.DRONE_HEALTH = settings.DRONE_HEALTH !== undefined ? settings.DRONE_HEALTH : CONFIG.DRONE_HEALTH;
    CONFIG.DRONE_RELOAD_TIME = settings.DRONE_RELOAD_TIME !== undefined ? settings.DRONE_RELOAD_TIME : CONFIG.DRONE_RELOAD_TIME;
    CONFIG.DRONE_BULLET_SPEED = settings.DRONE_BULLET_SPEED !== undefined ? settings.DRONE_BULLET_SPEED : CONFIG.DRONE_BULLET_SPEED;
    CONFIG.DRONE_BULLET_SIZE = settings.DRONE_BULLET_SIZE !== undefined ? settings.DRONE_BULLET_SIZE : CONFIG.DRONE_BULLET_SIZE;
    CONFIG.DRONE_TARGET_RANGE = settings.DRONE_TARGET_RANGE !== undefined ? settings.DRONE_TARGET_RANGE : CONFIG.DRONE_TARGET_RANGE;
    CONFIG.DRONE_ORBIT_SPEED = settings.DRONE_ORBIT_SPEED !== undefined ? settings.DRONE_ORBIT_SPEED : CONFIG.DRONE_ORBIT_SPEED;
    
    CONFIG.ALLOWED_POWERUP_TYPES = settings.ALLOWED_POWERUP_TYPES !== undefined ? settings.ALLOWED_POWERUP_TYPES : CONFIG.ALLOWED_POWERUP_TYPES;
    CONFIG.ALLOWED_HAZARD_TYPES = settings.ALLOWED_HAZARD_TYPES !== undefined ? settings.ALLOWED_HAZARD_TYPES : CONFIG.ALLOWED_HAZARD_TYPES;
    
    // Re-initialize input handler and AI system with updated CONFIG
    inputHandler.initialize(CONFIG);
    aiSystem.initialize(CONFIG, gameState);
}

// Load settings from localStorage on startup
function loadSettingsFromStorage() {
    const savedSettings = localStorage.getItem('tankGameSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        updateSettingsFromPopup(settings);
    }
}

function loadCurrentSettings() {
    document.getElementById('tankSpeed').value = TANK_SPEED;
    document.getElementById('tankTurnSpeed').value = TANK_TURN_SPEED;
    document.getElementById('tankSize').value = TANK_SIZE;
    document.getElementById('specialAmmo').value = CONFIG.TANK_MAX_SPECIAL_AMMO;
    document.getElementById('reloadTime').value = CONFIG.TANK_RELOAD_TIME;
    
    document.getElementById('bulletSpeed').value = BULLET_SPEED;
    document.getElementById('bulletSize').value = BULLET_SIZE;
    document.getElementById('bulletLifetime').value = BULLET_LIFETIME;
    
    document.getElementById('powerupCount').value = CONFIG.POWERUP_COUNT;
    document.getElementById('powerupSize').value = POWERUP_SIZE;
    document.getElementById('powerupRespawn').value = CONFIG.POWERUP_RESPAWN_TIME;
    
    document.getElementById('gracePeriod').value = CONFIG.GRACE_PERIOD;
    document.getElementById('aiCount').value = CONFIG.AI_TANK_COUNT;
    
    document.getElementById('ringWarning').value = CONFIG.RING_WARNING_TIME / 1000;
    document.getElementById('ringSafeZone').value = CONFIG.RING_MIN_RADIUS_MULT * 100;
    
    // Load training mode settings
    document.getElementById('trainingStationaryTargets').value = CONFIG.TRAINING_STATIONARY_TARGETS;
    document.getElementById('trainingMovingTargets').value = CONFIG.TRAINING_MOVING_TARGETS;
    document.getElementById('trainingTargetHealth').value = CONFIG.TRAINING_TARGET_HEALTH;
    document.getElementById('trainingTargetSize').value = CONFIG.TRAINING_TARGET_SIZE;
    document.getElementById('trainingTargetRespawn').value = CONFIG.TRAINING_TARGET_RESPAWN_TIME;
    document.getElementById('trainingMovingSpeed').value = CONFIG.TRAINING_MOVING_TARGET_SPEED;
    document.getElementById('trainingMovingRange').value = CONFIG.TRAINING_MOVING_TARGET_RANGE;
    
    // Load drone settings
    document.getElementById('droneSize').value = CONFIG.DRONE_SIZE;
    document.getElementById('droneSpeed').value = CONFIG.DRONE_SPEED;
    document.getElementById('droneOrbitDistance').value = CONFIG.DRONE_ORBIT_DISTANCE;
    document.getElementById('droneHealth').value = CONFIG.DRONE_HEALTH;
    document.getElementById('droneReloadTime').value = CONFIG.DRONE_RELOAD_TIME;
    document.getElementById('droneBulletSpeed').value = CONFIG.DRONE_BULLET_SPEED;
    document.getElementById('droneBulletSize').value = CONFIG.DRONE_BULLET_SIZE;
    document.getElementById('droneTargetRange').value = CONFIG.DRONE_TARGET_RANGE;
    document.getElementById('droneOrbitSpeed').value = CONFIG.DRONE_ORBIT_SPEED;
    
    // Load player color settings
    document.getElementById('player1Color').value = PLAYER1_COLOR;
    document.getElementById('player2Color').value = PLAYER2_COLOR;
    document.getElementById('player1SecondaryColor').value = PLAYER1_SECONDARY_COLOR;
    document.getElementById('player2SecondaryColor').value = PLAYER2_SECONDARY_COLOR;
    
    // Load power-up type settings
    Object.keys(CONFIG.POWERUP_TYPES).forEach(type => {
        const checkbox = document.getElementById(`powerup_${type}`);
        if (checkbox) {
            checkbox.checked = CONFIG.POWERUP_TYPES[type].enabled;
        }
    });
}

function applySettings() {
    // Update tank properties
    TANK_SPEED = parseFloat(document.getElementById('tankSpeed').value);
    TANK_TURN_SPEED = parseFloat(document.getElementById('tankTurnSpeed').value);
    TANK_SIZE = parseInt(document.getElementById('tankSize').value);
    CONFIG.TANK_MAX_SPECIAL_AMMO = parseInt(document.getElementById('specialAmmo').value);
    CONFIG.TANK_RELOAD_TIME = parseInt(document.getElementById('reloadTime').value);
    
    // Update bullet properties
    BULLET_SPEED = parseFloat(document.getElementById('bulletSpeed').value);
    BULLET_SIZE = parseInt(document.getElementById('bulletSize').value);
    BULLET_LIFETIME = parseInt(document.getElementById('bulletLifetime').value);
    
    // Update power-up properties
    CONFIG.POWERUP_COUNT = parseInt(document.getElementById('powerupCount').value);
    POWERUP_SIZE = parseInt(document.getElementById('powerupSize').value);
    CONFIG.POWERUP_RESPAWN_TIME = parseInt(document.getElementById('powerupRespawn').value);
    
    // Update game mechanics
    CONFIG.GRACE_PERIOD = parseInt(document.getElementById('gracePeriod').value);
    CONFIG.AI_TANK_COUNT = parseInt(document.getElementById('aiCount').value);
    
    // Update ring of fire
    CONFIG.RING_WARNING_TIME = parseInt(document.getElementById('ringWarning').value) * 1000;
    CONFIG.RING_MIN_RADIUS_MULT = parseFloat(document.getElementById('ringSafeZone').value) / 100;
    
    // Update training mode settings
    CONFIG.TRAINING_STATIONARY_TARGETS = parseInt(document.getElementById('trainingStationaryTargets').value);
    CONFIG.TRAINING_MOVING_TARGETS = parseInt(document.getElementById('trainingMovingTargets').value);
    CONFIG.TRAINING_TARGET_HEALTH = parseInt(document.getElementById('trainingTargetHealth').value);
    CONFIG.TRAINING_TARGET_SIZE = parseInt(document.getElementById('trainingTargetSize').value);
    CONFIG.TRAINING_TARGET_RESPAWN_TIME = parseInt(document.getElementById('trainingTargetRespawn').value);
    CONFIG.TRAINING_MOVING_TARGET_SPEED = parseFloat(document.getElementById('trainingMovingSpeed').value);
    CONFIG.TRAINING_MOVING_TARGET_RANGE = parseInt(document.getElementById('trainingMovingRange').value);
    CONFIG.TRAINING_AIMING_HELPER = document.getElementById('trainingAimingHelper').checked;
    
    // Update drone settings
    CONFIG.DRONE_SIZE = parseInt(document.getElementById('droneSize').value);
    CONFIG.DRONE_SPEED = parseFloat(document.getElementById('droneSpeed').value);
    CONFIG.DRONE_ORBIT_DISTANCE = parseInt(document.getElementById('droneOrbitDistance').value);
    CONFIG.DRONE_HEALTH = parseInt(document.getElementById('droneHealth').value);
    CONFIG.DRONE_RELOAD_TIME = parseInt(document.getElementById('droneReloadTime').value);
    CONFIG.DRONE_BULLET_SPEED = parseFloat(document.getElementById('droneBulletSpeed').value);
    CONFIG.DRONE_BULLET_SIZE = parseInt(document.getElementById('droneBulletSize').value);
    CONFIG.DRONE_TARGET_RANGE = parseInt(document.getElementById('droneTargetRange').value);
    CONFIG.DRONE_ORBIT_SPEED = parseFloat(document.getElementById('droneOrbitSpeed').value);
    
    // Update player colors
    PLAYER1_COLOR = document.getElementById('player1Color').value;
    PLAYER2_COLOR = document.getElementById('player2Color').value;
    
    // Send updated colors to controllers
    if (remoteInputHandler) {
        remoteInputHandler.sendPlayerColorUpdate(1, PLAYER1_COLOR);
        remoteInputHandler.sendPlayerColorUpdate(2, PLAYER2_COLOR);
    }
    PLAYER1_SECONDARY_COLOR = document.getElementById('player1SecondaryColor').value;
    PLAYER2_SECONDARY_COLOR = document.getElementById('player2SecondaryColor').value;
    
    // Update power-up type settings
    Object.keys(CONFIG.POWERUP_TYPES).forEach(type => {
        const checkbox = document.getElementById(`powerup_${type}`);
        if (checkbox) {
            CONFIG.POWERUP_TYPES[type].enabled = checkbox.checked;
        }
    });
    
    hideSettings();
}

function resetToDefaults() {
    // Reset all values to original CONFIG values
    TANK_SIZE = CONFIG.TANK_SIZE;
    TANK_SPEED = CONFIG.TANK_SPEED;
    TANK_TURN_SPEED = CONFIG.TANK_TURN_SPEED;
    BULLET_SPEED = CONFIG.BULLET_SPEED;
    BULLET_SIZE = CONFIG.BULLET_SIZE;
    BULLET_LIFETIME = CONFIG.BULLET_LIFETIME;
    POWERUP_SIZE = CONFIG.POWERUP_SIZE;
    
    // Reset player colors to defaults
    PLAYER1_COLOR = '#4CAF50';
    PLAYER2_COLOR = '#ff9800';
    PLAYER1_SECONDARY_COLOR = '#2E7D32';
    PLAYER2_SECONDARY_COLOR = '#E65100';
    
    // Reload the form with default values
    loadCurrentSettings();
}

// Ammo Guide Functions (toggleAmmoGuide, hideAmmoGuide) moved to menu.js

// Return to main menu function
function returnToMainMenu() {
    // Navigate back to menu page
    window.location.href = 'menu.html';
}
