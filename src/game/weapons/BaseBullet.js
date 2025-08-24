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
}