# Asset Credits and Licences

This file records the provenance of assets currently used by the playable build. Keep original licence/readme information alongside editable source files.

## First-person starter kit

- **Project:** [First Person Starter Kit](https://github.com/augustopolonio/first-person-starter-kit)
- **Author:** Augusto Polonio
- **Licence:** MIT (see the repository root `LICENSE`)
- **Use:** Three.js/Vite application foundation and first-person controller.

## Quaternius robot placeholder

- **Creator:** Quaternius
- **Source:** [Quaternius](https://quaternius.com/)
- **Licence:** CC0 1.0 Universal (see `assets/characters/robot-placeholder/LICENSE.txt`)
- **Use:** Prototype attendant character. The game loads the FBX at runtime and uses its available embedded idle/walk/run clips. It remains a placeholder pending a final character design.

## Archade preschool classroom

- **Source listing:** [Archade — Preschooler Classroom Education Scene](https://archade.app/marketplace/3d-models/interior-scenes/preschooler-classroom-education-scene-sketchup).
- **Creator:** Eliad Dorfman / Archade marketplace.
- **Licence:** Archade Free Licence supplied with the download. It permits personal and commercial project use, modification and adaptation, with no attribution requirement. It prohibits redistributing the asset as a standalone file or repackaging it as a library, template pack, bundle or dataset.
- **Runtime asset:** `public/assets/environment/archade/classroom.glb`, optimized and adapted for this game.
- **Collision:** `public/assets/environment/archade/collision.json`, generated from the original, unsimplified SketchUp triangles.
- The editable `.skp` source is kept outside this public game repository. The adapted classroom is part of the game and is not offered as a standalone asset download.
