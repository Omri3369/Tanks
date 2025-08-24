import { EFFECTS } from '../../utils/constants.js';

export class Particle {
    constructor(x, y, color, ctx) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.color = color;
        this.life = EFFECTS.PARTICLE_LIFETIME;
        this.size = Math.random() * 5 + 2;
        this.ctx = ctx;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.life--;
        return this.life > 0;
    }
    
    draw() {
        this.ctx.globalAlpha = this.life / EFFECTS.PARTICLE_LIFETIME;
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        this.ctx.globalAlpha = 1;
    }
}

export class SmokeParticle {
    constructor(x, y, ctx) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3 - 1; // Smoke rises
        this.life = EFFECTS.SMOKE_LIFETIME;
        this.maxLife = EFFECTS.SMOKE_LIFETIME;
        this.size = Math.random() * 20 + 10;
        this.ctx = ctx;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.size += 0.5; // Smoke expands
        this.life--;
        return this.life > 0;
    }
    
    draw() {
        const alpha = (this.life / this.maxLife) * 0.5;
        this.ctx.globalAlpha = alpha;
        
        // Create gradient for smoke
        const gradient = this.ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, 'rgba(50, 50, 50, 0.8)');
        gradient.addColorStop(0.5, 'rgba(100, 100, 100, 0.5)');
        gradient.addColorStop(1, 'rgba(150, 150, 150, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.globalAlpha = 1;
    }
}