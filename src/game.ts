import { config, type CampaignId, type Command, type EncounterId } from './config';
import { grantBone, nextEncounter, noteDamage, recruitAlly, type SaveData } from './campaign';
import { intentAt, step, type Battle } from './combat';
import { makeBattle } from './setup';
import { loadSave, writeSave } from './save';
import { playAttack, playCharge, playGuard, playHit, playShatter, playVictory, unlockAudio } from './audio';
import { battleAnchors, drawScene, VIEW_H, VIEW_W, type FloatNumber, type Fragment, type Pose, type Scene } from './render';
import { blit, bone as boneSprite, boss, dumpling, finger, hero, imp, shatterBlocks, type Sprite } from './sprites';

const rules = { chargeCap: config.charge.cap };

const ALLY_RECOLOR: Record<string, string> = {
  o: '#d8d0c2',
  d: '#b7aa9a',
  l: '#f3ecdf',
};

interface Shard extends Fragment {
  vx: number;
  vy: number;
  vr: number;
}

interface Popup extends FloatNumber {
  vy: number;
  floor: number;
}

type Phase = 'command' | 'resolving' | 'shatter' | 'reward' | 'recruit' | 'defeat';

interface State {
  save: SaveData;
  battle: Battle;
  encounter: EncounterId;
  tutorialStep: number | null;
  phase: Phase;
  generation: number;
  shownHeroHp: number;
  shownEnemyHp: number;
  scale: number;
  glow: number;
  targetScale: number;
  targetGlow: number;
  heroOx: number;
  allyOx: number;
  enemyOx: number;
  enemyOy: number;
  pose: Pose;
  allyPose: Pose;
  enemyVisible: boolean;
  enemyFlash: number;
  heroFlash: number;
  shake: number;
  flash: number;
  bang: boolean;
  numbers: Popup[];
  shards: Shard[];
  reward: number;
  allyHits: number;
  intro: number;
  width: number;
  height: number;
  time: number;
}

interface Ui {
  app: HTMLElement;
  stage: HTMLElement;
  battle: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  finger: HTMLCanvasElement;
  commands: HTMLElement;
  commandButtons: HTMLButtonElement[];
  enemyName: HTMLElement;
  hpFill: HTMLElement;
  hpText: HTMLElement;
  charge: HTMLElement;
  allyHp: HTMLElement;
  bones: HTMLElement;
  record: HTMLElement;
  modal: HTMLElement;
  retry: HTMLButtonElement;
  recruit: HTMLButtonElement;
  recruitBone: HTMLCanvasElement;
  boneIcon: HTMLCanvasElement;
}

export function startGame(): void {
  const ui = bind();
  const state = createState(loadSave());
  fit(ui, state);
  paintFinger(ui);
  paintBoneIcon(ui);
  paintRecruit(ui);
  if (!state.save.tutorialDone) begin(state, ui, 'tutorial');
  else begin(state, ui, state.save.encounter);
  if (state.save.recruitPending) openRecruit(state, ui);

  ui.commandButtons.forEach((button) => {
    button.addEventListener('click', () => {
      unlockAudio();
      const name = button.dataset.command ?? '';
      if (!isCommand(name)) return;
      onCommand(state, ui, name);
    });
  });
  ui.retry.addEventListener('click', () => {
    unlockAudio();
    state.generation += 1;
    begin(state, ui, campaignEncounter(state));
  });
  ui.recruit.addEventListener('click', () => {
    unlockAudio();
    const next = recruitAlly(state.save);
    if (!next) return;
    state.save = { ...next, recruitPending: false };
    writeSave(state.save);
    state.generation += 1;
    begin(state, ui, state.save.encounter);
  });

  const onResize = () => {
    fit(ui, state);
    if (state.tutorialStep !== null && state.phase === 'command') {
      const command = config.tutorial.steps[state.tutorialStep];
      if (command) placeFinger(ui, command);
    }
  };
  window.addEventListener('resize', onResize);
  window.requestAnimationFrame(onResize);

  let last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    state.time = now / 1000;
    advance(state, dt);
    drawScene(ui.ctx, toScene(state));
    syncHud(state, ui);
    window.requestAnimationFrame(frame);
  };
  window.requestAnimationFrame(frame);
}

