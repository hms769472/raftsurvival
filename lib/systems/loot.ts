import {
  XP_REWARDS,
  FISH_YIELD,
  GOLDEN_FISH_BONUS,
  HOOK_REACH,
  RARE_ITEM_BONUS,
} from '@/lib/balance';
import { rollLoot } from '@/lib/systems/combat';
import type { BuildGrid } from '@/lib/systems/raft';
import type { AchievementStats } from '@/lib/achievements';
import type { DamageNumber, Fish, Item, LootPickup } from '@/lib/engine/entities';
import type { RunCounters, StatsValues } from '@/lib/systems/build';

export type LootDeps = {
  statsRef: { current: StatsValues };
  buildGridRef: { current: BuildGrid };
  damageNumbers: DamageNumber[];
  lootDrops: LootPickup[];
  items: Item[];
  player: { x: number; y: number; width: number; height: number };
  counters: RunCounters;
  onXp: (amount: number) => void;
  bumpAch: (key: keyof AchievementStats, delta?: number) => void;
  refreshStats: () => void;
};

export function spawnDamageNumber(
  damageNumbers: DamageNumber[],
  x: number,
  y: number,
  value: number,
  color = '#FFD166',
) {
  damageNumbers.push({ x, y, value, life: 45, color });
}

// RAFT-103: rolls the enemy loot table, floats the drops toward the raft and
// auto-collects them into the stats. Also fires the XP hook.
export function grantKillRewards(
  deps: LootDeps,
  enemy: 'frog' | 'shark' | 'kraken',
  x: number,
  y: number,
) {
  for (const drop of rollLoot(enemy)) {
    if (drop.type === 'wood') {
      deps.statsRef.current.wood += drop.amount;
      deps.counters.addWoodGathered(drop.amount);
    } else if (drop.type === 'plastic') deps.statsRef.current.plastic += drop.amount;
    else {
      deps.statsRef.current.fish += drop.amount;
      deps.counters.addFishCaught(drop.amount);
    }
    deps.lootDrops.push({
      x,
      y,
      type: drop.type,
      amount: drop.amount,
      life: 60,
      vy: -0.9 - Math.random() * 0.4,
    });
  }
  // RAFT-301/304: kills are a progression source and advance the objective.
  deps.counters.addKills(1);
  deps.onXp(
    enemy === 'frog'
      ? XP_REWARDS.killFrog
      : enemy === 'shark'
        ? XP_REWARDS.killShark
        : XP_REWARDS.killKraken,
  );
  deps.refreshStats();
}

// RAFT-204: count intact grid walls (structures are the source of truth).
export function intactWalls(buildGridRef: { current: BuildGrid }) {
  return buildGridRef.current.tiles.filter((t) => t.kind === 'wall' && t.hp > 0).length;
}

// RAFT-404: fish are worth more when bigger; golden fish pay a rare bonus.
export function fishYield(f: Fish): number {
  return FISH_YIELD[f.sizeCategory] + (f.isGolden ? GOLDEN_FISH_BONUS : 0);
}
export function yieldFish(deps: LootDeps, f: Fish) {
  const amount = fishYield(f);
  deps.statsRef.current.fish += amount;
  deps.counters.addFishCaught(amount);
  deps.onXp(XP_REWARDS.catchFish);
}

// RAFT-403: a hooked item is reeled straight into storage. Rare loot adds a
// bonus of both wood and plastic and floats a pickup number.
export function grantHookedItem(deps: LootDeps, it: Item) {
  if (it.type === 'wood') {
    deps.statsRef.current.wood += 1;
    deps.counters.addWoodGathered(1);
    deps.bumpAch('totalWood');
    deps.onXp(XP_REWARDS.gatherWood);
  } else if (it.type === 'plastic') {
    deps.statsRef.current.plastic += 1;
    deps.bumpAch('totalPlastic');
    deps.onXp(XP_REWARDS.gatherPlastic);
  } else {
    deps.statsRef.current.fish += 1;
    deps.counters.addFishCaught(1);
    deps.onXp(XP_REWARDS.catchFish);
  }
  if (it.rare) {
    deps.statsRef.current.wood += RARE_ITEM_BONUS;
    deps.statsRef.current.plastic += RARE_ITEM_BONUS;
    deps.counters.addWoodGathered(RARE_ITEM_BONUS);
    deps.lootDrops.push({
      x: it.x,
      y: it.y,
      type: 'wood',
      amount: RARE_ITEM_BONUS,
      life: 60,
      vy: -0.9,
    });
    deps.lootDrops.push({
      x: it.x,
      y: it.y,
      type: 'plastic',
      amount: RARE_ITEM_BONUS,
      life: 60,
      vy: -0.9,
    });
  }
  deps.refreshStats();
}

// RAFT-403: the nearest debris within the hook's reach becomes the target.
export function findHookTarget(deps: LootDeps): Item | null {
  const px = deps.player.x + deps.player.width / 2;
  const py = deps.player.y + deps.player.height / 2;
  let best: Item | null = null;
  let bestD = HOOK_REACH;
  for (const it of deps.items) {
    const dx = it.x + it.width / 2 - px;
    const dy = it.y + it.height / 2 - py;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < bestD) {
      bestD = d;
      best = it;
    }
  }
  return best;
}
