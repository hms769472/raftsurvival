// Versioned save/load for a single run.
//
// The snapshot captures *everything* needed to restore the exact game state,
// including the internal values the canvas loop owns (elapsed frames, cooked
// fish, barrel water). Reading is defensive: an old or corrupt blob is
// normalised field-by-field instead of throwing, so a bad save can never
// crash the game on boot.

import type { WeaponTier } from '@/lib/balance';
import type { StoredTile } from '@/lib/systems/raft';
import {
  DEFAULT_PROGRESSION,
  normalizeProgression,
  type ProgressionState,
} from '@/lib/systems/progression';
import { normalizePerkRanks, type PerkRanks } from '@/lib/systems/perks';

export const SAVE_VERSION = 6;
export const SAVE_KEY = 'raftSave';
/** RAFT-507: number of player-visible save slots (slot 0 = legacy autosave key). */
export const SAVE_SLOT_COUNT = 3;
/** Storage key for a slot. Slot 0 keeps the original `raftSave` key. */
export function slotKey(slot: number): string {
  return slot === 0 ? SAVE_KEY : `${SAVE_KEY}_${slot}`;
}

export type GameSnapshot = {
  version: number;
  savedAt: number;
  /** Elapsed frames since the run began — the day counter derives from this. */
  time: number;
  health: number;
  hunger: number;
  thirst: number;
  fish: number;
  cookedFish: number;
  /** RAFT-405: dried fish from the drying rack. */
  driedFish: number;
  day: number;
  wood: number;
  plastic: number;
  raftHealth: number;
  raftWidth: number;
  hasRod: boolean;
  hasSpear: boolean;
  hasHammer: boolean;
  hasRainBarrel: boolean;
  hasCampfire: boolean;
  walls: number;
  roofs: number;
  floors: number;
  barrelWater: number;
  /** Current spear tier (RAFT-106). */
  spearTier: WeaponTier;
  /** Placed build tiles (RAFT-201). Empty for saves made before Phase 2. */
  buildGrid: StoredTile[];
  /** RAFT-301: XP / level / perk points. */
  progression: ProgressionState;
  /** RAFT-302: spent perk ranks keyed by perk id. */
  perkRanks: PerkRanks;
  /** RAFT-304: index of the active objective in the chain. */
  objectiveIndex: number;
};

/** Mutable box shared between <Game> and the page so a save can read live state. */
export type SnapshotStore = { current: GameSnapshot | null };

export const DEFAULT_SNAPSHOT: GameSnapshot = {
  version: SAVE_VERSION,
  savedAt: 0,
  time: 0,
  health: 5,
  hunger: 100,
  thirst: 100,
  fish: 0,
  cookedFish: 0,
  driedFish: 0,
  day: 1,
  wood: 0,
  plastic: 0,
  raftHealth: 100,
  raftWidth: 150,
  hasRod: false,
  hasSpear: false,
  hasHammer: false,
  hasRainBarrel: false,
  hasCampfire: false,
  walls: 0,
  roofs: 0,
  floors: 0,
  barrelWater: 0,
  spearTier: 'wooden',
  buildGrid: [],
  progression: { ...DEFAULT_PROGRESSION },
  perkRanks: {},
  objectiveIndex: 0,
};

const asNumber = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const asBool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const asTier = (v: unknown, fallback: WeaponTier): WeaponTier =>
  v === 'wooden' || v === 'stone' || v === 'reinforced' ? v : fallback;

/** Coerces any persisted blob (old flat save, corrupt value, null) to a full snapshot. */
export function normalizeSnapshot(raw: unknown): GameSnapshot {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SNAPSHOT };
  const r = raw as Record<string, unknown>;
  return {
    version: SAVE_VERSION,
    savedAt: asNumber(r.savedAt, 0),
    time: asNumber(r.time, DEFAULT_SNAPSHOT.time),
    health: asNumber(r.health, DEFAULT_SNAPSHOT.health),
    hunger: asNumber(r.hunger, DEFAULT_SNAPSHOT.hunger),
    thirst: asNumber(r.thirst, DEFAULT_SNAPSHOT.thirst),
    fish: asNumber(r.fish, DEFAULT_SNAPSHOT.fish),
    cookedFish: asNumber(r.cookedFish, DEFAULT_SNAPSHOT.cookedFish),
    driedFish: asNumber(r.driedFish, DEFAULT_SNAPSHOT.driedFish),
    day: asNumber(r.day, DEFAULT_SNAPSHOT.day),
    wood: asNumber(r.wood, DEFAULT_SNAPSHOT.wood),
    plastic: asNumber(r.plastic, DEFAULT_SNAPSHOT.plastic),
    raftHealth: asNumber(r.raftHealth, DEFAULT_SNAPSHOT.raftHealth),
    raftWidth: asNumber(r.raftWidth, DEFAULT_SNAPSHOT.raftWidth),
    hasRod: asBool(r.hasRod, DEFAULT_SNAPSHOT.hasRod),
    hasSpear: asBool(r.hasSpear, DEFAULT_SNAPSHOT.hasSpear),
    hasHammer: asBool(r.hasHammer, DEFAULT_SNAPSHOT.hasHammer),
    hasRainBarrel: asBool(r.hasRainBarrel, DEFAULT_SNAPSHOT.hasRainBarrel),
    hasCampfire: asBool(r.hasCampfire, DEFAULT_SNAPSHOT.hasCampfire),
    walls: asNumber(r.walls, DEFAULT_SNAPSHOT.walls),
    roofs: asNumber(r.roofs, DEFAULT_SNAPSHOT.roofs),
    floors: asNumber(r.floors, DEFAULT_SNAPSHOT.floors),
    barrelWater: asNumber(r.barrelWater, DEFAULT_SNAPSHOT.barrelWater),
    spearTier: asTier(r.spearTier, DEFAULT_SNAPSHOT.spearTier),
    buildGrid: Array.isArray(r.buildGrid) ? (r.buildGrid as StoredTile[]) : [],
    progression: normalizeProgression(r.progression),
    perkRanks: normalizePerkRanks(r.perkRanks),
    objectiveIndex: Math.max(0, Math.floor(asNumber(r.objectiveIndex, 0))),
  };
}

export function loadSnapshot(slot = 0): GameSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(slotKey(slot));
    if (!raw) return null;
    return normalizeSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveSnapshot(snap: GameSnapshot, slot = 0): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      slotKey(slot),
      JSON.stringify({ ...snap, version: SAVE_VERSION, savedAt: Date.now() }),
    );
  } catch {
    /* storage full / disabled — never crash the game */
  }
}

export function hasSnapshot(slot = 0): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(slotKey(slot)) !== null;
  } catch {
    return false;
  }
}

/** RAFT-507: remove a slot's save (used by the SaveSlots delete button). */
export function deleteSnapshot(slot = 0): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(slotKey(slot));
  } catch {
    /* ignore */
  }
}

/** RAFT-507: true if any slot (including the legacy autosave) holds a save. */
export function hasAnySnapshot(): boolean {
  for (let i = 0; i <= SAVE_SLOT_COUNT; i++) if (hasSnapshot(i)) return true;
  return false;
}
