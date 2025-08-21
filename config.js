// Game Configuration
const CONFIG = {
    // Tank Properties
    TANK_SIZE: 30,
    TANK_SPEED: 1.5,
    TANK_TURN_SPEED: 0.035,
    TANK_MAX_SPECIAL_AMMO: 5,
    TANK_RELOAD_TIME: 60, // frames (1 second at 60fps)
    
    // Bullet Properties
    BULLET_SPEED: 3,
    BULLET_SIZE: 4,
    BULLET_LIFETIME: 300, // frames
    
    // Power-up Properties
    POWERUP_SIZE: 20,
    POWERUP_RESPAWN_TIME: 300, // frames (5 seconds)
    POWERUP_DURATION: 600, // frames (10 seconds)
    
    // Bullet Speed Multipliers for Power-ups
    LASER_SPEED_MULT: 1.5,
    ROCKET_SPEED_MULT: 0.8,
    EXPLOSIVE_SPEED_MULT: 0.9,
    PIERCING_SPEED_MULT: 1.2,
    FREEZE_SPEED_MULT: 0.7,
    
    // Bullet Lifetime Multipliers for Power-ups
    LASER_LIFETIME_MULT: 0.7,
    ROCKET_LIFETIME_MULT: 1.5,
    EXPLOSIVE_LIFETIME_MULT: 1.2,
    PIERCING_LIFETIME_MULT: 0.8,
    FREEZE_LIFETIME_MULT: 1.3,
    
    // Bullet Size Multipliers for Power-ups
    LASER_SIZE_MULT: 0.5,
    ROCKET_SIZE_MULT: 1.5,
    EXPLOSIVE_SIZE_MULT: 1.3,
    PIERCING_SIZE_MULT: 0.8,
    FREEZE_SIZE_MULT: 1.2,
    
    // Game Mechanics
    GRACE_PERIOD: 180, // frames (3 seconds)
    COLLECTIBLE_RESPAWN_TIME: 150, // frames
    AI_SHOOT_COOLDOWN_MIN: 60,
    AI_SHOOT_COOLDOWN_MAX: 100,
    AI_MIN_SHOOT_DISTANCE: 80,
    AI_TURN_THRESHOLD: 0.05,
    
    // Ring of Fire
    RING_OF_FIRE_ENABLED: true,
    RING_WARNING_TIME: 30000, // milliseconds (30 seconds)
    RING_DAMAGE_INTERVAL: 60, // frames (1 second)
    RING_MIN_RADIUS_MULT: 0.15, // percentage of map size
    RING_SHRINK_SPEED_MULT: 0.0003, // percentage of map size per frame
    
    // Game Rules
    FRIENDLY_FIRE_ENABLED: false,
    
    // Visual Effects
    EXPLOSION_MAX_RADIUS: 50,
    EXPLOSION_LIFETIME: 30,
    PARTICLE_LIFETIME: 30,
    SMOKE_LIFETIME: 60,
    
    // Animation
    WHEEL_ROTATION_SPEED: 0.2,
    TREAD_ANIMATION_SPEED: 0.3,
    ENGINE_BOB_SPEED: 0.02,
    ENGINE_BOB_AMPLITUDE: 0.5,
    
    // Map Generation
    SPAWN_MIN_DISTANCE: 200,
    WALL_THICKNESS_MIN: 20,
    WALL_THICKNESS_SCALE: 30,
    TREE_COUNT_MULTIPLIER: 15,
    
    // Game Counts
    POWERUP_COUNT: 2,
    COLLECTIBLE_COUNT: 3,
    AI_TANK_COUNT: 3,
    
    // Available Power-up Types (can be toggled on/off)
    POWERUP_TYPES: {
        scatter: { enabled: true, name: '💥 Scatter Shot', description: 'Fires 5 bullets in a spread' },
        laser: { enabled: true, name: '⚡ Laser Beam', description: 'Fast, precise laser bullets' },
        rocket: { enabled: true, name: '🚀 Rocket', description: 'Slow but powerful rockets' },
        explosive: { enabled: true, name: '💣 Explosive', description: 'Bullets that explode on impact' },
        piercing: { enabled: true, name: '🏹 Piercing', description: 'Bullets that go through walls' },
        mine: { enabled: true, name: '💎 Mine', description: 'Drops explosive landmines on the ground' }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}