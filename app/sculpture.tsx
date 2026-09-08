'use client';

import { useEffect, useRef, useState } from 'react';
import { Asterisk } from 'lucide-react';
import { publicAsset } from '@/lib/site-paths';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  StellaratorController,
  StellaratorMode,
} from '@/lib/stellarator-scene';

const MODES = {
  form: {
    label: 'Form',
    title: 'Magnetic coil structure',
    legend: [
      ['#cbd4dc', 'Non-planar magnets'],
      ['#caa977', 'Planar magnets'],
    ],
  },
  magnetic: {
    label: 'Magnetic',
    title: 'Magnetic field geometry',
    legend: [
      ['#67e6ff', 'Magnetic field B'],
      ['#ffd18a', 'Ion velocity v'],
      ['#ff8392', 'Force q(v × B)'],
    ],
  },
  particle: {
    label: 'Particle',
    title: 'Particle motion in a magnetic field',
    legend: [
      ['#69c9ff', 'Passing particles'],
      ['#cd74ff', 'Plasma envelope'],
    ],
  },
};

const FALLBACK_ALT = {
  form: 'Detailed Wendelstein 7-X stellarator model with silver non-planar magnet coils, bronze planar coils, a contoured vacuum vessel and diagnostic ports',
  magnetic:
    'Wendelstein 7-X coil outlines surrounding calculated, twisted magnetic field lines',
  particle:
    'Wendelstein 7-X plasma envelope with illustrative particles distributed along its twisted magnetic field',
};

export default function Sculpture() {
  const mount = useRef<HTMLDivElement>(null);
  const controller = useRef<StellaratorController | null>(null);
  const [mode, setMode] = useState<StellaratorMode>('particle');
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [retry, setRetry] = useState(0);
  const settings = useRef({ mode, paused });
  settings.current = { mode, paused };
  const current = MODES[mode];

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPaused(motion.matches);
    const changed = () => setPaused(motion.matches);
    motion.addEventListener('change', changed);
    return () => motion.removeEventListener('change', changed);
  }, []);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    const abort = new AbortController();
    let disposed = false;
    setUnavailable(false);
    setReady(false);
    import('@/lib/stellarator-scene')
      .then(({ createStellaratorScene }) => {
        if (disposed) return;
        return createStellaratorScene(host, {
          signal: abort.signal,
          mode: settings.current.mode,
          paused: settings.current.paused,
          onContext: (available) => {
            if (!disposed) {
              setReady(available);
              setUnavailable(!available);
            }
          },
        });
      })
      .then((scene) => {
        if (!scene) return;
        if (disposed) {
          scene.dispose();
          return;
        }
        controller.current = scene;
        scene.setMode(settings.current.mode);
        scene.setPaused(settings.current.paused);
      })
      .catch((error) => {
        if (!disposed && error?.name !== 'AbortError') {
          setUnavailable(true);
          setReady(false);
        }
      });
    return () => {
      disposed = true;
      abort.abort();
      controller.current?.dispose();
      controller.current = null;
    };
  }, [retry]);
  useEffect(() => {
    controller.current?.setMode(mode);
  }, [mode]);
  useEffect(() => {
    controller.current?.setPaused(paused);
  }, [paused]);

  return (
    <>
      <div className="stellarator-heading">
        <Asterisk
          className="stellarator-mark"
          strokeWidth={1.4}
          aria-hidden="true"
        />
        <div>
          <span>WENDELSTEIN 7-X</span>
          <small>Stellarator 3D render</small>
        </div>
      </div>
      <div
        className={`sculpture-frame stellarator-frame ${ready ? 'scene-ready' : ''}`}
      >
        <img
          className="sculpture-fallback"
          src={publicAsset(`/images/stellarator-${mode}.png`)}
          alt={FALLBACK_ALT[mode]}
          width="1400"
          height="1400"
          fetchPriority="high"
        />
        <div
          className="scene-canvas"
          ref={mount}
          tabIndex={ready ? 0 : -1}
          role="group"
          aria-label={`${current.label} view of Wendelstein 7-X. Drag or use arrow keys to rotate. Press Home to reset.`}
        />
      </div>
      <div className="scene-ui stellarator-ui">
        <div className="stellarator-caption" aria-live="polite">
          <p>{current.title}</p>
        </div>
        <div className="scene-controls">
          <Tabs
            value={mode}
            onValueChange={(value) => setMode(value as StellaratorMode)}
            className="material-tabs"
          >
            <TabsList aria-label="Stellarator view">
              <TabsTrigger value="form">Form</TabsTrigger>
              <TabsTrigger value="magnetic">Magnetic</TabsTrigger>
              <TabsTrigger value="particle">Particle</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="stellarator-legend">
          {(!ready && mode === 'magnetic'
            ? current.legend.slice(0, 1)
            : current.legend
          ).map(([color, label]) => (
            <span key={label}>
              <i style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
        <p className="stellarator-note">
          {unavailable
            ? 'Still-image mode · Interactive 3D unavailable'
            : ready
              ? 'Drag to explore · Educational visualization'
              : 'Loading interactive 3D…'}
          {unavailable && (
            <button onClick={() => setRetry((n) => n + 1)}>Retry 3D</button>
          )}
        </p>
      </div>
    </>
  );
}
