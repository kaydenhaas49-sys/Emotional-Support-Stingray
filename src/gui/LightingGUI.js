/**
 * First Person Starter Kit - Lighting GUI
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 */

import { LIGHTING_PRESETS } from '../lighting/LightingPresets.js';

export class LightingGUI {
  constructor(gui, lightManager, skyboxManager) {
    this.lightManager = lightManager;
    this.skyboxManager = skyboxManager;
    
    this.lightSettings = {
      ambientIntensity: 0.3,
      ambientColor: 0xffffff,
      dirIntensity: 1.5,
      dirColor: 0xffffff,
      dirPosX: 10,
      dirPosY: 20,
      dirPosZ: 10,
      preset: 'balanced',
    };
    
    this.offsetUController = null;
    this.folder = null;
    
    this.setupFolder(gui);
  }

  setupFolder(gui) {
    this.folder = gui.addFolder('Lighting');
    
    // Preset selector
    this.folder.add(this.lightSettings, 'preset', {
      Morning: 'morning',
      Noon: 'noon',
      Sunset: 'sunset',
      Night: 'night',
      Balanced: 'balanced',
    })
      .name('Preset')
      .onChange((value) => this.applyPreset(value));
    
    // Ambient light
    this.folder.add(this.lightSettings, 'ambientIntensity', 0, 2, 0.05)
      .name('Ambient Intensity')
      .onChange((value) => this.lightManager.setAmbientIntensity(value));
    
    this.folder.addColor(this.lightSettings, 'ambientColor')
      .name('Ambient Color')
      .onChange((value) => this.lightManager.setAmbientColor(value));
    
    // Directional light
    this.folder.add(this.lightSettings, 'dirIntensity', 0, 3, 0.1)
      .name('Directional Intensity')
      .onChange((value) => this.lightManager.setDirectionalIntensity(value));
    
    this.folder.addColor(this.lightSettings, 'dirColor')
      .name('Directional Color')
      .onChange((value) => this.lightManager.setDirectionalColor(value));
    
    // Directional position
    const dirPosFolder = this.folder.addFolder('Directional Position');
    dirPosFolder.add(this.lightSettings, 'dirPosX', -50, 50, 1)
      .name('X')
      .onChange((value) => this.lightManager.setDirectionalPosition(
        value,
        this.lightSettings.dirPosY,
        this.lightSettings.dirPosZ
      ));
    
    dirPosFolder.add(this.lightSettings, 'dirPosY', -50, 50, 1)
      .name('Y')
      .onChange((value) => this.lightManager.setDirectionalPosition(
        this.lightSettings.dirPosX,
        value,
        this.lightSettings.dirPosZ
      ));
    
    dirPosFolder.add(this.lightSettings, 'dirPosZ', -50, 50, 1)
      .name('Z')
      .onChange((value) => this.lightManager.setDirectionalPosition(
        this.lightSettings.dirPosX,
        this.lightSettings.dirPosY,
        value
      ));
  }

  applyPreset(presetName) {
    const preset = LIGHTING_PRESETS[presetName];
    if (!preset) return;

    // Update lights
    this.lightManager.setAmbientIntensity(preset.ambientIntensity);
    this.lightManager.setAmbientColor(preset.ambientColor);
    this.lightManager.setDirectionalIntensity(preset.dirIntensity);
    this.lightManager.setDirectionalColor(preset.dirColor);
    this.lightManager.setDirectionalPosition(preset.dirPosX, preset.dirPosY, preset.dirPosZ);

    // Load skybox
    if (preset.skybox) {
      this.skyboxManager.loadSkybox(preset.skybox).then(() => {
        if (preset.offsetU !== undefined) {
          this.skyboxManager.setOffsetU(preset.offsetU);
          if (this.offsetUController) {
            this.offsetUController.updateDisplay();
          }
        }
      });
    } else {
      if (preset.offsetU !== undefined) {
        this.skyboxManager.setOffsetU(preset.offsetU);
        if (this.offsetUController) {
          this.offsetUController.updateDisplay();
        }
      }
    }

    // Update settings object
    Object.assign(this.lightSettings, {
      ambientIntensity: preset.ambientIntensity,
      dirIntensity: preset.dirIntensity,
      dirPosX: preset.dirPosX,
      dirPosY: preset.dirPosY,
      dirPosZ: preset.dirPosZ,
      ambientColor: preset.ambientColor,
      dirColor: preset.dirColor,
    });

    // Update all controllers
    this.folder.controllers.forEach((controller) => {
      controller.updateDisplay();
    });
  }

  setOffsetUController(controller) {
    this.offsetUController = controller;
  }
}
