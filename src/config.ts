/**
 * Every tuning number for しばクエスト lives here.
 *
 * Active Time Battle. The hero and three shibas all fight from the first battle.
 *   Gauges fill in real time. The command window opens when a member is full.
 *   The enemy acts on its own gauge, including while the window is open.
 *   "!" shows once a strike gauge passes the telegraph mark. まもる zeros that hit.
 *   Charge doubles the actor's next attack: x2, x4, x8, x16, and x16 is the cap.
 *   A fresh run is the tutorial, one random minion, then the boss, near 3 minutes.
 *   A prompt player should win with life left, not a full bar. A hesitant player can still win.
 */
export const config = {
  time: {
    turnSeconds: 5,
    minFightSeconds: 60,
    maxFightSeconds: 120,
    sessionMaxSeconds: 200,
  },
  atb: {
    /** Seconds for a gauge to fill from empty. */
    heroFill: 2,
    allyFill: 7,
    telegraphAt: 0.08,
    promptDelay: 0.4,
    hesitantMin: 1.45,
    hesitantMax: 2.6,
    /** Chance a hesitant player charges through a telegraph they meant to guard. */
    hesitantMiss: 0.58,
    anim: {
      charge: 0.34,
      attack: 0.45,
      guard: 0.3,
      windup: 0.16,
      strike: 0.42,
      shatter: 1.75,
    },
    enemyFill: {
      tutorial: 0,
      minion: 4.19,
      minion2: 4.44,
      minion3: 3.94,
      boss: 3.81,
    },
  },
  hero: {
    maxHp: 96,
    attack: 14,
  },
  ally: {
    maxHp: 48,
    attack: 6,
    maxCount: 4,
    /** しば plus these three. ちび stays in the art and is not fielded. */
    fieldCount: 3,
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
    seconds: 10,
  },
  encounters: {
    tutorial: {
      name: 'こぎ',
      hp: 32,
      attack: 0,
      pattern: ['windup'] as const,
    },
    minion: {
      name: 'ちわわ',
      hp: 958,
      attack: 16,
      pattern: ['windup', 'windup', 'strike'] as const,
    },
    minion2: {
      name: 'だくす',
      hp: 851,
      attack: 12,
      pattern: ['windup', 'strike'] as const,
    },
    minion3: {
      name: 'ぱぐ',
      hp: 1040,
      attack: 14,
      pattern: ['windup', 'windup', 'windup', 'strike'] as const,
    },
    boss: {
      name: 'あきた',
      hp: 1055,
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
    /** Held after a minion win, between the bone and the boss. */
    victoryHoldMs: 1600,
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
