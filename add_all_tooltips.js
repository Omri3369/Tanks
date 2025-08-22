// Script to add all remaining tooltips to settings.html
// This will be executed manually to update the HTML

const fs = require('fs');

// Read the current HTML file
let html = fs.readFileSync('settings.html', 'utf8');

// Define all tooltip replacements for remaining power-ups
const powerupReplacements = [
    { id: 'phantom', label: '👻 Phantom Shot', desc: 'Bullets phase through walls to hit enemies' },
    { id: 'ricochet', label: '🎱 Ricochet Master', desc: 'Enhanced bouncing bullets with tracking capabilities' },
    { id: 'tornado', label: '🌪️ Tornado', desc: 'Creates a tornado that moves across the battlefield' },
    { id: 'blackhole', label: '⚫ Black Hole', desc: 'Forms a black hole that sucks in everything nearby' },
    { id: 'mirror', label: '🪞 Mirror Shot', desc: 'Duplicates your shots in multiple directions' },
    { id: 'cluster', label: '💣 Cluster Bomb', desc: 'Bomb that splits into smaller explosives on impact' },
    { id: 'lightning', label: '⚡ Lightning Strike', desc: 'Calls down lightning strikes from above' },
    { id: 'personalShield', label: '🛡️ Personal Shield', desc: 'Temporary invincibility shield around your tank' },
    { id: 'invisibility', label: '👤 Invisibility Cloak', desc: 'Makes your tank invisible to enemies' },
    { id: 'speedBoost', label: '💨 Turbo Boost', desc: 'Temporarily increases movement and turn speed' },
    { id: 'timeWarp', label: '⏰ Time Warp', desc: 'Slows down time for everything except you' },
    { id: 'decoy', label: '🎭 Decoy Tank', desc: 'Creates a fake tank copy to confuse enemies' },
    { id: 'magnetField', label: '🧲 Magnetic Field', desc: 'Attracts enemy bullets away from you' },
    { id: 'smokeScreen', label: '💨 Smoke Screen', desc: 'Deploys smoke that blocks enemy vision' },
    { id: 'healing', label: '❤️ Repair Kit', desc: 'Repairs damage and restores tank health' },
    { id: 'teleporter', label: '🌀 Teleporter', desc: 'Instantly teleport to a random safe location' },
    { id: 'forceField', label: '⚡ Force Field', desc: '360-degree shield that deflects projectiles' },
    { id: 'reflection', label: '🔄 Reflection Armor', desc: 'Reflects enemy shots back at them' },
    { id: 'phaseShift', label: '👻 Phase Shift', desc: 'Phase through bullets and walls temporarily' },
    { id: 'overcharge', label: '⚡ Overcharge', desc: 'Doubles firing rate and damage output' },
    { id: 'vampire', label: '🦇 Vampire Mode', desc: 'Heal yourself by damaging enemies' },
    { id: 'duplicate', label: '👥 Duplicate', desc: 'Creates a temporary AI-controlled clone of your tank' },
    { id: 'groundPound', label: '💥 Ground Pound', desc: 'Area damage attack centered on your tank' },
    { id: 'grappleHook', label: '🪝 Grapple Hook', desc: 'Pull enemies toward you or yourself to walls' },
    { id: 'reverseControls', label: '🔄 Confusion Ray', desc: 'Reverses enemy tank controls temporarily' },
    { id: 'sizeChange', label: '🔬 Size Modifier', desc: 'Shrinks your tank making it harder to hit' },
    { id: 'wallBuilder', label: '🧱 Wall Builder', desc: 'Creates temporary walls for defense' },
    { id: 'radar', label: '📡 Radar Pulse', desc: 'Reveals all enemies on the map briefly' },
    { id: 'trap', label: '🕸️ Trap Deployer', desc: 'Deploys bear traps that immobilize enemies' },
    { id: 'kamikaze', label: '💣 Kamikaze Mode', desc: 'Self-destruct with massive area damage' },
    { id: 'resurrect', label: '✨ Phoenix Rising', desc: 'Revive once after being destroyed' },
    { id: 'mindControl', label: '🧠 Mind Control', desc: 'Take control of an enemy tank temporarily' },
    { id: 'portal', label: '🌌 Portal Gun', desc: 'Create linked portals for strategic movement' },
    { id: 'earthquake', label: '🌍 Earthquake', desc: 'Shakes the ground, stunning all enemies' },
    { id: 'nanobots', label: '🤖 Nanobots', desc: 'Slowly repairs your tank over time' },
    { id: 'hologram', label: '📽️ Hologram', desc: 'Creates multiple holographic decoys' },
    { id: 'energyDrain', label: '🔋 Energy Drain', desc: 'Steals special ammo from nearby enemies' }
];

