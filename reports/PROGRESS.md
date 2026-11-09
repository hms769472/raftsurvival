# Raft Survival — v0.2 Progress Tracker

Branch: `feature/raft-v0.2` · Start tag: `phase-start` · Source of truth: `RAFT-SURVIVAL-ANALYSIS-AND-EPIC.md`

Legend: `Todo` · `In progress` · `Done` · `Partial` · `Skipped`

---

## Phase 0 — Stabilize the Build (RAFT-E0)

| Key | Title | Status |
|---|---|---|
| RAFT-001 | Fix `hasRainBarrel` missing in `GameProps` & destructure | Todo |
| RAFT-002 | Fix `checkAchievements` scope errors (`time`, `diff`) + replace `require()` with ES import | Todo |
| RAFT-003 | Call `checkAchievements()` periodically (every ~5s) and on key events | Todo |
| RAFT-004 | Track missing stats (fish eaten, walls/roof/barrel built, islands, hook pickups) | Todo |
| RAFT-005 | Unify day length across HUD & achievements (single `DAY_LENGTH` constant) | Todo |
| RAFT-006 | Fix Load Game: restore Game internal state (stats, `time`, enemies reset) | Todo |
| RAFT-007 | Autosave every N seconds + save on tab close; add "Continue" | Todo |
| RAFT-008 | Confirm dialog on ESC/Main Menu ("Save & quit / Quit / Cancel") | Todo |
| RAFT-009 | Add CI: `tsc --noEmit`, `eslint`, `next build` on every PR | Todo |

## Phase 1 — Combat & Threat System (RAFT-E1)

| Key | Title | Status |
|---|---|---|
| RAFT-101 | Fix kraken kill `health = 100` exploit (clamp; reward heal) | Todo |
| RAFT-102 | Proper 2D hitboxes for spear vs shark/kraken/frog (shared `attackArc`) | Todo |
| RAFT-103 | Loot & XP drops from frog/shark/kraken kills | Todo |
| RAFT-104 | Day-based threat scaling (spawn rate, HP, damage, enemy tiers) | Todo |
| RAFT-105 | Shark AI: remove "safe middle" exploit | Todo |
| RAFT-106 | Weapon tiers: Wooden → Stone/Scrap → Reinforced spear | Todo |
| RAFT-107 | Ranged weapon: bow/harpoon gun with ammo | Skipped (P2) |
| RAFT-108 | Enemy health bars, damage numbers, hit-flash, hit-stop, SFX | Todo |
| RAFT-109 | New enemy types (seagull, pirate raft, jellyfish) | Skipped (P2) |
| RAFT-110 | Frog projectiles & shark bites interact with walls | Todo |
| RAFT-111 | Apply `DIFF.damageMult` to ALL damage sources | Todo |

## Phase 2 — Construction & Base Building (RAFT-E2)

| Key | Title | Status |
|---|---|---|
| RAFT-201 | Grid-based raft (tiles) | Todo |
| RAFT-202 | Build mode: ghost preview, place/rotate/remove, refund % | Todo |
| RAFT-203 | Functional Roof: blocks weather penalties; shelter buff | Todo |
| RAFT-204 | Functional Walls: block projectiles; shark can bite & damage them | Todo |
| RAFT-205 | Real structure HP + Repair (fix "REPAIR RAFT") | Todo |
| RAFT-206 | Raft sinking: raftHealth 0 ⇒ tile loss / game over | Todo |
| RAFT-207 | Expose Expand Raft in crafting UI | Todo |
| RAFT-208 | New buildables (storage crate, drying rack, purifier, sail, net) | Todo |
| RAFT-209 | Resource sinks & upgrade tiers | Todo |

## Phase 3 — Progression & Goals (RAFT-E3)

| Key | Title | Status |
|---|---|---|
| RAFT-301 | Player XP & Level system | Todo |
| RAFT-302 | Perk/skill tree (Survivor/Fighter/Builder) | Todo |
| RAFT-303 | Tech tiers gated by level/blueprints | Todo |
| RAFT-304 | Objectives / quest chain | Todo |
| RAFT-305 | Revive Islands & Chests spawn + loot | Todo |
| RAFT-306 | Win condition / ending | Todo |
| RAFT-307 | Meta-progression: SkinShop + coins | Todo |
| RAFT-308 | Day/night & weather gameplay effects | Todo |

## Phase 4 — Survival Economy & Balance (RAFT-E4)

| Key | Title | Status |
|---|---|---|
| RAFT-401 | Apply `DIFF.hungerRate/thirstRate` to hunger/thirst drain | Todo |
| RAFT-402 | Re-balance hunger/thirst/regen curves; per-day pressure | Todo |
| RAFT-403 | Make Hook meaningful (far loot vs near auto-collect) | Todo |
| RAFT-404 | Fishing: remove "touch = instant eat" | Todo |
| RAFT-405 | Cooking loop: cooked fish HUD count, food tiers | Todo |
| RAFT-406 | Central `balance.json` + in-dev tuning panel | Todo |

## Phase 5 — Onboarding, UX & Controls (RAFT-E5)

| Key | Title | Status |
|---|---|---|
| RAFT-501 | Mount `Tutorial` on first run; replay in settings | Todo |
| RAFT-502 | Contextual hints | Todo |
| RAFT-503 | Control scheme: WASD + arrows; rebindable keys | Todo |
| RAFT-504 | Touch controls & gamepad support | Todo |
| RAFT-505 | HUD overhaul (icons, cooked-fish counter, XP, warnings) | Todo |
| RAFT-506 | Remove/hide Co-op menu until networking exists | Todo |
| RAFT-507 | Real Pause menu, multiple save slots, Leaderboard | Todo |

## Phase 6 — Tech Debt, Performance & QA (RAFT-E6)

| Key | Title | Status |
|---|---|---|
| RAFT-601 | Split `Game.tsx` into modules | Todo |
| RAFT-602 | Replace `window.__*` globals with typed store/event bus | Todo |
| RAFT-603 | Fix effect dependencies; don't restart loop on `gameOver` | Todo |
| RAFT-604 | Remove `console.log` in hot paths; add debug logger | Todo |
| RAFT-605 | Perf: replace 4.7 MB GIF / compress audio / lazy-load | Todo |
| RAFT-606 | Unit tests for pure systems + Playwright smoke test | Todo |
| RAFT-607 | Lint/format cleanup, remove dead code | Todo |

---

## Reports

- `reports/PHASE-0-REPORT.md` … `reports/PHASE-6-REPORT.md`
- `reports/CHANGELOG-ALL-PHASES.md`
- `reports/FINAL-SUMMARY.md`
