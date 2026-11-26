/**
 * First Person Starter Kit - Skybox Manager
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 */

import * as THREE from 'three';
import { SKYBOX } from '../utils/Constants.js';

import { DebugManager } from '../debug/DebugManager.js';

export class SkyboxManager {
  constructor(scene) {
    this.scene = scene;
    this.textureLoader = new THREE.TextureLoader();
    this.currentSkybox = null;
    this.skyboxMesh = null;
    this.offsetU = 0;
  }

  loadSkybox(path) {
    return new Promise((resolve, reject) => {
      DebugManager.log('SkyboxManager', `Loading skybox: ${path}`);
      this.textureLoader.load(
        path,
        (texture) => {
          DebugManager.log('SkyboxManager', 'Skybox texture loaded successfully');
          texture.mapping = THREE.EquirectangularReflectionMapping;
          texture.colorSpace = THREE.SRGBColorSpace;
          
          // Set as background and environment
          this.scene.background = texture;
          this.scene.environment = texture;
          DebugManager.log('SkyboxManager', 'Background and environment set');
          
          // Create mesh for transformations
          if (this.skyboxMesh) this.scene.remove(this.skyboxMesh);
          
          const geometry = new THREE.SphereGeometry(SKYBOX.RADIUS, SKYBOX.SEGMENTS, SKYBOX.SEGMENTS);
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
          });
          this.skyboxMesh = new THREE.Mesh(geometry, material);
          this.scene.add(this.skyboxMesh);
          DebugManager.log('SkyboxManager', 'Skybox mesh created and added to scene');
          
          this.currentSkybox = texture;
          this.updateOffset();
          resolve(texture);
        },
        undefined,
        (error) => {
          DebugManager.error('SkyboxManager', 'Failed to load skybox:', error);
          reject(error);
        }
      );
    });
  }

  setOffsetU(value) {
    this.offsetU = value;
    this.updateOffset();
  }

  updateOffset() {
    if (!this.skyboxMesh) return;
    this.skyboxMesh.rotation.y = this.offsetU * Math.PI * 2;
  }

  getOffsetU() {
    return this.offsetU;
  }
}
