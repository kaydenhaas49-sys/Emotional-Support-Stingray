/**
 * First Person Starter Kit - Shadow GUI
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 */

import * as THREE from 'three';

export class ShadowGUI {
  constructor(gui, renderer) {
    this.renderer = renderer;
    
    this.shadowSettings = {
      shadowMapSize: 2048,
      shadowType: 'PCFSoft',
      enabled: true,
      bias: -0.0005,
      normalBias: 0.02,
      shadowCameraSize: 15,
    };
    
    this.setupFolder(gui);
  }

  setupFolder(gui) {
    const folder = gui.addFolder('Shadows');
    
    folder.add(this.shadowSettings, 'enabled')
      .name('Enabled')
      .onChange((value) => this.onShadowEnabledChange(value));
    
    folder.add(this.shadowSettings, 'shadowMapSize', {
      '512': 512,
      '1024': 1024,
      '2048': 2048,
      '4096': 4096,
    })
      .name('Quality')
      .onChange((value) => this.onShadowMapSizeChange(value));
    
    folder.add(this.shadowSettings, 'shadowType', {
      Basic: 'Basic',
      PCF: 'PCF',
      PCFSoft: 'PCFSoft',
      VSM: 'VSM',
    })
      .name('Type')
      .onChange((value) => this.onShadowTypeChange(value));
    
    folder.add(this.shadowSettings, 'bias', -0.01, 0.01, 0.0001)
      .name('Bias')
      .onChange((value) => this.onBiasChange(value));
    
    folder.add(this.shadowSettings, 'normalBias', 0, 0.1, 0.005)
      .name('Normal Bias')
      .onChange((value) => this.onNormalBiasChange(value));
    
    folder.add(this.shadowSettings, 'shadowCameraSize', 5, 60, 1)
      .name('Coverage Area')
      .onChange((value) => this.onShadowCameraSizeChange(value));
  }

  onShadowEnabledChange(value) {
    this.renderer.shadowMap.enabled = value;
    this.renderer.scene?.traverse((child) => {
      if (child.isMesh) child.material.needsUpdate = true;
    });
  }

  onShadowMapSizeChange(value) {
    const size = Number(value);
    const lights = this.renderer.scene?.children.filter(c => c.isLight && c.shadow);
    lights?.forEach(light => {
      light.shadow.mapSize.set(size, size);
      light.shadow.map?.dispose();
      light.shadow.map = null;
    });
  }

  onShadowTypeChange(value) {
    const types = {
      Basic: THREE.BasicShadowMap,
      PCF: THREE.PCFShadowMap,
      PCFSoft: THREE.PCFSoftShadowMap,
      VSM: THREE.VSMShadowMap,
    };
    this.renderer.shadowMap.type = types[value];
    this.renderer.scene?.traverse((child) => {
      if (child.isMesh) child.material.needsUpdate = true;
    });
  }

  onBiasChange(value) {
    const lights = this.renderer.scene?.children.filter(c => c.isLight && c.shadow);
    lights?.forEach(light => {
      light.shadow.bias = value;
    });
  }

  onNormalBiasChange(value) {
    const lights = this.renderer.scene?.children.filter(c => c.isLight && c.shadow);
    lights?.forEach(light => {
      light.shadow.normalBias = value;
    });
  }

  onShadowCameraSizeChange(value) {
    const lights = this.renderer.scene?.children.filter(c => c.isLight && c.shadow);
    lights?.forEach(light => {
      light.shadow.camera.left = -value;
      light.shadow.camera.right = value;
      light.shadow.camera.top = value;
      light.shadow.camera.bottom = -value;
      light.shadow.camera.updateProjectionMatrix();
    });
  }
}
