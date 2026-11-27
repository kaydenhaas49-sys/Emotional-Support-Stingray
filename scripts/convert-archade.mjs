#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const optional = process.argv.includes('--optional');
const force = process.argv.includes('--force');
const inputPath = path.resolve(projectRoot, 'source-assets/archade/archade-classroom.skp');
const outputPath = path.resolve(projectRoot, 'public/assets/environment/archade/classroom.glb');
const collisionPath = path.resolve(projectRoot, 'public/assets/environment/archade/collision.json');
const cellSize = 0.35;
const playerRadius = 0.32;
const playerBodyHeight = 1.82;

function skipOptional(message) {
  if (!optional) throw new Error(message);
  console.warn('[Archade pipeline] ' + message);
  process.exit(0);
}

if (!fs.existsSync(inputPath)) skipOptional('SketchUp source is not present. Pull Git LFS with git lfs pull.');
const sourceStat = fs.statSync(inputPath);
if (sourceStat.size < 1024) {
  const pointer = fs.readFileSync(inputPath, 'utf8').slice(0, 100);
  if (pointer.startsWith('version https://git-lfs.github.com/spec/v1')) skipOptional('Only the Git LFS pointer is present. Run git lfs pull.');
  throw new Error('SketchUp source is unexpectedly small (' + sourceStat.size + ' bytes).');
}
const nodeVersion = process.versions.node.split('.').map(Number);
if (nodeVersion[0] < 22 || (nodeVersion[0] === 22 && nodeVersion[1] < 12)) {
  throw new Error('OpenSKP 1.7.0 requires Node.js 22.12 or newer; found ' + process.versions.node + '.');
}

let openskp;
try { openskp = await import('openskp'); }
catch (error) {
  if (error?.code === 'ERR_MODULE_NOT_FOUND') skipOptional('OpenSKP is not installed.');
  throw error;
}
const cliPath = path.resolve(projectRoot, 'node_modules/.bin/gltf-transform');
if (!fs.existsSync(cliPath)) skipOptional('glTF Transform CLI is not installed.');

if (!force && fs.existsSync(outputPath) && fs.existsSync(collisionPath)) {
  const newest = Math.min(fs.statSync(outputPath).mtimeMs, fs.statSync(collisionPath).mtimeMs);
  if (newest >= sourceStat.mtimeMs) {
    console.info('[Archade pipeline] Optimized GLB and collision data are already up to date.');
    process.exit(0);
  }
}

const { SkpFile, toInstancedGLB } = openskp;
if (typeof SkpFile?.open !== 'function' || typeof toInstancedGLB !== 'function') {
  throw new Error('OpenSKP does not expose SkpFile/toInstancedGLB.');
}

console.info('[Archade pipeline] Reading ' + inputPath + ' (' + (sourceStat.size / 1024 / 1024).toFixed(1) + ' MiB).');
const sketchup = SkpFile.open(inputPath);
console.info('[Archade pipeline] Building shared render geometry and full-resolution collision geometry...');
const instancedScene = sketchup.buildInstancedScene();
const bakedScene = sketchup.buildScene();
const bounds = bakedScene.bounds ?? instancedScene.bounds;
if (!bounds || !bakedScene.glbPrimitives?.length || !instancedScene.meshResources?.length) {
  throw new Error('The SketchUp file did not produce measurable render and collision geometry.');
}
const [minX, minY, minZ] = bounds.min;
const [maxX, maxY, maxZ] = bounds.max;
const [width, height, depth] = bounds.size;
if (![width, height, depth].every((value) => Number.isFinite(value) && value > 0.1)) {
  throw new Error('The SketchUp scene reported invalid world-space metre bounds.');
}
console.info('[Archade pipeline] Life-size source dimensions (metres, X/Y/Z): ' + bounds.size.map((v) => v.toFixed(3)).join(' / '));
console.info('[Archade pipeline] Reusable render resources: ' + instancedScene.meshResources.length);
console.info('[Archade pipeline] World-space collision primitives: ' + bakedScene.glbPrimitives.length);

