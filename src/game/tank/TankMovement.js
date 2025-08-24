class TankMovement {
    constructor(tank) {
        this.tank = tank;
    }

    update() {
        // Check if tank is on sand terrain for speed reduction
        let speedModifier = 1.0;
        const gridX = Math.floor(this.tank.x / TILE_SIZE);
        const gridY = Math.floor(this.tank.y / TILE_SIZE);
        
        // Check if current position is on sand
        const currentTileIndex = gridY * Math.ceil(canvas.width / TILE_SIZE) + gridX;
        if (currentTileIndex >= 0 && currentTileIndex < terrainTiles.length) {
            if (terrainTiles[currentTileIndex].type === 'sand') {
                speedModifier = 0.75; // Reduce speed to 75% on sand
            }
        }
        
        let newX = this.tank.x + Math.cos(this.tank.angle) * this.tank.speed * speedModifier;
        let newY = this.tank.y + Math.sin(this.tank.angle) * this.tank.speed * speedModifier;
        
        // Screen wrapping logic - allow tank to go partially off-screen
        newX = this.handleScreenWrapping(newX, canvas.width, TANK_SIZE);
        newY = this.handleScreenWrapping(newY, canvas.height, TANK_SIZE);
        
        // Check for tunnel entrance/exit
        // this.checkTunnelTransition(); // DISABLED FOR NOW
        
        // Only move if no collision
        if (!this.checkWallCollision(newX, newY)) {
            this.tank.x = newX;
            this.tank.y = newY;
        } else {
            // Stop completely on collision - no sliding along walls
            this.tank.speed = 0;
        }
        
        this.tank.angle += this.tank.turnSpeed;
    }

    handleScreenWrapping(position, screenSize, tankSize) {
        if (position < -tankSize) {
            return screenSize + tankSize;
        } else if (position > screenSize + tankSize) {
            return -tankSize;
        }
        return position;
    }

    checkWallCollision(x, y) {
        // Define tank corners for more accurate collision
        const tankRadius = TANK_SIZE * 0.8; // Slightly smaller for better gameplay
        const corners = [
            { x: x - tankRadius, y: y - tankRadius }, // Top-left
            { x: x + tankRadius, y: y - tankRadius }, // Top-right
            { x: x - tankRadius, y: y + tankRadius }, // Bottom-left
            { x: x + tankRadius, y: y + tankRadius }, // Bottom-right
            { x: x, y: y - tankRadius }, // Top-center
            { x: x, y: y + tankRadius }, // Bottom-center
            { x: x - tankRadius, y: y }, // Left-center
            { x: x + tankRadius, y: y }  // Right-center
        ];
        
        // Check regular walls
        if (typeof walls !== 'undefined' && walls) {
            for (let wall of walls) {
                if (wall) {
                    for (let corner of corners) {
                        if (corner.x >= wall.x && 
                            corner.x <= wall.x + wall.width &&
                            corner.y >= wall.y && 
                            corner.y <= wall.y + wall.height) {
                            return true;
                        }
                    }
                }
            }
        }
        
        // Check all obstacle tiles (water and wall tiles from terrain)
        if (typeof obstacleTiles !== 'undefined' && obstacleTiles && obstacleTiles.length > 0) {
            for (let tile of obstacleTiles) {
                // Both water and wall tiles should block movement
                if (tile && (tile.type === 'water' || tile.type === 'wall')) {
                    const tileLeft = tile.x * TILE_SIZE;
                    const tileRight = tileLeft + TILE_SIZE;
                    const tileTop = tile.y * TILE_SIZE;
                    const tileBottom = tileTop + TILE_SIZE;
                    
                    // Check each corner of the tank
                    for (let corner of corners) {
                        if (corner.x >= tileLeft && 
                            corner.x <= tileRight &&
                            corner.y >= tileTop && 
                            corner.y <= tileBottom) {
                            return true;
                        }
                    }
                }
            }
        }
        
        // Check gate collisions
        if (typeof gates !== 'undefined' && gates) {
            for (let gate of gates) {
                if (gate && gate.blocksMovement && gate.blocksMovement()) {
                    for (let corner of corners) {
                        if (corner.x >= gate.x && 
                            corner.x <= gate.x + gate.width &&
                            corner.y >= gate.y && 
                            corner.y <= gate.y + gate.height) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }

    checkTankCollision(x, y) {
        for (let tank of tanks) {
            if (tank === this.tank || !tank.alive) continue;
            
            const distance = Math.sqrt((x - tank.x) ** 2 + (y - tank.y) ** 2);
            if (distance < TANK_SIZE * 1.2) { // Slight buffer for smooth gameplay
                return true;
            }
        }
        return false;
    }

    checkTunnelTransition() {
        // Update cooldown
        if (this.tank.tunnelCooldown > 0) {
            this.tank.tunnelCooldown--;
            return;
        }
        
        // Check if tank is at a tunnel entrance
        for (let entrance of tunnelEntrances) {
            const dist = Math.sqrt(Math.pow(this.tank.x - entrance.x, 2) + Math.pow(this.tank.y - entrance.y, 2));
            
            if (dist < entrance.radius + TANK_SIZE/2) { // Include tank size in collision
                // Instantly teleport to the partner entrance
                this.teleportThroughTunnel(entrance);
                break;
            }
        }
    }
    
    teleportThroughTunnel(entrance) {
        // Find the partner entrance using partnerId
        const partnerEntrance = tunnelEntrances.find(e => e.id === entrance.partnerId);
        if (partnerEntrance) {
            // Create teleport effect at current position
            teleportEffects.push({
                x: this.tank.x,
                y: this.tank.y,
                radius: 0,
                maxRadius: entrance.radius * 2,
                opacity: 1,
                color: entrance.color
            });
            
            // Simply place tank at partner portal center
            // The cooldown will prevent immediate re-entry
            this.tank.x = partnerEntrance.x;
            this.tank.y = partnerEntrance.y;
            
            // Create teleport effect at exit position
            teleportEffects.push({
                x: partnerEntrance.x,
                y: partnerEntrance.y,
                radius: partnerEntrance.radius * 2,
                maxRadius: 0,
                opacity: 1,
                color: entrance.color
            });
            
            // Set cooldown to prevent immediate re-teleportation
            this.tank.tunnelCooldown = 60; // 1 second at 60fps
            
            console.log(`Tank teleported from portal ${entrance.id} to portal ${entrance.partnerId}`);
        } else {
            console.log(`No partner found for portal ${entrance.id} (looking for ${entrance.partnerId})`);
        }
    }

    isInBush() {
        const gridX = Math.floor(this.tank.x / TILE_SIZE);
        const gridY = Math.floor(this.tank.y / TILE_SIZE);
        
        // Check if current position is on bush terrain
        const currentTileIndex = gridY * Math.ceil(canvas.width / TILE_SIZE) + gridX;
        if (currentTileIndex >= 0 && currentTileIndex < terrainTiles.length) {
            return terrainTiles[currentTileIndex].type === 'bush';
        }
        return false;
    }
}