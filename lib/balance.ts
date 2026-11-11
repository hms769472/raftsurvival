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
export const MATERIAL_UPGRADE_COST: Record<
  Exclude<MaterialTier, 'wood'>,
  { wood: number; plastic: number }
> = {
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
export const WEAPON_TIERS: Record<
  WeaponTier,
  { name: string; damage: number; cooldown: number; wood: number; plastic: number }
> = {
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
export const ENEMY_UNLOCK_DAY = {
  frog: 1,
  jellyfish: 2,
  seagull: 3,
  shark: 4,
  pirate: 6,
  kraken: 8,
} as const;
export const THREAT_SCALE_EVERY_DAYS = 3;
export const THREAT_HP_STEP = 0.12; // +12% HP per step
export const THREAT_DAMAGE_STEP = 0.15; // +15% damage per step
export const THREAT_SPAWN_STEP = 0.15; // +15% spawn chance per step

// ===== Loot tables (RAFT-103) =====
export type LootType = 'wood' | 'plastic' | 'fish';
export type LootDrop = { type: LootType; min: number; max: number; chance: number };
export const LOOT_TABLES: Record<
  'frog' | 'shark' | 'kraken' | 'jellyfish' | 'seagull' | 'pirate',
  LootDrop[]
> = {
  frog: [
    { type: 'plastic', min: 1, max: 2, chance: 0.8 },
    { type: 'wood', min: 1, max: 1, chance: 0.4 },
  ],
  jellyfish: [
    { type: 'plastic', min: 1, max: 2, chance: 0.6 },
    { type: 'fish', min: 1, max: 1, chance: 0.5 },
  ],
  seagull: [
    { type: 'fish', min: 1, max: 2, chance: 0.8 },
    { type: 'plastic', min: 1, max: 2, chance: 0.3 },
  ],
  pirate: [
    { type: 'wood', min: 8, max: 16, chance: 1 },
    { type: 'plastic', min: 6, max: 12, chance: 1 },
    { type: 'fish', min: 1, max: 3, chance: 0.6 },
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
  killJellyfish: 4,
  killSeagull: 6,
  killShark: 20,
  killPirate: 40,
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
  HARPOON: 4,
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

// ===== Survival economy (RAFT-E4 / RAFT-402) =====

// Difficulty multipliers. Indexed by the value stored in `raftSettings.difficulty`.
export type DifficultyKey = 'easy' | 'normal' | 'hard';
export type DifficultyMods = {
  hungerRate: number;
  thirstRate: number;
  damageMult: number;
  enemySpawnMult: number;
  regenBonus: number;
  sharkRetreatMult: number;
};
export const DIFFICULTY: Record<DifficultyKey, DifficultyMods> = {
  easy: {
    hungerRate: 0.6,
    thirstRate: 0.6,
    damageMult: 0.5,
    enemySpawnMult: 1.5,
    regenBonus: 1.5,
    sharkRetreatMult: 1.5,
  },
  normal: {
    hungerRate: 1.0,
    thirstRate: 1.0,
    damageMult: 1.0,
    enemySpawnMult: 1.0,
    regenBonus: 1.0,
    sharkRetreatMult: 1.0,
  },
  hard: {
    hungerRate: 1.6,
    thirstRate: 1.6,
    damageMult: 1.5,
    enemySpawnMult: 0.6,
    regenBonus: 0.5,
    sharkRetreatMult: 0.6,
  },
};

// Per-frame drain from a full bar (100) at Normal difficulty. Tuned so a
// player taking no action at all runs out of food ~8 min and water ~9.3 min,
// i.e. a median first run ends inside the 8-12 min target window; eating /
// drinking pushes it well past that. Hard is 1.6x → death well before Day 5.
export const HUNGER_DRAIN = 0.0035; // ~0.21/s  → 100 in ~7.9 min
export const THIRST_DRAIN = 0.003; // ~0.18/s  → 100 in ~9.3 min
// Damage taken each frame while hunger OR thirst is pinned at 0.
export const STARVE_DAMAGE = 0.0022;
export const DROWN_DAMAGE = 0.005; // per frame swimming off the raft

// Passive health regen per frame (raft, not in water).
export const REGEN_WELL_FED = 0.004; // hunger > 50 && thirst > 50
export const REGEN_STARVING = 0.001;

// RAFT-402: each new day adds a small permanent pressure on top of difficulty,
// so later days are harder even without enemies ("per-day pressure increase").
export const DAY_PRESSURE_STEP = 0.04; // +4% hunger/thirst drain per day
export const DAY_PRESSURE_MAX = 2.0; // drain pressure caps at 2x

// Drinking: a mouthful of barrel water restores thirst (RAFT-405 water loop).
export const WATER_THIRST_RESTORE = 40;
export const WATER_BARREL_COST = 30;

// RAFT-402: local cause-of-death telemetry (never leaves the browser).
export type DeathCause = 'starved' | 'dehydrated' | 'drowned' | 'killed' | 'sank';

// RAFT-405: food tiers — hunger restored (and health) per item eaten.
export type FoodTier = 'raw' | 'cooked' | 'dried';
export const FOOD_TIERS: Record<FoodTier, { hunger: number; health: number }> = {
  raw: { hunger: 35, health: 0 },
  cooked: { hunger: 60, health: 0 },
  dried: { hunger: 80, health: 0.5 },
};

// RAFT-404: food yielded per fish caught, by size/rarity. Golden fish are a
// rare bonus catch worth extra.
export const FISH_YIELD: Record<'small' | 'medium' | 'large', number> = {
  small: 1,
  medium: 2,
  large: 3,
};
export const GOLDEN_FISH_BONUS = 2;

// ===== Hook (RAFT-403) =====
export const HOOK_REACH = 340; // how far up the hook is thrown (px)
export const HOOK_SPEED = 8; // px/frame throw speed
export const HOOK_COOLDOWN = 30; // frames between throws
export const HOOK_PULL_SPEED = 5; // px/frame item is reeled in
// Chance that a spawned debris item is a "rare" one: it floats in a side lane
// away from the raft (never auto-collected) and must be hooked.
export const RARE_ITEM_CHANCE = 0.18;
export const RARE_ITEM_BONUS = 3; // extra wood AND plastic granted on hook

// ===== Death log (RAFT-402) =====
export const DEATH_LOG_LIMIT = 10;

// ===== Ranged weapon: Harpoon (RAFT-107) =====
// A crafted throwable that lets the player hit targets outside melee reach —
// notably the distant pirate raft (RAFT-109). Only one harpoon is in flight at
// a time, so it never becomes a spam-fest.
export const HARPOON_COST = { wood: 10, plastic: 6 };
export const HARPOON_COOLDOWN = 45; // frames between throws
export const HARPOON_SPEED = 11; // px/frame
export const HARPOON_DAMAGE = 2;
export const HARPOON_RANGE = 460; // px travelled before it falls back

// ===== New enemies (RAFT-109) =====

// Jellyfish: a slow drifting sting hazard. Cheap to kill, but it clusters.
export const JELLYFISH_CONTACT_DAMAGE = 0.4;
export const JELLYFISH_SPAWN_INTERVAL = 420; // frames
export const JELLYFISH_MAX = 4;

// Seagull: circles high, then dives at the player. Must be speared low.
export const SEAGULL_CONTACT_DAMAGE = 0.6;
export const SEAGULL_SPAWN_INTERVAL = 540; // frames
export const SEAGULL_DIVE_SPEED = 2.6; // px/frame
export const SEAGULL_MAX = 3;

// Pirate raft: drifts on the horizon and lobs cannonballs. Out of melee reach
// — it can only be sunk with the harpoon.
export const PIRATE_RAFT_HP = 4;
export const PIRATE_CANNON_DAMAGE = 0.8;
export const PIRATE_SPAWN_INTERVAL = 1080; // frames
export const PIRATE_FIRE_INTERVAL = 150; // frames between cannonballs
export const PIRATE_CANNON_SPEED = 4.5;

// ===== Dev tuning panel (RAFT-406) =====
// The single mutable surface a developer can tweak live from the in-game F4
// panel. The game loop reads from here every frame, so edits apply instantly
// without a reload. In production the panel is never mounted and these values
// stay at their defaults.
export const TUNABLE = {
  hungerDrain: HUNGER_DRAIN,
  thirstDrain: THIRST_DRAIN,
  starveDamage: STARVE_DAMAGE,
  drownDamage: DROWN_DAMAGE,
  regenWellFed: REGEN_WELL_FED,
  regenStarving: REGEN_STARVING,
};
export type TunableKey = keyof typeof TUNABLE;
export const DEFAULT_TUNABLE = { ...TUNABLE };
/** Bounds used by the tuning panel sliders (min/max/step). */
export const TUNABLE_RANGE: Record<TunableKey, { min: number; max: number; step: number }> = {
  hungerDrain: { min: 0, max: 0.02, step: 0.0005 },
  thirstDrain: { min: 0, max: 0.02, step: 0.0005 },
  starveDamage: { min: 0, max: 0.02, step: 0.0002 },
  drownDamage: { min: 0, max: 0.03, step: 0.0005 },
  regenWellFed: { min: 0, max: 0.03, step: 0.0005 },
  regenStarving: { min: 0, max: 0.02, step: 0.0005 },
};

// RAFT-406: mutation helpers so the dev panel never writes to the shared
// `TUNABLE` object from inside a React component (which the lint rules forbid).
export function setTunable(key: TunableKey, value: number): void {
  TUNABLE[key] = value;
}
export function resetTunable(): void {
  (Object.keys(DEFAULT_TUNABLE) as TunableKey[]).forEach((key) => {
    TUNABLE[key] = DEFAULT_TUNABLE[key];
  });
}
