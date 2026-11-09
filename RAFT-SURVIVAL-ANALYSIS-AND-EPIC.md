# Raft Survival — Game Analysis, Loopholes & Epic Backlog

**Scope:** `raft-survival.zip` (Next.js 16 / React 19 / Canvas 2D) — snapshot of the `main` branch working tree, last commit `46f8b44` (2026-10-05).
**Method:** Full static read of `app/page.tsx`, `components/Game.tsx` (3,470 lines), HUD / Crafting / Tutorial / Recipe / Menus, `lib/achievements.ts`; `tsc --noEmit` run on the project; git history reviewed. **The game was not play-tested at runtime**, so every finding below is code-verified, not observed in a browser. Line numbers are approximate (`~L`).

---

## 1. Executive Summary

Tumhari observation sahi hai: game ek **"tech demo"** ke level par hai, game loop poora nahi hai. Lekin diagnosis thoda alag hai:

| Tumhara observation | Code mein asal sach |
|---|---|
| "Attack ka option nahi hai" | Attack **exist karta hai** (Wooden Spear, `SPACE`), lekin: (a) Tutorial screen kabhi dikhai hi nahi jaati (orphan component), (b) combat mein **koi reward nahi**, (c) shark/kraken ka hit-check sirf X-axis par hai, (d) shark ka threat ek safe-zone trick se zero ho jata hai. Player ko combat "feel" hi nahi hota. |
| "Construct ka option nahi hai" | Crafting menu **exist karta hai** (walls, roof, floor, barrel, campfire), lekin walls/roof/floors **sirf cosmetic** hain — koi gameplay effect zero. Isliye lagta hai ke construction hai hi nahi. |
| "Player level nahi, sab ek jaisa" | Bilkul sahi. Koi XP / level / tech tree / goal / win condition / difficulty scaling by day nahi hai. Day 1 aur Day 20 identical hain. |

**Top 5 problems (priority order):**
1. Build **compile/runtime break**: `hasRainBarrel` undefined in `Game.tsx` (tsc errors confirmed).
2. **Achievements kabhi unlock nahi hote** — `checkAchievements()` kabhi call hi nahi hoti.
3. **Kraken kill = permanent immortality** (`health = 100` jab max 5 hai).
4. **Save/Load broken** — load karne par Game ki internal stats reset ho jati hain; ESC dabane se run bina save ke khatam.
5. **Koi progression / goal / threat scaling nahi** → 5 minute mein sab craft ho jata hai, phir karne ko kuch nahi.

---

## 2. Verified Loopholes & Bugs

Severity: **S1** = blocker / game-breaking, **S2** = major, **S3** = minor / polish.

### 2.1 Build & Stability

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| L-01 | S1 | `hasRainBarrel` use hota hai lekin `Game` ke props mein declare/destructure nahi. `tsc` errors: `Game.tsx(130,44)`, `(132,71)`, `page.tsx(273,13)`. Runtime par effect `ReferenceError` throw karta hai. | `Game.tsx` L80 (destructure), ~L130–132 |
| L-02 | S1 | `checkAchievements()` mein `time` aur `diff` use hote hain jo function ke scope mein exist nahi (`tsc` errors `(368,68)`, `(372,26)`). Plus `require()` ek client ESM file mein. | `Game.tsx` ~L364–395 |
| L-03 | S3 | `tsc` error TS7053 (`statsRef.current[hookTargetItem.type]` implicit any). | `Game.tsx` ~L1075 |

