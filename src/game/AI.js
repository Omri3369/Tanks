/**
 * AI behavior system for tank game
 * Handles all AI logic including movement, targeting, and decision making
 */

class AIBehavior {
    constructor() {
        this.CONFIG = null; // Will be injected
        this.gameState = null; // Will be injected
    }

    /**
     * Initialize AI with game dependencies
     * @param {Object} config - Game configuration
     * @param {Object} gameState - Current game state
     */
    initialize(config, gameState) {
        this.CONFIG = config;
        this.gameState = gameState;
    }

    /**
     * Main AI update loop for a tank
     * @param {Tank} tank - The AI tank to update
     */
    updateAI(tank) {
        if (!tank.aiState) {
            tank.aiState = {
                mode: 'hunt',
                strafingDirection: Math.random() > 0.5 ? 1 : -1,
                lastDirectionChange: 0,
                powerUpTarget: null,
                wallAvoidanceAngle: 0,
                lastShot: 0
            };
        }

        // Find best target (prioritize by threat level)
        let bestTarget = this.findBestTarget(tank);
        let nearestPowerUp = this.findNearestPowerUp(tank);
        
        if (!bestTarget && !nearestPowerUp) return;

        // Decide AI mode based on situation
        this.decideAIMode(tank, bestTarget, nearestPowerUp);
        
        // Execute behavior based on current mode
        switch (tank.aiState.mode) {
            case 'hunt':
                this.huntBehavior(tank, bestTarget);
                break;
            case 'powerup':
                this.powerUpBehavior(tank, nearestPowerUp);
                break;
            case 'retreat':
                this.retreatBehavior(tank, bestTarget);
                break;
            case 'strafe':
                this.strafeBehavior(tank, bestTarget);
                break;
        }

        // Enhanced shooting logic
        tank.aiShootTimer--;
        if (bestTarget && tank.aiShootTimer <= 0) {
            this.smartShooting(tank, bestTarget);
        }
    }

