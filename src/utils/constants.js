// Game Constants
export const GAME_MODES = {
    NONE: 0,
    BATTLE_ROYALE: 1,
    TEAM_DEATHMATCH: 2,
    CAPTURE_THE_FLAG: 3,
    SURVIVAL: 4,
    TRAINING: 5
};

export const MAP_SIZES = {
    small: { width: 800, height: 600 },
    medium: { width: 1200, height: 800 },
    large: { width: 1600, height: 1000 }
};

export const TILE_SIZE = 64;

// Default colors
export const DEFAULT_COLORS = {
    PLAYER1: '#4CAF50',
    PLAYER2: '#ff9800',
    PLAYER1_SECONDARY: '#2E7D32',
    PLAYER2_SECONDARY: '#E65100'
};

// Power-up symbols for UI
export const POWERUP_SYMBOLS = {
    scatter: '💥',
    laser: '⚡',
    rocket: '🚀',
    explosive: '💣',
    piercing: '🏹',
    mine: '💎',
    drone: '🤖',
    homing: '🎯',
    flamethrower: '🔥',
    freeze: '❄️',
    railgun: '⚙️',
    chain: '⛓️',
    boomerang: '🪃',
    vortex: '🌀',
    teleport: '🌌',
    shield: '🛡️',
    bouncer: '⚾',
    emp: '⚡',
    acid: '🧪',
    swarm: '🐝',
    phantom: '👻',
    ricochet: '🎱',
    tornado: '🌪️',
    blackhole: '⚫',
    mirror: '🪞',
    cluster: '💣',
    lightning: '⚡'
};

// Terrain types
export const TERRAIN_TYPES = {
    GRASS: 'grass',
    SAND: 'sand',
    WATER: 'water',
    ROCK: 'rock',
    MUD: 'mud',
    ICE: 'ice'
};

// Animation constants
export const ANIMATION = {
    WHEEL_ROTATION_SPEED: 0.2,
    TREAD_ANIMATION_SPEED: 0.3,
    ENGINE_BOB_SPEED: 0.02,
    ENGINE_BOB_AMPLITUDE: 0.5,
    TRAIL_INTERVAL: 3,
    MAX_TRAIL_LENGTH: 30
};

// Visual effect constants
export const EFFECTS = {
    EXPLOSION_MAX_RADIUS: 50,
    EXPLOSION_LIFETIME: 30,
    PARTICLE_LIFETIME: 30,
    SMOKE_LIFETIME: 60,
    TELEPORT_EFFECT_DURATION: 30,
    PICKUP_NOTIFICATION_DURATION: 60
};

// Game timing constants (in frames)
export const TIMING = {
    GRACE_PERIOD: 180, // 3 seconds at 60fps
    RELOAD_TIME: 20, // 0.33 seconds
    POWERUP_DURATION: 600, // 10 seconds
    POWERUP_RESPAWN: 300, // 5 seconds
    TUNNEL_COOLDOWN: 60, // 1 second
    FREEZE_DURATION: 180 // 3 seconds
};

// Re-export CONFIG for convenience
export { CONFIG } from '../../config.js';