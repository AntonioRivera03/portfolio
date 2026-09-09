'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import Image from 'next/image';
import { Dialog } from '@base-ui/react/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  Crosshair,
  GitMerge,
  MoveUpRight,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Telescope,
  Wrench,
  X,
} from 'lucide-react';
import { yardProjects } from '@/lib/yard-projects';
import { yardContributions } from '@/lib/yard-contributions';
import { publicAsset } from '@/lib/site-paths';
import { useYardMotion } from '@/lib/yard-motion';
import type {
  FieldController,
  FieldSettings,
  FieldView,
} from '@/lib/deep-field-scene';
import './deep-field-yard.css';

const stations = [
  'The orchestrator',
  'The runtime',
  'The boundary',
  'The trace',
  'The memory',
  'The connection',
];
const views: {
  value: FieldView;
  title: string;
  icon: typeof Compass;
  description: string;
}[] = [
  {
    value: 'survey',
    title: 'Survey',
    icon: Compass,
    description: 'The whole field. Six stations, six different systems.',
  },
  {
    value: 'acquire',
    title: 'Acquire',
    icon: Crosshair,
    description: 'A closer look at the selected project station.',
  },
  {
    value: 'signal',
    title: 'Signal',
    icon: Radio,
    description: 'An explanatory overlay of receiver and cable routes.',
  },
  {
    value: 'service',
    title: 'Service',
    icon: Wrench,
    description:
      'Inside the shared workshop. Follow the crane’s service cycle.',
  },
];

function FieldMark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="22" cy="22" r="18" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="22" cy="22" rx="8" ry="18" stroke="currentColor" />
      <path d="M4 22h36M8 11h28M8 33h28M22 0v44" stroke="currentColor" />
      <circle cx="22" cy="22" r="3" fill="currentColor" />
    </svg>
  );
}

