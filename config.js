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
    
    // Training Mode Settings
    TRAINING_STATIONARY_TARGETS: 3,
    TRAINING_MOVING_TARGETS: 2,
    TRAINING_TARGET_HEALTH: 3,
    TRAINING_TARGET_SIZE: 25,
    TRAINING_TARGET_RESPAWN_TIME: 180, // frames (3 seconds)
    TRAINING_MOVING_TARGET_SPEED: 1,
    TRAINING_MOVING_TARGET_RANGE: 100,
    
    // Drone Properties
    DRONE_SIZE: 12,
    DRONE_SPEED: 1.2,
    DRONE_ORBIT_DISTANCE: 60,
    DRONE_HEALTH: 2,
    DRONE_RELOAD_TIME: 80,
    DRONE_BULLET_SPEED: 2.5,
    DRONE_BULLET_SIZE: 3,
    DRONE_TARGET_RANGE: 150,
    DRONE_ORBIT_SPEED: 0.02,
    
    // Gate Properties
    GATE_OPEN_TIME: 480, // frames (8 seconds at 60fps)
    GATE_WARNING_TIME: 120, // frames (2 seconds)
    GATE_CLOSED_TIME: 120, // frames (2 seconds)
    GATE_ANIMATION_FRAMES: 30, // frames for opening/closing animation (0.5 seconds)
    GATE_CRUSH_DAMAGE: 75,
    GATE_COUNT_MIN: 2,
    GATE_COUNT_MAX: 3,
    
    // Winner Zoom Effect
    WINNER_ZOOM_SCALE: 3.0, // 3x zoom on winner
    WINNER_ZOOM_DURATION: 3000, // 3 seconds (matches victory screen)
    WINNER_ZOOM_TRANSITION_TIME: 2000, // 2 seconds smooth transition
    
    // Available Power-up Types (can be toggled on/off)
    POWERUP_TYPES: {
        scatter: { enabled: true, name: '💥 Scatter Shot', description: 'Fires 5 bullets in a spread' },
        laser: { enabled: true, name: '⚡ Laser Beam', description: 'Fast, precise laser bullets' },
        rocket: { enabled: true, name: '🚀 Rocket', description: 'Slow but powerful rockets' },
        explosive: { enabled: true, name: '💣 Explosive', description: 'Bullets that explode on impact' },
        piercing: { enabled: true, name: '🏹 Piercing', description: 'Bullets that go through walls' },
        mine: { enabled: true, name: '💎 Mine', description: 'Drops explosive landmines on the ground' },
        drone: { enabled: true, name: '🤖 Combat Drone', description: 'Spawns a drone that follows and provides support fire' }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}