// Bake a ground-plane collision grid from every original triangle. This is
// intentionally generated BEFORE mesh simplification/compression, so visual
// optimization can never remove collision surfaces.
// Detect the actual walkable floor from the strongest near-horizontal surface
// in the lower 55% of the scene. A stray object below the floor must not shift
// the player band or make collision sampling miss the room furnishings.
const floorBinSize = 0.05;
const floorBins = new Map();
for (const primitive of bakedScene.glbPrimitives) {
  const positions = primitive.positions, indices = primitive.indices;
  if (!positions || !indices) continue;
  for (let i = 0; i + 2 < indices.length; i += 3) {
    const ia = indices[i] * 3, ib = indices[i + 1] * 3, ic = indices[i + 2] * 3;
    const ax = positions[ia], ay = positions[ia + 1], az = positions[ia + 2];
    const bx = positions[ib], by = positions[ib + 1], bz = positions[ib + 2];
    const cx = positions[ic], cy = positions[ic + 1], cz = positions[ic + 2];
    const abx = bx - ax, aby = by - ay, abz = bz - az;
    const acx = cx - ax, acy = cy - ay, acz = cz - az;
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;
    const areaTwice = Math.hypot(nx, ny, nz);
    if (areaTwice < 1e-8 || Math.abs(ny) / areaTwice < 0.985) continue;
    const centerY = (ay + by + cy) / 3;
    const relativeY = centerY - minY;
    if (relativeY < -0.02 || relativeY > height * 0.55) continue;
    const bin = Math.round(centerY / floorBinSize);
    floorBins.set(bin, (floorBins.get(bin) ?? 0) + areaTwice * 0.5);
  }
}
let strongestFloorBin = null, strongestFloorArea = 0;
for (const [bin, area] of floorBins) {
  if (area > strongestFloorArea) { strongestFloorBin = bin; strongestFloorArea = area; }
}
let floorY = minY;
if (strongestFloorBin !== null && strongestFloorArea >= 1.0) {
  let weightedArea = 0, weightedY = 0;
  for (let bin = strongestFloorBin - 1; bin <= strongestFloorBin + 1; bin += 1) {
    const area = floorBins.get(bin) ?? 0;
    weightedArea += area;
    weightedY += area * (bin * floorBinSize);
  }
  if (weightedArea > 0) floorY = weightedY / weightedArea;
}
const groundedHeight = maxY - floorY;
if (!(groundedHeight > 1.0 && groundedHeight <= 30)) {
  throw new Error('Detected floor height is outside a plausible room range: ' + groundedHeight.toFixed(3) + ' m.');
}
console.info('[Archade pipeline] Detected floor plane: Y=' + floorY.toFixed(3) + ' m from source origin; horizontal area=' + strongestFloorArea.toFixed(2) + ' m².');

const occupied = new Set();
const bodyMinY = floorY + 0.08;
const bodyMaxY = floorY + playerBodyHeight;
let trianglesVisited = 0;
let trianglesRasterized = 0;
let cellTests = 0;
const pointInTriangle = (px, pz, ax, az, bx, bz, cx, cz) => {
  const denominator = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
  if (Math.abs(denominator) < 1e-9) return false;
  const u = ((bz - cz) * (px - cx) + (cx - bx) * (pz - cz)) / denominator;
  const v = ((cz - az) * (px - cx) + (ax - cx) * (pz - cz)) / denominator;
  return u >= -0.015 && v >= -0.015 && u + v <= 1.015;
};
const addCell = (x, z) => occupied.add(x + ',' + z);
const floorGridCellSize = 0.75;
const walkableFloorCells = new Set();
const addFloorCell = (x, z) => walkableFloorCells.add(x + ',' + z);

