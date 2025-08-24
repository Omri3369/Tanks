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
        if (graceTimer > 0) return;
        
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
                aiSystem.updateAI(this);
            } else {
                inputHandler.handleTankInput(this);
            }
        }
        
        // Check if tank is on sand terrain for speed reduction
        let speedModifier = 1.0;
        const gridX = Math.floor(this.x / TILE_SIZE);
        const gridY = Math.floor(this.y / TILE_SIZE);
        
        // Check if current position is on sand
        const currentTileIndex = gridY * Math.ceil(canvas.width / TILE_SIZE) + gridX;
        if (currentTileIndex >= 0 && currentTileIndex < terrainTiles.length) {
            if (terrainTiles[currentTileIndex].type === 'sand') {
                speedModifier = 0.75; // Reduce speed to 75% on sand
            }
        }
        
        let newX = this.x + Math.cos(this.angle) * this.speed * speedModifier;
        let newY = this.y + Math.sin(this.angle) * this.speed * speedModifier;
        
        // Screen wrapping logic - allow tank to go partially off-screen
        if (newX < -TANK_SIZE) {
            newX = canvas.width + TANK_SIZE;
        } else if (newX > canvas.width + TANK_SIZE) {
            newX = -TANK_SIZE;
        }
        
        if (newY < -TANK_SIZE) {
            newY = canvas.height + TANK_SIZE;
        } else if (newY > canvas.height + TANK_SIZE) {
            newY = -TANK_SIZE;
        }
        
        // Check for tunnel entrance/exit
        // this.checkTunnelTransition(); // DISABLED FOR NOW
        
        // Only move if no wall collision
        if (!this.checkWallCollision(newX, newY)) {
            this.x = newX;
            this.y = newY;
        } else {
            // Try moving only on X axis
            if (!this.checkWallCollision(newX, this.y)) {
                this.x = newX;
            }
            // Try moving only on Y axis
            else if (!this.checkWallCollision(this.x, newY)) {
                this.y = newY;
            }
        }
        
        this.angle += this.turnSpeed;
        
        // Update animation properties
        const distanceMoved = Math.sqrt((this.x - this.lastX) ** 2 + (this.y - this.lastY) ** 2);
        this.isMoving = distanceMoved > 0.1;
        
        if (this.isMoving) {
            // Animate wheel rotation based on movement
            this.wheelRotation += distanceMoved * 0.2;
            this.treadOffset += distanceMoved * 0.3;
            
            // Engine bob effect when moving
            this.engineBob = Math.sin(Date.now() * 0.02) * 0.5;
        } else {
            this.engineBob *= 0.9; // Gradual stop
        }
        
        this.lastX = this.x;
        this.lastY = this.y;
        
        // Update trail
        this.updateTrail();
        
        // Update pickup notification
        if (this.pickupTimer > 0) {
            this.pickupTimer--;
            if (this.pickupTimer === 0) {
                this.pickupNotification = null;
            }
        }
        
        if (this.reloadTime > 0) this.reloadTime--;
        if (this.powerUpTime > 0) {
            this.powerUpTime--;
            if (this.powerUpTime === 0) {
                this.powerUp = null;
            }
        }
    }
    
    
    updateAI() {
        if (!this.aiState) {
            this.aiState = {
                mode: 'hunt',
                strafingDirection: Math.random() > 0.5 ? 1 : -1,
                lastDirectionChange: 0,
                powerUpTarget: null,
                wallAvoidanceAngle: 0,
                lastShot: 0
            };
        }

        // Find best target (prioritize by threat level)
        let bestTarget = this.findBestTarget();
        let nearestPowerUp = this.findNearestPowerUp();
        
        if (!bestTarget && !nearestPowerUp) return;

        // Decide AI mode based on situation
        this.decideAIMode(bestTarget, nearestPowerUp);
        
        // Execute behavior based on current mode
        switch (this.aiState.mode) {
            case 'hunt':
                this.huntBehavior(bestTarget);
                break;
            case 'powerup':
                this.powerUpBehavior(nearestPowerUp);
                break;
            case 'retreat':
                this.retreatBehavior(bestTarget);
                break;
            case 'strafe':
                this.strafeBehavior(bestTarget);
                break;
        }

        // Enhanced shooting logic
        this.aiShootTimer--;
        if (bestTarget && this.aiShootTimer <= 0) {
            this.smartShooting(bestTarget);
        }
    }

    findBestTarget() {
        let bestTarget = null;
        let bestScore = -1;
        
        tanks.forEach(t => {
            if (t !== this && t.alive) {
                const dist = Math.sqrt((t.x - this.x) ** 2 + (t.y - this.y) ** 2);
                let score = 1000 / dist; // Closer = higher priority
                
                // Prioritize targets with power-ups
                if (t.powerUp) score *= 1.5;
                
                // Prioritize low health targets
                if (t.health < 50) score *= 1.3;
                
                // Avoid targeting tanks behind walls unless we have piercing
                if (!this.checkClearShot(t) && this.powerUp !== 'piercing') {
                    score *= 0.3;
                }
                
                if (score > bestScore) {
                    bestScore = score;
                    bestTarget = t;
                }
            }
        });
        
        return bestTarget;
    }

    findNearestPowerUp() {
        if (this.powerUp) return null; // Already have one
        
        let nearest = null;
        let minDist = Infinity;
        
        powerUps.forEach(p => {
            const dist = Math.sqrt((p.x - this.x) ** 2 + (p.y - this.y) ** 2);
            if (dist < minDist && dist < 300) { // Only consider nearby power-ups
                minDist = dist;
                nearest = p;
            }
        });
        
        return nearest;
    }

    decideAIMode(target, powerUp) {
        const targetDist = target ? Math.sqrt((target.x - this.x) ** 2 + (target.y - this.y) ** 2) : Infinity;
        const powerUpDist = powerUp ? Math.sqrt((powerUp.x - this.x) ** 2 + (powerUp.y - this.y) ** 2) : Infinity;
        
        // Check for danger situations first (prioritize survival)
        const isLowHealth = this.health < 50;
        const isVeryLowHealth = this.health < 25;
        const nearWall = this.isNearWall();
        const inDangerousPosition = nearWall && targetDist < 150;
        
        // Survival takes priority - retreat if in danger
        if (isVeryLowHealth || inDangerousPosition || (isLowHealth && targetDist < 100)) {
            this.aiState.mode = 'retreat';
            return;
        }
        
        // Add randomness to decision making (reduced to 10% for more careful behavior)
        if (Math.random() < 0.1) {
            const randomModes = ['hunt', 'strafe'];
            this.aiState.mode = randomModes[Math.floor(Math.random() * randomModes.length)];
            return;
        }
        
        // Go for power-up if safe and beneficial
        if (powerUp && powerUpDist < 150 && targetDist > 200 && !nearWall) {
            this.aiState.mode = 'powerup';
        }
        // Strafe if at medium range and safe
        else if (target && targetDist > 100 && targetDist < 200 && !nearWall) {
            this.aiState.mode = 'strafe';
        }
        // Hunt if target is far or no other priority
        else {
            this.aiState.mode = 'hunt';
        }
    }

    huntBehavior(target) {
        if (!target) return;
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        let targetAngle = Math.atan2(dy, dx);
        
        // Add random jitter to movement (5% chance to act erratically)
        if (Math.random() < 0.05) {
            targetAngle += (Math.random() - 0.5) * Math.PI;
        }
        
        // Check for wall collision ahead
        const wallAvoidAngle = this.getWallAvoidanceAngle();
        const finalAngle = wallAvoidAngle !== 0 ? wallAvoidAngle : targetAngle;
        
        let angleDiff = finalAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Turn towards target or away from wall (reduced turning sensitivity)
        const turnThreshold = 0.1 + Math.random() * 0.05;
        if (Math.abs(angleDiff) > turnThreshold) {
            this.turnSpeed = (angleDiff > 0 ? TANK_TURN_SPEED : -TANK_TURN_SPEED) * 0.7;
        } else {
            this.turnSpeed = 0;
        }
        
        // Move forward aggressively but avoid walls (with speed variation)
        const speedVariation = 0.8 + Math.random() * 0.4; // 80% to 120% speed
        if (wallAvoidAngle === 0 && distance > 60) {
            this.speed = TANK_SPEED * speedVariation;
        } else if (wallAvoidAngle !== 0) {
            this.speed = TANK_SPEED * 0.7 * speedVariation;
        } else {
            // Random chance to back up or circle instead of just backing up
            if (Math.random() < 0.3) {
                this.speed = -TANK_SPEED * 0.5 * speedVariation;
            } else {
                // Circle around the target (less aggressive turning)
                this.angle += (Math.random() > 0.5 ? 1 : -1) * TANK_TURN_SPEED * 0.8;
                this.speed = TANK_SPEED * 0.6;
            }
        }
    }

    strafeBehavior(target) {
        if (!target) return;
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const targetAngle = Math.atan2(dy, dx);
        
        // Face the enemy (with reduced aim jitter and slower turning)
        let aimAngle = targetAngle + (Math.random() - 0.5) * 0.1;
        let angleDiff = aimAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        if (Math.abs(angleDiff) > 0.15) {
            this.turnSpeed = (angleDiff > 0 ? TANK_TURN_SPEED : -TANK_TURN_SPEED) * 0.6;
        } else {
            this.turnSpeed = 0;
        }
        
        // Strafe side to side (with more random timing)
        this.aiState.lastDirectionChange++;
        const changeInterval = 40 + Math.random() * 80; // More random timing
        if (this.aiState.lastDirectionChange > changeInterval) {
            this.aiState.strafingDirection *= -1;
            this.aiState.lastDirectionChange = 0;
            
            // 10% chance to do a random direction instead of just flipping
            if (Math.random() < 0.1) {
                this.aiState.strafingDirection = Math.random() > 0.5 ? 1 : -1;
            }
        }
        
        // Calculate strafe direction (perpendicular to target with less variation)
        const strafeAngle = targetAngle + (Math.PI / 2) * this.aiState.strafingDirection + (Math.random() - 0.5) * 0.1;
        const strafeDx = Math.cos(strafeAngle);
        const strafeDy = Math.sin(strafeAngle);
        
        // Check if strafe path is clear
        const checkX = this.x + strafeDx * 40;
        const checkY = this.y + strafeDy * 40;
        let canStrafe = true;
        
        for (let wall of walls) {
            if (checkX > wall.x && checkX < wall.x + wall.width &&
                checkY > wall.y && checkY < wall.y + wall.height) {
                canStrafe = false;
                break;
            }
        }
        
        if (canStrafe) {
            // Smoothly adjust angle instead of snapping to strafe angle
            let strafeAngleDiff = strafeAngle - this.angle;
            while (strafeAngleDiff > Math.PI) strafeAngleDiff -= Math.PI * 2;
            while (strafeAngleDiff < -Math.PI) strafeAngleDiff += Math.PI * 2;
            
            this.angle += strafeAngleDiff * 0.3; // Gradual turn towards strafe direction
            this.speed = TANK_SPEED * (0.6 + Math.random() * 0.4);
        } else {
            // Change strafe direction if blocked (with random behavior)
            this.aiState.strafingDirection *= -1;
            if (Math.random() < 0.3) {
                // Sometimes back up instead of stopping
                this.speed = -TANK_SPEED * 0.5;
            } else {
                this.speed = 0;
            }
        }
    }

    powerUpBehavior(powerUp) {
        if (!powerUp) {
            this.aiState.mode = 'hunt';
            return;
        }
        
        const dx = powerUp.x - this.x;
        const dy = powerUp.y - this.y;
        const targetAngle = Math.atan2(dy, dx);
        
        let angleDiff = targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        if (Math.abs(angleDiff) > 0.05) {
            this.turnSpeed = angleDiff > 0 ? TANK_TURN_SPEED : -TANK_TURN_SPEED;
        } else {
            this.turnSpeed = 0;
        }
        
        this.speed = TANK_SPEED;
    }

    retreatBehavior(threat) {
        if (!threat) {
            this.aiState.mode = 'hunt';
            return;
        }
        
        const dx = threat.x - this.x;
        const dy = threat.y - this.y;
        const escapeAngle = Math.atan2(dy, dx) + Math.PI; // Opposite direction
        
        let angleDiff = escapeAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        if (Math.abs(angleDiff) > 0.05) {
            this.turnSpeed = angleDiff > 0 ? TANK_TURN_SPEED : -TANK_TURN_SPEED;
        } else {
            this.turnSpeed = 0;
        }
        
        this.speed = TANK_SPEED;
    }

    getWallAvoidanceAngle() {
        const checkDistance = 50;
        const checkX = this.x + Math.cos(this.angle) * checkDistance;
        const checkY = this.y + Math.sin(this.angle) * checkDistance;
        
        for (let wall of walls) {
            if (checkX > wall.x && checkX < wall.x + wall.width &&
                checkY > wall.y && checkY < wall.y + wall.height) {
                // Wall detected, find escape angle
                return this.angle + (Math.random() > 0.5 ? Math.PI/3 : -Math.PI/3);
            }
        }
        
        // Check water obstacles
        for (let obstacle of obstacleTiles) {
            if (obstacle.type === 'water') {
                const obstacleX = obstacle.x * TILE_SIZE;
                const obstacleY = obstacle.y * TILE_SIZE;
                if (checkX > obstacleX && checkX < obstacleX + TILE_SIZE &&
                    checkY > obstacleY && checkY < obstacleY + TILE_SIZE) {
                    // Water detected, find escape angle
                    return this.angle + (Math.random() > 0.5 ? Math.PI/3 : -Math.PI/3);
                }
            }
        }
        return 0; // No obstacle detected
    }

    smartShooting(target) {
        if (!target) return;
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Safety checks first - don't shoot if it's dangerous
        if (!this.isSafeToShoot(target)) return;
        
        // Predictive aiming for moving targets (with random error)
        const targetVelX = Math.cos(target.angle) * target.speed;
        const targetVelY = Math.sin(target.angle) * target.speed;
        const timeToHit = distance / BULLET_SPEED;
        const predictedX = target.x + targetVelX * timeToHit + (Math.random() - 0.5) * 20;
        const predictedY = target.y + targetVelY * timeToHit + (Math.random() - 0.5) * 20;
        
        const predictedAngle = Math.atan2(predictedY - this.y, predictedX - this.x);
        let angleDiff = predictedAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // More conservative shooting when low health
        const healthFactor = this.health / 100;
        const shootingThreshold = (0.3 + Math.random() * 0.3) * (healthFactor + 0.5); // Tighter aim when low health
        const minDistance = Math.max(60, 80 - this.health * 0.3); // Stay further when low health
        
        // Only shoot when properly aligned and safe
        const shouldShoot = Math.abs(angleDiff) < shootingThreshold && distance > minDistance;
        
        if (shouldShoot && this.checkClearShot(target)) {
            this.shoot();
            // Longer intervals when low health (more cautious)
            this.aiShootTimer = (30 + Math.random() * 30) * (2 - healthFactor);
        }
    }

    isSafeToShoot(target) {
        // Don't shoot if too close to walls (bullet might bounce back)
        if (this.isNearWall(80)) return false;
        
        // Don't shoot if low health and target is close
        if (this.health < 30 && Math.sqrt((target.x - this.x) ** 2 + (target.y - this.y) ** 2) < 120) {
            return false;
        }
        
        // Check if shooting towards a wall that's close to us
        const bulletPath = this.getBulletPath(target);
        if (bulletPath.hitWallDistance < 60) return false;
        
        // Don't shoot if we're cornered and might hit ourselves
        if (this.isCornered()) return false;
        
        return true;
    }

    isNearWall(distance = 50) {
        for (let wall of walls) {
            const closest = {
                x: Math.max(wall.x, Math.min(this.x, wall.x + wall.width)),
                y: Math.max(wall.y, Math.min(this.y, wall.y + wall.height))
            };
            const dist = Math.sqrt((this.x - closest.x) ** 2 + (this.y - closest.y) ** 2);
            if (dist < distance) return true;
        }
        return false;
    }

    getBulletPath(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.floor(distance / 5);
        
        for (let i = 1; i <= steps; i++) {
            const checkX = this.x + (dx / steps) * i;
            const checkY = this.y + (dy / steps) * i;
            
            for (let wall of walls) {
                if (checkX > wall.x && checkX < wall.x + wall.width &&
                    checkY > wall.y && checkY < wall.y + wall.height) {
                    return { hitWallDistance: (i / steps) * distance };
                }
            }
        }
        return { hitWallDistance: Infinity };
    }

    isCornered() {
        let wallCount = 0;
        const checkDistance = 60;
        const directions = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
        
        for (let angle of directions) {
            const checkX = this.x + Math.cos(angle) * checkDistance;
            const checkY = this.y + Math.sin(angle) * checkDistance;
            
            for (let wall of walls) {
                if (checkX > wall.x && checkX < wall.x + wall.width &&
                    checkY > wall.y && checkY < wall.y + wall.height) {
                    wallCount++;
                    break;
                }
            }
        }
        
        return wallCount >= 2; // Cornered if walls in 2+ directions
    }
    
    shoot() {
        if (this.reloadTime > 0) return;
        
        // Check if we have a power-up and special ammo
        if (this.powerUp && this.specialAmmo <= 0) return;
        
        const bulletX = this.x + Math.cos(this.angle) * (TANK_SIZE + 5);
        const bulletY = this.y + Math.sin(this.angle) * (TANK_SIZE + 5);
        
        if (this.powerUp === 'scatter') {
            // Create 5 bullets with wider spread for more destruction
            for (let i = -2; i <= 2; i++) {
                bullets.push(new Bullet(
                    bulletX, 
                    bulletY, 
                    this.angle + i * 0.4, 
                    this.playerNum,
                    'scatter'
                ));
            }
            this.specialAmmo--;
            if (this.specialAmmo <= 0) {
                this.powerUpTime = 0;
                this.powerUp = null;
            }
        } else if (this.powerUp === 'explosive') {
            bullets.push(new Bullet(
                bulletX, 
                bulletY, 
                this.angle, 
                this.playerNum,
                'explosive'
            ));
            this.specialAmmo--;
            if (this.specialAmmo <= 0) {
                this.powerUpTime = 0;
                this.powerUp = null;
            }
        } else if (this.powerUp === 'piercing') {
            bullets.push(new Bullet(
                bulletX, 
                bulletY, 
                this.angle, 
                this.playerNum,
                'piercing'
            ));
            this.specialAmmo--;
            if (this.specialAmmo <= 0) {
                this.powerUpTime = 0;
                this.powerUp = null;
            }
        } else if (this.powerUp === 'mine') {
            // Drop a mine at current location
            mines.push(new Mine(this.x, this.y, this.playerNum));
            this.specialAmmo--;
            if (this.specialAmmo <= 0) {
                this.powerUpTime = 0;
                this.powerUp = null;
            }
        } else {
            // Regular bullet - infinite ammo
            bullets.push(new Bullet(
                bulletX, 
                bulletY, 
                this.angle, 
                this.playerNum,
                this.powerUp
            ));
        }
        
        // Set reload time for all shots
        this.reloadTime = CONFIG.TANK_RELOAD_TIME;
    }
    
    checkWallCollision(x, y) {
        for (let wall of walls) {
            if (x + TANK_SIZE > wall.x && 
                x - TANK_SIZE < wall.x + wall.width &&
                y + TANK_SIZE > wall.y && 
                y - TANK_SIZE < wall.y + wall.height) {
                return true;
            }
        }
        
        // Check water obstacles
        for (let obstacle of obstacleTiles) {
            if (obstacle.type === 'water') {
                const obstacleX = obstacle.x * TILE_SIZE;
                const obstacleY = obstacle.y * TILE_SIZE;
                if (x + TANK_SIZE > obstacleX && 
                    x - TANK_SIZE < obstacleX + TILE_SIZE &&
                    y + TANK_SIZE > obstacleY && 
                    y - TANK_SIZE < obstacleY + TILE_SIZE) {
                    return true;
                }
            }
        }
        
        // Check gate collisions
        for (let gate of gates) {
            if (gate.blocksMovement() &&
                x + TANK_SIZE > gate.x && 
                x - TANK_SIZE < gate.x + gate.width &&
                y + TANK_SIZE > gate.y && 
                y - TANK_SIZE < gate.y + gate.height) {
                return true;
            }
        }
        
        // Check obstacle tile collisions
        for (let tile of obstacleTiles) {
            const tileLeft = tile.x * TILE_SIZE;
            const tileRight = tileLeft + TILE_SIZE;
            const tileTop = tile.y * TILE_SIZE;
            const tileBottom = tileTop + TILE_SIZE;
            
            if (x + TANK_SIZE > tileLeft && 
                x - TANK_SIZE < tileRight &&
                y + TANK_SIZE > tileTop && 
                y - TANK_SIZE < tileBottom) {
                return true;
            }
        }
        
        return false;
    }

    checkTankCollision(x, y) {
        for (let tank of tanks) {
            if (tank === this || !tank.alive) continue;
            
            const distance = Math.sqrt((x - tank.x) ** 2 + (y - tank.y) ** 2);
            if (distance < TANK_SIZE * 1.2) { // Slight buffer for smooth gameplay
                return true;
            }
        }
        return false;
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
    
    updateTrail() {
        // Update trail fade
        this.trail.forEach(point => {
            point.opacity -= 0.015; // Fade out over time
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
                    opacity: 0.4
                });
                
                // Limit trail length
                if (this.trail.length > this.maxTrailLength) {
                    this.trail.shift();
                }
            }
        }
    }
    
    drawTrails() {
        ctx.save();
        
        // Draw each trail segment
        this.trail.forEach((point, index) => {
            ctx.globalAlpha = point.opacity;
            ctx.strokeStyle = '#2C2C2C';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            
            // Connect to previous point for smooth trails
            if (index > 0) {
                const prevPoint = this.trail[index - 1];
                
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
    
    draw() {
        if (!this.alive) return;
        
        // Draw tank trails first (beneath the tank)
        this.drawTrails();
        
        // Calculate positions where tank needs to be drawn (for edge wrapping)
        const positions = [];
        positions.push({ x: this.x, y: this.y }); // Main position
        
        // Check if tank needs to be drawn on opposite edges
        if (this.x < TANK_SIZE) {
            positions.push({ x: this.x + canvas.width, y: this.y });
        } else if (this.x > canvas.width - TANK_SIZE) {
            positions.push({ x: this.x - canvas.width, y: this.y });
        }
        
        if (this.y < TANK_SIZE) {
            positions.push({ x: this.x, y: this.y + canvas.height });
        } else if (this.y > canvas.height - TANK_SIZE) {
            positions.push({ x: this.x, y: this.y - canvas.height });
        }
        
        // Check corners
        if (this.x < TANK_SIZE && this.y < TANK_SIZE) {
            positions.push({ x: this.x + canvas.width, y: this.y + canvas.height });
        } else if (this.x > canvas.width - TANK_SIZE && this.y < TANK_SIZE) {
            positions.push({ x: this.x - canvas.width, y: this.y + canvas.height });
        } else if (this.x < TANK_SIZE && this.y > canvas.height - TANK_SIZE) {
            positions.push({ x: this.x + canvas.width, y: this.y - canvas.height });
        } else if (this.x > canvas.width - TANK_SIZE && this.y > canvas.height - TANK_SIZE) {
            positions.push({ x: this.x - canvas.width, y: this.y - canvas.height });
        }
        
        // Draw tank at all necessary positions
        positions.forEach(pos => {
            this.drawTankAt(pos.x, pos.y);
        });
    }
    
    drawTankAt(drawX, drawY) {
        // Blinking effect during grace period
        if (graceTimer > 0) {
            const blinkRate = Math.floor(Date.now() / 200) % 2;
            if (blinkRate === 0) {
                ctx.globalAlpha = 0.5;
            }
        }
        
        ctx.save();
        ctx.translate(drawX, drawY + this.engineBob);
        ctx.rotate(this.angle);
        
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
        const treadOffset = this.treadOffset % 12; // Loop the animation
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
            ctx.rotate(this.wheelRotation);
            ctx.fillRect(-2, -2, 4, 4);
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            ctx.strokeRect(-2, -2, 4, 4);
            ctx.restore();
            
            // Right side wheels
            ctx.save();
            ctx.translate(wheelX, TANK_SIZE/2 - 1);
            ctx.rotate(this.wheelRotation);
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
        bodyGradient.addColorStop(0, this.lightenColor(this.color, 40));
        bodyGradient.addColorStop(0.3, this.lightenColor(this.color, 15));
        bodyGradient.addColorStop(0.7, this.color);
        bodyGradient.addColorStop(1, this.darkenColor(this.color, 35));
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(-TANK_SIZE/2, -TANK_SIZE/2, TANK_SIZE, TANK_SIZE);
        
        // Body detail panels
        ctx.fillStyle = this.darkenColor(this.secondaryColor, 25);
        ctx.fillRect(-TANK_SIZE/2 + 3, -TANK_SIZE/2 + 3, TANK_SIZE - 6, 3);
        ctx.fillRect(-TANK_SIZE/2 + 3, TANK_SIZE/2 - 6, TANK_SIZE - 6, 3);
        
        // Side armor with rivets
        const armorGradient = ctx.createLinearGradient(-TANK_SIZE/2, 0, -TANK_SIZE/2 + 6, 0);
        armorGradient.addColorStop(0, this.darkenColor(this.color, 15));
        armorGradient.addColorStop(1, this.darkenColor(this.color, 35));
        ctx.fillStyle = armorGradient;
        ctx.fillRect(-TANK_SIZE/2 + 1, -TANK_SIZE/2 + 6, 6, TANK_SIZE - 12);
        ctx.fillRect(TANK_SIZE/2 - 7, -TANK_SIZE/2 + 6, 6, TANK_SIZE - 12);
        
        // Armor rivets
        ctx.fillStyle = this.darkenColor(this.color, 50);
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
        turretGradient.addColorStop(0, this.lightenColor(this.secondaryColor, 25));
        turretGradient.addColorStop(0.4, this.secondaryColor);
        turretGradient.addColorStop(0.8, this.darkenColor(this.secondaryColor, 20));
        turretGradient.addColorStop(1, this.darkenColor(this.secondaryColor, 45));
        ctx.fillStyle = turretGradient;
        ctx.beginPath();
        ctx.arc(0, 0, turretRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Turret ring detail
        ctx.strokeStyle = this.darkenColor(this.secondaryColor, 35);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, turretRadius - 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Commander's hatch with detail
        ctx.fillStyle = this.darkenColor(this.secondaryColor, 40);
        ctx.beginPath();
        ctx.arc(-3, -4, turretRadius/2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this.darkenColor(this.secondaryColor, 60);
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
        ctx.strokeStyle = this.darkenColor(this.color, 55);
        ctx.lineWidth = 2;
        ctx.strokeRect(-TANK_SIZE/2, -TANK_SIZE/2, TANK_SIZE, TANK_SIZE);
        
        // Engine exhaust effect when moving
        if (this.isMoving && Math.random() > 0.7) {
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
        if (this.powerUp) {
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
        
        // Pickup notification effect (drawn in world coordinates, not rotated)
        if (this.pickupNotification) {
            ctx.save();
            
            const notifTime = (120 - this.pickupTimer) / 120; // 0 to 1
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
            ctx.arc(this.x, this.y + yOffset, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Plus symbol
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.moveTo(this.x - 8, this.y + yOffset);
            ctx.lineTo(this.x + 8, this.y + yOffset);
            ctx.moveTo(this.x, this.y + yOffset - 8);
            ctx.lineTo(this.x, this.y + yOffset + 8);
            ctx.stroke();
            
            // Power-up icon
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10;
            ctx.fillText(this.pickupNotification, this.x, this.y + yOffset - 35);
            
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
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
            
            const playerName = this.isAI ? `AI ${this.playerNum}` : `Player ${this.playerNum}`;
            ctx.strokeText(playerName, this.x, this.y - TANK_SIZE - 15);
            ctx.fillText(playerName, this.x, this.y - TANK_SIZE - 15);
            
            ctx.restore();
            
            // Reset alpha after grace period effects
            ctx.globalAlpha = 1;
        }
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
        switch(this.powerUp) {
            case 'scatter': return '#FFD700';
            case 'laser': return '#00FFFF';
            case 'rocket': return '#FF6600';
            case 'explosive': return '#FF3333';
            case 'piercing': return '#9966FF';
            case 'mine': return '#8B0000';
            default: return '#FFD700';
        }
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