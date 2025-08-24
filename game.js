const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const scoreBoard = document.getElementById('scoreBoard');
const controls = document.getElementById('controls');

let gameMode = 0;
let gameRunning = false;
let mapSize = 'medium'; // 'small', 'medium', 'large'
let mapSizes = {
    small: { width: 800, height: 600 },
    medium: { width: 1200, height: 800 },
    large: { width: 1600, height: 1000 }
};
let tanks = [];
let bullets = [];
let walls = [];
let gates = [];
let powerUps = [];
let particles = [];
// Collectibles removed - no longer needed
let explosions = [];
let mines = [];
let drones = [];
let targets = [];
let scores = {};
let kills = {}; // Track kills for each player
// let points = {}; // Removed points system
let ringOfFire = null;
let roundStartTime = 0;
let roundResetting = false;
let gameWinner = null;
let graceTimer = 0;
// Collectible spawn timer removed - no longer needed

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
grassImage.src = './assets/images/grass.png';
let grassLoaded = false;
grassImage.onload = () => { grassLoaded = true; };

let wallImage = new Image();
wallImage.src = './assets/images/wall.png';
let wallLoaded = false;
wallImage.onload = () => { wallLoaded = true; };

let waterImage = new Image();
waterImage.src = './assets/images/water.png';
let waterLoaded = false;
waterImage.onload = () => { 
    waterLoaded = true; 
};

let sandImage = new Image();
sandImage.src = './assets/images/sand.png';
let sandLoaded = false;
sandImage.onload = () => { sandLoaded = true; };

// Player colors (can be modified by settings)
let PLAYER1_COLOR = '#4CAF50';
let PLAYER2_COLOR = '#ff9800';
let PLAYER1_SECONDARY_COLOR = '#2E7D32';
let PLAYER2_SECONDARY_COLOR = '#E65100';

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
let TILE_SIZE = 64;

// Initialize AI system
const aiSystem = new AIBehavior();

// Initialize Remote Input Handler
const remoteInputHandler = new RemoteInputHandler();

// Initialize Input system
const inputHandler = new InputHandler();

// Game state object for AI
const gameState = {
    get tanks() { return tanks; },
    get walls() { return walls; },
    get powerUps() { return powerUps; },
    get bullets() { return bullets; },
    shootBullet: function(tank) {
        tank.shoot();
    }
};

class Tank {
    constructor(x, y, color, controls, playerNum, secondaryColor = null) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.color = color;
        this.secondaryColor = secondaryColor || this.generateDefaultSecondaryStatic(color);
        this.controls = controls;
        this.playerNum = playerNum;
        this.alive = true;
        this.speed = 0;
        this.turnSpeed = 0;
        this.reloadTime = 0;
        this.powerUp = null;
        this.powerUpTime = 0;
        this.specialAmmo = 0; // Special power-up ammo
        this.maxSpecialAmmo = CONFIG.TANK_MAX_SPECIAL_AMMO;
        this.drone = null; // Combat drone
        this.isAI = false;
        this.aiTarget = null;
        this.aiShootTimer = 0;
        this.frozen = false;
        this.frozenTime = 0;
        
        // Animation properties
        this.wheelRotation = 0;
        this.treadOffset = 0;
        this.engineBob = 0;
        this.lastX = x;
        this.lastY = y;
        this.isMoving = false;
        
        // Pickup notification
        this.pickupNotification = null;
        this.pickupTimer = 0;
        
        // Trail system
        this.trail = [];
        this.trailTimer = 0;
        this.trailInterval = 3; // Add trail point every 3 frames
        this.maxTrailLength = 30; // Maximum trail points
        
