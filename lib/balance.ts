// Central gameplay balance constants for Raft Survival v0.2.
// Every gameplay-affecting number should live here (never hard-coded in components).

export const FRAMES_PER_SECOND = 60;
export const MS_PER_FRAME = 1000 / FRAMES_PER_SECOND;

// One in-game day === 2 real minutes (120s * 60fps). Shared by the HUD day
// counter and the achievement "days survived" tracker.
export const DAY_LENGTH = 60 * 60 * 2;

// Player health is tracked in "hearts".
export const MAX_HEALTH = 5;

// Raft structural integrity (0-100).
export const MAX_RAFT_HEALTH = 100;

// ===== Combat (RAFT-E1) =====

export const SPEAR_COOLDOWN_FRAMES = 30;
// Attack reach measured outward from the player's AABB. `vertical` is a
// symmetric pad added above and below the player (RAFT-102).
export const SPEAR_REACH = { front: 40, back: 20, vertical: 0 };
export const SHARK_REACH = { front: 80, back: 40, vertical: 60 };
export const KRAKEN_REACH = { front: 35, back: 35, vertical: 200 };
export const PLAYER_INVULN_FRAMES = 90;

// Kraken
export const KRAKEN_MAX_HP = 5;
export const KRAKEN_BOX = 130;
export const KRAKEN_BITE_DAMAGE = 0.5;
export const KRAKEN_BITE_INTERVAL = 180;
export const KRAKEN_HEAL_ON_KILL = 2; // hearts restored, clamped to MAX_HEALTH (RAFT-101)
export const KRAKEN_SPAWN_AFTER_FRAMES = 6000;
export const KRAKEN_SPAWN_CHANCE = 0.003;

// Shark
export const SHARK_MAX_HP = 3;
export const SHARK_BITE_DAMAGE = 0.7;
export const SHARK_SAFE_MIDDLE_DAMAGE = 0.3; // RAFT-105: middle is no longer 100% safe
export const SHARK_RAFT_DAMAGE = 15;
export const SHARK_SPAWN_AFTER_FRAMES = 1200;
export const SHARK_SPAWN_CHANCE = 0.005;

// Frogs
export const FROG_BASE_CAP = 3;
export const FROG_CAP_PER_DAY = 4; // +1 frog cap every 4 days
export const FROG_SPAWN_INTERVAL = 480;
export const FROG_CONTACT_DAMAGE = 0.5;
export const FROG_PROJECTILE_DAMAGE = 1;

// Structures (minimal durability in Phase 1; real entities land in Phase 2).
export const WALL_HP = 30;
// Vertical band (px above the raft surface) where a wall intercepts shots.
export const WALL_BLOCK_HEIGHT = 70;

// ===== Weapon tiers (RAFT-106) =====
export type WeaponTier = 'wooden' | 'stone' | 'reinforced';
export const WEAPON_TIERS: Record<WeaponTier, { name: string; damage: number; cooldown: number; wood: number; plastic: number }> = {
  wooden: { name: 'Wooden Spear', damage: 1, cooldown: 30, wood: 8, plastic: 0 },
  stone: { name: 'Stone Spear', damage: 2, cooldown: 24, wood: 8, plastic: 6 },
  reinforced: { name: 'Reinforced Spear', damage: 3, cooldown: 18, wood: 12, plastic: 10 },
};
export const WEAPON_ORDER: WeaponTier[] = ['wooden', 'stone', 'reinforced'];
export function nextWeaponTier(tier: WeaponTier): WeaponTier | null {
  const i = WEAPON_ORDER.indexOf(tier);
  return i >= 0 && i < WEAPON_ORDER.length - 1 ? WEAPON_ORDER[i + 1] : null;
}

// ===== Threat scaling (RAFT-104) =====
export const ENEMY_UNLOCK_DAY = { frog: 1, shark: 4, kraken: 8 } as const;
export const THREAT_SCALE_EVERY_DAYS = 3;
export const THREAT_HP_STEP = 0.12; // +12% HP per step
export const THREAT_DAMAGE_STEP = 0.15; // +15% damage per step
export const THREAT_SPAWN_STEP = 0.15; // +15% spawn chance per step

// ===== Loot tables (RAFT-103) =====
export type LootType = 'wood' | 'plastic' | 'fish';
export type LootDrop = { type: LootType; min: number; max: number; chance: number };
export const LOOT_TABLES: Record<'frog' | 'shark' | 'kraken', LootDrop[]> = {
  frog: [
    { type: 'plastic', min: 1, max: 2, chance: 0.8 },
    { type: 'wood', min: 1, max: 1, chance: 0.4 },
  ],
  shark: [
    { type: 'fish', min: 1, max: 2, chance: 0.9 },
    { type: 'wood', min: 2, max: 4, chance: 0.7 },
    { type: 'plastic', min: 1, max: 3, chance: 0.5 },
  ],
  kraken: [
    { type: 'wood', min: 20, max: 40, chance: 1 },
    { type: 'plastic', min: 15, max: 25, chance: 1 },
    { type: 'fish', min: 3, max: 6, chance: 1 },
  ],
};
