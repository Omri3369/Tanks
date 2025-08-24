// Entities Bundle - Mine, Target, and Drone classes

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

// Expose classes globally for backward compatibility
window.Mine = Mine;
window.Target = Target;
window.Drone = Drone;
window.PowerUp = PowerUp;