# CHANGELOG — ALL PHASES

Cumulative, append-only log for the raft-survival v0.2 backlog run.
Branch: `feature/raft-v0.2` · Start tag: `phase-start`

---

## Phase 0 — Stabilize the Build (RAFT-E0) — tag `phase-0`

**Commit:** `0a37207` (RAFT-003..009), `134e0c5` (RAFT-001/002 + hygiene)

**Added**
- `lib/save.ts` — versioned `GameSnapshot`, `normalizeSnapshot`, safe IO
- `.github/workflows/ci.yml` — tsc + lint + build CI

**Modified**
- `app/page.tsx` — snapshot save/load, autosave, ESC pause modal, Game props
- `components/Game.tsx` — `initialState` hydrate, `writeSnapshot`, `paused`, `bumpAch`
- `lib/systems/achievements.ts` — `bumpAchStats`
- `components/AchievementsPanel.tsx`, `Leaderboard.tsx`, `SaveSlots.tsx`, `SkinShop.tsx` — lint fixes

**Tickets:** RAFT-001..009 (RAFT-004 Partial — islands gated on Phase 3)

**Verification:** tsc 0 errors · lint 0 errors / 37 warnings · build OK

---

<!-- Phases 1-6 appended below as they complete -->

## Phase 1 — Combat & Threats (RAFT-E1) — tag `phase-1`

**Commit:** `086b82a`

**Added**
- `lib/systems/combat.ts` — pure combat helpers: `clampHealth`, `applyHeal`, `applyDamage`, `inAttackArc`, `threatScale`, `isEnemyUnlocked`, `simulatedDps`, `rollLoot`
- `lib/systems/combat.test.ts` — 17 Vitest unit tests (hit-check + damage helpers)
- `vitest.config.ts` — Vitest config with `@/*` alias

**Modified**
- `lib/balance.ts` — full Combat block: reach/HP/damage/spawn constants, weapon tiers, threat scaling, loot tables
- `components/Game.tsx` — arc hitboxes, kraken heal fix, loot + XP hook, damage numbers/health bars/hit flash, `playHitSound`, day-based scaling, shark safe-middle removal, wall interaction, `DIFF` multipliers, F3 debug overlay, weapon tiers
- `lib/save.ts` — `SAVE_VERSION 3`, `spearTier` field + validator
- `components/CraftingMenu.tsx` — spear tier display + upgrade button
- `app/page.tsx` — `spearTier` state wiring
- `types/game-globals.d.ts` — typed `__debugHitboxes`, `__onXpFromGame`
- `package.json` — `test` script + `vitest` devDependency

**Tickets:** RAFT-101,102,103,104,105,106,108,110,111 Done · RAFT-107,109 Skipped · RAFT-401 verified Done

**Dependencies:** added `vitest@^3.2.7` (dev) for unit tests.

**Config/data:** save schema v2 → v3 (`spearTier`, defaults to `wooden` on old saves).

**Verification:** tsc 0 errors · lint 0 errors / 37 warnings · build OK · vitest 17/17 passing

---

## Phase 2 — Construction & Base Building (RAFT-E2) — tag `phase-2`

**Commit:** `d73e854`

**Added**
- `lib/systems/raft.ts` — pure tile-grid model: `BuildGrid`, `BuildTile`, `canPlace`, `placeTile`, `removeTile`, `damageTile`, `damageFirstOfKind`, `repairAllTiles`, `tileIntegrity`, `hasShelter`, `upgradeTile`, `toStored`, `fromStored`, `migrateFlatBuild`
- `lib/systems/raft.test.ts` — 16 Vitest unit tests (placement, edge rule, refund, damage/destroy, repair clamp, shelter, upgrade, serialization round-trip, garbage tolerance, flat→grid migration)

