import { config, type EncounterId } from './config';
import { createBattle, type Battle } from './combat';

export function makeBattle(id: EncounterId, allyCount: number): Battle {
  const encounter = config.encounters[id];
  const allies = Array.from({ length: allyCount }, () => ({
    maxHp: config.ally.maxHp,
    attack: config.ally.attack,
  }));
  return createBattle({
    hero: { maxHp: config.hero.maxHp, attack: config.hero.attack },
    enemy: { maxHp: encounter.hp, attack: encounter.attack },
    allies,
    pattern: encounter.pattern,
  });
}
