import { describe, expect, it } from 'vitest';
import { meterLow, meterPercent } from './meters';

describe('HP meters', () => {
  it('fills the bar from the hit points, not the charge', () => {
    expect(meterPercent(96, 96)).toBe(100);
    expect(meterPercent(16, 96)).toBe(17);
    expect(meterPercent(0, 96)).toBe(0);
    expect(meterPercent(500, 500)).toBe(100);
    expect(meterPercent(276, 500)).toBe(55);
  });

  it('clamps nonsense and a zero max', () => {
    expect(meterPercent(-4, 96)).toBe(0);
    expect(meterPercent(400, 96)).toBe(100);
    expect(meterPercent(10, 0)).toBe(0);
  });

  it('marks only the bottom quarter as low', () => {
    expect(meterLow(96, 96)).toBe(false);
    expect(meterLow(25, 96)).toBe(false);
    expect(meterLow(24, 96)).toBe(true);
    expect(meterLow(0, 96)).toBe(true);
  });
});
