/**
 * Entity Component System (ECS) for modular game object composition
 */

/**
 * Base Component class
 */
class Component {
    constructor(type) {
        this.type = type;
        this.entity = null;
        this.enabled = true;
    }
    
    /**
     * Called when component is added to entity
     */
    onAdd(entity) {
        this.entity = entity;
    }
    
    /**
     * Called when component is removed from entity
     */
    onRemove() {
        this.entity = null;
    }
    
    /**
     * Update component
     */
    update(deltaTime) {
        // Override in subclasses
    }
    
    /**
     * Enable component
     */
    enable() {
        this.enabled = true;
        this.onEnable();
    }
    
    /**
     * Disable component
     */
    disable() {
        this.enabled = false;
        this.onDisable();
    }
    
    onEnable() {
        // Override in subclasses
    }
    
    onDisable() {
        // Override in subclasses
    }
}

/**
 * Entity with component management
 */
class Entity {
    constructor(id = null) {
        this.id = id || Entity.generateId();
        this.components = new Map();
        this.tags = new Set();
        this.active = true;
    }
    
    static generateId() {
        return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Add component to entity
     */
    addComponent(component) {
        if (!(component instanceof Component)) {
            throw new Error('Component must extend Component class');
        }
        
        this.components.set(component.type, component);
        component.onAdd(this);
        
        globalEventBus.emit('entity.component.added', {
            entity: this,
            component: component
        });
        
        return this;
    }
    
    /**
     * Remove component from entity
     */
    removeComponent(type) {
        const component = this.components.get(type);
        if (component) {
            component.onRemove();
            this.components.delete(type);
            
            globalEventBus.emit('entity.component.removed', {
                entity: this,
                component: component
            });
        }
        
        return this;
    }
    
    /**
     * Get component by type
     */
    getComponent(type) {
        return this.components.get(type);
    }
    
    /**
     * Check if entity has component
     */
    hasComponent(type) {
        return this.components.has(type);
    }
    
    /**
     * Get all components
     */
    getAllComponents() {
        return Array.from(this.components.values());
    }
    
    /**
     * Update all components
     */
    update(deltaTime) {
        if (!this.active) return;
        
        this.components.forEach(component => {
            if (component.enabled) {
                component.update(deltaTime);
            }
        });
    }
    
    /**
     * Add tag to entity
     */
    addTag(tag) {
        this.tags.add(tag);
        return this;
    }
    
    /**
     * Remove tag from entity
     */
    removeTag(tag) {
        this.tags.delete(tag);
        return this;
    }
    
    /**
     * Check if entity has tag
     */
    hasTag(tag) {
        return this.tags.has(tag);
    }
    
    /**
     * Destroy entity
     */
    destroy() {
        this.components.forEach((component, type) => {
            component.onRemove();
        });
        this.components.clear();
        this.tags.clear();
        this.active = false;
        
        globalEventBus.emit('entity.destroyed', { entity: this });
    }
}

// Tank Components

/**
 * Health Component
 */
class HealthComponent extends Component {
    constructor(maxHealth = 100) {
        super('health');
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.shield = 0;
        this.maxShield = 100;
        this.regenerationRate = 0;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
    }
    
    update(deltaTime) {
        // Handle invulnerability
        if (this.invulnerabilityTime > 0) {
            this.invulnerabilityTime -= deltaTime;
            if (this.invulnerabilityTime <= 0) {
                this.invulnerable = false;
            }
        }
        
        // Health regeneration
        if (this.regenerationRate > 0 && this.currentHealth < this.maxHealth) {
            this.heal(this.regenerationRate * deltaTime);
        }
    }
    
    takeDamage(amount) {
        if (this.invulnerable) return 0;
        
        let actualDamage = amount;
        
        // Apply shield first
        if (this.shield > 0) {
            const shieldDamage = Math.min(this.shield, amount);
            this.shield -= shieldDamage;
            actualDamage -= shieldDamage;
            
            globalEventBus.emit('entity.shield.damaged', {
                entity: this.entity,
                damage: shieldDamage,
                remaining: this.shield
            });
        }
        
        // Apply health damage
        if (actualDamage > 0) {
            this.currentHealth -= actualDamage;
            
            globalEventBus.emit(GameEvents.TANK_DAMAGED, {
                entity: this.entity,
                damage: actualDamage,
                health: this.currentHealth
            });
            
            if (this.currentHealth <= 0) {
                this.currentHealth = 0;
                this.onDeath();
            }
        }
        
        return actualDamage;
    }
    
