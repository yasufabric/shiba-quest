/** Percent width for an HP meter. Values outside 0..max clamp. */
export function meterPercent(current: number, max: number): number {
  if (!(max > 0)) return 0;
  const ratio = Math.min(1, Math.max(0, current / max));
  return Math.round(ratio * 100);
}

/** The hero meter turns red in the bottom quarter, and stays green at full. */
export function meterLow(current: number, max: number): boolean {
  if (!(max > 0) || current >= max) return false;
  return current / max <= 0.25;
}
