import type { Sprite } from './sprites';

/**
 * Hand-drawn side-view shibas, facing left.
 * The idle, the lying pose, and the puppy are placed pixel by pixel.
 * The other poses edit that drawing: a lunge, a recoil, a breath, a brace.
 * Coats recolor the same drawing. They are not traced from anyone else's sprites.
 */
export interface ShibaFrames {
  idle: Sprite;
  idle2: Sprite;
  attack: Sprite;
  hit: Sprite;
  guard: Sprite;
  down: Sprite;
  win: Sprite;
  charge: Sprite;
}

type CoatName = 'red' | 'black' | 'white' | 'sesame';

const ADULT_W = 32;
const PUP_W = 24;

/** Standing red-coat master. `d` is the coat, `w` is urajiro, `h` is the tan point. */
const ADULT_IDLE: readonly string[] = rowsOf(ADULT_W, [
  '................................',
  '................................',
  '......................kkk.......',
  '.....................kwwwk......',
  '....................kdwwwdk.....',
  '...................kd.....dk....',
  '..........k.......kd.......k....',
  '.........kdk......k.........k...',
  '........kwwdk....kdk........dk..',
  '.......kdwwdk...kdwwk........k..',
  '......kddwwdk...kdwdk.......dk..',
  '.....kdddwwk....kddk.....kdddk..',
  '....kdddhpddddddddddddddddk.....',
  '...kddddspddddddddddddddddk.....',
  '..kpdddoddddddddddddddddddk.....',
  '..kppwwwwddddddddddddddddk......',
  '...kwwwwwwwddddddddddddddk......',
  '....kwwwwwwwddddddddddddk.......',
  '.....kwwwwdddddddddddddk........',
  '......kwwwdddddddllllldk........',
  '.......kwwdddddllllldk..........',
  '.......kwldk.kddddddddk.........',
  '.......kwldk..kddddddk..........',
  '.......kwldk...kddddk...........',
  '.......kwldk....kdddk...........',
  '.......kwldk....kddwk...........',
  '.......kwwdk....kddwk...........',
  '......kwwwk.....kddwk...........',
  '.....kwwwwk.....kdddk...........',
  '....kwwwwwk....kddddk...........',
  '....kwwwwwk....kddddk...........',
  '....kkkkkkk....kkkkkk...........',
  '................................',
  '................................',
]);

/** On its side. The curl stays over the hip and the eye is shut. */
const ADULT_DOWN: readonly string[] = rowsOf(ADULT_W, [
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '.....................kkk........',
  '....................kwwwk.......',
  '...................kd...dk......',
  '..................kd.....k......',
  '.................k.......dk.....',
  '................k........kddk...',
  '...............k........kdddk...',
  '....kkkk.......k.......kddddk...',
  '...kdddkk......kkkkkkkkddddk....',
  '..kpdddpkkk...kddddddddddk......',
  '..kppwwwwwwkkkddddddddddk.......',
  '...kwwwwwwwwdddddddllllk........',
  '....kwwwwdddddddddllllk.........',
  '.....kkkk..kkkk...kkkk..........',
  '....kwwwk.kdddk.................',
  '....kwwwk.kdddk.................',
  '...kkkkk..kkkkk.................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
]);

/** Shorter legs, a bigger head, the same ears, curl, and cream chest. */
const PUP_IDLE: readonly string[] = rowsOf(PUP_W, [
  '........................',
  '........................',
  '.................kkk....',
  '................kwwwk...',
  '...............kd...dk..',
  '.......k.......k.....k..',
  '......kdk.............k.',
  '.....kwwdk...........dk.',
  '....kdwwdk..........kdk.',
  '...kddhwdk.........kddk.',
  '..kpddspdk........kddk..',
  '..kppwwwdk.......kddk...',
  '...kwwwwwk......kddk....',
  '....kwwwwkkkkkkkdk......',
  '.....kwwddddddddk.......',
  '......kwdk.kdddk........',
  '......kwwk..kddk........',
  '......kwdk..kdk.........',
  '.....kwwwk..kk..........',
  '....kwwwwk..kddk........',
  '....kwwwwk..kddk........',
  '....kkkkkk..kkkk........',
  '........................',
  '........................',
  '........................',
  '........................',
]);

const PUP_DOWN: readonly string[] = rowsOf(PUP_W, [
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '..............kkk.......',
  '.............kwwwk......',
  '............kd...dk.....',
  '...........k.....dk.....',
  '..kkkk.....k....kdk.....',
  '.kpddk.....kkkkkdk......',
  '.kppwwk...kddddk........',
  '..kwwwwkkddddk..........',
  '...kwwdddddk............',
  '....kkk.kkk.............',
  '...kwwk.kdk.............',
  '..kkkk.kkk..............',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
]);

function rowsOf(width: number, lines: readonly string[]): string[] {
  return lines.map((line, index) => {
    if (line.length !== width) throw new Error(`shiba row ${index} is ${line.length}, want ${width}`);
    return line;
  });
}

function emptyRow(width: number): string {
  return '.'.repeat(width);
}

function lowestInk(rows: readonly string[]): number {
  for (let y = rows.length - 1; y >= 0; y -= 1) {
    const row = rows[y] ?? '';
    if ([...row].some((cell) => cell !== '.')) return y;
  }
  return Math.max(0, rows.length - 1);
}

function shiftRow(row: string, dx: number): string {
  if (dx === 0) return row;
  if (dx < 0) return row.slice(-dx).padEnd(row.length, '.');
  return row.padStart(row.length + dx, '.').slice(0, row.length);
}

