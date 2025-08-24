class GameState {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.gameMode = 0;
        this.gameRunning = false;
        this.mapSize = 'medium';
        this.mapSizes = MAP_SIZES;
        
        // Game entities
        this.tanks = [];
        this.bullets = [];
        this.walls = [];
        this.gates = [];
        this.powerUps = [];
        this.particles = [];
        this.explosions = [];
        this.mines = [];
        this.drones = [];
        this.targets = [];
        
        // Game state
        this.scores = {};
        this.kills = {};
        this.ringOfFire = null;
        this.roundStartTime = 0;
        this.roundResetting = false;
        this.gameWinner = null;
        this.graceTimer = 0;
        
        // Terrain system variables
        this.terrainTiles = [];
        this.terrainFeatures = [];
        this.terrainCanvas = null;
        this.terrainCtx = null;
        this.terrainCached = false;
        this.obstacleTiles = [];
        
        // Underground tunnel system
        this.tunnelEntrances = [];
        this.tunnelNetwork = new Map();
        this.teleportEffects = [];
        
        // Asset loading state
        this.assetsLoaded = {
            grass: false,
            wall: false,
            water: false,
            sand: false
        };
        
        // Camera system
        this.camera = {
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
    }
    
    // Get methods for AI system compatibility
    get tanks() { return this.tanks; }
    get walls() { return this.walls; }
    get powerUps() { return this.powerUps; }
    get bullets() { return this.bullets; }
    
    shootBullet(tank) {
        tank.shoot();
    }
    
    // State management methods
    addTank(tank) {
        this.tanks.push(tank);
    }
    
    addBullet(bullet) {
        this.bullets.push(bullet);
    }
    
    addWall(wall) {
        this.walls.push(wall);
    }
    
    addPowerUp(powerUp) {
        this.powerUps.push(powerUp);
    }
    
    addParticle(particle) {
        this.particles.push(particle);
    }
    
    addExplosion(explosion) {
        this.explosions.push(explosion);
    }
    
    addMine(mine) {
        this.mines.push(mine);
    }
    
    addDrone(drone) {
        this.drones.push(drone);
    }
    
    addTarget(target) {
        this.targets.push(target);
    }
    
    removeTank(tank) {
        const index = this.tanks.indexOf(tank);
        if (index > -1) {
            this.tanks.splice(index, 1);
        }
    }
    
    removeBullet(bullet) {
        const index = this.bullets.indexOf(bullet);
        if (index > -1) {
            this.bullets.splice(index, 1);
        }
    }
    
    removeParticle(particle) {
        const index = this.particles.indexOf(particle);
        if (index > -1) {
            this.particles.splice(index, 1);
        }
    }
    
    removeExplosion(explosion) {
        const index = this.explosions.indexOf(explosion);
        if (index > -1) {
            this.explosions.splice(index, 1);
        }
    }
    
    removeMine(mine) {
        const index = this.mines.indexOf(mine);
        if (index > -1) {
            this.mines.splice(index, 1);
        }
    }
    
    removeDrone(drone) {
        const index = this.drones.indexOf(drone);
        if (index > -1) {
            this.drones.splice(index, 1);
        }
    }
    
    removeTarget(target) {
        const index = this.targets.indexOf(target);
        if (index > -1) {
            this.targets.splice(index, 1);
        }
    }
    
    // Utility methods
    getAliveTanks() {
        return this.tanks.filter(tank => tank.alive);
    }
    
    getPlayerTanks() {
        return this.tanks.filter(tank => !tank.isAI);
    }
    
    getAITanks() {
        return this.tanks.filter(tank => tank.isAI);
    }
    
    isGameOver() {
        const aliveTanks = this.getAliveTanks();
        return aliveTanks.length <= 1;
    }
    
    getWinner() {
        const aliveTanks = this.getAliveTanks();
        return aliveTanks.length === 1 ? aliveTanks[0] : null;
    }
    
    clearEntities() {
        this.bullets = [];
        this.particles = [];
        this.explosions = [];
        this.mines = [];
        this.drones = [];
        this.powerUps = [];
        this.teleportEffects = [];
    }
}

// Make it globally available
if (typeof window !== 'undefined') {
    window.GameState = GameState;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameState;
}