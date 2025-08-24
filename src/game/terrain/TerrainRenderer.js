// TerrainRenderer.js - Handles terrain rendering and visual effects

class TerrainRenderer {
    constructor() {
        this.terrainCanvas = null;
        this.terrainCtx = null;
        this.terrainCached = false;
    }
    
    initTerrainCache() {
        if (!this.terrainCanvas) {
            this.terrainCanvas = document.createElement('canvas');
            this.terrainCanvas.width = canvas.width;
            this.terrainCanvas.height = canvas.height;
            this.terrainCtx = this.terrainCanvas.getContext('2d');
        }
    }
    
    renderTerrainToCache() {
        this.initTerrainCache();
        const tileSize = 40 * CONFIG.GLOBAL_SCALE;
        
        // Base ground color
        this.terrainCtx.fillStyle = '#8B7D6B';
        this.terrainCtx.fillRect(0, 0, this.terrainCanvas.width, this.terrainCanvas.height);
        
        // Draw tiles with variations
        terrainTiles.forEach((tile) => {
            // Apply color variation
            const r = parseInt(tile.baseColor.substr(1, 2), 16);
            const g = parseInt(tile.baseColor.substr(3, 2), 16);
            const b = parseInt(tile.baseColor.substr(5, 2), 16);
            
            const variation = tile.variation;
            const newR = Math.max(0, Math.min(255, r + r * variation));
            const newG = Math.max(0, Math.min(255, g + g * variation));
            const newB = Math.max(0, Math.min(255, b + b * variation));
            
            this.terrainCtx.fillStyle = `rgb(${Math.floor(newR)}, ${Math.floor(newG)}, ${Math.floor(newB)})`;
            this.terrainCtx.fillRect(tile.x, tile.y, tile.size - 1, tile.size - 1);
            
            // Add texture patterns based on tile type
            this.terrainCtx.save();
            if (tile.type === 'gravel') {
                // Draw small dots for gravel texture
                this.terrainCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                for (let i = 0; i < 5; i++) {
                    const dx = tile.x + Math.random() * tile.size;
                    const dy = tile.y + Math.random() * tile.size;
                    this.terrainCtx.beginPath();
                    this.terrainCtx.arc(dx, dy, 1, 0, Math.PI * 2);
                    this.terrainCtx.fill();
                }
            } else if (tile.type === 'sand') {
                // Draw subtle lines for sand texture
                this.terrainCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                this.terrainCtx.lineWidth = 1;
                this.terrainCtx.beginPath();
                this.terrainCtx.moveTo(tile.x, tile.y + tile.size * 0.3);
                this.terrainCtx.lineTo(tile.x + tile.size, tile.y + tile.size * 0.7);
                this.terrainCtx.stroke();
            } else if (tile.type === 'grass') {
                // Draw small lines for grass texture
                this.terrainCtx.strokeStyle = 'rgba(100, 140, 60, 0.3)';
                this.terrainCtx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    const gx = tile.x + Math.random() * tile.size;
                    const gy = tile.y + Math.random() * tile.size;
                    this.terrainCtx.beginPath();
                    this.terrainCtx.moveTo(gx, gy);
                    this.terrainCtx.lineTo(gx + 2, gy - 4);
                    this.terrainCtx.stroke();
                }
            }
            this.terrainCtx.restore();
        });
        
