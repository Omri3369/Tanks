class TankRenderer {
    constructor(tank) {
        this.tank = tank;
    }

    draw() {
        if (!this.tank.alive) return;
        
        // Draw tank trails first (beneath the tank)
        this.drawTrails();
        
        // Calculate positions where tank needs to be drawn (for edge wrapping)
        const positions = [];
        positions.push({ x: this.tank.x, y: this.tank.y }); // Main position
        
        // Check if tank needs to be drawn on opposite edges
        if (this.tank.x < TANK_SIZE) {
            positions.push({ x: this.tank.x + canvas.width, y: this.tank.y });
        } else if (this.tank.x > canvas.width - TANK_SIZE) {
            positions.push({ x: this.tank.x - canvas.width, y: this.tank.y });
        }
        
        if (this.tank.y < TANK_SIZE) {
            positions.push({ x: this.tank.x, y: this.tank.y + canvas.height });
        } else if (this.tank.y > canvas.height - TANK_SIZE) {
            positions.push({ x: this.tank.x, y: this.tank.y - canvas.height });
        }
        
        // Check corners
        if (this.tank.x < TANK_SIZE && this.tank.y < TANK_SIZE) {
            positions.push({ x: this.tank.x + canvas.width, y: this.tank.y + canvas.height });
        } else if (this.tank.x > canvas.width - TANK_SIZE && this.tank.y < TANK_SIZE) {
            positions.push({ x: this.tank.x - canvas.width, y: this.tank.y + canvas.height });
        } else if (this.tank.x < TANK_SIZE && this.tank.y > canvas.height - TANK_SIZE) {
            positions.push({ x: this.tank.x + canvas.width, y: this.tank.y - canvas.height });
        } else if (this.tank.x > canvas.width - TANK_SIZE && this.tank.y > canvas.height - TANK_SIZE) {
            positions.push({ x: this.tank.x - canvas.width, y: this.tank.y - canvas.height });
        }
        
        // Draw tank at all necessary positions
        positions.forEach(pos => {
            this.drawTankAt(pos.x, pos.y);
        });
    }
    
    drawTankAt(drawX, drawY) {
        // Check if tank is camouflaged in bushes
        const inBush = this.tank.isInBush();
        
        // Blinking effect during grace period
        if (graceTimer > 0) {
            const blinkRate = Math.floor(Date.now() / 200) % 2;
            if (blinkRate === 0) {
                ctx.globalAlpha = 0.5;
            }
        }
        
        // Camouflage effect - make tank nearly invisible in bushes
        if (inBush) {
            ctx.globalAlpha = 0.15; // Very faint visibility in bushes
        }
        
        ctx.save();
        ctx.translate(drawX, drawY + this.tank.engineBob);
        ctx.rotate(this.tank.angle);
        
        // Enhanced tank shadow with blur effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
        
        // Animated tank treads (more realistic and detailed)
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(-TANK_SIZE/2 - 4, -TANK_SIZE/2 - 3, TANK_SIZE + 8, 8);
        ctx.fillRect(-TANK_SIZE/2 - 4, TANK_SIZE/2 - 5, TANK_SIZE + 8, 8);
        
        // Animated tread details with movement offset
        ctx.fillStyle = '#2a2a2a';
        const treadOffset = this.tank.treadOffset % 12; // Loop the animation
        for (let i = -TANK_SIZE/2 - 2 - treadOffset; i <= TANK_SIZE/2 + 2; i += 6) {
            ctx.fillRect(i, -TANK_SIZE/2 - 1, 3, 4);
            ctx.fillRect(i, TANK_SIZE/2 - 3, 3, 4);
        }
        
        // Animated tread highlights that move with treads
        ctx.fillStyle = '#444';
        for (let i = -TANK_SIZE/2 - treadOffset; i <= TANK_SIZE/2; i += 6) {
            ctx.fillRect(i, -TANK_SIZE/2 + 1, 1, 2);
            ctx.fillRect(i, TANK_SIZE/2 - 3, 1, 2);
        }
        
        // Draw animated road wheels
        ctx.fillStyle = '#333';
        const wheelPositions = [-TANK_SIZE/3, 0, TANK_SIZE/3];
        wheelPositions.forEach(wheelX => {
            // Left side wheels
            ctx.save();
            ctx.translate(wheelX, -TANK_SIZE/2 + 1);
            ctx.rotate(this.tank.wheelRotation);
            ctx.fillRect(-2, -2, 4, 4);
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            ctx.strokeRect(-2, -2, 4, 4);
            ctx.restore();
            
            // Right side wheels
            ctx.save();
            ctx.translate(wheelX, TANK_SIZE/2 - 1);
            ctx.rotate(this.tank.wheelRotation);
            ctx.fillRect(-2, -2, 4, 4);
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            ctx.strokeRect(-2, -2, 4, 4);
            ctx.restore();
        });
        
        // Reset shadow for main body
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Enhanced main body with multiple gradients
        const bodyGradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, TANK_SIZE/1.5);
        bodyGradient.addColorStop(0, this.lightenColor(this.tank.color, 40));
        bodyGradient.addColorStop(0.3, this.lightenColor(this.tank.color, 15));
        bodyGradient.addColorStop(0.7, this.tank.color);
        bodyGradient.addColorStop(1, this.darkenColor(this.tank.color, 35));
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(-TANK_SIZE/2, -TANK_SIZE/2, TANK_SIZE, TANK_SIZE);
        
        // Body detail panels
        ctx.fillStyle = this.darkenColor(this.tank.secondaryColor, 25);
        ctx.fillRect(-TANK_SIZE/2 + 3, -TANK_SIZE/2 + 3, TANK_SIZE - 6, 3);
        ctx.fillRect(-TANK_SIZE/2 + 3, TANK_SIZE/2 - 6, TANK_SIZE - 6, 3);
        
        // Side armor with rivets
        const armorGradient = ctx.createLinearGradient(-TANK_SIZE/2, 0, -TANK_SIZE/2 + 6, 0);
        armorGradient.addColorStop(0, this.darkenColor(this.tank.color, 15));
        armorGradient.addColorStop(1, this.darkenColor(this.tank.color, 35));
        ctx.fillStyle = armorGradient;
        ctx.fillRect(-TANK_SIZE/2 + 1, -TANK_SIZE/2 + 6, 6, TANK_SIZE - 12);
        ctx.fillRect(TANK_SIZE/2 - 7, -TANK_SIZE/2 + 6, 6, TANK_SIZE - 12);
        
        // Armor rivets
        ctx.fillStyle = this.darkenColor(this.tank.color, 50);
        for (let y = -TANK_SIZE/2 + 8; y < TANK_SIZE/2 - 8; y += 6) {
            ctx.beginPath();
            ctx.arc(-TANK_SIZE/2 + 4, y, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(TANK_SIZE/2 - 4, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Enhanced cannon barrel with realistic proportions
        const cannonLength = 28;
        const cannonWidth = 8;
        
        // Cannon shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(TANK_SIZE/2 - 3, -cannonWidth/2 + 1, cannonLength, cannonWidth);
        
        // Main cannon barrel with gradient
        const cannonGradient = ctx.createLinearGradient(0, -cannonWidth/2, 0, cannonWidth/2);
        cannonGradient.addColorStop(0, '#777');
        cannonGradient.addColorStop(0.2, '#555');
        cannonGradient.addColorStop(0.8, '#333');
        cannonGradient.addColorStop(1, '#222');
        ctx.fillStyle = cannonGradient;
        ctx.fillRect(TANK_SIZE/2 - 4, -cannonWidth/2, cannonLength, cannonWidth);
        
        // Cannon muzzle with depth
        ctx.fillStyle = '#000';
        ctx.fillRect(TANK_SIZE/2 + cannonLength - 6, -3, 6, 6);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(TANK_SIZE/2 + cannonLength - 6, -3, 6, 6);
        
        // Cannon details and segments
        ctx.fillStyle = '#666';
        ctx.fillRect(TANK_SIZE/2 - 2, -2, 4, 4);
        ctx.fillRect(TANK_SIZE/2 + 8, -1, 2, 2);
        ctx.fillRect(TANK_SIZE/2 + 16, -1, 2, 2);
        
        // Enhanced turret with realistic shading
        const turretRadius = TANK_SIZE/3;
        const turretGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, turretRadius);
        turretGradient.addColorStop(0, this.lightenColor(this.tank.secondaryColor, 25));
        turretGradient.addColorStop(0.4, this.tank.secondaryColor);
        turretGradient.addColorStop(0.8, this.darkenColor(this.tank.secondaryColor, 20));
        turretGradient.addColorStop(1, this.darkenColor(this.tank.secondaryColor, 45));
        ctx.fillStyle = turretGradient;
        ctx.beginPath();
        ctx.arc(0, 0, turretRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Turret ring detail
        ctx.strokeStyle = this.darkenColor(this.tank.secondaryColor, 35);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, turretRadius - 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Commander's hatch with detail
        ctx.fillStyle = this.darkenColor(this.tank.secondaryColor, 40);
        ctx.beginPath();
        ctx.arc(-3, -4, turretRadius/2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this.darkenColor(this.tank.secondaryColor, 60);
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Hatch handle
        ctx.fillStyle = '#444';
        ctx.fillRect(-5, -6, 4, 1);
        
        // Vision ports
        ctx.fillStyle = '#111';
        ctx.fillRect(-8, 2, 3, 1);
        ctx.fillRect(5, 2, 3, 1);
        
        // Enhanced antenna/periscope
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(4, -10);
        ctx.lineTo(6, -16);
        ctx.stroke();
        
        // Antenna tip
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(6, -16, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Tank body outline with enhanced stroke
        ctx.strokeStyle = this.darkenColor(this.tank.color, 55);
        ctx.lineWidth = 2;
        ctx.strokeRect(-TANK_SIZE/2, -TANK_SIZE/2, TANK_SIZE, TANK_SIZE);
        
        // Engine exhaust effect when moving
        if (this.tank.isMoving && Math.random() > 0.7) {
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#444';
            const exhaustX = -TANK_SIZE/2 - 8;
            const exhaustY = -2 + (Math.random() - 0.5) * 4;
            ctx.beginPath();
            ctx.arc(exhaustX, exhaustY, 2 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // Power-up indicator with enhanced glow
        if (this.tank.powerUp) {
            const powerUpColor = this.getPowerUpColor();
            ctx.shadowColor = powerUpColor;
            ctx.shadowBlur = 15;
            
            // Animated ring
            const time = Date.now() / 200;
            const radius = 8 + Math.sin(time) * 2;
            
            ctx.strokeStyle = powerUpColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Inner glow
            ctx.fillStyle = powerUpColor;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
        
        // Draw Energy Shield Effect
        if (this.tank.hasEnergyShield) {
            ctx.save();
            ctx.translate(drawX, drawY);
            
            // Calculate shield animation
            const time = Date.now() / 100;
            const shieldRadius = TANK_SIZE + 10;
            
            // Electric arc effect
            ctx.strokeStyle = '#00DDFF';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#00DDFF';
            ctx.shadowBlur = 20;
            
            // Draw multiple animated shield layers
            for (let layer = 0; layer < 3; layer++) {
                ctx.save();
                ctx.globalAlpha = 0.3 + (Math.sin(time + layer) * 0.2);
                ctx.rotate(time * 0.05 * (layer % 2 === 0 ? 1 : -1));
                
                // Draw hexagonal shield
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 / 6) * i;
                    const x = Math.cos(angle) * (shieldRadius + layer * 3);
                    const y = Math.sin(angle) * (shieldRadius + layer * 3);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            }
            
            // Electric arcs around shield
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.8;
            for (let i = 0; i < 8; i++) {
                if (Math.random() > 0.5) {
                    const startAngle = (Math.PI * 2 / 8) * i + Math.sin(time) * 0.2;
                    const endAngle = startAngle + Math.PI / 4;
                    const startX = Math.cos(startAngle) * shieldRadius;
                    const startY = Math.sin(startAngle) * shieldRadius;
                    const endX = Math.cos(endAngle) * shieldRadius;
                    const endY = Math.sin(endAngle) * shieldRadius;
                    
                    // Draw lightning bolt
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    const midX = (startX + endX) / 2 + (Math.random() - 0.5) * 10;
                    const midY = (startY + endY) / 2 + (Math.random() - 0.5) * 10;
                    ctx.lineTo(midX, midY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                }
            }
            
            // Shield time indicator (fades when running out)
            if (this.tank.energyShieldTime < 120) { // Last 2 seconds
                ctx.globalAlpha = this.tank.energyShieldTime / 120;
                ctx.fillStyle = '#00DDFF';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(Math.ceil(this.tank.energyShieldTime / 60) + 's', 0, -shieldRadius - 10);
            }
            
            ctx.restore();
        }
        
        // Pickup notification effect (drawn in world coordinates, not rotated)
        if (this.tank.pickupNotification) {
            ctx.save();
            
            const notifTime = (120 - this.tank.pickupTimer) / 120; // 0 to 1
            const yOffset = -TANK_SIZE - 30 - (notifTime * 20); // Float upward
            const alpha = 1 - (notifTime * 0.7); // Fade out
            
            ctx.globalAlpha = alpha;
            
            // Holy circle
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;
            
            const radius = 20 + Math.sin(Date.now() * 0.01) * 3;
            ctx.beginPath();
            ctx.arc(this.tank.x, this.tank.y + yOffset, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Plus symbol
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.moveTo(this.tank.x - 8, this.tank.y + yOffset);
            ctx.lineTo(this.tank.x + 8, this.tank.y + yOffset);
            ctx.moveTo(this.tank.x, this.tank.y + yOffset - 8);
            ctx.lineTo(this.tank.x, this.tank.y + yOffset + 8);
            ctx.stroke();
            
            // Power-up icon
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10;
            ctx.fillText(this.tank.pickupNotification, this.tank.x, this.tank.y + yOffset - 35);
            
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            ctx.restore();
        }
        
        // Add vegetation overlay if tank is in bushes
        if (inBush) {
            ctx.save();
            ctx.globalAlpha = 0.6;
            
            // Draw scattered leaves and branches over the tank
            ctx.fillStyle = '#4A6741';
            for (let i = 0; i < 8; i++) {
                const leafX = this.tank.x + (Math.random() - 0.5) * TANK_SIZE * 1.5;
                const leafY = this.tank.y + (Math.random() - 0.5) * TANK_SIZE * 1.5;
                ctx.beginPath();
                ctx.arc(leafX, leafY, 2 + Math.random() * 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Draw some thin branches
            ctx.strokeStyle = '#3A5731';
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const branchX = this.tank.x + (Math.random() - 0.5) * TANK_SIZE;
                const branchY = this.tank.y + (Math.random() - 0.5) * TANK_SIZE;
                ctx.beginPath();
                ctx.moveTo(branchX, branchY);
                ctx.lineTo(branchX + (Math.random() - 0.5) * 15, branchY + (Math.random() - 0.5) * 15);
                ctx.stroke();
            }
            
            ctx.restore();
        }
        
        // Draw player name and reset alpha only during grace period
        if (graceTimer > 0) {
            ctx.save();
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            
            const playerName = this.tank.isAI ? `AI ${this.tank.playerNum}` : `Player ${this.tank.playerNum}`;
            ctx.strokeText(playerName, this.tank.x, this.tank.y - TANK_SIZE - 15);
            ctx.fillText(playerName, this.tank.x, this.tank.y - TANK_SIZE - 15);
            
            ctx.restore();
        }
        
        // Always reset alpha at the end
        ctx.globalAlpha = 1;
    }
    
    drawTrails() {
        ctx.save();
        
        // Draw each trail segment
        this.tank.trail.forEach((point, index) => {
            ctx.globalAlpha = point.opacity;
            ctx.strokeStyle = '#2C2C2C';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            
            // Connect to previous point for smooth trails
            if (index > 0) {
                const prevPoint = this.tank.trail[index - 1];
                
                // Left track
                ctx.beginPath();
                ctx.moveTo(prevPoint.leftX, prevPoint.leftY);
                ctx.lineTo(point.leftX, point.leftY);
                ctx.stroke();
                
                // Right track
                ctx.beginPath();
                ctx.moveTo(prevPoint.rightX, prevPoint.rightY);
                ctx.lineTo(point.rightX, point.rightY);
                ctx.stroke();
                
                // Add track pattern details
                if (index % 2 === 0) {
                    ctx.globalAlpha = point.opacity * 0.5;
                    ctx.fillStyle = '#1A1A1A';
                    ctx.fillRect(point.leftX - 2, point.leftY - 2, 4, 4);
                    ctx.fillRect(point.rightX - 2, point.rightY - 2, 4, 4);
                }
            }
        });
        
        ctx.restore();
    }

    lightenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    getPowerUpColor() {
        switch(this.tank.powerUp) {
            case 'scatter': return '#FFD700';
            case 'laser': return '#00FFFF';
            case 'rocket': return '#FF6600';
            case 'explosive': return '#FF3333';
            case 'piercing': return '#9966FF';
            case 'mine': return '#8B0000';
            default: return '#FFD700';
        }
    }
}