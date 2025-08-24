/**
 * Remote input handler for WebSocket-based controller input
 * Extends the existing InputHandler to support remote controls
 */

class RemoteInputHandler {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.remoteKeys = {};
        this.enabled = false;
    }
    
    /**
     * Connect to WebSocket server and register as game client
     */
    connect() {
        const wsUrl = `ws://${window.location.hostname}:8081`;
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('Game connected to WebSocket server');
                this.connected = true;
                this.updateStatusIndicator('Connected', true);
                
                // Register as game client
                this.ws.send(JSON.stringify({
                    type: 'register',
                    role: 'game'
                }));
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'registered') {
                        console.log('Game registered with server');
                        this.enabled = true;
                    } else if (data.type === 'control') {
                        this.handleRemoteControl(data);
                    }
                } catch (error) {
                    console.error('Error processing WebSocket message:', error);
                }
            };
            
            this.ws.onclose = () => {
                console.log('Game disconnected from WebSocket server');
                this.connected = false;
                this.enabled = false;
                this.updateStatusIndicator('Disconnected', false);
                this.clearRemoteKeys();
                
                // Try to reconnect after 3 seconds
                setTimeout(() => this.connect(), 3000);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.log('Could not connect to WebSocket server:', error);
            // Server might not be running, try again later
            setTimeout(() => this.connect(), 5000);
        }
    }
    
    /**
     * Handle incoming control messages from remote controller
     */
    handleRemoteControl(data) {
        const { playerId, action, pressed } = data;
        
        // Only handle Player 1 controls for now
        if (playerId !== 1) return;
        
        // Map controller actions to game keys
        const keyMap = {
            'up': 'ArrowUp',
            'down': 'ArrowDown',
            'left': 'ArrowLeft',
            'right': 'ArrowRight',
            'shoot': 'm'
        };
        
        const key = keyMap[action];
        if (key) {
            this.remoteKeys[key] = pressed;
        }
    }
    
    /**
     * Check if a remote key is pressed
     */
    isRemoteKeyPressed(key) {
        return this.enabled && !!this.remoteKeys[key];
    }
    
    /**
     * Clear all remote key states
     */
    clearRemoteKeys() {
        this.remoteKeys = {};
    }
    
    /**
     * Update the status indicator in the UI
     */
    updateStatusIndicator(status, connected) {
        const statusEl = document.getElementById('remoteStatus');
        if (statusEl) {
            statusEl.textContent = `Remote Control: ${status}`;
            statusEl.className = connected ? 'connected' : 'disconnected';
        }
    }
    
    /**
     * Get connection status
     */
    isConnected() {
        return this.connected && this.enabled;
    }
    
    /**
     * Send player color update to controller
     */
    sendPlayerColorUpdate(playerId, color) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'updatePlayerColor',
                playerId: playerId,
                color: color
            }));
        }
    }
    
    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
        this.enabled = false;
        this.clearRemoteKeys();
    }
}

// Export for both CommonJS and ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RemoteInputHandler;
} else if (typeof window !== 'undefined') {
    window.RemoteInputHandler = RemoteInputHandler;
}