// Define all hazard tooltips
const hazardReplacements = [
    { id: 'lavaPool', label: '🌋 Lava Pools', desc: 'Pools of molten lava that deal continuous damage to tanks' },
    { id: 'quicksand', label: '🏜️ Quicksand', desc: 'Slows movement speed and can trap tanks if they stay too long' },
    { id: 'electricFence', label: '⚡ Electric Fences', desc: 'Electrified barriers that damage and stun on contact' },
    { id: 'tornado', label: '🌪️ Tornadoes', desc: 'Moving tornadoes that throw tanks around the battlefield' },
    { id: 'meteor', label: '☄️ Meteor Shower', desc: 'Periodic meteor strikes from above with area damage' },
    { id: 'acidRain', label: '🌧️ Acid Rain', desc: 'Corrosive rain that slowly damages all exposed tanks' },
    { id: 'earthquake', label: '🌍 Earthquakes', desc: 'Ground tremors that shake tanks and affect aiming' },
    { id: 'lightning', label: '⛈️ Lightning Storms', desc: 'Random lightning strikes during storms' },
    { id: 'icePatches', label: '❄️ Ice Patches', desc: 'Slippery ice that makes tanks harder to control' },
    { id: 'minefield', label: '💣 Random Mines', desc: 'Hidden mines that explode when tanks get too close' },
    { id: 'spikes', label: '🗡️ Spike Traps', desc: 'Retractable spike traps that damage passing tanks' },
    { id: 'crusher', label: '🔨 Crushers', desc: 'Moving walls that crush tanks caught between them' },
    { id: 'blackHoles', label: '⚫ Black Holes', desc: 'Gravitational anomalies that pull in tanks and projectiles' },
    { id: 'fireWalls', label: '🔥 Fire Walls', desc: 'Walls of fire that damage tanks passing through' },
    { id: 'poisonGas', label: '☠️ Poison Gas', desc: 'Toxic clouds that damage and impair vision' },
    { id: 'floodWater', label: '🌊 Flash Floods', desc: 'Rising water that drowns tanks in low areas' },
    { id: 'sandstorm', label: '🌬️ Sandstorms', desc: 'Reduces visibility and slows movement' },
    { id: 'solarFlare', label: '☀️ Solar Flares', desc: 'Periodic bursts that disable electronics temporarily' },
    { id: 'geyser', label: '♨️ Geysers', desc: 'Steam geysers that launch tanks into the air' },
    { id: 'sinkhole', label: '🕳️ Sinkholes', desc: 'Ground collapses creating holes tanks can fall into' },
    { id: 'avalanche', label: '🏔️ Avalanches', desc: 'Falling rocks and debris from above' },
    { id: 'windStorm', label: '💨 Wind Storms', desc: 'Strong winds that affect projectile trajectories' },
    { id: 'radioactive', label: '☢️ Radiation Zones', desc: 'Radiation zones that slowly damage tanks over time' },
    { id: 'tentacles', label: '🐙 Tentacles', desc: 'Grabbing tentacles that emerge from the ground' },
    { id: 'lasergrid', label: '🔴 Laser Grid', desc: 'Moving laser grids that cut through anything' },
    { id: 'conveyor', label: '➡️ Conveyor Belts', desc: 'Moving belts that push tanks in specific directions' },
    { id: 'magneticField', label: '🧲 Magnetic Anomalies', desc: 'Magnetic zones that affect metal projectiles' },
    { id: 'voidZone', label: '👁️ Void Zones', desc: 'Areas where abilities and weapons don\\'t work' },
    { id: 'plasmaStorm', label: '💜 Plasma Storms', desc: 'Energy storms that randomly damage areas' },
    { id: 'timeBubble', label: '⏱️ Time Bubbles', desc: 'Zones where time moves at different speeds' }
];

console.log('Run these updates manually in the settings.html file');
console.log('Power-ups to update:', powerupReplacements.length);
console.log('Hazards to update:', hazardReplacements.length);