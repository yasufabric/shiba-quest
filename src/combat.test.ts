import { describe, expect, it } from 'vitest';
import { config } from './config';
import { continueAfterBoss, defaultSave, noteDamage, pickMinion, resolveWin } from './campaign';
import { quadChargeReady } from './combat';
import {
  act,
  enemyIntent,
  enemyReady,
  fillGauges,
  hesitantProfile,
  makeEncounter,
  promptProfile,
  resolveEnemy,
  simulateSession,
  suggestCommand,
  telegraph,
  tutorialSeconds,
  type AtbBattle,
  type AtbRules,
} from './atb';
import { commandMenu, fingerHint } from './menu';
import { akitaSprite, allySprites, chihuahuaSprite, corgiSprite, dachshundSprite, hero, heroDown, heroGuard, pugSprite, type Sprite } from './sprites';

const rules: AtbRules = { chargeCap: config.charge.cap, telegraphAt: config.atb.telegraphAt };

function openWindow(battle: AtbBattle, index = 0): AtbBattle {
  return {
    ...battle,
    acting: index,
    queue: [],
    party: battle.party.map((member, memberIndex) => (memberIndex === index ? { ...member, gauge: 1 } : member)),
  };
}

describe('charge', () => {
  it('doubles through x16 and then stays there', () => {
    let battle = openWindow(makeEncounter('minion', 0));
    const seen: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      battle = openWindow(act(battle, 'charge', rules).battle);
      seen.push(battle.party[0]?.multiplier);
    }
    expect(seen).toEqual([2, 4, 8, 16, 16]);
  });

  it('resets to x1 when the hero attacks', () => {
    let battle = openWindow(makeEncounter('minion', 0));
    battle = openWindow(act(battle, 'charge', rules).battle);
    battle = openWindow(act(battle, 'charge', rules).battle);
    const result = act(battle, 'attack', rules);
    expect(result.damage).toBe(config.hero.attack * 4);
    expect(result.battle.party[0]?.multiplier).toBe(1);
  });
});

describe('atb', () => {
  it('opens the command window when a gauge fills', () => {
    let battle = makeEncounter('minion', 0);
    battle = fillGauges(battle, config.atb.heroFill - 0.05);
    expect(battle.acting).toBeNull();
    battle = fillGauges(battle, 0.1);
    expect(battle.acting).toBe(0);
    expect(battle.party[0]?.gauge).toBe(1);
  });

  it('lets the enemy finish its gauge while the window is open', () => {
    let battle = makeEncounter('boss', 0);
    while (enemyIntent(battle) !== 'strike') {
      battle = resolveEnemy({ ...battle, enemy: { ...battle.enemy, gauge: 1 } }).battle;
    }
    battle = openWindow(battle);
    battle = { ...battle, pause: 0, enemy: { ...battle.enemy, gauge: 0 } };
    battle = fillGauges(battle, config.atb.enemyFill.boss);
    expect(battle.acting).toBe(0);
    expect(enemyReady(battle)).toBe(true);
    const hit = resolveEnemy(battle);
    expect(hit.intent).toBe('strike');
    expect(hit.damage).toBe(config.encounters.boss.attack);
    expect(hit.battle.party[0]?.hp).toBe(config.hero.maxHp - config.encounters.boss.attack);
  });

  it('keeps the tutorial foe from acting', () => {
    let battle = makeEncounter('tutorial', 0);
    battle = fillGauges(battle, 30);
    expect(battle.enemy.speed).toBe(0);
    expect(enemyReady(battle)).toBe(false);
    expect(battle.party[0]?.gauge).toBe(1);
  });
});

