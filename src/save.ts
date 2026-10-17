import { config, type CampaignId } from './config';
import { defaultSave, type SaveData } from './campaign';

const KEY = 'shiba-quest';

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaultSave();
    const record = parsed as Partial<SaveData>;
    const save = defaultSave();
    if (record.tutorialDone === true) save.tutorialDone = true;
    if (typeof record.bestDamage === 'number' && record.bestDamage > 0) {
      save.bestDamage = Math.floor(record.bestDamage);
    }
    if (typeof record.bones === 'number' && record.bones > 0) {
      save.bones = Math.min(99, Math.floor(record.bones));
    }
    if (typeof record.allies === 'number' && record.allies > 0) {
      save.allies = Math.min(config.ally.maxCount, Math.floor(record.allies));
    }
    if (record.encounter === 'minion' || record.encounter === 'boss') {
      save.encounter = record.encounter satisfies CampaignId;
    }
    if (record.recruitPending === true) save.recruitPending = true;
    return save;
  } catch {
    return defaultSave();
  }
}

export function writeSave(save: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Private mode and full storage still play; the record just stays in memory.
  }
}
