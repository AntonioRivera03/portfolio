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
  BookOpenText,
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
import { MatchVisual, AIcornVisual, KernelVisual, MagnoliaVisual } from './project-cards';
import './project-experience.css';

export type ProjectKey = 'livedmatch' | 'aicorn' | 'kernel' | 'magnolia';
export type ProjectSelection = {
  key: ProjectKey;
  source: HTMLElement;
  trigger: HTMLButtonElement;
  bounds: DOMRect;
};
const names = { livedmatch: 'LivedMatch', aicorn: 'AICorn', kernel: 'Kernel', magnolia: 'Magnolia' };

function ProjectBrand({ project }: { project: ProjectKey }) {
  return (
    <span className={`experience-brand brand-${project}`}>
      {project === 'livedmatch' ? (
        <span className="experience-brand-mark">
          <Users size={19} />
        </span>
      ) : project === 'aicorn' ? (
        <Leaf size={25} />
      ) : project === 'magnolia' ? (
        <BookOpenText size={25} />
      ) : (
        <Cpu size={25} />
      )}
      {project === 'livedmatch'
        ? 'livedmatch'
        : project === 'kernel'
          ? 'kernel'
          : project === 'magnolia'
            ? 'magnolia'
            : 'AICorn'}
    </span>
  );
}

