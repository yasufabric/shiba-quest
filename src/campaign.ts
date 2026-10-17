import { config, type CampaignId } from './config';

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
    encounter: config.campaign.order[0],
    recruitPending: false,
  };
}

export function grantBone(save: SaveData): SaveData {
  return { ...save, bones: save.bones + 1 };
}

/** Spend one bone to field the next shiba, up to four. */
export function recruitAlly(save: SaveData): SaveData | null {
  if (save.bones < 1) return null;
  if (save.allies >= config.ally.maxCount) return null;
  return { ...save, bones: save.bones - 1, allies: save.allies + 1 };
}

export function keepRecruiting(save: SaveData): boolean {
  return save.bones >= 1 && save.allies < config.ally.maxCount;
}

/**
 * A win banks one bone and walks the campaign.
 * Minion bones wait. The recruit screen opens after the boss, one ally at a time.
 * The tutorial never calls this.
 */
export function resolveWin(save: SaveData, defeated: CampaignId): SaveData {
  const paid = grantBone(save);
  return {
    ...paid,
    encounter: nextEncounter(defeated),
    recruitPending: defeated === 'boss' && paid.allies < config.ally.maxCount,
  };
}

export function nextEncounter(current: CampaignId): CampaignId {
  const order = config.campaign.order;
  const index = order.indexOf(current);
  const next = order[(index + 1) % order.length];
  return next ?? order[0];
}

/** Scripted hits, including the tutorial 9999, never enter the record. */
export function noteDamage(save: SaveData, damage: number, scripted = false): SaveData {
  if (scripted) return save;
  if (damage <= save.bestDamage) return save;
  return { ...save, bestDamage: damage };
}
