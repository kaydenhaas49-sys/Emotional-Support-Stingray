# Emotional Support Stingray

An experimental first-person horror game built with Three.js and Vite.

> **Working title:** The repository name is being used as the project label for now. The final title, story and character names are not locked.

## The idea

Explore an abandoned indoor play centre. The Archade preschool classroom is the current playable space; its furnished interior, floor, walls, ceiling and play equipment form the actual level instead of being placed inside the old greybox.

## Current playable slice

Explore the standalone classroom, collect three power relays, read the maintenance panel, follow a three-light sequence, and return to the entrance. An attendant patrols between clear floor positions, investigates noise and sightings, and searches the last place it saw the player.

## Getting started

Requirements: Node.js and npm.

    npm install
    npm run dev

Build and preview:

    npm run build
    npm run preview

## Controls

- **WASD** — move
- **Mouse** — look
- **Shift** — run and make noise
- **E** — interact or hide/leave a hiding place
- **Escape** — release the mouse
- **R** — restart after completing the test

Click **Enter Test** to begin.

## Performance work

- Static classroom geometry is simplified, Meshopt-compressed and GPU-instanced where possible; textures are capped at 768 pixels.
- The renderer caps device pixel ratio at 1.25, disables MSAA and shadow maps, and targets 60 FPS.
- The imported room is static and does not cast or receive dynamic shadows.
- Attendant line-of-sight checks use source-derived collision boxes instead of raycasting the full classroom mesh every frame.
- The old duplicate room shell, unused soft-play GLB, redundant texture maps and starter demo runtime assets have been removed.

Run collision and model-budget checks with:

    npm run test:collision

## Project layout

    src/
      core/           Camera, renderer, player and capped game loop
      environment/    Standalone Archade classroom and gameplay
      characters/     Attendant model and AI
      input/          Keyboard and pointer-lock input
      ui/             Test HUD
      utils/          Shared constants

    assets/            Editable character/animation source
    public/assets/     Runtime GLB files and textures
    docs/              Design, roadmap, test notes and asset credits

## Asset handling

The Archade Free Licence permits project use, modification and commercial use. The raw SketchUp source is kept outside this public repository; the repository contains the adapted runtime GLB and collision data only. The licence prohibits redistributing the asset as a standalone file or repackaged asset library.

See [docs/ASSET_CREDITS.md](docs/ASSET_CREDITS.md) for provenance and licence notes.
