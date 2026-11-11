// RAFT-606: save → load coverage.
//
// `normalizeSnapshot` is the single boundary between a persisted blob and live
// game state, so it owns the round-trip contract: a valid save must come back
// unchanged, and a corrupt / partial / legacy blob must degrade to safe
// defaults instead of throwing on boot.

import { describe, it, expect } from 'vitest';
import { SAVE_VERSION, DEFAULT_SNAPSHOT, normalizeSnapshot, type GameSnapshot } from '@/lib/save';
import { DEFAULT_PROGRESSION } from '@/lib/systems/progression';

const FULL: GameSnapshot = {
  ...DEFAULT_SNAPSHOT,
  time: 1234,
  health: 3,
  hunger: 42,
  thirst: 55,
  fish: 4,
  cookedFish: 2,
  driedFish: 1,
  day: 6,
  wood: 12,
  plastic: 7,
  raftHealth: 65,
  raftWidth: 200,
  hasRod: true,
  hasSpear: true,
  hasHammer: false,
  hasRainBarrel: true,
  hasCampfire: true,
  walls: 3,
  roofs: 1,
  floors: 2,
  barrelWater: 80,
  spearTier: 'stone',
  buildGrid: [[0, 0, 'wall', 'wood', 40, 0]],
  progression: { ...DEFAULT_PROGRESSION, level: 5, xp: 30, perkPoints: 2 },
  perkRanks: { s_hardy: 2 },
  objectiveIndex: 3,
};

describe('normalizeSnapshot round-trip (RAFT-606)', () => {
  it('restores every field after a JSON save → load cycle', () => {
    const loaded = normalizeSnapshot(JSON.parse(JSON.stringify(FULL)));
    expect(loaded).toMatchObject({
      time: 1234,
      health: 3,
      hunger: 42,
      thirst: 55,
      fish: 4,
      cookedFish: 2,
      driedFish: 1,
      day: 6,
      wood: 12,
      plastic: 7,
      raftHealth: 65,
      raftWidth: 200,
      hasRod: true,
      hasSpear: true,
      hasHammer: false,
      hasRainBarrel: true,
      hasCampfire: true,
      walls: 3,
      roofs: 1,
      floors: 2,
      barrelWater: 80,
      spearTier: 'stone',
      objectiveIndex: 3,
    });
    expect(loaded.buildGrid).toEqual(FULL.buildGrid);
    expect(loaded.progression.level).toBe(5);
    expect(loaded.progression.xp).toBe(30);
    expect(loaded.progression.perkPoints).toBe(2);
    expect(loaded.perkRanks.s_hardy).toBe(2);
  });

  it('always stamps the current SAVE_VERSION', () => {
    expect(normalizeSnapshot({ version: 1 }).version).toBe(SAVE_VERSION);
    expect(normalizeSnapshot(null).version).toBe(SAVE_VERSION);
  });
});

describe('normalizeSnapshot hardening (RAFT-606)', () => {
  it('coerces bad field types to defaults', () => {
    const loaded = normalizeSnapshot({
      health: 'nope',
      day: null,
      hasRod: 1,
      spearTier: 'plasma',
      hunger: Number.NaN,
    });
    expect(loaded.health).toBe(DEFAULT_SNAPSHOT.health);
    expect(loaded.day).toBe(DEFAULT_SNAPSHOT.day);
    expect(loaded.hasRod).toBe(DEFAULT_SNAPSHOT.hasRod);
    expect(loaded.spearTier).toBe(DEFAULT_SNAPSHOT.spearTier);
    expect(loaded.hunger).toBe(DEFAULT_SNAPSHOT.hunger);
  });

  it('never throws on null / non-object blobs', () => {
    expect(normalizeSnapshot(null).day).toBe(DEFAULT_SNAPSHOT.day);
    expect(normalizeSnapshot('garbage').spearTier).toBe('wooden');
    expect(normalizeSnapshot(undefined).buildGrid).toEqual([]);
  });

  it('clamps the objective index and nested progression / perks', () => {
    const loaded = normalizeSnapshot({
      objectiveIndex: -4,
      progression: { level: 0 },
      perkRanks: { s_hardy: 99 },
    });
    expect(loaded.objectiveIndex).toBe(0);
    expect(loaded.progression.level).toBe(1);
    expect(loaded.perkRanks.s_hardy).toBe(3); // Hardy caps at rank 3
  });
});
