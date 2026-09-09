import type { Metadata } from 'next';
import DispatchYard from '../dispatch-yard';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Dispatch — Projects by Antonio Rivera',
  description:
    'Agent orchestration, local runtimes, and the machinery underneath the interface. Explore projects, technical concepts, and open-source work by Antonio Rivera.',
};

export default function ProjectsYardPage() {
  return <DispatchYard />;
}
