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
