'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Sculpture() {
  const mount = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState('chrome');
  const [paused, setPaused] = useState(false);
  const state = useRef({ mode: 'chrome', paused: false, reset: 0 });
  state.current.mode = mode;
  state.current.paused = paused;

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPaused(motionQuery.matches);
    const motionChange = () => setPaused(motionQuery.matches);
    motionQuery.addEventListener('change', motionChange);
    async function start() {
      const [T, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
        import('three'), import('three/addons/loaders/GLTFLoader.js'), import('three/addons/environments/RoomEnvironment.js'),
      ]);
      if (disposed || !host) return;
      let renderer;
      try { renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
      catch { return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      renderer.setClearColor(0x111310, 0);
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
      renderer.domElement.setAttribute('aria-hidden', 'true');
      host.appendChild(renderer.domElement);
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(36, 1, 0.1, 100);
      camera.position.set(.2, 1.5, 10.5);
      camera.lookAt(0, 0, 0);
      const pmrem = new T.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const env = pmrem.fromScene(room, .04);
      scene.environment = env.texture;
      room.dispose(); pmrem.dispose();
      const light = new T.DirectionalLight(0xdfff9b, 3);
      light.position.set(-3, 2, 3); scene.add(light);
      const group = new T.Group(); scene.add(group);
      let frame = 0;
      let model: import('three').Group | undefined;
      const meshes: import('three').Mesh[] = [];
      const solids: import('three').MeshStandardMaterial[] = [];
      const wires: import('three').MeshBasicMaterial[] = [];
      const points: import('three').Points[] = [];
      let pointerX = 0, pointerY = 0, rotationX = -.15, rotationY = -.25, drag = false;
      let dragStartX = 0, dragStartY = 0, visible = true, elapsed = 0, last = 0, lastReset = 0, dirty = true;
      const onResize = () => {
        dirty = true;
        const { width, height } = host.getBoundingClientRect();
        renderer.setSize(width, height, false);
        camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix();
      };
      const resize = new ResizeObserver(onResize); resize.observe(host); onResize();
      const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; dirty = true; }, { rootMargin: '100px' }); observer.observe(host);
      const down = (event: PointerEvent) => {
        dirty = true; drag = true; dragStartX = event.clientX; dragStartY = event.clientY;
        host.setPointerCapture(event.pointerId); host.classList.add('is-dragging');
      };
      const move = (event: PointerEvent) => {
        dirty = true;
        const bounds = host.getBoundingClientRect();
        pointerX = (event.clientX - bounds.left) / bounds.width - .5;
        pointerY = (event.clientY - bounds.top) / bounds.height - .5;
        if (drag) { rotationY += (event.clientX - dragStartX) * .006; rotationX += (event.clientY - dragStartY) * .004; dragStartX = event.clientX; dragStartY = event.clientY; }
      };
      const up = () => { drag = false; host.classList.remove('is-dragging'); };
      const leave = () => { pointerX = 0; pointerY = 0; dirty = true; };
      const keys = (event: KeyboardEvent) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
        event.preventDefault(); dirty = true;
        if (event.key === 'Home') { rotationX = -.15; rotationY = -.25; }
        else if (event.key === 'ArrowLeft') rotationY -= .15;
        else if (event.key === 'ArrowRight') rotationY += .15;
        else if (event.key === 'ArrowUp') rotationX -= .15;
        else rotationX += .15;
      };
      host.addEventListener('keydown', keys);
      host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move); host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up); host.addEventListener('pointerleave', leave);
      const releaseModel = (root: import('three').Object3D) => root.traverse((object) => {
        if (object instanceof T.Mesh) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach(m => m.dispose()); }
      });
      cleanup = () => {
        cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect();
        host.removeEventListener('keydown', keys); host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move); host.removeEventListener('pointerup', up); host.removeEventListener('pointercancel', up); host.removeEventListener('pointerleave', leave);
        if (model) releaseModel(model);
        solids.forEach(m => m.dispose()); wires.forEach(m => m.dispose()); points.forEach(p => (p.material as import('three').PointsMaterial).dispose());
        env.dispose(); renderer.dispose(); renderer.domElement.remove();
      };
      try {
        const gltf = await new GLTFLoader().loadAsync('/images/sculpture.glb');
        if (disposed) { releaseModel(gltf.scene); return; }
        model = gltf.scene;
        const box = new T.Box3().setFromObject(model);
        const center = box.getCenter(new T.Vector3());
        const size = box.getSize(new T.Vector3());
        model.position.sub(center); group.scale.setScalar(5.3 / Math.max(size.x, size.y, size.z));
        group.add(model);
        const sourceMeshes: import('three').Mesh[] = [];
        model.traverse(o => { if (o instanceof T.Mesh) sourceMeshes.push(o); });
        sourceMeshes.forEach(mesh => {
          const original = Array.isArray(mesh.material) ? mesh.material : [mesh.material]; original.forEach(m => m.dispose());
          const solid = new T.MeshStandardMaterial({ color: 0xd5d9cf, metalness: 1, roughness: .22, envMapIntensity: 1.5, side: T.DoubleSide });
          const wire = new T.MeshBasicMaterial({ color: 0xcfff80, wireframe: true, transparent: true, opacity: .27 });
          mesh.material = solid; meshes.push(mesh); solids.push(solid); wires.push(wire);
          const dots = new T.Points(mesh.geometry, new T.PointsMaterial({ color: 0xd4ff72, size: .012, transparent: true, opacity: .65, sizeAttenuation: true }));
          dots.visible = false; mesh.add(dots); points.push(dots);
        });
        group.rotation.set(-.15, -.25, -.16);
        renderer.render(scene, camera); setReady(true);
      } catch { cleanup(); return; }
      let previousMode = '';
      let previousPaused = state.current.paused;
      const tick = (now: number) => {
        if (disposed) return;
        frame = requestAnimationFrame(tick);
        const dt = Math.min((now - last) / 1000, .04); last = now;
        if (!visible || document.hidden) return;
        if (state.current.reset !== lastReset) { dirty = true; rotationX = -.15; rotationY = -.25; lastReset = state.current.reset; elapsed = 0; }
        if (previousPaused !== state.current.paused) { dirty = true; previousPaused = state.current.paused; }
        if (previousMode !== state.current.mode) {
          dirty = true;
          meshes.forEach((mesh, i) => { mesh.material = state.current.mode === 'wire' ? wires[i] : solids[i]; mesh.material.visible = state.current.mode !== 'points'; points[i].visible = state.current.mode === 'points'; });
          previousMode = state.current.mode;
        }
        if (state.current.paused && !dirty) return;
        if (!state.current.paused) elapsed += dt;
        const breathing = state.current.paused ? 0 : Math.sin(elapsed * .32) * .13;
        group.rotation.x += (rotationX + (state.current.paused ? 0 : pointerY * .18) - group.rotation.x) * .06;
        group.rotation.y += (rotationY + breathing + (state.current.paused ? 0 : pointerX * .25) - group.rotation.y) * .06;
        group.rotation.z = -.16 + (state.current.paused ? 0 : Math.sin(elapsed * .22) * .08);
        group.position.y = state.current.paused ? 0 : Math.sin(elapsed * .6) * .07;
        renderer.render(scene, camera);
        dirty = Math.abs(group.rotation.x - rotationX) > .001 || Math.abs(group.rotation.y - rotationY) > .001;
      };
      frame = requestAnimationFrame(tick);
    }
    start().catch(() => {});
    return () => { disposed = true; cleanup(); motionQuery.removeEventListener('change', motionChange); };
  }, []);

  return <>
    <div className={`sculpture-frame ${ready ? 'scene-ready' : ''}`}>
      <img className="sculpture-fallback" src="/images/sculpture.png" alt="A flowing sculpture of three twisting, finely pleated chrome ribbons" width="1400" height="1400" fetchPriority="high"/>
      <div className="scene-canvas" ref={mount} tabIndex={ready ? 0 : -1} role="group" aria-label="Interactive chrome sculpture. Drag or use arrow keys to rotate. Press Home to reset."/>
    </div>
    {ready && <div className="scene-ui">
      <div className="scene-hint"><span className="scene-cross">+</span>DRAG TO FIND A NEW PERSPECTIVE</div>
      <div className="scene-controls">
        <Tabs value={mode} onValueChange={value => setMode(String(value))} className="material-tabs"><TabsList aria-label="Sculpture material"><TabsTrigger value="chrome">Form</TabsTrigger><TabsTrigger value="wire">Structure</TabsTrigger><TabsTrigger value="points">Particles</TabsTrigger></TabsList></Tabs>
        <button className="scene-icon-button" onClick={() => setPaused(p => !p)} aria-label={paused ? 'Play sculpture animation' : 'Pause sculpture animation'}>{paused ? <Play size={13}/> : <Pause size={13}/>}</button>
        <button className="scene-icon-button" onClick={() => state.current.reset++} aria-label="Reset sculpture rotation"><RotateCcw size={13}/></button>
      </div>
    </div>}
  </>;
}
