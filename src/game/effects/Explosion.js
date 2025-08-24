import { EFFECTS } from '../../utils/constants.js';

export class Explosion {
    constructor(x, y, canvas, ctx) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.maxRadius = EFFECTS.EXPLOSION_MAX_RADIUS;
        this.life = EFFECTS.EXPLOSION_LIFETIME;
        this.maxLife = EFFECTS.EXPLOSION_LIFETIME;
        this.shockwaveRadius = 5;
        this.shockwaveMaxRadius = 80;
        this.canvas = canvas;
        this.ctx = ctx;
    }
    
    update() {
        // Expand explosion
        if (this.radius < this.maxRadius) {
            this.radius += (this.maxRadius - this.radius) * 0.3;
        }
        
        // Expand shockwave
        if (this.shockwaveRadius < this.shockwaveMaxRadius) {
            this.shockwaveRadius += 4;
        }
        
        this.life--;
        return this.life > 0;
    }
    
    draw() {
        this.ctx.save();
        
        // Draw shockwave
        if (this.life > 20) {
            const shockwaveAlpha = (this.life - 20) / 10 * 0.5;
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${shockwaveAlpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.shockwaveRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Draw main explosion with multiple layers
        const alpha = this.life / this.maxLife;
        
        // Outer explosion (orange/red)
        const gradient1 = this.ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient1.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
        gradient1.addColorStop(0.3, `rgba(255, 200, 0, ${alpha * 0.8})`);
        gradient1.addColorStop(0.6, `rgba(255, 100, 0, ${alpha * 0.6})`);
        gradient1.addColorStop(1, `rgba(255, 0, 0, 0)`);
        
        this.ctx.fillStyle = gradient1;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner explosion (white hot core)
        if (this.life > 15) {
            const coreAlpha = (this.life - 15) / 15;
            const gradient2 = this.ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 0.5);
            gradient2.addColorStop(0, `rgba(255, 255, 255, ${coreAlpha})`);
            gradient2.addColorStop(0.5, `rgba(255, 255, 200, ${coreAlpha * 0.7})`);
            gradient2.addColorStop(1, `rgba(255, 200, 100, 0)`);
            
            this.ctx.fillStyle = gradient2;
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Add flash effect at the beginning
        if (this.life > 25) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${(this.life - 25) / 5 * 0.8})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        this.ctx.restore();
    }
}