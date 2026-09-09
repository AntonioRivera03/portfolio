import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { publicAsset } from './site-paths';

export type TrailController = {
  select: (index: number) => void;
  setNight: (value: boolean) => void;
  setPaused: (value: boolean) => void;
  dispose: () => void;
};
type Options = {
  active: number;
  night: boolean;
  paused: boolean;
  onReady: (ready: boolean) => void;
  onMarkers: (points: { x: number; y: number }[]) => void;
};

// Surveyed against the Blender terrain; coordinates are glTF / Three.js Y-up.
export const TRAIL_STOPS = [
  [0, 2.7989, 23],
  [-13, 2.0067, 8],
  [10, 1.5257, -8],
  [-9, 1.2263, -24],
  [8, 3.0234, -38],
  [0, 4.0925, -54],
] as const;

const skyVertex = `varying vec3 vWorld; void main(){ vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world; }`;
const skyFragment = `
  varying vec3 vWorld; uniform float uTime; uniform float uNight;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
  float fbm(vec2 p){return .57*noise(p)+.28*noise(p*2.03)+.13*noise(p*4.09);}
  void main(){
    vec3 dir=normalize(vWorld-cameraPosition);float h=max(dir.y,0.);
    vec3 day=mix(vec3(.79,.83,.73),vec3(.35,.55,.61),smoothstep(0.,.85,h));
    vec3 night=mix(vec3(.25,.36,.42),vec3(.035,.09,.17),smoothstep(0.,.85,h));
    vec3 col=mix(day,night,uNight);
    vec2 cloudUV=dir.xz/(dir.y+.27)*1.7+vec2(uTime*.005,0.);
    float clouds=smoothstep(.48,.72,fbm(cloudUV*3.))*smoothstep(.025,.19,h)*(1.-smoothstep(.72,.94,h));
    col=mix(col,mix(vec3(.94,.89,.71),vec3(.37,.43,.48),uNight),clouds*.8);
    float stars=step(.9984,hash(floor(dir.xz/(dir.y+.1)*530.)))*smoothstep(.15,.5,h)*uNight;
    col+=stars*.48;col+=(hash(gl_FragCoord.xy)-.5)*.028;
    gl_FragColor=vec4(col,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

export async function createTrailScene(
  host: HTMLElement,
  options: Options,
): Promise<TrailController> {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(53, 1, 0.2, 420);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const hemi = new THREE.HemisphereLight('#e2ecdf', '#746746', 2.15);
  const sun = new THREE.DirectionalLight('#fff0ce', 2.9);
  sun.position.set(-35, 65, 35);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -85,
    right: 85,
    top: 80,
    bottom: -80,
    near: 1,
    far: 200,
  });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.15;
  scene.add(hemi, sun);
  const fog = new THREE.Fog('#b9ccc3', 125, 290);
  scene.fog = fog;

  const skyMaterial = new THREE.ShaderMaterial({
    vertexShader: skyVertex,
    fragmentShader: skyFragment,
    uniforms: { uTime: { value: 0 }, uNight: { value: 0 } },
    side: THREE.BackSide,
    depthWrite: false,
  });
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(380, 20, 12),
    skyMaterial,
  );
  scene.add(sky);

  let model: THREE.Group;
  try {
    model = (
      await new GLTFLoader().loadAsync(
        publicAsset('/models/trail/montana-trail.glb'),
      )
    ).scene;
  } catch (error) {
    sky.geometry.dispose();
    skyMaterial.dispose();
    renderer.dispose();
    throw error;
  }
  const windTime = { value: 0 };
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.receiveShadow = true;
    object.castShadow =
      !object.name.includes('Terrain') && !object.name.includes('Trail');
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      material.roughness = 1;
      material.metalness = 0;
      if (object.name.includes('Terrain')) material.color.set('#ffe8b9');
      const isCanopy = object.name.includes('Canop');
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uWindTime = windTime;
        shader.vertexShader =
          'uniform float uWindTime;\n' + shader.vertexShader;
        if (isCanopy)
          shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>\nfloat sway=sin(uWindTime*.7+position.x*.18+position.z*.11);transformed.x+=sway*.055*max(0.,position.y-1.);`,
          );
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>\nfloat grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);gl_FragColor.rgb+=(grain-.5)*.035;`,
        );
      };
      material.customProgramCacheKey = () =>
        `trail-${isCanopy ? 'wind' : 'ground'}`;
    }
  });
  scene.add(model);

  // A small flock follows an elliptical path, far above the pass.
  const birdGeometry = new THREE.BufferGeometry();
  birdGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [-0.55, 0, 0, 0, 0.11, 0.1, 0.55, 0, 0],
      3,
    ),
  );
  const birdMaterial = new THREE.LineBasicMaterial({
    color: '#2c4645',
    transparent: true,
    opacity: 0.7,
  });
  const flock = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const bird = new THREE.Line(birdGeometry, birdMaterial);
    bird.userData.offset = i;
    flock.add(bird);
  }
  scene.add(flock);

  const waypointMaterial = new THREE.MeshBasicMaterial({
    color: '#f7e7bb',
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const waypointGeometry = new THREE.RingGeometry(0.35, 0.52, 24);
  const waypoints = TRAIL_STOPS.map((point) => {
    const ring = new THREE.Mesh(waypointGeometry, waypointMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(point[0], point[1] + 0.18, point[2]);
    scene.add(ring);
    return ring;
  });
  const beaconMaterial = new THREE.MeshBasicMaterial({
    color: '#d5643e',
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const beacon = new THREE.Mesh(
    new THREE.RingGeometry(0.6, 0.72, 32),
    beaconMaterial,
  );
  beacon.rotation.x = -Math.PI / 2;
  scene.add(beacon);
  host.appendChild(renderer.domElement);

  let active = options.active,
    night = options.night,
    paused = options.paused,
    visible = true,
    disposed = false,
    lost = false;
  let frame = 0,
    last = 0,
    time = 0,
    nightAmount = night ? 1 : 0,
    mobile = false,
    initialized = false;
  const pointer = new THREE.Vector2();
  const targetPosition = new THREE.Vector3(),
    targetLook = new THREE.Vector3(),
    look = new THREE.Vector3();
  const dayFog = new THREE.Color('#b9ccc3'),
    nightFog = new THREE.Color('#344d60');
  const daySun = new THREE.Color('#fff0ce'),
    nightSun = new THREE.Color('#99b6de');
  const markerPoints = TRAIL_STOPS.map(
    (p) => new THREE.Vector3(p[0], p[1] + 1, p[2]),
  );
  const projected = new THREE.Vector3();

  function destinations() {
    const travel = active / 5;
    if (mobile) {
      targetPosition.set(32 - travel * 8, 47, 106 - travel * 16);
      targetLook.set(-4, 10, -16 - travel * 8);
    } else {
      targetPosition.set(32 - travel * 11, 30 + travel * 3, 74 - travel * 18);
      targetLook.set(-22 + travel * 4, 14, -20 - travel * 10);
    }
    if (!paused) {
      targetPosition.x += pointer.x * 1.3;
      targetPosition.y += pointer.y * 0.45;
    }
  }
  function schedule() {
    if (!frame && !disposed && !lost && visible && !document.hidden)
      frame = requestAnimationFrame(render);
  }
  function resize() {
    const width = host.clientWidth,
      height = host.clientHeight;
    if (!width || !height) return;
    mobile = width <= 900;
    camera.aspect = width / height;
    camera.fov = mobile ? 61 : 53;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    destinations();
    if (!initialized) {
      camera.position.copy(targetPosition);
      look.copy(targetLook);
      initialized = true;
    }
    schedule();
  }
  function render(stamp: number) {
    frame = 0;
    if (disposed || lost || !visible || document.hidden) return;
    const dt = Math.min((stamp - last) / 1000, 0.05);
    last = stamp;
    if (!paused) time += dt;
    destinations();
    const blend = paused ? 1 : 1 - Math.exp(-dt * 3.3);
    camera.position.lerp(targetPosition, blend);
    look.lerp(targetLook, blend);
    camera.lookAt(look);
    camera.updateMatrixWorld();
    // Keep the sky inside the far plane as the trail camera advances.
    sky.position.copy(camera.position);
    nightAmount = THREE.MathUtils.lerp(
      nightAmount,
      night ? 1 : 0,
      paused ? 1 : 1 - Math.exp(-dt * 2),
    );
    hemi.intensity = THREE.MathUtils.lerp(2.15, 0.95, nightAmount);
    sun.intensity = THREE.MathUtils.lerp(2.9, 0.55, nightAmount);
    sun.color.copy(daySun).lerp(nightSun, nightAmount);
    fog.color.copy(dayFog).lerp(nightFog, nightAmount);
    skyMaterial.uniforms.uTime.value = time;
    skyMaterial.uniforms.uNight.value = nightAmount;
    windTime.value = time;
    flock.children.forEach((bird, i) => {
      const t = time * 0.065 + i * 0.055;
      bird.position.set(
        Math.sin(t) * 23 - 8,
        31 + Math.sin(t * 2 + i) * 0.7 + i * 0.5,
        -58 + Math.cos(t) * 12 + i * 1.5,
      );
      bird.rotation.z = Math.sin(time * 2.4 + i) * 0.13;
      bird.scale.y = 0.75 + Math.sin(time * 3 + i) * 0.25;
    });
    const stop = TRAIL_STOPS[active];
    beacon.position.set(stop[0], stop[1] + 0.2, stop[2]);
    beacon.scale.setScalar(1 + Math.sin(time * 1.7) * 0.13);
    options.onMarkers(
      markerPoints.map((point) => {
        projected.copy(point).project(camera);
        return {
          x: THREE.MathUtils.clamp((projected.x + 1) * 50, 12, 88),
          y: THREE.MathUtils.clamp((1 - projected.y) * 50, 34, 87),
        };
      }),
    );
    renderer.render(scene, camera);
    if (
      !paused ||
      camera.position.distanceToSquared(targetPosition) > 0.0001 ||
      Math.abs(nightAmount - (night ? 1 : 0)) > 0.001
    )
      schedule();
  }
  function move(event: PointerEvent) {
    const rect = host.getBoundingClientRect();
    pointer.set(
      (event.clientX - rect.left) / rect.width - 0.5,
      0.5 - (event.clientY - rect.top) / rect.height,
    );
    schedule();
  }
  function leave() {
    pointer.set(0, 0);
    schedule();
  }
  function onVisibility() {
    last = performance.now();
    schedule();
  }
  function contextLost(event: Event) {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frame);
    frame = 0;
    options.onReady(false);
  }
  function contextRestored() {
    lost = false;
    options.onReady(true);
    schedule();
  }
  const region = host.parentElement!;
  region.addEventListener('pointermove', move, { passive: true });
  region.addEventListener('pointerleave', leave);
  document.addEventListener('visibilitychange', onVisibility);
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        last = performance.now();
        schedule();
      }
    },
    { rootMargin: '80px' },
  );
  visibilityObserver.observe(host);
  resize();
  cancelAnimationFrame(frame);
  frame = 0;
  last = performance.now();
  render(last);
  options.onReady(true);

  return {
    select(index) {
      active = THREE.MathUtils.clamp(index, 0, 5);
      schedule();
    },
    setNight(value) {
      night = value;
      schedule();
    },
    setPaused(value) {
      paused = value;
      last = performance.now();
      schedule();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      region.removeEventListener('pointermove', move);
      region.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.domElement.removeEventListener(
        'webglcontextrestored',
        contextRestored,
      );
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          geometries.add(object.geometry);
          (Array.isArray(object.material)
            ? object.material
            : [object.material]
          ).forEach((material) => materials.add(material));
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      waypoints.length = 0;
    },
  };
}
