class TankCombat {
    constructor(tank) {
        this.tank = tank;
    }

    shoot() {
        if (this.tank.reloadTime > 0) return;
        
        // Check if we have a power-up and special ammo
        if (this.tank.powerUp && this.tank.specialAmmo <= 0) return;
        
        const bulletX = this.tank.x + Math.cos(this.tank.angle) * (TANK_SIZE + 5);
        const bulletY = this.tank.y + Math.sin(this.tank.angle) * (TANK_SIZE + 5);
        
        if (this.tank.powerUp === 'scatter') {
            // Create 5 bullets with wider spread for more destruction
            for (let i = -2; i <= 2; i++) {
                bullets.push(new Bullet(
                    bulletX, 
                    bulletY, 
                    this.tank.angle + i * 0.4, 
                    this.tank.playerNum,
                    'scatter'
                ));
            }
            this.tank.specialAmmo--;
            if (this.tank.specialAmmo <= 0) {
                this.tank.powerUpTime = 0;
                this.tank.powerUp = null;
            }
        } else if (this.tank.powerUp === 'explosive') {
            bullets.push(new Bullet(
                bulletX, 
                bulletY, 
                this.tank.angle, 
                this.tank.playerNum,
                'explosive'
            ));
            this.tank.specialAmmo--;
            if (this.tank.specialAmmo <= 0) {
                this.tank.powerUpTime = 0;
                this.tank.powerUp = null;
            }
        } else if (this.tank.powerUp === 'piercing') {
            bullets.push(new Bullet(
                bulletX, 
                bulletY, 
                this.tank.angle, 
                this.tank.playerNum,
                'piercing'
            ));
            this.tank.specialAmmo--;
            if (this.tank.specialAmmo <= 0) {
                this.tank.powerUpTime = 0;
                this.tank.powerUp = null;
            }
        } else if (this.tank.powerUp === 'mine') {
            // Drop a mine at current location
            mines.push(new Mine(this.tank.x, this.tank.y, this.tank.playerNum));
            this.tank.specialAmmo--;
            if (this.tank.specialAmmo <= 0) {
                this.tank.powerUpTime = 0;
                this.tank.powerUp = null;
            }
        } else {
            // Regular bullet - infinite ammo
            bullets.push(new Bullet(
                bulletX, 
                bulletY, 
                this.tank.angle, 
                this.tank.playerNum,
                this.tank.powerUp
            ));
        }
        
        // Set reload time for all shots
        this.tank.reloadTime = CONFIG.TANK_RELOAD_TIME;
    }

    updatePowerUps() {
        // Update power-up timer
        if (this.tank.powerUpTime > 0) {
            this.tank.powerUpTime--;
            if (this.tank.powerUpTime === 0) {
                this.tank.powerUp = null;
            }
        }
        
        // Update reload timer
        if (this.tank.reloadTime > 0) this.tank.reloadTime--;
    }

    applyPowerUp(type) {
        this.tank.powerUp = type;
        this.tank.powerUpTime = CONFIG.POWER_UP_DURATION;
        this.tank.specialAmmo = this.tank.maxSpecialAmmo;
        
        // Show pickup notification
        const powerUpIcons = {
            'scatter': '📡',
            'explosive': '💥', 
            'piercing': '🔍',
            'mine': '💣',
            'laser': '⚡',
            'rocket': '🚀'
        };
        
        this.tank.pickupNotification = powerUpIcons[type] || '⭐';
        this.tank.pickupTimer = 120; // 2 seconds at 60fps
    }

    canShoot() {
        return this.tank.reloadTime <= 0 && 
               (!this.tank.powerUp || this.tank.specialAmmo > 0);
    }

    getRemainingAmmo() {
        if (!this.tank.powerUp) return Infinity; // Regular bullets are infinite
        return this.tank.specialAmmo;
    }

    getReloadProgress() {
        if (this.tank.reloadTime <= 0) return 1; // Fully reloaded
        return 1 - (this.tank.reloadTime / CONFIG.TANK_RELOAD_TIME);
    }
}