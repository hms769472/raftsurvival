# Phase 4 — Survival Economy & Balance (RAFT-E4) — Report

Branch: `feature/raft-v0.2` · Range: `phase-3..HEAD` · Tag: `phase-4`

## 1. FILES CREATED

| File path | Purpose | Ticket ID(s) | Lines (approx) | Key exports / functions |
|---|---|---|---|---|
| `components/DevTuningPanel.tsx` | Dev-only live tuning panel (F4), sliders bound to the central `TUNABLE` surface; never mounted in production | RAFT-406 | 72 | `DevTuningPanel` (props: `onClose`) |
| `lib/balance.test.ts` | Vitest regression tests locking the RAFT-402 curve + RAFT-406 tuning surface | RAFT-402/406 | 58 | 5 tests |

## 2. FILES MODIFIED

| File path | What changed | Why | Ticket ID(s) | Lines +/− |
|---|---|---|---|---|
| `lib/balance.ts` | New "Survival economy" block: `DifficultyKey`/`DifficultyMods`/`DIFFICULTY`, `HUNGER_DRAIN`, `THIRST_DRAIN`, `STARVE_DAMAGE`, `DROWN_DAMAGE`, `REGEN_WELL_FED`, `REGEN_STARVING`, `DAY_PRESSURE_STEP`/`MAX`, `WATER_THIRST_RESTORE`, `WATER_BARREL_COST`, `DeathCause`, `FOOD_TIERS`, `FISH_YIELD`, `GOLDEN_FISH_BONUS`, hook constants (`HOOK_REACH`/`SPEED`/`COOLDOWN`/`PULL_SPEED`), `RARE_ITEM_CHANCE`/`RARE_ITEM_BONUS`, `DEATH_LOG_LIMIT`, and the mutable `TUNABLE`/`DEFAULT_TUNABLE`/`TUNABLE_RANGE` + `setTunable`/`resetTunable` helpers | Every balance number lives in one file (ground rule); the mutable surface powers the dev panel | RAFT-402..406 | +106 |
| `lib/save.ts` | `SAVE_VERSION` 5 → 6; `GameSnapshot` gains `driedFish`; `DEFAULT_SNAPSHOT` + `normalizeSnapshot` updated (never throws) | Persist the drying-rack output across sessions | RAFT-405 | +6 / −2 |
| `components/Game.tsx` | Inline difficulty object replaced by `DIFFICULTY[diff]`; `getDifficulty()` typed; `describeDeath()` + `logDeath()` (localStorage `raftDeathLog`, capped); drain now uses `TUNABLE` × difficulty × weather × perks × per-day pressure; drowning/regen from `TUNABLE`; `FOOD_TIERS` for raw/cooked/dried eat; `__eatDriedFish`; `driedFish` in snapshot + payload; drying rack cures fish → `driedFish`; `spawnItem` spawns rare side-lane loot; `fishYield`/`yieldFish`/`grantHookedItem`/`findHookTarget`; hook auto-targets + reels loot; **spear-fishing** in the attack arc; **removed the touch-to-eat loop + `eatCooldown`**; rare items render a golden glow | Phase 4 simulation wiring | RAFT-402..406 | +184 / −110 |
| `components/HUD.tsx` | `driedFish` + `onEatDried` props; dried-fish item slot; 🥓 "Eat Dried" action button (shown only when held) | Surface the dried-fish food tier | RAFT-405 | +9 / −3 |
| `app/page.tsx` | `driedFish` state + wiring (`handleStatsUpdate`, `resetHudValues`, `handleLoadGame`); `handleEatDried`; `IS_DEV` flag; F4 toggles `showDevPanel`; `<DevTuningPanel>` mounted (dev only) | Wire the new HUD value + the dev panel | RAFT-405/406 | +24 / −1 |
| `types/game-globals.d.ts` | `__eatDriedFish?: () => void` | Type the new HUD bridge hook | RAFT-405 | +2 |
| `reports/PROGRESS.md` | Phase 4 rows marked Done | Tracker upkeep | — | +5 / −5 |

