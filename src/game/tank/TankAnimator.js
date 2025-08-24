class TankAnimator {
    constructor(tank) {
        this.tank = tank;
    }

    update() {
        // Update animation properties
        const distanceMoved = Math.sqrt((this.tank.x - this.tank.lastX) ** 2 + (this.tank.y - this.tank.lastY) ** 2);
        this.tank.isMoving = distanceMoved > 0.1;
        
        if (this.tank.isMoving) {
            // Animate wheel rotation based on movement
            this.tank.wheelRotation += distanceMoved * 0.2;
            this.tank.treadOffset += distanceMoved * 0.3;
            
            // Engine bob effect when moving
            this.tank.engineBob = Math.sin(Date.now() * 0.02) * 0.5;
        } else {
            this.tank.engineBob *= 0.9; // Gradual stop
        }
        
        this.tank.lastX = this.tank.x;
        this.tank.lastY = this.tank.y;
        
        // Update trail
        this.updateTrail();
        
        // Update pickup notification
        if (this.tank.pickupTimer > 0) {
            this.tank.pickupTimer--;
            if (this.tank.pickupTimer === 0) {
                this.tank.pickupNotification = null;
            }
        }
    }

    updateTrail() {
        // Update trail fade
        this.tank.trail.forEach(point => {
            point.opacity -= 0.015; // Fade out over time
        });
        
        // Remove faded trail points
        this.tank.trail = this.tank.trail.filter(point => point.opacity > 0);
        
        // Add new trail point if moving
        if (this.tank.isMoving && this.tank.speed !== 0) {
            this.tank.trailTimer++;
            if (this.tank.trailTimer >= this.tank.trailInterval) {
                this.tank.trailTimer = 0;
                
                // Add left and right track positions
                const trackOffset = TANK_SIZE * 0.4;
                const leftX = this.tank.x - Math.sin(this.tank.angle) * trackOffset;
                const leftY = this.tank.y + Math.cos(this.tank.angle) * trackOffset;
                const rightX = this.tank.x + Math.sin(this.tank.angle) * trackOffset;
                const rightY = this.tank.y - Math.cos(this.tank.angle) * trackOffset;
                
                this.tank.trail.push({
                    leftX, leftY,
                    rightX, rightY,
                    angle: this.tank.angle,
                    opacity: 0.4
                });
                
                // Limit trail length
                if (this.tank.trail.length > this.tank.maxTrailLength) {
                    this.tank.trail.shift();
                }
            }
        }
    }

    resetAnimation() {
        this.tank.wheelRotation = 0;
        this.tank.treadOffset = 0;
        this.tank.engineBob = 0;
        this.tank.isMoving = false;
        this.tank.trail = [];
        this.tank.trailTimer = 0;
    }

    createPickupNotification(icon) {
        this.tank.pickupNotification = icon;
        this.tank.pickupTimer = 120; // 2 seconds at 60fps
    }

    isAnimating() {
        return this.tank.isMoving || this.tank.engineBob !== 0 || this.tank.trail.length > 0;
    }
}