import { describe, expect, it } from 'vitest';
import { config, maxFightTurns, minFightTurns } from './config';
import { defaultSave, grantBone, nextEncounter, recruitAlly } from './campaign';
import { intentAt, pacePolicy, quadChargeReady, simulate, step } from './combat';
import { makeBattle } from './setup';

const rules = { chargeCap: config.charge.cap };

describe('charge', () => {
  it('doubles through x16 and then stays there', () => {
    let battle = makeBattle('minion', 0);
    const seen: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      const result = step(battle, 'charge', rules);
      battle = result.battle;
      seen.push(battle.hero.multiplier);
    }
    expect(seen).toEqual([2, 4, 8, 16, 16]);
    expect(battle.hero.multiplier).toBe(16);
  });

  it('resets to x1 when the hero attacks', () => {
    let battle = makeBattle('minion', 0);
    battle = step(battle, 'charge', rules).battle;
    battle = step(battle, 'charge', rules).battle;
    const result = step(battle, 'attack', rules);
    expect(result.heroDamage).toBe(config.hero.attack * 4);
    expect(result.battle.hero.multiplier).toBe(1);
  });
});

describe('guard', () => {
  it('zeros a telegraphed hit and leaves charge intact', () => {
    let battle = makeBattle('minion', 0);
    battle = step(battle, 'charge', rules).battle;
    while (intentAt(battle) !== 'strike') {
      battle = step(battle, 'charge', rules).battle;
    }
    const hp = battle.hero.hp;
    const multiplier = battle.hero.multiplier;
    const result = step(battle, 'guard', rules);
    expect(result.intent).toBe('strike');
    expect(result.guarded).toBe(true);
    expect(result.enemyDamage).toBe(0);
    expect(result.battle.hero.hp).toBe(hp);
    expect(result.battle.hero.multiplier).toBe(multiplier);
  });

  it('lets an unguarded telegraph deal the enemy attack', () => {
    let battle = makeBattle('boss', 0);
    while (intentAt(battle) !== 'strike') {
      battle = step(battle, 'charge', rules).battle;
    }
    const result = step(battle, 'charge', rules);
    expect(result.enemyDamage).toBe(config.encounters.boss.attack);
    expect(result.battle.hero.hp).toBe(battle.hero.hp - config.encounters.boss.attack);
  });
});

describe('tutorial', () => {
  it('deals 9999 on the guided attack', () => {
    let battle = makeBattle('tutorial', 0);
    for (const command of config.tutorial.steps) {
      const forceDamage = command === 'attack' ? config.tutorial.damage : undefined;
      const result = step(battle, command, rules, { forceDamage });
      battle = result.battle;
      if (command === 'attack') {
        expect(result.heroDamage).toBe(9999);
        expect(battle.outcome).toBe('win');
        expect(battle.enemy.hp).toBe(0);
      }
    }
  });
});

describe('fight length', () => {
  it('drops the minion and the boss inside the one-to-two minute window', () => {
    const minion = simulate(makeBattle('minion', 0), (battle) => pacePolicy(battle, rules.chargeCap), rules, 80);
    const boss = simulate(makeBattle('boss', 0), (battle) => pacePolicy(battle, rules.chargeCap), rules, 80);

    expect(minion.battle.outcome).toBe('win');
    expect(boss.battle.outcome).toBe('win');
    expect(minion.turns).toBeGreaterThanOrEqual(minFightTurns);
    expect(minion.turns).toBeLessThanOrEqual(maxFightTurns);
    expect(boss.turns).toBeGreaterThanOrEqual(minFightTurns);
    expect(boss.turns).toBeLessThanOrEqual(maxFightTurns);

    const sessionSeconds =
      config.tutorial.seconds + (minion.turns + boss.turns) * config.time.turnSeconds;
    expect(sessionSeconds).toBeLessThanOrEqual(config.time.sessionMaxSeconds);
    expect(minion.turns * config.time.turnSeconds).toBeGreaterThanOrEqual(config.time.minFightSeconds);
    expect(boss.turns * config.time.turnSeconds).toBeGreaterThanOrEqual(config.time.minFightSeconds);
  });
});

describe('room for the full game', () => {
  it('keeps the four-ally combo unbuilt', () => {
    expect(quadChargeReady(4, config.campaign.combo)).toBe(false);
    expect(config.campaign.fullMinionsBeforeBoss).toBe(3);
    expect(config.ally.maxCount).toBe(4);
  });

  it('gives a bone on a win and recruits a single ally', () => {
    let save = grantBone(defaultSave());
    expect(save.bones).toBe(1);
    const recruited = recruitAlly(save);
    expect(recruited).toEqual({ ...save, bones: 0, allies: 1 });
    save = grantBone(recruited ?? save);
    expect(recruitAlly(save)).toBeNull();
    expect(nextEncounter('minion')).toBe('boss');
    expect(nextEncounter('boss')).toBe('minion');
  });
});
