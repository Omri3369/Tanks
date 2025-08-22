/**
 * Input handling system for tank game
 * Manages keyboard input, key states, and player controls
 */

class InputHandler {
    constructor() {
        this.keys = {};
        this.CONFIG = null; // Will be injected
        this.initialized = false;
    }

    /**
     * Initialize input handler with game dependencies
     * @param {Object} config - Game configuration
     */
    initialize(config) {
        this.CONFIG = config;
        if (!this.initialized) {
            this.setupEventListeners();
            this.initialized = true;
        }
    }

    /**
     * Set up keyboard event listeners
     */
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            e.preventDefault();
            const key = this.normalizeKey(e.key);
            this.keys[key] = true;
        });

        document.addEventListener('keyup', (e) => {
            const key = this.normalizeKey(e.key);
            this.keys[key] = false;
        });

        // Clear all keys when window loses focus
        window.addEventListener('blur', () => {
            Object.keys(this.keys).forEach(key => this.keys[key] = false);
        });
    }

    /**
     * Normalize key names for consistent handling
     * @param {string} key - Raw key from event
     * @returns {string} - Normalized key name
     */
    normalizeKey(key) {
        // Keep arrow keys as-is, convert others to lowercase
        return key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' 
            ? key 
            : key.toLowerCase();
    }

    /**
     * Check if a key is currently pressed
     * @param {string} key - Key to check
     * @returns {boolean} - True if key is pressed
     */
    isKeyPressed(key) {
        return !!this.keys[key];
    }

    /**
     * Get all currently pressed keys
     * @returns {Object} - Current key states
     */
    getKeyStates() {
        return { ...this.keys };
    }

    /**
     * Handle input for a tank with given controls
     * @param {Tank} tank - Tank to handle input for
     */
    handleTankInput(tank) {
        // Reset movement
        tank.speed = 0;
        tank.turnSpeed = 0;
        
        // Check movement keys
        if (this.isKeyPressed(tank.controls.up)) {
            tank.speed = this.CONFIG.TANK_SPEED;
        }
        if (this.isKeyPressed(tank.controls.down)) {
            tank.speed = -this.CONFIG.TANK_SPEED;
        }
        if (this.isKeyPressed(tank.controls.left)) {
            tank.turnSpeed = -this.CONFIG.TANK_TURN_SPEED;
        }
        if (this.isKeyPressed(tank.controls.right)) {
            tank.turnSpeed = this.CONFIG.TANK_TURN_SPEED;
        }
        
        // Check shoot key
        if (this.isKeyPressed(tank.controls.shoot) && tank.reloadTime === 0) {
            tank.shoot();
        }
    }

    /**
     * Clear all key states (useful for game reset)
     */
    clearAllKeys() {
        Object.keys(this.keys).forEach(key => this.keys[key] = false);
    }

    /**
     * Check if any movement key is pressed for given controls
     * @param {Object} controls - Control scheme to check
     * @returns {boolean} - True if any movement key is pressed
     */
    isMovementKeyPressed(controls) {
        return this.isKeyPressed(controls.up) ||
               this.isKeyPressed(controls.down) ||
               this.isKeyPressed(controls.left) ||
               this.isKeyPressed(controls.right);
    }

    /**
     * Check if shoot key is pressed for given controls
     * @param {Object} controls - Control scheme to check
     * @returns {boolean} - True if shoot key is pressed
     */
    isShootKeyPressed(controls) {
        return this.isKeyPressed(controls.shoot);
    }

    /**
     * Add a custom key handler for specific keys
     * @param {string} key - Key to handle
     * @param {Function} onKeyDown - Callback for key down
     * @param {Function} onKeyUp - Callback for key up (optional)
     */
    addCustomKeyHandler(key, onKeyDown, onKeyUp = null) {
        const normalizedKey = this.normalizeKey(key);
        
        document.addEventListener('keydown', (e) => {
            if (this.normalizeKey(e.key) === normalizedKey) {
                e.preventDefault();
                onKeyDown();
            }
        });

        if (onKeyUp) {
            document.addEventListener('keyup', (e) => {
                if (this.normalizeKey(e.key) === normalizedKey) {
                    onKeyUp();
                }
            });
        }
    }

    /**
     * Get default control schemes
     * @returns {Object} - Default player control configurations
     */
    getDefaultControls() {
        return {
            player1: {
                up: 'ArrowUp',
                down: 'ArrowDown',
                left: 'ArrowLeft',
                right: 'ArrowRight',
                shoot: 'm'
            },
            player2: {
                up: 'e',
                down: 's',
                left: 'd',
                right: 'f',
                shoot: 'q'
            }
        };
    }

    /**
     * Validate control scheme for conflicts
     * @param {Object} controls1 - First control scheme
     * @param {Object} controls2 - Second control scheme
     * @returns {Array} - Array of conflicting keys
     */
    validateControlSchemes(controls1, controls2) {
        const conflicts = [];
        const keys1 = Object.values(controls1);
        const keys2 = Object.values(controls2);
        
        for (let key1 of keys1) {
            if (keys2.includes(key1)) {
                conflicts.push(key1);
            }
        }
        
        return conflicts;
    }

    /**
     * Create a control scheme description for UI display
     * @param {Object} controls - Control scheme
     * @returns {Object} - Formatted control descriptions
     */
    getControlDescription(controls) {
        return {
            movement: `${controls.up}, ${controls.down}, ${controls.left}, ${controls.right}`,
            shoot: controls.shoot,
            formatted: {
                up: this.formatKeyName(controls.up),
                down: this.formatKeyName(controls.down),
                left: this.formatKeyName(controls.left),
                right: this.formatKeyName(controls.right),
                shoot: this.formatKeyName(controls.shoot)
            }
        };
    }

    /**
     * Format key name for display
     * @param {string} key - Raw key name
     * @returns {string} - Formatted key name
     */
    formatKeyName(key) {
        const keyMap = {
            'ArrowUp': '↑',
            'ArrowDown': '↓', 
            'ArrowLeft': '←',
            'ArrowRight': '→',
            ' ': 'Space'
        };
        
        return keyMap[key] || key.toUpperCase();
    }

    /**
     * Debug method to log current key states
     */
    debugKeyStates() {
        const pressedKeys = Object.keys(this.keys).filter(key => this.keys[key]);
        console.log('Pressed keys:', pressedKeys);
        return pressedKeys;
    }
}

// Export for both CommonJS and ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputHandler;
} else if (typeof window !== 'undefined') {
    window.InputHandler = InputHandler;
}