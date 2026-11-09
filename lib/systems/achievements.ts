import { ACHIEVEMENTS, type Achievement, type AchievementStats } from '@/lib/achievements';
import { DAY_LENGTH } from '@/lib/balance';

export type AchDifficulty = 'easy' | 'normal' | 'hard';

export const DEFAULT_ACH_STATS: AchievementStats = {
  totalFishEaten: 0,
  totalWood: 0,
  totalPlastic: 0,
  daysSurvived: 0,
  sharksDefeated: 0,
  frogsKilled: 0,
  maxHunger: 100,
  maxThirst: 100,
  builtWalls: 0,
  builtRoof: 0,
  builtBarrel: 0,
  islandsCollected: 0,
  maxRaftHealth: 100,
  difficulty: 'normal',
  timePlayed: 0,
};

/** Normalises a possibly-partial/old persisted blob into a full stats object. */
export function normalizeAchStats(raw: unknown): AchievementStats {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_ACH_STATS };
  return { ...DEFAULT_ACH_STATS, ...(raw as Partial<AchievementStats>) };
}

/** Days survived uses the single shared DAY_LENGTH (a 2-minute day). */
export function computeDaysSurvived(elapsedFrames: number): number {
  return Math.floor(elapsedFrames / DAY_LENGTH) + 1;
}

/**
 * Pure sync of the derived achievement stats. Extrema are monotonic (only ever
 * increase) so a later save/load can never lower a previously earned value.
 */
export function syncAchStats(
  base: AchievementStats,
  current: {
    elapsedFrames: number;
    hunger: number;
    thirst: number;
    raftHealth: number;
    difficulty: AchDifficulty;
    elapsedMs: number;
  },
): AchievementStats {
  return {
    ...base,
    daysSurvived: Math.max(base.daysSurvived, computeDaysSurvived(current.elapsedFrames)),
    maxHunger: Math.max(base.maxHunger, current.hunger),
    maxThirst: Math.max(base.maxThirst, current.thirst),
    maxRaftHealth: Math.max(base.maxRaftHealth, current.raftHealth),
    difficulty: current.difficulty,
    timePlayed: base.timePlayed + Math.max(0, current.elapsedMs),
  };
}

/** Returns achievements whose condition is now met and that are not yet unlocked. */
export function findNewlyUnlocked(stats: AchievementStats, alreadyUnlocked: string[]): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !alreadyUnlocked.includes(a.id) && a.condition(stats));
}

/** Immutably increments a numeric counter stat (no-op for non-numeric fields). */
export function bumpAchStats(
  stats: AchievementStats,
  key: keyof AchievementStats,
  delta = 1,
): AchievementStats {
  const value = stats[key];
  if (typeof value !== 'number') return stats;
  return { ...stats, [key]: value + delta };
}