function ProjectLink({
  project,
  children,
}: {
  project: 'livedmatch' | 'aicorn' | 'magnolia';
  children: React.ReactNode;
}) {
  return (
    <a
      className="experience-cta"
      href={
        project === 'livedmatch'
          ? 'https://www.livedmatch.com'
          : project === 'magnolia'
            ? 'https://github.com/AntonioRivera03/JournalAssistant'
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
            <span /> A LIVE PLATFORM
          </span>
          <Dialog.Title className="experience-title">
            Research studies,
            <br />
            <em>matched with the right people.</em>
          </Dialog.Title>
          <Dialog.Description className="experience-intro">
            LivedMatch connects researchers with people who have relevant lived
            experience. Organizations post studies; the platform matches them
            with community members and tracks the partnership.
          </Dialog.Description>
          <ProjectLink project="livedmatch">Meet LivedMatch</ProjectLink>
          <div className="lm-hero-note">
            <HeartHandshake size={19} />
            <span>Live at livedmatch.com</span>
          </div>
        </div>
        <div className="lm-match-study">
          <div className="lm-study-overline">
            <span>HOW MATCHING WORKS</span>
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
          <span className="experience-kicker">HOW IT WORKS</span>
          <h2>
            From study posting
            <br />
            to <em>matched participants.</em>
          </h2>
          <p>
            Organizations post research questions; LivedMatch matches them with
            people in the community.
          </p>
        </div>
        <div className="lm-steps">
          <div>
            <span className="lm-step-number">01</span>
            <h3>Post a study.</h3>
            <p>
              Organizations define the research question and set who gets
              access to their community.
            </p>
          </div>
          <div>
            <span className="lm-step-number">02</span>
            <h3>Get a shortlist.</h3>
            <p>
              Shared questions with weighted answers rank applicants into a
              shortlist with compatibility scores.
            </p>
          </div>
          <div>
            <span className="lm-step-number">03</span>
            <h3>Follow through.</h3>
            <p>
              Reminders, check-ins, and follow-up surveys track the partnership
              from first introduction to outcome.
            </p>
          </div>
        </div>
      </section>
      <section className="lm-followthrough experience-section">
        <div>
          <HeartHandshake size={26} />
          <h2>
            Matching is
            <br />
            <em>the first step.</em>
          </h2>
          <p>
            The platform tracks what happens after the introduction:
            conversations, check-ins, and outcomes.
          </p>
        </div>
        <ol className="lm-partnership">
          <li>
            <span>
              <Check size={15} />
            </span>
            <div>
              <strong>Introductions</strong>
              <small>Researchers and participants connect over a shared study.</small>
            </div>
          </li>
          <li>
            <span>
              <Users size={15} />
            </span>
            <div>
              <strong>Check-ins</strong>
              <small>Reminders keep both sides engaged.</small>
            </div>
          </li>
          <li>
            <span>
              <Asterisk size={18} />
            </span>
            <div>
              <strong>Outcomes</strong>
              <small>Follow-up surveys record what each study produced.</small>
            </div>
          </li>
        </ol>
      </section>
      <footer className="experience-footer">
        <span>Built with Next.js, Prisma, and NeonDB. Live at livedmatch.com.</span>
        <ProjectLink project="livedmatch">Visit LivedMatch</ProjectLink>
      </footer>
    </>
  );
}

const conductorStages = [
  {
    name: 'Plan',
    icon: GitBranch,
    title: 'Plan first.',
    description:
      'A planning agent reads the ticket, gathers context, and writes the implementation plan before any code is written.',
    ticket: 'Clarify the requirements',
    status: 'Planning agent assigned',
    code: 'AIC–021',
  },
  {
    name: 'Build',
    icon: Terminal,
    title: 'Build in isolation.',
    description:
      'Implementation agents work in isolated Git worktrees, run their tests, and record the results on the ticket.',
    ticket: 'Build the activity view',
    status: 'Implementation in progress',
    code: 'AIC–024',
  },
  {
    name: 'Review',
    icon: ShieldCheck,
    title: 'You approve the merge.',
    description:
      'Finished work returns with a summary and a diff. You review the changes and decide what merges.',
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
            <span /> OPEN SOURCE · BUILT ON AYCORN
          </span>
          <Dialog.Title className="experience-title">
            A task manager
            <br />
            <em>that delegates to AI agents.</em>
          </Dialog.Title>
          <Dialog.Description className="experience-intro">
            AICorn extends the open-source Aycorn task manager with a Conductor
            mode: AI agents plan, implement, and review tasks, and nothing
            merges without your approval.
          </Dialog.Description>
          <ProjectLink project="aicorn">Explore AICorn</ProjectLink>
          <span className="ai-hero-credit">
            REACT / TYPESCRIPT · GO MCP COMPANION
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
          <span className="experience-kicker">HOW IT WORKS</span>
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
          <span>Agents do the work. Nothing merges without your approval.</span>
        </div>
      </section>
      <section className="ai-principles experience-section">
        <div>
          <Users size={25} />
          <h3>Configure each agent.</h3>
          <p>
            Each agent gets its own model and instructions. You choose which
            agents plan and which build.
          </p>
        </div>
        <div>
          <GitBranch size={25} />
          <h3>One shared board.</h3>
          <p>
            People and agents share one board. Every ticket has an owner and a
            visible next step.
          </p>
        </div>
        <div>
          <CircleDot size={25} />
          <h3>No silent handoffs.</h3>
          <p>
            Missing context is flagged. Completed work returns with tests,
            diffs, and a summary.
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

const magnoliaAnnotations = [
  {
    id: 'highlight',
    kind: 'Highlight',
    passage: '“…vector similarity in Qdrant, then grounds the answer in the top passages.”',
    heading: 'Yellow highlight',
    body: 'Saved to the margin with its page and position. Clicking it later — after scrolling, zooming, or restarting — jumps straight back to this passage.',
  },
  {
    id: 'ask',
    kind: 'Ask AI',
    passage: '“…vector similarity in Qdrant, then grounds the answer in the top passages.”',
    heading: 'Ask AI',
    body: 'The green highlight opened its own conversation. The question, the answer, and the exact passage stay linked — one chat per highlight, always findable.',
  },
  {
    id: 'comment',
    kind: 'Comment',
    passage: '“Overlapping annotations have a chooser so no chat becomes inaccessible.”',
    heading: 'Comment',
    body: 'A note pinned to the text with an orange dot at the passage’s end. Your thinking, kept where you thought it.',
  },
];

function MagnoliaPage() {
  const [active, setActive] = useState('ask');
  const current = magnoliaAnnotations.find((a) => a.id === active)!;
  return (
    <>
      <section className="mg-hero experience-section">
        <div className="mg-hero-copy">
          <span className="experience-kicker">
            <span /> LOCAL-FIRST · PDF READER
          </span>
          <Dialog.Title className="experience-title">
            Your documents,
            <br />
            <em>with AI in the margin.</em>
          </Dialog.Title>
          <Dialog.Description className="experience-intro">
            Magnolia — built in the open as JournalAssistant — is a
            document-first PDF reader. Highlight any passage to open a
            conversation anchored to that spot. OCR, embeddings, retrieval, and
            chat all run locally in Docker. No cloud required.
          </Dialog.Description>
          <ProjectLink project="magnolia">Explore the source</ProjectLink>
          <span className="mg-hero-credit">
            TYPESCRIPT · PYTHON · QDRANT · OLLAMA
          </span>
        </div>
        <div className="mg-demo" aria-label="Try an annotation">
          <div className="mg-demo-topline">
            <span className="experience-kicker">TRY AN ANNOTATION ↓</span>
          </div>
          <div className="mg-demo-body">
            <div className="mg-page">
              <div className="mg-page-title" />
              <p>
                Import a PDF and read it in a continuously scrolling view.
                Select any passage to open the toolbar —{' '}
                <button
                  className={`mg-annotation ${active === 'highlight' ? 'is-active' : ''}`}
                  onClick={() => setActive('highlight')}
                >
                  highlight it in yellow
                </button>
                , underline it, or{' '}
                <button
                  className={`mg-annotation is-ask ${active === 'ask' ? 'is-active' : ''}`}
                  onClick={() => setActive('ask')}
                >
                  ask AI about it in green
                </button>
                .
              </p>
              <p>
                Every annotation stores page-relative geometry and the original
                quote, so it survives scrolling and restarts.{' '}
                <button
                  className={`mg-annotation is-comment ${active === 'comment' ? 'is-active' : ''}`}
                  onClick={() => setActive('comment')}
                >
                  Leave a comment
                </button>{' '}
                and an orange dot marks the spot.
              </p>
            </div>
            <div className="mg-margin" aria-live="polite" key={active}>
              <span className="mg-margin-kind">{current.kind}</span>
              <blockquote>{current.passage}</blockquote>
              <h3>{current.heading}</h3>
              <p>{current.body}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="mg-how experience-section">
        <span className="experience-kicker">HOW IT WORKS</span>
        <ol className="mg-steps">
          <li>
            <strong>01 · Import</strong>
            <p>Drop in a PDF. Pages render near the viewport to bound memory.</p>
          </li>
          <li>
            <strong>02 · OCR</strong>
            <p>RapidOCR extracts text locally — scanned pages become readable.</p>
          </li>
          <li>
            <strong>03 · Index</strong>
            <p>Passages are embedded and stored in Qdrant for vector retrieval.</p>
          </li>
          <li>
            <strong>04 · Ask</strong>
            <p>Ollama chats against the retrieved passages, anchored to your highlight.</p>
          </li>
        </ol>
      </section>
      <section className="mg-principles experience-section">
        <div>
          <LockKeyhole size={25} />
          <h3>Local-first.</h3>
          <p>
            The whole stack — OCR, embeddings, Qdrant, and chat — runs in
            Docker on your machine. The default model runs on CPU; no GPU, no
            cloud.
          </p>
        </div>
        <div>
          <BookOpenText size={25} />
          <h3>Anchored, not floating.</h3>
          <p>
            Highlights and chats are pinned to page-relative geometry and the
            original quote. Your margin notes always know where they belong.
          </p>
        </div>
        <div>
          <Sparkles size={25} />
          <h3>Your model.</h3>
          <p>
            Start with a small local model, or point a workspace at OpenAI or
            OpenCode instead. The reader doesn’t care — the margin does.
          </p>
        </div>
      </section>
      <footer className="experience-footer">
        <span>
          Built as JournalAssistant, presented here as Magnolia.
          <br />
          Three panes: documents, pages, and the conversation in the margin.
        </span>
        <ProjectLink project="magnolia">Explore the source</ProjectLink>
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
            <span /> PROPOSED · NOT BUILT YET
          </span>
          <Dialog.Title className="experience-title">
            A local agent runtime
            <br />
            that <em>asks before writing.</em>
          </Dialog.Title>
          <Dialog.Description className="experience-intro">
            Kernel is a proposed Rust runtime for local AI agents. The agent
            reads and plans freely, but every file write needs explicit
            approval, and every tool call is recorded in an event journal.
          </Dialog.Description>
          <button className="experience-cta" onClick={demo}>
            Step inside the runtime <ArrowDown size={17} />
          </button>
          <div className="kernel-platform-note">
            <Terminal size={14} />
            <span>LOCAL-FIRST</span>
            <span>RUST (PROPOSED)</span>
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
          <span className="experience-kicker">HOW IT WOULD WORK</span>
          <h2>
            Read, plan,
            <br />
            <em>then ask permission.</em>
          </h2>
          <p>
            A scripted walkthrough: the agent reads a workspace, proposes a
            change, and stops until you approve or deny it.
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
          <span>01 / RUNS LOCALLY</span>
          <h3>
            Your machine.
            <br />
            Your files.
          </h3>
          <p>
            A local model connection and a designated workspace. Nothing leaves
            the machine.
          </p>
        </div>
        <div>
          <span>02 / EVERYTHING IS LOGGED</span>
          <h3>
            Nothing happens
            <br />
            off the record.
          </h3>
          <p>
            An event journal records the plan, every tool call, and every
            decision in one inspectable trail.
          </p>
        </div>
        <div>
          <span>03 / STOPS WHEN TOLD</span>
          <h3>
            Writes need
            <br />
            approval.
          </h3>
          <p>
            File writes require explicit permission, and runs are bounded by
            design.
          </p>
        </div>
      </section>
      <footer className="experience-footer">
        <span className="kernel-concept-note">
          <span />
          ON THE HORIZON
        </span>
        <p>
          Kernel is a proposed project, not built yet.
          <br />
          This page is a mockup of the intended design.
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
            ) : key === 'magnolia' ? (
              <MagnoliaVisual />
            ) : (
              <KernelVisual />
            )}
          </div>
          <div className="experience-page">
            <header className="experience-header">
              <ProjectBrand project={key} />
              <span className="experience-header-note">
                {key === 'livedmatch'
                  ? 'LIVE PLATFORM'
                  : key === 'aicorn'
                    ? 'OPEN SOURCE'
                    : key === 'magnolia'
                      ? 'LOCAL-FIRST BUILD'
                      : 'PROPOSED CONCEPT'}
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
              ) : key === 'magnolia' ? (
                <MagnoliaPage />
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
