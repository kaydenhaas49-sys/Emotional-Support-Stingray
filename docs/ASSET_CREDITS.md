# Asset Credits and Licences

This file records the provenance of assets currently present in the repository. Keep the original licence/readme files alongside source assets whenever possible. Re-check the source terms before adding new packs.

## First-person starter kit

- **Project:** [First Person Starter Kit](https://github.com/augustopolonio/first-person-starter-kit)
- **Author:** Augusto Polonio
- **Licence:** MIT (see the repository root `LICENSE`)
- **Use:** Three.js/Vite application foundation and first-person controller.
- The starter kit's existing code and demo assets are being retained as the technical base.

## Quaternius robot placeholder

- **Creator:** Quaternius
- **Source:** [Quaternius](https://quaternius.com/)
- **Licence:** CC0 1.0 Universal (see `assets/characters/robot-placeholder/LICENSE.txt`)
- **Use:** Prototype attendant character. The game loads the FBX at runtime, fits it to character height, and uses embedded idle/walk/run clips when available. It remains a placeholder pending a final character design.

## KinemIQ / Quaternius animation pack

- **Pack:** KinemIQ Free Animation Pack — 35 game animations
- **Source:** [KinemIQ free game animations](https://kinemiq.app/free-game-animations/)
- **Underlying motion library:** Quaternius Universal Animation Library
- **Licence:** CC0 1.0, as stated in the included pack README.
- **Changes:** Retargeted, cleaned, and exported by KinemIQ.
- **Use:** Humanoid mannequin and animation clips for prototype tests. These are generic humanoid animations and may require retargeting or adjustment for the final robot rigs.
- The original README is stored at `assets/animations/kinemiq/README.txt`.

## Existing starter-kit demo assets

- **Kenney Mini Forest:** credited as CC0 in the upstream starter-kit acknowledgments; retained for testing only under `public/models/kenney_mini-forest_1.0/`.
- **Skyboxes:** credited to Kenney in the upstream starter-kit acknowledgments; retained under `public/skyboxes/`.

## Soft-play environment scene

- **Runtime model:** `public/assets/environment/soft-play/model.glb` (the uploaded root `model.glb`, moved into the environment folder).
- **Source pack reference:** [Trampoline Park and Soft Play pack](https://3dassets.dev/packs/trampoline-park-and-soft-play). Confirm the exact pack licence/attribution against the downloaded source before release; do not assume the model's licence from its filename alone.
- **Damaged plaster and concrete textures:** [Poly Haven](https://polyhaven.com/). Imported; 2K maps are stored under `public/assets/textures/`.

Do not mark planned assets as imported until the files and their licence information have actually been added.


## Poly Haven Textures

- [Damaged Plaster](https://polyhaven.com/a/damaged_plaster) — Poly Haven, CC0.
- [Concrete Floor 01](https://polyhaven.com/a/concrete_floor_01) — Poly Haven, CC0.


## Archade preschool classroom source scene

- Source scene: source-assets/archade/archade-classroom.skp (stored with Git LFS).
- Source listing: https://archade.app/marketplace/3d-models/interior-scenes/preschooler-classroom-education-scene-sketchup.
- Runtime conversion: the build converts the SketchUp source to public/assets/environment/archade/classroom.glb using OpenSKP 1.7.0 (MIT-licensed converter).
- Licence note: no separate licence/readme file was included alongside the uploaded source file. Check the Archade listing's current asset terms and retain any required attribution before distributing the converted model.
