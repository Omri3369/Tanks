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

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimatedGate;
}