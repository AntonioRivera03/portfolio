'use client';

import { useState, useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}
const snapshot = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const serverSnapshot = () => true;

export function useYardMotion() {
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [override, setOverride] = useState<boolean | null>(null);
  const paused = override ?? reduced;
  return { paused, reduced, toggle: () => setOverride(!paused) };
}
