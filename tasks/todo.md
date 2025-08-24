# Hazard System Refactor Plan

## Goal
Refactor the hazard system to follow the same modular pattern as the weapons system, breaking down the large HazardSystem.js file into individual hazard class files and creating bundle files.

## Current Structure Analysis
Currently, all hazards are defined in a single file `/src/game/hazards/HazardSystem.js` (440+ lines) containing:
- HazardSystem class (main system)
- EnvironmentalHazard base class
- Individual hazard classes: LavaPool, Quicksand, ElectricFence, Tornado, IcePatch
- Several more hazards referenced but not implemented: MeteorShower, AcidRain, Earthquake, LightningStorm, Minefield, SpikeTrap, Crusher, BlackHole, FireWall, PoisonGas

## Todo Items

### Phase 1: Extract Individual Hazard Classes
- [ ] Extract LavaPool to `src/game/hazards/LavaPool.js`
- [ ] Extract Quicksand to `src/game/hazards/Quicksand.js` 
- [ ] Extract ElectricFence to `src/game/hazards/ElectricFence.js`
- [ ] Extract Tornado to `src/game/hazards/Tornado.js`
- [ ] Extract IcePatch to `src/game/hazards/IcePatch.js`

### Phase 2: Create Base Classes
- [ ] Extract EnvironmentalHazard base class to `src/game/hazards/EnvironmentalHazard.js`
- [ ] Keep HazardSystem class in main file but simplify it

### Phase 3: Create Bundle Files
- [ ] Create `src/game/hazards/hazards-all.js` containing all individual hazard classes
- [ ] Create `src/game/hazards/hazards-bundle.js` for importing all hazards at once

### Phase 4: Update Import System
- [ ] Update HazardSystem.js to import from individual files
- [ ] Ensure global exposure for backward compatibility
- [ ] Test that all hazards work correctly after refactor

## Target Directory Structure
```
src/game/hazards/
├── EnvironmentalHazard.js     (base class)
├── LavaPool.js
├── Quicksand.js
├── ElectricFence.js
├── Tornado.js
├── IcePatch.js
├── hazards-all.js            (all classes in one file)
├── hazards-bundle.js         (imports and exposes all)
└── HazardSystem.js           (main system, simplified)
```

## Implementation Notes
- Follow the same pattern as weapons with individual files and bundle approach
- Maintain backward compatibility
- Each hazard class should be self-contained with its own drawing and effect logic
- Keep the factory pattern in HazardSystem for creating hazards

---

# WebSocket Controller Optimization Plan

## Performance Issues Identified
- [x] Each control input sends individual WebSocket message (no batching)
- [x] Joystick movement sends continuous updates without throttling
- [x] No debouncing for rapid button presses
- [x] Synchronous JSON parsing on every message
- [x] Long reconnection delays (2-3 seconds)

## Optimization Tasks
- [ ] Implement message batching/queueing system
- [ ] Add throttling to joystick movement updates (16ms / 60fps)
- [ ] Implement input debouncing for button presses
- [ ] Add requestAnimationFrame for smooth input handling
- [ ] Reduce reconnection delay to 500ms
- [ ] Add binary message format option for lower overhead
- [ ] Implement delta compression for movement states

## Implementation Strategy
1. Add input queue that batches multiple actions
2. Send updates at fixed 60fps rate using requestAnimationFrame
3. Only send state changes (deltas) instead of full state
4. Use throttling on joystick to limit update frequency
5. Optimize WebSocket server message handling

---

# Game.js Modularization Plan

## Progress Summary
**Completed:**
- ✅ Created modular directory structure under `src/`
- ✅ Extracted effects classes (Particle, SmokeParticle, Explosion) to `src/game/effects/effects-bundle.js`
- ✅ Extracted obstacle classes (Wall, DestructibleWall, Gate) to `src/game/obstacles/obstacles-bundle.js`
- ✅ Created utility modules (constants.js, helpers.js) in `src/utils/`
- ✅ Maintained backward compatibility using bundle approach with global exposure

**Current Status:** 
- Successfully extracted ~1100+ lines of code from game.js (reduced from ~5400 to ~4718 lines)
- Game remains fully functional with new modular structure
- Using compatibility bundles to allow gradual migration
- Extracted: Particle, SmokeParticle, Explosion, RingOfFire, Wall, DestructibleWall, Gate, Mine, Target, Drone, PowerUp
- Created Camera system module with screen shake and zoom functionality

## Current Structure Analysis
The game.js file is approximately 5400+ lines and contains all game logic in a single file. This needs to be split into logical modules for better maintainability.

## Identified Components

