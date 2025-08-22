class Explosion extends GameObject {
    constructor(x, y, radius = 50) {
        super(x, y);
        this.radius = radius;
        this.maxRadius = radius;
        this.currentRadius = 0;
        this.lifetime = CONFIG.EXPLOSION_LIFETIME || 30;
        this.maxLifetime = this.lifetime;
        this.shockwaveRadius = 0;
    }
    
    update(deltaTime) {
        if (!this.alive) return;
        
        // Expand explosion
        const progress = 1 - (this.lifetime / this.maxLifetime);
        this.currentRadius = this.maxRadius * this.easeOutCubic(progress);
        this.shockwaveRadius = this.maxRadius * 1.5 * progress;
        
        this.lifetime--;
        if (this.lifetime <= 0) {
            this.destroy();
        }
    }
    
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    draw(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        
        // Draw shockwave
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.shockwaveRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw explosion gradient
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.currentRadius
        );
        
        const alpha = this.lifetime / this.maxLifetime;
        gradient.addColorStop(0, `rgba(255, 255, 0, ${alpha})`);
        gradient.addColorStop(0.4, `rgba(255, 150, 0, ${alpha * 0.8})`);
        gradient.addColorStop(0.8, `rgba(255, 50, 0, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw bright core
        if (this.lifetime > this.maxLifetime * 0.7) {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentRadius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class Particle extends GameObject {
    constructor(x, y, color, velocity = null) {
        super(x, y);
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.lifetime = CONFIG.PARTICLE_LIFETIME || 30;
        this.maxLifetime = this.lifetime;
        
        if (velocity) {
            this.vx = velocity.x;
            this.vy = velocity.y;
        } else {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        }
        
        this.gravity = 0.1;
        this.friction = 0.98;
    }
    
    update(deltaTime) {
        if (!this.alive) return;
        
        // Apply physics
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        this.lifetime--;
        if (this.lifetime <= 0) {
            this.destroy();
        }
    }
    
    draw(ctx) {
        if (!this.alive) return;
        
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ChainLightningEffect extends GameObject {
    constructor(x1, y1, x2, y2) {
        super(x1, y1);
        this.x2 = x2;
        this.y2 = y2;
        this.lifetime = 10;
        this.segments = this.generateLightningPath();
    }
    
    generateLightningPath() {
        const segments = [];
        const steps = 10;
        const dx = (this.x2 - this.x) / steps;
        const dy = (this.y2 - this.y) / steps;
        
        let currentX = this.x;
        let currentY = this.y;
        
        for (let i = 0; i <= steps; i++) {
            segments.push({
                x: currentX + (Math.random() - 0.5) * 20,
                y: currentY + (Math.random() - 0.5) * 20
            });
            currentX += dx;
            currentY += dy;
        }
        
        segments[segments.length - 1] = { x: this.x2, y: this.y2 };
        return segments;
    }
    
    update(deltaTime) {
        this.lifetime--;
        if (this.lifetime <= 0) {
            this.destroy();
        }
        
        // Regenerate lightning for flicker effect
        if (this.lifetime % 2 === 0) {
            this.segments = this.generateLightningPath();
        }
    }
    
    draw(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 10;
        ctx.globalAlpha = this.lifetime / 10;
        
        ctx.beginPath();
        ctx.moveTo(this.segments[0].x, this.segments[0].y);
        for (let i = 1; i < this.segments.length; i++) {
            ctx.lineTo(this.segments[i].x, this.segments[i].y);
        }
        ctx.stroke();
        
        // Draw thinner bright core
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    }
}

class BounceEffect extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.radius = 0;
        this.maxRadius = 20;
        this.lifetime = 10;
    }
    
    update(deltaTime) {
        this.radius = (1 - this.lifetime / 10) * this.maxRadius;
        this.lifetime--;
        if (this.lifetime <= 0) {
            this.destroy();
        }
    }
    
    draw(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.globalAlpha = this.lifetime / 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

class PierceEffect extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.lifetime = 15;
        this.particles = [];
        
        // Create particle burst
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            this.particles.push({
                x: 0,
                y: 0,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3
            });
        }
    }
    
    update(deltaTime) {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.95;
            p.vy *= 0.95;
        });
        
        this.lifetime--;
        if (this.lifetime <= 0) {
            this.destroy();
        }
    }
    
    draw(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#9966FF';
        ctx.globalAlpha = this.lifetime / 15;
        
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Explosion, Particle, ChainLightningEffect, BounceEffect, PierceEffect };
}