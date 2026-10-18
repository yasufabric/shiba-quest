import type { Command, EncounterId } from './config';
import { config } from './config';
import type { Intent, Outcome } from './combat';

export interface GaugeFighter {
  hp: number;
  maxHp: number;
  attack: number;
  multiplier: number;
  /** 0 empty, 1 full. */
  gauge: number;
  /** Fraction of the gauge gained per second. 0 waits. */
  speed: number;
  guarding: boolean;
}

export interface AtbBattle {
  party: GaugeFighter[];
  enemy: GaugeFighter;
  pattern: readonly Intent[];
  patternIndex: number;
  outcome: Outcome;
  /** Seconds since the fight started. */
  time: number;
  /** Party index whose command window is open. */
  acting: number | null;
  queue: number[];
  /** Gauges wait out an animation. */
  pause: number;
}

export interface AtbRules {
  chargeCap: number;
  telegraphAt: number;
}

export interface ActionResult {
  battle: AtbBattle;
  damage: number;
  guarded: boolean;
  intent: Intent;
}

export interface PlayerProfile {
  /** Seconds between the window opening and the tap. */
  delay: number;
  /** When the pace says まもる, this chance picks ためる instead. */
  guardMiss: number;
  roll: () => number;
}

export interface FightReport {
  battle: AtbBattle;
  time: number;
  outcome: Outcome;
  hp: number;
}

const anim = config.atb.anim;

export function fillSeconds(seconds: number): number {
  if (!(seconds > 0)) return 0;
  return 1 / seconds;
}

export function createAtbBattle(input: {
  party: readonly Pick<GaugeFighter, 'maxHp' | 'attack' | 'speed'>[];
  enemy: Pick<GaugeFighter, 'maxHp' | 'attack' | 'speed'>;
  pattern: readonly Intent[];
}): AtbBattle {
  if (input.pattern.length === 0) throw new Error('enemy pattern is empty');
  if (input.party.length === 0) throw new Error('party is empty');
  return {
    party: input.party.map((member) => gaugeFighter(member.maxHp, member.attack, member.speed)),
    enemy: gaugeFighter(input.enemy.maxHp, input.enemy.attack, input.enemy.speed),
    pattern: input.pattern,
    patternIndex: 0,
    outcome: 'ongoing',
    time: 0,
    acting: null,
    queue: [],
    pause: 0,
  };
}

export function enemyIntent(battle: AtbBattle): Intent {
  const index = battle.patternIndex % battle.pattern.length;
  return battle.pattern[index] ?? 'windup';
}

/** The "!" mark. It is up while a strike gauge has passed the telegraph. */
export function telegraph(battle: AtbBattle, telegraphAt: number): boolean {
  return battle.outcome === 'ongoing' && enemyIntent(battle) === 'strike' && battle.enemy.gauge >= telegraphAt;
}

/** Fill gauges. A full party member waits in the queue. The enemy waits at full until resolved. */
export function fillGauges(battle: AtbBattle, dt: number): AtbBattle {
  if (battle.outcome !== 'ongoing') return battle;
  if (dt <= 0) return battle;
  if (battle.pause > 0) {
    return { ...battle, time: battle.time + dt, pause: Math.max(0, battle.pause - dt) };
  }
  const enemy = { ...battle.enemy, gauge: clampGauge(battle.enemy.gauge, battle.enemy.speed, dt) };
  const queue = battle.queue.slice();
  let acting = battle.acting;
  const party = battle.party.map((member, index) => {
    if (index === acting || queue.includes(index)) return { ...member, gauge: 1 };
    const gauge = clampGauge(member.gauge, member.speed, dt);
    if (gauge < 1) return { ...member, gauge };
    if (acting === null && queue.length === 0) {
      acting = index;
      return { ...member, gauge: 1 };
    }
    queue.push(index);
    return { ...member, gauge: 1 };
  });
  if (acting === null && queue.length > 0) acting = queue.shift() ?? null;
  return { ...battle, party, enemy, queue, acting, time: battle.time + dt };
}

export function enemyReady(battle: AtbBattle): boolean {
  return battle.outcome === 'ongoing' && battle.pause <= 0 && battle.enemy.gauge >= 1 && battle.enemy.speed > 0;
}

