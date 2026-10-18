import type { EncounterId } from './config';
import { blackShiba, pupShiba, redShiba, sesameShiba, whiteShiba } from './shiba';
import type { Sprite } from './sprites';

/** One painted dog, in the poses a battle asks for. */
export interface DogFrames {
  idle: Sprite;
  idle2: Sprite;
  attack: Sprite;
  hit: Sprite;
  guard: Sprite;
  down: Sprite;
  win: Sprite;
  charge: Sprite;
}

type Pose = 'idle' | 'idle2' | 'attack' | 'hit' | 'guard' | 'down' | 'win' | 'charge';
type Ear = 'prick' | 'bat' | 'drop' | 'button';
type Tail = 'curl' | 'stub' | 'saber';
type Face = 'fox' | 'flat' | 'long';

interface Coat {
  line: string;
  dark: string;
  mid: string;
  lit: string;
  hot: string;
  belly: string;
  nose: string;
  ear: string;
}

interface Breed {
  w: number;
  h: number;
  coat: Coat;
  /** Body ellipse radii, before the pose squashes them. */
  body: readonly [number, number];
  head: readonly [number, number];
  snout: number;
  /** Leg length from the belly to the paw. */
  leg: number;
  ear: Ear;
  earSize: number;
  tail: Tail;
  face: Face;
  /** Extra ruff around the neck. 0 is a smooth coat. */
  ruff: number;
  /** Dark cap over the eyes. */
  mask: boolean;
  /** Forehead wrinkles, for the pug. */
  wrinkles: boolean;
  /** Dark hairs scattered on the back. */
  saddle: boolean;
  menacing: boolean;
  /** 1 faces the party, -1 faces the foe. */
  faceDir: 1 | -1;
}

const CORGI: Coat = {
  line: 'k',
  dark: 'S',
  mid: '0',
  lit: '4',
  hot: 'y',
  belly: 'w',
  nose: 'p',
  ear: 'd',
};

const FAWN: Coat = {
  line: 'S',
  dark: 'R',
  mid: 'Q',
  lit: 'P',
  hot: 'Y',
  belly: 'Y',
  nose: 'p',
  ear: 'R',
};

const CHOCOLATE: Coat = {
  line: 'X',
  dark: 'T',
  mid: 'U',
  lit: 'V',
  hot: 'W',
  belly: 'W',
  nose: 'p',
  ear: 'T',
};

const AKITA: Coat = {
  line: 'k',
  dark: 'D',
  mid: 'H',
  lit: 'Y',
  hot: 's',
  belly: 's',
  nose: 'p',
  ear: 'd',
};

class Pix {
  readonly w: number;
  readonly h: number;
  private readonly cells: string[][];

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.cells = Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));
  }

  get(x: number, y: number): string {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return '.';
    return this.cells[y]?.[x] ?? '.';
  }

  set(x: number, y: number, key: string): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const row = this.cells[y];
    if (!row || key === '.') return;
    row[x] = key;
  }

  sprite(): Sprite {
    return { w: this.w, h: this.h, rows: this.cells.map((row) => row.join('')) };
  }
}

function shade(coat: Coat, light: number, belly: boolean): string {
  if (belly) return coat.belly;
  if (light > 0.78) return coat.hot;
  if (light > 0.52) return coat.lit;
  if (light < 0.28) return coat.dark;
  return coat.mid;
}

function blob(
  pix: Pix,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  coat: Coat,
  belly = false,
): void {
  const rxi = Math.max(0.8, rx);
  const ryi = Math.max(0.8, ry);
  const y0 = Math.floor(cy - ryi - 1);
  const y1 = Math.ceil(cy + ryi + 1);
  const x0 = Math.floor(cx - rxi - 1);
  const x1 = Math.ceil(cx + rxi + 1);
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const nx = (x + 0.5 - cx) / rxi;
      const ny = (y + 0.5 - cy) / ryi;
      const dist = nx * nx + ny * ny;
      if (dist > 1) continue;
      const nz = Math.sqrt(Math.max(0, 1 - dist));
      const light = nx * -0.42 + ny * -0.62 + nz * 0.9;
      pix.set(x, y, shade(coat, light, belly && ny > 0.15));
    }
  }
}

function outline(pix: Pix, key: string): void {
  const edge: readonly (readonly [number, number])[] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  const found: (readonly [number, number])[] = [];
  for (let y = 0; y < pix.h; y += 1) {
    for (let x = 0; x < pix.w; x += 1) {
      if (pix.get(x, y) === '.') continue;
      const exposed = edge.some(([dx, dy]) => pix.get(x + dx, y + dy) === '.');
      if (exposed) found.push([x, y]);
    }
  }
  for (const [x, y] of found) pix.set(x, y, key);
}