### 2.2 Achievements, Stats & Meta

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| L-04 | S1 | `checkAchievements()` **defined hai, kahin call nahi hoti** (`lastAchCheck` declared, kabhi use nahi). Poora achievement system dead hai. | `Game.tsx` L364, L395 |
| L-05 | S2 | Kai stats kabhi update nahi hote: `totalFishEaten` (sirf default object mein 1 jagah), `builtWalls`, `builtRoof`, `builtBarrel`, `islandsCollected`. Chaar achievements (Builder, Sheltered, Water Collector, Explorer) aur 3 fish achievements **structurally unreachable** hain. | grep: `totalFishEaten` count = 1 |
| L-06 | S2 | `daysSurvived` formula `time / (60*60*5)` (5-min day) hai jabke in-game day `DAY_LENGTH = 60*60*2` (2-min day). HUD "Day 5" aur achievement "Survive 5 days" alag cheezein hain. | `Game.tsx` L368 vs ~L881 |
| L-07 | S2 | Coins game-over par milte hain (`day*5 + fish*0.5`) lekin **SkinShop kahin mounted nahi** — coins kharch karne ka raasta nahi. `SkinShop`, `Leaderboard`, `SaveSlots`, `PauseMenu`, `Tutorial` — paanchon components koi import hi nahi karta. | `grep` across `app/` & `components/` |
| L-08 | S3 | Hook se collect kiye hue wood/plastic achievement stats mein count nahi hote (sirf raft/player collision wale hote hain). | `Game.tsx` hook block vs items block |

### 2.3 Combat & Threat (is wajah se "attack nahi hai" lagta hai)

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| L-09 | S1 | **Kraken immortality exploit:** kraken kill par `health = 100` (health ki max 5 hai). Hearts full dikhte hain, regen band (`health < 5` check), aur starvation/water damage ko 100 HP chahiye khatam karne ko → effectively invincible. | `Game.tsx` ~L1195–1200 |
| L-10 | S2 | **Spear hit-check sirf X-axis par:** shark aur kraken ko player ke Y se qatai farq (poori screen door, ya off-screen) hone par bhi hit kiya ja sakta hai. Frogs ke liye Y check hai — inconsistent. | `Game.tsx` ~L1196, ~L1203 |
| L-11 | S2 | **Shark ka threat safe-zone trick se zero:** raft ke 30%–70% X-band mein khade rahne par shark sirf `raftHealth` kaat'ta hai, player ko nahi. Aur raftHealth ka koi consequence nahi (L-12). Dominant strategy: beech mein khade ho jao. | `Game.tsx` ~L1306–1325 |
| L-12 | S1 | **`raftHealth` poora cosmetic hai:** 0 hone par koi game-over / raft damage / sinking nahi. Aur **"REPAIR RAFT" player ki `health = 5` karta hai, raftHealth nahi** — naam aur effect mismatch. | `Game.tsx` ~L98–100; grep `raftHealth` |
| L-13 | S2 | **Combat mein zero reward:** frog/shark kill par koi drop, XP, loot nahi. Sirf achievement counter (jo L-04 ki wajah se dead hai). Player ke paas fight karne ki koi wajah nahi. | frog/shark kill blocks |
| L-14 | S2 | **Enemy variety = 3 (frog, shark, kraken), koi scaling nahi:** spawn rates constant (`0.005/f` shark after 1200 frames, frog har 480 frames, max 3). Day 20 = Day 1. | spawn lines ~L1195, ~L1613 |
| L-15 | S3 | Spear ka sirf ek hi attack: 30-frame cooldown, no combo, no range upgrade, no ranged option, no armor/shield. | `attackTimer = 30` |
| L-16 | S3 | Frog sirf player ko target karta hai, raft ko kabhi nahi. Walls/roof frog projectiles ko block nahi karte. | frog update block |

### 2.4 Construction (is wajah se "construct nahi hai" lagta hai)

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| L-17 | S1 | **Walls / Roof / Floors sirf draw hote hain** (`drawVerticalRaft`). Koi collision, koi shelter, koi protection nahi. Roof baarish/garmi/barf se nahi bachata; walls shark/frog/projectile nahi rokte. | `__wallsRef/__roofsRef/__floorsRef` sirf ~L2513–2515 par read hote hain |
| L-18 | S2 | `EXPAND` (raft bada karna) logic maujood hai lekin **crafting menu mein button nahi** — feature unreachable. | `Game.tsx` L~101; `CraftingMenu.tsx` |
| L-19 | S2 | Build caps hardcoded (walls 4, roof 1, floors 2) — placement nahi, player chunta nahi kahan kya lagana hai. Sab auto-placed. | `page.tsx handleCraft` |
| L-20 | S2 | Pura crafting tree flat hai (8 recipes) aur total cost sirf ~63 wood + 2 plastic. Resource spawn ~15 wood/min → **~4–5 min mein sab craft ho jata hai**, phir wood ka koi sink nahi (sirf REPAIR). | `spawnTimer > 120` + recipe costs |

