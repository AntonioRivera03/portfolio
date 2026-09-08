'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { publicAsset } from '@/lib/site-paths';
import { Dialog } from '@base-ui/react/dialog';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Asterisk,
  Check,
  CheckCheck,
  ChevronRight,
  CircleDot,
  Cpu,
  GitBranch,
  HeartHandshake,
  Layers,
  Leaf,
  LockKeyhole,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Terminal,
  Users,
  X,
} from 'lucide-react';
import { MatchVisual, AIcornVisual, KernelVisual } from './project-cards';
import './project-experience.css';

export type ProjectKey = 'livedmatch' | 'aicorn' | 'kernel';
export type ProjectSelection = {
  key: ProjectKey;
  source: HTMLElement;
  trigger: HTMLButtonElement;
  bounds: DOMRect;
};
const names = { livedmatch: 'LivedMatch', aicorn: 'AICorn', kernel: 'Kernel' };

function ProjectBrand({ project }: { project: ProjectKey }) {
  return (
    <span className={`experience-brand brand-${project}`}>
      {project === 'livedmatch' ? (
        <span className="experience-brand-mark">
          <Users size={19} />
        </span>
      ) : project === 'aicorn' ? (
        <Leaf size={25} />
      ) : (
        <Cpu size={25} />
      )}
      {project === 'livedmatch'
        ? 'livedmatch'
        : project === 'kernel'
          ? 'kernel'
          : 'AICorn'}
    </span>
  );
}

function ProjectLink({
  project,
  children,
}: {
  project: 'livedmatch' | 'aicorn';
  children: React.ReactNode;
}) {
  return (
    <a
      className="experience-cta"
      href={
        project === 'livedmatch'
          ? 'https://www.livedmatch.com'
          : 'https://github.com/AntonioRivera03/AIcorn'
      }
      target="_blank"
      rel="noreferrer"
    >
      {children}
      <ArrowUpRight size={18} />
    </a>
  );
}

const studyExamples = [
  {
    label: 'Chronic pain',
    topic: 'Living with chronic pain',
    people: [
      { initials: 'JL', name: 'Jordan', role: 'Lived experience', score: 96 },
      { initials: 'MR', name: 'Morgan', role: 'Patient advocate', score: 91 },
      { initials: 'AK', name: 'Alex', role: 'Community member', score: 87 },
    ],
  },
  {
    label: 'Caregiving',
    topic: 'The everyday work of caregiving',
    people: [
      { initials: 'AK', name: 'Alex', role: 'Family caregiver', score: 98 },
      { initials: 'JL', name: 'Jordan', role: 'Lived experience', score: 93 },
      { initials: 'MR', name: 'Morgan', role: 'Patient advocate', score: 89 },
    ],
  },
];

