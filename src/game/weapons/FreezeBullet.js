// Freeze Bullet - Freezes enemy tanks

class FreezeBullet extends BaseBullet {
    constructor(x, y, angle, owner) {
        super(x, y, angle, owner, 'freeze');
    }
    
    applySpecialEffect(tank) {
        // Freeze the tank
        if (!tank.frozen) {
            tank.frozen = true;
            tank.frozenTime = 180; // 3 seconds at 60fps
            
            // Create freeze effect particles
            for (let i = 0; i < 10; i++) {
                const particle = new Particle(tank.x, tank.y, '#66CCFF');
                particle.vx = (Math.random() - 0.5) * 4;
                particle.vy = (Math.random() - 0.5) * 4;
                particles.push(particle);
            }
        }
    }
    
    drawBulletVisual() {
        ctx.shadowColor = '#66CCFF';
        ctx.shadowBlur = 12;
        
        // Ice crystal effect
        ctx.fillStyle = '#66CCFF';
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Draw snowflake pattern
        for (let i = 0; i < 6; i++) {
            ctx.rotate(Math.PI / 3);
            ctx.fillRect(-this.size * 1.5, -1, this.size * 3, 2);
        }
        
        // Center crystal
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Sparkling effect
        if (Math.random() > 0.7) {
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 0.8;
            const sparkX = this.x + (Math.random() - 0.5) * this.size * 2;
            const sparkY = this.y + (Math.random() - 0.5) * this.size * 2;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}