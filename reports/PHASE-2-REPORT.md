# Phase 2 — Construction & Base Building (RAFT-E2) — Report

Branch: `feature/raft-v0.2` · Range: `phase-1..HEAD` (commit `d73e854`) · Tag: `phase-2`

## 1. FILES CREATED

| File path | Purpose | Ticket ID(s) | Lines (approx) | Key exports / functions |
|---|---|---|---|---|
| `lib/systems/raft.ts` | Pure, DOM-free tile-grid model for the raft so placement / damage / repair / upgrade / serialization can be unit tested | RAFT-201,202,203,204,205,209 | 218 | `BuildTile`, `BuildGrid`, `EMPTY_GRID`, `keyOf`, `findTile`, `countKind`, `maxHpFor`, `canPlace`, `placeTile`, `removeTile`, `damageTile`, `damageFirstOfKind`, `repairAllTiles`, `tileIntegrity`, `hasShelter`, `upgradeTile`, `toStored`, `fromStored`, `migrateFlatBuild`, `StoredTile` |
| `lib/systems/raft.test.ts` | Vitest unit tests for the raft grid (placement, edge rule, refund, damage/destroy, repair clamp, shelter, upgrade, round-trip, garbage tolerance, flat→grid migration) | RAFT-201,202,203,204,205,209 | 141 | 16 tests (all passing) |

## 2. FILES MODIFIED

| File path | What changed | Why | Ticket ID(s) | Lines +/− |
|---|---|---|---|---|
| `lib/balance.ts` | Added Phase 2 block: `StructureKind`, `MaterialTier`, `TILE_SIZE`, `STRUCTURE_HP`, `STRUCTURE_COST`, `STRUCTURE_REFUND`, `MATERIAL_HP_MULT`, `MATERIAL_UPGRADE_COST`, `MATERIAL_ORDER`, `ROOF_REGEN_BONUS`, `CRATE_CAPACITY`, `STORAGE_CAP_BASE`, `DRYING_RACK_PERIOD`, `PURIFIER_PERIOD`, `SINK_WARNING_FRAMES`, `SINK_TILE_LOSS_INTERVAL`, `RAFT_REPAIR_COST`, `RAFT_REPAIR_AMOUNT`, `BASE_RAFT_HEIGHT`, `EXPAND_COST_BASE`, `EXPAND_COST_STEP`, `EXPAND_SIZE`, `WEATHER_HEAT_THIRST`, `WEATHER_SNOW_HUNGER`, `WEATHER_RAIN_DRAIN`, `MAX_RAFT_HEALTH` | All Phase 2 numbers centralised in the balance file (ground rule) | RAFT-201..209 | +70 |
| `components/Game.tsx` | Grid hydration (`buildGridRef` + `migrateFlatBuild` fallback); `buildModeRef` + build helpers (`deckMetrics`, `worldToCell`, `cellToWorld`, `placementCtx`, `costFor`, `cellAction`, `tryPlace`, `tryRemove`, `toCanvasCoords`); B/1-6/R/T key handling; canvas-scoped `handleMouseMove`/`handleMouseDown`/`handleContextMenu` (+cleanup); tile rendering + ghost preview; `statsPayload()` (raftSize/capacity/damaged/walls/roofs/floors); REPAIR(205)/EXPAND(207) craft handling; weather shelter + roof regen (203); shark→wall damage via grid (204); sink sequence (206); purifier/drying-rack/crate effects + storage cap (208); material upgrades (209); `writeSnapshot` persists `buildGrid`; effect cleanup removes all listeners | Phase 2 core wiring | RAFT-201..209 | +359 / −~54 |
| `components/CraftingMenu.tsx` | New props `needsRepair`/`expansions`/`capacity`; REPAIR button (disabled at 100%, visible cost); EXPAND button with size-scaled cost; removed old BUILD WALL/ROOF/FLOOR buttons → dashed "BUILD MODE (in game)" info block; header shows `Wood/Plastic: n/capacity` | RAFT-205, 207, 208 UI | RAFT-205,207,208 | +48 |
| `app/page.tsx` | `storageCap` + `needsRepair` state; `handleStatsUpdate` reads raftSize/capacity/damaged; `handleCraft` no longer caps resources locally (game owns deck/grid for REPAIR/EXPAND); `expansions` derived; new props passed to HUD/CraftingMenu | Wire the grid/economy through React state | RAFT-205,207,208 | +26 |
| `components/HUD.tsx` | Added `storageCap` prop; resource readout shows `Wood: n/cap`, `Plastic: n/cap` | RAFT-208 storage cap | RAFT-208 | +10 |
| `lib/save.ts` | `SAVE_VERSION` 3 → 4; `GameSnapshot.buildGrid: StoredTile[]`; `normalizeSnapshot` reads `buildGrid` (defaults `[]`) | Persist the grid; keep old saves loadable | RAFT-201 (+migration) | +7 |
| `reports/PROGRESS.md` | Phase 2 tickets marked Done | Running tracker | — | +/− |

