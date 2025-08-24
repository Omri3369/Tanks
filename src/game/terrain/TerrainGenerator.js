// TerrainGenerator.js - Handles terrain generation for the battlefield

class TerrainGenerator {
    constructor() {
        this.terrainTiles = [];
        this.terrainFeatures = [];
        this.obstacleTiles = [];
    }
    
    generateTerrainTiles() {
        console.log('[TERRAIN] Starting terrain generation');
        // Clear existing terrain and obstacles
        this.terrainTiles = [];
        this.terrainFeatures = [];
        this.obstacleTiles = [];
        
        // Global vars need to be cleared too
        if (typeof terrainTiles !== 'undefined') terrainTiles = [];
        if (typeof terrainFeatures !== 'undefined') terrainFeatures = [];
        if (typeof obstacleTiles !== 'undefined') obstacleTiles = [];
        if (typeof walls !== 'undefined') walls = [];
        if (typeof terrainCached !== 'undefined') terrainCached = false;
        
        const gridWidth = Math.ceil(canvas.width / TILE_SIZE);
        const gridHeight = Math.ceil(canvas.height / TILE_SIZE);
        
        // Initialize all tiles as grass first
        for (let x = 0; x < canvas.width; x += TILE_SIZE) {
            for (let y = 0; y < canvas.height; y += TILE_SIZE) {
                this.terrainTiles.push({
                    x: x,
                    y: y,
                    size: TILE_SIZE,
                    type: 'grass',
                    baseColor: '#7A8B5D',
                    variation: Math.random() * 0.2 - 0.1 // Color variation
                });
            }
        }
        
        // Generate bush/camouflage patches
        const bushPatchCount = Math.floor(Math.random() * 2) + 1; // 1-2 bush patches
        for (let i = 0; i < bushPatchCount; i++) {
            const bushSize = Math.floor(Math.random() * 2) + 2; // 2x2 to 3x3 bush patches
            const centerX = Math.floor(Math.random() * (gridWidth - bushSize));
            const centerY = Math.floor(Math.random() * (gridHeight - bushSize));
            
            // Create main bush patch
            for (let x = 0; x < bushSize; x++) {
                for (let y = 0; y < bushSize; y++) {
                    const tileX = centerX + x;
                    const tileY = centerY + y;
                    
                    if (tileX < gridWidth && tileY < gridHeight) {
                        const tileIndex = tileY * gridWidth + tileX;
                        if (tileIndex < this.terrainTiles.length) {
                            this.terrainTiles[tileIndex].type = 'bush';
                            this.terrainTiles[tileIndex].baseColor = '#4A6741';
                        }
                    }
                }
            }
        }
        
        // Generate connected sand patches with more organic shapes
        const sandPatchCount = Math.floor(Math.random() * 3) + 2; // 2-4 sand patches
        for (let i = 0; i < sandPatchCount; i++) {
            const basePatchSize = Math.floor(Math.random() * 3) + 3; // 3x3 to 5x5 base patches
            const centerX = Math.floor(Math.random() * (gridWidth - basePatchSize));
            const centerY = Math.floor(Math.random() * (gridHeight - basePatchSize));
            
            // Create main sand patch
            for (let x = 0; x < basePatchSize; x++) {
                for (let y = 0; y < basePatchSize; y++) {
                    const tileX = centerX + x;
                    const tileY = centerY + y;
                    
                    if (tileX < gridWidth && tileY < gridHeight) {
                        const tileIndex = tileY * gridWidth + tileX;
                        if (tileIndex < this.terrainTiles.length) {
                            this.terrainTiles[tileIndex].type = 'sand';
                            this.terrainTiles[tileIndex].baseColor = '#C4B5A0';
                        }
                    }
                }
            }
            
            // Add organic extensions to make patches more connected and natural
            const extensionCount = Math.floor(Math.random() * 4) + 2; // 2-5 extensions
            for (let ext = 0; ext < extensionCount; ext++) {
                const extSize = Math.floor(Math.random() * 2) + 1; // 1x1 to 2x2 extensions
                const extX = centerX + Math.floor(Math.random() * (basePatchSize + 2)) - 1;
                const extY = centerY + Math.floor(Math.random() * (basePatchSize + 2)) - 1;
                
                for (let x = 0; x < extSize; x++) {
                    for (let y = 0; y < extSize; y++) {
                        const tileX = extX + x;
                        const tileY = extY + y;
                        
                        if (tileX >= 0 && tileX < gridWidth && tileY >= 0 && tileY < gridHeight) {
                            const tileIndex = tileY * gridWidth + tileX;
                            if (tileIndex < this.terrainTiles.length) {
                                this.terrainTiles[tileIndex].type = 'sand';
                                this.terrainTiles[tileIndex].baseColor = '#C4B5A0';
                            }
                        }
                    }
                }
            }
        }
        
        // Generate terrain features
        const featureCount = Math.floor(Math.random() * 10) + 15;
        for (let i = 0; i < featureCount; i++) {
            const featureType = Math.random();
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            
            if (featureType < 0.3) {
                // Crater
                this.terrainFeatures.push({
                    type: 'crater',
                    x: x,
                    y: y,
                    radius: (Math.random() * 30 + 20) * CONFIG.GLOBAL_SCALE,
                    depth: Math.random() * 0.3 + 0.2
                });
            } else if (featureType < 0.5) {
                // Tire tracks
                this.terrainFeatures.push({
                    type: 'tracks',
                    x: x,
                    y: y,
                    angle: Math.random() * Math.PI * 2,
                    length: (Math.random() * 80 + 40) * CONFIG.GLOBAL_SCALE,
                    width: (Math.random() * 10 + 8) * CONFIG.GLOBAL_SCALE
                });
            } else if (featureType < 0.7) {
                // Rock/debris
                this.terrainFeatures.push({
                    type: 'debris',
                    x: x,
                    y: y,
                    size: (Math.random() * 15 + 5) * CONFIG.GLOBAL_SCALE,
                    angle: Math.random() * Math.PI * 2
                });
            } else {
                // Vegetation patch
                this.terrainFeatures.push({
                    type: 'vegetation',
                    x: x,
                    y: y,
                    radius: (Math.random() * 25 + 15) * CONFIG.GLOBAL_SCALE
                });
            }
        }
        
        // Generate obstacles (walls and water)
        this.generateObstacles();
        
        console.log(`[TERRAIN] Generated ${this.terrainTiles.length} terrain tiles, ${this.obstacleTiles.length} obstacle tiles`);
        
        // Update global variables for backward compatibility
        if (typeof terrainTiles !== 'undefined') {
            terrainTiles.length = 0;
            for (let tile of this.terrainTiles) {
                terrainTiles.push(tile);
            }
        }
        if (typeof terrainFeatures !== 'undefined') {
            terrainFeatures.length = 0;
            for (let feature of this.terrainFeatures) {
                terrainFeatures.push(feature);
            }
        }
        if (typeof obstacleTiles !== 'undefined') {
            obstacleTiles.length = 0;
            for (let tile of this.obstacleTiles) {
                obstacleTiles.push(tile);
            }
        }
        
        console.log(`[TERRAIN] Updated globals: terrainTiles=${terrainTiles.length}, obstacleTiles=${obstacleTiles.length}`);
    }
    
