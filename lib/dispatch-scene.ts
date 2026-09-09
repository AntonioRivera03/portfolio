import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { publicAsset } from './site-paths';
import metadata from '../assets/dispatch/metadata.json';

const projectNodes = [2, 1, 4, 3, 5, 0];
type Settings = {
  active: number;
  focused: boolean;
  paused: boolean;
  signals: boolean;
};
export type DispatchController = {
  configure: (next: Settings) => void;
  reset: () => void;
  dispose: () => void;
};

export async function createDispatchScene(
  host: HTMLElement,
  options: Settings & {
    signal: AbortSignal;
    labels: (HTMLElement | null)[];
    onSelect: (index: number) => void;
    onReady: (ready: boolean) => void;
  },
): Promise<DispatchController> {
  const response = await fetch(publicAsset('/models/dispatch/dispatch.glb'), {
    signal: options.signal,
  });
  if (!response.ok) throw new Error('Network asset unavailable');
  const buffer = await response.arrayBuffer();
  options.signal.throwIfAborted();
  const gltf = await new GLTFLoader().parseAsync(buffer, '');
  function disposeObject(root: THREE.Object3D) {
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>();
    root.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
        geometries.add(o.geometry);
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
          materials.add(m),
        );
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  }
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
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.87;
  renderer.setClearColor('#0b1016', 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer),
    room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04);
  room.dispose();
  pmrem.dispose();
  scene.environment = env.texture;
  scene.environmentIntensity = 0.52;
  scene.add(new THREE.HemisphereLight('#c5dce7', '#111821', 1.9));
  const key = new THREE.DirectionalLight('#ebf5ff', 3.6);
  key.position.set(-8, 16, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#b5d86d', 1.3);
  rim.position.set(5, 8, -12);
  scene.add(rim);
  const assembly = gltf.scene;
  scene.add(assembly);
  const nodes = metadata.nodes.map((n) => assembly.getObjectByName(n.name)!);
  if (nodes.some((n) => !n)) {
    disposeObject(scene);
    env.dispose();
    renderer.dispose();
    throw new Error('Incomplete network asset');
  }
  const rigs = metadata.mechanicalRigs.map((r) => ({
    object: assembly.getObjectByName(r.name),
    node: Number(r.parent.slice(-1)),
    range: r.range[1],
  }));
  const camera = new THREE.OrthographicCamera(-14, 14, 9, -9, 0.1, 150);
  camera.position.set(17, 23, 22);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.4, 0);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.rotateSpeed = 0.35;
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = Math.PI * 0.45;
  controls.update();
  const routeMaterial = new THREE.LineBasicMaterial({
    color: '#c4f86f',
    transparent: true,
    opacity: 0.7,
    depthTest: false,
  });
  const packetMaterial = new THREE.MeshBasicMaterial({
    color: '#e0ffab',
    toneMapped: false,
  });
  const packetGeometry = new THREE.SphereGeometry(0.065, 6, 4);
  const routes = nodes.map((node, i) => {
    const [x, , z] = metadata.nodes[i].position;
    const points = [
      new THREE.Vector3(-8.65, 0.27, 0.08),
      new THREE.Vector3(x, 0.27, 0.08),
      new THREE.Vector3(x, 0.27, z * 0.38),
    ];
    const curve = new THREE.CurvePath<THREE.Vector3>();
    for (let p = 1; p < points.length; p++)
      curve.add(new THREE.LineCurve3(points[p - 1], points[p]));
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      routeMaterial.clone(),
    );
    line.renderOrder = 3;
    const packets = Array.from(
      { length: 4 },
      () => new THREE.Mesh(packetGeometry, packetMaterial),
    );
    scene.add(line, ...packets);
    return { curve, line, packets };
  });
  routeMaterial.dispose();
  const ring = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-2.35, 0, -2.3),
      new THREE.Vector3(2.35, 0, -2.3),
      new THREE.Vector3(2.35, 0, 2.3),
      new THREE.Vector3(-2.35, 0, 2.3),
    ]),
    new THREE.LineBasicMaterial({
      color: '#c4f86f',
      transparent: true,
      opacity: 0.7,
    }),
  );
  scene.add(ring);
  const grid = new THREE.GridHelper(100, 50, '#28343c', '#1b252e');
  grid.position.y = -0.58;
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.35;
  scene.add(grid);
  host.appendChild(renderer.domElement);
  let settings: Settings = { ...options },
    width = 1,
    height = 1,
    frame = 0,
    disposed = false,
    visible = true,
    lost = false,
    first = true;
  let last = performance.now(),
    time = 0,
    transition = 0;
  const cameraFrom = camera.position.clone(),
    targetFrom = controls.target.clone();
  const cameraTo = camera.position.clone(),
    targetTo = controls.target.clone();
  let zoomFrom = 1,
    zoomTo = 1;
  function aim() {
    const selected = metadata.nodes[projectNodes[settings.active]].position;
    cameraFrom.copy(camera.position);
    targetFrom.copy(controls.target);
    zoomFrom = camera.zoom;
    targetTo.set(
      settings.focused ? selected[0] * 0.72 : 0,
      settings.focused ? 1.4 : 0.4,
      settings.focused ? selected[2] * 0.72 : 0,
    );
    cameraTo.copy(targetTo).add(new THREE.Vector3(17, 23, 22));
    zoomTo = settings.focused ? 1.36 : 1;
    transition = 0;
    schedule();
  }
  function schedule() {
    if (!frame && !disposed && visible && !document.hidden && !lost)
      frame = requestAnimationFrame(render);
  }
  const projected = new THREE.Vector3();
  function render(now: number) {
    frame = 0;
    if (disposed || lost || !visible || document.hidden) return;
    const dt = Math.min((now - last) / 1000, 0.04);
    last = now;
    if (!settings.paused) time += dt;
    if (transition < 1) {
      transition = settings.paused ? 1 : Math.min(1, transition + dt / 1.35);
      const t = 1 - Math.pow(1 - transition, 4);
      camera.position.lerpVectors(cameraFrom, cameraTo, t);
      controls.target.lerpVectors(targetFrom, targetTo, t);
      camera.zoom = THREE.MathUtils.lerp(zoomFrom, zoomTo, t);
      camera.updateProjectionMatrix();
    }
    const selectedNode = projectNodes[settings.active],
      easing = settings.paused ? 1 : 1 - Math.exp(-dt * 5);
    nodes.forEach((node, i) => {
      node.position.y = THREE.MathUtils.lerp(
        node.position.y,
        0.22 + (settings.focused && i === selectedNode ? 0.75 : 0),
        easing,
      );
    });
    rigs.forEach((r) => {
      if (r.object)
        r.object.position.y = THREE.MathUtils.lerp(
          r.object.position.y,
          settings.focused && r.node === selectedNode ? r.range : 0,
          easing,
        );
    });
    routes.forEach((route, i) => {
      const active =
        settings.signals && (i === selectedNode || !settings.focused);
      route.line.visible = active;
      route.line.material.opacity = i === selectedNode ? 0.65 : 0.16;
      route.packets.forEach((packet, j) => {
        packet.visible = active;
        if (active)
          packet.position.copy(
            route.curve.getPoint((time * 0.14 + j / 4 + i * 0.17) % 1),
          );
      });
    });
    ring.position.copy(nodes[selectedNode].position);
    ring.position.y += 0.05;
    controls.enableDamping = !settings.paused;
    controls.update();
    scene.updateMatrixWorld(true);
    options.labels.forEach((label, i) => {
      if (!label) return;
      nodes[projectNodes[i]].getWorldPosition(projected);
      projected.y += 2.9;
      projected.project(camera);
      const x = (projected.x * 0.5 + 0.5) * width,
        y = (-projected.y * 0.5 + 0.5) * height;
      const inFrame =
        projected.z < 1 &&
        x > 18 &&
        x < width - 18 &&
        y > 20 &&
        y < height - 30;
      label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      label.style.visibility = inFrame ? 'visible' : 'hidden';
    });
    renderer.render(scene, camera);
    if (first) {
      first = false;
      options.onReady(true);
    }
    if (!settings.paused) schedule();
  }
  function resize() {
    width = host.clientWidth;
    height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height);
    const aspect = width / height;
    const span = Math.max(17.8, 28 / aspect);
    camera.left = (-span * aspect) / 2;
    camera.right = -camera.left;
    camera.top = span / 2;
    camera.bottom = -camera.top;
    camera.updateProjectionMatrix();
    schedule();
  }
  function visibility() {
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
    first = true;
    schedule();
  }
  function interaction() {
    transition = 1;
    cameraFrom.copy(camera.position);
    cameraTo.copy(camera.position);
    targetFrom.copy(controls.target);
    targetTo.copy(controls.target);
    zoomFrom = zoomTo = camera.zoom;
  }
  const raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  let down = { x: 0, y: 0 };
  function pointerDown(event: PointerEvent) {
    down = { x: event.clientX, y: event.clientY };
  }
  function pointerUp(event: PointerEvent) {
    if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) return;
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - bounds.left) / width) * 2 - 1,
      (-(event.clientY - bounds.top) / height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(nodes, true)[0];
    if (!hit) return;
    let object: THREE.Object3D | null = hit.object;
    while (object && !nodes.includes(object)) object = object.parent;
    if (object) options.onSelect(projectNodes.indexOf(nodes.indexOf(object)));
  }
  controls.addEventListener('change', schedule);
  controls.addEventListener('start', interaction);
  renderer.domElement.addEventListener('pointerdown', pointerDown);
  renderer.domElement.addEventListener('pointerup', pointerUp);
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
  document.addEventListener('visibilitychange', visibility);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) visibility();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    { rootMargin: '80px' },
  );
  observer.observe(host);
  resize();
  aim();
  return {
    configure(next) {
      const change =
        next.active !== settings.active || next.focused !== settings.focused;
      settings = { ...next };
      if (change) aim();
      last = performance.now();
      schedule();
    },
    reset() {
      aim();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      observer.disconnect();
      controls.removeEventListener('change', schedule);
      controls.removeEventListener('start', interaction);
      controls.dispose();
      document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.domElement.removeEventListener(
        'webglcontextrestored',
        contextRestored,
      );
      disposeObject(scene);
      env.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
