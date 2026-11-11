import { SHARK_MAX_HP, RARE_ITEM_CHANCE } from '@/lib/balance';
import { threatScale } from '@/lib/systems/combat';
import type { StatsValues } from '@/lib/systems/build';
import type {
  Fish,
  FishFood,
  Frog,
  Island,
  Item,
  Projectile,
  Shark,
  TreasureChest,
} from '@/lib/engine/entities';

export function spawnProjectile(
  projectiles: Projectile[],
  player: { x: number; y: number; width: number; height: number },
  frog: Frog,
) {
  const dx = player.x + player.width / 2 - frog.x;
  const dy = player.y + player.height / 2 - frog.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  projectiles.push({
    x: frog.x + frog.width / 2,
    y: frog.y + frog.height / 2,
    vx: (dx / distance) * 3,
    vy: (dy / distance) * 3,
    size: 8,
  });
}

export function spawnFrog(frogs: Frog[]) {
  const side = Math.random() > 0.5 ? 'left' : 'right';
  frogs.push({
    x: side === 'left' ? -40 : 840,
    y: 480 + Math.random() * 40,
    width: 40,
    height: 40,
    shootTimer: 60 + Math.random() * 120,
    direction: side === 'left' ? 1 : -1,
    hopPhase: Math.random() * Math.PI * 2,
  });
}

export function spawnIsland(islands: Island[]) {
  // Random size: small, medium, large
  const roll = Math.random();
  const w = roll < 0.5 ? 100 : roll < 0.85 ? 160 : 240;
  const h = roll < 0.5 ? 30 : roll < 0.85 ? 40 : 55;
  const fromLeft = Math.random() < 0.5;

  const trees = [];
  const rockCount = 2 + Math.floor(Math.random() * 3);
  const rocks = [];
  const treeCount = Math.floor(w / 60);
  for (let t = 0; t < treeCount; t++) {
    trees.push({
      x: 15 + (t + 0.5) * ((w - 30) / treeCount) + (Math.random() - 0.5) * 10,
      y: -8 - Math.random() * 8,
      size: 8 + Math.random() * 6,
    });
  }
  for (let r = 0; r < rockCount; r++) {
    rocks.push({
      x: 20 + Math.random() * (w - 40),
      y: h - 12 - Math.random() * 6,
      size: 4 + Math.random() * 4,
    });
  }

  islands.push({
    x: fromLeft ? -w - 20 : 820,
    y: 200 + Math.random() * 250,
    width: w,
    height: h,
    vx: fromLeft ? 0.4 + Math.random() * 0.3 : -(0.4 + Math.random() * 0.3),
    vy: -(0.3 + Math.random() * 0.4),
    trees,
    rocks,
    collected: false,
    life: 2400,
  });
}

export function spawnChest(chests: TreasureChest[]) {
  const fromLeft = Math.random() < 0.5;
  chests.push({
    x: fromLeft ? -40 : 840,
    y: 250 + Math.random() * 250,
    vx: fromLeft ? 0.6 + Math.random() * 0.4 : -(0.6 + Math.random() * 0.4),
    vy: -(0.2 + Math.random() * 0.3),
    size: 22,
    rotation: 0,
    rotSpeed: (Math.random() - 0.5) * 0.02,
    life: 2400,
    glow: 0,
    opened: false,
  });
}

export function spawnFishFood(fishFoods: FishFood[]) {
  if (fishFoods.length > 15) return;
  const colors = ['#E74C3C', '#F39C12', '#27AE60', '#9B59B6', '#F1C40F'];
  fishFoods.push({
    x: 40 + Math.random() * 720,
    y: 610 + Math.random() * 30,
    vy: -(0.15 + Math.random() * 0.25), // slow drift upward
    size: 3 + Math.random() * 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    spawnTime: 0,
  });
}

