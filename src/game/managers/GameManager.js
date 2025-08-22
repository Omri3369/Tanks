class GameManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Game state
        this.gameMode = 0;
        this.gameRunning = false;
        this.roundStartTime = 0;
        this.roundResetting = false;
        this.gameWinner = null;
        this.graceTimer = 0;
        
        // Game objects
        this.tanks = [];
        this.bullets = [];
        this.walls = [];
        this.gates = [];
        this.powerUps = [];
        this.particles = [];
        this.collectibles = [];
        this.explosions = [];
        this.mines = [];
        this.drones = [];
        this.targets = [];
        this.effects = [];
        this.hazards = [];
        
        // Scores
        this.scores = {};
        this.points = {};
        
        // Systems
        this.weaponSystem = new WeaponSystem();
        this.aiSystem = new AIBehavior();
        this.inputHandler = new InputHandler();
        this.mapGenerator = new MapGenerator();
        this.hazardSystem = new HazardSystem();
        this.powerUpSystem = new PowerUpSystem();
        
        // Camera system
        this.camera = {
            scale: 1.0,
            targetScale: 1.0,
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            isZooming: false,
            zoomStartTime: 0
        };
        
        // Timers
        this.collectibleSpawnTimer = 0;
        
        // Map size
        this.mapSize = 'medium';
        this.mapSizes = {
            small: { width: 1000, height: 700 },
            medium: { width: 1200, height: 800 },
            large: { width: 1400, height: 900 }
        };
        
        // Ring of fire
        this.ringOfFire = null;
        
        // Initialize
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.loadSettings();
        this.bindEvents();
    }
    
    setupCanvas() {
        const mapConfig = this.mapSizes[this.mapSize];
        this.canvas.width = mapConfig.width;
        this.canvas.height = mapConfig.height;
    }
    
    loadSettings() {
        // Load all settings from CONFIG
        this.applyGlobalScale();
    }
    
    applyGlobalScale() {
        // Apply global scale to all size-related configs
        TANK_SIZE = CONFIG.TANK_SIZE * CONFIG.GLOBAL_SCALE;
        TANK_SPEED = CONFIG.TANK_SPEED * CONFIG.GLOBAL_SCALE;
        BULLET_SPEED = CONFIG.BULLET_SPEED * CONFIG.GLOBAL_SCALE;
        BULLET_SIZE = CONFIG.BULLET_SIZE * CONFIG.GLOBAL_SCALE;
        POWERUP_SIZE = CONFIG.POWERUP_SIZE * CONFIG.GLOBAL_SCALE;
    }
    
    bindEvents() {
        // Input handling is managed by InputHandler
        this.inputHandler.init();
    }
    
    startGame(mode) {
        this.gameMode = mode;
        this.gameRunning = true;
        this.roundStartTime = Date.now();
        this.gameWinner = null;
        this.graceTimer = CONFIG.GRACE_PERIOD;
        
        // Reset scores
        this.scores = {};
        this.points = {};
        
        // Clear all objects
        this.clearGameObjects();
        
        // Generate map
        this.generateMap();
        
        // Spawn tanks based on mode
        this.spawnTanks();
        
        // Spawn initial objects
        this.spawnInitialObjects();
        
        // Start game loop
        this.gameLoop();
    }
    
    clearGameObjects() {
        this.tanks = [];
        this.bullets = [];
        this.walls = [];
        this.gates = [];
        this.powerUps = [];
        this.particles = [];
        this.collectibles = [];
        this.explosions = [];
        this.mines = [];
        this.drones = [];
        this.targets = [];
        this.effects = [];
        this.hazards = [];
    }
    
    generateMap() {
        const mapData = this.mapGenerator.generateMap(this.mapSize, this.gameMode);
        this.walls = mapData.walls;
        this.gates = mapData.gates;
        
        // Generate environmental hazards if enabled
        if (CONFIG.ENVIRONMENTAL_HAZARDS) {
            this.hazards = this.hazardSystem.generateHazards(this.canvas, CONFIG.ENVIRONMENTAL_HAZARDS);
        }
    }
    
    spawnTanks() {
        switch(this.gameMode) {
            case 1: // Single Player
                this.spawnPlayerTank(1);
                this.spawnAITanks(CONFIG.AI_TANK_COUNT);
                break;
            case 2: // Two Player
                this.spawnPlayerTank(1);
                this.spawnPlayerTank(2);
                break;
            case 3: // AI Battle
                this.spawnAITanks(CONFIG.AI_TANK_COUNT);
                break;
            case 4: // Survival
                this.spawnPlayerTank(1);
                // AI tanks will spawn in waves
                break;
            case 5: // Training
                this.spawnPlayerTank(1);
                this.spawnTrainingTargets();
                break;
        }
    }
    
    spawnPlayerTank(playerNum) {
        const spawnPoint = this.getRandomSpawnPoint();
        const controls = playerNum === 1 ? 
            { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', shoot: 'KeyM' } :
            { up: 'KeyE', down: 'KeyD', left: 'KeyS', right: 'KeyF', shoot: 'KeyQ' };
        
        const color = playerNum === 1 ? PLAYER1_COLOR : PLAYER2_COLOR;
        const secondaryColor = playerNum === 1 ? PLAYER1_SECONDARY_COLOR : PLAYER2_SECONDARY_COLOR;
        
        const tank = new Tank(spawnPoint.x, spawnPoint.y, color, controls, playerNum, secondaryColor);
        this.tanks.push(tank);
        this.scores[playerNum] = 0;
        this.points[playerNum] = 0;
    }
    
    spawnAITanks(count) {
        for (let i = 0; i < count; i++) {
            const spawnPoint = this.getRandomSpawnPoint();
            const color = this.getRandomColor();
            const tank = new Tank(spawnPoint.x, spawnPoint.y, color, null, 100 + i);
            tank.isAI = true;
            this.tanks.push(tank);
            this.scores[100 + i] = 0;
            this.points[100 + i] = 0;
        }
    }
    
    spawnTrainingTargets() {
        // Spawn stationary targets
        for (let i = 0; i < CONFIG.TRAINING_STATIONARY_TARGETS; i++) {
            const pos = this.getRandomSpawnPoint();
            this.targets.push(new TrainingTarget(pos.x, pos.y, false));
        }
        
        // Spawn moving targets
        for (let i = 0; i < CONFIG.TRAINING_MOVING_TARGETS; i++) {
            const pos = this.getRandomSpawnPoint();
            this.targets.push(new TrainingTarget(pos.x, pos.y, true));
        }
    }
    
    spawnInitialObjects() {
        // Spawn power-ups
        for (let i = 0; i < CONFIG.POWERUP_COUNT; i++) {
            this.spawnPowerUp();
        }
        
        // Spawn collectibles
        for (let i = 0; i < CONFIG.COLLECTIBLE_COUNT; i++) {
            this.spawnCollectible();
        }
    }
    
    spawnPowerUp() {
        const enabledPowerUps = this.weaponSystem.getEnabledWeapons();
        if (enabledPowerUps.length === 0) return;
        
        const type = enabledPowerUps[Math.floor(Math.random() * enabledPowerUps.length)];
        const pos = this.getRandomSpawnPoint();
        this.powerUps.push(new PowerUp(pos.x, pos.y, type));
    }
    
    spawnCollectible() {
        const pos = this.getRandomSpawnPoint();
        this.collectibles.push(new Collectible(pos.x, pos.y));
    }
    
    getRandomSpawnPoint() {
        let x, y;
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            x = Math.random() * (this.canvas.width - 100) + 50;
            y = Math.random() * (this.canvas.height - 100) + 50;
            attempts++;
        } while (this.isPositionOccupied(x, y) && attempts < maxAttempts);
        
        return { x, y };
    }
    
    isPositionOccupied(x, y, radius = 50) {
        // Check walls
        for (let wall of this.walls) {
            if (x + radius > wall.x && x - radius < wall.x + wall.width &&
                y + radius > wall.y && y - radius < wall.y + wall.height) {
                return true;
            }
        }
        
        // Check tanks
        for (let tank of this.tanks) {
            const dist = Math.sqrt((x - tank.x) ** 2 + (y - tank.y) ** 2);
            if (dist < radius * 2) {
                return true;
            }
        }
        
        return false;
    }
    
    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#9B59B6'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        // Update
        this.update();
        
        // Render
        this.render();
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        const deltaTime = 1 / 60; // Assuming 60 FPS
        
        // Update grace timer
        if (this.graceTimer > 0) {
            this.graceTimer--;
        }
        
        // Update all game objects
        this.updateTanks(deltaTime);
        this.updateBullets(deltaTime);
        this.updatePowerUps(deltaTime);
        this.updateCollectibles(deltaTime);
        this.updateParticles(deltaTime);
        this.updateExplosions(deltaTime);
        this.updateMines(deltaTime);
        this.updateDrones(deltaTime);
        this.updateTargets(deltaTime);
        this.updateEffects(deltaTime);
        this.updateHazards(deltaTime);
        this.updateGates(deltaTime);
        
        // Update camera
        this.updateCamera(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Check win conditions
        this.checkWinConditions();
        
        // Spawn new objects
        this.spawnObjects();
        
        // Update ring of fire
        if (this.ringOfFire) {
            this.ringOfFire.update(deltaTime);
        }
    }
    
    updateTanks(deltaTime) {
        const gameState = {
            tanks: this.tanks,
            walls: this.walls,
            gates: this.gates,
            bullets: this.bullets,
            powerUps: this.powerUps,
            canvas: this.canvas,
            aiSystem: this.aiSystem,
            inputHandler: this.inputHandler
        };
        
        this.tanks.forEach(tank => {
            tank.update(deltaTime, gameState);
            
            // Handle shooting
            if (tank.wantsToShoot) {
                const bullets = tank.shoot(this.weaponSystem, gameState);
                if (bullets) {
                    this.bullets.push(...bullets);
                }
                tank.wantsToShoot = false;
            }
        });
        
        // Remove dead tanks
        this.tanks = this.tanks.filter(tank => tank.alive);
    }
    
    updateBullets(deltaTime) {
        const gameState = {
            tanks: this.tanks,
            walls: this.walls,
            canvas: this.canvas,
            effects: this.effects
        };
        
        this.bullets.forEach(bullet => {
            bullet.update(deltaTime, gameState);
        });
        
        // Remove dead bullets
        this.bullets = this.bullets.filter(bullet => bullet.alive);
    }
    
    updatePowerUps(deltaTime) {
        this.powerUps.forEach(powerUp => {
            powerUp.update(deltaTime);
        });
        
        // Remove collected power-ups
        this.powerUps = this.powerUps.filter(powerUp => powerUp.alive);
        
        // Respawn power-ups
        while (this.powerUps.length < CONFIG.POWERUP_COUNT) {
            this.spawnPowerUp();
        }
    }
    
    updateCollectibles(deltaTime) {
        this.collectibles.forEach(collectible => {
            collectible.update(deltaTime);
        });
        
        // Remove collected items
        this.collectibles = this.collectibles.filter(collectible => collectible.alive);
        
        // Spawn new collectibles
        this.collectibleSpawnTimer++;
        if (this.collectibleSpawnTimer >= CONFIG.COLLECTIBLE_RESPAWN_TIME) {
            if (this.collectibles.length < CONFIG.COLLECTIBLE_COUNT) {
                this.spawnCollectible();
            }
            this.collectibleSpawnTimer = 0;
        }
    }
    
    updateParticles(deltaTime) {
        this.particles.forEach(particle => {
            particle.update(deltaTime);
        });
        
        this.particles = this.particles.filter(particle => particle.alive);
    }
    
    updateExplosions(deltaTime) {
        this.explosions.forEach(explosion => {
            explosion.update(deltaTime);
        });
        
        this.explosions = this.explosions.filter(explosion => explosion.alive);
    }
    
    updateMines(deltaTime) {
        this.mines.forEach(mine => {
            mine.update(deltaTime, this.tanks);
        });
        
        this.mines = this.mines.filter(mine => mine.alive);
    }
    
    updateDrones(deltaTime) {
        const gameState = {
            tanks: this.tanks,
            bullets: this.bullets
        };
        
        this.drones.forEach(drone => {
            drone.update(deltaTime, gameState);
        });
        
        this.drones = this.drones.filter(drone => drone.alive);
    }
    
    updateTargets(deltaTime) {
        this.targets.forEach(target => {
            target.update(deltaTime);
        });
        
        // Respawn destroyed targets
        this.targets.forEach(target => {
            if (target.destroyed && target.respawnTimer <= 0) {
                target.respawn(this.getRandomSpawnPoint());
            }
        });
    }
    
    updateEffects(deltaTime) {
        this.effects.forEach(effect => {
            effect.update(deltaTime);
        });
        
        this.effects = this.effects.filter(effect => effect.alive);
    }
    
    updateHazards(deltaTime) {
        const gameState = {
            tanks: this.tanks,
            bullets: this.bullets
        };
        
        this.hazards.forEach(hazard => {
            hazard.update(deltaTime, gameState);
        });
    }
    
    updateGates(deltaTime) {
        this.gates.forEach(gate => {
            gate.update(deltaTime, this.tanks);
        });
    }
    
    updateCamera(deltaTime) {
        if (this.camera.isZooming) {
            const elapsed = Date.now() - this.camera.zoomStartTime;
            const progress = Math.min(elapsed / CONFIG.WINNER_ZOOM_TRANSITION_TIME, 1);
            
            // Smooth easing
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            this.camera.scale = 1 + (this.camera.targetScale - 1) * easeProgress;
            this.camera.x = this.camera.targetX * easeProgress;
            this.camera.y = this.camera.targetY * easeProgress;
            
            if (progress >= 1) {
                this.camera.isZooming = false;
            }
        }
    }
    
    checkCollisions() {
        // Bullet vs Tank collisions
        this.bullets.forEach(bullet => {
            this.tanks.forEach(tank => {
                if (tank.playerNum !== bullet.owner && bullet.checkTankCollision(tank)) {
                    bullet.onHitTank(tank, { effects: this.effects, tanks: this.tanks });
                    
                    // Award points
                    if (!tank.alive && this.scores[bullet.owner] !== undefined) {
                        this.scores[bullet.owner]++;
                        this.points[bullet.owner] += 100;
                    }
                }
            });
            
            // Bullet vs Target collisions (training mode)
            this.targets.forEach(target => {
                if (bullet.checkCollision(target, bullet.size, target.size)) {
                    target.hit();
                    bullet.destroy();
                }
            });
        });
        
        // Tank vs PowerUp collisions
        this.tanks.forEach(tank => {
            this.powerUps.forEach(powerUp => {
                if (powerUp.checkCollision(tank)) {
                    tank.addPowerUp(powerUp.type);
                    powerUp.collect();
                }
            });
            
            // Tank vs Collectible collisions
            this.collectibles.forEach(collectible => {
                if (collectible.checkCollision(tank)) {
                    this.points[tank.playerNum] += collectible.value;
                    collectible.collect();
                    
                    // Create collection effect
                    for (let i = 0; i < 10; i++) {
                        this.particles.push(new Particle(collectible.x, collectible.y, '#FFD700'));
                    }
                }
            });
        });
    }
    
    checkWinConditions() {
        if (this.roundResetting) return;
        
        const aliveTanks = this.tanks.filter(t => t.alive);
        
        switch(this.gameMode) {
            case 1: // Single Player
            case 2: // Two Player
                if (aliveTanks.length === 1) {
                    this.onRoundWin(aliveTanks[0]);
                } else if (aliveTanks.length === 0) {
                    this.onRoundDraw();
                }
                break;
                
            case 3: // AI Battle
                if (aliveTanks.length <= 1) {
                    if (aliveTanks.length === 1) {
                        this.onRoundWin(aliveTanks[0]);
                    } else {
                        this.onRoundDraw();
                    }
                }
                break;
                
            case 4: // Survival
                // Check if player is still alive
                const playerAlive = aliveTanks.some(t => t.playerNum === 1);
                if (!playerAlive) {
                    this.onGameOver();
                }
                break;
        }
    }
    
    onRoundWin(winner) {
        this.gameWinner = winner;
        this.roundResetting = true;
        
        // Zoom camera on winner
        this.startWinnerZoom(winner);
        
        // Reset after delay
        setTimeout(() => {
            this.resetRound();
        }, 3000);
    }
    
    onRoundDraw() {
        this.roundResetting = true;
        
        setTimeout(() => {
            this.resetRound();
        }, 2000);
    }
    
    onGameOver() {
        this.gameRunning = false;
        // Show game over screen
    }
    
    startWinnerZoom(winner) {
        this.camera.isZooming = true;
        this.camera.zoomStartTime = Date.now();
        this.camera.targetScale = CONFIG.WINNER_ZOOM_SCALE;
        this.camera.targetX = this.canvas.width / 2 - winner.x;
        this.camera.targetY = this.canvas.height / 2 - winner.y;
    }
    
    resetRound() {
        this.roundResetting = false;
        this.gameWinner = null;
        this.camera = {
            scale: 1.0,
            targetScale: 1.0,
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            isZooming: false,
            zoomStartTime: 0
        };
        
        // Clear non-persistent objects
        this.bullets = [];
        this.particles = [];
        this.explosions = [];
        this.mines = [];
        this.effects = [];
        
        // Respawn tanks
        this.respawnTanks();
        
        // Reset grace timer
        this.graceTimer = CONFIG.GRACE_PERIOD;
    }
    
    respawnTanks() {
        // Reset existing tanks
        this.tanks.forEach(tank => {
            const spawnPoint = this.getRandomSpawnPoint();
            tank.x = spawnPoint.x;
            tank.y = spawnPoint.y;
            tank.alive = true;
            tank.health = tank.maxHealth;
            tank.powerUp = null;
            tank.specialAmmo = 0;
            tank.frozen = false;
            tank.frozenTime = 0;
        });
        
        // Respawn AI tanks if needed
        const targetAICount = this.gameMode === 1 ? CONFIG.AI_TANK_COUNT : 0;
        const currentAICount = this.tanks.filter(t => t.isAI).length;
        
        if (currentAICount < targetAICount) {
            this.spawnAITanks(targetAICount - currentAICount);
        }
    }
    
    spawnObjects() {
        // Random collectible spawning
        if (CONFIG.COLLECTIBLE_RANDOM_SPAWN && Math.random() < 0.001) {
            if (this.collectibles.length < CONFIG.COLLECTIBLE_COUNT * 1.5) {
                this.spawnCollectible();
            }
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply camera transform
        this.ctx.save();
        this.ctx.translate(this.camera.x, this.camera.y);
        this.ctx.scale(this.camera.scale, this.camera.scale);
        
        // Draw game objects
        this.drawTerrain();
        this.drawHazards();
        this.drawWalls();
        this.drawGates();
        this.drawCollectibles();
        this.drawPowerUps();
        this.drawMines();
        this.drawTargets();
        this.drawTanks();
        this.drawDrones();
        this.drawBullets();
        this.drawParticles();
        this.drawExplosions();
        this.drawEffects();
        
        // Draw ring of fire
        if (this.ringOfFire) {
            this.ringOfFire.draw(this.ctx);
        }
        
        this.ctx.restore();
        
        // Draw UI (not affected by camera)
        this.drawUI();
    }
    
    drawTerrain() {
        // Draw simple solid color background
        this.ctx.fillStyle = '#95A5A6'; // Nice light silver-gray color
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw border around the canvas
        this.ctx.strokeStyle = '#E74C3C'; // Red border
        this.ctx.lineWidth = 8;
        this.ctx.strokeRect(4, 4, this.canvas.width - 8, this.canvas.height - 8);
    }
    
    drawHazards() {
        this.hazards.forEach(hazard => {
            hazard.draw(this.ctx);
        });
    }
    
    drawWalls() {
        this.walls.forEach(wall => {
            wall.draw(this.ctx);
        });
    }
    
    drawGates() {
        this.gates.forEach(gate => {
            gate.draw(this.ctx);
        });
    }
    
    drawCollectibles() {
        this.collectibles.forEach(collectible => {
            collectible.draw(this.ctx);
        });
    }
    
    drawPowerUps() {
        this.powerUps.forEach(powerUp => {
            powerUp.draw(this.ctx);
        });
    }
    
    drawMines() {
        this.mines.forEach(mine => {
            mine.draw(this.ctx);
        });
    }
    
    drawTargets() {
        this.targets.forEach(target => {
            target.draw(this.ctx);
        });
    }
    
    drawTanks() {
        this.tanks.forEach(tank => {
            tank.draw(this.ctx, this.graceTimer);
        });
    }
    
    drawDrones() {
        this.drones.forEach(drone => {
            drone.draw(this.ctx);
        });
    }
    
    drawBullets() {
        this.bullets.forEach(bullet => {
            bullet.draw(this.ctx);
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            particle.draw(this.ctx);
        });
    }
    
    drawExplosions() {
        this.explosions.forEach(explosion => {
            explosion.draw(this.ctx);
        });
    }
    
    drawEffects() {
        this.effects.forEach(effect => {
            effect.draw(this.ctx);
        });
    }
    
    drawUI() {
        // Draw scores
        this.drawScores();
        
        // Draw grace period indicator
        if (this.graceTimer > 0) {
            this.drawGracePeriod();
        }
        
        // Draw winner announcement
        if (this.gameWinner) {
            this.drawWinnerAnnouncement();
        }
    }
    
    drawScores() {
        this.ctx.save();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Arial';
        
        let y = 30;
        Object.keys(this.scores).forEach(playerNum => {
            const score = this.scores[playerNum];
            const points = this.points[playerNum] || 0;
            const tank = this.tanks.find(t => t.playerNum === parseInt(playerNum));
            
            if (tank) {
                this.ctx.fillStyle = tank.color;
                this.ctx.fillText(`Player ${playerNum}: ${score} wins | ${points} pts`, 10, y);
                y += 30;
            }
        });
        
        this.ctx.restore();
    }
    
    drawGracePeriod() {
        this.ctx.save();
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GET READY!', this.canvas.width / 2, 100);
        
        const seconds = Math.ceil(this.graceTimer / 60);
        this.ctx.font = 'bold 50px Arial';
        this.ctx.fillText(seconds, this.canvas.width / 2, 150);
        
        this.ctx.restore();
    }
    
    drawWinnerAnnouncement() {
        this.ctx.save();
        this.ctx.fillStyle = this.gameWinner.color;
        this.ctx.font = 'bold 50px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        
        const text = this.gameWinner.isAI ? 'AI WINS!' : `PLAYER ${this.gameWinner.playerNum} WINS!`;
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.restore();
    }
    
    pause() {
        this.gameRunning = false;
    }
    
    resume() {
        this.gameRunning = true;
        this.gameLoop();
    }
    
    stop() {
        this.gameRunning = false;
        this.clearGameObjects();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameManager;
}