for (const primitive of bakedScene.glbPrimitives) {
  const positions = primitive.positions;
  const indices = primitive.indices;
  if (!positions || !indices) continue;
  for (let i = 0; i + 2 < indices.length; i += 3) {
    trianglesVisited += 1;
    const ia = indices[i] * 3, ib = indices[i + 1] * 3, ic = indices[i + 2] * 3;
    const ax = positions[ia], ay = positions[ia + 1], az = positions[ia + 2];
    const bx = positions[ib], by = positions[ib + 1], bz = positions[ib + 2];
    const cx = positions[ic], cy = positions[ic + 1], cz = positions[ic + 2];
    const lowY = Math.min(ay, by, cy), highY = Math.max(ay, by, cy);
    const abx = bx - ax, aby = by - ay, abz = bz - az;
    const acx = cx - ax, acy = cy - ay, acz = cz - az;
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;
    const normalLength = Math.hypot(nx, ny, nz);
    if (normalLength < 1e-8) continue;

    // Extract the actual room floor separately from obstacle surfaces.
    const normalYRatio = Math.abs(ny) / normalLength;
    const triangleCenterY = (ay + by + cy) / 3;
    if (normalYRatio > 0.985 && Math.abs(triangleCenterY - floorY) <= 0.18) {
      const floorMinX = Math.floor((Math.min(ax,bx,cx)-bounds.center[0])/floorGridCellSize);
      const floorMaxX = Math.floor((Math.max(ax,bx,cx)-bounds.center[0])/floorGridCellSize);
      const floorMinZ = Math.floor((Math.min(az,bz,cz)-bounds.center[2])/floorGridCellSize);
      const floorMaxZ = Math.floor((Math.max(az,bz,cz)-bounds.center[2])/floorGridCellSize);
      for (let floorX=floorMinX; floorX<=floorMaxX; floorX+=1) {
        const sampleX=(floorX+0.5)*floorGridCellSize+bounds.center[0];
        for (let floorZ=floorMinZ; floorZ<=floorMaxZ; floorZ+=1) {
          const sampleZ=(floorZ+0.5)*floorGridCellSize+bounds.center[2];
          if (pointInTriangle(sampleX,sampleZ,ax,az,bx,bz,cx,cz)) addFloorCell(floorX,floorZ);
        }
      }
    }
    if (highY < bodyMinY || lowY > bodyMaxY) continue;
    // Keep walls, rails, slides and angled surfaces. Exclude near-horizontal
    // floor/ceiling faces so they do not turn the whole room into a blocker.
    if (Math.abs(ny) / normalLength > 0.94) continue;
    const lowX = Math.min(ax, bx, cx), highX = Math.max(ax, bx, cx);
    const lowZ = Math.min(az, bz, cz), highZ = Math.max(az, bz, cz);
    const startX = Math.floor(lowX / cellSize), endX = Math.floor(highX / cellSize);
    const startZ = Math.floor(lowZ / cellSize), endZ = Math.floor(highZ / cellSize);
    const projectedArea = Math.abs(abx * acz - acx * abz);
    trianglesRasterized += 1;
    if (projectedArea < 0.025) {
      // Thin vertical faces have almost zero XZ area. Keep their narrow footprint.
      const pad = cellSize * 0.62;
      for (let x = Math.floor((lowX - pad) / cellSize); x <= Math.floor((highX + pad) / cellSize); x += 1) {
        for (let z = Math.floor((lowZ - pad) / cellSize); z <= Math.floor((highZ + pad) / cellSize); z += 1) addCell(x, z);
      }
      continue;
    }
    for (let x = startX; x <= endX; x += 1) {
      const px = (x + 0.5) * cellSize;
      for (let z = startZ; z <= endZ; z += 1) {
        cellTests += 1;
        const pz = (z + 0.5) * cellSize;
        if (pointInTriangle(px, pz, ax, az, bx, bz, cx, cz)) addCell(x, z);
      }
    }
    addCell(Math.floor(((ax + bx + cx) / 3) / cellSize), Math.floor(((az + bz + cz) / 3) / cellSize));
  }
}
console.info('[Archade pipeline] Collision raster pass: ' + trianglesVisited.toLocaleString() + ' triangles visited, ' + trianglesRasterized.toLocaleString() + ' body-height surfaces rasterized, ' + occupied.size.toLocaleString() + ' cells occupied.');

// Merge adjacent occupied cells into non-overlapping rectangles.
const rows = new Map();
for (const key of occupied) {
  const split = key.indexOf(',');
  const x = Number(key.slice(0, split)), z = Number(key.slice(split + 1));
  if (!rows.has(z)) rows.set(z, []);
  rows.get(z).push(x);
}
const runsByRow = new Map();
for (const z of [...rows.keys()].sort((a, b) => a - b)) {
  const xs = rows.get(z).sort((a, b) => a - b);
  const runs = [];
  if (xs.length) {
    let start = xs[0], previous = xs[0];
    for (let i = 1; i < xs.length; i += 1) {
      const x = xs[i];
      if (x !== previous + 1) { runs.push([start, previous]); start = x; }
      previous = x;
    }
    runs.push([start, previous]);
  }
  runsByRow.set(z, runs);
}
const collisionBoxes = [];
let active = new Map();
for (const z of [...runsByRow.keys()].sort((a, b) => a - b)) {
  const next = new Map();
  for (const [start, end] of runsByRow.get(z)) {
    const key = start + ':' + end;
    const existing = active.get(key);
    if (existing && Math.abs(existing.maxZ - z * cellSize) < 1e-6) {
      existing.maxZ = (z + 1) * cellSize;
      next.set(key, existing);
    } else {
      const box = {
        minX: start * cellSize - bounds.center[0],
        maxX: (end + 1) * cellSize - bounds.center[0],
        minZ: z * cellSize - bounds.center[2],
        maxZ: (z + 1) * cellSize - bounds.center[2]
      };
      collisionBoxes.push(box);
      next.set(key, box);
    }
  }
  active = next;
}

