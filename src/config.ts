/**
 * Every tuning number for しばクエスト lives here.
 *
 * Pace (solo hero, no allies):
 *   The mark "!" is up on a strike turn; guard on that turn zeros it.
 *   Charge doubles the next attack: x2, x4, x8, x16, and x16 is the cap.
 *   The intended turn is: kill if this swing finishes, else guard a lethal
 *   telegraph, else release at x16, else charge.
 *   A run is one minion, then the boss. The minion is a random pick from
 *   こおに (13 turns, 65s), からす (14 turns, 70s), and がま (15 turns, 75s).
 *   The boss falls on turn 17 (85s).
 *   Tutorial (12s) plus that pair is 162s, 167s, or 172s, all within 180s.
 *   Allies add damage and are not part of this measurement.
 *   Spamming attack loses. Never guarding loses the boss.
 */
export const config = {
  time: {
    turnSeconds: 5,
    minFightSeconds: 60,
    maxFightSeconds: 120,
    sessionMaxSeconds: 180,
  },
  hero: {
    maxHp: 96,
    attack: 14,
  },
  ally: {
    maxHp: 48,
    attack: 10,
    maxCount: 4,
    /** Field order matches the ally sprites: くろ, しろ, ごま, ちび. */
    names: ['くろ', 'しろ', 'ごま', 'ちび'] as const,
  },
  charge: {
    cap: 16,
    /** Visual scale and glow, indexed by log2(multiplier). Not gold. */
    scales: [1, 1.08, 1.18, 1.32, 1.5],
    glows: [0, 0.28, 0.46, 0.68, 0.95],
  },
  tutorial: {
    steps: ['charge', 'charge', 'attack'] as const,
    damage: 9999,
    seconds: 12,
  },
  encounters: {
    tutorial: {
      name: 'だんご',
      hp: 32,
      attack: 0,
      pattern: ['windup'] as const,
    },
    minion: {
      name: 'こおに',
      hp: 480,
      attack: 16,
      pattern: ['windup', 'windup', 'strike'] as const,
    },
    minion2: {
      name: 'からす',
      hp: 500,
      attack: 18,
      pattern: ['windup', 'strike'] as const,
    },
    minion3: {
      name: 'がま',
      hp: 640,
      attack: 14,
      pattern: ['windup', 'windup', 'windup', 'strike'] as const,
    },
    boss: {
      name: 'まおう',
      hp: 620,
      attack: 20,
      pattern: ['windup', 'strike', 'windup', 'windup', 'strike'] as const,
    },
  },
  campaign: {
    /** One of these is picked at random for the minion fight. Then the boss. */
    minions: ['minion', 'minion2', 'minion3'] as const,
    boss: 'boss' as const,
    combo: {
      id: 'quad-charge' as const,
      alliesRequired: 4,
      enabled: true,
    },
  },
  juice: {
    chargeMs: 340,
    lungeMs: 160,
    impactHoldMs: 320,
    allyMs: 240,
    strikeMs: 340,
    shatterMs: 1750,
    guardMs: 300,
    boneMs: 780,
    hitStopMs: 90,
    shakeTutorial: 6,
    shakeHeavy: 3,
    shakeLight: 1.5,
    bigNumberScale: 6,
    numberScale: 2,
    takenScale: 2,
    numberLife: 0.95,
    bigNumberLife: 1.75,
  },
} as const;

export type Command = (typeof config.tutorial.steps)[number] | 'guard' | 'combo';
export type EncounterId = keyof typeof config.encounters;
export type MinionId = (typeof config.campaign.minions)[number];
export type CampaignId = MinionId | typeof config.campaign.boss;

export const minFightTurns = Math.ceil(
  config.time.minFightSeconds / config.time.turnSeconds,
);
export const maxFightTurns = Math.floor(
  config.time.maxFightSeconds / config.time.turnSeconds,
);
