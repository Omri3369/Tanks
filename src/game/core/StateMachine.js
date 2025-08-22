/**
 * State Machine for managing game states
 */
class StateMachine {
    constructor(initialState = null) {
        this.states = new Map();
        this.currentState = null;
        this.previousState = null;
        this.transitioning = false;
        this.stateHistory = [];
        this.maxHistorySize = 10;
        
        if (initialState) {
            this.currentState = initialState;
        }
    }
    
    /**
     * Register a state
     * @param {string} name - State name
     * @param {State} state - State instance
     */
    registerState(name, state) {
        if (!(state instanceof State)) {
            throw new Error('State must extend State class');
        }
        
        state.stateMachine = this;
        state.name = name;
        this.states.set(name, state);
    }
    
    /**
     * Transition to a new state
     * @param {string} stateName - Name of the state to transition to
     * @param {Object} data - Optional data to pass to the new state
     */
    async transition(stateName, data = {}) {
        if (this.transitioning) {
            console.warn('Already transitioning, ignoring request');
            return;
        }
        
        if (!this.states.has(stateName)) {
            throw new Error(`State ${stateName} not found`);
        }
        
        this.transitioning = true;
        
        // Exit current state
        if (this.currentState) {
            await this.currentState.exit();
            this.previousState = this.currentState;
            this.addToHistory(this.currentState.name);
        }
        
        // Enter new state
        this.currentState = this.states.get(stateName);
        await this.currentState.enter(data);
        
        this.transitioning = false;
        
        // Emit state change event
        if (globalEventBus) {
            globalEventBus.emit('state.changed', {
                from: this.previousState?.name,
                to: stateName,
                data
            });
        }
    }
    
    /**
     * Update current state
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        if (this.currentState && !this.transitioning) {
            this.currentState.update(deltaTime);
        }
    }
    
    /**
     * Render current state
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        if (this.currentState && !this.transitioning) {
            this.currentState.render(ctx);
        }
    }
    
    /**
     * Handle input for current state
     * @param {Object} input - Input data
     */
    handleInput(input) {
        if (this.currentState && !this.transitioning) {
            this.currentState.handleInput(input);
        }
    }
    
    /**
     * Get current state name
     */
    getCurrentStateName() {
        return this.currentState?.name;
    }
    
    /**
     * Check if in a specific state
     */
    isInState(stateName) {
        return this.currentState?.name === stateName;
    }
    
    /**
     * Add state to history
     * @private
     */
    addToHistory(stateName) {
        this.stateHistory.push({
            state: stateName,
            timestamp: Date.now()
        });
        
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.shift();
        }
    }
    
    /**
     * Get state history
     */
    getHistory() {
        return this.stateHistory;
    }
}

/**
 * Base State class
 */
class State {
    constructor() {
        this.stateMachine = null;
        this.name = '';
    }
    
    /**
     * Called when entering this state
     * @param {Object} data - Optional data passed during transition
     */
    async enter(data = {}) {
        // Override in subclasses
    }
    
    /**
     * Called when exiting this state
     */
    async exit() {
        // Override in subclasses
    }
    
    /**
     * Update state logic
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Override in subclasses
    }
    
    /**
     * Render state
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        // Override in subclasses
    }
    
    /**
     * Handle input
     * @param {Object} input - Input data
     */
    handleInput(input) {
        // Override in subclasses
    }
    
    /**
     * Transition to another state
     * @param {string} stateName - Target state name
     * @param {Object} data - Optional data
     */
    transition(stateName, data = {}) {
        if (this.stateMachine) {
            this.stateMachine.transition(stateName, data);
        }
    }
}

/**
 * Menu State
 */
class MenuState extends State {
    constructor(gameManager) {
        super();
        this.gameManager = gameManager;
        this.selectedOption = 0;
        this.menuOptions = [
            { text: 'Single Player', action: () => this.startGame(1) },
            { text: 'Two Player', action: () => this.startGame(2) },
            { text: 'AI Battle', action: () => this.startGame(3) },
            { text: 'Survival', action: () => this.startGame(4) },
            { text: 'Training', action: () => this.startGame(5) },
            { text: 'Settings', action: () => this.openSettings() }
        ];
    }
    
