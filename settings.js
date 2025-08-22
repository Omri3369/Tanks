// Settings management functions for the standalone settings page

// Tab switching functionality
function openTab(evt, tabName) {
    // Hide all tab contents
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active');
    }
    
    // Remove active class from all tab buttons
    const tabButtons = document.getElementsByClassName('tab-button');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }
    
    // Show the selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to the clicked button
    evt.currentTarget.classList.add('active');
}

// Power-up control functions
function selectAllPowerups() {
    const checkboxes = document.querySelectorAll('#allowed-powerups-tab input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        // Trigger animation
        checkbox.style.animation = 'none';
        setTimeout(() => {
            checkbox.style.animation = 'checkPulse 0.4s ease';
        }, 10);
    });
}

function unselectAllPowerups() {
    const checkboxes = document.querySelectorAll('#allowed-powerups-tab input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

function randomizePowerups() {
    const checkboxes = document.querySelectorAll('#allowed-powerups-tab input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const wasChecked = checkbox.checked;
        checkbox.checked = Math.random() > 0.5;
        if (checkbox.checked && !wasChecked) {
            // Trigger animation for newly checked items
            checkbox.style.animation = 'none';
            setTimeout(() => {
                checkbox.style.animation = 'checkPulse 0.4s ease';
            }, Math.random() * 300);
        }
    });
}

// Hazard control functions
function selectAllHazards() {
    const checkboxes = document.querySelectorAll('#hazards-tab input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        // Trigger animation
        checkbox.style.animation = 'none';
        setTimeout(() => {
            checkbox.style.animation = 'checkPulse 0.4s ease';
        }, 10);
    });
}

