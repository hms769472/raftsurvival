// Pure combat helpers (RAFT-E1). No React / DOM / canvas access so these can be
// unit-tested in isolation (RAFT-606).

import {
  MAX_HEALTH,
  THREAT_SCALE_EVERY_DAYS,
  THREAT_HP_STEP,
  THREAT_DAMAGE_STEP,
  THREAT_SPAWN_STEP,
  FROG_BASE_CAP,
  FROG_CAP_PER_DAY,
  FROG_PROJECTILE_DAMAGE,
  SHARK_BITE_DAMAGE,
  KRAKEN_BITE_DAMAGE,
  ENEMY_UNLOCK_DAY,
  LOOT_TABLES,
  type LootDrop,
  type LootType,
} from '@/lib/balance';

export type Box = { x: number; y: number; width: number; height: number };
export type Reach = { front: number; back: number; vertical: number };

/** Adds `delta` to `current`, clamped to the [0, max] health range (RAFT-101). */
export function clampHealth(current: number, delta: number, max: number = MAX_HEALTH): number {
  return Math.max(0, Math.min(max, current + delta));
}

/** Single helper for all healing so HP can never exceed `max` (RAFT-101). */
export function applyHeal(current: number, amount: number, max: number = MAX_HEALTH): number {
  return clampHealth(current, Math.abs(amount), max);
}

/** Single helper for all damage; `amount` is always applied negatively. */
export function applyDamage(current: number, amount: number, max: number = MAX_HEALTH): number {
  return clampHealth(current, -Math.abs(amount), max);
}

/**
 * True when `target` overlaps the attacker's forward attack arc — both the X
 * span (front/back reach) and the Y span (player height + vertical pad) must
 * overlap (RAFT-102). An enemy far above/below the player is never hit.
 */
export function inAttackArc(attacker: Box, target: Box, reach: Reach): boolean {
  return (
    target.x < attacker.x + attacker.width + reach.front &&
    target.x + target.width > attacker.x - reach.back &&
    target.y < attacker.y + attacker.height + reach.vertical &&
    target.y + target.height > attacker.y - reach.vertical
  );
}

/** Day-derived threat multipliers and caps (RAFT-104). */
export function threatScale(day: number): {
  hpMult: number;
  damageMult: number;
  spawnMult: number;
  frogCap: number;
} {
  const steps = Math.max(0, Math.floor((Math.max(1, day) - 1) / THREAT_SCALE_EVERY_DAYS));
  return {
    hpMult: 1 + steps * THREAT_HP_STEP,
    damageMult: 1 + steps * THREAT_DAMAGE_STEP,
    spawnMult: 1 + steps * THREAT_SPAWN_STEP,
    frogCap: FROG_BASE_CAP + Math.floor((Math.max(1, day) - 1) / FROG_CAP_PER_DAY),
  };
}

/** Whether an enemy type may appear on the given day (RAFT-104). */
export function isEnemyUnlocked(enemy: keyof typeof ENEMY_UNLOCK_DAY, day: number): boolean {
  return day >= ENEMY_UNLOCK_DAY[enemy];
}

/**
 * Rough damage-per-minute proxy for a day, used to prove the RAFT-104
 * acceptance criterion (>2x between Day 1 and Day 10 on Normal). It combines
 * per-hit damage, spawn pressure and the frog cap of every unlocked enemy.
 */
export function simulatedDps(day: number, difficultyDamageMult = 1): number {
  const s = threatScale(day);
  let dps = FROG_PROJECTILE_DAMAGE * s.frogCap * s.spawnMult;
  if (isEnemyUnlocked('shark', day)) dps += SHARK_BITE_DAMAGE * 3 * s.spawnMult;
  if (isEnemyUnlocked('kraken', day)) dps += KRAKEN_BITE_DAMAGE * 2 * s.spawnMult;
  return dps * s.damageMult * difficultyDamageMult;
}

/** Rolls an arbitrary loot table into concrete drop amounts (RAFT-305). */
export function rollTable(
  table: LootDrop[],
  rng: () => number = Math.random,
): { type: LootType; amount: number }[] {
  const drops: { type: LootType; amount: number }[] = [];
  for (const drop of table) {
    if (rng() > drop.chance) continue;
    const amount = drop.min + Math.floor(rng() * (drop.max - drop.min + 1));
    if (amount > 0) drops.push({ type: drop.type, amount });
  }
  return drops;
}

/** Rolls one enemy's loot table into concrete drop amounts (RAFT-103). */
export function rollLoot(
  enemy: keyof typeof LOOT_TABLES,
  rng: () => number = Math.random,
): { type: LootType; amount: number }[] {
  return rollTable(LOOT_TABLES[enemy] as LootDrop[], rng);
}