### 2.5 Survival Economy & Balance

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| L-21 | S2 | **Wood/plastic raft par apne aap collect ho jaate hain** jab girte hain (`raftHit`). Hook (`H`) ki zaroorat hi nahi — ek advertised mechanic redundant hai. | items loop ~L1648 |
| L-22 | S2 | Difficulty setting adhoori: `DIFF.hungerRate` aur `DIFF.thirstRate` **define hain lekin kahin use nahi** (hunger/thirst hard-coded `0.005/0.004`). Frog/kraken damage bhi `damageMult` ignore karte hain. Hard mode mein bhi bhookh asaan hai. | ~L897–900 |
| L-23 | S2 | Survival pressure bohot kam: hunger 100→0 ≈ 5.6 min (≈2.8 days), thirst ≈ 6.9 min; ek raw fish +40 hunger. Baarish ~50% time + rain barrel → thirst ka masla khatam. Fish player ke touch se hi kha li jati hai. | hunger/thirst/rain code |
| L-24 | S3 | Weather (snow / heat) sirf visual hai — koi gameplay effect nahi. `isFoggy` dead code (`Math.random() < 0`). | ~L954–962, ~L3188–3204 |
| L-25 | S3 | Islands, Chests, Shipwrecks ka poora code (spawn + draw) maujood hai lekin `spawnIsland()` / `spawnChest()` **kabhi call nahi hote** — exploration content dead. `__chestMessage` kabhi render nahi hota. | grep: no call sites |
| L-26 | S3 | Starting bonus (5 wood, 3 plastic) `page.tsx` ka state hai, lekin Game ki `statsRef` 0 se start hoti hai aur 10 frames mein HUD overwrite kar deti hai → bonus fake hai. | `page.tsx` L~30 vs `Game.tsx` L84 |

### 2.6 Save / Load / Session

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| L-27 | S1 | **Load Game broken:** `handleLoadGame` sirf React state set karta hai; `Game` ki `statsRef` (health/hunger/wood/day) aur `time` default par reset hote hain aur HUD 10 frames mein overwrite ho jata hai. Sirf tool flags aur raftWidth bachte hain. | `page.tsx` handleLoadGame vs `Game.tsx` L84 |
| L-28 | S1 | **Save sirf Game Over screen par** milta hai (`SAVE & QUIT`). Koi manual/auto save nahi. | `page.tsx` handleSaveAndQuit |
| L-29 | S2 | **ESC / "Main Menu" button run destroy kar deta hai** bina warning ya save ke (scene → `menu`, Game unmount). Accidental ESC = poori progress gayi. | `page.tsx` escHandler |
| L-30 | S3 | Hamesha 1 hi save slot (`raftSave`); `SaveSlots` component orphan hai. | L-07 |

### 2.7 UX, Onboarding & Controls

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| L-31 | S1 | **Tutorial kabhi show nahi hota** — component hai, mount nahi hota (`raftTutorialSeen` bhi kabhi check nahi hota). Spear/crafting/H/F/C keys ka pata chalne ka koi raasta nahi (sirf RecipeBook `R`). | `Tutorial.tsx` unreferenced |
| L-32 | S2 | Sirf keyboard: arrow-keys movement ka touch/gamepad/WASD support nahi (HUD buttons hain lekin movement nahi). Mobile par unplayable. | key handlers ~L469 |
| L-33 | S3 | Hunger/Thirst bars par koi icon/label nahi; inventory slots 5 hain lekin sirf slot 1 (fish) use hota hai. Cooked fish count HUD par nahi. | `HUD.tsx` |
| L-34 | S3 | Attack feedback kamzor: spear animation sirf 15-frame; hit confirmation / damage numbers / enemy health bar nahi. | `Game.tsx` ~L3055 |
| L-35 | S3 | `CoopMenu` fake "Coming Soon" screen hai (koi networking nahi) — menu mein advertise nahi karna chahiye jab tak ready na ho. | `CoopMenu.tsx` |

