import * as THREE from 'three';

import { Scene } from './core/Scene.js';
import { Camera } from './core/Camera.js';
import { Renderer } from './core/Renderer.js';
import { Player } from './core/Player.js';
import { Game } from './core/Game.js';
import { InputManager } from './input/InputManager.js';
import { PointerLock } from './input/PointerLock.js';
import { PlayCentreTest } from './environment/PlayCentreTest.js';
import { TestHUD } from './ui/TestHUD.js';
import { EYE_HEIGHT } from './utils/Constants.js';

// Keep the starter-kit camera, renderer, input, and movement systems;
// replace its outdoor demo contents with the first indoor test space.
const sceneContainer = new Scene();
const threeScene = sceneContainer.getScene();
threeScene.clear();
threeScene.background = new THREE.Color(0x12171b);
threeScene.fog = new THREE.Fog(0x12171b, 24, 52);

const camera = new Camera();
camera.getCamera().position.set(0, EYE_HEIGHT, 12);
camera.getCamera().lookAt(-4.5, EYE_HEIGHT, -4);

const renderer = new Renderer();
const webglRenderer = renderer.getRenderer();
webglRenderer.shadowMap.enabled = true;
webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
webglRenderer.toneMapping = THREE.ACESFilmicToneMapping;
webglRenderer.toneMappingExposure = 1.0;

const inputManager = new InputManager();
const pointerLock = new PointerLock(webglRenderer);
const player = new Player(camera.getCamera(), inputManager, pointerLock);
const hud = new TestHUD(pointerLock);
const environment = new PlayCentreTest(threeScene);
const game = new Game(threeScene, camera.getCamera(), webglRenderer, player, environment, hud);

document.addEventListener('keydown', (event) => {
  if (event.code === 'KeyE' && !event.repeat && pointerLock.isPointerLocked()) {
    event.preventDefault();
    const position = camera.getCamera().position;
    if (player.hidden) {
      environment.toggleHide(position, hud, player);
    } else if (environment.getNearbyInteractable(position)) {
      environment.interact(position, hud);
    } else if (!environment.toggleHide(position, hud, player)) {
      environment.interact(position, hud);
    }
  }

  if (event.code === 'KeyR' && environment.complete) {
    window.location.reload();
  }
});

async function init() {
  const bootStatus = document.getElementById('boot-status');
  try {
    if (bootStatus) bootStatus.textContent = 'Building the play-centre scene…';
    console.info('[Main] Building first play-centre test...');
    await environment.build();
    player.setCollisionBoxes(environment.getCollisionBoxes());
    game.start();
    if (bootStatus) bootStatus.remove();
    console.info('[Main] First test ready.');
  } catch (error) {
    console.error('[Main] Test environment failed to initialize:', error);
    if (bootStatus) bootStatus.textContent = `The test could not finish loading: ${error.message || error}`;
    hud.showMessage('The test area could not finish loading. Check the browser console.');
    game.start();
  }
}

init();
