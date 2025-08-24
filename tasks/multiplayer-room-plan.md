# Multiplayer Room System - Implementation Plan

## Overview
Transform the existing Tanks game into a room-based multiplayer experience where:
- Players create/join rooms via QR codes
- Game displays on TV/monitor (presenter mode)
- Players use phones/tablets as controllers
- All connected via internet (not just local network)

## Architecture Components

### 1. Room Management System
**Server-side (server-rooms.js)**
- Room creation with unique 6-character codes
- Room states: WAITING, IN_GAME, FINISHED
- Player management (max 8 players per room)
- Room timeout handling (30 min inactive)
- Game settings per room

**Data Structure:**
```javascript
Room = {
  id: "ABC123",
  host: "player1_id",
  players: [{id, name, color, ready}],
  presenter: {id, connected},
  state: "WAITING",
  gameSettings: {...},
  createdAt: timestamp,
  lastActivity: timestamp
}
```

### 2. QR Code System
**Libraries Needed:**
- `qrcode` (npm) - Generate QR codes
- Built-in camera API for scanning (mobile browsers)

**Flow:**
1. Host creates room → Server generates room code
2. QR code contains: `https://yourgame.com/join/ABC123`
3. Mobile devices scan → Auto-redirect to controller page
4. Controller page auto-connects to room

### 3. TV Display Mode (Presenter)
**New HTML Page (presenter.html)**
- Full-screen game view
- No controls visible
- Room code display in corner
- Player list sidebar
- Spectator mode with smooth camera

**Features:**
- Auto-scale to TV resolution
- Performance optimizations for large displays
- Connection status indicators
- Waiting room with player avatars

### 4. Controller Enhancement
**Mobile-Optimized (controller-room.html)**
- Room code input or QR scan
- Player name/avatar selection
- Color picker
- Virtual joystick + buttons
- Haptic feedback
- Battery-efficient design

### 5. WebSocket Protocol Updates

**Message Types:**
```javascript
// Room Management
{type: "CREATE_ROOM", settings: {...}}
{type: "JOIN_ROOM", roomId, playerName}
{type: "LEAVE_ROOM"}
{type: "START_GAME"}
{type: "ROOM_STATE", room: {...}}

// Presenter
{type: "REGISTER_PRESENTER", roomId}
{type: "PRESENTER_UPDATE", gameState: {...}}

// Game Sync
{type: "PLAYER_INPUT", input: {...}}
{type: "GAME_STATE", state: {...}}
{type: "PLAYER_SYNC", players: [...]}
```

### 6. Game Flow

**Room Creation:**
1. Host visits main page
2. Clicks "Create Room"
3. Gets room code + QR code
4. Opens presenter on TV
5. Shares QR with friends

**Joining:**
1. Players scan QR code
2. Enter nickname
3. Select color
4. Wait in lobby
5. See themselves on TV

**Game Start:**
1. Host starts when ready
2. All controllers activate
3. Game runs on presenter
4. Inputs sent to server
5. Server broadcasts state

### 7. File Structure
```
/Tanks
  /src
    /multiplayer
      room-manager.js      # Room logic
      qr-generator.js      # QR code generation
      sync-engine.js       # State synchronization
    /game
      /systems
        ScoreManager.js    # New score system
  server-rooms.js          # Enhanced server
  presenter.html           # TV display
  controller-room.html     # Mobile controller
  lobby.html              # Room creation/joining
  lobby.js                # Lobby logic
```

### 8. Implementation Steps

**Phase 1: Room System**
- [ ] Create room manager on server
- [ ] Add room CRUD operations
- [ ] Implement room codes
- [ ] Add timeout handling

**Phase 2: QR Integration**
- [ ] Install qrcode library
- [ ] Generate QR on room creation
- [ ] Create join URL structure
- [ ] Add QR display UI

**Phase 3: Presenter Mode**
- [ ] Create presenter.html
- [ ] Build spectator camera system
- [ ] Add room info overlay
- [ ] Optimize for TV display

**Phase 4: Controller Updates**
- [ ] Create room-based controller
- [ ] Add room joining UI
- [ ] Implement player customization
- [ ] Enhance mobile UX

**Phase 5: Synchronization**
- [ ] Build sync engine
- [ ] Implement state broadcasting
- [ ] Add lag compensation
- [ ] Handle disconnections

**Phase 6: Polish**
- [ ] Add lobby animations
- [ ] Implement sound effects
- [ ] Create tutorial
- [ ] Add error handling

### 9. Technical Considerations

**Scalability:**
- Use Redis for room storage (optional)
- Implement WebSocket clustering
- CDN for static assets
- Rate limiting on room creation

**Security:**
- Room codes expire after 30 min
- Validate all inputs
- Prevent room hijacking
- Rate limit joins

**Performance:**
- 60 FPS on presenter
- <50ms input latency
- Efficient state updates
- Delta compression

**Network:**
- Reconnection handling
- Graceful degradation
- Mobile data optimization
- Cross-region support

### 10. User Experience

**Mobile Controller:**
- Instant feedback
- Low battery usage
- Works on 3G/4G
- Landscape orientation

**TV Presenter:**
- Auto-fullscreen
- No UI clutter
- Smooth animations
- Clear player indicators

**Lobby:**
- Quick room creation
- Easy sharing
- Clear instructions
- Fun waiting experience

## Next Steps
1. Set up enhanced WebSocket server with room support
2. Create room manager module
3. Implement QR code generation
4. Build presenter view
5. Update controllers for room system
6. Test with multiple devices
7. Deploy to cloud service