function createState(save: SaveData): State {
  const battle = makeBattle('tutorial', 0);
  return {
    save,
    battle,
    encounter: 'tutorial',
    tutorialStep: null,
    phase: 'command',
    generation: 0,
    shownHeroHp: battle.hero.hp,
    shownEnemyHp: battle.enemy.hp,
    scale: 1,
    glow: 0,
    targetScale: 1,
    targetGlow: 0,
    heroOx: 0,
    allyOx: 0,
    enemyOx: 0,
    enemyOy: 0,
    pose: 'idle',
    allyPose: 'idle',
    enemyVisible: true,
    enemyFlash: 0,
    heroFlash: 0,
    shake: 0,
    flash: 0,
    bang: false,
    numbers: [],
    shards: [],
    reward: 0,
    allyHits: 0,
    intro: 0,
    width: VIEW_W,
    height: VIEW_H,
    time: 0,
  };
}

function begin(state: State, ui: Ui, encounter: EncounterId): void {
  const allies = encounter === 'tutorial' ? 0 : state.save.allies;
  state.encounter = encounter;
  state.battle = makeBattle(encounter, allies);
  state.shownHeroHp = state.battle.hero.hp;
  state.shownEnemyHp = state.battle.enemy.hp;
  state.tutorialStep = encounter === 'tutorial' ? 0 : null;
  state.scale = 1;
  state.glow = 0;
  state.targetScale = 1;
  state.targetGlow = 0;
  state.heroOx = 0;
  state.allyOx = 0;
  state.enemyOx = 0;
  state.enemyOy = 0;
  state.pose = 'idle';
  state.allyPose = 'idle';
  state.enemyVisible = true;
  state.enemyFlash = 0;
  state.heroFlash = 0;
  state.shake = 0;
  state.flash = 0;
  state.numbers = [];
  state.shards = [];
  state.reward = 0;
  state.allyHits = 0;
  state.bang = intentAt(state.battle) === 'strike';
  state.intro = 1;
  state.phase = 'command';
  showModal(ui, null);
  if (state.tutorialStep !== null) {
    const first = config.tutorial.steps[0];
    setCommands(ui, first ?? null);
    if (first) placeFinger(ui, first);
  } else {
    setCommands(ui, 'all');
    hideFinger(ui);
  }
  mark(state, ui);
}

function openRecruit(state: State, ui: Ui): void {
  state.phase = 'recruit';
  state.enemyVisible = false;
  state.bang = false;
  state.pose = 'idle';
  setCommands(ui, null);
  hideFinger(ui);
  showModal(ui, 'recruit');
  mark(state, ui);
}

function onCommand(state: State, ui: Ui, command: Command): void {
  if (state.phase !== 'command') return;
  if (state.tutorialStep !== null) {
    const expected = config.tutorial.steps[state.tutorialStep];
    if (command !== expected) return;
  }
  void runTurn(state, ui, command);
}

