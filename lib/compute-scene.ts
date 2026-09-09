import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { publicAsset } from './site-paths';

type Settings = { exploded: boolean; paused: boolean; layer: number };
export type ComputeController = {
  configure: (settings: Settings) => void;
  reset: () => void;
  dispose: () => void;
};

export async function createComputeScene(
  host: HTMLElement,
  options: Settings & {
    signal: AbortSignal;
    onReady: (ready: boolean) => void;
  },
): Promise<ComputeController> {
  // Fetch before creating GPU resources, so navigation can cancel pending work.
  const response = await fetch(
    publicAsset('/models/systems/compute-stack.glb'),
    { signal: options.signal },
  );
  if (!response.ok) throw new Error('Assembly asset unavailable');
  const buffer = await response.arrayBuffer();
  options.signal.throwIfAborted();
  const gltf = await new GLTFLoader().parseAsync(buffer, '');
  const disposeObject = (root: THREE.Object3D) => {
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>();
    root.traverse((node) => {
      if (node instanceof THREE.Mesh || node instanceof THREE.Line) {
        geometries.add(node.geometry);
        (Array.isArray(node.material)
          ? node.material
          : [node.material]
        ).forEach((m) => materials.add(m));
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };
  if (options.signal.aborted) {
    disposeObject(gltf.scene);
    options.signal.throwIfAborted();
  }
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    });
  } catch (error) {
    disposeObject(gltf.scene);
    throw error;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor('#edeee8', 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.8;
  room.dispose();
  pmrem.dispose();
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
  camera.position.set(10, 9, 13);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2.4, 0);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.45;
  controls.autoRotateSpeed = 0.35;
  controls.minPolarAngle = 0.3;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.update();
  controls.saveState();
  const hemi = new THREE.HemisphereLight('#ffffff', '#87917c', 2.4);
  scene.add(hemi);
  const key = new THREE.DirectionalLight('#fff5e7', 4.2);
  key.position.set(-6, 12, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -7,
    right: 7,
    top: 9,
    bottom: -7,
    near: 1,
    far: 35,
  });
  key.shadow.normalBias = 0.015;
  key.shadow.bias = -0.0003;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#d4e1e2', 2.8);
  rim.position.set(6, 7, -7);
  scene.add(rim);
  const assembly = gltf.scene;
  const layers = Array.from({ length: 5 }, (_, i) =>
    assembly.getObjectByName(`StackLayer_${i}`),
  );
  if (layers.some((layer) => !layer)) {
    environment.dispose();
    controls.dispose();
    renderer.dispose();
    disposeObject(assembly);
    throw new Error('Assembly layers missing');
  }
  assembly.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
  scene.add(assembly);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(25, 25),
    new THREE.ShadowMaterial({ color: '#4a5646', opacity: 0.13 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.51;
  floor.receiveShadow = true;
  scene.add(floor);
  const guides = new THREE.Group();
  const guideMaterial = new THREE.LineDashedMaterial({
    color: '#8c9b80',
    transparent: true,
    opacity: 0.28,
    dashSize: 0.06,
    gapSize: 0.06,
  });
  for (const x of [-2.75, 2.75])
    for (const z of [-2.75, 2.75]) {
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, -0.2, z),
        new THREE.Vector3(x, 5, z),
      ]);
      const line = new THREE.Line(g, guideMaterial);
      line.computeLineDistances();
      guides.add(line);
    }
  scene.add(guides);
  const selectedFrame = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-3.15, 0, -3.15),
      new THREE.Vector3(3.15, 0, -3.15),
      new THREE.Vector3(3.15, 0, 3.15),
      new THREE.Vector3(-3.15, 0, 3.15),
    ]),
    new THREE.LineBasicMaterial({
      color: '#df592b',
      transparent: true,
      opacity: 0.7,
    }),
  );
  scene.add(selectedFrame);
  host.appendChild(renderer.domElement);
  let settings = {
    exploded: options.exploded,
    paused: options.paused,
    layer: options.layer,
  };
  let frame = 0,
    disposed = false,
    lost = false,
    visible = true,
    last = performance.now(),
    time = 0,
    extent = options.exploded ? 1 : 0;
  let width = host.clientWidth,
    height = host.clientHeight,
    first = true;
  function schedule() {
    if (!frame && !disposed && !lost && visible && !document.hidden)
      frame = requestAnimationFrame(render);
  }
  function render(now: number) {
    frame = 0;
    if (disposed || lost || !visible || document.hidden) return;
    const dt = Math.min((now - last) / 1000, 0.04);
    last = now;
    if (!settings.paused) time += dt;
    const target = settings.exploded ? 1 : 0;
    extent = THREE.MathUtils.lerp(
      extent,
      target,
      settings.paused ? 1 : 1 - Math.exp(-dt * 5),
    );
    layers.forEach((layer, i) => {
      if (layer)
        layer.position.y = i * THREE.MathUtils.lerp(0.57, 1.45, extent);
    });
    controls.autoRotate = !settings.paused;
    controls.enableDamping = !settings.paused;
    controls.target.y = THREE.MathUtils.lerp(1.3, 2.65, extent);
    controls.update(dt);
    assembly.position.y = settings.paused ? 0 : Math.sin(time * 0.65) * 0.025;
    selectedFrame.position.y =
      (layers[settings.layer]?.position.y ?? 0) + 0.16 + assembly.position.y;
    guides.scale.y = THREE.MathUtils.lerp(0.48, 1.2, extent);
    guides.visible = extent > 0.03;
    selectedFrame.material.opacity = extent * 0.48;
    renderer.render(scene, camera);
    if (first) {
      first = false;
      options.onReady(true);
    }
    if (!settings.paused || Math.abs(extent - target) > 0.001) schedule();
  }
  function resize() {
    width = host.clientWidth;
    height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.fov = width < 420 ? 43 : 37;
    camera.updateProjectionMatrix();
    schedule();
  }
  function visibility() {
    last = performance.now();
    schedule();
  }
  function lostContext(event: Event) {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frame);
    frame = 0;
    options.onReady(false);
  }
  function restoredContext() {
    lost = false;
    first = true;
    schedule();
  }
  function reset() {
    controls.reset();
    schedule();
  }
  controls.addEventListener('change', schedule);
  renderer.domElement.addEventListener('webglcontextlost', lostContext);
  renderer.domElement.addEventListener('webglcontextrestored', restoredContext);
  document.addEventListener('visibilitychange', visibility);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        last = performance.now();
        schedule();
      } else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    { rootMargin: '60px' },
  );
  observer.observe(host);
  resize();
  return {
    configure(next) {
      settings = { ...next, layer: THREE.MathUtils.clamp(next.layer, 0, 4) };
      last = performance.now();
      schedule();
    },
    reset,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      observer.disconnect();
      controls.removeEventListener('change', schedule);
      controls.dispose();
      document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('webglcontextlost', lostContext);
      renderer.domElement.removeEventListener(
        'webglcontextrestored',
        restoredContext,
      );
      disposeObject(scene);
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
