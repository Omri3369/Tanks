class GameState {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.gameMode = 0;
        this.gameRunning = false;
        this.mapSize = 'medium';
        this.mapSizes = MAP_SIZES;
        
        // Game entities - use private properties to avoid getter conflicts
        this._tanks = [];
        this._bullets = [];
        this._walls = [];
        this._gates = [];
        this._powerUps = [];
        this._particles = [];
        this._explosions = [];
        this._mines = [];
        this._drones = [];
        this._targets = [];
        
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
    
    // Get and set methods for AI system compatibility
    get tanks() { return this._tanks; }
    set tanks(value) { this._tanks = value; }
    get walls() { return this._walls; }
    set walls(value) { this._walls = value; }
    get powerUps() { return this._powerUps; }
    set powerUps(value) { this._powerUps = value; }
    get bullets() { return this._bullets; }
    set bullets(value) { this._bullets = value; }
    get particles() { return this._particles; }
    set particles(value) { this._particles = value; }
    get explosions() { return this._explosions; }
    set explosions(value) { this._explosions = value; }
    get mines() { return this._mines; }
    set mines(value) { this._mines = value; }
    get drones() { return this._drones; }
    set drones(value) { this._drones = value; }
    get targets() { return this._targets; }
    set targets(value) { this._targets = value; }
    get gates() { return this._gates; }
    set gates(value) { this._gates = value; }
    
    shootBullet(tank) {
        tank.shoot();
    }
    
    // State management methods
    addTank(tank) {
        this._tanks.push(tank);
    }
    
    addBullet(bullet) {
        this._bullets.push(bullet);
    }
    
    addWall(wall) {
        this._walls.push(wall);
    }
    
    addPowerUp(powerUp) {
        this._powerUps.push(powerUp);
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
        const index = this._tanks.indexOf(tank);
        if (index > -1) {
            this._tanks.splice(index, 1);
        }
    }
    
    removeBullet(bullet) {
        const index = this._bullets.indexOf(bullet);
        if (index > -1) {
            this._bullets.splice(index, 1);
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
        return this._tanks.filter(tank => tank.alive);
    }
    
    getPlayerTanks() {
        return this._tanks.filter(tank => !tank.isAI);
    }
    
    getAITanks() {
        return this._tanks.filter(tank => tank.isAI);
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
        this._bullets = [];
        this.particles = [];
        this.explosions = [];
        this.mines = [];
        this.drones = [];
        this._powerUps = [];
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