import test from 'node:test';
import assert from 'node:assert/strict';
import { gantryPose, smoothTravel } from '../lib/deep-field-motion.ts';

test('service cycle stays within the authored mechanical limits and cable remains attached', () => {
  for (let t = 0; t <= 72; t += 0.025) {
    const p = gantryPose(t);
    assert.ok(p.bridge >= -4.6 && p.bridge <= 4.6);
    assert.ok(p.trolley >= -4.45 && p.trolley <= 4.45);
    assert.ok(p.hoist >= -4.45 && p.hoist <= -1.35);
    // The parked loading cabinet reaches the hook below this measured clearance.
    if (Math.abs(p.bridge - 1.8) < 0.01 && Math.abs(p.trolley) < 0.01)
      assert.ok(p.hoist >= -2.8, 'parked hook clears the instrument cabinet');
    assert.ok(Math.abs(-0.5 - 2.5 * p.cableScale - p.hoist) < 1e-9);
    const next = gantryPose(t + 0.001);
    if (
      Math.abs(next.bridge - p.bridge) + Math.abs(next.trolley - p.trolley) >
      1e-5
    )
      assert.ok(
        Math.abs(p.hoist + 1.6) < 1e-5,
        'travel occurs only with hoist raised',
      );
  }
});
test('motion has continuous boundaries, loops without jumps, and holds endpoints', () => {
  for (const boundary of [0, 3, 9, 14, 18, 22, 27, 33, 36]) {
    const before = gantryPose(boundary - 0.001),
      after = gantryPose(boundary + 0.001);
    for (const key of ['bridge', 'trolley', 'hoist'])
      assert.ok(Math.abs(before[key] - after[key]) < 0.0001);
  }
  assert.equal(smoothTravel(-1), 0);
  assert.equal(smoothTravel(2), 1);
  assert.deepEqual(gantryPose(0), gantryPose(36));
});
