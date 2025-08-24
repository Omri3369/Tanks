// All Obstacles - Combined file with all obstacle classes

// Wall - Basic wall obstacle that blocks movement and bullets
class Wall {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    draw() {
        // Draw shadow first
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x + 2, this.y + 2, this.width, this.height);
        
        // Draw wall sprite tiled at appropriate size
        const tileSize = 32; // Use consistent tile size
        
        for (let x = 0; x < this.width; x += tileSize) {
            for (let y = 0; y < this.height; y += tileSize) {
                const drawWidth = Math.min(tileSize, this.width - x);
                const drawHeight = Math.min(tileSize, this.height - y);
                
                ctx.drawImage(
                    wallImage,
                    this.x + x, this.y + y, drawWidth, drawHeight
                );
            }
        }
    }
}

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
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(this.x + 3, this.y + 3, this.width, this.height);
        
        // Draw bright background color based on health
        if (this.health === this.maxHealth) {
            // Bright yellow for full health
            ctx.fillStyle = '#FFEB3B';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else if (this.health === 2) {
            // Orange for damaged
            ctx.fillStyle = '#FF9800';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else if (this.health === 1) {
            // Red for critical
            ctx.fillStyle = '#F44336';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        // Draw wall texture semi-transparent over the color
        const tileSize = 32;
        ctx.save();
        ctx.globalAlpha = 0.3; // Very transparent to show bright color
        for (let x = 0; x < this.width; x += tileSize) {
            for (let y = 0; y < this.height; y += tileSize) {
                const drawWidth = Math.min(tileSize, this.width - x);
                const drawHeight = Math.min(tileSize, this.height - y);
                ctx.drawImage(
                    wallImage,
                    this.x + x, this.y + y, drawWidth, drawHeight
                );
            }
        }
        ctx.restore();
        
        // Draw thick colored border
        ctx.lineWidth = 3;
        if (this.health === this.maxHealth) {
            ctx.strokeStyle = '#FFC107'; // Amber border
        } else if (this.health === 2) {
            ctx.strokeStyle = '#FF5722'; // Deep orange border
        } else {
            ctx.strokeStyle = '#B71C1C'; // Dark red border
        }
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Add pulsing effect for full health walls
        if (this.health === this.maxHealth) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 0.3;
            ctx.save();
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }
        
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

// Gate - Dynamic obstacle that opens and closes periodically
class Gate {
    constructor(x, y, width, height, isVertical = true) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isVertical = isVertical;
        this.isOpen = true;
        this.openTimer = 480; // 8 seconds open at 60fps
        this.warningTimer = 0;
        this.closedTimer = 0;
        this.openHeight = height;
        this.openWidth = width;
        this.currentHeight = height;
        this.currentWidth = width;
        this.state = 'open'; // 'open', 'warning', 'closing', 'closed'
        this.crushDamage = 75;
    }
    
    update() {
        switch (this.state) {
            case 'open':
                this.openTimer--;
                if (this.openTimer <= 0) {
                    this.state = 'warning';
                    this.warningTimer = 120; // 2 seconds warning
                }
                break;
                
            case 'warning':
                this.warningTimer--;
                if (this.warningTimer <= 0) {
                    this.state = 'closing';
                }
                break;
                
            case 'closing':
                // Animate gate closing
                if (this.isVertical) {
                    this.currentHeight = Math.max(0, this.currentHeight - this.openHeight / 30); // Close over 0.5 seconds
                    if (this.currentHeight <= 0) {
                        this.state = 'closed';
                        this.closedTimer = 120; // Stay closed for 2 seconds
                        this.checkCrushDamage();
                    }
                } else {
                    this.currentWidth = Math.max(0, this.currentWidth - this.openWidth / 30);
                    if (this.currentWidth <= 0) {
                        this.state = 'closed';
                        this.closedTimer = 120;
                        this.checkCrushDamage();
                    }
                }
                this.checkCrushDamage(); // Check during closing too
                break;
                
            case 'closed':
                this.closedTimer--;
                if (this.closedTimer <= 0) {
                    this.state = 'opening';
                }
                break;
                
            case 'opening':
                // Animate gate opening
                if (this.isVertical) {
                    this.currentHeight = Math.min(this.openHeight, this.currentHeight + this.openHeight / 30);
                    if (this.currentHeight >= this.openHeight) {
                        this.state = 'open';
                        this.openTimer = 480; // Reset open timer
                    }
                } else {
                    this.currentWidth = Math.min(this.openWidth, this.currentWidth + this.openWidth / 30);
                    if (this.currentWidth >= this.openWidth) {
                        this.state = 'open';
                        this.openTimer = 480;
                    }
                }
                break;
        }
    }
    
    checkCrushDamage() {
        tanks.forEach(tank => {
            if (!tank.alive) return;
            
            // Check if tank is inside gate area
            const tankCenterX = tank.x;
            const tankCenterY = tank.y;
            const tankRadius = TANK_SIZE / 2;
            
            if (tankCenterX + tankRadius > this.x && 
                tankCenterX - tankRadius < this.x + this.width &&
                tankCenterY + tankRadius > this.y && 
                tankCenterY - tankRadius < this.y + this.height) {
                
                // Tank is in gate area - check if gate is closing/closed
                if (this.state === 'closing' || this.state === 'closed') {
                    tank.health -= this.crushDamage;
                    
                    // Add crushing effect
                    for (let i = 0; i < 15; i++) {
                        particles.push(new Particle(
                            tank.x + (Math.random() - 0.5) * TANK_SIZE,
                            tank.y + (Math.random() - 0.5) * TANK_SIZE,
                            '#ff0000',
                            20 + Math.random() * 10
                        ));
                    }
                    
                    if (tank.health <= 0) {
                        tank.alive = false;
                        explosions.push(new Explosion(tank.x, tank.y));
                    }
                }
            }
        });
    }
    
    blocksMovement() {
        return this.state === 'closed' || (this.state === 'closing' && 
               (this.isVertical ? this.currentHeight < this.openHeight * 0.3 : this.currentWidth < this.openWidth * 0.3));
    }
    
    draw() {
        // Gate frame (always visible)
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
        
        // Warning effect when about to close
        if (this.state === 'warning') {
            const flash = Math.sin(Date.now() * 0.02) > 0;
            if (flash) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fillRect(this.x - 10, this.y - 10, this.width + 20, this.height + 20);
            }
        }
        
        // Gate opening area
        if (this.state !== 'closed') {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
            if (this.isVertical) {
                ctx.fillRect(this.x, this.y + (this.openHeight - this.currentHeight), this.width, this.currentHeight);
            } else {
                ctx.fillRect(this.x + (this.openWidth - this.currentWidth), this.y, this.currentWidth, this.height);
            }
        }
        
        // Gate walls (the solid parts)
        ctx.fillStyle = '#444';
        if (this.isVertical) {
            // Top part
            if (this.openHeight - this.currentHeight > 0) {
                ctx.fillRect(this.x, this.y, this.width, this.openHeight - this.currentHeight);
            }
        } else {
            // Left part  
            if (this.openWidth - this.currentWidth > 0) {
                ctx.fillRect(this.x, this.y, this.openWidth - this.currentWidth, this.height);
            }
        }
        
        // Gate teeth/spikes for visual danger
        if (this.state === 'closing' || this.state === 'closed') {
            ctx.fillStyle = '#ff4444';
            if (this.isVertical) {
                const spikeCount = Math.floor(this.width / 20);
                for (let i = 0; i < spikeCount; i++) {
                    const spikeX = this.x + (i + 0.5) * (this.width / spikeCount);
                    const spikeY = this.y + (this.openHeight - this.currentHeight);
                    ctx.beginPath();
                    ctx.moveTo(spikeX - 5, spikeY);
                    ctx.lineTo(spikeX, spikeY + 10);
                    ctx.lineTo(spikeX + 5, spikeY);
                    ctx.fill();
                }
            } else {
                const spikeCount = Math.floor(this.height / 20);
                for (let i = 0; i < spikeCount; i++) {
                    const spikeX = this.x + (this.openWidth - this.currentWidth);
                    const spikeY = this.y + (i + 0.5) * (this.height / spikeCount);
                    ctx.beginPath();
                    ctx.moveTo(spikeX, spikeY - 5);
                    ctx.lineTo(spikeX + 10, spikeY);
                    ctx.lineTo(spikeX, spikeY + 5);
                    ctx.fill();
                }
            }
        }
        
        // Timer display
        let timeLeft = 0;
        if (this.state === 'open') timeLeft = Math.ceil(this.openTimer / 60);
        else if (this.state === 'warning') timeLeft = Math.ceil(this.warningTimer / 60);
        else if (this.state === 'closed') timeLeft = Math.ceil(this.closedTimer / 60);
        
        if (timeLeft > 0) {
            ctx.fillStyle = this.state === 'warning' ? '#ff0000' : '#ffffff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(timeLeft.toString(), this.x + this.width/2, this.y - 10);
        }
    }
}

// Expose globally
window.Wall = Wall;
window.DestructibleWall = DestructibleWall;
window.Gate = Gate;