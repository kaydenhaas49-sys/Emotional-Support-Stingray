# Roadmap

This roadmap is prototype-first. Finish each stage with something playable or verifiable before expanding scope.

## Stage 0 — Repository and asset foundation
- [x] Preserve the Three.js/Vite first-person starter.
- [x] Document the imported Archade classroom licence.
- [x] Integrate the classroom at life size as the standalone playable space.
- [x] Keep only the adapted runtime model and collision data in the public repository.
- [x] Remove unused demo models, old soft-play assets and unused runtime texture/animation payloads.

## Stage 1 — First playable environment
- [x] Replace the duplicate greybox room with the Archade classroom itself.
- [x] Generate collision from the original SketchUp geometry.
- [x] Add player collision and runtime spawn/probe checks.
- [x] Add relays, the maintenance-panel sequence and an exit objective.
- [x] Add an attendant with patrol, noise investigation and visibility checks.
- [x] Establish a 60 FPS render cap and lower-cost rendering defaults.
- [ ] Review actual gameplay and object placement in the browser.
- [ ] Tune the attendant route and add obstacle-aware path planning.

## Stage 2 — Atmosphere and interaction
- [ ] Add ambient and positional audio.
- [ ] Add environmental clues and a small puzzle loop.
- [ ] Add save/restart behaviour beyond a page reload.
- [ ] Tune lighting and fog after browser review.

## Stage 3 — Original attendants
- [ ] Refine the attendant silhouette and visual language.
- [ ] Review idle, walk and run clips in the browser.
- [ ] Improve perception, search behavior and navigation around obstacles.

## Stage 4 — Polish and evaluation
- [ ] Replace placeholders with original or properly licensed assets.
- [ ] Review the first playable slice from start to finish.
- [ ] Decide whether the concept is worth expanding.

## Scope guard

Do not build the entire facility before the first area is fun to explore. Keep other game projects separate.
