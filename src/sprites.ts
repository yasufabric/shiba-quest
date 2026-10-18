export interface Sprite {
  w: number;
  h: number;
  rows: readonly string[];
}

/** Original sprites for the battle field. */
export const palette: Record<string, string> = {
  k: '#3a2218',
  d: '#7a3418',
  o: '#d86828',
  l: '#f4a45c',
  w: '#f6e2c4',
  e: '#fffaf4',
  p: '#1c100e',
  s: '#fff6ec',
  t: '#c44858',
  n: '#5a3020',
  q: '#ecd8b8',
  h: '#8a5a38',
  u: '#3a1848',
  b: '#5c3070',
  c: '#784888',
  m: '#846096',
  a: '#a878b0',
  v: '#d6bee0',
  g: '#2a1438',
  y: '#ffd6ba',
  x: '#f09678',
  j: '#c44e48',
  i: '#962a3a',
  z: '#6e1c30',
  r: '#481224',
  f: '#2a0c1c',
  '1': '#14161c',
  '2': '#2c3144',
  '3': '#596078',
  '4': '#f0c14a',
  '5': '#d23a32',
  '6': '#1e4c30',
  '7': '#3d8a44',
  '8': '#8dcc72',
  '9': '#e7f3c4',
  '0': '#d06a28',
  A: '#f7f8f4',
  C: '#d9d4ca',
  E: '#1a140f',
  F: '#3c2e24',
  G: '#2a6cb8',
  H: '#f0d2a8',
  I: '#f0a0b0',
  J: '#f2d23a',
  K: '#8a6238',
  L: '#c98448',
  M: '#6aaf5a',
  B: '#100e0c',
  D: '#4a3424',
  N: '#6e6258',
  P: '#f3d7b0',
  Q: '#e0b07a',
  R: '#b57a45',
  S: '#6e4424',
  T: '#4a2a16',
  U: '#8d552c',
  V: '#c48448',
  W: '#e6bc8a',
  X: '#241810',
  Y: '#f7ead8',
};


export {
  akitaSprite,
  allyFrames,
  allySprites,
  chihuahuaSprite,
  corgiSprite,
  dachshundSprite,
  enemyFrames,
  enemySprites,
  hero,
  heroAttack,
  heroCharge,
  heroDown,
  heroFrames,
  heroGuard,
  heroHurt,
  heroIdle,
  heroWin,
  pugSprite,
} from './dogs';

export const bone: Sprite = {
  w: 16,
  h: 8,
  rows: [
    '.kk..kk....kk..k',
    'kqqkkqqk..kqqkkq',
    'kqqqqqqkkkkqqqqk',
    '.kqqqqqqqqqqqqk.',
    '.kqqqqqqqqqqqqk.',
    'kqqqqqqkkkkqqqqk',
    'kqqkkqqk..kqqkkq',
    '.kk..kk....kk..k',
  ],
};

export const bang: Sprite = {
  w: 7,
  h: 10,
  rows: [
    '..kkk..',
    '.keeeek',
    '.keeeek',
    '..kek..',
    '..kek..',
    '..kek..',
    '.......',
    '..kek..',
    '.keeeek',
    '..kkk..',
  ],
};

export const finger: Sprite = {
  w: 14,
  h: 9,
  rows: [
    '......kk......',
    '.....kwwk.....',
    '.....kwwk.....',
    '....kwwwk.....',
    '...kskwwwk....',
    '..ksskwwwwk...',
    '..ksskwwwwk...',
    '...kskwwk.....',
    '....kkkk......',
  ],
};


export interface BlitOptions {
  flipX?: boolean;
  alpha?: number;
  /** Replace palette keys. */
  recolor?: Record<string, string>;
  /** Flat color for every filled pixel. Used for hit flash. */
  tint?: string;
}

export function blit(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  scale: number,
  options?: BlitOptions,
): void {
  const alpha = options?.alpha ?? 1;
  if (alpha <= 0 || scale <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  const left = Math.round(x - (sprite.w * scale) / 2);
  const top = Math.round(y - sprite.h * scale);
  for (let row = 0; row < sprite.h; row += 1) {
    const line = sprite.rows[row] ?? '';
    for (let col = 0; col < sprite.w; col += 1) {
      const sourceCol = options?.flipX ? sprite.w - 1 - col : col;
      const key = line[sourceCol] ?? '.';
      if (key === '.' || key === ' ') continue;
      const color = options?.tint ?? options?.recolor?.[key] ?? palette[key];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(left + col * scale, top + row * scale, Math.ceil(scale), Math.ceil(scale));
    }
  }
  ctx.restore();
}

export interface Block {
  dx: number;
  dy: number;
  color: string;
  size: number;
}

/** Chunks of a sprite, centered, for the dissolve. */
export function shatterBlocks(sprite: Sprite, cell = 3): Block[] {
  const blocks: Block[] = [];
  for (let y = 0; y < sprite.h; y += cell) {
    const line = sprite.rows[y] ?? '';
    for (let x = 0; x < sprite.w; x += cell) {
      const key = line[x] ?? '.';
      if (key === '.' || key === ' ') continue;
      const color = palette[key];
      if (!color) continue;
      blocks.push({
        dx: x - sprite.w / 2,
        dy: y - sprite.h / 2,
        color,
        size: cell,
      });
    }
  }
  return blocks;
}
