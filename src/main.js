import * as THREE from 'three';
import {Camera} from './core/Camera.js';
import {Renderer} from './core/Renderer.js';
import {Player} from './core/Player.js';
import {Game} from './core/Game.js';
import {InputManager} from './input/InputManager.js';
import {PointerLock} from './input/PointerLock.js';
import {ArchadeClassroom} from './environment/ArchadeClassroom.js';
import {TestHUD} from './ui/TestHUD.js';
import {EYE_HEIGHT} from './utils/Constants.js';

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x12171b);
scene.fog=new THREE.Fog(0x12171b,48,105);
const camera=new Camera(),renderer=new Renderer();
const webglRenderer=renderer.getRenderer();
webglRenderer.shadowMap.enabled=false;
webglRenderer.toneMapping=THREE.ACESFilmicToneMapping;
webglRenderer.toneMappingExposure=1;
const input=new InputManager(),pointerLock=new PointerLock(webglRenderer);
const player=new Player(camera.getCamera(),input,pointerLock),hud=new TestHUD(pointerLock);
const environment=new ArchadeClassroom(scene);
const game=new Game(scene,camera.getCamera(),webglRenderer,player,environment,hud);

document.addEventListener('keydown',event=>{
  if(event.code==='KeyE'&&!event.repeat&&pointerLock.isPointerLocked()) {
    event.preventDefault();const pos=camera.getCamera().position;
    if(player.hidden)environment.toggleHide(pos,hud,player);
    else if(environment.getNearbyInteractable(pos))environment.interact(pos,hud);
    else if(!environment.toggleHide(pos,hud,player))environment.interact(pos,hud);
  }
  if(event.code==='KeyR'&&environment.complete)window.location.reload();
});
async function init() {
  const status=document.getElementById('boot-status');
  try {
    if(status)status.textContent='Loading the Archade classroom…';
    await environment.build();
    const start=environment.getPlayerStart();player.setCollisionBoxes(environment.getCollisionBoxes());
    if(player.isBlocked(start.x,start.z))throw new Error('Player spawn failed collision QA.');
    const probe=environment.getCollisionProbe();
    if(!probe||!player.isBlocked(probe.x,probe.z))throw new Error('Player collision grid failed blocker test.');
    camera.getCamera().position.copy(start);camera.getCamera().lookAt(start.x,EYE_HEIGHT,0);
    game.start();if(status)status.remove();
    console.info('[Main] Standalone Archade classroom ready.');
  } catch(error) {
    console.error('[Main] Classroom initialization failed:',error);
    if(status)status.textContent='The classroom could not finish loading: '+(error.message||error);
    hud.showMessage('The classroom could not finish loading. Check the browser console.');
  }
}
init();
