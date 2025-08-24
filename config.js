// Game Configuration

// Master Size Modifier - Change this ONE value to scale EVERYTHING proportionally
const SIZE_MODIFIER = 1.0; // 0.5 = half size, 1.0 = normal, 2.0 = double size

const CONFIG = {
    // Store SIZE_MODIFIER in config for easy access
    SIZE_MODIFIER: SIZE_MODIFIER,
    
    // Global Scale Settings
    GLOBAL_SCALE: 0.8, // Original scaling value
    
    // Tank Properties
    TANK_SIZE: Math.round(30 * SIZE_MODIFIER), // Base: 30
    TANK_SPEED: 0, // Testing - set to 0 to verify CONFIG is being used
    TANK_TURN_SPEED: 0.03, // Deliberate turning
    TANK_MAX_SPECIAL_AMMO: 5,
    TANK_RELOAD_TIME: 45, // frames (0.75 seconds at 60fps) - strategic shooting
    
    // Bullet Properties
    BULLET_SPEED: 3.5, // Slower bullets for dodging opportunity
    BULLET_SIZE: Math.round(4 * SIZE_MODIFIER), // Base: 4
    BULLET_LIFETIME: 400, // frames - longer range for strategic positioning
    
    // Power-up Properties
    POWERUP_SIZE: Math.round(20 * SIZE_MODIFIER), // Base: 20
    POWERUP_RESPAWN_TIME: 480, // frames (8 seconds) - more strategic powerup control
    POWERUP_DURATION: 480, // frames (8 seconds) - balanced duration
    
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
    AI_SHOOT_COOLDOWN_MIN: 90, // Slower AI shooting for strategic gameplay
    AI_SHOOT_COOLDOWN_MAX: 150, // More time between AI shots
    AI_MIN_SHOOT_DISTANCE: Math.round(100 * SIZE_MODIFIER), // AI shoots from further away
    AI_TURN_THRESHOLD: 0.03, // More precise AI aiming
    
    // Ring of Fire
    RING_OF_FIRE_ENABLED: true,
    RING_WARNING_TIME: 30000, // milliseconds (30 seconds)
    RING_DAMAGE_INTERVAL: 60, // frames (1 second)
    RING_MIN_RADIUS_MULT: 0.15, // percentage of map size
    RING_SHRINK_SPEED_MULT: 0.0003, // percentage of map size per frame
    
    // Game Rules
    FRIENDLY_FIRE_ENABLED: false,
    
    // Visual Effects
    EXPLOSION_MAX_RADIUS: Math.round(50 * SIZE_MODIFIER), // Base: 50
    EXPLOSION_LIFETIME: 30,
    PARTICLE_LIFETIME: 30,
    SMOKE_LIFETIME: 60,
    
    // Animation
    WHEEL_ROTATION_SPEED: 0.2,
    TREAD_ANIMATION_SPEED: 0.3,
    ENGINE_BOB_SPEED: 0.02,
    ENGINE_BOB_AMPLITUDE: 0.5,
    
    // Map Generation
    SPAWN_MIN_DISTANCE: Math.round(200 * SIZE_MODIFIER), // Base: 200
    WALL_THICKNESS_MIN: Math.round(20 * SIZE_MODIFIER), // Base: 20
    WALL_THICKNESS_SCALE: Math.round(30 * SIZE_MODIFIER), // Base: 30
    TREE_COUNT_MULTIPLIER: 15,
    
    // Game Counts
    POWERUP_COUNT: 5,
    AI_TANK_COUNT: 20,
    
    // Training Mode Settings
    TRAINING_STATIONARY_TARGETS: 3,
    TRAINING_MOVING_TARGETS: 2,
    TRAINING_TARGET_HEALTH: 3,
    TRAINING_TARGET_SIZE: Math.round(25 * SIZE_MODIFIER), // Base: 25
    TRAINING_TARGET_RESPAWN_TIME: 180, // frames (3 seconds)
    TRAINING_MOVING_TARGET_SPEED: 1,
    TRAINING_MOVING_TARGET_RANGE: Math.round(100 * SIZE_MODIFIER), // Base: 100
    TRAINING_AIMING_HELPER: true, // Show aiming assistance in training mode
    
    // Drone Properties
    DRONE_SIZE: Math.round(12 * SIZE_MODIFIER), // Base: 12
    DRONE_SPEED: 0.8, // Slower drone movement
    DRONE_ORBIT_DISTANCE: Math.round(60 * SIZE_MODIFIER), // Base: 60
    DRONE_HEALTH: 2,
    DRONE_RELOAD_TIME: 120, // Slower drone fire rate
    DRONE_BULLET_SPEED: 2.0, // Slower drone bullets
    DRONE_BULLET_SIZE: Math.round(3 * SIZE_MODIFIER), // Base: 3
    DRONE_TARGET_RANGE: Math.round(150 * SIZE_MODIFIER), // Base: 150
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
        drone: { enabled: true, name: '🤖 Combat Drone', description: 'Spawns a drone that follows and provides support fire' },
        
        // New weapons - enabled by default
        homing: { enabled: true, name: '🎯 Homing Missile', description: 'Missiles that track enemies' },
        flamethrower: { enabled: true, name: '🔥 Flamethrower', description: 'Short-range flame burst' },
        freeze: { enabled: true, name: '❄️ Freeze Ray', description: 'Freezes enemy tanks temporarily' },
        railgun: { enabled: true, name: '⚙️ Railgun', description: 'Instant penetrating high-damage shot' },
        chain: { enabled: true, name: '⛓️ Chain Lightning', description: 'Lightning that jumps between nearby tanks' },
        boomerang: { enabled: true, name: '🪃 Boomerang', description: 'Projectile that returns to sender' },
        vortex: { enabled: true, name: '🌀 Gravity Vortex', description: 'Creates a pulling gravity field' },
        teleport: { enabled: true, name: '🌌 Teleport Shot', description: 'Swaps positions with hit target' },
        shield: { enabled: true, name: '🛡️ Shield Wall', description: 'Deploys temporary protective barriers' },
        energy_shield: { enabled: true, name: '⚡ Energy Shield', description: '10 seconds of invulnerability with electric shield' },
        bouncer: { enabled: true, name: '⚾ Super Bouncer', description: 'Bullets with extra wall bounces' },
        emp: { enabled: true, name: '⚡ EMP Blast', description: 'Disables enemy movement temporarily' },
        acid: { enabled: true, name: '🧪 Acid Spray', description: 'Leaves damaging acid pools' },
        swarm: { enabled: true, name: '🐝 Swarm Missiles', description: 'Releases multiple mini-missiles' },
        phantom: { enabled: true, name: '👻 Phantom Shot', description: 'Invisible bullets that phase through walls' },
        ricochet: { enabled: true, name: '🎱 Ricochet Master', description: 'Bullets gain damage with each bounce' },
        tornado: { enabled: true, name: '🌪️ Tornado', description: 'Creates spinning projectile that pulls enemies' },
        blackhole: { enabled: true, name: '⚫ Black Hole', description: 'Creates a massive gravity well' },
        mirror: { enabled: true, name: '🪞 Mirror Shot', description: 'Reflects enemy projectiles back' },
        cluster: { enabled: true, name: '💣 Cluster Bomb', description: 'Explodes into smaller bomblets' },
        lightning: { enabled: true, name: '⚡ Lightning Strike', description: 'Calls down lightning from above' },
        
        // Defensive and utility power-ups
        personalShield: { enabled: true, name: '🛡️ Personal Shield', description: 'Absorbs next 3 hits' },
        invisibility: { enabled: true, name: '👤 Invisibility Cloak', description: 'Become invisible for a short time' },
        speedBoost: { enabled: true, name: '💨 Turbo Boost', description: 'Doubles movement and turn speed' },
        timeWarp: { enabled: true, name: '⏰ Time Warp', description: 'Slows down time for enemies' },
        decoy: { enabled: true, name: '🎭 Decoy Tank', description: 'Creates fake tank copies' },
        magnetField: { enabled: true, name: '🧲 Magnetic Field', description: 'Attracts enemy bullets away' },
        smokeScreen: { enabled: true, name: '💨 Smoke Screen', description: 'Creates vision-blocking smoke' },
        healing: { enabled: true, name: '❤️ Repair Kit', description: 'Heals damage over time' },
        teleporter: { enabled: true, name: '🌀 Teleporter', description: 'Instantly teleport to random safe location' },
        forceField: { enabled: true, name: '⚡ Force Field', description: 'Creates protective bubble around tank' },
        reflection: { enabled: true, name: '🔄 Reflection Armor', description: 'Bounces bullets back at attackers' },
        phaseShift: { enabled: true, name: '👻 Phase Shift', description: 'Pass through walls temporarily' },
        overcharge: { enabled: true, name: '⚡ Overcharge', description: 'Fire rate x3 for short duration' },
        vampire: { enabled: true, name: '🦇 Vampire Mode', description: 'Heal when damaging enemies' },
        duplicate: { enabled: true, name: '👥 Duplicate', description: 'Create AI-controlled clone' },
        groundPound: { enabled: true, name: '💥 Ground Pound', description: 'Area damage shockwave' },
        grappleHook: { enabled: true, name: '🪝 Grapple Hook', description: 'Pull enemies or swing to walls' },
        reverseControls: { enabled: true, name: '🔄 Confusion Ray', description: 'Reverses enemy controls' },
        sizeChange: { enabled: true, name: '🔬 Size Modifier', description: 'Shrink to dodge or grow for power' },
        wallBuilder: { enabled: true, name: '🧱 Wall Builder', description: 'Create temporary walls' },
        radar: { enabled: true, name: '📡 Radar Pulse', description: 'Reveals all enemies through walls' },
        trap: { enabled: true, name: '🕸️ Trap Deployer', description: 'Places invisible snare traps' },
        kamikaze: { enabled: true, name: '💣 Kamikaze Mode', description: 'Explode on contact for massive damage' },
        resurrect: { enabled: true, name: '✨ Phoenix Rising', description: 'Resurrect once after death' },
        mindControl: { enabled: true, name: '🧠 Mind Control', description: 'Take control of enemy tank briefly' },
        portal: { enabled: true, name: '🌌 Portal Gun', description: 'Create linked portals for travel' },
        earthquake: { enabled: true, name: '🌍 Earthquake', description: 'Shake screen and stun all enemies' },
        nanobots: { enabled: true, name: '🤖 Nanobots', description: 'Tiny bots that repair and attack' },
        hologram: { enabled: true, name: '📽️ Hologram', description: 'Project false tank images' },
        energyDrain: { enabled: true, name: '🔋 Energy Drain', description: 'Steal ammo from nearby enemies' }
    },
    
    // Environmental Hazards (can be toggled on/off)
    ENVIRONMENTAL_HAZARDS: {
        lavaPool: { enabled: true, name: '🌋 Lava Pools', description: 'Random lava pools that damage on contact' },
        quicksand: { enabled: true, name: '🏜️ Quicksand', description: 'Slows movement and eventually sinks tanks' },
        electricFence: { enabled: true, name: '⚡ Electric Fences', description: 'Electrified barriers that damage on touch' },
        tornado: { enabled: true, name: '🌪️ Tornadoes', description: 'Roaming tornadoes that pull and damage tanks' },
        meteor: { enabled: true, name: '☄️ Meteor Shower', description: 'Random meteors fall from the sky' },
        acidRain: { enabled: true, name: '🌧️ Acid Rain', description: 'Periodic acid rain that damages exposed tanks' },
        earthquake: { enabled: true, name: '🌍 Earthquakes', description: 'Random ground shaking that affects movement' },
        lightning: { enabled: true, name: '⛈️ Lightning Storms', description: 'Random lightning strikes from above' },
        icePatches: { enabled: true, name: '❄️ Ice Patches', description: 'Slippery areas with no traction' },
        minefield: { enabled: true, name: '💣 Random Mines', description: 'Hidden mines scattered across the map' },
        spikes: { enabled: true, name: '🗡️ Spike Traps', description: 'Retractable spikes that emerge periodically' },
        crusher: { enabled: true, name: '🔨 Crushers', description: 'Moving walls that crush tanks between them' },
        blackHoles: { enabled: true, name: '⚫ Black Holes', description: 'Gravity wells that pull everything nearby' },
        fireWalls: { enabled: true, name: '🔥 Fire Walls', description: 'Moving walls of fire that sweep across' },
        poisonGas: { enabled: true, name: '☠️ Poison Gas', description: 'Toxic clouds that slowly damage tanks' },
        floodWater: { enabled: true, name: '🌊 Flash Floods', description: 'Rising water that drowns tanks' },
        sandstorm: { enabled: true, name: '🌬️ Sandstorms', description: 'Reduces visibility and damages over time' },
        solarFlare: { enabled: true, name: '☀️ Solar Flares', description: 'Periodic bursts that disable electronics' },
        geyser: { enabled: true, name: '♨️ Geysers', description: 'Steam jets that launch tanks into air' },
        sinkhole: { enabled: true, name: '🕳️ Sinkholes', description: 'Ground collapses creating instant death pits' },
        avalanche: { enabled: true, name: '🏔️ Avalanches', description: 'Falling rocks and debris from above' },
        windStorm: { enabled: true, name: '💨 Wind Storms', description: 'Strong winds that push tanks around' },
        radioactive: { enabled: true, name: '☢️ Radiation Zones', description: 'Areas that slowly damage and mutate' },
        tentacles: { enabled: true, name: '🐙 Tentacles', description: 'Monster tentacles that grab from below' },
        lasergrid: { enabled: true, name: '🔴 Laser Grid', description: 'Moving laser beams that slice through' },
        conveyor: { enabled: true, name: '➡️ Conveyor Belts', description: 'Moving floors that push tanks' },
        magneticField: { enabled: true, name: '🧲 Magnetic Anomalies', description: 'Areas that attract or repel metal' },
        voidZone: { enabled: true, name: '👁️ Void Zones', description: 'Reality tears that teleport randomly' },
        plasmaStorm: { enabled: true, name: '💜 Plasma Storms', description: 'Energy storms that disable weapons' },
        timeBubble: { enabled: true, name: '⏱️ Time Bubbles', description: 'Areas where time moves differently' }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}