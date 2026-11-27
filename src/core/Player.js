/**
 * First Person Starter Kit - Player
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 */

import * as THREE from 'three';
import { MOVEMENT, EYE_HEIGHT } from '../utils/Constants.js';

export class Player {
  constructor(camera, inputManager, pointerLock) {
    this.camera = camera;
    this.inputManager = inputManager;
    this.pointerLock = pointerLock;
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.PI_2 = Math.PI / 2;
    this.settings = {
      moveSpeed: MOVEMENT.SPEED,
      sprintMultiplier: MOVEMENT.SPRINT_MULTIPLIER,
      mouseSensitivity: MOVEMENT.MOUSE_SENSITIVITY,
    };
    this.direction = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.cameraDirection = new THREE.Vector3();
    this.sideDirection = new THREE.Vector3();
    this.collisionBoxes = [];
    this.collisionRadius = 0.32;
    this.collisionGrid = new Map();
    this.collisionGridCellSize = 4;
    this.hidden = false;
    this.setupMouseLook();
  }

  setupMouseLook() {
    document.addEventListener('mousemove', (event) => this.onMouseMove(event));
  }

  onMouseMove(event) {
    if (!this.pointerLock.isPointerLocked()) return;
    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= event.movementX * this.settings.mouseSensitivity;
    this.euler.x -= event.movementY * this.settings.mouseSensitivity;
    this.euler.x = Math.max(-this.PI_2, Math.min(this.PI_2, this.euler.x));
    this.camera.quaternion.setFromEuler(this.euler);
  }

  setCollisionBoxes(boxes) {
    this.collisionBoxes = Array.isArray(boxes) ? boxes : [];
    this.collisionGrid.clear();
    const cellSize = this.collisionGridCellSize;
    for (const box of this.collisionBoxes) {
      const minCellX = Math.floor(box.minX / cellSize);
      const maxCellX = Math.floor(box.maxX / cellSize);
      const minCellZ = Math.floor(box.minZ / cellSize);
      const maxCellZ = Math.floor(box.maxZ / cellSize);
      for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
        for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ += 1) {
          const key = cellX + ',' + cellZ;
          if (!this.collisionGrid.has(key)) this.collisionGrid.set(key, []);
          this.collisionGrid.get(key).push(box);
        }
      }
    }
  }

  isBlocked(x, z) {
    const radius = this.collisionRadius;
    const cellSize = this.collisionGridCellSize;
    const minCellX = Math.floor((x - radius) / cellSize);
    const maxCellX = Math.floor((x + radius) / cellSize);
    const minCellZ = Math.floor((z - radius) / cellSize);
    const maxCellZ = Math.floor((z + radius) / cellSize);
    for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
      for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ += 1) {
        const candidates = this.collisionGrid.get(cellX + ',' + cellZ) ?? [];
        for (const box of candidates) {
          if (x + radius > box.minX && x - radius < box.maxX &&
              z + radius > box.minZ && z - radius < box.maxZ) return true;
        }
      }
    }
    return false;
  }

  update(delta) {
    if (!this.pointerLock.isPointerLocked() || this.hidden) return;
    const keys = this.inputManager.getKeys();
    this.direction.set(0, 0, 0);

    if (keys.forward) this.direction.z -= 1;
    if (keys.backward) this.direction.z += 1;
    if (keys.left) this.direction.x -= 1;
    if (keys.right) this.direction.x += 1;
    this.direction.normalize();

    this.camera.getWorldDirection(this.cameraDirection);
    this.cameraDirection.y = 0;
    this.cameraDirection.normalize();
    this.sideDirection.crossVectors(this.cameraDirection, this.camera.up).normalize();
    this.velocity.set(0, 0, 0);
    this.velocity.addScaledVector(this.cameraDirection, -this.direction.z);
    this.velocity.addScaledVector(this.sideDirection, this.direction.x);
    this.velocity.normalize();

    const currentSpeed = keys.sprint
      ? this.settings.moveSpeed * this.settings.sprintMultiplier
      : this.settings.moveSpeed;
    const distance = currentSpeed * Math.min(delta, 0.05);
    const nextX = this.camera.position.x + this.velocity.x * distance;
    const nextZ = this.camera.position.z + this.velocity.z * distance;

    // Resolve axes separately so the player can slide along walls.
    if (!this.isBlocked(nextX, this.camera.position.z)) {
      this.camera.position.x = nextX;
    }
    if (!this.isBlocked(this.camera.position.x, nextZ)) {
      this.camera.position.z = nextZ;
    }

    this.camera.position.y = EYE_HEIGHT;
  }

  setHidden(hidden) {
    this.hidden = Boolean(hidden);
  }

  getSettings() {
    return this.settings;
  }

  setMoveSpeed(speed) {
    this.settings.moveSpeed = speed;
  }

  setSprintMultiplier(multiplier) {
    this.settings.sprintMultiplier = multiplier;
  }

  setMouseSensitivity(sensitivity) {
    this.settings.mouseSensitivity = sensitivity;
  }
}
