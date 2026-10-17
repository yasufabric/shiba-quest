import type { EncounterId } from './config';
import { bang, blit, bone, boss, dumpling, hero, imp, type Sprite } from './sprites';

export type Pose = 'idle' | 'lunge' | 'guard';

/**
 * SNES-style battle framebuffer.
 * 192×224 is the largest field of about this height that integer-scales by 2
 * into a 390px-wide portrait. 256×224 and 240-wide only fit at 1× there.
 */
export const VIEW_W = 192;
export const VIEW_H = 224;

export interface FloatNumber {
  text: string;
  x: number;
  y: number;
  life: number;
  max: number;
  scale: number;
}

export interface Fragment {
  x: number;
  y: number;
  rot: number;
  color: string;
  size: number;
  life: number;
  max: number;
}

export interface Scene {
  width: number;
  height: number;
  time: number;
  shake: number;
  flash: number;
  encounter: EncounterId;
  enemyVisible: boolean;
  enemyX: number;
  enemyY: number;
  enemyFlash: number;
  heroX: number;
  heroY: number;
  heroScale: number;
  heroGlow: number;
  heroFlash: number;
  heroPose: Pose;
  ally: { x: number; y: number; pose: Pose } | null;
  bang: boolean;
  numbers: readonly FloatNumber[];
  fragments: readonly Fragment[];
  reward: number;
}

export interface Anchors {
  enemyX: number;
  enemyY: number;
  heroX: number;
  heroY: number;
  allyX: number;
  allyY: number;
}

/** Feet positions on the low-res field. Party stands lower right, facing the enemy. */
export function battleAnchors(encounter: EncounterId, width: number, height: number): Anchors {
  const party = {
    heroX: Math.round(width * 0.76),
    heroY: Math.round(height * 0.9),
    allyX: Math.round(width * 0.91),
    allyY: Math.round(height * 0.94),
  };
  switch (encounter) {
    case 'tutorial':
      return { ...party, enemyX: Math.round(width * 0.3), enemyY: Math.round(height * 0.78) };
    case 'minion':
      return { ...party, enemyX: Math.round(width * 0.32), enemyY: Math.round(height * 0.82) };
    case 'boss':
      return {
        ...party,
        heroX: Math.round(width * 0.8),
        enemyX: Math.round(width * 0.34),
        enemyY: Math.round(height * 0.84),
      };
    default: {
      const neverEncounter: never = encounter;
      return neverEncounter;
    }
  }
}

const ALLY_RECOLOR: Record<string, string> = {
  o: '#d8d0c2',
  d: '#b7aa9a',
  l: '#f3ecdf',
};

const GOLD = '#f0c84a';
const GOLD_EDGE = '#3a280c';

const DIGITS: Record<string, readonly string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
};

const STARS: readonly (readonly [number, number])[] = [
  [0.12, 0.08],
  [0.22, 0.18],
  [0.48, 0.1],
  [0.58, 0.22],
  [0.86, 0.16],
];