    generateObstacles() {
        const gridWidth = Math.ceil(canvas.width / TILE_SIZE);
        const gridHeight = Math.ceil(canvas.height / TILE_SIZE);
        
        // Generate walls with wrapping support and varied sizes - balanced for gameplay
        const wallCount = Math.floor(Math.random() * 7) + 5; // 5-11 walls (reduced count)
        for (let i = 0; i < wallCount; i++) {
            // Random wall lengths - balanced to not block too much space
            const sizeCategory = Math.random();
            let wallLength;
            
            if (sizeCategory < 0.35) {
                // Short wall (2-3 tiles)
                wallLength = Math.floor(Math.random() * 2) + 2;
            } else if (sizeCategory < 0.7) {
                // Medium wall (4-5 tiles)
                wallLength = Math.floor(Math.random() * 2) + 4;
            } else if (sizeCategory < 0.9) {
                // Long wall (6-7 tiles)
                wallLength = Math.floor(Math.random() * 2) + 6;
            } else {
                // Very long wall (8-10 tiles) - rare
                wallLength = Math.floor(Math.random() * 3) + 8;
            }
            
            const horizontal = Math.random() < 0.5;
            
            // Allow walls to start anywhere, including wrapping positions
            let startX = Math.floor(Math.random() * gridWidth);
            let startY = Math.floor(Math.random() * gridHeight);
            
            if (horizontal) {
                // Add wall tiles with wrapping
                for (let j = 0; j < wallLength; j++) {
                    const tileX = (startX + j) % gridWidth;
                    
                    // Check if water exists at this position
                    const waterExists = this.obstacleTiles.find(tile => 
                        tile.x === tileX && tile.y === startY && tile.type === 'water'
                    );
                    
                    if (!waterExists) {
                        this.obstacleTiles.push({
                            x: tileX,
                            y: startY,
                            type: 'wall'
                        });
                        
                        // Add to walls array for collision detection
                        // 50% chance for destructible wall
                        const isDestructible = Math.random() < 0.5;
                        if (typeof walls !== 'undefined') {
                            walls.push(isDestructible ? 
                                new DestructibleWall(
                                    tileX * TILE_SIZE,
                                    startY * TILE_SIZE,
                                    TILE_SIZE,
                                    TILE_SIZE
                                ) :
                                new Wall(
                                    tileX * TILE_SIZE,
                                    startY * TILE_SIZE,
                                    TILE_SIZE,
                                    TILE_SIZE
                                )
                            );
                        }
                    }
                }
            } else {
                // Add vertical wall tiles with wrapping
                for (let j = 0; j < wallLength; j++) {
                    const tileY = (startY + j) % gridHeight;
                    
                    // Check if water exists at this position
                    const waterExists = this.obstacleTiles.find(tile => 
                        tile.x === startX && tile.y === tileY && tile.type === 'water'
                    );
                    
                    if (!waterExists) {
                        this.obstacleTiles.push({
                            x: startX,
                            y: tileY,
                            type: 'wall'
                        });
                        
                        // Add to walls array for collision detection
                        // 50% chance for destructible wall
                        const isDestructible = Math.random() < 0.5;
                        if (typeof walls !== 'undefined') {
                            walls.push(isDestructible ?
                                new DestructibleWall(
                                    startX * TILE_SIZE,
                                    tileY * TILE_SIZE,
                                    TILE_SIZE,
                                    TILE_SIZE
                                ) :
                                new Wall(
                                    startX * TILE_SIZE,
                                    tileY * TILE_SIZE,
                                    TILE_SIZE,
                                    TILE_SIZE
                                )
                            );
                        }
                    }
                }
            }
        }
        
        // Generate water bodies - balanced for gameplay
        const waterBodyCount = Math.floor(Math.random() * 2) + 2; // 2-3 water bodies
        const waterBodies = []; // Track water body locations
        
        for (let i = 0; i < waterBodyCount; i++) {
            // Random water body sizes - balanced to preserve play space
            const sizeCategory = Math.random();
            let waterSizeX, waterSizeY;
            
            if (sizeCategory < 0.4) {
                // Small pond (3x3 to 4x4)
                waterSizeX = Math.floor(Math.random() * 2) + 3;
                waterSizeY = Math.floor(Math.random() * 2) + 3;
            } else if (sizeCategory < 0.75) {
                // Medium lake (5x5 to 7x7)
                waterSizeX = Math.floor(Math.random() * 3) + 5;
                waterSizeY = Math.floor(Math.random() * 3) + 5;
            } else {
                // Large lake (8x6 to 10x8) - still big but not overwhelming
                waterSizeX = Math.floor(Math.random() * 3) + 8;
                waterSizeY = Math.floor(Math.random() * 3) + 6;
                // Sometimes make it wider than tall
                if (Math.random() < 0.5) {
                    const temp = waterSizeX;
                    waterSizeX = waterSizeY;
                    waterSizeY = temp;
                }
            }
            
            // Allow water to start anywhere, even outside the map (for wrapping)
            const centerX = Math.floor(Math.random() * (gridWidth + waterSizeX)) - Math.floor(waterSizeX / 2);
            const centerY = Math.floor(Math.random() * (gridHeight + waterSizeY)) - Math.floor(waterSizeY / 2);
            
            // Store the actual wrapped positions
            const wrappedCenterX = ((centerX % gridWidth) + gridWidth) % gridWidth;
            const wrappedCenterY = ((centerY % gridHeight) + gridHeight) % gridHeight;
            waterBodies.push({ 
                centerX: wrappedCenterX, 
                centerY: wrappedCenterY, 
                sizeX: waterSizeX,
                sizeY: waterSizeY,
                originalCenterX: centerX,
                originalCenterY: centerY
            });
            
            // Create water body with organic shape
            for (let x = 0; x < waterSizeX; x++) {
                for (let y = 0; y < waterSizeY; y++) {
                    // Add some randomness to create more organic shapes
                    const distFromCenter = Math.sqrt(
                        Math.pow((x - waterSizeX/2) / (waterSizeX/2), 2) + 
                        Math.pow((y - waterSizeY/2) / (waterSizeY/2), 2)
                    );
                    
                    // Create irregular edges
                    if (distFromCenter < 1.2 + Math.random() * 0.3) {
                        // Calculate wrapped tile position
                        const tileX = ((centerX + x) % gridWidth + gridWidth) % gridWidth;
                        const tileY = ((centerY + y) % gridHeight + gridHeight) % gridHeight;
                        
                        // Check if position is already occupied by walls
                        const existingObstacle = this.obstacleTiles.find(tile => 
                            tile.x === tileX && tile.y === tileY
                        );
                        
                        if (!existingObstacle) {
                            this.obstacleTiles.push({
                                x: tileX,
                                y: tileY,
                                type: 'water'
                            });
                        }
                    }
                }
            }
        }
        
        // Update global obstacleTiles for backward compatibility
        if (typeof obstacleTiles !== 'undefined') {
            // Don't clear here, just add new obstacles
            for (let tile of this.obstacleTiles) {
                if (!obstacleTiles.find(t => t.x === tile.x && t.y === tile.y)) {
                    obstacleTiles.push(tile);
                }
            }
        }
    }
    
    getTerrainTiles() {
        return this.terrainTiles;
    }
    
    getTerrainFeatures() {
        return this.terrainFeatures;
    }
    
    getObstacleTiles() {
        return this.obstacleTiles;
    }
}

// Create global instance and compatibility functions
window.terrainGenerator = new TerrainGenerator();

// Backward compatibility wrapper functions
window.generateTerrainTiles = function() {
    window.terrainGenerator.generateTerrainTiles();
    // The globals are already updated in generateTerrainTiles method
};

window.generateObstacles = function() {
    window.terrainGenerator.generateObstacles();
};

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerrainGenerator;
}