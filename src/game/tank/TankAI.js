class TankAI {
    constructor(tank) {
        this.tank = tank;
        this.aiState = null;
        this.aiShootTimer = 0;
    }

    initialize() {
        this.aiState = {
            mode: 'hunt',
            strafingDirection: Math.random() > 0.5 ? 1 : -1,
            lastDirectionChange: 0,
            powerUpTarget: null,
            wallAvoidanceAngle: 0,
            lastShot: 0
        };
    }

    updateAI() {
        if (!this.aiState) {
            this.initialize();
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
            if (t !== this.tank && t.alive) {
                const dist = Math.sqrt((t.x - this.tank.x) ** 2 + (t.y - this.tank.y) ** 2);
                let score = 1000 / dist; // Closer = higher priority
                
                // Prioritize targets with power-ups
                if (t.powerUp) score *= 1.5;
                
                // Prioritize low health targets
                if (t.health < 50) score *= 1.3;
                
                // Avoid targeting tanks behind walls unless we have piercing
                if (!this.checkClearShot(t) && this.tank.powerUp !== 'piercing') {
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
        if (this.tank.powerUp) return null; // Already have one
        
        let nearest = null;
        let minDist = Infinity;
        
        powerUps.forEach(p => {
            const dist = Math.sqrt((p.x - this.tank.x) ** 2 + (p.y - this.tank.y) ** 2);
            if (dist < minDist && dist < 300) { // Only consider nearby power-ups
                minDist = dist;
                nearest = p;
            }
        });
        
        return nearest;
    }

    decideAIMode(target, powerUp) {
        const targetDist = target ? Math.sqrt((target.x - this.tank.x) ** 2 + (target.y - this.tank.y) ** 2) : Infinity;
        const powerUpDist = powerUp ? Math.sqrt((powerUp.x - this.tank.x) ** 2 + (powerUp.y - this.tank.y) ** 2) : Infinity;
        
        // Check for danger situations first (prioritize survival)
        const isLowHealth = this.tank.health < 50;
        const isVeryLowHealth = this.tank.health < 25;
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
        
        const dx = target.x - this.tank.x;
        const dy = target.y - this.tank.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        let targetAngle = Math.atan2(dy, dx);
        
        // Add random jitter to movement (5% chance to act erratically)
        if (Math.random() < 0.05) {
            targetAngle += (Math.random() - 0.5) * Math.PI;
        }
        
        // Check for wall collision ahead
        const wallAvoidAngle = this.getWallAvoidanceAngle();
        const finalAngle = wallAvoidAngle !== 0 ? wallAvoidAngle : targetAngle;
        
        let angleDiff = finalAngle - this.tank.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Turn towards target or away from wall (reduced turning sensitivity)
        const turnThreshold = 0.1 + Math.random() * 0.05;
        if (Math.abs(angleDiff) > turnThreshold) {
            this.tank.turnSpeed = (angleDiff > 0 ? TANK_TURN_SPEED : -TANK_TURN_SPEED) * 0.7;
        } else {
            this.tank.turnSpeed = 0;
        }
        
        // Move forward aggressively but avoid walls (with speed variation)
        const speedVariation = 0.8 + Math.random() * 0.4; // 80% to 120% speed
        if (wallAvoidAngle === 0 && distance > 60) {
            this.tank.speed = TANK_SPEED * speedVariation;
        } else if (wallAvoidAngle !== 0) {
            this.tank.speed = TANK_SPEED * 0.7 * speedVariation;
        } else {
            // Random chance to back up or circle instead of just backing up
            if (Math.random() < 0.3) {
                this.tank.speed = -TANK_SPEED * 0.5 * speedVariation;
            } else {
                // Circle around the target (less aggressive turning)
                this.tank.angle += (Math.random() > 0.5 ? 1 : -1) * TANK_TURN_SPEED * 0.8;
                this.tank.speed = TANK_SPEED * 0.6;
            }
        }
    }

    strafeBehavior(target) {
        if (!target) return;
        
        const dx = target.x - this.tank.x;
        const dy = target.y - this.tank.y;
        const targetAngle = Math.atan2(dy, dx);
        
        // Face the enemy (with reduced aim jitter and slower turning)
        let aimAngle = targetAngle + (Math.random() - 0.5) * 0.1;
        let angleDiff = aimAngle - this.tank.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        if (Math.abs(angleDiff) > 0.15) {
            this.tank.turnSpeed = (angleDiff > 0 ? TANK_TURN_SPEED : -TANK_TURN_SPEED) * 0.6;
        } else {
            this.tank.turnSpeed = 0;
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
        const checkX = this.tank.x + strafeDx * 40;
        const checkY = this.tank.y + strafeDy * 40;
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
            let strafeAngleDiff = strafeAngle - this.tank.angle;
            while (strafeAngleDiff > Math.PI) strafeAngleDiff -= Math.PI * 2;
            while (strafeAngleDiff < -Math.PI) strafeAngleDiff += Math.PI * 2;
            
            this.tank.angle += strafeAngleDiff * 0.3; // Gradual turn towards strafe direction
            this.tank.speed = TANK_SPEED * (0.6 + Math.random() * 0.4);
        } else {
            // Change strafe direction if blocked (with random behavior)
            this.aiState.strafingDirection *= -1;
            if (Math.random() < 0.3) {
                // Sometimes back up instead of stopping
                this.tank.speed = -TANK_SPEED * 0.5;
            } else {
                this.tank.speed = 0;
            }
        }
    }

    powerUpBehavior(powerUp) {
        if (!powerUp) {
            this.aiState.mode = 'hunt';
            return;
        }
        
        const dx = powerUp.x - this.tank.x;
        const dy = powerUp.y - this.tank.y;
        const targetAngle = Math.atan2(dy, dx);
        
        let angleDiff = targetAngle - this.tank.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        if (Math.abs(angleDiff) > 0.05) {
            this.tank.turnSpeed = angleDiff > 0 ? TANK_TURN_SPEED : -TANK_TURN_SPEED;
        } else {
            this.tank.turnSpeed = 0;
        }
        
        this.tank.speed = TANK_SPEED;
    }

    retreatBehavior(threat) {
        if (!threat) {
            this.aiState.mode = 'hunt';
            return;
        }
        
        const dx = threat.x - this.tank.x;
        const dy = threat.y - this.tank.y;
        const escapeAngle = Math.atan2(dy, dx) + Math.PI; // Opposite direction
        
        let angleDiff = escapeAngle - this.tank.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        if (Math.abs(angleDiff) > 0.05) {
            this.tank.turnSpeed = angleDiff > 0 ? TANK_TURN_SPEED : -TANK_TURN_SPEED;
        } else {
            this.tank.turnSpeed = 0;
        }
        
        this.tank.speed = TANK_SPEED;
    }

    getWallAvoidanceAngle() {
        const checkDistance = 50;
        const checkX = this.tank.x + Math.cos(this.tank.angle) * checkDistance;
        const checkY = this.tank.y + Math.sin(this.tank.angle) * checkDistance;
        
        for (let wall of walls) {
            if (checkX > wall.x && checkX < wall.x + wall.width &&
                checkY > wall.y && checkY < wall.y + wall.height) {
                // Wall detected, find escape angle
                return this.tank.angle + (Math.random() > 0.5 ? Math.PI/3 : -Math.PI/3);
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
                    return this.tank.angle + (Math.random() > 0.5 ? Math.PI/3 : -Math.PI/3);
                }
            }
        }
        return 0; // No obstacle detected
    }

    smartShooting(target) {
        if (!target) return;
        
        const dx = target.x - this.tank.x;
        const dy = target.y - this.tank.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Safety checks first - don't shoot if it's dangerous
        if (!this.isSafeToShoot(target)) return;
        
        // Predictive aiming for moving targets (with random error)
        const targetVelX = Math.cos(target.angle) * target.speed;
        const targetVelY = Math.sin(target.angle) * target.speed;
        const timeToHit = distance / BULLET_SPEED;
        const predictedX = target.x + targetVelX * timeToHit + (Math.random() - 0.5) * 20;
        const predictedY = target.y + targetVelY * timeToHit + (Math.random() - 0.5) * 20;
        
        const predictedAngle = Math.atan2(predictedY - this.tank.y, predictedX - this.tank.x);
        let angleDiff = predictedAngle - this.tank.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // More conservative shooting when low health
        const healthFactor = this.tank.health / 100;
        const shootingThreshold = (0.3 + Math.random() * 0.3) * (healthFactor + 0.5); // Tighter aim when low health
        const minDistance = Math.max(60, 80 - this.tank.health * 0.3); // Stay further when low health
        
        // Only shoot when properly aligned and safe
        const shouldShoot = Math.abs(angleDiff) < shootingThreshold && distance > minDistance;
        
        if (shouldShoot && this.checkClearShot(target)) {
            this.tank.shoot();
            // Longer intervals when low health (more cautious)
            this.aiShootTimer = (30 + Math.random() * 30) * (2 - healthFactor);
        }
    }

    isSafeToShoot(target) {
        // Don't shoot if too close to walls (bullet might bounce back)
        if (this.isNearWall(80)) return false;
        
        // Don't shoot if low health and target is close
        if (this.tank.health < 30 && Math.sqrt((target.x - this.tank.x) ** 2 + (target.y - this.tank.y) ** 2) < 120) {
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
                x: Math.max(wall.x, Math.min(this.tank.x, wall.x + wall.width)),
                y: Math.max(wall.y, Math.min(this.tank.y, wall.y + wall.height))
            };
            const dist = Math.sqrt((this.tank.x - closest.x) ** 2 + (this.tank.y - closest.y) ** 2);
            if (dist < distance) return true;
        }
        return false;
    }

    getBulletPath(target) {
        const dx = target.x - this.tank.x;
        const dy = target.y - this.tank.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.floor(distance / 5);
        
        for (let i = 1; i <= steps; i++) {
            const checkX = this.tank.x + (dx / steps) * i;
            const checkY = this.tank.y + (dy / steps) * i;
            
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
            const checkX = this.tank.x + Math.cos(angle) * checkDistance;
            const checkY = this.tank.y + Math.sin(angle) * checkDistance;
            
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

    checkClearShot(target) {
        if (!target) return false;
        
        const dx = target.x - this.tank.x;
        const dy = target.y - this.tank.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.floor(distance / 10);
        
        for (let i = 1; i <= steps; i++) {
            const checkX = this.tank.x + (dx / steps) * i;
            const checkY = this.tank.y + (dy / steps) * i;
            
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
}