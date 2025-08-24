// Bullet class with all weapon variants

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
            case 'freeze':
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
                tank.destroy(this.owner);
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
            case 'freeze':
                this.drawFreezeBullet();
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
    
    drawFreezeBullet() {
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
}

// Expose globally for backward compatibility
window.Bullet = Bullet;