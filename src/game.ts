import { config, type Command, type EncounterId } from './config';
import { continueAfterBoss, isCampaignId, noteDamage, pickMinion, resolveWin, type SaveData } from './campaign';
import { quadChargeReady } from './combat';
import {
  act,
  enemyReady,
  fillGauges,
  makeEncounter,
  resolveEnemy,
  suggestCommand,
  telegraph,
  type AtbBattle,
  type AtbRules,
} from './atb';
import { loadSave, writeSave } from './save';
import { hydrateMute, isMuted, playAttack, playCharge, playGuard, playHit, playShatter, playVictory, setMuted, unlockAudio } from './audio';
import { battleAnchors, drawScene, fieldCover, VIEW_H, VIEW_W, type FloatNumber, type Fragment, type Pose, type Scene } from './render';
import { commandMenu, fingerHint } from './menu';
import { meterLow, meterPercent } from './meters';
import { bedForTutorial, refreshMusic, requestMusic } from './music';
import { enemyFrames } from './dogs';
import { blit, bone as boneSprite, finger, shatterBlocks, type Sprite } from './sprites';

const rules: AtbRules = { chargeCap: config.charge.cap, telegraphAt: config.atb.telegraphAt };

interface Shard extends Fragment {
  vx: number;
  vy: number;
  vr: number;
}

interface Popup extends FloatNumber {
  vy: number;
  floor: number;
}

type Phase = 'title' | 'live' | 'command' | 'resolving' | 'shatter' | 'reward' | 'ending' | 'recruit' | 'defeat';

interface State {
  save: SaveData;
  battle: AtbBattle;
  /** Party index playing the current lunge. */
  actor: number;
  /** An animation is playing. Gauges wait, and a tap cannot start a second action. */
  busy: boolean;
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
  enemyPose: Pose;
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
  if (state.save.recruitPending) {
    state.save = { ...state.save, recruitPending: false };
    writeSave(state.save);
  }
  showTitle(state, ui);

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
    const next = continueAfterBoss();
    switch (next) {
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

  const onResize = () => {
    fit(ui, state);
    if (state.phase === 'command' || state.phase === 'live') syncCommands(ui, state);
  };
  void document.fonts.ready.then(onResize);
  window.addEventListener('resize', onResize);
  window.requestAnimationFrame(onResize);

  let last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    state.time = now / 1000;
    advance(state, dt);
    tickBattle(state, ui, dt);
    fit(ui, state);
    drawScene(ui.ctx, toScene(state));
    syncHud(state, ui);
    window.requestAnimationFrame(frame);
  };
  window.requestAnimationFrame(frame);
}

