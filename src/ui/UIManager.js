/**
 * First Person Starter Kit - UI Manager
 * Copyright (c) 2026 Augusto Polonio
 * Licensed under MIT License
 * 
 * Manages the user interface including bottom bar, social menu, and preset controls
 */

export class UIManager {
  constructor(guiManager) {
    this.guiManager = guiManager;
    this.initialize();
  }

  initialize() {
    this.createStyles();
    this.createBottomBar();
    this.attachEventListeners();
  }

  createStyles() {
    const style = document.createElement('style');
    style.textContent = `
      * {
        box-sizing: border-box;
      }

      .ui-bottom-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 60px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 20px;
        z-index: 100;
        font-family: 'Courier New', monospace;
        box-shadow: rgba(0, 0, 0, 0.35) 0px -50px 36px -28px inset;
      }

      .ui-bottom-bar-left {
        display: flex;
        gap: 20px;
        align-items: center;
        position: relative;
      }

      .ui-social-menu-toggle {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ui-social-menu-button {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        width: 40px;
        height: 40px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        padding: 0;
      }

      .ui-social-menu-button:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
        transform: scale(1.05);
      }

      .ui-social-menu-button:active {
        transform: scale(0.95);
      }

      .ui-social-menu-button svg {
        width: 20px;
        height: 20px;
      }

      .ui-social-menu {
        position: absolute;
        bottom: 50px;
        left: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px 0;
        opacity: 0;
        pointer-events: none;
        transform: translateY(10px);
        transition: all 0.3s ease;
        z-index: 101;
      }

      .ui-social-menu.active {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
      }

      .ui-social-menu-item {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        width: 40px;
        height: 40px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        padding: 0;
      }

      .ui-social-menu-item:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
        transform: scale(1.05);
      }

      .ui-social-menu-item:active {
        transform: scale(0.95);
      }

      .ui-social-menu-item svg {
        width: 20px;
        height: 20px;
      }

      .ui-bottom-bar-center {
        position: absolute;
        left: 50%;
        bottom: 0;
        transform: translateX(-50%);
        display: flex;
        align-items: flex-end;
        padding: 0 20px 8px;
      }

      .ui-preset-container {
        display: flex;
        gap: 12px;
        align-items: flex-end;
        padding: 8px 16px;
        border-radius: 12px 12px 0 0;
        transition: transform 0.3s ease;
        transform: translateY(40px);
      }

      .ui-bottom-bar-center:hover .ui-preset-container {
        transform: translateY(0);
      }

      .ui-bottom-bar-right {
        display: flex;
        gap: 15px;
        align-items: center;
      }

      .ui-button {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        width: 40px;
        height: 40px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        padding: 0;
      }

      .ui-button:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
        transform: scale(1.05);
      }

      .ui-button:active {
        transform: scale(0.95);
      }

      .ui-button svg {
        width: 20px;
        height: 20px;
      }

      .ui-preset-button {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #fff;
        padding: 10px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        font-family: 'Courier New', monospace;
        width: 70px;
      }

      .ui-preset-button svg {
        width: 24px;
        height: 24px;
      }

      .ui-preset-button-label {
        font-size: 10px;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .ui-preset-button:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
      }

      .ui-preset-button.active {
        background: rgba(100, 200, 255, 0.2);
        border-color: rgba(100, 200, 255, 0.6);
      }

      #blocker {
        display: none;
      }
    `;
    document.head.appendChild(style);
  }

