import * as THREE from 'three';
import { Attendant } from '../characters/Attendant.js';
import { EYE_HEIGHT } from '../utils/Constants.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ASSET_ROOT = `${import.meta.env.BASE_URL}assets/textures/`;

export class PlayCentreTest {
  constructor(scene) {
    this.scene = scene;
    this.textureLoader = new THREE.TextureLoader();
    this.modelLoader = new GLTFLoader();
    this.collisionBoxes = [];
    this.lights = [];
    this.interactables = [];
    this.time = 0;
    this.noteRead = false;
    this.complete = false;
    this.indicator = null;
    this.modelLoaded = false;
    this.relayCount = 0;
    this.puzzleOrder = [2, 0, 1];
    this.puzzleProgress = 0;
    this.exitUnlocked = false;
    this.hiddenSpot = null;
    this.hideReturnPosition = null;
    this.caught = false;
    this.noiseCooldown = 0;
    this.clueTime = 0;
    this.playerStart = new THREE.Vector3(0, EYE_HEIGHT, 12);
  }

  async build() {
    const materials = await this.createMaterials();
    this.buildArchitecture(materials);
    this.buildReception(materials);
    this.buildStaffPanel(materials);
    this.buildLighting();
    await this.loadSoftPlayModel();
    this.buildDecor(materials);
    await this.buildStealthGameplay(materials);
    return this;
  }