    heal(amount) {
        const oldHealth = this.currentHealth;
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
        const healed = this.currentHealth - oldHealth;
        
        if (healed > 0) {
            globalEventBus.emit(GameEvents.TANK_HEALED, {
                entity: this.entity,
                amount: healed,
                health: this.currentHealth
            });
        }
        
        return healed;
    }
    
    addShield(amount) {
        this.shield = Math.min(this.maxShield, this.shield + amount);
    }
    
    setInvulnerable(duration) {
        this.invulnerable = true;
        this.invulnerabilityTime = duration;
    }
    
    onDeath() {
        globalEventBus.emit(GameEvents.TANK_DESTROYED, {
            entity: this.entity,
            position: this.entity.getComponent('transform')?.position
        });
    }
    
    getHealthPercent() {
        return this.currentHealth / this.maxHealth;
    }
    
    getShieldPercent() {
        return this.shield / this.maxShield;
    }
}

/**
 * Movement Component
 */
class MovementComponent extends Component {
    constructor(speed = 1.5, turnSpeed = 0.035) {
        super('movement');
        this.baseSpeed = speed;
        this.baseTurnSpeed = turnSpeed;
        this.currentSpeed = 0;
        this.currentTurnSpeed = 0;
        this.speedMultiplier = 1;
        this.turnMultiplier = 1;
        this.frozen = false;
        this.frozenTime = 0;
    }
    
    update(deltaTime) {
        if (this.frozenTime > 0) {
            this.frozenTime -= deltaTime;
            if (this.frozenTime <= 0) {
                this.unfreeze();
            }
        }
        
        if (!this.frozen) {
            const transform = this.entity.getComponent('transform');
            if (transform) {
                // Apply movement
                transform.position.x += Math.cos(transform.rotation) * this.currentSpeed * deltaTime;
                transform.position.y += Math.sin(transform.rotation) * this.currentSpeed * deltaTime;
                transform.rotation += this.currentTurnSpeed * deltaTime;
            }
        }
    }
    
    setSpeed(speed) {
        this.currentSpeed = speed * this.speedMultiplier;
    }
    
    setTurnSpeed(turnSpeed) {
        this.currentTurnSpeed = turnSpeed * this.turnMultiplier;
    }
    
    freeze(duration) {
        this.frozen = true;
        this.frozenTime = duration;
        this.currentSpeed = 0;
        this.currentTurnSpeed = 0;
        
        globalEventBus.emit(GameEvents.TANK_FROZEN, {
            entity: this.entity,
            duration: duration
        });
    }
    
    unfreeze() {
        this.frozen = false;
        this.frozenTime = 0;
        
        globalEventBus.emit(GameEvents.TANK_UNFROZEN, {
            entity: this.entity
        });
    }
    
    boost(speedMult, turnMult, duration) {
        this.speedMultiplier = speedMult;
        this.turnMultiplier = turnMult;
        
        setTimeout(() => {
            this.speedMultiplier = 1;
            this.turnMultiplier = 1;
        }, duration * 1000);
    }
}

/**
 * Weapon Component
 */
class WeaponComponent extends Component {
    constructor(weaponType = 'normal') {
        super('weapon');
        this.weaponType = weaponType;
        this.ammo = Infinity;
        this.maxAmmo = Infinity;
        this.reloadTime = 0;
        this.reloadSpeed = 20;
        this.damage = 20;
        this.fireRate = 1;
        this.specialAmmo = 0;
        this.maxSpecialAmmo = 5;
    }
    
    update(deltaTime) {
        if (this.reloadTime > 0) {
            this.reloadTime -= deltaTime;
        }
    }
    
    canShoot() {
        return this.reloadTime <= 0 && (this.ammo > 0 || this.ammo === Infinity);
    }
    
