// Camera System Module

class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.scale = 1.0;
        this.targetScale = 1.0;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.isZooming = false;
        this.zoomStartTime = 0;
        this.shakeAmount = 0;
        this.shakeX = 0;
        this.shakeY = 0;
    }
    
    update() {
        this.updateZoom();
        this.updateShake();
    }
    
    updateZoom() {
        if (!this.isZooming) return;
        
        const elapsed = Date.now() - this.zoomStartTime;
        const progress = Math.min(elapsed / CONFIG.WINNER_ZOOM_TRANSITION_TIME, 1.0);
        
        // Ease-in-out cubic
        const easedProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        // Interpolate scale and position
        this.scale = 1.0 + (this.targetScale - 1.0) * easedProgress;
        this.x = this.targetX * easedProgress;
        this.y = this.targetY * easedProgress;
        
        // Stop zooming when transition complete
        if (progress >= 1.0) {
            this.isZooming = false;
        }
    }
    
    updateShake() {
        if (this.shakeAmount > 0) {
            this.shakeX = (Math.random() - 0.5) * this.shakeAmount * 2;
            this.shakeY = (Math.random() - 0.5) * this.shakeAmount * 2;
            this.shakeAmount *= 0.9; // Decay shake
            if (this.shakeAmount < 0.1) {
                this.shakeAmount = 0;
                this.shakeX = 0;
                this.shakeY = 0;
            }
        }
    }
    
    startWinnerZoom(winner) {
        this.targetScale = CONFIG.WINNER_ZOOM_SCALE;
        this.targetX = this.canvas.width / 2 - winner.x * CONFIG.WINNER_ZOOM_SCALE;
        this.targetY = this.canvas.height / 2 - winner.y * CONFIG.WINNER_ZOOM_SCALE;
        this.isZooming = true;
        this.zoomStartTime = Date.now();
    }
    
    reset() {
        this.scale = 1.0;
        this.targetScale = 1.0;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.isZooming = false;
        this.zoomStartTime = 0;
        this.shakeAmount = 0;
        this.shakeX = 0;
        this.shakeY = 0;
    }
    
    addShake(amount) {
        this.shakeAmount = Math.max(this.shakeAmount, amount);
    }
    
    applyTransform(ctx) {
        ctx.translate(this.x + this.shakeX, this.y + this.shakeY);
        ctx.scale(this.scale, this.scale);
    }
}

// Create global camera instance for backward compatibility
if (typeof canvas !== 'undefined') {
    window.camera = new Camera(canvas);
} else {
    // Fallback for when canvas is not yet defined
    window.camera = {
        scale: 1.0,
        targetScale: 1.0,
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        isZooming: false,
        zoomStartTime: 0,
        shakeAmount: 0,
        shakeX: 0,
        shakeY: 0
    };
}

// Export wrapper functions for backward compatibility
window.updateCamera = function() {
    if (window.camera && window.camera.update) {
        window.camera.update();
    } else if (window.camera) {
        // Fallback implementation
        if (!camera.isZooming) return;
        
        const elapsed = Date.now() - camera.zoomStartTime;
        const progress = Math.min(elapsed / CONFIG.WINNER_ZOOM_TRANSITION_TIME, 1.0);
        
        // Ease-in-out cubic
        const easedProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        // Interpolate scale and position
        camera.scale = 1.0 + (camera.targetScale - 1.0) * easedProgress;
        camera.x = camera.targetX * easedProgress;
        camera.y = camera.targetY * easedProgress;
        
        // Stop zooming when transition complete
        if (progress >= 1.0) {
            camera.isZooming = false;
        }
    }
};

window.startWinnerZoom = function(winner) {
    if (window.camera && window.camera.startWinnerZoom) {
        window.camera.startWinnerZoom(winner);
    } else if (window.camera) {
        camera.targetScale = CONFIG.WINNER_ZOOM_SCALE;
        camera.targetX = canvas.width / 2 - winner.x * CONFIG.WINNER_ZOOM_SCALE;
        camera.targetY = canvas.height / 2 - winner.y * CONFIG.WINNER_ZOOM_SCALE;
        camera.isZooming = true;
        camera.zoomStartTime = Date.now();
    }
};

window.resetCamera = function() {
    if (window.camera && window.camera.reset) {
        window.camera.reset();
    } else if (window.camera) {
        camera.scale = 1.0;
        camera.targetScale = 1.0;
        camera.x = 0;
        camera.y = 0;
        camera.targetX = 0;
        camera.targetY = 0;
        camera.isZooming = false;
        camera.zoomStartTime = 0;
    }
};

window.addScreenShake = function(amount) {
    if (window.camera && window.camera.addShake) {
        window.camera.addShake(amount);
    } else if (window.camera) {
        camera.shakeAmount = Math.max(camera.shakeAmount, amount);
    }
};

window.updateScreenShake = function() {
    if (window.camera && window.camera.updateShake) {
        window.camera.updateShake();
    } else if (window.camera) {
        if (camera.shakeAmount > 0) {
            camera.shakeX = (Math.random() - 0.5) * camera.shakeAmount * 2;
            camera.shakeY = (Math.random() - 0.5) * camera.shakeAmount * 2;
            camera.shakeAmount *= 0.9; // Decay shake
            if (camera.shakeAmount < 0.1) {
                camera.shakeAmount = 0;
                camera.shakeX = 0;
                camera.shakeY = 0;
            }
        }
    }
};