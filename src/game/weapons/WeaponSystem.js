class WeaponSystem {
    constructor() {
        this.weapons = new Map();
        this.initializeWeapons();
    }
    
    initializeWeapons() {
        // Register all weapon types
        this.registerWeapon('normal', NormalWeapon);
        this.registerWeapon('scatter', ScatterWeapon);
        this.registerWeapon('laser', LaserWeapon);
        this.registerWeapon('rocket', RocketWeapon);
        this.registerWeapon('explosive', ExplosiveWeapon);
        this.registerWeapon('piercing', PiercingWeapon);
        this.registerWeapon('mine', MineWeapon);
        this.registerWeapon('homing', HomingWeapon);
        this.registerWeapon('flamethrower', FlamethrowerWeapon);
        this.registerWeapon('freeze', FreezeWeapon);
        this.registerWeapon('railgun', RailgunWeapon);
        this.registerWeapon('chain', ChainLightningWeapon);
        this.registerWeapon('boomerang', BoomerangWeapon);
        this.registerWeapon('vortex', VortexWeapon);
        this.registerWeapon('teleport', TeleportWeapon);
        this.registerWeapon('shield', ShieldWeapon);
        this.registerWeapon('bouncer', BouncerWeapon);
        this.registerWeapon('emp', EMPWeapon);
        this.registerWeapon('acid', AcidWeapon);
        this.registerWeapon('swarm', SwarmWeapon);
        this.registerWeapon('phantom', PhantomWeapon);
        this.registerWeapon('ricochet', RicochetWeapon);
        this.registerWeapon('tornado', TornadoWeapon);
        this.registerWeapon('blackhole', BlackHoleWeapon);
        this.registerWeapon('mirror', MirrorWeapon);
        this.registerWeapon('cluster', ClusterWeapon);
        this.registerWeapon('lightning', LightningWeapon);
    }
    
    registerWeapon(type, weaponClass) {
        this.weapons.set(type, weaponClass);
    }
    
    createBullets(x, y, angle, owner, weaponType, tank) {
        const WeaponClass = this.weapons.get(weaponType) || this.weapons.get('normal');
        const weapon = new WeaponClass();
        return weapon.fire(x, y, angle, owner, tank);
    }
    
    isWeaponEnabled(type) {
        return CONFIG.POWERUP_TYPES[type]?.enabled ?? false;
    }
    
    getEnabledWeapons() {
        return Object.keys(CONFIG.POWERUP_TYPES)
            .filter(type => CONFIG.POWERUP_TYPES[type].enabled);
    }
}

// Base Weapon Class
class Weapon {
    constructor() {
        this.type = 'normal';
        this.ammoConsumption = 1;
    }
    
    fire(x, y, angle, owner, tank) {
        return [new Bullet(x, y, angle, owner, this.type)];
    }
}

// Normal Weapon
class NormalWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'normal';
        this.ammoConsumption = 0; // Infinite ammo
    }
}

// Scatter Shot
class ScatterWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'scatter';
    }
    
    fire(x, y, angle, owner, tank) {
        const bullets = [];
        for (let i = -2; i <= 2; i++) {
            bullets.push(new Bullet(x, y, angle + i * 0.4, owner, 'scatter'));
        }
        return bullets;
    }
}

// Laser Beam
class LaserWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'laser';
    }
    
    fire(x, y, angle, owner, tank) {
        return [new Bullet(x, y, angle, owner, 'laser')];
    }
}

// Rocket
class RocketWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'rocket';
    }
    
    fire(x, y, angle, owner, tank) {
        return [new Bullet(x, y, angle, owner, 'rocket')];
    }
}

// Explosive
class ExplosiveWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'explosive';
    }
    
    fire(x, y, angle, owner, tank) {
        return [new Bullet(x, y, angle, owner, 'explosive')];
    }
}

// Piercing
class PiercingWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'piercing';
    }
    
    fire(x, y, angle, owner, tank) {
        return [new Bullet(x, y, angle, owner, 'piercing')];
    }
}

// Mine Layer
class MineWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'mine';
    }
    
    fire(x, y, angle, owner, tank) {
        // Mines are placed at tank location, not fired
        return [new Mine(tank.x, tank.y, owner)];
    }
}

// Homing Missile
class HomingWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'homing';
    }
    
    fire(x, y, angle, owner, tank) {
        return [new Bullet(x, y, angle, owner, 'homing')];
    }
}

// Flamethrower
class FlamethrowerWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'flamethrower';
    }
    
    fire(x, y, angle, owner, tank) {
        const bullets = [];
        for (let i = -3; i <= 3; i++) {
            bullets.push(new Bullet(x, y, angle + i * 0.15, owner, 'flame'));
        }
        return bullets;
    }
}