        // Underground state
        this.isUnderground = false;
        this.currentTunnelId = null;
        this.undergroundAlpha = 1.0; // For fade effect
        this.tunnelCooldown = 0; // Prevent immediate re-teleportation
    }
    
    generateDefaultSecondaryStatic(primaryColor) {
        // Generate a complementary darker color for secondary (static version)
        if (!primaryColor) return '#333333'; // fallback
        const hex = primaryColor.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    update() {
        if (!this.alive) return;
        
        // Don't allow movement or actions during grace period
        if (graceTimer > 0) return;
        
        // Handle frozen state
        if (this.frozenTime > 0) {
            this.frozenTime--;
            if (this.frozenTime === 0) {
                this.frozen = false;
            }
        }
        
        // Don't allow movement if frozen
        if (this.frozen) {
            this.speed = 0;
            this.turnSpeed = 0;
        } else {
            if (this.isAI) {
                aiSystem.updateAI(this);
            } else {
                inputHandler.handleTankInput(this);
            }
        }
        
        // Check if tank is on sand terrain for speed reduction
        let speedModifier = 1.0;
        const gridX = Math.floor(this.x / TILE_SIZE);
        const gridY = Math.floor(this.y / TILE_SIZE);
        
        // Check if current position is on sand
        const currentTileIndex = gridY * Math.ceil(canvas.width / TILE_SIZE) + gridX;
        if (currentTileIndex >= 0 && currentTileIndex < terrainTiles.length) {
            if (terrainTiles[currentTileIndex].type === 'sand') {
                speedModifier = 0.75; // Reduce speed to 75% on sand
            }
        }
        
        let newX = this.x + Math.cos(this.angle) * this.speed * speedModifier;
        let newY = this.y + Math.sin(this.angle) * this.speed * speedModifier;
        
        // Screen wrapping logic - allow tank to go partially off-screen
        if (newX < -TANK_SIZE) {
            newX = canvas.width + TANK_SIZE;
        } else if (newX > canvas.width + TANK_SIZE) {
            newX = -TANK_SIZE;
        }
        
        if (newY < -TANK_SIZE) {
            newY = canvas.height + TANK_SIZE;
        } else if (newY > canvas.height + TANK_SIZE) {
            newY = -TANK_SIZE;
        }
        
        // Check for tunnel entrance/exit
        // this.checkTunnelTransition(); // DISABLED FOR NOW
        
        // Only move if no wall collision
        if (!this.checkWallCollision(newX, newY)) {
            this.x = newX;
            this.y = newY;
        } else {
            // Try moving only on X axis
            if (!this.checkWallCollision(newX, this.y)) {
                this.x = newX;
            }
            // Try moving only on Y axis
            else if (!this.checkWallCollision(this.x, newY)) {
                this.y = newY;
            }
        }
        
        this.angle += this.turnSpeed;
        
        // Update animation properties
        const distanceMoved = Math.sqrt((this.x - this.lastX) ** 2 + (this.y - this.lastY) ** 2);
        this.isMoving = distanceMoved > 0.1;
        
        if (this.isMoving) {
            // Animate wheel rotation based on movement
            this.wheelRotation += distanceMoved * 0.2;
            this.treadOffset += distanceMoved * 0.3;
            
            // Engine bob effect when moving
            this.engineBob = Math.sin(Date.now() * 0.02) * 0.5;
        } else {
            this.engineBob *= 0.9; // Gradual stop
        }
        
        this.lastX = this.x;
        this.lastY = this.y;
        
        // Update trail
        this.updateTrail();
        
        // Update pickup notification
        if (this.pickupTimer > 0) {
            this.pickupTimer--;
            if (this.pickupTimer === 0) {
                this.pickupNotification = null;
            }
        }
        
        if (this.reloadTime > 0) this.reloadTime--;
        if (this.powerUpTime > 0) {
            this.powerUpTime--;
            if (this.powerUpTime === 0) {
                this.powerUp = null;
            }
        }
    }
    
    
    updateAI() {
        if (!this.aiState) {
            this.aiState = {
                mode: 'hunt',
                strafingDirection: Math.random() > 0.5 ? 1 : -1,
                lastDirectionChange: 0,
                powerUpTarget: null,
                wallAvoidanceAngle: 0,
                lastShot: 0
            };
        }

        // Find best target (prioritize by threat level)
        let bestTarget = this.findBestTarget();
        let nearestPowerUp = this.findNearestPowerUp();
        
        if (!bestTarget && !nearestPowerUp) return;

        // Decide AI mode based on situation
        this.decideAIMode(bestTarget, nearestPowerUp);
        
        // Execute behavior based on current mode
        switch (this.aiState.mode) {
            case 'hunt':
                this.huntBehavior(bestTarget);
                break;
            case 'powerup':
                this.powerUpBehavior(nearestPowerUp);
                break;
            case 'retreat':
                this.retreatBehavior(bestTarget);
                break;
            case 'strafe':
                this.strafeBehavior(bestTarget);
                break;
        }

        // Enhanced shooting logic
        this.aiShootTimer--;
        if (bestTarget && this.aiShootTimer <= 0) {
            this.smartShooting(bestTarget);
        }
    }

    findBestTarget() {
        let bestTarget = null;
        let bestScore = -1;
        
        tanks.forEach(t => {
            if (t !== this && t.alive) {
                const dist = Math.sqrt((t.x - this.x) ** 2 + (t.y - this.y) ** 2);
                let score = 1000 / dist; // Closer = higher priority
                
                // Prioritize targets with power-ups
                if (t.powerUp) score *= 1.5;
                
                // Prioritize low health targets
                if (t.health < 50) score *= 1.3;
                
                // Avoid targeting tanks behind walls unless we have piercing
                if (!this.checkClearShot(t) && this.powerUp !== 'piercing') {
                    score *= 0.3;
                }
                
                if (score > bestScore) {
                    bestScore = score;
                    bestTarget = t;
                }
            }
        });
        
        return bestTarget;
    }

    findNearestPowerUp() {
        if (this.powerUp) return null; // Already have one
        
        let nearest = null;
        let minDist = Infinity;
        
        powerUps.forEach(p => {
            const dist = Math.sqrt((p.x - this.x) ** 2 + (p.y - this.y) ** 2);
            if (dist < minDist && dist < 300) { // Only consider nearby power-ups
                minDist = dist;
                nearest = p;
            }
        });
        
        return nearest;
    }

    decideAIMode(target, powerUp) {
        const targetDist = target ? Math.sqrt((target.x - this.x) ** 2 + (target.y - this.y) ** 2) : Infinity;
        const powerUpDist = powerUp ? Math.sqrt((powerUp.x - this.x) ** 2 + (powerUp.y - this.y) ** 2) : Infinity;
        
        // Check for danger situations first (prioritize survival)
        const isLowHealth = this.health < 50;
        const isVeryLowHealth = this.health < 25;
        const nearWall = this.isNearWall();
        const inDangerousPosition = nearWall && targetDist < 150;
        
        // Survival takes priority - retreat if in danger
        if (isVeryLowHealth || inDangerousPosition || (isLowHealth && targetDist < 100)) {
            this.aiState.mode = 'retreat';
            return;
        }
        
        // Add randomness to decision making (reduced to 10% for more careful behavior)
        if (Math.random() < 0.1) {
            const randomModes = ['hunt', 'strafe'];
            this.aiState.mode = randomModes[Math.floor(Math.random() * randomModes.length)];
            return;
        }
        
        // Go for power-up if safe and beneficial
        if (powerUp && powerUpDist < 150 && targetDist > 200 && !nearWall) {
            this.aiState.mode = 'powerup';
        }
        // Strafe if at medium range and safe
        else if (target && targetDist > 100 && targetDist < 200 && !nearWall) {
            this.aiState.mode = 'strafe';
        }
        // Hunt if target is far or no other priority
        else {
            this.aiState.mode = 'hunt';
        }
    }

    huntBehavior(target) {
        if (!target) return;
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        let targetAngle = Math.atan2(dy, dx);
        
        // Add random jitter to movement (5% chance to act erratically)
        if (Math.random() < 0.05) {
            targetAngle += (Math.random() - 0.5) * Math.PI;
        }
        
        // Check for wall collision ahead
        const wallAvoidAngle = this.getWallAvoidanceAngle();
        const finalAngle = wallAvoidAngle !== 0 ? wallAvoidAngle : targetAngle;
        
        let angleDiff = finalAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Turn towards target or away from wall (reduced turning sensitivity)
        const turnThreshold = 0.1 + Math.random() * 0.05;
        if (Math.abs(angleDiff) > turnThreshold) {
            this.turnSpeed = (angleDiff > 0 ? TANK_TURN_SPEED : -TANK_TURN_SPEED) * 0.7;
        } else {
            this.turnSpeed = 0;
        }
        
        // Move forward aggressively but avoid walls (with speed variation)
        const speedVariation = 0.8 + Math.random() * 0.4; // 80% to 120% speed
        if (wallAvoidAngle === 0 && distance > 60) {
            this.speed = TANK_SPEED * speedVariation;
        } else if (wallAvoidAngle !== 0) {
            this.speed = TANK_SPEED * 0.7 * speedVariation;
        } else {
            // Random chance to back up or circle instead of just backing up
            if (Math.random() < 0.3) {
                this.speed = -TANK_SPEED * 0.5 * speedVariation;
            } else {
                // Circle around the target (less aggressive turning)
                this.angle += (Math.random() > 0.5 ? 1 : -1) * TANK_TURN_SPEED * 0.8;
                this.speed = TANK_SPEED * 0.6;
            }
        }
    }

    strafeBehavior(target) {
        if (!target) return;
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const targetAngle = Math.atan2(dy, dx);
        
        // Face the enemy (with reduced aim jitter and slower turning)
        let aimAngle = targetAngle + (Math.random() - 0.5) * 0.1;
        let angleDiff = aimAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        if (Math.abs(angleDiff) > 0.15) {
            this.turnSpeed = (angleDiff > 0 ? TANK_TURN_SPEED : -TANK_TURN_SPEED) * 0.6;
        } else {
            this.turnSpeed = 0;
        }
        
        // Strafe side to side (with more random timing)
        this.aiState.lastDirectionChange++;
        const changeInterval = 40 + Math.random() * 80; // More random timing
        if (this.aiState.lastDirectionChange > changeInterval) {
            this.aiState.strafingDirection *= -1;
            this.aiState.lastDirectionChange = 0;
            
            // 10% chance to do a random direction instead of just flipping
            if (Math.random() < 0.1) {
                this.aiState.strafingDirection = Math.random() > 0.5 ? 1 : -1;
            }
        }
        
        // Calculate strafe direction (perpendicular to target with less variation)
        const strafeAngle = targetAngle + (Math.PI / 2) * this.aiState.strafingDirection + (Math.random() - 0.5) * 0.1;
        const strafeDx = Math.cos(strafeAngle);
        const strafeDy = Math.sin(strafeAngle);
        
        // Check if strafe path is clear
        const checkX = this.x + strafeDx * 40;
        const checkY = this.y + strafeDy * 40;
        let canStrafe = true;
        
        for (let wall of walls) {
            if (checkX > wall.x && checkX < wall.x + wall.width &&
                checkY > wall.y && checkY < wall.y + wall.height) {
                canStrafe = false;
                break;
            }
        }
        
        if (canStrafe) {
            // Smoothly adjust angle instead of snapping to strafe angle
            let strafeAngleDiff = strafeAngle - this.angle;
            while (strafeAngleDiff > Math.PI) strafeAngleDiff -= Math.PI * 2;
            while (strafeAngleDiff < -Math.PI) strafeAngleDiff += Math.PI * 2;
            
            this.angle += strafeAngleDiff * 0.3; // Gradual turn towards strafe direction
            this.speed = TANK_SPEED * (0.6 + Math.random() * 0.4);
        } else {
            // Change strafe direction if blocked (with random behavior)
            this.aiState.strafingDirection *= -1;
            if (Math.random() < 0.3) {
                // Sometimes back up instead of stopping
                this.speed = -TANK_SPEED * 0.5;
            } else {
                this.speed = 0;
            }
        }
    }

    powerUpBehavior(powerUp) {
        if (!powerUp) {
            this.aiState.mode = 'hunt';
            return;
        }
        
        const dx = powerUp.x - this.x;
        const dy = powerUp.y - this.y;
        const targetAngle = Math.atan2(dy, dx);
        
        let angleDiff = targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        if (Math.abs(angleDiff) > 0.05) {
            this.turnSpeed = angleDiff > 0 ? TANK_TURN_SPEED : -TANK_TURN_SPEED;
        } else {
            this.turnSpeed = 0;
        }
        
        this.speed = TANK_SPEED;
    }

    retreatBehavior(threat) {
        if (!threat) {
            this.aiState.mode = 'hunt';
            return;
        }
        
        const dx = threat.x - this.x;
        const dy = threat.y - this.y;
        const escapeAngle = Math.atan2(dy, dx) + Math.PI; // Opposite direction
        
        let angleDiff = escapeAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        if (Math.abs(angleDiff) > 0.05) {
            this.turnSpeed = angleDiff > 0 ? TANK_TURN_SPEED : -TANK_TURN_SPEED;
        } else {
            this.turnSpeed = 0;
        }
        
        this.speed = TANK_SPEED;
    }

    getWallAvoidanceAngle() {
        const checkDistance = 50;
        const checkX = this.x + Math.cos(this.angle) * checkDistance;
        const checkY = this.y + Math.sin(this.angle) * checkDistance;
        
        for (let wall of walls) {
            if (checkX > wall.x && checkX < wall.x + wall.width &&
                checkY > wall.y && checkY < wall.y + wall.height) {
                // Wall detected, find escape angle
                return this.angle + (Math.random() > 0.5 ? Math.PI/3 : -Math.PI/3);
            }
        }
        
        // Check water obstacles
        for (let obstacle of obstacleTiles) {
            if (obstacle.type === 'water') {
                const obstacleX = obstacle.x * TILE_SIZE;
                const obstacleY = obstacle.y * TILE_SIZE;
                if (checkX > obstacleX && checkX < obstacleX + TILE_SIZE &&
                    checkY > obstacleY && checkY < obstacleY + TILE_SIZE) {
                    // Water detected, find escape angle
                    return this.angle + (Math.random() > 0.5 ? Math.PI/3 : -Math.PI/3);
                }
            }
        }
        return 0; // No obstacle detected
    }

    smartShooting(target) {
        if (!target) return;
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Safety checks first - don't shoot if it's dangerous
        if (!this.isSafeToShoot(target)) return;
        
        // Predictive aiming for moving targets (with random error)
        const targetVelX = Math.cos(target.angle) * target.speed;
        const targetVelY = Math.sin(target.angle) * target.speed;
        const timeToHit = distance / BULLET_SPEED;
        const predictedX = target.x + targetVelX * timeToHit + (Math.random() - 0.5) * 20;
        const predictedY = target.y + targetVelY * timeToHit + (Math.random() - 0.5) * 20;
        
        const predictedAngle = Math.atan2(predictedY - this.y, predictedX - this.x);
        let angleDiff = predictedAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // More conservative shooting when low health
        const healthFactor = this.health / 100;
        const shootingThreshold = (0.3 + Math.random() * 0.3) * (healthFactor + 0.5); // Tighter aim when low health
        const minDistance = Math.max(60, 80 - this.health * 0.3); // Stay further when low health
        
        // Only shoot when properly aligned and safe
        const shouldShoot = Math.abs(angleDiff) < shootingThreshold && distance > minDistance;
        
        if (shouldShoot && this.checkClearShot(target)) {
            this.shoot();
            // Longer intervals when low health (more cautious)
            this.aiShootTimer = (30 + Math.random() * 30) * (2 - healthFactor);
        }
    }

    isSafeToShoot(target) {
        // Don't shoot if too close to walls (bullet might bounce back)
        if (this.isNearWall(80)) return false;
        
        // Don't shoot if low health and target is close
        if (this.health < 30 && Math.sqrt((target.x - this.x) ** 2 + (target.y - this.y) ** 2) < 120) {
            return false;
        }
        
        // Check if shooting towards a wall that's close to us
        const bulletPath = this.getBulletPath(target);
        if (bulletPath.hitWallDistance < 60) return false;
        
        // Don't shoot if we're cornered and might hit ourselves
        if (this.isCornered()) return false;
        
        return true;
    }

    isNearWall(distance = 50) {
        for (let wall of walls) {
            const closest = {
                x: Math.max(wall.x, Math.min(this.x, wall.x + wall.width)),
                y: Math.max(wall.y, Math.min(this.y, wall.y + wall.height))
            };
            const dist = Math.sqrt((this.x - closest.x) ** 2 + (this.y - closest.y) ** 2);
            if (dist < distance) return true;
        }
        return false;
    }

    getBulletPath(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.floor(distance / 5);
        
        for (let i = 1; i <= steps; i++) {
            const checkX = this.x + (dx / steps) * i;
            const checkY = this.y + (dy / steps) * i;
            
            for (let wall of walls) {
                if (checkX > wall.x && checkX < wall.x + wall.width &&
                    checkY > wall.y && checkY < wall.y + wall.height) {
                    return { hitWallDistance: (i / steps) * distance };
                }
            }
        }
        return { hitWallDistance: Infinity };
    }

    isCornered() {
        let wallCount = 0;
        const checkDistance = 60;
        const directions = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
        
        for (let angle of directions) {
            const checkX = this.x + Math.cos(angle) * checkDistance;
            const checkY = this.y + Math.sin(angle) * checkDistance;
            
            for (let wall of walls) {
                if (checkX > wall.x && checkX < wall.x + wall.width &&
                    checkY > wall.y && checkY < wall.y + wall.height) {
                    wallCount++;
                    break;
                }
            }
        }
        
        return wallCount >= 2; // Cornered if walls in 2+ directions
    }
    
    shoot() {
        if (this.reloadTime > 0) return;
        
        // Check if we have a power-up and special ammo
        if (this.powerUp && this.specialAmmo <= 0) return;
        
        const bulletX = this.x + Math.cos(this.angle) * (TANK_SIZE + 5);
        const bulletY = this.y + Math.sin(this.angle) * (TANK_SIZE + 5);
        
        if (this.powerUp === 'scatter') {
            // Create 5 bullets with wider spread for more destruction
            for (let i = -2; i <= 2; i++) {
                bullets.push(new Bullet(
                    bulletX, 
                    bulletY, 
                    this.angle + i * 0.4, 
                    this.playerNum,
                    'scatter'
                ));
            }
            this.specialAmmo--;
            if (this.specialAmmo <= 0) {
                this.powerUpTime = 0;
                this.powerUp = null;
            }
        } else if (this.powerUp === 'explosive') {
            bullets.push(new Bullet(
                bulletX, 
                bulletY, 
                this.angle, 
                this.playerNum,
                'explosive'
            ));
            this.specialAmmo--;
            if (this.specialAmmo <= 0) {
                this.powerUpTime = 0;
                this.powerUp = null;
            }
        } else if (this.powerUp === 'piercing') {
            bullets.push(new Bullet(
                bulletX, 
                bulletY, 
                this.angle, 
                this.playerNum,
                'piercing'
            ));
            this.specialAmmo--;
            if (this.specialAmmo <= 0) {
                this.powerUpTime = 0;
                this.powerUp = null;
            }
        } else if (this.powerUp === 'mine') {
            // Drop a mine at current location
            mines.push(new Mine(this.x, this.y, this.playerNum));
            this.specialAmmo--;
            if (this.specialAmmo <= 0) {
                this.powerUpTime = 0;
                this.powerUp = null;
            }
        } else {
            // Regular bullet - infinite ammo
            bullets.push(new Bullet(
                bulletX, 
                bulletY, 
                this.angle, 
                this.playerNum,
                this.powerUp
            ));
        }
        
        // Set reload time for all shots
        this.reloadTime = CONFIG.TANK_RELOAD_TIME;
    }
    
    checkWallCollision(x, y) {
        for (let wall of walls) {
            if (x + TANK_SIZE > wall.x && 
                x - TANK_SIZE < wall.x + wall.width &&
                y + TANK_SIZE > wall.y && 
                y - TANK_SIZE < wall.y + wall.height) {
                return true;
            }
        }
        
        // Check water obstacles
        for (let obstacle of obstacleTiles) {
            if (obstacle.type === 'water') {
                const obstacleX = obstacle.x * TILE_SIZE;
                const obstacleY = obstacle.y * TILE_SIZE;
                if (x + TANK_SIZE > obstacleX && 
                    x - TANK_SIZE < obstacleX + TILE_SIZE &&
                    y + TANK_SIZE > obstacleY && 
                    y - TANK_SIZE < obstacleY + TILE_SIZE) {
                    return true;
                }
            }
        }
        
        // Check gate collisions
        for (let gate of gates) {
            if (gate.blocksMovement() &&
                x + TANK_SIZE > gate.x && 
                x - TANK_SIZE < gate.x + gate.width &&
                y + TANK_SIZE > gate.y && 
                y - TANK_SIZE < gate.y + gate.height) {
                return true;
            }
        }
        
        // Check obstacle tile collisions
        for (let tile of obstacleTiles) {
            const tileLeft = tile.x * TILE_SIZE;
            const tileRight = tileLeft + TILE_SIZE;
            const tileTop = tile.y * TILE_SIZE;
            const tileBottom = tileTop + TILE_SIZE;
            
            if (x + TANK_SIZE > tileLeft && 
                x - TANK_SIZE < tileRight &&
                y + TANK_SIZE > tileTop && 
                y - TANK_SIZE < tileBottom) {
                return true;
            }
        }
        
        return false;
    }

    checkTankCollision(x, y) {
        for (let tank of tanks) {
            if (tank === this || !tank.alive) continue;
            
            const distance = Math.sqrt((x - tank.x) ** 2 + (y - tank.y) ** 2);
            if (distance < TANK_SIZE * 1.2) { // Slight buffer for smooth gameplay
                return true;
            }
        }
        return false;
    }
    
    checkClearShot(target) {
        if (!target) return false;
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.floor(distance / 10);
        
        for (let i = 1; i <= steps; i++) {
            const checkX = this.x + (dx / steps) * i;
            const checkY = this.y + (dy / steps) * i;
            
            // Check if line of sight hits a wall
            for (let wall of walls) {
                if (checkX > wall.x && checkX < wall.x + wall.width &&
                    checkY > wall.y && checkY < wall.y + wall.height) {
                    return false;
                }
            }
        }
        return true;
    }
    
    checkTunnelTransition() {
        // Update cooldown
        if (this.tunnelCooldown > 0) {
            this.tunnelCooldown--;
            return;
        }
        
        // Check if tank is at a tunnel entrance
        for (let entrance of tunnelEntrances) {
            const dist = Math.sqrt(Math.pow(this.x - entrance.x, 2) + Math.pow(this.y - entrance.y, 2));
            
            if (dist < entrance.radius + TANK_SIZE/2) { // Include tank size in collision
                // Instantly teleport to the partner entrance
                this.teleportThroughTunnel(entrance);
                break;
            }
        }
    }
    
    teleportThroughTunnel(entrance) {
        // Find the partner entrance using partnerId
        const partnerEntrance = tunnelEntrances.find(e => e.id === entrance.partnerId);
        if (partnerEntrance) {
            // Create teleport effect at current position
            teleportEffects.push({
                x: this.x,
                y: this.y,
                radius: 0,
                maxRadius: entrance.radius * 2,
                opacity: 1,
                color: entrance.color
            });
            
            // Simply place tank at partner portal center
            // The cooldown will prevent immediate re-entry
            this.x = partnerEntrance.x;
            this.y = partnerEntrance.y;
            
            // Create teleport effect at exit position
            teleportEffects.push({
                x: partnerEntrance.x,
                y: partnerEntrance.y,
                radius: partnerEntrance.radius * 2,
                maxRadius: 0,
                opacity: 1,
                color: entrance.color
            });
            
            // Set cooldown to prevent immediate re-teleportation
            this.tunnelCooldown = 60; // 1 second at 60fps
            
            console.log(`Tank teleported from portal ${entrance.id} to portal ${entrance.partnerId}`);
        } else {
            console.log(`No partner found for portal ${entrance.id} (looking for ${entrance.partnerId})`);
        }
    }
    
    updateTrail() {
        // Update trail fade
        this.trail.forEach(point => {
            point.opacity -= 0.015; // Fade out over time
        });
        
        // Remove faded trail points
        this.trail = this.trail.filter(point => point.opacity > 0);
        
        // Add new trail point if moving
        if (this.isMoving && this.speed !== 0) {
            this.trailTimer++;
            if (this.trailTimer >= this.trailInterval) {
                this.trailTimer = 0;
                
                // Add left and right track positions
                const trackOffset = TANK_SIZE * 0.4;
                const leftX = this.x - Math.sin(this.angle) * trackOffset;
                const leftY = this.y + Math.cos(this.angle) * trackOffset;
                const rightX = this.x + Math.sin(this.angle) * trackOffset;
                const rightY = this.y - Math.cos(this.angle) * trackOffset;
                
                this.trail.push({
                    leftX, leftY,
                    rightX, rightY,
                    angle: this.angle,
                    opacity: 0.4
                });
                
                // Limit trail length
                if (this.trail.length > this.maxTrailLength) {
                    this.trail.shift();
                }
            }
        }
    }
    
    drawTrails() {
        ctx.save();
        
        // Draw each trail segment
        this.trail.forEach((point, index) => {
            ctx.globalAlpha = point.opacity;
            ctx.strokeStyle = '#2C2C2C';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            
            // Connect to previous point for smooth trails
            if (index > 0) {
                const prevPoint = this.trail[index - 1];
                
                // Left track
                ctx.beginPath();
                ctx.moveTo(prevPoint.leftX, prevPoint.leftY);
                ctx.lineTo(point.leftX, point.leftY);
                ctx.stroke();
                
                // Right track
                ctx.beginPath();
                ctx.moveTo(prevPoint.rightX, prevPoint.rightY);
                ctx.lineTo(point.rightX, point.rightY);
                ctx.stroke();
                
                // Add track pattern details
                if (index % 2 === 0) {
                    ctx.globalAlpha = point.opacity * 0.5;
                    ctx.fillStyle = '#1A1A1A';
                    ctx.fillRect(point.leftX - 2, point.leftY - 2, 4, 4);
                    ctx.fillRect(point.rightX - 2, point.rightY - 2, 4, 4);
                }
            }
        });
        
        ctx.restore();
    }
    
    draw() {
        if (!this.alive) return;
        
        // Draw tank trails first (beneath the tank)
        this.drawTrails();
        
        // Calculate positions where tank needs to be drawn (for edge wrapping)
        const positions = [];
        positions.push({ x: this.x, y: this.y }); // Main position
        
        // Check if tank needs to be drawn on opposite edges
        if (this.x < TANK_SIZE) {
            positions.push({ x: this.x + canvas.width, y: this.y });
        } else if (this.x > canvas.width - TANK_SIZE) {
            positions.push({ x: this.x - canvas.width, y: this.y });
        }
        
        if (this.y < TANK_SIZE) {
            positions.push({ x: this.x, y: this.y + canvas.height });
        } else if (this.y > canvas.height - TANK_SIZE) {
            positions.push({ x: this.x, y: this.y - canvas.height });
        }
        
        // Check corners
        if (this.x < TANK_SIZE && this.y < TANK_SIZE) {
            positions.push({ x: this.x + canvas.width, y: this.y + canvas.height });
        } else if (this.x > canvas.width - TANK_SIZE && this.y < TANK_SIZE) {
            positions.push({ x: this.x - canvas.width, y: this.y + canvas.height });
        } else if (this.x < TANK_SIZE && this.y > canvas.height - TANK_SIZE) {
            positions.push({ x: this.x + canvas.width, y: this.y - canvas.height });
        } else if (this.x > canvas.width - TANK_SIZE && this.y > canvas.height - TANK_SIZE) {
            positions.push({ x: this.x - canvas.width, y: this.y - canvas.height });
        }
        
        // Draw tank at all necessary positions
        positions.forEach(pos => {
            this.drawTankAt(pos.x, pos.y);
        });
    }
    
    drawTankAt(drawX, drawY) {
        // Blinking effect during grace period
        if (graceTimer > 0) {
            const blinkRate = Math.floor(Date.now() / 200) % 2;
            if (blinkRate === 0) {
                ctx.globalAlpha = 0.5;
            }
        }
        
        ctx.save();
        ctx.translate(drawX, drawY + this.engineBob);
        ctx.rotate(this.angle);
        
        // Enhanced tank shadow with blur effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
        
        // Animated tank treads (more realistic and detailed)
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(-TANK_SIZE/2 - 4, -TANK_SIZE/2 - 3, TANK_SIZE + 8, 8);
        ctx.fillRect(-TANK_SIZE/2 - 4, TANK_SIZE/2 - 5, TANK_SIZE + 8, 8);
        
        // Animated tread details with movement offset
        ctx.fillStyle = '#2a2a2a';
        const treadOffset = this.treadOffset % 12; // Loop the animation
        for (let i = -TANK_SIZE/2 - 2 - treadOffset; i <= TANK_SIZE/2 + 2; i += 6) {
            ctx.fillRect(i, -TANK_SIZE/2 - 1, 3, 4);
            ctx.fillRect(i, TANK_SIZE/2 - 3, 3, 4);
        }
        
        // Animated tread highlights that move with treads
        ctx.fillStyle = '#444';
        for (let i = -TANK_SIZE/2 - treadOffset; i <= TANK_SIZE/2; i += 6) {
            ctx.fillRect(i, -TANK_SIZE/2 + 1, 1, 2);
            ctx.fillRect(i, TANK_SIZE/2 - 3, 1, 2);
        }
        
        // Draw animated road wheels
        ctx.fillStyle = '#333';
        const wheelPositions = [-TANK_SIZE/3, 0, TANK_SIZE/3];
        wheelPositions.forEach(wheelX => {
            // Left side wheels
            ctx.save();
            ctx.translate(wheelX, -TANK_SIZE/2 + 1);
            ctx.rotate(this.wheelRotation);
            ctx.fillRect(-2, -2, 4, 4);
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            ctx.strokeRect(-2, -2, 4, 4);
            ctx.restore();
            
            // Right side wheels
            ctx.save();
            ctx.translate(wheelX, TANK_SIZE/2 - 1);
            ctx.rotate(this.wheelRotation);
            ctx.fillRect(-2, -2, 4, 4);
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            ctx.strokeRect(-2, -2, 4, 4);
            ctx.restore();
        });
        
        // Reset shadow for main body
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Enhanced main body with multiple gradients
        const bodyGradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, TANK_SIZE/1.5);
        bodyGradient.addColorStop(0, this.lightenColor(this.color, 40));
        bodyGradient.addColorStop(0.3, this.lightenColor(this.color, 15));
        bodyGradient.addColorStop(0.7, this.color);
        bodyGradient.addColorStop(1, this.darkenColor(this.color, 35));
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(-TANK_SIZE/2, -TANK_SIZE/2, TANK_SIZE, TANK_SIZE);
        
        // Body detail panels
        ctx.fillStyle = this.darkenColor(this.secondaryColor, 25);
        ctx.fillRect(-TANK_SIZE/2 + 3, -TANK_SIZE/2 + 3, TANK_SIZE - 6, 3);
        ctx.fillRect(-TANK_SIZE/2 + 3, TANK_SIZE/2 - 6, TANK_SIZE - 6, 3);
        
        // Side armor with rivets
        const armorGradient = ctx.createLinearGradient(-TANK_SIZE/2, 0, -TANK_SIZE/2 + 6, 0);
        armorGradient.addColorStop(0, this.darkenColor(this.color, 15));
        armorGradient.addColorStop(1, this.darkenColor(this.color, 35));
        ctx.fillStyle = armorGradient;
        ctx.fillRect(-TANK_SIZE/2 + 1, -TANK_SIZE/2 + 6, 6, TANK_SIZE - 12);
        ctx.fillRect(TANK_SIZE/2 - 7, -TANK_SIZE/2 + 6, 6, TANK_SIZE - 12);
        
        // Armor rivets
        ctx.fillStyle = this.darkenColor(this.color, 50);
        for (let y = -TANK_SIZE/2 + 8; y < TANK_SIZE/2 - 8; y += 6) {
            ctx.beginPath();
            ctx.arc(-TANK_SIZE/2 + 4, y, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(TANK_SIZE/2 - 4, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Enhanced cannon barrel with realistic proportions
        const cannonLength = 28;
        const cannonWidth = 8;
        
        // Cannon shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(TANK_SIZE/2 - 3, -cannonWidth/2 + 1, cannonLength, cannonWidth);
        
        // Main cannon barrel with gradient
        const cannonGradient = ctx.createLinearGradient(0, -cannonWidth/2, 0, cannonWidth/2);
        cannonGradient.addColorStop(0, '#777');
        cannonGradient.addColorStop(0.2, '#555');
        cannonGradient.addColorStop(0.8, '#333');
        cannonGradient.addColorStop(1, '#222');
        ctx.fillStyle = cannonGradient;
        ctx.fillRect(TANK_SIZE/2 - 4, -cannonWidth/2, cannonLength, cannonWidth);
        
        // Cannon muzzle with depth
        ctx.fillStyle = '#000';
        ctx.fillRect(TANK_SIZE/2 + cannonLength - 6, -3, 6, 6);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(TANK_SIZE/2 + cannonLength - 6, -3, 6, 6);
        
        // Cannon details and segments
        ctx.fillStyle = '#666';
        ctx.fillRect(TANK_SIZE/2 - 2, -2, 4, 4);
        ctx.fillRect(TANK_SIZE/2 + 8, -1, 2, 2);
        ctx.fillRect(TANK_SIZE/2 + 16, -1, 2, 2);
        
        // Enhanced turret with realistic shading
        const turretRadius = TANK_SIZE/3;
        const turretGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, turretRadius);
        turretGradient.addColorStop(0, this.lightenColor(this.secondaryColor, 25));
        turretGradient.addColorStop(0.4, this.secondaryColor);
        turretGradient.addColorStop(0.8, this.darkenColor(this.secondaryColor, 20));
        turretGradient.addColorStop(1, this.darkenColor(this.secondaryColor, 45));
        ctx.fillStyle = turretGradient;
        ctx.beginPath();
        ctx.arc(0, 0, turretRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Turret ring detail
        ctx.strokeStyle = this.darkenColor(this.secondaryColor, 35);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, turretRadius - 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Commander's hatch with detail
        ctx.fillStyle = this.darkenColor(this.secondaryColor, 40);
        ctx.beginPath();
        ctx.arc(-3, -4, turretRadius/2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this.darkenColor(this.secondaryColor, 60);
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Hatch handle
        ctx.fillStyle = '#444';
        ctx.fillRect(-5, -6, 4, 1);
        
        // Vision ports
        ctx.fillStyle = '#111';
        ctx.fillRect(-8, 2, 3, 1);
        ctx.fillRect(5, 2, 3, 1);
        
        // Enhanced antenna/periscope
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(4, -10);
        ctx.lineTo(6, -16);
        ctx.stroke();
        
        // Antenna tip
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(6, -16, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Tank body outline with enhanced stroke
        ctx.strokeStyle = this.darkenColor(this.color, 55);
        ctx.lineWidth = 2;
        ctx.strokeRect(-TANK_SIZE/2, -TANK_SIZE/2, TANK_SIZE, TANK_SIZE);
        
        // Engine exhaust effect when moving
        if (this.isMoving && Math.random() > 0.7) {
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#444';
            const exhaustX = -TANK_SIZE/2 - 8;
            const exhaustY = -2 + (Math.random() - 0.5) * 4;
            ctx.beginPath();
            ctx.arc(exhaustX, exhaustY, 2 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        
        // Power-up indicator with enhanced glow
        if (this.powerUp) {
            const powerUpColor = this.getPowerUpColor();
            ctx.shadowColor = powerUpColor;
            ctx.shadowBlur = 15;
            
            // Animated ring
            const time = Date.now() / 200;
            const radius = 8 + Math.sin(time) * 2;
            
            ctx.strokeStyle = powerUpColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Inner glow
            ctx.fillStyle = powerUpColor;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
        
        // Pickup notification effect (drawn in world coordinates, not rotated)
        if (this.pickupNotification) {
            ctx.save();
            
            const notifTime = (120 - this.pickupTimer) / 120; // 0 to 1
            const yOffset = -TANK_SIZE - 30 - (notifTime * 20); // Float upward
            const alpha = 1 - (notifTime * 0.7); // Fade out
            
            ctx.globalAlpha = alpha;
            
            // Holy circle
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;
            
            const radius = 20 + Math.sin(Date.now() * 0.01) * 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y + yOffset, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Plus symbol
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.moveTo(this.x - 8, this.y + yOffset);
            ctx.lineTo(this.x + 8, this.y + yOffset);
            ctx.moveTo(this.x, this.y + yOffset - 8);
            ctx.lineTo(this.x, this.y + yOffset + 8);
            ctx.stroke();
            
            // Power-up icon
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10;
            ctx.fillText(this.pickupNotification, this.x, this.y + yOffset - 35);
            
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            ctx.restore();
        }
        
        // Draw player name and reset alpha only during grace period
        if (graceTimer > 0) {
            ctx.save();
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            
            const playerName = this.isAI ? `AI ${this.playerNum}` : `Player ${this.playerNum}`;
            ctx.strokeText(playerName, this.x, this.y - TANK_SIZE - 15);
            ctx.fillText(playerName, this.x, this.y - TANK_SIZE - 15);
            
            ctx.restore();
            
            // Reset alpha after grace period effects
            ctx.globalAlpha = 1;
        }
    }
    
    lightenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    getPowerUpColor() {
        switch(this.powerUp) {
            case 'scatter': return '#FFD700';
            case 'laser': return '#00FFFF';
            case 'rocket': return '#FF6600';
            case 'explosive': return '#FF3333';
            case 'piercing': return '#9966FF';
            case 'mine': return '#8B0000';
            default: return '#FFD700';
        }
    }
    
    destroy(killer = null) {
        this.alive = false;
        
        // Track kills if there's a killer and it's not self
        if (killer && killer !== this) {
            if (!kills[`player${killer.playerNum}`]) {
                kills[`player${killer.playerNum}`] = 0;
            }
            kills[`player${killer.playerNum}`]++;
            
            // Update UI
            const killsElement = document.getElementById(`kills${killer.playerNum}`);
            if (killsElement) {
                killsElement.textContent = kills[`player${killer.playerNum}`];
            }
        }
        
        // Create explosion effect
        explosions.push(new Explosion(this.x, this.y));
        
        // Create debris particles
        for (let i = 0; i < 30; i++) {
            particles.push(new Particle(this.x, this.y, this.color));
        }
        
        // Create smoke particles
        for (let i = 0; i < 15; i++) {
            particles.push(new SmokeParticle(this.x, this.y));
        }
    }
}

class Bullet {
    constructor(x, y, angle, owner, type = null) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.owner = owner;
        this.type = type;
        this.speed = this.getBulletSpeed(type);
        this.lifetime = this.getBulletLifetime(type);
        this.size = this.getBulletSize(type);
        this.pierced = 0; // For piercing bullets
        this.maxPiercing = 3; // Can go through 3 walls
    }
    
    getBulletSpeed(type) {
        switch(type) {
            case 'laser': return BULLET_SPEED * CONFIG.LASER_SPEED_MULT;
            case 'rocket': return BULLET_SPEED * CONFIG.ROCKET_SPEED_MULT;
            case 'explosive': return BULLET_SPEED * CONFIG.EXPLOSIVE_SPEED_MULT;
            case 'piercing': return BULLET_SPEED * CONFIG.PIERCING_SPEED_MULT;
            case 'freeze': return BULLET_SPEED * CONFIG.FREEZE_SPEED_MULT;
            default: return BULLET_SPEED;
        }
    }
    
    getBulletLifetime(type) {
        switch(type) {
            case 'laser': return BULLET_LIFETIME * 0.7;
            case 'rocket': return BULLET_LIFETIME * 1.5;
            case 'explosive': return BULLET_LIFETIME * 1.2;
            case 'piercing': return BULLET_LIFETIME * 0.8;
            case 'freeze': return BULLET_LIFETIME * 1.3;
            default: return BULLET_LIFETIME;
        }
    }
    
    getBulletSize(type) {
        switch(type) {
            case 'laser': return BULLET_SIZE * 0.5;
            case 'rocket': return BULLET_SIZE * 1.5;
            case 'explosive': return BULLET_SIZE * 1.3;
            case 'piercing': return BULLET_SIZE * 0.8;
            case 'freeze': return BULLET_SIZE * 1.2;
            default: return BULLET_SIZE;
        }
    }
    
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        // Screen wrapping for bullets
        if (this.x < -this.size) {
            this.x = canvas.width + this.size;
        } else if (this.x > canvas.width + this.size) {
            this.x = -this.size;
        }
        
        if (this.y < -this.size) {
            this.y = canvas.height + this.size;
        } else if (this.y > canvas.height + this.size) {
            this.y = -this.size;
        }
        
        for (let wall of walls) {
            if (this.checkWallCollision(wall)) {
                // Check if it's a destructible wall
                if (wall instanceof DestructibleWall) {
                    // Damage the wall
                    const wallDestroyed = wall.takeDamage();
                    
                    if (this.type === 'piercing' && this.pierced < this.maxPiercing) {
                        // Piercing bullets go through and damage walls
                        this.pierced++;
                        // Create piercing effect
                        for (let i = 0; i < 5; i++) {
                            particles.push(new Particle(this.x, this.y, '#9966FF'));
                        }
                        continue; // Continue through the wall
                    } else if (this.type === 'explosive' || this.type === 'rocket') {
                        // Explosive bullets explode and damage wall
                        if (this.type === 'explosive') {
                            this.createExplosion();
                        } else {
                            this.createBigExplosion();
                        }
                        return false; // Remove bullet after explosion
                    } else {
                        // Normal bullets are absorbed by destructible walls
                        // The wall already took damage from wall.takeDamage() above
                        if (wallDestroyed) {
                            // Wall was destroyed, bullet continues
                            continue;
                        } else {
                            // Wall absorbs the bullet
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

class Wall {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    draw() {
        // Draw shadow first
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x + 2, this.y + 2, this.width, this.height);
        
        // Draw wall sprite tiled at appropriate size
        const tileSize = 32; // Use consistent tile size
        
        for (let x = 0; x < this.width; x += tileSize) {
            for (let y = 0; y < this.height; y += tileSize) {
                const drawWidth = Math.min(tileSize, this.width - x);
                const drawHeight = Math.min(tileSize, this.height - y);
                
                ctx.drawImage(
                    wallImage,
                    this.x + x, this.y + y, drawWidth, drawHeight
                );
            }
        }
    }
}

class DestructibleWall extends Wall {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.maxHealth = 3;
        this.health = 3;
        this.isDestructible = true;
        this.damageEffects = [];
    }
    
    takeDamage() {
        this.health--;
        
        // Create damage particles
        for (let i = 0; i < 8; i++) {
            const px = this.x + this.width / 2 + (Math.random() - 0.5) * this.width;
            const py = this.y + this.height / 2 + (Math.random() - 0.5) * this.height;
            particles.push(new Particle(px, py, this.getDamageColor()));
        }
        
        // Add screen shake for impact
        if (typeof addScreenShake === 'function') {
            addScreenShake(2);
        }
        
        // Wall destroyed
        if (this.health <= 0) {
            this.destroy();
            return true; // Wall is destroyed
        }
        
        return false; // Wall still standing
    }
    
    destroy() {
        // Create destruction particles
        for (let i = 0; i < 20; i++) {
            const px = this.x + Math.random() * this.width;
            const py = this.y + Math.random() * this.height;
            const color = i % 3 === 0 ? '#8B4513' : (i % 3 === 1 ? '#A0522D' : '#654321');
            
            const particle = new Particle(px, py, color);
            particle.vx = (Math.random() - 0.5) * 4;
            particle.vy = (Math.random() - 0.5) * 4;
            particle.size = Math.random() * 4 + 2;
            particles.push(particle);
        }
        
        // Remove from walls array
        const index = walls.indexOf(this);
        if (index > -1) {
            walls.splice(index, 1);
        }
        
        // Remove from obstacle tiles
        const tileX = Math.floor(this.x / TILE_SIZE);
        const tileY = Math.floor(this.y / TILE_SIZE);
        obstacleTiles = obstacleTiles.filter(tile => 
            !(tile.x === tileX && tile.y === tileY && tile.type === 'wall')
        );
    }
    
    getDamageColor() {
        switch(this.health) {
            case 2: return '#A0522D'; // Light brown
            case 1: return '#8B4513'; // Saddle brown
            default: return '#654321'; // Dark brown
        }
    }
    
    draw() {
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(this.x + 3, this.y + 3, this.width, this.height);
        
        // Draw bright background color based on health
        if (this.health === this.maxHealth) {
            // Bright yellow for full health
            ctx.fillStyle = '#FFEB3B';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else if (this.health === 2) {
            // Orange for damaged
            ctx.fillStyle = '#FF9800';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else if (this.health === 1) {
            // Red for critical
            ctx.fillStyle = '#F44336';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        // Draw wall texture semi-transparent over the color
        const tileSize = 32;
        ctx.save();
        ctx.globalAlpha = 0.3; // Very transparent to show bright color
        for (let x = 0; x < this.width; x += tileSize) {
            for (let y = 0; y < this.height; y += tileSize) {
                const drawWidth = Math.min(tileSize, this.width - x);
                const drawHeight = Math.min(tileSize, this.height - y);
                ctx.drawImage(
                    wallImage,
                    this.x + x, this.y + y, drawWidth, drawHeight
                );
            }
        }
        ctx.restore();
        
        // Draw thick colored border
        ctx.lineWidth = 3;
        if (this.health === this.maxHealth) {
            ctx.strokeStyle = '#FFC107'; // Amber border
        } else if (this.health === 2) {
            ctx.strokeStyle = '#FF5722'; // Deep orange border
        } else {
            ctx.strokeStyle = '#B71C1C'; // Dark red border
        }
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Add pulsing effect for full health walls
        if (this.health === this.maxHealth) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 0.3;
            ctx.save();
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }
        
        // Draw cracks based on damage
        if (this.health < this.maxHealth) {
            ctx.strokeStyle = '#2C1810';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.7;
            
            if (this.health <= 2) {
                // Draw first crack
                ctx.beginPath();
                ctx.moveTo(this.x + this.width * 0.3, this.y);
                ctx.lineTo(this.x + this.width * 0.4, this.y + this.height * 0.4);
                ctx.lineTo(this.x + this.width * 0.2, this.y + this.height);
                ctx.stroke();
            }
            
            if (this.health <= 1) {
                // Draw second crack
                ctx.beginPath();
                ctx.moveTo(this.x + this.width * 0.7, this.y);
                ctx.lineTo(this.x + this.width * 0.6, this.y + this.height * 0.6);
                ctx.lineTo(this.x + this.width * 0.8, this.y + this.height);
                ctx.stroke();
                
                // Draw third crack horizontally
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + this.height * 0.5);
                ctx.lineTo(this.x + this.width * 0.3, this.y + this.height * 0.6);
                ctx.lineTo(this.x + this.width * 0.7, this.y + this.height * 0.4);
                ctx.lineTo(this.x + this.width, this.y + this.height * 0.5);
                ctx.stroke();
            }
            
            ctx.globalAlpha = 1.0;
        }
        
        // Draw health indicator (small bars)
        if (this.health < this.maxHealth && this.health > 0) {
            const barWidth = 4;
            const barHeight = 2;
            const barSpacing = 2;
            const totalWidth = this.maxHealth * (barWidth + barSpacing);
            const startX = this.x + (this.width - totalWidth) / 2;
            const startY = this.y - 8;
            
            for (let i = 0; i < this.maxHealth; i++) {
                ctx.fillStyle = i < this.health ? '#4CAF50' : '#424242';
                ctx.fillRect(startX + i * (barWidth + barSpacing), startY, barWidth, barHeight);
            }
        }
    }
}

class Gate {
    constructor(x, y, width, height, isVertical = true) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isVertical = isVertical;
        this.isOpen = true;
        this.openTimer = 480; // 8 seconds open at 60fps
        this.warningTimer = 0;
        this.closedTimer = 0;
        this.openHeight = height;
        this.openWidth = width;
        this.currentHeight = height;
        this.currentWidth = width;
        this.state = 'open'; // 'open', 'warning', 'closing', 'closed'
        this.crushDamage = 75;
    }
    
    update() {
        switch (this.state) {
            case 'open':
                this.openTimer--;
                if (this.openTimer <= 0) {
                    this.state = 'warning';
                    this.warningTimer = 120; // 2 seconds warning
                }
                break;
                
            case 'warning':
                this.warningTimer--;
                if (this.warningTimer <= 0) {
                    this.state = 'closing';
                }
                break;
                
            case 'closing':
                // Animate gate closing
                if (this.isVertical) {
                    this.currentHeight = Math.max(0, this.currentHeight - this.openHeight / 30); // Close over 0.5 seconds
                    if (this.currentHeight <= 0) {
                        this.state = 'closed';
                        this.closedTimer = 120; // Stay closed for 2 seconds
                        this.checkCrushDamage();
                    }
                } else {
                    this.currentWidth = Math.max(0, this.currentWidth - this.openWidth / 30);
                    if (this.currentWidth <= 0) {
                        this.state = 'closed';
                        this.closedTimer = 120;
                        this.checkCrushDamage();
                    }
                }
                this.checkCrushDamage(); // Check during closing too
                break;
                
            case 'closed':
                this.closedTimer--;
                if (this.closedTimer <= 0) {
                    this.state = 'opening';
                }
                break;
                
            case 'opening':
                // Animate gate opening
                if (this.isVertical) {
                    this.currentHeight = Math.min(this.openHeight, this.currentHeight + this.openHeight / 30);
                    if (this.currentHeight >= this.openHeight) {
                        this.state = 'open';
                        this.openTimer = 480; // Reset open timer
                    }
                } else {
                    this.currentWidth = Math.min(this.openWidth, this.currentWidth + this.openWidth / 30);
                    if (this.currentWidth >= this.openWidth) {
                        this.state = 'open';
                        this.openTimer = 480;
                    }
                }
                break;
        }
    }
    
    checkCrushDamage() {
        tanks.forEach(tank => {
            if (!tank.alive) return;
            
            // Check if tank is inside gate area
            const tankCenterX = tank.x;
            const tankCenterY = tank.y;
            const tankRadius = TANK_SIZE / 2;
            
            if (tankCenterX + tankRadius > this.x && 
                tankCenterX - tankRadius < this.x + this.width &&
                tankCenterY + tankRadius > this.y && 
                tankCenterY - tankRadius < this.y + this.height) {
                
                // Tank is in gate area - check if gate is closing/closed
                if (this.state === 'closing' || this.state === 'closed') {
                    tank.health -= this.crushDamage;
                    
                    // Add crushing effect
                    for (let i = 0; i < 15; i++) {
                        particles.push(new Particle(
                            tank.x + (Math.random() - 0.5) * TANK_SIZE,
                            tank.y + (Math.random() - 0.5) * TANK_SIZE,
                            '#ff0000',
                            20 + Math.random() * 10
                        ));
                    }
                    
                    if (tank.health <= 0) {
                        tank.alive = false;
                        explosions.push(new Explosion(tank.x, tank.y));
                    }
                }
            }
        });
    }
    
    blocksMovement() {
        return this.state === 'closed' || (this.state === 'closing' && 
               (this.isVertical ? this.currentHeight < this.openHeight * 0.3 : this.currentWidth < this.openWidth * 0.3));
    }
    
    draw() {
        // Gate frame (always visible)
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
        
        // Warning effect when about to close
        if (this.state === 'warning') {
            const flash = Math.sin(Date.now() * 0.02) > 0;
            if (flash) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fillRect(this.x - 10, this.y - 10, this.width + 20, this.height + 20);
            }
        }
        
        // Gate opening area
        if (this.state !== 'closed') {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
            if (this.isVertical) {
                ctx.fillRect(this.x, this.y + (this.openHeight - this.currentHeight), this.width, this.currentHeight);
            } else {
                ctx.fillRect(this.x + (this.openWidth - this.currentWidth), this.y, this.currentWidth, this.height);
            }
        }
        
        // Gate walls (the solid parts)
        ctx.fillStyle = '#444';
        if (this.isVertical) {
            // Top part
            if (this.openHeight - this.currentHeight > 0) {
                ctx.fillRect(this.x, this.y, this.width, this.openHeight - this.currentHeight);
            }
        } else {
            // Left part  
            if (this.openWidth - this.currentWidth > 0) {
                ctx.fillRect(this.x, this.y, this.openWidth - this.currentWidth, this.height);
            }
        }
        
        // Gate teeth/spikes for visual danger
        if (this.state === 'closing' || this.state === 'closed') {
            ctx.fillStyle = '#ff4444';
            if (this.isVertical) {
                const spikeCount = Math.floor(this.width / 20);
                for (let i = 0; i < spikeCount; i++) {
                    const spikeX = this.x + (i + 0.5) * (this.width / spikeCount);
                    const spikeY = this.y + (this.openHeight - this.currentHeight);
                    ctx.beginPath();
                    ctx.moveTo(spikeX - 5, spikeY);
                    ctx.lineTo(spikeX, spikeY + 10);
                    ctx.lineTo(spikeX + 5, spikeY);
                    ctx.fill();
                }
            } else {
                const spikeCount = Math.floor(this.height / 20);
                for (let i = 0; i < spikeCount; i++) {
                    const spikeX = this.x + (this.openWidth - this.currentWidth);
                    const spikeY = this.y + (i + 0.5) * (this.height / spikeCount);
                    ctx.beginPath();
                    ctx.moveTo(spikeX, spikeY - 5);
                    ctx.lineTo(spikeX + 10, spikeY);
                    ctx.lineTo(spikeX, spikeY + 5);
                    ctx.fill();
                }
            }
        }
        
        // Timer display
        let timeLeft = 0;
        if (this.state === 'open') timeLeft = Math.ceil(this.openTimer / 60);
        else if (this.state === 'warning') timeLeft = Math.ceil(this.warningTimer / 60);
        else if (this.state === 'closed') timeLeft = Math.ceil(this.closedTimer / 60);
        
        if (timeLeft > 0) {
            ctx.fillStyle = this.state === 'warning' ? '#ff0000' : '#ffffff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(timeLeft.toString(), this.x + this.width/2, this.y - 10);
        }
    }
}

// Collectible class removed - blue points system disabled

class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.types = this.getEnabledTypes();
        this.type = this.types[Math.floor(Math.random() * this.types.length)];
        this.collected = false;
        this.respawnTimer = 0;
        this.rotationAngle = 0;
        this.bobOffset = Math.random() * Math.PI * 2;
    }
    
    getEnabledTypes() {
        return Object.keys(CONFIG.POWERUP_TYPES).filter(type => CONFIG.POWERUP_TYPES[type].enabled);
    }
    
    update() {
        if (this.collected) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) {
                this.collected = false;
                const newPos = generateSafeItemPosition();
                this.x = newPos.x;
                this.y = newPos.y;
                this.types = this.getEnabledTypes(); // Refresh enabled types
                this.type = this.types[Math.floor(Math.random() * this.types.length)];
            }
        } else {
            this.rotationAngle += 0.02;
        }
    }
    
    checkCollision(tank) {
        if (this.collected || !tank.alive) return false;
        const distance = Math.sqrt((this.x - tank.x) ** 2 + (this.y - tank.y) ** 2);
        if (distance < TANK_SIZE + POWERUP_SIZE) {
            tank.powerUp = this.type;
            tank.powerUpTime = 600;
            tank.specialAmmo = tank.maxSpecialAmmo; // Give 5 special shots
            
            // Special handling for drone power-up
            if (this.type === 'drone') {
                // Remove existing drone if any
                if (tank.drone && tank.drone.alive) {
                    tank.drone.alive = false;
                }
                // Create new drone
                tank.drone = new Drone(tank);
                drones.push(tank.drone);
            }
            
            // Trigger pickup notification
            tank.pickupNotification = getPowerUpSymbol(this.type);
            tank.pickupTimer = 120; // 2 seconds
            
            this.collected = true;
            this.respawnTimer = 300;
            return true;
        }
        return false;
    }
    
    draw() {
        if (this.collected) return;
        
        const bob = Math.sin(Date.now() / 400 + this.bobOffset) * 3;
        
        ctx.save();
        ctx.translate(this.x, this.y + bob);
        ctx.rotate(this.rotationAngle);
        
        // Glow effect for all power-ups
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.getTypeColor();
        
        // Base hexagonal container
        ctx.fillStyle = this.getTypeColor();
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            const x = Math.cos(angle) * POWERUP_SIZE;
            const y = Math.sin(angle) * POWERUP_SIZE;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Reset rotation for icon
        ctx.rotate(-this.rotationAngle);
        
        // Draw type-specific icon
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFF';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        
        switch(this.type) {
            case 'scatter':
                // Three bullet spread
                for (let i = -1; i <= 1; i++) {
                    ctx.beginPath();
                    ctx.arc(i * 6, 0, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
                break;
                
            case 'laser':
                // Lightning bolt
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-10, -8);
                ctx.lineTo(2, -2);
                ctx.lineTo(-4, 2);
                ctx.lineTo(10, 8);
                ctx.stroke();
                break;
                
            case 'rocket':
                // Rocket shape
                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(-8, -6);
                ctx.lineTo(-4, 0);
                ctx.lineTo(-8, 6);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                // Flame
                ctx.fillStyle = '#FF6600';
                ctx.beginPath();
                ctx.moveTo(-8, -3);
                ctx.lineTo(-14, 0);
                ctx.lineTo(-8, 3);
                ctx.fill();
                break;
                
            case 'explosive':
                // Bomb with spark
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(0, 2, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                // Fuse
                ctx.strokeStyle = '#FF6600';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, -6);
                ctx.lineTo(-3, -12);
                ctx.stroke();
                // Spark
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(-3, -12, 2, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'piercing':
                // Arrow
                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(-2, -8);
                ctx.lineTo(-2, -3);
                ctx.lineTo(-10, -3);
                ctx.lineTo(-10, 3);
                ctx.lineTo(-2, 3);
                ctx.lineTo(-2, 8);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
                
            case 'freeze':
                // Ice crystal
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 2;
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 / 6) * i;
                    const x = Math.cos(angle) * 10;
                    const y = Math.sin(angle) * 10;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                    // Small cross at end
                    ctx.beginPath();
                    ctx.moveTo(x - 2, y - 2);
                    ctx.lineTo(x + 2, y + 2);
                    ctx.moveTo(x + 2, y - 2);
                    ctx.lineTo(x - 2, y + 2);
                    ctx.stroke();
                }
                break;
        }
        
        ctx.restore();
    }
    
    getTypeColor() {
        switch(this.type) {
            case 'scatter': return '#FFD700';
            case 'laser': return '#00FFFF';
            case 'rocket': return '#FF6600';
            case 'explosive': return '#FF3333';
            case 'piercing': return '#9966FF';
            case 'freeze': return '#66CCFF';
            default: return '#FFD700';
        }
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.color = color;
        this.life = 30;
        this.size = Math.random() * 5 + 2;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.life--;
        return this.life > 0;
    }
    
    draw() {
        ctx.globalAlpha = this.life / 30;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

class SmokeParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3 - 1; // Smoke rises
        this.life = 60;
        this.maxLife = 60;
        this.size = Math.random() * 20 + 10;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.size += 0.5; // Smoke expands
        this.life--;
        return this.life > 0;
    }
    
    draw() {
        const alpha = (this.life / this.maxLife) * 0.5;
        ctx.globalAlpha = alpha;
        
        // Create gradient for smoke
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, 'rgba(50, 50, 50, 0.8)');
        gradient.addColorStop(0.5, 'rgba(100, 100, 100, 0.5)');
        gradient.addColorStop(1, 'rgba(150, 150, 150, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }
}


class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.maxRadius = 50;
        this.life = 30;
        this.maxLife = 30;
        this.shockwaveRadius = 5;
        this.shockwaveMaxRadius = 80;
    }
    
    update() {
        // Expand explosion
        if (this.radius < this.maxRadius) {
            this.radius += (this.maxRadius - this.radius) * 0.3;
        }
        
        // Expand shockwave
        if (this.shockwaveRadius < this.shockwaveMaxRadius) {
            this.shockwaveRadius += 4;
        }
        
        this.life--;
        return this.life > 0;
    }
    
    draw() {
        ctx.save();
        
        // Draw shockwave
        if (this.life > 20) {
            const shockwaveAlpha = (this.life - 20) / 10 * 0.5;
            ctx.strokeStyle = `rgba(255, 255, 255, ${shockwaveAlpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.shockwaveRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw main explosion with multiple layers
        const alpha = this.life / this.maxLife;
        
        // Outer explosion (orange/red)
        const gradient1 = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient1.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
        gradient1.addColorStop(0.3, `rgba(255, 200, 0, ${alpha * 0.8})`);
        gradient1.addColorStop(0.6, `rgba(255, 100, 0, ${alpha * 0.6})`);
        gradient1.addColorStop(1, `rgba(255, 0, 0, 0)`);
        
        ctx.fillStyle = gradient1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner explosion (white hot core)
        if (this.life > 15) {
            const coreAlpha = (this.life - 15) / 15;
            const gradient2 = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 0.5);
            gradient2.addColorStop(0, `rgba(255, 255, 255, ${coreAlpha})`);
            gradient2.addColorStop(0.5, `rgba(255, 255, 200, ${coreAlpha * 0.7})`);
            gradient2.addColorStop(1, `rgba(255, 200, 100, 0)`);
            
            ctx.fillStyle = gradient2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add flash effect at the beginning
        if (this.life > 25) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(this.life - 25) / 5 * 0.8})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.restore();
    }
}

class Mine {
    constructor(x, y, owner) {
        this.x = x;
        this.y = y;
        this.owner = owner;
        this.armed = false;
        this.armTime = 120; // 2 seconds to arm
        this.size = 8;
        this.blinkRate = 0;
    }
    
    update() {
        if (this.armTime > 0) {
            this.armTime--;
            if (this.armTime === 0) {
                this.armed = true;
            }
        }
        
        if (this.armed) {
            // Check for tank collisions
            tanks.forEach(tank => {
                if (!tank.alive) return;
                const distance = Math.sqrt((this.x - tank.x) ** 2 + (this.y - tank.y) ** 2);
                if (distance < TANK_SIZE + this.size) {
                    this.explode();
                    return false; // Mine is destroyed
                }
            });
        }
        
        return true; // Mine continues to exist
    }
    
    explode() {
        // Create explosion
        explosions.push(new Explosion(this.x, this.y));
        
        // Damage nearby tanks
        tanks.forEach(tank => {
            if (!tank.alive) return;
            const distance = Math.sqrt((this.x - tank.x) ** 2 + (this.y - tank.y) ** 2);
            if (distance < 70) { // Mine explosion radius
                tank.destroy();
            }
        });
        
        // Create explosion particles
        for (let i = 0; i < 25; i++) {
            particles.push(new Particle(this.x, this.y, '#FF6600'));
        }
        
        // Remove this mine from the array
        const index = mines.indexOf(this);
        if (index > -1) {
            mines.splice(index, 1);
        }
    }
    
    draw() {
        ctx.save();
        
        if (!this.armed) {
            // Unarmed mine - gray with warning blinks
            ctx.fillStyle = '#666';
            const blink = Math.floor(Date.now() / 200) % 2;
            if (blink) {
                ctx.fillStyle = '#999';
            }
        } else {
            // Armed mine - red with danger blinks
            ctx.fillStyle = '#8B0000';
            const blink = Math.floor(Date.now() / 150) % 2;
            if (blink) {
                ctx.fillStyle = '#FF0000';
            }
        }
        
        // Mine body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Mine spikes
        ctx.strokeStyle = this.armed ? '#FF0000' : '#444';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const startX = this.x + Math.cos(angle) * (this.size - 2);
            const startY = this.y + Math.sin(angle) * (this.size - 2);
            const endX = this.x + Math.cos(angle) * (this.size + 3);
            const endY = this.y + Math.sin(angle) * (this.size + 3);
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class Target {
    constructor(x, y, type = 'stationary') {
        this.x = x;
        this.y = y;
        this.size = CONFIG.TRAINING_TARGET_SIZE;
        this.type = type; // 'stationary' or 'moving'
        this.health = CONFIG.TRAINING_TARGET_HEALTH;
        this.maxHealth = CONFIG.TRAINING_TARGET_HEALTH;
        this.destroyed = false;
        this.respawnTimer = 0;
        this.respawnDelay = CONFIG.TRAINING_TARGET_RESPAWN_TIME;
        
        // Moving target properties
        if (type === 'moving') {
            this.speed = CONFIG.TRAINING_MOVING_TARGET_SPEED;
            this.direction = Math.random() * Math.PI * 2;
            this.changeDirectionTimer = 0;
            this.changeDirectionDelay = 120; // 2 seconds
            this.originalX = x;
            this.originalY = y;
            this.maxDistance = CONFIG.TRAINING_MOVING_TARGET_RANGE; // Maximum distance from spawn point
        }
    }
    
    update() {
        if (this.destroyed) {
            this.respawnTimer++;
            if (this.respawnTimer >= this.respawnDelay) {
                this.respawn();
            }
            return;
        }
        
        if (this.type === 'moving') {
            // Update direction change timer
            this.changeDirectionTimer++;
            if (this.changeDirectionTimer >= this.changeDirectionDelay) {
                this.direction = Math.random() * Math.PI * 2;
                this.changeDirectionTimer = 0;
            }
            
            // Calculate new position
            const newX = this.x + Math.cos(this.direction) * this.speed;
            const newY = this.y + Math.sin(this.direction) * this.speed;
            
            // Check if we're too far from original position
            const distanceFromOrigin = Math.sqrt(
                Math.pow(newX - this.originalX, 2) + Math.pow(newY - this.originalY, 2)
            );
            
            if (distanceFromOrigin > this.maxDistance) {
                // Turn towards origin
                this.direction = Math.atan2(this.originalY - this.y, this.originalX - this.x);
            }
            
            // Check wall collision
            if (!this.checkWallCollision(newX, newY)) {
                this.x = newX;
                this.y = newY;
            } else {
                // Bounce off walls
                this.direction = this.direction + Math.PI + (Math.random() - 0.5) * 0.5;
            }
        }
    }
    
    checkWallCollision(x, y) {
        for (const wall of walls) {
            if (x + this.size > wall.x && x - this.size < wall.x + wall.width &&
                y + this.size > wall.y && y - this.size < wall.y + wall.height) {
                return true;
            }
        }
        return false;
    }
    
    takeDamage() {
        if (this.destroyed) return;
        
        this.health--;
        if (this.health <= 0) {
            this.destroyed = true;
            this.respawnTimer = 0;
            
            // Create explosion effect
            particles.push(new Explosion(this.x, this.y, 30));
        }
    }
    
    respawn() {
        this.destroyed = false;
        this.health = this.maxHealth;
        this.respawnTimer = 0;
        
        if (this.type === 'moving') {
            this.x = this.originalX;
            this.y = this.originalY;
            this.direction = Math.random() * Math.PI * 2;
        }
    }
    
    draw(ctx) {
        if (this.destroyed) return;
        
        ctx.save();
        
        // Target body
        const healthPercent = this.health / this.maxHealth;
        if (this.type === 'stationary') {
            // Bullseye target
            ctx.fillStyle = healthPercent > 0.6 ? '#ff4444' : '#cc3333';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Bullseye rings
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            for (let i = 1; i <= 3; i++) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * (i / 3), 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Center dot
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Moving target - diamond shape
            ctx.fillStyle = healthPercent > 0.6 ? '#4444ff' : '#3333cc';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.size);
            ctx.lineTo(this.x + this.size, this.y);
            ctx.lineTo(this.x, this.y + this.size);
            ctx.lineTo(this.x - this.size, this.y);
            ctx.closePath();
            ctx.fill();
            
            // Inner diamond
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.size * 0.5);
            ctx.lineTo(this.x + this.size * 0.5, this.y);
            ctx.lineTo(this.x, this.y + this.size * 0.5);
            ctx.lineTo(this.x - this.size * 0.5, this.y);
            ctx.closePath();
            ctx.fill();
        }
        
        // Health indicator
        if (this.health < this.maxHealth) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x - this.size, this.y - this.size - 10, 
                        (this.size * 2) * healthPercent, 4);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x - this.size, this.y - this.size - 10, this.size * 2, 4);
        }
        
        ctx.restore();
    }
}

class Drone {
    constructor(owner) {
        this.owner = owner;
        this.x = owner.x;
        this.y = owner.y;
        this.size = CONFIG.DRONE_SIZE;
        this.health = CONFIG.DRONE_HEALTH;
        this.maxHealth = CONFIG.DRONE_HEALTH;
        this.alive = true;
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.orbitDistance = CONFIG.DRONE_ORBIT_DISTANCE;
        this.reloadTime = 0;
        this.target = null;
        this.targetingRange = CONFIG.DRONE_TARGET_RANGE;
    }
    
    update() {
        if (!this.alive || !this.owner.alive) {
            this.alive = false;
            return;
        }
        
        // Orbit around owner
        this.orbitAngle += CONFIG.DRONE_ORBIT_SPEED;
        this.x = this.owner.x + Math.cos(this.orbitAngle) * this.orbitDistance;
        this.y = this.owner.y + Math.sin(this.orbitAngle) * this.orbitDistance;
        
        // Update reload timer
        if (this.reloadTime > 0) {
            this.reloadTime--;
        }
        
        // Find nearest enemy tank
        this.target = this.findNearestEnemy();
        
        // Auto-shoot at target
        if (this.target && this.reloadTime === 0) {
            this.shootAtTarget();
            this.reloadTime = CONFIG.DRONE_RELOAD_TIME;
        }
    }
    
    findNearestEnemy() {
        let nearestEnemy = null;
        let nearestDistance = this.targetingRange;
        
        for (const tank of tanks) {
            if (tank === this.owner || !tank.alive) continue;
            
            const distance = Math.sqrt(
                Math.pow(this.x - tank.x, 2) + Math.pow(this.y - tank.y, 2)
            );
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = tank;
            }
        }
        
        return nearestEnemy;
    }
    
    shootAtTarget() {
        if (!this.target) return;
        
        // Calculate angle to target
        const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        
        // Create bullet
        const bullet = new Bullet(
            this.x,
            this.y,
            angle,
            CONFIG.DRONE_BULLET_SPEED,
            this.owner.playerNum,
            'drone'
        );
        bullet.size = CONFIG.DRONE_BULLET_SIZE;
        bullets.push(bullet);
    }
    
    takeDamage() {
        if (!this.alive) return;
        
        this.health--;
        if (this.health <= 0) {
            this.alive = false;
            
            // Create small explosion
            particles.push(new Explosion(this.x, this.y, 15));
        }
    }
    
    draw(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Main body
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#4169E1' : '#DC143C';
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Body outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Rotor (animated)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        const rotorSpeed = Date.now() * 0.02;
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 * i / 4) + rotorSpeed;
            const x1 = Math.cos(angle) * (this.size - 2);
            const y1 = Math.sin(angle) * (this.size - 2);
            const x2 = Math.cos(angle + Math.PI) * (this.size - 2);
            const y2 = Math.sin(angle + Math.PI) * (this.size - 2);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        // Eye/sensor
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(0, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Connection line to owner (faint)
        if (this.owner && this.owner.alive) {
            ctx.strokeStyle = 'rgba(65, 105, 225, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.owner.x - this.x, this.owner.y - this.y);
            ctx.stroke();
        }
        
        // Health bar (if damaged)
        if (this.health < this.maxHealth) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-this.size, -this.size - 8, 
                        (this.size * 2) * healthPercent, 3);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(-this.size, -this.size - 8, this.size * 2, 3);
        }
        
        ctx.restore();
    }
}

class RingOfFire {
    constructor() {
        this.active = false;
        this.radius = Math.max(canvas.width, canvas.height);
        // Random center position for each round - scale with map size
        const margin = Math.min(canvas.width, canvas.height) * 0.2;
        this.centerX = margin + Math.random() * (canvas.width - margin * 2);
        this.centerY = margin + Math.random() * (canvas.height - margin * 2);
        this.minRadius = Math.min(canvas.width, canvas.height) * 0.15; // Scale safe zone with map
        this.shrinkSpeed = Math.min(canvas.width, canvas.height) * 0.0003; // Scale shrink speed
        this.damageTimer = 0;
        this.warningTime = 30000; // 30 seconds before it starts
        this.startTime = Date.now();
        
        // Enhanced animation properties
        this.fireParticles = [];
        this.animationTime = 0;
        this.shakeIntensity = 0;
        this.initializeFireParticles();
    }
    
    initializeFireParticles() {
        // Create animated fire particles around the circumference
        const particleCount = 120;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            this.fireParticles.push({
                angle: angle,
                baseRadius: 0,
                radiusOffset: Math.random() * 20 - 10,
                size: 4 + Math.random() * 8,
                life: Math.random(),
                maxLife: 0.5 + Math.random() * 1.5,
                speed: 0.02 + Math.random() * 0.04,
                flickerSpeed: 0.1 + Math.random() * 0.2,
                colorPhase: Math.random() * Math.PI * 2
            });
        }
    }
    
    update() {
        const elapsed = Date.now() - this.startTime;
        this.animationTime += 0.016; // ~60fps timing
        
        if (elapsed > this.warningTime && !this.active) {
            this.active = true;
        }
        
        if (this.active && this.radius > this.minRadius) {
            this.radius -= this.shrinkSpeed;
            // Increase shake intensity as ring gets smaller
            this.shakeIntensity = Math.max(0, (1 - this.radius / (Math.max(canvas.width, canvas.height) * 0.5)) * 3);
        }
        
        // Update fire particles
        this.fireParticles.forEach(particle => {
            particle.baseRadius = this.radius;
            particle.life += particle.speed;
            particle.colorPhase += particle.flickerSpeed;
            
            // Reset particle when it reaches max life
            if (particle.life >= particle.maxLife) {
                particle.life = 0;
                particle.radiusOffset = Math.random() * 30 - 15;
                particle.size = 3 + Math.random() * 10;
            }
        });
        
        // Check if tanks are outside the ring
        if (this.active) {
            this.damageTimer++;
            if (this.damageTimer > 60) { // Damage every second (60 frames)
                this.damageTimer = 0;
                tanks.forEach(tank => {
                    if (tank.alive) {
                        const distance = Math.sqrt(
                            (tank.x - this.centerX) ** 2 + 
                            (tank.y - this.centerY) ** 2
                        );
                        if (distance > this.radius - 20) {
                            // Tank is in the fire, take damage
                            // Create fire particles for damage effect
                            for (let i = 0; i < 5; i++) {
                                particles.push(new Particle(tank.x, tank.y, '#FF4500'));
                            }
                            // Give the tank a chance to escape before destroying
                            if (distance > this.radius + 10) {
                                tank.destroy();
                                // Don't trigger round end here, let the normal game flow handle it
                            }
                        }
                    }
                });
            }
        }
    }
    
    draw() {
        const elapsed = Date.now() - this.startTime;
        
        // Apply screen shake if active
        if (this.active && this.shakeIntensity > 0) {
            const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            ctx.save();
            ctx.translate(shakeX, shakeY);
        }
        
        // Draw warning timer
        if (elapsed < this.warningTime) {
            const timeLeft = Math.ceil((this.warningTime - elapsed) / 1000);
            ctx.save();
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#FF0000';
            ctx.textAlign = 'center';
            ctx.fillText(`RING OF FIRE IN: ${timeLeft}`, canvas.width / 2, 40);
            ctx.restore();
        }
        
        // Draw the ring
        if (this.active || elapsed > this.warningTime - 3000) {
            ctx.save();
            
            // Create gradient for fire effect
            const gradient = ctx.createRadialGradient(
                this.centerX, this.centerY, Math.max(0, this.radius - 50),
                this.centerX, this.centerY, this.radius + 50
            );
            
            if (this.active) {
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
                gradient.addColorStop(0.7, 'rgba(255, 100, 0, 0.2)');
                gradient.addColorStop(0.85, 'rgba(255, 69, 0, 0.5)');
                gradient.addColorStop(0.95, 'rgba(255, 0, 0, 0.8)');
                gradient.addColorStop(1, 'rgba(139, 0, 0, 1)');
            } else {
                // Warning phase - lighter colors
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
                gradient.addColorStop(0.8, 'rgba(255, 165, 0, 0.1)');
                gradient.addColorStop(1, 'rgba(255, 69, 0, 0.3)');
            }
            
            // Draw the ring
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw fire particles on the edge
            if (this.active) {
                for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
                    if (Math.random() > 0.5) {
                        const x = this.centerX + Math.cos(angle) * this.radius;
                        const y = this.centerY + Math.sin(angle) * this.radius;
                        const size = 5 + Math.random() * 10;
                        
                        ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, ${0.5 + Math.random() * 0.5})`;
                        ctx.beginPath();
                        ctx.arc(x, y, size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                
                // Draw inner fire boundary
                ctx.strokeStyle = '#FF4500';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.restore();
        }
        
        // Draw safe zone indicator - show final safe zone from the start
        ctx.save();
        if (!this.active && elapsed < this.warningTime) {
            // Before fire starts, show where the final safe zone will be
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 15]);
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, this.minRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Label for safe zone
            ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SAFE ZONE', this.centerX, this.centerY);
        } else if (this.active) {
            // During fire, show current safe boundary
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, this.radius - 30, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
        
        // Restore screen shake transformation
        if (this.active && this.shakeIntensity > 0) {
            ctx.restore();
        }
    }
}


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

function createScoreBoard() {
    const scoreBoard = document.getElementById('scoreBoard');
    scoreBoard.innerHTML = '';
    
    tanks.forEach(tank => {
        const tankColor = tank.color;
        const tankName = tank.isAI ? `AI ${tank.playerNum}` : `Player ${tank.playerNum}`;
        
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'score';
        scoreDiv.innerHTML = `
            <div class="score-name" style="color: ${tankColor};">${tankName}</div>
            <div class="score-stats">
                <div>Wins: <span id="score${tank.playerNum}">0</span></div>
                <div>Kills: <span id="kills${tank.playerNum}">0</span></div>
                <div><span id="powerup${tank.playerNum}">🔸</span> <span id="ammo${tank.playerNum}">${tank.specialAmmo}</span>/${tank.maxSpecialAmmo}</div>
            </div>
            <div class="reload-bar-container">
                <div class="reload-bar" id="reload${tank.playerNum}"></div>
            </div>
        `;
        scoreBoard.appendChild(scoreDiv);
        
        // Initialize scores
        scores[`player${tank.playerNum}`] = 0;
        kills[`player${tank.playerNum}`] = 0;
        // Points system removed
    });
}

function updateReloadBars() {
    tanks.forEach(tank => {
        const reloadBar = document.getElementById(`reload${tank.playerNum}`);
        if (reloadBar && tank.alive) {
            const reloadPercent = Math.max(0, ((60 - tank.reloadTime) / 60) * 100);
            reloadBar.style.width = `${reloadPercent}%`;
        }
    });
}

function updateAmmoDisplays() {
    tanks.forEach(tank => {
        const ammoElement = document.getElementById(`ammo${tank.playerNum}`);
        const powerupElement = document.getElementById(`powerup${tank.playerNum}`);
        
        if (ammoElement) {
            ammoElement.textContent = tank.specialAmmo;
        }
        
        if (powerupElement) {
            powerupElement.textContent = getPowerUpSymbol(tank.powerUp);
        }
    });
}

function getPowerUpSymbol(powerUpType) {
    switch(powerUpType) {
        case 'scatter': return '💥'; // Explosion/multiple bullets
        case 'laser': return '⚡'; // Lightning for laser
        case 'rocket': return '🚀'; // Rocket
        case 'explosive': return '💣'; // Bomb
        case 'piercing': return '🏹'; // Arrow for piercing
        case 'mine': return '💎'; // Diamond for mine
        case 'drone': return '🤖'; // Robot for drone
        default: return '🔸'; // Default diamond when no power-up
    }
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

// Function removed - blue point collectibles disabled
/*
function spawnRandomCollectible() {
    // Function removed to disable blue point collectibles
}
*/

// selectMapSize function moved to menu.js

// startGame function moved to menu.js

function init() {
    tanks = [];
    bullets = [];
    particles = [];
    powerUps = [];
    // collectibles = []; // Removed blue points system
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
    
    // Blue collectible points removed
    
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
            // Test error handling - remove this after testing
            // throw new Error('Test error to verify try-catch works');
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
        
        // Random collectible spawning
        try {
            // Collectible spawning removed
        } catch (error) {
            console.error('[UPDATE ERROR] Collectible spawning failed:', error);
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
        
        // Collectibles update removed
        
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
    // collectibles = []; // Removed blue points system
    
    for (let i = 0; i < 2; i++) {
        const powerUpPos = generateSafeItemPosition();
        powerUps.push(new PowerUp(powerUpPos.x, powerUpPos.y));
    }
    
    // Blue collectibles spawning removed
    
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
    // collectibles.forEach(collectible => collectible.draw()); // Removed blue points drawing
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
    // CONFIG.COLLECTIBLE_COUNT removed - blue points system disabled
    
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
    // document.getElementById('collectibleCount').value = CONFIG.COLLECTIBLE_COUNT; // Removed
    
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
    // CONFIG.COLLECTIBLE_COUNT = parseInt(document.getElementById('collectibleCount').value); // Removed
    
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

// Terrain system functions
function generateTerrainTiles() {
    // Clear existing terrain and obstacles
    terrainTiles = [];
    terrainFeatures = [];
    obstacleTiles = [];
    walls = [];
    terrainCached = false;
    
    const gridWidth = Math.ceil(canvas.width / TILE_SIZE);
    const gridHeight = Math.ceil(canvas.height / TILE_SIZE);
    
    // Initialize all tiles as grass first
    for (let x = 0; x < canvas.width; x += TILE_SIZE) {
        for (let y = 0; y < canvas.height; y += TILE_SIZE) {
            terrainTiles.push({
                x: x,
                y: y,
                size: TILE_SIZE,
                type: 'grass',
                baseColor: '#7A8B5D',
                variation: Math.random() * 0.2 - 0.1 // Color variation
            });
        }
    }
    
    // Generate connected sand patches with more organic shapes
    const sandPatchCount = Math.floor(Math.random() * 3) + 2; // 2-4 sand patches
    for (let i = 0; i < sandPatchCount; i++) {
        const basePatchSize = Math.floor(Math.random() * 3) + 3; // 3x3 to 5x5 base patches
        const centerX = Math.floor(Math.random() * (gridWidth - basePatchSize));
        const centerY = Math.floor(Math.random() * (gridHeight - basePatchSize));
        
        // Create main sand patch
        for (let x = 0; x < basePatchSize; x++) {
            for (let y = 0; y < basePatchSize; y++) {
                const tileX = centerX + x;
                const tileY = centerY + y;
                
                if (tileX < gridWidth && tileY < gridHeight) {
                    const tileIndex = tileY * gridWidth + tileX;
                    if (tileIndex < terrainTiles.length) {
                        terrainTiles[tileIndex].type = 'sand';
                        terrainTiles[tileIndex].baseColor = '#C4B5A0';
                    }
                }
            }
        }
        
        // Add organic extensions to make patches more connected and natural
        const extensionCount = Math.floor(Math.random() * 4) + 2; // 2-5 extensions
        for (let ext = 0; ext < extensionCount; ext++) {
            const extSize = Math.floor(Math.random() * 2) + 1; // 1x1 to 2x2 extensions
            const extX = centerX + Math.floor(Math.random() * (basePatchSize + 2)) - 1;
            const extY = centerY + Math.floor(Math.random() * (basePatchSize + 2)) - 1;
            
            for (let x = 0; x < extSize; x++) {
                for (let y = 0; y < extSize; y++) {
                    const tileX = extX + x;
                    const tileY = extY + y;
                    
                    if (tileX >= 0 && tileX < gridWidth && tileY >= 0 && tileY < gridHeight) {
                        const tileIndex = tileY * gridWidth + tileX;
                        if (tileIndex < terrainTiles.length) {
                            terrainTiles[tileIndex].type = 'sand';
                            terrainTiles[tileIndex].baseColor = '#C4B5A0';
                        }
                    }
                }
            }
        }
    }
    
    // Generate terrain features
    const featureCount = Math.floor(Math.random() * 10) + 15;
    for (let i = 0; i < featureCount; i++) {
        const featureType = Math.random();
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        
        if (featureType < 0.3) {
            // Crater
            terrainFeatures.push({
                type: 'crater',
                x: x,
                y: y,
                radius: (Math.random() * 30 + 20) * CONFIG.GLOBAL_SCALE,
                depth: Math.random() * 0.3 + 0.2
            });
        } else if (featureType < 0.5) {
            // Tire tracks
            terrainFeatures.push({
                type: 'tracks',
                x: x,
                y: y,
                angle: Math.random() * Math.PI * 2,
                length: (Math.random() * 80 + 40) * CONFIG.GLOBAL_SCALE,
                width: (Math.random() * 10 + 8) * CONFIG.GLOBAL_SCALE
            });
        } else if (featureType < 0.7) {
            // Rock/debris
            terrainFeatures.push({
                type: 'debris',
                x: x,
                y: y,
                size: (Math.random() * 15 + 5) * CONFIG.GLOBAL_SCALE,
                angle: Math.random() * Math.PI * 2
            });
        } else {
            // Vegetation patch
            terrainFeatures.push({
                type: 'vegetation',
                x: x,
                y: y,
                radius: (Math.random() * 25 + 15) * CONFIG.GLOBAL_SCALE
            });
        }
    }
    
    // Generate obstacles (walls and water)
    generateObstacles();
}

function generateObstacles() {
    const gridWidth = Math.ceil(canvas.width / TILE_SIZE);
    const gridHeight = Math.ceil(canvas.height / TILE_SIZE);
    
    // Generate walls with wrapping support and varied sizes - balanced for gameplay
    const wallCount = Math.floor(Math.random() * 7) + 5; // 5-11 walls (reduced count)
    for (let i = 0; i < wallCount; i++) {
        // Random wall lengths - balanced to not block too much space
        const sizeCategory = Math.random();
        let wallLength;
        
        if (sizeCategory < 0.35) {
            // Short wall (2-3 tiles)
            wallLength = Math.floor(Math.random() * 2) + 2;
        } else if (sizeCategory < 0.7) {
            // Medium wall (4-5 tiles)
            wallLength = Math.floor(Math.random() * 2) + 4;
        } else if (sizeCategory < 0.9) {
            // Long wall (6-7 tiles)
            wallLength = Math.floor(Math.random() * 2) + 6;
        } else {
            // Very long wall (8-10 tiles) - rare
            wallLength = Math.floor(Math.random() * 3) + 8;
        }
        
        const horizontal = Math.random() < 0.5;
        
        // Allow walls to start anywhere, including wrapping positions
        let startX = Math.floor(Math.random() * gridWidth);
        let startY = Math.floor(Math.random() * gridHeight);
        
        if (horizontal) {
            // Add wall tiles with wrapping
            for (let j = 0; j < wallLength; j++) {
                const tileX = (startX + j) % gridWidth;
                
                // Check if water exists at this position
                const waterExists = obstacleTiles.find(tile => 
                    tile.x === tileX && tile.y === startY && tile.type === 'water'
                );
                
                if (!waterExists) {
                    obstacleTiles.push({
                        x: tileX,
                        y: startY,
                        type: 'wall'
                    });
                    
                    // Add to walls array for collision detection
                    // 50% chance for destructible wall
                    const isDestructible = Math.random() < 0.5;
                    walls.push(isDestructible ? 
                        new DestructibleWall(
                            tileX * TILE_SIZE,
                            startY * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        ) :
                        new Wall(
                            tileX * TILE_SIZE,
                            startY * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        )
                    );
                }
            }
        } else {
            // Add vertical wall tiles with wrapping
            for (let j = 0; j < wallLength; j++) {
                const tileY = (startY + j) % gridHeight;
                
                // Check if water exists at this position
                const waterExists = obstacleTiles.find(tile => 
                    tile.x === startX && tile.y === tileY && tile.type === 'water'
                );
                
                if (!waterExists) {
                    obstacleTiles.push({
                        x: startX,
                        y: tileY,
                        type: 'wall'
                    });
                    
                    // Add to walls array for collision detection
                    // 50% chance for destructible wall
                    const isDestructible = Math.random() < 0.5;
                    walls.push(isDestructible ?
                        new DestructibleWall(
                            startX * TILE_SIZE,
                            tileY * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        ) :
                        new Wall(
                            startX * TILE_SIZE,
                            tileY * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        )
                    );
                }
            }
        }
    }
    
    // Generate water bodies - balanced for gameplay
    const waterBodyCount = Math.floor(Math.random() * 2) + 2; // 2-3 water bodies
    const waterBodies = []; // Track water body locations
    
    for (let i = 0; i < waterBodyCount; i++) {
        // Random water body sizes - balanced to preserve play space
        const sizeCategory = Math.random();
        let waterSizeX, waterSizeY;
        
        if (sizeCategory < 0.4) {
            // Small pond (3x3 to 4x4)
            waterSizeX = Math.floor(Math.random() * 2) + 3;
            waterSizeY = Math.floor(Math.random() * 2) + 3;
        } else if (sizeCategory < 0.75) {
            // Medium lake (5x5 to 7x7)
            waterSizeX = Math.floor(Math.random() * 3) + 5;
            waterSizeY = Math.floor(Math.random() * 3) + 5;
        } else {
            // Large lake (8x6 to 10x8) - still big but not overwhelming
            waterSizeX = Math.floor(Math.random() * 3) + 8;
            waterSizeY = Math.floor(Math.random() * 3) + 6;
            // Sometimes make it wider than tall
            if (Math.random() < 0.5) {
                const temp = waterSizeX;
                waterSizeX = waterSizeY;
                waterSizeY = temp;
            }
        }
        
        // Allow water to start anywhere, even outside the map (for wrapping)
        const centerX = Math.floor(Math.random() * (gridWidth + waterSizeX)) - Math.floor(waterSizeX / 2);
        const centerY = Math.floor(Math.random() * (gridHeight + waterSizeY)) - Math.floor(waterSizeY / 2);
        
        // Store the actual wrapped positions
        const wrappedCenterX = ((centerX % gridWidth) + gridWidth) % gridWidth;
        const wrappedCenterY = ((centerY % gridHeight) + gridHeight) % gridHeight;
        waterBodies.push({ 
            centerX: wrappedCenterX, 
            centerY: wrappedCenterY, 
            sizeX: waterSizeX,
            sizeY: waterSizeY,
            originalCenterX: centerX,
            originalCenterY: centerY
        });
        
        // Create water body with organic shape
        for (let x = 0; x < waterSizeX; x++) {
            for (let y = 0; y < waterSizeY; y++) {
                // Add some randomness to create more organic shapes
                const distFromCenter = Math.sqrt(
                    Math.pow((x - waterSizeX/2) / (waterSizeX/2), 2) + 
                    Math.pow((y - waterSizeY/2) / (waterSizeY/2), 2)
                );
                
                // Create irregular edges
                if (distFromCenter < 1.2 + Math.random() * 0.3) {
                    // Calculate wrapped tile position
                    const tileX = ((centerX + x) % gridWidth + gridWidth) % gridWidth;
                    const tileY = ((centerY + y) % gridHeight + gridHeight) % gridHeight;
                    
                    // Check if position is already occupied by walls
                    const existingObstacle = obstacleTiles.find(tile => 
                        tile.x === tileX && tile.y === tileY
                    );
                    
                    if (!existingObstacle) {
                        obstacleTiles.push({
                            x: tileX,
                            y: tileY,
                            type: 'water'
                        });
                    }
                }
            }
        }
    }
    
    
    // Generate underground tunnel entrances
    // generateTunnelSystem(); // DISABLED FOR NOW
}

function generateTunnelSystem() {
    tunnelEntrances = [];
    tunnelNetwork.clear();
    
    // Generate 2-3 tunnel pairs (each tunnel has exactly 2 ends)
    const tunnelPairCount = Math.floor(Math.random() * 2) + 2; // 2-3 tunnel pairs
    const minDistance = 250 * CONFIG.GLOBAL_SCALE; // Minimum distance between portal ends
    
    for (let i = 0; i < tunnelPairCount; i++) {
        let validPair = false;
        let attempts = 0;
        let x1, y1, x2, y2;
        
        while (!validPair && attempts < 50) {
            // Generate first portal entrance
            x1 = Math.random() * (canvas.width - 100) + 50;
            y1 = Math.random() * (canvas.height - 100) + 50;
            
            // Generate second portal entrance (far from first)
            x2 = Math.random() * (canvas.width - 100) + 50;
            y2 = Math.random() * (canvas.height - 100) + 50;
            
            const pairDistance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            
            validPair = pairDistance >= minDistance;
            
            // Check not too close to existing entrances
            for (let entrance of tunnelEntrances) {
                const dist1 = Math.sqrt(Math.pow(x1 - entrance.x, 2) + Math.pow(y1 - entrance.y, 2));
                const dist2 = Math.sqrt(Math.pow(x2 - entrance.x, 2) + Math.pow(y2 - entrance.y, 2));
                if (dist1 < 100 || dist2 < 100) {
                    validPair = false;
                    break;
                }
            }
            
            // Check not on walls or water
            for (let wall of walls) {
                if ((x1 > wall.x - 30 && x1 < wall.x + wall.width + 30 &&
                     y1 > wall.y - 30 && y1 < wall.y + wall.height + 30) ||
                    (x2 > wall.x - 30 && x2 < wall.x + wall.width + 30 &&
                     y2 > wall.y - 30 && y2 < wall.y + wall.height + 30)) {
                    validPair = false;
                    break;
                }
            }
            
            attempts++;
        }
        
        if (validPair) {
            // Create entrance 1
            const entrance1 = {
                id: i * 2,
                x: x1,
                y: y1,
                radius: 25 * CONFIG.GLOBAL_SCALE,
                partnerId: i * 2 + 1,
                color: `hsl(${i * 120}, 70%, 40%)` // Different color for each tunnel pair
            };
            
            // Create entrance 2
            const entrance2 = {
                id: i * 2 + 1,
                x: x2,
                y: y2,
                radius: 25 * CONFIG.GLOBAL_SCALE,
                partnerId: i * 2,
                color: `hsl(${i * 120}, 70%, 40%)` // Same color as partner
            };
            
            tunnelEntrances.push(entrance1);
            tunnelEntrances.push(entrance2);
            
            // Simple two-way connection
            tunnelNetwork.set(entrance1.id, entrance2.id);
            tunnelNetwork.set(entrance2.id, entrance1.id);
        }
    }
    
    console.log(`Generated ${tunnelEntrances.length} tunnel entrances (${tunnelEntrances.length / 2} pairs)`);
}

function renderTerrainToCache() {
    const tileSize = 40 * CONFIG.GLOBAL_SCALE;
    
    // Base ground color
    terrainCtx.fillStyle = '#8B7D6B';
    terrainCtx.fillRect(0, 0, terrainCanvas.width, terrainCanvas.height);
    
    // Draw tiles with variations
    terrainTiles.forEach((tile) => {
        // Apply color variation
        const r = parseInt(tile.baseColor.substr(1, 2), 16);
        const g = parseInt(tile.baseColor.substr(3, 2), 16);
        const b = parseInt(tile.baseColor.substr(5, 2), 16);
        
        const variation = tile.variation;
        const newR = Math.max(0, Math.min(255, r + r * variation));
        const newG = Math.max(0, Math.min(255, g + g * variation));
        const newB = Math.max(0, Math.min(255, b + b * variation));
        
        terrainCtx.fillStyle = `rgb(${Math.floor(newR)}, ${Math.floor(newG)}, ${Math.floor(newB)})`;
        terrainCtx.fillRect(tile.x, tile.y, tile.size - 1, tile.size - 1);
        
        // Add texture patterns based on tile type
        terrainCtx.save();
        if (tile.type === 'gravel') {
            // Draw small dots for gravel texture
            terrainCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            for (let i = 0; i < 5; i++) {
                const dx = tile.x + Math.random() * tile.size;
                const dy = tile.y + Math.random() * tile.size;
                terrainCtx.beginPath();
                terrainCtx.arc(dx, dy, 1, 0, Math.PI * 2);
                terrainCtx.fill();
            }
        } else if (tile.type === 'sand') {
            // Draw subtle lines for sand texture
            terrainCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            terrainCtx.lineWidth = 1;
            terrainCtx.beginPath();
            terrainCtx.moveTo(tile.x, tile.y + tile.size * 0.3);
            terrainCtx.lineTo(tile.x + tile.size, tile.y + tile.size * 0.7);
            terrainCtx.stroke();
        } else if (tile.type === 'grass') {
            // Draw small lines for grass texture
            terrainCtx.strokeStyle = 'rgba(100, 140, 60, 0.3)';
            terrainCtx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const gx = tile.x + Math.random() * tile.size;
                const gy = tile.y + Math.random() * tile.size;
                terrainCtx.beginPath();
                terrainCtx.moveTo(gx, gy);
                terrainCtx.lineTo(gx + 2, gy - 4);
                terrainCtx.stroke();
            }
        }
        terrainCtx.restore();
    });
    
    // Draw terrain features
    terrainFeatures.forEach(feature => {
        terrainCtx.save();
        
        if (feature.type === 'crater') {
            // Draw crater
            const gradient = terrainCtx.createRadialGradient(
                feature.x, feature.y, 0,
                feature.x, feature.y, feature.radius
            );
            gradient.addColorStop(0, `rgba(40, 30, 20, ${feature.depth})`);
            gradient.addColorStop(0.7, `rgba(50, 40, 30, ${feature.depth * 0.5})`);
            gradient.addColorStop(1, 'rgba(60, 50, 40, 0)');
            terrainCtx.fillStyle = gradient;
            terrainCtx.beginPath();
            terrainCtx.arc(feature.x, feature.y, feature.radius, 0, Math.PI * 2);
            terrainCtx.fill();
            
            // Add rim highlight
            terrainCtx.strokeStyle = 'rgba(80, 70, 60, 0.2)';
            terrainCtx.lineWidth = 2;
            terrainCtx.stroke();
        } else if (feature.type === 'tracks') {
            // Draw tire tracks
            terrainCtx.translate(feature.x, feature.y);
            terrainCtx.rotate(feature.angle);
            terrainCtx.fillStyle = 'rgba(40, 35, 30, 0.15)';
            
            // Left track
            terrainCtx.fillRect(-feature.width/2 - 2, -feature.length/2, 3, feature.length);
            // Right track
            terrainCtx.fillRect(feature.width/2 - 1, -feature.length/2, 3, feature.length);
            
            // Track pattern
            terrainCtx.fillStyle = 'rgba(30, 25, 20, 0.1)';
            for (let i = -feature.length/2; i < feature.length/2; i += 8) {
                terrainCtx.fillRect(-feature.width/2 - 3, i, 5, 4);
                terrainCtx.fillRect(feature.width/2 - 2, i, 5, 4);
            }
        } else if (feature.type === 'debris') {
            // Draw small rocks/debris
            terrainCtx.translate(feature.x, feature.y);
            terrainCtx.rotate(feature.angle);
            terrainCtx.fillStyle = 'rgba(60, 55, 50, 0.4)';
            terrainCtx.beginPath();
            terrainCtx.moveTo(-feature.size/2, 0);
            terrainCtx.lineTo(0, -feature.size/2);
            terrainCtx.lineTo(feature.size/2, 0);
            terrainCtx.lineTo(0, feature.size/2);
            terrainCtx.closePath();
            terrainCtx.fill();
            
            // Add shadow
            terrainCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            terrainCtx.beginPath();
            terrainCtx.ellipse(2, 2, feature.size/2, feature.size/3, 0, 0, Math.PI * 2);
            terrainCtx.fill();
        } else if (feature.type === 'vegetation') {
            // Draw vegetation patches
            const gradient = terrainCtx.createRadialGradient(
                feature.x, feature.y, 0,
                feature.x, feature.y, feature.radius
            );
            gradient.addColorStop(0, 'rgba(100, 120, 70, 0.2)');
            gradient.addColorStop(1, 'rgba(90, 110, 60, 0)');
            terrainCtx.fillStyle = gradient;
            terrainCtx.beginPath();
            terrainCtx.arc(feature.x, feature.y, feature.radius, 0, Math.PI * 2);
            terrainCtx.fill();
            
            // Add some grass blades
            terrainCtx.strokeStyle = 'rgba(80, 100, 50, 0.3)';
            terrainCtx.lineWidth = 1;
            for (let i = 0; i < 8; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * feature.radius;
                const gx = feature.x + Math.cos(angle) * dist;
                const gy = feature.y + Math.sin(angle) * dist;
                terrainCtx.beginPath();
                terrainCtx.moveTo(gx, gy);
                terrainCtx.lineTo(gx + Math.random() * 4 - 2, gy - 5);
                terrainCtx.stroke();
            }
        }
        
        terrainCtx.restore();
    });
}

function drawBattlefieldTerrain() {
    // First, fill entire background with grass
    if (grassLoaded) {
        const tileSize = TILE_SIZE;
        const cols = Math.ceil(canvas.width / tileSize);
        const rows = Math.ceil(canvas.height / tileSize);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                ctx.drawImage(
                    grassImage,
                    col * tileSize,
                    row * tileSize,
                    tileSize,
                    tileSize
                );
            }
        }
    } else {
        // Fallback to grass-colored rectangle
        ctx.fillStyle = '#7A8B5D';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Then draw organic shapes for sand terrain patches on top
    if (terrainTiles.length > 0) {
        const sandTiles = terrainTiles.filter(tile => tile.type === 'sand');
        if (sandTiles.length > 0) {
            // Convert terrain tiles to grid coordinates for drawOrganicObstacleShape
            const sandGridTiles = sandTiles.map(tile => ({
                x: Math.floor(tile.x / TILE_SIZE),
                y: Math.floor(tile.y / TILE_SIZE),
                type: 'sand'
            }));
            // Use the same connected shape drawing as walls and water
            drawOrganicObstacleShape(ctx, sandGridTiles, sandLoaded ? sandImage : null, '#C4B5A0', '#D4A574', TILE_SIZE);
        }
    }
    
    // Finally draw organic shapes for obstacles (walls and water) on top
    if (obstacleTiles.length > 0) {
        const wallTiles = obstacleTiles.filter(tile => tile.type === 'wall');
        const waterTiles = obstacleTiles.filter(tile => tile.type === 'water');
        
        // Draw water tiles
        if (waterTiles.length > 0) {
            drawOrganicObstacleShape(ctx, waterTiles, waterLoaded ? waterImage : null, '#4682B4', '#1565C0', TILE_SIZE);
        }
        
        // Draw walls using their individual draw methods (to show destructible walls)
        // First draw regular walls using organic shape
        const regularWallTiles = [];
        const destructibleWallPositions = new Set();
        
        // Identify which tiles belong to destructible walls
        walls.forEach(wall => {
            if (wall instanceof DestructibleWall) {
                const tileX = Math.floor(wall.x / TILE_SIZE);
                const tileY = Math.floor(wall.y / TILE_SIZE);
                destructibleWallPositions.add(`${tileX},${tileY}`);
            }
        });
        
        // Separate regular wall tiles from destructible ones
        wallTiles.forEach(tile => {
            const key = `${tile.x},${tile.y}`;
            if (!destructibleWallPositions.has(key)) {
                regularWallTiles.push(tile);
            }
        });
        
        // Draw regular walls with organic shape
        if (regularWallTiles.length > 0) {
            drawOrganicObstacleShape(ctx, regularWallTiles, wallLoaded ? wallImage : null, '#8B4513', '#5D4E37', TILE_SIZE);
        }
        
        // Draw destructible walls using their custom draw method
        walls.forEach(wall => {
            if (wall instanceof DestructibleWall) {
                wall.draw();
            }
        });
    }
    
    // Draw tunnel entrances
    // drawTunnelEntrances(); // DISABLED FOR NOW
    
    // Obstacles are now drawn with organic shapes above
    
    // Organic shapes are now drawn within drawBattlefieldTerrain()
    
    // Border removed for seamless edge wrapping
}

function drawTeleportEffects() {
    // Update and draw teleport effects
    for (let i = teleportEffects.length - 1; i >= 0; i--) {
        const effect = teleportEffects[i];
        
        // Update effect
        if (effect.radius < effect.maxRadius) {
            effect.radius += 3; // Expand
        } else if (effect.radius > effect.maxRadius) {
            effect.radius -= 3; // Contract
        }
        
        effect.opacity -= 0.02;
        
        // Remove finished effects
        if (effect.opacity <= 0) {
            teleportEffects.splice(i, 1);
            continue;
        }
        
        // Draw effect
        ctx.save();
        ctx.globalAlpha = effect.opacity;
        
        // Ripple effect
        ctx.strokeStyle = effect.color || '#00FFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner glow
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.radius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Particles
        const particleCount = 8;
        for (let j = 0; j < particleCount; j++) {
            const angle = (Math.PI * 2 / particleCount) * j + (Date.now() * 0.002);
            const px = effect.x + Math.cos(angle) * effect.radius;
            const py = effect.y + Math.sin(angle) * effect.radius;
            
            ctx.fillStyle = effect.color || '#00FFFF';
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

function drawTunnelEntrances() {
    tunnelEntrances.forEach(entrance => {
        ctx.save();
        
        // Draw portal with color coding
        const gradient = ctx.createRadialGradient(
            entrance.x, entrance.y, 0,
            entrance.x, entrance.y, entrance.radius
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
        gradient.addColorStop(0.6, entrance.color || 'rgba(20, 20, 20, 0.7)');
        gradient.addColorStop(1, 'rgba(40, 40, 40, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(entrance.x, entrance.y, entrance.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw portal ring with color
        ctx.strokeStyle = entrance.color || '#444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(entrance.x, entrance.y, entrance.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw swirling effect
        ctx.save();
        ctx.translate(entrance.x, entrance.y);
        ctx.rotate(Date.now() * 0.001);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, entrance.radius * 0.7, 0, Math.PI);
        ctx.stroke();
        ctx.restore();
        
        // Draw pulsing glow
        const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 0.8;
        ctx.shadowBlur = 15 * pulse;
        ctx.shadowColor = entrance.color || 'rgba(0, 100, 200, 0.5)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(entrance.x, entrance.y, entrance.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    });
}

function drawOrganicTerrain(ctx) {
    // Draw organic shapes for obstacles
    if (obstacleTiles.length > 0) {
        const wallTiles = obstacleTiles.filter(tile => tile.type === 'wall');
        const waterTiles = obstacleTiles.filter(tile => tile.type === 'water');
        
        if (wallTiles.length > 0) {
            drawOrganicObstacleShape(ctx, wallTiles, wallLoaded ? wallImage : null, '#8B4513', '#5D4E37', TILE_SIZE); // Brown walls
        }
        
        if (waterTiles.length > 0) {
            drawOrganicObstacleShape(ctx, waterTiles, waterLoaded ? waterImage : null, '#4682B4', '#1565C0', TILE_SIZE); // Blue water
        }
    }
    
    // Draw organic shapes for sand terrain
    if (terrainTiles.length > 0) {
        const sandPatches = terrainTiles.filter(tile => tile.type === 'sand');
        if (sandPatches.length > 0) {
            drawOrganicTerrainShape(ctx, sandPatches, '#C4B5A0', '#D4A574');
        }
    }
}

function drawOrganicObstacleShape(ctx, tiles, image, fillColor, borderColor, tileSize) {
    if (tiles.length === 0) return;
    
    // Group connected tiles into islands
    const islands = groupTilesIntoIslands(tiles);
    
    islands.forEach(island => {
        // Create organic shape for this island
        const path = createOrganicPath(island, tileSize);
        
        // Save context and clip to organic shape
        ctx.save();
        ctx.clip(path);
        
        // Draw sprite or fallback color inside the clipped area
        if (image) {
            // Draw the sprite tiled across the island area
            const minX = Math.min(...island.map(t => t.x));
            const maxX = Math.max(...island.map(t => t.x));
            const minY = Math.min(...island.map(t => t.y));
            const maxY = Math.max(...island.map(t => t.y));
            
            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    ctx.drawImage(image, x * tileSize, y * tileSize, tileSize, tileSize);
                }
            }
        } else {
            ctx.fillStyle = fillColor;
            ctx.fill(path);
        }
        
        // Restore context
        ctx.restore();
        
        // Draw organic border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke(path);
    });
}

function groupTilesIntoIslands(tiles) {
    const visited = new Set();
    const islands = [];
    
    tiles.forEach(tile => {
        const key = `${tile.x},${tile.y}`;
        if (visited.has(key)) return;
        
        const island = [];
        const queue = [tile];
        
        while (queue.length > 0) {
            const current = queue.shift();
            const currentKey = `${current.x},${current.y}`;
            
            if (visited.has(currentKey)) continue;
            visited.add(currentKey);
            island.push(current);
            
            // Find adjacent tiles
            tiles.forEach(neighbor => {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                if (!visited.has(neighborKey)) {
                    const dx = Math.abs(neighbor.x - current.x);
                    const dy = Math.abs(neighbor.y - current.y);
                    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                        queue.push(neighbor);
                    }
                }
            });
        }
        
        if (island.length > 0) {
            islands.push(island);
        }
    });
    
    return islands;
}

function createOrganicPath(island, tileSize) {
    if (island.length === 0) return new Path2D();
    
    // Find the bounding box
    let minX = Math.min(...island.map(t => t.x));
    let maxX = Math.max(...island.map(t => t.x));
    let minY = Math.min(...island.map(t => t.y));
    let maxY = Math.max(...island.map(t => t.y));
    
    const path = new Path2D();
    const cornerRadius = tileSize * 0.3; // Rounded corners
    
    // Create a rounded rectangle that encompasses the island
    const x = minX * tileSize;
    const y = minY * tileSize;
    const width = (maxX - minX + 1) * tileSize;
    const height = (maxY - minY + 1) * tileSize;
    
    // Draw rounded rectangle
    path.moveTo(x + cornerRadius, y);
    path.lineTo(x + width - cornerRadius, y);
    path.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
    path.lineTo(x + width, y + height - cornerRadius);
    path.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
    path.lineTo(x + cornerRadius, y + height);
    path.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
    path.lineTo(x, y + cornerRadius);
    path.quadraticCurveTo(x, y, x + cornerRadius, y);
    path.closePath();
    
    return path;
}

function drawOrganicTerrainPatch(ctx, tile, image, fallbackColor, borderColor) {
    const x = tile.x;
    const y = tile.y;
    const size = tile.size;
    const cornerRadius = size * 0.3;
    
    // Create clipping path for rounded rectangle
    const path = new Path2D();
    path.moveTo(x + cornerRadius, y);
    path.lineTo(x + size - cornerRadius, y);
    path.quadraticCurveTo(x + size, y, x + size, y + cornerRadius);
    path.lineTo(x + size, y + size - cornerRadius);
    path.quadraticCurveTo(x + size, y + size, x + size - cornerRadius, y + size);
    path.lineTo(x + cornerRadius, y + size);
    path.quadraticCurveTo(x, y + size, x, y + size - cornerRadius);
    path.lineTo(x, y + cornerRadius);
    path.quadraticCurveTo(x, y, x + cornerRadius, y);
    path.closePath();
    
    // Save context and clip to rounded shape
    ctx.save();
    ctx.clip(path);
    
    // Draw sprite or fallback color inside the clipped area
    if (image) {
        ctx.drawImage(image, x, y, size, size);
    } else {
        ctx.fillStyle = fallbackColor;
        ctx.fill(path);
    }
    
    // Restore context
    ctx.restore();
    
    // Draw border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(path);
}

function drawRoundedTerrainBorder(ctx, tiles, borderColor, borderWidth) {
    // Create a path that follows the perimeter of terrain patches
    const edges = [];
    
    tiles.forEach(tile => {
        const x = tile.x;
        const y = tile.y;
        const size = tile.size;
        
        // Check each side to see if it's an exposed edge (using tile position/size)
        const hasLeft = tiles.some(t => 
            t.x + t.size >= x && t.x < x && 
            t.y < y + size && t.y + t.size > y
        );
        const hasRight = tiles.some(t => 
            t.x <= x + size && t.x > x + size - 10 && 
            t.y < y + size && t.y + t.size > y
        );
        const hasTop = tiles.some(t => 
            t.y + t.size >= y && t.y < y && 
            t.x < x + size && t.x + t.size > x
        );
        const hasBottom = tiles.some(t => 
            t.y <= y + size && t.y > y + size - 10 && 
            t.x < x + size && t.x + t.size > x
        );
        
        // Add exposed edges
        if (!hasTop) {
            edges.push({type: 'horizontal', x1: x, y1: y, x2: x + size, y2: y});
        }
        if (!hasBottom) {
            edges.push({type: 'horizontal', x1: x, y1: y + size, x2: x + size, y2: y + size});
        }
        if (!hasLeft) {
            edges.push({type: 'vertical', x1: x, y1: y, x2: x, y2: y + size});
        }
        if (!hasRight) {
            edges.push({type: 'vertical', x1: x + size, y1: y, x2: x + size, y2: y + size});
        }
    });
    
    // Draw the border with rounded corners
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Group and draw connected edges
    if (edges.length > 0) {
        ctx.beginPath();
        
        // Draw all edges
        edges.forEach(edge => {
            ctx.moveTo(edge.x1, edge.y1);
            ctx.lineTo(edge.x2, edge.y2);
        });
        
        ctx.stroke();
    }
}