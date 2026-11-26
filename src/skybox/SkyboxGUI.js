/**
 * First Person Starter Kit - Skybox GUI
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 */

export class SkyboxGUI {
  constructor(gui, skyboxManager) {
    this.skyboxManager = skyboxManager;
    
    this.skyboxSettings = {
      offsetU: 0,
    };
    
    this.setupFolder(gui);
  }

  setupFolder(gui) {
    // Find the lighting folder (parent)
    const lightingFolder = gui.folders[0]; // Assuming Lighting is created first
    
    if (!lightingFolder) return;
    
    const folder = lightingFolder.addFolder('Skybox Offset');
    
    folder.add(this.skyboxSettings, 'offsetU', -1, 1, 0.05)
      .name('Horizontal')
      .onChange((value) => this.skyboxManager.setOffsetU(value));
  }

  getSkyboxSettings() {
    return this.skyboxSettings;
  }

  updateOffsetU(value) {
    this.skyboxSettings.offsetU = value;
  }
}