// Freeze Ray
class FreezeWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'freeze';
    }
    
    fire(x, y, angle, owner, tank) {
        return [new Bullet(x, y, angle, owner, 'freeze')];
    }
}

// Railgun
class RailgunWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'railgun';
    }
    
    fire(x, y, angle, owner, tank) {
        const bullet = new Bullet(x, y, angle, owner, 'railgun');
        bullet.maxPiercing = 999; // Goes through everything
        return [bullet];
    }
}

// Chain Lightning
class ChainLightningWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'chain';
    }
    
    fire(x, y, angle, owner, tank) {
        return [new Bullet(x, y, angle, owner, 'chain')];
    }
}

// Boomerang
class BoomerangWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'boomerang';
    }
    
    fire(x, y, angle, owner, tank) {
        return [new Bullet(x, y, angle, owner, 'boomerang')];
    }
}

// Gravity Vortex
class VortexWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'vortex';
    }
    
    fire(x, y, angle, owner, tank) {
        return [new Bullet(x, y, angle, owner, 'vortex')];
    }
}

// Teleport Shot
class TeleportWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'teleport';
    }
    
    fire(x, y, angle, owner, tank) {
        return [new Bullet(x, y, angle, owner, 'teleport')];
    }
}

// Shield Wall
class ShieldWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'shield';
    }
    
    fire(x, y, angle, owner, tank) {
        // Creates a shield wall instead of bullet
        return [new ShieldWall(x, y, angle, owner)];
    }
}

// Super Bouncer
class BouncerWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'bouncer';
    }
    
    fire(x, y, angle, owner, tank) {
        const bullet = new Bullet(x, y, angle, owner, 'bouncer');
        bullet.maxBounces = 10;
        return [bullet];
    }
}

// EMP Blast
class EMPWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'emp';
    }
    
    fire(x, y, angle, owner, tank) {
        return [new Bullet(x, y, angle, owner, 'emp')];
    }
}

// Acid Spray
class AcidWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'acid';
    }
    
    fire(x, y, angle, owner, tank) {
        const bullets = [];
        for (let i = -2; i <= 2; i++) {
            bullets.push(new Bullet(x, y, angle + i * 0.2, owner, 'acid'));
        }
        return bullets;
    }
}

// Swarm Missiles
class SwarmWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'swarm';
    }
    
    fire(x, y, angle, owner, tank) {
        const bullets = [];
        for (let i = 0; i < 6; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * 0.5;
            const bullet = new Bullet(x, y, spreadAngle, owner, 'swarm');
            bullet.size *= 0.5;
            bullet.damage *= 0.5;
            bullets.push(bullet);
        }
        return bullets;
    }
}

// Phantom Shot
class PhantomWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'phantom';
    }
    
    fire(x, y, angle, owner, tank) {
        const bullet = new Bullet(x, y, angle, owner, 'phantom');
        bullet.maxPiercing = 999;
        bullet.invisible = true;
        return [bullet];
    }
}

// Ricochet Master
class RicochetWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'ricochet';
    }
    
    fire(x, y, angle, owner, tank) {
        const bullet = new Bullet(x, y, angle, owner, 'ricochet');
        bullet.maxBounces = 15;
        return [bullet];
    }
}

// Tornado
class TornadoWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'tornado';
    }
    
    fire(x, y, angle, owner, tank) {
        const bullet = new Bullet(x, y, angle, owner, 'tornado');
        bullet.spiralRadius = 0;
        return [bullet];
    }
}

// Black Hole
class BlackHoleWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'blackhole';
    }
    
    fire(x, y, angle, owner, tank) {
        return [new Bullet(x, y, angle, owner, 'blackhole')];
    }
}

// Mirror Shot
class MirrorWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'mirror';
    }
    
    fire(x, y, angle, owner, tank) {
        const bullets = [];
        // Fire in opposite directions
        bullets.push(new Bullet(x, y, angle, owner, 'mirror'));
        bullets.push(new Bullet(x, y, angle + Math.PI, owner, 'mirror'));
        return bullets;
    }
}

// Cluster Bomb
class ClusterWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'cluster';
    }
    
    fire(x, y, angle, owner, tank) {
        const bullet = new Bullet(x, y, angle, owner, 'cluster');
        bullet.clusterCount = 8;
        return [bullet];
    }
}

// Lightning Strike
class LightningWeapon extends Weapon {
    constructor() {
        super();
        this.type = 'lightning';
    }
    
    fire(x, y, angle, owner, tank) {
        // Lightning strikes from above at target location
        const strikeDistance = 200;
        const strikeX = x + Math.cos(angle) * strikeDistance;
        const strikeY = y + Math.sin(angle) * strikeDistance;
        return [new LightningStrike(strikeX, strikeY, owner)];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeaponSystem;
}