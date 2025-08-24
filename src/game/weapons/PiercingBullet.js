// Piercing Bullet - Goes through walls and obstacles

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
}