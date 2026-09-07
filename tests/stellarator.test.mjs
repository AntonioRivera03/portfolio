import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cross, toScenePoint, magneticForce, endpointFade, sampleOpenPath } from '../lib/stellarator-math.ts';

const almost = (actual, expected, eps = 1e-10) => actual.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<eps));

test('coordinate conversion is right handed and preserves magnetic-force direction',()=>{
  const velocity=[1,2,3], field=[-2,4,1];
  almost(cross(toScenePoint(velocity),toScenePoint(field)),toScenePoint(cross(velocity,field)));
  almost(toScenePoint([0,0,1]),[0,1,0]);
});
test('positive-ion magnetic force bends the displayed gyration inward without doing work',()=>{
  const B=[0,0,1],v=[0,-1,0],force=magneticForce(v,B);
  almost(force,[-1,0,0]);assert.equal(force.reduce((n,f,i)=>n+f*v[i],0),0);
  almost(magneticForce(v,B,-1),[1,0,0]);
});
test('open field paths fade at wraps and never interpolate a false closing chord',()=>{
  const points=[[1,0,0],[1,1,0],[0,1,1]];
  almost(sampleOpenPath(points,1),points[2]);
  almost(sampleOpenPath(points,0),points[0]);
  assert.equal(endpointFade(0),0);assert.equal(endpointFade(1),0);assert.equal(endpointFade(.5),1);
  assert.ok(endpointFade(.999)<.05);
});
test('field data contains 16 finite open paths and retained numerical provenance',()=>{
  const data=JSON.parse(readFileSync(new URL('../public/data/stellarator-fieldlines.json',import.meta.url)));
  assert.equal(data.paths.length,16);
  for(const path of data.paths){
    assert.equal(path.points.length,1921);assert.equal(path.closed,false);
    assert.ok(path.points.flat().every(Number.isFinite));
    assert.ok(Math.hypot(...path.points[0].map((v,i)=>v-path.points.at(-1)[i]))>.001);
    for(let i=1;i<path.points.length;i++)assert.ok(Math.hypot(...path.points[i].map((v,j)=>v-path.points[i-1][j]))<.3);
  }
});
test('machine asset retains the separately addressable plasma boundary with UVs',()=>{
  const buffer=readFileSync(new URL('../public/images/stellarator.glb',import.meta.url));
  assert.equal(buffer.toString('utf8',0,4),'glTF');
  const length=buffer.readUInt32LE(12),gltf=JSON.parse(buffer.toString('utf8',20,20+length));
  const plasma=gltf.nodes.find(node=>node.name==='plasma_surface');assert.ok(plasma);
  const attributes=gltf.meshes[plasma.mesh].primitives[0].attributes;
  assert.ok('TEXCOORD_0' in attributes);assert.ok('NORMAL' in attributes);
  assert.ok(gltf.nodes.some(node=>node.name.startsWith('coil_nonplanar_')));
  assert.ok(gltf.nodes.some(node=>node.name.startsWith('coil_planar_')));
  assert.ok(gltf.nodes.some(node=>node.name.startsWith('vessel_')));
});
