// Verified against the public pull requests on September 9, 2026.
// These are contributions to Antonio's own public repositories.
export const yardContributions = [
  {
    repo: 'AIcorn',
    number: 6,
    date: 'SEP 08, 2026',
    title: 'Add Codex Conductor, task branch review, and Kubernetes previews',
    description:
      'Task delegation through Codex, explicit branch review and merging, and isolated Kubernetes application previews.',
    url: 'https://github.com/AntonioRivera03/AIcorn/pull/6',
  },
  {
    repo: 'AIcorn',
    number: 5,
    date: 'SEP 08, 2026',
    title: 'Add concurrency coverage, task IDs, and job queue documentation',
    description:
      'Regression coverage for atomic job claims, concurrent task transitions, duplicate prevention, and HTTP conflict handling.',
    url: 'https://github.com/AntonioRivera03/AIcorn/pull/5',
  },
  {
    repo: 'AIcorn',
    number: 2,
    date: 'AUG 21, 2026',
    title: 'Phase 1: MCP server for agent-driven task access',
    description:
      'A stdio MCP server for task operations, Markdown conversion, and database snapshot handling.',
    url: 'https://github.com/AntonioRivera03/AIcorn/pull/2',
  },
  {
    repo: 'StudyHub',
    number: 2,
    date: 'AUG 18, 2026',
    title: 'Complete Phase 2 flashcards',
    description:
      'Deck authoring, deterministic SM-2 scheduling, resumable reviews, and safeguards around active review sessions.',
    url: 'https://github.com/AntonioRivera03/StudyHub/pull/2',
  },
] as const;