function isBlocked(x, z) {
  return collisionBoxes.some((box) =>
    x + playerRadius > box.minX && x - playerRadius < box.maxX &&
    z + playerRadius > box.minZ && z - playerRadius < box.maxZ
  );
}
const halfWidth=width/2;
const halfDepth=depth/2;
const walkableFloorPositions=[];
for(const key of walkableFloorCells){
  const split=key.indexOf(',');
  const cellX=Number(key.slice(0,split)),cellZ=Number(key.slice(split+1));
  const x=(cellX+0.5)*floorGridCellSize,z=(cellZ+0.5)*floorGridCellSize;
  if(Math.abs(x)>halfWidth-1.1||Math.abs(z)>halfDepth-1.1)continue;
  if(!isBlocked(x,z))walkableFloorPositions.push({x,z});
}
if(walkableFloorPositions.length<100){
  throw new Error('Floor walkability extraction is incomplete: only '+walkableFloorPositions.length+' clear floor cells.');
}
function findSafeSpawn(){
  const preferredZ=Math.max(-halfDepth+1.1,halfDepth-2.2);
  let best=null,bestDistance=Infinity;
  for(const candidate of walkableFloorPositions){
    const distance=candidate.x*candidate.x+(candidate.z-preferredZ)**2;
    if(distance<bestDistance){best=candidate;bestDistance=distance;}
  }
  return best?{x:Number(best.x.toFixed(3)),z:Number(best.z.toFixed(3))}:null;
}
function findSpacedPoints(origin,count){
  const chosen=[],used=new Set();
  let minimumSpacing=6.0;
  while(chosen.length<count&&minimumSpacing>=3.5){
    let best=null,bestDistance=-1;
    for(const candidate of walkableFloorPositions){
      const key=candidate.x.toFixed(2)+','+candidate.z.toFixed(2);
      if(used.has(key))continue;
      let nearest=Math.hypot(candidate.x-origin.x,candidate.z-origin.z);
      for(const point of chosen)nearest=Math.min(nearest,Math.hypot(candidate.x-point.x,candidate.z-point.z));
      if(nearest>bestDistance){best={...candidate,key};bestDistance=nearest;}
    }
    if(!best||bestDistance<minimumSpacing){minimumSpacing-=0.5;continue;}
    used.add(best.key);
    chosen.push({x:Number(best.x.toFixed(3)),z:Number(best.z.toFixed(3))});
  }
  return chosen;
}

if (collisionBoxes.length < 10 || occupied.size < 100) {
  throw new Error('Collision generation coverage is insufficient: ' + collisionBoxes.length + ' boxes / ' + occupied.size + ' cells; body-height triangles=' + trianglesRasterized + '.');
}
const spawn = findSafeSpawn();
if (!spawn) throw new Error('Collision QA failed: no clear spawn point exists on the extracted floor.');
if (isBlocked(spawn.x, spawn.z)) throw new Error('Collision QA failed: selected player spawn intersects collision geometry.');
const probe = collisionBoxes[Math.floor(collisionBoxes.length / 2)];
const probeX = (probe.minX + probe.maxX) / 2, probeZ = (probe.minZ + probe.maxZ) / 2;
if (!isBlocked(probeX, probeZ)) throw new Error('Collision QA failed: generated AABBs do not block a player-sized probe.');
const gameplayPoints = findSpacedPoints(spawn, 5);
if (gameplayPoints.length < 5) throw new Error('Could not find five separated, collision-free floor points for relays and hiding places.');
for (const box of collisionBoxes) {
  if (![box.minX, box.maxX, box.minZ, box.maxZ].every(Number.isFinite) || box.minX >= box.maxX || box.minZ >= box.maxZ) {
    throw new Error('Collision QA failed: invalid AABB coordinates.');
  }
}

