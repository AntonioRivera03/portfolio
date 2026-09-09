'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Compass,
  Footprints,
  Leaf,
  Map,
  Moon,
  Mountain,
  Pause,
  Play,
  Route,
  Sun,
  Waves,
  X,
} from 'lucide-react';
import { Dialog } from '@base-ui/react/dialog';
import { publicAsset } from '@/lib/site-paths';
import { trailProjects, type TrailProject } from '@/lib/trail-projects';
import type { TrailController } from '@/lib/trail-scene';
import './project-trail.css';

function subscribeMotion(callback: () => void) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}
const getMotionPreference = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const getServerMotionPreference = () => true;

function ProjectIdentity({ project }: { project: TrailProject }) {
  return (
    <div className={`trail-identity identity-${project.id}`} aria-hidden="true">
      <span className="identity-edition">
        FIELD COLLECTION /{' '}
        {String(trailProjects.indexOf(project) + 1).padStart(2, '0')}
      </span>
      {project.id === 'livedmatch' ? (
        <div className="identity-match">
          <span>lived</span>
          <span>
            match<span className="match-asterisk">✳</span>
          </span>
        </div>
      ) : project.id === 'aicorn' ? (
        <div className="identity-acorn">
          <Leaf strokeWidth={1.2} />
          <strong>
            AIcorn<span>Ideas, taking root.</span>
          </strong>
        </div>
      ) : project.id === 'switchback' ? (
        <div className="identity-switch">
          <Route strokeWidth={1.2} />
          <strong>
            SWITCH
            <br />
            BACK.
          </strong>
        </div>
      ) : project.id === 'kernel' ? (
        <div className="identity-kernel">
          <span>
            k<span className="kernel-cursor">_</span>
          </span>
          <small>localhost / endless possibilities</small>
        </div>
      ) : project.id === 'current' ? (
        <div className="identity-current">
          <Waves strokeWidth={1.1} />
          <strong>
            current<span>Find your flow.</span>
          </strong>
        </div>
      ) : (
        <>
          <Image
            className="identity-landscape"
            src={publicAsset('/images/trail/montana-field.png')}
            alt=""
            width={1536}
            height={1024}
            unoptimized
          />
          <div className="identity-notes">
            <span>No. 06</span>
            <strong>
              Field
              <br />
              <em>notes.</em>
            </strong>
            <small>OBSERVE. COLLECT. CONNECT.</small>
          </div>
        </>
      )}
      <span className="identity-caption">{project.category}</span>
    </div>
  );
}

