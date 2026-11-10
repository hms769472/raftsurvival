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

// ===== Buildable structures (RAFT-201..209) =====
export type StructureKind = 'wall' | 'floor' | 'roof' | 'crate' | 'dryingrack' | 'purifier';
export type MaterialTier = 'wood' | 'reinforced' | 'metal';

// Grid cell size in world px (RAFT-201).
export const TILE_SIZE = 40;

export const STRUCTURE_HP: Record<StructureKind, number> = {
  wall: WALL_HP,
  floor: 40,
  roof: 25,
  crate: 24,
  dryingrack: 20,
  purifier: 20,
};

export const STRUCTURE_COST: Record<StructureKind, { wood: number; plastic: number }> = {
  wall: { wood: 5, plastic: 0 },
  floor: { wood: 4, plastic: 0 },
  roof: { wood: 3, plastic: 2 },
  crate: { wood: 10, plastic: 4 },
  dryingrack: { wood: 8, plastic: 3 },
  purifier: { wood: 12, plastic: 8 },
};

// RAFT-202: removing a placed structure refunds half of its cost.
export const STRUCTURE_REFUND = 0.5;

// RAFT-209: material tiers so wood never becomes worthless. Upgrading a
// structure raises its HP; the tier costs are paid on top of the base cost.
export const MATERIAL_HP_MULT: Record<MaterialTier, number> = {
  wood: 1,
  reinforced: 1.6,
  metal: 2.5,
};
export const MATERIAL_UPGRADE_COST: Record<Exclude<MaterialTier, 'wood'>, { wood: number; plastic: number }> = {
  reinforced: { wood: 6, plastic: 4 },
  metal: { wood: 10, plastic: 12 },
};

// Order matters: index doubles as a tier rank for upgrades (RAFT-209).
export const MATERIAL_ORDER: MaterialTier[] = ['wood', 'reinforced', 'metal'];

// Per-structure gameplay effects.
export const ROOF_REGEN_BONUS = 0.02; // hp/frame regen while sheltered (RAFT-203)
export const CRATE_CAPACITY = 40; // extra wood/plastic storage per crate (RAFT-208)
export const STORAGE_CAP_BASE = 100; // base storage cap before any crates (RAFT-208)
export const DRYING_RACK_PERIOD = 1200; // frames per dried fish (~20s) (RAFT-208)
export const PURIFIER_PERIOD = 1800; // frames per clean water (~30s) (RAFT-208)

// Raft sinking (RAFT-206).
export const SINK_WARNING_FRAMES = 300; // 5s countdown before tiles are lost
export const SINK_TILE_LOSS_INTERVAL = 40; // frames between tile losses during sinking

// RAFT-205: repairing the raft restores integrity and patches structures.
export const RAFT_REPAIR_COST = { wood: 5, plastic: 0 };
export const RAFT_REPAIR_AMOUNT = 25;

// RAFT-207: expanding the deck — each expansion costs more than the last.
export const BASE_RAFT_HEIGHT = 150; // starting deck length in world px
export const EXPAND_COST_BASE = { wood: 10, plastic: 5 };
export const EXPAND_COST_STEP = { wood: 5, plastic: 3 };
export const EXPAND_SIZE = 40;

// RAFT-203: weather strain (extra drain multiplier) vs. shelter mitigation.
export const WEATHER_HEAT_THIRST = 1.8; // heat drains thirst faster
export const WEATHER_SNOW_HUNGER = 1.8; // cold drains hunger faster
export const WEATHER_RAIN_DRAIN = 1.3; // rain is a mild drain on both


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

// ===== Progression (RAFT-301) =====
export const MAX_LEVEL = 10;
// XP required to go from level L to L+1 = base + step * (L - 1).
export const XP_CURVE_BASE = 100;
export const XP_CURVE_STEP = 60;
// XP awarded per activity (all gains flow through the single XP sink).
export const XP_REWARDS = {
  gatherWood: 3, // per wood item picked up
  gatherPlastic: 3,
  catchFish: 5,
  cook: 6,
  craft: 12,
  build: 8, // per structure placed
  upgrade: 10,
  killFrog: 5,
  killShark: 20,
  killKraken: 100,
  explore: 15, // per island / chest looted
  surviveDay: 30,
} as const;

// RAFT-303: tech tiers gated by player level. Items above the level show locked.
export const TECH_UNLOCK: Record<string, number> = {
  ROD: 1,
  SPEAR: 1,
  HAMMER: 1,
  REPAIR: 1,
  EXPAND: 1,
  RAIN_BARREL: 2,
  CAMPFIRE: 2,
  SPEAR_UPGRADE: 3,
};

// ===== Islands / chests / wrecks (RAFT-305) =====
export const ISLAND_SPAWN_PERIOD = 1500; // frames between island spawns
export const CHEST_SPAWN_PERIOD = 2100; // frames between floating-chest spawns
export const ISLAND_LOOT: LootDrop[] = [
  { type: 'wood', min: 6, max: 14, chance: 1 },
  { type: 'plastic', min: 3, max: 8, chance: 0.9 },
  { type: 'fish', min: 1, max: 3, chance: 0.6 },
];
export const CHEST_LOOT: LootDrop[] = [
  { type: 'wood', min: 3, max: 9, chance: 1 },
  { type: 'plastic', min: 2, max: 6, chance: 0.9 },
  { type: 'fish', min: 1, max: 2, chance: 0.4 },
];

// ===== Win condition (RAFT-306) =====
export const WIN_DAY = 20; // survive to this day to win

// ===== Weather (RAFT-308) =====
export const STORM_RAFT_DAMAGE = 0.02; // raft integrity lost per frame in a storm (no shelter)
