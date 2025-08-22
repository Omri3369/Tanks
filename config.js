// Game Configuration
const CONFIG = {
    // Global Scale Settings
    GLOBAL_SCALE: 0.6, // Scale everything down (0.5 = half size, 1.0 = normal, 2.0 = double)
    
    // Tank Properties
    TANK_SIZE: 30,
    TANK_SPEED: 1.5,
    TANK_TURN_SPEED: 0.035,
    TANK_MAX_SPECIAL_AMMO: 5,
    TANK_RELOAD_TIME: 20, // frames (0.33 seconds at 60fps) - faster shooting
    
    // Bullet Properties
    BULLET_SPEED: 5, // Moderate speed increase from original
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
    POWERUP_COUNT: 5,
    COLLECTIBLE_COUNT: 8, // More collectibles on the map
    COLLECTIBLE_RESPAWN_TIME: 300, // 5 seconds respawn
    COLLECTIBLE_RANDOM_SPAWN: true, // Spawn randomly during game
    AI_TANK_COUNT: 20,
    
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
        drone: { enabled: true, name: '🤖 Combat Drone', description: 'Spawns a drone that follows and provides support fire' },
        
        // New weapons - disabled by default
        homing: { enabled: false, name: '🎯 Homing Missile', description: 'Missiles that track enemies' },
        flamethrower: { enabled: false, name: '🔥 Flamethrower', description: 'Short-range flame burst' },
        freeze: { enabled: false, name: '❄️ Freeze Ray', description: 'Freezes enemy tanks temporarily' },
        railgun: { enabled: false, name: '⚙️ Railgun', description: 'Instant penetrating high-damage shot' },
        chain: { enabled: false, name: '⛓️ Chain Lightning', description: 'Lightning that jumps between nearby tanks' },
        boomerang: { enabled: false, name: '🪃 Boomerang', description: 'Projectile that returns to sender' },
        vortex: { enabled: false, name: '🌀 Gravity Vortex', description: 'Creates a pulling gravity field' },
        teleport: { enabled: false, name: '🌌 Teleport Shot', description: 'Swaps positions with hit target' },
        shield: { enabled: false, name: '🛡️ Shield Wall', description: 'Deploys temporary protective barriers' },
        bouncer: { enabled: false, name: '⚾ Super Bouncer', description: 'Bullets with extra wall bounces' },
        emp: { enabled: false, name: '⚡ EMP Blast', description: 'Disables enemy movement temporarily' },
        acid: { enabled: false, name: '🧪 Acid Spray', description: 'Leaves damaging acid pools' },
        swarm: { enabled: false, name: '🐝 Swarm Missiles', description: 'Releases multiple mini-missiles' },
        phantom: { enabled: false, name: '👻 Phantom Shot', description: 'Invisible bullets that phase through walls' },
        ricochet: { enabled: false, name: '🎱 Ricochet Master', description: 'Bullets gain damage with each bounce' },
        tornado: { enabled: false, name: '🌪️ Tornado', description: 'Creates spinning projectile that pulls enemies' },
        blackhole: { enabled: false, name: '⚫ Black Hole', description: 'Creates a massive gravity well' },
        mirror: { enabled: false, name: '🪞 Mirror Shot', description: 'Reflects enemy projectiles back' },
        cluster: { enabled: false, name: '💣 Cluster Bomb', description: 'Explodes into smaller bomblets' },
        lightning: { enabled: false, name: '⚡ Lightning Strike', description: 'Calls down lightning from above' },
        
        // Defensive and utility power-ups
        personalShield: { enabled: false, name: '🛡️ Personal Shield', description: 'Absorbs next 3 hits' },
        invisibility: { enabled: false, name: '👤 Invisibility Cloak', description: 'Become invisible for a short time' },
        speedBoost: { enabled: false, name: '💨 Turbo Boost', description: 'Doubles movement and turn speed' },
        timeWarp: { enabled: false, name: '⏰ Time Warp', description: 'Slows down time for enemies' },
        decoy: { enabled: false, name: '🎭 Decoy Tank', description: 'Creates fake tank copies' },
        magnetField: { enabled: false, name: '🧲 Magnetic Field', description: 'Attracts enemy bullets away' },
        smokeScreen: { enabled: false, name: '💨 Smoke Screen', description: 'Creates vision-blocking smoke' },
        healing: { enabled: false, name: '❤️ Repair Kit', description: 'Heals damage over time' },
        teleporter: { enabled: false, name: '🌀 Teleporter', description: 'Instantly teleport to random safe location' },
        forceField: { enabled: false, name: '⚡ Force Field', description: 'Creates protective bubble around tank' },
        reflection: { enabled: false, name: '🔄 Reflection Armor', description: 'Bounces bullets back at attackers' },
        phaseShift: { enabled: false, name: '👻 Phase Shift', description: 'Pass through walls temporarily' },
        overcharge: { enabled: false, name: '⚡ Overcharge', description: 'Fire rate x3 for short duration' },
        vampire: { enabled: false, name: '🦇 Vampire Mode', description: 'Heal when damaging enemies' },
        duplicate: { enabled: false, name: '👥 Duplicate', description: 'Create AI-controlled clone' },
        groundPound: { enabled: false, name: '💥 Ground Pound', description: 'Area damage shockwave' },
        grappleHook: { enabled: false, name: '🪝 Grapple Hook', description: 'Pull enemies or swing to walls' },
        reverseControls: { enabled: false, name: '🔄 Confusion Ray', description: 'Reverses enemy controls' },
        sizeChange: { enabled: false, name: '🔬 Size Modifier', description: 'Shrink to dodge or grow for power' },
        wallBuilder: { enabled: false, name: '🧱 Wall Builder', description: 'Create temporary walls' },
        radar: { enabled: false, name: '📡 Radar Pulse', description: 'Reveals all enemies through walls' },
        trap: { enabled: false, name: '🕸️ Trap Deployer', description: 'Places invisible snare traps' },
        kamikaze: { enabled: false, name: '💣 Kamikaze Mode', description: 'Explode on contact for massive damage' },
        resurrect: { enabled: false, name: '✨ Phoenix Rising', description: 'Resurrect once after death' },
        mindControl: { enabled: false, name: '🧠 Mind Control', description: 'Take control of enemy tank briefly' },
        portal: { enabled: false, name: '🌌 Portal Gun', description: 'Create linked portals for travel' },
        earthquake: { enabled: false, name: '🌍 Earthquake', description: 'Shake screen and stun all enemies' },
        nanobots: { enabled: false, name: '🤖 Nanobots', description: 'Tiny bots that repair and attack' },
        hologram: { enabled: false, name: '📽️ Hologram', description: 'Project false tank images' },
        energyDrain: { enabled: false, name: '🔋 Energy Drain', description: 'Steal ammo from nearby enemies' }
    },
    
    // Environmental Hazards (can be toggled on/off)
    ENVIRONMENTAL_HAZARDS: {
        lavaPool: { enabled: false, name: '🌋 Lava Pools', description: 'Random lava pools that damage on contact' },
        quicksand: { enabled: false, name: '🏜️ Quicksand', description: 'Slows movement and eventually sinks tanks' },
        electricFence: { enabled: false, name: '⚡ Electric Fences', description: 'Electrified barriers that damage on touch' },
        tornado: { enabled: false, name: '🌪️ Tornadoes', description: 'Roaming tornadoes that pull and damage tanks' },
        meteor: { enabled: false, name: '☄️ Meteor Shower', description: 'Random meteors fall from the sky' },
        acidRain: { enabled: false, name: '🌧️ Acid Rain', description: 'Periodic acid rain that damages exposed tanks' },
        earthquake: { enabled: false, name: '🌍 Earthquakes', description: 'Random ground shaking that affects movement' },
        lightning: { enabled: false, name: '⛈️ Lightning Storms', description: 'Random lightning strikes from above' },
        icePatches: { enabled: false, name: '❄️ Ice Patches', description: 'Slippery areas with no traction' },
        minefield: { enabled: false, name: '💣 Random Mines', description: 'Hidden mines scattered across the map' },
        spikes: { enabled: false, name: '🗡️ Spike Traps', description: 'Retractable spikes that emerge periodically' },
        crusher: { enabled: false, name: '🔨 Crushers', description: 'Moving walls that crush tanks between them' },
        blackHoles: { enabled: false, name: '⚫ Black Holes', description: 'Gravity wells that pull everything nearby' },
        fireWalls: { enabled: false, name: '🔥 Fire Walls', description: 'Moving walls of fire that sweep across' },
        poisonGas: { enabled: false, name: '☠️ Poison Gas', description: 'Toxic clouds that slowly damage tanks' },
        floodWater: { enabled: false, name: '🌊 Flash Floods', description: 'Rising water that drowns tanks' },
        sandstorm: { enabled: false, name: '🌬️ Sandstorms', description: 'Reduces visibility and damages over time' },
        solarFlare: { enabled: false, name: '☀️ Solar Flares', description: 'Periodic bursts that disable electronics' },
        geyser: { enabled: false, name: '♨️ Geysers', description: 'Steam jets that launch tanks into air' },
        sinkhole: { enabled: false, name: '🕳️ Sinkholes', description: 'Ground collapses creating instant death pits' },
        avalanche: { enabled: false, name: '🏔️ Avalanches', description: 'Falling rocks and debris from above' },
        windStorm: { enabled: false, name: '💨 Wind Storms', description: 'Strong winds that push tanks around' },
        radioactive: { enabled: false, name: '☢️ Radiation Zones', description: 'Areas that slowly damage and mutate' },
        tentacles: { enabled: false, name: '🐙 Tentacles', description: 'Monster tentacles that grab from below' },
        lasergrid: { enabled: false, name: '🔴 Laser Grid', description: 'Moving laser beams that slice through' },
        conveyor: { enabled: false, name: '➡️ Conveyor Belts', description: 'Moving floors that push tanks' },
        magneticField: { enabled: false, name: '🧲 Magnetic Anomalies', description: 'Areas that attract or repel metal' },
        voidZone: { enabled: false, name: '👁️ Void Zones', description: 'Reality tears that teleport randomly' },
        plasmaStorm: { enabled: false, name: '💜 Plasma Storms', description: 'Energy storms that disable weapons' },
        timeBubble: { enabled: false, name: '⏱️ Time Bubbles', description: 'Areas where time moves differently' }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}