describe('guard', () => {
  it('zeros a telegraphed hit and leaves charge intact', () => {
    let battle = openWindow(makeEncounter('minion', 0));
    battle = openWindow(act(battle, 'charge', rules).battle);
    while (enemyIntent(battle) !== 'strike') {
      battle = resolveEnemy({ ...battle, enemy: { ...battle.enemy, gauge: 1 } }).battle;
    }
    const hp = battle.party[0]?.hp;
    const multiplier = battle.party[0]?.multiplier;
    battle = openWindow(act(openWindow(battle), 'guard', rules).battle);
    expect(battle.party[0]?.guarding).toBe(true);
    const result = resolveEnemy({ ...battle, enemy: { ...battle.enemy, gauge: 1 } });
    expect(result.intent).toBe('strike');
    expect(result.guarded).toBe(true);
    expect(result.damage).toBe(0);
    expect(result.battle.party[0]?.hp).toBe(hp);
    expect(result.battle.party[0]?.multiplier).toBe(multiplier);
  });

  it('lets an unguarded telegraph deal the enemy attack', () => {
    let battle = makeEncounter('boss', 0);
    while (enemyIntent(battle) !== 'strike') {
      battle = resolveEnemy({ ...battle, enemy: { ...battle.enemy, gauge: 1 } }).battle;
    }
    battle = { ...battle, enemy: { ...battle.enemy, gauge: rules.telegraphAt } };
    expect(telegraph(battle, rules.telegraphAt)).toBe(true);
    const result = resolveEnemy({ ...battle, enemy: { ...battle.enemy, gauge: 1 } });
    expect(result.damage).toBe(config.encounters.boss.attack);
    expect(result.battle.party[0]?.hp).toBe(config.hero.maxHp - config.encounters.boss.attack);
  });
});

describe('tutorial', () => {
  it('deals 9999 on the guided attack', () => {
    let battle = openWindow(makeEncounter('tutorial', 0));
    for (const command of config.tutorial.steps) {
      const forceDamage = command === 'attack' ? config.tutorial.damage : undefined;
      const result = act(openWindow(battle), command, rules, forceDamage);
      battle = result.battle;
      if (command === 'attack') {
        expect(result.damage).toBe(9999);
        expect(battle.outcome).toBe('win');
        expect(battle.enemy.hp).toBe(0);
      }
    }
  });
});

describe('session', () => {
  it('keeps a prompt session near three minutes without a full life bar', () => {
    expect(tutorialSeconds()).toBeGreaterThan(8);
    expect(tutorialSeconds()).toBeLessThan(14);
    for (const id of config.campaign.minions) {
      const report = simulateSession(promptProfile(), id, config.ally.fieldCount, rules);
      expect(report.outcome).toBe('win');
      expect(report.time).toBeGreaterThanOrEqual(140);
      expect(report.time).toBeLessThanOrEqual(config.time.sessionMaxSeconds);
      expect(report.bossHp).toBeGreaterThan(config.hero.maxHp * 0.15);
      expect(report.bossHp).toBeLessThanOrEqual(config.hero.maxHp * 0.5);
      expect(report.minionHp).toBeGreaterThan(0);
      expect(report.minionHp).toBeLessThan(config.hero.maxHp);
    }
  });

  it('lets a hesitant player win some sessions and lose others', () => {
    const seeds = 40;
    for (const id of config.campaign.minions) {
      let wins = 0;
      for (let seed = 1; seed <= seeds; seed += 1) {
        const report = simulateSession(hesitantProfile(seed), id, config.ally.fieldCount, rules);
        if (report.outcome === 'win') wins += 1;
      }
      expect(wins / seeds).toBeGreaterThanOrEqual(0.25);
      expect(wins / seeds).toBeLessThanOrEqual(0.75);
    }
  });
});

describe('variety', () => {
  it('gives each foe its own pattern and a strike guard can cancel', () => {
    const ids = ['minion', 'minion2', 'minion3', 'boss'] as const;
    const patterns = ids.map((id) => config.encounters[id].pattern.join(','));
    expect(new Set(patterns).size).toBe(ids.length);
    for (const id of ids) {
      let battle = makeEncounter(id, 0);
      const pattern = config.encounters[id].pattern;
      expect(pattern.includes('strike')).toBe(true);
      for (const intent of pattern) {
        expect(enemyIntent(battle)).toBe(intent);
        if (intent === 'strike') {
          const guarded = resolveEnemy({
            ...openWindow(act(openWindow(battle), 'guard', rules).battle),
            enemy: { ...battle.enemy, gauge: 1 },
          });
          expect(guarded.damage).toBe(0);
          expect(guarded.guarded).toBe(true);
        }
        battle = resolveEnemy({ ...battle, enemy: { ...battle.enemy, gauge: 1 } }).battle;
      }
    }
  });
});

