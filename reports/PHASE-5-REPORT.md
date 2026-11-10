# Phase 5 — Onboarding, UX & Controls (RAFT-E5) — Report

Branch: `feature/raft-v0.2` · Range: `phase-4..HEAD` · Tag: `phase-5`

## 1. FILES CREATED

| File path | Purpose | Ticket ID(s) | Lines (approx) | Key exports / functions |
|---|---|---|---|---|
| `lib/controls.ts` | Central, player-rebindable key bindings (single source of truth for both the game loop and Settings) | RAFT-503 | 98 | `ControlAction`, `CONTROL_ACTIONS`, `DEFAULT_BINDINGS`, `BINDING_LABELS`, `MOVE_ALIASES`, `normKey`, `keyLabel`, `loadBindings`, `saveBindings`, `matchAction` |
| `components/HintToast.tsx` | Renders the one-shot `window.__hint` (contextual tips) and `window.__chestMessage` (world events) toasts; the loop owns their timers | RAFT-502 | 54 | `HintToast` (no props) |
| `components/TouchControls.tsx` | Mobile virtual joystick + action buttons; feeds movement into the game via the `window.__setMove` bridge and reuses the HUD's synthetic-key handlers for actions | RAFT-504 | 96 | `TouchControls` (props: `onAttack`, `onFish`, `onHook`, `onCraft`) |

## 2. FILES MODIFIED

| File path | What changed | Why | Ticket ID(s) | Lines +/− |
|---|---|---|---|---|
| `app/page.tsx` | Mounted `Tutorial` (first run + replay), `PauseMenu`, `SaveSlots`, `Leaderboard`, `HintToast`, `TouchControls`; new `'leaderboard'` scene; `COOP_ENABLED=false` gate; P/Esc pause hotkey; bindings-aware craft hotkey via `matchAction`; `loadFromSlot`/`handleOpenSaveSlots`/`handleSelectSaveSlot`; first-run tutorial check in `handlePlay`; `handleReplayTutorial`; `handleFish`; leaderboard entry on game-over; `threat` state mirrored from `window.__threat` | Wire all Phase 5 UI | RAFT-501..507 | +106 / −54 |
| `components/Game.tsx` | `bindingsRef` + `bindingsChanged` listener; `handleKeyDown`/`handleKeyUp` rewritten around `matchAction`; `hintsShown`/`showHint` + per-frame hint trigger block; `window.__setMove` bridge; `pollGamepad()` (stick/D-pad + A/B/X) called from `gameLoop`; `window.__threat` mirror; cleanup of the new listeners/global | Rebindable input, hints, touch + gamepad | RAFT-502/503/504/505 | +112 / −25 |
| `components/HUD.tsx` | Bar icons/labels (🍖 hunger, 💧 thirst, 🪵 raft); flashing enemy-warning banner from a new `threat` prop | RAFT-505 HUD overhaul | RAFT-505 | +21 / −3 |
| `components/SettingsMenu.tsx` | CONTROLS section (per-action rebind buttons + RESET) backed by `lib/controls`; dispatches `bindingsChanged`; 🎓 REPLAY TUTORIAL button (`onReplayTutorial`) | RAFT-501/503 | RAFT-501/503 | +87 / −2 |
| `components/PauseMenu.tsx` | SAVE GAME + LOAD GAME buttons (new `onSave`/`onLoad` props); hint text updated to "Press P to resume" | RAFT-507 | RAFT-507 | +12 |
| `components/SaveSlots.tsx` | Slot-aware keys via `slotKey(i)` + `deleteSnapshot(slot)` | RAFT-507 | RAFT-507 | +5 / −2 |
| `components/MainMenu.tsx` | LEADERBOARD button + `onLeaderboard` prop; CO-OP button gated behind `showCoop` | RAFT-506/507 | RAFT-506/507 | +8 / −2 |
| `lib/save.ts` | `SAVE_SLOT_COUNT`, `slotKey()`; `loadSnapshot`/`saveSnapshot`/`hasSnapshot` now slot-aware; new `deleteSnapshot`, `hasAnySnapshot` | RAFT-507 multi-slot | RAFT-507 | +30 / −6 |
| `types/game-globals.d.ts` | Typed `__hint`, `__threat`, `__setMove` | Type the new bridge globals | RAFT-502/504/505 | +6 |
| `reports/PROGRESS.md` | Phase 5 rows marked Done | Tracker upkeep | — | +7 / −7 |