function unselectAllHazards() {
    const checkboxes = document.querySelectorAll('#hazards-tab input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

function randomizeHazards() {
    const checkboxes = document.querySelectorAll('#hazards-tab input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const wasChecked = checkbox.checked;
        checkbox.checked = Math.random() > 0.5;
        if (checkbox.checked && !wasChecked) {
            // Trigger animation for newly checked items
            checkbox.style.animation = 'none';
            setTimeout(() => {
                checkbox.style.animation = 'checkPulse 0.4s ease';
            }, Math.random() * 300);
        }
    });
}

// Function to load settings from parent window or localStorage
function loadCurrentSettings() {
    // Try to get settings from parent window first (if opened as modal/iframe)
    let settings = {};
    
    if (window.opener && window.opener.CONFIG) {
        // If opened as popup, get settings from parent
        settings = window.opener.CONFIG;
    } else {
        // Otherwise, load from localStorage
        const savedSettings = localStorage.getItem('tankGameSettings');
        if (savedSettings) {
            settings = JSON.parse(savedSettings);
        } else {
            // Use default values from config.js
            settings = CONFIG;
        }
    }
    
    // Tank Properties
    document.getElementById('tankSpeed').value = settings.TANK_SPEED || 2;
    document.getElementById('tankTurnSpeed').value = settings.TANK_TURN_SPEED || 0.05;
    document.getElementById('tankSize').value = settings.TANK_SIZE || 30;
    document.getElementById('specialAmmo').value = settings.TANK_MAX_SPECIAL_AMMO || 5;
    document.getElementById('reloadTime').value = settings.TANK_RELOAD_TIME || 30;
    
    // Bullet Properties
    document.getElementById('bulletSpeed').value = settings.BULLET_SPEED || 4;
    document.getElementById('bulletSize').value = settings.BULLET_SIZE || 4;
    document.getElementById('bulletLifetime').value = settings.BULLET_LIFETIME || 300;
    
    // Power-up Properties
    document.getElementById('powerupCount').value = settings.POWERUP_COUNT || 3;
    document.getElementById('powerupSize').value = settings.POWERUP_SIZE || 25;
    document.getElementById('powerupRespawn').value = settings.POWERUP_RESPAWN_TIME || 300;
    
    // Game Mechanics
    document.getElementById('gracePeriod').value = settings.GRACE_PERIOD || 180;
    document.getElementById('collectibleCount').value = settings.COLLECTIBLE_COUNT || 3;
    
    // Ring of Fire
    document.getElementById('ringEnabled').checked = settings.RING_OF_FIRE_ENABLED !== false;
    document.getElementById('ringWarning').value = settings.RING_OF_FIRE_WARNING_TIME || 30;
    document.getElementById('ringSafeZone').value = settings.RING_OF_FIRE_SAFE_ZONE_SIZE || 20;
    
    // Game Rules
    document.getElementById('friendlyFire').checked = settings.FRIENDLY_FIRE || false;
    
    // Player Colors
    document.getElementById('player1Color').value = settings.PLAYER1_COLOR || '#4CAF50';
    document.getElementById('player1SecondaryColor').value = settings.PLAYER1_SECONDARY_COLOR || '#2E7D32';
    document.getElementById('player2Color').value = settings.PLAYER2_COLOR || '#ff9800';
    document.getElementById('player2SecondaryColor').value = settings.PLAYER2_SECONDARY_COLOR || '#E65100';
    
    // Training Mode Settings
    document.getElementById('trainingStationaryTargets').value = settings.TRAINING_STATIONARY_TARGETS || 3;
    document.getElementById('trainingMovingTargets').value = settings.TRAINING_MOVING_TARGETS || 2;
    document.getElementById('trainingTargetHealth').value = settings.TRAINING_TARGET_HEALTH || 3;
    document.getElementById('trainingTargetSize').value = settings.TRAINING_TARGET_SIZE || 25;
    document.getElementById('trainingTargetRespawn').value = settings.TRAINING_TARGET_RESPAWN_TIME || 180;
    document.getElementById('trainingMovingSpeed').value = settings.TRAINING_MOVING_SPEED || 1;
    document.getElementById('trainingMovingRange').value = settings.TRAINING_MOVING_RANGE || 150;
    document.getElementById('trainingAimingHelper').checked = settings.TRAINING_AIMING_HELPER !== false;
    
    // Drone Settings
    document.getElementById('droneSize').value = settings.DRONE_SIZE || 12;
    document.getElementById('droneSpeed').value = settings.DRONE_SPEED || 1.5;
    document.getElementById('droneOrbitDistance').value = settings.DRONE_ORBIT_DISTANCE || 60;
    document.getElementById('droneHealth').value = settings.DRONE_HEALTH || 3;
    document.getElementById('droneReloadTime').value = settings.DRONE_RELOAD_TIME || 60;
    document.getElementById('droneBulletSpeed').value = settings.DRONE_BULLET_SPEED || 2.5;
    document.getElementById('droneBulletSize').value = settings.DRONE_BULLET_SIZE || 3;
    document.getElementById('droneTargetRange').value = settings.DRONE_TARGET_RANGE || 150;
    document.getElementById('droneOrbitSpeed').value = settings.DRONE_ORBIT_SPEED || 0.02;
    
    // Load power-up checkboxes
    const powerupTypes = settings.ALLOWED_POWERUP_TYPES || ['scatter', 'laser', 'rocket', 'explosive', 'piercing', 'mine', 'drone'];
    document.querySelectorAll('[id^="powerup_"]').forEach(checkbox => {
        const powerupName = checkbox.id.replace('powerup_', '');
        checkbox.checked = powerupTypes.includes(powerupName);
    });
    
    // Load hazard checkboxes
    const hazardTypes = settings.ALLOWED_HAZARD_TYPES || [];
    document.querySelectorAll('[id^="hazard_"]').forEach(checkbox => {
        const hazardName = checkbox.id.replace('hazard_', '');
        checkbox.checked = hazardTypes.includes(hazardName);
    });
    
    // AI Settings
    document.getElementById('aiDifficulty').value = settings.AI_DIFFICULTY || 'medium';
    document.getElementById('aiReactionTime').value = settings.AI_REACTION_TIME || 500;
    document.getElementById('aiAimAccuracy').value = settings.AI_AIM_ACCURACY || 70;
    document.getElementById('aiAggressiveness').value = settings.AI_AGGRESSIVENESS || 'balanced';
    document.getElementById('aiPowerupUsage').value = settings.AI_POWERUP_USAGE || 'strategic';
    document.getElementById('aiCheats').checked = settings.AI_CHEATS || false;
    
    // Map Generation
    document.getElementById('mapType').value = settings.MAP_TYPE || 'open';
    document.getElementById('wallDensity').value = settings.WALL_DENSITY || 15;
    document.getElementById('destructibleWalls').checked = settings.DESTRUCTIBLE_WALLS !== false;
    document.getElementById('wallHealth').value = settings.WALL_HEALTH || 3;
    document.getElementById('spawnProtection').checked = settings.SPAWN_PROTECTION !== false;
    document.getElementById('terrainVariation').checked = settings.TERRAIN_VARIATION !== false;
    document.getElementById('mapSize').value = settings.MAP_SIZE || 'medium';
    document.getElementById('symmetricalLayout').checked = settings.SYMMETRICAL_LAYOUT !== false;
    
    // AI Opponents
    document.getElementById('aiBotCount').value = settings.AI_BOT_COUNT || 0;
    document.getElementById('aiBotNames').value = settings.AI_BOT_NAMES || 'Alpha, Beta, Gamma, Delta';
    document.getElementById('aiTeamBalance').checked = settings.AI_TEAM_BALANCE !== false;
}

function applySettings() {
    const settings = {};
    
    // Tank Properties
    settings.TANK_SPEED = parseFloat(document.getElementById('tankSpeed').value);
    settings.TANK_TURN_SPEED = parseFloat(document.getElementById('tankTurnSpeed').value);
    settings.TANK_SIZE = parseInt(document.getElementById('tankSize').value);
    settings.TANK_MAX_SPECIAL_AMMO = parseInt(document.getElementById('specialAmmo').value);
    settings.TANK_RELOAD_TIME = parseInt(document.getElementById('reloadTime').value);
    
    // Bullet Properties
    settings.BULLET_SPEED = parseFloat(document.getElementById('bulletSpeed').value);
    settings.BULLET_SIZE = parseInt(document.getElementById('bulletSize').value);
    settings.BULLET_LIFETIME = parseInt(document.getElementById('bulletLifetime').value);
    
    // Power-up Properties
    settings.POWERUP_COUNT = parseInt(document.getElementById('powerupCount').value);
    settings.POWERUP_SIZE = parseInt(document.getElementById('powerupSize').value);
    settings.POWERUP_RESPAWN_TIME = parseInt(document.getElementById('powerupRespawn').value);
    
    // Game Mechanics
    settings.GRACE_PERIOD = parseInt(document.getElementById('gracePeriod').value);
    settings.COLLECTIBLE_COUNT = parseInt(document.getElementById('collectibleCount').value);
    
    // Ring of Fire
    settings.RING_OF_FIRE_ENABLED = document.getElementById('ringEnabled').checked;
    settings.RING_OF_FIRE_WARNING_TIME = parseInt(document.getElementById('ringWarning').value);
    settings.RING_OF_FIRE_SAFE_ZONE_SIZE = parseInt(document.getElementById('ringSafeZone').value);
    
    // Game Rules
    settings.FRIENDLY_FIRE = document.getElementById('friendlyFire').checked;
    
    // Player Colors
    settings.PLAYER1_COLOR = document.getElementById('player1Color').value;
    settings.PLAYER1_SECONDARY_COLOR = document.getElementById('player1SecondaryColor').value;
    settings.PLAYER2_COLOR = document.getElementById('player2Color').value;
    settings.PLAYER2_SECONDARY_COLOR = document.getElementById('player2SecondaryColor').value;
    
    // Training Mode Settings
    settings.TRAINING_STATIONARY_TARGETS = parseInt(document.getElementById('trainingStationaryTargets').value);
    settings.TRAINING_MOVING_TARGETS = parseInt(document.getElementById('trainingMovingTargets').value);
    settings.TRAINING_TARGET_HEALTH = parseInt(document.getElementById('trainingTargetHealth').value);
    settings.TRAINING_TARGET_SIZE = parseInt(document.getElementById('trainingTargetSize').value);
    settings.TRAINING_TARGET_RESPAWN_TIME = parseInt(document.getElementById('trainingTargetRespawn').value);
    settings.TRAINING_MOVING_SPEED = parseFloat(document.getElementById('trainingMovingSpeed').value);
    settings.TRAINING_MOVING_RANGE = parseInt(document.getElementById('trainingMovingRange').value);
    settings.TRAINING_AIMING_HELPER = document.getElementById('trainingAimingHelper').checked;
    
    // Drone Settings
    settings.DRONE_SIZE = parseInt(document.getElementById('droneSize').value);
    settings.DRONE_SPEED = parseFloat(document.getElementById('droneSpeed').value);
    settings.DRONE_ORBIT_DISTANCE = parseInt(document.getElementById('droneOrbitDistance').value);
    settings.DRONE_HEALTH = parseInt(document.getElementById('droneHealth').value);
    settings.DRONE_RELOAD_TIME = parseInt(document.getElementById('droneReloadTime').value);
    settings.DRONE_BULLET_SPEED = parseFloat(document.getElementById('droneBulletSpeed').value);
    settings.DRONE_BULLET_SIZE = parseInt(document.getElementById('droneBulletSize').value);
    settings.DRONE_TARGET_RANGE = parseInt(document.getElementById('droneTargetRange').value);
    settings.DRONE_ORBIT_SPEED = parseFloat(document.getElementById('droneOrbitSpeed').value);
    
    // Collect enabled power-ups
    settings.ALLOWED_POWERUP_TYPES = [];
    document.querySelectorAll('[id^="powerup_"]').forEach(checkbox => {
        if (checkbox.checked) {
            settings.ALLOWED_POWERUP_TYPES.push(checkbox.id.replace('powerup_', ''));
        }
    });
    
    // Collect enabled hazards
    settings.ALLOWED_HAZARD_TYPES = [];
    document.querySelectorAll('[id^="hazard_"]').forEach(checkbox => {
        if (checkbox.checked) {
            settings.ALLOWED_HAZARD_TYPES.push(checkbox.id.replace('hazard_', ''));
        }
    });
    
    // Save to localStorage
    localStorage.setItem('tankGameSettings', JSON.stringify(settings));
    
    // Show confirmation and go back to main menu
    alert('Settings applied successfully!');
    window.location.href = 'index.html';
}

function resetToDefaults() {
    // Clear localStorage
    localStorage.removeItem('tankGameSettings');
    
    // Reload default settings
    loadCurrentSettings();
    
    alert('Settings reset to defaults!');
}

function hideSettings() {
    // Go back to main menu
    window.location.href = 'index.html';
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadCurrentSettings();
});