        // Draw terrain features
        terrainFeatures.forEach(feature => {
            this.terrainCtx.save();
            
            if (feature.type === 'crater') {
                // Draw crater
                const gradient = this.terrainCtx.createRadialGradient(
                    feature.x, feature.y, 0,
                    feature.x, feature.y, feature.radius
                );
                gradient.addColorStop(0, `rgba(40, 30, 20, ${feature.depth})`);
                gradient.addColorStop(0.7, `rgba(50, 40, 30, ${feature.depth * 0.5})`);
                gradient.addColorStop(1, 'rgba(60, 50, 40, 0)');
                this.terrainCtx.fillStyle = gradient;
                this.terrainCtx.beginPath();
                this.terrainCtx.arc(feature.x, feature.y, feature.radius, 0, Math.PI * 2);
                this.terrainCtx.fill();
                
                // Add rim highlight
                this.terrainCtx.strokeStyle = 'rgba(80, 70, 60, 0.2)';
                this.terrainCtx.lineWidth = 2;
                this.terrainCtx.stroke();
            } else if (feature.type === 'tracks') {
                // Draw tire tracks
                this.terrainCtx.translate(feature.x, feature.y);
                this.terrainCtx.rotate(feature.angle);
                this.terrainCtx.fillStyle = 'rgba(40, 35, 30, 0.15)';
                
                // Left track
                this.terrainCtx.fillRect(-feature.width/2 - 2, -feature.length/2, 3, feature.length);
                // Right track
                this.terrainCtx.fillRect(feature.width/2 - 1, -feature.length/2, 3, feature.length);
                
                // Track pattern
                this.terrainCtx.fillStyle = 'rgba(30, 25, 20, 0.1)';
                for (let i = -feature.length/2; i < feature.length/2; i += 8) {
                    this.terrainCtx.fillRect(-feature.width/2 - 3, i, 5, 4);
                    this.terrainCtx.fillRect(feature.width/2 - 2, i, 5, 4);
                }
            } else if (feature.type === 'debris') {
                // Draw small rocks/debris
                this.terrainCtx.translate(feature.x, feature.y);
                this.terrainCtx.rotate(feature.angle);
                this.terrainCtx.fillStyle = 'rgba(60, 55, 50, 0.4)';
                this.terrainCtx.beginPath();
                this.terrainCtx.moveTo(-feature.size/2, 0);
                this.terrainCtx.lineTo(0, -feature.size/2);
                this.terrainCtx.lineTo(feature.size/2, 0);
                this.terrainCtx.lineTo(0, feature.size/2);
                this.terrainCtx.closePath();
                this.terrainCtx.fill();
                
                // Add shadow
                this.terrainCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                this.terrainCtx.beginPath();
                this.terrainCtx.ellipse(2, 2, feature.size/2, feature.size/3, 0, 0, Math.PI * 2);
                this.terrainCtx.fill();
            } else if (feature.type === 'vegetation') {
                // Draw vegetation patches
                const gradient = this.terrainCtx.createRadialGradient(
                    feature.x, feature.y, 0,
                    feature.x, feature.y, feature.radius
                );
                gradient.addColorStop(0, 'rgba(100, 120, 70, 0.2)');
                gradient.addColorStop(1, 'rgba(90, 110, 60, 0)');
                this.terrainCtx.fillStyle = gradient;
                this.terrainCtx.beginPath();
                this.terrainCtx.arc(feature.x, feature.y, feature.radius, 0, Math.PI * 2);
                this.terrainCtx.fill();
                
                // Add some grass blades
                this.terrainCtx.strokeStyle = 'rgba(80, 100, 50, 0.3)';
                this.terrainCtx.lineWidth = 1;
                for (let i = 0; i < 8; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * feature.radius;
                    const gx = feature.x + Math.cos(angle) * dist;
                    const gy = feature.y + Math.sin(angle) * dist;
                    this.terrainCtx.beginPath();
                    this.terrainCtx.moveTo(gx, gy);
                    this.terrainCtx.lineTo(gx + Math.random() * 4 - 2, gy - 5);
                    this.terrainCtx.stroke();
                }
            }
            
            this.terrainCtx.restore();
        });
        
