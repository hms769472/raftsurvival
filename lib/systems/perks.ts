// Pure perk-tree model (RAFT-302).
//
// Three branches — Survivor, Fighter, Builder — each with 3 perks. Ranks are
// stored as a plain `Record<perkId, rank>` so it serialises into the save and
// the derived effects are a pure function of those ranks.

export type PerkBranch = 'survivor' | 'fighter' | 'builder';

export type PerkDef = {
  id: string;
  branch: PerkBranch;
  name: string;
  desc: string;
  maxRank: number;
};

export type PerkRanks = Record<string, number>;

/** Every perk costs exactly one perk point per rank. */
export const PERK_POINT_COST = 1;

export const PERK_BRANCHES: { id: PerkBranch; name: string; blurb: string }[] = [
  { id: 'survivor', name: 'SURVIVOR', blurb: 'Endure longer at sea' },
  { id: 'fighter', name: 'FIGHTER', blurb: 'Hit harder, live longer' },
  { id: 'builder', name: 'BUILDER', blurb: 'Cheaper, tougher builds' },
];

export const PERKS: PerkDef[] = [
  // Survivor
  { id: 's_hardy', branch: 'survivor', name: 'Hardy', desc: '-8% hunger drain per rank', maxRank: 3 },
  { id: 's_hydrated', branch: 'survivor', name: 'Hydrated', desc: '-8% thirst drain per rank', maxRank: 3 },
  { id: 's_regen', branch: 'survivor', name: 'Resilience', desc: '+0.01 hp/frame regen per rank', maxRank: 3 },
  // Fighter
  { id: 'f_might', branch: 'fighter', name: 'Might', desc: '+15% spear damage per rank', maxRank: 3 },
  { id: 'f_vigor', branch: 'fighter', name: 'Vigor', desc: '+0.5 max heart per rank', maxRank: 3 },
  { id: 'f_swift', branch: 'fighter', name: 'Swift', desc: '-10% attack cooldown per rank', maxRank: 3 },
  // Builder
  { id: 'b_thrift', branch: 'builder', name: 'Thrift', desc: '-8% structure cost per rank', maxRank: 3 },
  { id: 'b_sturdy', branch: 'builder', name: 'Sturdy', desc: '+20% structure HP per rank', maxRank: 3 },
  { id: 'b_shelter', branch: 'builder', name: 'Shelter', desc: '+0.01 roof regen per rank', maxRank: 3 },
];

export type PerkEffects = {
  /** Multiplies hunger drain (<= 1 is better). */
  hungerMult: number;
  /** Multiplies thirst drain (<= 1 is better). */
  thirstMult: number;
  /** Multiplies outgoing spear damage (>= 1 is better). */
  damageMult: number;
  /** Multiplies attack cooldown (<= 1 is better). */
  cooldownMult: number;
  /** Extra hearts on top of MAX_HEALTH. */
  maxHealthBonus: number;
  /** Multiplies structure build cost (<= 1 is better). */
  structureCostMult: number;
  /** Multiplies structure HP (>= 1 is better). */
  structureHpMult: number;
  /** Extra hp/frame regen while sheltered. */
  regenBonus: number;
};

export const NEUTRAL_EFFECTS: PerkEffects = {
  hungerMult: 1,
  thirstMult: 1,
  damageMult: 1,
  cooldownMult: 1,
  maxHealthBonus: 0,
  structureCostMult: 1,
  structureHpMult: 1,
  regenBonus: 0,
};

/** Clamps a stored rank map to the legal 0..maxRank range for every perk. */
export function normalizePerkRanks(raw: unknown): PerkRanks {
  const out: PerkRanks = {};
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  for (const perk of PERKS) {
    const v = r[perk.id];
    const n = typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : 0;
    out[perk.id] = Math.min(perk.maxRank, Math.max(0, n));
  }
  return out;
}

export function perkRank(ranks: PerkRanks, id: string): number {
  return ranks[id] ?? 0;
}

/** Total ranks spent across every perk. */
export function ranksSpent(ranks: PerkRanks): number {
  return PERKS.reduce((sum, p) => sum + perkRank(ranks, p.id), 0);
}

/** True when the perk can be upgraded with a free point available. */
export function canRankUp(ranks: PerkRanks, id: string, freePoints: number): boolean {
  const def = PERKS.find((p) => p.id === id);
  if (!def) return false;
  if (freePoints < PERK_POINT_COST) return false;
  return perkRank(ranks, id) < def.maxRank;
}

/** Returns a new rank map with the perk raised one rank (caller checks cost). */
export function rankUp(ranks: PerkRanks, id: string): PerkRanks {
  const def = PERKS.find((p) => p.id === id);
  if (!def) return ranks;
  const cur = perkRank(ranks, id);
  if (cur >= def.maxRank) return ranks;
  return { ...ranks, [id]: cur + 1 };
}

/**
 * Derives all gameplay modifiers from the current ranks. Additive within a
 * branch, all multiplicative factors clamped to sane floors so no perk can
 * zero out a stat.
 */
export function perkEffects(ranks: PerkRanks): PerkEffects {
  const r = (id: string) => perkRank(ranks, id);
  return {
    hungerMult: Math.max(0.4, 1 - 0.08 * r('s_hardy')),
    thirstMult: Math.max(0.4, 1 - 0.08 * r('s_hydrated')),
    damageMult: 1 + 0.15 * r('f_might'),
    cooldownMult: Math.max(0.5, 1 - 0.1 * r('f_swift')),
    maxHealthBonus: 0.5 * r('f_vigor'),
    structureCostMult: Math.max(0.5, 1 - 0.08 * r('b_thrift')),
    structureHpMult: 1 + 0.2 * r('b_sturdy'),
    regenBonus: 0.01 * (r('s_regen') + r('b_shelter')),
  };
}
