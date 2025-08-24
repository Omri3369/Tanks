// TunnelSystem.js - Handles tunnel/teleportation system

class TunnelSystem {
    constructor() {
        this.tunnelEntrances = [];
        this.tunnelNetwork = new Map();
        this.teleportEffects = [];
    }
    
    generateTunnelSystem() {
        this.tunnelEntrances = [];
        this.tunnelNetwork.clear();
        
        // Generate 2-3 tunnel pairs (each tunnel has exactly 2 ends)
        const tunnelPairCount = Math.floor(Math.random() * 2) + 2; // 2-3 tunnel pairs
        const minDistance = 250 * CONFIG.GLOBAL_SCALE; // Minimum distance between portal ends
        
        for (let i = 0; i < tunnelPairCount; i++) {
            let validPair = false;
            let attempts = 0;
            let x1, y1, x2, y2;
            
            while (!validPair && attempts < 50) {
                // Generate first portal entrance
                x1 = Math.random() * (canvas.width - 100) + 50;
                y1 = Math.random() * (canvas.height - 100) + 50;
                
                // Generate second portal entrance (far from first)
                x2 = Math.random() * (canvas.width - 100) + 50;
                y2 = Math.random() * (canvas.height - 100) + 50;
                
                const pairDistance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                
                validPair = pairDistance >= minDistance;
                
                // Check not too close to existing entrances
                for (let entrance of this.tunnelEntrances) {
                    const dist1 = Math.sqrt(Math.pow(x1 - entrance.x, 2) + Math.pow(y1 - entrance.y, 2));
                    const dist2 = Math.sqrt(Math.pow(x2 - entrance.x, 2) + Math.pow(y2 - entrance.y, 2));
                    if (dist1 < 100 || dist2 < 100) {
                        validPair = false;
                        break;
                    }
                }
                
                // Check not on walls or water
                if (typeof walls !== 'undefined') {
                    for (let wall of walls) {
                        if ((x1 > wall.x - 30 && x1 < wall.x + wall.width + 30 &&
                             y1 > wall.y - 30 && y1 < wall.y + wall.height + 30) ||
                            (x2 > wall.x - 30 && x2 < wall.x + wall.width + 30 &&
                             y2 > wall.y - 30 && y2 < wall.y + wall.height + 30)) {
                            validPair = false;
                            break;
                        }
                    }
                }
                
                attempts++;
            }
            
            if (validPair) {
                // Create entrance 1
                const entrance1 = {
                    id: i * 2,
                    x: x1,
                    y: y1,
                    radius: 25 * CONFIG.GLOBAL_SCALE,
                    partnerId: i * 2 + 1,
                    color: `hsl(${i * 120}, 70%, 40%)` // Different color for each tunnel pair
                };
                
                // Create entrance 2
                const entrance2 = {
                    id: i * 2 + 1,
                    x: x2,
                    y: y2,
                    radius: 25 * CONFIG.GLOBAL_SCALE,
                    partnerId: i * 2,
                    color: `hsl(${i * 120}, 70%, 40%)` // Same color as partner
                };
                
                this.tunnelEntrances.push(entrance1);
                this.tunnelEntrances.push(entrance2);
                
                // Simple two-way connection
                this.tunnelNetwork.set(entrance1.id, entrance2.id);
                this.tunnelNetwork.set(entrance2.id, entrance1.id);
            }
        }
        
        console.log(`Generated ${this.tunnelEntrances.length} tunnel entrances (${this.tunnelEntrances.length / 2} pairs)`);
        
        // Update global variables for backward compatibility
        if (typeof tunnelEntrances !== 'undefined') {
            tunnelEntrances = this.tunnelEntrances;
        }
        if (typeof tunnelNetwork !== 'undefined') {
            tunnelNetwork = this.tunnelNetwork;
        }
    }
    
