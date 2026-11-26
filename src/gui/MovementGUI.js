/**
 * First Person Starter Kit - Movement GUI
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 */

export class MovementGUI {
  constructor(gui, player) {
    this.player = player;
    this.settings = player.getSettings();
    
    this.setupFolder(gui);
  }

  setupFolder(gui) {
    const folder = gui.addFolder('Movement');
    
    folder.add(this.settings, 'moveSpeed', 1, 20, 0.5)
      .name('Move Speed')
      .onChange((value) => this.player.setMoveSpeed(value));
    
    folder.add(this.settings, 'sprintMultiplier', 1.5, 5, 0.5)
      .name('Sprint Multiplier')
      .onChange((value) => this.player.setSprintMultiplier(value));
    
    folder.add(this.settings, 'mouseSensitivity', 0.0005, 0.01, 0.0005)
      .name('Mouse Sensitivity')
      .onChange((value) => this.player.setMouseSensitivity(value));
  }
}
