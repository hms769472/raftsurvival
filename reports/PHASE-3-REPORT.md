# Phase 3 — Progression & Goals (RAFT-E3) — Report

Branch: `feature/raft-v0.2` · Range: `phase-2..HEAD` · Tag: `phase-3`

## 1. FILES CREATED

| File path | Purpose | Ticket ID(s) | Lines (approx) | Key exports / functions |
|---|---|---|---|---|
| `lib/systems/progression.ts` | Pure, DOM-free XP / level reducer so the whole curve is unit testable | RAFT-301 | 82 | `ProgressionState`, `DEFAULT_PROGRESSION`, `xpForNext`, `xpProgress`, `addXp`, `totalPerkPoints`, `normalizeProgression` |
| `lib/systems/perks.ts` | Pure perk-tree model — 3 branches × 3 perks + derived modifiers | RAFT-302 | 128 | `PERK_BRANCHES`, `PERKS`, `PerkRanks`, `PerkEffects`, `NEUTRAL_EFFECTS`, `normalizePerkRanks`, `perkRank`, `ranksSpent`, `canRankUp`, `rankUp`, `perkEffects` |
| `lib/systems/objectives.ts` | Pure objective-chain model over monotonic run stats | RAFT-304 | 83 | `OBJECTIVES` (12), `EMPTY_OBJECTIVE_STATS`, `currentObjective`, `objectiveMet`, `objectiveProgress`, `advanceChain` |
| `lib/systems/progression.test.ts` | Vitest unit tests for the XP curve / level-ups / clamping / normalization | RAFT-301 | 59 | 8 tests |
| `lib/systems/perks.test.ts` | Vitest unit tests for the perk tree (branch sizes, max ranks, effects, normalization) | RAFT-302 | 63 | 8 tests |
| `lib/systems/objectives.test.ts` | Vitest unit tests for the objective chain (advance, rewards-once, progress) | RAFT-304 | 51 | 7 tests |
| `components/PerkTree.tsx` | Perk tree modal — three branches, spend perk points on ranks | RAFT-302 | 56 | `PerkTree` (props: `onClose`, `level`, `freePoints`, `ranks`, `onSpendPerk`) |
| `components/Victory.tsx` | Win screen after surviving to `WIN_DAY`, with a New Game+ hook | RAFT-306 | 35 | `Victory` (props: `day`, `level`, `coinsEarned`, `onNewGamePlus`, `onMainMenu`) |

## 2. FILES MODIFIED

| File path | What changed | Why | Ticket ID(s) | Lines +/− |
|---|---|---|---|---|
| `lib/balance.ts` | Phase 3 block: `MAX_LEVEL=10`, `XP_CURVE_BASE=100`, `XP_CURVE_STEP=60`, `XP_REWARDS`, `TECH_UNLOCK`, `ISLAND_SPAWN_PERIOD`, `CHEST_SPAWN_PERIOD`, `ISLAND_LOOT`, `CHEST_LOOT`, `WIN_DAY=20`, `STORM_RAFT_DAMAGE`; removed dead `NIGHT_VISION_ALPHA` | All Phase 3 numbers centralised in the balance file (ground rule) | RAFT-301..308 | +53 |
| `lib/save.ts` | `SAVE_VERSION` 4 → 5; `GameSnapshot` gains `progression`, `perkRanks`, `objectiveIndex`; `DEFAULT_SNAPSHOT` + `normalizeSnapshot` updated (total, never throws) | Persist progression / perks / objective progress across sessions | RAFT-301/302/304 | +16 / −2 |
| `lib/systems/combat.ts` | Extracted `rollTable(table, rng)`; `rollLoot(enemy)` now delegates to it | Reusable loot-rolling for island / chest tables (RAFT-305) | RAFT-305 | +16 / −8 |
| `components/Game.tsx` | New props `perkEffects`, `onXp`, `rewardAction`, `onRewardComplete`, `onVictory`, `progression`, `perkRanks`, `objectiveIndex` (all bridged via refs so the loop never restarts); XP granted on craft/upgrade/kill/gather/catch/explore; perk effects applied to damage, cooldown, hunger/thirst drain, regen, `maxHealth`, structure cost/HP; storm raft damage; island & chest spawn + loot + render; per-frame objective counters in `statsPayload`; win trigger at `WIN_DAY`; `writeSnapshot` persists the three new fields | Phase 3 simulation wiring | RAFT-301..308 | +232 / −~24 |
| `components/HUD.tsx` | New props `maxHearts`, `level`, `xpFill`, `objective`, `objectiveFill`, `cookedFish`, `freePerkPoints`, `onOpenPerks`; XP bar, level chip, objective tracker, cooked-fish slot, perk button with a free-points badge | Surface progression / goals on the HUD | RAFT-301/302/304/305 | +38 / −6 |
| `components/CraftingMenu.tsx` | `level` prop gates tech tiers via `TECH_UNLOCK`; locked buttons show `🔒 Requires LV n` | Level-gated tech tiers | RAFT-303 | +32 / −? |
| `components/MainMenu.tsx` | New `onSkins` prop + SKINS button | Mount the skin shop from the menu | RAFT-307 | +6 |
| `app/page.tsx` | Progression / perk / objective / victory state + refs; `applyXp` (level-up toast), `grantObjectiveRewards`, `handleSpendPerk`, `handleVictory`, `handleNewGamePlus`, `resetProgression`, `resetHudValues`; objective advancement fed from `handleStatsUpdate`; `perkEffects(perkRanks)` memo; new props to `<Game>`/`<HUD>`/`<CraftingMenu>`; mounted `<PerkTree>`, `<Victory>`, `<SkinShop>` (+ `skins` scene); save/load restore; ESC closes the perk tree | Wire Phase 3 through React state | RAFT-301..308 | +249 / −? |

