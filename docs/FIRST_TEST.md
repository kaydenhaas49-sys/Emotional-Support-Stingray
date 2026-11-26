# First Play-Centre Test

This is the first playable environment test, not a finished level.

## What is in the test

- An enclosed indoor play-centre room with a front entrance and a staff-only corridor.
- The uploaded soft-play GLB, automatically fitted into the room using its imported bounds.
- Concrete floor and damaged plaster materials using the imported Poly Haven 2K maps.
- Dim overhead point lights with restrained flicker.
- Reception counter, maintenance note, and breaker panel 04.
- First-person WASD movement, mouse look, sprint, and basic axis-separated collision against the room walls and reception counter.
- A small objective loop: inspect the note, reach the staff corridor, and interact with panel 04.

## Controls

- WASD: move
- Mouse: look
- Shift: run
- E: interact
- Escape: pause / release the mouse
- R: restart after completing the test

Click **Enter Test** to capture the mouse.

## Known limitations

- This is a greybox slice. Room proportions, prop placement, lighting, and material tiling still need visual review in a browser.
- Player collision currently covers the perimeter, staff corridor walls, and reception counter. The imported soft-play mesh is not yet used as a collision surface.
- If the soft-play GLB cannot load, a simple primitive fallback is shown so the test can still start.
- There is no attendant AI, save system, positional audio, or finished narrative in this test.
- The model is fitted using its bounding box; final scale and orientation must be checked in the live browser and adjusted if the source asset has an unexpected pivot.

## Local run

Run npm install, then npm run dev from the repository directory.

The GitHub Pages workflow builds the Vite app and deploys the dist output on pushes to main. In repository Settings → Pages, choose **GitHub Actions** as the build and deployment source.