export function spawnFish(fishes: Fish[]) {
  const colors = ['#F39C12', '#E74C3C', '#3498DB', '#27AE60', '#9B59B6', '#E67E22'];

  // Roll size category
  const roll = Math.random();
  let sizeCategory: 'small' | 'medium' | 'large';
  let w = 0,
    h = 0;
  if (roll < 0.5) {
    sizeCategory = 'small';
    w = 20 + Math.random() * 8;
    h = 11 + Math.random() * 4;
  } else if (roll < 0.85) {
    sizeCategory = 'medium';
    w = 32 + Math.random() * 10;
    h = 16 + Math.random() * 4;
  } else {
    sizeCategory = 'large';
    w = 50 + Math.random() * 15;
    h = 24 + Math.random() * 6;
  }

  // Spawn from any edge
  const edge = Math.floor(Math.random() * 4);
  let sx = 0,
    sy = 0;
  if (edge === 0) {
    sx = -40;
    sy = 100 + Math.random() * 400;
  } else if (edge === 1) {
    sx = 840;
    sy = 100 + Math.random() * 400;
  } else if (edge === 2) {
    sx = 40 + Math.random() * 720;
    sy = 660;
  } else {
    sx = 40 + Math.random() * 720;
    sy = -40;
  }

  // Base speed by size (larger = stronger, faster)
  const baseSpeed =
    sizeCategory === 'small'
      ? 0.7 + Math.random() * 0.5
      : sizeCategory === 'medium'
        ? 1.0 + Math.random() * 0.6
        : 1.5 + Math.random() * 0.7;

  // Aim toward center
  const cxT = 400 - sx;
  const cyT = 300 - sy;
  const dist = Math.sqrt(cxT * cxT + cyT * cyT) || 1;
  const svx = (cxT / dist) * baseSpeed;
  const svy = (cyT / dist) * baseSpeed;

  fishes.push({
    x: sx,
    y: sy,
    vx: svx,
    vy: svy,
    width: w,
    height: h,
    color: colors[Math.floor(Math.random() * colors.length)],
    tailPhase: Math.random() * Math.PI * 2,
    facingRight: svx > 0,
    state: 'swimming',
    bitesLeft: sizeCategory === 'large' ? 5 : sizeCategory === 'medium' ? 3 : 2,
    attachSide: 1,
    offsetX: 0,
    offsetY: 0,
    hasAttached: false,
    isGolden: Math.random() < 0.06,
    wanderAngle: Math.random() * Math.PI * 2,
    wanderTimer: 0,
    sizeCategory,
    mouthOpen: 0,
    eatingCooldown: 0,
    targetFoodIndex: -1,
    restTimer: 0,
    attachFacing: 0,
    graceTimer: 0,
  });
}

// RAFT-403: some debris spawns as "rare" loot in the side lanes, outside the
// raft's column. It can never be auto-collected — only the hook can reach it
// — and it pays a bonus of both wood and plastic on collection.
export function spawnItem(items: Item[]) {
  const types: ('wood' | 'plastic')[] = ['wood', 'plastic'];
  const rare = Math.random() < RARE_ITEM_CHANCE;
  const x = rare
    ? Math.random() < 0.5
      ? Math.random() * 100
      : 700 + Math.random() * 70
    : Math.random() * (800 - 30);
  items.push({
    x,
    y: -40,
    width: rare ? 46 : 40,
    height: rare ? 34 : 30,
    speed: rare ? 3.5 + Math.random() * 2 : 2.5 + Math.random() * 2,
    type: types[Math.floor(Math.random() * types.length)],
    rotation: 0,
    rotationSpeed: (Math.random() - 0.5) * 0.05,
    rare,
  });
}

export function spawnShark(statsRef: { current: StatsValues }): Shark {
  const willAttack = Math.random() < 0.5;
  const edge = Math.floor(Math.random() * 4);
  const spd = 2;
  const hp = Math.round(SHARK_MAX_HP * threatScale(statsRef.current.day).hpMult);
  let sx = 0,
    sy = 0,
    svx = 0,
    svy = 0;
  if (edge === 0) {
    sx = -180;
    sy = 150 + Math.random() * 300;
    svx = spd;
    svy = 0;
  } else if (edge === 1) {
    sx = 980;
    sy = 150 + Math.random() * 300;
    svx = -spd;
    svy = 0;
  } else if (edge === 2) {
    sx = 100 + Math.random() * 600;
    sy = -180;
    svx = 0;
    svy = spd;
  } else {
    sx = 100 + Math.random() * 600;
    sy = 780;
    svx = 0;
    svy = -spd;
  }
  return {
    x: sx,
    y: sy,
    vx: svx,
    vy: svy,
    width: 160,
    height: 70,
    speed: spd,
    health: hp,
    maxHealth: hp,
    hitFlash: 0,
    state: 'wandering',
    attackTimer: 0,
    tailPhase: 0,
    willAttack,
    mouthOpen: 0,
  };
}
