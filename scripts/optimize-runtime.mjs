#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const input=path.join(root,'public/assets/environment/archade/classroom.glb');
const cli=path.join(root,'node_modules/.bin/gltf-transform');
if(!fs.existsSync(input))throw new Error('Archade classroom GLB is missing.');
if(!fs.existsSync(cli))throw new Error('glTF Transform CLI is not installed.');

function inspect(buffer) {
  if(buffer.length<20||buffer.toString('ascii',0,4)!=='glTF')throw new Error('Invalid GLB file.');
  const view=new DataView(buffer.buffer,buffer.byteOffset,buffer.byteLength);
  const jsonLength=view.getUint32(12,true);
  const json=JSON.parse(buffer.toString('utf8',20,20+jsonLength).replace(/[\\u0000 ]+$/g,''));
  const positions=new Set(),indices=new Set();
  for(const mesh of json.meshes??[])for(const primitive of mesh.primitives??[]) {
    if(primitive.attributes?.POSITION!==undefined)positions.add(primitive.attributes.POSITION);
    if(primitive.indices!==undefined)indices.add(primitive.indices);
  }
  const vertices=[...positions].reduce((sum,index)=>sum+(json.accessors?.[index]?.count??0),0);
  const triangles=[...indices].reduce((sum,index)=>sum+Math.floor((json.accessors?.[index]?.count??0)/3),0);
  if(!vertices||!triangles)throw new Error('No renderable geometry in optimized model.');
  return {vertices,triangles,bytes:buffer.length};
}

const original=fs.readFileSync(input);
const before=inspect(original);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'stingray-archade-'));
const output=path.join(temp,'classroom-optimized.glb');
try {
  execFileSync(cli,[
    'optimize',input,output,
    '--instance','true','--instance-min','3',
    '--flatten','false','--join','false','--palette','false',
    '--simplify','true','--simplify-ratio','0.32','--simplify-error','0.001',
    '--simplify-lock-border','true','--weld','true',
    '--compress','meshopt','--meshopt-level','high',
    '--texture-compress','webp','--texture-size','768'
  ],{cwd:root,stdio:'inherit',maxBuffer:16*1024*1024});
  const optimized=fs.readFileSync(output);
  const after=inspect(optimized);
  if(after.triangles>=before.triangles*0.9)throw new Error('Simplification reduced fewer than 10% of triangles.');
  if(after.triangles>950000)throw new Error('Optimized classroom exceeds 950k triangle budget: '+after.triangles);
  if(after.bytes>30*1024*1024)throw new Error('Optimized classroom exceeds 30 MiB budget.');
  fs.copyFileSync(output,input);
  console.info('[Classroom optimization] PASS');
  console.info('  Triangles:',before.triangles.toLocaleString(),'->',after.triangles.toLocaleString());
  console.info('  Vertices:',before.vertices.toLocaleString(),'->',after.vertices.toLocaleString());
  console.info('  MiB:',(before.bytes/1048576).toFixed(1),'->',(after.bytes/1048576).toFixed(1));
} finally {
  fs.rmSync(temp,{recursive:true,force:true});
}