function LivedMatchPage() {
  const [study, setStudy] = useState(0);
  const example = studyExamples[study];
  return (
    <>
      <section className="lm-hero experience-section">
        <div className="lm-hero-copy">
          <span className="experience-kicker">
            <span /> PEOPLE FIRST. ALWAYS.
          </span>
          <Dialog.Title className="experience-title">
            Better research.
            <br />
            <em>More human.</em>
          </Dialog.Title>
          <Dialog.Description className="experience-intro">
            The people living the experience deserve a place in the research.
            LivedMatch helps them find it.
          </Dialog.Description>
          <ProjectLink project="livedmatch">Meet LivedMatch</ProjectLink>
          <div className="lm-hero-note">
            <HeartHandshake size={19} />
            <span>Good matches. Meaningful work.</span>
          </div>
        </div>
        <div className="lm-match-study">
          <div className="lm-study-overline">
            <span>A CONNECTION WORTH MAKING</span>
            <Asterisk size={25} />
          </div>
          <div className="lm-study-window">
            <div className="lm-window-heading">
              <span className="lm-window-icon">
                <Layers size={19} />
              </span>
              <div>
                <span>THE RESEARCH QUESTION</span>
                <h3>{example.topic}</h3>
              </div>
            </div>
            <div
              className="lm-study-selector"
              aria-label="Illustrative research topic"
            >
              {studyExamples.map((item, index) => (
                <button
                  key={item.label}
                  aria-pressed={index === study}
                  onClick={() => setStudy(index)}
                >
                  {item.label}
                  {index === study && <Check size={13} />}
                </button>
              ))}
            </div>
            <div className="lm-shortlist-label">
              <span>A FEW PEOPLE TO MEET</span>
              <span>COMPATIBILITY</span>
            </div>
            <div className="lm-shortlist" aria-live="polite">
              {example.people.map((person, index) => (
                <div
                  className={`lm-person lm-person-${index}`}
                  key={`${study}-${person.initials}`}
                  style={{ '--person-index': index } as CSSProperties}
                >
                  <span className="lm-avatar">{person.initials}</span>
                  <div>
                    <strong>{person.name}</strong>
                    <span>{person.role}</span>
                  </div>
                  <span className="lm-fit">
                    {person.score}
                    <small>% fit</small>
                  </span>
                </div>
              ))}
            </div>
            <div className="lm-window-footer">
              <ShieldCheck size={16} />
              <span>Your community. Your ground rules.</span>
            </div>
          </div>
          <div className="lm-connection-note">
            <span>
              <CheckCheck size={16} />
            </span>
            <p>
              A shared purpose.
              <br />
              <strong>A real starting point.</strong>
            </p>
          </div>
          <p className="experience-fineprint lm-example-note">
            Illustrative shortlist · sample people and scores
          </p>
        </div>
      </section>
      <section className="lm-story experience-section">
        <div className="lm-story-heading">
          <span className="experience-kicker">
            LESS GUESSWORK. MORE CONNECTION.
          </span>
          <h2>
            The right introduction
            <br />
            can change <em>the whole study.</em>
          </h2>
          <p>
            Organizations know their communities. Researchers know their
            questions. LivedMatch brings the two together.
          </p>
        </div>
        <div className="lm-steps">
          <div>
            <span className="lm-step-number">01</span>
            <h3>Start with trust.</h3>
            <p>
              Organizations set the questions and decide who gets access to
              their community.
            </p>
          </div>
          <div>
            <span className="lm-step-number">02</span>
            <h3>Find the real fit.</h3>
            <p>
              Shared questions and weighted answers turn a pile of applicants
              into a thoughtful shortlist.
            </p>
          </div>
          <div>
            <span className="lm-step-number">03</span>
            <h3>Stay for the follow-through.</h3>
            <p>
              From the first hello to the final outcome, reminders and check-ins
              keep the partnership moving.
            </p>
          </div>
        </div>
      </section>
      <section className="lm-followthrough experience-section">
        <div>
          <HeartHandshake size={26} />
          <h2>
            A match is just
            <br />
            <em>the beginning.</em>
          </h2>
          <p>
            Because “Did anything come of it?”
            <br />
            should have a good answer.
          </p>
        </div>
        <ol className="lm-partnership">
          <li>
            <span>
              <Check size={15} />
            </span>
            <div>
              <strong>The introduction</strong>
              <small>A shared reason to connect.</small>
            </div>
          </li>
          <li>
            <span>
              <Users size={15} />
            </span>
            <div>
              <strong>The first conversation</strong>
              <small>A nudge if life gets in the way.</small>
            </div>
          </li>
          <li>
            <span>
              <Asterisk size={18} />
            </span>
            <div>
              <strong>Something worth sharing</strong>
              <small>Follow-up surveys. Real outcomes. A full story.</small>
            </div>
          </li>
        </ol>
      </section>
      <footer className="experience-footer">
        <span>Built around people, from the first question on.</span>
        <ProjectLink project="livedmatch">Visit LivedMatch</ProjectLink>
      </footer>
    </>
  );
}

const conductorStages = [
  {
    name: 'Plan',
    icon: GitBranch,
    title: 'A good start beats a long prompt.',
    description:
      'Conductor checks the requirements and gives the right planning agent the context to get started.',
    ticket: 'Clarify the requirements',
    status: 'Planning agent assigned',
    code: 'AIC–021',
  },
  {
    name: 'Build',
    icon: Terminal,
    title: 'Give every agent room to work.',
    description:
      'Implementation agents work in isolated Git worktrees, run their tests, and leave a clear record on the ticket.',
    ticket: 'Build the activity view',
    status: 'Implementation in progress',
    code: 'AIC–024',
  },
  {
    name: 'Review',
    icon: ShieldCheck,
    title: 'The last word is yours.',
    description:
      'Finished work comes back to your review stage. Read the summary, check the changes, and decide what’s Done.',
    ticket: 'Ready for a human look',
    status: 'Waiting for your review',
    code: 'AIC–028',
  },
];

