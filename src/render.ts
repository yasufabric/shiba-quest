import type { EncounterId } from './config';
import { bang, blit, bone, boss, dumpling, hero, imp, type Sprite } from './sprites';

export type Pose = 'idle' | 'lunge' | 'guard';

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
  [0.14, 0.08],
  [0.28, 0.16],
  [0.62, 0.07],
  [0.78, 0.2],
  [0.88, 0.1],
  [0.46, 0.12],
];

export function drawScene(ctx: CanvasRenderingContext2D, scene: Scene): void {
  const { width, height } = scene;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const mag = scene.shake;
  ctx.translate(Math.sin(scene.time * 53) * mag, Math.cos(scene.time * 47) * mag);
  drawBackground(ctx, width, height);
  shadow(ctx, scene.enemyX, scene.enemyY, 54);
  shadow(ctx, scene.heroX, scene.heroY, 46);
  if (scene.ally) shadow(ctx, scene.ally.x, scene.ally.y, 34);

  if (scene.enemyVisible) {
    const bob = Math.sin(scene.time * 2.4) * 1.5;
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
    const bob = scene.ally.pose === 'idle' ? Math.sin(scene.time * 2.8 + 1) * 1.5 : 0;
    blit(ctx, hero, scene.ally.x, scene.ally.y + bob, 3, { recolor: ALLY_RECOLOR });
    ctx.fillStyle = '#c4473a';
    ctx.fillRect(scene.ally.x - 16, scene.ally.y - 78 + bob, 32, 6);
  }

  drawHero(ctx, scene);
  drawReward(ctx, scene);
  for (const number of scene.numbers) drawNumber(ctx, number);
  if (scene.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${scene.flash * 0.4})`;
    ctx.fillRect(-20, -20, width + 40, height + 40);
  }
  ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#070910');
  sky.addColorStop(0.55, '#10141e');
  sky.addColorStop(1, '#16130f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#1b2433';
  ctx.beginPath();
  ctx.arc(width * 0.78, height * 0.14, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#10141e';
  ctx.beginPath();
  ctx.arc(width * 0.78 + 12, height * 0.13, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d7deea';
  for (const [x, y] of STARS) {
    ctx.fillRect(Math.round(width * x), Math.round(height * y), 2, 2);
  }

  const floor = height * 0.74;
  ctx.fillStyle = '#12151c';
  ctx.fillRect(0, floor, width, height - floor);
  ctx.fillStyle = '#1b202a';
  for (let x = 0; x < width; x += 18) {
    ctx.fillRect(x, floor, 16, 2);
  }

  const vignette = ctx.createRadialGradient(width * 0.5, height * 0.42, height * 0.15, width * 0.5, height * 0.48, height * 0.72);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemy(ctx: CanvasRenderingContext2D, scene: Scene, bob: number): void {
  const sprite = enemySprite(scene.encounter);
  const scale = enemyScale(scene.encounter);
  blit(ctx, sprite, scene.enemyX, scene.enemyY + bob, scale);
  if (scene.enemyFlash > 0) {
    blit(ctx, sprite, scene.enemyX, scene.enemyY + bob, scale, {
      tint: '#f4f7ff',
      alpha: scene.enemyFlash * 0.85,
    });
  }
}

function drawBang(ctx: CanvasRenderingContext2D, scene: Scene, bob: number): void {
  const sprite = enemySprite(scene.encounter);
  const scale = enemyScale(scene.encounter);
  const hop = Math.sin(scene.time * 8) * 4;
  const top = scene.enemyY + bob - sprite.h * scale;
  blit(ctx, bang, scene.enemyX, top + hop, 3);
}

function drawHero(ctx: CanvasRenderingContext2D, scene: Scene): void {
  const bob = scene.heroPose === 'idle' ? Math.sin(scene.time * 2.6) * 1.5 : 0;
  const x = scene.heroX;
  const y = scene.heroY + bob;
  if (scene.heroGlow > 0) {
    const radius = 70 * scene.heroScale;
    const glow = ctx.createRadialGradient(x, y - 70, radius * 0.15, x, y - 60, radius);
    glow.addColorStop(0, `rgba(214,232,255,${0.55 * scene.heroGlow})`);
    glow.addColorStop(1, 'rgba(214,232,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y - 64, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  blit(ctx, hero, x, y, scene.heroScale * 4);
  if (scene.heroFlash > 0) {
    blit(ctx, hero, x, y, scene.heroScale * 4, { tint: '#f4f7ff', alpha: scene.heroFlash * 0.8 });
  }
  if (scene.heroPose === 'guard') {
    const sx = x - 58;
    const sy = y - 108;
    ctx.fillStyle = '#152033';
    ctx.fillRect(sx - 3, sy - 3, 30, 40);
    ctx.fillStyle = '#8eacd0';
    ctx.fillRect(sx, sy, 24, 34);
    ctx.fillStyle = '#e7eef8';
    ctx.fillRect(sx + 5, sy + 6, 6, 12);
  }
}

function drawReward(ctx: CanvasRenderingContext2D, scene: Scene): void {
  if (scene.reward <= 0) return;
  const t = scene.reward;
  const x = scene.width * (0.46 + (0.82 - 0.46) * t);
  const y = scene.height * (0.46 + (0.02 - 0.46) * t) - Math.sin(t * Math.PI) * 48;
  blit(ctx, bone, x, y, 4);
}

function drawNumber(ctx: CanvasRenderingContext2D, number: FloatNumber): void {
  const age = 1 - number.life / number.max;
  const pop = age < 0.18 ? 1 + (1 - age / 0.18) * 0.35 : 1;
  const fade = number.life < 0.25 ? number.life / 0.25 : 1;
  const scale = number.scale * pop;
  const width = number.text.length * 6 * scale - scale;
  const height = 7 * scale;
  let cursor = number.x - width / 2;
  const top = number.y - height;
  ctx.save();
  ctx.globalAlpha = Math.max(0, fade);
  ctx.imageSmoothingEnabled = false;
  const outline = Math.max(1, Math.round(scale * 0.28));
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
        ctx.fillRect(cursor + col * scale, y + row * scale, scale, scale);
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

function enemyScale(encounter: EncounterId): number {
  switch (encounter) {
    case 'tutorial':
      return 4;
    case 'minion':
      return 4;
    case 'boss':
      return 4;
    default: {
      const neverEncounter: never = encounter;
      return neverEncounter;
    }
  }
}
