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

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Gate;
}