import { config, type Command, type EncounterId } from './config';
import { continueAfterBoss, isCampaignId, keepRecruiting, noteDamage, pickMinion, recruitAlly, resolveWin, type SaveData } from './campaign';
import { intentAt, pacePolicy, quadChargeReady, step, type Battle } from './combat';
import { makeBattle } from './setup';
import { loadSave, writeSave } from './save';
import { hydrateMute, isMuted, playAttack, playCharge, playGuard, playHit, playShatter, playVictory, setMuted, unlockAudio } from './audio';
import { battleAnchors, drawScene, VIEW_H, VIEW_W, type FloatNumber, type Fragment, type Pose, type Scene } from './render';
import { commandMenu, fingerHint } from './menu';
import { meterLow, meterPercent } from './meters';
import { bedForTutorial, refreshMusic, requestMusic } from './music';
import { allySprites, blit, bone as boneSprite, enemySprites, finger, shatterBlocks, type Sprite } from './sprites';

const rules = { chargeCap: config.charge.cap };

interface Shard extends Fragment {
  vx: number;
  vy: number;
  vr: number;
}

interface Popup extends FloatNumber {
  vy: number;
  floor: number;
}

type Phase = 'title' | 'command' | 'resolving' | 'shatter' | 'reward' | 'ending' | 'recruit' | 'defeat';

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
  summon: number;
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
  enemyFill: HTMLElement;
  charge: HTMLElement;
  roster: HTMLElement;
  bones: HTMLElement;
  record: HTMLElement;
  resultRecord: HTMLElement;
  modal: HTMLElement;
  retry: HTMLButtonElement;
  recruit: HTMLButtonElement;
  recruitBone: HTMLCanvasElement;
  boneIcon: HTMLCanvasElement;
  mute: HTMLButtonElement;
  curtain: HTMLButtonElement;
}

export function startGame(): void {
  const ui = bind();
  const state = createState(loadSave());
  ui.mute.dataset.muted = hydrateMute() ? '1' : '0';
  fit(ui, state);
  paintFinger(ui);
  paintBoneIcon(ui);
  paintRecruit(ui, state.save.allies);
  if (state.save.recruitPending && keepRecruiting(state.save)) openRecruit(state, ui);
  else {
    if (state.save.recruitPending) {
      state.save = { ...state.save, recruitPending: false };
      writeSave(state.save);
    }
    showTitle(state, ui);
  }

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
    begin(state, ui, state.encounter);
  });
  ui.mute.addEventListener('click', () => {
    unlockAudio();
    setMuted(!isMuted());
    ui.mute.dataset.muted = isMuted() ? '1' : '0';
    refreshMusic();
  });
  ui.curtain.addEventListener('click', () => {
    unlockAudio();
    if (state.phase === 'title') {
      if (!state.save.tutorialDone) requestMusic(null);
      const encounter = state.save.tutorialDone ? state.save.encounter : 'tutorial';
      begin(state, ui, encounter);
      return;
    }
    if (state.phase !== 'ending') return;
    const next = continueAfterBoss(state.save);
    switch (next) {
      case 'recruit':
        openRecruit(state, ui);
        return;
      case 'fight':
        state.generation += 1;
        begin(state, ui, state.save.encounter);
        return;
      default: {
        const neverNext: never = next;
        throw new Error(`unknown curtain ${String(neverNext)}`);
      }
    }
  });
  ui.recruit.addEventListener('click', () => {
    unlockAudio();
    const next = recruitAlly(state.save);
    if (!next) return;
    const more = keepRecruiting(next);
    state.save = { ...next, recruitPending: more };
    writeSave(state.save);
    paintRecruit(ui, state.save.allies);
    if (more) {
      openRecruit(state, ui);
      return;
    }
    state.generation += 1;
    begin(state, ui, state.save.encounter);
  });

  const onResize = () => {
    fit(ui, state);
    if (state.phase === 'command') setCommands(ui, state, true);
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
    summon: 0,
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
  state.summon = 0;
  state.bang = intentAt(state.battle) === 'strike';
  state.intro = 1;
  state.phase = 'command';
  requestMusic(bedForTutorial(encounter === 'tutorial'));
  showModal(ui, null);
  setCommands(ui, state, true);
  mark(state, ui);
}

