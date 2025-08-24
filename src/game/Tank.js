class Tank {
    constructor(x, y, color, controls, playerNum, secondaryColor = null) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.color = color;
        this.secondaryColor = secondaryColor || this.generateDefaultSecondaryStatic(color);
        this.controls = controls;
        this.playerNum = playerNum;
        this.alive = true;
        this.speed = 0;
        this.turnSpeed = 0;
        this.reloadTime = 0;
        this.powerUp = null;
        this.powerUpTime = 0;
        this.specialAmmo = 0; // Special power-up ammo
        this.maxSpecialAmmo = CONFIG.TANK_MAX_SPECIAL_AMMO;
        this.drone = null; // Combat drone
        
        // Energy Shield properties
        this.hasEnergyShield = false;
        this.energyShieldTime = 0;
        this.isAI = false;
        this.aiTarget = null;
        this.aiShootTimer = 0;
        this.frozen = false;
        this.frozenTime = 0;
        
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
        
        // Trail system
        this.trail = [];
        this.trailTimer = 0;
        this.trailInterval = 3; // Add trail point every 3 frames
        this.maxTrailLength = 30; // Maximum trail points
        
        // Underground state
        this.isUnderground = false;
        this.currentTunnelId = null;
        this.undergroundAlpha = 1.0; // For fade effect
        this.tunnelCooldown = 0; // Prevent immediate re-teleportation
        
        // Initialize helper classes
        this.ai = new TankAI(this);
        this.renderer = new TankRenderer(this);
        this.movement = new TankMovement(this);
        this.combat = new TankCombat(this);
        this.animator = new TankAnimator(this);
    }
    
    generateDefaultSecondaryStatic(primaryColor) {
        // Generate a complementary darker color for secondary (static version)
        if (!primaryColor) return '#333333'; // fallback
        const hex = primaryColor.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    update() {
        if (!this.alive) return;
        
        // Don't allow movement or actions during grace period
        if (typeof graceTimer !== 'undefined' && graceTimer > 0) return;
        if (typeof window !== 'undefined' && window.graceTimer > 0) return;
        
        // Handle frozen state
        if (this.frozenTime > 0) {
            this.frozenTime--;
            if (this.frozenTime === 0) {
                this.frozen = false;
            }
        }
        
        // Don't allow movement if frozen
        if (this.frozen) {
            this.speed = 0;
            this.turnSpeed = 0;
        } else {
            if (this.isAI) {
                if (typeof aiSystem !== 'undefined' && aiSystem) {
                    aiSystem.updateAI(this);
                } else if (typeof window !== 'undefined' && window.aiSystem) {
                    window.aiSystem.updateAI(this);
                }
            } else {
                if (typeof inputHandler !== 'undefined' && inputHandler) {
                    inputHandler.handleTankInput(this);
                } else if (typeof window !== 'undefined' && window.inputHandler) {
                    window.inputHandler.handleTankInput(this);
                }
            }
        }
        
        // Handle movement and physics
        this.movement.update();
        
        // Handle animations and effects
        this.animator.update();
        
        // Handle combat timers and power-ups
        this.combat.updatePowerUps();
        
        // Update energy shield timer
        if (this.hasEnergyShield && this.energyShieldTime > 0) {
            this.energyShieldTime--;
            if (this.energyShieldTime <= 0) {
                this.hasEnergyShield = false;
            }
        }
        
    }
    
    
    updateAI() {
        this.ai.updateAI();
    }

    
    shoot() {
        this.combat.shoot();
    }
    
    checkWallCollision(x, y) {
        return this.movement.checkWallCollision(x, y);
    }

    checkTankCollision(x, y) {
        return this.movement.checkTankCollision(x, y);
    }
    
    checkClearShot(target) {
        if (!target) return false;
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.floor(distance / 10);
        
        for (let i = 1; i <= steps; i++) {
            const checkX = this.x + (dx / steps) * i;
            const checkY = this.y + (dy / steps) * i;
            
            // Check if line of sight hits a wall
            for (let wall of walls) {
                if (checkX > wall.x && checkX < wall.x + wall.width &&
                    checkY > wall.y && checkY < wall.y + wall.height) {
                    return false;
                }
            }
        }
        return true;
    }
    
    isInBush() {
        return this.movement.isInBush();
    }
    
    checkTunnelTransition() {
        // Update cooldown
        if (this.tunnelCooldown > 0) {
            this.tunnelCooldown--;
            return;
        }
        
        // Check if tank is at a tunnel entrance
        for (let entrance of tunnelEntrances) {
            const dist = Math.sqrt(Math.pow(this.x - entrance.x, 2) + Math.pow(this.y - entrance.y, 2));
            
            if (dist < entrance.radius + TANK_SIZE/2) { // Include tank size in collision
                // Instantly teleport to the partner entrance
                this.teleportThroughTunnel(entrance);
                break;
            }
        }
    }
    
    teleportThroughTunnel(entrance) {
        // Find the partner entrance using partnerId
        const partnerEntrance = tunnelEntrances.find(e => e.id === entrance.partnerId);
        if (partnerEntrance) {
            // Create teleport effect at current position
            teleportEffects.push({
                x: this.x,
                y: this.y,
                radius: 0,
                maxRadius: entrance.radius * 2,
                opacity: 1,
                color: entrance.color
            });
            
            // Simply place tank at partner portal center
            // The cooldown will prevent immediate re-entry
            this.x = partnerEntrance.x;
            this.y = partnerEntrance.y;
            
            // Create teleport effect at exit position
            teleportEffects.push({
                x: partnerEntrance.x,
                y: partnerEntrance.y,
                radius: partnerEntrance.radius * 2,
                maxRadius: 0,
                opacity: 1,
                color: entrance.color
            });
            
            // Set cooldown to prevent immediate re-teleportation
            this.tunnelCooldown = 60; // 1 second at 60fps
            
            console.log(`Tank teleported from portal ${entrance.id} to portal ${entrance.partnerId}`);
        } else {
            console.log(`No partner found for portal ${entrance.id} (looking for ${entrance.partnerId})`);
        }
    }
    
    
    draw() {
        this.renderer.draw();
    }
    
    
    destroy(killer = null) {
        this.alive = false;
        
        // Track kills if there's a killer and it's not self
        if (killer && killer !== this) {
            if (!kills[`player${killer.playerNum}`]) {
                kills[`player${killer.playerNum}`] = 0;
            }
            kills[`player${killer.playerNum}`]++;
            
            // Update UI
            const killsElement = document.getElementById(`kills${killer.playerNum}`);
            if (killsElement) {
                killsElement.textContent = kills[`player${killer.playerNum}`];
            }
        }
        
        // Create explosion effect
        explosions.push(new Explosion(this.x, this.y));
        
        // Create debris particles
        for (let i = 0; i < 30; i++) {
            particles.push(new Particle(this.x, this.y, this.color));
        }
        
        // Create smoke particles
        for (let i = 0; i < 15; i++) {
            particles.push(new SmokeParticle(this.x, this.y));
        }
    }
}

// Make Tank class available globally
if (typeof window !== 'undefined') {
    window.Tank = Tank;
}