# Project Architecture

## Overview

The project has been refactored following SOLID principles for better maintainability, scalability, and testability.

## Directory Structure

```
src/
├── main.js                    # Entry point - Orchestrates all modules
├── core/                      # Core game systems
│   ├── Scene.js              # Scene management (ground, grid, fog)
│   ├── Camera.js             # Camera setup and control
│   ├── Renderer.js           # WebGL Renderer setup and resize handling
│   ├── Player.js             # Movement logic and mouse look
│   └── Game.js               # Game loop orchestrator
├── lighting/                  # Lighting system
│   ├── LightManager.js       # Manages lights (ambient + directional)
│   ├── LightingPresets.js    # Preset configurations
│   └── (GUI in gui/LightingGUI.js)
├── skybox/                    # Skybox system
│   ├── SkyboxManager.js      # Loading and transformations
│   └── SkyboxGUI.js          # Offset controls
├── input/                     # Input system
│   ├── InputManager.js       # Keyboard input management
│   └── PointerLock.js        # Mouse pointer lock management
├── models/                    # Model loading
│   └── ModelLoader.js        # GLTF/GLB loader wrapper
├── gui/                       # Debug GUI (lil-gui)
│   ├── GUIManager.js         # Orchestrates all GUI panels
│   ├── MovementGUI.js        # Movement controls
│   ├── LightingGUI.js        # Lighting controls
│   └── ShadowGUI.js          # Shadow controls
└── utils/                     # Utilities
    └── Constants.js          # Global constants
```

## SOLID Principles Applied

### 1. **Single Responsibility Principle (SRP)**
Each class has a single, well-defined responsibility:
- `Scene`: Only manages scene setup
- `LightManager`: Only controls lights
- `InputManager`: Only captures input

### 2. **Open/Closed Principle (OCP)**
Classes are open for extension, closed for modification:
- New GUI types can be added by creating new classes without modifying `GUIManager`
- New presets can be added to `LightingPresets.js`

### 3. **Liskov Substitution Principle (LSP)**
Each module can be substituted with a compatible alternative:
- `LightManager` can be extended to add new light types
- `ModelLoader` can be extended for new file formats

### 4. **Interface Segregation Principle (ISP)**
Classes depend only on the methods they use:
- `Player` depends only on public methods of `InputManager`
- `LightingGUI` depends only on public methods of `LightManager` and `SkyboxManager`

### 5. **Dependency Injection (DI)**
All dependencies are passed to constructors:
```javascript
const player = new Player(camera, inputManager, pointerLock);
const game = new Game(scene, camera, renderer, player);
```

## How to Add New Features

### Add a new light type
1. Create a method in `LightManager.js`:
```javascript
setupPointLight(position, color, intensity) {
  // implementation
}
```
2. Create new GUI in `gui/PointLightGUI.js`
3. Register in `GUIManager.js`

### Add a new movement control
1. Add property to `Player.settings`
2. Create setter method in `Player`
3. Add control in `MovementGUI.js`

### Add a new lighting preset
1. Add to `LightingPresets.js`
2. Preset will automatically appear in the selector

## Initialization Flow

```
main.js
├─ Scene + Camera + Renderer (Core systems)
├─ LightManager + SkyboxManager (Rendering)
├─ InputManager + PointerLock (Input)
├─ Player (Controllers)
├─ GUIManager (Debug UI)
├─ ModelLoader → loadModels()
└─ Game.start() (Game loop)
```

## Game Loop

The game loop is managed by `Game.js`:
```
requestAnimationFrame()
├─ Player.update(delta) → Calculate movement
├─ Renderer.render(scene, camera) → Render frame
└─ Repeat...
```

## Possible Future Improvements

1. **Particle System**: Create `ParticleManager.js`
2. **Physics**: Create `PhysicsManager.js` with Cannon-es or Rapier
3. **Audio**: Create `AudioManager.js`
4. **Animation State Machine**: Extension of `Player` with animations
5. **Save/Load System**: Serialize and deserialize states
6. **Networking**: Add multiplayer support with Socket.io
