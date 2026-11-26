/**
 * First Person Starter Kit - Constants
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 */

// Game constants
export const CAMERA_FOV = 75;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 1000;
export const EYE_HEIGHT = 1.7;

export const MOVEMENT = {
  SPEED: 5,
  SPRINT_MULTIPLIER: 2,
  MOUSE_SENSITIVITY: 0.002,
};

export const GROUND = {
  SIZE: 200,
  SEGMENTS: 100,
  COLOR: '#2ecc71',
};

export const GRID = {
  SIZE: 200,
  DIVISIONS: 100,
  COLOR1: 0x2d6b2d,
  COLOR2: 0x2d6b2d,
};

export const SHADOW = {
  MAP_SIZE: 2048,
  NEAR: 0.5,
  FAR: 100,
  BIAS: -0.0005,
  NORMAL_BIAS: 0.02,
};

export const SKYBOX = {
  RADIUS: 500,
  SEGMENTS: 32,
};
