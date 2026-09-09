export function smoothTravel(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

// The unloaded hoist rises before the bridge or trolley translates.
// This follows the authored rail limits and keeps both cable ends attached.
export function gantryPose(seconds: number) {
  const t = ((seconds % 36) + 36) % 36;
  const mix = (a: number, b: number, start: number, end: number) =>
    a + (b - a) * smoothTravel((t - start) / (end - start));
  let bridge = 1.8,
    trolley = 0,
    hoist = -2.75;
  if (t < 3) hoist = mix(-2.75, -1.6, 0, 3);
  else if (t < 9) {
    hoist = -1.6;
    bridge = mix(1.8, -2.4, 3, 9);
  } else if (t < 14) {
    hoist = -1.6;
    bridge = -2.4;
    trolley = mix(0, 3.2, 9, 14);
  } else if (t < 18) {
    bridge = -2.4;
    trolley = 3.2;
    hoist = mix(-1.6, -3.5, 14, 18);
  } else if (t < 22) {
    bridge = -2.4;
    trolley = 3.2;
    hoist = mix(-3.5, -1.6, 18, 22);
  } else if (t < 27) {
    hoist = -1.6;
    bridge = -2.4;
    trolley = mix(3.2, 0, 22, 27);
  } else if (t < 33) {
    hoist = -1.6;
    bridge = mix(-2.4, 1.8, 27, 33);
  } else hoist = mix(-1.6, -2.75, 33, 36);
  return { bridge, trolley, hoist, cableScale: (-hoist - 0.5) / 2.5 };
}
