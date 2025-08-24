// Laser Bullet - Fast, precise laser weapon

class LaserBullet extends BaseBullet {
    constructor(x, y, angle, owner) {
        super(x, y, angle, owner, 'laser');
    }
    
    drawBulletVisual() {
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        
        // Laser beam effect
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = this.size * 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(this.x - Math.cos(this.angle) * 30, this.y - Math.sin(this.angle) * 30);
        ctx.lineTo(this.x + Math.cos(this.angle) * 10, this.y + Math.sin(this.angle) * 10);
        ctx.stroke();
        
        // Core beam
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = this.size;
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Pulse effect
        const pulse = Math.sin(Date.now() * 0.05) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * pulse, 0, Math.PI * 2);
        ctx.fill();
    }
}