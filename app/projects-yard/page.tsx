import type { Metadata } from 'next';
import ProjectTrail from '../project-trail';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'The Project Yard — Antonio Rivera',
  description:
    'Take the scenic route. A Montana-inspired trail through projects, experiments, and things worth making.',
};

export default function ProjectsYardPage() {
  return (
    <main className="project-yard-page" aria-labelledby="yard-title">
      <ProjectTrail />
    </main>
  );
}
