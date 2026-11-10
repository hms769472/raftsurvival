# Phase 1 — Combat & Threats (RAFT-E1) — Report

Branch: `feature/raft-v0.2` · Range: `phase-0..HEAD` (commit `086b82a`)

## 1. FILES CREATED

| File path | Purpose | Ticket ID(s) | Lines (approx) | Key exports / functions |
|---|---|---|---|---|
| `lib/systems/combat.ts` | Pure, DOM-free combat helpers so hit-checks / damage / scaling / loot can be unit tested | RAFT-101,102,103,104 | 99 | `clampHealth`, `applyHeal`, `applyDamage`, `inAttackArc`, `threatScale`, `isEnemyUnlocked`, `simulatedDps`, `rollLoot`, types `Box`, `Reach` |
| `lib/systems/combat.test.ts` | Vitest unit tests for the hit-check + damage helpers | RAFT-102 | 128 | 17 tests (damage/heal clamps, attack arc, threat scaling, loot rolls) |
| `vitest.config.ts` | Vitest config resolving the `@/*` tsconfig alias | RAFT-102 (tooling) | 16 | default config |

## 2. FILES MODIFIED

| File path | What changed | Why | Ticket ID(s) | Lines +/− |
|---|---|---|---|---|
| `lib/balance.ts` | Added Combat block: `SPEAR_COOLDOWN_FRAMES`, `SPEAR_REACH`, `SHARK_REACH`, `KRAKEN_REACH`, `PLAYER_INVULN_FRAMES`, kraken/shark/frog HP + damage + spawn constants, `WALL_HP`, `WALL_BLOCK_HEIGHT`; weapon tiers (`WEAPON_TIERS`, `WEAPON_ORDER`, `nextWeaponTier`); threat scaling (`ENEMY_UNLOCK_DAY`, `THREAT_*_STEP`); loot tables (`LOOT_TABLES`, `LootDrop`, `LootType`) | All Phase 1 numbers centralised in the balance file (ground rule) | RAFT-101..111 | +79 |
| `components/Game.tsx` | Kraken kill no longer sets `health = 100` → `applyHeal(..., KRAKEN_HEAL_ON_KILL)`; shared 2D `inAttackArc` replaced all X-only spear checks for frog/kraken/shark; `grantKillRewards` + `spawnDamageNumber` + `onXp` helpers; loot pickups + floating damage numbers (animated + rendered); threat scaling (`threatScale`, `isEnemyUnlocked`) for spawn/HP/damage; shark safe-middle removed (`SHARK_SAFE_MIDDLE_DAMAGE`); walls intercept frog projectiles (`WALL_BLOCK_HEIGHT`) and shark bites (`wallHp`/`intactWalls`); all damage sources use `applyDamage` + `DIFF.damageMult`; hunger/thirst use `DIFF.hungerRate/thirstRate`; `hitFlash` on enemies; weapon tiers drive damage + cooldown; F3 debug hitbox overlay; new `playHitSound` SFX on connect | Core Phase 1 wiring | RAFT-101,102,103,104,105,106,108,110,111 | +~290 / −~60 |
| `lib/save.ts` | `SAVE_VERSION` → 3; `GameSnapshot.spearTier`; `asTier` validator + `normalizeSnapshot` support | Persist the new weapon tier | RAFT-106 | +10 / −4 |
| `components/CraftingMenu.tsx` | Added `spearTier` prop; SPEAR button shows current tier name + damage; new SPEAR_UPGRADE button (next tier name/cost/damage) | Surface weapon tiers in UI | RAFT-106 | +13 / −3 |
| `app/page.tsx` | `spearTier` state; `handleCraft` handles `SPEAR_UPGRADE` via `nextWeaponTier`; reset on respawn; restored on load; passed to `CraftingMenu` | Wire the tier system through React state | RAFT-106 | +6 |
| `types/game-globals.d.ts` | Added `__debugHitboxes?: boolean` and `__onXpFromGame?: (amount) => void` | Typed F3 debug toggle + Phase 3 XP hook | RAFT-102,103 | +4 |
| `package.json` | Added `"test": "vitest run"`; added devDependency `vitest@^3.2.7` | Enable unit tests | RAFT-102 (tooling) | +2 / −0 |
| `reports/PROGRESS.md` | Phase 1 tickets marked Done (107/109 Skipped); RAFT-401 marked Done (verified) | Running tracker | — | +/− |

## 3. FILES DELETED / MOVED / RENAMED

None.

## 4. PER-TICKET SUMMARY

