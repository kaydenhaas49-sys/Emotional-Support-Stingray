/**
 * First Person Starter Kit - Game Loop
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 */

import * as THREE from 'three';

export class Game {
  constructor(scene, camera, renderer, player) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.player = player;
    
    this.clock = new THREE.Clock();
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
  }

  animate = () => {
    if (!this.isRunning) return;
    
    requestAnimationFrame(this.animate);
    
    const delta = this.clock.getDelta();
    
    // Update player
    this.player.update(delta);
    
    // Render
    this.renderer.render(this.scene, this.camera);
  };
}
