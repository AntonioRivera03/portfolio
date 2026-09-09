'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Box,
  Check,
  CircleDot,
  Code2,
  Cpu,
  GitBranch,
  GitMerge,
  Layers3,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Terminal,
  X,
} from 'lucide-react';
import { Dialog } from '@base-ui/react/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { publicAsset } from '@/lib/site-paths';
import {
  yardProjects,
  stackLayers,
  type YardProject,
} from '@/lib/yard-projects';
import type { ComputeController } from '@/lib/compute-scene';
import { yardContributions } from '@/lib/yard-contributions';
import './systems-yard.css';

function subscribeMotion(callback: () => void) {
  const m = window.matchMedia('(prefers-reduced-motion: reduce)');
  m.addEventListener('change', callback);
  return () => m.removeEventListener('change', callback);
}
const readMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const serverMotion = () => true;

function ProjectPreview({ project }: { project: YardProject }) {
  return (
    <div
      className={`sys-project-preview preview-${project.id}`}
      aria-hidden="true"
    >
      <div className="preview-caption">
        <span>
          {project.status === 'Design concept'
            ? 'PROPOSED INTERFACE'
            : 'WORKFLOW OVERVIEW'}
        </span>
        <span>↗</span>
      </div>
      {project.id === 'aicorn' ? (
        <div className="preview-pipeline">
          {['Backlog', 'Worktree', 'Agent', 'Review'].map((s, i) => (
            <div key={s}>
              <span>0{i + 1}</span>
              <strong>{s}</strong>
              {i < 3 && <ArrowRight size={13} />}
            </div>
          ))}
        </div>
      ) : project.id === 'kernel' ? (
        <div className="preview-events">
          <div>
            <i />
            tool.read<span>allowed</span>
          </div>
          <div>
            <i />
            tool.plan<span>recorded</span>
          </div>
          <div className="event-warning">
            <i />
            tool.write<span>awaiting approval</span>
          </div>
        </div>
      ) : project.id === 'latch' ? (
        <div className="preview-permissions">
          <ShieldCheck size={52} strokeWidth={1} />
          <div>
            <span>
              fs.read <b>ALLOW</b>
            </span>
            <span>
              net.connect <b>DENY</b>
            </span>
            <span>
              proc.spawn <b>DENY</b>
            </span>
          </div>
        </div>
      ) : project.id === 'tracepoint' ? (
        <div className="preview-trace">
          {[
            ['agent.run', '84%'],
            ['git.fetch', '61%'],
            ['socket.connect', '36%'],
            ['file.read', '22%'],
          ].map(([name, width], i) => (
            <div key={name}>
              <span>{name}</span>
              <i style={{ width, marginLeft: `${i * 8}%` }} />
            </div>
          ))}
        </div>
      ) : project.id === 'pagecache' ? (
        <div className="preview-storage">
          <span>
            0000 <b>RUN_CREATED</b>
            <Check size={12} />
          </span>
          <span>
            0001 <b>TOOL_STARTED</b>
            <Check size={12} />
          </span>
          <span>
            0002 <b>TOOL_COMPLETED</b>
            <Check size={12} />
          </span>
          <div>WAL → CHECKSUM → FSYNC</div>
        </div>
      ) : (
        <div className="preview-match">
          <span>
            Participant
            <br />
            <b>Lived experience</b>
          </span>
          <div>
            <ArrowRight size={23} />
          </div>
          <span>
            Research
            <br />
            <b>Relevant opportunity</b>
          </span>
        </div>
      )}
      <div className="preview-command">{project.command}</div>
    </div>
  );
}