## 3. FILES DELETED / MOVED / RENAMED

None.

## 4. PER-TICKET SUMMARY

| Ticket | Status | Files | Acceptance criteria |
|---|---|---|---|
| RAFT-301 | Done | `lib/systems/progression.ts` (+test), `lib/balance.ts`, `components/Game.tsx`, `components/HUD.tsx`, `app/page.tsx`, `lib/save.ts` | ✅ XP earned from crafting/upgrading/kills/gathering/catching/exploring; ✅ level-ups grant **1 perk point each**; ✅ HUD XP bar (`LV{n}` + fill); ✅ level-up toast; ✅ persisted in save v5 |
| RAFT-302 | Done | `lib/systems/perks.ts` (+test), `components/PerkTree.tsx`, `components/Game.tsx`, `components/HUD.tsx`, `app/page.tsx` | ✅ 3 branches (Survivor / Fighter / Builder) × 3 perks; ✅ modal opened from the HUD ⭐ button; ✅ one point per rank, clamped at `maxRank`; ✅ effects applied live (damage, cooldown, drains, regen, max HP, structure cost/HP) |
| RAFT-303 | Done | `components/CraftingMenu.tsx`, `lib/balance.ts` | ✅ tech tiers gated by `TECH_UNLOCK[type]`; ✅ locked items show `🔒 Requires LV n` and are disabled |
| RAFT-304 | Done | `lib/systems/objectives.ts` (+test), `app/page.tsx`, `components/HUD.tsx`, `components/Game.tsx` | ✅ 12-objective chain (≥10); ✅ HUD tracker shows current goal + progress bar; ✅ rewards (XP / wood / plastic / coins) granted **once** via `advanceChain`; ✅ completion toast |
| RAFT-305 | Done | `components/Game.tsx`, `lib/systems/combat.ts`, `lib/balance.ts` | ✅ floating islands & treasure chests spawn on timers; ✅ drift down the world; ✅ rendered on canvas (`drawIsland`/`drawChest`); ✅ loot rolled from `ISLAND_LOOT`/`CHEST_LOOT` via `rollTable`, auto-collected, increments `islandsFound` |
| RAFT-306 | Done | `components/Victory.tsx`, `components/Game.tsx`, `app/page.tsx`, `lib/balance.ts` | ✅ win fires once at `day ≥ WIN_DAY` (20); ✅ `Victory` screen with day/level/coins; ✅ coins payout; ✅ New Game+ resets the run but **keeps perk ranks + coins** |
| RAFT-307 | Done | `components/MainMenu.tsx`, `app/page.tsx` | ✅ `SkinShop` mounted via a new `skins` scene; ✅ SKINS button added to the main menu; ✅ shop reads/writes `raftCoins` / `raftOwnedSkins` / `raftSelectedSkin` |
| RAFT-308 | Done | `components/Game.tsx`, `lib/balance.ts` | ✅ weather cycles (clear/rain/snow/heat); ✅ heat drains thirst ×`WEATHER_HEAT_THIRST`, snow drains hunger ×`WEATHER_SNOW_HUNGER`, rain drains both; ✅ storm batters an **unsheltered** raft (`STORM_RAFT_DAMAGE`/frame); ✅ a roof (`hasShelter`) negates all of it |

**Phase 3 acceptance:** ✅ the player earns XP from real actions and levels up; ✅ perk points always have somewhere meaningful to go (perk tree); ✅ there is always a clear next goal (objective chain + rewards); ✅ resource sinks exist (structures, upgrades, tech tiers); ✅ the run has an ending (Day 20 → Victory → New Game+), so a player can play from Day 1 to the win screen with clear goals.

