import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {Attendant} from '../characters/Attendant.js';
import {EYE_HEIGHT} from '../utils/Constants.js';

const ROOM_XZ_SCALE=4.0; // Four times the original floor width and depth; props retain their original vertical height. // Turn the imported classroom into a large shared hall without changing ceiling height.
const MODEL=`${import.meta.env.BASE_URL}assets/environment/archade/classroom.glb`;
const COLLISION=`${import.meta.env.BASE_URL}assets/environment/archade/collision.json`;
const COLORS=[0x61c4d7,0xdca759,0x88c978];
const SWITCH_NAMES=['blue','amber','green'];

export class ArchadeClassroom {
  constructor(scene) {
    this.scene=scene;this.loader=new GLTFLoader();this.loader.setMeshoptDecoder(MeshoptDecoder);
    this.collisionBoxes=[];this.playerStart=new THREE.Vector3(0,EYE_HEIGHT,0);
    this.interactables=[];this.hideSpots=[];this.hiddenSpot=null;this.hideReturnPosition=null;
    this.relayCount=0;this.panelSwitches=[];this.clueLamps=[];this.panelIndicator=null;this.exitMarker=null;
    this.attendant=null;this.puzzleOrder=[2,0,1];this.puzzleProgress=0;this.exitUnlocked=false;
    this.complete=false;this.caught=false;this.noiseCooldown=0;this.clueTime=0;
  }
  async build() {
    const [response,gltf]=await Promise.all([fetch(COLLISION,{cache:'force-cache'}),this.loader.loadAsync(MODEL)]);
    if(!response.ok)throw new Error('Collision request failed: HTTP '+response.status);
    const data=await response.json();this.validate(data,gltf.scene);
    this.expandRoomLayout(data);
    const model=gltf.scene,o=data.modelOffset;
    model.name='Archade preschool classroom — expanded hall';
    model.position.set(o.x*ROOM_XZ_SCALE,o.y,o.z*ROOM_XZ_SCALE);
    model.scale.set(ROOM_XZ_SCALE,1,ROOM_XZ_SCALE);
    model.updateMatrixWorld(true);
    model.traverse(object=>{
      if(!object.isMesh)return;
      object.castShadow=false;object.receiveShadow=false;object.frustumCulled=true;
      const mats=Array.isArray(object.material)?object.material:[object.material];
      for(const mat of mats)if(mat)for(const key of ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap']) {
        const tex=mat[key];if(tex)tex.anisotropy=Math.min(tex.anisotropy||1,2);
      }
    });
    this.scene.add(model);this.collisionBoxes=data.boxes.map(b=>({...b}));
    this.collisionProbe={...data.qaProbe};this.points=data.points;
    this.playerStart.set(data.spawn.x,EYE_HEIGHT,data.spawn.z);
    this.buildLighting();this.buildExitMarker();this.buildPanel();this.buildRelays();
    this.hideSpots=this.points.hideSpots.slice(0,2).map(p=>({...p,radius:1.55}));
    await this.buildAttendant();
    console.info('[ArchadeClassroom] Standalone classroom loaded.',{
      dimensions:data.sourceBounds.size.map((v,i)=>Number((v*(i===1?1:ROOM_XZ_SCALE)).toFixed(2))),
      roomScale:`${ROOM_XZ_SCALE}x across the floor`,colliders:this.collisionBoxes.length
    });
    return this;
  }
  expandRoomLayout(data) {
    const scale=ROOM_XZ_SCALE;
    const scalePoint=point=>{point.x*=scale;point.z*=scale;};
    // The model is widened in X/Z only. Move every gameplay coordinate and
    // collision bound by the same amount so movement, patrols and objectives
    // stay aligned with the expanded architecture. Character and ceiling
    // heights remain human-scale.
    for(const box of data.boxes) {
      box.minX*=scale;box.maxX*=scale;box.minZ*=scale;box.maxZ*=scale;
    }
    scalePoint(data.spawn);
    scalePoint(data.qaProbe);
    for(const point of data.points.relaySpawns)scalePoint(point);
    for(const point of data.points.hideSpots)scalePoint(point);
    scalePoint(data.points.panelPosition);
  }
  validate(data,model) {
    const size=data?.sourceBounds?.size,o=data?.modelOffset,p=data?.points;
    if(data?.version!==1||data.units!=='metres'||!Array.isArray(size)||size.length!==3||
       !size.every(v=>Number.isFinite(v)&&v>0.1)||![o?.x,o?.y,o?.z].every(Number.isFinite)||
       !Array.isArray(data.boxes)||data.boxes.length<10||!data.spawn||
       ![data.spawn.x,data.spawn.z].every(Number.isFinite)||!data.qaProbe||
       ![data.qaProbe.x,data.qaProbe.z].every(Number.isFinite)||!p||
       !Array.isArray(p.relaySpawns)||p.relaySpawns.length<3||!Array.isArray(p.hideSpots)||p.hideSpots.length<2||
       !p.panelPosition||![p.panelPosition.x,p.panelPosition.z].every(Number.isFinite))throw new Error('Collision data incomplete.');
    if(Math.abs(data.playerRadius-0.32)>0.001)throw new Error('Player collision radius mismatch.');
    for(const b of data.boxes)if(![b.minX,b.maxX,b.minZ,b.maxZ].every(Number.isFinite)||b.minX>=b.maxX||b.minZ>=b.maxZ)throw new Error('Invalid AABB.');
    const raw=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    if(Math.abs(raw.x-size[0])>0.12||Math.abs(raw.y-size[1])>0.12||Math.abs(raw.z-size[2])>0.12)throw new Error('Model/collision dimensions differ.');
    const blocked=(x,z)=>data.boxes.some(b=>x+data.playerRadius>b.minX&&x-data.playerRadius<b.maxX&&z+data.playerRadius>b.minZ&&z-data.playerRadius<b.maxZ);
    const safe=[data.spawn,p.panelPosition,...p.relaySpawns.slice(0,3),...p.hideSpots.slice(0,2)];
    if(safe.some(q=>blocked(q.x,q.z))||!blocked(data.qaProbe.x,data.qaProbe.z))throw new Error('Collision QA failed.');
  }
  buildLighting() {
    this.scene.add(new THREE.HemisphereLight(0xd7e0e5,0x26232b,1.05),new THREE.AmbientLight(0x9ca8b3,0.22));
    const sun=new THREE.DirectionalLight(0xe2e6e8,0.48);sun.position.set(-4,8,5);sun.castShadow=false;this.scene.add(sun);
  }
  makeSign(lines) {
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable.');
    ctx.fillStyle='#242a2d';ctx.fillRect(0,0,512,256);ctx.strokeStyle='#9d8965';ctx.lineWidth=8;ctx.strokeRect(8,8,496,240);
    ctx.fillStyle='#eee7d8';ctx.textAlign='center';ctx.textBaseline='middle';
    lines.forEach((line,i)=>{ctx.font=i===0?'bold 38px Arial':'25px Arial';ctx.fillText(line,256,94+i*54,450);});
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;return tex;
  }
  buildExitMarker() {
    this.exitMarker=new THREE.Mesh(new THREE.RingGeometry(0.58,0.72,28),new THREE.MeshBasicMaterial({color:0xa94b42,side:THREE.DoubleSide}));
    this.exitMarker.rotation.x=-Math.PI/2;this.exitMarker.position.set(this.playerStart.x,0.035,this.playerStart.z);
    this.scene.add(this.exitMarker);
    this.interactables.push({id:'exit',label:'Use the entrance exit',x:this.playerStart.x,z:this.playerStart.z,radius:1.8,mesh:this.exitMarker});
  }
  buildPanel() {
    const p=this.points.panelPosition;
    const base=new THREE.Mesh(new THREE.BoxGeometry(1,1.25,0.62),new THREE.MeshStandardMaterial({color:0x343b3e,roughness:0.88,metalness:0.12}));
    base.position.set(p.x,0.625,p.z);this.scene.add(base);
    this.collisionBoxes.push({minX:p.x-0.5,maxX:p.x+0.5,minZ:p.z-0.31,maxZ:p.z+0.31});
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.25,0.62),new THREE.MeshBasicMaterial({map:this.makeSign(['MAINTENANCE PANEL','RESTORE POWER TO OPEN THE EXIT']),side:THREE.DoubleSide}));
    sign.position.set(p.x,1.76,p.z-0.325);this.scene.add(sign);
    this.interactables.push({id:'note',label:'Read the maintenance panel',x:p.x,z:p.z-1.25,radius:1.15,mesh:sign});
    this.panelIndicator=new THREE.Mesh(new THREE.SphereGeometry(0.09,10,8),new THREE.MeshBasicMaterial({color:0xa8322b}));
    this.panelIndicator.position.set(p.x,1.18,p.z+0.34);this.scene.add(this.panelIndicator);
    for(let i=0;i<3;i++) {
      const x=p.x+(i-1)*0.38;
      const button=new THREE.Mesh(new THREE.BoxGeometry(0.25,0.18,0.12),new THREE.MeshBasicMaterial({color:0x343b3e}));
      button.position.set(x,1,p.z+0.37);this.scene.add(button);this.panelSwitches.push(button);
      this.interactables.push({id:'switch-'+i,label:'Use '+SWITCH_NAMES[i]+' switch',x,z:p.z+0.88,radius:1.05,mesh:button});
      const globe=new THREE.Mesh(new THREE.SphereGeometry(0.12,10,8),new THREE.MeshBasicMaterial({color:0x343b3e}));
      globe.position.set(x,2.22,p.z+0.02);this.scene.add(globe);this.clueLamps.push({globe,color:COLORS[i]});
    }
  }
  buildRelays() {
    this.points.relaySpawns.slice(0,3).forEach((p,i)=>{
      const mesh=new THREE.Mesh(new THREE.OctahedronGeometry(0.23,0),new THREE.MeshBasicMaterial({color:COLORS[i]}));
      mesh.position.set(p.x,0.58,p.z);this.scene.add(mesh);
      this.interactables.push({id:'relay-'+i,label:'Collect power relay',x:p.x,z:p.z,radius:1.55,mesh});
    });
  }
  async buildAttendant() {
    const points=[this.points.relaySpawns[0],this.points.panelPosition,this.points.relaySpawns[1],this.points.hideSpots[0],this.points.relaySpawns[2],this.points.hideSpots[1],{x:this.playerStart.x,z:this.playerStart.z}];
    this.attendant=new Attendant(this.scene,{patrolPoints:points,collisionBoxes:this.collisionBoxes,onCaught:()=>{this.caught=true;}});
    await this.attendant.ready;
  }
  getCollisionBoxes(){return this.collisionBoxes;}
  getPlayerStart(){return this.playerStart.clone();}
  getCollisionProbe(){return {...this.collisionProbe};}
  getNearbyHideSpot(pos) {
    if(this.hiddenSpot)return this.hiddenSpot;
    for(const p of this.hideSpots){const dx=pos.x-p.x,dz=pos.z-p.z;if(dx*dx+dz*dz<=p.radius*p.radius)return p;}
    return null;
  }
  toggleHide(pos,hud,player) {
    if(this.hiddenSpot) {
      this.hiddenSpot=null;player.setHidden(false);
      if(this.hideReturnPosition)player.camera.position.copy(this.hideReturnPosition);
      player.camera.position.y=EYE_HEIGHT;this.hideReturnPosition=null;hud.showMessage('You leave the hiding place.');return true;
    }
    const spot=this.getNearbyHideSpot(pos);if(!spot)return false;
    const seen=Boolean(this.attendant&&(this.attendant.playerVisible||this.attendant.canSeePlayer(pos)));
    this.hiddenSpot=spot;this.hideReturnPosition=player.camera.position.clone();
    player.setHidden(true);player.camera.position.set(spot.x,EYE_HEIGHT,spot.z);
    if(seen)this.attendant.rememberHiddenPosition(spot);
    hud.showMessage('Hidden in the '+spot.name+'.');return true;
  }
  getNearbyInteractable(pos) {
    let best=null,bestD=Infinity;
    for(const item of this.interactables) {
      if(item.mesh&&!item.mesh.parent)continue;
      const dx=pos.x-item.x,dz=pos.z-item.z,d2=dx*dx+dz*dz;
      if(d2<=item.radius*item.radius&&d2<bestD){best=item;bestD=d2;}
    }
    return best;
  }
  interact(pos,hud) {
    const item=this.getNearbyInteractable(pos);
    if(!item){hud.showMessage('Nothing nearby to interact with.');return;}
    if(item.id==='note'){hud.setObjective('Find the three power relays, then follow the light sequence at the maintenance panel.');hud.showMessage('The maintenance panel shows the relay and switch instructions.');return;}
    if(item.id.startsWith('relay-')) {
      if(!item.mesh||!item.mesh.parent)return;
      this.scene.remove(item.mesh);item.mesh.geometry.dispose();item.mesh.material.dispose();item.mesh=null;
      this.interactables=this.interactables.filter(x=>x!==item);this.relayCount++;
      hud.setObjective(this.relayCount<3?'Find the remaining power relays ('+this.relayCount+'/3).':'Repeat the light sequence at the maintenance panel.');
      hud.showMessage('Relay collected ('+this.relayCount+'/3).');return;
    }
    if(item.id.startsWith('switch-')) {
      if(this.relayCount<3){hud.showMessage('The panel needs all three relays.');return;}
      if(this.exitUnlocked)return;
      const i=Number(item.id.slice('switch-'.length)),button=this.panelSwitches[i];
      if(i===this.puzzleOrder[this.puzzleProgress]) {
        button.material.color.setHex(COLORS[i]);this.puzzleProgress++;
        if(this.puzzleProgress===3) {
          this.exitUnlocked=true;this.panelIndicator.material.color.setHex(0x62d88a);this.exitMarker.material.color.setHex(0x62d88a);
          hud.setObjective('Power restored. Return to the entrance exit.');hud.showMessage('Power restored. The entrance is unlocked.');
        } else hud.showMessage('Switch set.');
      } else {
        this.puzzleProgress=0;this.panelSwitches.forEach(x=>x.material.color.setHex(0x343b3e));
        this.attendant.reportNoise(pos,18);hud.showMessage('Wrong sequence. The panel resets.');
      }
      return;
    }
    if(item.id==='exit') {
      if(!this.exitUnlocked){hud.showMessage('The entrance is locked. Restore power at the maintenance panel.');return;}
      this.complete=true;hud.setObjective('You escaped.');hud.setHint('Press R to restart.');hud.showMessage('The entrance opens. You made it out.');
    }
  }
  update(delta,player,hud) {
    const dt=Math.min(delta,0.05);this.clueTime+=dt;
    const cycle=this.clueTime%3.6,active=cycle<2.7?Math.floor(cycle/0.9):-1;
    this.clueLamps.forEach((lamp,i)=>lamp.globe.material.color.setHex(i===active?lamp.color:0x343b3e));
    if(!player)return;
    const pos=player.camera.position;this.noiseCooldown=Math.max(0,this.noiseCooldown-dt);
    const keys=player.inputManager.getKeys();
    if(player.pointerLock.isPointerLocked()&&!player.hidden&&keys.sprint&&player.inputManager.isMoving()&&this.noiseCooldown===0) {
      this.attendant.reportNoise(pos,9);this.noiseCooldown=1.4;
    }
    if(!this.complete&&player.pointerLock.isPointerLocked())this.attendant.update(dt,pos,player.hidden);
    if(this.caught) {
      this.caught=false;this.hiddenSpot=null;this.hideReturnPosition=null;player.setHidden(false);
      player.camera.position.copy(this.playerStart);player.camera.lookAt(this.playerStart.x,EYE_HEIGHT,0);
      this.attendant.reset({x:this.playerStart.x,z:this.playerStart.z});
      hud?.showMessage('The attendant found you. You return to the entrance.');
    }
    if(!hud)return;
    if(this.complete)hud.setHint('Press R to restart.');
    else if(player.hidden)hud.setHint('E  —  Leave hiding place');
    else {
      const target=this.getNearbyInteractable(pos),spot=this.getNearbyHideSpot(pos);
      hud.setHint(spot?'E  —  Hide in the '+spot.name:target?'E  —  '+target.label:'');
    }
  }
}
