// Base Bullet class - common functionality for all bullet types

class BaseBullet {
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
        
        // Handle wall collisions
        for (let wall of walls) {
            if (this.checkWallCollision(wall)) {
                if (!this.handleWallCollision(wall)) {
                    return false;
                }
            }
        }
        
        // Handle obstacle tile collisions
        for (let tile of obstacleTiles) {
            if (tile.type === 'water') continue;
            
            const tileLeft = tile.x * TILE_SIZE;
            const tileRight = tileLeft + TILE_SIZE;
            const tileTop = tile.y * TILE_SIZE;
            const tileBottom = tileTop + TILE_SIZE;
            
            if (this.x + this.size > tileLeft && 
                this.x - this.size < tileRight &&
                this.y + this.size > tileTop && 
                this.y - this.size < tileBottom) {
                
                if (!this.handleObstacleCollision(tile)) {
                    return false;
                }
            }
        }
        
        this.lifetime--;
        return this.lifetime > 0;
    }
    
    checkWallCollision(wall) {
        // Override in piercing bullet
        return this.x + this.size > wall.x && 
               this.x - this.size < wall.x + wall.width &&
               this.y + this.size > wall.y && 
               this.y - this.size < wall.y + wall.height;
    }
    
    handleWallCollision(wall) {
        // Default behavior - bounce off wall
        this.bounceOffWall(wall);
        return true;
    }
    
    handleObstacleCollision(tile) {
        // Default behavior - bounce off obstacle
        const tileLeft = tile.x * TILE_SIZE;
        const tileTop = tile.y * TILE_SIZE;
        const tileCenterX = tileLeft + TILE_SIZE / 2;
        const tileCenterY = tileTop + TILE_SIZE / 2;
        const dx = this.x - tileCenterX;
        const dy = this.y - tileCenterY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            this.angle = Math.PI - this.angle;
        } else {
            this.angle = -this.angle;
        }
        return true;
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
        // Override in specialized bullets
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
        
        // Call specialized draw method
        this.drawBulletVisual();
        
        // Restore original position
        this.x = originalX;
        this.y = originalY;
        
        ctx.restore();
    }
    
    drawBulletVisual() {
        // Default regular bullet - override in specialized classes
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
}// Laser Bullet - Fast, precise laser weapon

class LaserBullet extends BaseBullet {
    constructor(x, y, angle, owner) {
        super(x, y, angle, owner, 'laser');
    }
    
    drawBulletVisual() {
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
}// Rocket Bullet - Slow but powerful with big explosions

class RocketBullet extends BaseBullet {
    constructor(x, y, angle, owner) {
        super(x, y, angle, owner, 'rocket');
    }
    
    handleWallCollision(wall) {
        this.createBigExplosion();
        return false; // Destroy bullet
    }
    
    handleObstacleCollision(tile) {
        this.createBigExplosion();
        return false; // Destroy bullet
    }
    
    applySpecialEffect(tank) {
        this.createBigExplosion();
    }
    
    createBigExplosion() {
        // Bigger explosion for rockets
        explosions.push(new Explosion(this.x, this.y));
        
        // Add screen shake
        if (typeof addScreenShake === 'function') {
            addScreenShake(5);
        }
        
        // Larger damage radius
        tanks.forEach(tank => {
            if (!tank.alive) return;
            const distance = Math.sqrt((this.x - tank.x) ** 2 + (this.y - tank.y) ** 2);
            if (distance < 80) { // Bigger explosion radius
                tank.destroy(this.owner);
            }
        });
        
        // More particles
        for (let i = 0; i < 30; i++) {
            particles.push(new Particle(this.x, this.y, '#FF6600'));
        }
    }
    
    drawBulletVisual() {
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
}// Explosive Bullet - Explodes on impact

class ExplosiveBullet extends BaseBullet {
    constructor(x, y, angle, owner) {
        super(x, y, angle, owner, 'explosive');
    }
    
    handleWallCollision(wall) {
        // Check if it's a destructible wall
        if (wall instanceof DestructibleWall) {
            wall.takeDamage();
        }
        this.createExplosion();
        return false; // Destroy bullet
    }
    
    handleObstacleCollision(tile) {
        this.createExplosion();
        return false; // Destroy bullet
    }
    
    applySpecialEffect(tank) {
        this.createExplosion();
    }
    
    createExplosion() {
        // Create explosion at impact point
        explosions.push(new Explosion(this.x, this.y));
        
        // Damage nearby tanks
        tanks.forEach(tank => {
            if (!tank.alive) return;
            const distance = Math.sqrt((this.x - tank.x) ** 2 + (this.y - tank.y) ** 2);
            if (distance < 60) { // Explosion radius
                tank.destroy(this.owner);
            }
        });
        
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            particles.push(new Particle(this.x, this.y, '#FF3333'));
        }
    }
    
