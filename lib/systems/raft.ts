// Pure raft-grid model (RAFT-201/202/203/204/206/209). No React / DOM / canvas
// access so placement, damage and refund logic can be unit tested in isolation.
//
// The raft deck is a rectangle of grid cells; the player places structures on
// individual cells (Build Mode) instead of the old fixed wall/roof/floor counts.

import {
  STRUCTURE_HP,
  STRUCTURE_COST,
  STRUCTURE_REFUND,
  MATERIAL_HP_MULT,
  type StructureKind,
  type MaterialTier,
} from '@/lib/balance';

export type BuildTile = {
  id: number;
  col: number;
  row: number;
  kind: StructureKind;
  /** Material tier affects HP (RAFT-209). */
  material: MaterialTier;
  hp: number;
  maxHp: number;
  /** 0 / 90 / 180 / 270 — only meaningful for walls. */
  rot: number;
};

export type BuildGrid = {
  tiles: BuildTile[];
  nextId: number;
};

export const EMPTY_GRID: BuildGrid = { tiles: [], nextId: 1 };

export function keyOf(col: number, row: number): string {
  return col + ',' + row;
}

/** Returns the tile occupying a cell, if any. */
export function findTile(grid: BuildGrid, col: number, row: number): BuildTile | undefined {
  return grid.tiles.find((t) => t.col === col && t.row === row);
}

/** Number of placed tiles of a kind. */
export function countKind(grid: BuildGrid, kind: StructureKind): number {
  return grid.tiles.filter((t) => t.kind === kind).length;
}

/** Max HP for a structure of a kind at a material tier. */
export function maxHpFor(kind: StructureKind, material: MaterialTier): number {
  return Math.round(STRUCTURE_HP[kind] * MATERIAL_HP_MULT[material]);
}

export type PlacementContext = {
  /** Deck cell bounds (inclusive) the player may build on. */
  minCol: number;
  maxCol: number;
  minRow: number;
  maxRow: number;
  /** Whether a wall may be placed on this cell (walls go on edges). */
  wallAllowed?: (col: number, row: number) => boolean;
};

export type PlacementResult = { ok: true } | { ok: false; reason: string };

/** Validates a placement without mutating anything (RAFT-202). */
export function canPlace(
  grid: BuildGrid,
  col: number,
  row: number,
  kind: StructureKind,
  ctx: PlacementContext,
): PlacementResult {
  if (col < ctx.minCol || col > ctx.maxCol || row < ctx.minRow || row > ctx.maxRow) {
    return { ok: false, reason: 'Outside raft' };
  }
  if (findTile(grid, col, row)) {
    return { ok: false, reason: 'Occupied' };
  }
  if (kind === 'wall' && ctx.wallAllowed && !ctx.wallAllowed(col, row)) {
    return { ok: false, reason: 'Walls go on edge cells' };
  }
  return { ok: true };
}

/** Places a tile, returning a new grid (idempotent guard via canPlace). */
export function placeTile(
  grid: BuildGrid,
  col: number,
  row: number,
  kind: StructureKind,
  material: MaterialTier,
  rot = 0,
): BuildGrid {
  if (findTile(grid, col, row)) return grid;
  const maxHp = maxHpFor(kind, material);
  const tile: BuildTile = { id: grid.nextId, col, row, kind, material, hp: maxHp, maxHp, rot };
  return { tiles: [...grid.tiles, tile], nextId: grid.nextId + 1 };
}

/** Removes a tile and reports the refund (RAFT-202: 50% of cost). */
export function removeTile(
  grid: BuildGrid,
  col: number,
  row: number,
): { grid: BuildGrid; refund: { wood: number; plastic: number } } {
  const tile = findTile(grid, col, row);
  if (!tile) return { grid, refund: { wood: 0, plastic: 0 } };
  const cost = STRUCTURE_COST[tile.kind];
  const refund = {
    wood: Math.floor(cost.wood * STRUCTURE_REFUND),
    plastic: Math.floor(cost.plastic * STRUCTURE_REFUND),
  };
  return {
    grid: { tiles: grid.tiles.filter((t) => t.id !== tile.id), nextId: grid.nextId },
    refund,
  };
}

/** Damages one tile; destroys it when HP reaches 0 (RAFT-204/110). */
export function damageTile(grid: BuildGrid, col: number, row: number, amount: number): BuildGrid {
  const tile = findTile(grid, col, row);
  if (!tile) return grid;
  const hp = tile.hp - Math.abs(amount);
  if (hp <= 0) return { tiles: grid.tiles.filter((t) => t.id !== tile.id), nextId: grid.nextId };
  return {
    tiles: grid.tiles.map((t) => (t.id === tile.id ? { ...t, hp } : t)),
    nextId: grid.nextId,
  };
}

