// MODULAR GAME SYSTEM
// Core game logic has been modularized. Legacy global variables are mapped
// to the new modular system via core-bundle.js for backward compatibility.

const canvas = document.getElementById(DOM_ELEMENTS.canvas);
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById(DOM_ELEMENTS.startScreen);
const scoreBoard = document.getElementById(DOM_ELEMENTS.scoreBoard);
const controls = document.getElementById(DOM_ELEMENTS.controls);

let gameMode = 0;
let gameRunning = false;
let mapSize = 'medium'; // 'small', 'medium', 'large'
let mapSizes = MAP_SIZES;
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
let scores = {};
let kills = {}; // Track kills for each player
let ringOfFire = null;
let roundStartTime = 0;
let roundResetting = false;
let gameWinner = null;
let graceTimer = 0;

// Terrain system variables
let terrainTiles = [];
let terrainFeatures = [];
let terrainCanvas = null;
let terrainCtx = null;
let terrainCached = false;
let obstacleTiles = [];

// Underground tunnel system
let tunnelEntrances = [];
let tunnelNetwork = new Map(); // Maps entrance IDs to connected entrances
let teleportEffects = []; // Visual effects for teleportation

// Background and obstacle images
let grassImage = new Image();
grassImage.src = ASSETS.images.grass;
let grassLoaded = false;
grassImage.onload = () => { grassLoaded = true; };

let wallImage = new Image();
wallImage.src = ASSETS.images.wall;
let wallLoaded = false;
wallImage.onload = () => { wallLoaded = true; };

let waterImage = new Image();
waterImage.src = ASSETS.images.water;
let waterLoaded = false;
waterImage.onload = () => { 
    waterLoaded = true; 
};

let sandImage = new Image();
sandImage.src = ASSETS.images.sand;
let sandLoaded = false;
sandImage.onload = () => { sandLoaded = true; };

// Player colors (can be modified by settings)
let PLAYER1_COLOR = DEFAULT_COLORS.PLAYER1_COLOR;
let PLAYER2_COLOR = DEFAULT_COLORS.PLAYER2_COLOR;
let PLAYER1_SECONDARY_COLOR = DEFAULT_COLORS.PLAYER1_SECONDARY_COLOR;
let PLAYER2_SECONDARY_COLOR = DEFAULT_COLORS.PLAYER2_SECONDARY_COLOR;

// Camera/Zoom system for winner effect
let camera = {
    scale: 1.0,
    targetScale: 1.0,
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    isZooming: false,
    zoomStartTime: 0,
    shakeAmount: 0,
    shakeX: 0,
    shakeY: 0
};

// Use CONFIG values (can be modified by settings)
let TANK_SIZE = CONFIG.TANK_SIZE;
let TANK_SPEED = CONFIG.TANK_SPEED;
let TANK_TURN_SPEED = CONFIG.TANK_TURN_SPEED;
let BULLET_SPEED = CONFIG.BULLET_SPEED;
let BULLET_SIZE = CONFIG.BULLET_SIZE;
let BULLET_LIFETIME = CONFIG.BULLET_LIFETIME;
let POWERUP_SIZE = CONFIG.POWERUP_SIZE;
let TILE_SIZE = TERRAIN.TILE_SIZE;

// Initialize AI system
const aiSystem = new AIBehavior();

// Initialize Remote Input Handler
const remoteInputHandler = new RemoteInputHandler();

// Initialize Input system
const inputHandler = new InputHandler();

// Game state object for AI (now managed by GameState class)
// gameState is initialized in core-bundle.js

// Bullet class moved to src/game/entities/entities-bundle.js

// Bullet class implementation removed to avoid conflicts with bundle files
// The proper Bullet class is loaded from the entities bundle


// Wall, DestructibleWall, and Gate classes moved to src/game/obstacles/obstacles-bundle.js



// Mine class moved to src/game/entities/entities-bundle.js

// Target class moved to src/game/entities/entities-bundle.js

// Drone class moved to src/game/entities/entities-bundle.js

// RingOfFire class moved to src/game/effects/effects-bundle.js


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
            if (x - 15 < wall.x + wall.width &&
                x + 15 > wall.x &&
                y - 15 < wall.y + wall.height &&
                y + 15 > wall.y) {
                validPosition = false;
                break;
            }
        }
    }
    
    return validPosition ? { x, y } : { x: 100 + Math.random() * (canvas.width - 200), y: 100 + Math.random() * (canvas.height - 200) };
}

// Bullet class moved to src/game/entities/entities-bundle.js

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

