# Archade Classroom Test

This is the current playable horror slice. The Archade classroom is the level itself; the previous greybox walls, corridor and duplicate floor have been removed.

## What is in the test

- The furnished Archade preschool classroom at its measured metre scale.
- The model's own floor, walls, ceiling, shelves and play structure.
- Three power relays.
- A maintenance panel with three switches and a looping three-light clue.
- An entrance exit that unlocks when the relays are collected and the switch sequence is entered correctly.
- An attendant that patrols around the room, investigates noise and sightings, and searches the last known player position.
- Two hiding positions on clear floor cells.
- Getting caught returns the player to the entrance while preserving puzzle progress.

## Controls

- WASD or arrow keys: move
- Mouse: look
- Shift: sprint; sprinting makes noise
- E: interact or hide/leave a hiding place
- Escape: release the mouse
- R: restart after escaping

Click **Enter Test** to capture the mouse.

## Performance settings

- Maximum render rate: 60 FPS
- Maximum device pixel ratio: 1.25
- MSAA and dynamic shadow maps: disabled
- Classroom geometry: simplified, Meshopt-compressed and GPU-instanced where possible
- Attendant vision: tests source-derived collision proxies instead of the full classroom triangle mesh

## Known limitations

- The room is a static imported environment; there is no climbing, jumping or vertical physics.
- Player collision is a ground-plane AABB approximation.
- The attendant remains waypoint-based and does not yet use a full navigation mesh.
- Hiding spots are interaction triggers, not a general-purpose cover system.
- There is no positional audio, save system or finished narrative.

## Local run

Run `npm install`, then `npm run dev` from the repository directory.
