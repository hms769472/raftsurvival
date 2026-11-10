// RAFT-102 acceptance: unit tests for the hit-check and damage helpers.
// Also covers the pure threat-scaling / loot helpers introduced in RAFT-103/104.
import { describe, it, expect } from 'vitest';
import {
  clampHealth,
  applyHeal,
  applyDamage,
  inAttackArc,
  threatScale,
  isEnemyUnlocked,
  rollLoot,
  simulatedDps,
  type Box,
} from '@/lib/systems/combat';
import { MAX_HEALTH, SPEAR_REACH } from '@/lib/balance';

const player: Box = { x: 100, y: 100, width: 20, height: 40 };

describe('damage / heal helpers (RAFT-101)', () => {
  it('clamps to the [0, MAX_HEALTH] range', () => {
    expect(clampHealth(MAX_HEALTH, 0)).toBe(MAX_HEALTH);
    expect(clampHealth(0, 0)).toBe(0);
  });

  it('applyDamage never drops below zero', () => {
    expect(applyDamage(MAX_HEALTH, 2)).toBe(MAX_HEALTH - 2);
    expect(applyDamage(1, 999)).toBe(0);
    expect(applyDamage(3, -2)).toBe(1); // always applied negatively
  });

  it('applyHeal never exceeds MAX_HEALTH', () => {
    expect(applyHeal(1, 2)).toBe(3);
    expect(applyHeal(MAX_HEALTH, 5)).toBe(MAX_HEALTH);
    expect(applyHeal(2, -1)).toBe(3); // magnitude only
  });
});

describe('inAttackArc hit-check (RAFT-102)', () => {
  it('hits a target directly in front', () => {
    const target: Box = { x: 125, y: 110, width: 20, height: 40 };
    expect(inAttackArc(player, target, SPEAR_REACH)).toBe(true);
  });

  it('hits a target within the back reach', () => {
    const target: Box = { x: 85, y: 110, width: 20, height: 40 };
    expect(inAttackArc(player, target, SPEAR_REACH)).toBe(true);
  });

  it('misses a target beyond the front reach', () => {
    const target: Box = { x: 200, y: 110, width: 20, height: 40 };
    expect(inAttackArc(player, target, SPEAR_REACH)).toBe(false);
  });

  it('misses a target beyond the back reach', () => {
    const target: Box = { x: 40, y: 110, width: 20, height: 40 };
    expect(inAttackArc(player, target, SPEAR_REACH)).toBe(false);
  });

  it('misses a target far below the player (vertical gap)', () => {
    const target: Box = { x: 125, y: 400, width: 20, height: 40 };
    expect(inAttackArc(player, target, SPEAR_REACH)).toBe(false);
  });

  it('vertical reach lets a wide-arc enemy above be hit', () => {
    const reach = { front: 35, back: 35, vertical: 200 };
    const target: Box = { x: 120, y: 20, width: 130, height: 130 };
    expect(inAttackArc(player, target, reach)).toBe(true);
  });
});

describe('threat scaling (RAFT-104)', () => {
  it('is neutral on day 1', () => {
    const s = threatScale(1);
    expect(s.hpMult).toBe(1);
    expect(s.damageMult).toBe(1);
    expect(s.spawnMult).toBe(1);
    expect(s.frogCap).toBe(3);
  });

  it('increases multipliers with the day count', () => {
    const s = threatScale(10);
    expect(s.hpMult).toBeGreaterThan(1);
    expect(s.damageMult).toBeGreaterThan(1);
    expect(s.spawnMult).toBeGreaterThan(1);
    expect(s.frogCap).toBeGreaterThan(3);
  });

  it('gates enemies by unlock day', () => {
    expect(isEnemyUnlocked('frog', 1)).toBe(true);
    expect(isEnemyUnlocked('shark', 3)).toBe(false);
    expect(isEnemyUnlocked('shark', 4)).toBe(true);
    expect(isEnemyUnlocked('kraken', 7)).toBe(false);
    expect(isEnemyUnlocked('kraken', 8)).toBe(true);
  });

  it('more than doubles incoming pressure from Day 1 to Day 10 on Normal', () => {
    const day1 = simulatedDps(1);
    const day10 = simulatedDps(10);
    expect(day10).toBeGreaterThan(day1 * 2);
  });

  it('scales with the difficulty damage multiplier', () => {
    expect(simulatedDps(5, 2)).toBeCloseTo(simulatedDps(5, 1) * 2);
  });
});

describe('loot tables (RAFT-103)', () => {
  it('rolls every guaranteed drop with a zero rng (min amounts)', () => {
    const drops = rollLoot('kraken', () => 0);
    expect(drops).toHaveLength(3);
    expect(drops).toEqual([
      { type: 'wood', amount: 20 },
      { type: 'plastic', amount: 15 },
      { type: 'fish', amount: 3 },
    ]);
  });

  it('skips chance-based drops when the roll fails', () => {
    // rng() > chance -> skip. Always 0.99 fails the frog plastic (0.8) + wood (0.4).
    const drops = rollLoot('frog', () => 0.99);
    expect(drops).toHaveLength(0);
  });

  it('drops something for a shark that always rolls success', () => {
    const drops = rollLoot('shark', () => 0);
    expect(drops.length).toBeGreaterThan(0);
  });
});
