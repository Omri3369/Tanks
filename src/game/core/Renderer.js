class Renderer {
    constructor(canvas, gameState) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameState = gameState;
    }
    
    draw() {
        try {
            // Update screen shake
            this.updateScreenShake();
            
            // Apply camera transformation
            this.ctx.save();
            this.ctx.translate(this.gameState.camera.x + this.gameState.camera.shakeX, 
                             this.gameState.camera.y + this.gameState.camera.shakeY);
            this.ctx.scale(this.gameState.camera.scale, this.gameState.camera.scale);
            
            // Draw battlefield terrain with varied tiles and features
            this.drawBattlefieldTerrain();
            
            // Draw game entities
            this.drawEntities();
            
            // Draw training aiming helper (before restoring camera transformation)
            this.drawTrainingHelper();
            
            // Draw ring of fire on top
            this.drawRingOfFire();
            
            // Restore camera transformation for UI elements
            this.ctx.restore();
            
            // Draw UI overlays
            this.drawUI();
            
        } catch (error) {
            console.error('[DRAW ERROR] Critical error in draw function:', error);
            console.error('Stack trace:', error.stack);
        }
    }
    
    updateScreenShake() {
        if (typeof updateScreenShake !== 'undefined') {
            updateScreenShake();
        }
    }
    
    drawBattlefieldTerrain() {
        if (typeof drawBattlefieldTerrain !== 'undefined') {
            drawBattlefieldTerrain();
        }
    }
    
    drawEntities() {
        // Draw all game entities in proper order
        this.gameState.gates.forEach(gate => gate.draw());
        this.gameState.powerUps.forEach(powerUp => powerUp.draw());
        this.gameState.particles.forEach(particle => particle.draw());
        this.gameState.bullets.forEach(bullet => bullet.draw());
        this.gameState.mines.forEach(mine => mine.draw());
        this.gameState.targets.forEach(target => target.draw(this.ctx));
        this.gameState.drones.forEach(drone => drone.draw(this.ctx));
        this.gameState.tanks.forEach(tank => tank.draw());
        this.gameState.explosions.forEach(explosion => explosion.draw());
        
        // Draw and update teleport effects
        this.drawTeleportEffects();
    }
    
    drawTeleportEffects() {
        if (typeof drawTeleportEffects !== 'undefined') {
            drawTeleportEffects();
        }
    }
    
    drawTrainingHelper() {
        if (this.gameState.gameMode === 0 && CONFIG.TRAINING_AIMING_HELPER && this.gameState.tanks.length > 0) {
            const playerTank = this.gameState.tanks[0];
            if (playerTank && playerTank.alive) {
                this.drawAimingLine(playerTank);
                this.highlightTargetsInRange(playerTank);
            }
        }
    }
    
    drawRingOfFire() {
        if (this.gameState.ringOfFire) {
            this.gameState.ringOfFire.draw();
        }
    }
    
    drawUI() {
        // Draw grace period countdown
        this.drawGracePeriod();
        
        // Draw victory message
        this.drawVictoryMessage();
    }
    
    drawGracePeriod() {
        if (this.gameState.graceTimer > 0) {
            this.ctx.save();
            this.ctx.font = 'bold 48px Arial';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.textAlign = 'center';
            
            const seconds = Math.ceil(this.gameState.graceTimer / 60);
            const message = seconds > 1 ? `Get Ready! ${seconds}` : 'GO!';
            this.ctx.strokeText(message, this.canvas.width / 2, this.canvas.height / 2 - 50);
            this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2 - 50);
            
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillText('Find your position and prepare for battle!', this.canvas.width / 2, this.canvas.height / 2 + 20);
            
            this.ctx.restore();
        }
    }
    
    drawVictoryMessage() {
        if (this.gameState.gameWinner) {
            this.ctx.save();
            
            // Calculate animation progress based on zoom progress
            const timeSinceWin = Date.now() - this.gameState.camera.zoomStartTime;
            const fadeProgress = Math.min(timeSinceWin / 1000, 1.0); // Fade in over 1 second
            const pulseTime = timeSinceWin / 100; // Pulsing speed
            
            // Semi-transparent black overlay with fade-in
            this.ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * fadeProgress})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            if (fadeProgress > 0.3) { // Start text after 300ms
                // Text scaling and pulsing effects
                const textProgress = Math.min((fadeProgress - 0.3) / 0.7, 1.0);
                const pulseScale = 1 + Math.sin(pulseTime) * 0.1; // Gentle pulsing
                const textScale = 0.3 + (textProgress * 0.7 * pulseScale); // Scale from small to normal
                
                // Glow effect
                this.ctx.shadowColor = this.gameState.gameWinner.color;
                this.ctx.shadowBlur = 20 + Math.sin(pulseTime) * 10;
                
                // Main text
                const fontSize = 72 * textScale;
                this.ctx.font = `bold ${fontSize}px Arial`;
                this.ctx.fillStyle = this.gameState.gameWinner.color;
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 4 * textScale;
                this.ctx.textAlign = 'center';
                this.ctx.globalAlpha = textProgress;
                
                const message = `Player ${this.gameState.gameWinner.playerNum} Wins!`;
                const textY = this.canvas.height / 4; // Move text to upper quarter
                
                // Draw text with glow
                this.ctx.strokeText(message, this.canvas.width / 2, textY);
                this.ctx.fillText(message, this.canvas.width / 2, textY);
                
                // Additional sparkle effect
                if (textProgress > 0.8) {
                    this.ctx.shadowBlur = 0;
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.globalAlpha = (Math.sin(pulseTime * 2) + 1) / 2;
                    
                    // Draw sparkling stars around the text
                    for (let i = 0; i < 8; i++) {
                        const angle = (pulseTime + i) * 0.5;
                        const radius = 200 + Math.sin(pulseTime + i) * 50;
                        const starX = this.canvas.width / 2 + Math.cos(angle) * radius;
                        const starY = textY + Math.sin(angle) * radius * 0.3;
                        
                        this.ctx.font = `${20 + Math.sin(pulseTime + i) * 5}px Arial`;
                        this.ctx.fillText('✨', starX, starY);
                    }
                }
            }
            
            this.ctx.restore();
        }
    }
    
    drawAimingLine(tank) {
        const lineLength = 300;
        const startX = tank.x + Math.cos(tank.angle) * (tank.radius + 5);
        const startY = tank.y + Math.sin(tank.angle) * (tank.radius + 5);
        const endX = startX + Math.cos(tank.angle) * lineLength;
        const endY = startY + Math.sin(tank.angle) * lineLength;
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.6;
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        
        for (let i = 1; i <= 5; i++) {
            const markerX = startX + Math.cos(tank.angle) * (lineLength / 5) * i;
            const markerY = startY + Math.sin(tank.angle) * (lineLength / 5) * i;
            
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillStyle = '#00ff00';
            this.ctx.beginPath();
            this.ctx.arc(markerX, markerY, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.globalAlpha = 0.9;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${i * 60}px`, markerX, markerY - 8);
        }
        
        this.ctx.restore();
    }
    
    highlightTargetsInRange(tank) {
        this.gameState.targets.forEach(target => {
            if (!target.alive) return;
            
            const dx = target.x - tank.x;
            const dy = target.y - tank.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angleToTarget = Math.atan2(dy, dx);
            const angleDiff = Math.abs(tank.angle - angleToTarget);
            const normalizedAngleDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);
            
            // Highlight targets within a reasonable distance and angle
            if (distance < 400 && normalizedAngleDiff < Math.PI / 6) {
                this.ctx.save();
                this.ctx.globalAlpha = 0.7;
                this.ctx.strokeStyle = '#ffff00';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([5, 5]);
                
                this.ctx.beginPath();
                this.ctx.arc(target.x, target.y, target.size + 10, 0, Math.PI * 2);
                this.ctx.stroke();
                
                // Distance indicator
                this.ctx.globalAlpha = 0.9;
                this.ctx.fillStyle = '#ffff00';
                this.ctx.font = '14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`${Math.round(distance)}px`, target.x, target.y - target.size - 15);
                
                this.ctx.restore();
            }
        });
    }
}

// Make it globally available
if (typeof window !== 'undefined') {
    window.Renderer = Renderer;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}