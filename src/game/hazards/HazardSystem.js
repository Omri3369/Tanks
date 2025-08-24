class HazardSystem {
    constructor() {
        this.hazardTypes = new Map();
        this.initializeHazards();
    }
    
    initializeHazards() {
        // Register all hazard types
        this.registerHazard('lavaPool', LavaPool);
        this.registerHazard('quicksand', Quicksand);
        this.registerHazard('electricFence', ElectricFence);
        this.registerHazard('tornado', Tornado);
        this.registerHazard('meteor', MeteorShower);
        this.registerHazard('acidRain', AcidRain);
        this.registerHazard('earthquake', Earthquake);
        this.registerHazard('lightning', LightningStorm);
        this.registerHazard('icePatches', IcePatch);
        this.registerHazard('minefield', Minefield);
        this.registerHazard('spikes', SpikeTrap);
        this.registerHazard('crusher', Crusher);
        this.registerHazard('blackHoles', BlackHole);
        this.registerHazard('fireWalls', FireWall);
        this.registerHazard('poisonGas', PoisonGas);
    }
    
    registerHazard(type, hazardClass) {
        this.hazardTypes.set(type, hazardClass);
    }
    
    generateHazards(canvas, hazardConfig) {
        const hazards = [];
        
        Object.keys(hazardConfig).forEach(type => {
            if (hazardConfig[type].enabled) {
                const HazardClass = this.hazardTypes.get(type);
                if (HazardClass) {
                    const count = this.getHazardCount(type);
                    for (let i = 0; i < count; i++) {
                        const position = this.getRandomPosition(canvas);
                        hazards.push(new HazardClass(position.x, position.y));
                    }
                }
            }
        });
        
        return hazards;
    }
    
    getHazardCount(type) {
        const counts = {
            lavaPool: 3,
            quicksand: 4,
            electricFence: 2,
            tornado: 1,
            icePatches: 6,
            spikes: 5,
            blackHoles: 1,
            fireWalls: 2,
            poisonGas: 3
        };
        return counts[type] || 2;
    }
    
    getRandomPosition(canvas) {
        return {
            x: Math.random() * (canvas.width - 100) + 50,
            y: Math.random() * (canvas.height - 100) + 50
        };
    }
}

// Base Hazard Class
class EnvironmentalHazard extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.radius = 30;
        this.damageRate = 1;
        this.effectTimer = 0;
    }
    
    update(deltaTime, gameState) {
        if (!this.alive) return;
        this.checkTankInteraction(gameState.tanks);
    }
    
    checkTankInteraction(tanks) {
        tanks.forEach(tank => {
            if (tank.alive && this.isAffecting(tank)) {
                this.affectTank(tank);
            }
        });
    }
    
    isAffecting(tank) {
        return this.distanceTo(tank) < this.radius + tank.radius;
    }
    
    affectTank(tank) {
        // Override in subclasses
    }
    
    draw(ctx) {
        // Override in subclasses
    }
}

// Lava Pool
class LavaPool extends EnvironmentalHazard {
    constructor(x, y) {
        super(x, y);
        this.radius = 40;
        this.damageRate = 2;
        this.bubbleTimer = 0;
        this.bubbles = [];
    }
    
    update(deltaTime, gameState) {
        super.update(deltaTime, gameState);
        
        // Create bubbles
        this.bubbleTimer++;
        if (this.bubbleTimer > 30) {
            this.bubbles.push({
                x: this.x + (Math.random() - 0.5) * this.radius * 2,
                y: this.y + (Math.random() - 0.5) * this.radius * 2,
                size: Math.random() * 5 + 2,
                lifetime: 30
            });
            this.bubbleTimer = 0;
        }
        
        // Update bubbles
        this.bubbles = this.bubbles.filter(bubble => {
            bubble.y -= 1;
            bubble.lifetime--;
            return bubble.lifetime > 0;
        });
    }
    
    affectTank(tank) {
        tank.takeDamage(this.damageRate);
    }
    
