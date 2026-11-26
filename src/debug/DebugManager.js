/**
 * First Person Starter Kit - Debug Manager
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 * 
 * Manages debug logging and console utilities
 */

export class DebugManager {
  static instance = null;
  static debugMode = false;

  static getInstance() {
    if (!DebugManager.instance) {
      DebugManager.instance = new DebugManager();
      DebugManager.setupGlobalCommands();
      DebugManager.showWelcomeMessage();
    }
    return DebugManager.instance;
  }

  static initialize(config) {
    DebugManager.debugMode = config.debug.enabled;
  }

  static setDebugMode(enabled) {
    DebugManager.debugMode = enabled;
    console.log(`[DebugManager] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
  }

  static isDebugMode() {
    return DebugManager.debugMode;
  }

  static log(source, message, data = null) {
    if (DebugManager.debugMode) {
      if (data !== null) {
        console.log(`[${source}] ${message}`, data);
      } else {
        console.log(`[${source}] ${message}`);
      }
    }
  }

  static warn(source, message, data = null) {
    // Warnings always show
    if (data !== null) {
      console.warn(`[${source}] ${message}`, data);
    } else {
      console.warn(`[${source}] ${message}`);
    }
  }

  static error(source, message, data = null) {
    // Errors always show
    if (data !== null) {
      console.error(`[${source}] ${message}`, data);
    } else {
      console.error(`[${source}] ${message}`);
    }
  }

  static showWelcomeMessage() {
    const copyright = `
    ┌────────────────────────────────────────────────────────────┐
    │ First Person Starter Kit                                   │
    │ Copyright (c) 2026 Augusto Polonio                         │
    │ Licensed under MIT License                                 │
    │ https://github.com/augustopolonio/first-person-starter-kit │
    └────────────────────────────────────────────────────────────┘
    `;

    const asciiArt = `
    ╔══════════════════════════════╗
    ║   FIRST PERSON STARTER KIT   ║
    ║   Three.js | Vite | WebGL    ║
    ╚══════════════════════════════╝
    `;

    const intro = `
    Intro
    ─────────────────────────────────────
    Welcome to the First Person Starter Kit for Three.js!
    
    An interactive 3D experience built with Three.js.
    Explore the environment, change lighting presets,
    and discover dynamic time-of-day effects.
    `;

    const controls = `
    Controls
    ─────────────────────────────────────
    W / ↑         Move Forward
    A / ←         Move Left
    S / ↓         Move Backward
    D / →         Move Right
    SPACE         Jump
    SHIFT         Sprint
    `;

    const features = `
    Features
    ─────────────────────────────────────
    • Dynamic Lighting System
    • Time of Day Presets
    • 3D Model Loading
    • Skybox Management
    • Settings GUI
    • Pointer Lock Controls
    `;

    const socials = `
    Socials & Links
    ─────────────────────────────────────
    Ko-fi (Support)   ⟹ https://ko-fi.com/augustopolonio
    GitHub (Project)  ⟹ https://github.com/augustopolonio/first-person-starter-kit
    GitHub (Profile)  ⟹ https://github.com/augustopolonio
    Twitter/X         ⟹ https://x.com/augustopolonio
    LinkedIn          ⟹ https://www.linkedin.com/in/augustopolonio/
    Linktree          ⟹ https://linktree.com/augustopolonio
    `;

    const debug = `
    Debug
    ─────────────────────────────────────
    🔧 Edit src/config.js to enable debug.enabled
    💻 Use debug.on/off/toggle in console anytime
    `;

    const credits = `
    Credits & Resources
    ─────────────────────────────────────
    • Three.js        ⟹ 3D JavaScript library
    • Vite            ⟹ Frontend build tool
    • Kenney Assets   ⟹ 3D Models and Skyboxes
    • lil-gui         ⟹ UI Controller library
    `;

    console.log('%c' + copyright, 'color: #64b8ff; font-family: monospace; font-size: 11px; font-weight: bold;');
    console.log('%c' + asciiArt, 'color: #00ff88; font-family: monospace; font-weight: bold; font-size: 12px;');
    console.log('%c' + intro, 'color: #ffaa00; font-family: monospace; font-size: 11px;');
    console.log('%c' + controls, 'color: #00ccff; font-family: monospace; font-size: 11px;');
    console.log('%c' + features, 'color: #ffaa00; font-family: monospace; font-size: 11px;');
    console.log('%c' + socials, 'color: #ff6688; font-family: monospace; font-size: 11px;');
    console.log('%c' + debug, 'color: #ff6688; font-family: monospace; font-size: 11px;');
    console.log('%c' + credits, 'color: #00ff88; font-family: monospace; font-size: 11px;');
  }

  static setupGlobalCommands() {
    // Make debug commands available globally in console
    window.debug = {
      on: () => DebugManager.setDebugMode(true),
      off: () => DebugManager.setDebugMode(false),
      toggle: () => DebugManager.setDebugMode(!DebugManager.debugMode),
      status: () => console.log(`Debug mode is ${DebugManager.debugMode ? 'ON' : 'OFF'}`),
    };
  }
}
