import { describe, expect, it } from 'vitest';
import { FIELD_HORIZON, roadHalf } from './render';

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
});