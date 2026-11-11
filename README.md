# Stranded on a Raft — Raft Survival

A 2D pixel survival game built with **Next.js 16**, **React 19**, **TypeScript** and a
hand-written canvas engine. Fish, build, fight sharks and krakens, and survive **20 days**
adrift on a raft.

Fully client-side: there is no backend and no account. Every run, setting and score is
stored **locally in the browser** (Zero-Knowledge by design — nothing leaves the device).

## Gameplay

- **Survive** — manage health, hunger and thirst; weather (rain / heat / snow) drains them faster.
- **Gather** — chop floating wood and plastic; hook rare debris out of the side lanes.
- **Catch & cook** — spear fish, cook them on a campfire or dry them on a rack.
- **Build** — place walls, floors, roofs, crates, a drying rack and a purifier on a grid; upgrade to reinforced / metal tiers.
- **Fight** — frogs, sharks and the Kraken scale with the day counter.
- **Progress** — XP, levels, a perk tree, 12 chained objectives, achievements and collectible skins.
- **Win** — reach **Day 20** for the victory screen, then continue in **New Game+** (perks + coins carry over).

Controls: **WASD / Arrows** to move, **Space** to attack, **F** to fish, **H** to hook,
**B** to build, **C** to craft, **P / Esc** to pause. Rebinding and on-screen touch
controls are available in Settings.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command            | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `npm run dev`      | Start the dev server                           |
| `npm run build`    | Production build                               |
| `npm start`        | Serve the production build                     |
| `npm run lint`     | ESLint                                         |
| `npm run format`   | Prettier (write)                               |
| `npm test`         | Unit tests (Vitest)                            |
| `npm run test:e2e` | End-to-end smoke test (Playwright)             |

## Project layout

```
app/            Next.js App Router entry (page, layout, icon, OG image, error/404)
components/     React UI (menus, HUD, overlays) + the <Game> canvas host
lib/balance.ts  All gameplay tuning constants (single source of truth)
lib/engine/     Entity types
lib/systems/    Pure, unit-tested logic (combat, loot, build, spawn, perks, objectives, progression, raft)
lib/render/     Canvas draw helpers
lib/audio/      Procedural SFX
lib/save.ts     Versioned localStorage save/load
lib/store.ts    Typed bridge between the canvas loop and the React tree
public/assets/  Game art & audio
e2e/            Playwright tests
reports/        Phase reports, changelog and progress tracker
```

## Deployment

Deployed on **Vercel**. Push to `main` and the platform builds automatically, or:

```bash
npm run build && npm start
```

Optional: set `NEXT_PUBLIC_SITE_URL` to your production origin so OpenGraph/Twitter
image URLs resolve correctly (falls back to Vercel's deployment URL automatically).

## Definition of Done

`tsc --noEmit`, `eslint`, unit tests and `next build` must all be clean before a change
is considered done. See `reports/PROGRESS.md` for the phase tracker.
