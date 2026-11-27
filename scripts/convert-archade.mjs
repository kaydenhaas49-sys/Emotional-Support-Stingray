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
  if (pointer.startsWith('version https://git-lfs.github.com/spec/v1')) {
    skipOptional('Only the Git LFS pointer is present. Run git lfs pull before converting.');
  }
  throw new Error('SketchUp source is unexpectedly small (' + sourceStat.size + ' bytes).');
}

const nodeVersion = process.versions.node.split('.').map(Number);
if (nodeVersion[0] < 22 || (nodeVersion[0] === 22 && nodeVersion[1] < 12)) {
  throw new Error('OpenSKP 1.7.0 requires Node.js 22.12 or newer; found ' + process.versions.node + '.');
}

let openskp;
try {
  openskp = await import('openskp');
} catch (error) {
  if (error?.code === 'ERR_MODULE_NOT_FOUND') skipOptional('OpenSKP is not installed. Install openskp@1.7.0 to convert the scene.');
  throw error;
}

const cliPath = path.resolve(projectRoot, 'node_modules/.bin/gltf-transform');
if (!fs.existsSync(cliPath)) {
  skipOptional('glTF Transform CLI is not installed. Install @gltf-transform/cli@4.5.1 and sharp.');
}

if (!force && fs.existsSync(outputPath) && fs.existsSync(collisionPath)) {
  const newestOutput = Math.min(fs.statSync(outputPath).mtimeMs, fs.statSync(collisionPath).mtimeMs);
  if (newestOutput >= sourceStat.mtimeMs) {
    console.info('[Archade pipeline] Optimized GLB and collision data are already up to date.');
    process.exit(0);
  }
}

const { SkpFile, toInstancedGLB } = openskp;
if (typeof SkpFile?.open !== 'function' || typeof toInstancedGLB !== 'function') {
  throw new Error('OpenSKP does not expose the expected SkpFile/toInstancedGLB API.');
}

console.info('[Archade pipeline] Reading ' + inputPath + ' (' + (sourceStat.size / 1024 / 1024).toFixed(1) + ' MiB).');
console.info('[Archade pipeline] Building reusable, life-size SketchUp scene geometry...');
const sketchup = SkpFile.open(inputPath);
const scene = sketchup.buildInstancedScene();
if (!scene.bounds || !scene.meshResources?.length) {
  throw new Error('The SketchUp scene has no placed mesh geometry or measurable bounds.');
}
const bounds = scene.bounds;
const [minX, minY, minZ] = bounds.min;
const [maxX, maxY, maxZ] = bounds.max;
const [width, height, depth] = bounds.size;
if (![width, height, depth].every((value) => Number.isFinite(value) && value > 0.1)) {
  throw new Error('The SketchUp scene reported invalid world-space metre bounds.');
}
console.info('[Archade pipeline] Source dimensions (metres, X/Y/Z): ' + bounds.size.map((v) => v.toFixed(3)).join(' / '));
console.info('[Archade pipeline] Source mesh resources: ' + scene.meshResources.length);

// Matrices in OpenSKP are column-major glTF transforms (metres, Y-up).
function multiplyMatrices(a, b) {
  const out = new Array(16).fill(0);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      for (let k = 0; k < 4; k += 1) out[column * 4 + row] += a[k * 4 + row] * b[column * 4 + k];
    }
  }
  return out;
}
function transformPoint(matrix, positions, index) {
  const x = positions[index * 3];
  const y = positions[index * 3 + 1];
  const z = positions[index * 3 + 2];
  const w = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
  const divisor = Math.abs(w) > 1e-10 ? w : 1;
  return [
    (matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12]) / divisor,
    (matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13]) / divisor,
    (matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]) / divisor
  ];
}

// Build a 2D blocking grid from the ORIGINAL, unsimplified SketchUp surfaces.
// Player movement is ground-based, so vertical surfaces intersecting the
// player's 1.82 m body are rasterized; floors and ceilings are not blockers.
const occupied = new Set();
const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const bodyMinY = minY + 0.08;
const bodyMaxY = minY + playerBodyHeight;
let trianglesVisited = 0;
let trianglesRasterized = 0;
let cellTests = 0;
const resourceById = new Map(scene.meshResources.map((resource) => [resource.id, resource]));

