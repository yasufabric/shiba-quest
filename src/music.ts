import { audioNow, audioPrimed, isMuted, onAudioPrime, scheduleNoise, scheduleTone } from './audio';

export type Wave = 'triangle' | 'square' | 'noise';

export interface ScoreNote {
  midi: number;
  /** Start, in quarter-note beats. */
  at: number;
  /** Length, in quarter-note beats. */
  dur: number;
  wave: Wave;
  peak: number;
}

export type MusicCue = 'battle' | 'title' | 'ending';

/** Quarter note at 120. The whole battle phrase is eight seconds. */
export const beatSeconds = 0.5;
export const battleLoopBeats = 16;
export const titleLoopBeats = 8;

const lead = (midi: number, at: number, dur: number, peak = 0.045): ScoreNote => ({
  midi,
  at,
  dur,
  wave: 'triangle',
  peak,
});
const bass = (midi: number, at: number, dur = 2): ScoreNote => ({
  midi,
  at,
  dur,
  wave: 'square',
  peak: 0.028,
});
const hat = (at: number): ScoreNote => ({ midi: 0, at, dur: 0.08, wave: 'noise', peak: 0.018 });

/**
 * Original four-bar loop. The contour is D–F–G–A–C, not a borrowed
 * fanfare or prelude.
 */
export const battleNotes: readonly ScoreNote[] = [
  lead(62, 0, 0.5),
  lead(65, 0.5, 0.5),
  lead(67, 1, 0.5),
  lead(69, 1.5, 0.5),
  lead(72, 2, 1),
  lead(69, 3, 0.5),
  lead(67, 3.5, 0.5),
  lead(65, 4, 0.5),
  lead(62, 4.5, 0.5),
  lead(62, 5, 0.5),
  lead(69, 5.5, 0.5),
  lead(72, 6, 0.5),
  lead(74, 6.5, 1),
  lead(72, 7.5, 0.5),
  lead(69, 8, 0.5),
  lead(67, 8.5, 0.5),
  lead(65, 9, 1),
  lead(62, 10, 0.5),
  lead(65, 10.5, 0.5),
  lead(67, 11, 0.5),
  lead(62, 11.5, 0.5),
  lead(69, 12, 1),
  lead(67, 13, 0.5),
  lead(65, 13.5, 0.5),
  lead(62, 14, 2),
  bass(38, 0),
  bass(45, 2),
  bass(41, 4),
  bass(48, 6),
  bass(38, 8),
  bass(43, 10),
  bass(45, 12),
  bass(38, 14),
  hat(0),
  hat(1),
  hat(2),
  hat(3),
  hat(4),
  hat(5),
  hat(6),
  hat(7),
  hat(8),
  hat(9),
  hat(10),
  hat(11),
  hat(12),
  hat(13),
  hat(14),
  hat(15),
].sort((a, b) => a.at - b.at || a.midi - b.midi);

/** Slower two-bar cue for the title card. No drums. */
export const titleNotes: readonly ScoreNote[] = [
  lead(62, 0, 2, 0.04),
  lead(69, 2, 2, 0.04),
  lead(65, 4, 2, 0.04),
  lead(57, 6, 2, 0.04),
];

/** One rising phrase, short enough to finish inside the victory bone. */
export const endingNotes: readonly ScoreNote[] = [
  lead(62, 0, 0.35, 0.05),
  lead(69, 0.4, 0.35, 0.05),
  lead(74, 0.8, 0.55, 0.05),
];

export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** The music bed stays off for the scripted first fight. */
export function bedForTutorial(tutorial: boolean): MusicCue | null {
  return tutorial ? null : 'battle';
}

export function leadMidi(notes: readonly ScoreNote[]): number[] {
  return notes.filter((note) => note.wave === 'triangle').map((note) => note.midi);
}

let cue: MusicCue | null = null;
let cursor = 0;
let cycle = 0;
let origin = 0;
let timer = 0;

function scoreFor(next: MusicCue): { notes: readonly ScoreNote[]; loop: number | null } {
  switch (next) {
    case 'battle':
      return { notes: battleNotes, loop: battleLoopBeats };
    case 'title':
      return { notes: titleNotes, loop: titleLoopBeats };
    case 'ending':
      return { notes: endingNotes, loop: null };
    default: {
      const neverCue: never = next;
      throw new Error(`unknown cue ${String(neverCue)}`);
    }
  }
}

function stopTimer(): void {
  window.clearTimeout(timer);
  timer = 0;
}

function fire(note: ScoreNote, when: number): void {
  const delay = Math.max(0, when - audioNow());
  if (note.wave === 'noise') {
    scheduleNoise(0.04, note.peak, 2000, delay);
    return;
  }
  scheduleTone(midiToFreq(note.midi), note.dur * beatSeconds, note.wave, note.peak, delay);
}

function pump(): void {
  if (!cue || isMuted()) return;
  const { notes, loop } = scoreFor(cue);
  const horizon = audioNow() + 0.35;
  while (cursor < notes.length) {
    const note = notes[cursor];
    if (!note) break;
    const when = origin + (cycle * (loop ?? 0) + note.at) * beatSeconds;
    if (when > horizon) break;
    fire(note, when);
    cursor += 1;
  }
  if (cursor >= notes.length) {
    if (loop === null) {
      cue = null;
      return;
    }
    cycle += 1;
    cursor = 0;
  }
  const upcoming = notes[cursor];
  const at = upcoming ? origin + (cycle * (loop ?? 0) + upcoming.at) * beatSeconds : audioNow() + 0.2;
  const wait = Math.max(20, (at - audioNow() - 0.12) * 1000);
  timer = window.setTimeout(pump, wait);
}

function arm(): void {
  if (!cue || isMuted() || !audioPrimed()) return;
  stopTimer();
  cursor = 0;
  cycle = 0;
  origin = audioNow() + 0.06;
  pump();
}

export function requestMusic(next: MusicCue | null): void {
  if (next === cue && timer !== 0) return;
  stopTimer();
  cue = next;
  if (!next) return;
  arm();
}

export function refreshMusic(): void {
  if (!cue) return;
  if (isMuted()) {
    stopTimer();
    return;
  }
  arm();
}

export function installMusic(): void {
  onAudioPrime(() => {
    arm();
  });
}