function showTitle(state: State, ui: Ui): void {
  state.phase = 'title';
  state.enemyVisible = false;
  state.bang = false;
  state.pose = 'idle';
  setCommands(ui, state, false);
  showModal(ui, null);
  requestMusic(null);
  mark(state, ui);
}

function isEnding(state: State): boolean {
  return state.phase === 'ending';
}

function enterEnding(state: State, ui: Ui): void {
  state.phase = 'ending';
  state.enemyVisible = false;
  state.bang = false;
  state.pose = 'idle';
  setCommands(ui, state, false);
  showModal(ui, null);
  mark(state, ui);
}

function openRecruit(state: State, ui: Ui): void {
  state.phase = 'recruit';
  state.enemyVisible = false;
  state.bang = false;
  state.pose = 'idle';
  setCommands(ui, state, false);
  showModal(ui, 'recruit');
  paintRecruit(ui, state.save.allies);
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
  setCommands(ui, state, false);
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
      await wait(config.juice.guardMs);
      break;
    }
    case 'combo': {
      playCharge();
      await tween(480, alive, (t) => {
        state.summon = t * 0.35;
      });
      if (!alive()) return;
      playAttack();
      let impacted = false;
      await tween(360, alive, (t) => {
        state.summon = 0.35 + t * 0.65;
        state.allyPose = 'lunge';
        if (impacted || t < 0.42) return;
        impacted = true;
        const total = result.allyDamage.reduce((sum, hit) => sum + hit, 0);
        spawnNumber(state, total, 0.44, 0.36, true);
        state.shownEnemyHp = result.battle.enemy.hp;
        state.enemyFlash = 1;
        state.shake = config.juice.shakeHeavy;
        state.flash = 0.35;
        playHit();
        remember(state, total, false);
      });
      if (!alive()) return;
      await wait(700);
      state.summon = 0;
      state.allyPose = 'idle';
      break;
    }
    default: {
      const neverCommand: never = command;
      throw new Error(`unknown command ${String(neverCommand)}`);
    }
  }
  if (!alive()) return;

  if (command !== 'combo' && state.shownEnemyHp > 0) {
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
        remember(state, damage, false);
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
    const minion = pickMinion(Math.random());
    state.save = { ...state.save, encounter: minion };
    writeSave(state.save);
    begin(state, ui, minion);
    return;
  }

  if (state.battle.outcome === 'win') {
    await onWin(state, ui, alive);
    return;
  }
  if (state.battle.outcome === 'lose') {
    state.phase = 'defeat';
    state.pose = 'down';
    showModal(ui, 'retry');
    mark(state, ui);
    return;
  }

  if (state.tutorialStep !== null) {
    state.tutorialStep += 1;
    const next = config.tutorial.steps[state.tutorialStep];
    state.phase = 'command';
    if (!next) state.tutorialStep = null;
    setCommands(ui, state, true);
    mark(state, ui);
    return;
  }

  state.phase = 'command';
  setCommands(ui, state, true);
  mark(state, ui);
}

