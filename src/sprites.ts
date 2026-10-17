export interface Sprite {
  w: number;
  h: number;
  rows: readonly string[];
}

export const palette: Record<string, string> = {
  k: '#1c1412',
  o: '#e38634',
  d: '#a85220',
  l: '#f6bc74',
  w: '#faf0de',
  c: '#f2b09c',
  p: '#16100e',
  n: '#403028',
  e: '#fffdf8',
  t: '#d25a6c',
  m: '#7660b0',
  u: '#403070',
  v: '#b096d6',
  y: '#b03438',
  a: '#2a2430',
  i: '#ececf4',
  q: '#d2ba96',
  s: '#ece0d0',
  f: '#96828c',
  z: '#18141c',
  r: '#c4403a',
  h: '#5c463e',
  g: '#46564e',
  b: '#7896d2',
};

export const hero: Sprite = {
  w: 31,
  h: 40,
  rows: [
    '.....k...............k.........',
    '....kok.............kok........',
    '...kook.............kook.......',
    '...kocok..kkkkkkkk.kocok.......',
    '...kccokkkooooooookkocck.......',
    '..kocccooooooooooooocccok......',
    '..koccoooooooooooooooocok......',
    '..kocoooooooooooooooooook......',
    '.kocoooooooooooooooooooook.....',
    '.kocoooooooooooooooooooook.....',
    '.koooooooooooooooooooooook.....',
    'koooooddddddooooddddddooook....',
    '.koooooeeeewwwwwweeeeoooook....',
    '.kooooeeeppewwwweeeppeooook....',
    '.kooooeepppewwwweepppeooook....',
    '.koooooeeppwwwwwweeppoooook....',
    '.kooooweeeewwwwwweeeewooook....',
    '.koooowwwwwwwppwwwwwwwooook....',
    '..kooowwwwwwppppwwwwwwoook.....',
    '..kooowwwwwwwwwwwwwwwwoook.....',
    '...kooowwwwwwnnnwwwwwoookkkk...',
    '...kooowwwwwttcwwwwwwoooooook..',
    '....kooowwwoooooowwwoooooooook.',
    '.....kooooooooooooooooooooooook',
    '......kooooooooooooookooowwoook',
    '.....kooooooowwoooooooooowwoook',
    '.....kooooowwwwwwoooooooooooook',
    '....kooooowwwwwwwwoooooooooook.',
    '....kooooowwwwwwwwoooookooook..',
    '....kooooowwwwwwwwoooookkkkk...',
    '....kooooowwwwwwwwoooook.......',
    '.....koooowwwwwwwwooook........',
    '.....koooowwwwwwwwooook........',
    '......koooowwwwwwwooook........',
    '......koooooowwoooooook........',
    '......koooooooooooooook........',
    '......koooookkkkkoooook........',
    '......kwwwwwk...kwwwwwk........',
    '......kwwwwwk...kwwwwwk........',
    '.......kkkkk.....kkkkk.........',
  ],
};

export const dumpling: Sprite = {
  w: 22,
  h: 22,
  rows: [
    '........kkkkkk........',
    '.....kkkmmmmmmkkk.....',
    '....kmmmmmmmmmmmmk....',
    '...kmmmmmmmmmmmmmmk...',
    '..kmmmmvvvvuvvvmmmmk..',
    '.kmmmmvvvvvvuvvvmmmmk.',
    '.kmmmvvvvvvuvvvvvmmmk.',
    'kmmmviiiivvvviiiivmmmk',
    'kmmmviipivvvviipivmmmk',
    'kmmmvippivvvvippivmmmk',
    'kmmmviipivvvviipivmmmk',
    'kmmmmvvvvvvvvvvvvmmmmk',
    'kmmmmmvvvvvvvvvvmmmmmk',
    '.kmmmmmvvvvvvvvmmmmmk.',
    '.kmmmmmmmnnnnnmmmmmmk.',
    '..kmmmmmmmrrmmmmmmmk..',
    '...kmmmmmmmmmmmmmmk...',
    '....kmmmmmmmmmmmmk....',
    '....kuuuummmmuuuuk....',
    '....kuuuukkkkuuuuk....',
    '....kuuuuk..kuuuuk....',
    '.....kkkk....kkkk.....',
  ],
};