**Modified**
- `lib/balance.ts` — Phase 2 block: structure kinds/materials, costs/HP/refund, material HP multipliers + upgrade costs, roof regen, crate/drying-rack/purifier constants, sink sequence, expand/repair costs, weather drain multipliers, `MAX_RAFT_HEALTH`
- `components/Game.tsx` — tile-grid hydration + `migrateFlatBuild` fallback; Build Mode (B / 1-6 / R / T) with ghost preview, canvas-scoped mouse; tile rendering; `statsPayload`; REPAIR/EXPAND craft handling; weather shelter + roof regen; shark→wall grid damage; sink sequence; crate/drying-rack/purifier effects + storage cap; material upgrades; `buildGrid` persisted; listener cleanup
- `components/CraftingMenu.tsx` — REPAIR (disabled at 100%, visible cost), EXPAND (size-scaled), removed flat BUILD buttons → build-mode info block, capacity header
- `app/page.tsx` — `storageCap` + `needsRepair` state, game owns deck/grid for REPAIR/EXPAND, new props
- `components/HUD.tsx` — `storageCap` prop in resource readout
- `lib/save.ts` — `SAVE_VERSION 4`, `buildGrid` field + normalization

**Tickets:** RAFT-205,207,201,202,203,204,206,209,208 Done · save migration Done

**Dependencies:** none added.

**Config/data:** save schema v3 → v4 (`buildGrid`; old flat saves migrate via `migrateFlatBuild`).

**Verification:** tsc 0 errors · lint 0 errors / 37 warnings · build OK · vitest 33/33 passing

---

## Phase 3 — Progression & Goals (RAFT-E3) — tag `phase-3`

**Commit:** _(this commit)_

**Added**
- `lib/systems/progression.ts` — pure XP/level reducer: `DEFAULT_PROGRESSION`, `xpForNext`, `xpProgress`, `addXp` (multi-level, +1 perk point/level, cap `MAX_LEVEL`), `totalPerkPoints`, `normalizeProgression`
- `lib/systems/perks.ts` — 3 branches × 3 perks; `perkEffects` derives damage/cooldown/drain/regen/HP/structure modifiers
- `lib/systems/objectives.ts` — 12-objective chain over monotonic run stats; `advanceChain` reports what just completed
- `lib/systems/progression.test.ts`, `lib/systems/perks.test.ts`, `lib/systems/objectives.test.ts` — 23 new unit tests
- `components/PerkTree.tsx` — perk tree modal (spend points on ranks)
- `components/Victory.tsx` — win screen + New Game+

**Modified**
- `lib/balance.ts` — Phase 3 block: `MAX_LEVEL`, XP curve + `XP_REWARDS`, `TECH_UNLOCK`, island/chest spawn + loot tables, `WIN_DAY`, `STORM_RAFT_DAMAGE`; removed dead `NIGHT_VISION_ALPHA`
- `lib/save.ts` — `SAVE_VERSION 5`; `progression` / `perkRanks` / `objectiveIndex` fields + normalization
- `lib/systems/combat.ts` — extracted `rollTable` for island/chest loot
- `components/Game.tsx` — XP sources; perk effects on combat/survival/build; storm raft damage; island & chest spawn/loot/render; objective counters; win trigger; snapshot persists progression
- `components/HUD.tsx` — XP bar, level chip, objective tracker, cooked-fish slot, perk button + badge
- `components/CraftingMenu.tsx` — `level` prop gates tech tiers (`🔒 Requires LV n`)
- `components/MainMenu.tsx` — `onSkins` + SKINS button
- `app/page.tsx` — progression/perk/objective/victory state + callbacks; `PerkTree`/`Victory`/`SkinShop` mounted; save/load restore; New Game+ & resets

**Tickets:** RAFT-301,302,303,304,305,306,307,308 Done

**Dependencies:** none added.

**Config/data:** save schema v4 → v5 (`progression`, `perkRanks`, `objectiveIndex`; old saves normalize safely).

**Verification:** tsc 0 errors · lint 0 errors / 33 warnings · build OK · vitest 56/56 passing

---

## Phase 4 — Survival Economy & Balance (RAFT-E4) — tag `phase-4`

**Commit:** _(this commit)_