function generateSafeItemPosition() {
    let validPosition = false;
    let x, y;
    let attempts = 0;
    
    while (!validPosition && attempts < 100) {
        x = Math.random() * (canvas.width - 100) + 50;
        y = Math.random() * (canvas.height - 100) + 50;
        validPosition = true;
        
        // Check not on walls
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
                            return false; // Remove bullet
                        }
                    }
                } else {
                    // Regular indestructible wall
                    if (this.type === 'piercing' && this.pierced < this.maxPiercing) {
                        // Piercing bullets go through walls
                        this.pierced++;
                        // Create piercing effect
                        for (let i = 0; i < 5; i++) {
                            particles.push(new Particle(this.x, this.y, '#9966FF'));
                        }
                    } else if (this.type === 'explosive' || this.type === 'rocket') {
                        // Explosive bullets explode on wall contact
                        if (this.type === 'explosive') {
                            this.createExplosion();
                        } else {
                            this.createBigExplosion();
                        }
                        return false; // Remove bullet after explosion
                    } else {
                        this.bounceOffWall(wall);
                    }
                }
            }
        }
        
        // Check obstacle tile collisions
        for (let tile of obstacleTiles) {
            // Water doesn't block bullets
            if (tile.type === 'water') continue;
            
            const tileLeft = tile.x * TILE_SIZE;
            const tileRight = tileLeft + TILE_SIZE;
            const tileTop = tile.y * TILE_SIZE;
            const tileBottom = tileTop + TILE_SIZE;
            
            if (this.x + this.size > tileLeft && 
                this.x - this.size < tileRight &&
                this.y + this.size > tileTop && 
                this.y - this.size < tileBottom) {
                
                if (this.type === 'piercing' && this.pierced < this.maxPiercing) {
                    // Piercing bullets go through obstacles
                    this.pierced++;
                    // Create piercing effect
                    for (let i = 0; i < 5; i++) {
                        particles.push(new Particle(this.x, this.y, '#9966FF'));
                    }
                } else if (this.type === 'explosive' || this.type === 'rocket') {
                    // Explosive bullets explode on obstacle contact
                    if (this.type === 'explosive') {
                        this.createExplosion();
                    } else {
                        this.createBigExplosion();
                    }
                    return false; // Remove bullet after explosion
                } else {
                    // Bounce off obstacle tile
                    const tileCenterX = tileLeft + TILE_SIZE / 2;
                    const tileCenterY = tileTop + TILE_SIZE / 2;
                    const dx = this.x - tileCenterX;
                    const dy = this.y - tileCenterY;
                    
                    if (Math.abs(dx) > Math.abs(dy)) {
                        this.angle = Math.PI - this.angle;
                    } else {
                        this.angle = -this.angle;
                    }
                }
            }
        }
        
        this.lifetime--;
        return this.lifetime > 0;
    }
    
    checkWallCollision(wall) {
        // Piercing bullets ignore wall collisions completely
        if (this.type === 'piercing') {
            return false;
        }
        
        return this.x + this.size > wall.x && 
               this.x - this.size < wall.x + wall.width &&
               this.y + this.size > wall.y && 
               this.y - this.size < wall.y + wall.height;
    }
    
    bounceOffWall(wall) {
        const centerX = wall.x + wall.width / 2;
        const centerY = wall.y + wall.height / 2;
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        
        if (Math.abs(dx) / wall.width > Math.abs(dy) / wall.height) {
            this.angle = Math.PI - this.angle;
            this.x = dx > 0 ? wall.x + wall.width + this.size : wall.x - this.size;
        } else {
            this.angle = -this.angle;
            this.y = dy > 0 ? wall.y + wall.height + this.size : wall.y - this.size;
        }
    }
    
    checkTankCollision(tank) {
        if (!tank.alive) return false;
        const distance = Math.sqrt((this.x - tank.x) ** 2 + (this.y - tank.y) ** 2);
        
        if (distance < TANK_SIZE) {
            // Apply special effects based on bullet type
            this.applySpecialEffect(tank);
            return true;
        }
        return false;
    }
    
    checkTargetCollision(target) {
        if (target.destroyed) return false;
        const distance = Math.sqrt((this.x - target.x) ** 2 + (this.y - target.y) ** 2);
        
        if (distance < target.size) {
            return true;
        }
        return false;
    }
    
    applySpecialEffect(tank) {
        switch(this.type) {
            case 'explosive':
                // Create explosion damage area
                this.createExplosion();
                break;
            case 'rocket':
                // Bigger explosion and screen shake
                this.createBigExplosion();
                break;
        }
    }
    
    createExplosion() {
        // Create explosion at impact point
        explosions.push(new Explosion(this.x, this.y));
        
        // Damage nearby tanks
        tanks.forEach(tank => {
            if (!tank.alive) return;
            const distance = Math.sqrt((this.x - tank.x) ** 2 + (this.y - tank.y) ** 2);
            if (distance < 60) { // Explosion radius
                tank.destroy();
            }
        });
        
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            particles.push(new Particle(this.x, this.y, '#FF3333'));
        }
    }
    
    createBigExplosion() {
        // Bigger explosion for rockets
        explosions.push(new Explosion(this.x, this.y));
        
        // Larger damage radius
        tanks.forEach(tank => {
            if (!tank.alive) return;
            const distance = Math.sqrt((this.x - tank.x) ** 2 + (this.y - tank.y) ** 2);
            if (distance < 80) { // Bigger explosion radius
                tank.destroy();
            }
        });
        
        // More particles
        for (let i = 0; i < 30; i++) {
            particles.push(new Particle(this.x, this.y, '#FF6600'));
        }
    }
    
    draw() {
        // Calculate positions where bullet needs to be drawn (for edge wrapping)
        const positions = [];
        positions.push({ x: this.x, y: this.y }); // Main position
        
        // Check if bullet needs to be drawn on opposite edges
        if (this.x < this.size * 2) {
            positions.push({ x: this.x + canvas.width, y: this.y });
        } else if (this.x > canvas.width - this.size * 2) {
            positions.push({ x: this.x - canvas.width, y: this.y });
        }
        
        if (this.y < this.size * 2) {
            positions.push({ x: this.x, y: this.y + canvas.height });
        } else if (this.y > canvas.height - this.size * 2) {
            positions.push({ x: this.x, y: this.y - canvas.height });
        }
        
        // Check corners
        if (this.x < this.size * 2 && this.y < this.size * 2) {
            positions.push({ x: this.x + canvas.width, y: this.y + canvas.height });
        } else if (this.x > canvas.width - this.size * 2 && this.y < this.size * 2) {
            positions.push({ x: this.x - canvas.width, y: this.y + canvas.height });
        } else if (this.x < this.size * 2 && this.y > canvas.height - this.size * 2) {
            positions.push({ x: this.x + canvas.width, y: this.y - canvas.height });
        } else if (this.x > canvas.width - this.size * 2 && this.y > canvas.height - this.size * 2) {
            positions.push({ x: this.x - canvas.width, y: this.y - canvas.height });
        }
        
        // Draw bullet at all necessary positions
        positions.forEach(pos => {
            this.drawBulletAt(pos.x, pos.y);
        });
    }
    
    drawBulletAt(drawX, drawY) {
        ctx.save();
        
        // Store original position temporarily
        const originalX = this.x;
        const originalY = this.y;
        this.x = drawX;
        this.y = drawY;
        
        // Different visual effects for each bullet type
        switch(this.type) {
            case 'scatter':
                this.drawScatterBullet();
                break;
            case 'laser':
                this.drawLaserBullet();
                break;
            case 'rocket':
                this.drawRocketBullet();
                break;
            case 'explosive':
                this.drawExplosiveBullet();
                break;
            case 'piercing':
                this.drawPiercingBullet();
                break;
            default:
                this.drawRegularBullet();
                break;
        }
        
        // Restore original position
        this.x = originalX;
        this.y = originalY;
        
        ctx.restore();
    }
    
    drawRegularBullet() {
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 8;
        
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.7, '#ffeeaa');
        gradient.addColorStop(1, '#ff9900');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawScatterBullet() {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
        
        // Sparkling effect
        const sparkle = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 215, 0, ${0.8 + sparkle * 0.2})`;
        
        // Star shape
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const x = this.x + Math.cos(angle) * this.size;
            const y = this.y + Math.sin(angle) * this.size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Inner glow
        ctx.fillStyle = '#FFFF88';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawLaserBullet() {
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        
        // Laser beam effect
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = this.size * 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(this.x - Math.cos(this.angle) * 30, this.y - Math.sin(this.angle) * 30);
        ctx.lineTo(this.x + Math.cos(this.angle) * 10, this.y + Math.sin(this.angle) * 10);
        ctx.stroke();
        
        // Core beam
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = this.size;
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Pulse effect
        const pulse = Math.sin(Date.now() * 0.05) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * pulse, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawRocketBullet() {
        ctx.shadowColor = '#FF6600';
        ctx.shadowBlur = 12;
        
        // Rocket body
        ctx.fillStyle = '#666';
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillRect(-this.size, -this.size/2, this.size * 2, this.size);
        
        // Rocket tip
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(this.size * 0.5, -this.size/2);
        ctx.lineTo(this.size * 0.5, this.size/2);
        ctx.closePath();
        ctx.fill();
        
        // Flame trail
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.moveTo(-this.size, -this.size/3);
        ctx.lineTo(-this.size * 2, 0);
        ctx.lineTo(-this.size, this.size/3);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFAA00';
        ctx.beginPath();
        ctx.moveTo(-this.size, -this.size/4);
        ctx.lineTo(-this.size * 1.5, 0);
        ctx.lineTo(-this.size, this.size/4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    
    drawExplosiveBullet() {
        ctx.shadowColor = '#FF3333';
        ctx.shadowBlur = 15;
        
        // Pulsing bomb
        const pulse = Math.sin(Date.now() * 0.1) * 0.3 + 0.7;
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Danger stripes
        ctx.strokeStyle = '#FF3333';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2) / 3;
            ctx.beginPath();
            ctx.moveTo(this.x + Math.cos(angle) * this.size * 0.5, this.y + Math.sin(angle) * this.size * 0.5);
            ctx.lineTo(this.x + Math.cos(angle) * this.size * pulse, this.y + Math.sin(angle) * this.size * pulse);
            ctx.stroke();
        }
        
        // Blinking fuse
        if (Math.floor(Date.now() / 200) % 2) {
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(this.x, this.y - this.size * 0.8, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawPiercingBullet() {
        ctx.shadowColor = '#9966FF';
        ctx.shadowBlur = 10;
        
        // Arrow shape
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Arrow body
        ctx.fillStyle = '#9966FF';
        ctx.fillRect(-this.size, -this.size/3, this.size * 1.5, this.size * 2/3);
        
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(this.size * 0.5, 0);
        ctx.lineTo(this.size * -0.5, -this.size);
        ctx.lineTo(this.size * -0.5, this.size);
        ctx.closePath();
        ctx.fill();
        
        // Energy trail
        ctx.strokeStyle = '#BB88FF';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(-this.size * 2, 0);
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        ctx.restore();
    }
    
}

// Wall, DestructibleWall, and Gate classes moved to src/game/obstacles/obstacles-bundle.js


// PowerUp class moved to src/game/entities/entities-bundle.js

// Particle, SmokeParticle, and Explosion classes moved to src/game/effects/effects-bundle.js

// Mine class moved to src/game/entities/entities-bundle.js

// Target class moved to src/game/entities/entities-bundle.js

// Drone class moved to src/game/entities/entities-bundle.js

// RingOfFire class moved to src/game/effects/effects-bundle.js


function generateSafeItemPosition() {
    let validPosition = false;
    let x, y;
    let attempts = 0;
    
    while (!validPosition && attempts < 100) {
        x = Math.random() * (canvas.width - 100) + 50;
        y = Math.random() * (canvas.height - 100) + 50;
        validPosition = true;
        
        // Check not on walls
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
                if (tank.alive) {
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
    const progress = Math.min(elapsed / CONFIG.WINNER_ZOOM_TRANSITION_TIME, 1.0);
    
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


// selectMapSize function moved to menu.js

// startGame function moved to menu.js

function init() {
    tanks = [];
    bullets = [];
    particles = [];
    powerUps = [];
    drones = [];
    targets = [];
    
    // Set grace period (3 seconds at 60fps)
    graceTimer = 180;
    
    // Initialize ring of fire
    ringOfFire = new RingOfFire();
    
    // Initialize game systems
    aiSystem.initialize(CONFIG, gameState);
    inputHandler.initialize(CONFIG);
    
    // Set the shared remote input handler
    if (inputHandler.remoteHandler) {
        // Replace with our global instance that can send color updates
        inputHandler.remoteHandler = remoteInputHandler;
    }
    remoteInputHandler.connect();
    
    // Generate terrain for battlefield
    generateTerrainTiles();
    
    
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
    
    if (gameMode === 0) {
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
    } else if (gameMode === 1) {
        // Add AI tanks in single player mode
        const aiColors = ['#ff9800', '#9c27b0', '#f44336', '#e91e63', '#2196f3', '#ff5722', '#795548'];
        
        for (let i = 0; i < CONFIG.AI_TANK_COUNT; i++) {
            const aiPos = generateSafeSpawnPosition();
            const aiTank = new Tank(aiPos.x, aiPos.y, aiColors[i % aiColors.length], {}, i + 2);
            aiTank.isAI = true;
            tanks.push(aiTank);
        }
    } else {
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
    createScoreBoard();
    
    gameLoop();
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
                                tank.destroy(bullet.owner);
                                return false;
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
    // Clear all bullets, particles, explosions and mines
    bullets = [];
    particles = [];
    explosions = [];
    mines = [];
    
    // Set grace period (3 seconds at 60fps)
    graceTimer = 180;
    
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

function gameLoop() {
    // Use the new modular game loop if available, otherwise fallback to legacy
    if (typeof window.gameLoop !== 'undefined' && window.gameLoop.isRunning) {
        // The modular system handles its own loop
        return;
    }
    
    try {
        if (!gameRunning) return;
        
        update();
        draw();
        requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error('[GAME LOOP ERROR] Critical error in main game loop:', error);
        console.error('Stack trace:', error.stack);
        
        // Try to continue the game loop to prevent complete freeze
        try {
            requestAnimationFrame(gameLoop);
        } catch (retryError) {
            console.error('[GAME LOOP ERROR] Failed to restart game loop:', retryError);
        }
    }
}


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