export function resolveEnemy(battle: AtbBattle): ActionResult {
  const intent = enemyIntent(battle);
  const enemy = { ...battle.enemy, gauge: 0 };
  const party = battle.party.map((member) => ({ ...member }));
  let damage = 0;
  let guarded = false;
  let outcome = battle.outcome;
  if (intent === 'strike' && outcome === 'ongoing') {
    guarded = party.some((member) => member.guarding);
    for (const member of party) member.guarding = false;
    if (!guarded) {
      damage = enemy.attack;
      const hero = party[0];
      if (hero) {
        hero.hp = Math.max(0, hero.hp - damage);
        if (hero.hp <= 0) outcome = 'lose';
      }
    }
  }
  const pause = intent === 'strike' ? anim.strike : anim.windup;
  return {
    battle: {
      ...battle,
      party,
      enemy,
      outcome,
      patternIndex: battle.patternIndex + 1,
      pause: battle.pause + pause,
    },
    damage,
    guarded,
    intent,
  };
}

export function commandPause(command: Command): number {
  switch (command) {
    case 'attack':
    case 'combo':
      return anim.attack;
    case 'charge':
      return anim.charge;
    case 'guard':
      return anim.guard;
    default: {
      const neverCommand: never = command;
      throw new Error(`unknown command ${String(neverCommand)}`);
    }
  }
}

/**
 * The open window's actor takes the command. Damage lands on the enemy.
 * まもる stays up until the next strike. Charge stays on that actor.
 */
export function act(battle: AtbBattle, command: Command, rules: AtbRules, forceDamage?: number): ActionResult {
  const index = battle.acting;
  const actor = index === null ? undefined : battle.party[index];
  if (!actor || battle.outcome !== 'ongoing' || index === null) {
    return { battle, damage: 0, guarded: false, intent: enemyIntent(battle) };
  }
  const party = battle.party.map((member) => ({ ...member }));
  const current = party[index];
  const enemy = { ...battle.enemy };
  let damage = 0;
  if (!current) return { battle, damage: 0, guarded: false, intent: enemyIntent(battle) };

  switch (command) {
    case 'attack': {
      damage = forceDamage ?? current.attack * current.multiplier;
      enemy.hp -= damage;
      current.multiplier = 1;
      current.gauge = 0;
      break;
    }
    case 'charge': {
      current.multiplier = Math.min(rules.chargeCap, current.multiplier * 2);
      current.gauge = 0;
      break;
    }
    case 'guard': {
      current.guarding = true;
      current.gauge = 0;
      break;
    }
    case 'combo': {
      damage = party.reduce((sum, member, memberIndex) => {
        if (memberIndex === 0) return sum;
        return sum + member.attack * rules.chargeCap;
      }, 0);
      enemy.hp -= damage;
      for (let memberIndex = 1; memberIndex < party.length; memberIndex += 1) {
        const member = party[memberIndex];
        if (!member) continue;
        member.multiplier = 1;
      }
      current.gauge = 0;
      break;
    }
    default: {
      const neverCommand: never = command;
      throw new Error(`unknown command ${String(neverCommand)}`);
    }
  }

  let outcome: Outcome = battle.outcome;
  if (enemy.hp <= 0) {
    enemy.hp = 0;
    outcome = 'win';
  }
  const queue = battle.queue.slice();
  const acting = queue.shift() ?? null;
  return {
    battle: {
      ...battle,
      party,
      enemy,
      outcome,
      acting,
      queue,
      pause: battle.pause + commandPause(command),
    },
    damage,
    guarded: command === 'guard',
    intent: enemyIntent(battle),
  };
}

/** Kill if this swing finishes, guard a dangerous strike, release at the cap, else charge. */
export function suggestCommand(battle: AtbBattle, rules: AtbRules): Command {
  const index = battle.acting ?? 0;
  const actor = battle.party[index] ?? battle.party[0];
  const hero = battle.party[0];
  if (!actor || !hero) return 'charge';
  const intent = enemyIntent(battle);
  const strike = intent === 'strike';
  const incoming = battle.enemy.attack;
  const swing = actor.attack * actor.multiplier;
  if (swing >= battle.enemy.hp && !(strike && hero.hp <= incoming)) return 'attack';
  if (shouldGuard(battle, rules)) return 'guard';
  if (actor.multiplier >= rules.chargeCap) return 'attack';
  return 'charge';
}

/** Guard the telegraph, or the windup that leads into one, once two hits would fall. */
function shouldGuard(battle: AtbBattle, rules: AtbRules): boolean {
  const hero = battle.party[0];
  if (!hero || battle.enemy.attack <= 0) return false;
  if (hero.hp > battle.enemy.attack * 2) return false;
  if (telegraph(battle, rules.telegraphAt)) return true;
  return enemyIntent(battle) !== 'strike' && followingIntent(battle) === 'strike';
}

function followingIntent(battle: AtbBattle): Intent {
  const index = (battle.patternIndex + 1) % battle.pattern.length;
  return battle.pattern[index] ?? 'windup';
}

