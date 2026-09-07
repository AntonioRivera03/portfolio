const attributes = (html: string) => Object.fromEntries([...html.matchAll(/([\w-]+)\s*=\s*(["'])(.*?)\2/g)].map(match => [match[1], match[3]]));

/** Parse exact tooltip counts, never GitHub's approximate color levels. */
export function parseCalendar(html: string) {
  const tooltips = new Map<string, number>();
  for (const match of html.matchAll(/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/gi)) {
    const attrs = attributes(match[1]);
    const text = match[2].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    const countMatch = text.match(/^(No|[\d,]+) contributions? on /i);
    if (attrs.for && countMatch) tooltips.set(attrs.for, countMatch[1].toLowerCase() === 'no' ? 0 : Number(countMatch[1].replaceAll(',', '')));
  }
  const days = new Map<string, { date: string; count: number; level: number }>();
  for (const match of html.matchAll(/<td\b([^>]*)>/gi)) {
    const attrs = attributes(match[1]);
    if (!attrs.class?.includes('ContributionCalendar-day') || !attrs['data-date'] || !attrs.id) continue;
    const count = tooltips.get(attrs.id);
    if (count === undefined || !Number.isSafeInteger(count) || count < 0) continue;
    days.set(attrs['data-date'], { date: attrs['data-date'], count, level: Number(attrs['data-level'] || 0) });
  }
  return days;
}

