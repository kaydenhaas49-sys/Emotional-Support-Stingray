/**
 * First Person Starter Kit - Model Loader
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 */

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DebugManager } from '../debug/DebugManager.js';

export class ModelLoader {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    
    // Intercept fetch for case-sensitivity issues
    this.setupFetchInterceptor();
  }

  setupFetchInterceptor() {
    const originalFetch = window.fetch;
    
    window.fetch = function(...args) {
      let url = args[0];
      
      // Convert Textures/ to textures/ for case-sensitive systems
      if (url && typeof url === 'string' && url.includes('Textures/')) {
        const correctedUrl = url.replace(/Textures\//g, 'textures/');
        DebugManager.log('ModelLoader', `Fetch intercepted: ${url} → ${correctedUrl}`);
        args[0] = correctedUrl;
      }
      
      return originalFetch.apply(this, args);
    };
  }

  /**
   * Load a GLTF/GLB model into the scene.
   * @param {string} path - Path to model file
   * @param {object} options - Configuration options
   * @param {number[]} [options.position] - [x, y, z]
   * @param {number[]} [options.rotation] - [x, y, z] in degrees
   * @param {number|number[]} [options.scale] - uniform or [x, y, z]
   * @param {boolean} [options.shadows] - enable cast/receive shadows (default: true)
   * @returns {Promise<THREE.Group>} loaded model
   */
  loadModel(path, options = {}) {
    const {
      position = [0, 0, 0],
      rotation = [0, 0, 0],
      scale = 1,
      shadows = true,
    } = options;

    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          const model = gltf.scene;

          // Apply position
          model.position.set(...position);

          // Apply rotation (convert degrees to radians)
          model.rotation.set(
            this.degToRad(rotation[0]),
            this.degToRad(rotation[1]),
            this.degToRad(rotation[2])
          );

          // Apply scale
          if (Array.isArray(scale)) {
            model.scale.set(...scale);
          } else {
            model.scale.setScalar(scale);
          }

          // Setup shadows
          if (shadows) {
            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
          }

          this.scene.add(model);
          DebugManager.log('ModelLoader', `Model loaded: ${path}`);
          resolve(model);
        },
        (progress) => {
          if (progress.total > 0) {
            const pct = ((progress.loaded / progress.total) * 100).toFixed(1);
            DebugManager.log('ModelLoader', `Loading ${path}: ${pct}%`);
          }
        },
        reject
      );
    });
  }

  degToRad(degrees) {
    return degrees * (Math.PI / 180);
  }
}
