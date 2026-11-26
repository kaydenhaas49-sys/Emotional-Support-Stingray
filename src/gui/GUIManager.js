/**
 * First Person Starter Kit - GUI Manager
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 */

import GUI from 'lil-gui';
import { LightingGUI } from './LightingGUI.js';
import { MovementGUI } from './MovementGUI.js';
import { SkyboxGUI } from '../skybox/SkyboxGUI.js';
import { ShadowGUI } from './ShadowGUI.js';

export class GUIManager {
  constructor(player, lightManager, skyboxManager, renderer) {
    this.gui = new GUI({ title: 'Controls' });
    
    this.movementGUI = new MovementGUI(this.gui, player);
    this.lightingGUI = new LightingGUI(this.gui, lightManager, skyboxManager);
    this.skyboxGUI = new SkyboxGUI(this.gui, skyboxManager);
    this.shadowGUI = new ShadowGUI(this.gui, renderer);
    
    this.setupInstructions();
    this.hideGUI();
  }

  setupInstructions() {
    const instructionsFolder = this.gui.addFolder('Instructions');
    const instructions = {
      'Click canvas': 'to capture mouse',
      'WASD / Arrows': 'to move',
      'Shift': 'to sprint',
      'Mouse': 'to look around',
      'ESC': 'to release mouse',
    };
    
    for (const [key, value] of Object.entries(instructions)) {
      instructionsFolder.add({ [key]: value }, key).disable();
    }
  }

  hideGUI() {
    const guiElement = document.querySelector('.lil-gui');
    if (guiElement) {
      guiElement.style.display = 'none';
    }
  }

  getGUI() {
    return this.gui;
  }

  getLightingGUI() {
    return this.lightingGUI;
  }
}