async function runTurn(state: State, ui: Ui, command: Command): Promise<void> {
  const generation = ++state.generation;
  const alive = () => generation === state.generation;
  state.phase = 'resolving';
  setCommands(ui, null);
  hideFinger(ui);
  mark(state, ui);

  const scripted =
    state.tutorialStep !== null &&
    command === 'attack' &&
    state.tutorialStep === config.tutorial.steps.length - 1;
  const result = step(state.battle, command, rules, scripted ? { forceDamage: config.tutorial.damage } : undefined);

  switch (command) {
    case 'charge': {
      playCharge();
      const index = chargeStep(result.battle.hero.multiplier);
      state.targetScale = config.charge.scales[index] ?? 1;
      state.targetGlow = config.charge.glows[index] ?? 0;
      await wait(config.juice.chargeMs);
      break;
    }
    case 'attack': {
      playAttack();
      let impacted = false;
      await tween(config.juice.lungeMs, alive, (t) => {
        state.pose = 'lunge';
        state.heroOx = -22 * Math.sin(t * Math.PI);
        if (impacted || t < 0.42) return;
        impacted = true;
        connectHeroHit(state, result.heroDamage, scripted);
        if (!scripted) {
          state.targetScale = config.charge.scales[0] ?? 1;
          state.targetGlow = config.charge.glows[0] ?? 0;
        }
      });
      if (!scripted) state.pose = 'idle';
      state.heroOx = 0;
      if (!alive()) return;
      await wait(config.juice.hitStopMs);
      break;
    }
    case 'guard': {
      playGuard();
      state.pose = 'guard';
      await wait(config.juice.guardMs * 0.45);
      break;
    }
    default: {
      const neverCommand: never = command;
      throw new Error(`unknown command ${String(neverCommand)}`);
    }
  }
  if (!alive()) return;

  if (state.shownEnemyHp > 0) {
    for (const damage of result.allyDamage) {
      if (damage <= 0 || state.shownEnemyHp <= 0) continue;
      let impacted = false;
      await tween(config.juice.allyMs, alive, (t) => {
        state.allyPose = 'lunge';
        state.allyOx = -14 * Math.sin(t * Math.PI);
        if (impacted || t < 0.45) return;
        impacted = true;
        state.allyHits += 1;
        spawnNumber(state, damage, 0.5, 0.36, false);
        state.shownEnemyHp = Math.max(0, state.shownEnemyHp - damage);
        state.enemyFlash = 1;
        playHit();
        remember(state, damage);
      });
      state.allyPose = 'idle';
      state.allyOx = 0;
      if (!alive()) return;
    }
  }

  if (result.battle.outcome !== 'win' && result.intent === 'strike') {
    let impacted = false;
    await tween(config.juice.strikeMs, alive, (t) => {
      state.enemyOx = 12 * Math.sin(t * Math.PI);
      state.enemyOy = 6 * Math.sin(t * Math.PI);
      if (impacted || t < 0.48) return;
      impacted = true;
      spawnNumber(state, result.enemyDamage, 0.66, 0.7, false);
      state.shownHeroHp = result.battle.hero.hp;
      if (result.guarded) playGuard();
      else {
        state.heroFlash = 1;
        playHit();
      }
    });
    state.enemyOx = 0;
    state.enemyOy = 0;
    state.pose = 'idle';
  } else {
    state.pose = 'idle';
  }
  if (!alive()) return;

  state.battle = result.battle;
  state.shownHeroHp = result.battle.hero.hp;
  state.shownEnemyHp = result.battle.enemy.hp;
  state.bang = state.battle.outcome === 'ongoing' && intentAt(state.battle) === 'strike';

  if (scripted) {
    await wait(config.juice.shatterMs);
    if (!alive()) return;
    state.numbers = [];
    state.shards = [];
    begin(state, ui, 'minion');
    return;
  }

  if (state.battle.outcome === 'win') {
    await onWin(state, ui, alive);
    return;
  }
  if (state.battle.outcome === 'lose') {
    state.phase = 'defeat';
    showModal(ui, 'retry');
    mark(state, ui);
    return;
  }

  if (state.tutorialStep !== null) {
    state.tutorialStep += 1;
    const next = config.tutorial.steps[state.tutorialStep];
    state.phase = 'command';
    if (next) {
      setCommands(ui, next);
      placeFinger(ui, next);
    } else {
      setCommands(ui, 'all');
    }
    mark(state, ui);
    return;
  }

  state.phase = 'command';
  setCommands(ui, 'all');
  mark(state, ui);
}

function connectHeroHit(state: State, damage: number, scripted: boolean): void {
  spawnNumber(state, damage, scripted ? 0.5 : 0.46, scripted ? 0.55 : 0.4, scripted);
  state.shownEnemyHp = Math.max(0, state.battle.enemy.hp - damage);
  state.enemyFlash = 1;
  remember(state, damage);
  if (!scripted) {
    state.shake = damage >= state.battle.hero.attack * 8 ? config.juice.shakeHeavy : config.juice.shakeLight;
    state.flash = 0.55;
    playHit();
    return;
  }
  state.shake = config.juice.shakeTutorial;
  state.flash = 1;
  state.enemyVisible = false;
  state.phase = 'shatter';
  spawnFragments(state);
  playShatter();
  state.save.tutorialDone = true;
  writeSave(state.save);
}

