# PHASE 0 REPORT — Stabilize the Build (RAFT-E0)

Branch: `feature/raft-v0.2` · Start tag: `phase-start` · End tag: `phase-0`
Source of truth: `RAFT-SURVIVAL-ANALYSIS-AND-EPIC.md`

---

## 1. Phase Summary

Phase 0 ka goal tha ek **clean `npm run build`** aur sach-much kaam karne wala
save/load/achievement pipeline. Shuru mein `tsc --noEmit` mein 6 errors aur
`eslint` mein 149 errors thay; phase ke end par dono **0 errors** par hain
(37 pre-existing non-blocking warnings remaining). Achievement tracking zinda
ho gaya, save/load ab pura `GameSnapshot` restore karta hai, autosave + pause
confirm modal add hui, aur CI pipeline judh gaya.

## 2. Tickets Completed

| Key | Status | Notes |
|---|---|---|
| RAFT-001 | Done | `hasRainBarrel` prop + destructure |
| RAFT-002 | Done | `checkAchievements` pure function; `require()` → ES import |
| RAFT-003 | Done | Runs every ~5s (300 frames) + key events |
| RAFT-004 | **Partial** | fish/walls/roof/barrel/wood/plastic/frogs/sharks tracked; `islandsCollected` Phase 3 tak blocked (islands spawn hi nahi hote — L-25/RAFT-305) |
| RAFT-005 | Done | Single `DAY_LENGTH` from `lib/balance.ts` |
| RAFT-006 | Done | Versioned `GameSnapshot` + `initialState` hydrate |
| RAFT-007 | Done | Autosave 30s + `beforeunload`/`visibilitychange`; "LOAD GAME" menu entry continue karta hai |
| RAFT-008 | Done | ESC → pause modal (Save & quit / Quit / Cancel) |
| RAFT-009 | Done | GitHub Actions CI |

## 3. Files Added

| Path | Purpose |
|---|---|
| `lib/save.ts` | Versioned `GameSnapshot` schema, `normalizeSnapshot`, safe `loadSnapshot`/`saveSnapshot`/`hasSnapshot` |
| `.github/workflows/ci.yml` | CI: `npm ci` → `tsc --noEmit` → `lint` → `build` |
| `reports/PROGRESS.md` | (prior session) running ticket checklist |
| `lib/balance.ts` | (prior session) `DAY_LENGTH`, `MS_PER_FRAME`, `MAX_HEALTH`, etc. |
| `types/game-globals.d.ts` | (prior session) typed `window.__*` bridge |
| `components/SettingsMenu.tsx` | (prior session) lazy-state settings |

## 4. Files Modified

| Path | Change |
|---|---|
| `app/page.tsx` | Snapshot-based save/load, autosave effect, ESC pause modal, `initialState`/`snapshotStore`/`paused` props to `<Game>`, `handlePlay` reset |
| `components/Game.tsx` | Hydrate from `initialState`; `writeSnapshot()` per frame; `paused` guard in `update()`; `bumpAch()` counter tracking; imported `DAY_LENGTH`; moved craft `useEffect` after sound helpers |
| `lib/systems/achievements.ts` | Added pure `bumpAchStats` |
| `components/AchievementsPanel.tsx` | Lazy `useState(loadUnlocked)` — removed set-state-in-effect |
| `components/Leaderboard.tsx` | Lazy `useState(loadScores)` |
| `components/SaveSlots.tsx` | `SaveSlot` type + lazy state (removed `any`) |
| `components/SkinShop.tsx` | `ShopSkin` type + lazy state (removed `any`) |

## 5. Files Deleted / Renamed

None.

## 6. Database / Persistence Changes

- `localStorage.raftSave` — **schema change**: flat object → versioned `GameSnapshot` (`version: 2`).
  - Old flat saves are **forward-migrated** by `normalizeSnapshot()` (missing fields defaulted, never throws).
  - New fields: `version`, `savedAt`, `time`, `cookedFish`, `barrelWater`.
- No new localStorage keys added; existing `raftAchStats`/`raftAchievements` shape unchanged.

## 7. Verification

| Command | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 (0 errors) |
| `npm run lint` | 0 errors, 37 warnings (pre-existing, non-blocking) |
| `npm run build` | ✓ Compiled successfully (Next.js 16.3.7 Turbopack), static pages generated |

## 8. Deviations & Decisions

- RAFT-003..009 ko ek commit (`0a37207`) mein bundle kiya gaya kyunki changes ek hi file (`page.tsx`/`Game.tsx`) mein interleaved hain aur `git add -p` (interactive) allowed nahi. Report mein per-ticket mapping diya gaya hai.
- ESLint baseline (149 errors) ko Phase 0 mein clean kiya gaya — justified kyunki RAFT-009 CI lint chalata hai.
- `SnapshotStore` mutable-box ref pattern chuna gaya taake page Game ke per-frame state ko bina poora canvas loop React mein lift kiye save kar sake.
- `paused` guard `update()` ke top par — paused state mein time/stats nahi badalte; render loop chalta rehta hai (frozen frame).

## 9. Known Issues / Partial Items

- **RAFT-004 Partial:** `islandsCollected` stat ka increment point nahi — islands (`spawnIsland`) abhi bhi dead code hain. Ye RAFT-305 (Phase 3) mein revive honge; tab `bumpAch('islandsCollected')` add hoga.
- 37 ESLint warnings (unused vars in dead code, intentional `exhaustive-deps`) — RAFT-607 mein clean honge.
- `hunt/` aur `shipwreck`/`chest` dead code abhi bhi present — Phase 3 scope.

## 10. Next Phase

Phase 1 — Combat & Threat System (RAFT-E1): kraken heal-exploit fix, shared 2D hitboxes, loot/XP drops, day-based threat scaling, shark AI rework, weapon tiers, enemy health bars, `DIFF.damageMult` application. (RAFT-107/109 P2 = skipped per PROGRESS.md.)
