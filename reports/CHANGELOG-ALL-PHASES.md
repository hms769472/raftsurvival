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