async function onWin(state: State, ui: Ui, alive: () => boolean): Promise<void> {
  if (state.encounter !== 'minion' && state.encounter !== 'boss') return;
  const defeated: CampaignId = state.encounter;
  state.phase = 'reward';
  setCommands(ui, null);
  state.save = grantBone(state.save);
  state.save.encounter = nextEncounter(defeated);
  if (defeated === 'boss' && state.save.allies < config.ally.prototypeRecruits) {
    state.save.recruitPending = true;
  }
  writeSave(state.save);
  playVictory();
  mark(state, ui);
  await tween(config.juice.boneMs, alive, (t) => {
    state.reward = t;
  });
  if (!alive()) return;
  state.reward = 0;
  if (state.save.recruitPending) {
    openRecruit(state, ui);
    return;
  }
  begin(state, ui, state.save.encounter);
}

function advance(state: State, dt: number): void {
  const blend = 1 - Math.exp(-dt * 10);
  state.scale += (state.targetScale - state.scale) * blend;
  state.glow += (state.targetGlow - state.glow) * blend;
  state.intro = Math.max(0, state.intro - dt / 0.55);
  state.shake *= Math.exp(-dt * 2.2);
  if (state.shake < 0.15) state.shake = 0;
  state.flash = Math.max(0, state.flash - dt * 2.4);
  state.enemyFlash = Math.max(0, state.enemyFlash - dt * 4);
  state.heroFlash = Math.max(0, state.heroFlash - dt * 4);

  const gravity = 200;
  for (const number of state.numbers) {
    number.vy += gravity * dt;
    number.y += number.vy * dt;
    if (number.y > number.floor) {
      number.y = number.floor;
      number.vy *= -0.48;
      if (Math.abs(number.vy) < 36) number.vy = 0;
    }
    number.life -= dt;
  }
  state.numbers = state.numbers.filter((number) => number.life > 0);

  for (const shard of state.shards) {
    shard.vy += 180 * dt;
    shard.x += shard.vx * dt;
    shard.y += shard.vy * dt;
    shard.rot += shard.vr * dt;
    shard.life -= dt;
  }
  state.shards = state.shards.filter((shard) => shard.life > 0);
}

function spawnNumber(state: State, damage: number, xFrac: number, yFrac: number, big: boolean): void {
  const scale = big ? config.juice.bigNumberScale : damage === 0 ? config.juice.takenScale : config.juice.numberScale;
  const life = big ? config.juice.bigNumberLife : config.juice.numberLife;
  const y = state.height * yFrac;
  state.numbers.push({
    text: String(damage),
    x: state.width * xFrac,
    y,
    vy: big ? -70 : -48,
    life,
    max: life,
    scale,
    gold: big,
    floor: y + (big ? 14 : 8),
  });
}

function spawnFragments(state: State): void {
  const sprite = spriteFor(state.encounter);
  const place = battleAnchors(state.encounter, state.width, state.height);
  const originX = place.enemyX + state.enemyOx;
  const originY = place.enemyY + state.enemyOy - sprite.h / 2;
  const cell = sprite.w > 80 ? 4 : 2;
  const dissolve = ['#f8d0ea', '#f0a0d0', '#e070b8', '#c050a0', '#984888', '#f4c0e4'];
  let index = 0;
  for (const block of shatterBlocks(sprite, cell)) {
    const angle = Math.atan2(block.dy, block.dx || 0.01);
    const speed = 10 + Math.random() * 22;
    state.shards.push({
      x: originX + block.dx,
      y: originY + block.dy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 8,
      rot: 0,
      vr: (Math.random() - 0.5) * 4,
      color: dissolve[index % dissolve.length] ?? '#e070b8',
      size: Math.max(2, block.size),
      life: 1.6,
      max: 1.6,
    });
    index += 1;
  }
}

function remember(state: State, damage: number): void {
  if (damage <= 0) return;
  const next = noteDamage(state.save, damage);
  if (next === state.save) return;
  state.save = next;
  writeSave(state.save);
}

function toScene(state: State): Scene {
  const allyCount = state.encounter === 'tutorial' ? 0 : state.save.allies;
  const place = battleAnchors(state.encounter, state.width, state.height);
  return {
    width: state.width,
    height: state.height,
    time: state.time,
    shake: state.shake,
    flash: state.flash,
    intro: state.intro,
    celebrating: state.phase === 'reward' || state.reward > 0,
    encounter: state.encounter,
    enemyVisible: state.enemyVisible && state.shownEnemyHp > 0,
    enemyX: place.enemyX + state.enemyOx,
    enemyY: place.enemyY + state.enemyOy,
    enemyFlash: state.enemyFlash,
    heroX: place.heroX + state.heroOx,
    heroY: place.heroY,
    heroScale: state.scale,
    heroGlow: state.glow,
    heroFlash: state.heroFlash,
    heroPose: state.pose,
    ally:
      allyCount > 0
        ? { x: place.allyX + state.allyOx, y: place.allyY, pose: state.allyPose }
        : null,
    bang: state.bang && state.enemyVisible,
    numbers: state.numbers,
    fragments: state.shards,
    reward: state.reward,
  };
}

