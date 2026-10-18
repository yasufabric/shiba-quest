import { describe, expect, it } from 'vitest';
import { FIELD_HORIZON, VIEW_H, VIEW_W, roadHalf } from './render';

describe('shrine road', () => {
  it('is one band that widens from the gate to the party', () => {
    const height = 240;
    const horizon = Math.round(height * FIELD_HORIZON);
    const far = roadHalf(horizon + 1, height);
    const near = roadHalf(height - 2, height);
    expect(far).not.toBeNull();
    expect(near).not.toBeNull();
    expect(near ?? 0).toBeGreaterThan((far ?? 0) * 3);
    expect(roadHalf(horizon - 4, height)).toBeNull();
  });

  it('fills a 390-wide phone at an integer 2× scale', () => {
    expect(VIEW_W * 2).toBe(390);
    expect(VIEW_H * 2).toBe(480);
  });
});