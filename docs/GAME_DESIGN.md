# Game Design — Working Brief

## High concept

An original first-person horror exploration game set in a neglected indoor play centre. The player explores a once-colourful children's venue whose play structures, service corridors, and staff spaces have fallen into disrepair. Original robotic attendants use distinct patrol and search behaviors.

The ruined daycare atmosphere from *Five Nights at Freddy's: Security Breach – RUIN* is a broad mood reference only. The game must establish its own identity.

## Experience goals

- Make the location feel like a real indoor play venue with a clear history and layout.
- Contrast cheerful design language with abandonment, silence, and deterioration.
- Encourage careful exploration and environmental storytelling.
- Make attendants feel distinct through original silhouettes, animation, sound, and behavior.
- Build a small, playable slice before expanding the facility.

## Design pillars

1. **A believable place:** play structures, reception, party rooms, staff-only spaces, storage, and maintenance routes should connect logically.
2. **Unease over constant action:** use lighting, distant sounds, sightlines, and environmental clues to build tension.
3. **Readable character behavior:** attendants should have understandable rules and recognizable movement, not arbitrary teleporting or unavoidable pursuit.
4. **Original identity:** final character designs, names, lore, level layouts, dialogue, and audio are original or properly licensed.

## First playable slice

The current greybox slice starts at the front entrance. The player finds three power relays, watches a three-lamp sequence, repeats it at panel 04, and returns to unlock the front exit. An original geometric attendant patrols the play area and staff corridor, investigates sprinting and other noise, and searches the last place it saw the player. Two marked hiding places let the player evade it when they enter unseen. Being caught returns the player to the entrance while preserving puzzle progress.

The slice is a prototype: its attendant follows fixed waypoints, the soft-play model has no collision, and the visuals and movement need browser review.

## Technical direction

The current foundation is Three.js + Vite with JavaScript modules. Keep the starter kit operational while adding focused game systems. Physics and AI libraries are candidates, not installed dependencies: evaluate them only when the prototype needs them.

## Open creative decisions

The final game title, facility name, attendant names and designs, story explanation, and exact player objective remain undecided.
