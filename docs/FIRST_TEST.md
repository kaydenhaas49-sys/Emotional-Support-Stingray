# First Play-Centre Test

This is a short playable horror slice, not a finished level.

## What is in the test

- An enclosed indoor play-centre room with a front entrance and a staff corridor.
- The fitted soft-play model, concrete floor, damaged plaster, and flickering overhead lights.
- Three power relays to collect.
- A three-lamp visual clue and matching breaker switches at panel 04.
- A front exit that unlocks when the relays are collected and the light sequence is entered correctly.
- An original geometric attendant that patrols, investigates noise and sightings, and searches its last known player position.
- Two hiding places. The attendant can still catch the player if it reaches a hiding place during an active search.
- Getting caught returns the player to the entrance; collected relays and puzzle progress remain.

## Controls

- WASD or arrow keys: move
- Mouse: look
- Shift: sprint; sprinting makes noise
- E: interact or hide/leave a hiding place
- Escape: release the mouse
- R: restart after escaping

Click **Enter Test** to capture the mouse.

## Known limitations

- This is a greybox slice. Room proportions, prop placement, lighting, and material tiling still need review in a browser.
- The attendant uses the Quaternius robot FBX and its available animation clips, but its patrol route is still waypoint-based and does not use a full navigation mesh.
- The Archade SketchUp source is converted at build time to a life-size, optimized GLB. Source bounds are preserved in metres, with no fit-to-room scaling.
- Collision blockers are generated offline from the original, unsimplified SketchUp triangles. The collision JSON is validated during the build, then loaded as AABBs and spatially indexed by the player controller.
- Player collision remains a ground-plane AABB approximation. It does not yet simulate climbing, jumping, or vertical physics.
- There is no positional audio, save system, combat, or finished narrative.
- If the soft-play model cannot load, a simple primitive fallback is shown.

## Local run

Run npm install, then npm run dev from the repository directory.