    draw(ctx) {
        ctx.save();
        
        // Lava gradient
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, '#FF6600');
        gradient.addColorStop(0.5, '#FF3300');
        gradient.addColorStop(1, '#CC0000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw bubbles
        ctx.fillStyle = '#FFAA00';
        this.bubbles.forEach(bubble => {
            ctx.globalAlpha = bubble.lifetime / 30;
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
}

// Quicksand
class Quicksand extends EnvironmentalHazard {
    constructor(x, y) {
        super(x, y);
        this.radius = 50;
        this.slowFactor = 0.3;
        this.sinkRate = 0.5;
    }
    
    affectTank(tank) {
        // Slow down movement
        tank.speed *= this.slowFactor;
        tank.turnSpeed *= this.slowFactor;
        
        // Gradual sinking effect
        if (tank.sinkLevel === undefined) {
            tank.sinkLevel = 0;
        }
        tank.sinkLevel = Math.min(tank.sinkLevel + this.sinkRate, 20);
        
        // Damage if fully sunk
        if (tank.sinkLevel >= 20) {
            tank.takeDamage(5);
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        // Sandy gradient
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, '#C19A6B');
        gradient.addColorStop(0.7, '#A0826D');
        gradient.addColorStop(1, '#8B7355');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Swirl pattern
        ctx.strokeStyle = '#7D6A56';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 1.5);
        ctx.stroke();
        
        ctx.restore();
    }
}

// Electric Fence
class ElectricFence extends EnvironmentalHazard {
    constructor(x, y) {
        super(x, y);
        this.width = 100;
        this.height = 10;
        this.damageRate = 3;
        this.sparkTimer = 0;
        this.angle = Math.random() * Math.PI;
    }
    
    isAffecting(tank) {
        // Rectangle collision
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        const dx = tank.x - this.x;
        const dy = tank.y - this.y;
        const localX = dx * cos + dy * sin;
        const localY = -dx * sin + dy * cos;
        
        return Math.abs(localX) < this.width / 2 + tank.radius && 
               Math.abs(localY) < this.height / 2 + tank.radius;
    }
    
    affectTank(tank) {
        tank.takeDamage(this.damageRate);
        tank.freeze(10); // Brief stun
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Fence posts
        ctx.fillStyle = '#444';
        ctx.fillRect(-this.width/2 - 5, -10, 10, 20);
        ctx.fillRect(this.width/2 - 5, -10, 10, 20);
        
        // Electric field
        this.sparkTimer++;
        if (this.sparkTimer % 10 < 5) {
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#00FFFF';
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            const segments = 20;
            for (let i = 0; i <= segments; i++) {
                const x = -this.width/2 + (this.width * i / segments);
                const y = Math.sin(i * 0.5 + this.sparkTimer * 0.1) * 5;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// Tornado
class Tornado extends EnvironmentalHazard {
    constructor(x, y) {
        super(x, y);
        this.radius = 60;
        this.pullForce = 3;
        this.moveSpeed = 1;
        this.moveAngle = Math.random() * Math.PI * 2;
        this.rotation = 0;
    }
    
    update(deltaTime, gameState) {
        super.update(deltaTime, gameState);
        
        // Move tornado
        this.x += Math.cos(this.moveAngle) * this.moveSpeed;
        this.y += Math.sin(this.moveAngle) * this.moveSpeed;
        
        // Bounce off walls
        if (this.x < this.radius || this.x > gameState.canvas.width - this.radius) {
            this.moveAngle = Math.PI - this.moveAngle;
        }
        if (this.y < this.radius || this.y > gameState.canvas.height - this.radius) {
            this.moveAngle = -this.moveAngle;
        }
        
        // Rotate
        this.rotation += 0.2;
    }
    
    affectTank(tank) {
        // Pull tank towards center
        const angle = Math.atan2(this.y - tank.y, this.x - tank.x);
        tank.x += Math.cos(angle) * this.pullForce;
        tank.y += Math.sin(angle) * this.pullForce;
        
        // Spin tank
        tank.angle += 0.1;
        
        // Damage if in center
        const distance = this.distanceTo(tank);
        if (distance < 20) {
            tank.takeDamage(2);
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Draw spiral
        ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
        ctx.lineWidth = 3;
        
        for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.rotate(this.rotation + i * Math.PI * 2 / 3);
            ctx.beginPath();
            
            for (let j = 0; j < 50; j++) {
                const angle = j * 0.2;
                const radius = j * 1.5;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            ctx.restore();
        }
        
        ctx.restore();
    }
}

// Ice Patch
class IcePatch extends EnvironmentalHazard {
    constructor(x, y) {
        super(x, y);
        this.radius = 35;
        this.slipperiness = 0.95;
    }
    
    affectTank(tank) {
        // Make controls slippery
        if (tank.onIce === undefined) {
            tank.onIce = true;
            tank.momentum = { x: 0, y: 0 };
        }
        
        // Apply momentum
        tank.momentum.x = tank.momentum.x * this.slipperiness + Math.cos(tank.angle) * tank.speed * 0.1;
        tank.momentum.y = tank.momentum.y * this.slipperiness + Math.sin(tank.angle) * tank.speed * 0.1;
        
        tank.x += tank.momentum.x;
        tank.y += tank.momentum.y;
        
        // Reduce turn control
        tank.turnSpeed *= 0.3;
    }
    
    draw(ctx) {
        ctx.save();
        
        // Ice gradient
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, 'rgba(200, 230, 255, 0.8)');
        gradient.addColorStop(0.7, 'rgba(150, 200, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(100, 150, 255, 0.4)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Cracks
        ctx.strokeStyle = 'rgba(100, 150, 200, 0.5)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x + Math.cos(angle) * this.radius * 0.8,
                this.y + Math.sin(angle) * this.radius * 0.8
            );
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// FireWall - Moving wall of fire that damages tanks
class FireWall extends EnvironmentalHazard {
    constructor(x, y) {
        super(x, y);
        this.width = 100;
        this.height = 20;
        this.damageRate = 2;
        this.moveSpeed = 1;
        this.moveAngle = Math.random() * Math.PI * 2;
        this.fireParticles = [];
        this.animationFrame = 0;
        
        // Initialize fire particles
        for (let i = 0; i < 15; i++) {
            this.fireParticles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                life: Math.random() * 30 + 30,
                maxLife: 60,
                size: Math.random() * 8 + 4
            });
        }
    }
    
    update(deltaTime, gameState) {
        super.update(deltaTime, gameState);
        
        // Move the fire wall
        this.x += Math.cos(this.moveAngle) * this.moveSpeed;
        this.y += Math.sin(this.moveAngle) * this.moveSpeed;
        
        // Bounce off walls
        if (this.x < 0 || this.x > gameState.canvas.width - this.width) {
            this.moveAngle = Math.PI - this.moveAngle;
        }
        if (this.y < 0 || this.y > gameState.canvas.height - this.height) {
            this.moveAngle = -this.moveAngle;
        }
        
        // Keep within bounds
        this.x = Math.max(0, Math.min(gameState.canvas.width - this.width, this.x));
        this.y = Math.max(0, Math.min(gameState.canvas.height - this.height, this.y));
        
        // Update fire particles
        this.animationFrame++;
        this.fireParticles.forEach(particle => {
            particle.life--;
            if (particle.life <= 0) {
                particle.x = Math.random() * this.width;
                particle.y = Math.random() * this.height;
                particle.life = particle.maxLife;
            }
        });
    }
    
    isAffecting(tank) {
        // Rectangle collision with tank
        const tankX = tank.x;
        const tankY = tank.y;
        const tankRadius = 15; // Approximate tank radius
        
        return tankX + tankRadius > this.x && 
               tankX - tankRadius < this.x + this.width &&
               tankY + tankRadius > this.y && 
               tankY - tankRadius < this.y + this.height;
    }
    
    affectTank(tank) {
        // Deal fire damage
        if (typeof tank.takeDamage === 'function') {
            tank.takeDamage(this.damageRate);
        } else {
            tank.health -= this.damageRate;
            if (tank.health <= 0) {
                tank.destroy();
            }
        }
        
        // Create fire damage particles
        for (let i = 0; i < 3; i++) {
            particles.push(new Particle(
                tank.x + (Math.random() - 0.5) * 20,
                tank.y + (Math.random() - 0.5) * 20,
                '#FF4500',
                20 + Math.random() * 10
            ));
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        // Draw fire wall base
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, 'rgba(255, 69, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 140, 0, 0.9)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0.7)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw animated fire particles
        this.fireParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            const x = this.x + particle.x + Math.sin(this.animationFrame * 0.1 + particle.x) * 3;
            const y = this.y + particle.y - (particle.maxLife - particle.life) * 0.2;
            
            ctx.globalAlpha = alpha * 0.8;
            ctx.fillStyle = particle.life > 30 ? '#FFFF00' : (particle.life > 15 ? '#FF8C00' : '#FF0000');
            
            ctx.beginPath();
            ctx.arc(x, y, particle.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw warning indicator when moving
        if (this.moveSpeed > 0) {
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    }
}

// More hazard classes would go here...
// (SpikeTrap, Crusher, BlackHole, PoisonGas, etc.)

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HazardSystem;
}