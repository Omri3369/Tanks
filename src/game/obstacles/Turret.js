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

// Export for use
window.Turret = Turret;