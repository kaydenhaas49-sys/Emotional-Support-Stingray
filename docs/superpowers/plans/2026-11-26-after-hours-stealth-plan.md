# After-Hours Play-Centre Stealth Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the current Three.js prototype into one playable stealth-horror chapter with an original attendant, hiding, a visual sequence puzzle, and an unlocked exit.

**Architecture:** Keep the existing main loop and environment object. Add a focused attendant controller that owns its procedural mesh and simple state machine; let the environment own pickups, hide spots, puzzle progress, and exit state; wire input and concise HUD updates through the existing entry point.

**Tech Stack:** JavaScript modules, Three.js 0.170, Vite 6, existing HTML/CSS HUD. No new dependencies.

**Spec:** docs/superpowers/specs/2026-11-26-after-hours-stealth-design.md

## Global Constraints

- Use the existing Three.js/Vite project and assets; add no dependencies.
- Keep room, attendant, story, and encounter original.
- Add no decorative text; show only controls, objectives, interaction prompts, and puzzle clues.
- Keep suspenseful horror without combat or graphic violence.
- Scope is one short desktop playable chapter.

## Review Focus

- Player enters or leaves a hiding spot while the attendant has line of sight; hiding must not erase an already witnessed entry.
- A wrong puzzle input must reset sequence progress and emit noise that the attendant can investigate.
- Caught and restart states must restore the player and attendant without leaving hidden or locked controls.
- Empty or missing relay/puzzle interaction targets must not crash the game loop.
- Functional HUD text must stay readable and no extra decorative copy should be introduced.

---

### Task 1: Procedural attendant and behavior

**Files:**
- Create: `src/characters/Attendant.js`

**Interfaces:**
- Produces `new Attendant(scene, { patrolPoints, onCaught })`.
- `update(delta, playerPosition, hidden)` advances patrol/investigate/search and reports a catch through `onCaught`.
- `reportNoise(position, radius)` sends the attendant to investigate audible actions.
- `reset(position)` clears alert/catch state and returns it to its start point.

- [ ] Build an original, non-humanoid geometric attendant with visible head/body/limbs and a simple walking motion.
- [ ] Implement patrol, investigate, search, and catch states with bounded timers and waypoint movement.
- [ ] Use a Three.js raycast for line of sight; hide suppresses detection only when the player was not seen entering.
- [ ] Review state transitions and numeric bounds in the finished source.

### Task 2: Hide spots, relay pickups, and puzzle in the environment

**Files:**
- Modify: `src/environment/PlayCentreTest.js`

**Interfaces:**
- `getNearbyHideSpot(position)` returns the nearest hide spot within interaction range or null.
- `toggleHide(position, hud)` enters or exits the nearby hide spot.
- `interact(position, hud)` collects relays, advances the panel sequence, or uses the unlocked exit.
- Environment update sends sprint/interaction noise to `Attendant.reportNoise` and calls its `update`.

- [ ] Add three visibly distinct relay pickups, marked hide spots, and an exit route using Three.js geometry.
- [ ] Add a three-color visual light clue and three panel inputs; accept only the clue order.
- [ ] Reset the panel sequence and alert the attendant after a wrong input.
- [ ] Unlock the exit only after all relays are collected and the sequence is correct.
- [ ] Review collisions and interaction ranges against the current room coordinates.

### Task 3: Input, caught/restart flow, and concise HUD

**Files:**
- Modify: `src/main.js`
- Modify: `src/ui/TestHUD.js`
- Modify: `src/core/Player.js` only if hiding requires pausing movement cleanly.

**Interfaces:**
- `TestHUD.setObjective(text)`, `setHint(text)`, and `showMessage(text)` remain the only player-facing text channels.
- E toggles hiding when at a hide spot, otherwise interacts with the nearest environment target.
- Caught returns the player to the entrance checkpoint and resets the attendant.
- Restart remains available after completing the chapter.

- [ ] Wire E, movement noise, catch callback, checkpoint reset, and exit completion.
- [ ] Add only functional controls, objective, puzzle clue, and interaction text.
- [ ] Review pointer-lock resume, hiding transitions, and restart behavior.

### Task 4: Project notes

**Files:**
- Modify: `docs/GAME_DESIGN.md`
- Modify: `docs/FIRST_TEST.md`
- Modify: `docs/ROADMAP.md`

- [ ] Update the design and first-test notes to describe only implemented gameplay and known limits.
- [ ] Mark completed roadmap items without adding unrelated feature promises.