describe('campaign', () => {
  it('fields four shibas without spending bones, and banks a bone on each win', () => {
    expect(config.campaign.minions).toEqual(['minion', 'minion2', 'minion3']);
    expect(config.ally.fieldCount).toBe(3);
    expect(makeEncounter('minion', config.ally.fieldCount).party).toHaveLength(4);
    expect(makeEncounter('tutorial', config.ally.fieldCount).party.slice(1).every((member) => member.speed === 0)).toBe(true);
    expect(pickMinion(0)).toBe('minion');
    expect(pickMinion(0.2)).toBe('minion');
    expect(pickMinion(0.5)).toBe('minion2');
    expect(pickMinion(0.99)).toBe('minion3');

    let save = resolveWin(defaultSave(), 'minion2');
    expect(save).toMatchObject({ bones: 1, allies: 0, encounter: 'boss', recruitPending: false });
    save = resolveWin(save, 'boss', 0.99);
    expect(save).toMatchObject({ bones: 2, allies: 0, encounter: 'minion3', recruitPending: false });
    expect(continueAfterBoss()).toBe('fight');
    expect(save.bones).toBe(2);

    const stuck = { ...save, recruitPending: true, bones: 2 };
    expect(resolveWin(stuck, 'minion').recruitPending).toBe(false);
    expect(continueAfterBoss()).toBe('fight');
  });
});

describe('record', () => {
  it('ignores the scripted tutorial 9999 and keeps real hits', () => {
    const fresh = defaultSave();
    expect(noteDamage(fresh, config.tutorial.damage, true)).toBe(fresh);
    const real = noteDamage(fresh, 224);
    expect(real.bestDamage).toBe(224);
    expect(noteDamage(real, 9999, true).bestDamage).toBe(224);
    expect(noteDamage(real, 56).bestDamage).toBe(224);
    expect(noteDamage(real, 448).bestDamage).toBe(448);
  });
});

describe('tutorial commands', () => {
  it('shows all three labels and highlights only the guided one', () => {
    const charge = commandMenu({ tutorialStep: 0, comboReady: true, open: true });
    expect(charge.attack.hidden).toBe(false);
    expect(charge.charge.hidden).toBe(false);
    expect(charge.guard.hidden).toBe(false);
    expect(charge.charge.hot).toBe(true);
    expect(charge.charge.disabled).toBe(false);
    expect(charge.attack.disabled).toBe(true);
    expect(charge.guard.disabled).toBe(true);
    expect(charge.attack.hot).toBe(false);
    expect(charge.guard.hot).toBe(false);
    expect(charge.combo.hidden).toBe(true);

    const stillCharging = commandMenu({ tutorialStep: 1, comboReady: false, open: true });
    expect(stillCharging.charge.hot).toBe(true);
    expect(stillCharging.attack.disabled).toBe(true);
    expect(stillCharging.guard.disabled).toBe(true);

    const attack = commandMenu({ tutorialStep: 2, comboReady: false, open: true });
    expect(attack.attack.hot).toBe(true);
    expect(attack.attack.disabled).toBe(false);
    expect(attack.attack.hidden).toBe(false);
    expect(attack.charge.disabled).toBe(true);
    expect(attack.charge.hidden).toBe(false);
    expect(attack.guard.disabled).toBe(true);
    expect(attack.guard.hidden).toBe(false);
    expect(attack.combo.hidden).toBe(true);
  });

  it('points the drawn hand only while the tutorial menu is open', () => {
    expect(fingerHint(0, true)).toBe(true);
    expect(fingerHint(2, true)).toBe(true);
    expect(fingerHint(null, true)).toBe(false);
    expect(fingerHint(0, false)).toBe(false);
  });
});

