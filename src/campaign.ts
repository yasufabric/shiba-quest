import { config, type CampaignId, type MinionId } from './config';

export interface SaveData {
  tutorialDone: boolean;
  bestDamage: number;
  bones: number;
  allies: number;
  encounter: CampaignId;
  /** A boss bone is waiting, and at least one ally slot is open. */
  recruitPending: boolean;
}

export function defaultSave(): SaveData {
  return {
    tutorialDone: false,
    bestDamage: 0,
    bones: 0,
    allies: 0,
    encounter: config.campaign.minions[0],
    recruitPending: false,
  };
}

export function grantBone(save: SaveData): SaveData {
  return { ...save, bones: save.bones + 1 };
}

/** `roll` is in [0, 1). Each slice of the pool is one minion. */
export function pickMinion(roll: number): MinionId {
  const pool = config.campaign.minions;
  const index = Math.min(pool.length - 1, Math.max(0, Math.floor(roll * pool.length)));
  return pool[index] ?? pool[0];
}

export function isCampaignId(value: unknown): value is CampaignId {
  if (value === config.campaign.boss) return true;
  return typeof value === 'string' && (config.campaign.minions as readonly string[]).includes(value);
}

/**
 * A win banks one bone. A minion leads to the boss. The boss leads to a new
 * random minion. The party is already fielded, so a bone never opens a recruit card.
 * The tutorial never calls this.
 */
export function resolveWin(save: SaveData, defeated: CampaignId, roll = 0): SaveData {
  const paid = grantBone(save);
  const bossDown = defeated === config.campaign.boss;
  return {
    ...paid,
    encounter: bossDown ? pickMinion(roll) : config.campaign.boss,
    recruitPending: false,
  };
}

/** The boss card dismisses into the next fight. Bones stay in the bank. */
export function continueAfterBoss(): 'fight' {
  return 'fight';
}

/** Scripted hits, including the tutorial 9999, never enter the record. */
export function noteDamage(save: SaveData, damage: number, scripted = false): SaveData {
  if (scripted) return save;
  if (damage <= save.bestDamage) return save;
  return { ...save, bestDamage: damage };
}
