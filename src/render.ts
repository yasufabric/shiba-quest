import type { EncounterId } from './config';
import { allyFrames, enemyFrames, type DogFrames } from './dogs';
import {
  allySprites,
  bang,
  blit,
  bone,
  hero,
  heroAttack,
  heroCharge,
  heroDown,
  heroGuard,
  heroHurt,
  heroIdle,
  heroWin,
  type Sprite,
} from './sprites';

export type Pose = 'idle' | 'lunge' | 'guard' | 'down';

/**
 * Source pixels per phone pixel. 2× keeps the picture crisp and large.
 * The framebuffer grows to cover the stage; a spare row is cropped, not left as sky.
 */
export const PIXEL_SCALE = 2;
export const VIEW_W = 195;
export const VIEW_H = 240;

export function fieldCover(
  cssWidth: number,
  cssHeight: number,
): { scale: number; width: number; height: number; cssWidth: number; cssHeight: number } {
  const scale = PIXEL_SCALE;
  const width = Math.max(1, Math.ceil(Math.max(1, cssWidth) / scale));
  const height = Math.max(1, Math.ceil(Math.max(1, cssHeight) / scale));
  return { scale, width, height, cssWidth: width * scale, cssHeight: height * scale };
}

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
  enemyPose: Pose;
  heroX: number;
  heroY: number;
  heroScale: number;
  heroGlow: number;
  heroFlash: number;
  heroPose: Pose;
  allies: readonly { x: number; y: number; pose: Pose; index: number }[];
  /** 0–1 while the four-ally limit plays. Allies rush the enemy. */
  summon: number;
  curtain: 'title' | 'ending' | null;
  /** Index of the ally being offered. Null outside recruit. */
  recruitAlly: number | null;
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
  allies: readonly { x: number; y: number }[];
}

const ENEMY_ANCHOR: Record<EncounterId, { x: number; y: number }> = {
  tutorial: { x: 0.34, y: 0.86 },
  minion: { x: 0.3, y: 0.84 },
  minion2: { x: 0.38, y: 0.88 },
  minion3: { x: 0.32, y: 0.86 },
  boss: { x: 0.34, y: 0.9 },
};

