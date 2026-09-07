import { parseCalendar } from '../../../lib/contributions';
import snapshot from '../../data/contributions.json';

const LOGIN = 'AntonioRivera03';
const DAY_MS = 86_400_000;
const dateString = (d: Date) => d.toISOString().slice(0, 10);

export async function GET() {
  const now = new Date();
  const end = new Date(`${dateString(now)}T00:00:00Z`);
  const start = new Date(end.getTime() - 29 * DAY_MS);
  const from = dateString(start), to = dateString(end);
  const headers = { 'Cache-Control': 'public, max-age=900, s-maxage=3600, stale-while-revalidate=86400' };
  try {
    const years = Array.from({ length: end.getUTCFullYear() - start.getUTCFullYear() + 1 }, (_, i) => start.getUTCFullYear() + i);
    const calendars = await Promise.all(years.map(async year => {
      const a = year === start.getUTCFullYear() ? from : `${year}-01-01`;
      const b = year === end.getUTCFullYear() ? to : `${year}-12-31`;
      const response = await fetch(`https://github.com/users/${LOGIN}/contributions?from=${a}&to=${b}`, { headers: { Accept: 'text/html', 'User-Agent': 'AntonioRivera-Portfolio' }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('GitHub unavailable');
      return parseCalendar(await response.text());
    }));
    const all = new Map(calendars.flatMap(calendar => [...calendar]));
    const days = Array.from({ length: 30 }, (_, i) => all.get(dateString(new Date(start.getTime() + i * DAY_MS))));
    if (days.some(day => !day)) throw new Error('Incomplete contribution calendar');
    const complete = days as { date: string; count: number; level: number }[];
    return Response.json({ ...snapshot, from, to, periodLabel: `${from} – ${to}`, days: complete, total: complete.reduce((sum, d) => sum + d.count, 0), activeDays: complete.filter(d => d.count > 0).length, sourceUrl: `https://github.com/users/${LOGIN}/contributions?from=${from}&to=${to}`, profileUrl: `https://github.com/${LOGIN}?tab=overview&from=${from}&to=${to}`, retrievedAt: now.toISOString(), fresh: true }, { headers });
  } catch {
    return Response.json({ ...snapshot, fresh: false }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  }
}