export default function SystemsYard() {
  const [active, setActive] = useState(0);
  const [exploded, setExploded] = useState(true);
  const [pauseOverride, setPauseOverride] = useState<boolean | null>(null);
  const reduced = useSyncExternalStore(
    subscribeMotion,
    readMotion,
    serverMotion,
  );
  const paused = pauseOverride ?? reduced;
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState('All');
  const [detail, setDetail] = useState<YardProject | null>(null);
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const mount = useRef<HTMLDivElement>(null);
  const controller = useRef<ComputeController | null>(null);
  const settings = useRef({ exploded, paused, layer: 4 });
  const project = yardProjects[active];
  useEffect(() => {
    settings.current = { exploded, paused, layer: project.layer };
    controller.current?.configure(settings.current);
  }, [exploded, paused, project.layer]);
  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let disposed = false;
    const abort = new AbortController();
    import('@/lib/compute-scene')
      .then(({ createComputeScene }) => {
        if (disposed) return;
        return createComputeScene(host, {
          ...settings.current,
          signal: abort.signal,
          onReady: (available) => {
            if (!disposed) setReady(available);
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
  }, []);
  useEffect(() => {
    if (!running || !detail) return;
    let next = 0;
    const timer = window.setInterval(() => {
      setStep(next);
      next += 1;
      if (next === detail.events.length) {
        window.clearInterval(timer);
        setRunning(false);
      }
    }, 650);
    return () => window.clearInterval(timer);
  }, [running, detail]);
  function inspect(p: YardProject) {
    setDetail(p);
    setStep(-1);
    setRunning(false);
  }
  function close() {
    setDetail(null);
    setRunning(false);
    setStep(-1);
  }

  return (
    <div className="systems-yard">
      <a className="sys-skip" href="#projects">
        Skip to projects
      </a>
      <header className="sys-header">
        <a className="sys-brand" href={publicAsset('/')}>
          <span className="sys-brand-symbol">
            <Cpu size={22} strokeWidth={1.4} />
          </span>
          <span>
            ANTONIO RIVERA<small>THE SYSTEMS YARD</small>
          </span>
        </a>
        <nav aria-label="Projects page navigation">
          <a href="#projects">
            Projects <span>06</span>
          </a>
          <a href="#open-source">
            Open source <ArrowDown size={12} />
          </a>
          <a
            href="https://github.com/AntonioRivera03"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <ArrowUpRight size={13} />
          </a>
        </nav>
        <a className="sys-back" href={publicAsset('/')}>
          <ArrowLeft size={14} /> Portfolio
        </a>
      </header>
      <main>
        <section className="sys-hero" aria-labelledby="systems-title">
          <div className="sys-hero-grid" aria-hidden="true" />
          <div className="sys-hero-copy">
            <span className="sys-eyebrow">
              <i /> ENGINEERING / SELECTED WORK / 2026
            </span>
            <h1 id="systems-title">
              The systems
              <br />
              <span>
                yard<span className="sys-title-period">.</span>
              </span>
            </h1>
            <p>
              Agent orchestration. Local runtimes.
              <br />
              The machinery underneath the interface.
            </p>
            <a className="sys-primary" href="#projects">
              Explore the projects <ArrowDown size={17} />
            </a>
          </div>
          <div className={`sys-machine ${ready ? 'machine-ready' : ''}`}>
            <Image
              className="sys-machine-fallback"
              src={publicAsset('/images/systems/compute-stack.png')}
              alt="Exploded machined compute stack with graphite cooling fins, ceramic circuit boards, and copper components"
              width={1200}
              height={1400}
              priority
              unoptimized
            />
            <div className="sys-machine-canvas" ref={mount} />
            <span className="machine-coordinate coordinate-top">
              ASSEMBLY 001 / COMPUTE STACK
            </span>
            <span className="machine-coordinate coordinate-side">
              X: 06.0 / Y: 05.1 / Z: 06.0
            </span>
            <div className="machine-floor-label">
              <span>FIG. 01</span>
              <span>
                AN INTERACTIVE STUDY
                <br />
                OF THE SOFTWARE STACK
              </span>
            </div>
          </div>
          <div className="sys-layer-inspector">
            <div className="inspector-top">
              <span>INSPECT A LAYER</span>
              <Layers3 size={14} />
            </div>
            {[...stackLayers].reverse().map((layer, i) => (
              <button
                key={layer}
                className={project.layer === 4 - i ? 'active' : ''}
                onClick={() => setActive(i)}
              >
                <span>0{5 - i}</span>
                {layer}
                <i />
              </button>
            ))}
            <div className="inspector-note">
              <span />{' '}
              {ready
                ? 'DRAG THE ASSEMBLY TO ROTATE'
                : 'ASSEMBLY REFERENCE VIEW'}
            </div>
          </div>
          <div className="sys-machine-toolbar">
            <Tabs
              value={exploded ? 'exploded' : 'assembled'}
              onValueChange={(value) => setExploded(value === 'exploded')}
            >
              <TabsList aria-label="Assembly view">
                <TabsTrigger value="assembled">
                  <Box size={13} /> Assembled
                </TabsTrigger>
                <TabsTrigger value="exploded">
                  <Layers3 size={13} /> Exploded
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <button
              onClick={() => setPauseOverride(!paused)}
              aria-label={
                paused ? 'Resume assembly motion' : 'Pause assembly motion'
              }
              aria-pressed={paused}
            >
              {paused ? <Play size={15} /> : <Pause size={15} />}
            </button>
            <button
              onClick={() => controller.current?.reset()}
              aria-label="Reset assembly camera"
            >
              <RotateCcw size={15} />
            </button>
          </div>
          <div className="sys-hero-bottom">
            <span>
              <i /> INDEPENDENT PROJECTS & EXPERIMENTS
            </span>
            <span>
              BUILT FROM THE INSIDE OUT <ArrowDown size={14} />
            </span>
          </div>
        </section>

        <section
          className="sys-active-project"
          aria-label="Selected layer project"
        >
          <div className="active-project-index">
            0{active + 1}
            <small>/{yardProjects.length.toString().padStart(2, '0')}</small>
          </div>
          <div className="active-project-main">
            <span className="sys-eyebrow">
              {stackLayers[project.layer]} / {project.status}
            </span>
            <h2>
              {project.name}
              <span>{project.title}</span>
            </h2>
            <p>{project.description}</p>
          </div>
          <button
            className="sys-inspect-button"
            onClick={() => inspect(project)}
          >
            Inspect project <ArrowUpRight size={20} />
          </button>
        </section>

        <section
          className="sys-workbench sys-section"
          id="projects"
          aria-labelledby="workbench-title"
        >
          <div className="sys-section-heading">
            <div>
              <span className="sys-eyebrow">01 / THE WORKBENCH</span>
              <h2 id="workbench-title">
                What’s under
                <br />
                the hood.
              </h2>
            </div>
            <div>
              <p>
                Working software and detailed proposals.
                <br />
                Each one starts with a specific problem.
              </p>
              <Tabs
                value={filter}
                onValueChange={(value) => setFilter(String(value))}
              >
                <TabsList aria-label="Filter projects">
                  {['All', 'Agents', 'Systems', 'Applications'].map(
                    (category) => (
                      <TabsTrigger key={category} value={category}>
                        {category}
                      </TabsTrigger>
                    ),
                  )}
                </TabsList>
              </Tabs>
            </div>
          </div>
          <div className="sys-project-grid">
            {yardProjects
              .filter((p) => filter === 'All' || p.kind === filter)
              .map((p) => (
                <article className={`sys-project-card card-${p.id}`} key={p.id}>
                  <button
                    className="sys-preview-button"
                    onClick={() => inspect(p)}
                    aria-label={`Inspect ${p.name}`}
                  >
                    <ProjectPreview project={p} />
                  </button>
                  <div className="sys-project-card-content">
                    <div className="sys-card-status">
                      <span>{p.kind}</span>
                      <span
                        className={
                          p.status === 'Design concept' ? 'is-concept' : ''
                        }
                      >
                        <i />
                        {p.status}
                      </span>
                    </div>
                    <h3>
                      <button onClick={() => inspect(p)}>{p.name}</button>
                      <ArrowUpRight size={23} />
                    </h3>
                    <p>{p.description}</p>
                    <ul>
                      {p.features.map((f) => (
                        <li key={f.name}>
                          <Check size={13} />
                          {f.name}
                        </li>
                      ))}
                    </ul>
                    <div className="sys-card-stack">
                      {p.stack.map((s) => (
                        <span key={s}>{s}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </section>

        <section className="sys-architecture-banner">
          <Image
            src={publicAsset('/images/systems/circuit-landscape.png')}
            alt="Precision ceramic and graphite circuit architecture with copper traces"
            width={1536}
            height={1024}
            unoptimized
          />
          <div>
            <span className="sys-eyebrow">BELOW THE ABSTRACTION</span>
            <h2>
              Small primitives.
              <br />
              <span>Serious possibilities.</span>
            </h2>
            <p>
              Explicit permissions. Observable execution.
              <br />
              State that survives the process.
            </p>
            <a href="#projects" onClick={() => setFilter('Systems')}>
              Explore systems concepts <ArrowUpRight size={18} />
            </a>
          </div>
          <span className="architecture-caption">
            MATERIAL STUDY / 001
            <br />
            COPPER · CERAMIC · GRAPHITE
          </span>
        </section>

        <section
          className="sys-open-source sys-section"
          id="open-source"
          aria-labelledby="open-source-title"
        >
          <div className="sys-section-heading">
            <div>
              <span className="sys-eyebrow">02 / OPEN SOURCE</span>
              <h2 id="open-source-title">
                Built in
                <br />
                the open<span>.</span>
              </h2>
            </div>
            <div>
              <p>
                Selected changes across my public repositories.
                <br />
                The code, decisions, and review history.
              </p>
              <a
                className="sys-text-link"
                href="https://github.com/AntonioRivera03"
                target="_blank"
                rel="noreferrer"
              >
                <GitBranch size={16} /> Find me on GitHub{' '}
                <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
          <div className="sys-contributions">
            {yardContributions.map((pr) => (
              <a
                key={pr.url}
                className="sys-contribution"
                href={pr.url}
                target="_blank"
                rel="noreferrer"
              >
                <span className="contribution-icon">
                  <GitMerge size={20} />
                </span>
                <div>
                  <span className="sys-eyebrow">
                    ANTONIORIVERA03 / {pr.repo.toUpperCase()} · #{pr.number}
                  </span>
                  <h3>{pr.title}</h3>
                  <p>{pr.description}</p>
                </div>
                <span className="sys-pr-state">
                  <GitMerge size={12} /> Merged <ArrowUpRight size={14} />
                </span>
              </a>
            ))}
          </div>
          <p className="sys-contributions-note">
            Selected merged changes to my public repositories. Verified
            September 2026.
          </p>
        </section>

        <footer className="sys-footer">
          <div>
            <span className="sys-eyebrow">
              THE NEXT BUILD STARTS WITH A CONVERSATION.
            </span>
            <a href="mailto:antoniolrivera03@gmail.com">
              Let’s build
              <br />
              something useful.
              <ArrowUpRight />
            </a>
          </div>
          <div className="sys-footer-bottom">
            <a href={publicAsset('/')}>
              <ArrowLeft size={14} /> Back to portfolio
            </a>
            <span>ANTONIO RIVERA / 2026</span>
            <a href="#systems-title">Back to top ↑</a>
          </div>
        </footer>
      </main>

      <Dialog.Root
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="sys-dialog-backdrop" />
          <Dialog.Popup className="sys-project-dialog">
            {detail && (
              <>
                <div className="sys-dialog-top">
                  <span>
                    <Terminal size={16} /> PROJECT / {detail.kind.toUpperCase()}
                  </span>
                  <Dialog.Close aria-label="Close project details">
                    <X size={23} />
                  </Dialog.Close>
                </div>
                <div className="sys-dialog-heading">
                  <span className="sys-eyebrow">{detail.status}</span>
                  <Dialog.Title>{detail.name}</Dialog.Title>
                  <Dialog.Description>{detail.description}</Dialog.Description>
                </div>
                <div className="sys-dialog-columns">
                  <div>
                    <h3>
                      {detail.status === 'Design concept'
                        ? 'Proposed capabilities'
                        : 'Core capabilities'}
                    </h3>
                    {detail.features.map((feature, i) => (
                      <div className="sys-detail-feature" key={feature.name}>
                        <span>0{i + 1}</span>
                        <div>
                          <h4>{feature.name}</h4>
                          <p>{feature.detail}</p>
                        </div>
                      </div>
                    ))}
                    {detail.id === 'aicorn' && (
                      <p className="sys-upstream-credit">
                        AICorn extends{' '}
                        <a
                          href="https://github.com/waseem-polus/aycorn"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Aycorn by Waseem Polus
                        </a>{' '}
                        with task agents, Conductor, and development workflows.
                      </p>
                    )}
                    <div className="sys-card-stack">
                      {detail.stack.map((s) => (
                        <span key={s}>{s}</span>
                      ))}
                    </div>
                    {detail.link && (
                      <a
                        className="sys-primary"
                        href={detail.link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {detail.linkLabel}
                        <ArrowUpRight size={17} />
                      </a>
                    )}
                  </div>
                  <div className="sys-interface">
                    <div className="sys-interface-header">
                      <Code2 size={15} />
                      {detail.status === 'Design concept'
                        ? 'PROPOSED INTERFACE'
                        : 'WORKFLOW EXAMPLE'}
                      <span>READ ONLY</span>
                    </div>
                    <pre>{detail.code}</pre>
                    <div className="sys-run-header">
                      <span>
                        <CircleDot size={13} /> SIMULATED RUN
                      </span>
                      <button
                        disabled={running}
                        onClick={() => {
                          setStep(-1);
                          setRunning(true);
                        }}
                      >
                        {running
                          ? 'Running…'
                          : step >= 0
                            ? 'Replay example'
                            : 'Run example'}
                        {running ? (
                          <span className="sys-spinner" />
                        ) : (
                          <Play size={13} />
                        )}
                      </button>
                    </div>
                    <ol className="sys-run-events" aria-live="polite">
                      {step < 0 ? (
                        <li className="run-empty">
                          Run the example to inspect its event sequence.
                        </li>
                      ) : (
                        detail.events.slice(0, step + 1).map((event, i) => (
                          <li key={event}>
                            <span>{String(i + 1).padStart(2, '0')}</span>
                            <Check size={12} />
                            {event}
                          </li>
                        ))
                      )}
                    </ol>
                    <p className="sys-simulation-note">
                      Illustrative sequence. No agent runs and no files are
                      changed.
                    </p>
                  </div>
                </div>
              </>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