  getSvgString(icon) {
    const svgMap = {
      clock: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock-icon lucide-clock"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
      'cloud-sun': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-sun-icon lucide-cloud-sun"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></svg>`,
      settings: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings-icon lucide-settings"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg>`,
      sun: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun-icon lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
      sunrise: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sunrise-icon lucide-sunrise"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>`,
      cloud: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 0 0 9 20h9a7 7 0 0 0 0-14z"></path></svg>`,
      sunset: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sunset-icon lucide-sunset"><path d="M12 10V2"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m16 6-4 4-4-4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>`,
      moon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
      twitter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="rgb(251, 251, 251)" d="M357.2 48L427.8 48 273.6 224.2 455 464 313 464 201.7 318.6 74.5 464 3.8 464 168.7 275.5-5.2 48 140.4 48 240.9 180.9 357.2 48zM332.4 421.8l39.1 0-252.4-333.8-42 0 255.3 333.8z"/></svg>`,
      linkedin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="rgb(255, 255, 255)" d="M100.3 448l-92.9 0 0-299.1 92.9 0 0 299.1zM53.8 108.1C24.1 108.1 0 83.5 0 53.8 0 39.5 5.7 25.9 15.8 15.8s23.8-15.8 38-15.8 27.9 5.7 38 15.8 15.8 23.8 15.8 38c0 29.7-24.1 54.3-53.8 54.3zM447.9 448l-92.7 0 0-145.6c0-34.7-.7-79.2-48.3-79.2-48.3 0-55.7 37.7-55.7 76.7l0 148.1-92.8 0 0-299.1 89.1 0 0 40.8 1.3 0c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3l0 164.3-.1 0z"/></svg>`,
      linktree: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="rgb(255, 255, 255)" d="M16 173.4l125.8 0-89.4-85.4 49.5-51 85.2 87.8 0-124.8 73.9 0 0 124.8 85.2-87.6 49.4 50.8-89.4 85.2 125.7 0 0 70.5-126.4 0 90 87.6-49.3 49.8-122.2-123-122.2 123-49.5-49.6 90-87.6-126.4 0 0-70.5zM186.9 344.8l73.9 0 0 167.2-73.9 0 0-167.2z"/></svg>`,
      github: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="rgb(255, 255, 255)" d="M216.5 362.5c-66-8-112.5-55.5-112.5-117 0-25 9-52 24-70-6.5-16.5-5.5-51.5 2-66 20-2.5 47 8 63 22.5 19-6 39-9 63.5-9s44.5 3 62.5 8.5c15.5-14 43-24.5 63-22 7 13.5 8 48.5 1.5 65.5 16 19 24.5 44.5 24.5 70.5 0 61.5-46.5 108-113.5 116.5 17 11 28.5 35 28.5 62.5l0 52C323 491.5 335.5 500 350.5 494 441 459.5 512 369 512 257 512 115.5 397 0 255.5 0S0 115.5 0 257c0 111 70.5 203 165.5 237.5 13.5 5 26.5-4 26.5-17.5l0-40c-7 3-16 5-24 5-33 0-52.5-18-66.5-51.5-5.5-13.5-11.5-21.5-23-23-6-.5-8-3-8-6 0-6 10-10.5 20-10.5 14.5 0 27 9 40 27.5 10 14.5 20.5 21 33 21s20.5-4.5 32-16c8.5-8.5 15-16 21-21z"/></svg>`,
      heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgb(255, 105, 180)" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
      menu: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu-icon lucide-menu"><path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/></svg>`
    };
    return svgMap[icon] || '';
  }

