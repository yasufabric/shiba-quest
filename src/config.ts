/**
 * Every tuning number for しばクエスト lives here.
 *
 * Pace (solo hero, no ally):
 *   Strike every 3rd turn. The mark "!" is up on that turn; guard zeros it.
 *   Charge doubles the next attack: x2, x4, x8, x16, and x16 is the cap.
 *   The intended turn is: kill if this swing finishes, else guard a lethal
 *   telegraph, else release at x16, else charge.
 *   That line drops the minion on turn 13 and the boss on turn 17.
 *   At 5 seconds a turn, both sits inside 60–120 seconds, and the
 *   tutorial plus both fights stays under 3 minutes.
 *   An ally is extra damage and is not part of this measurement.
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
    /** Data-model ceiling. The prototype recruits one. */
    maxCount: 4,
    prototypeRecruits: 1,
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
      hp: 32,
      attack: 0,
      pattern: ['windup'] as const,
    },
    minion: {
      hp: 480,
      attack: 16,
      pattern: ['windup', 'windup', 'strike'] as const,
    },
    boss: {
      hp: 680,
      attack: 20,
      pattern: ['windup', 'windup', 'strike'] as const,
    },
  },
  campaign: {
    order: ['minion', 'boss'] as const,
    /** Full game shape. The prototype plays `order` only. */
    fullMinionsBeforeBoss: 3,
    combo: {
      id: 'quad-charge' as const,
      alliesRequired: 4,
      enabled: false,
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

export type Command = (typeof config.tutorial.steps)[number] | 'guard';
export type EncounterId = keyof typeof config.encounters;
export type CampaignId = (typeof config.campaign.order)[number];

export const minFightTurns = Math.ceil(
  config.time.minFightSeconds / config.time.turnSeconds,
);
export const maxFightTurns = Math.floor(
  config.time.maxFightSeconds / config.time.turnSeconds,
);
