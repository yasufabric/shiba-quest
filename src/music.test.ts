import { describe, expect, it } from 'vitest';
import {
  battleLoopBeats,
  battleNotes,
  beatSeconds,
  bedForTutorial,
  endingNotes,
  leadMidi,
  midiToFreq,
  titleLoopBeats,
  titleNotes,
  type ScoreNote,
} from './music';

function inside(notes: readonly ScoreNote[], beats: number): boolean {
  return notes.every((note) => note.at >= 0 && note.at < beats && note.dur > 0);
}

describe('music cues', () => {
  it('keeps the tutorial free of the battle bed', () => {
    expect(bedForTutorial(true)).toBeNull();
    expect(bedForTutorial(false)).toBe('battle');
  });

  it('loops an original battle phrase and two other cues', () => {
    expect(inside(battleNotes, battleLoopBeats)).toBe(true);
    const starts = battleNotes.map((note) => note.at);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    const opening = battleNotes.filter((note) => note.at < 2).map((note) => note.wave);
    expect(opening).toContain('triangle');
    expect(opening).toContain('square');
    expect(opening).toContain('noise');
    expect(inside(titleNotes, titleLoopBeats)).toBe(true);
    expect(battleNotes.some((note) => note.wave === 'noise')).toBe(true);
    expect(titleNotes.every((note) => note.wave === 'triangle')).toBe(true);
    const endingEnd = Math.max(...endingNotes.map((note) => (note.at + note.dur) * beatSeconds));
    expect(endingEnd).toBeLessThan(0.78);
    expect(midiToFreq(69)).toBeCloseTo(440, 5);
  });

  it('does not open on a prelude arpeggio or the victory fanfare', () => {
    expect(leadMidi(battleNotes).slice(0, 4)).not.toEqual([60, 67, 72, 67]);
    expect(leadMidi(endingNotes)).not.toEqual([60, 64, 67, 72]);
    expect(leadMidi(titleNotes)).not.toEqual(leadMidi(battleNotes).slice(0, titleNotes.length));
  });
});
