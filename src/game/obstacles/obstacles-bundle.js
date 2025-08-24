// Obstacles Bundle - Combines all obstacle classes into a single file for backward compatibility

// Wall class
class Wall {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    draw() {
        if (typeof ctx !== 'undefined') {
            ctx.fillStyle = '#444';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// DestructibleWall class
class DestructibleWall extends Wall {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.maxHealth = 3;
        this.health = 3;
        this.isDestructible = true;
        this.damageEffects = [];
    }
    
    takeDamage() {
        this.health--;
        
        // Create damage particles
        if (typeof particles !== 'undefined') {
            for (let i = 0; i < 8; i++) {
                const px = this.x + this.width / 2 + (Math.random() - 0.5) * this.width;
                const py = this.y + this.height / 2 + (Math.random() - 0.5) * this.height;
                particles.push(new Particle(px, py, this.getDamageColor()));
            }
        }
        
        // Wall destroyed
        if (this.health <= 0) {
            this.destroy();
            return true; // Wall is destroyed
        }
        
        return false; // Wall still standing
    }
    
    destroy() {
        // Create destruction particles
        if (typeof particles !== 'undefined') {
            for (let i = 0; i < 20; i++) {
                const px = this.x + Math.random() * this.width;
                const py = this.y + Math.random() * this.height;
                const color = i % 3 === 0 ? '#8B4513' : (i % 3 === 1 ? '#A0522D' : '#654321');
                
                const particle = new Particle(px, py, color);
                particle.vx = (Math.random() - 0.5) * 4;
                particle.vy = (Math.random() - 0.5) * 4;
                particle.size = Math.random() * 4 + 2;
                particles.push(particle);
            }
        }
    }
    
    getDamageColor() {
        switch(this.health) {
            case 2: return '#A0522D'; // Light brown
            case 1: return '#8B4513'; // Saddle brown
            default: return '#654321'; // Dark brown
        }
    }
    
    draw() {
        if (typeof ctx !== 'undefined') {
            // Draw main wall
            ctx.fillStyle = this.getDamageColor();
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Draw health indicator
            if (this.health < this.maxHealth) {
                ctx.fillStyle = '#FF0000';
                const healthWidth = (this.width * this.health) / this.maxHealth;
                ctx.fillRect(this.x, this.y - 5, healthWidth, 3);
            }
        }
    }
}

// Gate class - Dynamic obstacle that opens and closes
class Gate {
    constructor(x, y, width, height, isVertical = true) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isVertical = isVertical;
        this.isOpen = false;
        this.openAmount = 0;
        this.openTimer = 0;
        this.closedTime = 3000; // 3 seconds closed
        this.openTime = 2000; // 2 seconds open
    }
    
    update() {
        this.openTimer += 16; // Assuming 60fps
        
        if (!this.isOpen && this.openTimer >= this.closedTime) {
            this.isOpen = true;
            this.openTimer = 0;
        } else if (this.isOpen && this.openTimer >= this.openTime) {
            this.isOpen = false;
            this.openTimer = 0;
        }
        
        // Smooth opening/closing animation
        const targetAmount = this.isOpen ? 1 : 0;
        this.openAmount += (targetAmount - this.openAmount) * 0.1;
    }
    
    draw() {
        if (typeof ctx !== 'undefined') {
            ctx.fillStyle = this.isOpen ? '#00FF00' : '#FF0000';
            
            if (this.isVertical) {
                const openHeight = this.height * (1 - this.openAmount);
                if (openHeight > 0) {
                    ctx.fillRect(this.x, this.y, this.width, openHeight);
                    ctx.fillRect(this.x, this.y + this.height - openHeight, this.width, openHeight);
                }
            } else {
                const openWidth = this.width * (1 - this.openAmount);
                if (openWidth > 0) {
                    ctx.fillRect(this.x, this.y, openWidth, this.height);
                    ctx.fillRect(this.x + this.width - openWidth, this.y, openWidth, this.height);
                }
            }
        }
    }
    
    isBlocking() {
        return this.openAmount < 0.9; // Gate is blocking if not mostly open
    }
}

// Make classes globally available
if (typeof window !== 'undefined') {
    window.Wall = Wall;
    window.DestructibleWall = DestructibleWall;
    window.Gate = Gate;
}

// Export for module systems  
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Wall, DestructibleWall, Gate };
}