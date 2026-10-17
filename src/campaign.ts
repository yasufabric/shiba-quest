import { config, type CampaignId } from './config';

export interface SaveData {
  tutorialDone: boolean;
  bestDamage: number;
  bones: number;
  allies: number;
  encounter: CampaignId;
  /** Boss is down and a bone is waiting to call the first ally. */
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

/** Spend one bone to field the next shiba, up to the prototype cap. */
export function recruitAlly(save: SaveData): SaveData | null {
  if (save.bones < 1) return null;
  if (save.allies >= config.ally.prototypeRecruits) return null;
  if (save.allies >= config.ally.maxCount) return null;
  return { ...save, bones: save.bones - 1, allies: save.allies + 1 };
}

export function nextEncounter(current: CampaignId): CampaignId {
  const order = config.campaign.order;
  const index = order.indexOf(current);
  const next = order[(index + 1) % order.length];
  return next ?? order[0];
}

export function noteDamage(save: SaveData, damage: number): SaveData {
  if (damage <= save.bestDamage) return save;
  return { ...save, bestDamage: damage };
}