/** Feet on the painted field. Enemies stand left, the party clusters on the right. */
export function battleAnchors(encounter: EncounterId, width: number, height: number): Anchors {
  const enemy = ENEMY_ANCHOR[encounter];
  return {
    enemyX: Math.round(width * enemy.x),
    enemyY: Math.round(height * enemy.y),
    heroX: Math.round(width * 0.74),
    heroY: Math.round(height * 0.92),
    allies: [
      { x: Math.round(width * 0.9), y: Math.round(height * 0.96) },
      { x: Math.round(width * 0.82), y: Math.round(height * 0.8) },
      { x: Math.round(width * 0.94), y: Math.round(height * 0.78) },
      { x: Math.round(width * 0.66), y: Math.round(height * 0.72) },
    ],
  };
}

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
  if (scene.curtain) {
    drawCurtain(ctx, scene);
    ctx.restore();
    return;
  }
  if (scene.recruitAlly !== null) {
    drawRecruit(ctx, scene);
    ctx.restore();
    return;
  }
  if (scene.enemyVisible) shadow(ctx, scene.enemyX, scene.enemyY, ENEMY_SHADOW[scene.encounter]);
  shadow(ctx, scene.heroX, scene.heroY, 8);
  for (const ally of scene.allies) shadow(ctx, ally.x, ally.y, 6);

  if (scene.enemyVisible) {
    const bob = scene.enemyPose === 'down' ? 0 : Math.sin(scene.time * 2.2) * 1;
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

  drawSummon(ctx, scene);
  drawAllies(ctx, scene);
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

/** Where the shrine road meets the sky. The gate sits on this line. */
export const FIELD_HORIZON = 0.46;
/** The road aims at the gate, left of center, where the foe stands. */
export const ROAD_CENTER = 0.36;

/**
 * Half-width of the stone road. Null above the horizon.
 * The road is one band that widens toward the party, not striped rows.
 */
export function roadHalf(y: number, height: number): number | null {
  const horizon = Math.round(height * FIELD_HORIZON);
  if (y < horizon || height <= horizon) return null;
  const depth = (y - horizon) / (height - horizon);
  return 7 + depth * 52;
}

function paintBackdrop(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const horizon = Math.round(height * FIELD_HORIZON);
  const gate = Math.round(width * ROAD_CENTER);
  paintSky(ctx, width, horizon);
  paintMoon(ctx, Math.round(width * 0.78), Math.round(height * 0.12));
  paintCloud(ctx, 24, 16, 26, 8);
  paintCloud(ctx, 58, 30, 16, 5);
  paintRange(ctx, width, horizon, 52, 0.3, '#b7c8d4', '#8ea6ba');
  paintRange(ctx, width, horizon, 30, 1.6, '#5c7490', '#3c5874');
  paintTorii(ctx, gate, horizon);
  paintPine(ctx, 16, horizon - 2, 20);
  paintPine(ctx, 40, horizon + 6, 30);
  paintPine(ctx, width - 18, horizon, 24);
  paintPine(ctx, width - 44, horizon + 12, 38);
  paintGround(ctx, width, height, horizon, gate);
}

function paintSky(ctx: CanvasRenderingContext2D, width: number, horizon: number): void {
  const sky = ['#121e40', '#1c3068', '#3a5898', '#7a9cc4', '#d4e4ee'];
  for (let y = 0; y < horizon; y += 1) {
    const scaled = (y / horizon) * (sky.length - 1);
    const index = Math.min(sky.length - 2, Math.floor(scaled));
    const local = scaled - index;
    const edge = local > 0.4 && local < 0.7;
    for (let x = 0; x < width; x += 1) {
      const pick = edge && local > dither(x, y) ? index + 1 : index;
      ctx.fillStyle = sky[pick] ?? sky[0];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function paintMoon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  for (let y = -14; y <= 14; y += 1) {
    for (let x = -14; x <= 14; x += 1) {
      const d = x * x + y * y;
      if (d > 196) continue;
      const halo = d > 100 && dither(cx + x, cy + y) > 0.45;
      ctx.fillStyle = halo ? '#f4e6b0' : '#fff8dc';
      ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
}

function paintCloud(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  for (let dy = -ry; dy <= ry; dy += 1) {
    for (let dx = -rx; dx <= rx; dx += 1) {
      const nx = dx / rx;
      const ny = dy / ry;
      if (nx * nx + ny * ny > 1) continue;
      if (dither(x + dx, y + dy) > 0.55) continue;
      ctx.fillStyle = '#e4eef6';
      ctx.fillRect(x + dx, y + dy, 1, 1);
    }
  }
}

function paintRange(
  ctx: CanvasRenderingContext2D,
  width: number,
  horizon: number,
  lift: number,
  phase: number,
  light: string,
  dark: string,
): void {
  for (let x = 0; x < width; x += 1) {
    const n = x / width;
    const crest =
      horizon -
      lift -
      Math.round(Math.sin(n * Math.PI * 3 + phase) * 10 + Math.sin(n * Math.PI * 7 + phase * 2) * 6);
    for (let y = crest; y < horizon; y += 1) {
      ctx.fillStyle = dither(x, y) > 0.7 ? light : dark;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

/** A gate at the end of the road, so the field is a shrine approach. */
function paintTorii(ctx: CanvasRenderingContext2D, x: number, ground: number): void {
  const top = ground - 26;
  ctx.fillStyle = '#6e2828';
  ctx.fillRect(x - 11, top + 6, 3, ground - top - 4);
  ctx.fillRect(x + 8, top + 6, 3, ground - top - 4);
  ctx.fillStyle = '#8a3434';
  ctx.fillRect(x - 14, top, 28, 3);
  ctx.fillStyle = '#a84848';
  ctx.fillRect(x - 12, top + 5, 24, 2);
}

function paintPine(ctx: CanvasRenderingContext2D, x: number, ground: number, height: number): void {
  ctx.fillStyle = '#3a2814';
  ctx.fillRect(x, ground - 5, 2, 5);
  for (let tier = 0; tier < 3; tier += 1) {
    const crown = ground - height + tier * Math.round(height / 3.2);
    const span = 3 + (2 - tier);
    for (let y = crown; y < crown + Math.round(height / 2.2); y += 1) {
      const half = Math.max(1, span - Math.floor((y - crown) / 3));
      for (let dx = -half; dx <= half; dx += 1) {
        ctx.fillStyle = dither(x + dx, y) > 0.45 ? '#1e4a30' : '#143824';
        ctx.fillRect(x + dx, y, 1, 1);
      }
    }
  }
}

function paintGround(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  horizon: number,
  center: number,
): void {
  for (let y = horizon; y < height; y += 1) {
    const half = roadHalf(y, height) ?? 0;
    const depth = (y - horizon) / Math.max(1, height - horizon);
    const stride = 6;
    for (let x = 0; x < width; x += 1) {
      const along = Math.abs(x - center);
      if (along < half) {
        const edge = half - along < 1.2;
        const course = Math.floor((y - horizon) / (4 + Math.floor(depth * 3)));
        const joint = (x + course * 4) % stride === 0;
        const lit = dither(x, y) < 0.35 + depth * 0.4;
        ctx.fillStyle = edge ? '#5c4828' : joint ? '#7a5c30' : lit ? '#d2b070' : '#a08048';
      } else {
        const tuft = ((x * 5 + y * 3) & 7) === 0;
        const near = depth > 0.7;
        ctx.fillStyle = tuft ? (near ? '#3d6e3a' : '#2c5434') : near ? '#243820' : '#3a4e30';
      }
      ctx.fillRect(x, y, 1, 1);
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

function enemyFrame(frames: DogFrames, scene: Scene): Sprite {
  if (scene.enemyFlash > 0.35 && scene.enemyPose !== 'down') return frames.hit;
  switch (scene.enemyPose) {
    case 'down':
      return frames.down;
    case 'lunge':
      return frames.attack;
    case 'guard':
      return frames.guard;
    case 'idle':
      if (scene.bang) return frames.guard;
      return Math.floor(scene.time * 1.5) % 2 === 1 ? frames.idle2 : frames.idle;
    default: {
      const neverPose: never = scene.enemyPose;
      throw new Error(`unknown enemy pose ${String(neverPose)}`);
    }
  }
}

function drawEnemy(ctx: CanvasRenderingContext2D, scene: Scene, bob: number): void {
  const sprite = enemyFrame(enemyFrames[scene.encounter], scene);
  blit(ctx, sprite, scene.enemyX, scene.enemyY + bob, 1);
  if (scene.enemyFlash > 0) {
    blit(ctx, sprite, scene.enemyX, scene.enemyY + bob, 1, {
      tint: '#ffffff',
      alpha: scene.enemyFlash,
    });
    drawSpark(ctx, scene.enemyX, scene.enemyY + bob - sprite.h * 0.55, scene.enemyFlash);
  }
}

function drawSpark(ctx: CanvasRenderingContext2D, x: number, y: number, flash: number): void {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, flash));
  ctx.fillStyle = '#fffaf4';
  const x0 = Math.round(x - 10);
  const y0 = Math.round(y - 8);
  for (let i = 0; i < 16; i += 1) {
    ctx.fillRect(x0 + i, y0 + Math.round(i * 0.7), 2, 2);
  }
  ctx.fillStyle = '#f0c84a';
  for (const [dx, dy] of [
    [-9, -6],
    [8, -4],
    [6, 6],
    [-7, 5],
    [0, -9],
  ] as const) {
    ctx.fillRect(Math.round(x + dx), Math.round(y + dy), 3, 3);
  }
  ctx.restore();
}

function drawRecruit(ctx: CanvasRenderingContext2D, scene: Scene): void {
  const index = scene.recruitAlly ?? 0;
  const ally = allySprites[Math.min(allySprites.length - 1, Math.max(0, index))];
  const ground = Math.round(scene.height * 0.74);
  const x = Math.round(scene.width * 0.56);
  blit(ctx, bone, x - 34, ground - 6, 3);
  if (!ally) return;
  shadow(ctx, x + 18, ground, 14);
  blit(ctx, ally, x + 18, ground, 2);
}

function drawCurtain(ctx: CanvasRenderingContext2D, scene: Scene): void {
  const title = scene.curtain === 'title';
  const x = Math.round(scene.width * 0.5);
  const y = Math.round(scene.height * (title ? 0.62 : 0.7));
  const bob = Math.sin(scene.time * 2) * (title ? 1 : 0);
  if (!title) {
    for (const ally of scene.allies) {
      const sprite = allySprites[ally.index] ?? allySprites[0];
      if (!sprite) continue;
      blit(ctx, sprite, x - 28 + ally.index * 18, y + 8, 1);
    }
  }
  blit(ctx, title ? hero : heroWin, x, y + bob, 2);
  ctx.font = '24px PixelMplus12, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#1a2438';
  ctx.fillText('しばクエスト', x + 1, 29);
  ctx.fillStyle = '#f7f4ee';
  ctx.fillText('しばクエスト', x, 28);
}

function drawBang(ctx: CanvasRenderingContext2D, scene: Scene, bob: number): void {
  const sprite = enemyFrames[scene.encounter].idle;
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
  const drawn = scene.heroScale;
  const hop = scene.celebrating ? Math.round(Math.abs(Math.sin(scene.time * 6)) * 6) : 0;
  blit(ctx, sprite, x, y - hop, drawn);
  if (scene.heroFlash > 0) {
    blit(ctx, sprite, x, y - hop, drawn, { tint: '#ffffff', alpha: scene.heroFlash });
  }
}

function partySprite(pose: Pose, glow: number, flash: number, celebrating: boolean, time: number, offset: number): Sprite {
  if (pose === 'down') return heroDown;
  if (celebrating) return heroWin;
  if (flash > 0.35) return heroHurt;
  if (pose === 'lunge') return heroAttack;
  if (pose === 'guard') return heroGuard;
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

const ENEMY_SHADOW: Record<EncounterId, number> = {
  tutorial: 16,
  minion: 12,
  minion2: 18,
  minion3: 14,
  boss: 32,
};

function allyPoseSprite(frames: DogFrames, pose: Pose, time: number, index: number): Sprite {
  switch (pose) {
    case 'down':
      return frames.down;
    case 'lunge':
      return frames.attack;
    case 'guard':
      return frames.guard;
    case 'idle':
      return Math.floor(time * 1.5 + index) % 2 === 1 ? frames.idle2 : frames.idle;
    default: {
      const neverPose: never = pose;
      throw new Error(`unknown ally pose ${String(neverPose)}`);
    }
  }
}

function drawAllies(ctx: CanvasRenderingContext2D, scene: Scene): void {
  const ordered = [...scene.allies].sort((a, b) => a.y - b.y);
  for (const ally of ordered) {
    const frames = allyFrames[ally.index] ?? allyFrames[0];
    const sprite = frames ? allyPoseSprite(frames, ally.pose, scene.time, ally.index) : allySprites[0];
    if (!sprite) continue;
    const lane = ally.index - (scene.allies.length - 1) / 2;
    const goalX = scene.enemyX + 22 + lane * 16;
    const goalY = scene.enemyY - 6 + (ally.index % 2) * 14;
    const rush = scene.summon * 0.7;
    const x = ally.x + (goalX - ally.x) * rush;
    const y =
      ally.y + (goalY - ally.y) * rush - (scene.celebrating ? Math.sin(scene.time * 8 + ally.index) * 2 : 0);
    const scale = 1 + scene.summon * 0.12;
    blit(ctx, sprite, x, y, scale);
  }
}

function drawSummon(ctx: CanvasRenderingContext2D, scene: Scene): void {
  if (scene.summon <= 0.02) return;
  const cx = Math.round(scene.enemyX + 10);
  const cy = Math.round(scene.enemyY - 30);
  const grow = scene.summon;
  ctx.save();
  ctx.globalAlpha = 0.5 + grow * 0.45;
  for (const base of [16, 30, 46, 62]) {
    const radius = base * grow;
    for (let i = 0; i < 22; i += 1) {
      const angle = (i / 22) * Math.PI * 2 + scene.time * 2.4 + base;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius * 0.4;
      ctx.fillStyle = i % 3 === 0 ? '#fff6d0' : '#f0c84a';
      ctx.fillRect(Math.round(x), Math.round(y), i % 3 === 0 ? 3 : 2, i % 3 === 0 ? 3 : 2);
    }
  }
  const column = Math.round(84 * grow);
  ctx.fillStyle = `rgba(255, 230, 160, ${0.3 * grow})`;
  ctx.fillRect(cx - 7, cy - column, 14, column);
  ctx.fillStyle = '#fff8e0';
  ctx.fillRect(cx - 2, cy - column, 4, column);
  ctx.restore();
}
