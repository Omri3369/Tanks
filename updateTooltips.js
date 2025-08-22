// Script to generate tooltip HTML for all items

const POWERUP_TOOLTIPS = {
    railgun: "Instant high-damage beam that penetrates all obstacles",
    chain: "Lightning that jumps between nearby enemies",
    boomerang: "Projectile that returns to the shooter, hitting twice",
    vortex: "Creates a gravity well that pulls enemies and projectiles",
    teleport: "Teleports your tank to where the shot lands",
    shield: "Creates a protective barrier that blocks incoming fire",
    bouncer: "Bullets that bounce off walls multiple times",
    emp: "Disables enemy weapons and abilities temporarily",
    acid: "Sprays corrosive acid that damages over time",
    swarm: "Releases multiple small homing missiles",
    phantom: "Bullets phase through walls to hit enemies",
    ricochet: "Enhanced bouncing bullets with tracking capabilities",
    tornado: "Creates a tornado that moves across the battlefield",
    blackhole: "Forms a black hole that sucks in everything nearby",
    mirror: "Duplicates your shots in multiple directions",
    cluster: "Bomb that splits into smaller explosives on impact",
    lightning: "Calls down lightning strikes from above",
    personalShield: "Temporary invincibility shield around your tank",
    invisibility: "Makes your tank invisible to enemies",
    speedBoost: "Temporarily increases movement and turn speed",
    timeWarp: "Slows down time for everything except you",
    decoy: "Creates a fake tank copy to confuse enemies",
    magnetField: "Attracts enemy bullets away from you",
    smokeScreen: "Deploys smoke that blocks enemy vision",
    healing: "Repairs damage and restores tank health",
    teleporter: "Instantly teleport to a random safe location",
    forceField: "360-degree shield that deflects projectiles",
    reflection: "Reflects enemy shots back at them",
    phaseShift: "Phase through bullets and walls temporarily",
    overcharge: "Doubles firing rate and damage output",
    vampire: "Heal yourself by damaging enemies",
    duplicate: "Creates a temporary AI-controlled clone of your tank",
    groundPound: "Area damage attack centered on your tank",
    grappleHook: "Pull enemies toward you or yourself to walls",
    reverseControls: "Reverses enemy tank controls temporarily",
    sizeChange: "Shrinks your tank making it harder to hit",
    wallBuilder: "Creates temporary walls for defense",
    radar: "Reveals all enemies on the map briefly",
    trap: "Deploys bear traps that immobilize enemies",
    kamikaze: "Self-destruct with massive area damage",
    resurrect: "Revive once after being destroyed",
    mindControl: "Take control of an enemy tank temporarily",
    portal: "Create linked portals for strategic movement",
    earthquake: "Shakes the ground, stunning all enemies",
    nanobots: "Slowly repairs your tank over time",
    hologram: "Creates multiple holographic decoys",
    energyDrain: "Steals special ammo from nearby enemies"
};

const HAZARD_TOOLTIPS = {
    lavaPool: "Pools of molten lava that deal continuous damage to tanks",
    quicksand: "Slows movement speed and can trap tanks if they stay too long",
    electricFence: "Electrified barriers that damage and stun on contact",
    tornado: "Moving tornadoes that throw tanks around the battlefield",
    meteor: "Periodic meteor strikes from above with area damage",
    acidRain: "Corrosive rain that slowly damages all exposed tanks",
    earthquake: "Ground tremors that shake tanks and affect aiming",
    lightning: "Random lightning strikes during storms",
    icePatches: "Slippery ice that makes tanks harder to control",
    minefield: "Hidden mines that explode when tanks get too close",
    spikes: "Retractable spike traps that damage passing tanks",
    crusher: "Moving walls that crush tanks caught between them",
    blackHoles: "Gravitational anomalies that pull in tanks and projectiles",
    fireWalls: "Walls of fire that damage tanks passing through",
    poisonGas: "Toxic clouds that damage and impair vision",
    floodWater: "Rising water that drowns tanks in low areas",
    sandstorm: "Reduces visibility and slows movement",
    solarFlare: "Periodic bursts that disable electronics temporarily",
    geyser: "Steam geysers that launch tanks into the air",
    sinkhole: "Ground collapses creating holes tanks can fall into",
    avalanche: "Falling rocks and debris from above",
    windStorm: "Strong winds that affect projectile trajectories",
    radioactive: "Radiation zones that slowly damage tanks over time",
    tentacles: "Grabbing tentacles that emerge from the ground",
    lasergrid: "Moving laser grids that cut through anything",
    conveyor: "Moving belts that push tanks in specific directions",
    magneticField: "Magnetic zones that affect metal projectiles",
    voidZone: "Areas where abilities and weapons don't work",
    plasmaStorm: "Energy storms that randomly damage areas",
    timeBubble: "Zones where time moves at different speeds"
};

// Generate HTML for tooltips
console.log("POWERUP TOOLTIPS:");
Object.entries(POWERUP_TOOLTIPS).forEach(([key, desc]) => {
    console.log(`powerup_${key}: <span class="info-icon">i<span class="tooltip">${desc}</span></span>`);
});

console.log("\nHAZARD TOOLTIPS:");
Object.entries(HAZARD_TOOLTIPS).forEach(([key, desc]) => {
    console.log(`hazard_${key}: <span class="info-icon">i<span class="tooltip">${desc}</span></span>`);
});