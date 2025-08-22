/**
 * Global Event Bus for decoupled communication between game components
 * Uses the Publisher-Subscriber pattern
 */
class EventBus {
    constructor() {
        this.events = new Map();
        this.eventHistory = [];
        this.maxHistorySize = 100;
        this.debugMode = false;
    }
    
    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Function to call when event is emitted
     * @param {Object} context - Optional context to bind to callback
     * @returns {Function} Unsubscribe function
     */
    on(eventName, callback, context = null) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        
        const listener = {
            callback,
            context,
            once: false
        };
        
        this.events.get(eventName).push(listener);
        
        // Return unsubscribe function
        return () => this.off(eventName, callback);
    }
    
    /**
     * Subscribe to an event only once
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Function to call when event is emitted
     * @param {Object} context - Optional context to bind to callback
     */
    once(eventName, callback, context = null) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        
        const listener = {
            callback,
            context,
            once: true
        };
        
        this.events.get(eventName).push(listener);
    }
    
    /**
     * Unsubscribe from an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Function to remove
     */
    off(eventName, callback) {
        if (!this.events.has(eventName)) return;
        
        const listeners = this.events.get(eventName);
        const index = listeners.findIndex(l => l.callback === callback);
        
        if (index !== -1) {
            listeners.splice(index, 1);
        }
        
        if (listeners.length === 0) {
            this.events.delete(eventName);
        }
    }
    
    /**
     * Emit an event
     * @param {string} eventName - Name of the event
     * @param {*} data - Data to pass to listeners
     */
    emit(eventName, data = null) {
        // Log to history
        if (this.debugMode) {
            this.logEvent(eventName, data);
        }
        
        if (!this.events.has(eventName)) return;
        
        const listeners = this.events.get(eventName);
        const listenersToRemove = [];
        
        listeners.forEach(listener => {
            try {
                if (listener.context) {
                    listener.callback.call(listener.context, data);
                } else {
                    listener.callback(data);
                }
                
                if (listener.once) {
                    listenersToRemove.push(listener);
                }
            } catch (error) {
                console.error(`Error in event listener for ${eventName}:`, error);
            }
        });
        
        // Remove one-time listeners
        listenersToRemove.forEach(listener => {
            const index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        });
    }
    
    /**
     * Clear all listeners for an event
     * @param {string} eventName - Name of the event
     */
    clear(eventName) {
        this.events.delete(eventName);
    }
    
    /**
     * Clear all event listeners
     */
    clearAll() {
        this.events.clear();
    }
    
    /**
     * Log event for debugging
     * @private
     */
    logEvent(eventName, data) {
        const entry = {
            eventName,
            data,
            timestamp: Date.now(),
            listeners: this.events.get(eventName)?.length || 0
        };
        
        this.eventHistory.push(entry);
        
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
        
        console.log(`[EventBus] ${eventName}`, data);
    }
    
    /**
     * Get event history for debugging
     */
    getHistory() {
        return this.eventHistory;
    }
    
    /**
     * Enable/disable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
}

// Global singleton instance
const globalEventBus = new EventBus();

// Game Events Constants
const GameEvents = {
    // Tank Events
    TANK_SPAWNED: 'tank.spawned',
    TANK_DESTROYED: 'tank.destroyed',
    TANK_DAMAGED: 'tank.damaged',
    TANK_HEALED: 'tank.healed',
    TANK_POWERUP_COLLECTED: 'tank.powerup.collected',
    TANK_POWERUP_EXPIRED: 'tank.powerup.expired',
    TANK_SHOOT: 'tank.shoot',
    TANK_MOVE: 'tank.move',
    TANK_FROZEN: 'tank.frozen',
    TANK_UNFROZEN: 'tank.unfrozen',
    
    // Game State Events
    GAME_START: 'game.start',
    GAME_PAUSE: 'game.pause',
    GAME_RESUME: 'game.resume',
    GAME_OVER: 'game.over',
    ROUND_START: 'round.start',
    ROUND_END: 'round.end',
    WAVE_START: 'wave.start',
    WAVE_COMPLETE: 'wave.complete',
    
    // Combat Events
    BULLET_FIRED: 'bullet.fired',
    BULLET_HIT: 'bullet.hit',
    EXPLOSION_CREATED: 'explosion.created',
    MINE_PLACED: 'mine.placed',
    MINE_TRIGGERED: 'mine.triggered',
    
    // Collectible Events
    POWERUP_SPAWNED: 'powerup.spawned',
    POWERUP_COLLECTED: 'powerup.collected',
    COLLECTIBLE_SPAWNED: 'collectible.spawned',
    COLLECTIBLE_COLLECTED: 'collectible.collected',
    
    // Environmental Events
    HAZARD_ACTIVATED: 'hazard.activated',
    HAZARD_DAMAGED_TANK: 'hazard.damaged',
    RING_OF_FIRE_WARNING: 'ring.warning',
    RING_OF_FIRE_SHRINKING: 'ring.shrinking',
    
    // UI Events
    SCORE_UPDATED: 'score.updated',
    HEALTH_UPDATED: 'health.updated',
    AMMO_UPDATED: 'ammo.updated',
    MESSAGE_DISPLAY: 'message.display',
    
    // Achievement Events
    ACHIEVEMENT_UNLOCKED: 'achievement.unlocked',
    MILESTONE_REACHED: 'milestone.reached',
    
    // Network Events
    PLAYER_CONNECTED: 'player.connected',
    PLAYER_DISCONNECTED: 'player.disconnected',
    SYNC_STATE: 'sync.state',
    
    // Audio Events
    PLAY_SOUND: 'audio.play',
    STOP_SOUND: 'audio.stop',
    PLAY_MUSIC: 'audio.music.play',
    STOP_MUSIC: 'audio.music.stop'
};

// Example Usage:
/*
// Subscribe to tank destruction
globalEventBus.on(GameEvents.TANK_DESTROYED, (data) => {
    console.log(`Tank ${data.tank.id} was destroyed by ${data.destroyer.id}`);
    // Update score
    // Play explosion sound
    // Create particles
});

// Emit tank destruction event
globalEventBus.emit(GameEvents.TANK_DESTROYED, {
    tank: destroyedTank,
    destroyer: attackingTank,
    position: { x, y },
    timestamp: Date.now()
});
*/

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventBus, globalEventBus, GameEvents };
}