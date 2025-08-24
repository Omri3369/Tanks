// Terrain Bundle - Combines all terrain-related modules
// This file bundles TerrainGenerator, TerrainRenderer, and TunnelSystem

// This bundle will be loaded via script tags, so the individual modules
// are already loaded and their global functions are available

// All terrain functionality is now available through:
// - window.terrainGenerator
// - window.terrainRenderer  
// - window.tunnelSystem

// And the backward compatibility functions are available globally:
// - generateTerrainTiles()
// - generateObstacles()
// - renderTerrainToCache()
// - drawBattlefieldTerrain()
// - generateTunnelSystem()
// - drawTunnelEntrances()
// - drawTeleportEffects()
// - drawOrganicObstacleShape()
// - groupTilesIntoIslands()
// - createOrganicPath()

console.log('Terrain bundle loaded: TerrainGenerator, TerrainRenderer, and TunnelSystem are ready');