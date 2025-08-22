# Destructible Wall Tiles Implementation Plan

## Overview
Creating destructible wall tiles that break after 3 hits with progressive damage visuals.

## Todo Items

### Research Phase
- [ ] 1. Analyze existing wall/obstacle system in game.js
- [ ] 2. Review collision detection for walls
- [ ] 3. Check current terrain generation for wall placement

### Implementation Phase
- [ ] 4. Create destructible wall class/properties (health, damage states)
- [ ] 5. Add progressive damage visuals (3 states: intact, damaged, heavily damaged)
- [ ] 6. Implement hit detection and damage tracking for walls
- [ ] 7. Add wall destruction logic after 3 hits
- [ ] 8. Update bullet collision to apply damage to destructible walls
- [ ] 9. Add visual/particle effects for wall destruction

### Testing Phase
- [ ] 10. Test wall damage progression
- [ ] 11. Verify collision removal after destruction
- [ ] 12. Check performance with multiple destructible walls

## Design Decisions

### Wall Properties
- **Health Points**: 3 hits to destroy
- **Damage States**: 
  - State 1: Intact (3 HP)
  - State 2: Cracked (2 HP)
  - State 3: Heavily damaged (1 HP)
  - State 4: Destroyed (0 HP - removed)

### Visual Design
- **Progressive damage**: Visual cracks/damage increase with each hit
- **Destruction effect**: Particles/debris when wall breaks
- **Color indication**: Darker/more damaged appearance as health decreases

## Review Section

### Changes Made
1. **Created DestructibleWall class** - Extended Wall class with health system (3 HP)
2. **Added progressive damage visuals**:
   - Health bar indicator above damaged walls
   - Progressive crack patterns (more cracks appear as damage increases)
   - Damage overlay that darkens the wall texture
3. **Implemented damage system**:
   - `takeDamage()` method handles hit detection and health reduction
   - Creates particle effects on each hit (brown colored debris)
   - Triggers screen shake for impact feedback
4. **Wall destruction mechanics**:
   - After 3 hits, wall is destroyed
   - Creates 20 debris particles on destruction
   - Removes wall from collision array and obstacle tiles
5. **Updated bullet collision**:
   - Bullets now check if wall is destructible
   - Normal bullets damage and bounce off destructible walls
   - Piercing bullets damage walls while passing through
   - Explosive bullets damage walls and explode
   - Bullets continue through if wall is destroyed
6. **Modified terrain generation**:
   - 50% of generated walls are now destructible
   - Mix of regular and destructible walls for varied gameplay
7. **Added screen shake system**:
   - Camera shake effect on wall impacts
   - Decay-based shake animation for smooth effect

### How It Works
- Destructible walls spawn with 3 health points
- Each bullet hit reduces health by 1
- Visual feedback shows damage progression (cracks, darkening, health bars)
- After 3 hits, wall breaks with particle explosion
- Destroyed walls are removed from collision detection
- Screen shakes on each impact for better game feel