## 5. DEPENDENCIES

None added.

## 6. CONFIG / DATA CHANGES

- Save schema: `SAVE_VERSION` 4 → 5. New fields: `progression: ProgressionState`, `perkRanks: PerkRanks`, `objectiveIndex: number`. All coerced in `normalizeSnapshot` via `normalizeProgression` / `normalizePerkRanks`; old (v≤4) saves load with sensible defaults and never crash.
- New balance constants (`lib/balance.ts`): `MAX_LEVEL=10`, `XP_CURVE_BASE=100`, `XP_CURVE_STEP=60`, `XP_REWARDS`, `TECH_UNLOCK`, `ISLAND_SPAWN_PERIOD=1500`, `CHEST_SPAWN_PERIOD=2100`, `ISLAND_LOOT`, `CHEST_LOOT`, `WIN_DAY=20`, `STORM_RAFT_DAMAGE=0.02`.
- Removed dead constant `NIGHT_VISION_ALPHA`.
- No new `window.__*` globals added.

## 7. BUILD RESULTS

- `npx tsc --noEmit` → 0 errors.
- `npm run lint` → 0 errors, 33 warnings (all pre-existing / orphan code).
- `npm run build` → ✓ Compiled successfully (5 static pages).
- `npm test` → 5 files, **56 tests passed** (17 combat + 16 raft + 8 progression + 8 perks + 7 objectives).

## 8. MANUAL TEST CHECKLIST

1. Start a fresh run → the HUD shows `LV1`, an empty XP bar and the first objective ("Gather 20 wood").
2. Gather wood / catch fish / craft a tool → the XP bar fills; on level-up a `LEVEL n` toast appears and the ⭐ button gains a badge.
3. Open the ⭐ perk button → spend a point in Survivor/Fighter/Builder → confirm the badge decrements and the effect applies (e.g. Vigor adds a max heart, Might raises spear damage, Thrift lowers structure cost).
4. Open the crafting menu → confirm high-tier items show `🔒 Requires LV n` while under-levelled and become craftable once the level is reached.
5. Complete an objective → a `OBJECTIVE COMPLETE` toast fires and the reward is granted **once** (check wood/plastic/coins/XP).
6. Drift for a while → a floating island and a treasure chest appear; collide/loot them → resources + XP grant and the island counter advances.
7. Shelter the deck with roofs → during rain/snow/heat the hunger/thirst drain is no longer boosted and the raft stops losing integrity in a storm.
8. Survive to Day 20 → the Victory screen appears with day/level/coins; press **NEW GAME +** → a fresh run starts with perk ranks and coins kept; press MAIN MENU → returns to the menu.
9. From the main menu press **SKINS** → the skin shop opens; buy/select a skin and confirm the coins balance updates.
10. Save & Quit, then Load Game → level, XP, perks and the current objective index are restored.

## 9. KNOWN ISSUES / SKIPPED / UNSURE

- Objective run-counters (`woodGathered`, `fishCaught`, `kills`, …) are **not** persisted; after a Load the chain index is restored but in-progress counters rebuild from zero. Completed objectives remain completed (the chain only moves forward), so this is cosmetic for an objective in progress at save time.
- The level-up / objective toasts reuse `AchievementToast` (header reads "★ ACHIEVEMENT ★"); acceptable reuse, but a dedicated progression toast would read better.
- RAFT-107 (ranged weapon) and RAFT-109 (extra enemy types) remain Skipped (P2) from Phase 1.
- Lint retains 33 pre-existing warnings (unused vars in orphan code, intentional `exhaustive-deps`). Zero errors.

## 10. VERIFICATION

`git diff --stat phase-2..HEAD`:

```
 app/page.tsx                | 249 +++++++++++++++++++++++++++++++++++++++++---
 components/CraftingMenu.tsx |  32 +++---
 components/Game.tsx         | 232 +++++++++++++++++++++++++++++++++++++----
 components/HUD.tsx          |  38 ++++++-
 components/MainMenu.tsx     |   6 +-
 lib/balance.ts              |  53 ++++++++++
 lib/save.ts                 |  16 ++-
 lib/systems/combat.ts       |  16 ++-
 8 files changed, 586 insertions(+), 56 deletions(-)
```

Plus 8 new files: `lib/systems/progression.ts`, `lib/systems/perks.ts`, `lib/systems/objectives.ts`, `lib/systems/progression.test.ts`, `lib/systems/perks.test.ts`, `lib/systems/objectives.test.ts`, `components/PerkTree.tsx`, `components/Victory.tsx`.