export const imp: Sprite = {
  w: 27,
  h: 35,
  rows: [
    '............kk.............',
    '...........kyyk............',
    '...........kyyk............',
    '..........kyyyyk...........',
    '..........kyyyyyk..........',
    '..........kyyyyyk..........',
    '.......kkkuuuuuuykk........',
    '......kuuuuuuuuuuuuk.......',
    '.....kuuuuuuuuuuuuuuk......',
    '....kuuuuuuuuuuuuuuuuk.....',
    '...kuuuuuuuuuuuuuuuuuuk....',
    '...kuuuuyymmmmmmyyuuuuk....',
    '..kuuuuyyyymmmmyyyyuuuuk...',
    '..kuuuuyppymmmmyppyuuuuk...',
    '..kuuumyppymmmmyppymuuuk...',
    '..kuuumyypymmmmyypymuuuk...',
    '..kuuummyymmmmmmyymmuuuk...',
    '..kuuummmmmmmmmmmmmmuuuk...',
    '...kuuummmmmmmmmmmmuuuk....',
    '...kuuuuzzzzzzzzzzzuuuk....',
    '....kuuuuimimimiuiuuuk.....',
    '.....kuuuuuuuuuuuuuuk......',
    '.kkkkkkuuuuuuuuuuuukkkkkkk.',
    'kuuuuuuuuuuuuuuuuuukuuuuuuk',
    'kuuuuuuuuuuuuuuuuuuuuuuuuuk',
    'kuuuuuuuuummmmmmuuuuuuuuuuk',
    'kuuuuuuuummmmmmmmuuuuuuuuuk',
    'kuuuuuuuummmmmmmmuuuuuuuuuk',
    '.kkkkuuuummmmmmmmuuuukkkkk.',
    '.....kuuummmmmmmmuuuk......',
    '......kuuummmmmmuuuuk......',
    '......kzzzzzuuuzzzzzk......',
    '......kzzzzzuuuzzzzzk......',
    '......kzzzzzkkkzzzzzk......',
    '.......kkkkk...kkkkk.......',
  ],
};

