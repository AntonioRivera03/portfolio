import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { toScenePoint, type XYZ } from './stellarator-math';

export type StellaratorMode = 'form' | 'magnetic' | 'particle';
export type StellaratorController = {
  setMode: (mode: StellaratorMode) => void;
  setPaused: (paused: boolean) => void;
  reset: () => void;
  dispose: () => void;
};
type FieldData = { paths: { points: XYZ[] }[] };
const DEFAULT_ROTATION = { x: 0, y: -.1 };
const PARTICLE_TIME_SCALE = .525;

function releaseObject(root: T.Object3D) {
  const geometries = new Set<T.BufferGeometry>();
  const materials = new Set<T.Material>();
  root.traverse(object => {
    if (object instanceof T.Mesh || object instanceof T.Line || object instanceof T.Points) {
      geometries.add(object.geometry);
      (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
    }
  });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}

function createOverheadEnvironment(renderer:T.WebGLRenderer) {
  const studio=new T.Scene();
  studio.background=new T.Color(.045,.055,.075);
  // Metals reflect the light rig: keep the broad bright source above the machine.
  const softbox=new T.Mesh(new T.PlaneGeometry(8,6),new T.MeshBasicMaterial({
    color:new T.Color(12,11.5,10.5),toneMapped:false,
  }));
  softbox.position.set(1.2,9,2);softbox.lookAt(0,0,0);studio.add(softbox);
  const fill=new T.Mesh(new T.PlaneGeometry(5,3),new T.MeshBasicMaterial({
    color:new T.Color(.45,.5,.6),toneMapped:false,
  }));
  fill.position.set(0,4,10);fill.lookAt(0,0,0);studio.add(fill);
  const generator=new T.PMREMGenerator(renderer);
  try {return generator.fromScene(studio,.015);}
  finally {releaseObject(studio);generator.dispose();}
}

const plasmaVertex = `
  varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
  void main(){
    vUv = uv; vec4 view = modelViewMatrix * vec4(position,1.);
    vNormal = normalize(normalMatrix*normal); vView=normalize(-view.xyz);
    gl_Position=projectionMatrix*view;
  }
`;
const plasmaFragment = `
  uniform float uTime; uniform float uOpacity; uniform float uMode;
  varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
  void main(){
    float rim = pow(1.-abs(dot(normalize(vNormal),normalize(vView))),1.7);
    float filaments = pow(.5+.5*sin(vUv.y*94.248 + vUv.x*31.416 - uTime*1.4 + .7*sin(vUv.x*62.832)),9.);
    float cloud = .5+.5*sin(vUv.x*31.416+uTime*.38)*sin(vUv.y*18.85-uTime*.23);
    vec3 cold=vec3(.10,.47,1.); vec3 hot=vec3(.73,.14,1.);
    vec3 color=mix(cold,hot,cloud*.8);
    color += vec3(.26,.48,.58)*filaments;
    if(uMode<.5) color=vec3(.12,.75,.77);
    float alpha=uOpacity*(.10+rim*.62+filaments*.19);
    gl_FragColor=vec4(color*(1.+rim*.6),alpha);
  }
`;
const particleVertex = `
  uniform sampler2D uPaths;
  uniform float uSamples; uniform float uRows; uniform float uTime;
  uniform float uRatio; uniform float uOpacity;
  attribute vec4 aParticle;
  attribute float aSize;
  varying float vAlpha; varying vec3 vColor;
  vec3 pointOnPath(float p,float row){
    float n=clamp(p,0.,1.)*(uSamples-1.);
    float a=floor(n), b=min(a+1.,uSamples-1.);
    return mix(texture2D(uPaths,vec2((a+.5)/uSamples,(row+.5)/uRows)).xyz,
      texture2D(uPaths,vec2((b+.5)/uSamples,(row+.5)/uRows)).xyz,fract(n));
  }
  void main(){
    float p=fract(aParticle.y+uTime*aParticle.z*aParticle.w);
    vec3 pos=pointOnPath(p,aParticle.x);
    vec3 tangent=normalize(pointOnPath(min(p+.0004,1.),aParticle.x)-pointOnPath(max(p-.0004,0.),aParticle.x));
    vec3 axis=abs(tangent.y)>.9?vec3(1.,0.,0.):vec3(0.,1.,0.);
    vec3 normal=normalize(cross(tangent,axis)), binormal=cross(tangent,normal);
    float signCharge=mod(aParticle.x+floor(aParticle.y*137.),2.)<1.?1.:-1.;
    float angle=-signCharge*uTime*8.+aParticle.y*628.;
    pos+=(normal*cos(angle)+binormal*sin(angle))*(.012+.025*fract(aParticle.y*43.));
    vec4 mv=modelViewMatrix*vec4(pos,1.);
    gl_Position=projectionMatrix*mv;
    gl_PointSize=clamp(aSize*uRatio*(11./max(-mv.z,1.)),1.2,8.);
    vAlpha=smoothstep(0.,.018,p)*smoothstep(0.,.018,1.-p)*uOpacity;
    vColor=mix(vec3(.28,.68,1.),vec3(1.,.42,.88),fract(aParticle.y*17.));
  }
`;
const particleFragment = `
  varying float vAlpha; varying vec3 vColor;
  void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;
    float glow=exp(-r*r*5.);gl_FragColor=vec4(vColor*(1.+glow),glow*vAlpha);
  }
`;

/** Builds a data-derived machine with vacuum field traces. Never simulates plasma equilibrium at runtime. */
export async function createStellaratorScene(
  host: HTMLDivElement,
  options: { signal: AbortSignal; mode: StellaratorMode; paused: boolean; onContext: (available: boolean) => void },
): Promise<StellaratorController> {
  const [modelResponse, fieldResponse] = await Promise.all([
    fetch('/images/stellarator.glb', { signal: options.signal }),
    fetch('/data/stellarator-fieldlines.json', { signal: options.signal }),
  ]);
  if (!modelResponse.ok || !fieldResponse.ok) throw new Error('Stellarator assets unavailable');
  const [buffer, rawData] = await Promise.all([modelResponse.arrayBuffer(), fieldResponse.json()]);
  const field = rawData as FieldData;
  if (!field.paths?.length || field.paths.some(path => path.points.length < 4)) throw new Error('Invalid field paths');
  const gltf = await new GLTFLoader().parseAsync(buffer, '/images/');
  if (options.signal.aborted) { releaseObject(gltf.scene); throw new DOMException('Aborted','AbortError'); }
  let renderer: T.WebGLRenderer;
  try { renderer = new T.WebGLRenderer({ alpha:true, antialias:true, powerPreference:'low-power' }); }
  catch (error) { releaseObject(gltf.scene); throw error; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));
  renderer.setClearColor(0x111310,0);
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.12;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden','true'); host.appendChild(renderer.domElement);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(35,1,.1,100);
  camera.position.set(6.4,6.0,9.2); camera.lookAt(0,0,0);
  let environment=createOverheadEnvironment(renderer);scene.environment=environment.texture;
  const key=new T.DirectionalLight(0xfff3e5,4.5);key.position.set(1.2,9,2);scene.add(key);
  key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-3.8,right:3.8,top:3.8,bottom:-3.8,near:.5,far:18});
  key.shadow.camera.updateProjectionMatrix();key.shadow.bias=-.0002;key.shadow.normalBias=.006;
  const machine = new T.Group(); scene.add(machine);
  machine.add(gltf.scene);
  const bounds=new T.Box3().setFromObject(gltf.scene);
  const extent=bounds.getSize(new T.Vector3());
  // A shared scalar preserves alignment of the SI coil, boundary and trace datasets.
  machine.scale.setScalar(5.8/Math.max(extent.x,extent.y,extent.z));
  const plasmaMaterial=new T.ShaderMaterial({vertexShader:plasmaVertex,fragmentShader:plasmaFragment,
    uniforms:{uTime:{value:0},uOpacity:{value:0},uMode:{value:0}},transparent:true,depthWrite:false,
    side:T.DoubleSide,blending:T.AdditiveBlending});
  const hardware: {mesh:T.Mesh; material:T.MeshStandardMaterial; opacity:number; category:string}[]=[];
  let plasma: T.Mesh | undefined;
  gltf.scene.traverse(object => {
    if (!(object instanceof T.Mesh)) return;
    if (object.name.startsWith('plasma_surface')) {
      const original=Array.isArray(object.material)?object.material:[object.material];original.forEach(m=>m.dispose());
      object.material=plasmaMaterial; object.visible=false;object.renderOrder=4;plasma=object;return;
    }
    const materials=Array.isArray(object.material)?object.material:[object.material];
    materials.forEach(material=>{
      if (!(material instanceof T.MeshStandardMaterial)) return;
      material.envMapIntensity=.8;
      object.receiveShadow=true;
      const category=object.name.startsWith('coil_')?'coil':object.name.startsWith('vessel_')?'vessel':'support';
      hardware.push({mesh:object,material,opacity:material.opacity,category});
    });
  });
  const paths=field.paths.map(path=>path.points.map(point=>new T.Vector3(...toScenePoint(point))));
  const fieldGroup=new T.Group();machine.add(fieldGroup);fieldGroup.visible=false;
  const lineMaterials:T.LineBasicMaterial[]=[];
  paths.forEach((points,index)=>{
    const material=new T.LineBasicMaterial({color:index%3===0?0xcaff85:0x63e6f3,transparent:true,opacity:.75,depthWrite:false});
    lineMaterials.push(material);
    const line=new T.Line(new T.BufferGeometry().setFromPoints(points),material);line.renderOrder=5;fieldGroup.add(line);
  });
  // Stationary arrowheads indicate +B; the magnetic field does not stream through the machine.
  const arrowGeometry=new T.ConeGeometry(.048,.18,5);
  const arrowMaterial=new T.MeshBasicMaterial({color:0xb6ffdc,transparent:true,opacity:.9,depthWrite:false});
  const arrowCount=Math.min(paths.length,12)*5;
  const arrows=new T.InstancedMesh(arrowGeometry,arrowMaterial,arrowCount);arrows.renderOrder=6;
  const dummy=new T.Object3D(); const yAxis=new T.Vector3(0,1,0);
  let arrowIndex=0;
  paths.slice(0,12).forEach((points,pathIndex)=>{
    for(let j=0;j<5;j++){
      const index=Math.min(points.length-2,Math.floor(points.length*(.08+j*.18+pathIndex*.002)));
      dummy.position.copy(points[index]);dummy.quaternion.setFromUnitVectors(yAxis,points[index+1].clone().sub(points[index]).normalize());dummy.updateMatrix();arrows.setMatrixAt(arrowIndex++,dummy.matrix);
    }
  });fieldGroup.add(arrows);
  // A local positive-ion force glyph. Gyro radius and vector lengths are enlarged for visibility.
  const probeGroup=new T.Group();fieldGroup.add(probeGroup);
  const probePath=paths[paths.length-1], probeIndex=Math.floor(probePath.length*.08);
  const probeCenter=probePath[probeIndex].clone();
  const bDirection=probePath[probeIndex+1].clone().sub(probeCenter).normalize();
  const nDirection=new T.Vector3().crossVectors(bDirection,new T.Vector3(0,1,0)).normalize();
  const binormal=new T.Vector3().crossVectors(bDirection,nDirection).normalize();
  const ion=new T.Mesh(new T.SphereGeometry(.075,12,8),new T.MeshBasicMaterial({color:0xffd18a}));probeGroup.add(ion);
  const bArrow=new T.ArrowHelper(bDirection,probeCenter,.85,0x67e6ff,.18,.085);
  const vArrow=new T.ArrowHelper(nDirection,probeCenter,.75,0xffd18a,.18,.08);
  const fArrow=new T.ArrowHelper(nDirection,probeCenter,.6,0xff8392,.17,.08);
  probeGroup.add(bArrow,vArrow,fArrow);
  // Vertex-texture animation follows precomputed paths with no per-frame CPU particle uploads.
  const samples=2048;
  const pathTextureArray=new Float32Array(samples*paths.length*4);
  paths.forEach((points,row)=>{
    for(let i=0;i<samples;i++){
      const progress=i/(samples-1)*(points.length-1),a=Math.floor(progress),b=Math.min(a+1,points.length-1),f=progress-a;
      const pos=points[a].clone().lerp(points[b],f),offset=(row*samples+i)*4;
      pathTextureArray[offset]=pos.x;pathTextureArray[offset+1]=pos.y;pathTextureArray[offset+2]=pos.z;pathTextureArray[offset+3]=1;
    }
  });
  const pathTexture=new T.DataTexture(pathTextureArray,samples,paths.length,T.RGBAFormat,T.FloatType);
  pathTexture.needsUpdate=true;
  const particleCount=window.matchMedia('(max-width:600px)').matches?2400:5200;
  const particleGeometry=new T.BufferGeometry();
  particleGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(particleCount*3),3));
  const parameters=new Float32Array(particleCount*4),sizes=new Float32Array(particleCount);
  for(let i=0;i<particleCount;i++){
    parameters[i*4]=i%paths.length;parameters[i*4+1]=(i*.61803398875)%1;
    parameters[i*4+2]=.018+((i*.41421356237)%1)*.032;
    parameters[i*4+3]=Math.floor(i/paths.length)%2===0?1:-1;sizes[i]=1.6+(i%9)/7;
  }
  particleGeometry.setAttribute('aParticle',new T.BufferAttribute(parameters,4));
  particleGeometry.setAttribute('aSize',new T.BufferAttribute(sizes,1));
  const particleMaterial=new T.ShaderMaterial({vertexShader:particleVertex,fragmentShader:particleFragment,
    uniforms:{uPaths:{value:pathTexture},uSamples:{value:samples},uRows:{value:paths.length},uTime:{value:0},uRatio:{value:renderer.getPixelRatio()},uOpacity:{value:1}},
    transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  const particles=new T.Points(particleGeometry,particleMaterial);particles.frustumCulled=false;particles.visible=false;particles.renderOrder=8;machine.add(particles);
  const target={x:DEFAULT_ROTATION.x,y:DEFAULT_ROTATION.y};
  let disposed=false,frame=0,visible=true,contextAvailable=true,paused=options.paused,mode:StellaratorMode=options.mode;
  let dirty=true,last=0,time=0,dragging=false,previousX=0,previousY=0;
  let opacityTarget=0,opacityCurrent=0;
  function applyMode(next:StellaratorMode){
    mode=next;dirty=true;
    key.castShadow=mode==='form';renderer.shadowMap.enabled=mode==='form';
    fieldGroup.visible=mode==='magnetic';particles.visible=mode==='particle';
    if(plasma)plasma.visible=mode!=='form';
    plasmaMaterial.uniforms.uMode.value=mode==='particle'?1:0;
    opacityTarget=mode==='particle'?.86:mode==='magnetic'?.19:0;
    hardware.forEach(({mesh,material,opacity,category})=>{
      // Keep only a ghost of the coil system in the explanatory views.
      mesh.visible=mode==='form'||category==='coil';
      mesh.castShadow=mode==='form';
      material.transparent=mode!=='form'||opacity<1;
      material.opacity=mode==='form'?opacity:mode==='magnetic'?.13:.07;
      material.depthWrite=mode==='form';material.needsUpdate=true;
    });
  }
  function resize(){
    const box=host.getBoundingClientRect();renderer.setSize(box.width,box.height,false);
    camera.aspect=box.width/Math.max(box.height,1);camera.updateProjectionMatrix();dirty=true;schedule();
  }
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();
  const intersectionObserver=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;dirty=true;schedule();},{rootMargin:'80px'});intersectionObserver.observe(host);
  function pointerDown(event:PointerEvent){dragging=true;previousX=event.clientX;previousY=event.clientY;host.setPointerCapture(event.pointerId);host.classList.add('is-dragging');}
  function pointerMove(event:PointerEvent){if(!dragging)return;target.y+=(event.clientX-previousX)*.006;target.x+=(event.clientY-previousY)*.004;target.x=Math.max(-1.3,Math.min(1.3,target.x));previousX=event.clientX;previousY=event.clientY;dirty=true;schedule();}
  function pointerUp(){dragging=false;host.classList.remove('is-dragging');}
  function keyDown(event:KeyboardEvent){
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;event.preventDefault();
    if(event.key==='Home'){target.x=DEFAULT_ROTATION.x;target.y=DEFAULT_ROTATION.y;}
    else if(event.key==='ArrowLeft')target.y-=.15;else if(event.key==='ArrowRight')target.y+=.15;
    else if(event.key==='ArrowUp')target.x-=.15;else target.x+=.15;
    dirty=true;schedule();
  }
  function visibilityChange(){dirty=true;last=0;schedule();}
  function contextLost(event:Event){event.preventDefault();contextAvailable=false;options.onContext(false);}
  function contextRestored(){
    try {
      const replacement=createOverheadEnvironment(renderer);
      environment.dispose();
      environment=replacement;scene.environment=environment.texture;
      contextAvailable=true;dirty=true;options.onContext(true);schedule();
    } catch {contextAvailable=false;options.onContext(false);}
  }
  host.addEventListener('pointerdown',pointerDown);host.addEventListener('pointermove',pointerMove);host.addEventListener('pointerup',pointerUp);host.addEventListener('pointercancel',pointerUp);host.addEventListener('keydown',keyDown);
  document.addEventListener('visibilitychange',visibilityChange);
  renderer.domElement.addEventListener('webglcontextlost',contextLost);renderer.domElement.addEventListener('webglcontextrestored',contextRestored);
  function updateProbe(){
    const angle=-time*.7;
    const radial=nDirection.clone().multiplyScalar(Math.cos(angle)).addScaledVector(binormal,Math.sin(angle));
    const velocity=nDirection.clone().multiplyScalar(Math.sin(angle)).addScaledVector(binormal,-Math.cos(angle));
    ion.position.copy(probeCenter).addScaledVector(radial,.27);
    bArrow.position.copy(ion.position);vArrow.position.copy(ion.position);fArrow.position.copy(ion.position);
    vArrow.setDirection(velocity);fArrow.setDirection(new T.Vector3().crossVectors(velocity,bDirection).normalize());
  }
  function schedule(){if(!frame&&!disposed&&visible&&!document.hidden&&contextAvailable)frame=requestAnimationFrame(tick);}
  function tick(now:number){
    frame=0;if(disposed||!visible||document.hidden||!contextAvailable)return;
    const dt=last?Math.min((now-last)/1000,.045):0;last=now;
    if(!paused)time+=dt;
    const damping=paused?1:Math.min(1,dt*10+.02);
    machine.rotation.x+=(target.x-machine.rotation.x)*damping;
    machine.rotation.y+=(target.y-machine.rotation.y)*damping;
    opacityCurrent+=(opacityTarget-opacityCurrent)*damping;
    plasmaMaterial.uniforms.uOpacity.value=opacityCurrent;
    plasmaMaterial.uniforms.uTime.value=mode==='particle'?time*PARTICLE_TIME_SCALE:0;
    particleMaterial.uniforms.uTime.value=time*PARTICLE_TIME_SCALE;
    if(mode==='magnetic')updateProbe();
    renderer.render(scene,camera);
    dirty=Math.abs(machine.rotation.x-target.x)>.001||Math.abs(machine.rotation.y-target.y)>.001||Math.abs(opacityTarget-opacityCurrent)>.001;
    // A stationary Form view and any paused scene render only on demand.
    if(dirty||(!paused&&mode!=='form'))schedule();
  }
  applyMode(options.mode);
  // The first live frame matches the selected view at full opacity.
  opacityCurrent=opacityTarget;
  plasmaMaterial.uniforms.uOpacity.value=opacityCurrent;
  machine.rotation.set(target.x,target.y,0);updateProbe();renderer.render(scene,camera);options.onContext(true);schedule();
  return {
    setMode(next){applyMode(next);schedule();},
    setPaused(next){paused=next;dirty=true;last=0;schedule();},
    reset(){target.x=DEFAULT_ROTATION.x;target.y=DEFAULT_ROTATION.y;time=0;dirty=true;schedule();},
    dispose(){
      if(disposed)return;disposed=true;cancelAnimationFrame(frame);resizeObserver.disconnect();intersectionObserver.disconnect();
      host.removeEventListener('pointerdown',pointerDown);host.removeEventListener('pointermove',pointerMove);host.removeEventListener('pointerup',pointerUp);host.removeEventListener('pointercancel',pointerUp);host.removeEventListener('keydown',keyDown);
      document.removeEventListener('visibilitychange',visibilityChange);renderer.domElement.removeEventListener('webglcontextlost',contextLost);renderer.domElement.removeEventListener('webglcontextrestored',contextRestored);
      releaseObject(scene);key.shadow.dispose();plasmaMaterial.dispose();environment.dispose();pathTexture.dispose();renderer.dispose();renderer.domElement.remove();
    },
  };
}