    drawTunnelEntrances(ctx) {
        this.tunnelEntrances.forEach(entrance => {
            ctx.save();
            
            // Draw portal with color coding
            const gradient = ctx.createRadialGradient(
                entrance.x, entrance.y, 0,
                entrance.x, entrance.y, entrance.radius
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
            gradient.addColorStop(0.6, entrance.color || 'rgba(20, 20, 20, 0.7)');
            gradient.addColorStop(1, 'rgba(40, 40, 40, 0.3)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(entrance.x, entrance.y, entrance.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw portal ring with color
            ctx.strokeStyle = entrance.color || '#444';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(entrance.x, entrance.y, entrance.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw swirling effect
            ctx.save();
            ctx.translate(entrance.x, entrance.y);
            ctx.rotate(Date.now() * 0.001);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, entrance.radius * 0.7, 0, Math.PI);
            ctx.stroke();
            ctx.restore();
            
            // Draw pulsing glow
            const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 0.8;
            ctx.shadowBlur = 15 * pulse;
            ctx.shadowColor = entrance.color || 'rgba(0, 100, 200, 0.5)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(entrance.x, entrance.y, entrance.radius + 3, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
        });
    }
    
    drawTeleportEffects(ctx) {
        // Update and draw teleport effects
        for (let i = this.teleportEffects.length - 1; i >= 0; i--) {
            const effect = this.teleportEffects[i];
            
            // Update effect
            if (effect.radius < effect.maxRadius) {
                effect.radius += 3; // Expand
            } else if (effect.radius > effect.maxRadius) {
                effect.radius -= 3; // Contract
            }
            
            effect.opacity -= 0.02;
            
            // Remove finished effects
            if (effect.opacity <= 0) {
                this.teleportEffects.splice(i, 1);
                continue;
            }
            
            // Draw effect
            ctx.save();
            ctx.globalAlpha = effect.opacity;
            
            // Ripple effect
            ctx.strokeStyle = effect.color || '#00FFFF';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Inner glow
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            
            // Particles
            const particleCount = 8;
            for (let j = 0; j < particleCount; j++) {
                const angle = (Math.PI * 2 / particleCount) * j + (Date.now() * 0.002);
                const px = effect.x + Math.cos(angle) * effect.radius;
                const py = effect.y + Math.sin(angle) * effect.radius;
                
                ctx.fillStyle = effect.color || '#00FFFF';
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        // Update global teleportEffects for backward compatibility
        if (typeof teleportEffects !== 'undefined') {
            teleportEffects = this.teleportEffects;
        }
    }
    
    addTeleportEffect(x, y, color) {
        this.teleportEffects.push({
            x: x,
            y: y,
            radius: 10,
            maxRadius: 50,
            opacity: 1.0,
            color: color || '#00FFFF'
        });
    }
    
    findTunnelEntrance(x, y, radius = 30) {
        for (let entrance of this.tunnelEntrances) {
            const distance = Math.sqrt(Math.pow(x - entrance.x, 2) + Math.pow(y - entrance.y, 2));
            if (distance <= entrance.radius + radius) {
                return entrance;
            }
        }
        return null;
    }
    
    getTunnelDestination(entranceId) {
        return this.tunnelNetwork.get(entranceId);
    }
    
    getEntranceById(id) {
        return this.tunnelEntrances.find(entrance => entrance.id === id);
    }
    
    getTunnelEntrances() {
        return this.tunnelEntrances;
    }
    
    getTeleportEffects() {
        return this.teleportEffects;
    }
}

// Create global instance and compatibility functions
window.tunnelSystem = new TunnelSystem();

// Backward compatibility wrapper functions
window.generateTunnelSystem = function() {
    window.tunnelSystem.generateTunnelSystem();
};

window.drawTunnelEntrances = function() {
    window.tunnelSystem.drawTunnelEntrances(ctx);
};

window.drawTeleportEffects = function() {
    window.tunnelSystem.drawTeleportEffects(ctx);
};

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TunnelSystem;
}