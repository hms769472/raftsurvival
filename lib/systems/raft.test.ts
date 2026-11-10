import { describe, it, expect } from 'vitest';
import {
  EMPTY_GRID,
  keyOf,
  findTile,
  countKind,
  maxHpFor,
  canPlace,
  placeTile,
  removeTile,
  damageTile,
  damageFirstOfKind,
  repairAllTiles,
  tileIntegrity,
  hasShelter,
  upgradeTile,
  toStored,
  fromStored,
  migrateFlatBuild,
} from './raft';

const ctx = {
  minCol: 0,
  maxCol: 3,
  minRow: 0,
  maxRow: 3,
  wallAllowed: (col: number, row: number) => col === 0 || col === 3 || row === 0 || row === 3,
};

describe('raft grid', () => {
  it('keyOf is stable', () => {
    expect(keyOf(1, 2)).toBe('1,2');
  });

  it('places a tile and reports counts', () => {
    const g = placeTile(EMPTY_GRID, 1, 1, 'floor', 'wood');
    expect(g.tiles).toHaveLength(1);
    expect(countKind(g, 'floor')).toBe(1);
    expect(findTile(g, 1, 1)?.kind).toBe('floor');
    expect(findTile(g, 1, 1)?.maxHp).toBe(maxHpFor('floor', 'wood'));
  });

  it('refuses to place on an occupied cell', () => {
    const g = placeTile(EMPTY_GRID, 1, 1, 'floor', 'wood');
    const g2 = placeTile(g, 1, 1, 'wall', 'wood');
    expect(g2.tiles).toHaveLength(1);
    expect(g2.tiles[0].kind).toBe('floor');
  });

  it('only allows walls on edge cells', () => {
    expect(canPlace(EMPTY_GRID, 1, 1, 'wall', ctx)).toEqual({ ok: false, reason: 'Walls go on edge cells' });
    expect(canPlace(EMPTY_GRID, 0, 1, 'wall', ctx).ok).toBe(true);
  });

  it('rejects placements outside the deck', () => {
    const res = canPlace(EMPTY_GRID, 9, 9, 'floor', ctx);
    expect(res.ok).toBe(false);
  });

  it('material tier raises max HP', () => {
    expect(maxHpFor('wall', 'metal')).toBeGreaterThan(maxHpFor('wall', 'wood'));
  });

  it('refund is 50% of the base cost, rounded down', () => {
    const g = placeTile(EMPTY_GRID, 1, 1, 'crate', 'wood'); // crate = 10 wood, 4 plastic
    const { grid, refund } = removeTile(g, 1, 1);
    expect(grid.tiles).toHaveLength(0);
    expect(refund).toEqual({ wood: 5, plastic: 2 });
  });

  it('damage destroys a tile at 0 HP', () => {
    let g = placeTile(EMPTY_GRID, 1, 1, 'roof', 'wood'); // roof 25 hp
    g = damageTile(g, 1, 1, 10);
    expect(findTile(g, 1, 1)?.hp).toBe(15);
    g = damageTile(g, 1, 1, 100);
    expect(findTile(g, 1, 1)).toBeUndefined();
  });

  it('damageFirstOfKind targets the first intact unit', () => {
    let g = placeTile(EMPTY_GRID, 0, 1, 'wall', 'wood');
    g = placeTile(g, 0, 2, 'wall', 'wood');
    g = damageFirstOfKind(g, 'wall', 100);
    expect(countKind(g, 'wall')).toBe(1);
  });

  it('repair clamps to max HP', () => {
    let g = placeTile(EMPTY_GRID, 1, 1, 'roof', 'wood');
    g = damageTile(g, 1, 1, 10);
    g = repairAllTiles(g, 999);
    expect(findTile(g, 1, 1)?.hp).toBe(maxHpFor('roof', 'wood'));
  });

  it('tileIntegrity is 1 with no tiles and drops when damaged', () => {
    expect(tileIntegrity(EMPTY_GRID)).toBe(1);
    let g = placeTile(EMPTY_GRID, 1, 1, 'roof', 'wood');
    g = damageTile(g, 1, 1, 5);
    expect(tileIntegrity(g)).toBeLessThan(1);
  });

  it('hasShelter is true only with an intact roof', () => {
    let g = placeTile(EMPTY_GRID, 1, 1, 'wall', 'wood');
    expect(hasShelter(g)).toBe(false);
    g = placeTile(g, 1, 2, 'roof', 'wood');
    expect(hasShelter(g)).toBe(true);
  });

  it('upgradeTile raises HP and material', () => {
    let g = placeTile(EMPTY_GRID, 1, 1, 'wall', 'wood');
    g = upgradeTile(g, 1, 1, 'metal');
    const t = findTile(g, 1, 1)!;
    expect(t.material).toBe('metal');
    expect(t.maxHp).toBe(maxHpFor('wall', 'metal'));
    expect(t.hp).toBe(t.maxHp);
  });
});

describe('serialization', () => {
  it('round-trips through toStored/fromStored', () => {
    let g = placeTile(EMPTY_GRID, 0, 1, 'wall', 'reinforced');
    g = placeTile(g, 1, 1, 'crate', 'wood');
    const restored = fromStored(toStored(g));
    expect(countKind(restored, 'wall')).toBe(1);
    expect(countKind(restored, 'crate')).toBe(1);
    expect(findTile(restored, 0, 1)?.material).toBe('reinforced');
  });

  it('fromStored tolerates garbage', () => {
    expect(fromStored(null).tiles).toHaveLength(0);
    expect(fromStored([['x']]).tiles).toHaveLength(0);
    expect(fromStored([[1, 1, 'bogus', 'wood', 10, 0]]).tiles).toHaveLength(0);
  });
});

describe('pre-grid migration', () => {
  it('turns flat counts into edge/roof/floor tiles', () => {
    const g = migrateFlatBuild(2, 1, 1, 2, 4);
    expect(countKind(g, 'wall')).toBe(2);
    expect(countKind(g, 'roof')).toBe(1);
    expect(countKind(g, 'floor')).toBe(1);
  });
});
