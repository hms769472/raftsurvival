import type { LootType } from '@/lib/balance';

export type Frog = {
  x: number;
  y: number;
  width: number;
  height: number;
  shootTimer: number;
  direction: number;
  hopPhase: number;
};
export type Projectile = { x: number; y: number; vx: number; vy: number; size: number };
export type Raindrop = { x: number; y: number; length: number; speed: number };
export type Item = {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: 'wood' | 'plastic' | 'fish';
  rotation: number;
  rotationSpeed: number;
  rare?: boolean;
};
export type Shark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  maxHealth: number;
  hitFlash: number;
  state: 'wandering' | 'attacking' | 'passing' | 'retreating';
  attackTimer: number;
  tailPhase: number;
  willAttack: boolean;
  mouthOpen: number;
};
export type TreasureChest = {
  x: number;
  y: number;
  vy: number;
  vx: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  life: number;
  glow: number;
  opened: boolean;
};
export type Island = {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  vx: number;
  trees: { x: number; y: number; size: number }[];
  rocks: { x: number; y: number; size: number }[];
  collected: boolean;
  life: number;
};
export type WaveStreak = {
  x: number;
  y: number;
  length: number;
  width: number;
  speed: number;
  alpha: number;
  phase: number;
};
export type FishFood = {
  x: number;
  y: number;
  vy: number;
  size: number;
  color: string;
  spawnTime: number;
};
export type Fish = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  tailPhase: number;
  facingRight: boolean;
  state: 'swimming' | 'attached' | 'onRaft' | 'fleeing';
  bitesLeft: number;
  wanderAngle: number;
  wanderTimer: number;
  sizeCategory: 'small' | 'medium' | 'large';
  mouthOpen: number;
  eatingCooldown: number;
  isGolden: boolean;
  targetFoodIndex: number;
  restTimer: number;
  attachFacing: number;
  graceTimer: number;
  attachSide: -1 | 1;
  offsetX: number;
  offsetY: number;
  hasAttached: boolean;
};
export type WakeParticle = {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
  life: number;
};
export type Kraken = {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  state: 'rising' | 'attacking' | 'dying';
  timer: number;
  hitFlash: number;
};
export type DamageNumber = { x: number; y: number; value: number; life: number; color: string };
/** RAFT-103: floating loot icon that flies toward the raft and is auto-collected. */
export type LootPickup = {
  x: number;
  y: number;
  type: LootType;
  amount: number;
  life: number;
  vy: number;
};
