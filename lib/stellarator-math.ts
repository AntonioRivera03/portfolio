/** Physical coordinates are metres with Z up. Three/glTF use Y up. */
export type XYZ = [number, number, number];
export function toScenePoint([x, y, z]: XYZ): XYZ { return [x, z, -y]; }
export function cross(a: XYZ, b: XYZ): XYZ {
  return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
}
export function normalize(v: XYZ): XYZ {
  const length = Math.hypot(...v);
  if (!Number.isFinite(length) || length < 1e-12) throw new Error('Degenerate field direction');
  return v.map(n => n / length) as XYZ;
}
export function magneticForce(velocity: XYZ, field: XYZ, charge = 1): XYZ {
  return cross(velocity, field).map(n => n * charge) as XYZ;
}
/** Paths are open integrations. Fade both ends rather than draw a fictitious closing chord. */
export function endpointFade(progress: number, ramp = .025): number {
  const p = ((progress % 1) + 1) % 1;
  return Math.min(1, p / ramp, (1 - p) / ramp);
}
export function sampleOpenPath(points: XYZ[], progress: number): XYZ {
  const p = Math.max(0, Math.min(1, progress));
  const index = p * (points.length - 1);
  const a = Math.floor(index), b = Math.min(a + 1, points.length - 1), t = index - a;
  return points[a].map((value, axis) => value + (points[b][axis] - value) * t) as XYZ;
}
