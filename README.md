# Emotional Support Stingray

An experimental first-person horror game prototype built with Three.js and Vite.

> **Working title:** The repository name is being used as the project label for now. The final game title, story, and character names are not locked.

## The idea

Explore an abandoned indoor play centre that has been left to decay. The space should feel like a place that was once bright, noisy, and safe, but is now quiet, damaged, and unsettling. Two original robotic attendants with contrasting operating modes are part of the concept.

The ruined daycare from *Five Nights at Freddy's: Security Breach – RUIN* is a mood reference only. This project is intended to have its own setting, characters, designs, story, and gameplay. No FNAF characters, models, maps, audio, or lore are part of the project.

## Current status

This repository currently contains the Three.js first-person starter kit and an initial collection of model and animation assets. It is **not yet a complete horror game**. The existing forest scene, skybox paths, and debug controls are retained as a working technical sandbox while the horror environment is built.

## Getting started

Requirements: Node.js and npm.

```bash
npm install
npm run dev
```

Open the local Vite URL printed in the terminal.

Build a production bundle with:

```bash
npm run build
npm run preview
```

## Current controls

- **WASD** — move
- **Mouse** — look around
- **Shift** — run
- **Click** — enter pointer-lock gameplay

## Project layout

```text
src/
  core/           Scene, camera, renderer, player, and game loop
  input/          Keyboard and pointer-lock input
  lighting/       Lights and lighting presets
  skybox/         Skybox loading and controls
  models/         GLTF/GLB loading
  gui/            Developer tuning panels
  ui/             On-screen interface
  debug/          Debug logging and controls
  environment/    Planned environment systems
  characters/     Planned character setup and animation
  ai/             Planned attendant behaviour
  interactions/   Planned doors, objects, and puzzles
  audio/          Planned sound and ambience systems

assets/
  characters/     Editable/source character files
  animations/     FBX animation source files

public/
  assets/         Runtime-loadable GLB files and future game assets
  models/         Existing starter-kit demo models (kept at their current paths)
  skyboxes/       Existing starter-kit skyboxes (kept at their current paths)

docs/
  GAME_DESIGN.md
  ROADMAP.md
  ASSET_CREDITS.md
```

## Asset handling

- GLB files intended to load in the browser belong under `public/assets/`.
- The uploaded soft-play environment scene is at `public/assets/environment/soft-play/model.glb`.
- Blender, FBX, and OBJ source files belong under `assets/`.
- Keep each asset pack's licence and attribution information with the pack or documented in [docs/ASSET_CREDITS.md](docs/ASSET_CREDITS.md).
- The original starter-kit paths under `public/models/` and `public/skyboxes/` are intentionally unchanged so the current demo continues to load.

## Technology

- [Three.js](https://threejs.org/)
- [Vite](https://vite.dev/)
- [lil-gui](https://lil-gui.georgealways.com/)
- [Rapier](https://rapier.rs/) is a candidate for physics; it is not installed yet.
- [Yuka](https://mugen87.github.io/yuka/) is a candidate for steering/AI; it is not installed yet.

See [ARCHITECTURE.md](ARCHITECTURE.md), [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md), and [docs/ROADMAP.md](docs/ROADMAP.md).
