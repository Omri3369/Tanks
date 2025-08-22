class Tank extends GameObject {
    constructor(x, y, color, controls, playerNum, secondaryColor = null) {
        super(x, y);
        this.angle = 0;
        this.color = color;
        this.secondaryColor = secondaryColor || this.generateDefaultSecondaryColor(color);
        this.controls = controls;
        this.playerNum = playerNum;
        this.speed = 0;
        this.turnSpeed = 0;
        this.reloadTime = 0;
        this.powerUp = null;
        this.powerUpTime = 0;
        this.specialAmmo = 0;
        this.maxSpecialAmmo = CONFIG.TANK_MAX_SPECIAL_AMMO;
        this.drone = null;
        this.isAI = false;
        this.aiTarget = null;
        this.aiShootTimer = 0;
        this.frozen = false;
        this.frozenTime = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.shield = 0;
        
        // Animation properties
        this.wheelRotation = 0;
        this.treadOffset = 0;
        this.engineBob = 0;
        this.lastX = x;
        this.lastY = y;
        this.isMoving = false;
        
        // Pickup notification
        this.pickupNotification = null;
        this.pickupTimer = 0;
        
        // Size for collision
        this.radius = TANK_SIZE;
        
        // Trail system
        this.trail = [];
        this.trailTimer = 0;
        this.trailInterval = 3; // Add trail point every 3 frames
        this.maxTrailLength = 30; // Maximum trail points
    }
    
    generateDefaultSecondaryColor(primaryColor) {
        if (!primaryColor) return '#333333';
        const hex = primaryColor.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    update(deltaTime, gameState) {
        if (!this.alive) return;
        
        // Handle frozen state
        if (this.frozenTime > 0) {
            this.frozenTime--;
            if (this.frozenTime === 0) {
                this.frozen = false;
            }
        }
        
        // Handle movement input
        if (!this.frozen) {
            if (this.isAI) {
                gameState.aiSystem.updateAI(this);
            } else {
                gameState.inputHandler.handleTankInput(this);
            }
        } else {
            this.speed = 0;
            this.turnSpeed = 0;
        }
        
        // Calculate new position
        const newX = this.x + Math.cos(this.angle) * this.speed;
        const newY = this.y + Math.sin(this.angle) * this.speed;
        
        // Apply movement with collision detection
        this.applyMovement(newX, newY, gameState);
        
        // Update angle
        this.angle += this.turnSpeed;
        
        // Update animations
        this.updateAnimations();
        
        // Update trail
        this.updateTrail();
        
        // Update timers
        this.updateTimers();
        
        // Update power-ups
        this.updatePowerUps();
    }
    
    applyMovement(newX, newY, gameState) {
        const boundedX = Math.max(this.radius/2, Math.min(gameState.canvas.width - this.radius/2, newX));
        const boundedY = Math.max(this.radius/2, Math.min(gameState.canvas.height - this.radius/2, newY));
        
        if (!this.checkWallCollision(boundedX, boundedY, gameState.walls, gameState.gates)) {
            this.x = boundedX;
            this.y = boundedY;
        } else {
            // Try moving only on X axis
            if (!this.checkWallCollision(boundedX, this.y, gameState.walls, gameState.gates)) {
                this.x = boundedX;
            }
            // Try moving only on Y axis
            else if (!this.checkWallCollision(this.x, boundedY, gameState.walls, gameState.gates)) {
                this.y = boundedY;
            }
        }
    }
    
    checkWallCollision(x, y, walls, gates) {
        // Check wall collisions
        for (let wall of walls) {
            if (x + this.radius > wall.x && 
                x - this.radius < wall.x + wall.width &&
                y + this.radius > wall.y && 
                y - this.radius < wall.y + wall.height) {
                return true;
            }
        }
        
        // Check gate collisions
        for (let gate of gates) {
            if (gate.blocksMovement() &&
                x + this.radius > gate.x && 
                x - this.radius < gate.x + gate.width &&
                y + this.radius > gate.y && 
                y - this.radius < gate.y + gate.height) {
                return true;
            }
        }
        
        return false;
    }
    
    updateAnimations() {
        const distanceMoved = Math.sqrt((this.x - this.lastX) ** 2 + (this.y - this.lastY) ** 2);
        this.isMoving = distanceMoved > 0.1;
        
        if (this.isMoving) {
            this.wheelRotation += distanceMoved * CONFIG.WHEEL_ROTATION_SPEED;
            this.treadOffset += distanceMoved * CONFIG.TREAD_ANIMATION_SPEED;
            this.engineBob = Math.sin(Date.now() * CONFIG.ENGINE_BOB_SPEED) * CONFIG.ENGINE_BOB_AMPLITUDE;
        } else {
            this.engineBob *= 0.9;
        }
        
        this.lastX = this.x;
        this.lastY = this.y;
    }
    
    updateTrail() {
        // Update trail fade
        this.trail.forEach(point => {
            point.opacity -= 0.02; // Fade out over time
        });
        
        // Remove faded trail points
        this.trail = this.trail.filter(point => point.opacity > 0);
        
        // Add new trail point if moving
        if (this.isMoving && this.speed !== 0) {
            this.trailTimer++;
            if (this.trailTimer >= this.trailInterval) {
                this.trailTimer = 0;
                
                // Add left and right track positions
                const trackOffset = TANK_SIZE * 0.4;
                const leftX = this.x - Math.sin(this.angle) * trackOffset;
                const leftY = this.y + Math.cos(this.angle) * trackOffset;
                const rightX = this.x + Math.sin(this.angle) * trackOffset;
                const rightY = this.y - Math.cos(this.angle) * trackOffset;
                
                this.trail.push({
                    leftX, leftY,
                    rightX, rightY,
                    angle: this.angle,
                    opacity: 0.5
                });
                
                // Limit trail length
                if (this.trail.length > this.maxTrailLength) {
                    this.trail.shift();
                }
            }
        }
    }
    
    updateTimers() {
        if (this.reloadTime > 0) this.reloadTime--;
        if (this.pickupTimer > 0) {
            this.pickupTimer--;
            if (this.pickupTimer === 0) {
                this.pickupNotification = null;
            }
        }
    }
    
    updatePowerUps() {
        if (this.powerUpTime > 0) {
            this.powerUpTime--;
            if (this.powerUpTime === 0) {
                this.powerUp = null;
                this.specialAmmo = 0;
            }
        }
    }
    
    shoot(weaponSystem, gameState) {
        if (this.reloadTime > 0) return null;
        
        const bulletX = this.x + Math.cos(this.angle) * (this.radius + 5);
        const bulletY = this.y + Math.sin(this.angle) * (this.radius + 5);
        
        const bullets = weaponSystem.createBullets(
            bulletX, bulletY, this.angle, this.playerNum, this.powerUp, this
        );
        
        if (bullets && bullets.length > 0) {
            // Consume ammo if needed
            if (this.powerUp && this.specialAmmo > 0) {
                this.specialAmmo--;
                if (this.specialAmmo <= 0) {
                    this.powerUpTime = 0;
                    this.powerUp = null;
                }
            }
            
            this.reloadTime = CONFIG.TANK_RELOAD_TIME;
        }
        
        return bullets;
    }
    
    takeDamage(amount) {
        if (this.shield > 0) {
            this.shield -= amount;
            if (this.shield < 0) {
                this.health += this.shield; // Apply remaining damage to health
                this.shield = 0;
            }
        } else {
            this.health -= amount;
        }
        
        if (this.health <= 0) {
            this.destroy();
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    freeze(duration) {
        this.frozen = true;
        this.frozenTime = duration;
    }
    
    addPowerUp(type, ammo = CONFIG.TANK_MAX_SPECIAL_AMMO) {
        this.powerUp = type;
        this.specialAmmo = ammo;
        this.powerUpTime = CONFIG.POWERUP_DURATION;
        this.pickupNotification = type;
        this.pickupTimer = 60;
    }
    
    draw(ctx, graceTimer = 0) {
        if (!this.alive) return;
        
        // Blinking effect during grace period
        if (graceTimer > 0 && Math.floor(Date.now() / 200) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        ctx.save();
        ctx.translate(this.x, this.y + this.engineBob);
        ctx.rotate(this.angle);
        
        // Draw shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        // Draw tank body
        this.drawBody(ctx);
        
        // Draw turret
        this.drawTurret(ctx);
        
        // Draw treads
        this.drawTreads(ctx);
        
        // Draw power-up indicator
        if (this.powerUp) {
            this.drawPowerUpIndicator(ctx);
        }
        
        ctx.restore();
        
        // Draw UI elements
        this.drawUI(ctx);
    }
    
    drawBody(ctx) {
        // Main body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.radius, -this.radius * 0.8, this.radius * 2, this.radius * 1.6);
        
        // Body details
        ctx.fillStyle = this.secondaryColor;
        ctx.fillRect(-this.radius * 0.8, -this.radius * 0.6, this.radius * 1.6, this.radius * 1.2);
    }
    
    drawTurret(ctx) {
        // Turret base
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Cannon
        ctx.fillStyle = this.color;
        ctx.fillRect(0, -this.radius * 0.15, this.radius * 1.2, this.radius * 0.3);
        
        // Cannon tip
        ctx.fillStyle = '#333';
        ctx.fillRect(this.radius * 1.2, -this.radius * 0.1, this.radius * 0.2, this.radius * 0.2);
    }
    
    drawTreads(ctx) {
        ctx.fillStyle = '#333';
        const treadPattern = Math.floor(this.treadOffset) % 10;
        
        // Left tread
        for (let i = -3; i <= 3; i++) {
            if ((i + treadPattern) % 2 === 0) {
                ctx.fillRect(-this.radius - 5, i * 8, 5, 6);
            }
        }
        
        // Right tread
        for (let i = -3; i <= 3; i++) {
            if ((i + treadPattern) % 2 === 0) {
                ctx.fillRect(this.radius, i * 8, 5, 6);
            }
        }
    }
    
    drawPowerUpIndicator(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.01) * 0.4;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    
    drawUI(ctx) {
        // Draw health bar
        if (this.health < this.maxHealth) {
            ctx.save();
            const barWidth = 40;
            const barHeight = 6;
            const barY = this.y - this.radius - 20;
            
            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
            
            // Health
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFA500' : '#FF0000';
            ctx.fillRect(this.x - barWidth/2, barY, barWidth * healthPercent, barHeight);
            
            ctx.restore();
        }
        
        // Draw shield bar
        if (this.shield > 0) {
            ctx.save();
            const barWidth = 40;
            const barHeight = 4;
            const barY = this.y - this.radius - 28;
            
            ctx.fillStyle = '#00BFFF';
            ctx.fillRect(this.x - barWidth/2, barY, barWidth * (this.shield / 100), barHeight);
            
            ctx.restore();
        }
        
        // Draw pickup notification
        if (this.pickupNotification) {
            ctx.save();
            ctx.globalAlpha = this.pickupTimer / 60;
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.pickupNotification.toUpperCase(), this.x, this.y - this.radius - 40);
            ctx.restore();
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Tank;
}