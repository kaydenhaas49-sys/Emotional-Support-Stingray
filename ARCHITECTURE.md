# Project Architecture

## Runtime

The application creates a clean Three.js scene and loads one standalone environment through `ArchadeClassroom`.

- `Renderer` owns WebGL configuration, resize handling and the 1.25 device-pixel-ratio cap.
- `Game` schedules simulation and drawing at a maximum of 60 FPS.
- `Player` handles pointer-lock movement and a spatially indexed AABB collision grid.
- `ArchadeClassroom` loads the optimized GLB and source-derived collision JSON, then creates the relay/panel puzzle and attendant.
- `Attendant` patrols, investigates noise and sightings, and uses the same simplified collision proxies for line-of-sight tests.

## Static environment strategy

The imported classroom is static. Its visual mesh is simplified offline, GPU-instanced where possible, and Meshopt-compressed. It does not cast or receive dynamic shadows. A hemisphere light, ambient fill and one non-shadow-casting directional light illuminate the room; gameplay indicators use unlit materials instead of extra point lights.

Collision is generated offline from the original, unsimplified SketchUp geometry, independently of render simplification. This keeps player collision stable as the visual mesh is reduced.

## Frame flow

At up to 60 FPS:

```
requestAnimationFrame
  ├─ Player.update(delta)
  ├─ ArchadeClassroom.update(delta)
  │    └─ Attendant.update(delta) with proxy-based visibility
  └─ Renderer.render(scene, camera)
```

The frame cap prevents a 240 Hz display from forcing four times as many full scene renders as a 60 Hz target.

## Verification

`npm run test:collision` checks spawn clearance, the blocker probe, the panel/relay/hiding positions, and the runtime GLB triangle and size budgets. The production workflow also builds the site and deploys the Pages artifact.