    shoot() {
        if (!this.canShoot()) return null;
        
        const transform = this.entity.getComponent('transform');
        if (!transform) return null;
        
        // Create bullet
        const bulletX = transform.position.x + Math.cos(transform.rotation) * 30;
        const bulletY = transform.position.y + Math.sin(transform.rotation) * 30;
        
        this.reloadTime = this.reloadSpeed / this.fireRate;
        
        if (this.ammo !== Infinity) {
            this.ammo--;
        }
        
        globalEventBus.emit(GameEvents.BULLET_FIRED, {
            entity: this.entity,
            position: { x: bulletX, y: bulletY },
            angle: transform.rotation,
            type: this.weaponType,
            damage: this.damage
        });
        
        return {
            x: bulletX,
            y: bulletY,
            angle: transform.rotation,
            type: this.weaponType,
            damage: this.damage,
            owner: this.entity.id
        };
    }
    
    reload() {
        this.ammo = this.maxAmmo;
        this.reloadTime = this.reloadSpeed * 2; // Longer reload for full clip
    }
    
    setWeaponType(type) {
        this.weaponType = type;
        this.specialAmmo = this.maxSpecialAmmo;
    }
    
    upgradeFireRate(multiplier) {
        this.fireRate *= multiplier;
    }
    
    upgradeDamage(multiplier) {
        this.damage *= multiplier;
    }
}

/**
 * Transform Component
 */
class TransformComponent extends Component {
    constructor(x = 0, y = 0, rotation = 0) {
        super('transform');
        this.position = { x, y };
        this.rotation = rotation;
        this.scale = { x: 1, y: 1 };
    }
    
    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
    }
    
    setRotation(rotation) {
        this.rotation = rotation;
    }
    
    setScale(x, y) {
        this.scale.x = x;
        this.scale.y = y || x;
    }
    
    translate(dx, dy) {
        this.position.x += dx;
        this.position.y += dy;
    }
    
    rotate(dRotation) {
        this.rotation += dRotation;
    }
}

/**
 * AI Component
 */
class AIComponent extends Component {
    constructor(behavior = 'aggressive') {
        super('ai');
        this.behavior = behavior;
        this.target = null;
        this.state = 'idle';
        this.decisionTimer = 0;
        this.decisionInterval = 1000; // milliseconds
        this.aggressionLevel = 0.5;
        this.accuracy = 0.7;
    }
    
    update(deltaTime) {
        this.decisionTimer += deltaTime;
        
        if (this.decisionTimer >= this.decisionInterval) {
            this.makeDecision();
            this.decisionTimer = 0;
        }
        
        this.executeBehavior(deltaTime);
    }
    
    makeDecision() {
        // Find best target
        this.target = this.findBestTarget();
        
        // Decide state based on behavior
        if (!this.target) {
            this.state = 'patrol';
        } else {
            const distance = this.getDistanceToTarget();
            
            switch(this.behavior) {
                case 'aggressive':
                    this.state = distance > 200 ? 'chase' : 'attack';
                    break;
                case 'defensive':
                    this.state = distance < 150 ? 'retreat' : 'defend';
                    break;
                case 'tactical':
                    this.state = this.decideTacticalState(distance);
                    break;
            }
        }
    }
    
    executeBehavior(deltaTime) {
        const movement = this.entity.getComponent('movement');
        const weapon = this.entity.getComponent('weapon');
        
        if (!movement) return;
        
        switch(this.state) {
            case 'chase':
                this.chaseTarget(movement);
                break;
            case 'attack':
                this.attackTarget(movement, weapon);
                break;
            case 'retreat':
                this.retreatFromTarget(movement);
                break;
            case 'patrol':
                this.patrol(movement);
                break;
            case 'defend':
                this.defendPosition(movement, weapon);
                break;
        }
    }
    
    findBestTarget() {
        // Would need access to game state to find targets
        return null;
    }
    
