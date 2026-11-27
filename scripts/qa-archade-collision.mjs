#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'public/assets/environment/archade/collision.json');
assert.ok(fs.existsSync(file),'precomputed Archade collision file must exist');
const collision=JSON.parse(fs.readFileSync(file,'utf8'));
function pointBlocked(point) {
  return collision.boxes.some(box =>
    point.x+collision.playerRadius>box.minX && point.x-collision.playerRadius<box.maxX &&
    point.z+collision.playerRadius>box.minZ && point.z-collision.playerRadius<box.maxZ
  );
}
assert.equal(collision.version,1);
assert.equal(collision.units,'metres');
assert.ok(collision.boxes.length>=10);
assert.ok(collision.stats.occupiedCells>=100);
assert.ok(collision.stats.walkableFloorCells>=100);
assert.equal(collision.stats.spawnClear,true);
assert.equal(collision.stats.blockingProbePassed,true);
assert.ok(collision.points.relaySpawns.length>=3);
assert.ok(collision.points.hideSpots.length>=2);
assert.ok(collision.points.panelPosition);
assert.equal(pointBlocked(collision.points.panelPosition),false,'maintenance panel point must be walkable');
globalThis.document ??= {addEventListener(){}};
const THREE=await import('three');
const {Player}=await import('../src/core/Player.js');
const player=new Player(new THREE.PerspectiveCamera(),{},{});
player.setCollisionBoxes(collision.boxes);
assert.equal(player.isBlocked(collision.spawn.x,collision.spawn.z),false,'runtime Player must allow the generated spawn');
assert.equal(player.isBlocked(collision.qaProbe.x,collision.qaProbe.z),true,'runtime Player must block the collision probe');
for(const point of collision.points.relaySpawns) assert.equal(player.isBlocked(point.x,point.z),false,'relay must be walkable');
for(const point of collision.points.hideSpots) assert.equal(player.isBlocked(point.x,point.z),false,'hide spot must be walkable');
console.info('[Archade collision QA] PASS');
console.info('  Collision AABBs:',collision.boxes.length);
console.info('  Occupied cells:',collision.stats.occupiedCells);
console.info('  Walkable floor cells:',collision.stats.walkableFloorCells);
console.info('  Player spawn and blocker probe: PASS');
console.info('  Relay, hiding and panel positions: PASS');
const modelPath=path.join(root,'public/assets/environment/archade/classroom.glb');
const model=fs.readFileSync(modelPath);
assert.equal(model.toString('ascii',0,4),'glTF');
const view=new DataView(model.buffer,model.byteOffset,model.byteLength);
const jsonLength=view.getUint32(12,true);
const gltf=JSON.parse(model.toString('utf8',20,20+jsonLength).replace(/[\\u0000 ]+$/g,''));
const indices=new Set();
for(const mesh of gltf.meshes??[])for(const primitive of mesh.primitives??[])if(primitive.indices!==undefined)indices.add(primitive.indices);
const triangles=[...indices].reduce((sum,index)=>sum+Math.floor((gltf.accessors?.[index]?.count??0)/3),0);
assert.ok(triangles>0&&triangles<=950000,'runtime model must stay below 950k triangles');
assert.ok(model.length<=30*1024*1024,'runtime model must stay below 30 MiB');
console.info('  Runtime model budget: PASS ('+triangles.toLocaleString()+' triangles, '+(model.length/1048576).toFixed(1)+' MiB)');
