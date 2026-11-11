import {
  TILE_SIZE,
  STRUCTURE_COST,
  MATERIAL_UPGRADE_COST,
  MATERIAL_ORDER,
  STORAGE_CAP_BASE,
  CRATE_CAPACITY,
  MAX_RAFT_HEALTH,
  XP_REWARDS,
  type StructureKind,
  type MaterialTier,
} from '@/lib/balance';
import {
  findTile,
  placeTile,
  removeTile,
  upgradeTile,
  canPlace,
  countKind,
  type BuildGrid,
} from '@/lib/systems/raft';
import { gameStore } from '@/lib/store';
import type { PerkEffects } from '@/lib/systems/perks';
import type { AchievementStats } from '@/lib/achievements';

/** The mutable stats object held in `statsRef` inside the component. */
export type StatsValues = {
  health: number;
  hunger: number;
  thirst: number;
  fish: number;
  day: number;
  wood: number;
  plastic: number;
  raftHealth: number;
};

/** The live build-mode selection held in `buildModeRef`. */
export type BuildMode = {
  active: boolean;
  kind: StructureKind;
  material: MaterialTier;
  rot: number;
  col: number;
  row: number;
  valid: boolean;
};

/** Live run counters (read through getters, mutated through the add* methods). */
export type RunCounters = {
  readonly cookedFish: number;
  readonly driedFish: number;
  readonly kills: number;
  readonly islandsFound: number;
  readonly structuresBuilt: number;
  readonly woodGathered: number;
  readonly fishCaught: number;
  addStructuresBuilt: (n: number) => void;
  addKills: (n: number) => void;
  addWoodGathered: (n: number) => void;
  addFishCaught: (n: number) => void;
};

export type StatsPayload = {
  health: number;
  hunger: number;
  thirst: number;
  fish: number;
  day: number;
  wood: number;
  plastic: number;
  raftHealth: number;
  raftSize: number;
  capacity: number;
  damaged: boolean;
  walls: number;
  roofs: number;
  floors: number;
  cookedFish: number;
  driedFish: number;
  kills: number;
  islands: number;
  structures: number;
  crafted: number;
  woodGathered: number;
  fishCaught: number;
};

export type BuildDeps = {
  raftRef: { current: { x: number; y: number; width: number; height: number } };
  buildGridRef: { current: BuildGrid };
  buildModeRef: { current: BuildMode };
  perkRef: { current: PerkEffects };
  statsRef: { current: StatsValues };
  canvasRef: { current: HTMLCanvasElement | null };
  craftsMadeRef: { current: number };
  counters: RunCounters;
  getRaftScreenY: () => number;
  onStatsUpdate: (stats: StatsPayload) => void;
  bumpAch: (key: keyof AchievementStats, delta?: number) => void;
  onXp: (amount: number) => void;
  playChopSound: () => void;
};

