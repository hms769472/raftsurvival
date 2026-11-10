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