function addCell(x, z) { occupied.add(x + ',' + z); }
function rasterizeTriangle(a, b, c) {
  trianglesVisited += 1;
  const lowY = Math.min(a[1], b[1], c[1]);
  const highY = Math.max(a[1], b[1], c[1]);
  if (highY < bodyMinY || lowY > bodyMaxY) return;

  const abx = b[0] - a[0], aby = b[1] - a[1], abz = b[2] - a[2];
  const acx = c[0] - a[0], acy = c[1] - a[1], acz = c[2] - a[2];
  const nx = aby * acz - abz * acy;
  const ny = abz * acx - abx * acz;
  const nz = abx * acy - aby * acx;
  const normalLength = Math.hypot(nx, ny, nz);
  if (normalLength < 1e-8 || Math.abs(ny) / normalLength > 0.78) return;

  const lowX = Math.min(a[0], b[0], c[0]);
  const highX = Math.max(a[0], b[0], c[0]);
  const lowZ = Math.min(a[2], b[2], c[2]);
  const highZ = Math.max(a[2], b[2], c[2]);
  const startX = Math.floor(lowX / cellSize);
  const endX = Math.floor(highX / cellSize);
  const startZ = Math.floor(lowZ / cellSize);
  const endZ = Math.floor(highZ / cellSize);
  const area = Math.abs(abx * acz - acx * abz);
  trianglesRasterized += 1;

  if (area < 0.025) {
    // Thin vertical surfaces (rails, posts, wall edges) have nearly zero XZ area.
    const pad = cellSize * 0.62;
    for (let x = Math.floor((lowX - pad) / cellSize); x <= Math.floor((highX + pad) / cellSize); x += 1) {
      for (let z = Math.floor((lowZ - pad) / cellSize); z <= Math.floor((highZ + pad) / cellSize); z += 1) {
        addCell(x, z);
      }
    }
    return;
  }

  const denominator = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2]);
  if (Math.abs(denominator) < 1e-10) return;
  for (let x = startX; x <= endX; x += 1) {
    const px = (x + 0.5) * cellSize;
    for (let z = startZ; z <= endZ; z += 1) {
      cellTests += 1;
      const pz = (z + 0.5) * cellSize;
      const u = ((b[2] - c[2]) * (px - c[0]) + (c[0] - b[0]) * (pz - c[2])) / denominator;
      const v = ((c[2] - a[2]) * (px - c[0]) + (a[0] - c[0]) * (pz - c[2])) / denominator;
      if (u >= -0.01 && v >= -0.01 && u + v <= 1.01) addCell(x, z);
    }
  }
  addCell(Math.floor(((a[0] + b[0] + c[0]) / 3) / cellSize), Math.floor(((a[2] + b[2] + c[2]) / 3) / cellSize));
}

function visitNode(node, parentMatrix, parentHidden = false) {
  const hidden = parentHidden || node.hidden === true || scene.layerHidden?.[node.layer] === true;
  if (hidden) return;
  const local = Array.isArray(node.matrix) && node.matrix.length === 16 ? node.matrix : identity;
  const world = multiplyMatrices(parentMatrix, local);
  if (node.meshResourceId) {
    const resource = resourceById.get(node.meshResourceId);
    if (!resource) throw new Error('Missing instanced mesh resource: ' + node.meshResourceId);
    for (const primitive of resource.primitives) {
      const positions = primitive.positions;
      const indices = primitive.indices;
      for (let i = 0; i + 2 < indices.length; i += 3) {
        const a = transformPoint(world, positions, indices[i]);
        const b = transformPoint(world, positions, indices[i + 1]);
        const c = transformPoint(world, positions, indices[i + 2]);
        rasterizeTriangle(a, b, c);
      }
    }
  }
  for (const child of node.children ?? []) visitNode(child, world, hidden);
}
visitNode(scene.sceneHierarchy, identity, false);

