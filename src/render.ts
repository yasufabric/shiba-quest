import type { EncounterId } from './config';
import {
  bang,
  blit,
  bone,
  boss,
  dumpling,
  hero,
  heroAttack,
  heroCharge,
  heroHurt,
  heroIdle,
  heroWin,
  imp,
  type Sprite,
} from './sprites';

export type Pose = 'idle' | 'lunge' | 'guard';

/**
 * Battle framebuffer. 192×240 integer-scales by 2 above the windows on a
 * 390×844 phone, so enemies stay large and pixels stay chunky.
 */
export const VIEW_W = 192;
export const VIEW_H = 240;

export interface FloatNumber {
  text: string;
  x: number;
  y: number;
  life: number;
  max: number;
  scale: number;
  gold: boolean;
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
  intro: number;
  celebrating: boolean;
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

/** Feet on the painted field. Enemies stand left, party in the foreground right. */
export function battleAnchors(encounter: EncounterId, width: number, height: number): Anchors {
  const party = {
    heroX: Math.round(width * 0.78),
    heroY: Math.round(height * 0.9),
    allyX: Math.round(width * 0.91),
    allyY: Math.round(height * 0.94),
  };
  switch (encounter) {
    case 'tutorial':
      return { ...party, enemyX: Math.round(width * 0.28), enemyY: Math.round(height * 0.7) };
    case 'minion':
      return { ...party, enemyX: Math.round(width * 0.3), enemyY: Math.round(height * 0.72) };
    case 'boss':
      return {
        ...party,
        heroX: Math.round(width * 0.82),
        enemyX: Math.round(width * 0.34),
        enemyY: Math.round(height * 0.74),
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
const PAPER = '#f4f7ff';
const PAPER_EDGE = '#1a2438';

const BAYER: readonly (readonly number[])[] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

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

let backdrop: HTMLCanvasElement | null = null;

export function drawScene(ctx: CanvasRenderingContext2D, scene: Scene): void {
  const { width, height } = scene;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const mag = scene.shake;
  ctx.translate(Math.round(Math.sin(scene.time * 53) * mag), Math.round(Math.cos(scene.time * 47) * mag));
  ctx.drawImage(ensureBackdrop(width, height), 0, 0);
  if (scene.enemyVisible) shadow(ctx, scene.enemyX, scene.enemyY, enemyShadow(scene.encounter));
  shadow(ctx, scene.heroX, scene.heroY, 11);
  if (scene.ally) shadow(ctx, scene.ally.x, scene.ally.y, 8);

  if (scene.enemyVisible) {
    const bob = Math.sin(scene.time * 2.2) * 1;
    drawEnemy(ctx, scene, bob);
    if (scene.bang) drawBang(ctx, scene, bob);
  }

  for (const fragment of scene.fragments) {
    const alpha = Math.max(0, fragment.life / fragment.max);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(fragment.x, fragment.y);
    ctx.fillStyle = fragment.color;
    const size = fragment.size;
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.restore();
  }

  if (scene.ally) {
    const sprite = partySprite(scene.ally.pose, 0, 0, false, scene.time, 1);
    blit(ctx, sprite, scene.ally.x, scene.ally.y, 1, { recolor: ALLY_RECOLOR });
    ctx.fillStyle = '#c4473a';
    ctx.fillRect(scene.ally.x - 2, scene.ally.y - 16, 5, 2);
  }

  drawHero(ctx, scene);
  drawReward(ctx, scene);
  for (const number of scene.numbers) drawNumber(ctx, number);
  if (scene.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${scene.flash * 0.72})`;
    ctx.fillRect(-8, -8, width + 16, height + 16);
  }
  ctx.restore();
  if (scene.intro > 0.02) paintMosaic(ctx, width, height, scene.intro);
}

function ensureBackdrop(width: number, height: number): HTMLCanvasElement {
  if (backdrop && backdrop.width === width && backdrop.height === height) return backdrop;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;
  paintBackdrop(ctx, width, height);
  backdrop = canvas;
  return canvas;
}

function paintBackdrop(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const horizon = Math.round(height * 0.5);
  const sky = ['#182868', '#2a4494', '#4a6cb4', '#8aafd0', '#d4e6f0'];
  for (let y = 0; y < horizon; y += 1) {
    const scaled = (y / horizon) * (sky.length - 1);
    const index = Math.min(sky.length - 2, Math.floor(scaled));
    const local = scaled - index;
    const edge = local > 0.35 && local < 0.65;
    for (let x = 0; x < width; x += 1) {
      const pick = edge && local > dither(x, y) ? index + 1 : index;
      ctx.fillStyle = sky[pick] ?? sky[0];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  const sunX = Math.round(width * 0.78);
  const sunY = Math.round(height * 0.14);
  for (let y = -10; y <= 10; y += 1) {
    for (let x = -10; x <= 10; x += 1) {
      if (x * x + y * y > 100) continue;
      ctx.fillStyle = '#fff6d4';
      ctx.fillRect(sunX + x, sunY + y, 1, 1);
    }
  }
  fillRidge(ctx, width, horizon, 34, 0.2, '#6e8eae', '#4a6884');
  fillRidge(ctx, width, horizon, 14, 1.4, '#355068', '#243848');
  for (let x = 6; x < width; x += 14) {
    tree(ctx, x, horizon + 2, horizon - 16 - (x % 5));
  }
  let y = horizon;
  let stripe = 2;
  let band = 0;
  while (y < height) {
    const depth = (y - horizon) / Math.max(1, height - horizon);
    stripe = 2 + Math.floor(depth * 7);
    const far = band % 2 === 0;
    for (let row = y; row < Math.min(height, y + stripe); row += 1) {
      const rowDepth = (row - horizon) / Math.max(1, height - horizon);
      for (let x = 0; x < width; x += 1) {
        const path = Math.abs(x - width * 0.38) < 10 + rowDepth * 36;
        ctx.fillStyle = path ? (far ? '#d4b56a' : '#b48c44') : far ? '#6e5a38' : '#3e3224';
        ctx.fillRect(x, row, 1, 1);
      }
    }
    y += stripe;
    band += 1;
  }
}

function fillRidge(
  ctx: CanvasRenderingContext2D,
  width: number,
  horizon: number,
  lift: number,
  phase: number,
  light: string,
  dark: string,
): void {
  for (let x = 0; x < width; x += 1) {
    const ridge =
      horizon -
      lift -
      Math.round(Math.sin(x * 0.07 + phase) * 12 + Math.sin(x * 0.16 + phase * 2) * 6);
    for (let y = ridge; y < horizon; y += 1) {
      ctx.fillStyle = dither(x, y) > 0.62 ? light : dark;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function tree(ctx: CanvasRenderingContext2D, x: number, ground: number, top: number): void {
  for (let y = top; y < ground; y += 1) {
    const half = Math.max(1, Math.round(((y - top) / Math.max(1, ground - top)) * 5));
    for (let dx = -half; dx <= half; dx += 1) {
      ctx.fillStyle = dither(x + dx, y) > 0.5 ? '#2a5434' : '#1a3824';
      ctx.fillRect(x + dx, y, 1, 1);
    }
  }
}

function dither(x: number, y: number): number {
  const row = BAYER[y & 3] ?? BAYER[0];
  const value = row[x & 3] ?? 0;
  return (value + 0.5) / 16;
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number): void {
  ctx.fillStyle = 'rgba(20,16,12,0.4)';
  const wide = Math.max(4, Math.round(rx));
  ctx.fillRect(x - wide, y - 1, wide * 2, 2);
  ctx.fillRect(x - Math.round(wide * 0.6), y - 3, Math.round(wide * 1.2), 2);
}

function drawEnemy(ctx: CanvasRenderingContext2D, scene: Scene, bob: number): void {
  const sprite = enemySprite(scene.encounter);
  blit(ctx, sprite, scene.enemyX, scene.enemyY + bob, 1);
  if (scene.enemyFlash > 0) {
    blit(ctx, sprite, scene.enemyX, scene.enemyY + bob, 1, {
      tint: '#ffffff',
      alpha: scene.enemyFlash,
    });
  }
}

function drawBang(ctx: CanvasRenderingContext2D, scene: Scene, bob: number): void {
  const sprite = enemySprite(scene.encounter);
  const hop = Math.sin(scene.time * 8) * 2;
  blit(ctx, bang, scene.enemyX, scene.enemyY + bob - sprite.h + hop, 2);
}

function drawHero(ctx: CanvasRenderingContext2D, scene: Scene): void {
  const sprite = partySprite(scene.heroPose, scene.heroGlow, scene.heroFlash, scene.celebrating, scene.time, 0);
  const x = scene.heroX;
  const y = scene.heroY;
  if (scene.heroGlow > 0) {
    const radius = Math.round(14 * scene.heroScale);
    ctx.fillStyle = `rgba(226,236,255,${0.22 * scene.heroGlow})`;
    ctx.fillRect(x - radius, y - radius - 10, radius * 2, radius * 2);
  }
  blit(ctx, sprite, x, y, scene.heroScale);
  if (scene.heroFlash > 0) {
    blit(ctx, sprite, x, y, scene.heroScale, { tint: '#ffffff', alpha: scene.heroFlash });
  }
  if (scene.heroPose === 'guard') {
    const sx = x - 16;
    const sy = y - 24;
    ctx.fillStyle = '#1a2838';
    ctx.fillRect(sx - 1, sy - 1, 12, 16);
    ctx.fillStyle = '#8eacd0';
    ctx.fillRect(sx, sy, 10, 14);
    ctx.fillStyle = '#f4f7ff';
    ctx.fillRect(sx + 2, sy + 3, 3, 5);
  }
}

function partySprite(pose: Pose, glow: number, flash: number, celebrating: boolean, time: number, offset: number): Sprite {
  if (celebrating) return heroWin;
  if (flash > 0.35) return heroHurt;
  if (pose === 'lunge') return heroAttack;
  if (pose === 'guard') return hero;
  if (glow > 0.2) return heroCharge;
  const breath = Math.floor(time * 1.5 + offset) % 2 === 1;
  return breath ? heroIdle : hero;
}

function drawReward(ctx: CanvasRenderingContext2D, scene: Scene): void {
  if (scene.reward <= 0) return;
  const t = scene.reward;
  const x = scene.width * (0.36 + (0.78 - 0.36) * t);
  const y = scene.height * (0.46 + (0.06 - 0.46) * t) - Math.sin(t * Math.PI) * 14;
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
  const fill = number.gold ? GOLD : PAPER;
  const edge = number.gold ? GOLD_EDGE : PAPER_EDGE;
  ctx.save();
  ctx.globalAlpha = Math.max(0, fade);
  ctx.imageSmoothingEnabled = false;
  const outline = Math.max(1, Math.round(scale * 0.22));
  for (const [ox, oy] of outlineOffsets(outline)) {
    stamp(ctx, number.text, cursor + ox, top + oy, scale, edge);
  }
  stamp(ctx, number.text, cursor, top, scale, fill);
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

function paintMosaic(ctx: CanvasRenderingContext2D, width: number, height: number, intro: number): void {
  const cell = Math.max(2, Math.round(intro * 12));
  const image = ctx.getImageData(0, 0, width, height);
  const src = image.data;
  for (let y = 0; y < height; y += cell) {
    for (let x = 0; x < width; x += cell) {
      const sx = Math.min(width - 1, x + (cell >> 1));
      const sy = Math.min(height - 1, y + (cell >> 1));
      const index = (sy * width + sx) * 4;
      ctx.fillStyle = `rgb(${src[index] ?? 0},${src[index + 1] ?? 0},${src[index + 2] ?? 0})`;
      ctx.fillRect(x, y, cell, cell);
    }
  }
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
      return 22;
    case 'boss':
      return 40;
    default: {
      const neverEncounter: never = encounter;
      return neverEncounter;
    }
  }
}