### 2.8 Engineering Debt & Performance

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| L-36 | S2 | `Game.tsx` ek **3,470-line monolith** hai (update + draw + audio + achievements + spawning). React ↔ canvas communication ke liye **`window.__*` globals** (`__hasSpearRef`, `__cookFish`, `__barrelWater`, ...). Fragile, untestable. | throughout |
| L-37 | S2 | Main `useEffect` deps `[onStatsUpdate, gameOver, onGameOver]` — props (`walls`, `hasHammer`...) is effect mein stale hain, isliye globals ka workaround use hua. Effect `gameOver` flip par poora game loop restart karta hai. | `Game.tsx` L~3335 |
| L-38 | S3 | Hot path mein `console.log` (shark bite, eat, cook). 4.7 MB GIF background + 6 MB MP3 bina lazy-load ke. Real asset pipeline nahi. | `public/assets` |
| L-39 | S3 | Minified one-liners (thunder sound, drink/cook handlers), ~50 trailing blank lines, `var` aur `any` ka heavy use, git commits ke messages (`gh`, `gv`, `ee`) meaningless. | repo-wide |
| L-40 | S3 | Zero automated tests; game logic pure functions mein nahi hai isliye test likhna mushkil. | repo-wide |

---

## 3. Game Design Assessment (Expert View)

**Core loop abhi:** collect wood/plastic (auto) → craft sab kuch → fish khao → baarish ka paani piyo → ... *(loop band; koi next goal nahi)*.

**Missing pillars** (Raft jaise survival games mein ye 4 chahiye hote hain):

1. **Pressure** — dar jo badhta rahe (enemies/hazards scale hon).
2. **Agency** — player ka decision ka asar ho (kahan banana hai, kya upgrade karna hai, risk vs reward).
3. **Progression** — power curve (level, tech tiers, better gear).
4. **Goal** — "kyun khelun?" (win condition ya milestones/objectives).

Abhi sirf thoda *pressure* hai (aur wo bhi trick se bypass), baaki teeno ghayab hain.

**Proposed target loop (v0.2):**

```
Scavenge (wood, plastic, scrap, fish)
   → Craft / Build (placed structures that matter)
      → Defend (waves & hazards that scale per day)
         → Earn XP / loot → Level up / unlock next tier
            → Expand raft & sail to islands → Boss / Objective → (repeat, harder)
```

---

## 4. Epic & Ticket Backlog

**Conventions:** Priority P0 (blocker) → P3 (nice-to-have). Estimate in story points (SP: 1 ≈ half day). *Links* ke saath finding IDs (L-xx) upar se. Har ticket ka **AC** = Acceptance Criteria.

### 4.0 Roadmap Overview

| Epic | Title | Goal | Priority | Est. |
|---|---|---|---|---|
| **RAFT-E0** | Stabilize the Build | Game compile ho, save/load/achievements kaam karein | P0 | 21 SP |
| **RAFT-E1** | Combat & Threat System | Fighting meaningful ho, reward mile, threats scale hon | P0 | 34 SP |
| **RAFT-E2** | Construction & Base Building | Building ka gameplay effect ho, player place kare | P1 | 34 SP |
| **RAFT-E3** | Progression & Goals | Player level, tech tiers, objectives, win condition | P1 | 39 SP |
| **RAFT-E4** | Survival Economy & Balance | Hunger/thirst/resources ka sahi curve | P1 | 18 SP |
| **RAFT-E5** | Onboarding, UX & Controls | Tutorial, touch/WASD, HUD clarity | P1 | 21 SP |
| **RAFT-E6** | Tech Debt, Performance & QA | Refactor, tests, asset optimization | P2 | 34 SP |

**Suggested sprint order:** Sprint 1 = E0 + tutorial wiring (E5-01) → Sprint 2 = E1 core + E4 balance → Sprint 3 = E2 → Sprint 4 = E3 → Sprint 5 = E5 rest + E6.

