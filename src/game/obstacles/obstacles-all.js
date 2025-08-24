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

// AnimatedGate - Two walls that close and open with a gap between them
class AnimatedGate {
    constructor(x, y, width, height, isVertical = true) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isVertical = isVertical;
        
        // Animation state
        this.state = 'open'; // 'open', 'warning', 'closing', 'closed', 'opening'
        this.openTimer = 480; // 8 seconds open at 60fps
        this.warningTimer = 0;
        this.closedTimer = 0;
        
        // Gate dimensions
        if (isVertical) {
            // Vertical gate: walls move horizontally
            this.gapSize = width * 0.6; // Gap in middle
            this.wallThickness = (width - this.gapSize) / 2;
            this.maxGapSize = this.gapSize;
            this.currentGapSize = this.gapSize;
        } else {
            // Horizontal gate: walls move vertically  
            this.gapSize = height * 0.6;
            this.wallThickness = (height - this.gapSize) / 2;
            this.maxGapSize = this.gapSize;
            this.currentGapSize = this.gapSize;
        }
        
        this.crushDamage = 50;
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
                // Animate walls closing towards each other
                this.currentGapSize = Math.max(0, this.currentGapSize - this.maxGapSize / 45); // Close over 0.75 seconds
                if (this.currentGapSize <= 0) {
                    this.state = 'closed';
                    this.closedTimer = 180; // Stay closed for 3 seconds
                    this.checkCrushDamage();
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
                // Animate walls opening away from each other
                this.currentGapSize = Math.min(this.maxGapSize, this.currentGapSize + this.maxGapSize / 45);
                if (this.currentGapSize >= this.maxGapSize) {
                    this.state = 'open';
                    this.openTimer = 480; // Reset open timer
                }
                break;
        }
    }
    
    checkCrushDamage() {
        tanks.forEach(tank => {
            if (!tank.alive) return;
            
            const tankCenterX = tank.x;
            const tankCenterY = tank.y;
            const tankRadius = TANK_SIZE / 2;
            
            // Check if tank is in the gap area
            let inGapArea = false;
            
            if (this.isVertical) {
                // Gap is in the middle horizontally
                const gapLeft = this.x + this.wallThickness + (this.maxGapSize - this.currentGapSize) / 2;
                const gapRight = gapLeft + this.currentGapSize;
                
                if (tankCenterX + tankRadius > gapLeft && 
                    tankCenterX - tankRadius < gapRight &&
                    tankCenterY + tankRadius > this.y && 
                    tankCenterY - tankRadius < this.y + this.height) {
                    inGapArea = true;
                }
            } else {
                // Gap is in the middle vertically
                const gapTop = this.y + this.wallThickness + (this.maxGapSize - this.currentGapSize) / 2;
                const gapBottom = gapTop + this.currentGapSize;
                
                if (tankCenterY + tankRadius > gapTop && 
                    tankCenterY - tankRadius < gapBottom &&
                    tankCenterX + tankRadius > this.x && 
                    tankCenterX - tankRadius < this.x + this.width) {
                    inGapArea = true;
                }
            }
            
            // If tank is in gap and gate is closing/closed, deal damage
            if (inGapArea && (this.state === 'closing' || this.state === 'closed')) {
                tank.health -= this.crushDamage;
                
                // Add crushing effect
                for (let i = 0; i < 12; i++) {
                    particles.push(new Particle(
                        tank.x + (Math.random() - 0.5) * TANK_SIZE,
                        tank.y + (Math.random() - 0.5) * TANK_SIZE,
                        '#ff0000',
                        15 + Math.random() * 10
                    ));
                }
                
                if (tank.health <= 0) {
                    tank.alive = false;
                    explosions.push(new Explosion(tank.x, tank.y));
                }
            }
        });
    }
    
    blocksMovement() {
        // Gate blocks movement when gap is very small
        return this.currentGapSize < TANK_SIZE;
    }
    
    draw() {
        // Draw outer frame
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(this.x - 3, this.y - 3, this.width + 6, this.height + 6);
        
        // Warning effect when about to close
        if (this.state === 'warning') {
            const flash = Math.sin(Date.now() * 0.02) > 0;
            if (flash) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fillRect(this.x - 8, this.y - 8, this.width + 16, this.height + 16);
            }
        }
        
        // Draw the two walls
        ctx.fillStyle = '#444';
        
        if (this.isVertical) {
            // Vertical gate: walls move horizontally towards center
            const gapOffset = (this.maxGapSize - this.currentGapSize) / 2;
            
            // Left wall
            ctx.fillRect(this.x, this.y, this.wallThickness + gapOffset, this.height);
            
            // Right wall
            const rightWallX = this.x + this.wallThickness + this.currentGapSize + gapOffset;
            ctx.fillRect(rightWallX, this.y, this.wallThickness + gapOffset, this.height);
            
            // Draw wall texture on both walls
            const tileSize = 32;
            for (let wallSide = 0; wallSide < 2; wallSide++) {
                const wallX = wallSide === 0 ? this.x : rightWallX;
                const wallWidth = this.wallThickness + gapOffset;
                
                for (let x = 0; x < wallWidth; x += tileSize) {
                    for (let y = 0; y < this.height; y += tileSize) {
                        const drawWidth = Math.min(tileSize, wallWidth - x);
                        const drawHeight = Math.min(tileSize, this.height - y);
                        
                        ctx.drawImage(
                            wallImage,
                            wallX + x, this.y + y, drawWidth, drawHeight
                        );
                    }
                }
            }
            
            // Draw spikes on inner edges when closing/closed
            if (this.state === 'closing' || this.state === 'closed') {
                ctx.fillStyle = '#ff4444';
                const spikeCount = Math.floor(this.height / 25);
                
                for (let i = 0; i < spikeCount; i++) {
                    const spikeY = this.y + (i + 0.5) * (this.height / spikeCount);
                    
                    // Left wall spikes
                    const leftSpikeX = this.x + this.wallThickness + gapOffset;
                    ctx.beginPath();
                    ctx.moveTo(leftSpikeX, spikeY - 4);
                    ctx.lineTo(leftSpikeX + 8, spikeY);
                    ctx.lineTo(leftSpikeX, spikeY + 4);
                    ctx.fill();
                    
                    // Right wall spikes
                    const rightSpikeX = rightWallX;
                    ctx.beginPath();
                    ctx.moveTo(rightSpikeX, spikeY - 4);
                    ctx.lineTo(rightSpikeX - 8, spikeY);
                    ctx.lineTo(rightSpikeX, spikeY + 4);
                    ctx.fill();
                }
            }
        } else {
            // Horizontal gate: walls move vertically towards center
            const gapOffset = (this.maxGapSize - this.currentGapSize) / 2;
            
            // Top wall
            ctx.fillRect(this.x, this.y, this.width, this.wallThickness + gapOffset);
            
            // Bottom wall
            const bottomWallY = this.y + this.wallThickness + this.currentGapSize + gapOffset;
            ctx.fillRect(this.x, bottomWallY, this.width, this.wallThickness + gapOffset);
            
            // Draw wall texture on both walls
            const tileSize = 32;
            for (let wallSide = 0; wallSide < 2; wallSide++) {
                const wallY = wallSide === 0 ? this.y : bottomWallY;
                const wallHeight = this.wallThickness + gapOffset;
                
                for (let x = 0; x < this.width; x += tileSize) {
                    for (let y = 0; y < wallHeight; y += tileSize) {
                        const drawWidth = Math.min(tileSize, this.width - x);
                        const drawHeight = Math.min(tileSize, wallHeight - y);
                        
                        ctx.drawImage(
                            wallImage,
                            this.x + x, wallY + y, drawWidth, drawHeight
                        );
                    }
                }
            }
            
            // Draw spikes on inner edges when closing/closed
            if (this.state === 'closing' || this.state === 'closed') {
                ctx.fillStyle = '#ff4444';
                const spikeCount = Math.floor(this.width / 25);
                
                for (let i = 0; i < spikeCount; i++) {
                    const spikeX = this.x + (i + 0.5) * (this.width / spikeCount);
                    
                    // Top wall spikes
                    const topSpikeY = this.y + this.wallThickness + gapOffset;
                    ctx.beginPath();
                    ctx.moveTo(spikeX - 4, topSpikeY);
                    ctx.lineTo(spikeX, topSpikeY + 8);
                    ctx.lineTo(spikeX + 4, topSpikeY);
                    ctx.fill();
                    
                    // Bottom wall spikes
                    const bottomSpikeY = bottomWallY;
                    ctx.beginPath();
                    ctx.moveTo(spikeX - 4, bottomSpikeY);
                    ctx.lineTo(spikeX, bottomSpikeY - 8);
                    ctx.lineTo(spikeX + 4, bottomSpikeY);
                    ctx.fill();
                }
            }
        }
        
        // Draw gap visualization
        if (this.state !== 'closed') {
            ctx.save();
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = '#00ff00';
            
            if (this.isVertical) {
                const gapLeft = this.x + this.wallThickness + (this.maxGapSize - this.currentGapSize) / 2;
                ctx.fillRect(gapLeft, this.y, this.currentGapSize, this.height);
            } else {
                const gapTop = this.y + this.wallThickness + (this.maxGapSize - this.currentGapSize) / 2;
                ctx.fillRect(this.x, gapTop, this.width, this.currentGapSize);
            }
            ctx.restore();
        }
        
        // Timer display
        let timeLeft = 0;
        if (this.state === 'open') timeLeft = Math.ceil(this.openTimer / 60);
        else if (this.state === 'warning') timeLeft = Math.ceil(this.warningTimer / 60);
        else if (this.state === 'closed') timeLeft = Math.ceil(this.closedTimer / 60);
        
        if (timeLeft > 0) {
            ctx.fillStyle = this.state === 'warning' ? '#ff0000' : '#ffffff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(timeLeft.toString(), this.x + this.width/2, this.y - 5);
        }
    }
}