function eye(pix: Pix, x: number, y: number, open: boolean, big: boolean): void {
  if (!open) {
    pix.set(x - 1, y, 'p');
    pix.set(x, y, 'p');
    pix.set(x + 1, y, 'p');
    pix.set(x + (big ? 2 : 1), y + 1, 'k');
    return;
  }
  const r = big ? 2 : 1;
  for (let dy = -r; dy <= r; dy += 1) {
    for (let dx = -r; dx <= r; dx += 1) {
      if (dx * dx + dy * dy > r * r + 0.2) continue;
      pix.set(x + dx, y + dy, 'e');
    }
  }
  pix.set(x + (big ? 1 : 0), y, 'p');
  pix.set(x + (big ? 1 : 0), y + (big ? 1 : 0), 'p');
  pix.set(x - (big ? 1 : 1), y - 1, 's');
}

function nose(pix: Pix, x: number, y: number, key: string): void {
  pix.set(x, y, key);
  pix.set(x + 1, y, key);
  pix.set(x, y + 1, key);
  pix.set(x - 1, y, 's');
}

function earPrick(pix: Pix, x: number, y: number, size: number, lean: number, coat: Coat): void {
  for (let i = 0; i < size; i += 1) {
    const half = Math.max(1, (size - i) * 0.42);
    for (let dx = -half; dx <= half; dx += 1) {
      const inner = Math.abs(dx) < half * 0.45 && i > 1 && i < size - 1;
      pix.set(Math.round(x + lean * i * 0.18 + dx), Math.round(y - i), inner ? 'I' : coat.ear);
    }
  }
}

function earBat(pix: Pix, x: number, y: number, size: number, lean: number, coat: Coat): void {
  for (let i = 0; i < size; i += 1) {
    const half = 1.2 + (size - i) * 0.55;
    for (let dx = -half; dx <= half; dx += 1) {
      const inner = Math.abs(dx) < half * 0.55 && i < size - 2;
      pix.set(Math.round(x + lean * i * 0.08 + dx), Math.round(y - i), inner ? 'I' : coat.ear);
    }
  }
}