---

### RAFT-E0 — Stabilize the Build (P0)

> **Goal:** Ek clean `npm run build` aur sach-much kaam karne wala save/load/achievement pipeline.

| Key | Type | Title | Pri | SP | Links |
|---|---|---|---|---|---|
| RAFT-001 | Bug | Fix `hasRainBarrel` missing in `GameProps` & destructure | P0 | 1 | L-01 |
| RAFT-002 | Bug | Fix `checkAchievements` scope errors (`time`, `diff`) + replace `require()` with ES import | P0 | 2 | L-02, L-03 |
| RAFT-003 | Bug | Call `checkAchievements()` periodically (every ~5s) and on key events | P0 | 2 | L-04 |
| RAFT-004 | Bug | Track missing stats (fish eaten, walls/roof/barrel built, islands) | P1 | 3 | L-05, L-08 |
| RAFT-005 | Bug | Unify day length across HUD & achievements (single `DAY_LENGTH` constant) | P1 | 1 | L-06 |
| RAFT-006 | Bug | Fix Load Game: restore Game internal state (stats, `time`, enemies reset) | P0 | 5 | L-27, L-26 |
| RAFT-007 | Feature | Autosave every N seconds + save on tab close; add "Continue" | P1 | 3 | L-28 |
| RAFT-008 | Bug | Confirm dialog on ESC/Main Menu ("Save & quit / Quit / Cancel") | P1 | 2 | L-29 |
| RAFT-009 | Chore | Add CI: `tsc --noEmit`, `eslint`, `next build` on every PR | P1 | 2 | L-01..03 |

**RAFT-001 — Fix `hasRainBarrel` prop**
- *Description:* `GameProps` mein `hasRainBarrel: boolean` add karo aur component signature mein destructure karo.
- *AC:* `npx tsc --noEmit` mein `hasRainBarrel` se related koi error na ho; rain barrel craft karne par `__hasRainBarrelRef` true ho; barrel water baarish mein badhe.

**RAFT-003 — Wire up achievements**
- *AC:* "First Meal" fish khane par ~5s ke andar unlock ho aur toast dikhe; `localStorage.raftAchievements` update ho; ek achievement dobara toast nahi karta.

**RAFT-006 — Fix Load Game**
- *Description:* Save mein pura `GameSnapshot` (health, hunger, thirst, wood, plastic, fish, cookedFish, raftHealth, day, elapsed `time`, barrelWater, buildings) ho; `Game` ko `initialState` prop se hydrate karo.
- *AC:* Save → reload → Continue karne par har value save-time ke barabar (tolerance: 0); day counter reset nahi hota; HUD ke pehle 10 frames mein koi flicker/overwrite nahi.

**RAFT-008 — Prevent accidental run loss**
- *AC:* ESC dabane par pause + confirm modal; "Cancel" game resume karta hai; kisi bhi path par unsaved progress silently delete nahi hota.

---

### RAFT-E1 — Combat & Threat System (P0)

> **Goal:** Combat player ko available, readable, rewarding aur scaling wala lage.

| Key | Type | Title | Pri | SP | Links |
|---|---|---|---|---|---|
| RAFT-101 | Bug | Fix kraken kill `health = 100` exploit (clamp to max HP; reward heal instead) | P0 | 1 | L-09 |
| RAFT-102 | Bug | Proper 2D hitboxes for spear vs shark/kraken/frog (shared `attackArc`) | P0 | 3 | L-10 |
| RAFT-103 | Feature | Loot & XP drops from frog/shark/kraken kills | P0 | 3 | L-13 |
| RAFT-104 | Feature | Day-based threat scaling (spawn rate, HP, damage, new enemy tiers) | P0 | 5 | L-14 |
| RAFT-105 | Rework | Shark AI: remove "safe middle" exploit — shark targets structures/raft sections & fish bait | P1 | 5 | L-11 |
| RAFT-106 | Feature | Weapon tiers: Wooden → Stone/Scrap → Reinforced spear; unlock via crafting | P1 | 5 | L-15 |
| RAFT-107 | Feature | Ranged weapon: bow/harpoon gun with ammo (wood + plastic) | P2 | 5 | L-15 |
| RAFT-108 | Feature | Enemy health bars, damage numbers, hit-flash, hit-stop, SFX | P1 | 3 | L-34 |
| RAFT-109 | Feature | New enemy types: seagull (steals fish), pirate raft (raid), jellyfish (hazard) | P2 | 8 | L-14 |
| RAFT-110 | Feature | Frog projectiles & shark bites interact with walls (blocked/absorbed) | P1 | 3 | L-16, L-17 |
| RAFT-111 | Feature | Apply `DIFF.damageMult` to ALL damage sources | P2 | 1 | L-22 |

