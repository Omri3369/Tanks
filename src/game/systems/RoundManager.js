class RoundManager {
    constructor(gameState) {
        this.gameState = gameState;
    }
    
    resetRound() {
        // Clear all bullets, particles, explosions and mines
        this.gameState.clearEntities();
        
        // Set grace period (3 seconds at 60fps)
        this.gameState.graceTimer = 180;
        
        // Regenerate terrain for new round
        if (typeof generateTerrainTiles !== 'undefined') {
            generateTerrainTiles();
        }
        
        // Reset ring of fire
        this.gameState.ringOfFire = new RingOfFire();
        
        // Reset power-ups to new positions
        this.gameState.powerUps = [];
        
        for (let i = 0; i < 2; i++) {
            const powerUpPos = this.generateSafeItemPosition();
            this.gameState.powerUps.push(new PowerUp(powerUpPos.x, powerUpPos.y));
        }
        
        // Respawn all tanks at random positions
        this.gameState.tanks.forEach(tank => {
            const spawnPos = this.generateSafeSpawnPosition();
            tank.alive = true;
            tank.x = spawnPos.x;
            tank.y = spawnPos.y;
            tank.angle = Math.random() * Math.PI * 2;
            tank.powerUp = null;
            tank.powerUpTime = 0;
            tank.specialAmmo = 0; // Reset special ammo
        });
    }
    
    startWinnerZoom(winner) {
        this.gameState.camera.isZooming = true;
        this.gameState.camera.zoomStartTime = Date.now();
        this.gameState.camera.targetScale = CONFIG.WINNER_ZOOM_SCALE;
        this.gameState.camera.targetX = canvas.width / 2 - winner.x * CONFIG.WINNER_ZOOM_SCALE;
        this.gameState.camera.targetY = canvas.height / 2 - winner.y * CONFIG.WINNER_ZOOM_SCALE;
    }
    
    resetCamera() {
        this.gameState.camera.scale = 1.0;
        this.gameState.camera.targetScale = 1.0;
        this.gameState.camera.x = 0;
        this.gameState.camera.y = 0;
        this.gameState.camera.targetX = 0;
        this.gameState.camera.targetY = 0;
        this.gameState.camera.isZooming = false;
        this.gameState.camera.zoomStartTime = 0;
        this.gameState.camera.shakeAmount = 0;
        this.gameState.camera.shakeX = 0;
        this.gameState.camera.shakeY = 0;
    }
    
    addScreenShake(amount) {
        this.gameState.camera.shakeAmount = Math.max(this.gameState.camera.shakeAmount, amount);
    }
    
    checkGameOver() {
        const aliveTanks = this.gameState.tanks.filter(t => t.alive);
        if (aliveTanks.length === 1 && !this.gameState.roundResetting && this.gameState.gameMode !== 0) {
            return aliveTanks[0];
        }
        return null;
    }
    
    handleRoundWin(winner) {
        this.gameState.roundResetting = true;
        this.gameState.scores[`player${winner.playerNum}`]++;
        
        const scoreElement = document.getElementById(`score${winner.playerNum}`);
        if (scoreElement) {
            scoreElement.textContent = this.gameState.scores[`player${winner.playerNum}`];
        }
        
        // Store winner for display
        this.gameState.gameWinner = winner;
        
        // Start zoom effect on winner
        this.startWinnerZoom(winner);
        
        // Show winner message and reset after delay
        setTimeout(() => {
            try {
                this.gameState.gameWinner = null;
                this.resetCamera();
                this.resetRound();
                this.gameState.roundResetting = false;
            } catch (error) {
                console.error('[ROUND MANAGER ERROR] Game over cleanup failed:', error);
            }
        }, 3000);
    }
    
    generateSafeSpawnPosition() {
        // Use global function if available, otherwise return default
        if (typeof generateSafeSpawnPosition !== 'undefined') {
            return generateSafeSpawnPosition();
        }
        
        // Fallback safe spawn logic
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            const x = 100 + Math.random() * (canvas.width - 200);
            const y = 100 + Math.random() * (canvas.height - 200);
            
            let validPosition = true;
            
            // Check distance from other tanks
            for (let tank of this.gameState.tanks) {
                const distance = Math.sqrt(Math.pow(x - tank.x, 2) + Math.pow(y - tank.y, 2));
                if (distance < CONFIG.SPAWN_MIN_DISTANCE) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                return { x, y };
            }
            
            attempts++;
        }
        
        // Fallback to center if no safe position found
        return { x: canvas.width / 2, y: canvas.height / 2 };
    }
    
    generateSafeItemPosition() {
        // Use global function if available, otherwise return default
        if (typeof generateSafeItemPosition !== 'undefined') {
            return generateSafeItemPosition();
        }
        
        // Fallback safe item spawn logic
        let attempts = 0;
        const maxAttempts = 30;
        
        while (attempts < maxAttempts) {
            const x = 50 + Math.random() * (canvas.width - 100);
            const y = 50 + Math.random() * (canvas.height - 100);
            
            let validPosition = true;
            
            // Check distance from tanks
            for (let tank of this.gameState.tanks) {
                const distance = Math.sqrt(Math.pow(x - tank.x, 2) + Math.pow(y - tank.y, 2));
                if (distance < 100) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                return { x, y };
            }
            
            attempts++;
        }
        
        // Fallback position
        return { x: canvas.width / 3, y: canvas.height / 3 };
    }
    
    initializeRound() {
        // Set grace period
        this.gameState.graceTimer = CONFIG.GRACE_PERIOD || 180;
        
        // Initialize ring of fire
        this.gameState.ringOfFire = new RingOfFire();
        
        // Clear all entities
        this.gameState.clearEntities();
    }
}

// Make it globally available
if (typeof window !== 'undefined') {
    window.RoundManager = RoundManager;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoundManager;
}