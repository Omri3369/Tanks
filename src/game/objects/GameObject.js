class GameObject {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.alive = true;
        this.id = GameObject.generateId();
    }
    
    static generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    update(deltaTime) {
        // Override in subclasses
    }
    
    draw(ctx) {
        // Override in subclasses
    }
    
    destroy() {
        this.alive = false;
    }
    
    distanceTo(other) {
        return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
    }
    
    angleTo(other) {
        return Math.atan2(other.y - this.y, other.x - this.x);
    }
    
    checkCollision(other, radius1, radius2) {
        const distance = this.distanceTo(other);
        return distance < (radius1 + radius2);
    }
    
    isInBounds(width, height) {
        return this.x >= 0 && this.x <= width && this.y >= 0 && this.y <= height;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameObject;
}