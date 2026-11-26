/**
 * First Person Starter Kit - Light Manager
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 */

import * as THREE from 'three';
import { SHADOW } from '../utils/Constants.js';

export class LightManager {
  constructor(scene) {
    this.scene = scene;
    this.ambientLight = null;
    this.dirLight = null;
    this.initialize();
  }

  initialize() {
    this.setupAmbientLight();
    this.setupDirectionalLight();
  }

  setupAmbientLight(intensity = 0.3, color = 0xffffff) {
    if (this.ambientLight) this.scene.remove(this.ambientLight);
    
    this.ambientLight = new THREE.AmbientLight(color, intensity);
    this.scene.add(this.ambientLight);
  }

  setupDirectionalLight(intensity = 1.5, color = 0xffffff, position = { x: 10, y: 20, z: 10 }) {
    if (this.dirLight) this.scene.remove(this.dirLight);
    
    this.dirLight = new THREE.DirectionalLight(color, intensity);
    this.dirLight.position.set(position.x, position.y, position.z);
    this.dirLight.castShadow = true;
    
    // Setup shadow
    this.dirLight.shadow.mapSize.set(SHADOW.MAP_SIZE, SHADOW.MAP_SIZE);
    this.dirLight.shadow.camera.near = SHADOW.NEAR;
    this.dirLight.shadow.camera.far = SHADOW.FAR;
    this.dirLight.shadow.camera.left = -15;
    this.dirLight.shadow.camera.right = 15;
    this.dirLight.shadow.camera.top = 15;
    this.dirLight.shadow.camera.bottom = -15;
    this.dirLight.shadow.bias = SHADOW.BIAS;
    this.dirLight.shadow.normalBias = SHADOW.NORMAL_BIAS;
    
    this.scene.add(this.dirLight);
  }

  setAmbientIntensity(intensity) {
    if (this.ambientLight) this.ambientLight.intensity = intensity;
  }

  setAmbientColor(color) {
    if (this.ambientLight) this.ambientLight.color.setHex(color);
  }

  setDirectionalIntensity(intensity) {
    if (this.dirLight) this.dirLight.intensity = intensity;
  }

  setDirectionalColor(color) {
    if (this.dirLight) this.dirLight.color.setHex(color);
  }

  setDirectionalPosition(x, y, z) {
    if (this.dirLight) this.dirLight.position.set(x, y, z);
  }

  getAmbientLight() {
    return this.ambientLight;
  }

  getDirectionalLight() {
    return this.dirLight;
  }
}