export default function ProjectTrail() {
  const [active, setActive] = useState(0);
  const [night, setNight] = useState(false);
  const [pauseOverride, setPaused] = useState<boolean | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    getMotionPreference,
    getServerMotionPreference,
  );
  const paused = pauseOverride ?? reducedMotion;
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [concept, setConcept] = useState<TrailProject | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<TrailController | null>(null);
  const markerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const settings = useRef({ active, night, paused });
  const project = trailProjects[active];

  useEffect(() => {
    settings.current = { active, night, paused };
  }, [active, night, paused]);

  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let disposed = false;
    let started = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        import('@/lib/trail-scene')
          .then(({ createTrailScene }) => {
            if (disposed) return;
            return createTrailScene(mount, {
              ...settings.current,
              onReady: (available) => {
                if (!disposed) {
                  setReady(available);
                  setUnavailable(!available);
                }
              },
              onMarkers: (points) => {
                points.forEach((point, i) => {
                  const marker = markerRefs.current[i];
                  if (marker) {
                    marker.style.left = `${point.x}%`;
                    marker.style.top = `${point.y}%`;
                  }
                });
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
            scene.select(settings.current.active);
            scene.setNight(settings.current.night);
            scene.setPaused(settings.current.paused);
          })
          .catch(() => {
            if (!disposed) {
              setUnavailable(true);
              setReady(false);
            }
          });
      },
      { rootMargin: '250px' },
    );
    observer.observe(mount);
    return () => {
      disposed = true;
      observer.disconnect();
      controller.current?.dispose();
      controller.current = null;
    };
  }, []);

  useEffect(() => {
    controller.current?.select(active);
  }, [active]);
  useEffect(() => {
    controller.current?.setNight(night);
  }, [night]);
  useEffect(() => {
    controller.current?.setPaused(paused);
  }, [paused]);

  function visit(index: number) {
    setActive(index);
    setIndexOpen(false);
  }
  function open() {
    setConcept(project);
  }

  return (
    <div
      className={`project-trail ${night ? 'trail-night' : ''} ${ready ? 'trail-ready' : ''}`}
    >
      <div className="trail-topbar">
        <span>
          <Mountain size={20} strokeWidth={1.4} /> AR / FIELD COLLECTION
        </span>
        <span className="trail-topbar-center">
          A FEW THINGS BUILT ALONG THE WAY
        </span>
        <div className="trail-topbar-actions">
          <a className="trail-home-link" href={publicAsset('/')}>
            <ArrowLeft size={14} /> Portfolio
          </a>
          <button
            className="trail-index-toggle"
            onClick={() => setIndexOpen(true)}
          >
            <Map size={16} /> Project index <span>06</span>
          </button>
        </div>
      </div>
      <div className="trail-world">
        <Image
          className="trail-fallback"
          src={publicAsset('/images/trail/montana-field.png')}
          width={1536}
          height={1024}
          alt="An illustrated trail winding through golden Montana prairie and evergreen forests toward snowy mountain peaks"
          loading="lazy"
          unoptimized
        />
        <div className="trail-canvas" ref={host} aria-hidden="true" />
        <div className="trail-atmosphere" />
        <div className="trail-title">
          <span className="trail-kicker">
            <span /> OFF THE BEATEN PATH / VOL. 01
          </span>
          <h1 id="yard-title">
            Take the
            <br />
            <em>scenic route.</em>
          </h1>
          <p>
            A trail of ideas, experiments,
            <br />
            and things worth making.
          </p>
        </div>
        <div className="trail-weather">
          <span>
            {night ? <Moon size={16} /> : <Sun size={18} />}
            {night ? 'BLUE HOUR' : 'GOLDEN HOUR'}
          </span>
          <small>BIG SKY COUNTRY</small>
          <div className="trail-compass">
            <Compass size={48} strokeWidth={1} />
            <span>N</span>
          </div>
        </div>
        <nav
          className="trail-markers"
          aria-label="Project stops along the trail"
        >
          {trailProjects.map((stop, i) => (
            <button
              key={stop.id}
              ref={(el) => {
                markerRefs.current[i] = el;
              }}
              className={`trail-marker ${active === i ? 'is-active' : ''}`}
              style={{ left: `${stop.screen[0]}%`, top: `${stop.screen[1]}%` }}
              onClick={() => visit(i)}
              aria-label={`Stop ${i + 1}: ${stop.name}, ${stop.place}`}
              aria-current={active === i ? 'step' : undefined}
            >
              <span className="marker-number">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="marker-label">
                {stop.name}
                <small>{stop.place}</small>
              </span>
            </button>
          ))}
        </nav>
        <article className="trail-field-card" key={project.id}>
          <div className="field-card-top">
            <span>
              <i style={{ background: project.color }} /> {project.status}
            </span>
            <span>{String(active + 1).padStart(2, '0')} / 06</span>
          </div>
          <button
            className="project-open trail-project-open"
            onClick={open}
            aria-label={`Explore ${project.name}`}
          >
            <ProjectIdentity project={project} />
            <span className="trail-open-arrow">
              <ArrowUpRight size={21} />
            </span>
          </button>
          <div className="field-card-copy">
            <h4>{project.name}</h4>
            <p>{project.description}</p>
            <div className="field-card-tags">
              {project.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <button className="field-card-link" onClick={open}>
              {project.status.includes('concept')
                ? 'Open field notes'
                : 'Explore project'}
              <ArrowUpRight size={16} />
            </button>
          </div>
          <span className="field-card-pin" aria-hidden="true" />
        </article>
        <div className="trail-ground-caption">
          <Footprints size={16} />
          <span>
            FOLLOW A MARKER.
            <br />
            SEE WHERE IT LEADS.
          </span>
        </div>
        <div className="trail-scene-controls" aria-label="Landscape settings">
          <button
            onClick={() => setNight(!night)}
            aria-label={night ? 'Switch to golden hour' : 'Switch to blue hour'}
            aria-pressed={night}
          >
            {night ? <Moon size={17} /> : <Sun size={18} />}
          </button>
          <button
            onClick={() => setPaused(!paused)}
            aria-label={
              paused ? 'Resume landscape motion' : 'Pause landscape motion'
            }
            aria-pressed={paused}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        </div>
        {unavailable && (
          <span className="trail-static-note">
            Illustrated view · all projects are still here
          </span>
        )}
      </div>
      <div className="trail-bottom-bar">
        <div className="trail-location">
          <span className="trail-location-number">
            {String(active + 1).padStart(2, '0')}
          </span>
          <div>
            <span>YOU ARE HERE</span>
            <strong aria-live="polite">{project.place}</strong>
          </div>
        </div>
        <div className="trail-progress">
          <span>TRAILHEAD</span>
          <div>
            {trailProjects.map((stop, i) => (
              <button
                key={stop.id}
                className={i <= active ? 'is-visited' : ''}
                onClick={() => visit(i)}
                aria-label={`Go to ${stop.name}`}
                aria-current={active === i ? 'step' : undefined}
              >
                <i />
              </button>
            ))}
          </div>
          <span>HIGH COUNTRY</span>
        </div>
        <div className="trail-traverse">
          <button
            disabled={active === 0}
            onClick={() => visit(active - 1)}
            aria-label="Previous project"
          >
            <ArrowLeft size={18} />
          </button>
          <span>
            {project.mile} <small>MI</small>
          </span>
          <button
            disabled={active === trailProjects.length - 1}
            onClick={() => visit(active + 1)}
            aria-label="Next project"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      <div className="trail-footnote">
        <span>REAL WORK & IMAGINED POSSIBILITIES. ONE WINDING TRAIL.</span>
        <a href={publicAsset('/')}>
          Back to portfolio <ArrowDown size={14} />
        </a>
      </div>

      <Dialog.Root open={indexOpen} onOpenChange={setIndexOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="trail-dialog-backdrop" />
          <Dialog.Popup className="trail-index-panel">
            <div className="trail-dialog-top">
              <Mountain size={24} />
              <Dialog.Close aria-label="Close project index">
                <X size={22} />
              </Dialog.Close>
            </div>
            <span className="trail-kicker">THE COMPLETE COLLECTION</span>
            <Dialog.Title>Pick a path.</Dialog.Title>
            <Dialog.Description>
              Six stops. Plenty to explore.
            </Dialog.Description>
            <div className="trail-index-list">
              {trailProjects.map((stop, i) => (
                <button key={stop.id} onClick={() => visit(i)}>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{stop.name}</strong>
                    <small>
                      {stop.status} · {stop.place}
                    </small>
                  </div>
                  <ArrowUpRight size={20} />
                </button>
              ))}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root
        open={!!concept}
        onOpenChange={(value) => {
          if (!value) setConcept(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="trail-dialog-backdrop" />
          <Dialog.Popup className="trail-concept-panel">
            {concept && (
              <>
                <div className="trail-dialog-top">
                  <span>FROM THE FIELD NOTES</span>
                  <Dialog.Close aria-label="Close field notes">
                    <X size={22} />
                  </Dialog.Close>
                </div>
                <ProjectIdentity project={concept} />
                <span className="trail-concept-status">{concept.status}</span>
                <Dialog.Title>{concept.name}</Dialog.Title>
                <Dialog.Description>{concept.description}</Dialog.Description>
                <p>{concept.note}</p>
                {(concept.id === 'livedmatch' || concept.id === 'aicorn') && (
                  <a
                    className="trail-external-project"
                    href={
                      concept.id === 'livedmatch'
                        ? 'https://www.livedmatch.com'
                        : 'https://github.com/AntonioRivera03/AIcorn'
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    {concept.id === 'livedmatch'
                      ? 'Visit LivedMatch'
                      : 'View on GitHub'}{' '}
                    <ArrowUpRight size={17} />
                  </a>
                )}
                <div className="field-card-tags">
                  {concept.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <Dialog.Close className="trail-return">
                  <ArrowLeft size={17} /> Back to the trail
                </Dialog.Close>
              </>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
