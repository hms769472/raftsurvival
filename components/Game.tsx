'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  MS_PER_FRAME,
  DAY_LENGTH,
  SPEAR_REACH,
  SHARK_REACH,
  KRAKEN_REACH,
  KRAKEN_MAX_HP,
  KRAKEN_BOX,
  KRAKEN_BITE_DAMAGE,
  KRAKEN_BITE_INTERVAL,
  KRAKEN_HEAL_ON_KILL,
  KRAKEN_SPAWN_AFTER_FRAMES,
  KRAKEN_SPAWN_CHANCE,
  SHARK_BITE_DAMAGE,
  SHARK_SAFE_MIDDLE_DAMAGE,
  SHARK_RAFT_DAMAGE,
  SHARK_SPAWN_AFTER_FRAMES,
  SHARK_SPAWN_CHANCE,
  FROG_SPAWN_INTERVAL,
  FROG_CONTACT_DAMAGE,
  FROG_PROJECTILE_DAMAGE,
  WALL_BLOCK_HEIGHT,
  PLAYER_INVULN_FRAMES,
  WEAPON_TIERS,
  MAX_RAFT_HEALTH,
  TILE_SIZE,
  ROOF_REGEN_BONUS,
  SINK_WARNING_FRAMES,
  SINK_TILE_LOSS_INTERVAL,
  RAFT_REPAIR_COST,
  RAFT_REPAIR_AMOUNT,
  BASE_RAFT_HEIGHT,
  EXPAND_COST_BASE,
  EXPAND_COST_STEP,
  EXPAND_SIZE,
  MATERIAL_ORDER,
  DRYING_RACK_PERIOD,
  PURIFIER_PERIOD,
  CRATE_CAPACITY,
  STORAGE_CAP_BASE,
  WEATHER_HEAT_THIRST,
  WEATHER_SNOW_HUNGER,
  WEATHER_RAIN_DRAIN,
  MAX_HEALTH,
  XP_REWARDS,
  WIN_DAY,
  STORM_RAFT_DAMAGE,
  ISLAND_SPAWN_PERIOD,
  CHEST_SPAWN_PERIOD,
  ISLAND_LOOT,
  CHEST_LOOT,
  // RAFT-E4 survival economy
  DIFFICULTY,
  FOOD_TIERS,
  HOOK_REACH,
  HOOK_SPEED,
  HOOK_COOLDOWN,
  HOOK_PULL_SPEED,
  DAY_PRESSURE_STEP,
  DAY_PRESSURE_MAX,
  WATER_THIRST_RESTORE,
  WATER_BARREL_COST,
  DEATH_LOG_LIMIT,
  TUNABLE,
  type DifficultyKey,
  type DeathCause,
  type WeaponTier,
  type LootDrop,
  type StructureKind,
  type MaterialTier,
} from '@/lib/balance';
import {
  applyHeal,
  applyDamage,
  inAttackArc,
  threatScale,
  isEnemyUnlocked,
  rollTable,
} from '@/lib/systems/combat';
import { matchAction, loadBindings } from '@/lib/controls';
import { debug } from '@/lib/logger';
import { gameStore, gameCommands, resetGameCommands } from '@/lib/store';
import {
  EMPTY_GRID,
  damageFirstOfKind,
  repairAllTiles,
  hasShelter,
  countKind,
  toStored,
  fromStored,
  migrateFlatBuild,
  type BuildGrid,
} from '@/lib/systems/raft';
import {
  DEFAULT_ACH_STATS,
  normalizeAchStats,
  syncAchStats,
  findNewlyUnlocked,
  bumpAchStats,
  type AchDifficulty,
} from '@/lib/systems/achievements';
import type { AchievementStats } from '@/lib/achievements';
import { NEUTRAL_EFFECTS, type PerkEffects, type PerkRanks } from '@/lib/systems/perks';
import { DEFAULT_PROGRESSION, type ProgressionState } from '@/lib/systems/progression';
import type { SkinDefinition } from '@/types/game-globals';
import type { GameSnapshot, SnapshotStore } from '@/lib/save';
import { SAVE_VERSION } from '@/lib/save';
import type {
  DamageNumber,
  Fish,
  FishFood,
  Frog,
  Island,
  Item,
  Kraken,
  LootPickup,
  Projectile,
  Raindrop,
  Shark,
  TreasureChest,
  WakeParticle,
  WaveStreak,
} from '@/lib/engine/entities';
import {
  startWaveSound as startWaveSoundImpl,
  playFootstepSound as playFootstepSoundImpl,
  playChopSound as playChopSoundImpl,
  playHitSound as playHitSoundImpl,
  playCraftSound as playCraftSoundImpl,
  playEatSound as playEatSoundImpl,
  playDamageSound as playDamageSoundImpl,
} from '@/lib/audio/sfx';
import {
  spawnProjectile as spawnProjectileImpl,
  spawnFrog as spawnFrogImpl,
  spawnIsland as spawnIslandImpl,
  spawnChest as spawnChestImpl,
  spawnFishFood as spawnFishFoodImpl,
  spawnFish as spawnFishImpl,
  spawnItem as spawnItemImpl,
  spawnShark as spawnSharkImpl,
} from '@/lib/systems/spawn';
import {
  worldToCell as worldToCellImpl,
  cellToWorld as cellToWorldImpl,
  cellAction as cellActionImpl,
  statsPayload as statsPayloadImpl,
  tryPlace as tryPlaceImpl,
  tryRemove as tryRemoveImpl,
  toCanvasCoords as toCanvasCoordsImpl,
  type BuildDeps,
  type RunCounters,
} from '@/lib/systems/build';
import {
  spawnDamageNumber as spawnDamageNumberImpl,
  grantKillRewards as grantKillRewardsImpl,
  intactWalls as intactWallsImpl,
  fishYield as fishYieldImpl,
  yieldFish as yieldFishImpl,
  grantHookedItem as grantHookedItemImpl,
  findHookTarget as findHookTargetImpl,
  type LootDeps,
} from '@/lib/systems/loot';
import {
  drawChest as drawChestImpl,
  drawCloud as drawCloudImpl,
  drawIsland as drawIslandImpl,
  drawFish as drawFishImpl,
  drawFrog as drawFrogImpl,
  drawShark as drawSharkImpl,
  drawWood as drawWoodImpl,
  drawPlastic as drawPlasticImpl,
  drawVerticalRaft as drawVerticalRaftImpl,
  drawPlayer as drawPlayerImpl,
  drawKraken as drawKrakenImpl,
  drawEnemyHealthBar as drawEnemyHealthBarImpl,
  type Cloud,
} from '@/lib/render/drawables';

type GameStats = {
  health: number;
  hunger: number;
  thirst: number;
  fish: number;
  day: number;
  wood: number;
  plastic: number;
  raftHealth: number;
  walls?: number;
  roofs?: number;
  floors?: number;
  raftSize?: number;
  capacity?: number;
  damaged?: boolean;
  /** RAFT-301/304/305: extra counters the progression + objective systems read. */
  cookedFish?: number;
  kills?: number;
  islands?: number;
  structures?: number;
  crafted?: number;
  /** RAFT-304: cumulative gathering counters for the objective chain. */
  woodGathered?: number;
  fishCaught?: number;
};

type GameProps = {
  onStatsUpdate: (stats: GameStats) => void;
  craftAction: { type: string; id: number } | null;
  onCraftComplete: () => void;
  raftWidth: number;
  hasRod: boolean;
  hasSpear: boolean;
  hasHammer: boolean;
  hasCampfire: boolean;
  hasRainBarrel: boolean;
  walls: number;
  roofs: number;
  floors: number;
  gameOver: boolean;
  onGameOver: () => void;
  /** RAFT-306: fired once when the run reaches the win condition (WIN_DAY). */
  onVictory?: () => void;
  playerState: 'standing' | 'sitting' | 'laying';
  /** When provided, the run hydrates from this snapshot on mount (Continue). */
  initialState?: GameSnapshot | null;
  /** Live snapshot box the page reads to persist the run. */
  snapshotStore?: SnapshotStore;
  /** Freezes simulation while a menu overlay is open. */
  paused?: boolean;
  /** Current spear tier; drives spear damage (RAFT-106). */
  spearTier?: WeaponTier;
  /** RAFT-302: derived perk modifiers applied to the simulation. */
  perkEffects?: PerkEffects;
  /** RAFT-301: XP earned during the run, reported to the page's progression. */
  onXp?: (amount: number) => void;
  /** RAFT-304: one-shot resource grant claimed from an objective reward. */
  rewardAction?: { wood?: number; plastic?: number; id: number } | null;
  /** RAFT-304: clears the reward once applied. */
  onRewardComplete?: () => void;
  /** RAFT-301/302/304: page-owned progression captured into the save snapshot. */
  progression?: ProgressionState;
  perkRanks?: PerkRanks;
  objectiveIndex?: number;
};

const RAFT_WIDTH = 80;
const RAFT_CENTER_Y = 300;
const WORLD_SCROLL_SPEED = 2.2;

