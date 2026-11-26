/**
 * First Person Starter Kit - Pointer Lock
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 */

export class PointerLock {
  constructor(renderer) {
    this.renderer = renderer;
    this.isLocked = false;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Click on canvas to request pointer lock
    this.renderer.domElement.addEventListener('click', () => this.requestLock());
    document.addEventListener('pointerlockchange', () => this.onLockChange());
  }

  requestLock() {
    this.renderer.domElement.requestPointerLock();
  }

  onLockChange() {
    this.isLocked = document.pointerLockElement === this.renderer.domElement;
  }

  isPointerLocked() {
    return this.isLocked;
  }
}
