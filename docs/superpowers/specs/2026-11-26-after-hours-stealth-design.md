# After-Hours Play-Centre Stealth Slice

## Intent
Turn the existing first-person play-centre prototype into one complete, browser-playable horror chapter. Keep the broad mood of an abandoned indoor play space, while making the room layout, attendant, story, and encounter original.

## Player loop
Start at the entrance, explore the play area and staff spaces, find three power relays, and use a visual light-sequence clue to activate breaker panel 04. The attendant patrols the space, hears noisy actions, investigates the player's last known position, searches briefly, and returns to patrol. Players can hide at marked spots if they enter unseen. A wrong sequence makes noise and resets the puzzle. Completing the puzzle unlocks the staff exit.

## Scope
- Keep Three.js, Vite, the existing first-person controller, and existing assets. Add no dependencies.
- Build an original attendant from Three.js geometry, with readable patrol, investigate, search, and catch states.
- Add three relay pickups, the visual sequence puzzle, hiding spots, an exit, and a restart after being caught.
- Use a compact functional HUD for controls, objective, puzzle hints, and interaction prompts.
- Keep horror suspenseful, without combat or graphic violence.

## Constraints
- Do not copy FNAF characters, names, story, dialogue, level layout, or assets.
- Add no decorative text to the HUD or environment. Text is limited to controls, objectives, interaction prompts, and puzzle clues.
- Target desktop keyboard and mouse.
- Keep the work to one small playable chapter; no save system, full facility, multiplayer, or attendant combat.
