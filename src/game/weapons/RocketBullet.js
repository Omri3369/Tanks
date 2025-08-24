// Rocket Bullet - Slow but powerful with big explosions

class RocketBullet extends BaseBullet {
    constructor(x, y, angle, owner) {
        super(x, y, angle, owner, 'rocket');
    }
    
    handleWallCollision(wall) {
        this.createBigExplosion();
        return false; // Destroy bullet
    }
    
    handleObstacleCollision(tile) {
        this.createBigExplosion();
        return false; // Destroy bullet
    }
    
    applySpecialEffect(tank) {
        this.createBigExplosion();
    }
    
    createBigExplosion() {
        // Bigger explosion for rockets
        explosions.push(new Explosion(this.x, this.y));
        
        // Add screen shake
        if (typeof addScreenShake === 'function') {
            addScreenShake(5);
        }
        
        // Larger damage radius
        tanks.forEach(tank => {
            if (!tank.alive) return;
            const distance = Math.sqrt((this.x - tank.x) ** 2 + (this.y - tank.y) ** 2);
            if (distance < 80) { // Bigger explosion radius
                tank.destroy(this.owner);
            }
        });
        
        // More particles
        for (let i = 0; i < 30; i++) {
            particles.push(new Particle(this.x, this.y, '#FF6600'));
        }
    }
    
    drawBulletVisual() {
        ctx.shadowColor = '#FF6600';
        ctx.shadowBlur = 12;
        
        // Rocket body
        ctx.fillStyle = '#666';
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillRect(-this.size, -this.size/2, this.size * 2, this.size);
        
        // Rocket tip
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(this.size * 0.5, -this.size/2);
        ctx.lineTo(this.size * 0.5, this.size/2);
        ctx.closePath();
        ctx.fill();
        
        // Flame trail
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.moveTo(-this.size, -this.size/3);
        ctx.lineTo(-this.size * 2, 0);
        ctx.lineTo(-this.size, this.size/3);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFAA00';
        ctx.beginPath();
        ctx.moveTo(-this.size, -this.size/4);
        ctx.lineTo(-this.size * 1.5, 0);
        ctx.lineTo(-this.size, this.size/4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}