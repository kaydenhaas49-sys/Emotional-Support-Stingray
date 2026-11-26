/**
 * First Person Starter Kit - Camera
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 */

import * as THREE from 'three';
import { CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR, EYE_HEIGHT } from '../utils/Constants.js';

export class Camera {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      CAMERA_NEAR,
      CAMERA_FAR
    );
    
    this.camera.position.set(0, EYE_HEIGHT, 5);
    this.setupResizeHandler();
  }

  setupResizeHandler() {
    window.addEventListener('resize', () => this.onWindowResize());
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  getCamera() {
    return this.camera;
  }

  getPosition() {
    return this.camera.position;
  }

  getQuaternion() {
    return this.camera.quaternion;
  }
}
