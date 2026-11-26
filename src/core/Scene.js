/**
 * First Person Starter Kit - Scene
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 */

import * as THREE from 'three';
import { GROUND, GRID } from '../utils/Constants.js';

export class Scene {
  constructor() {
    this.scene = new THREE.Scene();
    this.initialize();
  }

  initialize() {
    // Setup fog - will be set dynamically based on skybox
    // this.scene.fog = new THREE.Fog(0x87ceeb, 50, 200);
    
    // Setup ground
    this.setupGround();
    
    // Setup grid helper
    this.setupGrid();
  }

  setupGround() {
    const geometry = new THREE.PlaneGeometry(GROUND.SIZE, GROUND.SIZE);
    const material = new THREE.MeshStandardMaterial({ color: GROUND.COLOR });
    const ground = new THREE.Mesh(geometry, material);
    
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    
    this.scene.add(ground);
  }

  setupGrid() {
    const grid = new THREE.GridHelper(
      GRID.SIZE,
      GRID.DIVISIONS,
      GRID.COLOR1,
      GRID.COLOR2
    );
    grid.position.y = 0.01;
    this.scene.add(grid);
  }

  getScene() {
    return this.scene;
  }

  add(object) {
    this.scene.add(object);
  }

  remove(object) {
    this.scene.remove(object);
  }
}