describe('free-play cursor', () => {
  it('follows charge or guard on a telegraph instead of sticking on attack', () => {
    let battle = openWindow(makeEncounter('minion', 0));
    expect(suggestCommand(battle, rules)).toBe('charge');
    const charging = commandMenu({ tutorialStep: null, comboReady: false, open: true, suggest: 'charge' });
    expect(charging.charge.hot).toBe(true);
    expect(charging.attack.hot).toBe(false);
    expect(charging.attack.disabled).toBe(false);
    expect(charging.guard.disabled).toBe(false);

    while (enemyIntent(battle) !== 'strike') {
      battle = resolveEnemy({ ...battle, enemy: { ...battle.enemy, gauge: 1 } }).battle;
    }
    const hero = battle.party[0];
    if (!hero) throw new Error('missing hero');
    const threatened = openWindow({
      ...battle,
      enemy: { ...battle.enemy, gauge: 1 },
      party: [{ ...hero, hp: battle.enemy.attack, gauge: 1 }],
    });
    expect(telegraph(threatened, rules.telegraphAt)).toBe(true);
    expect(suggestCommand(threatened, rules)).toBe('guard');
    const guarding = commandMenu({ tutorialStep: null, comboReady: false, open: true, suggest: 'guard' });
    expect(guarding.guard.hot).toBe(true);
    expect(guarding.attack.hot).toBe(false);
    expect(guarding.charge.hot).toBe(false);

    const ready = openWindow({
      ...battle,
      enemy: { ...battle.enemy, gauge: 0 },
      party: [{ ...hero, multiplier: rules.chargeCap, gauge: 1 }],
    });
    expect(suggestCommand(ready, rules)).toBe('attack');
    const releasing = commandMenu({ tutorialStep: null, comboReady: false, open: true, suggest: 'attack' });
    expect(releasing.attack.hot).toBe(true);
    expect(releasing.charge.hot).toBe(false);
  });
});

describe('combo', () => {
  it('spends every ally at the charge cap in one swing', () => {
    expect(quadChargeReady(4, config.campaign.combo)).toBe(true);
    expect(quadChargeReady(3, config.campaign.combo)).toBe(false);
    const open = commandMenu({ tutorialStep: null, comboReady: true, open: true });
    expect(open.combo.hidden).toBe(false);
    expect(open.combo.disabled).toBe(false);
    expect(open.attack.hidden).toBe(false);

    let battle = openWindow(makeEncounter('minion3', 4));
    battle = openWindow(act(battle, 'charge', rules).battle);
    const before = battle.enemy.hp;
    const result = act(battle, 'combo', rules);
    const each = config.ally.attack * config.charge.cap;
    expect(result.damage).toBe(each * 4);
    expect(result.battle.party[0]?.multiplier).toBe(2);
    expect(result.battle.enemy.hp).toBe(Math.max(0, before - each * 4));
    expect(result.battle.party.slice(1).every((ally) => ally.multiplier === 1)).toBe(true);
  });
});

describe('sprites', () => {
  it('ships a distinct original sprite for every foe and ally', () => {
    const foes = [corgiSprite, chihuahuaSprite, dachshundSprite, pugSprite, akitaSprite];
    expect(new Set(foes.map(spriteSignature)).size).toBe(foes.length);
    expect(akitaSprite.h).toBeGreaterThan(hero.h);
    expect(dachshundSprite.w).toBeGreaterThan(chihuahuaSprite.w);
    expect(allySprites).toHaveLength(config.ally.maxCount);
    expect(heroDown.rows).toHaveLength(heroDown.h);
    for (const row of heroDown.rows) expect(row).toHaveLength(heroDown.w);
    expectSprite(heroGuard);
    expect(spriteSignature(heroGuard)).not.toBe(spriteSignature(hero));
    const guardTop = heroGuard.rows.slice(0, 8).join('');
    expect(guardTop).not.toMatch(/[a-z0-9]/);
    const signatures = allySprites.map(spriteSignature);
    expect(new Set(signatures).size).toBe(signatures.length);
    for (const sprite of [...foes, ...allySprites]) expectSprite(sprite);
  });
});

function spriteSignature(sprite: Sprite): string {
  return sprite.rows.join('\n');
}

function expectSprite(sprite: Sprite): void {
  expect(sprite.rows).toHaveLength(sprite.h);
  expect(sprite.w).toBeGreaterThan(8);
  for (const row of sprite.rows) expect(row).toHaveLength(sprite.w);
}