// Convert occupied cells into merged rectangles. This is the runtime AABB set
// consumed by Player.isBlocked(), not a visual-only collision suggestion.
const rows = new Map();
for (const key of occupied) {
  const comma = key.indexOf(',');
  const x = Number(key.slice(0, comma));
  const z = Number(key.slice(comma + 1));
  if (!rows.has(z)) rows.set(z, []);
  rows.get(z).push(x);
}
const runsByRow = new Map();
for (const z of [...rows.keys()].sort((a, b) => a - b)) {
  const xs = rows.get(z).sort((a, b) => a - b);
  const runs = [];
  let start = xs[0], previous = xs[0];
  for (let i = 1; i < xs.length; i += 1) {
    const x = xs[i];
    if (x !== previous + 1) { runs.push([start, previous]); start = x; }
    previous = x;
  }
  if (xs.length) runs.push([start, previous]);
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
function findSafeSpawn() {
  const halfX = width / 2, halfZ = depth / 2;
  const preferredZ = Math.max(-halfZ + 1, halfZ - 2.2);
  // Search outward from the front entrance, preferring a clear point near center.
  for (let ring = 0; ring <= 40; ring += 1) {
    const distance = ring * 0.4;
    const candidates = ring === 0
      ? [[0, preferredZ]]
      : [[0, preferredZ - distance], [distance, preferredZ], [-distance, preferredZ],
         [0, preferredZ + distance], [distance, preferredZ - distance],
         [-distance, preferredZ - distance], [distance, preferredZ + distance],
         [-distance, preferredZ + distance]];
    for (const [x, z] of candidates) {
      if (Math.abs(x) > halfX - 0.75 || Math.abs(z) > halfZ - 0.75) continue;
      if (!isBlocked(x, z)) return { x: Number(x.toFixed(3)), z: Number(z.toFixed(3)) };
    }
  }
  // Last resort: find any free 0.4 m cell inside the measured model footprint.
  for (let z = -halfZ + 0.8; z <= halfZ - 0.8; z += 0.4) {
    for (let x = -halfX + 0.8; x <= halfX - 0.8; x += 0.4) {
      if (!isBlocked(x, z)) return { x: Number(x.toFixed(3)), z: Number(z.toFixed(3)) };
    }
  }
  return null;
}

if (collisionBoxes.length < 10 || occupied.size < 100) {
  throw new Error('Collision generation produced too little coverage: ' + collisionBoxes.length + ' boxes / ' + occupied.size + ' cells.');
}
const spawn = findSafeSpawn();
if (!spawn) throw new Error('Collision QA failed: no unblocked player spawn exists inside the model footprint.');
if (isBlocked(spawn.x, spawn.z)) throw new Error('Collision QA failed: chosen player spawn intersects collision geometry.');
const collisionProbe = collisionBoxes[Math.floor(collisionBoxes.length / 2)];
const probeX = (collisionProbe.minX + collisionProbe.maxX) / 2;
const probeZ = (collisionProbe.minZ + collisionProbe.maxZ) / 2;
if (!isBlocked(probeX, probeZ)) throw new Error('Collision QA failed: a generated blocker does not block a player-sized probe.');
for (const box of collisionBoxes) {
  if (![box.minX, box.maxX, box.minZ, box.maxZ].every(Number.isFinite) || box.minX >= box.maxX || box.minZ >= box.maxZ) {
    throw new Error('Collision QA failed: invalid collision AABB found.');
  }
}

const collisionData = {
  version: 1,
  units: 'metres',
  coordinateSystem: 'Y-up; XZ collision plane; model centered at X/Z origin and grounded at Y=0',
  cellSize,
  playerRadius,
  playerBodyHeight,
  sourceBounds: bounds,
  modelOffset: { x: -bounds.center[0], y: -minY, z: -bounds.center[2] },
  spawn,
  stats: {
    sourceMeshResources: scene.meshResources.length,
    trianglesVisited,
    trianglesRasterized,
    cellTests,
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

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'archade-convert-'));
const rawPath = path.join(tempDir, 'classroom-source.glb');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
try {
  console.info('[Archade pipeline] Exporting reusable mesh resources to GLB...');
  const rawGlb = toInstancedGLB(scene, { textures: true });
  fs.writeFileSync(rawPath, Buffer.from(rawGlb));
  console.info('[Archade pipeline] Optimizing geometry, textures, and GPU buffers...');
  const optimizeArgs = [
    'optimize', rawPath, outputPath,
    '--instance', 'false',
    '--flatten', 'false',
    '--join', 'false',
    '--palette', 'false',
    '--simplify', 'true',
    '--simplify-ratio', '0.5',
    '--simplify-error', '0.001',
    '--simplify-lock-border', 'true',
    '--weld', 'true',
    '--compress', 'meshopt',
    '--meshopt-level', 'high',
    '--texture-compress', 'webp',
    '--texture-size', '1024'
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
if (optimized.length < 20 || optimized.toString('ascii', 0, 4) !== 'glTF') {
  throw new Error('Optimized output is not a valid GLB file.');
}
const header = new DataView(optimized.buffer, optimized.byteOffset, optimized.byteLength);
const jsonLength = header.getUint32(12, true);
const gltf = JSON.parse(optimized.toString('utf8', 20, 20 + jsonLength).replace(/[\\u0000 ]+$/g, ''));
const positionAccessors = new Set();
const indexAccessors = new Set();
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
console.info('  Runtime GLB: ' + (optimized.length / 1024 / 1024).toFixed(1) + ' MiB');
console.info('  Runtime vertices: ' + vertexCount.toLocaleString());
console.info('  Runtime triangles: ' + triangleCount.toLocaleString());
console.info('  Life-size bounds (metres): ' + bounds.size.map((v) => v.toFixed(3)).join(' x '));
console.info('  Collision AABBs: ' + collisionBoxes.length + ' (precomputed from original SketchUp triangles)');
console.info('  Player spawn clearance: PASS');
console.info('[Archade pipeline] Generated model and collision files are ready.');