**Added**
- `lib/balance.ts` (block) — survival economy: `DIFFICULTY`, drain/regen/starve/drown rates, `DAY_PRESSURE_*`, `FOOD_TIERS`, `FISH_YIELD`/`GOLDEN_FISH_BONUS`, hook constants, `RARE_ITEM_*`, `DEATH_LOG_LIMIT`, and the mutable `TUNABLE`/`DEFAULT_TUNABLE`/`TUNABLE_RANGE` + `setTunable`/`resetTunable`
- `components/DevTuningPanel.tsx` — dev-only F4 live-tuning panel (never shipped)
- `lib/balance.test.ts` — 5 Vitest regression tests for the RAFT-402 curve + RAFT-406 tuning surface

**Modified**
- `components/Game.tsx` — difficulty from `DIFFICULTY`; `TUNABLE`-driven drain/drown/regen; per-day pressure; `describeDeath`/`logDeath` (local `raftDeathLog`); `FOOD_TIERS` eat paths + `__eatDriedFish`; drying rack → `driedFish`; rare side-lane loot + golden glow (`spawnItem`/`grantHookedItem`); hook auto-target/reel (`findHookTarget`); **spear-fishing**; **removed touch-to-eat loop + `eatCooldown`**
- `lib/save.ts` — `SAVE_VERSION 6`; `driedFish` field + normalization
- `components/HUD.tsx` — dried-fish slot + 🥓 Eat Dried button; `driedFish`/`onEatDried` props
- `app/page.tsx` — `driedFish` state/wiring; `handleEatDried`; `IS_DEV` + F4 toggle; `<DevTuningPanel>` (dev only)
- `types/game-globals.d.ts` — typed `__eatDriedFish`

**Tickets:** RAFT-401,402,403,404,405,406 Done

**Dependencies:** none added.

**Config/data:** save schema v5 → v6 (`driedFish`; old saves default to 0). New local key `raftDeathLog`.

**Verification:** tsc 0 errors · lint 0 errors / 33 warnings · build OK · vitest 61/61 passing

---

## Phase 5 — Onboarding, UX & Controls (RAFT-E5) — tag `phase-5`

**Commit:** _(this commit)_

**Added**
- `lib/controls.ts` — central rebindable bindings: `ControlAction`, `CONTROL_ACTIONS`, `DEFAULT_BINDINGS`, `BINDING_LABELS`, `MOVE_ALIASES`, `normKey`, `keyLabel`, `loadBindings`, `saveBindings`, `matchAction`
- `components/HintToast.tsx` — renders `window.__hint` (contextual tips) + `window.__chestMessage` (world events)
- `components/TouchControls.tsx` — mobile virtual joystick + action buttons, wired through `window.__setMove`

**Modified**
- `components/Game.tsx` — `bindingsRef` + `bindingsChanged` listener; `handleKeyDown`/`handleKeyUp` via `matchAction`; `showHint` + per-frame hint triggers; `window.__setMove` bridge; `pollGamepad()` (stick/D-pad + A/B/X) in `gameLoop`; `window.__threat` mirror
- `components/SettingsMenu.tsx` — CONTROLS rebind section + RESET; 🎓 REPLAY TUTORIAL button
- `components/HUD.tsx` — bar icons/labels (🍖/💧/🪵) + flashing enemy-warning banner (`threat` prop)
- `components/PauseMenu.tsx` — SAVE GAME + LOAD GAME buttons
- `components/SaveSlots.tsx` — slot-aware keys (`slotKey`) + `deleteSnapshot`
- `components/MainMenu.tsx` — LEADERBOARD button; CO-OP gated behind `showCoop`
- `lib/save.ts` — `SAVE_SLOT_COUNT`, `slotKey()`, slot-aware load/save/has, `deleteSnapshot`, `hasAnySnapshot`
- `app/page.tsx` — mount `Tutorial`/`PauseMenu`/`SaveSlots`/`Leaderboard`/`HintToast`/`TouchControls`; `'leaderboard'` scene; `COOP_ENABLED` gate; P/Esc pause; bindings-aware craft hotkey; multi-slot save/load; first-run tutorial + replay; local leaderboard on death
- `types/game-globals.d.ts` — typed `__hint`, `__threat`, `__setMove`

**Tickets:** RAFT-501,502,503,504,505,506,507 Done

