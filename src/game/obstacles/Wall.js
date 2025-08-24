// Wall - Basic wall obstacle that blocks movement and bullets

class Wall {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    draw() {
        // Draw shadow first
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x + 2, this.y + 2, this.width, this.height);
        
        // Draw wall sprite tiled at appropriate size
        const tileSize = 32; // Use consistent tile size
        
        for (let x = 0; x < this.width; x += tileSize) {
            for (let y = 0; y < this.height; y += tileSize) {
                const drawWidth = Math.min(tileSize, this.width - x);
                const drawHeight = Math.min(tileSize, this.height - y);
                
                ctx.drawImage(
                    wallImage,
                    this.x + x, this.y + y, drawWidth, drawHeight
                );
            }
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Wall;
}