**RAFT-101 — Kraken exploit**
- *AC:* Player health kabhi `maxHealth` se upar nahi jati (unit test); kraken defeat par heal + loot + XP mile, lekin hearts 5 se zyada na hon.

**RAFT-102 — Hitbox fix**
- *AC:* Spear sirf us enemy ko hit karta hai jo attack-arc (X **aur** Y) ke andar ho; off-screen enemy hit nahi hota; debug overlay (toggle) hitbox dikhata hai.

**RAFT-103 — Rewards**
- *AC:* Frog = 1–2 scrap/plastic + small XP; shark = fish/meat + good XP; kraken = rare material + large XP; drops visible aur auto-collectible; reward tables ek config file mein ho.

**RAFT-104 — Threat scaling**
- *AC:* Day 1–3 sirf frogs (tutorial-safe); Day 4+ sharks; Day 8+ kraken-chance; har 3 day par enemy HP/damage +10–15%; `balance.json` se tweak ho sakay bina code change; Day 10 ka run Day 1 se measurably mushkil ho (playtest metric: damage taken per minute ≥ 2×).

**RAFT-105 — Shark rework**
- *AC:* Raft ke kisi bhi hisse mein khade hone par 100% safety nahi; shark ka attack structures par damage karta hai (E2 ke saath); player ke paas counter hai (spear, bait, walls).

---

### RAFT-E2 — Construction & Base Building (P1)

> **Goal:** Building ka *meaning* ho — player decide kare kya, kahan, aur uska asar ho.

| Key | Type | Title | Pri | SP | Links |
|---|---|---|---|---|---|
| RAFT-201 | Feature | Grid-based raft (tiles) replacing single resizable rectangle | P1 | 8 | L-19 |
| RAFT-202 | Feature | Build mode: ghost preview, place/rotate/remove, refund % | P1 | 8 | L-19 |
| RAFT-203 | Feature | Functional **Roof**: blocks rain/snow/heat penalties underneath; shelter buff (faster regen) | P1 | 3 | L-17 |
| RAFT-204 | Feature | Functional **Walls**: block projectiles, shark can bite & damage them; HP + repair | P1 | 5 | L-17 |
| RAFT-205 | Feature | Real structure HP + **Repair** (fix "REPAIR RAFT" to repair structures/raftHealth) | P0 | 3 | L-12 |
| RAFT-206 | Feature | Raft sinking: raftHealth 0 ⇒ tile loss / game over condition | P1 | 3 | L-12 |
| RAFT-207 | Feature | Expose **Expand Raft** in crafting UI (adds tiles, scaling cost) | P1 | 2 | L-18 |
| RAFT-208 | Feature | New buildables: Storage crate, Fish drying rack, Water purifier, Sail/Engine, Net | P2 | 8 | L-20 |
| RAFT-209 | Feature | Resource sinks & upgrade tiers (wood → reinforced → metal) | P1 | 5 | L-20 |

**RAFT-205 — Repair**
- *AC:* "Repair" raftHealth ya structure HP badhata hai (player HP nahi); button par clear text; cost visible; raftHealth 100% par button disabled.

**RAFT-206 — Sinking / fail state**
- *AC:* raftHealth 0 par warning (10s) → tiles remove hon / sink animation → game over; shark ya storm damage ka asar meaningful ho.

**RAFT-202 — Build mode**
- *AC:* `B` dabane par build mode; valid/invalid tile green/red; click se place; resources deduct sirf successful placement par; undo/remove 50% refund.