## 3. FILES DELETED / MOVED / RENAMED

None.

## 4. PER-TICKET SUMMARY

| Ticket | Status | Files | Acceptance criteria |
|---|---|---|---|
| RAFT-205 | Done | `components/Game.tsx`, `components/CraftingMenu.tsx`, `lib/balance.ts` | ✅ REPAIR fixes `raftHealth` **and** structure HP (`repairAllTiles`), never player HP; ✅ disabled at 100%; ✅ cost visible (`RAFT_REPAIR_COST`, `+RAFT_REPAIR_AMOUNT` shown) |
| RAFT-207 | Done | `components/CraftingMenu.tsx`, `components/Game.tsx`, `app/page.tsx`, `lib/balance.ts` | ✅ EXPAND button exposed; ✅ logic deducts wood/plastic and grows the deck; ✅ cost scales with size (`EXPAND_COST_BASE + EXPAND_COST_STEP × expansions`) |
| RAFT-201 | Done | `lib/systems/raft.ts`, `components/Game.tsx`, `lib/save.ts` | ✅ raft is a tile grid (`BuildGrid`); ✅ grid persists in save v4; ✅ flat old saves converted via `migrateFlatBuild` |
| RAFT-202 | Done | `lib/systems/raft.ts`, `components/Game.tsx` | ✅ Build Mode on key **B**; ✅ green/red ghost validity; ✅ click to place, right-click remove; ✅ rotate with **R**; ✅ 50% refund (`STRUCTURE_REFUND`) on remove; ✅ resources deducted only on success |
| RAFT-203 | Done | `lib/systems/raft.ts`, `components/Game.tsx`, `lib/balance.ts` | ✅ roofed tiles = `hasShelter`; ✅ rain/snow/heat penalties negated when sheltered; ✅ `ROOF_REGEN_BONUS` regen while sheltered |
| RAFT-204 | Done | `lib/systems/raft.ts`, `components/Game.tsx`, `lib/balance.ts` | ✅ walls have per-tile HP; ✅ shark bites damage walls (`damageFirstOfKind`); ✅ walls block frog projectiles (band retained); ✅ repairable |
| RAFT-206 | Done | `components/Game.tsx`, `lib/balance.ts` | ✅ `raftHealth 0` → warning countdown (`SINK_WARNING_FRAMES`); ✅ tiles lost every `SINK_TILE_LOSS_INTERVAL`; ✅ game over after the loss sequence |
| RAFT-209 | Done | `lib/systems/raft.ts`, `components/Game.tsx`, `lib/balance.ts` | ✅ material tiers wood → reinforced → metal; ✅ **T** cycles material; ✅ HP = base × `MATERIAL_HP_MULT`; ✅ upgrade path on an existing tile with `MATERIAL_UPGRADE_COST` |
| RAFT-208 | Done | `lib/balance.ts`, `components/Game.tsx`, `components/CraftingMenu.tsx`, `components/HUD.tsx`, `app/page.tsx` | ✅ Storage crate raises wood/plastic cap (`CRATE_CAPACITY` per crate); ✅ drying rack converts raw fish → cooked over `DRYING_RACK_PERIOD`; ✅ purifier adds barrel water over `PURIFIER_PERIOD` |
| Migration | Done | `lib/save.ts`, `components/Game.tsx`, `lib/systems/raft.ts` | ✅ versioned schema v4; ✅ old flat saves → `migrateFlatBuild`; ✅ `normalizeSnapshot` never throws on garbage/corrupt blobs |

**Phase 2 acceptance:** ✅ the player decides where to build (grid + build mode + rotation); ✅ structures affect gameplay (shelter, wall blocking, storage cap, drying rack, purifier); ✅ the raft can sink (warning → tile loss → game over).

## 5. DEPENDENCIES

None added.

## 6. CONFIG / DATA CHANGES