const conductorPaths = [
  'M575 480 C495 436 499 353 370 359',
  'M603 380 C625 325 656 296 700 258',
  'M858 491 C967 482 925 365 1056 365',
  'M556 705 C473 667 480 791 352 800',
  'M891 664 C1029 638 960 794 1022 796',
  'M733 812 C730 860 749 877 746 919',
];

function AicornPage() {
  const [stage, setStage] = useState(1);
  const [flowing, setFlowing] = useState(true);
  const current = conductorStages[stage];
  const StageIcon = current.icon;
  return (
    <>
      <section className="ai-hero experience-section">
        <div className="ai-hero-copy">
          <span className="experience-kicker">
            <span /> IDEAS, CONNECTED TO ACTION.
          </span>
          <Dialog.Title className="experience-title">
            Many agents.
            <br />
            <em>One Conductor.</em>
          </Dialog.Title>
          <Dialog.Description className="experience-intro">
            Your backlog has potential. Give it a team that can get to work—with
            you calling the shots.
          </Dialog.Description>
          <ProjectLink project="aicorn">Explore AICorn</ProjectLink>
          <span className="ai-hero-credit">
            PROJECT MANAGEMENT, MEET AI DEVELOPMENT.
          </span>
        </div>
        <div
          className={`ai-conductor-art ${flowing ? 'is-flowing' : 'is-paused'} stage-${stage}`}
        >
          <div className="ai-art-grid" />
          <Image
            unoptimized
            className="ai-conductor-render"
            src={publicAsset('/images/aicorn-conductor.webp')}
            alt="A sculptural Conductor hub with copper nerve-like branches connecting a constellation of floating tickets"
            width="1400"
            height="1200"
          />
          <svg
            className="ai-conductor-signal-map"
            viewBox="0 0 1400 1200"
            aria-hidden="true"
          >
            {conductorPaths.map((path, index) => (
              <path
                className="ai-flow-packet"
                key={path}
                d={path}
                pathLength="100"
                style={{ '--flow-delay': `${index * -0.7}s` } as CSSProperties}
              />
            ))}
          </svg>
          <div className="ai-hub-caption">
            <Sparkles size={15} />
            <span>CONDUCTOR</span>
            <span className="ai-signal-light" />
          </div>
          <div className="ai-live-ticket" key={stage}>
            <div>
              <span>{current.code}</span>
              <StageIcon size={15} />
            </div>
            <strong>{current.ticket}</strong>
            <small>
              <span />
              {current.status}
            </small>
          </div>
          <div className="ai-art-caption">
            <button
              aria-label={
                flowing
                  ? 'Pause Conductor animation'
                  : 'Play Conductor animation'
              }
              aria-pressed={!flowing}
              onClick={() => setFlowing(!flowing)}
            >
              {flowing ? <Pause size={13} /> : <Play size={13} />}
            </button>
          </div>
        </div>
      </section>
      <section className="ai-workflow experience-section">
        <div className="ai-section-topline">
          <span className="experience-kicker">YOUR WORKFLOW. YOUR RULES.</span>
          <span className="experience-fineprint">Explore the handoff ↓</span>
        </div>
        <div
          className="ai-stage-controls"
          aria-label="Explore the Conductor workflow"
        >
          {conductorStages.map((item, index) => (
            <button
              key={item.name}
              aria-pressed={stage === index}
              onClick={() => setStage(index)}
            >
              <span>0{index + 1}</span>
              <item.icon size={20} />
              <strong>{item.name}</strong>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
        <div className="ai-stage-story" aria-live="polite">
          <h2>{current.title}</h2>
          <p>{current.description}</p>
        </div>
        <div className="ai-human-checkpoint">
          <ShieldCheck size={17} />
          <span>Agents move the work forward. You decide when it’s Done.</span>
        </div>
      </section>
      <section className="ai-principles experience-section">
        <div>
          <Users size={25} />
          <h3>A team that fits.</h3>
          <p>
            Give agents their own instructions and models. Choose who plans, and
            who builds.
          </p>
        </div>
        <div>
          <GitBranch size={25} />
          <h3>Room to make progress.</h3>
          <p>
            People and agents share one board. Every ticket has an owner and a
            visible next step.
          </p>
        </div>
        <div>
          <CircleDot size={25} />
          <h3>No mystery handoffs.</h3>
          <p>
            Missing context gets flagged. Work comes back with tests, changes,
            and a clear summary.
          </p>
        </div>
      </section>
      <footer className="experience-footer">
        <span>
          Built on Aycorn’s open-source foundation.
          <br />
          <a
            href="https://github.com/waseem-polus/aycorn"
            target="_blank"
            rel="noreferrer"
          >
            With credit to its original contributors <ArrowUpRight size={12} />
          </a>
        </span>
        <ProjectLink project="aicorn">Explore the source</ProjectLink>
      </footer>
    </>
  );
}

type RunStage =
  | 'idle'
  | 'reading'
  | 'planning'
  | 'waiting'
  | 'approved'
  | 'rejected';
function KernelPage() {
  const [stage, setStage] = useState<RunStage>('idle');
  const demoRef = useRef<HTMLElement>(null);
  const runButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (stage !== 'reading' && stage !== 'planning') return;
    const timer = window.setTimeout(
      () => setStage(stage === 'reading' ? 'planning' : 'waiting'),
      750,
    );
    return () => window.clearTimeout(timer);
  }, [stage]);
  const step = {
    idle: 0,
    reading: 1,
    planning: 2,
    waiting: 3,
    approved: 4,
    rejected: 4,
  }[stage];
  const liveStatus = {
    idle: 'Runtime ready. Start a run to see what happens.',
    reading: 'Reading the sample workspace.',
    planning: 'Preparing a proposed change.',
    waiting: 'A change is ready. Waiting for your permission.',
    approved: 'Approved. The simulated checklist is ready.',
    rejected: 'Denied. The proposed change was discarded.',
  }[stage];
  const demo = () => {
    demoRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'center',
    });
    runButtonRef.current?.focus({ preventScroll: true });
  };
  return (
    <>
      <section className="kernel-hero experience-section">
        <div className="kernel-hero-copy">
          <span className="experience-kicker">
            <span /> A SMALL EXPERIMENT IN AGENCY
          </span>
          <Dialog.Title className="experience-title">
            Let it think.
            <br />
            Make it <em>ask.</em>
          </Dialog.Title>
          <Dialog.Description className="experience-intro">
            An agent with room to explore. A runtime that knows where to stop.
            Kernel is an idea for keeping powerful tools on your terms.
          </Dialog.Description>
          <button className="experience-cta" onClick={demo}>
            Step inside the runtime <ArrowDown size={17} />
          </button>
          <div className="kernel-platform-note">
            <Terminal size={14} />
            <span>LOCAL FIRST</span>
            <span>RUST, AT HEART</span>
          </div>
        </div>
        <div
          className="kernel-system"
          aria-label="Runtime diagram: a local core inside event journal and permission boundaries"
        >
          <div className="kernel-system-coordinate">
            SYS.03 / BOUNDED BY DESIGN
          </div>
          <svg viewBox="0 0 600 560" aria-hidden="true">
            <defs>
              <radialGradient id="kernelGlow">
                <stop offset="0" stopColor="#a6b5ff" stopOpacity=".35" />
                <stop offset="1" stopColor="#6976d4" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="kernelCore" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#e2e5ff" />
                <stop offset=".5" stopColor="#8592e8" />
                <stop offset="1" stopColor="#424a86" />
              </linearGradient>
            </defs>
            <circle cx="300" cy="280" r="240" fill="url(#kernelGlow)" />
            <g className="kernel-rings">
              <ellipse
                cx="300"
                cy="280"
                rx="250"
                ry="132"
                transform="rotate(-30 300 280)"
              />
              <ellipse
                cx="300"
                cy="280"
                rx="205"
                ry="110"
                transform="rotate(-30 300 280)"
              />
              <ellipse
                cx="300"
                cy="280"
                rx="158"
                ry="85"
                transform="rotate(-30 300 280)"
              />
            </g>
            <g className="kernel-ring-track">
              <circle cx="300" cy="280" r="187" />
              <circle cx="300" cy="280" r="231" />
            </g>
            <path
              className="kernel-axis"
              d="M50 424 550 136 M300 38V522 M50 136 550 424"
            />
            <g className="kernel-core-object">
              <path
                d="m300 185 85 49v98l-85 49-85-49v-98z"
                fill="url(#kernelCore)"
              />
              <path d="m300 185 85 49-85 49-85-49z" fill="#cbd2ff" />
              <path d="m300 283 85-49v98l-85 49z" fill="#606dc0" />
              <path
                d="M300 283v98m-85-147 85 49 85-49"
                fill="none"
                stroke="#e2e6ff"
                strokeOpacity=".5"
              />
              <path
                d="m300 210 41 24-41 24-41-24z"
                fill="#1c2241"
                stroke="#f0f1ff"
                strokeOpacity=".65"
              />
              <path d="m300 221 23 13-23 13-23-13z" fill="#bcc9ff" />
              <circle cx="300" cy="234" r="4" fill="white" />
            </g>
            <g className="kernel-orbit-points">
              <circle cx="122" cy="342" r="6" />
              <circle cx="475" cy="168" r="4" />
              <circle cx="348" cy="450" r="4" />
            </g>
          </svg>
          <div className="kernel-diagram-label kernel-label-permission">
            <span>01</span> permission boundary
            <LockKeyhole size={13} />
          </div>
          <div className="kernel-diagram-label kernel-label-journal">
            <span>02</span> event journal
          </div>
          <div className="kernel-core-caption">
            <span className="kernel-signal" />
            THE LOCAL CORE
          </div>
        </div>
      </section>
      <section className="kernel-demo-section experience-section" ref={demoRef}>
        <div className="kernel-demo-copy">
          <span className="experience-kicker">A LITTLE TRUST EXERCISE</span>
          <h2>
            Watch it work.
            <br />
            <em>Then draw the line.</em>
          </h2>
          <p>
            One small task. A trace you can follow. And a moment where nothing
            happens until you say so.
          </p>
          <div className="kernel-demo-boundaries">
            <span>
              <Check size={15} /> Read the sample notes
            </span>
            <span>
              <Check size={15} /> Prepare a plan
            </span>
            <span>
              <LockKeyhole size={14} /> Ask before writing
            </span>
          </div>
        </div>
        <div className={`kernel-console run-${stage}`}>
          <div className="kernel-console-bar">
            <span>
              <i />
              <i />
              <i />
            </span>
            <span>kernel / local session</span>
            <span className="kernel-console-badge">SIMULATION</span>
          </div>
          <div className="kernel-console-body">
            <div className="kernel-command">
              <span>❯</span>
              <code>
                kernel run <span>&quot;make a checklist&quot;</span>
              </code>
            </div>
            <div className="kernel-execution">
              <div className={step >= 1 ? 'is-complete' : ''}>
                <span>01</span>
                <code>workspace.read</code>
                <small>{step >= 1 ? 'notes/project.md' : 'ready'}</small>
                {step >= 1 && <Check size={14} />}
              </div>
              <div className={step >= 2 ? 'is-complete' : ''}>
                <span>02</span>
                <code>plan.created</code>
                <small>{step >= 2 ? '1 proposed write' : 'queued'}</small>
                {step >= 2 && <Check size={14} />}
              </div>
              <div className={step >= 3 ? 'is-checkpoint' : ''}>
                <span>03</span>
                <code>permission.request</code>
                <small>{step >= 3 ? 'checklist.md' : 'queued'}</small>
                {step >= 3 && <LockKeyhole size={14} />}
              </div>
            </div>
            <output className="kernel-console-status">
              <span />
              {liveStatus}
            </output>
            {stage === 'idle' ? (
              <button
                className="kernel-run-button"
                ref={runButtonRef}
                onClick={() => setStage('reading')}
              >
                <Play size={14} /> Run the example <ArrowRight size={16} />
              </button>
            ) : stage === 'reading' || stage === 'planning' ? (
              <div className="kernel-running">
                <span />
                Following the trace…
              </div>
            ) : stage === 'waiting' ? (
              <div className="kernel-permission">
                <div>
                  <ShieldCheck size={18} />
                  <p>
                    Write <strong>checklist.md</strong>?
                    <small>The agent has a plan. You have the choice.</small>
                  </p>
                </div>
                <div className="kernel-permission-actions">
                  <button onClick={() => setStage('approved')}>
                    <Check size={15} /> Allow this write
                  </button>
                  <button onClick={() => setStage('rejected')}>
                    <X size={15} /> Deny
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="kernel-output">
                  {stage === 'approved' ? (
                    <>
                      <span>
                        <CheckCheck size={15} /> SIMULATED WRITE COMPLETE
                      </span>
                      <pre>
                        {
                          '# Project checklist\n\n[ ] Clarify the problem\n[ ] Build a small first version\n[ ] Test the important paths\n[ ] Write down what changed'
                        }
                      </pre>
                    </>
                  ) : (
                    <>
                      <span>
                        <ShieldCheck size={15} /> BOUNDARY HELD
                      </span>
                      <p>
                        The agent stopped. The notes stayed exactly as they
                        were.
                      </p>
                    </>
                  )}
                </div>
                <button
                  className="kernel-replay"
                  onClick={() => setStage('idle')}
                >
                  <RotateCcw size={13} /> Start a fresh run
                </button>
              </>
            )}
          </div>
          <div className="kernel-console-footer">
            Scripted interaction. No model runs. No files are changed.
          </div>
        </div>
      </section>
      <section className="kernel-principles experience-section">
        <div>
          <span>01 / OWN THE SPACE</span>
          <h3>
            Your machine.
            <br />
            Your business.
          </h3>
          <p>
            A local model connection and a designated workspace. A small world,
            on purpose.
          </p>
        </div>
        <div>
          <span>02 / KEEP THE RECEIPTS</span>
          <h3>
            Nothing disappears
            <br />
            into a black box.
          </h3>
          <p>
            An event journal keeps the plan, the tool calls, and the decisions
            in one inspectable trail.
          </p>
        </div>
        <div>
          <span>03 / KNOW WHEN TO STOP</span>
          <h3>
            Power, with
            <br />a pause button.
          </h3>
          <p>
            Explicit permissions and bounded runs. Knowing when to stop is part
            of doing the job.
          </p>
        </div>
      </section>
      <footer className="experience-footer">
        <span className="kernel-concept-note">
          <span />
          ON THE HORIZON
        </span>
        <p>
          Kernel is a proposed project.
          <br />
          This is a glimpse of what I want to build.
        </p>
      </footer>
    </>
  );
}

