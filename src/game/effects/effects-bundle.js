// Effects Bundle - Compatibility layer for gradual migration
// This file loads the modular effects and exposes them globally

// Particle class
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.color = color;
        this.life = 30;
        this.size = Math.random() * 5 + 2;
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
        // Use global ctx for backward compatibility
        ctx.globalAlpha = this.life / 30;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// SmokeParticle class
class SmokeParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3 - 1; // Smoke rises
        this.life = 60;
        this.maxLife = 60;
        this.size = Math.random() * 20 + 10;
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
        // Use global ctx for backward compatibility
        const alpha = (this.life / this.maxLife) * 0.5;
        ctx.globalAlpha = alpha;
        
        // Create gradient for smoke
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, 'rgba(50, 50, 50, 0.8)');
        gradient.addColorStop(0.5, 'rgba(100, 100, 100, 0.5)');
        gradient.addColorStop(1, 'rgba(150, 150, 150, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }
}

// Explosion class
class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.maxRadius = 50;
        this.life = 30;
        this.maxLife = 30;
        this.shockwaveRadius = 5;
        this.shockwaveMaxRadius = 80;
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
        // Use global ctx and canvas for backward compatibility
        ctx.save();
        
        // Draw shockwave
        if (this.life > 20) {
            const shockwaveAlpha = (this.life - 20) / 10 * 0.5;
            ctx.strokeStyle = `rgba(255, 255, 255, ${shockwaveAlpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.shockwaveRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw main explosion with multiple layers
        const alpha = this.life / this.maxLife;
        
        // Outer explosion (orange/red)
        const gradient1 = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient1.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
        gradient1.addColorStop(0.3, `rgba(255, 200, 0, ${alpha * 0.8})`);
        gradient1.addColorStop(0.6, `rgba(255, 100, 0, ${alpha * 0.6})`);
        gradient1.addColorStop(1, `rgba(255, 0, 0, 0)`);
        
        ctx.fillStyle = gradient1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner explosion (white hot core)
        if (this.life > 15) {
            const coreAlpha = (this.life - 15) / 15;
            const gradient2 = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 0.5);
            gradient2.addColorStop(0, `rgba(255, 255, 255, ${coreAlpha})`);
            gradient2.addColorStop(0.5, `rgba(255, 255, 200, ${coreAlpha * 0.7})`);
            gradient2.addColorStop(1, `rgba(255, 200, 100, 0)`);
            
            ctx.fillStyle = gradient2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add flash effect at the beginning
        if (this.life > 25) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(this.life - 25) / 5 * 0.8})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.restore();
    }
}

class RingOfFire {
    constructor() {
        this.active = false;
        this.radius = Math.max(canvas.width, canvas.height);
        // Random center position for each round - scale with map size
        const margin = Math.min(canvas.width, canvas.height) * 0.2;
        this.centerX = margin + Math.random() * (canvas.width - margin * 2);
        this.centerY = margin + Math.random() * (canvas.height - margin * 2);
        this.minRadius = Math.min(canvas.width, canvas.height) * 0.15; // Scale safe zone with map
        this.shrinkSpeed = Math.min(canvas.width, canvas.height) * 0.0003; // Scale shrink speed
        this.damageTimer = 0;
        this.warningTime = 30000; // 30 seconds before it starts
        this.startTime = Date.now();
        
        // Enhanced animation properties
        this.fireParticles = [];
        this.animationTime = 0;
        this.shakeIntensity = 0;
        this.initializeFireParticles();
    }
    
    initializeFireParticles() {
        // Create animated fire particles around the circumference
        const particleCount = 120;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            this.fireParticles.push({
                angle: angle,
                baseRadius: 0,
                radiusOffset: Math.random() * 20 - 10,
                size: 4 + Math.random() * 8,
                life: Math.random(),
                maxLife: 0.5 + Math.random() * 1.5,
                speed: 0.02 + Math.random() * 0.04,
                flickerSpeed: 0.1 + Math.random() * 0.2,
                colorPhase: Math.random() * Math.PI * 2
            });
        }
    }
    
    update() {
        const elapsed = Date.now() - this.startTime;
        this.animationTime += 0.016; // ~60fps timing
        
        if (elapsed > this.warningTime && !this.active) {
            this.active = true;
        }
        
        if (this.active && this.radius > this.minRadius) {
            this.radius -= this.shrinkSpeed;
            // Increase shake intensity as ring gets smaller
            this.shakeIntensity = Math.max(0, (1 - this.radius / (Math.max(canvas.width, canvas.height) * 0.5)) * 3);
        }
        
        // Update fire particles
        this.fireParticles.forEach(particle => {
            particle.baseRadius = this.radius;
            particle.life += particle.speed;
            particle.colorPhase += particle.flickerSpeed;
            
            // Reset particle when it reaches max life
            if (particle.life >= particle.maxLife) {
                particle.life = 0;
                particle.radiusOffset = Math.random() * 30 - 15;
                particle.size = 3 + Math.random() * 10;
            }
        });
        
        // Check if tanks are outside the ring
        if (this.active) {
            this.damageTimer++;
            if (this.damageTimer > 60) { // Damage every second (60 frames)
                this.damageTimer = 0;
                tanks.forEach(tank => {
                    if (tank.alive) {
                        const distance = Math.sqrt(
                            (tank.x - this.centerX) ** 2 + 
                            (tank.y - this.centerY) ** 2
                        );
                        if (distance > this.radius - 20) {
                            // Tank is in the fire, take damage
                            // Create fire particles for damage effect
                            for (let i = 0; i < 5; i++) {
                                particles.push(new Particle(tank.x, tank.y, '#FF4500'));
                            }
                            // Give the tank a chance to escape before destroying
                            if (distance > this.radius + 10) {
                                tank.destroy();
                                // Don't trigger round end here, let the normal game flow handle it
                            }
                        }
                    }
                });
            }
        }
    }
    
    draw() {
        const elapsed = Date.now() - this.startTime;
        
        // Apply screen shake if active
        if (this.active && this.shakeIntensity > 0) {
            const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            ctx.save();
            ctx.translate(shakeX, shakeY);
        }
        
        // Draw warning timer
        if (elapsed < this.warningTime) {
            const timeLeft = Math.ceil((this.warningTime - elapsed) / 1000);
            ctx.save();
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#FF0000';
            ctx.textAlign = 'center';
            ctx.fillText(`RING OF FIRE IN: ${timeLeft}`, canvas.width / 2, 40);
            ctx.restore();
        }
        
        // Draw the ring
        if (this.active || elapsed > this.warningTime - 3000) {
            ctx.save();
            
            // Create gradient for fire effect
            const gradient = ctx.createRadialGradient(
                this.centerX, this.centerY, Math.max(0, this.radius - 50),
                this.centerX, this.centerY, this.radius + 50
            );
            
            if (this.active) {
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
                gradient.addColorStop(0.7, 'rgba(255, 100, 0, 0.2)');
                gradient.addColorStop(0.85, 'rgba(255, 69, 0, 0.5)');
                gradient.addColorStop(0.95, 'rgba(255, 0, 0, 0.8)');
                gradient.addColorStop(1, 'rgba(139, 0, 0, 1)');
            } else {
                // Warning phase - lighter colors
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
                gradient.addColorStop(0.8, 'rgba(255, 165, 0, 0.1)');
                gradient.addColorStop(1, 'rgba(255, 69, 0, 0.3)');
            }
            
            // Draw the ring
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw fire particles on the edge
            if (this.active) {
                for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
                    if (Math.random() > 0.5) {
                        const x = this.centerX + Math.cos(angle) * this.radius;
                        const y = this.centerY + Math.sin(angle) * this.radius;
                        const size = 5 + Math.random() * 10;
                        
                        ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, ${0.5 + Math.random() * 0.5})`;
                        ctx.beginPath();
                        ctx.arc(x, y, size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                
                // Draw inner fire boundary
                ctx.strokeStyle = '#FF4500';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.restore();
        }
        
        // Draw safe zone indicator - show final safe zone from the start
        ctx.save();
        if (!this.active && elapsed < this.warningTime) {
            // Before fire starts, show where the final safe zone will be
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 15]);
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, this.minRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Label for safe zone
            ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SAFE ZONE', this.centerX, this.centerY);
        } else if (this.active) {
            // During fire, show current safe boundary
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, this.radius - 30, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
        
        // Restore screen shake transformation
        if (this.active && this.shakeIntensity > 0) {
            ctx.restore();
        }
    }
}

// Expose classes globally for backward compatibility
window.Particle = Particle;
window.SmokeParticle = SmokeParticle;
window.Explosion = Explosion;
window.RingOfFire = RingOfFire;