export const boss: Sprite = {
  w: 47,
  h: 52,
  rows: [
    '..........k........................k...........',
    '.........khk......................khk..........',
    '.........khhk....................khhk..........',
    '.........kyyk....................kyyk..........',
    '........khyyk......kkkkkkkk......kyyhk.........',
    '........khyyhk..kkkaaaaaaaakkk..khyyhk.........',
    '.......khyyyykkkaaaaaaaaaaaaaakkkyyyyhk........',
    '.......khyyyykaaaaaaaaaaaaaaaaaakyyyyhk........',
    '......khyyyyaaaaaaaaaaaaaaaaaaaaaayyyyhk.......',
    '......khyyyaaaaaaaaaaaaaaaaaaaaaaaayyyhk.......',
    '......khyyaaaaaaaaaaaaaaaaaaaaaaaaaayyhk.......',
    '.....khyyaaaaaaaaaaaaaaaaaaaaaaaaaaaayyhk......',
    '.....khhhaaaaaaaaaaaaaaaaaaaaaaaaaaaahhhk......',
    '...kkhhkaaaaaaaaaaaaaaaaaaaaaaaaaaaaaakhhkk....',
    '..kzzzzkaaaaayyyyaaaaaaaaaaaayyyyaaaaakzzzzk...',
    '.kzzzzzzaaaayypppyaaaaaaaaaayypppyaaaazzzzzzk..',
    '.kzzzzzzaaaayypppyaaaaaaaaaayypppyaaaazzzzzzk..',
    'kzzzzzzzzaaaayypyaaaaaaaaaaaayypyaaaazzzzzzzzk.',
    'kzzzzzzzzaaaaaaaaaaffffffffaaaaaaaaaazzzzzzzzk.',
    'kzzzzzzzzaaaaaaaaffffffffffffaaaaaaaazzzzzzzzk.',
    'kzzzzzzzzaaaaaaaffffffffffffffaaaaaaazzzzzzzzk.',
    'kzzzzzzzzaaaaaaffffffppppffffffaaaaaazzzzzzzzk.',
    'kzzzzzzzzaaaaafffffffppppfffffffaaaaazzzzzzzzk.',
    '.kzzzzzzkaaaaaffffffffffffffffffaaaaakzzzzzzk..',
    '.kzzzzzzkaaaaaffffffffffffffffffaaaaakzzzzzzk..',
    '..kzzzzk.kaaaaffffffffffffffffffaaaak.kzzzzk...',
    '...kkkk...kaaaazizzizzizzizzizzzaaak...kkkk....',
    '...........kaaazzzzzzzzzzzzzzzzzaak............',
    '............kkaaaffaaaaaaaaffaaakk.............',
    '..............kkaaaaaaaaaaaaaakk...............',
    '............kkaaaaaaaaaaaaaaaaaakk.............',
    '.kkkkkkkkk.kaaaaaaaaaaaaaaaaaaaaaak..kkkkkkkkk.',
    'kaaaaaaaaakaaaaaaaaaaaaaaaaaaaaaaaakkaaaaaaaaak',
    'kaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaakaaaaaaaaak',
    'kaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaakaaaaaaaaak',
    'kaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaak',
    'kaaaaaaaaaaaaaaaaaaaayyyyaaaaaaaaaaaaaaaaaaaaak',
    'kaaaaaaaaaaaaaaaaaayyyyyyyyaaaaaaaaaaaaaaaaaaak',
    'kaaaaaaaaaaaaaaaaayyyyyyyyyyaaaaaaaaaaaaaaaaaak',
    'khhhhhhhhhaaaaaaaayyyyyyyyyyaaaaaaaaahhhhhhhhhk',
    'khhhhhhhhhaaaaaaaayyyyyyyyyyaaaaaaaaahhhhhhhhhk',
    'khhhhhhhhhaaaaaaaayyyyyyyyyyaaaaaaaakhhhhhhhhhk',
    '.kkkkkkkkkaaaaaaaaayyyyyyyyaaaaaaaaakkkkkkkkkk.',
    '..........kaaaaaaaaaayyyyaaaaaaaaaaak..........',
    '..........kaaaaaaaaaaaaaaaaaaaaaaaaak..........',
    '..........kaaaaaaaaaaaaaaaaaaaaaaaaak..........',
    '..........kaazzzzzzzzzaaazzzzzzzzzaak..........',
    '...........kkzzzzzzzzzaaazzzzzzzzzkk...........',
    '............kzzzzzzzzzkkkzzzzzzzzzk............',
    '............kzzzzzzzzzk.kzzzzzzzzzk............',
    '............kzzzzzzzzzk.kzzzzzzzzzk............',
    '.............kkkkkkkkk...kkkkkkkkk.............',
  ],
};

export const bone: Sprite = {
  w: 21,
  h: 12,
  rows: [
    '.kksskk.......kksskk.',
    'kssssssk.....kssssssk',
    'kssssssk.....kssssssk',
    'ksssssskkkkkkkssssssk',
    'ksssssssssssssssssssk',
    '.kkssssssssssssssskk.',
    'ksssssssssssssssssssk',
    'ksssssssssssssssssssk',
    'ksssssskkkkkkkssssssk',
    'kssssssk.....kssssssk',
    '.kksskk.......kksskk.',
    '...kk...........kk...',
  ],
};

export const bang: Sprite = {
  w: 6,
  h: 16,
  rows: [
    '..kk..',
    '.kiik.',
    'kiiiik',
    'kiiiik',
    'kiiiik',
    'kiiiik',
    'kiiiik',
    'kiiiik',
    'kiiiik',
    '.kiik.',
    '..kk..',
    '..kk..',
    '.kiik.',
    'kiiiik',
    '.kiik.',
    '..kk..',
  ],
};

export const finger: Sprite = {
  w: 9,
  h: 12,
  rows: [
    '..kkkk...',
    '.kqkwwk..',
    'kqqkwwwk.',
    'kqqkwwwwk',
    'kqkkwwwwk',
    '.kqkwwkk.',
    '..kwwwk..',
    '...kwwk..',
    '...kwwk..',
    '...kwwk..',
    '...keek..',
    '....kk...',
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
      ctx.fillRect(left + col * scale, top + row * scale, scale, scale);
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

/** Chunks of a sprite, centered, for the shatter. */
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
