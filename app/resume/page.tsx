'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  BookOpenText,
  Brain,
  ChevronDown,
  Cpu,
  Download,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  Mail,
  MapPin,
} from 'lucide-react';
import { MatchVisual, AIcornVisual, MagnoliaVisual } from '../project-cards';
import { publicAsset } from '@/lib/site-paths';
import './resume.css';

function useReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    elements.forEach((el) => {
      el.classList.add('will-reveal');
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
}

const experience = [
  {
    company: 'Charles Schwab',
    location: '',
    dates: 'May 2026 – Present',
    role: 'Software Developer',
    stack: '',
    bullets: [
      'Build agentic workflows to automate tasks, reducing manual effort across day-to-day work.',
      'Develop applications that provide more efficient alternatives to existing tooling and processes.',
    ],
  },
  {
    company: 'Paycom',
    location: 'Irving, Texas',
    dates: 'November 2024 – February 2026',
    role: 'Full-Stack Software Developer II',
    stack: 'PHP / C# / TypeScript / JavaScript / SQL',
    bullets: [
      'Redesigned and implemented a workflow integrating government APIs to streamline document processing and consolidate government document management into a unified system.',
      'Enhanced React-based data analysis tools to support larger datasets; built a reusable PHP framework enabling cross-team API consumption and multi-department analysis.',
      'Modernized a legacy auditing system by applying reusable design patterns and developing features that gave clients insight into employee application usage.',
      'Optimized employee tracking dashboards, reducing page load times by 50% and query execution from ~8 seconds to 12 milliseconds.',
      'Delivered end-to-end development and production release of a performance-goal management feature with dynamically generated employee progress checklists.',
      'Developed comprehensive unit tests for full logic coverage and Selenium-based frontend automation for end-to-end validation.',
      'Diagnosed and led same-day investigation and resolution of client-impacting production issues, partnering with product analysts from root cause to production deploy.',
    ],
  },
  {
    company: 'CGI',
    location: 'Belton, Texas',
    dates: 'June 2023 – October 2024',
    role: 'Backend Software Developer',
    stack: 'Java / Python / SQL',
    bullets: [
      'Developed a Python automation tool to modernize legacy Java code into a standardized object-oriented architecture — 12,000 files, 160,000+ lines — finishing 6 months ahead of schedule.',
      'Collaborated with system architects on time-critical payroll processing enhancements using Java and SQL triggers, delivering 2 weeks after kickoff, 1 week ahead of schedule.',
      'Built backend services in Java and Django using JDBC and SQL to support government finance tracking through a secure web portal.',
      'Redesigned employee timesheet approval workflows with profile image integration, table-based approvals, and improved time-tracking views.',
    ],
  },
];

const skillGroups = [
  {
    label: 'Languages',
    items: ['PHP', 'Java', 'TypeScript', 'JavaScript', 'Python', 'SQL', 'C#', 'Dart', 'Shell', 'Kotlin'],
  },
  {
    label: 'Frameworks & Libraries',
    items: ['React', 'Next.js', 'Flask', 'Django', 'Laminas', 'Express', 'Pandas', 'PHPUnit'],
  },
  {
    label: 'Tools & Practice',
    items: ['Linux', 'Docker', 'AWS', 'Selenium', 'Unit Testing', 'Frontend Test Automation', 'Web Scraping', 'NoSQL', 'JDBC', 'Microservices', 'Government Compliance'],
  },
];

const projects = [
  {
    name: 'AICorn',
    href: 'https://github.com/AntonioRivera03/AIcorn',
    Visual: AIcornVisual,
    blurb:
      'An open-source task manager extended with AI agents. A Conductor mode plans, builds, and reviews work in isolated Git worktrees, with Kubernetes previews per branch and an MCP companion for scoped tool access.',
  },
  {
    name: 'LivedMatch',
    href: 'https://www.livedmatch.com',
    Visual: MatchVisual,
    blurb:
      'A live platform matching research studies with people who have relevant lived experience. Next.js, Prisma, and NeonDB with role-based access, transactional email, and a weighted matching algorithm.',
  },
  {
    name: 'Magnolia',
    href: 'https://github.com/AntonioRivera03/JournalAssistant',
    Visual: MagnoliaVisual,
    blurb:
      'A local-first PDF reader with AI in the margin. Highlight any passage to open a conversation anchored to that spot — local OCR, Qdrant retrieval, and Ollama chat, no cloud required.',
  },
];

const labWork = [
  {
    icon: Brain,
    title: 'Transformer from scratch',
    status: 'In progress',
    text: 'Working through a tiny GPT end to end: tokenization, embeddings, multi-head attention, and the training loop — no frameworks doing the thinking for me.',
  },
  {
    icon: Cpu,
    title: 'BPE tokenizer lab',
    status: 'In progress',
    text: 'Building a byte-pair encoding tokenizer by hand to understand how text becomes tokens: vocab construction, merges, and edge cases.',
  },
  {
    icon: FlaskConical,
    title: 'Attention visualizer',
    status: 'Planned',
    text: 'A small tool that renders attention weights as heatmaps over text, so you can see which tokens the model actually looks at.',
  },
  {
    icon: BookOpenText,
    title: 'Inference on a budget',
    status: 'Planned',
    text: 'KV-cache, quantization, and running small models on CPU — learning what makes local inference fast enough to be useful.',
  },
];

const ideas = [
  {
    title: 'Weights in the browser',
    text: 'A tiny transformer compiled to WebAssembly with a step-through forward pass — watch each layer transform the tokens, live.',
  },
  {
    title: 'RAG eval harness',
    text: 'A small benchmark for retrieval quality on document Q&A: chunking strategies vs. answer accuracy, measured instead of guessed.',
  },
  {
    title: 'Distilled reading companion',
    text: 'Fine-tuning a small model specifically for PDF question-answering — a focused follow-up to Magnolia, trained for one job.',
  },
];

function ExperienceCard({ job }: { job: (typeof experience)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="resume-job" data-reveal>
      <button
        className="resume-job-head"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div>
          <span className="eyebrow">{job.dates}</span>
          <h3>{job.company}</h3>
          <p>
            {job.role}
            {job.location ? ` · ${job.location}` : ''}
          </p>
          {job.stack ? (
            <span className="resume-stack">{job.stack}</span>
          ) : null}
        </div>
        <span className={`resume-job-toggle ${open ? 'is-open' : ''}`}>
          <ChevronDown size={20} />
        </span>
      </button>
      <div className={`resume-job-body ${open ? 'is-open' : ''}`}>
        <ul>
          {job.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default function ResumePage() {
  useReveal();
  return (
    <>
      <a href="#resume-main" className="skip-link">
        Skip to résumé
      </a>
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="Antonio Rivera home">
          antonio rivera
          <span className="brand-dot" />
        </a>
        <nav aria-label="Main navigation">
          <a href="/#work">
            Work <span>01</span>
          </a>
          <a href="/">
            <ArrowLeft size={14} /> Portfolio
          </a>
        </nav>
        <span className="availability">
          <i />
          Open to what’s next
        </span>
      </header>

      <main id="resume-main" className="resume">
        <section className="resume-hero" aria-labelledby="resume-title">
          <div className="resume-hero-topline">
            <span className="eyebrow">RÉSUMÉ · LAST UPDATED SEPTEMBER 2026</span>
            <span className="eyebrow">
              <MapPin size={12} /> AUSTIN, TEXAS
            </span>
          </div>
          <h1 id="resume-title">
            Antonio Rivera,
            <br />
            <span>software engineer.</span>
          </h1>
          <p className="resume-hero-copy">
            About 3.5 years building full-stack features, speeding up databases,
            and automating work that used to be done by hand. Recently certified
            on Google Cloud — and currently going deeper on how language models
            actually work.
          </p>
          <div className="resume-hero-actions">
            <a
              className="pill-button primary-button"
              href={publicAsset('/documents/Antonio-Rivera-Resume.pdf')}
              download="Antonio-Rivera-Resume.pdf"
            >
              <Download size={17} /> Download résumé
            </a>
            <a className="pill-button ghost-button" href="mailto:antoniolrivera03@gmail.com">
              <Mail size={17} /> Get in touch
            </a>
          </div>
          <dl className="resume-stats">
            <div data-reveal>
              <dt>Experience</dt>
              <dd>~3.5 yrs</dd>
            </div>
            <div data-reveal>
              <dt>Newest cert</dt>
              <dd>GCP Associate</dd>
            </div>
            <div data-reveal>
              <dt>Files migrated</dt>
              <dd>12,000</dd>
            </div>
            <div data-reveal>
              <dt>Query speedup</dt>
              <dd>8s → 12ms</dd>
            </div>
          </dl>
        </section>

        <section className="resume-section" aria-labelledby="exp-title">
          <div className="section-label">
            <span className="eyebrow">01 / EXPERIENCE</span>
          </div>
          <h2 id="exp-title" data-reveal>
            Where I’ve <em>worked.</em>
          </h2>
          <div className="resume-jobs">
            {experience.map((job) => (
              <ExperienceCard key={job.company} job={job} />
            ))}
          </div>
        </section>

        <section className="resume-section" aria-labelledby="skills-title">
          <div className="section-label">
            <span className="eyebrow">02 / SKILLS</span>
          </div>
          <h2 id="skills-title" data-reveal>
            What I <em>reach for.</em>
          </h2>
          <div className="resume-skills">
            {skillGroups.map((group) => (
              <div key={group.label} className="resume-skill-group" data-reveal>
                <span className="eyebrow">{group.label}</span>
                <div className="resume-chips">
                  {group.items.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="resume-section" aria-labelledby="proj-title">
          <div className="section-label">
            <span className="eyebrow">03 / PROJECTS</span>
          </div>
          <div className="section-heading" data-reveal>
            <h2 id="proj-title">
              Things I’ve <em>built.</em>
            </h2>
            <p>
              Full case studies live on the
              <br />
              main portfolio page.
            </p>
          </div>
          <div className="projects-grid">
            {projects.map((p) => (
              <article key={p.name} className="project-card" data-reveal>
                <a
                  className="project-open"
                  href={p.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${p.name} — opens in a new tab`}
                >
                  <p.Visual />
                  <span className="project-open-arrow">
                    <ArrowUpRight size={24} />
                  </span>
                </a>
                <div className="project-info">
                  <div className="project-name-row">
                    <h3>{p.name}</h3>
                  </div>
                  <p>{p.blurb}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="resume-section" aria-labelledby="edu-title">
          <div className="section-label">
            <span className="eyebrow">04 / EDUCATION & CERTIFICATION</span>
          </div>
          <h2 id="edu-title" data-reveal>
            How I <em>learned.</em>
          </h2>
          <div className="resume-edu-grid">
            <div className="resume-edu-card" data-reveal>
              <GraduationCap size={26} />
              <div>
                <h3>Texas A&M — Central Texas</h3>
                <p>B.S. in Computer Information Systems</p>
                <span className="eyebrow">DECEMBER 2023</span>
              </div>
            </div>
            <div className="resume-edu-card is-cert" data-reveal>
              <Award size={26} />
              <div>
                <h3>Google Cloud Certified</h3>
                <p>Associate Cloud Engineer</p>
                <span className="eyebrow">SEPTEMBER 2026 · NEW</span>
              </div>
            </div>
          </div>
        </section>

        <section className="resume-section" aria-labelledby="lab-title">
          <div className="section-label">
            <span className="eyebrow">05 / IN THE LAB</span>
          </div>
          <div className="section-heading" data-reveal>
            <h2 id="lab-title">
              Going deeper on <em>LLMs.</em>
            </h2>
            <p>
              Currently studying language models
              <br />
              from the ground up. In progress, not done.
            </p>
          </div>
          <div className="resume-lab-grid">
            {labWork.map((item) => (
              <article key={item.title} className="resume-lab-card" data-reveal>
                <div className="resume-lab-head">
                  <item.icon size={24} />
                  <span className="resume-lab-status">{item.status}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="resume-section" aria-labelledby="ideas-title">
          <div className="section-label">
            <span className="eyebrow">06 / IDEAS</span>
          </div>
          <div className="section-heading" data-reveal>
            <h2 id="ideas-title">
              What I’d like to <em>build next.</em>
            </h2>
            <p>
              Concepts, not commitments.
              <br />
              The lab work above feeds these.
            </p>
          </div>
          <div className="resume-ideas">
            {ideas.map((idea, i) => (
              <article key={idea.title} className="resume-idea" data-reveal>
                <span className="resume-idea-num">
                  <Lightbulb size={18} />
                  IDEA {String(i + 1).padStart(2, '0')}
                </span>
                <h3>{idea.title}</h3>
                <p>{idea.text}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="resume-footer" data-reveal>
          <h2>
            Like what you see?
            <br />
            <em>Let’s talk.</em>
          </h2>
          <div className="resume-footer-actions">
            <a className="pill-button primary-button" href="mailto:antoniolrivera03@gmail.com">
              <Mail size={17} /> antoniolrivera03@gmail.com
            </a>
            <a
              className="pill-button ghost-button"
              href="https://github.com/AntonioRivera03"
              target="_blank"
              rel="noreferrer"
            >
              GitHub <ArrowUpRight size={17} />
            </a>
            <a
              className="pill-button ghost-button"
              href="https://www.linkedin.com/in/antonio-rivera-094438272/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Antonio Rivera</span>
            <a href="/">Back to portfolio ↑</a>
          </div>
        </footer>
      </main>
    </>
  );
}