export default function Game({
  onStatsUpdate,
  craftAction,
  onCraftComplete,
  raftWidth,
  hasRod,
  hasSpear,
  hasHammer,
  hasCampfire,
  hasRainBarrel,
  walls,
  roofs,
  floors,
  gameOver,
  onGameOver,
  onVictory,
  playerState,
  initialState,
  snapshotStore,
  paused,
  spearTier,
  perkEffects,
  onXp: onXpProp,
  rewardAction,
  onRewardComplete,
  progression,
  perkRanks,
  objectiveIndex,
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const waveSoundRef = useRef<{ noiseSource: AudioBufferSourceNode; lfo: OscillatorNode } | null>(
    null,
  );
  // Hydrated from the loaded snapshot (Continue) so the first HUD push matches
  // exactly what was saved — no 0/full-value flicker before the loop catches up.
  const statsRef = useRef({
    health: initialState?.health ?? 5,
    hunger: initialState?.hunger ?? 100,
    thirst: initialState?.thirst ?? 100,
    fish: initialState?.fish ?? 0,
    day: initialState?.day ?? 1,
    wood: initialState?.wood ?? 0,
    plastic: initialState?.plastic ?? 0,
    raftHealth: initialState?.raftHealth ?? 100,
  });
  const raftRef = useRef({
    x: 400 - RAFT_WIDTH / 2,
    y: RAFT_CENTER_Y,
    width: RAFT_WIDTH,
    height: BASE_RAFT_HEIGHT,
  });

  const playerStateRef = useRef(playerState);
  useEffect(() => {
    playerStateRef.current = playerState;
  }, [playerState]);

  // RAFT-106: spear tier prop can change mid-run (upgrade); the game loop reads
  // it through a ref so the effect never needs to restart.
  const spearTierRef = useRef<WeaponTier>(spearTier ?? 'wooden');
  useEffect(() => {
    spearTierRef.current = spearTier ?? 'wooden';
  }, [spearTier]);

  // RAFT-302: perk modifiers can change mid-run (perk tree); read via a ref so
  // the main effect never restarts. RAFT-306: onVictory read via a ref too.
  const perkRef = useRef<PerkEffects>(perkEffects ?? NEUTRAL_EFFECTS);
  useEffect(() => {
    perkRef.current = perkEffects ?? NEUTRAL_EFFECTS;
  }, [perkEffects]);
  const onVictoryRef = useRef(onVictory);
  useEffect(() => {
    onVictoryRef.current = onVictory;
  }, [onVictory]);
  // RAFT-301: XP is reported through a prop so progression lives in the page.
  const onXpGainRef = useRef(onXpProp);
  useEffect(() => {
    onXpGainRef.current = onXpProp;
  }, [onXpProp]);
  // RAFT-304: total tools crafted this run (survives across the craft effect).
  const craftsMadeRef = useRef(0);
  // RAFT-301/302/304: page-owned progression, written into the save snapshot.
  const progressionRef = useRef<ProgressionState>(progression ?? DEFAULT_PROGRESSION);
  useEffect(() => {
    progressionRef.current = progression ?? DEFAULT_PROGRESSION;
  }, [progression]);
  const perkRanksRef = useRef<PerkRanks>(perkRanks ?? {});
  useEffect(() => {
    perkRanksRef.current = perkRanks ?? {};
  }, [perkRanks]);
  const objectiveIndexRef = useRef(objectiveIndex ?? 0);
  useEffect(() => {
    objectiveIndexRef.current = objectiveIndex ?? 0;
  }, [objectiveIndex]);

  // RAFT-603: `gameOver`/`paused` are read inside the main loop through refs so
  // the effect NEVER restarts when the run ends or is paused (restarting would
  // tear down and rebuild the whole canvas loop + tick state).
  const gameOverRef = useRef(!!gameOver);
  useEffect(() => {
    gameOverRef.current = !!gameOver;
  }, [gameOver]);
  const pausedRef = useRef(!!paused);
  useEffect(() => {
    pausedRef.current = !!paused;
  }, [paused]);
  // RAFT-603: `initialState` is one-time hydration only; keep it in a ref so the
  // loop effect doesn't restart if the parent hands over a new object identity.
  const initialStateRef = useRef(initialState);

  // RAFT-201/202: the build grid is the single source of truth for placed
  // structures. Hydrated from the save — or migrated from a pre-grid save's
  // flat wall/roof/floor counts (Phase 2 migration) — or empty on a fresh run.
  const buildGridRef = useRef<BuildGrid>(
    initialState?.buildGrid && initialState.buildGrid.length
      ? fromStored(initialState.buildGrid)
      : initialState && (initialState.walls || initialState.roofs || initialState.floors)
        ? migrateFlatBuild(
            initialState.walls,
            initialState.roofs,
            initialState.floors,
            Math.max(2, Math.round(RAFT_WIDTH / TILE_SIZE)),
            Math.max(2, Math.round((initialState.raftWidth || BASE_RAFT_HEIGHT) / TILE_SIZE)),
          )
        : EMPTY_GRID,
  );
  // Live build-mode selection shared with the render pass.
  const buildModeRef = useRef<{
    active: boolean;
    kind: StructureKind;
    material: MaterialTier;
    rot: number;
    col: number;
    row: number;
    valid: boolean;
  }>({
    active: false,
    kind: 'wall',
    material: 'wood',
    rot: 0,
    col: 0,
    row: 0,
    valid: false,
  });

  useEffect(() => {
    raftRef.current.height = raftWidth;
    raftRef.current.x = 400 - RAFT_WIDTH / 2;
  }, [raftWidth]);

  // Mirror tool/structure props into the store for the imperative loop.
  useEffect(() => {
    gameStore.walls = walls;
    gameStore.roofs = roofs;
    gameStore.floors = floors;
    gameStore.hasRod = hasRod;
    gameStore.hasSpear = hasSpear;
    gameStore.hasHammer = hasHammer;
    gameStore.hasCampfire = hasCampfire;
    gameStore.hasRainBarrel = hasRainBarrel;
  }, [walls, roofs, floors, hasRod, hasSpear, hasHammer, hasCampfire, hasRainBarrel]);

  // Water waves ambient sound
  useEffect(() => {
    const startWaveSound = () => startWaveSoundImpl(audioCtxRef, waveSoundRef);

    startWaveSound();
    window.addEventListener('click', startWaveSound);
    window.addEventListener('keydown', startWaveSound);

    return () => {
      window.removeEventListener('click', startWaveSound);
      window.removeEventListener('keydown', startWaveSound);
      if (waveSoundRef.current) {
        try {
          waveSoundRef.current.noiseSource.stop();
          waveSoundRef.current.lfo.stop();
        } catch {}
        waveSoundRef.current = null;
      }
    };
  }, []);

  // ===== SOUND EFFECTS (all Web Audio API) =====
  const playFootstepSound = useCallback(() => playFootstepSoundImpl(audioCtxRef), []);

  const playChopSound = useCallback(() => playChopSoundImpl(audioCtxRef), []);

  // RAFT-108: distinct impact SFX played only when an attack connects.
  const playHitSound = useCallback(() => playHitSoundImpl(audioCtxRef), []);

  const playCraftSound = useCallback(() => playCraftSoundImpl(audioCtxRef), []);

  const playEatSound = useCallback(() => playEatSoundImpl(audioCtxRef), []);

  // ===== ACHIEVEMENT TRACKING =====
  const loadAchStats = useCallback((): AchievementStats => {
    if (typeof window === 'undefined') return { ...DEFAULT_ACH_STATS };
    const saved = localStorage.getItem('raftAchStats');
    if (saved) {
      try {
        return normalizeAchStats(JSON.parse(saved));
      } catch {
        return { ...DEFAULT_ACH_STATS };
      }
    }
    return { ...DEFAULT_ACH_STATS };
  }, []);
  const saveAchStats = useCallback((s: AchievementStats) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('raftAchStats', JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, []);
  // RAFT-004: single entry point for tracking a counter stat.
  const bumpAch = useCallback(
    (key: keyof AchievementStats, delta = 1) => {
      saveAchStats(bumpAchStats(loadAchStats(), key, delta));
    },
    [loadAchStats, saveAchStats],
  );
  const loadUnlockedAchievements = useCallback((): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('raftAchievements') || '[]');
    } catch {
      return [];
    }
  }, []);
  // Pure-derived check: takes elapsed frames + difficulty + elapsed ms so it
  // never depends on the game-loop closure scope.
  const checkAchievements = useCallback(
    (elapsedFrames: number, difficulty: AchDifficulty, elapsedMs: number) => {
      if (typeof window === 'undefined') return;
      const synced = syncAchStats(loadAchStats(), {
        elapsedFrames,
        hunger: statsRef.current.hunger,
        thirst: statsRef.current.thirst,
        raftHealth: statsRef.current.raftHealth,
        difficulty,
        elapsedMs,
      });
      const unlockedList = loadUnlockedAchievements();
      const newlyUnlocked = findNewlyUnlocked(synced, unlockedList);
      newlyUnlocked.forEach((a) => {
        unlockedList.push(a.id);
        window.dispatchEvent(
          new CustomEvent('achievementUnlocked', {
            detail: { emoji: a.emoji, name: a.name, description: a.description },
          }),
        );
      });
      try {
        localStorage.setItem('raftAchievements', JSON.stringify(unlockedList));
      } catch {
        /* ignore */
      }
      saveAchStats(synced);
    },
    [loadAchStats, loadUnlockedAchievements, saveAchStats],
  );
  // Cadence (every ~5s + key events) is driven from inside the main loop.

  const playDamageSound = () => playDamageSoundImpl(audioCtxRef);

  // Handle craft actions after the sound helpers are declared so the
  // craft SFX is in scope. Deducts resources, plays SFX and refreshes HUD.
  useEffect(() => {
    if (!craftAction) return;
    if (craftAction.type === 'REPAIR') {
      // RAFT-205: repair the RAFT (integrity + structure HP), never player HP.
      const needsRepair =
        statsRef.current.raftHealth < MAX_RAFT_HEALTH ||
        buildGridRef.current.tiles.some((t) => t.hp < t.maxHp);
      if (
        needsRepair &&
        statsRef.current.wood >= RAFT_REPAIR_COST.wood &&
        statsRef.current.plastic >= RAFT_REPAIR_COST.plastic
      ) {
        statsRef.current.wood -= RAFT_REPAIR_COST.wood;
        statsRef.current.plastic -= RAFT_REPAIR_COST.plastic;
        statsRef.current.raftHealth = Math.min(
          MAX_RAFT_HEALTH,
          statsRef.current.raftHealth + RAFT_REPAIR_AMOUNT,
        );
        buildGridRef.current = repairAllTiles(buildGridRef.current, RAFT_REPAIR_AMOUNT);
      }
    } else if (craftAction.type === 'EXPAND') {
      // RAFT-207: cost scales with deck size; the deck grows one tile row.
      const expansions = Math.max(
        0,
        Math.round((raftRef.current.height - BASE_RAFT_HEIGHT) / EXPAND_SIZE),
      );
      const woodCost = EXPAND_COST_BASE.wood + EXPAND_COST_STEP.wood * expansions;
      const plasticCost = EXPAND_COST_BASE.plastic + EXPAND_COST_STEP.plastic * expansions;
      if (statsRef.current.wood >= woodCost && statsRef.current.plastic >= plasticCost) {
        statsRef.current.wood -= woodCost;
        statsRef.current.plastic -= plasticCost;
        raftRef.current.height += EXPAND_SIZE;
      }
    } else if (craftAction.type === 'ROD') {
      if (statsRef.current.wood >= 5) {
        statsRef.current.wood -= 5;
      }
    } else if (craftAction.type === 'SPEAR') {
      if (statsRef.current.wood >= 8) {
        statsRef.current.wood -= 8;
      }
    } else if (craftAction.type === 'HAMMER') {
      if (statsRef.current.wood >= 8) {
        statsRef.current.wood -= 8;
      }
    } else if (craftAction.type === 'WALL') {
      if (statsRef.current.wood >= 5) {
        statsRef.current.wood -= 5;
        bumpAch('builtWalls');
      }
    } else if (craftAction.type === 'ROOF') {
      if (statsRef.current.wood >= 3 && statsRef.current.plastic >= 2) {
        statsRef.current.wood -= 3;
        statsRef.current.plastic -= 2;
        bumpAch('builtRoof');
      }
    } else if (craftAction.type === 'FLOOR') {
      if (statsRef.current.wood >= 4) {
        statsRef.current.wood -= 4;
      }
    } else if (craftAction.type === 'RAIN_BARREL') {
      bumpAch('builtBarrel'); // RAFT-004
    } else if (craftAction.type === 'SPEAR_UPGRADE') {
      // RAFT-106: cost is that of the tier being upgraded *to* (the prop has
      // already advanced by the time this effect runs).
      const cost = WEAPON_TIERS[spearTier ?? 'wooden'];
      if (statsRef.current.wood >= cost.wood && statsRef.current.plastic >= cost.plastic) {
        statsRef.current.wood -= cost.wood;
        statsRef.current.plastic -= cost.plastic;
      }
    }
    // RAFT-301: real crafts and spear upgrades are XP sources.
    const CRAFT_XP_TYPES = ['ROD', 'SPEAR', 'HAMMER', 'RAIN_BARREL', 'CAMPFIRE'];
    if (CRAFT_XP_TYPES.includes(craftAction.type)) {
      craftsMadeRef.current += 1;
      onXpGainRef.current?.(XP_REWARDS.craft);
    } else if (craftAction.type === 'SPEAR_UPGRADE') {
      onXpGainRef.current?.(XP_REWARDS.upgrade);
    }
    // Immediately update the HUD with new resource counts
    playCraftSound(); // __craftSoundPlayed
    onStatsUpdate({ ...statsRef.current });
    onCraftComplete();
  }, [craftAction, onCraftComplete, spearTier, bumpAch, onStatsUpdate, playCraftSound]);

  // RAFT-304: apply a one-shot objective reward (resources) then clear it.
  useEffect(() => {
    if (!rewardAction) return;
    if (typeof rewardAction.wood === 'number') statsRef.current.wood += rewardAction.wood;
    if (typeof rewardAction.plastic === 'number') statsRef.current.plastic += rewardAction.plastic;
    onStatsUpdate({ ...statsRef.current });
    onRewardComplete?.();
  }, [rewardAction, onRewardComplete, onStatsUpdate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const player = { x: 380, y: RAFT_CENTER_Y + 20 + 300, width: 40, height: 80 };
    const keys = {
      ArrowLeft: false,
      ArrowRight: false,
      ArrowUp: false,
      ArrowDown: false,
      F: false,
      Space: false,
      H: false,
    };

    // RAFT-503: player-rebindable controls (re-read live when Settings changes them).
    const bindingsRef = { current: loadBindings() };
    const onBindingsChanged = () => {
      bindingsRef.current = loadBindings();
    };
    window.addEventListener('bindingsChanged', onBindingsChanged);

    // RAFT-502: contextual hints — each fires at most once per run.
    const hintsShown = new Set<string>();
    const showHint = (id: string, text: string, duration = 300) => {
      if (hintsShown.has(id)) return;
      hintsShown.add(id);
      gameStore.hint = { text, time: duration };
    };

    // RAFT-504: the on-screen virtual joystick writes into the same key state
    // the keyboard uses, so movement logic stays in one place.
    gameCommands.setMove = (dir, pressed) => {
      if (dir === 'left') keys.ArrowLeft = pressed;
      else if (dir === 'right') keys.ArrowRight = pressed;
      else if (dir === 'up') keys.ArrowUp = pressed;
      else if (dir === 'down') keys.ArrowDown = pressed;
    };

    // RAFT-504: gamepad support — left stick / D-pad move, face buttons attack
    // (A), hook (B) and fish (X). Only writes to `keys` while the pad is active
    // so it never cancels a keyboard-held direction.
    const GP_DEADZONE = 0.3;
    let padWasActive = false;
    const pollGamepad = () => {
      if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
      let active = false;
      for (const pad of navigator.getGamepads()) {
        if (!pad) continue;
        const ax = pad.axes[0] ?? 0;
        const ay = pad.axes[1] ?? 0;
        const left = ax < -GP_DEADZONE || !!pad.buttons[14]?.pressed;
        const right = ax > GP_DEADZONE || !!pad.buttons[15]?.pressed;
        const up = ay < -GP_DEADZONE || !!pad.buttons[12]?.pressed;
        const down = ay > GP_DEADZONE || !!pad.buttons[13]?.pressed;
        const attack = !!pad.buttons[0]?.pressed;
        const hook = !!pad.buttons[1]?.pressed;
        const fish = !!pad.buttons[2]?.pressed;
        if (left || right || up || down || attack || hook || fish) {
          active = true;
          keys.ArrowLeft = left;
          keys.ArrowRight = right;
          keys.ArrowUp = up;
          keys.ArrowDown = down;
          if (attack) keys.Space = true;
          if (hook) keys.H = true;
          if (fish) keys.F = true;
        }
        break;
      }
      if (padWasActive && !active) {
        keys.ArrowLeft = keys.ArrowRight = keys.ArrowUp = keys.ArrowDown = false;
        keys.Space = false;
        keys.H = false;
        keys.F = false;
      }
      padWasActive = active;
    };

    const frogs: Frog[] = [];
    const projectiles: Projectile[] = [];
    const damageNumbers: DamageNumber[] = [];
    const lootDrops: LootPickup[] = [];
    const raindrops: Raindrop[] = [];
    const items: Item[] = [];
    let shark: Shark | null = null;
    const waveStreaks: WaveStreak[] = [];
    const wakeParticles: WakeParticle[] = [];
    const fishes: Fish[] = [];
    const fishFoods: FishFood[] = [];

    // === KEYBOARD HANDLERS ===
    const spawnProjectile = (frog: Frog) => spawnProjectileImpl(projectiles, player, frog);

    const spawnFrog = () => spawnFrogImpl(frogs);

    const BUILD_ORDER: StructureKind[] = [
      'wall',
      'floor',
      'roof',
      'crate',
      'dryingrack',
      'purifier',
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
      // RAFT-503: resolve the press against the player's bindings (+ WASD aliases).
      const action = matchAction(bindingsRef.current, e.key);
      if (action === 'left') keys.ArrowLeft = true;
      if (action === 'right') keys.ArrowRight = true;
      if (action === 'up') keys.ArrowUp = true;
      if (action === 'down') keys.ArrowDown = true;
      if (action === 'fish') keys.F = true;
      if (action === 'attack') keys.Space = true;
      if (action === 'hook') keys.H = true;
      if (e.key === 'F3') {
        e.preventDefault();
        gameStore.debugHitboxes = !gameStore.debugHitboxes;
      } // RAFT-102 debug overlay
      // RAFT-201/202: Build Mode toggle + structure selection.
      if (action === 'build') {
        const mustHaveHammer = gameStore.hasHammer;
        if (mustHaveHammer) buildModeRef.current.active = !buildModeRef.current.active;
      }
      if (buildModeRef.current.active && e.key >= '1' && e.key <= '6') {
        buildModeRef.current.kind = BUILD_ORDER[Number(e.key) - 1];
        buildModeRef.current.rot = 0;
      }
      if (buildModeRef.current.active && e.key.toLowerCase() === 'r') {
        buildModeRef.current.rot = (buildModeRef.current.rot + 90) % 360;
      }
      // RAFT-209: cycle material tier (wood -> reinforced -> metal).
      if (buildModeRef.current.active && e.key.toLowerCase() === 't') {
        const i = MATERIAL_ORDER.indexOf(buildModeRef.current.material);
        buildModeRef.current.material = MATERIAL_ORDER[(i + 1) % MATERIAL_ORDER.length];
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const action = matchAction(bindingsRef.current, e.key);
      if (action === 'left') keys.ArrowLeft = false;
      if (action === 'right') keys.ArrowRight = false;
      if (action === 'up') keys.ArrowUp = false;
      if (action === 'down') keys.ArrowDown = false;
      if (action === 'fish') keys.F = false;
      if (action === 'attack') keys.Space = false;
      if (action === 'hook') keys.H = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let time = initialStateRef.current?.time ?? 0;
    let lastAchCheck = 0;
    let fpsFrameCount = 0;
    let fpsLastCheck = 0;
    let fpsValue = 60;
    let animationFrameId: number;
    let lastStatsUpdate = 0;
    let invulnerabilityTimer = 0;
    let sinkTimer = 0; // RAFT-206
    let lightningTimer = 0;
    let lightningFlash = 0;
    let lightningBolt: { x: number; y: number; life: number } | null = null;
    let isRaining = false;
    let weatherType: 'clear' | 'rain' | 'snow' | 'heat' = 'clear';
    let weatherTimer = 0;
    const snowflakes: { x: number; y: number; size: number; speed: number; drift: number }[] = [];
    let isFoggy = false;
    let fogTimer = 0;
    let fogIntensity = 0;
    let rainTimer = 0;
    let spawnTimer = 0;
    let attackTimer = 0;
    let eatCooldown = 0; // frames until the player can bite another fish
    // SKIN COLORS
    const SKIN_MAP: Record<string, SkinDefinition> = {
      default: { c: '#8B4513', a: '#A0522D' },
      dark: { c: '#3E2723', a: '#5D4037' },
      bamboo: { c: '#F9A825', a: '#FBC02D' },
      ice: { c: '#B3E5FC', a: '#E1F5FE' },
      lava: { c: '#BF360C', a: '#E64A19' },
      gold: { c: '#FFD700', a: '#FFF176' },
      neon: { c: '#9C27B0', a: '#E040FB' },
      dragon: { c: '#1B5E20', a: '#4CAF50' },
    };
    let activeSkin = 'default';
    try {
      const s = localStorage.getItem('raftSelectedSkin');
      if (s && SKIN_MAP[s]) activeSkin = s;
    } catch {}
    let kraken: Kraken | null = null;
    let krakenTimer = 0;
    let cookedFish = initialStateRef.current?.cookedFish ?? 0;
    let driedFish = initialStateRef.current?.driedFish ?? 0; // RAFT-405
    let cookingTimer = 0;
    let barrelWater = initialStateRef.current?.barrelWater ?? 0; // 0-100 — how much water is in the rain barrel
    gameStore.barrelWater = barrelWater;

    // RAFT-304/305/306: monotonic run counters feeding objectives, exploration
    // and the win condition.
    let kills = 0;
    let islandsFound = 0;
    let structuresBuilt = 0;
    let islandTimer = 0;
    let chestTimer = 0;
    let victoryFired = false;
    // RAFT-304: cumulative gathering counters for the objective chain.
    let woodGathered = 0;
    let fishCaught = 0;

    // === DIFFICULTY SETTINGS (RAFT-406: values live in balance.ts) ===
    const getDifficulty = (): DifficultyKey => {
      if (typeof window === 'undefined') return 'normal';
      const stored = localStorage.getItem('raftSettings');
      if (stored) {
        try {
          const d = JSON.parse(stored).difficulty;
          if (d === 'easy' || d === 'normal' || d === 'hard') return d;
        } catch {
          return 'normal';
        }
      }
      return 'normal';
    };
    const diff = getDifficulty();

    // Difficulty multipliers sourced from the single central config.
    const DIFF = DIFFICULTY[diff];

    // RAFT-402: local-only cause-of-death telemetry. Never leaves the browser;
    // read back by the dev tuning panel / playtests to tune the balance curves.
    const describeDeath = (): DeathCause => {
      if (isInWater) return 'drowned';
      if (statsRef.current.raftHealth <= 0) return 'sank';
      if (statsRef.current.hunger <= 0) return 'starved';
      if (statsRef.current.thirst <= 0) return 'dehydrated';
      return 'killed';
    };
    const logDeath = () => {
      if (typeof window === 'undefined') return;
      try {
        const raw = localStorage.getItem('raftDeathLog');
        const arr: { cause: DeathCause; day: number; at: number }[] = raw ? JSON.parse(raw) : [];
        arr.push({ cause: describeDeath(), day: statsRef.current.day, at: Date.now() });
        while (arr.length > DEATH_LOG_LIMIT) arr.shift();
        localStorage.setItem('raftDeathLog', JSON.stringify(arr));
      } catch {
        /* storage disabled — never crash the game */
      }
    };
    const islands: Island[] = [];
    const chests: TreasureChest[] = [];
    const clouds: {
      x: number;
      y: number;
      size: number;
      speed: number;
      alpha: number;
      vx?: number;
      vy?: number;
    }[] = [];
    const splashParticles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      size: number;
    }[] = [];
    const raftPuddles: { x: number; y: number; size: number; age: number }[] = [];

    let damageFlash = 0;
    let damageCooldown = 0;
    let prevHealth = statsRef.current.health;

    let walkCycle = 0;
    let isWalking = false;

    let darkness = 0;
    let isInWater = false;

    let startupRiseOffset = 300;
    let raftBobY = 0;
    let raftBobX = 0;
    let raftTilt = 0;
    let lastRaftY = RAFT_CENTER_Y;
    let lastRaftX = 400 - RAFT_WIDTH / 2;
    let playerIsOnRaft = false;

    let fishingState: 'idle' | 'casting' | 'waiting' | 'caught' = 'idle';
    // === HOOK STATE ===
    let hookState: 'idle' | 'throwing' | 'pulling' | 'returning' = 'idle';
    let hookX = 0;
    let hookY = 0;
    let hookThrowProgress = 0;
    let hookCooldown = 0;
    let hookTargetItem: Item | null = null;
    let fishingTimer = 0;
    let bobberX = 0;
    let bobberY = 0;

    for (let i = 0; i < 60; i++)
      snowflakes.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        size: 1 + Math.random() * 3,
        speed: 0.5 + Math.random() * 1.2,
        drift: (Math.random() - 0.5) * 0.5,
      });
    for (let i = 0; i < 100; i++)
      raindrops.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        length: 10 + Math.random() * 20,
        speed: 10 + Math.random() * 10,
      });

    const createWaveStreak = (yStart: number | null = null): WaveStreak => ({
      x: Math.random() * 800,
      y: yStart !== null ? yStart : 600 + Math.random() * 200,
      length: 50 + Math.random() * 100,
      width: 3 + Math.random() * 6,
      speed: -(WORLD_SCROLL_SPEED + Math.random() * 1.5),
      alpha: 0.25 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
    });

    for (let i = 0; i < 30; i++) waveStreaks.push(createWaveStreak());

    // No clouds at start — they appear only when it rains

    // === INITIAL FISH BURST (so fish appear immediately on game start) ===
    // Initial fish food burst
    for (let i = 0; i < 10; i++) {
      const colors = ['#E74C3C', '#F39C12', '#27AE60', '#9B59B6', '#F1C40F'];
      fishFoods.push({
        x: 40 + Math.random() * 720,
        y: 100 + Math.random() * 500,
        vy: -(0.15 + Math.random() * 0.25),
        size: 3 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        spawnTime: 0,
      });
    }

    for (let i = 0; i < 6; i++) {
      const colors = ['#F39C12', '#E74C3C', '#3498DB', '#27AE60', '#9B59B6', '#E67E22'];
      const baseSpeed = 1.0 + Math.random() * 0.8;
      const svx = (Math.random() - 0.5) * 2 * baseSpeed;
      const svy = (Math.random() - 0.5) * 2 * baseSpeed;
      fishes.push({
        x: 100 + Math.random() * 600,
        y: 100 + Math.random() * 400,
        vx: svx,
        vy: svy,
        width: 28 + Math.random() * 14,
        height: 15 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        tailPhase: Math.random() * Math.PI * 2,
        facingRight: svx > 0,
        state: 'swimming',
        bitesLeft: 3,
        attachSide: 1,
        sizeCategory: 'medium',
        mouthOpen: 0,
        eatingCooldown: 0,
        targetFoodIndex: -1,
        restTimer: 0,
        attachFacing: 0,
        graceTimer: 0,
        offsetX: 0,
        offsetY: 0,
        hasAttached: false,
        isGolden: Math.random() < 0.06,
        wanderAngle: Math.random() * Math.PI * 2,
        wanderTimer: 0,
      });
    }

    const spawnIsland = () => spawnIslandImpl(islands);

    const spawnChest = () => spawnChestImpl(chests);

    const spawnFishFood = () => spawnFishFoodImpl(fishFoods);

    const spawnFish = () => spawnFishImpl(fishes);

    // RAFT-403: some debris spawns as "rare" loot in the side lanes, outside the
    // raft's column. It can never be auto-collected — only the hook can reach it
    // — and it pays a bonus of both wood and plastic on collection.
    const spawnItem = () => spawnItemImpl(items);

    const spawnShark = () => {
      shark = spawnSharkImpl(statsRef);
    };

    const getRaftScreenY = () => RAFT_CENTER_Y + raftBobY + Math.max(0, startupRiseOffset);

    // Expose eat function to parent — React state can't touch statsRef directly
    if (typeof window !== 'undefined') {
      gameCommands.eatRawFish = () => {
        debug('eat raw', statsRef.current.fish);
        if (statsRef.current.fish > 0) {
          statsRef.current.fish -= 1;
          statsRef.current.hunger = Math.min(100, statsRef.current.hunger + FOOD_TIERS.raw.hunger); // RAFT-405
          statsRef.current.health = applyHeal(
            statsRef.current.health,
            FOOD_TIERS.raw.health,
            MAX_HEALTH,
          );
          bumpAch('totalFishEaten'); // RAFT-004
          playEatSound();
          onStatsUpdate(statsPayload());
        }
      };
      gameCommands.drinkWater = () => {
        if (barrelWater >= WATER_BARREL_COST && statsRef.current.thirst < 100) {
          barrelWater -= WATER_BARREL_COST;
          statsRef.current.thirst = Math.min(100, statsRef.current.thirst + WATER_THIRST_RESTORE);
          gameStore.barrelWater = barrelWater;
          onStatsUpdate(statsPayload());
        }
      };
      gameCommands.cookFish = () => {
        const hasFire = gameStore.hasCampfire;
        if (hasFire && statsRef.current.fish > 0 && cookingTimer <= 0) {
          statsRef.current.fish -= 1;
          cookedFish += 1;
          cookingTimer = 180;
          onStatsUpdate(statsPayload());
        }
      };
      gameCommands.eatCookedFish = () => {
        if (cookedFish > 0) {
          cookedFish -= 1;
          statsRef.current.hunger = Math.min(
            100,
            statsRef.current.hunger + FOOD_TIERS.cooked.hunger,
          );
          statsRef.current.health = applyHeal(
            statsRef.current.health,
            FOOD_TIERS.cooked.health,
            MAX_HEALTH,
          );
          bumpAch('totalFishEaten');
          onStatsUpdate(statsPayload());
        }
      };
      // RAFT-405: dried fish (drying rack output) is the best food tier.
      gameCommands.eatDriedFish = () => {
        if (driedFish > 0) {
          driedFish -= 1;
          statsRef.current.hunger = Math.min(
            100,
            statsRef.current.hunger + FOOD_TIERS.dried.hunger,
          );
          statsRef.current.health = applyHeal(
            statsRef.current.health,
            FOOD_TIERS.dried.health,
            MAX_HEALTH,
          );
          bumpAch('totalFishEaten');
          playEatSound();
          onStatsUpdate(statsPayload());
        }
      };
    }

    // RAFT-006/007: live snapshot the page reads to save/autosave the run.
    const writeSnapshot = () => {
      if (!snapshotStore || typeof window === 'undefined') return;
      snapshotStore.current = {
        version: SAVE_VERSION,
        savedAt: Date.now(),
        time,
        health: statsRef.current.health,
        hunger: statsRef.current.hunger,
        thirst: statsRef.current.thirst,
        fish: statsRef.current.fish,
        cookedFish,
        driedFish,
        day: statsRef.current.day,
        wood: statsRef.current.wood,
        plastic: statsRef.current.plastic,
        raftHealth: statsRef.current.raftHealth,
        raftWidth: raftRef.current.height,
        hasRod: gameStore.hasRod ?? false,
        hasSpear: gameStore.hasSpear ?? false,
        hasHammer: gameStore.hasHammer ?? false,
        hasRainBarrel: gameStore.hasRainBarrel ?? false,
        hasCampfire: gameStore.hasCampfire ?? false,
        walls: gameStore.walls ?? 0,
        roofs: gameStore.roofs ?? 0,
        floors: gameStore.floors ?? 0,
        barrelWater,
        spearTier: spearTierRef.current,
        buildGrid: toStored(buildGridRef.current),
        progression: progressionRef.current,
        perkRanks: perkRanksRef.current,
        objectiveIndex: objectiveIndexRef.current,
      };
    };

    // RAFT-201..209: grid <-> world helpers, build-mode mouse handling.
    // RAFT-601: these now delegate to lib/systems/build.ts + lib/systems/loot.ts so
    // the component only holds wiring, not the logic.
    const runCounters: RunCounters = {
      get cookedFish() {
        return cookedFish;
      },
      get driedFish() {
        return driedFish;
      },
      get kills() {
        return kills;
      },
      get islandsFound() {
        return islandsFound;
      },
      get structuresBuilt() {
        return structuresBuilt;
      },
      get woodGathered() {
        return woodGathered;
      },
      get fishCaught() {
        return fishCaught;
      },
      addStructuresBuilt: (n) => {
        structuresBuilt += n;
      },
      addKills: (n) => {
        kills += n;
      },
      addWoodGathered: (n) => {
        woodGathered += n;
      },
      addFishCaught: (n) => {
        fishCaught += n;
      },
    };

    // RAFT-103/301: XP sink — routed straight into the page-owned progression
    // through the onXpGainRef callback (no bridge globals).
    const onXp = (amount: number) => {
      if (onXpGainRef.current) {
        onXpGainRef.current(amount);
        return;
      }
      if (gameStore.debugHitboxes) debug('[XP] +' + amount);
    };

    const buildDeps: BuildDeps = {
      raftRef,
      buildGridRef,
      buildModeRef,
      perkRef,
      statsRef,
      canvasRef,
      craftsMadeRef,
      counters: runCounters,
      getRaftScreenY,
      onStatsUpdate,
      bumpAch,
      onXp,
      playChopSound,
    };

    const statsPayload = () => statsPayloadImpl(buildDeps);
    const worldToCell = (wx: number, wy: number) => worldToCellImpl(buildDeps, wx, wy);
    const cellToWorld = (col: number, row: number) => cellToWorldImpl(buildDeps, col, row);
    const cellAction = (col: number, row: number) => cellActionImpl(buildDeps, col, row);
    const tryPlace = (col: number, row: number) => tryPlaceImpl(buildDeps, col, row);
    const tryRemove = (col: number, row: number) => tryRemoveImpl(buildDeps, col, row);
    const toCanvasCoords = (clientX: number, clientY: number) =>
      toCanvasCoordsImpl(buildDeps, clientX, clientY);

    const lootDeps: LootDeps = {
      statsRef,
      buildGridRef,
      damageNumbers,
      lootDrops,
      items,
      player,
      counters: runCounters,
      onXp,
      bumpAch,
      refreshStats: () => onStatsUpdate(statsPayload()),
    };
    const spawnDamageNumber = (x: number, y: number, value: number, color = '#FFD166') =>
      spawnDamageNumberImpl(damageNumbers, x, y, value, color);
    const grantKillRewards = (enemy: 'frog' | 'shark' | 'kraken', x: number, y: number) =>
      grantKillRewardsImpl(lootDeps, enemy, x, y);
    const intactWalls = () => intactWallsImpl(buildGridRef);
    const fishYield = (f: Fish) => fishYieldImpl(f);
    const yieldFish = (f: Fish) => yieldFishImpl(lootDeps, f);
    const grantHookedItem = (it: Item) => grantHookedItemImpl(lootDeps, it);
    const findHookTarget = () => findHookTargetImpl(lootDeps);

    const handleMouseMove = (e: MouseEvent) => {
      if (!buildModeRef.current.active) return;
      const p = toCanvasCoords(e.clientX, e.clientY);
      const c = worldToCell(p.x, p.y);
      buildModeRef.current.col = c.col;
      buildModeRef.current.row = c.row;
      buildModeRef.current.valid = cellAction(c.col, c.row) !== 'invalid';
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (!buildModeRef.current.active) return;
      // Ignore clicks that land on HUD/menu overlays — only the canvas places.
      if (e.target !== canvasRef.current) return;
      const p = toCanvasCoords(e.clientX, e.clientY);
      const c = worldToCell(p.x, p.y);
      if (e.button === 2) tryRemove(c.col, c.row);
      else tryPlace(c.col, c.row);
    };
    const handleContextMenu = (e: MouseEvent) => {
      if (buildModeRef.current.active) e.preventDefault();
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('contextmenu', handleContextMenu);

    const update = () => {
      if (gameOverRef.current || pausedRef.current) return;
      // ===== CLOUDS =====
      if (isRaining && !gameStore.wasRaining) {
        gameStore.wasRaining = true;
        for (let cc = 0; cc < 6; cc++) {
          const fromLeft = cc % 2 === 0;
          clouds.push({
            x: fromLeft ? -140 - Math.random() * 60 : 900 + Math.random() * 60,
            y: 35 + Math.random() * 90,
            size: 38,
            speed: fromLeft ? 0.55 : -0.55,
            alpha: 0,
            vx: fromLeft ? 0.55 : -0.55,
            vy: 0,
          });
        }
      }
      if (!isRaining && gameStore.wasRaining) {
        gameStore.wasRaining = false;
      }
      if (isRaining && clouds.length < 8 && time % 90 === 0) {
        const fromLeft = Math.random() < 0.5;
        clouds.push({
          x: fromLeft ? -140 - Math.random() * 60 : 900 + Math.random() * 60,
          y: 35 + Math.random() * 90,
          size: 38,
          speed: fromLeft ? 0.55 : -0.55,
          alpha: 0,
          vx: fromLeft ? 0.55 : -0.55,
          vy: 0,
        });
      }
      for (let ci = clouds.length - 1; ci >= 0; ci--) {
        const c = clouds[ci];
        if (c.vx === undefined) c.vx = c.speed;
        if (c.vy === undefined) c.vy = 0;
        c.x += c.vx;
        if (isRaining) {
          c.y += c.vy;
          c.alpha = Math.min(0.8, c.alpha + 0.012);
        } else {
          c.vy = -0.6;
          c.y += c.vy;
          c.alpha -= 0.005;
        }
        if (c.x > 1100 || c.x < -300 || c.y < -150 || c.alpha <= 0) clouds.splice(ci, 1);
      }
      // ===== END CLOUDS =====

      time += 1;
      writeSnapshot();
      // RAFT-002/003: achievement checks run every ~5s (300 frames) plus on key events.
      if (time - lastAchCheck >= 300) {
        checkAchievements(time, diff, (time - lastAchCheck) * MS_PER_FRAME);
        lastAchCheck = time;
      }
      fpsFrameCount++;
      if (time - fpsLastCheck >= 30) {
        fpsValue = Math.round((fpsFrameCount * 60) / (time - fpsLastCheck));
        fpsFrameCount = 0;
        fpsLastCheck = time;
      }
      if (startupRiseOffset > 0) startupRiseOffset -= 2.5;

      const dayProgress = (time % DAY_LENGTH) / DAY_LENGTH;
      if (dayProgress < 0.35) {
        darkness = 0;
      } else if (dayProgress < 0.5) {
        const dt1 = (dayProgress - 0.35) / 0.15;
        darkness = dt1 * dt1 * dt1;
      } else if (dayProgress < 0.85) {
        darkness = 1;
      } else {
        const dt2 = (dayProgress - 0.85) / 0.15;
        darkness = 1 - dt2 * dt2 * dt2;
      }
      statsRef.current.day = Math.floor(time / DAY_LENGTH) + 1;

      raftBobY = Math.sin(time * 0.04) * 4;
      raftBobX = Math.cos(time * 0.025) * 2;
      raftTilt = Math.sin(time * 0.035) * 0.03;

      const raftScreenY = getRaftScreenY();
      const raftDeltaY = raftScreenY - lastRaftY;
      const raftScreenX = raftRef.current.x + raftBobX;
      const raftDeltaX = raftScreenX - lastRaftX;

      // RAFT-402: difficulty + weather + perks + per-day pressure drive the
      // hunger/thirst drain. Rates come from the central balance config and the
      // mutable TUNABLE surface (dev tuning panel) so playtests can re-tune live.
      // RAFT-203: an intact roof shelters the deck and negates weather strain.
      // RAFT-302: Survivor perks slow the hunger/thirst drain; Fighter "Vigor"
      // raises the health cap (maxHealth below).
      const sheltered = hasShelter(buildGridRef.current);
      const maxHealth = MAX_HEALTH + perkRef.current.maxHealthBonus;
      const hungerWeather = sheltered
        ? 1
        : weatherType === 'snow'
          ? WEATHER_SNOW_HUNGER
          : weatherType === 'rain'
            ? WEATHER_RAIN_DRAIN
            : 1;
      const thirstWeather = sheltered
        ? 1
        : weatherType === 'heat'
          ? WEATHER_HEAT_THIRST
          : weatherType === 'rain'
            ? WEATHER_RAIN_DRAIN
            : 1;
      const dayPressure = Math.min(
        DAY_PRESSURE_MAX,
        1 + (statsRef.current.day - 1) * DAY_PRESSURE_STEP,
      );
      statsRef.current.hunger -=
        TUNABLE.hungerDrain *
        DIFF.hungerRate *
        hungerWeather *
        perkRef.current.hungerMult *
        dayPressure;
      if (statsRef.current.hunger < 0) statsRef.current.hunger = 0;
      statsRef.current.thirst -=
        TUNABLE.thirstDrain *
        DIFF.thirstRate *
        thirstWeather *
        perkRef.current.thirstMult *
        dayPressure;
      if (statsRef.current.thirst < 0) statsRef.current.thirst = 0;
      if (statsRef.current.thirst === 0) {
        statsRef.current.health = applyDamage(
          statsRef.current.health,
          TUNABLE.starveDamage * DIFF.damageMult,
        );
      }
      if (isRaining && gameStore.hasRainBarrel && barrelWater < 100) {
        barrelWater = Math.min(100, barrelWater + 0.05);
        gameStore.barrelWater = barrelWater;
      }
      // RAFT-208: water purifier slowly produces clean water.
      if (
        countKind(buildGridRef.current, 'purifier') > 0 &&
        barrelWater < 100 &&
        time % PURIFIER_PERIOD === 0
      ) {
        barrelWater = Math.min(100, barrelWater + 1);
        gameStore.barrelWater = barrelWater;
      }
      // RAFT-405: fish drying rack cures a raw fish into a dried fish over time.
      if (
        countKind(buildGridRef.current, 'dryingrack') > 0 &&
        statsRef.current.fish > 0 &&
        time % DRYING_RACK_PERIOD === 0
      ) {
        statsRef.current.fish -= 1;
        driedFish += 1;
      }
      // RAFT-208: storage crates raise the wood/plastic cap.
      const storageCap =
        STORAGE_CAP_BASE + countKind(buildGridRef.current, 'crate') * CRATE_CAPACITY;
      if (statsRef.current.wood > storageCap) statsRef.current.wood = storageCap;
      if (statsRef.current.plastic > storageCap) statsRef.current.plastic = storageCap;
      if (statsRef.current.hunger === 0) {
        statsRef.current.health = applyDamage(
          statsRef.current.health,
          TUNABLE.starveDamage * DIFF.damageMult,
        );
      }

      if (statsRef.current.health < prevHealth - 0.05 && damageCooldown <= 0) {
        damageFlash = 30;
        damageCooldown = 60;
        playDamageSound();
      }
      prevHealth = statsRef.current.health;

      if (damageFlash > 0) damageFlash--;
      if (damageCooldown > 0) damageCooldown--;

      if (statsRef.current.health <= 0) {
        logDeath();
        onGameOver();
        return;
      }

      // ===== THREAT SCALING (RAFT-104) =====
      // Day-based multipliers feed every spawn / HP / damage decision below.
      const day = statsRef.current.day;
      const scale = threatScale(day);
      const enemyDamageMult = DIFF.damageMult * scale.damageMult;
      // Keep the HUD bridge counts in sync with the grid (no React setState here).
      if (typeof window !== 'undefined') {
        const g = buildGridRef.current;
        gameStore.walls = countKind(g, 'wall');
        gameStore.roofs = countKind(g, 'roof');
        gameStore.floors = countKind(g, 'floor');
      }
      // RAFT-203: an intact roof shelters the deck — small passive health regen.
      // RAFT-302: Survivor "Resilience" / Builder "Shelter" add flat regen.
      if (sheltered) {
        statsRef.current.health = applyHeal(
          statsRef.current.health,
          ROOF_REGEN_BONUS + perkRef.current.regenBonus,
          maxHealth,
        );
      }

      // RAFT-308: a storm (rain) batters an unsheltered raft; a roof mitigates.
      if (isRaining && !sheltered && statsRef.current.raftHealth > 0) {
        statsRef.current.raftHealth = Math.max(0, statsRef.current.raftHealth - STORM_RAFT_DAMAGE);
      }

      // RAFT-206: raft integrity at 0 starts a sinking sequence — warning, then
      // structures are torn off one by one, then game over.
      if (statsRef.current.raftHealth <= 0) {
        sinkTimer++;
        if (sinkTimer === 1) gameStore.chestMessage = { text: 'THE RAFT IS SINKING!', time: 300 };
        if (sinkTimer > SINK_WARNING_FRAMES && sinkTimer % SINK_TILE_LOSS_INTERVAL === 0) {
          const tiles = buildGridRef.current.tiles;
          if (tiles.length > 0) {
            buildGridRef.current = {
              tiles: tiles.slice(0, -1),
              nextId: buildGridRef.current.nextId,
            };
          }
        }
        if (sinkTimer > SINK_WARNING_FRAMES + SINK_TILE_LOSS_INTERVAL * 8) {
          logDeath();
          onGameOver();
          return;
        }
      } else {
        sinkTimer = 0;
      }

      // KRAKEN UPDATE
      krakenTimer++;
      if (
        !kraken &&
        isEnemyUnlocked('kraken', day) &&
        krakenTimer > KRAKEN_SPAWN_AFTER_FRAMES &&
        Math.random() < KRAKEN_SPAWN_CHANCE * scale.spawnMult
      ) {
        krakenTimer = 0;
        kraken = {
          x: raftRef.current.x + raftRef.current.width / 2,
          y: raftScreenY + 300,
          hp: Math.round(KRAKEN_MAX_HP * scale.hpMult),
          maxHp: Math.round(KRAKEN_MAX_HP * scale.hpMult),
          state: 'rising',
          timer: 0,
          hitFlash: 0,
        };
      }
      if (kraken) {
        kraken.timer++;
        if (kraken.hitFlash > 0) kraken.hitFlash--;
        if (kraken.state === 'rising') {
          kraken.y -= 1.2;
          if (kraken.timer > 60) {
            kraken.state = 'attacking';
            kraken.timer = 0;
          }
        } else if (kraken.state === 'attacking') {
          if (kraken.timer % KRAKEN_BITE_INTERVAL === 0) {
            statsRef.current.health = applyDamage(
              statsRef.current.health,
              KRAKEN_BITE_DAMAGE * enemyDamageMult,
            );
          }
          if (kraken.timer > 600) {
            kraken.state = 'dying';
            kraken.timer = 0;
          }
        } else if (kraken.state === 'dying') {
          kraken.y += 1.5;
          if (kraken.timer > 90) kraken = null;
        }
      }

      if (time % 1200 === 0 && !isFoggy && Math.random() < 0) {
        isFoggy = true;
        fogTimer = 800 + Math.random() * 600;
      }
      if (isFoggy) {
        fogIntensity = Math.min(0.02, fogIntensity + 0.004);
        fogTimer--;
        if (fogTimer <= 0) isFoggy = false;
      } else {
        fogIntensity = Math.max(0, fogIntensity - 0.005);
      }
      rainTimer++;
      // WEATHER CYCLE
      weatherTimer++;
      if (weatherTimer > 1200 && weatherType === 'clear') {
        const wRoll = Math.random();
        if (wRoll < 0.45) {
          weatherType = 'rain';
          isRaining = true;
        } else if (wRoll < 0.75) {
          weatherType = 'snow';
          isRaining = false;
        } else {
          weatherType = 'heat';
          isRaining = false;
        }
        weatherTimer = 0;
      }
      if (weatherType !== 'clear' && weatherTimer > 1800 + Math.random() * 600) {
        weatherType = 'clear';
        isRaining = false;
        weatherTimer = 0;
      }
      isRaining = weatherType === 'rain';
      if (!isRaining && rainTimer > 600 + Math.random() * 600) {
        isRaining = true;
        rainTimer = 0;
      } else if (isRaining && rainTimer > 900 + Math.random() * 600) {
        isRaining = false;
        rainTimer = 0;
      }
      lightningTimer++;
      // ===== CLOUDS =====
      if (isRaining && !gameStore.wasRaining) {
        gameStore.wasRaining = true;
        for (let cc = 0; cc < 8; cc++) {
          const side = cc % 2;
          if (side === 0)
            clouds.push({
              x: -80,
              y: 20 + Math.random() * 90,
              size: 20 + Math.random() * 10,
              speed: 0,
              alpha: 0,
              vx: 0.4 + Math.random() * 0.25,
              vy: 0,
            });
          else if (side === 1)
            clouds.push({
              x: 880,
              y: 20 + Math.random() * 90,
              size: 20 + Math.random() * 10,
              speed: 0,
              alpha: 0,
              vx: -(0.4 + Math.random() * 0.25),
              vy: 0,
            });
          else
            clouds.push({
              x: 100 + Math.random() * 600,
              y: -60,
              size: 20 + Math.random() * 10,
              speed: 0,
              alpha: 0,
              vx: (Math.random() - 0.5) * 0.6,
              vy: 1.5 + Math.random() * 0.8,
            });
        }
      }
      if (!isRaining && gameStore.wasRaining) {
        gameStore.wasRaining = false;
      }
      if (isRaining && clouds.length < 14 && time % 30 === 0) {
        const side = Math.floor(Math.random() * 2);
        if (side === 0)
          clouds.push({
            x: -80,
            y: 20 + Math.random() * 90,
            size: 20 + Math.random() * 10,
            speed: 0,
            alpha: 0,
            vx: 0.4 + Math.random() * 0.25,
            vy: 0,
          });
        else if (side === 1)
          clouds.push({
            x: 880,
            y: 20 + Math.random() * 90,
            size: 20 + Math.random() * 10,
            speed: 0,
            alpha: 0,
            vx: -(0.4 + Math.random() * 0.25),
            vy: 0,
          });
        else
          clouds.push({
            x: 100 + Math.random() * 600,
            y: -60,
            size: 20 + Math.random() * 10,
            speed: 0,
            alpha: 0,
            vx: (Math.random() - 0.5) * 0.6,
            vy: 1.5,
          });
      }
      for (let ci = clouds.length - 1; ci >= 0; ci--) {
        const c = clouds[ci];
        if (c.vx === undefined) c.vx = c.speed;
        if (c.vy === undefined) c.vy = 0;
        c.x += c.vx;
        c.y += c.vy;
        if (isRaining) c.alpha = Math.min(0.85, c.alpha + 0.03);
        else c.alpha -= 0.02;
        if (c.x > 1100 || c.x < -300 || c.y > 700 || c.y < -300 || c.alpha <= 0)
          clouds.splice(ci, 1);
      }
      // ===== END CLOUDS =====
      if (isRaining && lightningTimer > 300 + Math.random() * 300) {
        lightningFlash = 1.0;
        lightningTimer = 0;
        // Spawn a lightning bolt
        lightningBolt = {
          x: 100 + Math.random() * 600,
          y: 0,
          life: 12,
        };
      }
      if (lightningBolt) {
        lightningBolt.life--;
        if (lightningBolt.life <= 0) lightningBolt = null;
      }
      if (lightningFlash > 0) lightningFlash -= 0.05;

      // Wave streaks move UP
      waveStreaks.forEach((streak) => {
        streak.y += streak.speed;
        streak.phase += 0.1;
        if (streak.y < -120) {
          streak.x = Math.random() * 800;
          streak.y = 620 + Math.random() * 100;
          streak.length = 50 + Math.random() * 100;
          streak.width = 3 + Math.random() * 6;
          streak.speed = -(WORLD_SCROLL_SPEED + Math.random() * 1.5);
          streak.alpha = 0.25 + Math.random() * 0.25;
        }
      });

      // === SPAWN WAKE PARTICLES at the raft's sides ===
      // These trail behind (below) the raft to strengthen forward-motion illusion
      const raftX = raftRef.current.x + raftBobX;
      const raftW = raftRef.current.width;
      if (time % 9 === 0) {
        // Left side particle
        wakeParticles.push({
          x: raftX + Math.random() * 8 - 4,
          y:
            raftScreenY +
            raftRef.current.height * 0.6 +
            Math.random() * raftRef.current.height * 0.4,
          size: 3 + Math.random() * 4,
          speed: 0.7 + Math.random() * 0.5,
          alpha: 0.6 + Math.random() * 0.3,
          life: 70,
        });
        // Right side particle
        wakeParticles.push({
          x: raftX + raftW + Math.random() * 8 - 4,
          y:
            raftScreenY +
            raftRef.current.height * 0.6 +
            Math.random() * raftRef.current.height * 0.4,
          size: 3 + Math.random() * 4,
          speed: 0.7 + Math.random() * 0.5,
          alpha: 0.6 + Math.random() * 0.3,
          life: 70,
        });
      }

      // Update wake particles
      for (let i = wakeParticles.length - 1; i >= 0; i--) {
        const p = wakeParticles[i];
        p.y += p.speed;
        p.life--;
        p.alpha *= 0.985;
        // Also shift sideways slightly (spread out from raft)
        if (p.x < raftX + raftW / 2) p.x -= 0.12;
        else p.x += 0.12;
        if (p.life <= 0 || p.y > 620 || p.alpha < 0.05) wakeParticles.splice(i, 1);
      }

      const wasOnRaft = playerIsOnRaft;

      // === HOOK LOGIC (RAFT-403) ===
      // The hook auto-targets the nearest debris within HOOK_REACH and reels it
      // in; debris outside the raft's column can ONLY be collected this way.
      if (hookCooldown > 0) hookCooldown--;

      if (keys.H && hookState === 'idle' && hookCooldown <= 0) {
        hookState = 'throwing';
        hookThrowProgress = 0;
        hookX = player.x + player.width / 2;
        hookY = player.y + player.height / 2;
        hookTargetItem = findHookTarget();
      }

      if (hookState === 'throwing') {
        if (hookTargetItem) {
          const tx = hookTargetItem.x + hookTargetItem.width / 2;
          const ty = hookTargetItem.y + hookTargetItem.height / 2;
          const dx = tx - hookX;
          const dy = ty - hookY;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          if (d <= HOOK_SPEED + 4) {
            hookState = 'pulling';
          } else {
            hookX += (dx / d) * HOOK_SPEED;
            hookY += (dy / d) * HOOK_SPEED;
          }
        } else {
          // No debris in reach — the hook just shoots straight up and returns.
          hookThrowProgress += HOOK_SPEED;
          hookY -= HOOK_SPEED;
          if (hookThrowProgress >= HOOK_REACH) hookState = 'returning';
        }
      }

      if (hookState === 'pulling' && hookTargetItem) {
        const dx = player.x + player.width / 2 - (hookTargetItem.x + hookTargetItem.width / 2);
        const dy = player.y + player.height / 2 - (hookTargetItem.y + hookTargetItem.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 40) {
          grantHookedItem(hookTargetItem);
          const idx = items.indexOf(hookTargetItem);
          if (idx >= 0) items.splice(idx, 1);
          hookTargetItem = null;
          hookState = 'returning';
        } else {
          hookTargetItem.x += (dx / dist) * HOOK_PULL_SPEED;
          hookTargetItem.y += (dy / dist) * HOOK_PULL_SPEED;
          hookX = hookTargetItem.x + hookTargetItem.width / 2;
          hookY = hookTargetItem.y + hookTargetItem.height / 2;
        }
      }

      if (hookState === 'returning') {
        const tx = player.x + player.width / 2;
        const ty = player.y + player.height / 2;
        const dx = tx - hookX;
        const dy = ty - hookY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 15) {
          hookState = 'idle';
          hookCooldown = HOOK_COOLDOWN;
        } else {
          hookX += (dx / dist) * 12;
          hookY += (dy / dist) * 12;
        }
      }

      // Player movement
      isWalking = false;
      if (keys.ArrowLeft) {
        player.x -= 4;
        isWalking = true;
      }
      if (keys.ArrowRight) {
        player.x += 4;
        isWalking = true;
      }
      if (keys.ArrowUp) {
        player.y -= 3;
        isWalking = true;
      }
      if (keys.ArrowDown) {
        player.y += 3;
        isWalking = true;
      }

      if (player.x < 0) player.x = 0;
      if (player.x + player.width > 800) player.x = 800 - player.width;
      if (player.y < 0) player.y = 0;
      if (player.y + player.height > 600) player.y = 600 - player.height;

      if (isWalking) {
        walkCycle += 0.3;
        // Play footstep every 0.4 sec (24 frames at 60fps)
        if (Math.floor(walkCycle * 10) % 4 === 0 && time % 24 === 0) {
          playFootstepSound();
        }
      } else walkCycle = 0;

      const feetX = player.x + player.width / 2;
      const feetY = player.y + player.height;
      const onRaft =
        feetX >= raftRef.current.x - 5 &&
        feetX <= raftRef.current.x + raftRef.current.width + 5 &&
        feetY >= raftScreenY - 10 &&
        feetY <= raftScreenY + raftRef.current.height + 10;
      isInWater = !onRaft;
      playerIsOnRaft = onRaft;

      if (wasOnRaft && onRaft) {
        player.y += raftDeltaY;
        player.x += raftDeltaX;
      }

      lastRaftY = raftScreenY;
      lastRaftX = raftScreenX;

      if (isInWater) {
        // RAFT-402: drowning damage is a central constant (dev-tunable).
        statsRef.current.health = applyDamage(statsRef.current.health, TUNABLE.drownDamage);
      } else {
        // RAFT-402: passive HP regen when well-fed and hydrated (not in water).
        const wellFed = statsRef.current.hunger > 50 && statsRef.current.thirst > 50;
        const regenRate =
          (wellFed ? TUNABLE.regenWellFed : TUNABLE.regenStarving) * DIFF.regenBonus;
        if (statsRef.current.health < maxHealth)
          statsRef.current.health = Math.min(maxHealth, statsRef.current.health + regenRate);
      }

      if (gameStore.hasRod && keys.F && fishingState === 'idle') {
        fishingState = 'casting';
        fishingTimer = 30;
        bobberX = player.x + player.width / 2 + (Math.random() > 0.5 ? 60 : -60);
        bobberY = raftScreenY + raftRef.current.height + 60 + Math.random() * 40;
      }
      if (fishingState === 'casting') {
        fishingTimer--;
        if (fishingTimer <= 0) {
          fishingState = 'waiting';
          fishingTimer = 180 + Math.random() * 120;
        }
      } else if (fishingState === 'waiting') {
        fishingTimer--;
        // Check if any fish swims close to the bobber
        for (let i = fishes.length - 1; i >= 0; i--) {
          const f = fishes[i];
          const fcx = f.x + f.width / 2;
          const fcy = f.y + f.height / 2;
          const dx = fcx - bobberX;
          const dy = fcy - bobberY;
          if (Math.sqrt(dx * dx + dy * dy) < 70) {
            // Fish caught!
            fishes.splice(i, 1);
            fishingState = 'caught';
            break;
          }
        }
        if (fishingTimer <= 0) {
          fishingState = 'idle';
        } // Timeout — no fish
      } else if (fishingState === 'caught') {
        if (keys.F) {
          statsRef.current.fish += 1;
          fishCaught += 1;
          onXp(XP_REWARDS.catchFish);
          fishingState = 'idle';
        }
      }

      if (attackTimer > 0) attackTimer--;
      if (eatCooldown > 0) eatCooldown--;
      if (cookingTimer > 0) cookingTimer--;
      const weapon = WEAPON_TIERS[spearTierRef.current];
      // RAFT-302: Fighter "Might" boosts damage, "Swift" shortens cooldown.
      const spearDamage = weapon.damage * perkRef.current.damageMult;
      if (gameStore.hasSpear && keys.Space && attackTimer === 0) {
        attackTimer = Math.max(1, Math.round(weapon.cooldown * perkRef.current.cooldownMult)); // RAFT-106/302
        playChopSound();
        let hitLanded = false;

        // RAFT-404: spear-fishing — a fish caught in the swing is landed (its
        // size/golden state decides how much food it yields).
        for (let i = fishes.length - 1; i >= 0; i--) {
          const f = fishes[i];
          if (inAttackArc(player, f, SPEAR_REACH)) {
            spawnDamageNumber(f.x + f.width / 2, f.y, fishYield(f), '#7BE0FF');
            yieldFish(f);
            fishes.splice(i, 1);
            hitLanded = true;
          }
        }

        // RAFT-102: one shared 2D attack arc for every melee target. Enemies
        // outside the arc (including off-screen ones) are never hit.
        for (let i = frogs.length - 1; i >= 0; i--) {
          const frog = frogs[i];
          if (inAttackArc(player, frog, SPEAR_REACH)) {
            spawnDamageNumber(frog.x + frog.width / 2, frog.y, spearDamage);
            frogs.splice(i, 1);
            bumpAch('frogsKilled'); // RAFT-004
            grantKillRewards('frog', frog.x + frog.width / 2, frog.y + frog.height / 2);
            hitLanded = true;
          }
        }

        // KRAKEN (RAFT-101: heal is clamped; no more flat health = 100 exploit)
        if (kraken && kraken.state !== 'dying') {
          const kBox = {
            x: kraken.x - KRAKEN_BOX / 2,
            y: kraken.y - KRAKEN_BOX / 2,
            width: KRAKEN_BOX,
            height: KRAKEN_BOX,
          };
          if (inAttackArc(player, kBox, KRAKEN_REACH)) {
            kraken.hp -= spearDamage;
            kraken.hitFlash = 20;
            spawnDamageNumber(kraken.x, kraken.y - 60, spearDamage, '#FF8FD6');
            hitLanded = true;
            if (kraken.hp <= 0) {
              statsRef.current.health = applyHeal(
                statsRef.current.health,
                KRAKEN_HEAL_ON_KILL,
                maxHealth,
              );
              statsRef.current.hunger = Math.min(100, statsRef.current.hunger + 40);
              gameStore.chestMessage = { text: 'KRAKEN DEFEATED!', time: 180 };
              grantKillRewards('kraken', kraken.x, kraken.y);
              kraken.state = 'dying';
              kraken.timer = 0;
            }
          }
        }

        // SHARK
        if (shark && inAttackArc(player, shark, SHARK_REACH)) {
          shark.health -= spearDamage;
          shark.hitFlash = 12;
          spawnDamageNumber(shark.x + shark.width / 2, shark.y, spearDamage);
          hitLanded = true;
          if (shark.health <= 0) {
            grantKillRewards('shark', shark.x + shark.width / 2, shark.y + shark.height / 2);
            bumpAch('sharksDefeated'); // RAFT-004
            shark = null;
          } else {
            shark.state = 'retreating';
            shark.attackTimer = 180;
          }
        }

        if (hitLanded) playHitSound(); // RAFT-108
      }

      // RAFT-502: contextual hints — computed each frame, de-duped by id.
      if (gameStore.hint && gameStore.hint.time > 0) gameStore.hint.time--;
      // RAFT-505: mirror the nearest threat so the HUD can show a warning.
      gameStore.threat = shark ? 'shark' : frogs.length > 0 ? 'frog' : null;
      if (shark && gameStore.hasSpear)
        showHint('attackShark', 'A shark is here — press ATTACK (SPACE)!');
      else if (frogs.length > 0 && gameStore.hasSpear)
        showHint('attackFrog', 'Frogs incoming — press ATTACK (SPACE)!');
      else if (statsRef.current.hunger < 30 && statsRef.current.fish + cookedFish + driedFish > 0)
        showHint('eat', 'You are hungry — tap the 🐟 button to eat.');
      else if (statsRef.current.thirst < 30)
        showHint('drink', 'You are thirsty — drink water (☔ barrel in the rain).');
      else if (items.length > 0 && gameStore.hasHammer)
        showHint('hook', 'Press HOOK (H) to reel in floating debris.');
      else if (fishes.length > 0 && gameStore.hasRod)
        showHint('fish', 'Fish are near — press FISH (F) to cast your line.');
      else if (!gameStore.hasSpear && statsRef.current.wood >= 3)
        showHint('craftSpear', 'Craft a Spear (C) so you can defend yourself.');

      // RAFT-104: sharks only appear from Day 4 and spawn faster as days pass.
      if (
        !shark &&
        isEnemyUnlocked('shark', day) &&
        time > SHARK_SPAWN_AFTER_FRAMES &&
        Math.random() < (SHARK_SPAWN_CHANCE * scale.spawnMult) / DIFF.enemySpawnMult
      ) {
        spawnShark();
      }
      if (shark) {
        shark.tailPhase += 0.2;
        if (shark.hitFlash > 0) shark.hitFlash--;
        if (shark.mouthOpen > 0) shark.mouthOpen--;

        // === SHARK EATS ANY FISH IT TOUCHES ===
        for (let fi = fishes.length - 1; fi >= 0; fi--) {
          const fs = fishes[fi];
          // Shark mouth position
          const sharkDirX = shark.vx >= 0 ? 1 : -1;
          const mouthX = shark.x + shark.width / 2 + sharkDirX * (shark.width / 2);
          const mouthY = shark.y + shark.height / 2;
          const fCX = fs.x + fs.width / 2;
          const fCY = fs.y + fs.height / 2;

          // Large fish need to be closer to be eaten
          const hitRadius =
            fs.sizeCategory === 'large' ? 35 : fs.sizeCategory === 'medium' ? 55 : 70;
          if (Math.abs(fCX - mouthX) < hitRadius && Math.abs(fCY - mouthY) < 45) {
            fishes.splice(fi, 1);
            if (shark) shark.mouthOpen = 30; // open mouth for 30 frames
          }
        }

        const raftCX = raftRef.current.x + raftRef.current.width / 2;
        const raftCY = raftScreenY + raftRef.current.height / 2;
        const sCX = shark.x + shark.width / 2;
        const sCY = shark.y + shark.height / 2;
        const dxT = raftCX - sCX;
        const dyT = raftCY - sCY;
        const distToRaft = Math.sqrt(dxT * dxT + dyT * dyT) || 1;

        if (shark.state === 'wandering') {
          // Steer smoothly toward raft
          const desiredVx = (dxT / distToRaft) * shark.speed;
          const desiredVy = (dyT / distToRaft) * shark.speed;
          shark.vx += (desiredVx - shark.vx) * 0.04;
          shark.vy += (desiredVy - shark.vy) * 0.04;
          shark.x += shark.vx;
          shark.y += shark.vy;

          // === SHARK EATS FISH on contact ===
          for (let fi = fishes.length - 1; fi >= 0; fi--) {
            const fs = fishes[fi];
            if (
              Math.abs(fs.x + fs.width / 2 - sCX) < shark.width / 2 &&
              Math.abs(fs.y + fs.height / 2 - sCY) < shark.height / 2
            ) {
              fishes.splice(fi, 1);
            }
          }

          // Arrived at raft
          if (distToRaft < 120) {
            if (shark.willAttack) {
              shark.state = 'attacking';
              shark.attackTimer = 60;
              shark.mouthOpen = 60;
            } else {
              shark.state = 'passing';
              const ang = Math.random() * Math.PI * 2;
              shark.vx = Math.cos(ang) * shark.speed * 1.3;
              shark.vy = Math.sin(ang) * shark.speed * 1.3;
            }
          }
        } else if (shark.state === 'attacking') {
          shark.vx *= 0.9;
          shark.vy *= 0.9;
          shark.x += shark.vx;
          shark.y += shark.vy;
          shark.attackTimer--;
          if (shark.attackTimer <= 0) {
            // === SHARK BITE (RAFT-105: the middle is no longer 100% safe) ===
            const playerCX = player.x + player.width / 2;
            const sharkCX2 = shark.x + shark.width / 2;
            const sharkCY2 = shark.y + shark.height / 2;
            const distX = Math.abs(sharkCX2 - playerCX);
            const distY = Math.abs(sharkCY2 - (player.y + player.height / 2));
            const euclidDist = Math.sqrt(distX * distX + distY * distY);
            shark.mouthOpen = 40;
            if (euclidDist < 250) {
              for (let sp = 0; sp < 6; sp++)
                wakeParticles.push({
                  x: sharkCX2,
                  y: sharkCY2,
                  size: 2 + Math.random() * 3,
                  speed: -0.5 - Math.random(),
                  alpha: 0.9,
                  life: 30,
                });
              const safeLeft = raftRef.current.x + raftRef.current.width * 0.3;
              const safeRight = raftRef.current.x + raftRef.current.width * 0.7;
              const inSafeMiddle = playerCX >= safeLeft && playerCX <= safeRight;
              if (intactWalls() > 0) {
                // RAFT-204/110: an intact wall absorbs the bite (and loses HP).
                buildGridRef.current = damageFirstOfKind(
                  buildGridRef.current,
                  'wall',
                  SHARK_RAFT_DAMAGE,
                );
              } else if (isInWater || !inSafeMiddle) {
                statsRef.current.health = applyDamage(
                  statsRef.current.health,
                  SHARK_BITE_DAMAGE * enemyDamageMult,
                );
                spawnDamageNumber(
                  playerCX,
                  player.y,
                  Math.round(SHARK_BITE_DAMAGE * enemyDamageMult * 10) / 10,
                  '#FF6B6B',
                );
              } else {
                // Middle still takes chip damage and the raft is chewed.
                statsRef.current.health = applyDamage(
                  statsRef.current.health,
                  SHARK_SAFE_MIDDLE_DAMAGE * enemyDamageMult,
                );
                statsRef.current.raftHealth -= SHARK_RAFT_DAMAGE;
                if (statsRef.current.raftHealth < 0) statsRef.current.raftHealth = 0;
                spawnDamageNumber(
                  playerCX,
                  player.y,
                  Math.round(SHARK_SAFE_MIDDLE_DAMAGE * enemyDamageMult * 10) / 10,
                  '#FFA36B',
                );
              }
            }
            shark.state = 'retreating';
            shark.attackTimer = Math.floor(480 * DIFF.sharkRetreatMult);
            const ang = Math.atan2(sCY - raftCY, sCX - raftCX);
            shark.vx = Math.cos(ang) * shark.speed * 1.5;
            shark.vy = Math.sin(ang) * shark.speed * 1.5;
          }
        } else if (shark.state === 'passing' || shark.state === 'retreating') {
          shark.x += shark.vx;
          shark.y += shark.vy;
          if (shark.state === 'retreating') shark.attackTimer--;
          if (shark.x < -300 || shark.x > 1100 || shark.y < -300 || shark.y > 900) shark = null;
          if (shark && shark.state === 'retreating' && shark.attackTimer <= 0) shark = null;
        }
      }

      // === FISH FOOD: SPAWN + MOVE ===
      if (time % 40 === 0 && fishFoods.length < 12) spawnFishFood();
      if (time % 20 === 0 && fishFoods.length < 15 && Math.random() < 0.7) spawnFishFood();

      for (let fi = fishFoods.length - 1; fi >= 0; fi--) {
        const ff = fishFoods[fi];
        ff.y += ff.vy;
        ff.spawnTime++;
        // Slight wobble
        ff.x += Math.sin(ff.spawnTime * 0.1 + fi) * 0.2;
        // Remove if off top
        if (ff.y < -30) fishFoods.splice(fi, 1);
      }

      // === FISH MOVEMENT (realistic swim + despawn + respawn) ===
      if (time % 180 === 0 && fishes.length < 8) spawnFish();
      if (time % 90 === 0 && fishes.length < 12 && Math.random() < 0.5) spawnFish();

      const raftCX = raftRef.current.x + raftRef.current.width / 2;
      const raftTopY = raftScreenY;
      const raftBottomY = raftScreenY + raftRef.current.height;

      for (let i = fishes.length - 1; i >= 0; i--) {
        const f = fishes[i];
        f.tailPhase += 0.22;

        if (f.mouthOpen > 0) f.mouthOpen--;
        if (f.eatingCooldown > 0) f.eatingCooldown--;
        if (f.graceTimer > 0) f.graceTimer--;

        if (f.state === 'swimming' || f.state === 'fleeing') {
          // === SEEK NEARBY FISH FOOD ===
          let closestFood = -1;
          let closestDist = 150;
          for (let fi = 0; fi < fishFoods.length; fi++) {
            const ff = fishFoods[fi];
            const dx = ff.x - (f.x + f.width / 2);
            const dy = ff.y - (f.y + f.height / 2);
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < closestDist) {
              closestDist = d;
              closestFood = fi;
            }
          }

          if (closestFood >= 0 && f.eatingCooldown <= 0) {
            const ff = fishFoods[closestFood];
            const dx = ff.x - (f.x + f.width / 2);
            const dy = ff.y - (f.y + f.height / 2);
            const d = Math.sqrt(dx * dx + dy * dy) || 1;
            // Swim toward food
            f.vx += (dx / d) * 0.15;
            f.vy += (dy / d) * 0.15;

            // If close enough, EAT
            if (d < 20) {
              fishFoods.splice(closestFood, 1);
              f.mouthOpen = 20;
              f.eatingCooldown = 60;
              // Stop moving while eating
              f.vx *= 0.3;
              f.vy *= 0.3;
            }
          }

          // === SHARK FLEE DETECTION ===
          let fleeing = false;
          if (shark) {
            const sCX = shark.x + shark.width / 2;
            const sCY = shark.y + shark.height / 2;
            const fCX = f.x + f.width / 2;
            const fCY = f.y + f.height / 2;
            const dx = fCX - sCX;
            const dy = fCY - sCY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
              fleeing = true;
              const pushStrength = ((180 - dist) / 180) * 0.5;
              f.vx += (dx / (dist || 1)) * pushStrength;
              f.vy += (dy / (dist || 1)) * pushStrength;
            }
          }

          // === WAVE FORCE (pushes all fish upward) ===
          // Small fish feel the wave strongly, large fish resist it
          const waveForce =
            f.sizeCategory === 'small' ? 0.06 : f.sizeCategory === 'medium' ? 0.04 : 0.02;
          f.vy -= waveForce;

          // === MINIMUM FORWARD DRIFT ===
          // Small & medium fish can't swim backward against the waves
          // Large fish can move freely
          if (f.sizeCategory === 'small' || f.sizeCategory === 'medium') {
            const minUp = f.sizeCategory === 'small' ? -0.5 : -0.3;
            if (f.vy > minUp) f.vy = minUp; // force upward if not moving up enough
          }

          // Wander
          f.wanderTimer--;
          if (f.wanderTimer <= 0) {
            f.wanderTimer = 40 + Math.random() * 60;
            f.wanderAngle = Math.random() * Math.PI * 2;
          }
          if (!fleeing) {
            f.vx += Math.cos(f.wanderAngle) * 0.03;
            f.vy += Math.sin(f.wanderAngle) * 0.03;
          }

          // Clamp max speed
          const spd = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
          const maxSpd = fleeing
            ? 3.5
            : f.sizeCategory === 'large'
              ? 2.8
              : f.sizeCategory === 'medium'
                ? 2.0
                : 1.6;
          if (spd > maxSpd) {
            f.vx = (f.vx / spd) * maxSpd;
            f.vy = (f.vy / spd) * maxSpd;
          }

          f.x += f.vx;
          f.y += f.vy;
          f.facingRight = f.vx > 0;

          // Bounce off left/right edges
          if (f.x < 20) {
            f.x = 20;
            f.vx = Math.abs(f.vx);
          }
          if (f.x + f.width > 780) {
            f.x = 780 - f.width;
            f.vx = -Math.abs(f.vx);
          }
          // Bounce off bottom
          if (f.y + f.height > 620) {
            f.y = 620 - f.height;
            f.vy = -Math.abs(f.vy);
          }
          // Small/medium fish that go off top simply respawn from bottom (don't leave screen)
          // (Despawn handled below if truly off)

          // === RAFT COLLISION ===
          if (!f.hasAttached && f.y < raftBottomY + 20 && f.y + f.height > raftTopY - 10) {
            if (
              f.x + f.width > raftRef.current.x - 5 &&
              f.x < raftRef.current.x + raftRef.current.width + 5
            ) {
              const roll2 = Math.random();
              f.hasAttached = true;

              // Determine which side the fish came from (based on velocity)
              // facingRight = true means fish is moving right (facing right)
              const movingRight = f.vx > 0.1;
              const movingLeft = f.vx < -0.1;

              if (roll2 < 0.5) {
                // Pass through — keeps swimming
                f.hasAttached = false;
              } else if (roll2 < 0.75) {
                // Attach to a side — face the side it came from
                f.state = 'attached';
                if (f.x + f.width / 2 < raftCX) {
                  f.attachSide = -1;
                  f.offsetX = -f.width - 4;
                  // Fish came from the left → face left when attached
                  f.attachFacing = movingRight ? 1 : -1;
                } else {
                  f.attachSide = 1;
                  f.offsetX = raftRef.current.width + 4;
                  // Fish came from the right → face right when attached
                  f.attachFacing = movingLeft ? -1 : 1;
                }
                f.offsetY = Math.max(
                  10,
                  Math.min(raftRef.current.height - f.height - 10, f.y - raftTopY),
                );
                f.graceTimer = 120;
                f.restTimer = 300 + Math.random() * 600;
                f.graceTimer = 120; // 2 seconds before player can eat
              } else {
                // Land on top
                f.state = 'onRaft';
                f.offsetX = Math.max(
                  4,
                  Math.min(raftRef.current.width - f.width - 4, f.x - raftRef.current.x),
                );
                f.offsetY = 4;
                f.graceTimer = 120;
                // Face the direction it was traveling
                f.attachFacing = movingRight ? 1 : -1;
                f.restTimer = 300 + Math.random() * 600;
                f.graceTimer = 120; // 2 seconds before player can eat
              }
            }
          }
        } else if (f.state === 'attached') {
          f.x = raftRef.current.x + f.offsetX;
          f.y = raftScreenY + f.offsetY;

          // Count down rest timer — fish eventually swims away
          if (f.restTimer > 0) f.restTimer--;
          if (f.restTimer <= 0 && f.bitesLeft > 0) {
            // Time to leave — swim away in its facing direction
            f.state = 'swimming';
            f.hasAttached = true; // prevent re-attaching immediately
            // Swim away from the raft
            f.vx = f.attachSide === -1 ? -1.5 : 1.5;
            f.vy = -0.5 - Math.random() * 0.5; // slight upward drift
            f.facingRight = f.vx > 0;
          }
        } else if (f.state === 'onRaft') {
          f.x = raftRef.current.x + f.offsetX;
          f.y = raftScreenY + f.offsetY;

          // Count down rest timer
          if (f.restTimer > 0) f.restTimer--;
          if (f.restTimer <= 0 && f.bitesLeft > 0) {
            // Jump off the raft back into the water
            f.state = 'swimming';
            f.hasAttached = true;
            // Slide off the nearest side
            const leftDist = f.x + f.width / 2 - raftRef.current.x;
            const rightDist = raftRef.current.x + raftRef.current.width - (f.x + f.width / 2);
            if (leftDist < rightDist) {
              f.vx = -1.5;
              f.facingRight = false;
            } else {
              f.vx = 1.5;
              f.facingRight = true;
            }
            f.vy = -0.3;
          }
        }

        // === FISH DESPAWN (realistic — swim off top of screen) ===
        if (f.y < -80) {
          fishes.splice(i, 1);
          continue;
        }
      }

      // === TOUCH-TO-EAT ===
      // A fish the player actually touches is bitten and eaten (fish that flop
      // onto the raft, or any fish swimming into you). A short cooldown stops
      // one lunge from clearing a whole school at once. Fish out in open water
      // that you never reach still have to be speared (Space) or hooked (H).
      {
        const pLeft = player.x - 5;
        const pRight = player.x + player.width + 5;
        const pTop = player.y - 5;
        const pBottom = player.y + player.height + 5;
        for (let i = fishes.length - 1; i >= 0; i--) {
          const f = fishes[i];
          // Give a fish a moment to settle after it lands on the raft.
          if (f.graceTimer > 0) continue;
          const overlaps =
            f.x < pRight && f.x + f.width > pLeft && f.y < pBottom && f.y + f.height > pTop;
          if (!overlaps || eatCooldown > 0) continue;

          statsRef.current.hunger = Math.min(
            100,
            statsRef.current.hunger + FOOD_TIERS.raw.hunger, // RAFT-405
          );
          statsRef.current.health = applyHeal(
            statsRef.current.health,
            FOOD_TIERS.raw.health,
            MAX_HEALTH,
          );
          fishCaught += 1;
          onXp(XP_REWARDS.catchFish);
          bumpAch('totalFishEaten'); // RAFT-004
          eatCooldown = 15;
          playEatSound();

          // Chomp particles, then the fish is consumed.
          for (let p = 0; p < 8; p++) {
            wakeParticles.push({
              x: f.x + f.width / 2,
              y: f.y + f.height / 2,
              size: 2 + Math.random() * 3,
              speed: -1 - Math.random() * 1.5,
              alpha: 0.9,
              life: 40,
            });
          }
          fishes.splice(i, 1);
          onStatsUpdate(statsPayload());
        }
      }

      // RAFT-104: frog pressure grows with the day (cap + spawn rate).
      const frogInterval = Math.max(
        60,
        Math.floor((FROG_SPAWN_INTERVAL * DIFF.enemySpawnMult) / scale.spawnMult),
      );
      if (time % frogInterval === 0 && frogs.length < scale.frogCap) spawnFrog();
      for (let i = frogs.length - 1; i >= 0; i--) {
        const frog = frogs[i];
        frog.hopPhase += 0.15;
        if (frog.x < 400) frog.x += 0.5;
        else frog.x -= 0.5;
        frog.y -= WORLD_SCROLL_SPEED * 0.5;
        frog.shootTimer--;
        if (frog.shootTimer <= 0) {
          spawnProjectile(frog);
          frog.shootTimer = 120 + Math.random() * 120;
        }

        // RAFT-111: frog contact damage scales with difficulty + day.
        if (
          frog.x < player.x + player.width &&
          frog.x + frog.width > player.x &&
          frog.y < player.y + player.height &&
          frog.y + frog.height > player.y
        ) {
          if (invulnerabilityTimer <= 0) {
            statsRef.current.health = applyDamage(
              statsRef.current.health,
              FROG_CONTACT_DAMAGE * enemyDamageMult,
            );
            invulnerabilityTimer = PLAYER_INVULN_FRAMES;
          }
        }

        if (frog.x < -100 || frog.x > 900 || frog.y < -100) frogs.splice(i, 1);
      }
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.x += proj.vx;
        proj.y += proj.vy - WORLD_SCROLL_SPEED * 0.5;
        // RAFT-110: intact walls intercept shots crossing the wall band.
        if (
          intactWalls() > 0 &&
          proj.y > raftScreenY - WALL_BLOCK_HEIGHT &&
          proj.y < raftScreenY + 30
        ) {
          for (let sp = 0; sp < 4; sp++)
            wakeParticles.push({
              x: proj.x,
              y: proj.y,
              size: 1.5 + Math.random() * 2,
              speed: -0.5,
              alpha: 0.9,
              life: 20,
            });
          projectiles.splice(i, 1);
          continue;
        }
        if (
          proj.x < player.x + player.width &&
          proj.x + proj.size > player.x &&
          proj.y < player.y + player.height &&
          proj.y + proj.size > player.y
        ) {
          if (invulnerabilityTimer <= 0) {
            statsRef.current.health = applyDamage(
              statsRef.current.health,
              FROG_PROJECTILE_DAMAGE * enemyDamageMult,
            );
            invulnerabilityTimer = PLAYER_INVULN_FRAMES * 2;
          }
          projectiles.splice(i, 1);
          continue;
        }
        if (proj.x < -50 || proj.x > 850 || proj.y < -50 || proj.y > 650) projectiles.splice(i, 1);
      }
      if (invulnerabilityTimer > 0) invulnerabilityTimer--;

      // RAFT-103/108: animate floating loot + damage numbers.
      for (let i = lootDrops.length - 1; i >= 0; i--) {
        const d = lootDrops[i];
        d.y += d.vy;
        d.vy *= 0.97;
        d.life--;
        if (d.life <= 0) lootDrops.splice(i, 1);
      }
      for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const dn = damageNumbers[i];
        dn.y -= 0.8;
        dn.life--;
        if (dn.life <= 0) damageNumbers.splice(i, 1);
      }

      spawnTimer++;
      if (spawnTimer > 120) {
        spawnItem();
        spawnTimer = 0;
      }
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (item === hookTargetItem) continue;
        item.y += item.speed;
        item.rotation += item.rotationSpeed;
        // Check collision with RAFT
        const itemCenterX = item.x + item.width / 2;
        const raftHit =
          itemCenterX >= raftRef.current.x &&
          itemCenterX <= raftRef.current.x + raftRef.current.width &&
          item.y + item.height >= raftScreenY &&
          item.y <= raftScreenY + raftRef.current.height;

        // Check collision with PLAYER (AABB)
        const playerHit =
          item.x < player.x + player.width &&
          item.x + item.width > player.x &&
          item.y < player.y + player.height &&
          item.y + item.height > player.y;

        if (raftHit || playerHit) {
          statsRef.current[item.type]++;
          if (item.type === 'wood') {
            woodGathered += 1;
            bumpAch('totalWood'); // RAFT-004
            onXp(XP_REWARDS.gatherWood); // RAFT-301
          } else if (item.type === 'plastic') {
            bumpAch('totalPlastic'); // RAFT-004
            onXp(XP_REWARDS.gatherPlastic); // RAFT-301
          } else {
            fishCaught += 1;
            onXp(XP_REWARDS.catchFish); // RAFT-301
          }
          items.splice(i, 1);
          continue;
        }
        if (item.y > 640) items.splice(i, 1);
      }

      // ===== RAFT-305: islands & floating chests (exploration) =====
      const grantExploreLoot = (table: LootDrop[], x: number, y: number) => {
        for (const drop of rollTable(table)) {
          if (drop.type === 'wood') {
            statsRef.current.wood += drop.amount;
            woodGathered += drop.amount;
          } else if (drop.type === 'plastic') statsRef.current.plastic += drop.amount;
          else {
            statsRef.current.fish += drop.amount;
            fishCaught += drop.amount;
          }
          lootDrops.push({
            x,
            y,
            type: drop.type,
            amount: drop.amount,
            life: 60,
            vy: -0.9 - Math.random() * 0.4,
          });
        }
      };
      islandTimer += 1;
      if (islandTimer >= ISLAND_SPAWN_PERIOD && islands.length < 2) {
        islandTimer = 0;
        spawnIsland();
      }
      chestTimer += 1;
      if (chestTimer >= CHEST_SPAWN_PERIOD && chests.length < 3) {
        chestTimer = 0;
        spawnChest();
      }
      for (let i = islands.length - 1; i >= 0; i--) {
        const isl = islands[i];
        isl.x += isl.vx;
        isl.y += isl.vy;
        isl.life -= 1;
        const hitX =
          isl.x < raftRef.current.x + raftRef.current.width &&
          isl.x + isl.width > raftRef.current.x;
        const hitY =
          isl.y < raftScreenY + raftRef.current.height && isl.y + isl.height > raftScreenY - 40;
        if (!isl.collected && hitX && hitY) {
          isl.collected = true;
          islandsFound += 1;
          grantExploreLoot(ISLAND_LOOT, isl.x + isl.width / 2, isl.y);
          onXp(XP_REWARDS.explore);
          if (typeof window !== 'undefined')
            gameStore.chestMessage = { text: 'ISLAND DISCOVERED!', time: 180 };
        }
        if (isl.life <= 0 || isl.x > 1000 || isl.x + isl.width < -200) islands.splice(i, 1);
      }
      for (let i = chests.length - 1; i >= 0; i--) {
        const ch = chests[i];
        ch.x += ch.vx;
        ch.y += ch.vy;
        ch.life -= 1;
        ch.glow = (ch.glow + 0.08) % (Math.PI * 2);
        const hitX =
          ch.x < raftRef.current.x + raftRef.current.width && ch.x + ch.size > raftRef.current.x;
        const hitY =
          ch.y < raftScreenY + raftRef.current.height && ch.y + ch.size > raftScreenY - 30;
        if (!ch.opened && hitX && hitY) {
          ch.opened = true;
          islandsFound += 1;
          grantExploreLoot(CHEST_LOOT, ch.x, ch.y);
          onXp(XP_REWARDS.explore);
          if (typeof window !== 'undefined')
            gameStore.chestMessage = { text: 'CHEST OPENED!', time: 180 };
        }
        if (ch.life <= 0 || ch.x > 1000 || ch.x + ch.size < -200) chests.splice(i, 1);
      }

      // RAFT-306: fire the win condition exactly once when the run reaches WIN_DAY.
      if (!victoryFired && statsRef.current.day >= WIN_DAY) {
        victoryFired = true;
        onVictoryRef.current?.();
      }

      if (time - lastStatsUpdate > 10) {
        onStatsUpdate(statsPayload());
        lastStatsUpdate = time;
      }
    };

    const drawChest = (ch: TreasureChest) => drawChestImpl(ctx, ch, time, SKIN_MAP, activeSkin);

    const drawCloud = (c: Cloud) => drawCloudImpl(ctx, c);

    const drawIsland = (isl: Island) => drawIslandImpl(ctx, isl, SKIN_MAP, activeSkin);

    const drawFish = (fish: Fish) => drawFishImpl(ctx, fish, time);

    const drawFrog = (frog: Frog) => drawFrogImpl(ctx, frog, player);

    const drawShark = (shark: Shark) => drawSharkImpl(ctx, shark);

    const drawWood = (item: Item) => drawWoodImpl(ctx, item, SKIN_MAP, activeSkin);

    const drawPlastic = (item: Item) => drawPlasticImpl(ctx, item);

    const drawVerticalRaft = (rx: number, ry: number, rw: number, rh: number) =>
      drawVerticalRaftImpl(
        ctx,
        raftTilt,
        gameStore.floors ?? 0,
        gameStore.hasCampfire ?? false,
        time,
        SKIN_MAP,
        activeSkin,
        rx,
        ry,
        rw,
        rh,
      );

    const drawPlayer = (px: number, py: number, state: string) =>
      drawPlayerImpl(ctx, player.width, invulnerabilityTimer, isWalking, walkCycle, px, py, state);

    const drawKraken = (kr: Kraken) => drawKrakenImpl(ctx, kr, time);

    // RAFT-108: compact health bar shown above enemies while damaged.
    const drawEnemyHealthBar = (
      x: number,
      y: number,
      width: number,
      hp: number,
      maxHp: number,
      color: string,
    ) => drawEnemyHealthBarImpl(ctx, x, y, width, hp, maxHp, color);

    const draw = () => {
      ctx.clearRect(0, 0, 800, 600);

      // Wave streaks moving UP
      waveStreaks.forEach((streak) => {
        ctx.strokeStyle = `rgba(200, 235, 255, ${streak.alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= streak.length; i += 4) {
          const y = streak.y + i;
          const x =
            streak.x + Math.sin((i / streak.length) * Math.PI * 3 + streak.phase) * streak.width;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 255, ${streak.alpha * 1.3})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i <= streak.length * 0.4; i += 4) {
          const y = streak.y + i;
          const x =
            streak.x +
            Math.sin((i / streak.length) * Math.PI * 3 + streak.phase) * streak.width -
            2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 255, 255, ${streak.alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(streak.x, streak.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Fish swim under everything else
      fishes.forEach((fish) => drawFish(fish));

      // RAFT-305: floating islands & treasure chests drift past the raft.
      islands.forEach((isl) => {
        if (!isl.collected) drawIsland(isl);
      });
      chests.forEach((ch) => drawChest(ch));

      items.forEach((item) => {
        // RAFT-403: rare loot glows so it reads as a bonus at a glance.
        if (item.rare) {
          ctx.save();
          ctx.globalAlpha = 0.55 + 0.25 * Math.sin(time * 0.15);
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(
            item.x + item.width / 2,
            item.y + item.height / 2,
            item.width * 0.95,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.restore();
        }
        if (item.type === 'wood') drawWood(item);
        else drawPlastic(item);
      });

      frogs.forEach((frog) => drawFrog(frog));

      projectiles.forEach((proj) => {
        ctx.fillStyle = 'rgba(142, 68, 173, 0.3)';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.size + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8E44AD';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#BB8FCE';
        ctx.beginPath();
        ctx.arc(proj.x - 2, proj.y - 2, proj.size / 3, 0, Math.PI * 2);
        ctx.fill();
      });

      const raftDrawYForShark = getRaftScreenY();
      if (shark) {
        const sharkDrawInFront = shark.y > raftDrawYForShark - 20;
        if (!sharkDrawInFront) drawShark(shark);
      }

      const raftDrawX = raftRef.current.x + raftBobX;
      const raftDrawY = getRaftScreenY();
      drawVerticalRaft(raftDrawX, raftDrawY, raftRef.current.width, raftRef.current.height);

      // === DRAW WAKE PARTICLES (foam trailing behind/beside raft) ===
      wakeParticles.forEach((p) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (shark) {
        const sharkDrawInFront = shark.y > raftDrawY - 20;
        if (sharkDrawInFront) drawShark(shark);
      }

      // KRAKEN DRAW CALL
      if (kraken) drawKraken(kraken);

      // === FISHING ROD (visible in player's hand) ===
      if (gameStore.hasRod && playerStateRef.current === 'standing') {
        const handX = player.x + player.width - 4;
        const handY = player.y + 30;

        // Rod pole (angled up-right, extending high)
        ctx.save();
        ctx.translate(handX, handY);
        ctx.rotate(-0.6);

        // Rod shaft
        ctx.strokeStyle = '#5D3A0F';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(70, -14);
        ctx.stroke();

        // Rod shaft highlight
        ctx.strokeStyle = '#8B5A2B';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(2, -1);
        ctx.lineTo(68, -15);
        ctx.stroke();

        // Rod handle (grip)
        ctx.strokeStyle = '#3A2208';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-4, 2);
        ctx.lineTo(10, -2);
        ctx.stroke();
        ctx.lineCap = 'butt';

        // Small reel near handle
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.arc(12, -2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7F8C8D';
        ctx.beginPath();
        ctx.arc(12, -2, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // === FISHING LINE + BOBBER (when casting) ===
      if (fishingState !== 'idle') {
        // Rod tip position
        const rodTipX = player.x + player.width + 20;
        const rodTipY = player.y - 5;

        // Line curves naturally to bobber
        ctx.strokeStyle = 'rgba(240, 240, 240, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(rodTipX, rodTipY);
        // Curve control point is between rod tip and bobber, pulled down slightly
        const midX = (rodTipX + bobberX) / 2;
        const midY = (rodTipY + bobberY) / 2 + 15;
        ctx.quadraticCurveTo(midX, midY, bobberX, bobberY);
        ctx.stroke();

        // Bobber has a slight bob animation
        const bobOffset = Math.sin(time * 0.1) * 2;
        const bobYPos = bobberY + bobOffset;

        // Water ripple around bobber
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(bobberX, bobYPos + 4, 12, 3, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(bobberX, bobYPos + 4, 18, 5, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.stroke();

        // Bobber body (red top, white bottom, classic)
        ctx.fillStyle = fishingState === 'caught' ? '#F1C40F' : '#E74C3C';
        ctx.beginPath();
        ctx.arc(bobberX, bobYPos, 8, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(bobberX, bobYPos, 8, 0, Math.PI);
        ctx.fill();

        // Bobber center band
        ctx.strokeStyle = '#2C3E50';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bobberX - 8, bobYPos);
        ctx.lineTo(bobberX + 8, bobYPos);
        ctx.stroke();

        // Bobber outline
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(bobberX, bobYPos, 8, 0, Math.PI * 2);
        ctx.stroke();

        // Top highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.arc(bobberX - 3, bobYPos - 4, 2, 0, Math.PI * 2);
        ctx.fill();

        // Antenna stick on top of bobber
        ctx.strokeStyle = '#E74C3C';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bobberX, bobYPos - 8);
        ctx.lineTo(bobberX, bobYPos - 14);
        ctx.stroke();

        // Alert "!" when fish is caught
        if (fishingState === 'caught') {
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 4;
          ctx.strokeText('!', bobberX + 15, bobYPos - 12);
          ctx.fillStyle = '#FFD700';
          ctx.fillText('!', bobberX + 15, bobYPos - 12);
          ctx.textAlign = 'start';
        }
      }

      // === DRAW PUDDLES ON RAFT (before player so player walks over them) ===
      raftPuddles.forEach((rp) => {
        ctx.fillStyle = 'rgba(41, 128, 185, 0.55)';
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.size, rp.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Puddle highlight (shimmer)
        ctx.fillStyle = 'rgba(133, 193, 233, 0.6)';
        ctx.beginPath();
        ctx.ellipse(
          rp.x - rp.size * 0.3,
          rp.y - rp.size * 0.2,
          rp.size * 0.3,
          rp.size * 0.2,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        // Dark rim
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.size, rp.size * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
      });

      // === DRAW SPLASH PARTICLES ===
      splashParticles.forEach((sp) => {
        const alpha = Math.min(1, sp.life / 15);
        ctx.fillStyle = 'rgba(200, 230, 255, ' + alpha + ')';
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
      });

      drawPlayer(player.x, player.y, playerStateRef.current);

      // === DRAW HOOK ===
      if (hookState !== 'idle') {
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y + player.height / 2);
        ctx.lineTo(hookX, hookY);
        ctx.stroke();

        ctx.fillStyle = '#C4A57B';
        ctx.beginPath();
        ctx.arc(hookX, hookY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5D3A0F';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.strokeStyle = '#5D3A0F';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hookX, hookY + 5, 6, 0, Math.PI * 0.9);
        ctx.stroke();

        ctx.fillStyle = '#F5DEB3';
        ctx.beginPath();
        ctx.arc(hookX - 2, hookY - 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      if (gameStore.hasSpear && attackTimer > 15) {
        ctx.strokeStyle = '#D2691E';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(player.x + player.width, player.y + player.height / 2);
        ctx.lineTo(player.x + player.width + 60, player.y + player.height / 2);
        ctx.stroke();
        ctx.fillStyle = '#AAAAAA';
        ctx.fillRect(player.x + player.width + 60, player.y + player.height / 2 - 4, 12, 8);
      }

      if (isRaining) {
        const rA = 0.75 + darkness * 0.25;
        ctx.strokeStyle =
          darkness > 0.3 ? 'rgba(255, 255, 255, ' + rA + ')' : 'rgba(200, 220, 255, ' + rA + ')';
        ctx.lineWidth = 1.8;
        raindrops.forEach((drop) => {
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x, drop.y + drop.length);
          ctx.stroke();
          drop.y += drop.speed;
          if (drop.y > 600) {
            drop.y = -20;
            drop.x = Math.random() * 800;
          }
        });
      }

      ctx.fillStyle = `rgba(0, 0, 20, ${darkness * 0.75})`;
      ctx.fillRect(0, 0, 800, 600);
      if (lightningFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${lightningFlash})`;
        ctx.fillRect(0, 0, 800, 600);
      }
      if (isInWater) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
        ctx.fillRect(0, 0, 800, 600);
      }

      // Draw clouds
      for (let _ci = 0; _ci < clouds.length; _ci++) {
        if (clouds[_ci].alpha > 0.03) drawCloud(clouds[_ci]);
      }

      // === SUN/MOON (arc from top, disappear upward) ===
      {
        const dayProgress = (time % (60 * 60 * 2)) / (60 * 60 * 2);
        const isDay = dayProgress < 0.5;

        // Two arcs: sun goes up-and-over, moon does too
        // Both rise from top, arc across, and disappear at top
        let arcT = 0;
        if (isDay) {
          arcT = dayProgress * 2;
        } else {
          arcT = (dayProgress - 0.5) * 2;
        }

        // Position: starts at left-top, arcs over, ends at right-top
        const arcX = isDay ? 680 - arcT * 560 : 120 + arcT * 560;
        // Goes DOWN then UP (visually arcs like a hill) — peaks at top
        // arcT 0 = top-left, 0.5 = middle-lowest, 1.0 = top-right
        const arcY = 15 + Math.sin(arcT * Math.PI) * 85;

        // Only show if not raining
        if (!isRaining) {
          if (isDay) {
            // === SUN ===
            // Outer glow
            const sunGlow = ctx.createRadialGradient(arcX, arcY, 3, arcX, arcY, 50);
            sunGlow.addColorStop(0, 'rgba(255, 240, 150, 0.55)');
            sunGlow.addColorStop(0.4, 'rgba(255, 210, 100, 0.28)');
            sunGlow.addColorStop(1, 'rgba(255, 180, 80, 0)');
            ctx.fillStyle = sunGlow;
            ctx.beginPath();
            ctx.arc(arcX, arcY, 50, 0, Math.PI * 2);
            ctx.fill();

            // Sun body
            ctx.fillStyle = '#FFEB99';
            ctx.beginPath();
            ctx.arc(arcX, arcY, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(arcX, arcY, 12, 0, Math.PI * 2);
            ctx.fill();

            // Sun rays (rotating)
            ctx.strokeStyle = 'rgba(255, 220, 100, 0.7)';
            ctx.lineWidth = 2;
            const rayRot = time * 0.01;
            for (let r = 0; r < 8; r++) {
              const ang = (r / 8) * Math.PI * 2 + rayRot;
              const r1 = 19;
              const r2 = 27 + Math.sin(time * 0.05 + r) * 3;
              ctx.beginPath();
              ctx.moveTo(arcX + Math.cos(ang) * r1, arcY + Math.sin(ang) * r1);
              ctx.lineTo(arcX + Math.cos(ang) * r2, arcY + Math.sin(ang) * r2);
              ctx.stroke();
            }
          } else {
            // === MOON ===
            // Blue glow
            const moonGlow = ctx.createRadialGradient(arcX, arcY, 3, arcX, arcY, 45);
            moonGlow.addColorStop(0, 'rgba(220, 235, 255, 0.45)');
            moonGlow.addColorStop(0.5, 'rgba(180, 210, 255, 0.2)');
            moonGlow.addColorStop(1, 'rgba(150, 180, 255, 0)');
            ctx.fillStyle = moonGlow;
            ctx.beginPath();
            ctx.arc(arcX, arcY, 45, 0, Math.PI * 2);
            ctx.fill();

            // Moon body
            ctx.fillStyle = '#F5F8FF';
            ctx.beginPath();
            ctx.arc(arcX, arcY, 14, 0, Math.PI * 2);
            ctx.fill();

            // Crescent shadow
            ctx.fillStyle = 'rgba(20, 25, 55, 0.92)';
            ctx.beginPath();
            ctx.arc(arcX + 6, arcY - 2, 12, 0, Math.PI * 2);
            ctx.fill();

            // Craters (small dots on the moon surface)
            ctx.fillStyle = 'rgba(180, 190, 210, 0.5)';
            ctx.beginPath();
            ctx.arc(arcX - 3, arcY - 4, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(arcX - 1, arcY + 3, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // === STARS at night (twinkling) ===
        if (darkness > 0.35 && !isRaining) {
          const starAlpha = Math.min(1, (darkness - 0.35) / 0.4);
          for (let i = 0; i < 60; i++) {
            // Deterministic star positions
            const sx = ((i * 137 + 41) % 780) + 10;
            const sy = ((i * 219 + 73) % 280) + 10;
            const twinkle = Math.sin(time * 0.04 + i * 1.7) * 0.5 + 0.5;
            const size = i % 7 === 0 ? 2 : 1;
            const alpha = starAlpha * (0.4 + twinkle * 0.6);
            ctx.fillStyle = 'rgba(255, 255, 240, ' + alpha + ')';
            ctx.fillRect(sx, sy, size, size);
            // Cross-sparkle for the biggest stars
            if (i % 11 === 0) {
              ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha * 0.6 + ')';
              ctx.fillRect(sx - 2, sy, 5, 1);
              ctx.fillRect(sx, sy - 2, 1, 5);
            }
          }
        }
      }

      // SNOW DRAWING
      if (weatherType === 'snow') {
        for (let _sno = 0; _sno < snowflakes.length; _sno++) {
          const _sf = snowflakes[_sno];
          _sf.y += _sf.speed;
          _sf.x += Math.sin(time * 0.02 + _sf.y * 0.01) * 0.5 + _sf.drift;
          if (_sf.y > 600) {
            _sf.y = -10;
            _sf.x = Math.random() * 800;
          }
          if (_sf.x < 0) _sf.x = 800;
          if (_sf.x > 800) _sf.x = 0;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.arc(_sf.x, _sf.y, _sf.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(200, 220, 255, 0.08)';
        ctx.fillRect(0, 0, 800, 600);
      }

      // HEAT DRAWING
      if (weatherType === 'heat') {
        ctx.fillStyle = 'rgba(255, 180, 100, 0.12)';
        ctx.fillRect(0, 0, 800, 600);
        for (let _hi = 0; _hi < 6; _hi++) {
          const _hy = ((time * 0.5 + _hi * 100) % 700) - 50;
          ctx.strokeStyle =
            'rgba(255, 220, 150, ' + (0.08 + Math.sin(time * 0.05 + _hi) * 0.04) + ')';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let _hx = 0; _hx < 800; _hx += 20) {
            const _wy = _hy + Math.sin(_hx * 0.05 + time * 0.1 + _hi) * 4;
            if (_hx === 0) ctx.moveTo(_hx, _wy);
            else ctx.lineTo(_hx, _wy);
          }
          ctx.stroke();
        }
      }

      // DARKNESS v2
      if (darkness > 0.02) {
        ctx.fillStyle = 'rgba(8, 12, 35, ' + darkness * 0.5 + ')';
        ctx.fillRect(0, 0, 800, 600);

        // CAMPFIRE LIGHT PIERCES NIGHT DARKNESS
        const _hasFireL = gameStore.hasCampfire;
        if (_hasFireL && darkness > 0.05) {
          const _rlx = raftRef.current.x + raftBobX + 15;
          const _rly = getRaftScreenY() + raftRef.current.height - 15;
          const _lightR = 150 + Math.sin(time * 0.2) * 15;
          const _la = darkness * 0.7;
          const _lightGrad = ctx.createRadialGradient(_rlx, _rly, 8, _rlx, _rly, _lightR);
          _lightGrad.addColorStop(0, 'rgba(255, 220, 140, ' + _la + ')');
          _lightGrad.addColorStop(0.4, 'rgba(255, 180, 90, ' + _la * 0.6 + ')');
          _lightGrad.addColorStop(1, 'rgba(255, 120, 40, 0)');
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = _lightGrad;
          ctx.beginPath();
          ctx.arc(_rlx, _rly, _lightR, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // STARS v2 (small, twinkling, slow drift)
      if (darkness > 0.25 && !isRaining) {
        const starFade2 = Math.min(1, (darkness - 0.25) / 0.3);
        for (let s2 = 0; s2 < 90; s2++) {
          const bX = ((s2 * 137 + 41) % 780) + 10;
          const bY = ((s2 * 219 + 73) % 260) + 10;
          const sDrift2 = ((time * 0.1 + s2 * 25) % 900) * 0.1;
          const sX = (bX + sDrift2) % 800;
          const sY = bY;
          const twinkle2 = Math.sin(time * 0.07 + s2 * 1.7) * 0.5 + 0.5;
          const size2 = s2 % 6 === 0 ? 1.5 : 1;
          const sAlpha2 = starFade2 * (0.5 + twinkle2 * 0.5);
          ctx.fillStyle = 'rgba(255, 255, 255, ' + sAlpha2 + ')';
          ctx.fillRect(sX, sY, size2, size2);
          if (s2 % 15 === 0) {
            ctx.fillStyle = 'rgba(220, 230, 255, ' + sAlpha2 * 0.6 + ')';
            ctx.fillRect(sX - 2, sY + 0.5, 5, 1);
            ctx.fillRect(sX + 0.5, sY - 2, 1, 5);
          }
        }
      }

      // FOG LAYER
      if (fogIntensity > 0.01) {
        ctx.fillStyle = 'rgba(200, 210, 220, ' + fogIntensity + ')';
        ctx.fillRect(0, 0, 800, 600);
        // fog ellipses removed
        ctx.fillStyle = 'rgba(200, 210, 220, ' + fogIntensity * 0.5 + ')';
        ctx.fillRect(0, 0, 800, 600);
      }

      // FPS DISPLAY (only if enabled in settings)
      if (typeof window !== 'undefined' && gameStore.showFps) {
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'left';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText('FPS: ' + fpsValue, 10, 590);
        const fpsColor = fpsValue >= 50 ? '#2ECC71' : fpsValue >= 30 ? '#F39C12' : '#E74C3C';
        ctx.fillStyle = fpsColor;
        ctx.fillText('FPS: ' + fpsValue, 10, 590);
        ctx.textAlign = 'start';
      }

      // === DIFFICULTY INDICATOR ===
      const diffColor = diff === 'easy' ? '#2ECC71' : diff === 'hard' ? '#E74C3C' : '#F39C12';
      ctx.font = 'bold 10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(diff.toUpperCase(), 400, 22);
      ctx.fillStyle = diffColor;
      ctx.fillText(diff.toUpperCase(), 400, 22);
      ctx.textAlign = 'start';

      if (damageFlash > 0) {
        const intensity = damageFlash / 30;
        ctx.fillStyle = `rgba(255, 0, 0, ${intensity * 0.25})`;
        ctx.fillRect(0, 0, 800, 600);
        const vignetteGradient = ctx.createRadialGradient(400, 300, 100, 400, 300, 500);
        vignetteGradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        vignetteGradient.addColorStop(0.6, `rgba(200, 0, 0, ${intensity * 0.3})`);
        vignetteGradient.addColorStop(1, `rgba(139, 0, 0, ${intensity * 0.8})`);
        ctx.fillStyle = vignetteGradient;
        ctx.fillRect(0, 0, 800, 600);
        ctx.fillStyle = `rgba(180, 0, 0, ${intensity * 0.9})`;
        const cx = player.x + player.width / 2;
        const cy = player.y + player.height / 2;
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          const dist = 30 + (30 - damageFlash) * 1.5;
          const size = 4 + Math.random() * 4;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(220, 0, 0, ${intensity})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 25 + (30 - damageFlash), 0, Math.PI * 2);
        ctx.fill();
      }

      // RAFT-108: floating damage numbers.
      ctx.textAlign = 'center';
      ctx.font = 'bold 14px "Press Start 2P", monospace';
      for (const dn of damageNumbers) {
        ctx.globalAlpha = Math.min(1, dn.life / 30);
        const shown = String(Math.round(dn.value * 10) / 10);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText(shown, dn.x, dn.y);
        ctx.fillStyle = dn.color;
        ctx.fillText(shown, dn.x, dn.y);
      }
      ctx.globalAlpha = 1;

      // RAFT-103: floating loot icons (already auto-collected into stats).
      for (const d of lootDrops) {
        ctx.globalAlpha = Math.min(1, d.life / 30);
        ctx.font = '16px serif';
        ctx.fillText(d.type === 'wood' ? '🪵' : d.type === 'plastic' ? '🧴' : '🐟', d.x, d.y);
        ctx.font = 'bold 10px "Press Start 2P", monospace';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText('+' + d.amount, d.x, d.y - 14);
        ctx.fillStyle = '#FFF';
        ctx.fillText('+' + d.amount, d.x, d.y - 14);
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'start';

      // RAFT-108: shark health bar (kraken draws its own).
      if (shark && shark.health < shark.maxHealth) {
        drawEnemyHealthBar(
          shark.x,
          shark.y - 12,
          shark.width,
          shark.health,
          shark.maxHealth,
          '#E74C3C',
        );
      }

      // RAFT-201/202: draw placed structures + the build-mode ghost preview.
      for (const t of buildGridRef.current.tiles) {
        const w = cellToWorld(t.col, t.row);
        ctx.globalAlpha = 0.35 + 0.65 * (t.hp / t.maxHp);
        if (t.kind === 'wall') {
          ctx.fillStyle = '#A9702F';
          ctx.fillRect(w.x + 3, w.y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
          ctx.strokeStyle = '#6B4419';
          ctx.lineWidth = 2;
          ctx.strokeRect(w.x + 3, w.y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
        } else if (t.kind === 'floor') {
          ctx.fillStyle = '#C08040';
          ctx.fillRect(w.x, w.y, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#8B5A2B';
          ctx.lineWidth = 1;
          ctx.strokeRect(w.x, w.y, TILE_SIZE, TILE_SIZE);
        } else if (t.kind === 'roof') {
          ctx.fillStyle = 'rgba(22,160,133,0.45)';
          ctx.fillRect(w.x, w.y, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#117864';
          ctx.lineWidth = 1;
          ctx.strokeRect(w.x, w.y, TILE_SIZE, TILE_SIZE);
        } else {
          ctx.font = '22px serif';
          ctx.fillText(
            t.kind === 'crate' ? '📦' : t.kind === 'dryingrack' ? '🍖' : '💧',
            w.x + 8,
            w.y + 28,
          );
        }
        ctx.globalAlpha = 1;
      }
      const bm = buildModeRef.current;
      if (bm.active) {
        const w = cellToWorld(bm.col, bm.row);
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = bm.valid ? 'rgba(46,204,113,0.9)' : 'rgba(231,76,60,0.9)';
        ctx.fillRect(w.x, w.y, TILE_SIZE, TILE_SIZE);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = bm.valid ? '#2ECC71' : '#E74C3C';
        ctx.lineWidth = 2;
        ctx.strokeRect(w.x, w.y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#FFF';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(bm.kind.toUpperCase(), w.x, w.y - 4);
      }

      // RAFT-102: F3 debug overlay — attack arc + enemy hitboxes.
      if (typeof window !== 'undefined' && gameStore.debugHitboxes) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.9)';
        ctx.strokeRect(player.x, player.y, player.width, player.height);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
        ctx.strokeRect(
          player.x - SPEAR_REACH.back,
          player.y - SPEAR_REACH.vertical,
          player.width + SPEAR_REACH.front + SPEAR_REACH.back,
          player.height + SPEAR_REACH.vertical * 2,
        );
        for (const frog of frogs) {
          ctx.strokeStyle = '#00FFFF';
          ctx.strokeRect(frog.x, frog.y, frog.width, frog.height);
        }
        if (shark) {
          ctx.strokeStyle = '#FF00FF';
          ctx.strokeRect(shark.x, shark.y, shark.width, shark.height);
        }
        if (kraken) {
          ctx.strokeStyle = '#FFAA00';
          ctx.strokeRect(
            kraken.x - KRAKEN_BOX / 2,
            kraken.y - KRAKEN_BOX / 2,
            KRAKEN_BOX,
            KRAKEN_BOX,
          );
        }
        for (const proj of projectiles) {
          ctx.strokeStyle = 'rgba(255,255,0,0.9)';
          ctx.strokeRect(proj.x, proj.y, proj.size, proj.size);
        }
        const wallCount = intactWalls();
        if (wallCount > 0) {
          ctx.strokeStyle = 'rgba(0,128,255,0.9)';
          ctx.strokeRect(
            raftDrawX,
            raftDrawY - WALL_BLOCK_HEIGHT,
            raftRef.current.width,
            WALL_BLOCK_HEIGHT,
          );
        }
      }
    };

    const gameLoop = () => {
      pollGamepad();
      update();
      draw();
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    gameLoop();
    return () => {
      cancelAnimationFrame(animationFrameId);
      resetGameCommands();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('bindingsChanged', onBindingsChanged);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [
    onStatsUpdate,
    onGameOver,
    bumpAch,
    checkAchievements,
    playChopSound,
    playEatSound,
    playFootstepSound,
    playHitSound,
    snapshotStore,
  ]);
  // Note: walls/roofs/floors/hasHammer are used in draw, see second effect below

  return (
    <div className="relative" style={{ width: 800, height: 600 }}>
      {/* Animated water backdrop (restored): the looping water GIF fills the
          whole game frame behind the transparent canvas. */}
      <div
        className="absolute inset-0 border-2 border-gray-700 shadow-lg"
        style={{
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.9,
          backgroundImage: 'url(/assets/backgroundscreen/waterscreen/waterbackground.gif)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="absolute inset-0"
        style={{ zIndex: 1, pointerEvents: 'none' }}
      />
    </div>
  );
}
