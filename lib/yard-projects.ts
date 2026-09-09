export type YardProject = {
  id: string;
  name: string;
  kind: 'Agents' | 'Systems' | 'Applications';
  status: 'Open source' | 'Live platform' | 'Design concept';
  title: string;
  description: string;
  stack: string[];
  features: { name: string; detail: string }[];
  command: string;
  code: string;
  events: string[];
  layer: number;
  link?: string;
  linkLabel?: string;
};

export const yardProjects: YardProject[] = [
  {
    id: 'aicorn',
    name: 'AICorn',
    kind: 'Agents',
    status: 'Open source',
    layer: 4,
    title: 'From backlog to reviewed code.',
    description:
      'An extension of Aycorn for assigning tasks to coding agents, isolating their changes in Git worktrees, and reviewing the result before a local merge.',
    stack: ['React', 'TypeScript', 'Go', 'SQLite'],
    features: [
      {
        name: 'Task-based agents',
        detail:
          'Ask, plan, implement, and review directly from a task. Configure the model and instructions for each agent.',
      },
      {
        name: 'Isolated worktrees',
        detail:
          'Give a task its own branch and working directory. Inspect the diff before merging changes locally.',
      },
      {
        name: 'Branch previews',
        detail:
          'Preview branch snapshots with isolated databases and test steps through the Kubernetes deployment workflow.',
      },
    ],
    command: 'task → worktree → agent → review',
    code: 'task: implement-session-cache\nworkspace: isolated-worktree\nagent: implementation\nexecution: one-agent-at-a-time\nnext: review-diff',
    events: [
      'Task selected: implement-session-cache',
      'Isolated worktree prepared',
      'Implementation agent assigned',
      'Diff ready for human review',
    ],
    link: 'https://github.com/AntonioRivera03/AIcorn',
    linkLabel: 'Explore repository',
  },
  {
    id: 'kernel',
    name: 'Kernel',
    kind: 'Agents',
    status: 'Design concept',
    layer: 3,
    title: 'An agent runtime with a receipt for every action.',
    description:
      'A proposed local runtime with explicit tool permissions, an append-only action journal, and bounded execution. Inspect what ran, why it ran, and what it changed.',
    stack: ['Rust', 'SQLite', 'Local models'],
    features: [
      {
        name: 'Event journal',
        detail:
          'Record tool arguments, results, and approval decisions in a local append-only journal.',
      },
      {
        name: 'Permission gates',
        detail:
          'Check file, network, and process capabilities before executing a tool. Pause when an action requires approval.',
      },
      {
        name: 'Bounded runs',
        detail:
          'Set an action budget and a cancellation boundary. Reconstruct a run from the events it emitted.',
      },
    ],
    command: 'kernel run --policy ./agent.toml',
    code: '[run]\nmodel = "local"\nmax_steps = 32\njournal = "./runs/events.db"\n\n[permissions]\nfs_read = ["./src"]\nfs_write = "ask"\nnetwork = "deny"',
    events: [
      'Run created · action budget: 32',
      'fs.read ./src/main.rs → allowed',
      'fs.write ./src/cache.rs → approval required',
      'Run paused at permission boundary',
    ],
  },
  {
    id: 'latch',
    name: 'Latch',
    kind: 'Systems',
    status: 'Design concept',
    layer: 2,
    title: 'A smaller boundary around untrusted tools.',
    description:
      'A proposed capability-based sandbox for agent tools. Run a tool as a WebAssembly component with only the filesystem paths, network access, and time budget it needs.',
    stack: ['Rust', 'WebAssembly', 'WASI'],
    features: [
      {
        name: 'Explicit capabilities',
        detail:
          'Allow a tool to read a directory without also granting access to the rest of the machine.',
      },
      {
        name: 'Resource ceilings',
        detail:
          'Apply execution fuel, memory limits, and deadlines to each tool invocation.',
      },
      {
        name: 'Structured results',
        detail:
          'Return typed outputs, exit reasons, and denied operations to the calling agent.',
      },
    ],
    command: 'latch exec parser.wasm --policy read-only',
    code: 'tool: parser.wasm\ncapabilities:\n  read: ["/workspace/input"]\n  write: []\n  network: false\nlimits:\n  memory_mb: 64\n  deadline_ms: 2000',
    events: [
      'Component loaded: parser.wasm',
      'Read capability granted: /workspace/input',
      'Network request → capability denied',
      'Tool returned: denied_operation',
    ],
  },
  {
    id: 'tracepoint',
    name: 'Tracepoint',
    kind: 'Systems',
    status: 'Design concept',
    layer: 1,
    title: 'Follow an agent all the way to the syscall.',
    description:
      'A proposed Linux profiler that correlates agent tool calls with process, filesystem, and network events. Find the subprocess or I/O operation hiding inside a slow run.',
    stack: ['C', 'eBPF', 'Rust', 'Linux'],
    features: [
      {
        name: 'Process lineage',
        detail:
          'Connect spawned processes to the tool call and agent run that created them.',
      },
      {
        name: 'I/O timelines',
        detail:
          'Inspect file opens, socket activity, and scheduling events in a single ordered trace.',
      },
      {
        name: 'Local trace export',
        detail:
          'Export structured events for a local trace viewer without sending execution data to a hosted service.',
      },
    ],
    command: 'tracepoint attach --run agent-0042',
    code: 'RUN         EVENT          TARGET\nagent-0042  process.spawn  /usr/bin/git\nagent-0042  file.open      .git/index\nagent-0042  socket.connect github.com:443\nagent-0042  process.exit   code=0',
    events: [
      'Attached to run: agent-0042',
      'Observed child process: git',
      'Correlated filesystem and socket events',
      'Trace exported locally',
    ],
  },
  {
    id: 'pagecache',
    name: 'Pagecache',
    kind: 'Systems',
    status: 'Design concept',
    layer: 0,
    title: 'Durable memory starts below the prompt.',
    description:
      'A proposed embedded event store for agent state: a write-ahead log, checksummed records, and replayable snapshots. Recover a run after a crash without losing its history.',
    stack: ['Rust', 'Storage engines', 'WAL'],
    features: [
      {
        name: 'Write-ahead log',
        detail:
          'Append state changes before acknowledging them. Use record checksums to detect partial writes.',
      },
      {
        name: 'Snapshot + replay',
        detail:
          'Load a compact snapshot and replay later events to reconstruct a run’s state.',
      },
      {
        name: 'Embedded API',
        detail:
          'Keep the storage engine in the same process as the runtime, with no separate database service.',
      },
    ],
    command: 'store.append(run_id, ToolCompleted { … })',
    code: 'let store = Store::open("./agent.db")?;\nlet seq = store.append(run, event)?;\nstore.sync()?;\n\n// Recover from the last durable boundary.\nlet state = store.replay(run)?;\nassert!(state.contains(seq));',
    events: [
      'Append event: ToolCompleted',
      'Checksum written to WAL',
      'Durable boundary acknowledged',
      'Run state rebuilt from snapshot + log',
    ],
  },
  {
    id: 'livedmatch',
    name: 'LivedMatch',
    kind: 'Applications',
    status: 'Live platform',
    layer: 4,
    title: 'Match lived experience with the right research.',
    description:
      'A platform for connecting people with lived experience to relevant research opportunities, with matching and community participation at its center.',
    stack: ['Web platform', 'Matching', 'Research'],
    features: [
      {
        name: 'Participant matching',
        detail:
          'Connect people’s lived experience with relevant research topics and opportunities.',
      },
      {
        name: 'Research discovery',
        detail:
          'Give participants a way to discover research that connects to their experience.',
      },
      {
        name: 'Community participation',
        detail:
          'Support relationships between researchers, participants, and patient advocates.',
      },
    ],
    command: 'experience → research topic → opportunity',
    code: 'participant\n  └─ lived experience\n      └─ relevant research topic\n          └─ participation opportunity',
    events: [
      'Participant experience provided',
      'Relevant research topics identified',
      'Opportunities surfaced for review',
      'Participant chooses the next step',
    ],
    link: 'https://www.livedmatch.com',
    linkLabel: 'Visit platform',
  },
];

export const stackLayers = [
  'Persistence',
  'Observability',
  'Isolation',
  'Runtime',
  'Orchestration',
];