    getDistanceToTarget() {
        if (!this.target) return Infinity;
        
        const transform = this.entity.getComponent('transform');
        if (!transform) return Infinity;
        
        const dx = this.target.x - transform.position.x;
        const dy = this.target.y - transform.position.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    chaseTarget(movement) {
        if (!this.target) return;
        
        const transform = this.entity.getComponent('transform');
        if (!transform) return;
        
        const angle = Math.atan2(
            this.target.y - transform.position.y,
            this.target.x - transform.position.x
        );
        
        const angleDiff = angle - transform.rotation;
        movement.setTurnSpeed(angleDiff * 0.1);
        movement.setSpeed(movement.baseSpeed);
    }
    
    attackTarget(movement, weapon) {
        if (!this.target || !weapon) return;
        
        this.chaseTarget(movement);
        
        // Shoot if aligned
        const transform = this.entity.getComponent('transform');
        if (!transform) return;
        
        const angle = Math.atan2(
            this.target.y - transform.position.y,
            this.target.x - transform.position.x
        );
        
        const angleDiff = Math.abs(angle - transform.rotation);
        if (angleDiff < 0.1 && Math.random() < this.accuracy) {
            weapon.shoot();
        }
    }
    
    retreatFromTarget(movement) {
        if (!this.target) return;
        
        const transform = this.entity.getComponent('transform');
        if (!transform) return;
        
        const angle = Math.atan2(
            transform.position.y - this.target.y,
            transform.position.x - this.target.x
        );
        
        const angleDiff = angle - transform.rotation;
        movement.setTurnSpeed(angleDiff * 0.1);
        movement.setSpeed(movement.baseSpeed * 0.8);
    }
    
    patrol(movement) {
        // Random movement
        movement.setSpeed(movement.baseSpeed * 0.5);
        movement.setTurnSpeed((Math.random() - 0.5) * 0.02);
    }
    
    defendPosition(movement, weapon) {
        // Stay in position and shoot at nearby threats
        movement.setSpeed(0);
        
        if (this.target && weapon) {
            const transform = this.entity.getComponent('transform');
            if (!transform) return;
            
            const angle = Math.atan2(
                this.target.y - transform.position.y,
                this.target.x - transform.position.x
            );
            
            const angleDiff = angle - transform.rotation;
            movement.setTurnSpeed(angleDiff * 0.15);
            
            if (Math.abs(angleDiff) < 0.1) {
                weapon.shoot();
            }
        }
    }
    
    decideTacticalState(distance) {
        // Complex decision making
        if (distance > 300) return 'chase';
        if (distance < 100) return 'retreat';
        
        const health = this.entity.getComponent('health');
        if (health && health.getHealthPercent() < 0.3) {
            return 'retreat';
        }
        
        return Math.random() > 0.5 ? 'attack' : 'defend';
    }
}

/**
 * Render Component
 */
class RenderComponent extends Component {
    constructor(sprite = null) {
        super('render');
        this.sprite = sprite;
        this.color = '#FFFFFF';
        this.visible = true;
        this.opacity = 1;
        this.layer = 0;
    }
    
    render(ctx) {
        if (!this.visible) return;
        
        const transform = this.entity.getComponent('transform');
        if (!transform) return;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(transform.position.x, transform.position.y);
        ctx.rotate(transform.rotation);
        ctx.scale(transform.scale.x, transform.scale.y);
        
        if (this.sprite) {
            // Draw sprite
            ctx.drawImage(this.sprite, -this.sprite.width / 2, -this.sprite.height / 2);
        } else {
            // Draw placeholder
            ctx.fillStyle = this.color;
            ctx.fillRect(-15, -15, 30, 30);
        }
        
        ctx.restore();
    }
    
    setSprite(sprite) {
        this.sprite = sprite;
    }
    
    setColor(color) {
        this.color = color;
    }
    
    setOpacity(opacity) {
        this.opacity = Math.max(0, Math.min(1, opacity));
    }
    
    fadeIn(duration) {
        const startOpacity = this.opacity;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            this.opacity = startOpacity + (1 - startOpacity) * progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    fadeOut(duration) {
        const startOpacity = this.opacity;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            this.opacity = startOpacity * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Component,
        Entity,
        HealthComponent,
        MovementComponent,
        WeaponComponent,
        TransformComponent,
        AIComponent,
        RenderComponent
    };
}