## 3. FILES DELETED / MOVED / RENAMED

None. (The old touch-to-eat block and the `eatCooldown` variable were deleted from `components/Game.tsx` under RAFT-404.)

## 4. PER-TICKET SUMMARY

| Ticket | Status | Files | Acceptance criteria |
|---|---|---|---|
| RAFT-401 | Done (verified in Phase 1) | `lib/balance.ts`, `components/Game.tsx` | ✅ `DIFF.hungerRate/thirstRate` applied to the hunger/thirst drain |
| RAFT-402 | Done | `lib/balance.ts` (+test), `components/Game.tsx` | ✅ drain/regen curves re-centred so a do-nothing Normal run empties hunger in ~7.9 min; ✅ each day adds `+4%` pressure up to `2×` (`DAY_PRESSURE_STEP/MAX`); ✅ starvation *and* dehydration both bite HP; ✅ well-fed regen > starving regen; ✅ **local** cause-of-death telemetry (`raftDeathLog`, capped at `DEATH_LOG_LIMIT`, never leaves the browser) |
| RAFT-403 | Done | `lib/balance.ts`, `components/Game.tsx` | ✅ debris spawns (18%) in side lanes outside the raft column; ✅ the hook auto-targets the nearest item within `HOOK_REACH` and reels it in; ✅ rare loot pays `RARE_ITEM_BONUS` of wood **and** plastic + a floating pickup number; ✅ rare items render a pulsing golden glow |
| RAFT-404 | Done | `lib/balance.ts`, `components/Game.tsx` | ✅ "touch fish = instant eat" removed (loop + `eatCooldown` deleted); ✅ fish are landed with the **spear** (`inAttackArc`) or the rod; ✅ yield scales with fish size (`FISH_YIELD`) + a golden-fish bonus |
| RAFT-405 | Done | `components/Game.tsx`, `components/HUD.tsx`, `app/page.tsx`, `lib/save.ts`, `types/game-globals.d.ts` | ✅ `FOOD_TIERS` (raw 35 / cooked 60 / dried 80 +0.5 HP); ✅ drying rack cures a raw fish into a **dried fish**; ✅ HUD dried-fish slot + 🥓 Eat Dried button; ✅ `driedFish` persisted in save v6 |
| RAFT-406 | Done | `lib/balance.ts`, `components/DevTuningPanel.tsx`, `app/page.tsx` | ✅ every gameplay rate/cost/spawn weight centralised in `lib/balance.ts` (the "balance.json" of this TS codebase); ✅ **in-dev** tuning panel (F4) with sliders from `TUNABLE_RANGE`, instant-applied via the mutable `TUNABLE` surface; ✅ dev-gated (`IS_DEV`) so it is never shipped |

**Phase 4 acceptance:** ✅ the survival loop is a real economy — food/water now drain on a tuned curve with day pressure, both starvation and dehydration kill, and death cause is logged locally; ✅ the hook has a unique purpose (only it can reach far/rare loot); ✅ fishing requires intent (spear/rod) instead of walking into fish; ✅ cooked **and** dried fish are meaningful upgrades over raw; ✅ all numbers are centralised and live-tunable in dev.

## 5. DEPENDENCIES

None added.

## 6. CONFIG / DATA CHANGES

- Save schema: `SAVE_VERSION` 5 → 6. New field: `driedFish: number`. Coerced in `normalizeSnapshot`; old (v≤5) saves load with `driedFish = 0` and never crash.
- New balance constants (`lib/balance.ts`): `DIFFICULTY`, `HUNGER_DRAIN=0.0035`, `THIRST_DRAIN=0.003`, `STARVE_DAMAGE=0.0022`, `DROWN_DAMAGE=0.005`, `REGEN_WELL_FED=0.004`, `REGEN_STARVING=0.001`, `DAY_PRESSURE_STEP=0.04`, `DAY_PRESSURE_MAX=2.0`, `WATER_THIRST_RESTORE=40`, `WATER_BARREL_COST=30`, `FOOD_TIERS`, `FISH_YIELD`, `GOLDEN_FISH_BONUS=2`, `HOOK_REACH=340`/`HOOK_SPEED=8`/`HOOK_COOLDOWN=30`/`HOOK_PULL_SPEED=5`, `RARE_ITEM_CHANCE=0.18`, `RARE_ITEM_BONUS=3`, `DEATH_LOG_LIMIT=10`, `TUNABLE`/`DEFAULT_TUNABLE`/`TUNABLE_RANGE`.
- New `window.__*` global: `__eatDriedFish`.
- New localStorage key: `raftDeathLog` (local cause-of-death log, capped at 10).

