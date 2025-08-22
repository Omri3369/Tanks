/**
 * Object Pool for performance optimization
 * Reuses objects instead of creating/destroying them
 */
class ObjectPool {
    constructor(objectClass, initialSize = 10, maxSize = 100) {
        this.ObjectClass = objectClass;
        this.pool = [];
        this.activeObjects = new Set();
        this.maxSize = maxSize;
        this.totalCreated = 0;
        this.statistics = {
            created: 0,
            reused: 0,
            active: 0,
            available: 0
        };
        
        // Pre-populate pool
        this.expand(initialSize);
    }
    
    /**
     * Expand pool by creating new objects
     */
    expand(count) {
        for (let i = 0; i < count && this.totalCreated < this.maxSize; i++) {
            const obj = new this.ObjectClass();
            obj._pooled = true;
            obj._pool = this;
            this.pool.push(obj);
            this.totalCreated++;
            this.statistics.created++;
        }
        this.updateStatistics();
    }
    
    /**
     * Get an object from the pool
     */
    acquire(...args) {
        let obj;
        
        if (this.pool.length > 0) {
            obj = this.pool.pop();
            this.statistics.reused++;
        } else if (this.totalCreated < this.maxSize) {
            obj = new this.ObjectClass();
            obj._pooled = true;
            obj._pool = this;
            this.totalCreated++;
            this.statistics.created++;
        } else {
            console.warn(`Object pool for ${this.ObjectClass.name} is at maximum capacity`);
            return null;
        }
        
        this.activeObjects.add(obj);
        
        // Initialize/reset object
        if (obj.init) {
            obj.init(...args);
        } else if (obj.reset) {
            obj.reset(...args);
        }
        
        this.updateStatistics();
        return obj;
    }
    
    /**
     * Return an object to the pool
     */
    release(obj) {
        if (!obj._pooled || obj._pool !== this) {
            console.warn('Trying to release object that doesn\'t belong to this pool');
            return false;
        }
        
        if (!this.activeObjects.has(obj)) {
            console.warn('Trying to release object that is not active');
            return false;
        }
        
        this.activeObjects.delete(obj);
        
        // Clean up object
        if (obj.cleanup) {
            obj.cleanup();
        } else if (obj.reset) {
            obj.reset();
        }
        
        this.pool.push(obj);
        this.updateStatistics();
        return true;
    }
    
    /**
     * Release all active objects
     */
    releaseAll() {
        const objects = Array.from(this.activeObjects);
        objects.forEach(obj => this.release(obj));
    }
    
    /**
     * Clear the pool
     */
    clear() {
        this.releaseAll();
        this.pool = [];
        this.totalCreated = 0;
        this.updateStatistics();
    }
    
    /**
     * Get pool statistics
     */
    getStatistics() {
        return { ...this.statistics };
    }
    
    /**
     * Update statistics
     */
    updateStatistics() {
        this.statistics.active = this.activeObjects.size;
        this.statistics.available = this.pool.length;
    }
    
    /**
     * Pre-warm the pool
     */
    prewarm(count) {
        const toCreate = Math.min(count, this.maxSize - this.totalCreated);
        this.expand(toCreate);
    }
}

/**
 * Pool Manager - Manages multiple object pools
 */
class PoolManager {
    constructor() {
        this.pools = new Map();
        this.autoExpandThreshold = 0.8; // Expand when 80% used
    }
    
    /**
     * Register a new pool
     */
    registerPool(name, objectClass, initialSize = 10, maxSize = 100) {
        if (this.pools.has(name)) {
            console.warn(`Pool ${name} already exists`);
            return;
        }
        
        const pool = new ObjectPool(objectClass, initialSize, maxSize);
        this.pools.set(name, pool);
        return pool;
    }
    
    /**
     * Get object from pool
     */
    acquire(poolName, ...args) {
        const pool = this.pools.get(poolName);
        if (!pool) {
            console.error(`Pool ${poolName} not found`);
            return null;
        }
        
        // Auto-expand if needed
        const stats = pool.getStatistics();
        const usage = stats.active / (stats.active + stats.available);
        if (usage > this.autoExpandThreshold && pool.totalCreated < pool.maxSize) {
            const expandSize = Math.min(10, pool.maxSize - pool.totalCreated);
            pool.expand(expandSize);
        }
        
        return pool.acquire(...args);
    }
    
    /**
     * Return object to pool
     */
    release(poolName, obj) {
        const pool = this.pools.get(poolName);
        if (!pool) {
            console.error(`Pool ${poolName} not found`);
            return false;
        }
        
        return pool.release(obj);
    }
    
    /**
     * Get pool by name
     */
    getPool(name) {
        return this.pools.get(name);
    }
    
    /**
     * Clear all pools
     */
    clearAll() {
        this.pools.forEach(pool => pool.clear());
    }
    