function createState(save: SaveData): State {
  const battle = makeEncounter('tutorial', 0);
  return {
    save,
    battle,
    actor: 0,
    busy: false,
    encounter: 'tutorial',
    tutorialStep: null,
    phase: 'command',
    generation: 0,
    shownHeroHp: battle.party[0]?.hp ?? config.hero.maxHp,
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
    enemyPose: 'idle',
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
  state.generation += 1;
  state.encounter = encounter;
  state.battle = makeEncounter(encounter, config.ally.fieldCount);
  state.actor = 0;
  state.busy = false;
  state.shownHeroHp = state.battle.party[0]?.hp ?? config.hero.maxHp;
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
  state.enemyPose = 'idle';
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
  state.bang = false;
  state.intro = 1;
  state.phase = encounter === 'tutorial' ? 'command' : 'live';
  requestMusic(bedForTutorial(encounter === 'tutorial'));
  showModal(ui, null);
  syncCommands(ui, state);
  mark(state, ui);
  fit(ui, state);
}

function showTitle(state: State, ui: Ui): void {
  state.phase = 'title';
  state.enemyVisible = false;
  state.bang = false;
  state.pose = 'idle';
  syncCommands(ui, state);
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
  syncCommands(ui, state);
  showModal(ui, null);
  mark(state, ui);
}

function onCommand(state: State, ui: Ui, command: Command): void {
  if (state.busy || state.phase !== 'command') return;
  if (state.battle.acting === null) return;
  if (enemyReady(state.battle)) {
    void runEnemy(state, ui);
    return;
  }
  if (state.tutorialStep !== null) {
    const expected = config.tutorial.steps[state.tutorialStep];
    if (command !== expected) return;
  }
  void runCommand(state, ui, command);
}

async function runCommand(state: State, ui: Ui, command: Command): Promise<void> {
  const generation = ++state.generation;
  const alive = () => generation === state.generation;
  const actor = state.battle.acting ?? 0;
  state.actor = actor;
  state.busy = true;
  state.phase = 'resolving';
  syncCommands(ui, state);
  mark(state, ui);

  const scripted =
    state.tutorialStep !== null &&
    command === 'attack' &&
    state.tutorialStep === config.tutorial.steps.length - 1;
  const result = act(state.battle, command, rules, scripted ? config.tutorial.damage : undefined);
  state.battle = { ...result.battle, pause: 0 };
  const acted = result.battle.party[actor];

  switch (command) {
    case 'charge': {
      playCharge();
      if (actor === 0 && acted) {
        const index = chargeStep(acted.multiplier);
        state.targetScale = config.charge.scales[index] ?? 1;
        state.targetGlow = config.charge.glows[index] ?? 0;
      }
      await wait(config.atb.anim.charge * 1000);
      break;
    }
    case 'attack': {
      playAttack();
      let impacted = false;
      const attackMs = config.atb.anim.attack * 1000;
      await tween(attackMs * 0.62, alive, (t) => {
        holdPose(state, actor, 'lunge');
        const lean = -14 * Math.sin(t * Math.PI);
        if (actor === 0) state.heroOx = lean;
        else state.allyOx = lean;
        if (impacted || t < 0.42) return;
        impacted = true;
        connectHeroHit(state, result.damage, scripted);
        if (!scripted && actor === 0) {
          state.targetScale = config.charge.scales[0] ?? 1;
          state.targetGlow = config.charge.glows[0] ?? 0;
        }
      });
      state.heroOx = 0;
      state.allyOx = 0;
      if (!scripted) holdPose(state, actor, 'idle');
      if (!alive()) return;
      await wait(attackMs * 0.38);
      break;
    }
    case 'guard': {
      playGuard();
      holdPose(state, actor, 'guard');
      await wait(config.atb.anim.guard * 1000);
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
        spawnNumber(state, result.damage, 0.44, 0.36, true);
        state.shownEnemyHp = result.battle.enemy.hp;
        if (state.shownEnemyHp <= 0) state.enemyPose = 'down';
        state.enemyFlash = 1;
        state.shake = config.juice.shakeHeavy;
        state.flash = 0.35;
        playHit();
        remember(state, result.damage, false);
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

  state.shownEnemyHp = result.battle.enemy.hp;
  if (state.shownEnemyHp <= 0) state.enemyPose = 'down';

  if (scripted) {
    await wait(config.atb.anim.shatter * 1000);
    if (!alive()) return;
    state.numbers = [];
    state.shards = [];
    const minion = pickMinion(Math.random());
    state.save = { ...state.save, encounter: minion };
    writeSave(state.save);
    begin(state, ui, minion);
    return;
  }

  if (result.battle.outcome === 'win') {
    state.busy = false;
    await onWin(state, ui, alive);
    return;
  }

  if (state.tutorialStep !== null) {
    state.tutorialStep += 1;
    const next = config.tutorial.steps[state.tutorialStep];
    if (!next) state.tutorialStep = null;
  }
  resume(state, ui);
}

async function runEnemy(state: State, ui: Ui): Promise<void> {
  const generation = ++state.generation;
  const alive = () => generation === state.generation;
  state.busy = true;
  const result = resolveEnemy(state.battle);
  state.battle = { ...result.battle, pause: 0 };
  state.bang = false;
  syncCommands(ui, state);
  if (result.intent === 'strike') {
    let impacted = false;
    state.enemyPose = 'lunge';
    await tween(config.atb.anim.strike * 1000, alive, (t) => {
      state.enemyOx = 10 * Math.sin(t * Math.PI);
      state.enemyOy = 2 * Math.sin(t * Math.PI);
      if (impacted || t < 0.48) return;
      impacted = true;
      spawnNumber(state, result.damage, 0.66, 0.7, false);
      state.shownHeroHp = result.battle.party[0]?.hp ?? 0;
      if (result.guarded) playGuard();
      else {
        state.heroFlash = 1;
        playHit();
      }
    });
    state.enemyOx = 0;
    state.enemyOy = 0;
  } else {
    state.enemyPose = 'guard';
    await wait(config.atb.anim.windup * 1000);
  }
  if (!alive()) return;
  state.enemyPose = state.shownEnemyHp <= 0 ? 'down' : 'idle';
  if (result.battle.outcome === 'lose') {
    state.busy = false;
    state.phase = 'defeat';
    state.pose = 'down';
    state.shownHeroHp = 0;
    showModal(ui, 'retry');
    syncCommands(ui, state);
    mark(state, ui);
    return;
  }
  resume(state, ui);
}

/** Fill gauges. The enemy can finish a bar while a command window is open. */
function tickBattle(state: State, ui: Ui, dt: number): void {
  if (state.busy || (state.phase !== 'live' && state.phase !== 'command')) return;
  state.battle = fillGauges(state.battle, dt);
  state.bang = telegraph(state.battle, rules.telegraphAt);
  const hero = state.battle.party[0];
  if (hero?.guarding && state.pose !== 'down') state.pose = 'guard';
  else if (state.pose === 'guard' && !hero?.guarding) state.pose = 'idle';
  if (enemyReady(state.battle)) {
    void runEnemy(state, ui);
    return;
  }
  if (state.battle.acting !== null && state.phase === 'live') state.phase = 'command';
  syncCommands(ui, state);
}

function resume(state: State, ui: Ui): void {
  state.busy = false;
  state.heroOx = 0;
  state.allyOx = 0;
  const hero = state.battle.party[0];
  if (state.pose !== 'down') state.pose = hero?.guarding ? 'guard' : 'idle';
  state.allyPose = state.battle.party.slice(1).some((member) => member.guarding) ? 'guard' : 'idle';
  state.bang = telegraph(state.battle, rules.telegraphAt);
  if (state.tutorialStep !== null) {
    state.phase = 'command';
  } else {
    state.phase = state.battle.acting !== null ? 'command' : 'live';
  }
  syncCommands(ui, state);
  mark(state, ui);
}

function holdPose(state: State, actor: number, pose: Pose): void {
  state.actor = actor;
  if (actor === 0) state.pose = pose;
  else state.allyPose = pose;
}

function allyPose(state: State, index: number): Pose {
  if (state.summon > 0.2) return 'lunge';
  const member = state.battle.party[index + 1];
  if (state.actor === index + 1 && state.allyPose === 'lunge') return 'lunge';
  if (member?.guarding) return 'guard';
  if (state.actor === index + 1) return state.allyPose;
  return 'idle';
}

function connectHeroHit(state: State, damage: number, scripted: boolean): void {
  spawnNumber(state, damage, scripted ? 0.5 : 0.46, scripted ? 0.55 : 0.4, scripted);
  state.shownEnemyHp = state.battle.enemy.hp;
  if (state.shownEnemyHp <= 0) state.enemyPose = 'down';
  state.enemyFlash = 1;
  remember(state, damage, scripted);
  if (!scripted) {
    const attack = state.battle.party[0]?.attack ?? config.hero.attack;
    state.shake = damage >= attack * 8 ? config.juice.shakeHeavy : config.juice.shakeLight;
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
  syncCommands(ui, state);
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
  const allyCount = config.ally.fieldCount;
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
    enemyVisible: state.enemyVisible && (state.shownEnemyHp > 0 || state.enemyPose === 'down'),
    enemyX: place.enemyX + state.enemyOx,
    enemyY: place.enemyY + state.enemyOy,
    enemyFlash: state.enemyFlash,
    enemyPose: state.enemyPose,
    heroX: place.heroX + state.heroOx,
    heroY: place.heroY,
    heroScale: state.scale,
    heroGlow: state.glow,
    heroFlash: state.heroFlash,
    heroPose: state.pose,
    allies: place.allies.slice(0, allyCount).map((slot, index) => ({
      x: slot.x + (state.summon > 0 ? 0 : state.allyOx),
      y: slot.y,
      pose: allyPose(state, index),
      index,
    })),
    summon: state.summon,
    curtain: state.phase === 'title' ? 'title' : state.phase === 'ending' ? 'ending' : null,
    recruitAlly: state.phase === 'recruit' ? state.save.allies : null,
    partyGauges: state.battle.party.map((member) => member.gauge),
    enemyGauge: state.battle.enemy.gauge,
    acting: state.battle.acting,
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
  const actor = state.battle.party[state.battle.acting ?? 0];
  ui.charge.textContent = actor && actor.multiplier > 1 ? `x${actor.multiplier}` : '';
  ui.enemyName.textContent = config.encounters[state.encounter].name;
  const shownAllies = config.ally.fieldCount;
  syncRoster(ui, shownAllies);
  ui.bones.textContent = String(state.save.bones);
  const record = state.save.bestDamage > 0 ? String(state.save.bestDamage) : '';
  const showResult = record !== '' && state.phase === 'defeat';
  ui.record.hidden = record === '' || showResult;
  ui.record.textContent = record;
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
  ui.app.dataset.allies = String(config.ally.fieldCount);
  ui.app.dataset.bones = String(state.save.bones);
  ui.app.dataset.best = String(state.save.bestDamage);
  ui.app.dataset.tutorial = state.tutorialStep === null ? 'done' : String(state.tutorialStep);
  ui.app.dataset.allyHits = String(state.allyHits);
  ui.app.dataset.heroHp = String(Math.round(state.shownHeroHp));
  ui.app.dataset.enemyHp = String(Math.max(0, Math.round(state.shownEnemyHp)));
  const shownActor = state.battle.party[state.battle.acting ?? 0];
  ui.app.dataset.multiplier = String(shownActor?.multiplier ?? 1);
  ui.app.dataset.heroGauge = String(Math.round((state.battle.party[0]?.gauge ?? 0) * 100));
  ui.app.dataset.enemyGauge = String(Math.round(state.battle.enemy.gauge * 100));
  ui.app.dataset.acting = state.battle.acting === null ? '' : String(state.battle.acting);
  ui.app.dataset.party = String(state.battle.party.length);
  ui.app.dataset.summon = state.summon > 0.8 ? '1' : '0';
  ui.app.dataset.pose = state.pose;
  ui.curtain.hidden = state.phase !== 'title' && state.phase !== 'ending';
}

function fit(ui: Ui, state: State): void {
  const rect = ui.stage.getBoundingClientRect();
  const field = fieldCover(rect.width, rect.height);
  if (state.width === field.width && state.height === field.height) return;
  state.width = field.width;
  state.height = field.height;
  ui.battle.width = field.width;
  ui.battle.height = field.height;
  ui.battle.style.width = `${field.cssWidth}px`;
  ui.battle.style.height = `${field.cssHeight}px`;
  ui.battle.style.left = `${Math.floor((rect.width - field.cssWidth) / 2)}px`;
  ui.ctx.setTransform(1, 0, 0, 1, 0, 0);
  ui.ctx.imageSmoothingEnabled = false;
}

function syncCommands(ui: Ui, state: State): void {
  const fighting = state.phase === 'live' || state.phase === 'command';
  const tutorial = fighting && state.tutorialStep !== null;
  const choosing = state.phase === 'command' && state.battle.acting !== null;
  const visible = choosing || tutorial;
  const open = choosing && !state.busy;
  ui.commands.hidden = !visible;
  const menu = commandMenu({
    tutorialStep: tutorial ? state.tutorialStep : null,
    comboReady: quadChargeReady(config.ally.fieldCount, config.campaign.combo),
    open,
    suggest: suggestCommand(state.battle, rules),
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

function showModal(ui: Ui, which: 'retry' | null): void {
  ui.modal.hidden = which === null;
  ui.retry.hidden = which !== 'retry';
  ui.recruit.hidden = true;
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

function chargeStep(multiplier: number): number {
  const stepIndex = Math.round(Math.log2(multiplier));
  if (!Number.isFinite(stepIndex)) return 0;
  return Math.max(0, Math.min(config.charge.scales.length - 1, stepIndex));
}

function spriteFor(encounter: EncounterId): Sprite {
  return enemyFrames[encounter].down;
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