    async enter(data) {
        console.log('Entering Menu State');
        this.selectedOption = 0;
        
        // Stop any game music
        globalEventBus.emit(GameEvents.STOP_MUSIC);
        
        // Play menu music
        globalEventBus.emit(GameEvents.PLAY_MUSIC, { track: 'menu' });
    }
    
    async exit() {
        console.log('Exiting Menu State');
    }
    
    update(deltaTime) {
        // Animate menu elements
    }
    
    render(ctx) {
        // Render menu
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Title
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TANK BATTLE', ctx.canvas.width / 2, 100);
        
        // Menu options
        this.menuOptions.forEach((option, index) => {
            ctx.fillStyle = index === this.selectedOption ? '#FFD700' : '#FFFFFF';
            ctx.font = '30px Arial';
            ctx.fillText(option.text, ctx.canvas.width / 2, 250 + index * 50);
        });
    }
    
    handleInput(input) {
        if (input.key === 'ArrowUp') {
            this.selectedOption = (this.selectedOption - 1 + this.menuOptions.length) % this.menuOptions.length;
            globalEventBus.emit(GameEvents.PLAY_SOUND, { sound: 'menu_move' });
        } else if (input.key === 'ArrowDown') {
            this.selectedOption = (this.selectedOption + 1) % this.menuOptions.length;
            globalEventBus.emit(GameEvents.PLAY_SOUND, { sound: 'menu_move' });
        } else if (input.key === 'Enter') {
            this.menuOptions[this.selectedOption].action();
            globalEventBus.emit(GameEvents.PLAY_SOUND, { sound: 'menu_select' });
        }
    }
    
    startGame(mode) {
        this.transition('playing', { gameMode: mode });
    }
    
    openSettings() {
        this.transition('settings');
    }
}

/**
 * Playing State
 */
class PlayingState extends State {
    constructor(gameManager) {
        super();
        this.gameManager = gameManager;
        this.paused = false;
    }
    
    async enter(data) {
        console.log('Entering Playing State', data);
        
        // Start game with specified mode
        this.gameManager.startGame(data.gameMode || 1);
        
        // Emit game start event
        globalEventBus.emit(GameEvents.GAME_START, {
            mode: data.gameMode,
            timestamp: Date.now()
        });
    }
    
    async exit() {
        console.log('Exiting Playing State');
        
        // Clean up game
        this.gameManager.stop();
    }
    
    update(deltaTime) {
        if (!this.paused) {
            this.gameManager.update(deltaTime);
        }
    }
    
    render(ctx) {
        this.gameManager.render(ctx);
        
        if (this.paused) {
            // Render pause overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', ctx.canvas.width / 2, ctx.canvas.height / 2);
        }
    }
    
    handleInput(input) {
        if (input.key === 'Escape') {
            this.togglePause();
        } else if (!this.paused) {
            this.gameManager.handleInput(input);
        }
    }
    
    togglePause() {
        this.paused = !this.paused;
        globalEventBus.emit(this.paused ? GameEvents.GAME_PAUSE : GameEvents.GAME_RESUME);
    }
}

/**
 * Game Over State
 */
class GameOverState extends State {
    constructor(gameManager) {
        super();
        this.gameManager = gameManager;
        this.winner = null;
        this.scores = {};
    }
    
    async enter(data) {
        console.log('Entering Game Over State');
        this.winner = data.winner;
        this.scores = data.scores;
        
        // Play game over sound
        globalEventBus.emit(GameEvents.PLAY_SOUND, { sound: 'game_over' });
    }
    
    render(ctx) {
        // Render game over screen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', ctx.canvas.width / 2, 200);
        
        if (this.winner) {
            ctx.fillStyle = this.winner.color;
            ctx.font = 'bold 40px Arial';
            ctx.fillText(`${this.winner.name} WINS!`, ctx.canvas.width / 2, 300);
        }
        
        // Show scores
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '30px Arial';
        let y = 400;
        Object.entries(this.scores).forEach(([player, score]) => {
            ctx.fillText(`Player ${player}: ${score}`, ctx.canvas.width / 2, y);
            y += 40;
        });
        
        ctx.font = '20px Arial';
        ctx.fillText('Press ENTER to return to menu', ctx.canvas.width / 2, ctx.canvas.height - 100);
    }
    
    handleInput(input) {
        if (input.key === 'Enter') {
            this.transition('menu');
        }
    }
}

/**
 * Settings State
 */