    /**
     * Get statistics for all pools
     */
    getAllStatistics() {
        const stats = {};
        this.pools.forEach((pool, name) => {
            stats[name] = pool.getStatistics();
        });
        return stats;
    }
}

// Poolable Objects

/**
 * Poolable Bullet
 */
class PoolableBullet {
    constructor() {
        this.reset();
    }
    
    init(x, y, angle, speed, owner, type = 'normal') {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.owner = owner;
        this.type = type;
        this.alive = true;
        this.lifetime = 300;
        this.damage = 20;
        this.size = 4;
        return this;
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.speed = 0;
        this.owner = null;
        this.type = 'normal';
        this.alive = false;
        this.lifetime = 0;
        this.damage = 0;
        this.size = 4;
    }
    
    update(deltaTime) {
        if (!this.alive) return;
        
        this.x += Math.cos(this.angle) * this.speed * deltaTime;
        this.y += Math.sin(this.angle) * this.speed * deltaTime;
        
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.alive = false;
        }
    }
    
    cleanup() {
        this.reset();
    }
}

/**
 * Poolable Particle
 */
class PoolableParticle {
    constructor() {
        this.reset();
    }
    
    init(x, y, vx, vy, color, size, lifetime) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.alive = true;
        this.gravity = 0.1;
        this.friction = 0.98;
        return this;
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.color = '#FFFFFF';
        this.size = 1;
        this.lifetime = 0;
        this.maxLifetime = 0;
        this.alive = false;
        this.gravity = 0;
        this.friction = 1;
    }
    
    update(deltaTime) {
        if (!this.alive) return;
        
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.vy += this.gravity * deltaTime;
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.alive = false;
        }
    }
    
    getAlpha() {
        return this.lifetime / this.maxLifetime;
    }
    
    cleanup() {
        this.reset();
    }
}

/**
 * Poolable Explosion
 */
class PoolableExplosion {
    constructor() {
        this.reset();
    }
    
    init(x, y, radius, damage) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.maxRadius = radius;
        this.currentRadius = 0;
        this.damage = damage;
        this.lifetime = 30;
        this.maxLifetime = 30;
        this.alive = true;
        return this;
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.radius = 0;
        this.maxRadius = 0;
        this.currentRadius = 0;
        this.damage = 0;
        this.lifetime = 0;
        this.maxLifetime = 0;
        this.alive = false;
    }
    
    update(deltaTime) {
        if (!this.alive) return;
        
        const progress = 1 - (this.lifetime / this.maxLifetime);
        this.currentRadius = this.maxRadius * this.easeOutCubic(progress);
        
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.alive = false;
        }
    }
    
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    getAlpha() {
        return this.lifetime / this.maxLifetime;
    }
    
    cleanup() {
        this.reset();
    }
}

/**
 * Poolable Text Effect
 */
class PoolableTextEffect {
    constructor() {
        this.reset();
    }
    
    init(x, y, text, color, fontSize, duration) {
        this.x = x;
        this.y = y;
        this.startY = y;
        this.text = text;
        this.color = color;
        this.fontSize = fontSize;
        this.duration = duration;
        this.lifetime = duration;
        this.alive = true;
        this.velocity = -1; // Move upward
        return this;
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.startY = 0;
        this.text = '';
        this.color = '#FFFFFF';
        this.fontSize = 16;
        this.duration = 0;
        this.lifetime = 0;
        this.alive = false;
        this.velocity = 0;
    }
    
    update(deltaTime) {
        if (!this.alive) return;
        
        this.y += this.velocity * deltaTime;
        this.lifetime -= deltaTime;
        
        if (this.lifetime <= 0) {
            this.alive = false;
        }
    }
    
    getAlpha() {
        return Math.min(1, this.lifetime / this.duration);
    }
    
    cleanup() {
        this.reset();
    }
}

// Global Pool Manager instance
const globalPoolManager = new PoolManager();

// Initialize default pools
globalPoolManager.registerPool('bullet', PoolableBullet, 50, 200);
globalPoolManager.registerPool('particle', PoolableParticle, 100, 500);
globalPoolManager.registerPool('explosion', PoolableExplosion, 20, 50);
globalPoolManager.registerPool('textEffect', PoolableTextEffect, 20, 50);

// Usage Example:
/*
// Get bullet from pool
const bullet = globalPoolManager.acquire('bullet', x, y, angle, speed, owner, 'normal');

// Update bullet
bullet.update(deltaTime);

// Return to pool when done
if (!bullet.alive) {
    globalPoolManager.release('bullet', bullet);
}

// Create particle burst
for (let i = 0; i < 10; i++) {
    const particle = globalPoolManager.acquire('particle',
        x, y,
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        '#FFD700',
        Math.random() * 3 + 1,
        30
    );
}
*/

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ObjectPool,
        PoolManager,
        globalPoolManager,
        PoolableBullet,
        PoolableParticle,
        PoolableExplosion,
        PoolableTextEffect
    };
}