function paintDog(breed: Breed, pose: Pose): Sprite {
  const pix = new Pix(breed.w, breed.h);
  const dir = breed.faceDir;
  const ground = breed.h - 2;
  const attack = pose === 'attack';
  const hit = pose === 'hit';
  const guard = pose === 'guard';
  const down = pose === 'down';
  const win = pose === 'win';
  const breath = pose === 'idle2' ? -1 : 0;
  const proud = pose === 'charge' ? -2 : 0;
  const tuck = guard ? 0.62 : 1;
  const leg = Math.max(3, Math.round(breed.leg * (guard ? 0.45 : down ? 0.35 : 1)));
  const bodyRx = breed.body[0] * (down ? 1.15 : attack ? 1.05 : 1);
  const bodyRy = breed.body[1] * (down ? 0.72 : guard ? 0.85 : 1);
  const mid = breed.w * 0.5 + dir * (attack ? 3 : hit ? -2 : 0);
  const bodyCy = ground - leg - bodyRy * (down ? 0.35 : tuck) + breath + proud + (guard ? 2 : 0);
  const bodyCx = mid - dir * bodyRx * 0.05;
  blob(pix, bodyCx, bodyCy, bodyRx, bodyRy, breed.coat, true);

  if (breed.ruff > 0 && !down) {
    blob(pix, bodyCx + dir * bodyRx * 0.55, bodyCy - bodyRy * 0.2, breed.ruff, breed.ruff * 0.8, breed.coat);
  }

  const headRx = breed.head[0];
  const headRy = breed.head[1] * (guard ? 0.92 : 1);
  const headCx = bodyCx + dir * (bodyRx * 0.72 + (attack ? 4 : hit ? -3 : 0) + (down ? bodyRx * 0.15 : 0));
  const headCy = down
    ? bodyCy + bodyRy * 0.15
    : bodyCy - bodyRy * 0.85 - headRy * 0.55 * tuck + breath + proud + (guard ? 6 : 0) + (hit ? -2 : 0);
  blob(pix, headCx, headCy, headRx, headRy, breed.coat);

  const snout = Math.max(2, breed.snout + (attack ? 1 : 0));
  const snoutCx = headCx + dir * (headRx * 0.55 + snout * 0.45);
  const snoutCy = headCy + headRy * (breed.face === 'flat' ? 0.25 : 0.34);
  blob(pix, snoutCx, snoutCy, snout, breed.face === 'flat' ? 2.4 : 3.1, breed.coat);

  const tailX = bodyCx - dir * bodyRx * 0.92;
  const tailY = bodyCy - bodyRy * (win || pose === 'charge' ? 0.2 : 0.55);
  if (breed.tail === 'curl' && !down) {
    const radius = Math.max(4, bodyRy * 0.55);
    for (let step = 0; step < 8; step += 1) {
      const angle = -0.4 + step * 0.42;
      blob(
        pix,
        tailX - dir * Math.cos(angle) * radius,
        tailY - radius * 0.2 + Math.sin(angle) * radius,
        2.6,
        2.6,
        breed.coat,
      );
    }
  } else if (breed.tail === 'saber') {
    blob(pix, tailX - dir * 7, tailY - (down ? 0 : 3), 8, 2.2, breed.coat);
  } else if (!down) {
    blob(pix, tailX, tailY, 3, 2.2, breed.coat);
  }

  const paw = (along: number, front: boolean): void => {
    const reach = front && attack ? dir * 5 : 0;
    const x = bodyCx + dir * along + reach;
    const top = bodyCy + bodyRy * 0.45;
    const h = Math.max(2, ground - top);
    for (let i = 0; i < h; i += 1) {
      const wide = i > h - 3 ? 2.3 : 1.6;
      blob(pix, x, top + i, wide, 1.15, breed.coat);
    }
    pix.set(Math.round(x - 1), ground, breed.coat.line);
    pix.set(Math.round(x + 1), ground, breed.coat.line);
  };
  paw(-bodyRx * 0.55, false);
  paw(-bodyRx * 0.22, false);
  paw(bodyRx * 0.28, true);
  paw(bodyRx * 0.62, true);

  outline(pix, breed.coat.line);

  const earY = headCy - headRy * 0.75;
  const earSpread = headRx * 0.62;
  const drawEar = (side: number): void => {
    const x = headCx + dir * side * earSpread;
    if (breed.ear === 'bat') earBat(pix, x, earY + 2, breed.earSize, side * dir, breed.coat);
    else if (breed.ear === 'prick') earPrick(pix, x, earY + 1, breed.earSize, side * dir, breed.coat);
    else if (breed.ear === 'drop') blob(pix, x + dir * 1, earY + breed.earSize * 0.45, 3.2, breed.earSize * 0.55, { ...breed.coat, mid: breed.coat.ear, lit: breed.coat.dark, hot: breed.coat.dark, dark: breed.coat.line });
    else blob(pix, x, earY + 2, 3.4, 2.6, breed.coat);
  };
  drawEar(-1);
  drawEar(1);
  outline(pix, breed.coat.line);

  if (breed.mask) {
    blob(pix, headCx + dir * headRx * 0.15, headCy + 1, headRx * 0.72, headRy * 0.42, {
      ...breed.coat,
      dark: 'X',
      mid: 'B',
      lit: 'X',
      hot: 'F',
      belly: 'B',
    });
  }
  if (breed.saddle) {
    for (let y = Math.round(bodyCy - bodyRy); y < bodyCy; y += 2) {
      for (let x = Math.round(bodyCx - bodyRx * 0.6); x < bodyCx + bodyRx * 0.4; x += 2) {
        if (((x + y) & 3) === 0) pix.set(x, y, 'k');
      }
    }
  }

  const eyeY = headCy - headRy * 0.08 + (breed.face === 'flat' ? 1 : 0);
  const eyeX = headCx + dir * headRx * 0.18;
  const open = !hit && !down;
  const big = breed.ear === 'bat' || breed.face === 'flat';
  eye(pix, eyeX, eyeY, open, big);
  if (breed.menacing && open) {
    pix.set(eyeX - dir, eyeY - 3, 'p');
    pix.set(eyeX, eyeY - 3, 'p');
    pix.set(eyeX + dir, eyeY - 2, 'p');
  }
  nose(pix, Math.round(snoutCx + dir * (snout - 1)), Math.round(snoutCy), breed.coat.nose);

  if (attack || (breed.menacing && pose !== 'down')) {
    const mouthX = Math.round(snoutCx + dir * (snout - 2));
    const mouthY = Math.round(snoutCy + 3);
    pix.set(mouthX, mouthY, 'p');
    pix.set(mouthX - dir, mouthY, 't');
    pix.set(mouthX - dir * 2, mouthY, 't');
    if (attack) pix.set(mouthX - dir, mouthY - 1, 'e');
  }
  if (breed.wrinkles) {
    const y = Math.round(headCy - 2);
    for (let i = -3; i <= 3; i += 1) pix.set(Math.round(headCx + i), y, 'S');
    for (let i = -2; i <= 2; i += 1) pix.set(Math.round(headCx + i), y + 2, 'R');
  }
  return pix.sprite();
}