## 7. BUILD RESULTS

- `npx tsc --noEmit` → 0 errors.
- `npx eslint .` → 0 errors, 33 warnings (all pre-existing / orphan code).
- `npm run build` → ✓ Compiled successfully (Next.js 16.3.7, static `/` + `/_not-found`).
- `npx vitest run` → 6 files, **61 tests passed** (17 combat + 16 raft + 8 progression + 8 perks + 7 objectives + 5 balance).

## 8. MANUAL TEST CHECKLIST

1. Start a fresh Normal run → do nothing and watch the hunger/thirst bars fall; hunger empties in roughly 8 min and HP starts ticking down at 0.
2. Play on **Hard** → the drain is ~1.6× faster; survival is a real struggle before Day 5.
3. Let hunger/thirst hit 0, then die → confirm a death entry is appended to `localStorage.raftDead…`/`raftDeathLog` with a cause (`starved` / `dehydrated` / `drowned` / `sank`).
4. Craft a **Hook** → press the 🪝 button near floating debris → the hook auto-targets the nearest item and reels it in; step off the raft column and confirm only the hook (not walking) can reach the far/rare items.
5. Look for a **golden-glowing** debris item → hook it → confirm an extra wood **and** plastic bonus with floating pickup numbers.
6. Craft a **Spear** → press SPACE next to a fish → the fish is landed and a yield number floats up (bigger / golden fish give more).
7. Walk the player straight through a passing fish → confirm the fish is **not** eaten (touch-to-eat is gone).
8. Build a **Drying Rack** and hold raw fish → over ~20s the raw count drops and the HUD 🥓 slot rises.
9. Press the 🥓 Eat Dried button → hunger jumps by 80 and a little HP is restored.
10. Save & Quit, then Load Game → the dried-fish count is restored.
11. In a **dev** build press **F4** → the tuning panel opens; drag *Hunger drain* and confirm the bars drain faster immediately; press **Reset** to restore defaults. In a production build F4 does nothing.

## 9. KNOWN ISSUES / SKIPPED / UNSURE

- RAFT-405 "spoilage of raw fish" was **optional** in the spec and is **deferred** — raw fish never rot. The drying rack is the raw-fish sink instead.
- `lib/balance.ts` remains TypeScript (not a raw `balance.json`); it is the single source of truth and satisfies the RAFT-406 intent, but a literal JSON file was not introduced (would fight the typed build).
- The tuning panel only exposes the six drain/regen scalars (`TUNABLE`). Costs/spawn weights are centralised but not yet slider-bound.
- Death-cause telemetry is local-only (as specified); there is no export UI for `raftDeathLog`.
- Lint retains 33 pre-existing warnings (unused vars in orphan code, intentional `exhaustive-deps`). Zero errors.

## 10. VERIFICATION

`git diff --stat phase-3..HEAD`:

```
 app/page.tsx            |  24 +++-
 components/Game.tsx     | 290 +++++++++++++++++++++++-------------------
 components/HUD.tsx      |   9 +-
 lib/balance.ts          | 106 ++++++++++++++++++
 lib/save.ts             |   6 +-
 reports/PROGRESS.md     |  10 +-
 types/game-globals.d.ts |   2 +
 7 files changed, 323 insertions(+), 124 deletions(-)
```

Plus 2 new files: `components/DevTuningPanel.tsx`, `lib/balance.test.ts`.