// RAFT-201..209: grid <-> world helpers, build-mode mouse handling.
export function deckMetrics(deps: BuildDeps) {
  const cols = Math.max(2, Math.round(deps.raftRef.current.width / TILE_SIZE));
  const rows = Math.max(2, Math.round(deps.raftRef.current.height / TILE_SIZE));
  return { left: deps.raftRef.current.x, top: deps.getRaftScreenY(), cols, rows };
}
export function worldToCell(deps: BuildDeps, wx: number, wy: number) {
  const m = deckMetrics(deps);
  return {
    col: Math.floor((wx - m.left) / TILE_SIZE),
    row: Math.floor((wy - m.top) / TILE_SIZE),
  };
}
export function cellToWorld(deps: BuildDeps, col: number, row: number) {
  const m = deckMetrics(deps);
  return { x: m.left + col * TILE_SIZE, y: m.top + row * TILE_SIZE };
}
export function placementCtx(deps: BuildDeps) {
  const m = deckMetrics(deps);
  return {
    minCol: 0,
    maxCol: m.cols - 1,
    minRow: 0,
    maxRow: m.rows - 1,
    wallAllowed: (col: number, row: number) =>
      col === 0 || col === m.cols - 1 || row === 0 || row === m.rows - 1,
  };
}
// RAFT-209: full wood + upgrade cost for a structure at a material tier.
export function costFor(kind: StructureKind, material: MaterialTier) {
  const base = STRUCTURE_COST[kind];
  const up =
    material === 'wood'
      ? { wood: 0, plastic: 0 }
      : MATERIAL_UPGRADE_COST[material as Exclude<MaterialTier, 'wood'>];
  return { wood: base.wood + up.wood, plastic: base.plastic + up.plastic };
}
// RAFT-202/209: a cell is buildable if empty (place) or holds a lower-tier
// structure of the same kind (upgrade).
export function cellAction(deps: BuildDeps, col: number, row: number): 'place' | 'upgrade' | 'invalid' {
  const kind = deps.buildModeRef.current.kind;
  const sel = deps.buildModeRef.current.material;
  const existing = findTile(deps.buildGridRef.current, col, row);
  if (existing) {
    const canUpgrade =
      existing.kind === kind &&
      MATERIAL_ORDER.indexOf(sel) > MATERIAL_ORDER.indexOf(existing.material);
    return canUpgrade ? 'upgrade' : 'invalid';
  }
  return canPlace(deps.buildGridRef.current, col, row, kind, placementCtx(deps)).ok
    ? 'place'
    : 'invalid';
}
export function statsPayload(deps: BuildDeps): StatsPayload {
  const g = deps.buildGridRef.current;
  const counters = deps.counters;
  return {
    ...deps.statsRef.current,
    raftSize: deps.raftRef.current.height,
    capacity: STORAGE_CAP_BASE + countKind(g, 'crate') * CRATE_CAPACITY,
    damaged:
      deps.statsRef.current.raftHealth < MAX_RAFT_HEALTH || g.tiles.some((t) => t.hp < t.maxHp),
    walls: countKind(g, 'wall'),
    roofs: countKind(g, 'roof'),
    floors: countKind(g, 'floor'),
    // RAFT-301/304/305: counters fed to the progression + objective systems.
    cookedFish: counters.cookedFish,
    driedFish: counters.driedFish,
    kills: counters.kills,
    islands: counters.islandsFound,
    structures: counters.structuresBuilt,
    crafted: deps.craftsMadeRef.current,
    woodGathered: counters.woodGathered,
    fishCaught: counters.fishCaught,
  };
}
export function pushBuildCounts(deps: BuildDeps) {
  const g = deps.buildGridRef.current;
  if (typeof window !== 'undefined') {
    gameStore.walls = countKind(g, 'wall');
    gameStore.roofs = countKind(g, 'roof');
    gameStore.floors = countKind(g, 'floor');
  }
  deps.onStatsUpdate(statsPayload(deps));
}
export function tryPlace(deps: BuildDeps, col: number, row: number) {
  const kind = deps.buildModeRef.current.kind;
  const material = deps.buildModeRef.current.material;
  const action = cellAction(deps, col, row);
  if (action === 'invalid') return;
  // RAFT-302: Builder "Thrift" discounts every structure cost.
  const costMult = deps.perkRef.current.structureCostMult;
  const scaled = (c: { wood: number; plastic: number }) => ({
    wood: Math.ceil(c.wood * costMult),
    plastic: Math.ceil(c.plastic * costMult),
  });
  if (action === 'upgrade') {
    // RAFT-209: upgrade an existing structure in place (pays only the tier cost).
    const up = scaled(MATERIAL_UPGRADE_COST[material as Exclude<MaterialTier, 'wood'>]);
    if (deps.statsRef.current.wood < up.wood || deps.statsRef.current.plastic < up.plastic) return;
    deps.statsRef.current.wood -= up.wood;
    deps.statsRef.current.plastic -= up.plastic;
    deps.buildGridRef.current = upgradeTile(deps.buildGridRef.current, col, row, material);
  } else {
    const cost = scaled(costFor(kind, material));
    if (deps.statsRef.current.wood < cost.wood || deps.statsRef.current.plastic < cost.plastic) return;
    deps.statsRef.current.wood -= cost.wood;
    deps.statsRef.current.plastic -= cost.plastic;
    deps.buildGridRef.current = placeTile(
      deps.buildGridRef.current,
      col,
      row,
      kind,
      material,
      deps.buildModeRef.current.rot,
    );
  }
  // RAFT-302: Builder "Sturdy" raises the new structure's HP.
  const hpMult = deps.perkRef.current.structureHpMult;
  if (hpMult !== 1) {
    const g = deps.buildGridRef.current;
    deps.buildGridRef.current = {
      tiles: g.tiles.map((t) =>
        t.col === col && t.row === row
          ? { ...t, maxHp: Math.round(t.maxHp * hpMult), hp: Math.round(t.maxHp * hpMult) }
          : t,
      ),
      nextId: g.nextId,
    };
  }
  if (kind === 'wall') deps.bumpAch('builtWalls');
  if (kind === 'roof') deps.bumpAch('builtRoof');
  // RAFT-301/304: building grants XP and advances the build objective.
  deps.counters.addStructuresBuilt(1);
  deps.onXp(action === 'upgrade' ? XP_REWARDS.upgrade : XP_REWARDS.build);
  deps.playChopSound();
  pushBuildCounts(deps);
}
export function tryRemove(deps: BuildDeps, col: number, row: number) {
  const res = removeTile(deps.buildGridRef.current, col, row);
  if (
    res.refund.wood === 0 &&
    res.refund.plastic === 0 &&
    findTile(deps.buildGridRef.current, col, row) === undefined
  )
    return;
  deps.buildGridRef.current = res.grid;
  deps.statsRef.current.wood += res.refund.wood;
  deps.statsRef.current.plastic += res.refund.plastic;
  deps.playChopSound();
  pushBuildCounts(deps);
}
export function toCanvasCoords(deps: BuildDeps, clientX: number, clientY: number) {
  const canvasEl = deps.canvasRef.current;
  if (!canvasEl) return { x: 0, y: 0 };
  const rect = canvasEl.getBoundingClientRect();
  const sx = rect.width / 800;
  const sy = rect.height / 600;
  return { x: (clientX - rect.left) / (sx || 1), y: (clientY - rect.top) / (sy || 1) };
}
