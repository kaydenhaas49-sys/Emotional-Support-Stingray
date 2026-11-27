# Archade classroom source asset

Original source file: archade-classroom.skp
Source listing: https://archade.app/marketplace/3d-models/interior-scenes/preschooler-classroom-education-scene-sketchup

The original SketchUp file is kept here as editable source and stored through Git LFS. It is not loaded directly by the browser game.

The development/build pipeline uses OpenSKP 1.7.0 to convert the source into:

public/assets/environment/archade/classroom.glb

The generated GLB is intentionally ignored by Git and is recreated during Vite dev/build and the GitHub Pages workflow. The game loads the Archade GLB first, then tries the existing soft-play GLB as a fallback if the converted scene is missing or invalid.

No separate licence/readme file was included alongside the uploaded SKP source. Review the current Archade listing terms before distributing the converted model.
