// Explosive Bullet - Explodes on impact

class ExplosiveBullet extends BaseBullet {
    constructor(x, y, angle, owner) {
        super(x, y, angle, owner, 'explosive');
    }
    
    handleWallCollision(wall) {
        // Check if it's a destructible wall
        if (wall instanceof DestructibleWall) {
            wall.takeDamage();
        }
        this.createExplosion();
        return false; // Destroy bullet
    }
    
    handleObstacleCollision(tile) {
        this.createExplosion();
        return false; // Destroy bullet
    }
    
    applySpecialEffect(tank) {
        this.createExplosion();
    }
    
    createExplosion() {
        // Create explosion at impact point
        explosions.push(new Explosion(this.x, this.y));
        
        // Damage nearby tanks
        tanks.forEach(tank => {
            if (!tank.alive) return;
            const distance = Math.sqrt((this.x - tank.x) ** 2 + (this.y - tank.y) ** 2);
            if (distance < 60) { // Explosion radius
                tank.destroy(this.owner);
            }
        });
        
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            particles.push(new Particle(this.x, this.y, '#FF3333'));
        }
    }
    
    drawBulletVisual() {
        ctx.shadowColor = '#FF3333';
        ctx.shadowBlur = 15;
        
        // Pulsing bomb
        const pulse = Math.sin(Date.now() * 0.1) * 0.3 + 0.7;
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Danger stripes
        ctx.strokeStyle = '#FF3333';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2) / 3;
            ctx.beginPath();
            ctx.moveTo(this.x + Math.cos(angle) * this.size * 0.5, this.y + Math.sin(angle) * this.size * 0.5);
            ctx.lineTo(this.x + Math.cos(angle) * this.size * pulse, this.y + Math.sin(angle) * this.size * pulse);
            ctx.stroke();
        }
        
        // Blinking fuse
        if (Math.floor(Date.now() / 200) % 2) {
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(this.x, this.y - this.size * 0.8, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}