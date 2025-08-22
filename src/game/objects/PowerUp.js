class PowerUp extends GameObject {
    constructor(x, y, type) {
        super(x, y);
        this.type = type;
        this.size = POWERUP_SIZE;
        this.collected = false;
        this.respawnTimer = 0;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.glowIntensity = 0;
    }
    
    update(deltaTime) {
        if (!this.alive) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }
        
        // Bobbing animation
        this.bobOffset += 0.05;
        
        // Glow animation
        this.glowIntensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
    }
    
    checkCollision(tank) {
        if (!this.alive || !tank.alive) return false;
        return this.distanceTo(tank) < this.size + tank.radius;
    }
    
    collect() {
        this.alive = false;
        this.respawnTimer = CONFIG.POWERUP_RESPAWN_TIME;
    }
    
    respawn() {
        this.alive = true;
        // Find new position
        const newPos = this.findSafePosition();
        this.x = newPos.x;
        this.y = newPos.y;
    }
    
    findSafePosition() {
        // Simple random position for now
        return {
            x: Math.random() * (canvas.width - 100) + 50,
            y: Math.random() * (canvas.height - 100) + 50
        };
    }
    
    draw(ctx) {
        if (!this.alive) return;
        
        const bobY = Math.sin(this.bobOffset) * 5;
        
        ctx.save();
        ctx.translate(this.x, this.y + bobY);
        
        // Glow effect
        ctx.shadowColor = this.getGlowColor();
        ctx.shadowBlur = 20 * this.glowIntensity;
        
        // Draw power-up icon based on type
        this.drawIcon(ctx);
        
        // Draw label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.getLabel(), 0, -this.size - 10);
        
        ctx.restore();
    }
    
    drawIcon(ctx) {
        ctx.fillStyle = this.getColor();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        
        // Draw container
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw type-specific icon
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.getIcon(), 0, 0);
    }
    
    getColor() {
        const colors = {
            scatter: '#FF6B6B',
            laser: '#FF0000',
            rocket: '#FF8800',
            explosive: '#FFA500',
            piercing: '#9966FF',
            mine: '#8B4513',
            homing: '#00CED1',
            flamethrower: '#FF4500',
            freeze: '#00BFFF',
            railgun: '#4B0082',
            chain: '#FFD700',
            boomerang: '#32CD32',
            vortex: '#9932CC',
            teleport: '#FF1493',
            shield: '#1E90FF',
            bouncer: '#FF69B4',
            personalShield: '#00FFFF',
            invisibility: '#708090',
            speedBoost: '#00FF00',
            timeWarp: '#FF00FF'
        };
        return colors[this.type] || '#808080';
    }
    
    getGlowColor() {
        return this.getColor();
    }
    
    getIcon() {
        const icons = {
            scatter: '💥',
            laser: '⚡',
            rocket: '🚀',
            explosive: '💣',
            piercing: '🏹',
            mine: '💎',
            homing: '🎯',
            flamethrower: '🔥',
            freeze: '❄️',
            railgun: '⚙️',
            chain: '⛓️',
            boomerang: '🪃',
            vortex: '🌀',
            teleport: '🌌',
            shield: '🛡️',
            bouncer: '⚾',
            personalShield: '🛡️',
            invisibility: '👤',
            speedBoost: '💨',
            timeWarp: '⏰'
        };
        return icons[this.type] || '?';
    }
    
    getLabel() {
        return CONFIG.POWERUP_TYPES[this.type]?.name || this.type;
    }
}

class Collectible extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.value = Math.floor(Math.random() * 3 + 1) * 10;
        this.size = 15;
        this.rotation = 0;
        this.collected = false;
    }
    
    update(deltaTime) {
        if (!this.alive) return;
        
        // Rotation animation
        this.rotation += 0.05;
    }
    
    checkCollision(tank) {
        if (!this.alive || !tank.alive) return false;
        return this.distanceTo(tank) < this.size + tank.radius;
    }
    
    collect() {
        this.alive = false;
    }
    
    draw(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw star shape
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * this.size;
            const y = Math.sin(angle) * this.size;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            const innerAngle = angle + Math.PI / 5;
            const innerX = Math.cos(innerAngle) * (this.size * 0.5);
            const innerY = Math.sin(innerAngle) * (this.size * 0.5);
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw value
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.value, 0, 0);
        
        ctx.restore();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PowerUp, Collectible };
}