// Turret - Neutral auto-firing defensive structure
class Turret {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.centerX = x + this.width / 2;
        this.centerY = y + this.height / 2;
        
        // Turret properties
        this.angle = 0;
        this.targetAngle = 0;
        this.rotationSpeed = 0.05;
        this.range = 200;
        this.fireRate = 90; // Frames between shots (1.5 seconds at 60fps)
        this.fireCooldown = 0;
        this.currentTarget = null;
        
        // Health system
        this.maxHealth = 5;
        this.health = 5;
        this.isDestructible = true;
        
        // Bullet properties
        this.bulletSpeed = 4;
        this.bulletDamage = 15;
        
        // Visual properties
        this.barrelLength = 25;
        this.barrelWidth = 8;
        this.scanRadius = 0;
        this.muzzleFlash = 0;
    }
    
    update() {
        // Find closest target
        this.findTarget();
        
        // Rotate towards target
        if (this.currentTarget) {
            const dx = this.currentTarget.x - this.centerX;
            const dy = this.currentTarget.y - this.centerY;
            this.targetAngle = Math.atan2(dy, dx);
            
            // Smooth rotation
            let angleDiff = this.targetAngle - this.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            if (Math.abs(angleDiff) > 0.1) {
                this.angle += angleDiff * this.rotationSpeed;
            } else {
                this.angle = this.targetAngle;
                
                // Fire if aimed at target and cooldown is ready
                if (this.fireCooldown <= 0) {
                    this.fire();
                    this.fireCooldown = this.fireRate;
                    this.muzzleFlash = 10;
                }
            }
        } else {
            // Idle scanning motion when no target
            this.angle += 0.01;
        }
        
        // Update cooldowns
        if (this.fireCooldown > 0) this.fireCooldown--;
        if (this.muzzleFlash > 0) this.muzzleFlash--;
        
        // Animate scan effect
        this.scanRadius = (this.scanRadius + 2) % this.range;
    }
    
    findTarget() {
        this.currentTarget = null;
        let closestDistance = this.range;
        
        // Check all tanks
        tanks.forEach(tank => {
            if (!tank.alive) return;
            
            const dx = tank.x - this.centerX;
            const dy = tank.y - this.centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < closestDistance) {
                // Check line of sight (no walls blocking)
                if (this.hasLineOfSight(tank)) {
                    closestDistance = distance;
                    this.currentTarget = tank;
                }
            }
        });
    }
    
    hasLineOfSight(target) {
        // Simple line of sight check - can be enhanced later
        const steps = 20;
        const dx = (target.x - this.centerX) / steps;
        const dy = (target.y - this.centerY) / steps;
        
        for (let i = 1; i < steps; i++) {
            const checkX = this.centerX + dx * i;
            const checkY = this.centerY + dy * i;
            
            // Check if point hits a wall
            for (let wall of walls) {
                if (checkX >= wall.x && checkX <= wall.x + wall.width &&
                    checkY >= wall.y && checkY <= wall.y + wall.height) {
                    return false;
                }
            }
        }
        return true;
    }
    
    fire() {
        // Create turret bullet
        const bulletX = this.centerX + Math.cos(this.angle) * this.barrelLength;
        const bulletY = this.centerY + Math.sin(this.angle) * this.barrelLength;
        
        const bullet = {
            x: bulletX,
            y: bulletY,
            vx: Math.cos(this.angle) * this.bulletSpeed,
            vy: Math.sin(this.angle) * this.bulletSpeed,
            damage: this.bulletDamage,
            owner: 'turret',
            color: '#ff6600',
            size: 4,
            trail: []
        };
        
        // Add to bullets array (assuming it exists in game.js)
        if (typeof bullets !== 'undefined') {
            bullets.push(bullet);
        }
        
        // Add muzzle flash particles
        for (let i = 0; i < 5; i++) {
            if (typeof particles !== 'undefined') {
                particles.push(new Particle(
                    bulletX + (Math.random() - 0.5) * 10,
                    bulletY + (Math.random() - 0.5) * 10,
                    '#ffaa00',
                    10
                ));
            }
        }
        
        // Screen shake on fire
        if (typeof addScreenShake === 'function') {
            addScreenShake(1);
        }
    }
    
    takeDamage() {
        this.health--;
        
        // Create damage particles
        for (let i = 0; i < 8; i++) {
            if (typeof particles !== 'undefined') {
                particles.push(new Particle(
                    this.centerX + (Math.random() - 0.5) * this.width,
                    this.centerY + (Math.random() - 0.5) * this.height,
                    this.health > 2 ? '#666666' : '#ff4444',
                    15
                ));
            }
        }
        
        // Destroyed
        if (this.health <= 0) {
            this.destroy();
            return true;
        }
        
        return false;
    }
    
    destroy() {
        // Create explosion effect
        if (typeof explosions !== 'undefined') {
            explosions.push(new Explosion(this.centerX, this.centerY));
        }
        
        // Create debris particles
        for (let i = 0; i < 25; i++) {
            if (typeof particles !== 'undefined') {
                const particle = new Particle(
                    this.centerX + (Math.random() - 0.5) * this.width,
                    this.centerY + (Math.random() - 0.5) * this.height,
                    i % 3 === 0 ? '#444444' : (i % 3 === 1 ? '#666666' : '#888888'),
                    20
                );
                particle.vx = (Math.random() - 0.5) * 6;
                particle.vy = (Math.random() - 0.5) * 6;
                particle.size = Math.random() * 6 + 3;
                particles.push(particle);
            }
        }
        
        // Remove from walls array (turrets are added there for collision)
        const index = walls.indexOf(this);
        if (index > -1) {
            walls.splice(index, 1);
        }
        
        // Screen shake
        if (typeof addScreenShake === 'function') {
            addScreenShake(5);
        }
    }
    
    draw() {
        // Draw range indicator when targeting
        if (this.currentTarget) {
            ctx.save();
            ctx.globalAlpha = 0.05;
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, this.range, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // Draw scanning pulse
        if (!this.currentTarget) {
            ctx.save();
            ctx.globalAlpha = 0.3 * (1 - this.scanRadius / this.range);
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, this.scanRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        
        // Draw base shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(this.centerX + 3, this.centerY + 3, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw base
        const gradient = ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.width / 2
        );
        gradient.addColorStop(0, '#666666');
        gradient.addColorStop(1, '#333333');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw damage cracks
        if (this.health < this.maxHealth) {
            ctx.strokeStyle = '#222222';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.7;
            
            const numCracks = this.maxHealth - this.health;
            for (let i = 0; i < numCracks; i++) {
                ctx.beginPath();
                const angle = (i * Math.PI * 2) / this.maxHealth;
                ctx.moveTo(this.centerX, this.centerY);
                ctx.lineTo(
                    this.centerX + Math.cos(angle) * (this.width / 2),
                    this.centerY + Math.sin(angle) * (this.height / 2)
                );
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
        
        // Draw rotating barrel
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.angle);
        
        // Barrel shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(2, -this.barrelWidth/2 + 2, this.barrelLength, this.barrelWidth);
        
        // Barrel
        const barrelGradient = ctx.createLinearGradient(0, -this.barrelWidth/2, 0, this.barrelWidth/2);
        barrelGradient.addColorStop(0, '#888888');
        barrelGradient.addColorStop(0.5, '#aaaaaa');
        barrelGradient.addColorStop(1, '#666666');
        ctx.fillStyle = barrelGradient;
        ctx.fillRect(0, -this.barrelWidth/2, this.barrelLength, this.barrelWidth);
        
        // Barrel tip
        ctx.fillStyle = '#222222';
        ctx.fillRect(this.barrelLength - 5, -this.barrelWidth/2, 5, this.barrelWidth);
        
        // Muzzle flash
        if (this.muzzleFlash > 0) {
            ctx.save();
            ctx.globalAlpha = this.muzzleFlash / 10;
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(this.barrelLength, 0, this.muzzleFlash, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        ctx.restore();
        
        // Draw center pivot
        ctx.fillStyle = '#444444';
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw health bar if damaged
        if (this.health < this.maxHealth && this.health > 0) {
            const barWidth = 30;
            const barHeight = 4;
            const barX = this.centerX - barWidth / 2;
            const barY = this.y - 10;
            
            // Background
            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Health
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.25 ? '#FFC107' : '#F44336');
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            
            // Border
            ctx.strokeStyle = '#222222';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
        
        // Draw targeting line
        if (this.currentTarget) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(this.centerX, this.centerY);
            ctx.lineTo(this.currentTarget.x, this.currentTarget.y);
            ctx.stroke();
            ctx.restore();
        }
    }
}

// Expose globally
window.Wall = Wall;
window.DestructibleWall = DestructibleWall;
window.Gate = Gate;
window.AnimatedGate = AnimatedGate;
window.Turret = Turret;