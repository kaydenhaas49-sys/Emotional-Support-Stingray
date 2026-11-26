import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ASSET_ROOT = '/assets/textures/';

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
  }

  async build() {
    const materials = await this.createMaterials();
    this.buildArchitecture(materials);
    this.buildReception(materials);
    this.buildStaffPanel(materials);
    this.buildLighting();
    await this.loadSoftPlayModel();
    this.buildDecor(materials);
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
        ['MAINTENANCE NOTE', 'STAFF CORRIDOR: PANEL 04', 'Restore power after inspection'],
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
      const gltf = await this.modelLoader.loadAsync('/assets/environment/soft-play/model.glb');
      const model = gltf.scene;
      model.name = 'Soft-play environment asset';
      model.updateMatrixWorld(true);

      const originalBounds = new THREE.Box3().setFromObject(model);
      const originalSize = originalBounds.getSize(new THREE.Vector3());
      const footprint = Math.max(originalSize.x, originalSize.z);

      if (!Number.isFinite(footprint) || footprint < 0.01) {
        throw new Error('The soft-play model has no usable 3D bounds.');
      }

      const scale = 13.5 / footprint;
      model.scale.multiplyScalar(scale);
      model.updateMatrixWorld(true);

      const scaledBounds = new THREE.Box3().setFromObject(model);
      const center = scaledBounds.getCenter(new THREE.Vector3());
      model.position.x += -4.5 - center.x;
      model.position.z += -4.0 - center.z;
      model.position.y += -scaledBounds.min.y;
      model.updateMatrixWorld(true);

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.scene.add(model);
      this.modelLoaded = true;
      console.info('[PlayCentreTest] Soft-play model loaded and auto-fitted.', {
        sourceSize: originalSize,
        scale
      });
    } catch (error) {
      console.error('[PlayCentreTest] Could not load soft-play model; using a greybox fallback.', error);
      this.buildSoftPlayFallback();
    }
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

  getCollisionBoxes() {
    return this.collisionBoxes;
  }

  getNearbyInteractable(position) {
    let closest = null;
    let closestDistance = Infinity;

    for (const item of this.interactables) {
      const dx = position.x - item.x;
      const dz = position.z - item.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance <= item.radius && distance < closestDistance) {
        closest = item;
        closestDistance = distance;
      }
    }

    return closest;
  }

  interact(position, hud) {
    const target = this.getNearbyInteractable(position);
    if (!target) {
      hud.showMessage('Nothing nearby to interact with.');
      return;
    }

    if (target.id === 'note') {
      this.noteRead = true;
      hud.setObjective('Reach the staff corridor and restore power at panel 04.');
      hud.showMessage('The note points to the breaker at the end of the staff corridor.');
      return;
    }

    if (target.id === 'breaker') {
      if (!this.noteRead) {
        hud.showMessage('The panel is labelled 04. Check the reception desk first.');
        return;
      }

      this.complete = true;
      this.indicator.material.color.set(0x62d88a);
      this.indicator.material.emissive.set(0x1a8a45);
      this.panelLight.color.set(0x62d88a);
      this.panelLight.intensity = 10;
      hud.setObjective('TEST COMPLETE — POWER RESTORED');
      hud.setHint('Press R to restart the test.');
      hud.showMessage('Panel 04 restored. The first test area is complete.');
    }
  }

  update(delta, player, hud) {
    this.time += delta;

    this.lights.forEach((entry) => {
      const breathing = 1 + Math.sin(this.time * 1.4 + entry.phase) * 0.035;
      const flicker = entry.flickers && Math.sin(this.time * 19 + entry.phase) > 0.985 ? 0.12 : 1;
      entry.light.intensity = entry.intensity * breathing * flicker;
    });

    if (!hud || !player) return;

    const target = this.getNearbyInteractable(player.camera.position);
    if (this.complete) {
      hud.setHint('Press R to restart the test.');
    } else if (target) {
      hud.setHint('E  —  ' + target.label);
    } else {
      hud.setHint('');
    }
  }
}