    /**
     * Find the best target for an AI tank
     * @param {Tank} aiTank - The AI tank looking for targets
     * @returns {Tank|null} - Best target tank or null
     */
    findBestTarget(aiTank) {
        let bestTarget = null;
        let bestScore = -1;
        
        this.gameState.tanks.forEach(t => {
            if (t !== aiTank && t.alive) {
                const dist = Math.sqrt((t.x - aiTank.x) ** 2 + (t.y - aiTank.y) ** 2);
                let score = 1000 / dist; // Closer = higher priority
                
                // Prioritize targets with power-ups
                if (t.powerUp) score *= 1.5;
                
                // Prioritize low health targets
                if (t.health < 50) score *= 1.3;
                
                // Avoid targeting tanks behind walls unless we have piercing
                if (!this.checkClearShot(aiTank, t) && aiTank.powerUp !== 'piercing') {
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

    /**
     * Find the nearest power-up for an AI tank
     * @param {Tank} aiTank - The AI tank looking for power-ups
     * @returns {PowerUp|null} - Nearest power-up or null
     */
    findNearestPowerUp(aiTank) {
        if (aiTank.powerUp) return null; // Already have one
        
        let nearest = null;
        let minDist = Infinity;
        
        this.gameState.powerUps.forEach(p => {
            const dist = Math.sqrt((p.x - aiTank.x) ** 2 + (p.y - aiTank.y) ** 2);
            if (dist < minDist && dist < 300) { // Only consider nearby power-ups
                minDist = dist;
                nearest = p;
            }
        });
        
        return nearest;
    }

    /**
     * Decide which AI mode to use based on current situation
     * @param {Tank} tank - The AI tank
     * @param {Tank} target - Current target
     * @param {PowerUp} powerUp - Nearest power-up
     */
    decideAIMode(tank, target, powerUp) {
        const targetDist = target ? Math.sqrt((target.x - tank.x) ** 2 + (target.y - tank.y) ** 2) : Infinity;
        const powerUpDist = powerUp ? Math.sqrt((powerUp.x - tank.x) ** 2 + (powerUp.y - tank.y) ** 2) : Infinity;
        
        // Check for danger situations first (prioritize survival)
        const isLowHealth = tank.health < 50;
        const isVeryLowHealth = tank.health < 25;
        const nearWall = this.isNearWall(tank);
        const inDangerousPosition = nearWall && targetDist < 150;
        
        // Survival takes priority - retreat if in danger
        if (isVeryLowHealth || inDangerousPosition || (isLowHealth && targetDist < 100)) {
            tank.aiState.mode = 'retreat';
            return;
        }
        
        // Add randomness to decision making (reduced to 10% for more careful behavior)
        if (Math.random() < 0.1) {
            const randomModes = ['hunt', 'strafe'];
            tank.aiState.mode = randomModes[Math.floor(Math.random() * randomModes.length)];
            return;
        }
        
        // Go for power-up if safe and beneficial
        if (powerUp && powerUpDist < 150 && targetDist > 200 && !nearWall) {
            tank.aiState.mode = 'powerup';
        }
        // Strafe if at medium range and safe
        else if (target && targetDist > 100 && targetDist < 200 && !nearWall) {
            tank.aiState.mode = 'strafe';
        }
        // Hunt if target is far or no other priority
        else {
            tank.aiState.mode = 'hunt';
        }
    }

    /**
     * Hunt behavior - aggressively pursue target
     * @param {Tank} tank - The AI tank
     * @param {Tank} target - Target to hunt
     */
    huntBehavior(tank, target) {
        if (!target) return;
        
        const dx = target.x - tank.x;
        const dy = target.y - tank.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        let targetAngle = Math.atan2(dy, dx);
        
        // Add random jitter to movement (5% chance to act erratically)
        if (Math.random() < 0.05) {
            targetAngle += (Math.random() - 0.5) * Math.PI;
        }
        
        // Check for wall collision ahead
        const wallAvoidAngle = this.getWallAvoidanceAngle(tank);
        const finalAngle = wallAvoidAngle !== 0 ? wallAvoidAngle : targetAngle;
        
        let angleDiff = finalAngle - tank.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Turn towards target or away from wall (reduced turning sensitivity)
        const turnThreshold = 0.1 + Math.random() * 0.05;
        if (Math.abs(angleDiff) > turnThreshold) {
            tank.turnSpeed = (angleDiff > 0 ? this.CONFIG.TANK_TURN_SPEED : -this.CONFIG.TANK_TURN_SPEED) * 0.7;
        } else {
            tank.turnSpeed = 0;
        }
        
        // Move forward aggressively but avoid walls (with speed variation)
        const speedVariation = 0.8 + Math.random() * 0.4; // 80% to 120% speed
        if (wallAvoidAngle === 0 && distance > 60) {
            tank.speed = this.CONFIG.TANK_SPEED * speedVariation;
        } else if (wallAvoidAngle !== 0) {
            tank.speed = this.CONFIG.TANK_SPEED * 0.7 * speedVariation;
        } else {
            // Random chance to back up or circle instead of just backing up
            if (Math.random() < 0.3) {
                tank.speed = -this.CONFIG.TANK_SPEED * 0.5 * speedVariation;
            } else {
                // Circle around the target (less aggressive turning)
                tank.angle += (Math.random() > 0.5 ? 1 : -1) * this.CONFIG.TANK_TURN_SPEED * 0.8;
                tank.speed = this.CONFIG.TANK_SPEED * 0.6;
            }
        }
    }

    /**
     * Strafe behavior - circle around target while facing it
     * @param {Tank} tank - The AI tank
     * @param {Tank} target - Target to strafe around
     */
    strafeBehavior(tank, target) {
        if (!target) return;
        
        const dx = target.x - tank.x;
        const dy = target.y - tank.y;
        const targetAngle = Math.atan2(dy, dx);
        
        // Face the enemy (with reduced aim jitter and slower turning)
        let aimAngle = targetAngle + (Math.random() - 0.5) * 0.1;
        let angleDiff = aimAngle - tank.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        if (Math.abs(angleDiff) > 0.15) {
            tank.turnSpeed = (angleDiff > 0 ? this.CONFIG.TANK_TURN_SPEED : -this.CONFIG.TANK_TURN_SPEED) * 0.6;
        } else {
            tank.turnSpeed = 0;
        }
        
        // Strafe side to side (with more random timing)
        tank.aiState.lastDirectionChange++;
        const changeInterval = 40 + Math.random() * 80; // More random timing
        if (tank.aiState.lastDirectionChange > changeInterval) {
            tank.aiState.strafingDirection *= -1;
            tank.aiState.lastDirectionChange = 0;
            
            // 10% chance to do a random direction instead of just flipping
            if (Math.random() < 0.1) {
                tank.aiState.strafingDirection = Math.random() > 0.5 ? 1 : -1;
            }
        }
        
        // Calculate strafe direction (perpendicular to target with less variation)
        const strafeAngle = targetAngle + (Math.PI / 2) * tank.aiState.strafingDirection + (Math.random() - 0.5) * 0.1;
        const strafeDx = Math.cos(strafeAngle);
        const strafeDy = Math.sin(strafeAngle);
        
        // Check if strafe path is clear
        const checkX = tank.x + strafeDx * 40;
        const checkY = tank.y + strafeDy * 40;
        let canStrafe = true;
        
        for (let wall of this.gameState.walls) {
            if (checkX > wall.x && checkX < wall.x + wall.width &&
                checkY > wall.y && checkY < wall.y + wall.height) {
                canStrafe = false;
                break;
            }
        }
        
        if (canStrafe) {
            // Smoothly adjust angle instead of snapping to strafe angle
            let strafeAngleDiff = strafeAngle - tank.angle;
            while (strafeAngleDiff > Math.PI) strafeAngleDiff -= Math.PI * 2;
            while (strafeAngleDiff < -Math.PI) strafeAngleDiff += Math.PI * 2;
            
            tank.angle += strafeAngleDiff * 0.3; // Gradual turn towards strafe direction
            tank.speed = this.CONFIG.TANK_SPEED * (0.6 + Math.random() * 0.4);
        } else {
            // Change strafe direction if blocked (with random behavior)
            tank.aiState.strafingDirection *= -1;
            if (Math.random() < 0.3) {
                // Sometimes back up instead of stopping
                tank.speed = -this.CONFIG.TANK_SPEED * 0.5;
            } else {
                tank.speed = 0;
            }
        }
    }

    /**
     * Power-up behavior - move towards power-ups
     * @param {Tank} tank - The AI tank
     * @param {PowerUp} powerUp - Power-up to collect
     */
    powerUpBehavior(tank, powerUp) {
        if (!powerUp) {
            tank.aiState.mode = 'hunt';
            return;
        }
        
        const dx = powerUp.x - tank.x;
        const dy = powerUp.y - tank.y;
        const targetAngle = Math.atan2(dy, dx);
        
        let angleDiff = targetAngle - tank.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        if (Math.abs(angleDiff) > 0.05) {
            tank.turnSpeed = angleDiff > 0 ? this.CONFIG.TANK_TURN_SPEED : -this.CONFIG.TANK_TURN_SPEED;
        } else {
            tank.turnSpeed = 0;
        }
        
        tank.speed = this.CONFIG.TANK_SPEED;
    }

    /**
     * Retreat behavior - move away from threats
     * @param {Tank} tank - The AI tank
     * @param {Tank} threat - Threat to retreat from
     */
    retreatBehavior(tank, threat) {
        if (!threat) {
            tank.aiState.mode = 'hunt';
            return;
        }
        
        const dx = threat.x - tank.x;
        const dy = threat.y - tank.y;
        const escapeAngle = Math.atan2(dy, dx) + Math.PI; // Opposite direction
        
        let angleDiff = escapeAngle - tank.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        if (Math.abs(angleDiff) > 0.05) {
            tank.turnSpeed = angleDiff > 0 ? this.CONFIG.TANK_TURN_SPEED : -this.CONFIG.TANK_TURN_SPEED;
        } else {
            tank.turnSpeed = 0;
        }
        
        tank.speed = this.CONFIG.TANK_SPEED;
    }

    /**
     * Get angle to avoid walls ahead
     * @param {Tank} tank - The AI tank
     * @returns {number} - Angle to avoid walls, or 0 if no walls
     */
    getWallAvoidanceAngle(tank) {
        const checkDistance = 50;
        const checkX = tank.x + Math.cos(tank.angle) * checkDistance;
        const checkY = tank.y + Math.sin(tank.angle) * checkDistance;
        
        for (let wall of this.gameState.walls) {
            if (checkX > wall.x && checkX < wall.x + wall.width &&
                checkY > wall.y && checkY < wall.y + wall.height) {
                // Wall detected, find escape angle
                return tank.angle + (Math.random() > 0.5 ? Math.PI/3 : -Math.PI/3);
            }
        }
        return 0; // No wall detected
    }

    /**
     * Smart shooting logic with predictive aiming
     * @param {Tank} tank - The AI tank
     * @param {Tank} target - Target to shoot at
     */
    smartShooting(tank, target) {
        if (!target) return;
        
        const dx = target.x - tank.x;
        const dy = target.y - tank.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Safety checks first - don't shoot if it's dangerous
        if (!this.isSafeToShoot(tank, target)) return;
        
        // Predictive aiming for moving targets (with random error)
        const targetVelX = Math.cos(target.angle) * target.speed;
        const targetVelY = Math.sin(target.angle) * target.speed;
        const timeToHit = distance / this.CONFIG.BULLET_SPEED;
        const predictedX = target.x + targetVelX * timeToHit + (Math.random() - 0.5) * 20;
        const predictedY = target.y + targetVelY * timeToHit + (Math.random() - 0.5) * 20;
        
        const predictedAngle = Math.atan2(predictedY - tank.y, predictedX - tank.x);
        let angleDiff = predictedAngle - tank.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // More conservative shooting when low health
        const healthFactor = tank.health / 100;
        const shootingThreshold = (0.3 + Math.random() * 0.3) * (healthFactor + 0.5); // Tighter aim when low health
        const minDistance = Math.max(60, 80 - tank.health * 0.3); // Stay further when low health
        
        // Only shoot when properly aligned and safe
        const shouldShoot = Math.abs(angleDiff) < shootingThreshold && distance > minDistance;
        
        if (shouldShoot && this.checkClearShot(tank, target)) {
            this.gameState.shootBullet(tank); // Use game state method
            // Longer intervals when low health (more cautious)
            tank.aiShootTimer = (30 + Math.random() * 30) * (2 - healthFactor);
        }
    }

    /**
     * Check if it's safe for AI to shoot
     * @param {Tank} tank - The AI tank
     * @param {Tank} target - Target to shoot at
     * @returns {boolean} - True if safe to shoot
     */
    isSafeToShoot(tank, target) {
        // Don't shoot if too close to walls (bullet might bounce back)
        if (this.isNearWall(tank, 80)) return false;
        
        // Don't shoot if low health and target is close
        if (tank.health < 30 && Math.sqrt((target.x - tank.x) ** 2 + (target.y - tank.y) ** 2) < 120) {
            return false;
        }
        
        // Check if shooting towards a wall that's close to us
        const bulletPath = this.getBulletPath(tank, target);
        if (bulletPath.hitWallDistance < 60) return false;
        
        // Don't shoot if we're cornered and might hit ourselves
        if (this.isCornered(tank)) return false;
        
        return true;
    }

    /**
     * Check if tank is near a wall
     * @param {Tank} tank - The tank to check
     * @param {number} distance - Distance threshold
     * @returns {boolean} - True if near wall
     */
    isNearWall(tank, distance = 50) {
        for (let wall of this.gameState.walls) {
            const closest = {
                x: Math.max(wall.x, Math.min(tank.x, wall.x + wall.width)),
                y: Math.max(wall.y, Math.min(tank.y, wall.y + wall.height))
            };
            const dist = Math.sqrt((tank.x - closest.x) ** 2 + (tank.y - closest.y) ** 2);
            if (dist < distance) return true;
        }
        return false;
    }

    /**
     * Get bullet path information
     * @param {Tank} tank - The shooting tank
     * @param {Tank} target - The target
     * @returns {Object} - Path information with hit distance
     */
    getBulletPath(tank, target) {
        const dx = target.x - tank.x;
        const dy = target.y - tank.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.floor(distance / 5);
        
        for (let i = 1; i <= steps; i++) {
            const checkX = tank.x + (dx / steps) * i;
            const checkY = tank.y + (dy / steps) * i;
            
            for (let wall of this.gameState.walls) {
                if (checkX > wall.x && checkX < wall.x + wall.width &&
                    checkY > wall.y && checkY < wall.y + wall.height) {
                    return { hitWallDistance: (i / steps) * distance };
                }
            }
        }
        return { hitWallDistance: Infinity };
    }

    /**
     * Check if tank is cornered by walls
     * @param {Tank} tank - The tank to check
     * @returns {boolean} - True if cornered
     */
    isCornered(tank) {
        let wallCount = 0;
        const checkDistance = 60;
        const directions = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
        
        for (let angle of directions) {
            const checkX = tank.x + Math.cos(angle) * checkDistance;
            const checkY = tank.y + Math.sin(angle) * checkDistance;
            
            for (let wall of this.gameState.walls) {
                if (checkX > wall.x && checkX < wall.x + wall.width &&
                    checkY > wall.y && checkY < wall.y + wall.height) {
                    wallCount++;
                    break;
                }
            }
        }
        
        return wallCount >= 2; // Cornered if walls in 2+ directions
    }

    /**
     * Check if there's a clear shot between tank and target
     * @param {Tank} tank - The shooting tank
     * @param {Tank} target - The target
     * @returns {boolean} - True if clear shot available
     */
    checkClearShot(tank, target) {
        const dx = target.x - tank.x;
        const dy = target.y - tank.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.floor(distance / 10);
        
        for (let i = 1; i < steps; i++) {
            const checkX = tank.x + (dx / steps) * i;
            const checkY = tank.y + (dy / steps) * i;
            
            for (let wall of this.gameState.walls) {
                if (checkX > wall.x && checkX < wall.x + wall.width &&
                    checkY > wall.y && checkY < wall.y + wall.height) {
                    return false;
                }
            }
        }
        return true;
    }
}

// Export for both CommonJS and ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIBehavior;
} else if (typeof window !== 'undefined') {
    window.AIBehavior = AIBehavior;
}