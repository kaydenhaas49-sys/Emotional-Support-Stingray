# Emotional Support Stingray

An experimental first-person horror game prototype built with Three.js and Vite.

> **Working title:** The repository name is being used as the project label for now. The final game title, story, and character names are not locked.

## The idea

Explore an abandoned indoor play centre that has been left to decay. The space should feel like a place that was once bright, noisy, and safe, but is now quiet, damaged, and unsettling. Two original robotic attendants with contrasting operating modes and behaviours are part of the concept.

The ruined daycare from *Five Nights at Freddy's: Security Breach – RUIN* is a mood reference only. This project is intended to have its own setting, characters, designs, story, and gameplay. No FNAF characters, models, maps, audio, or lore are part of the project.

## Current status

The repository now contains the **first playable environment test**: an enclosed play-centre room, the soft-play model, damaged plaster and concrete materials, basic collision, and a small maintenance-note-to-breaker objective. It is a greybox test and still needs browser review and visual tuning. The original starter-kit modules remain the technical foundation.

## Getting started

Requirements: Node.js and npm.

    npm install
    npm run dev

Open the local Vite URL printed in the terminal.

Build a production bundle with:

    npm run build
    npm run preview

## Controls

- **WASD** — move
- **Mouse** — look around
- **Shift** — run
- **E** — interact
- **Escape** — pause / release mouse
- **R** — restart after completing the test

Click **Enter Test** to begin.

## First test

See [docs/FIRST_TEST.md](docs/FIRST_TEST.md) for the layout, objective, controls, and known limitations.

## Project layout

    src/
      core/           Scene, camera, renderer, player, and game loop
      input/          Keyboard and pointer-lock input
      lighting/       Retained starter-kit lighting helpers
      skybox/         Retained starter-kit skybox helpers
      models/         GLTF/GLB loading utilities
      environment/    Play-centre test environment
      ui/             Test HUD
      gui/            Retained developer tuning panels
      debug/          Retained starter-kit debug logging

    assets/
      characters/     Editable/source character files
      animations/     FBX animation source files

    public/
      assets/         Runtime-loadable GLB files and textures
      models/         Existing starter-kit demo models
      skyboxes/       Existing starter-kit skyboxes

    docs/
      GAME_DESIGN.md
      ROADMAP.md
      FIRST_TEST.md
      ASSET_CREDITS.md

## Asset handling

- GLB files intended to load in the browser belong under public/assets/.
- The Archade classroom SketchUp source is stored at source-assets/archade/archade-classroom.skp with Git LFS.
- The build converts it to a life-size, optimized public/assets/environment/archade/classroom.glb using OpenSKP and glTF Transform. Precomputed player collision from the original SketchUp triangles is stored in collision.json. The game prefers this scene and retains the previous soft-play model as a fallback.
- For local conversion, run npm install --no-save --package-lock=false openskp@1.7.0 @gltf-transform/cli@4.5.1 sharp, then npm run convert:archade.
- Blender, FBX, and OBJ source files belong under assets/.
- Poly Haven environment texture maps are under public/assets/textures/.
- Keep original licence/readme files alongside source assets whenever possible and record imported asset provenance in [docs/ASSET_CREDITS.md](docs/ASSET_CREDITS.md).

## Technology

- [Three.js](https://threejs.org/)
- [Vite](https://vite.dev/)
- [lil-gui](https://lil-gui.georgealways.com/) — retained for future developer tools

The imported classroom retains life-size metre dimensions. Its precomputed AABB collision comes from the original source triangles; run npm run test:collision to verify spawn clearance and blocker tests.