  createBottomBar() {
    const bottomBar = document.createElement('div');
    bottomBar.className = 'ui-bottom-bar';
    bottomBar.id = 'ui-bottom-bar';

    // Left side - Social menu toggle
    const left = document.createElement('div');
    left.className = 'ui-bottom-bar-left';

    const socialMenuToggle = document.createElement('div');
    socialMenuToggle.className = 'ui-social-menu-toggle';

    const socialMenuButton = document.createElement('button');
    socialMenuButton.className = 'ui-social-menu-button';
    socialMenuButton.id = 'social-menu-toggle-btn';
    socialMenuButton.title = 'Social Networks';
    socialMenuButton.innerHTML = this.getSvgString('menu');

    const socialMenu = document.createElement('div');
    socialMenu.className = 'ui-social-menu';
    socialMenu.id = 'social-menu';

    const socialLinks = [
      { icon: 'heart', title: 'Support on Ko-fi', url: 'https://ko-fi.com/augustopolonio' },
      { icon: 'twitter', title: 'Twitter/X', url: 'https://x.com/augustopolonio' },
      { icon: 'linkedin', title: 'LinkedIn', url: 'https://www.linkedin.com/in/augustopolonio/' },
      { icon: 'linktree', title: 'Linktree', url: 'https://linktree.com/augustopolonio' },
      { icon: 'github', title: 'Github', url: 'https://github.com/augustopolonio/first-person-starter-kit' },
    ];

    socialLinks.forEach((link) => {
      const btn = document.createElement('button');
      btn.className = 'ui-social-menu-item';
      btn.title = link.title;
      btn.innerHTML = this.getSvgString(link.icon);
      btn.onclick = () => window.open(link.url, '_blank');
      socialMenu.appendChild(btn);
    });

    socialMenuToggle.appendChild(socialMenuButton);
    socialMenuToggle.appendChild(socialMenu);
    left.appendChild(socialMenuToggle);

    // Center - Preset buttons
    const center = document.createElement('div');
    center.className = 'ui-bottom-bar-center';

    const presetContainer = document.createElement('div');
    presetContainer.className = 'ui-preset-container';
    presetContainer.id = 'preset-container';

    const presets = [
      { name: 'balanced', label: 'Balanced', icon: 'cloud-sun' },
      { name: 'morning', label: 'Morning', icon: 'sunrise' },
      { name: 'noon', label: 'Noon', icon: 'sun' },
      { name: 'sunset', label: 'Sunset', icon: 'sunset' },
      { name: 'night', label: 'Night', icon: 'moon' },
    ];

    presets.forEach((preset) => {
      const btn = document.createElement('button');
      btn.className = 'ui-preset-button';
      btn.dataset.preset = preset.name;
      if (preset.name === 'balanced') {
        btn.classList.add('active');
      }
      btn.onclick = () => this.selectPreset(preset.name);

      const iconDiv = document.createElement('div');
      iconDiv.innerHTML = this.getSvgString(preset.icon);

      const labelDiv = document.createElement('div');
      labelDiv.className = 'ui-preset-button-label';
      labelDiv.textContent = preset.label;

      btn.appendChild(iconDiv);
      btn.appendChild(labelDiv);
      presetContainer.appendChild(btn);
    });

    center.appendChild(presetContainer);

    // Right side - Social + Settings
    const right = document.createElement('div');
    right.className = 'ui-bottom-bar-right';

    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'ui-button';
    settingsBtn.id = 'settings-btn';
    settingsBtn.title = 'Settings';
    settingsBtn.innerHTML = this.getSvgString('settings');

    right.appendChild(settingsBtn);

    bottomBar.appendChild(left);
    bottomBar.appendChild(center);
    bottomBar.appendChild(right);

    document.body.insertBefore(bottomBar, document.body.firstChild);
  }

  attachEventListeners() {
    const settingsBtn = document.getElementById('settings-btn');
    const socialMenuToggleBtn = document.getElementById('social-menu-toggle-btn');
    const socialMenu = document.getElementById('social-menu');

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        const gui = document.querySelector('.lil-gui');
        if (gui) {
          gui.style.display = gui.style.display === 'none' ? 'block' : 'none';
        }
      });
    }

    if (socialMenuToggleBtn) {
      socialMenuToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        socialMenu.classList.toggle('active');
      });
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (socialMenu && !socialMenu.contains(e.target) && e.target !== socialMenuToggleBtn) {
        socialMenu.classList.remove('active');
      }
    });
  }

  selectPreset(presetName) {
    this.guiManager.getLightingGUI().applyPreset(presetName);

    // Update button states
    const buttons = document.querySelectorAll('.ui-preset-button');
    buttons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.preset === presetName);
    });
  }
}