## 3. FILES DELETED / MOVED / RENAMED

None. The Co-op menu is **hidden** (not deleted) — `components/CoopMenu.tsx` remains and the `'coop'` scene is still reachable, but its entry point is gated behind `COOP_ENABLED` (RAFT-506) so it ships out of the main menu until networking exists.

## 4. PER-TICKET SUMMARY

| Ticket | Status | Files | Acceptance criteria |
|---|---|---|---|
| RAFT-501 | Done | `app/page.tsx`, `components/SettingsMenu.tsx` | ✅ Tutorial shows on the first play (`raftTutorialSeen` absent) and never auto-shows again; ✅ finish/skip sets the flag; ✅ "🎓 REPLAY TUTORIAL" in Settings clears the flag and re-opens it; ✅ the existing 8-step flow already covers spear, crafting, hook and fishing |
| RAFT-502 | Done | `components/Game.tsx`, `components/HintToast.tsx`, `app/page.tsx`, `types/game-globals.d.ts` | ✅ Contextual hints fire from live game state (shark/frog nearby & spear owned → "press ATTACK"; low hunger/thirst → eat/drink; debris & hammer → HOOK; fish & rod → FISH; no spear & wood → craft one); ✅ each hint shows at most once per run (`hintsShown`); ✅ timers decrement per frame and the toast auto-hides |
| RAFT-503 | Done | `lib/controls.ts`, `components/SettingsMenu.tsx`, `components/Game.tsx`, `app/page.tsx` | ✅ WASD **and** arrows both move (WASD via `MOVE_ALIASES`); ✅ attack/fish/hook/build/craft are rebindable from Settings and persist to `raftBindings`; ✅ a rebind takes effect live (`bindingsChanged` → `bindingsRef`) with no restart; ✅ RESET restores defaults |
| RAFT-504 | Done | `components/TouchControls.tsx`, `components/Game.tsx`, `app/page.tsx`, `types/game-globals.d.ts` | ✅ On touch devices a virtual joystick (movement) + action buttons (attack/fish/hook/craft) appear; the joystick writes into the same `keys` state as the keyboard (`window.__setMove`); ✅ directions release on pointer-up/unmount; ✅ a connected gamepad drives movement (left stick / D-pad) + A=attack, B=hook, X=fish without cancelling keyboard input |
| RAFT-505 | Done | `components/HUD.tsx`, `components/Game.tsx`, `app/page.tsx`, `types/game-globals.d.ts` | ✅ Bars carry icons/labels (🍖 hunger, 💧 thirst, 🪵 raft); ✅ cooked- **and** dried-fish counters kept in the inventory slots; ✅ a flashing enemy warning appears when a shark or frogs are active (`window.__threat` → `threat` prop); ✅ XP bar + objective tracker retained |
| RAFT-506 | Done | `app/page.tsx`, `components/MainMenu.tsx` | ✅ CO-OP entry hidden from the main menu (`COOP_ENABLED=false`); component + scene preserved for when networking lands |
| RAFT-507 | Done | `app/page.tsx`, `components/PauseMenu.tsx`, `components/SaveSlots.tsx`, `lib/save.ts`, `components/MainMenu.tsx` | ✅ ESC/P opens a real Pause menu (Resume / Save / Load / Settings / Quit); ✅ 3 save slots (slot 0 = legacy `raftSave`) save from the pause menu and load from the pause **or** main menu; ✅ local leaderboard records the run's days/fish/sharks/difficulty on game-over |

**Phase 5 acceptance:** ✅ a brand-new player is onboarded (tutorial) and guided live (contextual hints) rather than dropped in blind; ✅ controls are no longer hard-coded — WASD/arrows by default, fully rebindable, plus touch and gamepad; ✅ the HUD surfaces threats and resources clearly; ✅ the shell UX (pause, multiple save slots, leaderboard) is real instead of a stub; ✅ Co-op is out of the way until it works.

## 5. DEPENDENCIES

None added.

## 6. CONFIG / DATA CHANGES

