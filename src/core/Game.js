/**
 * First Person Starter Kit - Game Loop
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 */

import * as THREE from 'three';

export class Game {
  constructor(scene, camera, renderer, player, world = null, hud = null) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.player = player;
    this.world = world;
    this.hud = hud;
    this.clock = new THREE.Clock();
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.animate();
  }

  stop() {
    this.isRunning = false;
  }

  animate = () => {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    this.player.update(delta);

    if (this.world && typeof this.world.update === 'function') {
      this.world.update(delta, this.player, this.hud);
    }

    this.renderer.render(this.scene, this.camera);
  };
}
