'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { Dialog } from '@base-ui/react/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Cpu,
  Expand,
  GitBranch,
  GitMerge,
  Network,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Terminal,
  X,
} from 'lucide-react';
import { yardProjects } from '@/lib/yard-projects';
import { yardContributions } from '@/lib/yard-contributions';
import { publicAsset } from '@/lib/site-paths';
import { useYardMotion } from '@/lib/yard-motion';
import type { DispatchController } from '@/lib/dispatch-scene';
import './dispatch-yard.css';

const nodeRoles = [
  'ORCHESTRATOR',
  'RUNTIME',
  'SANDBOX',
  'TRACING',
  'STORAGE',
  'MATCHING',
];
const flowLabels = [
  ['Task', 'Worktree', 'Agent', 'Review'],
  ['Policy', 'Run', 'Tool', 'Journal'],
  ['Component', 'Capabilities', 'Budget', 'Result'],
  ['Agent', 'Process', 'I/O', 'Trace'],
  ['Event', 'Checksum', 'WAL', 'Replay'],
  ['Experience', 'Research', 'Match', 'Choice'],
];

export default function DispatchYard() {
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);
  const [signals, setSignals] = useState(true);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const { paused, toggle } = useYardMotion();
  const mount = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLButtonElement | null)[]>([]);
  const controller = useRef<DispatchController | null>(null);
  const settings = useRef({ active, focused, paused, signals });
  const project = yardProjects[active];
  function select(index: number) {
    setActive(index);
    setFocused(true);
    setRunning(false);
    setStep(-1);
  }
  useEffect(() => {
    settings.current = { active, focused, paused, signals };
    controller.current?.configure(settings.current);
  }, [active, focused, paused, signals]);
  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    const abort = new AbortController();
    let disposed = false;
    import('@/lib/dispatch-scene')
      .then(({ createDispatchScene }) => {
        if (disposed) return;
        return createDispatchScene(host, {
          ...settings.current,
          signal: abort.signal,
          labels: labels.current,
          onSelect: select,
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
  }, []);
  useEffect(() => {
    if (!running || !open) return;
    let next = 0;
    const timer = window.setInterval(() => {
      setStep(next);
      next++;
      if (next === project.events.length) {
        clearInterval(timer);
        setRunning(false);
      }
    }, 800);
    return () => clearInterval(timer);
  }, [running, open, project]);
  function close() {
    setOpen(false);
    setRunning(false);
  }

  return (
    <div className={`dispatch-yard ${paused ? 'd-paused' : ''}`}>
      <a className="d-skip" href="#project-index">
        Skip to project index
      </a>
      <header className="d-header">
        <a href={publicAsset('/')} className="d-logo">
          <span className="d-symbol">
            <i />
            <i />
            <i />
            <i />
          </span>
          dispatch<span className="d-cursor">_</span>
        </a>
        <span className="d-header-name">
          AN INDEPENDENT SYSTEMS PRACTICE
          <br />
          <strong>ANTONIO RIVERA</strong>
        </span>
        <nav aria-label="Projects navigation">
          <a href="#open-source">
            Open source <GitBranch size={14} />
          </a>
          <a href={publicAsset('/')}>
            <ArrowUpRight size={16} /> Portfolio
          </a>
        </nav>
      </header>

      <main>
        <section className="d-intro" aria-labelledby="dispatch-title">
          <div>
            <div className="d-eyebrow">
              <span className="d-square" /> SELECTED WORK / EXPLORATIONS
            </div>
            <h1 id="dispatch-title">
              Every system.
              <br />
              <span>A moving part.</span>
            </h1>
          </div>
          <div className="d-intro-note">
            <span className="d-bracket">[ 01 — 06 ]</span>
            <p>
              Agents that execute.
              <br />
              Tools with boundaries.
              <br />
              Systems you can take apart.
            </p>
            <a href="#project-index">
              Enter the network <ArrowDown size={18} />
            </a>
          </div>
        </section>

        <section
          className="d-workbench"
          id="project-index"
          aria-label="Interactive project network"
        >
          <div className="d-workbench-bar">
            <span>
              <Network size={15} /> PROJECT NETWORK
            </span>
            <span className="d-dim">SELECT A NODE TO INSPECT ITS SYSTEM</span>
            <span>
              <i className="d-square" /> 06 NODES
            </span>
          </div>
          <div className="d-machine-layout">
            <aside className="d-directory" aria-label="Choose a project">
              <div className="d-directory-heading">
                DIRECTORY <span>↙</span>
              </div>
              {yardProjects.map((p, i) => (
                <button
                  className={`d-project-row ${i === active ? 'is-selected' : ''}`}
                  key={p.id}
                  onClick={() => select(i)}
                  aria-pressed={i === active}
                >
                  <span className="d-row-index">0{i + 1}</span>
                  <span>
                    <strong>{p.name}</strong>
                    <small>{nodeRoles[i]}</small>
                  </span>
                  <ArrowUpRight size={17} />
                </button>
              ))}
              <p className="d-directory-note">
                Real projects and clearly marked concepts. Open a module to see
                what it does.
              </p>
            </aside>
            <div className={`d-stage ${ready ? 'is-ready' : ''}`}>
              <div className="d-stage-heading">
                <span>DISPATCH / BOARD 001</span>
                <span>
                  {focused ? `ISOLATING NODE 0${active + 1}` : 'FULL TOPOLOGY'}
                </span>
              </div>
              <div className="d-viewport">
                <Image
                  className="d-fallback"
                  src={publicAsset('/images/dispatch/dispatch.png')}
                  alt="A detailed six-module graphite routing board, with memory arrays, a compute exchange, a security vault, and storage cartridges connected by lime signal tracks."
                  width={1600}
                  height={1000}
                  priority
                />
                <div className="d-webgl" ref={mount} />
                <div className="d-node-labels" aria-hidden={!ready}>
                  {yardProjects.map((p, i) => (
                    <button
                      ref={(el) => {
                        labels.current[i] = el;
                      }}
                      className={`d-node-label ${i === active ? 'is-selected' : ''}`}
                      key={p.id}
                      tabIndex={ready ? 0 : -1}
                      onClick={() => select(i)}
                      aria-label={`Inspect ${p.name}`}
                    >
                      <span>0{i + 1}</span>
                      <b>{p.name}</b>
                      <i />
                    </button>
                  ))}
                </div>
              </div>
              <div className="d-stage-caption">
                <span>
                  {ready
                    ? 'DRAG TO ORBIT · SELECT TO OPEN'
                    : 'RENDERED OVERVIEW · USE THE PROJECT INDEX'}
                </span>
                <span className="d-crosshair">+</span>
                <span>ORIGINAL DIGITAL ASSEMBLY</span>
              </div>
            </div>
          </div>
          <div className="d-controls">
            <Tabs
              value={focused ? 'isolate' : 'network'}
              onValueChange={(v) => setFocused(v === 'isolate')}
            >
              <TabsList aria-label="Assembly view">
                <TabsTrigger value="network">
                  <Network size={14} /> Network
                </TabsTrigger>
                <TabsTrigger value="isolate">
                  <Expand size={14} /> Isolate
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div>
              <button
                onClick={() => setSignals(!signals)}
                aria-pressed={signals}
              >
                <Radio size={14} /> Signal paths{' '}
                <span>{signals ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={toggle}
                aria-label={
                  paused ? 'Play scene animations' : 'Pause scene animations'
                }
              >
                {paused ? <Play size={15} /> : <Pause size={15} />}
                <span>{paused ? 'Play motion' : 'Pause'}</span>
              </button>
              <button
                onClick={() => controller.current?.reset()}
                aria-label="Reset camera"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
        </section>

        <section className="d-readout" aria-labelledby="selected-project">
          <div
            className="d-readout-number"
            aria-hidden="true"
            key={`number-${active}`}
          >
            0{active + 1}
            <span>↗</span>
          </div>
          <div className="d-readout-copy" key={project.id}>
            <div className="d-eyebrow">
              {project.kind.toUpperCase()} <span>/</span>{' '}
              {project.status.toUpperCase()}
            </div>
            <h2 id="selected-project">{project.name}</h2>
            <p>{project.description}</p>
            <div className="d-tech">
              {project.stack.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </div>
          <div className="d-readout-action">
            <span className="d-eyebrow">INSIDE THE MODULE</span>
            <p>{project.title}</p>
            <button
              className="d-primary"
              onClick={() => {
                setOpen(true);
                setStep(-1);
                setRunning(false);
              }}
            >
              Open workspace <ArrowUpRight size={20} />
            </button>
            {project.link && (
              <a href={project.link} target="_blank" rel="noreferrer">
                {project.linkLabel} <ArrowUpRight size={14} />
              </a>
            )}
          </div>
        </section>
        <section
          className="d-capabilities"
          aria-label={`${project.name} features`}
          key={`features-${project.id}`}
        >
          <div className="d-capabilities-heading">
            <span>CAPABILITY MAP</span>
            <code>{project.command}</code>
            <ArrowRight size={18} />
          </div>
          <div className="d-capability-flow">
            {project.features.map((f, i) => (
              <div
                className="d-capability"
                key={f.name}
                style={{ '--order': i } as CSSProperties}
              >
                <span className="d-cap-pin">
                  {String(i + 1).padStart(2, '0')}
                  <i />
                </span>
                <h3>{f.name}</h3>
                <p>{f.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="d-archive"
          id="open-source"
          aria-labelledby="open-source-title"
        >
          <div className="d-archive-art">
            <Image
              src={publicAsset('/images/dispatch/network-city.png')}
              width={1536}
              height={1024}
              alt="A crafted city of graphite computing modules linked by lime signal paths."
            />
            <div>
              <span className="d-eyebrow">A PUBLIC RECORD OF THE WORK</span>
              <h2 id="open-source-title">
                Open
                <br />
                by design<span>↗</span>
              </h2>
              <p>
                Selected contributions across my public repositories. Real
                changes, linked to the diff.
              </p>
              <a
                href="https://github.com/AntonioRivera03"
                target="_blank"
                rel="noreferrer"
              >
                View GitHub profile <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
          <div className="d-patch-feed">
            <div className="d-patch-header">
              <GitBranch size={16} />
              <span>MERGED CHANGES</span>
              <span>04 RECORDS</span>
            </div>
            {yardContributions.map((pr, i) => (
              <a
                className="d-patch"
                href={pr.url}
                key={pr.url}
                target="_blank"
                rel="noreferrer"
              >
                <span className="d-patch-track">
                  <GitMerge size={17} />
                  <i />
                </span>
                <div>
                  <div className="d-patch-meta">
                    <span>
                      {pr.repo} / #{pr.number}
                    </span>
                    <span>{pr.date}</span>
                  </div>
                  <h3>{pr.title}</h3>
                  <p>{pr.description}</p>
                  <span className="d-patch-status">
                    <Check size={12} /> MERGED{' '}
                    <span>
                      VIEW CHANGESET <ArrowUpRight size={12} />
                    </span>
                  </span>
                </div>
                <span className="d-patch-number">0{i + 1}</span>
              </a>
            ))}
          </div>
        </section>
        <footer className="d-footer">
          <div className="d-eyebrow">
            THE NEXT SYSTEM STARTS WITH A CONVERSATION.
          </div>
          <a
            className="d-footer-contact"
            href="mailto:antoniolrivera03@gmail.com"
          >
            Send a signal.
            <ArrowUpRight strokeWidth={1} />
          </a>
          <div className="d-footer-bottom">
            <a href={publicAsset('/')}>
              <ArrowLeft size={14} /> Back to portfolio
            </a>
            <span>ANTONIO RIVERA / DISPATCH</span>
            <a href="#dispatch-title">BACK TO TOP ↑</a>
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
          <Dialog.Backdrop className="d-dialog-backdrop" />
          <Dialog.Popup className={`d-workspace ${paused ? 'd-paused' : ''}`}>
            <div className="d-windowbar">
              <span>
                <Terminal size={15} /> dispatch / {project.id}
              </span>
              <span className="d-window-squares">
                <i />
                <i />
              </span>
              <Dialog.Close className="d-close" aria-label="Close workspace">
                <X size={19} />
              </Dialog.Close>
            </div>
            <div className="d-workspace-heading">
              <div>
                <span className="d-eyebrow">
                  MODULE 0{active + 1} / {project.status.toUpperCase()}
                </span>
                <Dialog.Title>
                  {project.name}
                  <span>_</span>
                </Dialog.Title>
              </div>
              <span className="d-workspace-mark">
                <Cpu size={50} strokeWidth={0.8} />
              </span>
            </div>
            <Dialog.Description className="d-workspace-description">
              {project.title}
            </Dialog.Description>
            <div className="d-flow" aria-label="Workflow stages">
              {flowLabels[active].map((label, i) => (
                <div
                  key={label}
                  className={step >= i ? 'is-reached' : ''}
                  style={{ '--order': i } as CSSProperties}
                >
                  <span>{step >= i ? <Check size={13} /> : `0${i + 1}`}</span>
                  <strong>{label}</strong>
                  <ChevronRight size={16} />
                </div>
              ))}
            </div>
            <Tabs defaultValue="interface" className="d-workspace-tabs">
              <TabsList aria-label="Project information">
                <TabsTrigger value="interface">
                  Interface & execution
                </TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
              </TabsList>
              <TabsContent value="interface">
                <div className="d-execution">
                  <div className="d-code">
                    <div>
                      {project.status === 'Design concept'
                        ? 'PROPOSED INTERFACE'
                        : 'WORKFLOW EXAMPLE'}
                    </div>
                    <pre>
                      {project.code.split('\n').map((line, i) => (
                        <span key={i}>
                          <i>{String(i + 1).padStart(2, '0')}</i>
                          {line || ' '}
                        </span>
                      ))}
                    </pre>
                  </div>
                  <div className="d-event-log">
                    <div>
                      SIMULATED EXECUTION <span>{step + 1} / 04</span>
                    </div>
                    <ol aria-live="polite">
                      {project.events.map((event, i) => (
                        <li
                          key={event}
                          className={step >= i ? 'is-revealed' : ''}
                        >
                          <span>{step >= i ? <Check size={13} /> : '·'}</span>
                          <p>{step >= i ? event : 'Waiting for example run'}</p>
                        </li>
                      ))}
                    </ol>
                    <button
                      className="d-primary"
                      disabled={running}
                      onClick={() => {
                        setStep(-1);
                        setRunning(true);
                      }}
                    >
                      <Play size={14} />{' '}
                      {running
                        ? 'Running example…'
                        : step < 0
                          ? 'Run example'
                          : 'Replay example'}
                    </button>
                    <small>Illustrative sequence. Runs here in the page.</small>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="features">
                <div className="d-workspace-features">
                  {project.features.map((f, i) => (
                    <div key={f.name}>
                      <span>0{i + 1}</span>
                      <h3>{f.name}</h3>
                      <p>{f.detail}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            <div className="d-workspace-footer">
              {project.id === 'aicorn' ? (
                <span>
                  Built on{' '}
                  <a
                    href="https://github.com/waseem-polus/aycorn"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Aycorn ↗
                  </a>
                  . One agent at a time; human review before merging.
                </span>
              ) : (
                <span>
                  {project.status === 'Design concept'
                    ? 'An independent design exploration; not a released implementation.'
                    : 'A live platform for research matching and participation.'}
                </span>
              )}
              {project.link && (
                <a href={project.link} target="_blank" rel="noreferrer">
                  {project.linkLabel}
                  <ArrowUpRight size={14} />
                </a>
              )}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