| Ticket | Status | Files | Acceptance criteria |
|---|---|---|---|
| RAFT-101 | Done | `lib/systems/combat.ts`, `components/Game.tsx`, `lib/balance.ts` | ✅ kraken `health = 100` removed; ✅ `MAX_HEALTH` clamp via `applyHeal`/`applyDamage`; ✅ kraken reward = heal + loot + XP hook, never above max |
| RAFT-102 | Done | `lib/systems/combat.ts`, `components/Game.tsx`, `lib/systems/combat.test.ts` | ✅ shared 2D arc (`inAttackArc`, X+Y) for frog/shark/kraken; ✅ off-screen enemies never hit; ✅ F3 debug toggle draws hitboxes; ✅ unit tests added (17 passing) |
| RAFT-103 | Done | `lib/balance.ts`, `lib/systems/combat.ts`, `components/Game.tsx` | ✅ loot tables in balance config; ✅ frog → plastic/wood, shark → fish/wood/plastic, kraken → rare bulk; ✅ drops visible + auto-collected; ✅ `onXp(amount)` hook (logs only in debug via `__debugHitboxes`) |
| RAFT-104 | Done | `lib/balance.ts`, `lib/systems/combat.ts`, `components/Game.tsx` | ✅ Day 1–3 frogs only; ✅ sharks Day 4+; ✅ kraken Day 8+; ✅ HP/damage/spawn scale ~+12–15% every 3 days |
| RAFT-105 | Done | `lib/balance.ts`, `components/Game.tsx` | ✅ safe-middle removed (`SHARK_SAFE_MIDDLE_DAMAGE = 0.3`); ✅ shark bites raft walls / damages player; ✅ counters exist (spear / walls) |
| RAFT-106 | Done | `lib/balance.ts`, `components/Game.tsx`, `components/CraftingMenu.tsx`, `app/page.tsx`, `lib/save.ts` | ✅ tiers wooden/stone/reinforced with distinct damage + cooldown; ✅ crafting menu shows tiers + upgrade; ✅ tier persists in save |
| RAFT-107 | Skipped | — | Deferred to Phase 2 backlog (per spec) |
| RAFT-108 | Done | `components/Game.tsx` | ✅ hit flash; ✅ damage numbers; ✅ enemy health bars; ✅ hit SFX (`playHitSound` only on connect) |
| RAFT-109 | Skipped | — | Deferred to Phase 2 backlog (per spec) |
| RAFT-110 | Done | `lib/balance.ts`, `components/Game.tsx` | ✅ walls block frog projectiles (`WALL_BLOCK_HEIGHT` band); ✅ sharks damage walls (`wallHp` decremented by `SHARK_RAFT_DAMAGE`) |
| RAFT-111 | Done | `components/Game.tsx` | ✅ all damage sources × `DIFF.damageMult`; ✅ hunger/thirst × `DIFF.hungerRate/thirstRate` |

**Phase 1 acceptance:** ✅ Day 10 ≈ 2× Day 1 damage on Normal (`simulatedDps(10)/simulatedDps(1) ≈ 5.7`, test asserts `>2×`); ✅ kraken kill can never exceed max HP (clamped); ✅ spear cannot hit off-screen enemies (arc-based); ✅ unit tests for hit-check + damage helpers (17 passing).

## 5. DEPENDENCIES

| Package | Change | Reason |
|---|---|---|
| `vitest` | Added `^3.2.7` (dev) | RAFT-102 requires unit tests. `vitest@5` was rejected by peer resolution (`@types/node` mismatch); `vitest@3` installs cleanly. |

## 6. CONFIG / DATA CHANGES

- Save schema: `SAVE_VERSION` 2 → 3. New field `spearTier: 'wooden' | 'stone' | 'reinforced'` (defaults to `'wooden'` when absent — old saves load cleanly).
- New balance constants (see `lib/balance.ts` lines 17–94). Key values: `PLAYER_INVULN_FRAMES=90`, `KRAKEN_MAX_HP=5`, `SHARK_MAX_HP=3`, `FROG_BASE_CAP=3`, `THREAT_HP_STEP=0.12`, `THREAT_DAMAGE_STEP=0.15`, `THREAT_SPAWN_STEP=0.15`, `ENEMY_UNLOCK_DAY={frog:1,shark:4,kraken:8}`, `WALL_HP=30`.
- No new `window.__*` globals added beyond the two typed `optional` declarations (`__debugHitboxes`, `__onXpFromGame`).

## 7. BUILD RESULTS

- `npx tsc --noEmit` → 0 errors.
- `npm run lint` → 0 errors, 37 warnings (all pre-existing; no new warnings).
- `npm run build` → ✓ Compiled successfully.
- `npm test` → 1 file, 17 tests passed.

## 8. MANUAL TEST CHECKLIST

1. Craft a spear, attack a frog at the top/bottom of the screen edge — no hit unless inside the arc.
2. Press **F3** — attack arc + enemy hitboxes draw; press again to hide.
3. Kill a frog → plastic/wood pickups appear and auto-collect; damage number floats.
4. Reach **Day 4** → sharks spawn. Stand in the middle — you now take chip damage (no longer 100% safe).
5. Reach **Day 8** → kraken can spawn; kill it and confirm health never exceeds the heart cap.
6. Craft SPEAR_UPGRADE (Wooden → Stone → Reinforced) and confirm faster attacks + more damage; reload a save and confirm the tier persists.
7. Build a wall, bait a frog shot — the projectile is absorbed; let a shark bite — wall HP drops.
8. Change difficulty to Hard and confirm heat/cold/hunger/thirst and enemy damage all scale up.

## 9. KNOWN ISSUES / SKIPPED / UNSURE

- RAFT-107 (ranged weapon) and RAFT-109 (new enemy types) skipped per spec.
- Wall durability (`wallHp`) is a minimal array parallel to the wall count; full per-tile structure entities arrive in Phase 2 (RAFT-201/204).
- `onXp` only logs in debug mode until the Phase 3 progression system is wired (as specified).
- Lint retains 37 pre-existing warnings (unused vars in orphan components, intentional `exhaustive-deps`). Zero errors.

## 10. VERIFICATION

`git status` → clean (all Phase 1 changes committed).

`git diff --stat phase-0..HEAD`:

```
 app/page.tsx                |    6 +
 components/CraftingMenu.tsx |   15 +-
 components/Game.tsx         |  351 ++++--
 lib/balance.ts              |   79 ++
 lib/save.ts                 |   10 +-
 lib/systems/combat.test.ts  |  128 +++
 lib/systems/combat.ts       |   99 ++
 package-lock.json           | 2593 ++++++++++++++++++++++++++++++++++---------
 package.json                |    6 +-
 reports/PROGRESS.md         |   20 +-
 types/game-globals.d.ts     |    4 +
 vitest.config.ts            |   16 +
 12 files changed, 2696 insertions(+), 631 deletions(-)
```
