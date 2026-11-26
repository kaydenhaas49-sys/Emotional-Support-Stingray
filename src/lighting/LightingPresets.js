/**
 * First Person Starter Kit - Lighting Presets
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 */

export const LIGHTING_PRESETS = {
  morning: {
    ambientIntensity: 0.5,
    dirIntensity: 1.3,
    dirPosX: -15,
    dirPosY: 15,
    dirPosZ: 10,
    ambientColor: 0xffd89b,
    dirColor: 0xffa500,
    skybox: '/skyboxes/skybox-morning.png',
    offsetU: 0.2,
  },
  noon: {
    ambientIntensity: 0.3,
    dirIntensity: 1.5,
    dirPosX: 10,
    dirPosY: 20,
    dirPosZ: 10,
    ambientColor: 0xffffff,
    dirColor: 0xffffff,
    skybox: '/skyboxes/skybox-day.png',
    offsetU: 0.4,
  },
  sunset: {
    ambientIntensity: 0.4,
    dirIntensity: 3,
    dirPosX: 20,
    dirPosY: 10,
    dirPosZ: -10,
    ambientColor: 0xff9999,
    dirColor: 0xff6600,
    skybox: '/skyboxes/skybox-morning.png',
    offsetU: 0.6,
  },
  night: {
    ambientIntensity: 0.1,
    dirIntensity: 0.6,
    dirPosX: 10,
    dirPosY: 5,
    dirPosZ: 10,
    ambientColor: 0x1a3a52,
    dirColor: 0xaabbdd,
    skybox: '/skyboxes/skybox-night.png',
    offsetU: 0.45,
  },
  balanced: {
    ambientIntensity: 0.3,
    dirIntensity: 1.5,
    dirPosX: 10,
    dirPosY: 20,
    dirPosZ: 10,
    ambientColor: 0xffffff,
    dirColor: 0xffffff,
    skybox: '/skyboxes/skybox-day.png',
    offsetU: 0.4,
  },
};
