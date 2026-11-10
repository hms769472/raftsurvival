// Pure XP / level helpers (RAFT-301).
//
// DOM-free and side-effect free so the whole progression curve is unit
// testable. The page owns the live state; these functions are the reducer.

import { MAX_LEVEL, XP_CURVE_BASE, XP_CURVE_STEP } from '@/lib/balance';

export type ProgressionState = {
  level: number;
  xp: number;
  /** Perk points earned (1 per level) minus points already spent. */
  perkPoints: number;
  /** Points already spent on the perk tree (used to compute perkPoints). */
  spentPerks: number;
};

export const DEFAULT_PROGRESSION: ProgressionState = {
  level: 1,
  xp: 0,
  perkPoints: 0,
  spentPerks: 0,
};

/** XP required to advance FROM `level` to `level + 1` (never below 1). */
export function xpForNext(level: number): number {
  const l = Math.max(1, Math.floor(level));
  return XP_CURVE_BASE + XP_CURVE_STEP * (l - 1);
}

/** Fraction (0..1) of the current level's XP bar that is filled. */
export function xpProgress(state: ProgressionState): number {
  if (state.level >= MAX_LEVEL) return 1;
  return Math.min(1, Math.max(0, state.xp / xpForNext(state.level)));
}

/**
 * Adds XP and levels up as many times as the total allows (capped at
 * MAX_LEVEL). One perk point is granted per level gained.
 */
export function addXp(
  state: ProgressionState,
  amount: number,
): { state: ProgressionState; leveledUp: boolean; levelsGained: number } {
  if (!Number.isFinite(amount) || amount <= 0 || state.level >= MAX_LEVEL) {
    return { state, leveledUp: false, levelsGained: 0 };
  }
  let { level, perkPoints } = state;
  let xp = state.xp + amount;
  let levelsGained = 0;
  while (level < MAX_LEVEL && xp >= xpForNext(level)) {
    xp -= xpForNext(level);
    level += 1;
    perkPoints += 1;
    levelsGained += 1;
  }
  // At max level there is nothing left to earn.
  if (level >= MAX_LEVEL) xp = 0;
  return {
    state: { level, xp, perkPoints, spentPerks: state.spentPerks },
    leveledUp: levelsGained > 0,
    levelsGained,
  };
}

/** Total perk points ever earned (still-free points plus already-spent ones). */
export function totalPerkPoints(state: ProgressionState): number {
  return state.perkPoints + state.spentPerks;
}

/** Coerces a persisted blob into a valid progression state. */
export function normalizeProgression(raw: unknown): ProgressionState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PROGRESSION };
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, f: number) => (typeof v === 'number' && Number.isFinite(v) ? v : f);
  const level = Math.min(MAX_LEVEL, Math.max(1, Math.floor(num(r.level, 1))));
  return {
    level,
    xp: Math.max(0, num(r.xp, 0)),
    perkPoints: Math.max(0, Math.floor(num(r.perkPoints, 0))),
    spentPerks: Math.max(0, Math.floor(num(r.spentPerks, 0))),
  };
}