---

### RAFT-E3 — Progression & Goals (P1)

> **Goal:** "Player level type kuch nahi" ko solve karna — XP, tiers, objectives, win condition.

| Key | Type | Title | Pri | SP | Links |
|---|---|---|---|---|---|
| RAFT-301 | Feature | Player XP & Level system (XP from fishing, crafting, kills, exploring, surviving) | P1 | 5 | — |
| RAFT-302 | Feature | Perk/skill tree: 3 branches — **Survivor** (hunger/thirst), **Fighter** (damage/HP), **Builder** (cost/HP) | P1 | 8 | — |
| RAFT-303 | Feature | Tech tiers (Tier 1 Wood → Tier 2 Scrap → Tier 3 Metal) gated by level/blueprints | P1 | 5 | L-20 |
| RAFT-304 | Feature | Objectives / quest chain (e.g., "Build 4 walls", "Survive Day 5", "Defeat a shark") with rewards | P1 | 5 | — |
| RAFT-305 | Feature | Revive dead code: **Islands & Chests** spawn + loot tables + exploration | P1 | 5 | L-25 |
| RAFT-306 | Feature | Win condition: reach the final island / defeat the final boss / "Escape" ending | P1 | 5 | — |
| RAFT-307 | Feature | Meta-progression: wire up SkinShop + coins; carry-over unlocks between runs | P2 | 3 | L-07 |
| RAFT-308 | Feature | Day/night & weather gameplay effects (storm waves, heat thirst↑, cold hunger↑; roof mitigates) | P2 | 5 | L-24 |

**RAFT-301 — XP & Levels**
- *AC:* HUD par XP bar + level; level-up par toast + 1 perk point; XP sources config-driven; level save/load mein persist; kam se kam 10 levels.

**RAFT-304 — Objectives**
- *AC:* Active objective HUD par dikhe; completion par reward; kam se kam 10 objectives; progress save hota hai.

**RAFT-306 — Win condition**
- *AC:* Ek definable end state (e.g., Day 20 + final island reached) jo victory screen, stats summary aur "New Game+" option trigger kare.

---

### RAFT-E4 — Survival Economy & Balance (P1)

| Key | Type | Title | Pri | SP | Links |
|---|---|---|---|---|---|
| RAFT-401 | Bug | Apply `DIFF.hungerRate/thirstRate` to hunger/thirst drain | P1 | 1 | L-22 |
| RAFT-402 | Rework | Re-balance hunger/thirst/regen curves; per-day pressure increase | P1 | 3 | L-23 |
| RAFT-403 | Rework | Make **Hook** meaningful: only hook reaches *far* loot (rare/big items); raft auto-collect only for near-raft debris | P1 | 3 | L-21 |
| RAFT-404 | Rework | Fishing: remove "touch fish = instant eat"; fishing/spear-fishing/net as the intended source; fish rarity/size matters | P1 | 3 | L-23 |
| RAFT-405 | Feature | Cooking loop: cooked fish HUD count, spoilage of raw fish (optional), better food tiers | P2 | 3 | L-33 |
| RAFT-406 | Feature | Central `balance.json` (all rates, costs, spawn weights) + in-dev tuning panel | P1 | 5 | — |

**RAFT-402 — Balance targets (starting proposal — tune with playtests)**
- *AC:* Median new player survives 8–12 min on Normal; ≥ 40% die before Day 5 on Hard; no resource hits "nothing to spend on" before level 5; telemetry (local) logs cause-of-death.

---

### RAFT-E5 — Onboarding, UX & Controls (P1)