function frames(breed: Breed): DogFrames {
  return {
    idle: paintDog(breed, 'idle'),
    idle2: paintDog(breed, 'idle2'),
    attack: paintDog(breed, 'attack'),
    hit: paintDog(breed, 'hit'),
    guard: paintDog(breed, 'guard'),
    down: paintDog(breed, 'down'),
    win: paintDog(breed, 'win'),
    charge: paintDog(breed, 'charge'),
  };
}

function breed(partial: Breed): Breed {
  return partial;
}

export const heroFrames: DogFrames = redShiba;

export const hero: Sprite = heroFrames.idle;
export const heroIdle: Sprite = heroFrames.idle2;
export const heroAttack: Sprite = heroFrames.attack;
export const heroHurt: Sprite = heroFrames.hit;
export const heroGuard: Sprite = heroFrames.guard;
export const heroDown: Sprite = heroFrames.down;
export const heroWin: Sprite = heroFrames.win;
export const heroCharge: Sprite = heroFrames.charge;

export const allyFrames: readonly DogFrames[] = [blackShiba, whiteShiba, sesameShiba, pupShiba];

export const allySprites: readonly Sprite[] = allyFrames.map((dog) => dog.idle);

const corgi = breed({
  w: 52,
  h: 36,
  coat: CORGI,
  body: [16, 7],
  head: [8, 7],
  snout: 5,
  leg: 6,
  ear: 'prick',
  earSize: 7,
  tail: 'stub',
  face: 'fox',
  ruff: 0,
  mask: false,
  wrinkles: false,
  saddle: true,
  menacing: false,
  faceDir: 1,
});

const chihuahua = breed({
  w: 40,
  h: 48,
  coat: FAWN,
  body: [8, 7],
  head: [8, 7],
  snout: 3,
  leg: 8,
  ear: 'bat',
  earSize: 13,
  tail: 'saber',
  face: 'fox',
  ruff: 0,
  mask: false,
  wrinkles: false,
  saddle: false,
  menacing: false,
  faceDir: 1,
});

const dachshund = breed({
  w: 64,
  h: 30,
  coat: CHOCOLATE,
  body: [20, 6],
  head: [7, 6],
  snout: 8,
  leg: 4,
  ear: 'drop',
  earSize: 6,
  tail: 'saber',
  face: 'long',
  ruff: 0,
  mask: false,
  wrinkles: false,
  saddle: false,
  menacing: false,
  faceDir: 1,
});

const pug = breed({
  w: 44,
  h: 40,
  coat: FAWN,
  body: [11, 9],
  head: [10, 9],
  snout: 2,
  leg: 6,
  ear: 'button',
  earSize: 4,
  tail: 'curl',
  face: 'flat',
  ruff: 0,
  mask: true,
  wrinkles: true,
  saddle: false,
  menacing: false,
  faceDir: 1,
});

const akita = breed({
  w: 96,
  h: 104,
  coat: AKITA,
  body: [28, 18],
  head: [16, 14],
  snout: 9,
  leg: 24,
  ear: 'prick',
  earSize: 16,
  tail: 'curl',
  face: 'fox',
  ruff: 10,
  mask: true,
  wrinkles: false,
  saddle: false,
  menacing: true,
  faceDir: 1,
});

export const enemyFrames: Record<EncounterId, DogFrames> = {
  tutorial: frames(corgi),
  minion: frames(chihuahua),
  minion2: frames(dachshund),
  minion3: frames(pug),
  boss: frames(akita),
};

export const enemySprites: Record<EncounterId, Sprite> = {
  tutorial: enemyFrames.tutorial.idle,
  minion: enemyFrames.minion.idle,
  minion2: enemyFrames.minion2.idle,
  minion3: enemyFrames.minion3.idle,
  boss: enemyFrames.boss.idle,
};

export const corgiSprite: Sprite = enemySprites.tutorial;
export const chihuahuaSprite: Sprite = enemySprites.minion;
export const dachshundSprite: Sprite = enemySprites.minion2;
export const pugSprite: Sprite = enemySprites.minion3;
export const akitaSprite: Sprite = enemySprites.boss;
