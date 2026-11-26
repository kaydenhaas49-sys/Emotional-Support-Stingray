/**
 * First Person Starter Kit
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 * 
 * Main entry point for the application
 */

import { inject } from '@vercel/analytics';

import { Scene } from './core/Scene.js';
import { Camera } from './core/Camera.js';
import { Renderer } from './core/Renderer.js';
import { Player } from './core/Player.js';
import { Game } from './core/Game.js';

import { LightManager } from './lighting/LightManager.js';
import { SkyboxManager } from './skybox/SkyboxManager.js';

import { InputManager } from './input/InputManager.js';
import { PointerLock } from './input/PointerLock.js';

import { ModelLoader } from './models/ModelLoader.js';

import { GUIManager } from './gui/GUIManager.js';
import { UIManager } from './ui/UIManager.js';

import { DebugManager } from './debug/DebugManager.js';
import { CONFIG } from './config.js';

// Initialize Vercel Analytics
inject();

// Initialize DebugManager with config
DebugManager.getInstance();
DebugManager.initialize(CONFIG);

// Initialize core systems
const scene = new Scene();
const camera = new Camera();
const renderer = new Renderer();

// Get THREE scene (for shadow access)
const threeScene = scene.getScene();
renderer.getRenderer().scene = threeScene;

// Initialize subsystems
const lightManager = new LightManager(threeScene);
const skyboxManager = new SkyboxManager(threeScene);
const inputManager = new InputManager();
const pointerLock = new PointerLock(renderer.getRenderer());

// Initialize player
const player = new Player(camera.getCamera(), inputManager, pointerLock);

// Initialize GUI
const guiManager = new GUIManager(player, lightManager, skyboxManager, renderer.getRenderer());

// Initialize UI (top bar + preset panel)
const uiManager = new UIManager(guiManager);

// Setup shadow camera access for ShadowGUI
renderer.getRenderer().scene = threeScene;

// Load models
const modelLoader = new ModelLoader(threeScene);

async function loadModels() {
  try {
    await modelLoader.loadModel('/models/kenney_mini-forest_1.0/tree-high.glb', { scale: 2 });
    await modelLoader.loadModel('/models/kenney_mini-forest_1.0/tree.glb', {
      position: [5, 0, -3],
      rotation: [0, 45, 0],
      scale: 2,
    });
    await modelLoader.loadModel('/models/kenney_mini-forest_1.0/tree.glb', {
      position: [2, 0, -5],
      rotation: [0, 31, 0],
      scale: 2,
    });
    await modelLoader.loadModel('/models/kenney_mini-forest_1.0/tree.glb', {
      position: [6, 0, -7],
      rotation: [0, 56, 0],
      scale: 2,
    });
    await modelLoader.loadModel('/models/kenney_mini-forest_1.0/tree.glb', {
      position: [7, 0, -10],
      rotation: [0, 12, 0],
      scale: 2,
    });
    await modelLoader.loadModel('/models/kenney_mini-forest_1.0/tree.glb', {
      position: [15, 0, -15],
      rotation: [0, 21, 0],
      scale: 2,
    });
    await modelLoader.loadModel('/models/kenney_mini-forest_1.0/tree.glb', {
      position: [2, 0, -20],
      rotation: [0, 11, 0],
      scale: 2,
    });
    await modelLoader.loadModel('/models/kenney_mini-forest_1.0/tree.glb', {
      position: [-10, 0, -20],
      rotation: [0, 11, 0],
      scale: 2,
    });
    await modelLoader.loadModel('/models/kenney_mini-forest_1.0/tree.glb', {
      position: [-7, 0, -15],
      rotation: [0, 11, 0],
      scale: 2,
    });
    await modelLoader.loadModel('/models/kenney_mini-forest_1.0/tree.glb', {
      position: [-10, 0, -10],
      rotation: [0, 11, 0],
      scale: 2,
    });
    await modelLoader.loadModel('/models/kenney_mini-forest_1.0/tree.glb', {
      position: [-3, 0, -5],
      rotation: [0, 11, 0],
      scale: 2,
    });
  } catch (error) {
    DebugManager.error('ModelLoader', 'Failed to load models:', error);
  }
}

// Setup window resize
window.addEventListener('resize', () => {
  camera.onWindowResize();
  renderer.onWindowResize();
});

// Initialize game
const game = new Game(threeScene, camera.getCamera(), renderer.getRenderer(), player);

// Initialize application
async function init() {
  try {
    DebugManager.log('Main', 'Starting initialization...');
    
    // Load skybox first
    DebugManager.log('Main', 'Loading skybox...');
    await skyboxManager.loadSkybox('/skyboxes/skybox-day.png');
    DebugManager.log('Main', 'Skybox loaded successfully');
    
    // Apply preset to setup lights and skybox offset
    await new Promise(resolve => {
      setTimeout(() => {
        DebugManager.log('Main', 'Applying balanced preset...');
        guiManager.getLightingGUI().applyPreset('balanced');
        DebugManager.log('Main', 'Preset applied');
        resolve();
      }, 50);
    });
    
    // Load models
    DebugManager.log('Main', 'Loading models...');
    await loadModels();
    DebugManager.log('Main', 'Models loaded');
    
    // Start game
    DebugManager.log('Main', 'Starting game...');
    game.start();
    DebugManager.log('Main', 'Game started');
  } catch (error) {
    DebugManager.error('Main', 'Initialization failed:', error);
  }
}

// Start the application
DebugManager.log('Main', 'App initialization triggered');
init();