export function drawScene(ctx: CanvasRenderingContext2D, scene: Scene): void {
  const { width, height } = scene;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const mag = scene.shake;
  ctx.translate(Math.round(Math.sin(scene.time * 53) * mag), Math.round(Math.cos(scene.time * 47) * mag));
  drawBackground(ctx, width, height);
  if (scene.enemyVisible) shadow(ctx, scene.enemyX, scene.enemyY, enemyShadow(scene.encounter));
  shadow(ctx, scene.heroX, scene.heroY, 10);
  if (scene.ally) shadow(ctx, scene.ally.x, scene.ally.y, 8);

  if (scene.enemyVisible) {
    const bob = Math.sin(scene.time * 2.4) * 1;
    drawEnemy(ctx, scene, bob);
    if (scene.bang) drawBang(ctx, scene, bob);
  }

  for (const fragment of scene.fragments) {
    const alpha = Math.max(0, fragment.life / fragment.max);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(fragment.x, fragment.y);
    ctx.rotate(fragment.rot);
    ctx.fillStyle = fragment.color;
    const size = fragment.size;
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.restore();
  }

  if (scene.ally) {
    const bob = scene.ally.pose === 'idle' ? Math.sin(scene.time * 2.8 + 1) : 0;
    blit(ctx, hero, scene.ally.x, scene.ally.y + bob, 1, { recolor: ALLY_RECOLOR });
    ctx.fillStyle = '#c4473a';
    ctx.fillRect(scene.ally.x - 3, scene.ally.y - 18 + bob, 6, 2);
  }

  drawHero(ctx, scene);
  drawReward(ctx, scene);
  for (const number of scene.numbers) drawNumber(ctx, number);
  if (scene.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${scene.flash * 0.45})`;
    ctx.fillRect(-8, -8, width + 16, height + 16);
  }
  ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  for (let y = 0; y < height; y += 4) {
    const t = y / height;
    const shade = t < 0.72 ? 8 + Math.floor(t * 16) : 16;
    ctx.fillStyle = t < 0.74 ? `rgb(${shade},${shade + 2},${shade + 10})` : '#10141c';
    ctx.fillRect(0, y, width, 4);
  }
  pixelDisc(ctx, Math.round(width * 0.78), Math.round(height * 0.12), 9, '#d7deea');
  pixelDisc(ctx, Math.round(width * 0.78) + 5, Math.round(height * 0.12) - 2, 8, '#0c1018');
  ctx.fillStyle = '#e7eef8';
  for (const [x, y] of STARS) {
    ctx.fillRect(Math.round(width * x), Math.round(height * y), 1, 1);
  }
  const floor = Math.round(height * 0.78);
  ctx.fillStyle = '#10141c';
  ctx.fillRect(0, floor, width, height - floor);
  ctx.fillStyle = '#242c3a';
  ctx.fillRect(0, floor, width, 2);
  ctx.fillStyle = '#1a2030';
  for (let x = 0; x < width; x += 12) {
    ctx.fillRect(x, floor + 6, 8, 1);
  }
}

function pixelDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string): void {
  ctx.fillStyle = color;
  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      if (x * x + y * y <= radius * radius) ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  const wide = Math.max(4, Math.round(rx));
  ctx.fillRect(x - wide, y - 1, wide * 2, 2);
  ctx.fillRect(x - Math.round(wide * 0.65), y - 3, Math.round(wide * 1.3), 2);
}

function drawEnemy(ctx: CanvasRenderingContext2D, scene: Scene, bob: number): void {
  const sprite = enemySprite(scene.encounter);
  blit(ctx, sprite, scene.enemyX, scene.enemyY + bob, 1);
  if (scene.enemyFlash > 0) {
    blit(ctx, sprite, scene.enemyX, scene.enemyY + bob, 1, {
      tint: '#f4f7ff',
      alpha: scene.enemyFlash * 0.85,
    });
  }
}

function drawBang(ctx: CanvasRenderingContext2D, scene: Scene, bob: number): void {
  const sprite = enemySprite(scene.encounter);
  const hop = Math.sin(scene.time * 8) * 2;
  const top = scene.enemyY + bob - sprite.h;
  blit(ctx, bang, scene.enemyX, top + hop, 2);
}

function drawHero(ctx: CanvasRenderingContext2D, scene: Scene): void {
  const bob = scene.heroPose === 'idle' ? Math.sin(scene.time * 2.6) : 0;
  const x = scene.heroX;
  const y = scene.heroY + bob;
  if (scene.heroGlow > 0) {
    const radius = Math.round(16 * scene.heroScale);
    ctx.fillStyle = `rgba(214,232,255,${0.28 * scene.heroGlow})`;
    ctx.fillRect(x - radius, y - radius - 8, radius * 2, radius * 2);
    ctx.fillStyle = `rgba(244,250,255,${0.45 * scene.heroGlow})`;
    const inner = Math.round(radius * 0.45);
    ctx.fillRect(x - inner, y - inner - 12, inner * 2, inner * 2);
  }
  blit(ctx, hero, x, y, scene.heroScale);
  if (scene.heroFlash > 0) {
    blit(ctx, hero, x, y, scene.heroScale, { tint: '#f4f7ff', alpha: scene.heroFlash * 0.8 });
  }
  if (scene.heroPose === 'guard') {
    const sx = x - 16;
    const sy = y - 26;
    ctx.fillStyle = '#101820';
    ctx.fillRect(sx - 1, sy - 1, 12, 16);
    ctx.fillStyle = '#8eacd0';
    ctx.fillRect(sx, sy, 10, 14);
    ctx.fillStyle = '#e7eef8';
    ctx.fillRect(sx + 2, sy + 3, 3, 5);
  }
}

function drawReward(ctx: CanvasRenderingContext2D, scene: Scene): void {
  if (scene.reward <= 0) return;
  const t = scene.reward;
  const x = scene.width * (0.4 + (0.84 - 0.4) * t);
  const y = scene.height * (0.5 + (0.08 - 0.5) * t) - Math.sin(t * Math.PI) * 12;
  blit(ctx, bone, x, y, 2);
}

function drawNumber(ctx: CanvasRenderingContext2D, number: FloatNumber): void {
  const age = 1 - number.life / number.max;
  const pop = age < 0.18 ? 1 + (1 - age / 0.18) * 0.35 : 1;
  const fade = number.life < 0.25 ? number.life / 0.25 : 1;
  const scale = number.scale * pop;
  const width = number.text.length * 6 * scale - scale;
  const height = 7 * scale;
  const cursor = number.x - width / 2;
  const top = number.y - height;
  ctx.save();
  ctx.globalAlpha = Math.max(0, fade);
  ctx.imageSmoothingEnabled = false;
  const outline = Math.max(1, Math.round(scale * 0.22));
  for (const [ox, oy] of outlineOffsets(outline)) {
    stamp(ctx, number.text, cursor + ox, top + oy, scale, GOLD_EDGE);
  }
  stamp(ctx, number.text, cursor, top, scale, GOLD);
  ctx.restore();
}

function stamp(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, scale: number, color: string): void {
  ctx.fillStyle = color;
  let cursor = x;
  for (const char of text) {
    const glyph = DIGITS[char];
    if (!glyph) {
      cursor += 6 * scale;
      continue;
    }
    for (let row = 0; row < glyph.length; row += 1) {
      const line = glyph[row] ?? '';
      for (let col = 0; col < line.length; col += 1) {
        if (line[col] !== '1') continue;
        ctx.fillRect(cursor + col * scale, y + row * scale, Math.ceil(scale), Math.ceil(scale));
      }
    }
    cursor += 6 * scale;
  }
}

function outlineOffsets(amount: number): readonly (readonly [number, number])[] {
  return [
    [-amount, 0],
    [amount, 0],
    [0, -amount],
    [0, amount],
    [-amount, -amount],
    [amount, -amount],
    [-amount, amount],
    [amount, amount],
  ];
}

function enemySprite(encounter: EncounterId): Sprite {
  switch (encounter) {
    case 'tutorial':
      return dumpling;
    case 'minion':
      return imp;
    case 'boss':
      return boss;
    default: {
      const neverEncounter: never = encounter;
      return neverEncounter;
    }
  }
}

function enemyShadow(encounter: EncounterId): number {
  switch (encounter) {
    case 'tutorial':
      return 14;
    case 'minion':
      return 20;
    case 'boss':
      return 36;
    default: {
      const neverEncounter: never = encounter;
      return neverEncounter;
    }
  }
}