/** Damages the first intact tile of a kind (shark chews walls) (RAFT-110/204). */
export function damageFirstOfKind(grid: BuildGrid, kind: StructureKind, amount: number): BuildGrid {
  const target = grid.tiles.find((t) => t.kind === kind && t.hp > 0);
  if (!target) return grid;
  return damageTile(grid, target.col, target.row, amount);
}

/** Repairs every tile by an amount, clamped to maxHp (RAFT-205). */
export function repairAllTiles(grid: BuildGrid, amount: number): BuildGrid {
  return {
    tiles: grid.tiles.map((t) => ({ ...t, hp: Math.min(t.maxHp, t.hp + Math.abs(amount)) })),
    nextId: grid.nextId,
  };
}

/** Total integrity across all tiles (0..1) — used by the repair button UI. */
export function tileIntegrity(grid: BuildGrid): number {
  if (grid.tiles.length === 0) return 1;
  const total = grid.tiles.reduce((sum, t) => sum + t.maxHp, 0);
  const current = grid.tiles.reduce((sum, t) => sum + t.hp, 0);
  return total === 0 ? 1 : current / total;
}

/** True when any intact roof covers the deck (shelter buff) (RAFT-203). */
export function hasShelter(grid: BuildGrid): boolean {
  return grid.tiles.some((t) => t.kind === 'roof' && t.hp > 0);
}

/** Upgrades a tile's material tier, raising HP (RAFT-209). */
export function upgradeTile(
  grid: BuildGrid,
  col: number,
  row: number,
  material: MaterialTier,
): BuildGrid {
  const tile = findTile(grid, col, row);
  if (!tile) return grid;
  const maxHp = maxHpFor(tile.kind, material);
  return {
    tiles: grid.tiles.map((t) => (t.id === tile.id ? { ...t, material, maxHp, hp: maxHp } : t)),
    nextId: grid.nextId,
  };
}

/** Serialised shape stored in the save file (kept small + version-free). */
export type StoredTile = [
  col: number,
  row: number,
  kind: StructureKind,
  material: MaterialTier,
  hp: number,
  rot: number,
];

export function toStored(grid: BuildGrid): StoredTile[] {
  return grid.tiles.map((t) => [t.col, t.row, t.kind, t.material, Math.round(t.hp), t.rot]);
}

export function fromStored(stored: unknown): BuildGrid {
  if (!Array.isArray(stored)) return EMPTY_GRID;
  const tiles: BuildTile[] = [];
  let nextId = 1;
  for (const raw of stored) {
    if (!Array.isArray(raw) || raw.length < 4) continue;
    const [col, row, kind, material, hp, rot] = raw as [
      number,
      number,
      StructureKind,
      MaterialTier,
      number?,
      number?,
    ];
    if (typeof col !== 'number' || typeof row !== 'number') continue;
    if (!(kind in STRUCTURE_HP)) continue;
    const mat: MaterialTier = material in MATERIAL_HP_MULT ? material : 'wood';
    const maxHp = maxHpFor(kind, mat);
    tiles.push({
      id: nextId++,
      col,
      row,
      kind,
      material: mat,
      hp: Math.max(1, Math.min(maxHp, hp ?? maxHp)),
      maxHp,
      rot: rot ?? 0,
    });
  }
  return { tiles, nextId };
}

/**
 * Migration for pre-grid saves (Phase 2): turns the old flat wall/roof/floor
 * counts into sensible default tile placements so an old run keeps its base.
 */
export function migrateFlatBuild(
  walls: number,
  roofs: number,
  floors: number,
  cols: number,
  rows: number,
): BuildGrid {
  let grid = EMPTY_GRID;
  // Walls hug the deck edge, bottom row first then top row.
  const edge: Array<[number, number]> = [];
  for (let c = 0; c < cols; c++) edge.push([c, rows - 1]);
  for (let c = 0; c < cols; c++) edge.push([c, 0]);
  for (let i = 0, w = 0; i < walls && w < edge.length; i++, w++) {
    grid = placeTile(grid, edge[w][0], edge[w][1], 'wall', 'wood');
  }
  // Roofs cover the top row; floors fill the inner rows.
  for (let i = 0; i < roofs; i++) grid = placeTile(grid, i % cols, 0, 'roof', 'wood');
  let placed = 0;
  for (let row = 1; row < rows - 1 && placed < floors; row++) {
    for (let c = 0; c < cols && placed < floors; c++) {
      grid = placeTile(grid, c, row, 'floor', 'wood');
      placed++;
    }
  }
  return grid;
}
