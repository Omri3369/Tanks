// DestructibleWall - Wall that can be damaged and destroyed

class DestructibleWall extends Wall {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.maxHealth = 3;
        this.health = 3;
        this.isDestructible = true;
        this.damageEffects = [];
    }
    
    takeDamage() {
        this.health--;
        
        // Create damage particles
        for (let i = 0; i < 8; i++) {
            const px = this.x + this.width / 2 + (Math.random() - 0.5) * this.width;
            const py = this.y + this.height / 2 + (Math.random() - 0.5) * this.height;
            particles.push(new Particle(px, py, this.getDamageColor()));
        }
        
        // Add screen shake for impact
        if (typeof addScreenShake === 'function') {
            addScreenShake(2);
        }
        
        // Wall destroyed
        if (this.health <= 0) {
            this.destroy();
            return true; // Wall is destroyed
        }
        
        return false; // Wall still standing
    }
    
    destroy() {
        // Create destruction particles
        for (let i = 0; i < 20; i++) {
            const px = this.x + Math.random() * this.width;
            const py = this.y + Math.random() * this.height;
            const color = i % 3 === 0 ? '#8B4513' : (i % 3 === 1 ? '#A0522D' : '#654321');
            
            const particle = new Particle(px, py, color);
            particle.vx = (Math.random() - 0.5) * 4;
            particle.vy = (Math.random() - 0.5) * 4;
            particle.size = Math.random() * 4 + 2;
            particles.push(particle);
        }
        
        // Remove from walls array
        const index = walls.indexOf(this);
        if (index > -1) {
            walls.splice(index, 1);
        }
        
        // Remove from obstacle tiles
        const tileX = Math.floor(this.x / TILE_SIZE);
        const tileY = Math.floor(this.y / TILE_SIZE);
        obstacleTiles = obstacleTiles.filter(tile => 
            !(tile.x === tileX && tile.y === tileY && tile.type === 'wall')
        );
    }
    
    getDamageColor() {
        switch(this.health) {
            case 2: return '#A0522D'; // Light brown
            case 1: return '#8B4513'; // Saddle brown
            default: return '#654321'; // Dark brown
        }
    }
    
    draw() {
        // Don't draw shadow - let the organic shape handle it
        
        // Draw wall sprite tiled with darker tint
        const tileSize = 32;
        
        ctx.save();
        
        // First draw the wall texture normally
        for (let x = 0; x < this.width; x += tileSize) {
            for (let y = 0; y < this.height; y += tileSize) {
                const drawWidth = Math.min(tileSize, this.width - x);
                const drawHeight = Math.min(tileSize, this.height - y);
                
                if (wallImage && wallLoaded) {
                    ctx.drawImage(
                        wallImage,
                        this.x + x, this.y + y, drawWidth, drawHeight
                    );
                }
            }
        }
        
        // Apply darker tint to distinguish from regular walls
        if (this.health === this.maxHealth) {
            // Darker tint for full health destructible walls
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        } else if (this.health === 2) {
            // Even darker when damaged
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        } else if (this.health === 1) {
            // Very dark when critical
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        }
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.restore();
        
        // Draw cracks based on damage
        if (this.health < this.maxHealth) {
            ctx.strokeStyle = '#2C1810';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.7;
            
            if (this.health <= 2) {
                // Draw first crack
                ctx.beginPath();
                ctx.moveTo(this.x + this.width * 0.3, this.y);
                ctx.lineTo(this.x + this.width * 0.4, this.y + this.height * 0.4);
                ctx.lineTo(this.x + this.width * 0.2, this.y + this.height);
                ctx.stroke();
            }
            
            if (this.health <= 1) {
                // Draw second crack
                ctx.beginPath();
                ctx.moveTo(this.x + this.width * 0.7, this.y);
                ctx.lineTo(this.x + this.width * 0.6, this.y + this.height * 0.6);
                ctx.lineTo(this.x + this.width * 0.8, this.y + this.height);
                ctx.stroke();
                
                // Draw third crack horizontally
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + this.height * 0.5);
                ctx.lineTo(this.x + this.width * 0.3, this.y + this.height * 0.6);
                ctx.lineTo(this.x + this.width * 0.7, this.y + this.height * 0.4);
                ctx.lineTo(this.x + this.width, this.y + this.height * 0.5);
                ctx.stroke();
            }
            
            ctx.globalAlpha = 1.0;
        }
        
        // Draw health indicator (small bars)
        if (this.health < this.maxHealth && this.health > 0) {
            const barWidth = 4;
            const barHeight = 2;
            const barSpacing = 2;
            const totalWidth = this.maxHealth * (barWidth + barSpacing);
            const startX = this.x + (this.width - totalWidth) / 2;
            const startY = this.y - 8;
            
            for (let i = 0; i < this.maxHealth; i++) {
                ctx.fillStyle = i < this.health ? '#4CAF50' : '#424242';
                ctx.fillRect(startX + i * (barWidth + barSpacing), startY, barWidth, barHeight);
            }
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DestructibleWall;
}