  async loadTexture(path, repeatX, repeatY, isColor = false) {
    try {
      const texture = await this.textureLoader.loadAsync(path);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeatX, repeatY);
      texture.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.anisotropy = 4;
      return texture;
    } catch (error) {
      console.warn('[PlayCentreTest] Texture unavailable:', path, error);
      return null;
    }
  }

  async createMaterials() {
    const files = [
      'concrete/concrete_floor_01_diff_2k.jpg',
      'concrete/concrete_floor_01_nor_gl_2k.jpg',
      'concrete/concrete_floor_01_rough_2k.jpg',
      'plaster/damaged_plaster_diff_2k.jpg',
      'plaster/damaged_plaster_nor_gl_2k.jpg',
      'plaster/damaged_plaster_rough_2k.jpg'
    ];

    const maps = await Promise.all(files.map((file, index) =>
      this.loadTexture(ASSET_ROOT + file, index < 3 ? 7 : 3, index < 3 ? 5 : 2, index === 0 || index === 3)
    ));

    const floor = new THREE.MeshStandardMaterial({
      color: 0xb7b8b4,
      map: maps[0],
      normalMap: maps[1],
      roughnessMap: maps[2],
      roughness: 0.92,
      metalness: 0.0
    });
    floor.normalScale.set(0.55, 0.55);

    const wall = new THREE.MeshStandardMaterial({
      color: 0xb4ada0,
      map: maps[3],
      normalMap: maps[4],
      roughnessMap: maps[5],
      roughness: 0.96,
      metalness: 0.0
    });
    wall.normalScale.set(0.38, 0.38);

    return {
      floor,
      wall,
      dark: new THREE.MeshStandardMaterial({ color: 0x292d31, roughness: 0.92 }),
      desk: new THREE.MeshStandardMaterial({ color: 0x343a3d, roughness: 0.82 }),
      trim: new THREE.MeshStandardMaterial({ color: 0x596168, roughness: 0.72, metalness: 0.12 })
    };
  }

  addBox(name, width, height, depth, x, y, z, material, collidable = false) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    if (collidable) {
      this.collisionBoxes.push({
        minX: x - width / 2,
        maxX: x + width / 2,
        minZ: z - depth / 2,
        maxZ: z + depth / 2
      });
    }

    return mesh;
  }

  buildArchitecture(materials) {
    const width = 44;
    const depth = 32;
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    const wallHeight = 6;
    const wallThickness = 0.5;

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), materials.floor);
    floor.name = 'Concrete floor';
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // The staff corridor extends beyond the main room footprint.
    const corridorFloor = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 10), materials.floor);
    corridorFloor.name = 'Staff corridor concrete floor';
    corridorFloor.rotation.x = -Math.PI / 2;
    corridorFloor.position.set(14, 0, -21);
    corridorFloor.receiveShadow = true;
    this.scene.add(corridorFloor);

    this.addBox('Left perimeter wall', wallThickness, wallHeight, depth, -halfWidth, wallHeight / 2, 0, materials.wall, true);
    this.addBox('Right perimeter wall', wallThickness, wallHeight, depth, halfWidth, wallHeight / 2, 0, materials.wall, true);

    // Main entrance opening on the front wall.
    this.addBox('Front wall left', 19.8, wallHeight, wallThickness, -12.1, wallHeight / 2, halfDepth, materials.wall, true);
    this.addBox('Front wall right', 19.8, wallHeight, wallThickness, 12.1, wallHeight / 2, halfDepth, materials.wall, true);
    this.addBox('Front entrance header', 4.4, 0.45, wallThickness, 0, 5.78, halfDepth, materials.trim);

    // Back wall opening joins the main play room to a narrow staff corridor.
    this.addBox('Back wall left', 33.9, wallHeight, wallThickness, -5.05, wallHeight / 2, -halfDepth, materials.wall, true);
    this.addBox('Back wall right', 5.9, wallHeight, wallThickness, 19.05, wallHeight / 2, -halfDepth, materials.wall, true);
    this.addBox('Staff doorway header', 4.2, 0.45, wallThickness, 14, 5.78, -halfDepth, materials.trim);

    this.addBox('Staff corridor left wall', 0.45, wallHeight, 10, 11.9, 3, -21, materials.wall, true);
    this.addBox('Staff corridor right wall', 0.45, wallHeight, 10, 16.1, 3, -21, materials.wall, true);
    this.addBox('Staff corridor end wall', 4.2, wallHeight, wallThickness, 14, 3, -26, materials.wall, true);

    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x252a2e,
      roughness: 1,
      side: THREE.DoubleSide
    });
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), ceilingMaterial);
    ceiling.name = 'Main ceiling';
    ceiling.rotation.x = -Math.PI / 2;
    ceiling.position.y = wallHeight;
    ceiling.receiveShadow = true;
    this.scene.add(ceiling);

    this.addBox('Corridor ceiling', 4.2, 0.18, 10, 14, 5.92, -21, materials.dark);

    [-13, 0, 13].forEach((x) => {
      this.addBox('Ceiling cross beam', 0.22, 0.22, 32, x, 5.78, 0, materials.dark);
    });

    this.addBox('Entrance side post left', 0.18, 3.4, 0.18, -2.25, 1.7, 15.65, materials.trim);
    this.addBox('Entrance side post right', 0.18, 3.4, 0.18, 2.25, 1.7, 15.65, materials.trim);

    const guide = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 0.12),
      new THREE.MeshBasicMaterial({ color: 0xb28b4a })
    );
    guide.rotation.x = -Math.PI / 2;
    guide.position.set(0, 0.015, 13.4);
    this.scene.add(guide);
  }

  makeCanvasLabel(lines, background = '#252b2f', foreground = '#e9e2d1') {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 384;
    const context = canvas.getContext('2d');
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#b49b70';
    context.lineWidth = 12;
    context.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
    context.fillStyle = foreground;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    lines.forEach((line, index) => {
      context.font = index === 0 ? 'bold 48px Arial' : '30px Arial';
      context.fillText(line, canvas.width / 2, 142 + index * 66, 680);
    });
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  addWallSign(lines, x, y, z, width, height, yaw = 0) {
    const material = new THREE.MeshBasicMaterial({
      map: this.makeCanvasLabel(lines),
      side: THREE.DoubleSide
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    sign.position.set(x, y, z);
    sign.rotation.y = yaw;
    this.scene.add(sign);
    return sign;
  }

  buildReception(materials) {
    this.addBox('Reception counter', 4.6, 1.1, 1.35, 15, 0.55, 9.5, materials.desk, true);
    this.addBox('Reception counter top', 4.85, 0.12, 1.5, 15, 1.13, 9.5, materials.trim);

    const noteMaterial = new THREE.MeshBasicMaterial({
      map: this.makeCanvasLabel(
        ['MAINTENANCE NOTE', 'FIND THREE RELAYS', 'FOLLOW THE LAMP ORDER'],
        '#d8d0b9',
        '#34312b'
      ),
      side: THREE.DoubleSide
    });
    const note = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.75), noteMaterial);
    note.name = 'Maintenance note';
    note.rotation.x = -Math.PI / 2;
    note.position.set(15, 1.205, 9.5);
    this.scene.add(note);

    this.addWallSign(['WELCOME', 'PLEASE CHECK IN'], 8.7, 3.3, 15.72, 3.2, 1.5, Math.PI);
    this.addWallSign(['PARTY ROOMS', 'STAFF ACCESS'], 14, 3.1, -16.28, 2.8, 1.35, 0);

    this.interactables.push({
      id: 'note',
      label: 'Inspect the maintenance note',
      x: 15,
      z: 9.5,
      radius: 3.2
    });
  }

  buildStaffPanel(materials) {
    this.addBox('Breaker cabinet', 1.15, 1.5, 0.16, 14, 1.65, -25.68, materials.trim);

    const faceMaterial = new THREE.MeshBasicMaterial({
      map: this.makeCanvasLabel(['PANEL 04', 'PLAY AREA POWER'], '#343b3f', '#f1e8d4'),
      side: THREE.DoubleSide
    });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.3), faceMaterial);
    face.position.set(14, 1.65, -25.585);
    this.scene.add(face);

    const indicatorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8d2525,
      emissive: 0x5e0808,
      emissiveIntensity: 1.5
    });
    this.indicator = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), indicatorMaterial);
    this.indicator.position.set(14.34, 2.05, -25.55);
    this.scene.add(this.indicator);

    this.interactables.push({
      id: 'breaker',
      label: 'Use breaker panel 04',
      x: 14,
      z: -23.7,
      radius: 2.45
    });
  }

  buildLighting() {
    const ambient = new THREE.HemisphereLight(0xb8c5cb, 0x28232a, 0.55);
    this.scene.add(ambient);

    const lampPositions = [
      [-14, -7, 20, false],
      [-3, -7, 18, true],
      [9, -7, 17, false],
      [-14, 8, 14, true],
      [-3, 8, 20, false],
      [9, 8, 13, true],
      [14, -20, 10, true]
    ];

    lampPositions.forEach(([x, z, intensity, flickers], index) => {
      const fixtureMaterial = new THREE.MeshStandardMaterial({
        color: 0xc7d0d2,
        emissive: 0x82939b,
        emissiveIntensity: 0.8,
        roughness: 0.45
      });
      const fixture = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.42), fixtureMaterial);
      fixture.position.set(x, 5.55, z);
      this.scene.add(fixture);

      const light = new THREE.PointLight(0xcbd8df, intensity, 18, 2);
      light.position.set(x, 5.15, z);
      light.castShadow = index === 1 || index === 4;
      this.scene.add(light);
      this.lights.push({ light, intensity, flickers, phase: index * 1.73 });
    });

    const panelLight = new THREE.PointLight(0xb73b31, 5, 4, 2);
    panelLight.position.set(14.3, 2.3, -24.9);
    this.scene.add(panelLight);
    this.panelLight = panelLight;
  }

  async loadSoftPlayModel() {
    try {
      const gltf = await this.modelLoader.loadAsync(`${import.meta.env.BASE_URL}assets/environment/soft-play/model.glb`);
      const model = gltf.scene;
      model.name = 'Soft-play environment asset';
      model.updateMatrixWorld(true);

      const sourceBounds = new THREE.Box3().setFromObject(model);
      const sourceSize = sourceBounds.getSize(new THREE.Vector3());
      const footprint = Math.max(sourceSize.x, sourceSize.z);

      if (!Number.isFinite(footprint) || footprint < 0.01 || sourceSize.y < 0.01) {
        throw new Error('The soft-play model has no usable 3D bounds.');
      }

      // Fit the play structure to believable room dimensions while preserving its proportions.
      const scale = Math.min(17.0 / footprint, 4.65 / sourceSize.y);
      model.scale.setScalar(scale);
      model.updateMatrixWorld(true);

      const fittedBounds = new THREE.Box3().setFromObject(model);
      const center = fittedBounds.getCenter(new THREE.Vector3());
      model.position.x -= center.x + 4.5;
      model.position.z -= center.z + 4.0;
      model.position.y -= fittedBounds.min.y;
      model.updateMatrixWorld(true);

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.scene.add(model);
      this.addSoftPlayCollision(model);
      this.modelLoaded = true;
      console.info('[PlayCentreTest] Soft-play model fitted and collision generated.', {
        sourceSize,
        fittedSize: new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()),
        colliderCount: this.softPlayCollisionCount
      });
    } catch (error) {
      console.error('[PlayCentreTest] Could not load soft-play model; using a greybox fallback.', error);
      this.buildSoftPlayFallback();
    }
  }

  addSoftPlayCollision(model) {
    const cellSize = 0.58;
    const occupied = new Set();
    const position = new THREE.Vector3();
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const ab = new THREE.Vector3();
    const ac = new THREE.Vector3();
    const normal = new THREE.Vector3();

    const pointInTriangle = (px, pz, ax, az, bx, bz, cx, cz) => {
      const denominator = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
      if (Math.abs(denominator) < 1e-7) return false;
      const u = ((bz - cz) * (px - cx) + (cx - bx) * (pz - cz)) / denominator;
      const v = ((cz - az) * (px - cx) + (ax - cx) * (pz - cz)) / denominator;
      return u >= -0.01 && v >= -0.01 && u + v <= 1.01;
    };

    const addCell = (x, z) => occupied.add(x + ',' + z);
    model.updateMatrixWorld(true);

    model.traverse((mesh) => {
      if (!mesh.isMesh || !mesh.geometry || !mesh.geometry.attributes.position) return;
      const geometry = mesh.geometry;
      const vertices = geometry.attributes.position;
      const indices = geometry.index;
      const triangleCount = indices ? indices.count / 3 : vertices.count / 3;

      for (let triangle = 0; triangle < triangleCount; triangle += 1) {
        const ia = indices ? indices.getX(triangle * 3) : triangle * 3;
        const ib = indices ? indices.getX(triangle * 3 + 1) : triangle * 3 + 1;
        const ic = indices ? indices.getX(triangle * 3 + 2) : triangle * 3 + 2;

        a.fromBufferAttribute(vertices, ia).applyMatrix4(mesh.matrixWorld);
        b.fromBufferAttribute(vertices, ib).applyMatrix4(mesh.matrixWorld);
        c.fromBufferAttribute(vertices, ic).applyMatrix4(mesh.matrixWorld);

        const minY = Math.min(a.y, b.y, c.y);
        const maxY = Math.max(a.y, b.y, c.y);
        // Only wall-like surfaces intersecting the player's body become blockers.
        if (maxY < 0.22 || minY > 1.92) continue;

        ab.subVectors(b, a);
        ac.subVectors(c, a);
        normal.crossVectors(ab, ac);
        const normalLength = normal.length();
        if (normalLength < 1e-7 || Math.abs(normal.y) / normalLength > 0.78) continue;

        const minX = Math.min(a.x, b.x, c.x);
        const maxX = Math.max(a.x, b.x, c.x);
        const minZ = Math.min(a.z, b.z, c.z);
        const maxZ = Math.max(a.z, b.z, c.z);
        const startX = Math.floor(minX / cellSize);
        const endX = Math.floor(maxX / cellSize);
        const startZ = Math.floor(minZ / cellSize);
        const endZ = Math.floor(maxZ / cellSize);
        const projectedArea = Math.abs(
          (b.x - a.x) * (c.z - a.z) - (c.x - a.x) * (b.z - a.z)
        );

        for (let cellX = startX; cellX <= endX; cellX += 1) {
          for (let cellZ = startZ; cellZ <= endZ; cellZ += 1) {
            const centerX = (cellX + 0.5) * cellSize;
            const centerZ = (cellZ + 0.5) * cellSize;
            const inside = projectedArea < 0.025
              ? centerX >= minX - cellSize * 0.35 && centerX <= maxX + cellSize * 0.35 &&
                centerZ >= minZ - cellSize * 0.35 && centerZ <= maxZ + cellSize * 0.35
              : pointInTriangle(centerX, centerZ, a.x, a.z, b.x, b.z, c.x, c.z);
            if (inside) addCell(cellX, cellZ);
          }
        }

        // Preserve very thin posts and rails that can fall between grid-cell centres.
        if (projectedArea < 0.025) {
          addCell(Math.floor((a.x + b.x + c.x) / 3 / cellSize), Math.floor((a.z + b.z + c.z) / 3 / cellSize));
        }
      }
    });

    // Merge adjacent occupied cells into wider boxes to keep player collision inexpensive.
    const rows = new Map();
    occupied.forEach((key) => {
      const [x, z] = key.split(',').map(Number);
      if (!rows.has(z)) rows.set(z, []);
      rows.get(z).push(x);
    });

    const rowRuns = new Map();
    [...rows.keys()].sort((a, b) => a - b).forEach((z) => {
      const xs = rows.get(z).sort((a, b) => a - b);
      let start = null;
      let previous = null;
      const runs = [];
      xs.forEach((x) => {
        if (start === null) start = x;
        else if (x !== previous + 1) {
          runs.push([start, previous]);
          start = x;
        }
        previous = x;
      });
      if (start !== null) runs.push([start, previous]);
      rowRuns.set(z, runs);
    });

    const active = new Map();
    [...rowRuns.keys()].sort((a, b) => a - b).forEach((z) => {
      const nextActive = new Map();
      rowRuns.get(z).forEach(([start, end]) => {
        const key = start + ':' + end;
        const existing = active.get(key);
        if (existing && Math.abs(existing.maxZ - z * cellSize) < 1e-6) {
          existing.maxZ = (z + 1) * cellSize;
          nextActive.set(key, existing);
        } else {
          const box = {
            minX: start * cellSize,
            maxX: (end + 1) * cellSize,
            minZ: z * cellSize,
            maxZ: (z + 1) * cellSize
          };
          this.collisionBoxes.push(box);
          nextActive.set(key, box);
        }
      });
      active.clear();
      nextActive.forEach((box, key) => active.set(key, box));
    });

    this.softPlayCollisionCount = occupied.size;
  }

  buildSoftPlayFallback() {
    const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x687b75, roughness: 0.9 });
    const warmMaterial = new THREE.MeshStandardMaterial({ color: 0xb65e53, roughness: 0.9 });
    const goldMaterial = new THREE.MeshStandardMaterial({ color: 0xc2a45b, roughness: 0.9 });
    const greenMaterial = new THREE.MeshStandardMaterial({ color: 0x668b83, roughness: 0.9 });

    this.addBox('Fallback play platform', 9.5, 0.45, 8.0, -4.5, 0.55, -4, platformMaterial);
    this.addBox('Fallback foam tower', 1.8, 3.2, 1.8, -8.0, 2.15, -6.5, warmMaterial);
    this.addBox('Fallback foam tower', 1.8, 2.4, 1.8, -1.0, 1.75, -6.5, goldMaterial);
    this.addBox('Fallback foam bridge', 6.0, 0.55, 1.1, -4.5, 3.2, -6.5, greenMaterial);
  }

  buildDecor(materials) {
    this.addBox('Old floor mat', 7.5, 0.045, 5.0, 10, 0.03, -3, new THREE.MeshStandardMaterial({
      color: 0x526c68,
      roughness: 1
    }));
    this.addBox('Storage crate', 1.1, 0.85, 0.9, -17.5, 0.425, -11, materials.desk);
    this.addBox('Plastic play block', 0.8, 0.8, 0.8, 12, 0.4, -7, new THREE.MeshStandardMaterial({
      color: 0xa77e50,
      roughness: 0.95
    }));
  }

  async buildStealthGameplay(materials) {
    this.interactables = this.interactables.filter((item) => item.id === 'note');
    const colors = [0x61c4d7, 0xdca759, 0x88c978];
    const names = ['blue', 'amber', 'green'];
    const relayPositions = [[-16.5, 9.5], [7.5, -8.5], [-17.5, -10.5]];
    this.relays = relayPositions.map(([x, z], index) => {
      const material = new THREE.MeshStandardMaterial({
        color: colors[index], emissive: colors[index], emissiveIntensity: 0.7,
        roughness: 0.36, metalness: 0.3
      });
      const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.25, 0), material);
      mesh.position.set(x, 0.55, z);
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.interactables.push({ id: 'relay-' + index, label: 'Collect relay', x, z, radius: 1.7, mesh });
      return mesh;
    });

    this.puzzleOrder = [2, 0, 1];
    this.puzzleProgress = 0;
    this.clueLamps = [];
    [-1.1, 0, 1.1].forEach((x, index) => {
      const material = new THREE.MeshStandardMaterial({
        color: colors[index], emissive: colors[index], emissiveIntensity: 0.08, roughness: 0.3
      });
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), material);
      globe.position.set(x, 3.8, 14.8);
      this.scene.add(globe);
      const light = new THREE.PointLight(colors[index], 0.04, 4, 2);
      light.position.copy(globe.position);
      this.scene.add(light);
      this.clueLamps.push({ globe, light });
    });

    this.panelSwitches = [];
    [12.55, 14, 15.45].forEach((x, index) => {
      const material = new THREE.MeshStandardMaterial({
        color: colors[index], emissive: colors[index], emissiveIntensity: 0.2, roughness: 0.38
      });
      const button = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.16), material);
      button.position.set(x, 1.85, -24.9);
      button.castShadow = true;
      this.scene.add(button);
      this.panelSwitches.push(button);
      this.interactables.push({ id: 'switch-' + index, label: 'Use ' + names[index] + ' switch', x, z: -24.4, radius: 0.72, mesh: button });
    });

    this.exitGate = this.addBox('Front exit gate', 4.4, 3.1, 0.28, 0, 1.55, 15.7,
      new THREE.MeshStandardMaterial({ color: 0x343b3e, roughness: 0.8 }), true);
    this.exitGateCollisionIndex = this.collisionBoxes.length - 1;
    this.interactables.push({ id: 'exit', label: 'Use the front exit', x: 0, z: 14.2, radius: 1.4 });

    this.hideSpots = [
      { name: 'maintenance alcove', x: -18.6, z: -5.8, radius: 1.7 },
      { name: 'play tunnel', x: 5.5, z: -8.5, radius: 1.7 }
    ];
    const cover = new THREE.MeshStandardMaterial({ color: 0x3b4141, roughness: 0.95 });
    this.addBox('Alcove side cover', 0.18, 2.2, 2.0, -19.5, 1.1, -5.5, cover, true);
    this.addBox('Alcove rear cover', 2.0, 2.2, 0.18, -18.5, 1.1, -6.55, cover, true);
    this.addBox('Alcove privacy screen', 1.0, 2.2, 0.18, -17.75, 1.1, -4.45, cover, true);
    this.addBox('Tunnel side cover', 0.22, 2.0, 2.5, 6.75, 1.0, -8.5, cover, true);
    this.addBox('Tunnel rear cover', 2.0, 2.0, 0.22, 5.6, 1.0, -9.65, cover, true);
    this.addBox('Tunnel privacy screen', 1.15, 2.0, 0.2, 4.9, 1.0, -7.35, cover, true);

    this.attendant = new Attendant(this.scene, {
      patrolPoints: [
        { x: -18, z: 10 }, { x: -18, z: -12 }, { x: 8, z: -12 },
        { x: 14, z: -12 }, { x: 14, z: -16 }, { x: 14, z: -24 },
        { x: 14, z: -16 }, { x: 14, z: -12 }, { x: 18, z: -12 },
        { x: 18, z: 12 }, { x: -18, z: 12 }
      ],
      collisionBoxes: this.collisionBoxes,
      onCaught: () => { this.caught = true; }
    });
    await this.attendant.ready;
  }

  getCollisionBoxes() {
    return this.collisionBoxes;
  }

  getNearbyHideSpot(position) {
    if (this.hiddenSpot) return this.hiddenSpot;
    return this.hideSpots.find((spot) => {
      const dx = position.x - spot.x, dz = position.z - spot.z;
      return Math.sqrt(dx * dx + dz * dz) <= spot.radius;
    }) || null;
  }

  toggleHide(position, hud, player) {
    if (this.hiddenSpot) {
      this.hiddenSpot = null;
      player.setHidden(false);
      if (this.hideReturnPosition) player.camera.position.copy(this.hideReturnPosition);
      player.camera.position.y = EYE_HEIGHT;
      this.hideReturnPosition = null;
      hud.showMessage('You leave the hiding place.');
      return true;
    }
    const spot = this.getNearbyHideSpot(position);
    if (!spot) return false;
    // Preserve the attendant's knowledge if it saw the player entering cover.
    const wasSeen = Boolean(this.attendant && (
      this.attendant.playerVisible || this.attendant.canSeePlayer(position)
    ));
    this.hiddenSpot = spot;
    this.hideReturnPosition = player.camera.position.clone();
    player.setHidden(true);
    player.camera.position.set(spot.x, EYE_HEIGHT, spot.z);
    if (wasSeen) this.attendant.rememberHiddenPosition(spot);
    hud.showMessage('Hidden in the ' + spot.name + '.');
    return true;
  }

  getNearbyInteractable(position) {
    let closest = null, closestDistance = Infinity;
    for (const item of this.interactables) {
      const dx = position.x - item.x, dz = position.z - item.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if ((item.id.startsWith('relay-') || item.id.startsWith('switch-')) && (!item.mesh || !item.mesh.parent)) continue;
      if (distance <= item.radius && distance < closestDistance) {
        closest = item;
        closestDistance = distance;
      }
    }
    return closest;
  }

  removeExitGate() {
    if (!this.exitGate) return;
    this.scene.remove(this.exitGate);
    this.collisionBoxes.splice(this.exitGateCollisionIndex, 1);
    this.exitGate = null;
  }

  interact(position, hud) {
    const target = this.getNearbyInteractable(position);
    if (!target) {
      hud.showMessage('Nothing nearby to interact with.');
      return;
    }
    if (target.id === 'note') {
      this.noteRead = true;
      hud.setObjective('Find three relays. Repeat the light sequence at panel 04, then return to the front exit.');
      hud.showMessage('The ceiling lamps show the switch order.');
      return;
    }
    if (target.id.startsWith('relay-')) {
      if (!target.mesh || !target.mesh.parent) return;
      this.scene.remove(target.mesh);
      target.mesh.geometry.dispose();
      target.mesh.material.dispose();
      target.mesh = null;
      this.interactables = this.interactables.filter((item) => item !== target);
      this.relayCount += 1;
      hud.setObjective(this.relayCount < 3
        ? 'Find the remaining power relays (' + this.relayCount + '/3).'
        : 'Repeat the light sequence at panel 04.');
      hud.showMessage('Relay collected (' + this.relayCount + '/3).');
      return;
    }
    if (target.id.startsWith('switch-')) {
      if (this.relayCount < 3) {
        hud.showMessage('The panel needs all three relays.');
        return;
      }
      if (this.exitUnlocked) {
        hud.showMessage('Panel 04 is powered.');
        return;
      }
      const index = Number(target.id.slice('switch-'.length));
      const button = this.panelSwitches[index];
      if (!button || !button.material) {
        hud.showMessage('Panel switch unavailable.');
        return;
      }
      if (index === this.puzzleOrder[this.puzzleProgress]) {
        button.material.emissiveIntensity = 1.2;
        this.puzzleProgress += 1;
        if (this.puzzleProgress === this.puzzleOrder.length) {
          this.exitUnlocked = true;
          if (this.indicator && this.indicator.material) {
            this.indicator.material.color.set(0x62d88a);
            this.indicator.material.emissive.set(0x1a8a45);
          }
          if (this.panelLight) {
            this.panelLight.color.set(0x62d88a);
            this.panelLight.intensity = 10;
          }
          this.removeExitGate();
          hud.setObjective('Power restored. Return to the front exit.');
          hud.showMessage('Panel 04 is powered. The exit is unlocked.');
        } else {
          hud.showMessage('Switch set.');
        }
      } else {
        this.puzzleProgress = 0;
        this.panelSwitches.forEach((button) => {
          if (button && button.material) button.material.emissiveIntensity = 0.2;
        });
        this.attendant.reportNoise(position, 18);
        hud.showMessage('Wrong sequence. The panel resets.');
      }
      return;
    }
    if (target.id === 'exit') {
      if (!this.exitUnlocked) {
        hud.showMessage('The exit is locked. Restore power at panel 04.');
        return;
      }
      this.complete = true;
      hud.setObjective('You escaped.');
      hud.setHint('Press R to restart.');
      hud.showMessage('The front exit opens.');
    }
  }

  update(delta, player, hud) {
    this.time += delta;
    this.clueTime += delta;
    this.lights.forEach((entry) => {
      const breathing = 1 + Math.sin(this.time * 1.4 + entry.phase) * 0.035;
      const flicker = entry.flickers && Math.sin(this.time * 19 + entry.phase) > 0.985 ? 0.12 : 1;
      entry.light.intensity = entry.intensity * breathing * flicker;
    });

    const cycle = this.clueTime % 3.4;
    const activeIndex = cycle < 2.4 ? this.puzzleOrder[Math.floor(cycle / 0.8)] : -1;
    this.clueLamps.forEach((lamp, index) => {
      const active = index === activeIndex;
      lamp.globe.material.emissiveIntensity = active ? 1.7 : 0.08;
      lamp.light.intensity = active ? 2.2 : 0.04;
    });

    if (!player) return;
    const position = player.camera.position;
    this.noiseCooldown = Math.max(0, this.noiseCooldown - delta);
    const keys = player.inputManager.getKeys();
    if (player.pointerLock.isPointerLocked() && !player.hidden && keys.sprint && player.inputManager.isMoving() && this.noiseCooldown === 0) {
      this.attendant.reportNoise(position, 9);
      this.noiseCooldown = 1.4;
    }
    if (!this.complete && player.pointerLock.isPointerLocked()) this.attendant.update(delta, position, player.hidden);

    if (this.caught) {
      this.caught = false;
      this.hiddenSpot = null;
      this.hideReturnPosition = null;
      player.setHidden(false);
      player.camera.position.copy(this.playerStart);
      player.camera.lookAt(-4.5, EYE_HEIGHT, -4);
      this.attendant.reset({ x: this.playerStart.x, z: this.playerStart.z });
      if (hud) {
        hud.setObjective(this.relayCount < 3
          ? 'Find three relays (' + this.relayCount + '/3).'
          : this.exitUnlocked
            ? 'Power restored. Return to the front exit.'
            : 'Repeat the light sequence at panel 04.');
        hud.showMessage('The attendant found you. You return to the entrance.');
      }
    }

    if (!hud) return;
    if (this.complete) {
      hud.setHint('Press R to restart.');
    } else if (player.hidden) {
      hud.setHint('E  —  Leave hiding place');
    } else {
      const target = this.getNearbyInteractable(position);
      const hideSpot = this.getNearbyHideSpot(position);
      hud.setHint(hideSpot ? 'E  —  Hide in the ' + hideSpot.name : target ? 'E  —  ' + target.label : '');
    }
  }

}
