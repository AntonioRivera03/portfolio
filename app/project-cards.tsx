import {
  Asterisk,
  Check,
  Cpu,
  GitBranch,
  Layers,
  Leaf,
  Sparkles,
  Terminal,
  Users,
} from 'lucide-react';

export function MatchVisual() {
  return (
    <div className="project-visual match-visual" aria-hidden="true">
      <div className="visual-topbar">
        <span className="mini-brand">
          <span className="match-logo">
            <Users size={16} />
          </span>
          livedmatch
        </span>
        <span>MEANINGFUL CONNECTIONS</span>
      </div>
      <div className="match-headline">
        Better research.
        <br />
        <em>More human.</em>
      </div>
      <div className="matching-flow">
        <div className="flow-person">
          <div className="person-icon">
            <Users size={26} />
          </div>
          <span>Lived experience</span>
          <small>Your perspective matters.</small>
        </div>
        <div className="connection-line">
          <i />
          <i />
          <i />
        </div>
        <div className="match-center">
          <Asterisk size={38} strokeWidth={1.4} />
        </div>
        <div className="connection-line">
          <i />
          <i />
          <i />
        </div>
        <div className="flow-person">
          <div className="person-icon">
            <Layers size={26} />
          </div>
          <span>Research projects</span>
          <small>Built around real people.</small>
        </div>
      </div>
      <div className="match-bottom">
        <span>
          <Check size={12} /> Shared purpose
        </span>
        <span>
          <Check size={12} /> Mutual choice
        </span>
        <span>
          <Check size={12} /> Real collaboration
        </span>
      </div>
    </div>
  );
}
export function AIcornVisual() {
  return (
    <div className="project-visual aicorn-visual" aria-hidden="true">
      <div className="visual-topbar">
        <span className="mini-brand">
          <Leaf size={20} /> AIcorn
        </span>
        <span>AN AYCORN INTEGRATION</span>
      </div>
      <div className="aicorn-orbit">
        <svg viewBox="0 0 600 300" className="orbit-lines">
          <path d="M98 95 C250 95 165 150 300 150 S430 95 503 95 M98 223 C230 223 165 150 300 150 S430 220 503 223" />
          <circle cx="300" cy="150" r="91" />
          <circle cx="300" cy="150" r="130" />
        </svg>
        <div className="orbit-core">
          <Sparkles size={42} strokeWidth={1.1} />
          <span>AIcorn</span>
        </div>
        <div className="orbit-node node-one">
          <GitBranch size={17} />
          <span>Task context</span>
        </div>
        <div className="orbit-node node-two">
          <Terminal size={17} />
          <span>MCP tools</span>
        </div>
        <div className="orbit-node node-three">
          <Users size={17} />
          <span>Agent personas</span>
        </div>
        <div className="orbit-node node-four">
          <Check size={17} />
          <span>Task jobs</span>
        </div>
      </div>
    </div>
  );
}
export function KernelVisual() {
  return (
    <div className="project-visual kernel-visual" aria-hidden="true">
      <div className="visual-topbar">
        <span className="mini-brand">
          <Cpu size={20} /> kernel
        </span>
        <span className="concept-stamp">CONCEPT / NOT YET BUILT</span>
      </div>
      <div className="terminal-preview">
        <div className="terminal-dots">
          <i />
          <i />
          <i />
          <span>runtime / trace</span>
        </div>
        <div className="terminal-code">
          <p>
            <span className="terminal-green">~</span> kernel run{' '}
            <span className="terminal-dim">--local</span>
          </p>
          <p>
            <span className="line-number">01</span>
            <span className="terminal-dim">state</span> plan.created
          </p>
          <p>
            <span className="line-number">02</span>
            <span className="terminal-dim">tool</span> workspace.read{' '}
            <Check size={12} />
          </p>
          <p>
            <span className="line-number">03</span>
            <span className="terminal-dim">next</span> changes.proposed
          </p>
          <p>
            <span className="line-number">04</span>
            <span className="terminal-amber">awaiting human approval</span>
            <span className="terminal-cursor" />
          </p>
        </div>
      </div>
    </div>
  );
}
