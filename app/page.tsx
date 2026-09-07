'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  Asterisk,
  Check,
  Copy,
  Mail,
} from 'lucide-react';
import ProjectExperience, {
  type ProjectSelection,
  type ProjectKey,
} from './project-experience';
import { MatchVisual, AIcornVisual, KernelVisual } from './project-cards';
import Sculpture from './sculpture';
import ActivityLandscape from './activity';

const projects = {
  livedmatch: {
    name: 'LivedMatch',
    number: '01',
    type: 'Live platform',
    description:
      'Bringing lived experience into research. Thoughtful matches, trusted communities, and partnerships that go somewhere.',
    tags: ['Matching platform', 'Human-centered design'],
  },
  aicorn: {
    name: 'AICorn',
    number: '02',
    type: 'Open source integration',
    description:
      'Your backlog. Your agents. One Conductor to keep it all moving, with you in control.',
    tags: ['AI orchestration', 'React / TypeScript', 'Go'],
  },
  kernel: {
    name: 'Kernel',
    number: '03',
    type: 'Proposed concept',
    description:
      'What if an agent had to show its work? A small, local runtime with a memory of every move.',
    tags: ['Rust · proposed', 'Local-first', 'Agent runtime'],
  },
};

export default function Home() {
  const [selection, setSelection] = useState<ProjectSelection | null>(null);
  function openProject(key: ProjectKey, event: MouseEvent<HTMLButtonElement>) {
    const trigger = event.currentTarget;
    const source = trigger
      .closest('article')
      ?.querySelector<HTMLElement>('.project-open');
    if (source)
      setSelection({
        key,
        source,
        trigger,
        bounds: source.getBoundingClientRect(),
      });
  }
  const [copied, setCopied] = useState(false);
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText('antoniolrivera03@gmail.com');
      setCopied(true);
    } catch {
      window.location.href = 'mailto:antoniolrivera03@gmail.com';
    }
  }
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
  return (
    <>
      <a href="#work" className="skip-link">
        Skip to selected work
      </a>
      <header className="site-header">
        <a className="wordmark" href="#home" aria-label="Antonio Rivera home">
          antonio rivera
          <span className="brand-dot" />
        </a>
        <nav aria-label="Main navigation">
          <a href="#work">
            Work <span>01</span>
          </a>
          <a href="#about">
            About <span>03</span>
          </a>
          <a href="#contact">
            Let’s talk <ArrowUpRight size={14} />
          </a>
        </nav>
        <span className="availability">
          <i />
          Open to what’s next
        </span>
      </header>
      <main id="home">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-topline">
            <span className="eyebrow">
              SOFTWARE ENGINEER × CREATIVE THINKER
            </span>
            <span className="eyebrow">DALLAS, TX / EARTH</span>
          </div>
          <div className="hero-copy">
            <h1 id="hero-title">
              A little logic.
              <br />A lot of
              <br />
              <span>possibility.</span>
              <Asterisk className="headline-star" aria-hidden="true" />
            </h1>
            <p>
              I’m Antonio. I turn complex problems into
              <br className="desktop-br" /> thoughtful digital experiences.
            </p>
            <a className="pill-button primary-button" href="#work">
              Explore my work <ArrowDown size={17} />
            </a>
          </div>
          <div className="hero-art">
            <div className="art-grid" />
            <Sculpture />
          </div>
          <div className="hero-bottom">
            <a href="#work" className="scroll-prompt">
              <span>
                <ArrowDown size={18} />
              </span>
              SCROLL TO DISCOVER
            </a>
            <p>
              A developer’s mind.
              <br />
              An explorer’s instinct.
            </p>
            <span className="hero-coordinate">
              ALWAYS A WORK IN PROGRESS <span>↗</span>
            </span>
          </div>
        </section>
        <div className="manifesto-strip" aria-hidden="true">
          <div>
            <span>THINK DEEPLY</span>
            <Asterisk />
            <span>BUILD THOUGHTFULLY</span>
            <Asterisk />
            <span>STAY CURIOUS</span>
            <Asterisk />
            <span>MAKE IT MATTER</span>
            <Asterisk />
          </div>
        </div>
        <section
          className="section work-section"
          id="work"
          aria-labelledby="work-title"
        >
          <div className="section-label">
            <span className="eyebrow">01 / SELECTED WORK</span>
            <span className="eyebrow">
              TWO IN THE WORLD. ONE ON THE HORIZON.
            </span>
          </div>
          <div className="section-heading" data-reveal>
            <h2 id="work-title">
              Curiosity, <em>in practice.</em>
            </h2>
            <p>
              A few things I’ve put into the world.
              <br />
              And an idea for what comes next.
            </p>
          </div>
          <div className="projects-grid">
            {(Object.keys(projects) as ProjectKey[]).map((key) => {
              const p = projects[key];
              return (
                <article
                  key={key}
                  className={`project-card project-${key}`}
                  data-reveal
                >
                  <button
                    className="project-open"
                    onClick={(event) => openProject(key, event)}
                    aria-label={`Explore ${p.name}${key === 'kernel' ? ' concept' : ''}`}
                  >
                    {key === 'livedmatch' ? (
                      <MatchVisual />
                    ) : key === 'aicorn' ? (
                      <AIcornVisual />
                    ) : (
                      <KernelVisual />
                    )}
                    <span className="project-open-arrow">
                      <ArrowUpRight size={24} />
                    </span>
                  </button>
                  <div className="project-info">
                    <div className="project-name-row">
                      <div>
                        <span className="project-number">{p.number} /</span>
                        <h3>
                          <button onClick={(event) => openProject(key, event)}>
                            {p.name}
                          </button>
                        </h3>
                      </div>
                      <span
                        className={`project-type ${key === 'kernel' ? 'is-concept' : ''}`}
                      >
                        <i />
                        {p.type}
                      </span>
                    </div>
                    <p>{p.description}</p>
                    <div className="project-tags">
                      {p.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="work-footnote">
            <span>THERE’S ALWAYS ANOTHER IDEA.</span>
            <a
              href="https://github.com/AntonioRivera03"
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              More on GitHub <ArrowUpRight size={17} />
            </a>
          </div>
        </section>
        <ActivityLandscape />
        <section
          className="section about-section"
          id="about"
          aria-labelledby="about-title"
        >
          <div className="section-label">
            <span className="eyebrow">03 / THE HUMAN BEHIND THE CODE</span>
            <span className="eyebrow">ANTONIO RIVERA — SOFTWARE ENGINEER</span>
          </div>
          <div className="about-layout">
            <div data-reveal>
              <h2 id="about-title">
                Good things start
                <br />
                with <em>“what if?”</em>
              </h2>
              <div className="about-signature">
                ar<span>✳</span>
              </div>
              <span className="eyebrow">
                BASED IN DALLAS. THINKING EVERYWHERE.
              </span>
            </div>
            <div className="about-copy" data-reveal>
              <p className="large-copy">
                I like the space between
                <br />
                <span>“could this work?”</span> and
                <br />
                <span>“I made it work.”</span>
              </p>
              <p>
                I’m Antonio, a software engineer in Dallas, Texas. My work moves
                between human-centered platforms, AI integrations, and the
                systems underneath them.
              </p>
              <p>
                I care about the way things work and the way they feel. Clear
                interfaces. Thoughtful decisions. Details that reward a closer
                look.
              </p>
              <div className="capability-row">
                <span>THE INTERFACE</span>
                <p>React · TypeScript</p>
              </div>
              <div className="capability-row">
                <span>THE ENGINE</span>
                <p>Go · Python · Rust · SQLite</p>
              </div>
              <div className="capability-row">
                <span>THE NEXT QUESTION</span>
                <p>AI agents · Local-first systems</p>
              </div>
            </div>
          </div>
        </section>
        <footer className="section contact-section" id="contact">
          <div className="contact-topline">
            <span className="eyebrow">
              04 / A GOOD CONVERSATION CHANGES THINGS.
            </span>
            <span className="contact-status">
              <i />
              Open to engineering opportunities
            </span>
          </div>
          <a href="mailto:antoniolrivera03@gmail.com" className="contact-title">
            Let’s make
            <br />
            <em>what’s next.</em>
            <ArrowUpRight />
          </a>
          <div className="contact-subrow">
            <p>
              Interesting problems. Thoughtful people.
              <br />
              Something worth building together.
            </p>
            <div className="contact-methods">
              <a
                className="contact-link"
                href="mailto:antoniolrivera03@gmail.com"
              >
                <Mail size={18} /> antoniolrivera03@gmail.com{' '}
                <ArrowUpRight size={18} />
              </a>
              <button className="copy-email" onClick={copyEmail}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span aria-live="polite">
                  {copied ? 'Email copied' : 'Copy email'}
                </span>
              </button>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Antonio Rivera</span>
            <span>BUILT WITH INTENTION. AND A LITTLE CURIOSITY.</span>
            <a href="#home">Back to top ↑</a>
          </div>
        </footer>
      </main>
      {selection && (
        <ProjectExperience
          key={selection.key}
          selection={selection}
          onClosed={() => setSelection(null)}
        />
      )}
    </>
  );
}
