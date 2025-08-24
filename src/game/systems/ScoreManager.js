// Score Manager System

class ScoreManager {
    constructor() {
        this.scores = {};
        this.kills = {};
    }
    
    initialize(tanks) {
        // Initialize scores for all tanks
        tanks.forEach(tank => {
            this.scores[`player${tank.playerNum}`] = 0;
            this.kills[`player${tank.playerNum}`] = 0;
        });
    }
    
    createScoreBoard(tanks) {
        const scoreBoard = document.getElementById('scoreBoard');
        if (!scoreBoard) return;
        
        scoreBoard.innerHTML = '';
        
        tanks.forEach(tank => {
            const tankColor = tank.color;
            const tankName = tank.isAI ? `AI ${tank.playerNum}` : `Player ${tank.playerNum}`;
            
            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'score';
            scoreDiv.innerHTML = `
                <div class="score-name" style="color: ${tankColor};">${tankName}</div>
                <div class="score-stats">
                    <div>Wins: <span id="score${tank.playerNum}">0</span></div>
                    <div>Kills: <span id="kills${tank.playerNum}">0</span></div>
                    <div><span id="powerup${tank.playerNum}">🔸</span> <span id="ammo${tank.playerNum}">${tank.specialAmmo}</span>/${tank.maxSpecialAmmo}</div>
                </div>
                <div class="reload-bar-container">
                    <div class="reload-bar" id="reload${tank.playerNum}"></div>
                </div>
            `;
            scoreBoard.appendChild(scoreDiv);
        });
        
        // Initialize scores
        this.initialize(tanks);
    }
    
    updateReloadBars(tanks) {
        tanks.forEach(tank => {
            const reloadBar = document.getElementById(`reload${tank.playerNum}`);
            if (reloadBar && tank.alive) {
                const reloadPercent = Math.max(0, ((60 - tank.reloadTime) / 60) * 100);
                reloadBar.style.width = `${reloadPercent}%`;
            }
        });
    }
    
    updateAmmoDisplays(tanks) {
        tanks.forEach(tank => {
            const ammoElement = document.getElementById(`ammo${tank.playerNum}`);
            const powerupElement = document.getElementById(`powerup${tank.playerNum}`);
            
            if (ammoElement) {
                ammoElement.textContent = tank.specialAmmo;
            }
            
            if (powerupElement) {
                powerupElement.textContent = this.getPowerUpSymbol(tank.powerUp);
            }
        });
    }
    
    getPowerUpSymbol(powerUpType) {
        switch(powerUpType) {
            case 'scatter': return '💥'; // Explosion/multiple bullets
            case 'laser': return '⚡'; // Lightning for laser
            case 'rocket': return '🚀'; // Rocket
            case 'explosive': return '💣'; // Bomb
            case 'piercing': return '🏹'; // Arrow for piercing
            case 'mine': return '💎'; // Diamond for mine
            case 'drone': return '🤖'; // Robot for drone
            case 'freeze': return '❄️'; // Snowflake for freeze
            case 'homing': return '🎯'; // Target for homing
            case 'flamethrower': return '🔥'; // Fire for flamethrower
            case 'railgun': return '⚙️'; // Gear for railgun
            case 'chain': return '⛓️'; // Chain for chain lightning
            case 'boomerang': return '🪃'; // Boomerang
            case 'vortex': return '🌀'; // Vortex
            case 'teleport': return '🌌'; // Galaxy for teleport
            case 'shield': return '🛡️'; // Shield
            case 'bouncer': return '⚾'; // Ball for bouncer
            case 'emp': return '⚡'; // Lightning for EMP
            case 'acid': return '🧪'; // Test tube for acid
            case 'swarm': return '🐝'; // Bee for swarm
            case 'phantom': return '👻'; // Ghost for phantom
            case 'ricochet': return '🎱'; // 8-ball for ricochet
            case 'tornado': return '🌪️'; // Tornado
            case 'blackhole': return '⚫'; // Black circle for black hole
            case 'mirror': return '🪞'; // Mirror
            case 'cluster': return '💣'; // Bomb for cluster
            case 'lightning': return '⚡'; // Lightning
            default: return '🔸'; // Default diamond when no power-up
        }
    }
    
    addWin(playerNum) {
        const scoreKey = `player${playerNum}`;
        if (this.scores[scoreKey] !== undefined) {
            this.scores[scoreKey]++;
            const scoreElement = document.getElementById(`score${playerNum}`);
            if (scoreElement) {
                scoreElement.textContent = this.scores[scoreKey];
            }
        }
    }
    
    addKill(playerNum) {
        const killKey = `player${playerNum}`;
        if (this.kills[killKey] !== undefined) {
            this.kills[killKey]++;
            const killElement = document.getElementById(`kills${playerNum}`);
            if (killElement) {
                killElement.textContent = this.kills[killKey];
            }
        }
    }
    
    getScore(playerNum) {
        return this.scores[`player${playerNum}`] || 0;
    }
    
    getKills(playerNum) {
        return this.kills[`player${playerNum}`] || 0;
    }
    
    reset() {
        // Reset all scores and kills
        Object.keys(this.scores).forEach(key => {
            this.scores[key] = 0;
        });
        Object.keys(this.kills).forEach(key => {
            this.kills[key] = 0;
        });
        
        // Update display
        for (let key in this.scores) {
            const playerNum = key.replace('player', '');
            const scoreElement = document.getElementById(`score${playerNum}`);
            const killElement = document.getElementById(`kills${playerNum}`);
            if (scoreElement) scoreElement.textContent = '0';
            if (killElement) killElement.textContent = '0';
        }
    }
}

// Create global instance
const scoreManager = new ScoreManager();

// Export wrapper functions for backward compatibility
window.scores = scoreManager.scores;
window.kills = scoreManager.kills;

window.createScoreBoard = function() {
    const tanks = window.tanks || [];
    scoreManager.createScoreBoard(tanks);
    // Update global references
    window.scores = scoreManager.scores;
    window.kills = scoreManager.kills;
};

window.updateReloadBars = function() {
    const tanks = window.tanks || [];
    scoreManager.updateReloadBars(tanks);
};

window.updateAmmoDisplays = function() {
    const tanks = window.tanks || [];
    scoreManager.updateAmmoDisplays(tanks);
};

window.getPowerUpSymbol = function(powerUpType) {
    return scoreManager.getPowerUpSymbol(powerUpType);
};

// Export the manager for direct access if needed
window.scoreManager = scoreManager;