function connectHeroHit(state: State, damage: number, scripted: boolean): void {
  spawnNumber(state, damage, scripted ? 0.5 : 0.46, scripted ? 0.55 : 0.4, scripted);
  state.shownEnemyHp = Math.max(0, state.battle.enemy.hp - damage);
  state.enemyFlash = 1;
  remember(state, damage, scripted);
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
  if (!isCampaign(state.encounter)) return;
  const defeated = state.encounter;
  state.phase = 'reward';
  setCommands(ui, state, false);
  state.save = resolveWin(state.save, defeated, Math.random());
  writeSave(state.save);
  playVictory();
  requestMusic('ending');
  mark(state, ui);
  await tween(config.juice.boneMs, alive, (t) => {
    state.reward = t;
  });
  if (!alive()) return;
  if (defeated === config.campaign.boss) {
    state.reward = 0;
    enterEnding(state, ui);
    await wait(720);
    if (!alive() || !isEnding(state)) return;
    requestMusic('title');
    return;
  }
  state.reward = 1;
  await wait(config.juice.victoryHoldMs);
  if (!alive()) return;
  state.reward = 0;
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
  state.enemyFlash = Math.max(0, state.enemyFlash - dt * 1.6);
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

function remember(state: State, damage: number, scripted: boolean): void {
  if (scripted || damage <= 0) return;
  const next = noteDamage(state.save, damage, false);
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
    celebrating: state.phase === 'reward' || state.phase === 'ending' || state.reward > 0,
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
    allies: place.allies.slice(0, allyCount).map((slot, index) => ({
      x: slot.x + (state.summon > 0 ? 0 : state.allyOx),
      y: slot.y,
      pose: state.allyPose,
      index,
    })),
    summon: state.summon,
    curtain: state.phase === 'title' ? 'title' : state.phase === 'ending' ? 'ending' : null,
    bang: state.bang && state.enemyVisible,
    numbers: state.numbers,
    fragments: state.shards,
    reward: state.reward,
  };
}

function syncHud(state: State, ui: Ui): void {
  const hp = Math.max(0, Math.round(state.shownHeroHp));
  const enemyHp = Math.max(0, Math.round(state.shownEnemyHp));
  ui.hpFill.style.width = `${meterPercent(hp, config.hero.maxHp)}%`;
  ui.hpFill.classList.toggle('low', meterLow(hp, config.hero.maxHp));
  ui.hpText.textContent = `${hp}/${config.hero.maxHp}`;
  ui.enemyFill.style.width = `${meterPercent(enemyHp, config.encounters[state.encounter].hp)}%`;
  ui.charge.textContent = state.battle.hero.multiplier > 1 ? `x${state.battle.hero.multiplier}` : '';
  ui.enemyName.textContent = config.encounters[state.encounter].name;
  const shownAllies = state.encounter === 'tutorial' ? 0 : state.save.allies;
  syncRoster(ui, shownAllies);
  ui.bones.textContent = String(state.save.bones);
  const record = state.save.bestDamage > 0 ? String(state.save.bestDamage) : '';
  ui.record.hidden = record === '';
  ui.record.textContent = record;
  const showResult = record !== '' && state.phase === 'defeat';
  ui.resultRecord.hidden = !showResult;
  ui.resultRecord.textContent = record;
  mark(state, ui);
}

