/**
 * First Person Starter Kit - Input Manager
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 */

export class InputManager {
  constructor() {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
    };
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('keydown', (event) => this.handleKey(event, true));
    document.addEventListener('keyup', (event) => this.handleKey(event, false));
  }

  handleKey(event, pressed) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = pressed;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = pressed;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = pressed;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = pressed;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = pressed;
        break;
    }
  }

  getKeys() {
    return this.keys;
  }

  isMoving() {
    return (
      this.keys.forward ||
      this.keys.backward ||
      this.keys.left ||
      this.keys.right
    );
  }
}
