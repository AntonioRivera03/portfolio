import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCalendar,
  fetchContributionActivity,
} from '../lib/contributions.ts';

const cell = (id, date, level = 4) =>
  `<td id="${id}" class="ContributionCalendar-day" data-date="${date}" data-level="${level}"></td>`;
const tip = (id, text) => `<tool-tip for="${id}">${text}</tool-tip>`;

test('joins tooltips by cell ID instead of document order or color level', () => {
  const html =
    cell('b', '2026-09-02', 0) +
    cell('a', '2026-09-01', 4) +
    tip('a', 'No contributions on September 1st.') +
    tip('b', '7 contributions on September 2nd.');
  const days = parseCalendar(html);
  assert.equal(days.get('2026-09-01').count, 0);
  assert.equal(days.get('2026-09-02').count, 7);
});

test('handles singular counts, thousands, whitespace, and nested tooltip content', () => {
  const html =
    cell('one', '2026-12-31') +
    cell('many', '2027-01-01') +
    tip('one', ' \n1 contribution on December 31st. ') +
    tip('many', '<span>1,234 contributions on January 1st.</span>');
  const days = parseCalendar(html);
  assert.equal(days.get('2026-12-31').count, 1);
  assert.equal(days.get('2027-01-01').count, 1234);
});

test('does not invent counts for absent or changed tooltips', () => {
  const html =
    cell('absent', '2026-09-01') +
    cell('changed', '2026-09-02') +
    tip('changed', 'Activity: unknown');
  assert.equal(parseCalendar(html).size, 0);
});

test('ignores non-calendar cells and invalid counts', () => {
  const html =
    '<td id="fake" data-date="2026-09-01"></td>' +
    tip('fake', '8 contributions on September 1st.') +
    cell('negative', '2026-09-02') +
    tip('negative', '-5 contributions on September 2nd.');
  assert.equal(parseCalendar(html).size, 0);
});

test('fetches a complete 30-day window across a year boundary', async () => {
  const now = new Date('2027-01-10T06:30:00Z');
  const from = Date.UTC(2026, 11, 12);
  const dates = Array.from({ length: 30 }, (_, i) =>
    new Date(from + i * 86400000).toISOString().slice(0, 10),
  );
  const requested = [];
  const activity = await fetchContributionActivity({
    now,
    fetcher: async (url) => {
      requested.push(url);
      const year = new URL(url).searchParams.get('from').slice(0, 4);
      const html = dates
        .filter((date) => date.startsWith(year))
        .map(
          (date) =>
            cell(date, date) + tip(date, '2 contributions on this date.'),
        )
        .join('');
      return new Response(html);
    },
  });
  assert.equal(requested.length, 2);
  assert.match(requested[0], /from=2026-12-12&to=2026-12-31/);
  assert.match(requested[1], /from=2027-01-01&to=2027-01-10/);
  assert.equal(activity.from, '2026-12-12');
  assert.equal(activity.to, '2027-01-10');
  assert.equal(activity.days.length, 30);
  assert.equal(activity.total, 60);
  assert.equal(activity.activeDays, 30);
  assert.equal(activity.retrievedAt, now.toISOString());
});

test('incomplete or failed GitHub responses cannot become a fresh calendar', async () => {
  await assert.rejects(
    fetchContributionActivity({ fetcher: async () => new Response('') }),
    /Incomplete/,
  );
  await assert.rejects(
    fetchContributionActivity({
      fetcher: async () => new Response('', { status: 503 }),
    }),
    /unavailable/,
  );
});