| Key | Type | Title | Pri | SP | Links |
|---|---|---|---|---|---|
| RAFT-501 | Bug | **Mount `Tutorial`** on first run (`raftTutorialSeen`); add "Replay tutorial" in settings | P0 | 2 | L-31 |
| RAFT-502 | Feature | Contextual hints (e.g., "Press SPACE to attack" when shark nearby & spear owned) | P1 | 3 | L-31 |
| RAFT-503 | Feature | Control scheme: WASD + arrows; rebindable keys in Settings | P1 | 3 | L-32 |
| RAFT-504 | Feature | Touch controls (virtual joystick + action buttons) & gamepad support | P2 | 8 | L-32 |
| RAFT-505 | Feature | HUD overhaul: icons/labels for bars, cooked-fish counter, inventory slots, enemy warnings, XP/objective | P1 | 3 | L-33 |
| RAFT-506 | Cleanup | Remove or hide "Co-op" menu until networking exists | P3 | 1 | L-35 |
| RAFT-507 | Feature | Real Pause menu (mount `PauseMenu`), multiple save slots (mount `SaveSlots`), Leaderboard (local) | P2 | 5 | L-07, L-30 |

**RAFT-501 — Tutorial**
- *AC:* Pehli baar game khelne par Tutorial dikhe; skip / finish par dobara nahi; Settings se replay ho; spear + crafting + hook + fishing steps mein shamil hon.

---

### RAFT-E6 — Tech Debt, Performance & QA (P2)

| Key | Type | Title | Pri | SP | Links |
|---|---|---|---|---|---|
| RAFT-601 | Refactor | Split `Game.tsx` into modules: `engine/` (loop), `systems/` (combat, hunger, spawn, weather, build), `render/`, `audio/` | P2 | 13 | L-36 |
| RAFT-602 | Refactor | Replace `window.__*` globals with a typed game store / event bus | P2 | 5 | L-36, L-37 |
| RAFT-603 | Refactor | Fix effect dependencies; don't restart loop on `gameOver` | P2 | 2 | L-37 |
| RAFT-604 | Chore | Remove `console.log` in hot paths; add debug flag/logger | P3 | 1 | L-38 |
| RAFT-605 | Perf | Replace 4.7 MB GIF with `<video>`/CSS/canvas water; compress/stream the 6 MB audio; lazy-load | P2 | 3 | L-38 |
| RAFT-606 | Test | Unit tests for pure systems (hunger, damage, hit-check, balance); Playwright smoke test (start → craft → save → load) | P2 | 8 | L-40 |
| RAFT-607 | Chore | Lint/format cleanup (prettier, `no-explicit-any`, remove dead code, CRLF→LF), meaningful commit convention | P3 | 2 | L-39 |

---

## 5. Definition of Done (all tickets)

1. `npm run build`, `tsc --noEmit`, `eslint` clean.
2. Acceptance criteria verified manually on **Easy / Normal / Hard**.
3. No new `window.__*` globals; no `any` in new code.
4. Balance numbers in `balance.json`, not hard-coded.
5. Save → Load round-trip tested if the ticket touches state.
6. Short note added to a `CHANGELOG.md`.

## 6. Risks & Dependencies

| Risk | Mitigation |
|---|---|
| E2 (grid raft) touches the same code as E1 (shark vs structures) | Do RAFT-201 before RAFT-105/110; agree on one `Structure` data model first |
| E6 refactor in the middle of feature work causes merge pain | Do RAFT-601/602 **right after Sprint 1**, before big feature tickets, or timebox to one sprint |
| Balance changes without data | Ship RAFT-406 (central config) + death-cause logging early |
| Scope creep (co-op, new enemies) | Keep P2/P3 behind the core loop (E0–E3) |

## 7. Quick Wins (< 1 day each, high impact)

1. RAFT-001, RAFT-002 — build ko green karo.
2. RAFT-003 — achievements zinda ho jayenge.
3. RAFT-101 — kraken immortality.
4. RAFT-501 — Tutorial mount (ek line ka kaam, discoverability ka bada masla hal).
5. RAFT-401 — hunger/thirst difficulty multipliers.
6. RAFT-205 (basic) — REPAIR ko raftHealth se jodo.
7. RAFT-103 (basic) — kills par wood/fish drop.

---

*Note:* Ye analysis static code review par based hai. Pehle E0 fix karke game ko ek baar actually khel kar baseline playtest numbers lena recommended hai (survival time, cause of death, time-to-fully-crafted), taake E1/E4 ka balance data se tune ho.