function syncHud(state: State, ui: Ui): void {
  const hp = Math.max(0, Math.round(state.shownHeroHp));
  const step = chargeStep(state.battle.hero.multiplier);
  const atb = [18, 38, 58, 78, 100][step] ?? 18;
  ui.hpFill.style.width = `${atb}%`;
  ui.hpText.textContent = `${hp}/${config.hero.maxHp}`;
  ui.charge.textContent = state.battle.hero.multiplier > 1 ? `x${state.battle.hero.multiplier}` : '';
  ui.enemyName.textContent = enemyName(state.encounter);
  ui.allyHp.hidden = state.save.allies < 1 || state.encounter === 'tutorial';
  ui.bones.textContent = String(state.save.bones);
  ui.record.hidden = state.save.bestDamage <= 0;
  ui.record.textContent = state.save.bestDamage > 0 ? String(state.save.bestDamage) : '';
  mark(state, ui);
}

function mark(state: State, ui: Ui): void {
  ui.app.dataset.phase = state.phase;
  ui.app.dataset.enemy = state.encounter;
  ui.app.dataset.bang = state.bang && state.enemyVisible ? '1' : '0';
  ui.app.dataset.allies = String(state.encounter === 'tutorial' ? 0 : state.save.allies);
  ui.app.dataset.bones = String(state.save.bones);
  ui.app.dataset.best = String(state.save.bestDamage);
  ui.app.dataset.tutorial = state.tutorialStep === null ? 'done' : String(state.tutorialStep);
  ui.app.dataset.allyHits = String(state.allyHits);
  ui.app.dataset.heroHp = String(Math.round(state.shownHeroHp));
  ui.app.dataset.enemyHp = String(Math.max(0, Math.round(state.shownEnemyHp)));
  ui.app.dataset.multiplier = String(state.battle.hero.multiplier);
}

function fit(ui: Ui, state: State): void {
  const rect = ui.stage.getBoundingClientRect();
  const scale = Math.max(1, Math.floor(Math.min(rect.width / VIEW_W, rect.height / VIEW_H)));
  state.width = VIEW_W;
  state.height = VIEW_H;
  ui.battle.width = VIEW_W;
  ui.battle.height = VIEW_H;
  ui.battle.style.width = `${VIEW_W * scale}px`;
  ui.battle.style.height = `${VIEW_H * scale}px`;
  ui.ctx.setTransform(1, 0, 0, 1, 0, 0);
  ui.ctx.imageSmoothingEnabled = false;
}

function setCommands(ui: Ui, allow: Command | 'all' | null): void {
  ui.commands.hidden = allow === null;
  let cursor = '';
  for (const button of ui.commandButtons) {
    const name = button.dataset.command ?? '';
    const enabled = allow === 'all' || (allow !== null && name === allow);
    button.disabled = !enabled;
    if (!enabled) continue;
    if (allow === 'all' && name === 'attack') cursor = name;
    if (allow !== 'all' && allow !== null && name === allow) cursor = name;
  }
  for (const button of ui.commandButtons) {
    button.dataset.cursor = button.dataset.command === cursor ? '1' : '0';
  }
}

function placeFinger(ui: Ui, command: Command): void {
  ui.finger.hidden = true;
  for (const button of ui.commandButtons) {
    button.dataset.cursor = button.dataset.command === command ? '1' : '0';
  }
}

function hideFinger(ui: Ui): void {
  ui.finger.hidden = true;
}

function showModal(ui: Ui, which: 'retry' | 'recruit' | null): void {
  ui.modal.hidden = which === null;
  ui.retry.hidden = which !== 'retry';
  ui.recruit.hidden = which !== 'recruit';
}

