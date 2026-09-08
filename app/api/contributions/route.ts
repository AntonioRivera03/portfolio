import { fetchContributionActivity } from '../../../lib/contributions';
import snapshot from '../../data/contributions.json';

export async function GET() {
  try {
    const activity = await fetchContributionActivity();
    return Response.json(
      { ...snapshot, ...activity },
      {
        headers: {
          'Cache-Control':
            'public, max-age=900, s-maxage=3600, stale-while-revalidate=86400',
        },
      },
    );
  } catch {
    return Response.json(
      { ...snapshot, fresh: false },
      {
        headers: { 'Cache-Control': 'public, max-age=300' },
      },
    );
  }
}