function syncRoster(ui: Ui, allies: number): void {
  if (ui.roster.dataset.count === String(allies)) {
    ui.roster.hidden = allies < 1;
    return;
  }
  ui.roster.replaceChildren();
  for (let index = 0; index < allies; index += 1) {
    const name = config.ally.names[index];
    if (!name) continue;
    const mate = document.createElement('span');
    mate.className = 'mate';
    mate.dataset.ally = String(index);
    const swatch = document.createElement('i');
    mate.append(swatch, document.createTextNode(name));
    ui.roster.append(mate);
  }
  ui.roster.dataset.count = String(allies);
  ui.roster.hidden = allies < 1;
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
  ui.app.dataset.summon = state.summon > 0.8 ? '1' : '0';
  ui.app.dataset.pose = state.pose;
  ui.curtain.hidden = state.phase !== 'title' && state.phase !== 'ending';
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

function setCommands(ui: Ui, state: State, open: boolean): void {
  ui.commands.hidden = !open;
  const menu = commandMenu({
    tutorialStep: state.phase === 'command' ? state.tutorialStep : null,
    comboReady: quadChargeReady(state.save.allies, config.campaign.combo),
    open,
    suggest: pacePolicy(state.battle, config.charge.cap),
  });
  for (const button of ui.commandButtons) {
    const name = button.dataset.command ?? '';
    if (!isCommand(name)) continue;
    const slot = menu[name];
    button.hidden = slot.hidden;
    button.disabled = slot.disabled;
    button.dataset.dim = slot.disabled && !slot.hidden ? '1' : '0';
    button.dataset.cursor = slot.hot ? '1' : '0';
  }
  syncFinger(ui, state, open);
}

function syncFinger(ui: Ui, state: State, open: boolean): void {
  const step = state.phase === 'command' ? state.tutorialStep : null;
  const hot = fingerHint(step, open)
    ? ui.commandButtons.find((button) => button.dataset.cursor === '1' && !button.hidden)
    : undefined;
  if (!hot) {
    ui.finger.hidden = true;
    return;
  }
  const appBox = ui.app.getBoundingClientRect();
  const box = hot.getBoundingClientRect();
  if (box.height === 0) {
    ui.finger.hidden = true;
    return;
  }
  const tipX = 24;
  const tipY = 48;
  ui.finger.style.left = `${Math.round(box.right - appBox.left - tipX)}px`;
  ui.finger.style.top = `${Math.round(box.top - appBox.top + box.height / 2 - tipY)}px`;
  ui.finger.hidden = false;
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

function paintRecruit(ui: Ui, allyIndex: number): void {
  const ctx = ui.recruitBone.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, ui.recruitBone.width, ui.recruitBone.height);
  blit(ctx, boneSprite, 64, 100, 3);
  const sprite = allySprites[Math.min(allySprites.length - 1, Math.max(0, allyIndex))];
  if (sprite) blit(ctx, sprite, 156, 112, 3);
}

function chargeStep(multiplier: number): number {
  const stepIndex = Math.round(Math.log2(multiplier));
  if (!Number.isFinite(stepIndex)) return 0;
  return Math.max(0, Math.min(config.charge.scales.length - 1, stepIndex));
}

function spriteFor(encounter: EncounterId): Sprite {
  return enemySprites[encounter];
}

function isCampaign(id: EncounterId): id is Exclude<EncounterId, 'tutorial'> {
  return isCampaignId(id);
}

function isCommand(value: string): value is Command {
  return value === 'attack' || value === 'charge' || value === 'guard' || value === 'combo';
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
  const enemyFill = document.querySelector('#enemy-fill');
  const roster = document.querySelector('#roster');
  const bones = document.querySelector('#bones');
  const record = document.querySelector('#record');
  const resultRecord = document.querySelector('#result-record');
  const modal = document.querySelector('#modal');
  const retry = document.querySelector('#retry');
  const recruit = document.querySelector('#recruit');
  const recruitBone = document.querySelector('#recruit-bone');
  const boneIcon = document.querySelector('#bone-icon');
  const mute = document.querySelector('#mute');
  const curtain = document.querySelector('#curtain');
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
    !(enemyFill instanceof HTMLElement) ||
    !(roster instanceof HTMLElement) ||
    !(bones instanceof HTMLElement) ||
    !(record instanceof HTMLElement) ||
    !(resultRecord instanceof HTMLElement) ||
    !(modal instanceof HTMLElement) ||
    !(retry instanceof HTMLButtonElement) ||
    !(recruit instanceof HTMLButtonElement) ||
    !(recruitBone instanceof HTMLCanvasElement) ||
    !(boneIcon instanceof HTMLCanvasElement) ||
    !(mute instanceof HTMLButtonElement) ||
    !(curtain instanceof HTMLButtonElement)
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
    enemyFill,
    roster,
    bones,
    record,
    resultRecord,
    modal,
    retry,
    recruit,
    recruitBone,
    boneIcon,
    mute,
    curtain,
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
