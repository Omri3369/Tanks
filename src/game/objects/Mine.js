class Mine extends GameObject {
    constructor(x, y, owner) {
        super(x, y);
        this.owner = owner;
        this.size = 10;
        this.armed = false;
        this.armTimer = 60; // 1 second to arm
        this.blinkTimer = 0;
        this.triggered = false;
        this.detonationTimer = 0;
        this.detonationDelay = 10;
        this.explosionRadius = 60;
    }
    
    update(deltaTime, tanks) {
        if (!this.alive) return;
        
        // Arm the mine
        if (!this.armed) {
            this.armTimer--;
            if (this.armTimer <= 0) {
                this.armed = true;
            }
        }
        
        // Check for nearby tanks
        if (this.armed && !this.triggered) {
            for (let tank of tanks) {
                if (tank.alive && tank.playerNum !== this.owner) {
                    const distance = this.distanceTo(tank);
                    if (distance < 30) {
                        this.triggered = true;
                        this.detonationTimer = this.detonationDelay;
                        break;
                    }
                }
            }
        }
        
        // Handle detonation
        if (this.triggered) {
            this.detonationTimer--;
            if (this.detonationTimer <= 0) {
                this.explode(tanks);
            }
        }
        
        // Blink animation
        this.blinkTimer++;
    }
    
    explode(tanks) {
        // Damage nearby tanks
        for (let tank of tanks) {
            if (tank.alive) {
                const distance = this.distanceTo(tank);
                if (distance < this.explosionRadius) {
                    const damage = (1 - distance / this.explosionRadius) * 50;
                    tank.takeDamage(damage);
                }
            }
        }
        
        this.destroy();
    }
    
    draw(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        
        // Draw mine body
        if (this.triggered) {
            // Rapid blinking when triggered
            if (this.blinkTimer % 4 < 2) {
                ctx.fillStyle = '#FF0000';
            } else {
                ctx.fillStyle = '#880000';
            }
        } else if (this.armed) {
            // Slow blinking when armed
            if (this.blinkTimer % 60 < 30) {
                ctx.fillStyle = '#FF6600';
            } else {
                ctx.fillStyle = '#884400';
            }
        } else {
            // Solid color when not armed
            ctx.fillStyle = '#666666';
        }
        
        // Mine shape
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw spikes
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            ctx.beginPath();
            ctx.moveTo(
                this.x + Math.cos(angle) * this.size,
                this.y + Math.sin(angle) * this.size
            );
            ctx.lineTo(
                this.x + Math.cos(angle) * (this.size + 5),
                this.y + Math.sin(angle) * (this.size + 5)
            );
            ctx.stroke();
        }
        
        // Warning circle when triggered
        if (this.triggered) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.explosionRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    }
}

class ShieldWall extends GameObject {
    constructor(x, y, angle, owner) {
        super(x, y);
        this.angle = angle;
        this.owner = owner;
        this.width = 60;
        this.height = 10;
        this.health = 100;
        this.maxHealth = 100;
        this.lifetime = 600; // 10 seconds
        
        // Position shield in front of tank
        this.x += Math.cos(angle) * 40;
        this.y += Math.sin(angle) * 40;
    }
    
    update(deltaTime) {
        if (!this.alive) return;
        
        this.lifetime--;
        if (this.lifetime <= 0 || this.health <= 0) {
            this.destroy();
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.destroy();
        }
    }
    
    checkBulletCollision(bullet) {
        // Simple rectangle collision
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        
        // Transform bullet position to shield's local space
        const dx = bullet.x - this.x;
        const dy = bullet.y - this.y;
        const localX = dx * cos + dy * sin;
        const localY = -dx * sin + dy * cos;
        
        return Math.abs(localX) < this.width / 2 && 
               Math.abs(localY) < this.height / 2;
    }
    
    draw(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Shield gradient based on health
        const healthPercent = this.health / this.maxHealth;
        const gradient = ctx.createLinearGradient(-this.width/2, 0, this.width/2, 0);
        gradient.addColorStop(0, `rgba(0, 150, 255, ${0.3 + healthPercent * 0.5})`);
        gradient.addColorStop(0.5, `rgba(0, 200, 255, ${0.5 + healthPercent * 0.5})`);
        gradient.addColorStop(1, `rgba(0, 150, 255, ${0.3 + healthPercent * 0.5})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Shield border
        ctx.strokeStyle = `rgba(0, 200, 255, ${healthPercent})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Energy effect
        if (this.lifetime % 10 < 5) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(-this.width/2 - 2, -this.height/2 - 2, this.width + 4, this.height + 4);
        }
        
        ctx.restore();
    }
}

class LightningStrike extends GameObject {
    constructor(x, y, owner) {
        super(x, y);
        this.owner = owner;
        this.chargeTime = 30; // 0.5 seconds warning
        this.strikeTime = 10;
        this.radius = 40;
        this.struck = false;
    }
    
    update(deltaTime, tanks) {
        if (!this.alive) return;
        
        if (this.chargeTime > 0) {
            this.chargeTime--;
            if (this.chargeTime === 0) {
                this.strike(tanks);
            }
        } else {
            this.strikeTime--;
            if (this.strikeTime <= 0) {
                this.destroy();
            }
        }
    }
    
    strike(tanks) {
        this.struck = true;
        
        // Damage tanks in radius
        for (let tank of tanks) {
            if (tank.alive) {
                const distance = this.distanceTo(tank);
                if (distance < this.radius) {
                    tank.takeDamage(60);
                }
            }
        }
    }
    
    draw(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        
        if (this.chargeTime > 0) {
            // Warning indicator
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Target symbol
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x - 20, this.y);
            ctx.lineTo(this.x + 20, this.y);
            ctx.moveTo(this.x, this.y - 20);
            ctx.lineTo(this.x, this.y + 20);
            ctx.stroke();
        } else if (this.struck) {
            // Lightning bolt effect
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 5;
            ctx.shadowColor = '#00FFFF';
            ctx.shadowBlur = 20;
            ctx.globalAlpha = this.strikeTime / 10;
            
            // Draw lightning from top to strike point
            ctx.beginPath();
            ctx.moveTo(this.x, 0);
            
            // Zigzag pattern
            let currentY = 0;
            while (currentY < this.y) {
                currentY += 30;
                const offsetX = (Math.random() - 0.5) * 40;
                ctx.lineTo(this.x + offsetX, Math.min(currentY, this.y));
            }
            ctx.stroke();
            
            // Impact circle
            ctx.fillStyle = `rgba(255, 255, 255, ${this.strikeTime / 10})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * (1 - this.strikeTime / 10), 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Mine, ShieldWall, LightningStrike };
}