import { describe, expect, it } from 'vitest';
import { MAX_LEVEL } from '@/lib/balance';
import {
  DEFAULT_PROGRESSION,
  addXp,
  normalizeProgression,
  xpForNext,
  xpProgress,
} from '@/lib/systems/progression';

describe('progression', () => {
  it('xpForNext rises with level', () => {
    expect(xpForNext(1)).toBeLessThan(xpForNext(2));
    expect(xpForNext(2)).toBeLessThan(xpForNext(3));
  });

  it('does not level up below the threshold', () => {
    const r = addXp(DEFAULT_PROGRESSION, xpForNext(1) - 1);
    expect(r.state.level).toBe(1);
    expect(r.leveledUp).toBe(false);
  });

  it('levels up and grants a perk point at the threshold', () => {
    const r = addXp(DEFAULT_PROGRESSION, xpForNext(1));
    expect(r.state.level).toBe(2);
    expect(r.state.perkPoints).toBe(1);
    expect(r.leveledUp).toBe(true);
  });

  it('can gain multiple levels from one award', () => {
    const r = addXp(DEFAULT_PROGRESSION, xpForNext(1) + xpForNext(2) + xpForNext(3));
    expect(r.state.level).toBe(4);
    expect(r.state.perkPoints).toBe(3);
    expect(r.levelsGained).toBe(3);
  });

  it('never exceeds MAX_LEVEL', () => {
    const r = addXp(DEFAULT_PROGRESSION, 1_000_000);
    expect(r.state.level).toBe(MAX_LEVEL);
    expect(r.state.xp).toBe(0);
  });

  it('xpProgress is clamped to 0..1', () => {
    expect(xpProgress(DEFAULT_PROGRESSION)).toBe(0);
    expect(xpProgress({ level: 1, xp: 1e9, perkPoints: 0, spentPerks: 0 })).toBeLessThanOrEqual(1);
    expect(xpProgress({ level: MAX_LEVEL, xp: 0, perkPoints: 0, spentPerks: 0 })).toBe(1);
  });

  it('ignores non-positive awards', () => {
    const r = addXp(DEFAULT_PROGRESSION, -5);
    expect(r.state).toBe(DEFAULT_PROGRESSION);
  });

  it('normalizes stale/garbage saves', () => {
    expect(normalizeProgression(null)).toEqual(DEFAULT_PROGRESSION);
    expect(normalizeProgression({ level: 999 }).level).toBe(MAX_LEVEL);
    expect(normalizeProgression({ level: 0 }).level).toBe(1);
  });
});
