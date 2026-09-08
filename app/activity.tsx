'use client';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Code2 } from 'lucide-react';
import snapshot from './data/contributions.json';

type Activity = typeof snapshot;
const dayLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export default function ActivityLandscape() {
  const [data, setData] = useState<Activity>(snapshot);
  const [selected, setSelected] = useState(7);
  const [status, setStatus] = useState('Saved snapshot');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/contributions', { signal: controller.signal }).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then((value: unknown) => {
      const result = value as Activity & { fresh?: boolean };
      if (Array.isArray(result.days) && result.days.length === 30) { setData(result); setStatus(result.fresh ? 'Synced with GitHub' : 'Saved snapshot'); }
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  const day = data.days[selected];
  const max = Math.max(1, ...data.days.map(d => d.count));
  const selectByKey = (event: React.KeyboardEvent, i: number) => {
    let next = i;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (i + 1) % 30;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (i + 29) % 30;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = 29;
    else return;
    event.preventDefault(); setSelected(next); document.getElementById(`contribution-${next}`)?.focus();
  };
  return <section className="section activity-section" id="activity" aria-labelledby="activity-title">
    <div className="section-label"><span className="eyebrow">02 / THE EVERYDAY PRACTICE</span><span className="eyebrow activity-source"><i/>{status.toUpperCase()}</span></div>
    <div className="activity-layout"><div className="activity-copy"><h2 id="activity-title">Small steps.<br/><em>Real momentum.</em></h2><p>GitHub activity over the last 30 days. Each column shows one day’s contributions.</p><div className="activity-stats"><div><strong>{data.total.toString().padStart(2, '0')}</strong><span>contributions</span></div><div><strong>{data.activeDays.toString().padStart(2, '0')}</strong><span>days of building</span></div></div><a href={data.profileUrl} target="_blank" rel="noreferrer" className="text-link"><Code2 size={16}/> See the activity <ArrowUpRight size={16}/></a></div>
      <div className="landscape-wrap"><div className="landscape-date"><span className="eyebrow">{dayLabel(data.from).toUpperCase()} — {dayLabel(data.to).toUpperCase()}, {data.to.slice(0,4)}</span><span className="eyebrow">30 DAYS</span></div>
        <svg viewBox="0 0 650 350" className="landscape" role="group" aria-label="GitHub contribution landscape. Use arrow keys to explore each day.">
          <defs><linearGradient id="bar-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b1de65"/><stop offset="100%" stopColor="#5e792f"/></linearGradient></defs>
          {data.days.map((d, i) => {
            const col = i % 10, row = Math.floor(i / 10);
            const x = 55 + col * 42 + row * 54, y = 202 + row * 32 - col * 10;
            const h = d.count ? 16 + d.count / max * 98 : 5;
            const active = selected === i;
            return <g key={d.date} id={`contribution-${i}`} className={`landscape-bar ${active ? 'selected' : ''}`} role="button" tabIndex={active ? 0 : -1} aria-label={`${dayLabel(d.date)}: ${d.count} ${d.count === 1 ? 'contribution' : 'contributions'}`} aria-pressed={active} onPointerEnter={() => setSelected(i)} onClick={() => setSelected(i)} onFocus={() => setSelected(i)} onKeyDown={e => selectByKey(e, i)}>
              <path d={`M${x},${y} l25,-10 28,15 -25,11 Z`} fill="#1c2117" stroke="#333d27" strokeWidth=".7"/>
              <g className="bar-column" style={{ '--bar-delay': `${i * 20}ms` } as React.CSSProperties}>
                <path d={`M${x},${y-h} l28,15 v${h} l-28,-15 Z`} fill={d.count ? 'url(#bar-face)' : '#333e28'} stroke={active ? '#efffc2' : '#111810'} strokeWidth=".8"/>
                <path d={`M${x+28},${y+15-h} l25,-11 v${h} l-25,11 Z`} fill={d.count ? '#7ca73d' : '#293420'} stroke={active ? '#efffc2' : '#111810'} strokeWidth=".8"/>
                <path d={`M${x},${y-h} l25,-10 28,14 -25,11 Z`} fill={active ? '#f0ffcd' : d.count ? '#d4ff72' : '#465433'} stroke={active ? '#f0ffcd' : '#5c6b44'} strokeWidth=".8"/>
              </g>
            </g>;
          })}
        </svg>
        <div className="landscape-readout"><span><i/>{dayLabel(day.date)}<strong>{day.count} {day.count === 1 ? 'contribution' : 'contributions'}</strong></span><span className="eyebrow">EXPLORE THE LANDSCAPE ↗</span></div>
        <p className="data-note">Public GitHub contribution counts · Updated {dayLabel(data.retrievedAt.slice(0,10))}, {data.retrievedAt.slice(0,4)} · Current day may be partial.</p>
      </div>
    </div>
  </section>;
}
