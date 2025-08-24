class SettingsManager {
    constructor() {
        this.storageKey = 'tankGameSettings';
        this.currentSettings = {};
    }
    
    updateSettings(settings) {
        // Update all the game variables with the new settings
        this.updateTankSettings(settings);
        this.updateBulletSettings(settings);
        this.updatePowerUpSettings(settings);
        this.updateGameplaySettings(settings);
        this.updatePlayerSettings(settings);
        this.updateTrainingSettings(settings);
        this.updateDroneSettings(settings);
        this.updateMiscSettings(settings);
        
        // Store current settings
        this.currentSettings = { ...settings };
        
        // Re-initialize systems with updated CONFIG
        if (typeof inputHandler !== 'undefined') {
            inputHandler.initialize(CONFIG);
        }
        if (typeof aiSystem !== 'undefined' && typeof gameState !== 'undefined') {
            aiSystem.initialize(CONFIG, gameState);
        }
    }
    
    updateTankSettings(settings) {
        if (typeof TANK_SPEED !== 'undefined') {
            TANK_SPEED = settings.TANK_SPEED !== undefined ? settings.TANK_SPEED : TANK_SPEED;
        }
        if (typeof TANK_TURN_SPEED !== 'undefined') {
            TANK_TURN_SPEED = settings.TANK_TURN_SPEED !== undefined ? settings.TANK_TURN_SPEED : TANK_TURN_SPEED;
        }
        if (typeof TANK_SIZE !== 'undefined') {
            TANK_SIZE = settings.TANK_SIZE !== undefined ? settings.TANK_SIZE : TANK_SIZE;
        }
        
        // Update CONFIG object
        if (typeof CONFIG !== 'undefined') {
            CONFIG.TANK_SPEED = TANK_SPEED;
            CONFIG.TANK_TURN_SPEED = TANK_TURN_SPEED;
            CONFIG.TANK_SIZE = TANK_SIZE;
            CONFIG.TANK_MAX_SPECIAL_AMMO = settings.TANK_MAX_SPECIAL_AMMO !== undefined ? settings.TANK_MAX_SPECIAL_AMMO : CONFIG.TANK_MAX_SPECIAL_AMMO;
            CONFIG.TANK_RELOAD_TIME = settings.TANK_RELOAD_TIME !== undefined ? settings.TANK_RELOAD_TIME : CONFIG.TANK_RELOAD_TIME;
        }
    }
    
    updateBulletSettings(settings) {
        if (typeof BULLET_SPEED !== 'undefined') {
            BULLET_SPEED = settings.BULLET_SPEED !== undefined ? settings.BULLET_SPEED : BULLET_SPEED;
        }
        if (typeof BULLET_SIZE !== 'undefined') {
            BULLET_SIZE = settings.BULLET_SIZE !== undefined ? settings.BULLET_SIZE : BULLET_SIZE;
        }
        if (typeof BULLET_LIFETIME !== 'undefined') {
            BULLET_LIFETIME = settings.BULLET_LIFETIME !== undefined ? settings.BULLET_LIFETIME : BULLET_LIFETIME;
        }
        
        // Update CONFIG object
        if (typeof CONFIG !== 'undefined') {
            CONFIG.BULLET_SPEED = BULLET_SPEED;
            CONFIG.BULLET_SIZE = BULLET_SIZE;
            CONFIG.BULLET_LIFETIME = BULLET_LIFETIME;
        }
    }
    
    updatePowerUpSettings(settings) {
        if (typeof CONFIG !== 'undefined') {
            CONFIG.POWERUP_COUNT = settings.POWERUP_COUNT !== undefined ? settings.POWERUP_COUNT : CONFIG.POWERUP_COUNT;
            CONFIG.POWERUP_RESPAWN_TIME = settings.POWERUP_RESPAWN_TIME !== undefined ? settings.POWERUP_RESPAWN_TIME : CONFIG.POWERUP_RESPAWN_TIME;
        }
        if (typeof POWERUP_SIZE !== 'undefined') {
            POWERUP_SIZE = settings.POWERUP_SIZE !== undefined ? settings.POWERUP_SIZE : POWERUP_SIZE;
            if (typeof CONFIG !== 'undefined') {
                CONFIG.POWERUP_SIZE = POWERUP_SIZE;
            }
        }
    }
    
    updateGameplaySettings(settings) {
        if (typeof CONFIG !== 'undefined') {
            CONFIG.GRACE_PERIOD = settings.GRACE_PERIOD !== undefined ? settings.GRACE_PERIOD : CONFIG.GRACE_PERIOD;
            CONFIG.AI_TANK_COUNT = settings.AI_TANK_COUNT !== undefined ? settings.AI_TANK_COUNT : CONFIG.AI_TANK_COUNT;
            
            CONFIG.RING_OF_FIRE_ENABLED = settings.RING_OF_FIRE_ENABLED !== undefined ? settings.RING_OF_FIRE_ENABLED : CONFIG.RING_OF_FIRE_ENABLED;
            CONFIG.RING_WARNING_TIME = (settings.RING_OF_FIRE_WARNING_TIME !== undefined ? settings.RING_OF_FIRE_WARNING_TIME : 30) * 1000;
            CONFIG.RING_MIN_RADIUS_MULT = (settings.RING_OF_FIRE_SAFE_ZONE_SIZE !== undefined ? settings.RING_OF_FIRE_SAFE_ZONE_SIZE : 20) / 100;
            
            CONFIG.FRIENDLY_FIRE = settings.FRIENDLY_FIRE !== undefined ? settings.FRIENDLY_FIRE : CONFIG.FRIENDLY_FIRE;
        }
    }
    
    updatePlayerSettings(settings) {
        if (typeof PLAYER1_COLOR !== 'undefined') {
            PLAYER1_COLOR = settings.PLAYER1_COLOR !== undefined ? settings.PLAYER1_COLOR : PLAYER1_COLOR;
        }
        if (typeof PLAYER1_SECONDARY_COLOR !== 'undefined') {
            PLAYER1_SECONDARY_COLOR = settings.PLAYER1_SECONDARY_COLOR !== undefined ? settings.PLAYER1_SECONDARY_COLOR : PLAYER1_SECONDARY_COLOR;
        }
        if (typeof PLAYER2_COLOR !== 'undefined') {
            PLAYER2_COLOR = settings.PLAYER2_COLOR !== undefined ? settings.PLAYER2_COLOR : PLAYER2_COLOR;
        }
        if (typeof PLAYER2_SECONDARY_COLOR !== 'undefined') {
            PLAYER2_SECONDARY_COLOR = settings.PLAYER2_SECONDARY_COLOR !== undefined ? settings.PLAYER2_SECONDARY_COLOR : PLAYER2_SECONDARY_COLOR;
        }
    }
    
    updateTrainingSettings(settings) {
        if (typeof CONFIG !== 'undefined') {
            CONFIG.TRAINING_STATIONARY_TARGETS = settings.TRAINING_STATIONARY_TARGETS !== undefined ? settings.TRAINING_STATIONARY_TARGETS : CONFIG.TRAINING_STATIONARY_TARGETS;
            CONFIG.TRAINING_MOVING_TARGETS = settings.TRAINING_MOVING_TARGETS !== undefined ? settings.TRAINING_MOVING_TARGETS : CONFIG.TRAINING_MOVING_TARGETS;
            CONFIG.TRAINING_TARGET_HEALTH = settings.TRAINING_TARGET_HEALTH !== undefined ? settings.TRAINING_TARGET_HEALTH : CONFIG.TRAINING_TARGET_HEALTH;
            CONFIG.TRAINING_TARGET_SIZE = settings.TRAINING_TARGET_SIZE !== undefined ? settings.TRAINING_TARGET_SIZE : CONFIG.TRAINING_TARGET_SIZE;
            CONFIG.TRAINING_TARGET_RESPAWN_TIME = settings.TRAINING_TARGET_RESPAWN_TIME !== undefined ? settings.TRAINING_TARGET_RESPAWN_TIME : CONFIG.TRAINING_TARGET_RESPAWN_TIME;
            CONFIG.TRAINING_MOVING_TARGET_SPEED = settings.TRAINING_MOVING_SPEED !== undefined ? settings.TRAINING_MOVING_SPEED : CONFIG.TRAINING_MOVING_TARGET_SPEED;
            CONFIG.TRAINING_MOVING_TARGET_RANGE = settings.TRAINING_MOVING_RANGE !== undefined ? settings.TRAINING_MOVING_RANGE : CONFIG.TRAINING_MOVING_TARGET_RANGE;
            CONFIG.TRAINING_AIMING_HELPER = settings.TRAINING_AIMING_HELPER !== undefined ? settings.TRAINING_AIMING_HELPER : CONFIG.TRAINING_AIMING_HELPER;
        }
    }
    
    updateDroneSettings(settings) {
        if (typeof CONFIG !== 'undefined') {
            CONFIG.DRONE_SIZE = settings.DRONE_SIZE !== undefined ? settings.DRONE_SIZE : CONFIG.DRONE_SIZE;
            CONFIG.DRONE_SPEED = settings.DRONE_SPEED !== undefined ? settings.DRONE_SPEED : CONFIG.DRONE_SPEED;
            CONFIG.DRONE_ORBIT_DISTANCE = settings.DRONE_ORBIT_DISTANCE !== undefined ? settings.DRONE_ORBIT_DISTANCE : CONFIG.DRONE_ORBIT_DISTANCE;
            CONFIG.DRONE_HEALTH = settings.DRONE_HEALTH !== undefined ? settings.DRONE_HEALTH : CONFIG.DRONE_HEALTH;
            CONFIG.DRONE_RELOAD_TIME = settings.DRONE_RELOAD_TIME !== undefined ? settings.DRONE_RELOAD_TIME : CONFIG.DRONE_RELOAD_TIME;
            CONFIG.DRONE_BULLET_SPEED = settings.DRONE_BULLET_SPEED !== undefined ? settings.DRONE_BULLET_SPEED : CONFIG.DRONE_BULLET_SPEED;
            CONFIG.DRONE_BULLET_SIZE = settings.DRONE_BULLET_SIZE !== undefined ? settings.DRONE_BULLET_SIZE : CONFIG.DRONE_BULLET_SIZE;
            CONFIG.DRONE_TARGET_RANGE = settings.DRONE_TARGET_RANGE !== undefined ? settings.DRONE_TARGET_RANGE : CONFIG.DRONE_TARGET_RANGE;
            CONFIG.DRONE_ORBIT_SPEED = settings.DRONE_ORBIT_SPEED !== undefined ? settings.DRONE_ORBIT_SPEED : CONFIG.DRONE_ORBIT_SPEED;
        }
    }
    
    updateMiscSettings(settings) {
        if (typeof CONFIG !== 'undefined') {
            CONFIG.ALLOWED_POWERUP_TYPES = settings.ALLOWED_POWERUP_TYPES !== undefined ? settings.ALLOWED_POWERUP_TYPES : CONFIG.ALLOWED_POWERUP_TYPES;
            CONFIG.ALLOWED_HAZARD_TYPES = settings.ALLOWED_HAZARD_TYPES !== undefined ? settings.ALLOWED_HAZARD_TYPES : CONFIG.ALLOWED_HAZARD_TYPES;
        }
    }
    
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.currentSettings));
        } catch (error) {
            console.error('Failed to save settings to localStorage:', error);
        }
    }
    
    loadFromStorage() {
        try {
            const savedSettings = localStorage.getItem(this.storageKey);
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                this.updateSettings(settings);
                return settings;
            }
        } catch (error) {
            console.error('Failed to load settings from localStorage:', error);
        }
        return null;
    }
    
    getCurrentSettings() {
        return { ...this.currentSettings };
    }
    
    resetToDefaults() {
        // Reset all values to original CONFIG values
        const defaultSettings = {
            TANK_SIZE: CONFIG.TANK_SIZE,
            TANK_SPEED: CONFIG.TANK_SPEED,
            TANK_TURN_SPEED: CONFIG.TANK_TURN_SPEED,
            BULLET_SPEED: CONFIG.BULLET_SPEED,
            BULLET_SIZE: CONFIG.BULLET_SIZE,
            BULLET_LIFETIME: CONFIG.BULLET_LIFETIME,
            POWERUP_SIZE: CONFIG.POWERUP_SIZE,
            PLAYER1_COLOR: DEFAULT_COLORS.PLAYER1_COLOR,
            PLAYER2_COLOR: DEFAULT_COLORS.PLAYER2_COLOR,
            PLAYER1_SECONDARY_COLOR: DEFAULT_COLORS.PLAYER1_SECONDARY_COLOR,
            PLAYER2_SECONDARY_COLOR: DEFAULT_COLORS.PLAYER2_SECONDARY_COLOR
        };
        
        this.updateSettings(defaultSettings);
        this.loadFormWithCurrentSettings();
    }
    
    loadFormWithCurrentSettings() {
        // Load form elements with current settings
        const formElements = [
            { id: 'tankSpeed', value: typeof TANK_SPEED !== 'undefined' ? TANK_SPEED : CONFIG.TANK_SPEED },
            { id: 'tankTurnSpeed', value: typeof TANK_TURN_SPEED !== 'undefined' ? TANK_TURN_SPEED : CONFIG.TANK_TURN_SPEED },
            { id: 'tankSize', value: typeof TANK_SIZE !== 'undefined' ? TANK_SIZE : CONFIG.TANK_SIZE },
            { id: 'specialAmmo', value: CONFIG.TANK_MAX_SPECIAL_AMMO },
            { id: 'reloadTime', value: CONFIG.TANK_RELOAD_TIME },
            { id: 'bulletSpeed', value: typeof BULLET_SPEED !== 'undefined' ? BULLET_SPEED : CONFIG.BULLET_SPEED },
            { id: 'bulletSize', value: typeof BULLET_SIZE !== 'undefined' ? BULLET_SIZE : CONFIG.BULLET_SIZE },
            { id: 'bulletLifetime', value: typeof BULLET_LIFETIME !== 'undefined' ? BULLET_LIFETIME : CONFIG.BULLET_LIFETIME },
            { id: 'powerupCount', value: CONFIG.POWERUP_COUNT },
            { id: 'powerupSize', value: typeof POWERUP_SIZE !== 'undefined' ? POWERUP_SIZE : CONFIG.POWERUP_SIZE },
            { id: 'powerupRespawn', value: CONFIG.POWERUP_RESPAWN_TIME },
            { id: 'gracePeriod', value: CONFIG.GRACE_PERIOD },
            { id: 'aiCount', value: CONFIG.AI_TANK_COUNT },
            { id: 'ringWarning', value: CONFIG.RING_WARNING_TIME / 1000 },
            { id: 'ringSafeZone', value: CONFIG.RING_MIN_RADIUS_MULT * 100 },
            { id: 'player1Color', value: typeof PLAYER1_COLOR !== 'undefined' ? PLAYER1_COLOR : DEFAULT_COLORS.PLAYER1_COLOR },
            { id: 'player2Color', value: typeof PLAYER2_COLOR !== 'undefined' ? PLAYER2_COLOR : DEFAULT_COLORS.PLAYER2_COLOR },
            { id: 'player1SecondaryColor', value: typeof PLAYER1_SECONDARY_COLOR !== 'undefined' ? PLAYER1_SECONDARY_COLOR : DEFAULT_COLORS.PLAYER1_SECONDARY_COLOR },
            { id: 'player2SecondaryColor', value: typeof PLAYER2_SECONDARY_COLOR !== 'undefined' ? PLAYER2_SECONDARY_COLOR : DEFAULT_COLORS.PLAYER2_SECONDARY_COLOR }
        ];
        
        formElements.forEach(element => {
            const domElement = document.getElementById(element.id);
            if (domElement) {
                domElement.value = element.value;
            }
        });
        
        // Load training settings
        const trainingElements = [
            { id: 'trainingStationaryTargets', value: CONFIG.TRAINING_STATIONARY_TARGETS },
            { id: 'trainingMovingTargets', value: CONFIG.TRAINING_MOVING_TARGETS },
            { id: 'trainingTargetHealth', value: CONFIG.TRAINING_TARGET_HEALTH },
            { id: 'trainingTargetSize', value: CONFIG.TRAINING_TARGET_SIZE },
            { id: 'trainingTargetRespawn', value: CONFIG.TRAINING_TARGET_RESPAWN_TIME },
            { id: 'trainingMovingSpeed', value: CONFIG.TRAINING_MOVING_TARGET_SPEED },
            { id: 'trainingMovingRange', value: CONFIG.TRAINING_MOVING_TARGET_RANGE }
        ];
        
        trainingElements.forEach(element => {
            const domElement = document.getElementById(element.id);
            if (domElement) {
                domElement.value = element.value;
            }
        });
        
        // Load checkboxes
        const checkboxes = [
            { id: 'trainingAimingHelper', checked: CONFIG.TRAINING_AIMING_HELPER }
        ];
        
        checkboxes.forEach(checkbox => {
            const domElement = document.getElementById(checkbox.id);
            if (domElement) {
                domElement.checked = checkbox.checked;
            }
        });
    }
    
    applySettingsFromForm() {
        // Collect all form values and apply them as settings
        const settings = this.collectFormSettings();
        this.updateSettings(settings);
        this.saveToStorage();
        
        // Send updated colors to controllers if available
        if (typeof remoteInputHandler !== 'undefined') {
            remoteInputHandler.sendPlayerColorUpdate(1, PLAYER1_COLOR);
            remoteInputHandler.sendPlayerColorUpdate(2, PLAYER2_COLOR);
        }
    }
    
    collectFormSettings() {
        const settings = {};
        
        // Collect form values
        const formMappings = [
            { formId: 'tankSpeed', settingKey: 'TANK_SPEED', type: 'float' },
            { formId: 'tankTurnSpeed', settingKey: 'TANK_TURN_SPEED', type: 'float' },
            { formId: 'tankSize', settingKey: 'TANK_SIZE', type: 'int' },
            { formId: 'specialAmmo', settingKey: 'TANK_MAX_SPECIAL_AMMO', type: 'int' },
            { formId: 'reloadTime', settingKey: 'TANK_RELOAD_TIME', type: 'int' },
            { formId: 'bulletSpeed', settingKey: 'BULLET_SPEED', type: 'int' },
            { formId: 'bulletSize', settingKey: 'BULLET_SIZE', type: 'int' },
            { formId: 'bulletLifetime', settingKey: 'BULLET_LIFETIME', type: 'int' },
            { formId: 'powerupCount', settingKey: 'POWERUP_COUNT', type: 'int' },
            { formId: 'powerupSize', settingKey: 'POWERUP_SIZE', type: 'int' },
            { formId: 'powerupRespawn', settingKey: 'POWERUP_RESPAWN_TIME', type: 'int' },
            { formId: 'gracePeriod', settingKey: 'GRACE_PERIOD', type: 'int' },
            { formId: 'aiCount', settingKey: 'AI_TANK_COUNT', type: 'int' },
            { formId: 'ringWarning', settingKey: 'RING_OF_FIRE_WARNING_TIME', type: 'int' },
            { formId: 'ringSafeZone', settingKey: 'RING_OF_FIRE_SAFE_ZONE_SIZE', type: 'int' },
            { formId: 'player1Color', settingKey: 'PLAYER1_COLOR', type: 'string' },
            { formId: 'player2Color', settingKey: 'PLAYER2_COLOR', type: 'string' },
            { formId: 'player1SecondaryColor', settingKey: 'PLAYER1_SECONDARY_COLOR', type: 'string' },
            { formId: 'player2SecondaryColor', settingKey: 'PLAYER2_SECONDARY_COLOR', type: 'string' }
        ];
        
        formMappings.forEach(mapping => {
            const element = document.getElementById(mapping.formId);
            if (element) {
                let value = element.value;
                if (mapping.type === 'int') {
                    value = parseInt(value);
                } else if (mapping.type === 'float') {
                    value = parseFloat(value);
                }
                settings[mapping.settingKey] = value;
            }
        });
        
        return settings;
    }
}

// Make it globally available
if (typeof window !== 'undefined') {
    window.SettingsManager = SettingsManager;
    
    // Create global instance
    window.settingsManager = new SettingsManager();
    
    // Export compatibility functions
    window.updateSettingsFromPopup = function(settings) {
        window.settingsManager.updateSettings(settings);
    };
    
    window.loadSettingsFromStorage = function() {
        return window.settingsManager.loadFromStorage();
    };
    
    window.loadCurrentSettings = function() {
        window.settingsManager.loadFormWithCurrentSettings();
    };
    
    window.resetToDefaults = function() {
        window.settingsManager.resetToDefaults();
    };
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsManager;
}