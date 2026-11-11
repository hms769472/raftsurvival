// Pure objective-chain model (RAFT-304).
//
// A single ordered chain of thresholds over monotonic run stats. Only the
// current objective is "active"; when its target is met the caller grants its
// reward and advances the index. Everything here is a pure function so the
// whole chain is unit testable.

export type ObjectiveStat =
  'woodGathered' | 'fishCaught' | 'structuresBuilt' | 'kills' | 'islandsFound' | 'crafted' | 'day';

export type ObjectiveStats = Record<ObjectiveStat, number>;

export const EMPTY_OBJECTIVE_STATS: ObjectiveStats = {
  woodGathered: 0,
  fishCaught: 0,
  structuresBuilt: 0,
  kills: 0,
  islandsFound: 0,
  crafted: 0,
  day: 1,
};

export type ObjectiveReward = { wood?: number; plastic?: number; xp?: number; coins?: number };

export type Objective = {
  id: string;
  text: string;
  stat: ObjectiveStat;
  target: number;
  reward: ObjectiveReward;
};

export const OBJECTIVES: Objective[] = [
  { id: 'o1', text: 'Gather 20 wood', stat: 'woodGathered', target: 20, reward: { xp: 15 } },
  { id: 'o2', text: 'Craft a tool', stat: 'crafted', target: 1, reward: { xp: 15 } },
  { id: 'o3', text: 'Catch 5 fish', stat: 'fishCaught', target: 5, reward: { xp: 20 } },
  { id: 'o4', text: 'Build 3 structures', stat: 'structuresBuilt', target: 3, reward: { wood: 8 } },
  { id: 'o5', text: 'Defeat 3 enemies', stat: 'kills', target: 3, reward: { xp: 25 } },
  { id: 'o6', text: 'Reach Day 3', stat: 'day', target: 3, reward: { plastic: 10 } },
  { id: 'o7', text: 'Gather 60 wood', stat: 'woodGathered', target: 60, reward: { xp: 30 } },
  { id: 'o8', text: 'Discover an island', stat: 'islandsFound', target: 1, reward: { xp: 25 } },
  {
    id: 'o9',
    text: 'Build 10 structures',
    stat: 'structuresBuilt',
    target: 10,
    reward: { wood: 15 },
  },
  { id: 'o10', text: 'Defeat 10 enemies', stat: 'kills', target: 10, reward: { xp: 40 } },
  { id: 'o11', text: 'Reach Day 10', stat: 'day', target: 10, reward: { plastic: 20 } },
  {
    id: 'o12',
    text: 'Survive to Day 20',
    stat: 'day',
    target: 20,
    reward: { xp: 100, coins: 100 },
  },
];

/** The active objective, or null once the whole chain is complete. */
export function currentObjective(index: number): Objective | null {
  return index >= 0 && index < OBJECTIVES.length ? OBJECTIVES[index] : null;
}

export function objectiveMet(obj: Objective, stats: ObjectiveStats): boolean {
  return (stats[obj.stat] ?? 0) >= obj.target;
}

/** Progress ratio (0..1) toward the active objective, for the HUD bar. */
export function objectiveProgress(obj: Objective, stats: ObjectiveStats): number {
  return Math.min(1, Math.max(0, (stats[obj.stat] ?? 0) / obj.target));
}

/**
 * Advances as far as the stats allow, returning the new index plus the list of
 * objectives that were just completed (so their rewards can be granted once).
 */
export function advanceChain(
  index: number,
  stats: ObjectiveStats,
): { index: number; completed: Objective[] } {
  let i = index;
  const completed: Objective[] = [];
  while (i < OBJECTIVES.length && objectiveMet(OBJECTIVES[i], stats)) {
    completed.push(OBJECTIVES[i]);
    i += 1;
  }
  return { index: i, completed };
}
