import { describe, expect, it } from 'vitest';
import { FIELD_HORIZON, fieldCover, roadHalf } from './render';

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

  it('covers the phone with integer pixels and no empty band', () => {
    const wide = fieldCover(390, 566);
    expect(wide.scale).toBe(2);
    expect(wide.cssWidth).toBeGreaterThanOrEqual(390);
    expect(wide.cssHeight).toBeGreaterThanOrEqual(566);
    expect(wide.cssWidth - 390).toBeLessThan(wide.scale);
    expect(wide.cssHeight - 566).toBeLessThan(wide.scale);
    const odd = fieldCover(375, 701);
    expect(odd.scale).toBe(2);
    expect(odd.cssWidth).toBeGreaterThanOrEqual(375);
    expect(odd.cssHeight).toBeGreaterThanOrEqual(701);
    expect(odd.cssWidth % odd.scale).toBe(0);
  });
});