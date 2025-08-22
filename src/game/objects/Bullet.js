class Bullet extends GameObject {
    constructor(x, y, angle, owner, type = 'normal') {
        super(x, y);
        this.angle = angle;
        this.owner = owner;
        this.type = type;
        this.speed = this.getBulletSpeed(type);
        this.lifetime = this.getBulletLifetime(type);
        this.size = this.getBulletSize(type);
        this.damage = this.getBulletDamage(type);
        this.pierced = 0;
        this.maxPiercing = type === 'piercing' ? 3 : 0;
        this.bounces = 0;
        this.maxBounces = type === 'bouncer' ? 5 : type === 'ricochet' ? 10 : 1;
        this.homingTarget = null;
        this.traveled = 0;
        this.returning = false; // For boomerang
        this.chainTargets = []; // For chain lightning
        this.vortexPull = 0; // For vortex bullets
    }
    
    getBulletSpeed(type) {
        const speeds = {
            laser: BULLET_SPEED * 2.0,
            railgun: BULLET_SPEED * 3.0,
            rocket: BULLET_SPEED * 0.8,
            explosive: BULLET_SPEED * 0.9,
            piercing: BULLET_SPEED * 1.2,
            freeze: BULLET_SPEED * 0.7,
            flame: BULLET_SPEED * 0.6,
            homing: BULLET_SPEED * 1.1,
            boomerang: BULLET_SPEED * 1.3,
            vortex: BULLET_SPEED * 0.5
        };
        return speeds[type] || BULLET_SPEED;
    }
    
    getBulletLifetime(type) {
        const lifetimes = {
            laser: BULLET_LIFETIME * 0.5,
            railgun: BULLET_LIFETIME * 0.3,
            rocket: BULLET_LIFETIME * 1.5,
            explosive: BULLET_LIFETIME * 1.2,
            piercing: BULLET_LIFETIME * 0.8,
            freeze: BULLET_LIFETIME * 1.3,
            flame: BULLET_LIFETIME * 0.4,
            boomerang: BULLET_LIFETIME * 2.0,
            vortex: BULLET_LIFETIME * 1.5
        };
        return lifetimes[type] || BULLET_LIFETIME;
    }
    
    getBulletSize(type) {
        const sizes = {
            laser: BULLET_SIZE * 0.5,
            railgun: BULLET_SIZE * 0.3,
            rocket: BULLET_SIZE * 1.5,
            explosive: BULLET_SIZE * 1.3,
            piercing: BULLET_SIZE * 0.8,
            freeze: BULLET_SIZE * 1.2,
            flame: BULLET_SIZE * 1.8,
            vortex: BULLET_SIZE * 2.0
        };
        return sizes[type] || BULLET_SIZE;
    }
    
    getBulletDamage(type) {
        const damages = {
            laser: 15,
            railgun: 50,
            rocket: 40,
            explosive: 35,
            piercing: 25,
            freeze: 10,
            flame: 20,
            homing: 20,
            chain: 15,
            ricochet: 10 // Increases with bounces
        };
        return damages[type] || 20;
    }
    
    update(deltaTime, gameState) {
        if (!this.alive) return;
        
        // Handle special movement patterns
        switch(this.type) {
            case 'homing':
                this.updateHoming(gameState);
                break;
            case 'boomerang':
                this.updateBoomerang(gameState);
                break;
            case 'vortex':
                this.updateVortex(gameState);
                break;
            case 'chain':
                this.updateChain(gameState);
                break;
        }
        
        // Move bullet
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.traveled += this.speed;
        
        // Check boundaries
        this.handleBoundaryCollision(gameState);
        
        // Check wall collisions
        this.handleWallCollisions(gameState);
        
        // Update lifetime
        this.lifetime--;
        if (this.lifetime <= 0) {
            this.onExpire(gameState);
            this.destroy();
        }
    }
    
    updateHoming(gameState) {
        if (!this.homingTarget || !this.homingTarget.alive) {
            // Find new target
            this.homingTarget = this.findClosestEnemy(gameState);
        }
        
        if (this.homingTarget) {
            const targetAngle = this.angleTo(this.homingTarget);
            const angleDiff = targetAngle - this.angle;
            
            // Normalize angle difference
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            // Turn towards target
            this.angle += angleDiff * 0.1;
        }
    }
    
    updateBoomerang(gameState) {
        if (this.traveled > 200 && !this.returning) {
            this.returning = true;
            this.angle += Math.PI; // Turn around
        }
        
        if (this.returning) {
            // Try to return to owner
            const owner = gameState.tanks.find(t => t.playerNum === this.owner);
            if (owner && owner.alive) {
                const targetAngle = this.angleTo(owner);
                const angleDiff = targetAngle - this.angle;
                
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                this.angle += angleDiff * 0.15;
            }
        }
    }
    
    updateVortex(gameState) {
        this.vortexPull = Math.sin(Date.now() * 0.01) * 50;
        
        // Pull nearby objects
        gameState.tanks.forEach(tank => {
            if (tank.playerNum !== this.owner && tank.alive) {
                const distance = this.distanceTo(tank);
                if (distance < 100) {
                    const pullForce = (100 - distance) / 100;
                    const angle = this.angleTo(tank);
                    tank.x -= Math.cos(angle) * pullForce * 2;
                    tank.y -= Math.sin(angle) * pullForce * 2;
                }
            }
        });
    }
    
    updateChain(gameState) {
        // Chain lightning jumps to nearby enemies
        if (this.chainTargets.length < 3) {
            const nearbyEnemies = gameState.tanks.filter(tank => 
                tank.playerNum !== this.owner && 
                tank.alive && 
                !this.chainTargets.includes(tank.id) &&
                this.distanceTo(tank) < 150
            );
            
            if (nearbyEnemies.length > 0) {
                const target = nearbyEnemies[0];
                this.chainTargets.push(target.id);
                
                // Create chain effect
                gameState.effects.push(new ChainLightningEffect(this.x, this.y, target.x, target.y));
                
                // Jump to target
                this.x = target.x;
                this.y = target.y;
                this.angle = Math.random() * Math.PI * 2;
            }
        }
    }
    
    findClosestEnemy(gameState) {
        let closest = null;
        let minDistance = Infinity;
        
        gameState.tanks.forEach(tank => {
            if (tank.playerNum !== this.owner && tank.alive) {
                const distance = this.distanceTo(tank);
                if (distance < minDistance) {
                    minDistance = distance;
                    closest = tank;
                }
            }
        });
        
        return closest;
    }
    
    handleBoundaryCollision(gameState) {
        const bounced = false;
        
        if (this.x <= this.size || this.x >= gameState.canvas.width - this.size) {
            if (this.bounces < this.maxBounces) {
                this.angle = Math.PI - this.angle;
                this.x = this.x <= this.size ? this.size : gameState.canvas.width - this.size;
                this.bounces++;
                this.onBounce(gameState);
            } else {
                this.destroy();
            }
        }
        
        if (this.y <= this.size || this.y >= gameState.canvas.height - this.size) {
            if (this.bounces < this.maxBounces) {
                this.angle = -this.angle;
                this.y = this.y <= this.size ? this.size : gameState.canvas.height - this.size;
                this.bounces++;
                this.onBounce(gameState);
            } else {
                this.destroy();
            }
        }
    }
    
    handleWallCollisions(gameState) {
        for (let wall of gameState.walls) {
            if (this.checkWallCollision(wall)) {
                if (this.type === 'piercing' && this.pierced < this.maxPiercing) {
                    this.pierced++;
                    this.onPierce(gameState);
                } else if (this.type === 'explosive' || this.type === 'rocket') {
                    this.explode(gameState);
                    this.destroy();
                    return;
                } else if (this.bounces < this.maxBounces) {
                    this.bounceOffWall(wall);
                    this.bounces++;
                    this.onBounce(gameState);
                } else {
                    this.destroy();
                    return;
                }
            }
        }
    }
    
    checkWallCollision(wall) {
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
        return this.distanceTo(tank) < tank.radius;
    }
    
    onHitTank(tank, gameState) {
        // Apply damage
        let damage = this.damage;
        
        // Ricochet bullets gain damage with bounces
        if (this.type === 'ricochet') {
            damage = this.damage * (1 + this.bounces * 0.5);
        }
        
        tank.takeDamage(damage);
        
        // Apply special effects
        switch(this.type) {
            case 'freeze':
                tank.freeze(120);
                break;
            case 'explosive':
            case 'rocket':
                this.explode(gameState);
                break;
            case 'flame':
                this.ignite(tank, gameState);
                break;
            case 'teleport':
                this.teleportSwap(tank, gameState);
                break;
            case 'emp':
                tank.disableControls(180);
                break;
        }
        
        // Destroy bullet unless it pierces
        if (this.type !== 'piercing' || this.pierced >= this.maxPiercing) {
            this.destroy();
        }
    }
    
    explode(gameState) {
        const radius = this.type === 'rocket' ? 80 : 60;
        
        // Damage nearby tanks
        gameState.tanks.forEach(tank => {
            if (tank.alive) {
                const distance = this.distanceTo(tank);
                if (distance < radius) {
                    const damage = (1 - distance / radius) * 30;
                    tank.takeDamage(damage);
                }
            }
        });
        
        // Create explosion effect
        gameState.effects.push(new Explosion(this.x, this.y, radius));
    }
    
    ignite(tank, gameState) {
        // Apply burning effect
        tank.burning = true;
        tank.burnTime = 180;
        tank.burnDamage = 2;
    }
    
    teleportSwap(tank, gameState) {
        const owner = gameState.tanks.find(t => t.playerNum === this.owner);
        if (owner && owner.alive) {
            // Swap positions
            const tempX = owner.x;
            const tempY = owner.y;
            owner.x = tank.x;
            owner.y = tank.y;
            tank.x = tempX;
            tank.y = tempY;
        }
    }
    
    onBounce(gameState) {
        // Create bounce effect
        gameState.effects.push(new BounceEffect(this.x, this.y));
        
        // Ricochet bullets gain speed
        if (this.type === 'ricochet') {
            this.speed *= 1.1;
        }
    }
    
    onPierce(gameState) {
        // Create pierce effect
        gameState.effects.push(new PierceEffect(this.x, this.y));
    }
    
    onExpire(gameState) {
        // Some bullets have special effects when they expire
        if (this.type === 'vortex') {
            this.explode(gameState);
        }
    }
    
    draw(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Draw bullet based on type
        switch(this.type) {
            case 'laser':
                this.drawLaser(ctx);
                break;
            case 'rocket':
                this.drawRocket(ctx);
                break;
            case 'flame':
                this.drawFlame(ctx);
                break;
            case 'vortex':
                this.drawVortex(ctx);
                break;
            default:
                this.drawNormal(ctx);
        }
        
        ctx.restore();
    }
    
    drawNormal(ctx) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Trail effect
        ctx.globalAlpha = 0.3;
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.arc(-i * 5, 0, this.size * (1 - i * 0.2), 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawLaser(ctx) {
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = this.size * 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(20, 0);
        ctx.stroke();
        
        // Glow effect
        ctx.strokeStyle = '#FFAAAA';
        ctx.lineWidth = this.size * 4;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
    }
    
    drawRocket(ctx) {
        // Rocket body
        ctx.fillStyle = '#666';
        ctx.fillRect(-this.size * 2, -this.size, this.size * 4, this.size * 2);
        
        // Rocket tip
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.moveTo(this.size * 2, 0);
        ctx.lineTo(this.size * 3, -this.size);
        ctx.lineTo(this.size * 3, this.size);
        ctx.closePath();
        ctx.fill();
        
        // Exhaust
        ctx.fillStyle = '#FFA500';
        ctx.globalAlpha = Math.random();
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(-this.size * 2 - i * 5, 0, this.size * (1 + i * 0.3), 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawFlame(ctx) {
        // Flame particles
        ctx.globalAlpha = 0.8;
        const colors = ['#FF0000', '#FF6600', '#FFAA00', '#FFFF00'];
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            ctx.beginPath();
            ctx.arc(
                Math.random() * this.size * 2 - this.size,
                Math.random() * this.size * 2 - this.size,
                Math.random() * this.size,
                0, Math.PI * 2
            );
            ctx.fill();
        }
    }
    
    drawVortex(ctx) {
        // Spinning vortex
        ctx.strokeStyle = '#9900FF';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7;
        
        for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.rotate(Date.now() * 0.01 * (i + 1));
            ctx.beginPath();
            ctx.arc(0, 0, this.size * (i + 1), 0, Math.PI * 1.5);
            ctx.stroke();
            ctx.restore();
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Bullet;
}