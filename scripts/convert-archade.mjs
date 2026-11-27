#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const optional = process.argv.includes('--optional');
const force = process.argv.includes('--force');
const inputPath = path.resolve(projectRoot, args[0] ?? 'source-assets/archade/archade-classroom.skp');
const outputPath = path.resolve(projectRoot, args[1] ?? 'public/assets/environment/archade/classroom.glb');

if (!fs.existsSync(inputPath)) {
  const message = 'SketchUp source not found: ' + inputPath + '. Pull the Git LFS object with: git lfs pull';
  if (optional) { console.warn('[Archade converter] ' + message); process.exit(0); }
  throw new Error(message);
}

const inputStat = fs.statSync(inputPath);
if (inputStat.size < 1024) {
  const preview = fs.readFileSync(inputPath, 'utf8').slice(0, 100);
  if (preview.startsWith('version https://git-lfs.github.com/spec/v1')) {
    const message = 'The SketchUp file is still a Git LFS pointer. Run git lfs pull and retry.';
    if (optional) { console.warn('[Archade converter] ' + message); process.exit(0); }
    throw new Error(message);
  }
  throw new Error('The SketchUp source is unexpectedly small (' + inputStat.size + ' bytes).');
}

if (!force && fs.existsSync(outputPath) && fs.statSync(outputPath).mtimeMs >= inputStat.mtimeMs) {
  console.info('[Archade converter] GLB is already up to date: ' + outputPath);
  process.exit(0);
}

let openskp;
try {
  openskp = await import('openskp');
} catch (error) {
  if (optional && error?.code === 'ERR_MODULE_NOT_FOUND') {
    console.warn('[Archade converter] OpenSKP is not installed; keeping the legacy scene for this run.');
    console.warn('Install it with: npm install --no-save --package-lock=false openskp@1.7.0');
    process.exit(0);
  }
  throw new Error('Could not load OpenSKP. Install it with npm install --no-save --package-lock=false openskp@1.7.0.', { cause: error });
}

const nodeVersion = process.versions.node.split('.').map(Number);
if (nodeVersion[0] < 22 || (nodeVersion[0] === 22 && nodeVersion[1] < 12)) {
  throw new Error('OpenSKP 1.7.0 requires Node.js 22.12 or newer; found ' + process.versions.node + '.');
}

const SkpFile = openskp.SkpFile;
const toGLB = openskp.toGLB;
if (typeof SkpFile?.open !== 'function' || typeof toGLB !== 'function') {
  throw new Error('The installed OpenSKP package does not expose the expected SkpFile/toGLB API.');
}

console.info('[Archade converter] Reading ' + inputPath + ' (' + (inputStat.size / 1024 / 1024).toFixed(1) + ' MiB)');
console.info('[Archade converter] Parsing and baking the SketchUp scene...');
const scene = SkpFile.open(inputPath).buildScene();
const primitives = scene.glbPrimitives ?? [];
if (primitives.length === 0) throw new Error('OpenSKP parsed the file but found no renderable mesh primitives.');

const min = [Infinity, Infinity, Infinity];
const max = [-Infinity, -Infinity, -Infinity];
let vertexCount = 0;
let triangleCount = 0;
for (const primitive of primitives) {
  const positions = primitive.positions;
  vertexCount += positions.length / 3;
  triangleCount += (primitive.indices?.length ?? 0) / 3;
  for (let i = 0; i < positions.length; i += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      const value = positions[i + axis];
      if (value < min[axis]) min[axis] = value;
      if (value > max[axis]) max[axis] = value;
    }
  }
}

console.info('[Archade converter] Exporting GLB with embedded textures...');
const glb = toGLB(scene, {
  textures: true,
  onLog: (level, message) => { if (level !== 'info') console.warn('[OpenSKP:' + level + '] ' + message); }
});
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, Buffer.from(glb));
const dimensions = max.map((value, axis) => Number((value - min[axis]).toFixed(3)));
const outputStat = fs.statSync(outputPath);
console.info('[Archade converter] Conversion complete.');
console.info('  Output: ' + outputPath);
console.info('  Size: ' + (outputStat.size / 1024 / 1024).toFixed(1) + ' MiB');
console.info('  Mesh primitives: ' + primitives.length);
console.info('  Vertices: ' + vertexCount.toLocaleString());
console.info('  Triangles: ' + triangleCount.toLocaleString());
console.info('  Bounds (metres, X/Y/Z): ' + dimensions.join(' / '));