export function promptProfile(): PlayerProfile {
  return { delay: config.atb.promptDelay, guardMiss: 0, roll: () => 0 };
}

export function hesitantProfile(seed: number): PlayerProfile {
  const roll = mulberry32(seed);
  return {
    delay: config.atb.hesitantMin + roll() * (config.atb.hesitantMax - config.atb.hesitantMin),
    guardMiss: config.atb.hesitantMiss,
    roll,
  };
}

/** Play one fight until it ends or the clock passes `limit` seconds. */
export function simulateFight(battle: AtbBattle, profile: PlayerProfile, rules: AtbRules, limit: number): FightReport {
  let current = battle;
  let think = 0;
  const step = 0.05;
  while (current.outcome === 'ongoing' && current.time < limit) {
    const before = current.acting;
    current = fillGauges(current, step);
    if (current.acting !== before) think = 0;
    if (current.pause > 0) continue;
    if (enemyReady(current)) {
      current = resolveEnemy(current).battle;
      continue;
    }
    if (current.acting === null) {
      think = 0;
      continue;
    }
    think += step;
    if (think + 1e-6 < profile.delay) continue;
    let command = suggestCommand(current, rules);
    if (command === 'guard' && profile.roll() < profile.guardMiss) command = 'charge';
    current = act(current, command, rules).battle;
    think = 0;
  }
  const tail = current.outcome === 'ongoing' ? 0 : current.pause;
  return {
    battle: current,
    time: current.time + tail,
    outcome: current.outcome,
    hp: current.party[0]?.hp ?? 0,
  };
}

export function tutorialSeconds(): number {
  const fills = config.tutorial.steps.length * config.atb.heroFill;
  const charges = config.tutorial.steps.filter((step) => step === 'charge').length * anim.charge;
  const attacks = config.tutorial.steps.filter((step) => step === 'attack').length * anim.attack;
  return fills + charges + attacks + anim.shatter + config.atb.promptDelay * config.tutorial.steps.length;
}

export interface SessionReport {
  time: number;
  outcome: Outcome;
  minionHp: number;
  bossHp: number;
  minionTime: number;
  bossTime: number;
}

export function simulateSession(
  profile: PlayerProfile,
  minion: EncounterId,
  allyCount: number,
  rules: AtbRules,
): SessionReport {
  const tutorial = tutorialSeconds();
  const minionFight = simulateFight(makeEncounter(minion, allyCount), profile, rules, config.time.sessionMaxSeconds);
  const bridge = config.juice.boneMs / 1000 + config.juice.victoryHoldMs / 1000;
  if (minionFight.outcome !== 'win') {
    return {
      time: tutorial + minionFight.time,
      outcome: minionFight.outcome === 'ongoing' ? 'lose' : minionFight.outcome,
      minionHp: minionFight.hp,
      bossHp: config.hero.maxHp,
      minionTime: minionFight.time,
      bossTime: 0,
    };
  }
  const bossFight = simulateFight(makeEncounter('boss', allyCount), profile, rules, config.time.sessionMaxSeconds);
  return {
    time: tutorial + minionFight.time + bridge + bossFight.time,
    outcome: bossFight.outcome,
    minionHp: minionFight.hp,
    bossHp: bossFight.hp,
    minionTime: minionFight.time,
    bossTime: bossFight.time,
  };
}

export function makeEncounter(id: EncounterId, allyCount: number): AtbBattle {
  const encounter = config.encounters[id];
  const heroSpeed = fillSeconds(config.atb.heroFill);
  const allySpeed = id === 'tutorial' ? 0 : fillSeconds(config.atb.allyFill);
  const party = [
    { maxHp: config.hero.maxHp, attack: config.hero.attack, speed: heroSpeed },
    ...Array.from({ length: allyCount }, () => ({
      maxHp: config.ally.maxHp,
      attack: config.ally.attack,
      speed: allySpeed,
    })),
  ];
  return createAtbBattle({
    party,
    enemy: {
      maxHp: encounter.hp,
      attack: encounter.attack,
      speed: fillSeconds(config.atb.enemyFill[id]),
    },
    pattern: encounter.pattern,
  });
}

function clampGauge(current: number, speed: number, dt: number): number {
  const next = current + speed * dt;
  if (next >= 1 - 1e-6) return 1;
  return Math.max(0, next);
}

function gaugeFighter(maxHp: number, attack: number, speed: number): GaugeFighter {
  return { hp: maxHp, maxHp, attack, multiplier: 1, gauge: 0, speed, guarding: false };
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