const collisionData = {
  version: 1, units: 'metres',
  coordinateSystem: 'Y-up; XZ collision plane; model centered at X/Z origin and grounded at Y=0',
  cellSize, playerRadius, playerBodyHeight, sourceBounds: bounds,
  groundY: floorY, groundedHeight,
  modelOffset: { x: -bounds.center[0], y: -floorY, z: -bounds.center[2] },
  spawn,
  qaProbe: { x: probeX, z: probeZ },
  points: {
    relaySpawns: gameplayPoints.slice(0,3),
    hideSpots: [
      { name: 'activity alcove', ...gameplayPoints[3] },
      { name: 'play-structure nook', ...gameplayPoints[4] }
    ]
  },
  stats: {
    sourceMeshResources: instancedScene.meshResources.length,
    floorY,
    floorSurfaceArea: strongestFloorArea,
    sourceTriangles: trianglesVisited,
    bodyHeightSurfaces: trianglesRasterized,
    rasterCellTests: cellTests,
    floorCells: walkableFloorCells.size,
    walkableFloorCells: walkableFloorPositions.length,
    occupiedCells: occupied.size,
    colliderBoxes: collisionBoxes.length,
    spawnClear: !isBlocked(spawn.x, spawn.z),
    blockingProbePassed: isBlocked(probeX, probeZ)
  },
  boxes: collisionBoxes
};
fs.mkdirSync(path.dirname(collisionPath), { recursive: true });
fs.writeFileSync(collisionPath, JSON.stringify(collisionData));
console.info('[Archade pipeline] Collision QA passed: ' + occupied.size + ' occupied cells merged into ' + collisionBoxes.length + ' AABBs.');
console.info('[Archade pipeline] Safe player spawn: X=' + spawn.x + ' m, Z=' + spawn.z + ' m.');
console.info('[Archade pipeline] Walkable floor cells: ' + walkableFloorPositions.length + '; gameplay points: ' + gameplayPoints.length + '.');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'archade-convert-'));
const rawPath = path.join(tempDir, 'classroom-source.glb');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
try {
  console.info('[Archade pipeline] Exporting reusable render mesh resources to GLB...');
  const rawGlb = toInstancedGLB(instancedScene, { textures: true });
  fs.writeFileSync(rawPath, Buffer.from(rawGlb));
  console.info('[Archade pipeline] Optimizing geometry, textures, and GPU buffers...');
  const optimizeArgs = [
    'optimize', rawPath, outputPath,
    '--instance', 'false', '--flatten', 'false', '--join', 'false', '--palette', 'false',
    '--simplify', 'true', '--simplify-ratio', '0.5', '--simplify-error', '0.001',
    '--simplify-lock-border', 'true', '--weld', 'true',
    '--compress', 'meshopt', '--meshopt-level', 'high',
    '--texture-compress', 'webp', '--texture-size', '1024'
  ];
  try {
    execFileSync(cliPath, optimizeArgs, { cwd: projectRoot, stdio: 'inherit', maxBuffer: 16 * 1024 * 1024 });
  } catch (error) {
    if (optional) skipOptional('GLB optimization could not complete: ' + error.message);
    throw error;
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

const optimized = fs.readFileSync(outputPath);
if (optimized.length < 20 || optimized.toString('ascii', 0, 4) !== 'glTF') throw new Error('Optimized output is not a valid GLB file.');
const header = new DataView(optimized.buffer, optimized.byteOffset, optimized.byteLength);
const jsonLength = header.getUint32(12, true);
const gltf = JSON.parse(optimized.toString('utf8', 20, 20 + jsonLength).replace(/[\\u0000 ]+$/g, ''));
const positionAccessors = new Set(), indexAccessors = new Set();
for (const mesh of gltf.meshes ?? []) {
  for (const primitive of mesh.primitives ?? []) {
    if (primitive.attributes?.POSITION !== undefined) positionAccessors.add(primitive.attributes.POSITION);
    if (primitive.indices !== undefined) indexAccessors.add(primitive.indices);
  }
}
const vertexCount = [...positionAccessors].reduce((sum, index) => sum + (gltf.accessors?.[index]?.count ?? 0), 0);
const triangleCount = [...indexAccessors].reduce((sum, index) => sum + Math.floor((gltf.accessors?.[index]?.count ?? 0) / 3), 0);
const sizeMiB = optimized.length / 1024 / 1024;
if (vertexCount === 0 || triangleCount === 0) throw new Error('Optimized GLB contains no renderable triangle geometry.');
if (sizeMiB > 180) throw new Error('Optimized GLB is still too large (' + sizeMiB.toFixed(1) + ' MiB; limit 180 MiB).');
console.info('[Archade pipeline] Optimization complete.');
console.info('  Runtime GLB: ' + sizeMiB.toFixed(1) + ' MiB');
console.info('  Runtime vertices: ' + vertexCount.toLocaleString());
console.info('  Runtime triangles: ' + triangleCount.toLocaleString());
console.info('  Life-size bounds (metres): ' + bounds.size.map((v) => v.toFixed(3)).join(' x '));
console.info('  Collision AABBs: ' + collisionBoxes.length + ' (from original, unsimplified SketchUp triangles)');
console.info('  Walkable floor cells: ' + walkableFloorPositions.length);
console.info('  Player spawn clearance: PASS');
console.info('  Player collision probe: PASS');
console.info('[Archade pipeline] Generated model and collision data are ready.');