    drawBulletVisual() {
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
}// Piercing Bullet - Goes through walls and obstacles

class PiercingBullet extends BaseBullet {
    constructor(x, y, angle, owner) {
        super(x, y, angle, owner, 'piercing');
    }
    
    checkWallCollision(wall) {
        // Piercing bullets don't check wall collisions initially
        return false;
    }
    
    handleWallCollision(wall) {
        if (this.pierced < this.maxPiercing) {
            this.pierced++;
            
            // Damage destructible walls
            if (wall instanceof DestructibleWall) {
                wall.takeDamage();
            }
            
            // Create piercing effect
            for (let i = 0; i < 5; i++) {
                particles.push(new Particle(this.x, this.y, '#9966FF'));
            }
            return true; // Continue through wall
        }
        
        // Max piercing reached, bounce
        this.bounceOffWall(wall);
        return true;
    }
    
    handleObstacleCollision(tile) {
        if (this.pierced < this.maxPiercing) {
            this.pierced++;
            
            // Create piercing effect
            for (let i = 0; i < 5; i++) {
                particles.push(new Particle(this.x, this.y, '#9966FF'));
            }
            return true; // Continue through obstacle
        }
        
        // Max piercing reached, bounce
        return super.handleObstacleCollision(tile);
    }
    
    // Override update to handle wall collisions properly for piercing
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
        
        // Special wall collision handling for piercing
        for (let wall of walls) {
            // Check actual collision
            if (this.x + this.size > wall.x && 
                this.x - this.size < wall.x + wall.width &&
                this.y + this.size > wall.y && 
                this.y - this.size < wall.y + wall.height) {
                
                if (!this.handleWallCollision(wall)) {
                    return false;
                }
            }
        }
        
        // Handle obstacle tile collisions
        for (let tile of obstacleTiles) {
            if (tile.type === 'water') continue;
            
            const tileLeft = tile.x * TILE_SIZE;
            const tileRight = tileLeft + TILE_SIZE;
            const tileTop = tile.y * TILE_SIZE;
            const tileBottom = tileTop + TILE_SIZE;
            
            if (this.x + this.size > tileLeft && 
                this.x - this.size < tileRight &&
                this.y + this.size > tileTop && 
                this.y - this.size < tileBottom) {
                
                if (!this.handleObstacleCollision(tile)) {
                    return false;
                }
            }
        }
        
        this.lifetime--;
        return this.lifetime > 0;
    }
    
    drawBulletVisual() {
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
}// Freeze Bullet - Freezes enemy tanks

class FreezeBullet extends BaseBullet {
    constructor(x, y, angle, owner) {
        super(x, y, angle, owner, 'freeze');
    }
    
    applySpecialEffect(tank) {
        // Freeze the tank
        if (!tank.frozen) {
            tank.frozen = true;
            tank.frozenTime = 180; // 3 seconds at 60fps
            
            // Create freeze effect particles
            for (let i = 0; i < 10; i++) {
                const particle = new Particle(tank.x, tank.y, '#66CCFF');
                particle.vx = (Math.random() - 0.5) * 4;
                particle.vy = (Math.random() - 0.5) * 4;
                particles.push(particle);
            }
        }
    }
    
    drawBulletVisual() {
        ctx.shadowColor = '#66CCFF';
        ctx.shadowBlur = 12;
        
        // Ice crystal effect
        ctx.fillStyle = '#66CCFF';
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Draw snowflake pattern
        for (let i = 0; i < 6; i++) {
            ctx.rotate(Math.PI / 3);
            ctx.fillRect(-this.size * 1.5, -1, this.size * 3, 2);
        }
        
        // Center crystal
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Sparkling effect
        if (Math.random() > 0.7) {
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 0.8;
            const sparkX = this.x + (Math.random() - 0.5) * this.size * 2;
            const sparkY = this.y + (Math.random() - 0.5) * this.size * 2;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}// Scatter Bullet - Multiple bullets in a spread pattern

class ScatterBullet extends BaseBullet {
    constructor(x, y, angle, owner) {
        super(x, y, angle, owner, 'scatter');
    }
    
    drawBulletVisual() {
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
}

// Main Bullet factory class
class Bullet {
    constructor(x, y, angle, owner, type = null) {
        switch(type) {
            case 'laser': return new LaserBullet(x, y, angle, owner);
            case 'rocket': return new RocketBullet(x, y, angle, owner);
            case 'explosive': return new ExplosiveBullet(x, y, angle, owner);
            case 'piercing': return new PiercingBullet(x, y, angle, owner);
            case 'freeze': return new FreezeBullet(x, y, angle, owner);
            case 'scatter': return new ScatterBullet(x, y, angle, owner);
            default: return new BaseBullet(x, y, angle, owner, type);
        }
    }
}

// Expose globally
window.Bullet = Bullet;
window.BaseBullet = BaseBullet;