        this.terrainCached = true;
    }
    
    drawBattlefieldTerrain(ctx) {
        // First, fill entire background with grass
        if (typeof grassLoaded !== 'undefined' && grassLoaded) {
            const tileSize = TILE_SIZE;
            const cols = Math.ceil(canvas.width / tileSize);
            const rows = Math.ceil(canvas.height / tileSize);
            
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    ctx.drawImage(
                        grassImage,
                        col * tileSize,
                        row * tileSize,
                        tileSize,
                        tileSize
                    );
                }
            }
        } else {
            // Fallback to grass-colored rectangle
            ctx.fillStyle = '#7A8B5D';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Then draw organic shapes for sand terrain patches on top
        if (terrainTiles && terrainTiles.length > 0) {
            const sandTiles = terrainTiles.filter(tile => tile.type === 'sand');
            if (sandTiles.length > 0) {
                // Convert terrain tiles to grid coordinates for drawOrganicObstacleShape
                const sandGridTiles = sandTiles.map(tile => ({
                    x: Math.floor(tile.x / TILE_SIZE),
                    y: Math.floor(tile.y / TILE_SIZE),
                    type: 'sand'
                }));
                // Use the same connected shape drawing as walls and water
                this.drawOrganicObstacleShape(ctx, sandGridTiles, 
                    (typeof sandLoaded !== 'undefined' && sandLoaded) ? sandImage : null, 
                    '#C4B5A0', '#D4A574', TILE_SIZE);
            }
        }
        
        // Finally draw organic shapes for obstacles (walls and water) on top
        if (obstacleTiles && obstacleTiles.length > 0) {
            const wallTiles = obstacleTiles.filter(tile => tile.type === 'wall');
            const waterTiles = obstacleTiles.filter(tile => tile.type === 'water');
            
            // Draw water tiles
            if (waterTiles.length > 0) {
                this.drawOrganicObstacleShape(ctx, waterTiles, 
                    (typeof waterLoaded !== 'undefined' && waterLoaded) ? waterImage : null, 
                    '#4682B4', '#1565C0', TILE_SIZE);
            }
            
            // Draw walls using their individual draw methods (to show destructible walls)
            // First draw regular walls using organic shape
            const regularWallTiles = [];
            const destructibleWallPositions = new Set();
            
            // Identify which tiles belong to destructible walls
            if (typeof walls !== 'undefined') {
                walls.forEach(wall => {
                    if (wall instanceof DestructibleWall) {
                        const tileX = Math.floor(wall.x / TILE_SIZE);
                        const tileY = Math.floor(wall.y / TILE_SIZE);
                        destructibleWallPositions.add(`${tileX},${tileY}`);
                    }
                });
            }
            
            // Separate regular wall tiles from destructible ones
            wallTiles.forEach(tile => {
                const key = `${tile.x},${tile.y}`;
                if (!destructibleWallPositions.has(key)) {
                    regularWallTiles.push(tile);
                }
            });
            
            // Draw regular walls with organic shape
            if (regularWallTiles.length > 0) {
                this.drawOrganicObstacleShape(ctx, regularWallTiles, 
                    (typeof wallLoaded !== 'undefined' && wallLoaded) ? wallImage : null, 
                    '#8B4513', '#5D4E37', TILE_SIZE);
            }
            
            // Draw destructible walls using their custom draw method
            if (typeof walls !== 'undefined') {
                walls.forEach(wall => {
                    if (wall instanceof DestructibleWall) {
                        wall.draw();
                    }
                });
            }
        }
    }
    
    drawOrganicObstacleShape(ctx, tiles, image, fillColor, borderColor, tileSize) {
        if (tiles.length === 0) return;
        
        // Group connected tiles into islands
        const islands = this.groupTilesIntoIslands(tiles);
        
        islands.forEach(island => {
            // Create organic shape for this island
            const path = this.createOrganicPath(island, tileSize);
            
            // Save context and clip to organic shape
            ctx.save();
            ctx.clip(path);
            
            // Draw sprite or fallback color inside the clipped area
            if (image) {
                // Draw the sprite tiled across the island area
                const minX = Math.min(...island.map(t => t.x));
                const maxX = Math.max(...island.map(t => t.x));
                const minY = Math.min(...island.map(t => t.y));
                const maxY = Math.max(...island.map(t => t.y));
                
                for (let x = minX; x <= maxX; x++) {
                    for (let y = minY; y <= maxY; y++) {
                        ctx.drawImage(image, x * tileSize, y * tileSize, tileSize, tileSize);
                    }
                }
            } else {
                ctx.fillStyle = fillColor;
                ctx.fill(path);
            }
            
            // Restore context
            ctx.restore();
            
            // Draw border
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke(path);
        });
    }
    
    groupTilesIntoIslands(tiles) {
        const visited = new Set();
        const islands = [];
        
        tiles.forEach(tile => {
            const key = `${tile.x},${tile.y}`;
            if (visited.has(key)) return;
            
            const island = [];
            const queue = [tile];
            
            while (queue.length > 0) {
                const current = queue.shift();
                const currentKey = `${current.x},${current.y}`;
                
                if (visited.has(currentKey)) continue;
                visited.add(currentKey);
                island.push(current);
                
                // Find adjacent tiles
                tiles.forEach(neighbor => {
                    const neighborKey = `${neighbor.x},${neighbor.y}`;
                    if (!visited.has(neighborKey)) {
                        const dx = Math.abs(neighbor.x - current.x);
                        const dy = Math.abs(neighbor.y - current.y);
                        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                            queue.push(neighbor);
                        }
                    }
                });
            }
            
            if (island.length > 0) {
                islands.push(island);
            }
        });
        
        return islands;
    }
    
    createOrganicPath(island, tileSize) {
        if (island.length === 0) return new Path2D();
        
        // Find the bounding box
        let minX = Math.min(...island.map(t => t.x));
        let maxX = Math.max(...island.map(t => t.x));
        let minY = Math.min(...island.map(t => t.y));
        let maxY = Math.max(...island.map(t => t.y));
        
        const path = new Path2D();
        const cornerRadius = tileSize * 0.3; // Rounded corners
        
        // Create a rounded rectangle that encompasses the island
        const x = minX * tileSize;
        const y = minY * tileSize;
        const width = (maxX - minX + 1) * tileSize;
        const height = (maxY - minY + 1) * tileSize;
        
        // Draw rounded rectangle
        path.moveTo(x + cornerRadius, y);
        path.lineTo(x + width - cornerRadius, y);
        path.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
        path.lineTo(x + width, y + height - cornerRadius);
        path.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
        path.lineTo(x + cornerRadius, y + height);
        path.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
        path.lineTo(x, y + cornerRadius);
        path.quadraticCurveTo(x, y, x + cornerRadius, y);
        path.closePath();
        
        return path;
    }
}

// Create global instance and compatibility functions
window.terrainRenderer = new TerrainRenderer();

// Backward compatibility wrapper functions
window.renderTerrainToCache = function() {
    window.terrainRenderer.renderTerrainToCache();
};

window.drawBattlefieldTerrain = function() {
    window.terrainRenderer.drawBattlefieldTerrain(ctx);
};

window.drawOrganicObstacleShape = function(ctx, tiles, image, fillColor, borderColor, tileSize) {
    window.terrainRenderer.drawOrganicObstacleShape(ctx, tiles, image, fillColor, borderColor, tileSize);
};

window.groupTilesIntoIslands = function(tiles) {
    return window.terrainRenderer.groupTilesIntoIslands(tiles);
};

window.createOrganicPath = function(island, tileSize) {
    return window.terrainRenderer.createOrganicPath(island, tileSize);
};

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerrainRenderer;
}