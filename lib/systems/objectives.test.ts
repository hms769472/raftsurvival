import { describe, expect, it } from 'vitest';
import {
  EMPTY_OBJECTIVE_STATS,
  OBJECTIVES,
  advanceChain,
  currentObjective,
  objectiveMet,
  objectiveProgress,
} from '@/lib/systems/objectives';

describe('objectives', () => {
  it('has at least 10 objectives', () => {
    expect(OBJECTIVES.length).toBeGreaterThanOrEqual(10);
  });

  it('currentObjective returns null past the end', () => {
    expect(currentObjective(0)?.id).toBe('o1');
    expect(currentObjective(OBJECTIVES.length)).toBeNull();
  });

  it('objectiveMet compares the stat against the target', () => {
    const o = { id: 'x', text: '', stat: 'woodGathered' as const, target: 10, reward: {} };
    expect(objectiveMet(o, { ...EMPTY_OBJECTIVE_STATS, woodGathered: 9 })).toBe(false);
    expect(objectiveMet(o, { ...EMPTY_OBJECTIVE_STATS, woodGathered: 10 })).toBe(true);
  });

  it('objectiveProgress is clamped to 0..1', () => {
    const o = OBJECTIVES[0];
    expect(objectiveProgress(o, EMPTY_OBJECTIVE_STATS)).toBe(0);
    expect(objectiveProgress(o, { ...EMPTY_OBJECTIVE_STATS, woodGathered: 1e6 })).toBe(1);
  });

  it('advanceChain completes every satisfied objective in order', () => {
    const stats = { ...EMPTY_OBJECTIVE_STATS, woodGathered: 20, crafted: 1, fishCaught: 5 };
    const r = advanceChain(0, stats);
    expect(r.completed.map((o) => o.id)).toEqual(['o1', 'o2', 'o3']);
    expect(r.index).toBe(3);
  });

  it('advanceChain stops at the first unmet objective', () => {
    const r = advanceChain(0, { ...EMPTY_OBJECTIVE_STATS, woodGathered: 20 });
    expect(r.completed.map((o) => o.id)).toEqual(['o1']);
    expect(r.index).toBe(1);
  });

  it('advanceChain is idempotent when nothing is met', () => {
    const r = advanceChain(4, EMPTY_OBJECTIVE_STATS);
    expect(r.completed).toHaveLength(0);
    expect(r.index).toBe(4);
  });
});
