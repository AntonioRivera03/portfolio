const attributes = (html: string) =>
  Object.fromEntries(
    [...html.matchAll(/([\w-]+)\s*=\s*(["'])(.*?)\2/g)].map((match) => [
      match[1],
      match[3],
    ]),
  );

/** Parse exact tooltip counts, never GitHub's approximate color levels. */
export function parseCalendar(html: string) {
  const tooltips = new Map<string, number>();
  for (const match of html.matchAll(
    /<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/gi,
  )) {
    const attrs = attributes(match[1]);
    const text = match[2]
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
    const countMatch = text.match(/^(No|[\d,]+) contributions? on /i);
    if (attrs.for && countMatch)
      tooltips.set(
        attrs.for,
        countMatch[1].toLowerCase() === 'no'
          ? 0
          : Number(countMatch[1].replaceAll(',', '')),
      );
  }
  const days = new Map<
    string,
    { date: string; count: number; level: number }
  >();
  for (const match of html.matchAll(/<td\b([^>]*)>/gi)) {
    const attrs = attributes(match[1]);
    if (
      !attrs.class?.includes('ContributionCalendar-day') ||
      !attrs['data-date'] ||
      !attrs.id
    )
      continue;
    const count = tooltips.get(attrs.id);
    if (count === undefined || !Number.isSafeInteger(count) || count < 0)
      continue;
    days.set(attrs['data-date'], {
      date: attrs['data-date'],
      count,
      level: Number(attrs['data-level'] || 0),
    });
  }
  return days;
}

/** Fetch a complete rolling 30-day public calendar for either deployment target. */
export async function fetchContributionActivity({
  now = new Date(),
  fetcher = fetch,
}: { now?: Date; fetcher?: typeof fetch } = {}) {
  const login = 'AntonioRivera03';
  const dayMs = 86_400_000;
  const dateString = (date: Date) => date.toISOString().slice(0, 10);
  const end = new Date(`${dateString(now)}T00:00:00Z`);
  const start = new Date(end.getTime() - 29 * dayMs);
  const from = dateString(start),
    to = dateString(end);
  const years = Array.from(
    { length: end.getUTCFullYear() - start.getUTCFullYear() + 1 },
    (_, i) => start.getUTCFullYear() + i,
  );
  const calendars = await Promise.all(
    years.map(async (year) => {
      const a = year === start.getUTCFullYear() ? from : `${year}-01-01`;
      const b = year === end.getUTCFullYear() ? to : `${year}-12-31`;
      const response = await fetcher(
        `https://github.com/users/${login}/contributions?from=${a}&to=${b}`,
        {
          headers: {
            Accept: 'text/html',
            'User-Agent': 'AntonioRivera-Portfolio',
          },
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!response.ok) throw new Error('GitHub unavailable');
      return parseCalendar(await response.text());
    }),
  );
  const all = new Map(calendars.flatMap((calendar) => [...calendar]));
  const days = Array.from({ length: 30 }, (_, i) => {
    const day = all.get(dateString(new Date(start.getTime() + i * dayMs)));
    if (!day) throw new Error('Incomplete contribution calendar');
    return day;
  });
  return {
    from,
    to,
    periodLabel: `${from} – ${to}`,
    days,
    total: days.reduce((sum, day) => sum + day.count, 0),
    activeDays: days.filter((day) => day.count > 0).length,
    sourceUrl: `https://github.com/users/${login}/contributions?from=${from}&to=${to}`,
    profileUrl: `https://github.com/${login}?tab=overview&from=${from}&to=${to}`,
    retrievedAt: now.toISOString(),
    fresh: true,
  };
}