- Save schema: `SAVE_VERSION` 3 → 4. New field `buildGrid: StoredTile[]` (defaults to `[]`; old flat saves migrate via `migrateFlatBuild`). `normalizeSnapshot` remains total (never throws).
- New balance constants (`lib/balance.ts`): `TILE_SIZE=40`, `BASE_RAFT_HEIGHT=150`, `EXPAND_SIZE=40`, `MAX_RAFT_HEALTH=100`, `STRUCTURE_HP={wall:30,floor:40,roof:25,crate:24,dryingrack:20,purifier:20}`, `STRUCTURE_COST`, `STRUCTURE_REFUND=0.5`, `MATERIAL_HP_MULT={wood:1,reinforced:1.6,metal:2.5}`, `MATERIAL_UPGRADE_COST`, `ROOF_REGEN_BONUS=0.02`, `CRATE_CAPACITY=40`, `STORAGE_CAP_BASE=100`, `DRYING_RACK_PERIOD=1200`, `PURIFIER_PERIOD=1800`, `SINK_WARNING_FRAMES=300`, `SINK_TILE_LOSS_INTERVAL=40`, `RAFT_REPAIR_COST={wood:5,plastic:0}`, `RAFT_REPAIR_AMOUNT=25`, `EXPAND_COST_BASE={wood:10,plastic:5}`, `EXPAND_COST_STEP={wood:5,plastic:3}`, `WEATHER_HEAT_THIRST=1.8`, `WEATHER_SNOW_HUNGER=1.8`, `WEATHER_RAIN_DRAIN=1.3`.
- No new `window.__*` globals added.

## 7. BUILD RESULTS

- `npx tsc --noEmit` → 0 errors.
- `npm run lint` → 0 errors, 37 warnings (all pre-existing).
- `npm run build` → ✓ Compiled successfully.
- `npm test` → 2 files, 33 tests passed (17 combat + 16 raft).

## 8. MANUAL TEST CHECKLIST

1. Craft a Hammer, press **B** → build mode; move the mouse over the deck → green/red ghost preview; click to place a wall on an edge cell only.
2. Press **1**–**6** to pick wall/floor/roof/crate/drying-rack/purifier; press **R** to rotate; press **T** to cycle wood → reinforced → metal and confirm the ghost color/cost changes.
3. Place a wall, right-click it → it is removed and 50% of the cost is refunded.
4. Place a **roof** and stand under it during rain/snow/heat → hunger/thirst drain is no longer boosted.
5. Let a shark bite a wall → confirm the wall tile loses HP; craft REPAIR → raft integrity + structure HP restore; button is disabled at 100%.
6. Buy EXPAND from the crafting menu → the deck grows; the cost increases each purchase.
7. Build a drying rack with raw fish → after ~20s raw fish become cooked; build a purifier → barrel water ticks up; build crates → `Wood: n/cap` cap rises in HUD and crafting header.
8. Drive the raft to 0 % (or use debug) → warning message, tiles are lost, then game over.
9. Load an old (v3) save → it loads and flat walls/roofs/floors are converted to grid tiles.

## 9. KNOWN ISSUES / SKIPPED / UNSURE

- Structure HP is derived per-tile in the grid; the legacy `wallHp` array from Phase 1 was removed in favour of `damageFirstOfKind`.
- Sail and Net (mentioned in RAFT-208) are not implemented; only crate / drying rack / purifier are in scope for this phase (the spec listed the three "with a real effect").
- Lint retains 37 pre-existing warnings (unused vars in orphan code, intentional `exhaustive-deps`). Zero errors.
- Assumption: "walls" are only placeable on edge cells (the outer ring) so shelter is meaningful; roofed tiles grant shelter.

## 10. VERIFICATION

`git status` → clean (all Phase 2 changes committed).

`git diff --stat phase-1..HEAD`:

```
 app/page.tsx                |  26 +++-
 components/CraftingMenu.tsx |  48 ++++--
 components/Game.tsx         | 359 ++++++++++++++++++++++++++++++++++++++++----
 components/HUD.tsx          |  10 +-
 lib/balance.ts              |  70 +++++++++
 lib/save.ts                 |   7 +-
 lib/systems/raft.test.ts    | 141 +++++++++++++++++
 lib/systems/raft.ts         | 218 +++++++++++++++++++++++++++
 8 files changed, 825 insertions(+), 54 deletions(-)
```