class SettingsState extends State {
    constructor(gameManager) {
        super();
        this.gameManager = gameManager;
        this.selectedCategory = 0;
        this.selectedSetting = 0;
        this.categories = [
            {
                name: 'Game',
                settings: [
                    { name: 'Difficulty', type: 'select', options: ['Easy', 'Normal', 'Hard'] },
                    { name: 'Friendly Fire', type: 'toggle' },
                    { name: 'Ring of Fire', type: 'toggle' }
                ]
            },
            {
                name: 'Graphics',
                settings: [
                    { name: 'Particles', type: 'toggle' },
                    { name: 'Shadows', type: 'toggle' },
                    { name: 'Screen Shake', type: 'toggle' }
                ]
            },
            {
                name: 'Audio',
                settings: [
                    { name: 'Master Volume', type: 'slider', min: 0, max: 100 },
                    { name: 'Music Volume', type: 'slider', min: 0, max: 100 },
                    { name: 'SFX Volume', type: 'slider', min: 0, max: 100 }
                ]
            }
        ];
    }
    
    async enter(data) {
        console.log('Entering Settings State');
        this.selectedCategory = 0;
        this.selectedSetting = 0;
    }
    
    render(ctx) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Title
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SETTINGS', ctx.canvas.width / 2, 50);
        
        // Categories
        let x = 100;
        this.categories.forEach((category, index) => {
            ctx.fillStyle = index === this.selectedCategory ? '#FFD700' : '#FFFFFF';
            ctx.font = '25px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(category.name, x, 120);
            x += 200;
        });
        
        // Settings for selected category
        const category = this.categories[this.selectedCategory];
        let y = 200;
        category.settings.forEach((setting, index) => {
            ctx.fillStyle = index === this.selectedSetting ? '#FFD700' : '#FFFFFF';
            ctx.font = '20px Arial';
            ctx.fillText(setting.name, 100, y);
            
            // Render setting value
            this.renderSettingValue(ctx, setting, 400, y);
            y += 40;
        });
        
        // Instructions
        ctx.fillStyle = '#888888';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Use arrow keys to navigate, ENTER to change, ESC to go back', ctx.canvas.width / 2, ctx.canvas.height - 50);
    }
    
    renderSettingValue(ctx, setting, x, y) {
        switch(setting.type) {
            case 'toggle':
                ctx.fillStyle = setting.value ? '#4CAF50' : '#FF0000';
                ctx.fillText(setting.value ? 'ON' : 'OFF', x, y);
                break;
            case 'slider':
                // Draw slider
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y - 15, 100, 10);
                
                const fillWidth = (setting.value / setting.max) * 100;
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(x, y - 15, fillWidth, 10);
                
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(setting.value, x + 120, y);
                break;
            case 'select':
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(setting.options[setting.value || 0], x, y);
                break;
        }
    }
    
    handleInput(input) {
        if (input.key === 'Escape') {
            this.transition('menu');
        } else if (input.key === 'ArrowLeft') {
            this.selectedCategory = Math.max(0, this.selectedCategory - 1);
            this.selectedSetting = 0;
        } else if (input.key === 'ArrowRight') {
            this.selectedCategory = Math.min(this.categories.length - 1, this.selectedCategory + 1);
            this.selectedSetting = 0;
        } else if (input.key === 'ArrowUp') {
            this.selectedSetting = Math.max(0, this.selectedSetting - 1);
        } else if (input.key === 'ArrowDown') {
            const maxSettings = this.categories[this.selectedCategory].settings.length - 1;
            this.selectedSetting = Math.min(maxSettings, this.selectedSetting + 1);
        } else if (input.key === 'Enter') {
            this.changeSetting();
        }
    }
    
    changeSetting() {
        const setting = this.categories[this.selectedCategory].settings[this.selectedSetting];
        
        switch(setting.type) {
            case 'toggle':
                setting.value = !setting.value;
                break;
            case 'select':
                setting.value = (setting.value + 1) % setting.options.length;
                break;
            case 'slider':
                // Would need left/right arrows to adjust
                break;
        }
        
        // Apply setting change
        this.applySetting(setting);
    }
    
    applySetting(setting) {
        // Emit setting change event
        globalEventBus.emit('setting.changed', {
            name: setting.name,
            value: setting.value
        });
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StateMachine, State, MenuState, PlayingState, GameOverState, SettingsState };
}