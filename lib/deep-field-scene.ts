import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import metadata from '../assets/deep-field/metadata.json';
import { publicAsset } from './site-paths';
import { smoothTravel, gantryPose } from './deep-field-motion';

export type FieldView = 'survey' | 'acquire' | 'signal' | 'service';
export type FieldSettings = {
  active: number;
  view: FieldView;
  paused: boolean;
};
export type FieldController = {
  configure: (next: FieldSettings) => void;
  reset: () => void;
  dispose: () => void;
};

export async function createFieldScene(
  host: HTMLElement,
  options: FieldSettings & {
    signal: AbortSignal;
    labels: (HTMLElement | null)[];
    readout: HTMLElement | null;
    onSelect: (index: number) => void;
    onReady: (value: boolean) => void;
    onInteract: () => void;
  },
): Promise<FieldController> {
  const response = await fetch(
    publicAsset('/models/deep-field/observatory.glb'),
    { signal: options.signal },
  );
  if (!response.ok) throw new Error('Observatory unavailable');
  const buffer = await response.arrayBuffer();
  options.signal.throwIfAborted();
  const gltf = await new GLTFLoader().parseAsync(buffer, '');
  function disposeObject(root: THREE.Object3D) {
    const gs = new Set<THREE.BufferGeometry>(),
      ms = new Set<THREE.Material>();
    root.traverse((node) => {
      if (node instanceof THREE.Mesh || node instanceof THREE.Line) {
        gs.add(node.geometry);
        (Array.isArray(node.material)
          ? node.material
          : [node.material]
        ).forEach((m) => ms.add(m));
      }
    });
    gs.forEach((g) => g.dispose());
    ms.forEach((m) => m.dispose());
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
  renderer.setPixelRatio(
    Math.min(devicePixelRatio, host.clientWidth < 600 ? 1.25 : 1.6),
  );
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.03;
  renderer.setClearColor('#c0cbc9', 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#a5b4b3', 100, 260);
  const pmrem = new THREE.PMREMGenerator(renderer),
    room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04);
  room.dispose();
  pmrem.dispose();
  scene.environment = env.texture;
  scene.environmentIntensity = 0.3;
  scene.add(new THREE.HemisphereLight('#e7f2f4', '#726b58', 2.3));
  const sun = new THREE.DirectionalLight('#fff0d6', 4.1);
  sun.position.set(-65, 80, 48);
  sun.target.position.set(0, 0, -8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -65,
    right: 65,
    top: 68,
    bottom: -55,
    near: 1,
    far: 230,
  });
  sun.shadow.normalBias = 0.12;
  sun.shadow.bias = -0.0002;
  scene.add(sun, sun.target);
  const assembly = gltf.scene;
  scene.add(assembly);
  const rigs = metadata.stations.map((s) => ({
    root: assembly.getObjectByName(s.name)!,
    azimuth: assembly.getObjectByName(s.azimuth.name)!,
    elevation: assembly.getObjectByName(s.elevation.name)!,
    azimuthBase: s.azimuth.baseRadians,
    elevationBase: s.elevation.baseRadians,
  }));
  const bridge = assembly.getObjectByName('Gantry_Bridge')!,
    trolley = assembly.getObjectByName('Gantry_Trolley')!,
    hoist = assembly.getObjectByName('Gantry_Hoist')!,
    cables = assembly.getObjectByName('Gantry_Cables')!;
  const fans = Array.from({ length: 4 }, (_, i) =>
    assembly.getObjectByName(`CoolingFan_${i}`),
  );
  if (
    rigs.some((r) => !r.root || !r.azimuth || !r.elevation) ||
    !bridge ||
    !trolley ||
    !hoist ||
    !cables
  ) {
    disposeObject(scene);
    env.dispose();
    renderer.dispose();
    throw new Error('Observatory rig incomplete');
  }
  assembly.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.castShadow = !node.name.startsWith('Terrain');
      node.receiveShadow = true;
    }
  });
  // Fade only the distant ground into the original photographic landscape plate.
  // The engineered site and every articulated assembly remain opaque.
  const ground = assembly.getObjectByName('Terrain_terrain');
  if (
    ground instanceof THREE.Mesh &&
    ground.material instanceof THREE.MeshStandardMaterial
  ) {
    const material = ground.material;
    material.transparent = true;
    material.depthWrite = false;
    ground.renderOrder = -2;
    material.onBeforeCompile = (shader) => {
      shader.vertexShader =
        'varying vec2 fieldWorldXZ;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nfieldWorldXZ = (modelMatrix * vec4(position, 1.0)).xz;',
      );
      shader.fragmentShader =
        'varying vec2 fieldWorldXZ;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        '#include <color_fragment>\ndiffuseColor.a *= 1.0 - smoothstep(95.0, 205.0, length(fieldWorldXZ));',
      );
    };
    material.customProgramCacheKey = () => 'deep-field-ground-fade-v1';
  }
  const camera = new THREE.PerspectiveCamera(38, 1, 0.3, 650);
  camera.position.set(70, 35, 95);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 6, -7);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.rotateSpeed = 0.34;
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.update();
  const signalMaterial = new THREE.LineBasicMaterial({
    color: '#91f4e6',
    transparent: true,
    opacity: 0.8,
    depthTest: false,
    toneMapped: false,
  });
  const packetMaterial = new THREE.MeshBasicMaterial({
    color: '#d6fff3',
    depthTest: false,
    toneMapped: false,
  });
  const packetGeometry = new THREE.SphereGeometry(0.2, 7, 5);
  const paths = metadata.signalTrunks.map((points) => {
    const ps = points.map((p) => new THREE.Vector3(p[0], 0.55, p[2]));
    if (ps[ps.length - 1].x !== -4)
      ps.push(new THREE.Vector3(-4, 0.55, ps[ps.length - 1].z));
    ps.push(
      new THREE.Vector3(-4, 0.55, 13),
      new THREE.Vector3(-6, 0.55, 13),
      new THREE.Vector3(-17, 3.4, 15),
    );
    const curve = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 1; i < ps.length; i++)
      if (ps[i].distanceTo(ps[i - 1]) > 0.01)
        curve.add(new THREE.LineCurve3(ps[i - 1], ps[i]));
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ps),
      signalMaterial.clone(),
    );
    line.renderOrder = 5;
    const packets = Array.from({ length: 5 }, () => {
      const p = new THREE.Mesh(packetGeometry, packetMaterial);
      p.renderOrder = 6;
      return p;
    });
    scene.add(line, ...packets);
    return { line, curve, packets };
  });
  signalMaterial.dispose();
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: '#def5db',
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1, 1.022, 96),
    ringMaterial,
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.12;
  scene.add(ring);
  const receiverLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 4 }, () => new THREE.Vector3()),
    ),
    new THREE.LineDashedMaterial({
      color: '#b0ffff',
      depthTest: false,
      transparent: true,
      opacity: 0.65,
      dashSize: 0.3,
      gapSize: 0.18,
    }),
  );
  receiverLine.renderOrder = 7;
  scene.add(receiverLine);
  host.appendChild(renderer.domElement);
  let settings: FieldSettings = { ...options },
    disposed = false,
    frame = 0,
    visible = true,
    lost = false,
    first = true,
    last = performance.now(),
    time = 0,
    serviceTime = 0,
    lastReadout = 0;
  let width = 1,
    height = 1,
    transition = 1,
    fovFrom = camera.fov,
    fovTo = camera.fov;
  const cameraFrom = camera.position.clone(),
    targetFrom = controls.target.clone(),
    cameraTo = camera.position.clone(),
    targetTo = controls.target.clone();
  const midpoint = new THREE.Vector3(),
    sample = new THREE.Vector3(),
    receiver = new THREE.Vector3();
  function schedule() {
    if (!frame && !disposed && !lost && visible && !document.hidden)
      frame = requestAnimationFrame(render);
  }
  function aim() {
    cameraFrom.copy(camera.position);
    targetFrom.copy(controls.target);
    fovFrom = camera.fov;
    if (settings.view === 'service') {
      cameraTo.fromArray(metadata.cameras.service.position);
      targetTo.fromArray(metadata.cameras.service.target);
      fovTo = 35;
    } else if (settings.view === 'signal') {
      cameraTo.set(55, 64, 71);
      targetTo.set(0, 2, -12);
      fovTo = 40;
    } else if (settings.view === 'acquire') {
      const station = metadata.stations[settings.active],
        scale = station.scale;
      targetTo.set(station.position[0], 10 * scale, station.position[2]);
      cameraTo
        .copy(targetTo)
        .add(new THREE.Vector3(30 * scale, 15 * scale, 42 * scale));
      fovTo = 34;
    } else {
      cameraTo.set(66, 31, 90);
      targetTo.set(0, 6, -9);
      fovTo = 38;
    }
    if (width < 700) {
      fovTo += 10;
      cameraTo
        .sub(targetTo)
        .multiplyScalar(width < 360 ? 1.28 : 1.2)
        .add(targetTo);
    }
    midpoint.lerpVectors(cameraFrom, cameraTo, 0.5);
    midpoint.y =
      Math.max(cameraFrom.y, cameraTo.y) +
      (cameraFrom.distanceTo(cameraTo) > 20 ? 16 : 4);
    transition = 0;
    schedule();
  }
  function render(now: number) {
    frame = 0;
    if (disposed || lost || !visible || document.hidden) return;
    const dt = Math.min((now - last) / 1000, 0.04);
    last = now;
    if (!settings.paused) {
      time += dt;
      if (settings.view === 'service') serviceTime += dt;
    }
    if (transition < 1) {
      transition = settings.paused ? 1 : Math.min(1, transition + dt / 3.2);
      const t = smoothTravel(transition),
        u = 1 - t;
      camera.position
        .copy(cameraFrom)
        .multiplyScalar(u * u)
        .addScaledVector(midpoint, 2 * u * t)
        .addScaledVector(cameraTo, t * t);
      controls.target.lerpVectors(targetFrom, targetTo, t);
      camera.fov = THREE.MathUtils.lerp(fovFrom, fovTo, t);
      camera.updateProjectionMatrix();
    }
    const ease = settings.paused ? 1 : 1 - Math.exp(-dt * 1.6);
    rigs.forEach((rig, i) => {
      const selected = i === settings.active;
      const az =
        rig.azimuthBase +
        (selected && settings.view === 'acquire'
          ? 0.28
          : settings.view === 'signal'
            ? 0.1
            : 0);
      const el =
        settings.view === 'service'
          ? 0.16
          : rig.elevationBase +
            (selected && settings.view === 'acquire' ? 0.12 : 0);
      rig.azimuth.rotation.y = THREE.MathUtils.lerp(
        rig.azimuth.rotation.y,
        az,
        ease,
      );
      rig.elevation.rotation.x = THREE.MathUtils.lerp(
        rig.elevation.rotation.x,
        el,
        ease,
      );
    });
    if (settings.view === 'service') {
      const pose = gantryPose(serviceTime);
      bridge.position.z = pose.bridge;
      trolley.position.x = pose.trolley;
      hoist.position.y = pose.hoist;
      cables.scale.y = pose.cableScale;
    }
    if (!settings.paused)
      fans.forEach((fan, i) => {
        if (fan) fan.rotation.y += dt * (1.3 + i * 0.12);
      });
    const inSignal = settings.view === 'signal';
    paths.forEach((path, i) => {
      path.line.visible = inSignal;
      path.line.material.opacity = i === settings.active ? 0.95 : 0.34;
      path.packets.forEach((packet, j) => {
        packet.visible = inSignal;
        if (inSignal)
          packet.position.copy(
            path.curve.getPoint((time * 0.085 + j / 5 + i * 0.12) % 1),
          );
      });
    });
    const selected = metadata.stations[settings.active];
    ring.position.set(selected.position[0], 0.12, selected.position[2]);
    ring.scale.setScalar(selected.apertureRadius + 2);
    ring.visible = settings.view !== 'service';
    controls.enableDamping = !settings.paused;
    controls.update();
    scene.updateMatrixWorld(true);
    receiverLine.visible = inSignal;
    if (inSignal) {
      receiver.fromArray(selected.receiverLocalToElevation);
      rigs[settings.active].elevation.localToWorld(receiver);
      const points = [
        receiver,
        rigs[settings.active].elevation.getWorldPosition(new THREE.Vector3()),
        rigs[settings.active].azimuth.getWorldPosition(new THREE.Vector3()),
        new THREE.Vector3(selected.position[0], 0.55, selected.position[2]),
      ];
      const position = receiverLine.geometry.getAttribute('position');
      points.forEach((p, i) => position.setXYZ(i, p.x, p.y, p.z));
      position.needsUpdate = true;
      receiverLine.geometry.computeBoundingSphere();
      receiverLine.computeLineDistances();
    }
    options.labels.forEach((label, i) => {
      if (!label) return;
      const s = metadata.stations[i];
      sample.set(s.position[0], 19.3 * s.scale, s.position[2]).project(camera);
      const x = (sample.x * 0.5 + 0.5) * width,
        y = (-sample.y * 0.5 + 0.5) * height;
      label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      label.style.visibility =
        settings.view !== 'service' &&
        sample.z < 1 &&
        x > 25 &&
        x < width - 25 &&
        y > 50 &&
        y < height - 100
          ? 'visible'
          : 'hidden';
    });
    if ((settings.paused || now - lastReadout > 150) && options.readout) {
      const rig = rigs[settings.active];
      options.readout.textContent = `AZ ${THREE.MathUtils.radToDeg(rig.azimuth.rotation.y).toFixed(1)}° / EL ${(90 - THREE.MathUtils.radToDeg(rig.elevation.rotation.x)).toFixed(1)}°`;
      lastReadout = now;
    }
    renderer.render(scene, camera);
    if (first) {
      first = false;
      options.onReady(true);
    }
    if (!settings.paused) schedule();
  }
  function resize() {
    const oldBand = width < 360 ? 0 : width < 700 ? 1 : 2;
    width = host.clientWidth;
    height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const newBand = width < 360 ? 0 : width < 700 ? 1 : 2;
    if (newBand !== oldBand) aim();
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
  function interact() {
    transition = 1;
    options.onInteract();
  }
  const raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  let down = { x: 0, y: 0 };
  function pointerDown(e: PointerEvent) {
    down = { x: e.clientX, y: e.clientY };
  }
  function pointerUp(e: PointerEvent) {
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / width) * 2 - 1,
      (-(e.clientY - rect.top) / height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const roots = rigs.map((r) => r.root),
      hit = raycaster.intersectObjects(roots, true)[0];
    if (!hit) return;
    let node: THREE.Object3D | null = hit.object;
    while (node && !roots.includes(node)) node = node.parent;
    if (node) options.onSelect(roots.indexOf(node));
  }
  controls.addEventListener('start', interact);
  controls.addEventListener('change', schedule);
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
    { rootMargin: '50px' },
  );
  observer.observe(host);
  resize();
  aim();
  return {
    configure(next) {
      const changed =
        next.active !== settings.active || next.view !== settings.view;
      if (next.view === 'service' && settings.view !== 'service')
        serviceTime = 0;
      settings = { ...next };
      if (changed) aim();
      last = performance.now();
      schedule();
    },
    reset: aim,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      observer.disconnect();
      controls.removeEventListener('start', interact);
      controls.removeEventListener('change', schedule);
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
      sun.shadow.dispose();
      env.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
