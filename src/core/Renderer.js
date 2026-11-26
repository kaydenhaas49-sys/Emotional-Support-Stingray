/**
 * First Person Starter Kit - Renderer
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 */

import * as THREE from 'three';

export class Renderer {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.setupRenderer();
    this.setupResizeHandler();
  }

  setupRenderer() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    document.body.appendChild(this.renderer.domElement);
  }

  setupResizeHandler() {
    window.addEventListener('resize', () => this.onWindowResize());
  }

  onWindowResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  getRenderer() {
    return this.renderer;
  }

  render(scene, camera) {
    this.renderer.render(scene, camera);
  }
}