export default function DeepFieldYard() {
  const [active, setActive] = useState(0),
    [view, setView] = useState<FieldView>('survey');
  const [ready, setReady] = useState(false),
    [tour, setTour] = useState(false),
    [open, setOpen] = useState(false);
  const [step, setStep] = useState(-1),
    [running, setRunning] = useState(false);
  const { paused, reduced, toggle } = useYardMotion();
  const mount = useRef<HTMLDivElement>(null),
    field = useRef<HTMLElement>(null),
    readout = useRef<HTMLSpanElement>(null);
  const labels = useRef<(HTMLButtonElement | null)[]>([]),
    controller = useRef<FieldController | null>(null);
  const settings = useRef<FieldSettings>({ active, view, paused });
  const project = yardProjects[active];
  const select = useCallback((index: number) => {
    setActive(index);
    setView('acquire');
    setTour(false);
    setStep(-1);
    setRunning(false);
  }, []);
  function visit(index: number) {
    select(index);
    field.current?.scrollIntoView({
      behavior: reduced ? 'instant' : 'smooth',
      block: 'start',
    });
  }
  function changeView(next: FieldView) {
    setView(next);
    setTour(false);
  }
  function inspect(index: number) {
    select(index);
    setOpen(true);
  }
  function close() {
    setOpen(false);
    setRunning(false);
  }
  useEffect(() => {
    settings.current = { active, view, paused };
    controller.current?.configure(settings.current);
  }, [active, view, paused]);
  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    const abort = new AbortController();
    let disposed = false;
    import('@/lib/deep-field-scene')
      .then(({ createFieldScene }) => {
        if (disposed) return;
        return createFieldScene(host, {
          ...settings.current,
          signal: abort.signal,
          labels: labels.current,
          readout: readout.current,
          onSelect: select,
          onInteract: () => setTour(false),
          onReady: (value) => {
            if (!disposed) setReady(value);
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
        scene.configure(settings.current);
      })
      .catch(() => {
        if (!disposed) setReady(false);
      });
    return () => {
      disposed = true;
      abort.abort();
      controller.current?.dispose();
      controller.current = null;
    };
  }, [select]);
  useEffect(() => {
    if (!tour || paused || open) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      const rect = field.current?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > innerHeight) return;
      setActive((i) => (i + 1) % yardProjects.length);
      setView('acquire');
    }, 11500);
    return () => clearInterval(timer);
  }, [tour, paused, open]);
  useEffect(() => {
    if (!running || !open) return;
    let next = 0;
    const timer = setInterval(() => {
      setStep(next);
      next++;
      if (next === project.events.length) {
        clearInterval(timer);
        setRunning(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [running, open, project]);
  function startTour() {
    if (tour) {
      setTour(false);
      return;
    }
    if (paused) toggle();
    setView('acquire');
    setTour(true);
  }

  return (
    <div className={`deep-field ${paused ? 'df-paused' : ''}`}>
      <a className="df-skip" href="#field-index">
        Skip to project index
      </a>
      <header className="df-header">
        <a className="df-brand" href={publicAsset('/')}>
          <FieldMark />
          <span>
            ANTONIO
            <br />
            RIVERA
          </span>
        </a>
        <span className="df-header-center">
          AN INDEPENDENT EXPLORATION
          <br />
          <strong>SOFTWARE, AT EVERY SCALE.</strong>
        </span>
        <nav aria-label="Projects navigation">
          <a href="#field-index">
            Projects <span>06</span>
          </a>
          <a href="#field-journal">Open source</a>
          <a className="df-back" href={publicAsset('/')}>
            <ArrowUpRight size={17} /> Portfolio
          </a>
        </nav>
      </header>
      <main>
        <section className="df-masthead" aria-labelledby="field-title">
          <div className="df-masthead-top">
            <span className="df-kicker">FIELD NOTES / VOLUME 001</span>
            <span className="df-kicker">AGENTS · RUNTIMES · SYSTEMS</span>
          </div>
          <h1 id="field-title">
            DEEP FIELD<span>01</span>
          </h1>
          <div className="df-masthead-bottom">
            <p>
              A place to explore
              <br />
              <em>what’s beneath the interface.</em>
            </p>
            <span>
              Six projects. One connected landscape.
              <br />
              Come closer. There’s a lot going on.
            </span>
            <a href="#observatory" aria-label="Enter the observatory">
              <ArrowDown size={22} strokeWidth={1.2} />
            </a>
          </div>
        </section>

        <section
          className={`df-observatory ${ready ? 'is-ready' : ''} df-view-${view}`}
          id="observatory"
          ref={field}
          aria-label="Interactive observatory project explorer"
        >
          <div className="df-world">
            <Image
              className="df-landscape"
              src={publicAsset('/images/deep-field/plateau.webp')}
              width={1536}
              height={1024}
              alt="A remote, open high desert plateau with layered blue mountain ridges and pale morning sky."
              priority
            />
            <Image
              className="df-fallback"
              src={publicAsset('/images/deep-field/observatory.webp')}
              width={1600}
              height={1000}
              alt="A detailed observatory with six white segmented dishes, articulated mounts, a central processing hall, and an open instrument workshop."
              priority
            />
            <div className="df-webgl" ref={mount} />
            <div className="df-atmosphere" />
            <div className="df-station-labels" aria-hidden={!ready}>
              {yardProjects.map((p, i) => (
                <button
                  ref={(el) => {
                    labels.current[i] = el;
                  }}
                  key={p.id}
                  className={`df-station-label ${i === active ? 'is-selected' : ''}`}
                  tabIndex={ready ? 0 : -1}
                  onClick={() => select(i)}
                  aria-label={`Explore ${p.name}, station ${i + 1}`}
                >
                  <span>0{i + 1}</span>
                  <strong>{p.name}</strong>
                  <i />
                </button>
              ))}
            </div>
          </div>
          <div className="df-world-topline">
            <span>
              <i /> DEEP FIELD OBSERVATORY
            </span>
            <span>DIGITAL LANDSCAPE / 06 PROJECT STATIONS</span>
          </div>
          <div className="df-scene-tools">
            <button onClick={startTour} className={tour ? 'is-active' : ''}>
              {tour ? <Pause size={13} /> : <Play size={13} />}{' '}
              {tour ? 'End guided tour' : 'Take a guided tour'}
            </button>
            <button
              onClick={() => {
                toggle();
                setTour(false);
              }}
              aria-label={paused ? 'Play scene motion' : 'Pause scene motion'}
            >
              {paused ? <Play size={15} /> : <Pause size={15} />}
            </button>
            <button
              onClick={() => controller.current?.reset()}
              aria-label="Reset view"
            >
              <RotateCcw size={15} />
            </button>
          </div>
          <button
            className="df-site-map"
            onClick={() => changeView('survey')}
            aria-label="Return to the full observatory survey"
          >
            <span>
              SITE PLAN <MoveUpRight size={10} />
            </span>
            <svg viewBox="0 0 130 120" fill="none" aria-hidden="true">
              <path
                d="M12 96h105M30 24v72M69 13v83M106 32v64M30 24h39M30 50h76M30 76h76"
                stroke="currentColor"
                opacity=".22"
              />
              <path d="M23 84h24v13H23z" fill="currentColor" opacity=".3" />
              {[
                [69, 76],
                [30, 50],
                [106, 32],
                [30, 24],
                [69, 13],
                [106, 76],
              ].map(([x, y], i) => (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    r={active === i ? 7 : 4}
                    fill={active === i ? '#a54f36' : '#31423b'}
                    opacity={active === i ? 1 : 0.65}
                  />
                  <text x={x + 9} y={y + 3} fill="currentColor" fontSize="7">
                    0{i + 1}
                  </text>
                </g>
              ))}
            </svg>
            <span>6 INSTRUMENTS / 1 FIELD</span>
          </button>
          <div className="df-instrument-note">
            <span className="df-kicker">SCENE ATTITUDE</span>
            <span ref={readout}>AZ −18.0° / EL 55.0°</span>
          </div>
          <div className="df-field-folio" key={active}>
            <div className="df-folio-top">
              <span className="df-kicker">STATION 0{active + 1}</span>
              <span>{project.status}</span>
            </div>
            <div className="df-folio-title">
              <h2>{project.name}</h2>
              <span>↗</span>
            </div>
            <p>{project.title}</p>
            <button onClick={() => inspect(active)}>
              Open field notes <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="df-mode-note" key={view}>
            <span>
              0{views.findIndex((v) => v.value === view) + 1} /{' '}
              {view.toUpperCase()}
            </span>
            <p>{views.find((v) => v.value === view)?.description}</p>
            <small>
              {ready
                ? 'Drag the landscape to orbit.'
                : 'Rendered overview. Every project is available below.'}
            </small>
          </div>
          <div className="df-world-bottomline">
            <span>
              {tour
                ? 'GUIDED TOUR / NEXT STATION EVERY 12 SECONDS'
                : 'A FICTIONAL OBSERVATORY FOR REAL WORK & NEW IDEAS'}
            </span>
            <span>
              SCROLL TO THE PROJECT INDEX <ArrowDown size={10} />
            </span>
          </div>
        </section>

        <div className="df-control-deck">
          <div className="df-control-label">
            <FieldMark />
            <span>
              WAYS OF
              <br />
              LOOKING
            </span>
          </div>
          <Tabs value={view} onValueChange={(v) => changeView(v as FieldView)}>
            <TabsList aria-label="Observatory view">
              {views.map(({ value, title, icon: Icon }, i) => (
                <TabsTrigger value={value} key={value}>
                  <span>0{i + 1}</span>
                  <Icon size={17} strokeWidth={1.3} />
                  {title}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <span className="df-control-hint">
            ONE FIELD.
            <br />
            DIFFERENT PERSPECTIVES.
          </span>
        </div>

        <section
          className="df-index-section"
          id="field-index"
          aria-labelledby="field-index-title"
        >
          <div className="df-section-heading">
            <div>
              <span className="df-kicker">01 / THE PROJECT INDEX</span>
              <h2 id="field-index-title">
                Built to do
                <br />
                <em>something real.</em>
              </h2>
            </div>
            <p>
              From task orchestration to the write-ahead log. A collection of
              working projects and clearly marked explorations in agents and
              low-level systems.
            </p>
          </div>
          <div className="df-index-labels">
            <span>STATION / PROJECT</span>
            <span>FUNCTION</span>
            <span>STATUS</span>
            <span>EXPLORE</span>
          </div>
          <div className="df-project-index">
            {yardProjects.map((p, i) => (
              <article
                className={`df-index-row ${i === active ? 'is-selected' : ''}`}
                key={p.id}
                style={{ '--row': i } as CSSProperties}
              >
                <div className="df-index-name">
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{p.name}</h3>
                    <small>{stations[i]}</small>
                  </div>
                </div>
                <div className="df-index-function">
                  <p>{p.title}</p>
                  <span>{p.stack.join(' / ')}</span>
                </div>
                <span
                  className={`df-index-status ${p.status === 'Design concept' ? 'is-concept' : ''}`}
                >
                  <i />
                  {p.status}
                </span>
                <div className="df-index-actions">
                  <button
                    onClick={() => inspect(i)}
                    aria-label={`Read ${p.name} project notes`}
                  >
                    <span>Read notes</span>
                    <ArrowUpRight size={20} strokeWidth={1.3} />
                  </button>
                  <button
                    onClick={() => visit(i)}
                    aria-label={`Visit ${p.name} observatory station`}
                  >
                    <Telescope size={17} strokeWidth={1.3} />
                    <span>Visit station</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="df-index-footnote">
            <span>Concepts are proposals, not released implementations.</span>
            <span>
              THE GOOD STUFF IS IN THE DETAILS. <span>↗</span>
            </span>
          </div>
        </section>

        <section className="df-interlude" aria-labelledby="closer-title">
          <div className="df-interlude-image">
            <Image
              src={publicAsset('/images/deep-field/reflector.webp')}
              alt="Close view of a segmented reflector, its feed supports, mounting gears, access ladders and structural ribs."
              width={1600}
              height={1000}
            />
            <span>THE ARRAY / A CLOSER PERSPECTIVE</span>
          </div>
          <div className="df-interlude-copy">
            <span className="df-kicker">CHANGE YOUR PERSPECTIVE</span>
            <h2 id="closer-title">
              Big pictures.
              <br />
              <em>Small details.</em>
            </h2>
            <p>
              Follow a signal from an instrument to the processing hall. Step
              inside the workshop. Or go straight to the code behind a project.
            </p>
            <button
              onClick={() => {
                changeView('signal');
                field.current?.scrollIntoView({
                  behavior: reduced ? 'instant' : 'smooth',
                });
              }}
            >
              Follow the signal <Radio size={18} />
            </button>
            <button
              onClick={() => {
                changeView('service');
                field.current?.scrollIntoView({
                  behavior: reduced ? 'instant' : 'smooth',
                });
              }}
            >
              Enter the workshop <Wrench size={18} />
            </button>
            <div className="df-interlude-mini">
              <Image
                src={publicAsset('/images/deep-field/workshop.webp')}
                alt="An open instrument workshop with a supported overhead crane, service rails and processing racks."
                width={1600}
                height={1000}
              />
              <span>
                SHARED INFRASTRUCTURE
                <br />
                <strong>THE INSTRUMENT WORKSHOP</strong>
              </span>
            </div>
          </div>
        </section>

        <section
          className="df-journal"
          id="field-journal"
          aria-labelledby="journal-title"
        >
          <div className="df-section-heading">
            <div>
              <span className="df-kicker">02 / OPEN-SOURCE WORK</span>
              <h2 id="journal-title">
                Progress,
                <br />
                <em>in public.</em>
              </h2>
            </div>
            <div>
              <p>
                Selected changes across my public repositories. The ideas become
                more useful when you can inspect the work.
              </p>
              <a
                href="https://github.com/AntonioRivera03"
                target="_blank"
                rel="noreferrer"
              >
                Explore GitHub <ArrowUpRight size={17} />
              </a>
            </div>
          </div>
          <div className="df-journal-grid">
            {yardContributions.map((pr, i) => (
              <a
                className="df-journal-entry"
                href={pr.url}
                target="_blank"
                rel="noreferrer"
                key={pr.url}
              >
                <div className="df-journal-entry-top">
                  <span>RECORD 00{i + 1}</span>
                  <span>
                    <GitMerge size={12} /> MERGED
                  </span>
                </div>
                <div className="df-journal-entry-main">
                  <span className="df-entry-repo">
                    {pr.repo}
                    <small>PR #{pr.number}</small>
                  </span>
                  <h3>{pr.title}</h3>
                  <ArrowUpRight size={25} strokeWidth={1} />
                </div>
                <p>{pr.description}</p>
                <div className="df-journal-entry-bottom">
                  <span>{pr.date}</span>
                  <span>READ THE CHANGESET →</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        <footer className="df-footer">
          <div className="df-footer-top">
            <FieldMark />
            <span>THERE’S ALWAYS MORE TO EXPLORE.</span>
            <span>ANTONIO RIVERA</span>
          </div>
          <a className="df-contact" href="mailto:antoniolrivera03@gmail.com">
            Let’s build
            <br />
            <em>what’s next.</em>
            <ArrowUpRight strokeWidth={0.7} />
          </a>
          <div className="df-footer-bottom">
            <a href={publicAsset('/')}>
              <ArrowLeft size={14} /> Back to portfolio
            </a>
            <span>DEEP FIELD / AN INDEPENDENT EXPLORATION</span>
            <a href="#field-title">BACK TO THE SURFACE ↑</a>
          </div>
        </footer>
      </main>

      <Dialog.Root
        open={open}
        onOpenChange={(value) => {
          if (!value) close();
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="df-dialog-backdrop" />
          <Dialog.Popup className={`df-dossier ${paused ? 'df-paused' : ''}`}>
            <div className="df-dossier-top">
              <span>DEEP FIELD / PROJECT NOTES</span>
              <span>RECORD 00{active + 1}</span>
              <Dialog.Close aria-label="Close project notes">
                <X size={20} strokeWidth={1.3} />
              </Dialog.Close>
            </div>
            <div className="df-dossier-heading">
              <div>
                <span className="df-kicker">
                  {project.kind.toUpperCase()} / {project.status.toUpperCase()}
                </span>
                <Dialog.Title>
                  {project.name}
                  <span>↗</span>
                </Dialog.Title>
              </div>
              <FieldMark />
            </div>
            <Dialog.Description className="df-dossier-description">
              {project.description}
            </Dialog.Description>
            <Tabs defaultValue="capabilities" className="df-dossier-tabs">
              <TabsList aria-label="Project notes sections">
                <TabsTrigger value="capabilities">
                  01 / Capabilities
                </TabsTrigger>
                <TabsTrigger value="execution">
                  02 / Execution notes
                </TabsTrigger>
              </TabsList>
              <TabsContent value="capabilities">
                <div className="df-dossier-features">
                  {project.features.map((f, i) => (
                    <div key={f.name}>
                      <span>0{i + 1}</span>
                      <h3>{f.name}</h3>
                      <p>{f.detail}</p>
                    </div>
                  ))}
                </div>
                <div className="df-dossier-stack">
                  <span>
                    {project.status === 'Design concept'
                      ? 'PROPOSED STACK'
                      : 'PROJECT CONTEXT'}
                  </span>
                  <strong>{project.stack.join(' / ')}</strong>
                </div>
              </TabsContent>
              <TabsContent value="execution">
                <div className="df-execution">
                  <div className="df-interface">
                    <span>
                      {project.status === 'Design concept'
                        ? 'PROPOSED INTERFACE'
                        : 'WORKFLOW EXAMPLE'}
                    </span>
                    <pre>{project.code}</pre>
                  </div>
                  <div className="df-log">
                    <div>
                      <span>AN ILLUSTRATIVE RUN</span>
                      <span>0{step + 1} / 04</span>
                    </div>
                    <ol aria-live="polite">
                      {project.events.map((event, i) => (
                        <li
                          key={event}
                          className={step >= i ? 'is-reached' : ''}
                        >
                          <span>
                            {step >= i ? <Check size={12} /> : `0${i + 1}`}
                          </span>
                          <p>{step >= i ? event : 'Awaiting the example'}</p>
                        </li>
                      ))}
                    </ol>
                    <button
                      onClick={() => {
                        setStep(-1);
                        setRunning(true);
                      }}
                      disabled={running}
                    >
                      <Play size={13} />
                      {running
                        ? 'Following the workflow…'
                        : step < 0
                          ? 'Trace the workflow'
                          : 'Replay the workflow'}
                      <ArrowRight size={15} />
                    </button>
                    <small>
                      A simulation in this page; no external actions.
                    </small>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="df-dossier-footer">
              <span>
                {project.id === 'aicorn' ? (
                  <>
                    Built on{' '}
                    <a
                      href="https://github.com/waseem-polus/aycorn"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Aycorn ↗
                    </a>
                    . One agent at a time; human review before merging.
                  </>
                ) : project.status === 'Design concept' ? (
                  'A design exploration. The capabilities and interface shown here are proposed.'
                ) : (
                  'A live platform connecting lived experience with relevant research.'
                )}
              </span>
              {project.link && (
                <a
                  className="df-dossier-link"
                  href={project.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  {project.linkLabel}
                  <ArrowUpRight size={16} />
                </a>
              )}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
