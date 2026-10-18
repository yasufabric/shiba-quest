import { describe, expect, it } from 'vitest';
import { config, maxFightTurns, minFightTurns } from './config';
import { acceptRecruit, continueAfterBoss, defaultSave, keepRecruiting, noteDamage, pickMinion, recruitAlly, resolveWin } from './campaign';
import { intentAt, pacePolicy, quadChargeReady, simulate, step } from './combat';
import { commandMenu, fingerHint } from './menu';
import { makeBattle } from './setup';
import { akitaSprite, allySprites, chihuahuaSprite, corgiSprite, dachshundSprite, hero, heroDown, heroGuard, pugSprite, type Sprite } from './sprites';

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

describe('fight length', () => {
  it('keeps tutorial plus any minion plus the boss within three minutes', () => {
    const boss = simulate(makeBattle('boss', 0), (battle) => pacePolicy(battle, rules.chargeCap), rules, 80);
    expect(boss.battle.outcome).toBe('win');
    expect(boss.turns).toBe(17);
    const bossSeconds = boss.turns * config.time.turnSeconds;
    expect(bossSeconds).toBe(85);

    const measured = config.campaign.minions.map((id) => {
      const sim = simulate(makeBattle(id, 0), (battle) => pacePolicy(battle, rules.chargeCap), rules, 80);
      expect(sim.battle.outcome).toBe('win');
      expect(sim.turns).toBeGreaterThanOrEqual(minFightTurns);
      expect(sim.turns).toBeLessThanOrEqual(maxFightTurns);
      const seconds = sim.turns * config.time.turnSeconds;
      const sum = config.tutorial.seconds + seconds + bossSeconds;
      expect(sum).toBeLessThanOrEqual(config.time.sessionMaxSeconds);
      return { id, turns: sim.turns, seconds, sum };
    });

    expect(measured).toEqual([
      { id: 'minion', turns: 13, seconds: 65, sum: 162 },
      { id: 'minion2', turns: 14, seconds: 70, sum: 167 },
      { id: 'minion3', turns: 15, seconds: 75, sum: 172 },
    ]);
    expect(config.tutorial.seconds).toBe(12);
  });
});

describe('variety', () => {
  it('gives each foe its own pattern and a same-turn ! that guard cancels', () => {
    const ids = ['minion', 'minion2', 'minion3', 'boss'] as const;
    const patterns = ids.map((id) => config.encounters[id].pattern.join(','));
    expect(new Set(patterns).size).toBe(ids.length);
    for (const id of ids) {
      let battle = makeBattle(id, 0);
      const pattern = config.encounters[id].pattern;
      expect(pattern.includes('strike')).toBe(true);
      for (const intent of pattern) {
        expect(intentAt(battle)).toBe(intent);
        if (intent === 'strike') {
          const guarded = step(battle, 'guard', rules);
          expect(guarded.enemyDamage).toBe(0);
          expect(guarded.guarded).toBe(true);
        }
        battle = step(battle, 'charge', rules).battle;
      }
    }
  });
});

describe('campaign', () => {
  it('plays one random minion then the boss, and fills the party across runs', () => {
    expect(config.campaign.minions).toEqual(['minion', 'minion2', 'minion3']);
    expect(pickMinion(0)).toBe('minion');
    expect(pickMinion(0.2)).toBe('minion');
    expect(pickMinion(0.5)).toBe('minion2');
    expect(pickMinion(0.99)).toBe('minion3');

    let save = resolveWin(defaultSave(), 'minion2');
    expect(save).toMatchObject({ bones: 1, allies: 0, encounter: 'boss', recruitPending: false });
    save = resolveWin(save, 'boss', 0.99);
    expect(save).toMatchObject({ bones: 2, allies: 0, encounter: 'minion3', recruitPending: true });
    expect(continueAfterBoss(save)).toBe('recruit');

    save = acceptRecruit(save) ?? save;
    expect(save).toMatchObject({ allies: 1, bones: 1, recruitPending: false, encounter: 'minion3' });
    expect(keepRecruiting(save)).toBe(true);
    expect(continueAfterBoss(save)).toBe('fight');

    save = resolveWin(save, 'minion3');
    save = resolveWin(save, 'boss', 0);
    expect(save.bones).toBe(3);
    save = acceptRecruit(save) ?? save;
    expect(save).toMatchObject({ allies: 2, bones: 2, recruitPending: false });

    save = resolveWin(save, 'minion');
    save = resolveWin(save, 'boss', 0);
    save = acceptRecruit(save) ?? save;
    save = resolveWin(save, 'minion2');
    save = resolveWin(save, 'boss', 0.5);
    save = acceptRecruit(save) ?? save;
    expect(save).toMatchObject({ allies: 4, bones: 4, recruitPending: false });
    expect(recruitAlly(save)).toBeNull();
    expect(acceptRecruit(save)).toBeNull();
    const capped = resolveWin(save, 'boss', 0.5);
    expect(capped.recruitPending).toBe(false);
    expect(continueAfterBoss(capped)).toBe('fight');
    expect(capped.allies).toBe(4);
    expect(capped.encounter).toBe('minion2');
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
    let battle = makeBattle('minion', 0);
    expect(pacePolicy(battle, rules.chargeCap)).toBe('charge');
    const charging = commandMenu({ tutorialStep: null, comboReady: false, open: true, suggest: 'charge' });
    expect(charging.charge.hot).toBe(true);
    expect(charging.attack.hot).toBe(false);
    expect(charging.attack.disabled).toBe(false);
    expect(charging.guard.disabled).toBe(false);

    while (intentAt(battle) !== 'strike') battle = step(battle, 'charge', rules).battle;
    const threatened = { ...battle, hero: { ...battle.hero, hp: battle.enemy.attack } };
    expect(pacePolicy(threatened, rules.chargeCap)).toBe('guard');
    const guarding = commandMenu({ tutorialStep: null, comboReady: false, open: true, suggest: 'guard' });
    expect(guarding.guard.hot).toBe(true);
    expect(guarding.attack.hot).toBe(false);
    expect(guarding.charge.hot).toBe(false);

    const ready = { ...battle, hero: { ...battle.hero, multiplier: rules.chargeCap } };
    expect(pacePolicy(ready, rules.chargeCap)).toBe('attack');
    const releasing = commandMenu({ tutorialStep: null, comboReady: false, open: true, suggest: 'attack' });
    expect(releasing.attack.hot).toBe(true);
    expect(releasing.charge.hot).toBe(false);
  });
});

describe('combo', () => {
  it('charges all four allies and strikes at once for the cap', () => {
    expect(quadChargeReady(4, config.campaign.combo)).toBe(true);
    expect(quadChargeReady(3, config.campaign.combo)).toBe(false);
    const open = commandMenu({ tutorialStep: null, comboReady: true, open: true });
    expect(open.combo.hidden).toBe(false);
    expect(open.combo.disabled).toBe(false);
    expect(open.attack.hidden).toBe(false);

    let battle = makeBattle('minion3', 4);
    battle = step(battle, 'charge', rules).battle;
    const before = battle.enemy.hp;
    const result = step(battle, 'combo', rules);
    const each = config.ally.attack * config.charge.cap;
    expect(result.heroDamage).toBe(0);
    expect(result.battle.hero.multiplier).toBe(2);
    expect(result.allyDamage).toEqual([each, each, each, each]);
    expect(result.battle.enemy.hp).toBe(Math.max(0, before - each * 4));
    expect(result.battle.outcome).toBe(before <= each * 4 ? 'win' : 'ongoing');
    expect(result.battle.allies.every((ally) => ally.multiplier === 1)).toBe(true);
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