**Dependencies:** none added.

**Config/data:** save schema unchanged (v6); slots add `raftSave_1..3` (slot 0 = `raftSave`). New local key `raftBindings`. New bridge globals `__hint`/`__threat`/`__setMove`; new `bindingsChanged` event.

**Verification:** tsc 0 errors · lint 0 errors / 32 warnings · build OK · vitest 61/61 passing

---

## Phase 6 — Tech Debt, Performance & QA (RAFT-E6) — tag `phase-6`

**Commit:** _(working tree — uncommitted)_

**Added**
- `lib/store.ts` — typed `gameStore` + `gameCommands` + `resetGameCommands` (replaces the gameplay `window.__*` globals)
- `lib/logger.ts` — `debug()` gated behind `gameStore.debugHitboxes`; no raw `console.log` in hot paths
- `lib/engine/entities.ts` — shared entity types (`Fish`, `Shark`, `Kraken`, `Frog`, `Island`, `Item`, `Projectile`, `TreasureChest`, `LootPickup`, `DamageNumber`, `WakeParticle`, `Raindrop`, `WaveStreak`, `FishFood`)
- `lib/audio/sfx.ts` — Web Audio SFX: `startWaveSound`, `getAudioCtx`, `isSfxEnabled`, `playFootstepSound`, `playChopSound`, `playHitSound`, `playCraftSound`, `playEatSound`, `playDamageSound`
- `lib/render/drawables.ts` — canvas draw routines: `drawChest`, `drawCloud`, `drawIsland`, `drawFish`, `drawFrog`, `drawShark`, `drawWood`, `drawPlastic`, `drawVerticalRaft`, `drawPlayer`, `drawKraken`, `drawEnemyHealthBar`
- `lib/systems/build.ts` — build/grid helpers + `BuildDeps`/`RunCounters`: `deckMetrics`, `worldToCell`, `cellToWorld`, `placementCtx`, `costFor`, `cellAction`, `statsPayload`, `pushBuildCounts`, `tryPlace`, `tryRemove`, `toCanvasCoords`
- `lib/systems/loot.ts` — loot helpers + `LootDeps`: `spawnDamageNumber`, `grantKillRewards`, `intactWalls`, `fishYield`, `yieldFish`, `grantHookedItem`, `findHookTarget`
- `lib/systems/spawn.ts` — entity spawners: `spawnProjectile`, `spawnFrog`, `spawnIsland`, `spawnChest`, `spawnFishFood`, `spawnFish`, `spawnItem`, `spawnShark`
- `e2e/smoke.spec.ts` + `playwright.config.ts` — Playwright smoke test (start → craft → save → load)
- `lib/save.test.ts` — Vitest round-trip / normalization tests
- `.prettierrc.json`, `.prettierignore`, `.gitattributes`, `eslint.config.mjs` — format/lint hygiene

**Modified**
- `components/Game.tsx` — `RAFT-601` split: ~2,300 lines of loop internals moved out to the six modules above; the component now only wires them via dependency-injection objects (`BuildDeps`, `LootDeps`, `RunCounters`) and thin wrappers. `RAFT-603` effect deps fixed (loop no longer restarts on `gameOver`). Restored **touch-to-eat** fishing (the RAFT-404 removal reversed after design review) with a short bite cooldown, and restored the looping water GIF backdrop.
- `app/globals.css` — removed the CSS `.water-bg` replacement (background is the GIF again)
- `types/game-globals.d.ts` — trimmed gameplay `window.__*` globals now carried by `lib/store.ts`
- `public/assets/backgroundscreen/waterscreen/waterbackground.gif` — restored (RAFT-605 had deleted it)
- `public/assets/audio/gameaudio.mp3` — recompressed (6,042,284 → 1,812,717 bytes)

**Tickets:** RAFT-601,602,603,604,605,606,607 Done

**Dependencies:** added `@playwright/test` (dev).

**Config/data:** save schema unchanged (v6).

**Verification:** tsc 0 errors · lint 0 errors / 0 warnings · build OK · vitest 69/69 passing

---

