class GameLoop {
    constructor(gameState, renderer) {
        this.gameState = gameState;
        this.renderer = renderer;
        this.isRunning = false;
    }
    
    start() {
        this.isRunning = true;
        this.loop();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    loop() {
        try {
            if (!this.isRunning) return;
            
            this.update();
            this.renderer.draw();
            requestAnimationFrame(() => this.loop());
        } catch (error) {
            console.error('[GAME LOOP ERROR] Critical error in main game loop:', error);
            console.error('Stack trace:', error.stack);
            
            // Try to continue the game loop to prevent complete freeze
            try {
                requestAnimationFrame(() => this.loop());
            } catch (retryError) {
                console.error('[GAME LOOP ERROR] Failed to restart game loop:', retryError);
            }
        }
    }
    
    update() {
        try {
            // Update grace timer
            try {
                if (this.gameState.graceTimer > 0) {
                    this.gameState.graceTimer--;
                }
            } catch (error) {
                console.error('[UPDATE ERROR] Grace timer update failed:', error);
            }
            
            // Update tanks, targets, and drones
            try {
                this.gameState.tanks.forEach(tank => {
                    try {
                        tank.update();
                    } catch (error) {
                        console.error('[UPDATE ERROR] Tank update failed:', error);
                    }
                });
                
                this.gameState.targets.forEach(target => {
                    try {
                        target.update();
                    } catch (error) {
                        console.error('[UPDATE ERROR] Target update failed:', error);
                    }
                });
                
                this.gameState.drones.forEach(drone => {
                    try {
                        drone.update();
                    } catch (error) {
                        console.error('[UPDATE ERROR] Drone update failed:', error);
                    }
                });
                
                // Remove dead drones
                this.gameState.drones = this.gameState.drones.filter(drone => drone.alive);
            } catch (error) {
                console.error('[UPDATE ERROR] Entity updates failed:', error);
            }
            
            // Update UI elements
            try {
                this.updateUI();
            } catch (error) {
                console.error('[UPDATE ERROR] UI updates failed:', error);
            }
            
            // Update ring of fire
            try {
                if (this.gameState.ringOfFire) {
                    this.gameState.ringOfFire.update();
                }
            } catch (error) {
                console.error('[UPDATE ERROR] Ring of fire update failed:', error);
            }
            
            // Update camera
            try {
                this.updateCamera();
            } catch (error) {
                console.error('[UPDATE ERROR] Camera update failed:', error);
            }
            
            // Check for game over
            try {
                this.checkGameOver();
            } catch (error) {
                console.error('[UPDATE ERROR] Game over check failed:', error);
            }
            
            // Update bullets and collisions
            try {
                this.updateBullets();
            } catch (error) {
                console.error('[UPDATE ERROR] Bullet system update failed:', error);
            }
            
            // Update powerups
            try {
                this.updatePowerUps();
            } catch (error) {
                console.error('[UPDATE ERROR] PowerUp system failed:', error);
            }
            
            // Update particles
            try {
                this.updateParticles();
            } catch (error) {
                console.error('[UPDATE ERROR] Particle system failed:', error);
            }
            
            // Update explosions
            try {
                this.updateExplosions();
            } catch (error) {
                console.error('[UPDATE ERROR] Explosion system failed:', error);
            }
            
            // Update mines
            try {
                this.updateMines();
            } catch (error) {
                console.error('[UPDATE ERROR] Mine system failed:', error);
            }
            
        } catch (error) {
            console.error('[UPDATE ERROR] Main update loop failed:', error);
        }
    }
    
    updateUI() {
        // Update reload bars and ammo displays - these need to access DOM directly
        if (typeof updateReloadBars !== 'undefined') {
            updateReloadBars();
        }
        if (typeof updateAmmoDisplays !== 'undefined') {
            updateAmmoDisplays();
        }
    }
    
    updateCamera() {
        if (typeof updateCamera !== 'undefined') {
            updateCamera();
        }
    }
    
    checkGameOver() {
        const aliveTanks = this.gameState.tanks.filter(t => t.alive);
        if (aliveTanks.length === 1 && !this.gameState.roundResetting && this.gameState.gameMode !== 0) {
            this.gameState.roundResetting = true;
            const winner = aliveTanks[0];
            this.gameState.scores[`player${winner.playerNum}`]++;
            const scoreElement = document.getElementById(`score${winner.playerNum}`);
            if (scoreElement) {
                scoreElement.textContent = this.gameState.scores[`player${winner.playerNum}`];
            }
            
            // Store winner for display
            this.gameState.gameWinner = winner;
            
            // Start zoom effect on winner
            if (typeof startWinnerZoom !== 'undefined') {
                startWinnerZoom(winner);
            }
            
            // Show winner message
            setTimeout(() => {
                try {
                    this.gameState.gameWinner = null;
                    if (typeof resetCamera !== 'undefined') {
                        resetCamera();
                    }
                    if (typeof resetRound !== 'undefined') {
                        resetRound();
                    }
                    this.gameState.roundResetting = false;
                } catch (error) {
                    console.error('[UPDATE ERROR] Game over cleanup failed:', error);
                }
            }, 3000);
        }
    }
    
    updateBullets() {
        this.gameState.bullets = this.gameState.bullets.filter(bullet => {
            try {
                const alive = bullet.update();
                
                for (let tank of this.gameState.tanks) {
                    try {
                        if (bullet.checkTankCollision(tank)) {
                            tank.destroy(bullet.owner);
                            return false;
                        }
                    } catch (error) {
                        console.error('[UPDATE ERROR] Bullet-tank collision check failed:', error);
                    }
                }
                
                // Check target collisions
                for (let target of this.gameState.targets) {
                    try {
                        if (bullet.checkTargetCollision(target)) {
                            target.takeDamage();
                            return false;
                        }
                    } catch (error) {
                        console.error('[UPDATE ERROR] Bullet-target collision check failed:', error);
                    }
                }
                
                // Check drone collisions
                for (let drone of this.gameState.drones) {
                    try {
                        if (bullet.checkDroneCollision && bullet.checkDroneCollision(drone)) {
                            drone.takeDamage();
                            return false;
                        }
                    } catch (error) {
                        console.error('[UPDATE ERROR] Bullet-drone collision check failed:', error);
                    }
                }
                
                return alive;
            } catch (error) {
                console.error('[UPDATE ERROR] Bullet update failed:', error);
                return false; // Remove problematic bullet
            }
        });
    }
    
    updatePowerUps() {
        this.gameState.powerUps.forEach(powerUp => {
            try {
                powerUp.update();
                this.gameState.tanks.forEach(tank => {
                    try {
                        powerUp.checkCollision(tank);
                    } catch (error) {
                        console.error('[UPDATE ERROR] PowerUp collision check failed:', error);
                    }
                });
            } catch (error) {
                console.error('[UPDATE ERROR] PowerUp update failed:', error);
            }
        });
    }
    
    updateParticles() {
        this.gameState.particles = this.gameState.particles.filter(particle => {
            try {
                if (particle instanceof SmokeParticle) {
                    return particle.update();
                }
                return particle.update();
            } catch (error) {
                console.error('[UPDATE ERROR] Particle update failed:', error);
                return false; // Remove problematic particle
            }
        });
    }
    
    updateExplosions() {
        this.gameState.explosions = this.gameState.explosions.filter(explosion => {
            try {
                return explosion.update();
            } catch (error) {
                console.error('[UPDATE ERROR] Explosion update failed:', error);
                return false;
            }
        });
    }
    
    updateMines() {
        this.gameState.mines.forEach(mine => {
            try {
                mine.update();
                
                // Check mine collisions with tanks
                this.gameState.tanks.forEach(tank => {
                    try {
                        if (mine.checkTankCollision && mine.checkTankCollision(tank)) {
                            mine.explode();
                            tank.destroy(null); // No specific owner for mine kills
                        }
                    } catch (error) {
                        console.error('[UPDATE ERROR] Mine collision check failed:', error);
                    }
                });
            } catch (error) {
                console.error('[UPDATE ERROR] Mine update failed:', error);
            }
        });
        
        // Remove exploded mines
        this.gameState.mines = this.gameState.mines.filter(mine => mine.alive);
    }
}

// Make it globally available
if (typeof window !== 'undefined') {
    window.GameLoop = GameLoop;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameLoop;
}