export default function ProjectExperience({
  selection,
  onClosed,
}: {
  selection: ProjectSelection;
  onClosed: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [bounds, setBounds] = useState(selection.bounds);
  const [settled, setSettled] = useState(false);
  const [closingFrame, setClosingFrame] = useState<{
    rect: DOMRect;
    radius: string;
  } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const source = selection.source;
    source.classList.add('project-is-expanded');
    return () => {
      source.classList.remove('project-is-expanded');
    };
  }, [selection]);
  const { key, source, trigger } = selection;
  const style = {
    '--card-left': `${bounds.left}px`,
    '--card-top': `${bounds.top}px`,
    '--card-width': `${bounds.width}px`,
    '--card-height': `${bounds.height}px`,
    ...(closingFrame
      ? {
          '--close-left': `${closingFrame.rect.left}px`,
          '--close-top': `${closingFrame.rect.top}px`,
          '--close-width': `${closingFrame.rect.width}px`,
          '--close-height': `${closingFrame.rect.height}px`,
          '--close-radius': closingFrame.radius,
        }
      : {}),
  } as CSSProperties;
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          if (popupRef.current)
            setClosingFrame({
              rect: popupRef.current.getBoundingClientRect(),
              radius: getComputedStyle(popupRef.current).borderRadius,
            });
          setBounds(source.getBoundingClientRect());
          setSettled(false);
          setOpen(false);
        }
      }}
      onOpenChangeComplete={(isOpen) => {
        if (isOpen) setSettled(true);
        else onClosed();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="experience-backdrop" />
        <Dialog.Popup
          ref={popupRef}
          className={`project-experience experience-${key} ${settled ? 'is-settled' : ''}`}
          style={style}
          initialFocus={closeRef}
          finalFocus={() => trigger}
          aria-label={`${names[key]} project`}
        >
          <div className="experience-card-cover" aria-hidden="true">
            {key === 'livedmatch' ? (
              <MatchVisual />
            ) : key === 'aicorn' ? (
              <AIcornVisual />
            ) : (
              <KernelVisual />
            )}
          </div>
          <div className="experience-page">
            <header className="experience-header">
              <ProjectBrand project={key} />
              <span className="experience-header-note">
                {key === 'livedmatch'
                  ? 'PEOPLE × PURPOSE'
                  : key === 'aicorn'
                    ? 'INTELLIGENCE × ACTION'
                    : 'SYSTEMS × AGENCY'}
              </span>
              <Dialog.Close className="experience-close" ref={closeRef}>
                <span>Back to work</span>
                <X size={18} />
                <span className="sr-only">Close {names[key]} project</span>
              </Dialog.Close>
            </header>
            <div className="experience-scroll">
              {key === 'livedmatch' ? (
                <LivedMatchPage />
              ) : key === 'aicorn' ? (
                <AicornPage />
              ) : (
                <KernelPage />
              )}
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