- **Save schema unchanged** (`SAVE_VERSION` stays 6). RAFT-507 adds *slots*, not a new format: slot 0 keeps the original `raftSave` key; slots 1–3 use `raftSave_1` … `raftSave_3` (`slotKey()`). Existing saves keep loading from slot 0.
- New localStorage keys: `raftBindings` (rebindable controls).
- New `window.__*` globals: `__hint` (RAFT-502), `__threat` (RAFT-505), `__setMove` (RAFT-504).
- New DOM events on `window`: `bindingsChanged` (controls rebind, RAFT-503) — `settingsChanged` was already used by Settings.
- New components: `HintToast`, `TouchControls`.

## 7. BUILD RESULTS

- `npx tsc --noEmit` → 0 errors.
- `npx eslint .` → **0 errors**, 32 warnings (all pre-existing / orphan code).
- `npm run build` → ✓ Compiled successfully (Next.js 16.3.7, static `/` + `/_not-found`).
- `npx vitest run` → 6 files, **61 tests passed** (17 combat + 16 raft + 8 progression + 8 perks + 7 objectives + 5 balance).

## 8. MANUAL TEST CHECKLIST

1. Clear `localStorage` → Play → the **Tutorial** appears; finish it, quit and Play again → it does **not** reappear.
2. Settings → **🎓 REPLAY TUTORIAL** → the tutorial shows again.
3. Settings → **CONTROLS** → click ATTACK's key chip and press `K` → chip reads `K`; go in-game and press `K` to attack; press `SPACE` and confirm it no longer attacks from the rebind. Press **RESET** → defaults return.
4. Move with **WASD** and with the **arrow keys** → both work.
5. Let hunger/thirst fall with food in inventory → the 💡 "you are hungry" hint appears once; a shark arriving with a spear owned → "press ATTACK" hint once.
6. Trigger a shark (Day ≥ 4) → the flashing **🦈 SHARK ATTACK!** warning shows top-centre; frogs → 🐸 warning.
7. On a phone / touch emulator → the joystick (bottom-left) moves the player and the four action buttons (bottom-right) attack/fish/hook/craft; releasing the stick stops movement.
8. Plug in a **gamepad** → left stick/D-pad moves, A attacks, B hooks, X fishes; then use the keyboard to confirm it still responds.
9. Press **ESC** (or **P**) → the Pause menu opens; **SAVE GAME** → pick slot 2 → quit → **LOAD GAME** from the main menu → slot 2 restores the run.
10. Die → open **LEADERBOARD** from the main menu → the run is listed with days/fish/sharks/difficulty.
11. Main menu → confirm there is **no CO-OP** button.

## 9. KNOWN ISSUES / SKIPPED / UNSURE

- Touch controls are auto-detected (`ontouchstart` / `maxTouchPoints`) and always shown on touch devices; there is no manual on/off toggle, and they don't auto-hide when a physical gamepad is connected. They sit above the HUD's own action row to avoid overlap.
- The gamepad poll runs every frame and only touches `keys` while the pad is *active*; if a player uses the gamepad and then immediately holds a keyboard direction as the stick re-centres, the poll can clear that direction for a frame. Minor and rare.
- Contextual hints are de-duped per run (each fires once) — by design, but it means a hint won't repeat if the player misses it. Hints also don't reflect the player's **rebound** keys in their text (e.g. they still say "press ATTACK (SPACE)"); the key names in hint copy are static.
- Settings is still reachable from the pause menu but the in-game settings view returns to the main menu scene on close (pre-existing behaviour).
- The binder accepts any key including modifiers/`Tab`; there is no conflict detection between actions (the last rebind wins for a shared key).
- Lint retains 32 pre-existing warnings (unused vars in orphan code, intentional `exhaustive-deps`). Zero errors.

## 10. VERIFICATION

`git diff --stat phase-4..HEAD` (tracked files):

```
 app/page.tsx                | 160 +++++++++++++++++++++++++++++++-------------
 components/Game.tsx         | 112 ++++++++++++++++++++++++++-----
 components/HUD.tsx          |  24 +++++--
 components/MainMenu.tsx     |  10 ++-
 components/PauseMenu.tsx    |  12 +++-
 components/SaveSlots.tsx    |   5 +-
 components/SettingsMenu.tsx |  89 +++++++++++++++++++++++-
 lib/save.ts                 |  34 ++++++++--
 reports/PROGRESS.md         |  14 ++--
 types/game-globals.d.ts     |   6 ++
 10 files changed, 381 insertions(+), 85 deletions(-)
```

Plus 3 new files: `lib/controls.ts`, `components/HintToast.tsx`, `components/TouchControls.tsx`.
