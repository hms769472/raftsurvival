import { describe, expect, it } from 'vitest';
import {
  NEUTRAL_EFFECTS,
  PERKS,
  canRankUp,
  normalizePerkRanks,
  perkEffects,
  rankUp,
  ranksSpent,
  type PerkRanks,
} from '@/lib/systems/perks';

describe('perks', () => {
  it('has 3 perks in each of 3 branches', () => {
    for (const branch of ['survivor', 'fighter', 'builder'] as const) {
      expect(PERKS.filter((p) => p.branch === branch)).toHaveLength(3);
    }
  });

  it('empty ranks give neutral effects', () => {
    expect(perkEffects({})).toEqual(NEUTRAL_EFFECTS);
  });

  it('survivor perks reduce hunger/thirst drain', () => {
    const e = perkEffects({ s_hardy: 3, s_hydrated: 3 });
    expect(e.hungerMult).toBeLessThan(1);
    expect(e.thirstMult).toBeLessThan(1);
  });

  it('fighter perks raise damage and hearts', () => {
    const e = perkEffects({ f_might: 2, f_vigor: 2 });
    expect(e.damageMult).toBeGreaterThan(1);
    expect(e.maxHealthBonus).toBe(1);
  });

  it('builder perks cut cost and raise HP', () => {
    const e = perkEffects({ b_thrift: 2, b_sturdy: 2 });
    expect(e.structureCostMult).toBeLessThan(1);
    expect(e.structureHpMult).toBeGreaterThan(1);
  });

  it('canRankUp respects max rank and available points', () => {
    expect(canRankUp({ s_hardy: 3 }, 's_hardy', 5)).toBe(false);
    expect(canRankUp({}, 's_hardy', 0)).toBe(false);
    expect(canRankUp({}, 's_hardy', 1)).toBe(true);
  });

  it('rankUp raises one rank and clamps at max', () => {
    let ranks: PerkRanks = {};
    ranks = rankUp(ranks, 's_hardy');
    expect(ranks.s_hardy).toBe(1);
    for (let i = 0; i < 10; i++) ranks = rankUp(ranks, 's_hardy');
    expect(ranks.s_hardy).toBe(3);
    expect(ranksSpent(ranks)).toBe(3);
  });

  it('normalizePerkRanks clamps and fills every perk', () => {
    const n = normalizePerkRanks({ s_hardy: 99, f_might: -2 });
    expect(n.s_hardy).toBe(3);
    expect(n.f_might).toBe(0);
    expect(Object.keys(n)).toHaveLength(PERKS.length);
  });
});
