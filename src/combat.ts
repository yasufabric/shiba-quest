import type { Command } from './config';

export type Intent = 'windup' | 'strike';
export type Outcome = 'ongoing' | 'win' | 'lose';

export interface Fighter {
  hp: number;
  maxHp: number;
  attack: number;
  multiplier: number;
}

export interface Battle {
  hero: Fighter;
  allies: Fighter[];
  enemy: Fighter;
  pattern: readonly Intent[];
  /** 1-based index of the turn about to be played. */
  turn: number;
  outcome: Outcome;
}

export interface Rules {
  chargeCap: number;
}

export interface StepOptions {
  /** Replaces the hero's attack damage. Used for the scripted 9999. */
  forceDamage?: number;
}

export interface StrikeResult {
  battle: Battle;
  command: Command;
  heroDamage: number;
  allyDamage: number[];
  /** Damage the enemy dealt to the hero. Zero when guarded or no strike. */
  enemyDamage: number;
  intent: Intent;
  guarded: boolean;
}

export interface SimResult {
  battle: Battle;
  turns: number;
}

export function createBattle(input: {
  hero: Pick<Fighter, 'maxHp' | 'attack'>;
  enemy: Pick<Fighter, 'maxHp' | 'attack'>;
  allies?: Pick<Fighter, 'maxHp' | 'attack'>[];
  pattern: readonly Intent[];
}): Battle {
  if (input.pattern.length === 0) {
    throw new Error('enemy pattern is empty');
  }
  return {
    hero: fighter(input.hero.maxHp, input.hero.attack),
    allies: (input.allies ?? []).map((ally) => fighter(ally.maxHp, ally.attack)),
    enemy: fighter(input.enemy.maxHp, input.enemy.attack),
    pattern: input.pattern,
    turn: 1,
    outcome: 'ongoing',
  };
}

export function intentAt(battle: Battle): Intent {
  const index = (battle.turn - 1) % battle.pattern.length;
  return battle.pattern[index] ?? 'windup';
}

/**
 * Intended pace: finish a kill, guard a lethal telegraph, release at the
 * charge cap, otherwise keep charging.
 */
export function pacePolicy(battle: Battle, chargeCap: number): Command {
  const intent = intentAt(battle);
  const incoming = intent === 'strike' ? battle.enemy.attack : 0;
  const damage = battle.hero.attack * battle.hero.multiplier;
  if (damage >= battle.enemy.hp) return 'attack';
  if (incoming > 0 && battle.hero.hp <= incoming) return 'guard';
  if (battle.hero.multiplier >= chargeCap) return 'attack';
  return 'charge';
}

export function step(battle: Battle, command: Command, rules: Rules, options?: StepOptions): StrikeResult {
  if (battle.outcome !== 'ongoing') {
    return {
      battle,
      command,
      heroDamage: 0,
      allyDamage: battle.allies.map(() => 0),
      enemyDamage: 0,
      intent: intentAt(battle),
      guarded: false,
    };
  }

  const intent = intentAt(battle);
  const hero = { ...battle.hero };
  const enemy = { ...battle.enemy };
  let heroDamage = 0;

  switch (command) {
    case 'attack': {
      heroDamage = options?.forceDamage ?? hero.attack * hero.multiplier;
      enemy.hp -= heroDamage;
      hero.multiplier = 1;
      break;
    }
    case 'charge': {
      hero.multiplier = Math.min(rules.chargeCap, hero.multiplier * 2);
      break;
    }
    case 'guard':
      break;
    default: {
      const neverCommand: never = command;
      throw new Error(`unknown command ${String(neverCommand)}`);
    }
  }

  const allyDamage = battle.allies.map(() => 0);
  if (enemy.hp > 0) {
    battle.allies.forEach((ally, index) => {
      const dealt = ally.attack * ally.multiplier;
      allyDamage[index] = dealt;
      enemy.hp -= dealt;
    });
  }

  const guarded = command === 'guard' && intent === 'strike';
  let enemyDamage = 0;
  let outcome: Outcome = 'ongoing';
  if (enemy.hp <= 0) {
    enemy.hp = 0;
    outcome = 'win';
  } else if (intent === 'strike' && !guarded) {
    enemyDamage = enemy.attack;
    hero.hp -= enemyDamage;
    if (hero.hp <= 0) {
      hero.hp = 0;
      outcome = 'lose';
    }
  }

  return {
    battle: {
      hero,
      allies: battle.allies.map((ally) => ({ ...ally })),
      enemy,
      pattern: battle.pattern,
      turn: battle.turn + 1,
      outcome,
    },
    command,
    heroDamage,
    allyDamage,
    enemyDamage,
    intent,
    guarded,
  };
}

export function simulate(battle: Battle, policy: (battle: Battle) => Command, rules: Rules, maxTurns: number): SimResult {
  let current = battle;
  let turns = 0;
  while (current.outcome === 'ongoing' && turns < maxTurns) {
    const command = policy(current);
    current = step(current, command, rules).battle;
    turns += 1;
  }
  return { battle: current, turns };
}

/** The four-ally combo is reserved and stays off in this prototype. */
export function quadChargeReady(allyCount: number, combo: { enabled: boolean; alliesRequired: number }): boolean {
  return combo.enabled && allyCount >= combo.alliesRequired;
}

function fighter(maxHp: number, attack: number): Fighter {
  return { hp: maxHp, maxHp, attack, multiplier: 1 };
}