function paintFinger(ui: Ui): void {
  const ctx = ui.finger.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, ui.finger.width, ui.finger.height);
  blit(ctx, finger, ui.finger.width / 2, ui.finger.height - 2, 3);
}

function paintBoneIcon(ui: Ui): void {
  const ctx = ui.boneIcon.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  blit(ctx, boneSprite, ui.boneIcon.width / 2, ui.boneIcon.height, 2);
}

function paintRecruit(ui: Ui): void {
  const ctx = ui.recruitBone.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, ui.recruitBone.width, ui.recruitBone.height);
  blit(ctx, boneSprite, 70, 96, 3);
  blit(ctx, hero, 156, 112, 2, { recolor: ALLY_RECOLOR });
}

function chargeStep(multiplier: number): number {
  const stepIndex = Math.round(Math.log2(multiplier));
  if (!Number.isFinite(stepIndex)) return 0;
  return Math.max(0, Math.min(config.charge.scales.length - 1, stepIndex));
}

function spriteFor(encounter: EncounterId): Sprite {
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

function enemyName(encounter: EncounterId): string {
  switch (encounter) {
    case 'tutorial':
      return 'だんご';
    case 'minion':
      return 'こおに';
    case 'boss':
      return 'まおう';
    default: {
      const neverEncounter: never = encounter;
      return neverEncounter;
    }
  }
}

function campaignEncounter(state: State): CampaignId {
  return state.encounter === 'boss' ? 'boss' : 'minion';
}

function isCommand(value: string): value is Command {
  return value === 'attack' || value === 'charge' || value === 'guard';
}

function bind(): Ui {
  const app = document.querySelector('#app');
  const stage = document.querySelector('#stage');
  const battle = document.querySelector('#battle');
  const fingerCanvas = document.querySelector('#finger');
  const commands = document.querySelector('#commands');
  const enemyNameNode = document.querySelector('#enemy-name');
  const charge = document.querySelector('#charge');
  const hpFill = document.querySelector('#hp-fill');
  const hpText = document.querySelector('#hp-text');
  const allyHp = document.querySelector('#ally-hp');
  const bones = document.querySelector('#bones');
  const record = document.querySelector('#record');
  const modal = document.querySelector('#modal');
  const retry = document.querySelector('#retry');
  const recruit = document.querySelector('#recruit');
  const recruitBone = document.querySelector('#recruit-bone');
  const boneIcon = document.querySelector('#bone-icon');
  if (
    !(app instanceof HTMLElement) ||
    !(stage instanceof HTMLElement) ||
    !(battle instanceof HTMLCanvasElement) ||
    !(fingerCanvas instanceof HTMLCanvasElement) ||
    !(commands instanceof HTMLElement) ||
    !(enemyNameNode instanceof HTMLElement) ||
    !(charge instanceof HTMLElement) ||
    !(hpFill instanceof HTMLElement) ||
    !(hpText instanceof HTMLElement) ||
    !(allyHp instanceof HTMLElement) ||
    !(bones instanceof HTMLElement) ||
    !(record instanceof HTMLElement) ||
    !(modal instanceof HTMLElement) ||
    !(retry instanceof HTMLButtonElement) ||
    !(recruit instanceof HTMLButtonElement) ||
    !(recruitBone instanceof HTMLCanvasElement) ||
    !(boneIcon instanceof HTMLCanvasElement)
  ) {
    throw new Error('battle markup is missing');
  }
  const ctx = battle.getContext('2d');
  if (!ctx) throw new Error('canvas is unavailable');
  const commandButtons = Array.from(app.querySelectorAll<HTMLButtonElement>('#commands button'));
  return {
    app,
    stage,
    battle,
    ctx,
    finger: fingerCanvas,
    commands,
    commandButtons,
    enemyName: enemyNameNode,
    charge,
    hpFill,
    hpText,
    allyHp,
    bones,
    record,
    modal,
    retry,
    recruit,
    recruitBone,
    boneIcon,
  };
}

function tween(ms: number, alive: () => boolean, apply: (t: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const frame = (now: number) => {
      if (!alive()) {
        resolve();
        return;
      }
      const t = Math.min(1, (now - start) / ms);
      apply(t);
      if (t < 1) window.requestAnimationFrame(frame);
      else resolve();
    };
    window.requestAnimationFrame(frame);
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