/** Move the drawing so its lowest pixel shares the standing foot row. */
function plant(rows: readonly string[], foot: number): string[] {
  const width = rows[0]?.length ?? 0;
  const empty = emptyRow(width);
  const dy = foot - lowestInk(rows);
  if (dy === 0) return rows.map((row) => row);
  const next = rows.map(() => empty);
  for (let y = 0; y < rows.length; y += 1) {
    const dest = y + dy;
    if (dest < 0 || dest >= rows.length) continue;
    next[dest] = rows[y] ?? empty;
  }
  return next;
}

function lift(rows: readonly string[], from: number, to: number): string[] {
  const width = rows[0]?.length ?? 0;
  const empty = emptyRow(width);
  const next = rows.map((row) => row);
  for (let y = to; y >= from; y -= 1) {
    const dest = y - 1;
    if (dest >= 0) next[dest] = rows[y] ?? empty;
  }
  next[to] = rows[to] ?? empty;
  return next;
}

function attackOf(rows: readonly string[]): string[] {
  return rows.map((row, y) => {
    const moved = y >= 6 && y <= 20 ? shiftRow(row, -2) : y >= 21 && y <= 28 ? shiftRow(row, -1) : row;
    if (y !== 15) return moved;
    const chars = moved.split('');
    const nose = chars.indexOf('p');
    if (nose >= 0) chars[Math.min(chars.length - 1, nose + 2)] = 't';
    return chars.join('');
  });
}

function hitOf(rows: readonly string[]): string[] {
  return rows.map((row, y) => {
    const moved = y >= 6 && y <= 16 ? shiftRow(row, 2) : row;
    if (y < 12 || y > 15) return moved;
    return moved.replaceAll('s', 'p').replaceAll('h', 'd');
  });
}

function chargeOf(rows: readonly string[]): string[] {
  return rows.map((row, y) => (y >= 6 && y <= 18 ? shiftRow(row, -1) : row));
}

/**
 * Drop the body so the brace is shorter, and keep the first `dropBy` rows empty
 * when the standing ears start on row 2. Feet stay on the standing foot row.
 */
function brace(rows: readonly string[], dropBy: number): string[] {
  const width = rows[0]?.length ?? 0;
  const empty = emptyRow(width);
  const foot = lowestInk(rows);
  const next = rows.map(() => empty);
  for (let y = 0; y < rows.length; y += 1) {
    const dest = y + dropBy;
    if (dest < 0 || dest > foot || dest >= rows.length) continue;
    next[dest] = rows[y] ?? empty;
  }
  return next;
}

function padX(rows: readonly string[], left: number, right: number): string[] {
  return rows.map((row) => '.'.repeat(left) + row + '.'.repeat(right));
}

function mapKey(key: string, coat: CoatName, x: number, y: number): string {
  if (key === '.' || key === 'p' || key === 's' || key === 't') return key;
  switch (coat) {
    case 'red':
      if (key === 'h') return 'l';
      if (key === 'd') return 'o';
      return key;
    case 'black':
      if (key === 'k') return 'B';
      if (key === 'd' || key === 'o') return 'X';
      if (key === 'l') return 'F';
      if (key === 'w') return 'Y';
      if (key === 'h') return 'Q';
      return key;
    case 'white':
      if (key === 'k') return 'F';
      if (key === 'd' || key === 'o') return 'C';
      if (key === 'l') return 'A';
      if (key === 'w') return 's';
      if (key === 'h') return 'H';
      return key;
    case 'sesame':
      if (key === 'h' || key === 'o') return 'o';
      if ((key === 'd' || key === 'l') && (x * 2 + y) % 5 === 0) return 'X';
      if (key === 'd') return 'o';
      return key;
    default: {
      const neverCoat: never = coat;
      return neverCoat;
    }
  }
}

function paint(rows: readonly string[], coat: CoatName): Sprite {
  const colored = rows.map((row, y) =>
    row
      .split('')
      .map((key, x) => mapKey(key, coat, x, y))
      .join(''),
  );
  const width = colored[0]?.length ?? 0;
  return { w: width, h: colored.length, rows: colored };
}

function framesOf(idle: readonly string[], down: readonly string[], coat: CoatName, dropBy: number): ShibaFrames {
  const foot = lowestInk(idle);
  const standing = padX(idle, 2, 2);
  const posed = {
    idle: standing,
    idle2: padX(lift(idle, 2, 18), 2, 2),
    attack: padX(attackOf(idle), 2, 2),
    hit: padX(hitOf(idle), 2, 2),
    guard: padX(brace(idle, dropBy), 2, 2),
    down: padX(plant(down, foot), 2, 2),
    win: padX(lift(idle, 2, 12).map((row, y) => (y >= 1 && y <= 12 ? shiftRow(row, -1) : row)), 2, 2),
    charge: padX(chargeOf(idle), 2, 2),
  };
  return {
    idle: paint(posed.idle, coat),
    idle2: paint(posed.idle2, coat),
    attack: paint(posed.attack, coat),
    hit: paint(posed.hit, coat),
    guard: paint(posed.guard, coat),
    down: paint(posed.down, coat),
    win: paint(posed.win, coat),
    charge: paint(posed.charge, coat),
  };
}

export const redShiba: ShibaFrames = framesOf(ADULT_IDLE, ADULT_DOWN, 'red', 6);
export const blackShiba: ShibaFrames = framesOf(ADULT_IDLE, ADULT_DOWN, 'black', 6);
export const whiteShiba: ShibaFrames = framesOf(ADULT_IDLE, ADULT_DOWN, 'white', 6);
export const sesameShiba: ShibaFrames = framesOf(ADULT_IDLE, ADULT_DOWN, 'sesame', 6);
export const pupShiba: ShibaFrames = framesOf(PUP_IDLE, PUP_DOWN, 'red', 4);