### Core Classes (Lines 120-3346)
- [ ] Tank class (lines 120-1412) - Player/AI tank logic
- [ ] Bullet class (lines 1413-1931) - Projectile system
- [x] Wall & DestructibleWall classes (lines 1932-2139) - Obstacle system ✅ Moved to src/game/obstacles/obstacles-bundle.js
- [x] Gate class (lines 2140-2346) - Gate mechanics ✅ Moved to src/game/obstacles/obstacles-bundle.js
- [x] PowerUp class (lines 2347-2565) - Power-up system ✅ Moved to src/game/entities/entities-bundle.js
- [x] Particle & SmokeParticle classes (lines 2566-2634) - Visual effects ✅ Moved to src/game/effects/effects-bundle.js
- [x] Explosion class (lines 2635-2713) - Explosion effects ✅ Moved to src/game/effects/effects-bundle.js
- [x] Mine class (lines 2714-2816) - Mine mechanics ✅ Moved to src/game/entities/entities-bundle.js
- [x] Target class (lines 2817-2981) - Target system ✅ Moved to src/game/entities/entities-bundle.js
- [x] Drone class (lines 2982-3139) - Drone mechanics ✅ Moved to src/game/entities/entities-bundle.js
- [x] RingOfFire class (lines 3140-3346) - Battle royale ring ✅ Moved to src/game/effects/effects-bundle.js

### Game Systems
- [ ] Terrain system (lines 4471-5393) - Terrain generation and rendering
- [x] Camera system (lines 79-91, 3546-3586) - Camera and zoom effects ✅ Created src/game/systems/Camera.js
- [ ] Input handling (already separate in InputHandler.js)
- [ ] AI system (already separate in AIBehavior.js)
- [ ] Tunnel/teleport system (lines 45-47, 4781-4863)

### Core Game Logic
- [ ] Game initialization (lines 3596-3707)
- [ ] Game loop and update (lines 3708-3940, 4218-4241)
- [ ] Drawing/rendering (lines 3999-4217)
- [ ] Round management (lines 3941-3981)
- [ ] Score management (lines 3470-3524)
- [ ] Settings management (lines 4242-4464)

## Proposed Module Structure

```
src/
├── game/
│   ├── entities/
│   │   ├── Tank.js
│   │   ├── Bullet.js
│   │   ├── PowerUp.js
│   │   ├── Mine.js
│   │   ├── Drone.js
│   │   └── Target.js
│   ├── obstacles/
│   │   ├── Wall.js
│   │   ├── DestructibleWall.js
│   │   └── Gate.js
│   ├── effects/
│   │   ├── Particle.js
│   │   ├── Explosion.js
│   │   └── RingOfFire.js
│   ├── terrain/
│   │   ├── TerrainGenerator.js
│   │   ├── TerrainRenderer.js
│   │   └── TunnelSystem.js
│   ├── systems/
│   │   ├── Camera.js
│   │   ├── ScoreManager.js
│   │   ├── SettingsManager.js
│   │   └── RoundManager.js
│   ├── core/
│   │   ├── GameLoop.js
│   │   ├── GameState.js
│   │   └── Renderer.js
│   ├── InputHandler.js (existing)
│   ├── RemoteInputHandler.js (existing)
│   └── AIBehavior.js (existing)
├── utils/
│   ├── constants.js
│   └── helpers.js
└── main.js (entry point)
```

## Implementation Steps

### Phase 1: Setup Module Infrastructure
- [x] Create directory structure ✅ Complete
- [x] Set up module system (using script tags with bundles for now) ✅ Complete
- [x] Create constants.js for shared constants ✅ Created at src/utils/constants.js
- [x] Create helpers.js for utility functions ✅ Created at src/utils/helpers.js

### Phase 2: Extract Entity Classes
- [ ] Extract Tank class with all methods
- [ ] Extract Bullet class
- [ ] Extract PowerUp class
- [ ] Extract Mine, Drone, Target classes
- [ ] Update imports/exports

### Phase 3: Extract Obstacle Classes
- [x] Extract Wall and DestructibleWall classes ✅ Complete
- [x] Extract Gate class ✅ Complete
- [x] Update imports/exports ✅ Using bundle approach

### Phase 4: Extract Effect Classes
- [x] Extract Particle and SmokeParticle classes ✅ Complete
- [x] Extract Explosion class ✅ Complete
- [ ] Extract RingOfFire class
- [x] Update imports/exports ✅ Using bundle approach

### Phase 5: Extract Terrain System
- [ ] Extract terrain generation functions
- [ ] Extract terrain rendering functions
- [ ] Extract tunnel system logic
- [ ] Update imports/exports

### Phase 6: Extract Game Systems
- [ ] Extract camera system
- [ ] Extract score management
- [ ] Extract settings management
- [ ] Extract round management
- [ ] Update imports/exports

### Phase 7: Extract Core Game Logic
- [ ] Create GameState class for state management
- [ ] Create GameLoop class for update/draw cycle
- [ ] Create Renderer class for main rendering logic
- [ ] Update imports/exports

### Phase 8: Create Main Entry Point
- [ ] Create main.js as new entry point
- [ ] Wire up all modules
- [ ] Update HTML to use new entry point
- [ ] Test everything works

## Benefits of This Structure
1. **Maintainability**: Each module has a single responsibility
2. **Testability**: Individual modules can be tested in isolation
3. **Reusability**: Components can be reused easily
4. **Scalability**: New features can be added without touching core code
5. **Performance**: Only load what's needed, better tree-shaking
6. **Collaboration**: Multiple developers can work on different modules

## Notes
- Keep backward compatibility during migration
- Test after each extraction phase
- Maintain git history with meaningful commits
- Consider using a build tool (webpack/rollup) if not already in use