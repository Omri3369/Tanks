# Core Game Systems

## Architecture Overview

The tank game now uses modern game development patterns for better maintainability, performance, and scalability.

### 1. Event System (EventBus.js)
**Pattern:** Publisher-Subscriber  
**Purpose:** Decoupled communication between game components

```javascript
// Subscribe to events
globalEventBus.on(GameEvents.TANK_DESTROYED, (data) => {
    updateScore(data.destroyer);
    createExplosion(data.position);
});

// Emit events
globalEventBus.emit(GameEvents.TANK_DESTROYED, {
    tank: destroyedTank,
    destroyer: attacker
});
```

### 2. State Machine (StateMachine.js)
**Pattern:** State Pattern  
**Purpose:** Clean game state management

```javascript
// Register states
stateMachine.registerState('menu', new MenuState());
stateMachine.registerState('playing', new PlayingState());
stateMachine.registerState('gameOver', new GameOverState());

// Transition between states
stateMachine.transition('playing', { gameMode: 1 });
```

### 3. Component System (ComponentSystem.js)
**Pattern:** Entity-Component System (ECS)  
**Purpose:** Modular, reusable tank abilities

```javascript
// Create tank with components
const tank = new Entity()
    .addComponent(new TransformComponent(x, y))
    .addComponent(new HealthComponent(100))
    .addComponent(new MovementComponent(speed))
    .addComponent(new WeaponComponent('laser'))
    .addComponent(new AIComponent('aggressive'));

// Components work together
tank.getComponent('weapon').shoot();
tank.getComponent('health').takeDamage(20);
```

### 4. Object Pooling (ObjectPool.js)
**Pattern:** Object Pool  
**Purpose:** Performance optimization through object reuse

```javascript
// Get objects from pool (no 'new' keyword)
const bullet = globalPoolManager.acquire('bullet', x, y, angle);
const particle = globalPoolManager.acquire('particle', x, y);

// Return to pool when done
if (!bullet.alive) {
    globalPoolManager.release('bullet', bullet);
}
```

## Benefits

### Performance
- **Object Pooling:** Eliminates garbage collection pauses
- **Component System:** Only update active components
- **Event System:** Efficient message passing

### Maintainability
- **Decoupled Code:** Components don't know about each other
- **Single Responsibility:** Each system has one job
- **Modular Design:** Easy to add/remove features

### Scalability
- **Component System:** Add new abilities without modifying existing code
- **Event System:** New features can listen to existing events
- **State Machine:** Add new game modes as new states

## Usage Example

```javascript
// Initialize systems
const eventBus = new EventBus();
const stateMachine = new StateMachine();
const poolManager = new PoolManager();

// Create game entity
const player = new Entity()
    .addComponent(new TransformComponent(400, 300))
    .addComponent(new HealthComponent(100))
    .addComponent(new MovementComponent(2.0))
    .addComponent(new WeaponComponent('normal'))
    .addComponent(new RenderComponent());

// Listen for damage
eventBus.on(GameEvents.TANK_DAMAGED, (data) => {
    // Create pooled particles
    for (let i = 0; i < 10; i++) {
        const particle = poolManager.acquire('particle',
            data.position.x, data.position.y,
            Math.random() * 10 - 5, Math.random() * 10 - 5,
            '#FF0000', 2, 30
        );
    }
});

// Game loop
function update(deltaTime) {
    stateMachine.update(deltaTime);
    player.update(deltaTime);
    
    // Update pooled objects
    bullets.forEach(bullet => {
        bullet.update(deltaTime);
        if (!bullet.alive) {
            poolManager.release('bullet', bullet);
        }
    });
}
```

## Next Steps

1. **Collision System with QuadTree** - Spatial partitioning for efficient collision detection
2. **Debug System** - Visual debugging tools and performance monitoring
3. **Resource Manager** - Centralized asset loading and caching
4. **Animation System** - Sprite animations and visual effects
5. **Save System** - Game state persistence

The architecture is now professional-grade and ready for further expansion!