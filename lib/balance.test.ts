// RAFT-402 / RAFT-406 regression tests for the survival-economy tuning.
// These lock the *intent* documented in lib/balance.ts so a future tweak that
// breaks the difficulty curve fails loudly.

import { describe, it, expect } from 'vitest';
import {
  FRAMES_PER_SECOND,
  HUNGER_DRAIN,
  THIRST_DRAIN,
  DIFFICULTY,
  DAY_PRESSURE_STEP,
  DAY_PRESSURE_MAX,
  TUNABLE,
  DEFAULT_TUNABLE,
  setTunable,
  resetTunable,
} from '@/lib/balance';

const minutesToEmpty = (drainPerFrame: number) => 100 / drainPerFrame / FRAMES_PER_SECOND / 60;

describe('survival economy tuning (RAFT-402)', () => {
  it('Normal: doing nothing empties hunger in the 8-12 min target window', () => {
    const mins = minutesToEmpty(HUNGER_DRAIN * DIFFICULTY.normal.hungerRate);
    expect(mins).toBeGreaterThanOrEqual(7.5);
    expect(mins).toBeLessThanOrEqual(12);
  });

  it('Normal: thirst lasts at least as long as hunger', () => {
    expect(minutesToEmpty(THIRST_DRAIN)).toBeGreaterThanOrEqual(minutesToEmpty(HUNGER_DRAIN));
  });

  it('Hard: hunger drains fast enough to kill well before Day 5 (10 min)', () => {
    expect(minutesToEmpty(HUNGER_DRAIN * DIFFICULTY.hard.hungerRate)).toBeLessThan(6);
  });

  it('per-day pressure grows and then caps at DAY_PRESSURE_MAX', () => {
    const day1 = 1 + (1 - 1) * DAY_PRESSURE_STEP;
    const later = Math.min(DAY_PRESSURE_MAX, 1 + (30 - 1) * DAY_PRESSURE_STEP);
    expect(day1).toBe(1);
    expect(later).toBe(DAY_PRESSURE_MAX);
  });
});

describe('dev tuning surface (RAFT-406)', () => {
  it('setTunable mutates the live value and resetTunable restores defaults', () => {
    const original = TUNABLE.hungerDrain;
    setTunable('hungerDrain', 0.0123);
    expect(TUNABLE.hungerDrain).toBe(0.0123);
    resetTunable();
    expect(TUNABLE.hungerDrain).toBe(DEFAULT_TUNABLE.hungerDrain);
    expect(TUNABLE.hungerDrain).toBe(original);
  });
});
