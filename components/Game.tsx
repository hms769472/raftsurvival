'use client';

import { useEffect, useRef } from 'react';
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
  SHARK_MAX_HP,
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
  STRUCTURE_COST,
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
  MATERIAL_UPGRADE_COST,
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
  FISH_YIELD,
  GOLDEN_FISH_BONUS,
  HOOK_REACH,
  HOOK_SPEED,
  HOOK_COOLDOWN,
  HOOK_PULL_SPEED,
  RARE_ITEM_CHANCE,
  RARE_ITEM_BONUS,
  DAY_PRESSURE_STEP,
  DAY_PRESSURE_MAX,
  WATER_THIRST_RESTORE,
  WATER_BARREL_COST,
  DEATH_LOG_LIMIT,
  TUNABLE,
  type DifficultyKey,
  type DeathCause,
  type WeaponTier,
  type LootType,
  type LootDrop,
  type StructureKind,
  type MaterialTier,
} from '@/lib/balance';
import { applyHeal, applyDamage, inAttackArc, threatScale, isEnemyUnlocked, rollLoot, rollTable } from '@/lib/systems/combat';
import { matchAction, loadBindings } from '@/lib/controls';
import {
  EMPTY_GRID,
  findTile,
  placeTile,
  removeTile,
  upgradeTile,
  damageFirstOfKind,
  repairAllTiles,
  hasShelter,
  countKind,
  canPlace,
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

type GameStats = {
  health: number; hunger: number; thirst: number; fish: number; day: number; wood: number; plastic: number; raftHealth: number;
  walls?: number; roofs?: number; floors?: number; raftSize?: number; capacity?: number; damaged?: boolean;
  /** RAFT-301/304/305: extra counters the progression + objective systems read. */
  cookedFish?: number; kills?: number; islands?: number; structures?: number; crafted?: number;
  /** RAFT-304: cumulative gathering counters for the objective chain. */
  woodGathered?: number; fishCaught?: number;
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

type Frog = { x: number; y: number; width: number; height: number; shootTimer: number; direction: number; hopPhase: number; };
type Projectile = { x: number; y: number; vx: number; vy: number; size: number; };
type Raindrop = { x: number; y: number; length: number; speed: number; };
type Item = { x: number; y: number; width: number; height: number; speed: number; type: 'wood' | 'plastic' | 'fish'; rotation: number; rotationSpeed: number; rare?: boolean; };
type Shark = { x: number; y: number; vx: number; vy: number; width: number; height: number; speed: number; health: number; maxHealth: number; hitFlash: number; state: 'wandering' | 'attacking' | 'passing' | 'retreating'; attackTimer: number; tailPhase: number; willAttack: boolean; mouthOpen: number; };
type TreasureChest = {
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
type Island = {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  vx: number;
  trees: { x: number; y: number; size: number; }[];
  rocks: { x: number; y: number; size: number; }[];
  collected: boolean;
  life: number;
};
type WaveStreak = { x: number; y: number; length: number; width: number; speed: number; alpha: number; phase: number; };
type FishFood = { x: number; y: number; vy: number; size: number; color: string; spawnTime: number; };
type Fish = { 
  x: number; y: number; vx: number; vy: number; 
  width: number; height: number; color: string; 
  tailPhase: number; facingRight: boolean;
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
type WakeParticle = { x: number; y: number; size: number; speed: number; alpha: number; life: number; };
type Kraken = { x: number; y: number; hp: number; maxHp: number; state: 'rising' | 'attacking' | 'dying'; timer: number; hitFlash: number; };
type DamageNumber = { x: number; y: number; value: number; life: number; color: string; };
/** RAFT-103: floating loot icon that flies toward the raft and is auto-collected. */
type LootPickup = { x: number; y: number; type: LootType; amount: number; life: number; vy: number; };

const RAFT_WIDTH = 80;
const RAFT_CENTER_Y = 300;
const WORLD_SCROLL_SPEED = 2.2;

export default function Game({ onStatsUpdate, craftAction, onCraftComplete, raftWidth, hasRod, hasSpear, hasHammer, hasCampfire, hasRainBarrel, walls, roofs, floors, gameOver, onGameOver, onVictory, playerState, initialState, snapshotStore, paused, spearTier, perkEffects, onXp: onXpProp, rewardAction, onRewardComplete, progression, perkRanks, objectiveIndex }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const waveSoundRef = useRef<{ noiseSource: AudioBufferSourceNode; lfo: OscillatorNode; } | null>(null);
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
  const raftRef = useRef({ x: 400 - RAFT_WIDTH / 2, y: RAFT_CENTER_Y, width: RAFT_WIDTH, height: BASE_RAFT_HEIGHT });

  const playerStateRef = useRef(playerState);
  useEffect(() => { playerStateRef.current = playerState; }, [playerState]);

  // RAFT-106: spear tier prop can change mid-run (upgrade); the game loop reads
  // it through a ref so the effect never needs to restart.
  const spearTierRef = useRef<WeaponTier>(spearTier ?? 'wooden');
  useEffect(() => { spearTierRef.current = spearTier ?? 'wooden'; }, [spearTier]);

  // RAFT-302: perk modifiers can change mid-run (perk tree); read via a ref so
  // the main effect never restarts. RAFT-306: onVictory read via a ref too.
  const perkRef = useRef<PerkEffects>(perkEffects ?? NEUTRAL_EFFECTS);
  useEffect(() => { perkRef.current = perkEffects ?? NEUTRAL_EFFECTS; }, [perkEffects]);
  const onVictoryRef = useRef(onVictory);
  useEffect(() => { onVictoryRef.current = onVictory; }, [onVictory]);
  // RAFT-301: XP is reported through a prop so progression lives in the page.
  const onXpGainRef = useRef(onXpProp);
  useEffect(() => { onXpGainRef.current = onXpProp; }, [onXpProp]);
  // RAFT-304: total tools crafted this run (survives across the craft effect).
  const craftsMadeRef = useRef(0);
  // RAFT-301/302/304: page-owned progression, written into the save snapshot.
  const progressionRef = useRef<ProgressionState>(progression ?? DEFAULT_PROGRESSION);
  useEffect(() => { progressionRef.current = progression ?? DEFAULT_PROGRESSION; }, [progression]);
  const perkRanksRef = useRef<PerkRanks>(perkRanks ?? {});
  useEffect(() => { perkRanksRef.current = perkRanks ?? {}; }, [perkRanks]);
  const objectiveIndexRef = useRef(objectiveIndex ?? 0);
  useEffect(() => { objectiveIndexRef.current = objectiveIndex ?? 0; }, [objectiveIndex]);

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
  const buildModeRef = useRef<{ active: boolean; kind: StructureKind; material: MaterialTier; rot: number; col: number; row: number; valid: boolean }>({
    active: false, kind: 'wall', material: 'wood', rot: 0, col: 0, row: 0, valid: false,
  });

  useEffect(() => {
    raftRef.current.height = raftWidth;
    raftRef.current.x = 400 - RAFT_WIDTH / 2;
  }, [raftWidth]);

  // Keep building refs in sync when props change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__wallsRef = walls;
      window.__roofsRef = roofs;
      window.__floorsRef = floors;
      window.__hasRodRef = hasRod;
      window.__hasSpearRef = hasSpear;
      window.__hasHammerRef = hasHammer;
      window.__hasCampfireRef = hasCampfire;
      window.__hasRainBarrelRef = hasRainBarrel;
    }
  }, [walls, roofs, floors, hasRod, hasSpear, hasHammer, hasCampfire, hasRainBarrel]);

  // Water waves ambient sound
  useEffect(() => {
    const startWaveSound = () => {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const audioCtx = audioCtxRef.current;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        if (waveSoundRef.current) return;

        const bufferSize = 2 * audioCtx.sampleRate;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

        const noise = audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        filter.Q.value = 1;

        const gain = audioCtx.createGain();
        gain.gain.value = 0.08;

        const lfo = audioCtx.createOscillator();
        lfo.frequency.value = 0.15;
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 0.05;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        noise.start();
        lfo.start();

        waveSoundRef.current = { noiseSource: noise, lfo };
      } catch (e) { console.log('Wave sound error:', e); }
    };

    startWaveSound();
    window.addEventListener('click', startWaveSound);
    window.addEventListener('keydown', startWaveSound);

    return () => {
      window.removeEventListener('click', startWaveSound);
      window.removeEventListener('keydown', startWaveSound);
      if (waveSoundRef.current) {
        try { waveSoundRef.current.noiseSource.stop(); waveSoundRef.current.lfo.stop(); } catch (e) {}
        waveSoundRef.current = null;
      }
    };
  }, []);

      // ===== SOUND EFFECTS (all Web Audio API) =====
    const getAudioCtx = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
      return audioCtxRef.current;
    };
    const isSfxEnabled = () => {
      if (typeof window === 'undefined') return true;
      return window.__sfxEnabled !== false;
    };

    const playFootstepSound = () => {
      if (!isSfxEnabled()) return;
      try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } catch (e) {}
    };

    const playChopSound = () => {
      if (!isSfxEnabled()) return;
      try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;
        // Quick snap/crack
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        // Wood crack (noise burst)
        const noise = ctx.createBufferSource();
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.15, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);
      } catch (e) {}
    };

    // RAFT-108: distinct impact SFX played only when an attack connects.
    const playHitSound = () => {
      if (!isSfxEnabled()) return;
      try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.09);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
        const noise = ctx.createBufferSource();
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.12, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);
      } catch {}
    };

    const playCraftSound = () => {
      if (!isSfxEnabled()) return;
      try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;
        // Happy ascending arpeggio
        [523, 659, 784].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.12, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.25);
        });
      } catch (e) {}
    };

    const playEatSound = () => {
      if (!isSfxEnabled()) return;
      try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;
        // Two quick munch sounds
        [0, 0.12].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(200, now + delay);
          osc.frequency.exponentialRampToValueAtTime(80, now + delay + 0.08);
          gain.gain.setValueAtTime(0.1, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.12);
        });
      } catch (e) {}
    };

    const playDrinkSound = () => {
      if (!isSfxEnabled()) return;
      try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;
        // Gulp sound (3 quick low tones)
        [0, 0.15, 0.3].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(120 - i * 15, now + delay);
          osc.frequency.exponentialRampToValueAtTime(70 - i * 10, now + delay + 0.1);
          gain.gain.setValueAtTime(0.15, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.15);
        });
      } catch (e) {}
    };

    const playSplashSound = () => {
      if (!isSfxEnabled()) return;
      try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;
        const noise = ctx.createBufferSource();
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        }
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } catch (e) {}
    };

        // ===== ACHIEVEMENT TRACKING =====
    const loadAchStats = (): AchievementStats => {
      if (typeof window === 'undefined') return { ...DEFAULT_ACH_STATS };
      const saved = localStorage.getItem('raftAchStats');
      if (saved) {
        try { return normalizeAchStats(JSON.parse(saved)); } catch { return { ...DEFAULT_ACH_STATS }; }
      }
      return { ...DEFAULT_ACH_STATS };
    };
    const saveAchStats = (s: AchievementStats) => {
      if (typeof window === 'undefined') return;
      try { localStorage.setItem('raftAchStats', JSON.stringify(s)); } catch { /* ignore */ }
    };
    // RAFT-004: single entry point for tracking a counter stat.
    const bumpAch = (key: keyof AchievementStats, delta = 1) => {
      saveAchStats(bumpAchStats(loadAchStats(), key, delta));
    };
    const loadUnlockedAchievements = (): string[] => {
      if (typeof window === 'undefined') return [];
      try { return JSON.parse(localStorage.getItem('raftAchievements') || '[]'); } catch { return []; }
    };
    // Pure-derived check: takes elapsed frames + difficulty + elapsed ms so it
    // never depends on the game-loop closure scope.
    const checkAchievements = (elapsedFrames: number, difficulty: AchDifficulty, elapsedMs: number) => {
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
        window.dispatchEvent(new CustomEvent('achievementUnlocked', {
          detail: { emoji: a.emoji, name: a.name, description: a.description },
        }));
      });
      try { localStorage.setItem('raftAchievements', JSON.stringify(unlockedList)); } catch { /* ignore */ }
      saveAchStats(synced);
    };
    // Cadence (every ~5s + key events) is driven from inside the main loop.

    const playThunderSound = () => { try { if (!audioCtxRef.current) { audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)(); } const ctx = audioCtxRef.current; if (ctx.state === 'suspended') ctx.resume(); const now = ctx.currentTime; const noise = ctx.createBufferSource(); const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const data = buf.getChannelData(0); for (let i = 0; i < data.length; i++) { const t = i / data.length; const env = Math.pow(1 - t, 1.5); data[i] = (Math.random() * 2 - 1) * env; } noise.buffer = buf; const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(180, now); filter.frequency.exponentialRampToValueAtTime(50, now + 1.8); filter.Q.value = 2; const gain = ctx.createGain(); gain.gain.setValueAtTime(0.001, now); gain.gain.exponentialRampToValueAtTime(0.35, now + 0.1); gain.gain.exponentialRampToValueAtTime(0.15, now + 0.5); gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8); noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination); noise.start(now); const rumble = ctx.createOscillator(); rumble.type = 'sine'; rumble.frequency.setValueAtTime(45, now); rumble.frequency.exponentialRampToValueAtTime(25, now + 1.8); const rumbleGain = ctx.createGain(); rumbleGain.gain.setValueAtTime(0.2, now); rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8); rumble.connect(rumbleGain); rumbleGain.connect(ctx.destination); rumble.start(now); rumble.stop(now + 1.8); } catch (e) {} };

    const playDamageSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;
      [0, 0.25].forEach((delay) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now + delay);
        osc.frequency.exponentialRampToValueAtTime(40, now + delay + 0.15);
        gain.gain.setValueAtTime(0.4, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.25);
      });
    } catch (e) { console.log('Audio error:', e); }
  };

  // Handle craft actions after the sound helpers are declared so the
  // craft SFX is in scope. Deducts resources, plays SFX and refreshes HUD.
  useEffect(() => {
    if (!craftAction) return;
    if (craftAction.type === 'REPAIR') {
      // RAFT-205: repair the RAFT (integrity + structure HP), never player HP.
      const needsRepair =
        statsRef.current.raftHealth < MAX_RAFT_HEALTH ||
        buildGridRef.current.tiles.some((t) => t.hp < t.maxHp);
      if (needsRepair && statsRef.current.wood >= RAFT_REPAIR_COST.wood && statsRef.current.plastic >= RAFT_REPAIR_COST.plastic) {
        statsRef.current.wood -= RAFT_REPAIR_COST.wood;
        statsRef.current.plastic -= RAFT_REPAIR_COST.plastic;
        statsRef.current.raftHealth = Math.min(MAX_RAFT_HEALTH, statsRef.current.raftHealth + RAFT_REPAIR_AMOUNT);
        buildGridRef.current = repairAllTiles(buildGridRef.current, RAFT_REPAIR_AMOUNT);
      }
    } else if (craftAction.type === 'EXPAND') {
      // RAFT-207: cost scales with deck size; the deck grows one tile row.
      const expansions = Math.max(0, Math.round((raftRef.current.height - BASE_RAFT_HEIGHT) / EXPAND_SIZE));
      const woodCost = EXPAND_COST_BASE.wood + EXPAND_COST_STEP.wood * expansions;
      const plasticCost = EXPAND_COST_BASE.plastic + EXPAND_COST_STEP.plastic * expansions;
      if (statsRef.current.wood >= woodCost && statsRef.current.plastic >= plasticCost) {
        statsRef.current.wood -= woodCost;
        statsRef.current.plastic -= plasticCost;
        raftRef.current.height += EXPAND_SIZE;
      }
    } else if (craftAction.type === 'ROD') {
      if (statsRef.current.wood >= 5) { statsRef.current.wood -= 5; }
    } else if (craftAction.type === 'SPEAR') {
      if (statsRef.current.wood >= 8) { statsRef.current.wood -= 8; }
    } else if (craftAction.type === 'HAMMER') {
      if (statsRef.current.wood >= 8) { statsRef.current.wood -= 8; }
    } else if (craftAction.type === 'WALL') {
      if (statsRef.current.wood >= 5) { statsRef.current.wood -= 5; bumpAch('builtWalls'); }
    } else if (craftAction.type === 'ROOF') {
      if (statsRef.current.wood >= 3 && statsRef.current.plastic >= 2) { statsRef.current.wood -= 3; statsRef.current.plastic -= 2; bumpAch('builtRoof'); }
    } else if (craftAction.type === 'FLOOR') {
      if (statsRef.current.wood >= 4) { statsRef.current.wood -= 4; }
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
  }, [craftAction, onCraftComplete, spearTier]);

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

    // Refs to always have current building state
    const wallsRef = { current: walls };
    const roofsRef = { current: roofs };
    const floorsRef = { current: floors };
    const hasHammerRef = { current: hasHammer };

    const player = { x: 380, y: RAFT_CENTER_Y + 20 + 300, width: 40, height: 80 };
    const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false, F: false, Space: false, H: false };

    // RAFT-503: player-rebindable controls (re-read live when Settings changes them).
    const bindingsRef = { current: loadBindings() };
    const onBindingsChanged = () => { bindingsRef.current = loadBindings(); };
    window.addEventListener('bindingsChanged', onBindingsChanged);

    // RAFT-502: contextual hints — each fires at most once per run.
    const hintsShown = new Set<string>();
    const showHint = (id: string, text: string, duration = 300) => {
      if (hintsShown.has(id)) return;
      hintsShown.add(id);
      window.__hint = { text, time: duration };
    };

    // RAFT-504: the on-screen virtual joystick writes into the same key state
    // the keyboard uses, so movement logic stays in one place.
    window.__setMove = (dir, pressed) => {
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
    const goldFishCount = 0;
    const fishFoods: FishFood[] = [];

    // === KEYBOARD HANDLERS ===
    const spawnProjectile = (frog: Frog) => {
      const dx = player.x + player.width / 2 - frog.x; 
      const dy = player.y + player.height / 2 - frog.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      projectiles.push({ x: frog.x + frog.width / 2, y: frog.y + frog.height / 2, vx: (dx / distance) * 3, vy: (dy / distance) * 3, size: 8 });
    };

    const spawnFrog = () => {
      const side = Math.random() > 0.5 ? 'left' : 'right';
      frogs.push({
        x: side === 'left' ? -40 : 840,
        y: 480 + Math.random() * 40,
        width: 40, height: 40,
        shootTimer: 60 + Math.random() * 120,
        direction: side === 'left' ? 1 : -1,
        hopPhase: Math.random() * Math.PI * 2,
      });
    };

    const BUILD_ORDER: StructureKind[] = ['wall', 'floor', 'roof', 'crate', 'dryingrack', 'purifier'];

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
      if (e.key === 'F3') { e.preventDefault(); window.__debugHitboxes = !window.__debugHitboxes; } // RAFT-102 debug overlay
      // RAFT-201/202: Build Mode toggle + structure selection.
      if (action === 'build') {
        const mustHaveHammer = typeof window !== 'undefined' ? window.__hasHammerRef : false;
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
    
    let time = initialState?.time ?? 0;
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
    let lightningBolt: { x: number; y: number; life: number; } | null = null;
    let isRaining = false;
    let weatherType: 'clear' | 'rain' | 'snow' | 'heat' = 'clear';
    let weatherTimer = 0;
    const snowflakes: { x: number; y: number; size: number; speed: number; drift: number; }[] = [];
    let isFoggy = false;
    let fogTimer = 0;
    let fogIntensity = 0;
    let rainTimer = 0;
    let spawnTimer = 0;
    let attackTimer = 0;
    // SKIN COLORS
    const SKIN_MAP: Record<string, SkinDefinition> = { 'default': { c: '#8B4513', a: '#A0522D' }, 'dark': { c: '#3E2723', a: '#5D4037' }, 'bamboo': { c: '#F9A825', a: '#FBC02D' }, 'ice': { c: '#B3E5FC', a: '#E1F5FE' }, 'lava': { c: '#BF360C', a: '#E64A19' }, 'gold': { c: '#FFD700', a: '#FFF176' }, 'neon': { c: '#9C27B0', a: '#E040FB' }, 'dragon': { c: '#1B5E20', a: '#4CAF50' } };
    let activeSkin = 'default';
    try { const s = localStorage.getItem('raftSelectedSkin'); if (s && SKIN_MAP[s]) activeSkin = s; } catch (e) {}
    let kraken: Kraken | null = null;
    let krakenTimer = 0;
    let cookedFish = initialState?.cookedFish ?? 0;
    let driedFish = initialState?.driedFish ?? 0; // RAFT-405
    let cookingTimer = 0;
    let barrelWater = initialState?.barrelWater ?? 0; // 0-100 — how much water is in the rain barrel
    if (typeof window !== 'undefined') window.__barrelWater = barrelWater;

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
        } catch { return 'normal'; }
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
      } catch { /* storage disabled — never crash the game */ }
    };
    const islands: Island[] = [];
    const shipwreckTimer = 0;
    const chests: TreasureChest[] = [];
    const shipwrecks: { x: number; y: number; vx: number; vy: number; size: number; rotation: number; life: number; looted: boolean; }[] = [];
    const clouds: { x: number; y: number; size: number; speed: number; alpha: number; vx?: number; vy?: number; }[] = [];
    const cloudSpawnTimer = 0;
    const splashParticles: { x: number; y: number; vx: number; vy: number; life: number; size: number; }[] = [];
    const raftPuddles: { x: number; y: number; size: number; age: number; }[] = [];

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

    for (let i = 0; i < 60; i++) snowflakes.push({ x: Math.random() * 800, y: Math.random() * 600, size: 1 + Math.random() * 3, speed: 0.5 + Math.random() * 1.2, drift: (Math.random() - 0.5) * 0.5 });
    for (let i = 0; i < 100; i++) raindrops.push({ x: Math.random() * 800, y: Math.random() * 600, length: 10 + Math.random() * 20, speed: 10 + Math.random() * 10 });

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
        hasAttached: false, isGolden: Math.random() < 0.06,
        wanderAngle: Math.random() * Math.PI * 2,
        wanderTimer: 0,
      });
    };

    const spawnIsland = () => {
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
        vx: fromLeft ? (0.4 + Math.random() * 0.3) : -(0.4 + Math.random() * 0.3),
        vy: -(0.3 + Math.random() * 0.4),
        trees,
        rocks,
        collected: false,
        life: 2400,
      });
    };

    const spawnChest = () => {
      const fromLeft = Math.random() < 0.5;
      chests.push({
        x: fromLeft ? -40 : 840,
        y: 250 + Math.random() * 250,
        vx: fromLeft ? (0.6 + Math.random() * 0.4) : -(0.6 + Math.random() * 0.4),
        vy: -(0.2 + Math.random() * 0.3),
        size: 22,
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        life: 2400,
        glow: 0,
        opened: false,
      });
    };

    const spawnFishFood = () => {
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
    };

    const spawnFish = () => {
      const colors = ['#F39C12', '#E74C3C', '#3498DB', '#27AE60', '#9B59B6', '#E67E22'];
      
      // Roll size category
      const roll = Math.random();
      let sizeCategory: 'small' | 'medium' | 'large';
      let w = 0, h = 0;
      if (roll < 0.5) { sizeCategory = 'small'; w = 20 + Math.random() * 8; h = 11 + Math.random() * 4; }
      else if (roll < 0.85) { sizeCategory = 'medium'; w = 32 + Math.random() * 10; h = 16 + Math.random() * 4; }
      else { sizeCategory = 'large'; w = 50 + Math.random() * 15; h = 24 + Math.random() * 6; }
      
      // Spawn from any edge
      const edge = Math.floor(Math.random() * 4);
      let sx = 0, sy = 0;
      if (edge === 0) { sx = -40; sy = 100 + Math.random() * 400; }
      else if (edge === 1) { sx = 840; sy = 100 + Math.random() * 400; }
      else if (edge === 2) { sx = 40 + Math.random() * 720; sy = 660; }
      else { sx = 40 + Math.random() * 720; sy = -40; }
      
      // Base speed by size (larger = stronger, faster)
      const baseSpeed = sizeCategory === 'small' ? 0.7 + Math.random() * 0.5
                       : sizeCategory === 'medium' ? 1.0 + Math.random() * 0.6
                       : 1.5 + Math.random() * 0.7;
      
      // Aim toward center
      const cxT = 400 - sx;
      const cyT = 300 - sy;
      const dist = Math.sqrt(cxT * cxT + cyT * cyT) || 1;
      const svx = (cxT / dist) * baseSpeed;
      const svy = (cyT / dist) * baseSpeed;
      
      fishes.push({
        x: sx, y: sy, vx: svx, vy: svy,
        width: w, height: h,
        color: colors[Math.floor(Math.random() * colors.length)],
        tailPhase: Math.random() * Math.PI * 2,
        facingRight: svx > 0,
        state: 'swimming',
        bitesLeft: sizeCategory === 'large' ? 5 : sizeCategory === 'medium' ? 3 : 2,
        attachSide: 1, offsetX: 0, offsetY: 0,
        hasAttached: false, isGolden: Math.random() < 0.06,
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
    };

    // RAFT-403: some debris spawns as "rare" loot in the side lanes, outside the
    // raft's column. It can never be auto-collected — only the hook can reach it
    // — and it pays a bonus of both wood and plastic on collection.
    const spawnItem = () => {
      const types: ('wood' | 'plastic')[] = ['wood', 'plastic'];
      const rare = Math.random() < RARE_ITEM_CHANCE;
      const x = rare
        ? (Math.random() < 0.5 ? Math.random() * 100 : 700 + Math.random() * 70)
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
    };

    const spawnShark = () => {
      const willAttack = Math.random() < 0.5;
      const edge = Math.floor(Math.random() * 4);
      const spd = 2;
      const hp = Math.round(SHARK_MAX_HP * threatScale(statsRef.current.day).hpMult);
      let sx = 0, sy = 0, svx = 0, svy = 0;
      if (edge === 0) { sx = -180; sy = 150 + Math.random() * 300; svx = spd; svy = 0; }
      else if (edge === 1) { sx = 980; sy = 150 + Math.random() * 300; svx = -spd; svy = 0; }
      else if (edge === 2) { sx = 100 + Math.random() * 600; sy = -180; svx = 0; svy = spd; }
      else { sx = 100 + Math.random() * 600; sy = 780; svx = 0; svy = -spd; }
      shark = { x: sx, y: sy, vx: svx, vy: svy, width: 160, height: 70, speed: spd, health: hp, maxHealth: hp, hitFlash: 0, state: 'wandering', attackTimer: 0, tailPhase: 0, willAttack, mouthOpen: 0 };
    };

        const getRaftScreenY = () => RAFT_CENTER_Y + raftBobY + Math.max(0, startupRiseOffset);

    // Expose eat function to parent — React state can't touch statsRef directly
    if (typeof window !== 'undefined') {
      window.__eatFishFromGame = () => { console.log('[EAT RAW] clicked, fish=' + statsRef.current.fish);
        if (statsRef.current.fish > 0) {
          statsRef.current.fish -= 1;
          statsRef.current.hunger = Math.min(100, statsRef.current.hunger + FOOD_TIERS.raw.hunger); // RAFT-405
          statsRef.current.health = applyHeal(statsRef.current.health, FOOD_TIERS.raw.health, MAX_HEALTH);
          bumpAch('totalFishEaten'); // RAFT-004
          playEatSound();
          onStatsUpdate(statsPayload());
        }
      };
      window.__drinkWaterFromGame = () => { if (barrelWater >= WATER_BARREL_COST && statsRef.current.thirst < 100) { barrelWater -= WATER_BARREL_COST; statsRef.current.thirst = Math.min(100, statsRef.current.thirst + WATER_THIRST_RESTORE); window.__barrelWater = barrelWater; onStatsUpdate(statsPayload()); } };
      window.__cookFish = () => { console.log('[COOK] clicked, hasFire=' + window.__hasCampfireRef + ' fish=' + statsRef.current.fish); const hasFire = window.__hasCampfireRef; if (hasFire && statsRef.current.fish > 0 && cookingTimer <= 0) { statsRef.current.fish -= 1; cookedFish += 1; cookingTimer = 180; onStatsUpdate(statsPayload()); } };
      window.__eatCookedFish = () => { console.log('[EAT COOKED] clicked, cookedFish=' + cookedFish); if (cookedFish > 0) { cookedFish -= 1; statsRef.current.hunger = Math.min(100, statsRef.current.hunger + FOOD_TIERS.cooked.hunger); statsRef.current.health = applyHeal(statsRef.current.health, FOOD_TIERS.cooked.health, MAX_HEALTH); bumpAch('totalFishEaten'); onStatsUpdate(statsPayload()); } };
      // RAFT-405: dried fish (drying rack output) is the best food tier.
      window.__eatDriedFish = () => { if (driedFish > 0) { driedFish -= 1; statsRef.current.hunger = Math.min(100, statsRef.current.hunger + FOOD_TIERS.dried.hunger); statsRef.current.health = applyHeal(statsRef.current.health, FOOD_TIERS.dried.health, MAX_HEALTH); bumpAch('totalFishEaten'); playEatSound(); onStatsUpdate(statsPayload()); } };
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
        hasRod: window.__hasRodRef ?? false,
        hasSpear: window.__hasSpearRef ?? false,
        hasHammer: window.__hasHammerRef ?? false,
        hasRainBarrel: window.__hasRainBarrelRef ?? false,
        hasCampfire: window.__hasCampfireRef ?? false,
        walls: window.__wallsRef ?? 0,
        roofs: window.__roofsRef ?? 0,
        floors: window.__floorsRef ?? 0,
        barrelWater,
        spearTier: spearTierRef.current,
        buildGrid: toStored(buildGridRef.current),
        progression: progressionRef.current,
        perkRanks: perkRanksRef.current,
        objectiveIndex: objectiveIndexRef.current,
      };
    };

    // RAFT-201..209: grid <-> world helpers, build-mode mouse handling.
    const deckMetrics = () => {
      const cols = Math.max(2, Math.round(raftRef.current.width / TILE_SIZE));
      const rows = Math.max(2, Math.round(raftRef.current.height / TILE_SIZE));
      return { left: raftRef.current.x, top: getRaftScreenY(), cols, rows };
    };
    const worldToCell = (wx: number, wy: number) => {
      const m = deckMetrics();
      return { col: Math.floor((wx - m.left) / TILE_SIZE), row: Math.floor((wy - m.top) / TILE_SIZE) };
    };
    const cellToWorld = (col: number, row: number) => {
      const m = deckMetrics();
      return { x: m.left + col * TILE_SIZE, y: m.top + row * TILE_SIZE };
    };
    const placementCtx = () => {
      const m = deckMetrics();
      return {
        minCol: 0, maxCol: m.cols - 1, minRow: 0, maxRow: m.rows - 1,
        wallAllowed: (col: number, row: number) => col === 0 || col === m.cols - 1 || row === 0 || row === m.rows - 1,
      };
    };
    // RAFT-209: full wood + upgrade cost for a structure at a material tier.
    const costFor = (kind: StructureKind, material: MaterialTier) => {
      const base = STRUCTURE_COST[kind];
      const up = material === 'wood' ? { wood: 0, plastic: 0 } : MATERIAL_UPGRADE_COST[material as Exclude<MaterialTier, 'wood'>];
      return { wood: base.wood + up.wood, plastic: base.plastic + up.plastic };
    };
    // RAFT-202/209: a cell is buildable if empty (place) or holds a lower-tier
    // structure of the same kind (upgrade).
    const cellAction = (col: number, row: number): 'place' | 'upgrade' | 'invalid' => {
      const kind = buildModeRef.current.kind;
      const sel = buildModeRef.current.material;
      const existing = findTile(buildGridRef.current, col, row);
      if (existing) {
        const canUpgrade = existing.kind === kind && MATERIAL_ORDER.indexOf(sel) > MATERIAL_ORDER.indexOf(existing.material);
        return canUpgrade ? 'upgrade' : 'invalid';
      }
      return canPlace(buildGridRef.current, col, row, kind, placementCtx()).ok ? 'place' : 'invalid';
    };
    const statsPayload = () => {
      const g = buildGridRef.current;
      return {
        ...statsRef.current,
        raftSize: raftRef.current.height,
        capacity: STORAGE_CAP_BASE + countKind(g, 'crate') * CRATE_CAPACITY,
        damaged: statsRef.current.raftHealth < MAX_RAFT_HEALTH || g.tiles.some((t) => t.hp < t.maxHp),
        walls: countKind(g, 'wall'),
        roofs: countKind(g, 'roof'),
        floors: countKind(g, 'floor'),
        // RAFT-301/304/305: counters fed to the progression + objective systems.
        cookedFish,
        driedFish,
        kills,
        islands: islandsFound,
        structures: structuresBuilt,
        crafted: craftsMadeRef.current,
        woodGathered,
        fishCaught,
      };
    };
    const pushBuildCounts = () => {
      const g = buildGridRef.current;
      if (typeof window !== 'undefined') {
        window.__wallsRef = countKind(g, 'wall');
        window.__roofsRef = countKind(g, 'roof');
        window.__floorsRef = countKind(g, 'floor');
      }
      onStatsUpdate(statsPayload());
    };
    const tryPlace = (col: number, row: number) => {
      const kind = buildModeRef.current.kind;
      const material = buildModeRef.current.material;
      const action = cellAction(col, row);
      if (action === 'invalid') return;
      // RAFT-302: Builder "Thrift" discounts every structure cost.
      const costMult = perkRef.current.structureCostMult;
      const scaled = (c: { wood: number; plastic: number }) => ({
        wood: Math.ceil(c.wood * costMult),
        plastic: Math.ceil(c.plastic * costMult),
      });
      if (action === 'upgrade') {
        // RAFT-209: upgrade an existing structure in place (pays only the tier cost).
        const up = scaled(MATERIAL_UPGRADE_COST[material as Exclude<MaterialTier, 'wood'>]);
        if (statsRef.current.wood < up.wood || statsRef.current.plastic < up.plastic) return;
        statsRef.current.wood -= up.wood;
        statsRef.current.plastic -= up.plastic;
        buildGridRef.current = upgradeTile(buildGridRef.current, col, row, material);
      } else {
        const cost = scaled(costFor(kind, material));
        if (statsRef.current.wood < cost.wood || statsRef.current.plastic < cost.plastic) return;
        statsRef.current.wood -= cost.wood;
        statsRef.current.plastic -= cost.plastic;
        buildGridRef.current = placeTile(buildGridRef.current, col, row, kind, material, buildModeRef.current.rot);
      }
      // RAFT-302: Builder "Sturdy" raises the new structure's HP.
      const hpMult = perkRef.current.structureHpMult;
      if (hpMult !== 1) {
        const g = buildGridRef.current;
        buildGridRef.current = {
          tiles: g.tiles.map((t) =>
            t.col === col && t.row === row
              ? { ...t, maxHp: Math.round(t.maxHp * hpMult), hp: Math.round(t.maxHp * hpMult) }
              : t,
          ),
          nextId: g.nextId,
        };
      }
      if (kind === 'wall') bumpAch('builtWalls');
      if (kind === 'roof') bumpAch('builtRoof');
      // RAFT-301/304: building grants XP and advances the build objective.
      structuresBuilt += 1;
      onXp(action === 'upgrade' ? XP_REWARDS.upgrade : XP_REWARDS.build);
      playChopSound();
      pushBuildCounts();
    };
    const tryRemove = (col: number, row: number) => {
      const res = removeTile(buildGridRef.current, col, row);
      if (res.refund.wood === 0 && res.refund.plastic === 0 && findTile(buildGridRef.current, col, row) === undefined) return;
      buildGridRef.current = res.grid;
      statsRef.current.wood += res.refund.wood;
      statsRef.current.plastic += res.refund.plastic;
      playChopSound();
      pushBuildCounts();
    };
    const toCanvasCoords = (clientX: number, clientY: number) => {
      const canvasEl = canvasRef.current;
      if (!canvasEl) return { x: 0, y: 0 };
      const rect = canvasEl.getBoundingClientRect();
      const sx = rect.width / 800;
      const sy = rect.height / 600;
      return { x: (clientX - rect.left) / (sx || 1), y: (clientY - rect.top) / (sy || 1) };
    };
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

    // RAFT-103: XP sink. Currently only logs in debug mode; Phase 3 wires the
    // real progression system through window.__onXpFromGame.
    const onXp = (amount: number) => {
      if (typeof window === 'undefined') return;
      if (onXpGainRef.current) { onXpGainRef.current(amount); return; }
      if (window.__onXpFromGame) { window.__onXpFromGame(amount); return; }
      if (window.__debugHitboxes) console.log('[XP] +' + amount);
    };

    const spawnDamageNumber = (x: number, y: number, value: number, color = '#FFD166') => {
      damageNumbers.push({ x, y, value, life: 45, color });
    };

    // RAFT-103: rolls the enemy loot table, floats the drops toward the raft and
    // auto-collects them into the stats. Also fires the XP hook.
    const grantKillRewards = (enemy: 'frog' | 'shark' | 'kraken', x: number, y: number) => {
      for (const drop of rollLoot(enemy)) {
        if (drop.type === 'wood') { statsRef.current.wood += drop.amount; woodGathered += drop.amount; }
        else if (drop.type === 'plastic') statsRef.current.plastic += drop.amount;
        else { statsRef.current.fish += drop.amount; fishCaught += drop.amount; }
        lootDrops.push({ x, y, type: drop.type, amount: drop.amount, life: 60, vy: -0.9 - Math.random() * 0.4 });
      }
      // RAFT-301/304: kills are a progression source and advance the objective.
      kills += 1;
      onXp(enemy === 'frog' ? XP_REWARDS.killFrog : enemy === 'shark' ? XP_REWARDS.killShark : XP_REWARDS.killKraken);
      onStatsUpdate(statsPayload());
    };

    // RAFT-204: count intact grid walls (structures are the source of truth).
    const intactWalls = () => buildGridRef.current.tiles.filter((t) => t.kind === 'wall' && t.hp > 0).length;

    // RAFT-404: fish are worth more when bigger; golden fish pay a rare bonus.
    const fishYield = (f: Fish): number =>
      FISH_YIELD[f.sizeCategory] + (f.isGolden ? GOLDEN_FISH_BONUS : 0);
    const yieldFish = (f: Fish) => {
      const amount = fishYield(f);
      statsRef.current.fish += amount;
      fishCaught += amount;
      onXp(XP_REWARDS.catchFish);
    };

    // RAFT-403: a hooked item is reeled straight into storage. Rare loot adds a
    // bonus of both wood and plastic and floats a pickup number.
    const grantHookedItem = (it: Item) => {
      if (it.type === 'wood') { statsRef.current.wood += 1; woodGathered += 1; bumpAch('totalWood'); onXp(XP_REWARDS.gatherWood); }
      else if (it.type === 'plastic') { statsRef.current.plastic += 1; bumpAch('totalPlastic'); onXp(XP_REWARDS.gatherPlastic); }
      else { statsRef.current.fish += 1; fishCaught += 1; onXp(XP_REWARDS.catchFish); }
      if (it.rare) {
        statsRef.current.wood += RARE_ITEM_BONUS;
        statsRef.current.plastic += RARE_ITEM_BONUS;
        woodGathered += RARE_ITEM_BONUS;
        lootDrops.push({ x: it.x, y: it.y, type: 'wood', amount: RARE_ITEM_BONUS, life: 60, vy: -0.9 });
        lootDrops.push({ x: it.x, y: it.y, type: 'plastic', amount: RARE_ITEM_BONUS, life: 60, vy: -0.9 });
      }
      onStatsUpdate(statsPayload());
    };

    // RAFT-403: the nearest debris within the hook's reach becomes the target.
    const findHookTarget = (): Item | null => {
      const px = player.x + player.width / 2;
      const py = player.y + player.height / 2;
      let best: Item | null = null;
      let bestD = HOOK_REACH;
      for (const it of items) {
        const dx = (it.x + it.width / 2) - px;
        const dy = (it.y + it.height / 2) - py;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < bestD) { bestD = d; best = it; }
      }
      return best;
    };

    const update = () => {
      if (gameOver || paused) return;
// ===== CLOUDS =====
      if (isRaining && !window.__wasRaining) {
        window.__wasRaining = true;
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
      if (!isRaining && window.__wasRaining) { window.__wasRaining = false; }
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
      if (time - fpsLastCheck >= 30) { fpsValue = Math.round(fpsFrameCount * 60 / (time - fpsLastCheck)); fpsFrameCount = 0; fpsLastCheck = time; }
      if (startupRiseOffset > 0) startupRiseOffset -= 2.5;
      
      const dayProgress = (time % DAY_LENGTH) / DAY_LENGTH;
      if (dayProgress < 0.35) { darkness = 0; } else if (dayProgress < 0.5) { const dt1 = (dayProgress - 0.35) / 0.15; darkness = dt1 * dt1 * dt1; } else if (dayProgress < 0.85) { darkness = 1; } else { const dt2 = (dayProgress - 0.85) / 0.15; darkness = 1 - dt2 * dt2 * dt2; }
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
      const hungerWeather = sheltered ? 1 : weatherType === 'snow' ? WEATHER_SNOW_HUNGER : weatherType === 'rain' ? WEATHER_RAIN_DRAIN : 1;
      const thirstWeather = sheltered ? 1 : weatherType === 'heat' ? WEATHER_HEAT_THIRST : weatherType === 'rain' ? WEATHER_RAIN_DRAIN : 1;
      const dayPressure = Math.min(DAY_PRESSURE_MAX, 1 + (statsRef.current.day - 1) * DAY_PRESSURE_STEP);
      statsRef.current.hunger -= TUNABLE.hungerDrain * DIFF.hungerRate * hungerWeather * perkRef.current.hungerMult * dayPressure;
      if (statsRef.current.hunger < 0) statsRef.current.hunger = 0;
      statsRef.current.thirst -= TUNABLE.thirstDrain * DIFF.thirstRate * thirstWeather * perkRef.current.thirstMult * dayPressure;
      if (statsRef.current.thirst < 0) statsRef.current.thirst = 0;
      if (statsRef.current.thirst === 0) {
        statsRef.current.health = applyDamage(statsRef.current.health, TUNABLE.starveDamage * DIFF.damageMult);
      }
      if (isRaining && window.__hasRainBarrelRef && barrelWater < 100) {
        barrelWater = Math.min(100, barrelWater + 0.05);
        window.__barrelWater = barrelWater;
      }
      // RAFT-208: water purifier slowly produces clean water.
      if (countKind(buildGridRef.current, 'purifier') > 0 && barrelWater < 100 && time % PURIFIER_PERIOD === 0) {
        barrelWater = Math.min(100, barrelWater + 1);
        window.__barrelWater = barrelWater;
      }
      // RAFT-405: fish drying rack cures a raw fish into a dried fish over time.
      if (countKind(buildGridRef.current, 'dryingrack') > 0 && statsRef.current.fish > 0 && time % DRYING_RACK_PERIOD === 0) {
        statsRef.current.fish -= 1;
        driedFish += 1;
      }
      // RAFT-208: storage crates raise the wood/plastic cap.
      const storageCap = STORAGE_CAP_BASE + countKind(buildGridRef.current, 'crate') * CRATE_CAPACITY;
      if (statsRef.current.wood > storageCap) statsRef.current.wood = storageCap;
      if (statsRef.current.plastic > storageCap) statsRef.current.plastic = storageCap;
      if (statsRef.current.hunger === 0) {
        statsRef.current.health = applyDamage(statsRef.current.health, TUNABLE.starveDamage * DIFF.damageMult);
      }

      if (statsRef.current.health < prevHealth - 0.05 && damageCooldown <= 0) {
        damageFlash = 30;
        damageCooldown = 60;
        playDamageSound();
      }
      prevHealth = statsRef.current.health;
      
      if (damageFlash > 0) damageFlash--;
      if (damageCooldown > 0) damageCooldown--;

      if (statsRef.current.health <= 0) { logDeath(); onGameOver(); return; }

      // ===== THREAT SCALING (RAFT-104) =====
      // Day-based multipliers feed every spawn / HP / damage decision below.
      const day = statsRef.current.day;
      const scale = threatScale(day);
      const enemyDamageMult = DIFF.damageMult * scale.damageMult;
      // Keep the HUD bridge counts in sync with the grid (no React setState here).
      if (typeof window !== 'undefined') {
        const g = buildGridRef.current;
        window.__wallsRef = countKind(g, 'wall');
        window.__roofsRef = countKind(g, 'roof');
        window.__floorsRef = countKind(g, 'floor');
      }
      // RAFT-203: an intact roof shelters the deck — small passive health regen.
      // RAFT-302: Survivor "Resilience" / Builder "Shelter" add flat regen.
      if (sheltered) {
        statsRef.current.health = applyHeal(statsRef.current.health, ROOF_REGEN_BONUS + perkRef.current.regenBonus, maxHealth);
      }

      // RAFT-308: a storm (rain) batters an unsheltered raft; a roof mitigates.
      if (isRaining && !sheltered && statsRef.current.raftHealth > 0) {
        statsRef.current.raftHealth = Math.max(0, statsRef.current.raftHealth - STORM_RAFT_DAMAGE);
      }

      // RAFT-206: raft integrity at 0 starts a sinking sequence — warning, then
      // structures are torn off one by one, then game over.
      if (statsRef.current.raftHealth <= 0) {
        sinkTimer++;
        if (sinkTimer === 1) window.__chestMessage = { text: 'THE RAFT IS SINKING!', time: 300 };
        if (sinkTimer > SINK_WARNING_FRAMES && sinkTimer % SINK_TILE_LOSS_INTERVAL === 0) {
          const tiles = buildGridRef.current.tiles;
          if (tiles.length > 0) {
            buildGridRef.current = { tiles: tiles.slice(0, -1), nextId: buildGridRef.current.nextId };
          }
        }
        if (sinkTimer > SINK_WARNING_FRAMES + SINK_TILE_LOSS_INTERVAL * 8) { logDeath(); onGameOver(); return; }
      } else {
        sinkTimer = 0;
      }

      // KRAKEN UPDATE
      krakenTimer++;
      if (!kraken && isEnemyUnlocked('kraken', day) && krakenTimer > KRAKEN_SPAWN_AFTER_FRAMES && Math.random() < KRAKEN_SPAWN_CHANCE * scale.spawnMult) {
        krakenTimer = 0;
        kraken = { x: raftRef.current.x + raftRef.current.width / 2, y: raftScreenY + 300, hp: Math.round(KRAKEN_MAX_HP * scale.hpMult), maxHp: Math.round(KRAKEN_MAX_HP * scale.hpMult), state: 'rising', timer: 0, hitFlash: 0 };
      }
      if (kraken) {
        kraken.timer++;
        if (kraken.hitFlash > 0) kraken.hitFlash--;
        if (kraken.state === 'rising') {
          kraken.y -= 1.2;
          if (kraken.timer > 60) { kraken.state = 'attacking'; kraken.timer = 0; }
        } else if (kraken.state === 'attacking') {
          if (kraken.timer % KRAKEN_BITE_INTERVAL === 0) {
            statsRef.current.health = applyDamage(statsRef.current.health, KRAKEN_BITE_DAMAGE * enemyDamageMult);
          }
          if (kraken.timer > 600) { kraken.state = 'dying'; kraken.timer = 0; }
        } else if (kraken.state === 'dying') {
          kraken.y += 1.5;
          if (kraken.timer > 90) kraken = null;
        }
      }

      if (time % 1200 === 0 && !isFoggy && Math.random() < 0) { isFoggy = true; fogTimer = 800 + Math.random() * 600; }
      if (isFoggy) { fogIntensity = Math.min(0.02, fogIntensity + 0.004); fogTimer--; if (fogTimer <= 0) isFoggy = false; } else { fogIntensity = Math.max(0, fogIntensity - 0.005); }
      rainTimer++;
      // WEATHER CYCLE
      weatherTimer++;
      if (weatherTimer > 1200 && weatherType === 'clear') {
        const wRoll = Math.random();
        if (wRoll < 0.45) { weatherType = 'rain'; isRaining = true; }
        else if (wRoll < 0.75) { weatherType = 'snow'; isRaining = false; }
        else { weatherType = 'heat'; isRaining = false; }
        weatherTimer = 0;
      }
      if (weatherType !== 'clear' && weatherTimer > 1800 + Math.random() * 600) {
        weatherType = 'clear'; isRaining = false; weatherTimer = 0;
      }
      isRaining = (weatherType === 'rain');
      if (!isRaining && rainTimer > 600 + Math.random() * 600) { isRaining = true; rainTimer = 0; }
      else if (isRaining && rainTimer > 900 + Math.random() * 600) { isRaining = false; rainTimer = 0; }
      lightningTimer++;
      // ===== CLOUDS =====
      if (isRaining && !window.__wasRaining) { window.__wasRaining = true; for (let cc = 0; cc < 8; cc++) { const side = cc % 2; if (side === 0) clouds.push({ x: -80, y: 20 + Math.random() * 90, size: 20 + Math.random() * 10, speed: 0, alpha: 0, vx: 0.4 + Math.random() * 0.25, vy: 0 }); else if (side === 1) clouds.push({ x: 880, y: 20 + Math.random() * 90, size: 20 + Math.random() * 10, speed: 0, alpha: 0, vx: -(0.4 + Math.random() * 0.25), vy: 0 }); else clouds.push({ x: 100 + Math.random() * 600, y: -60, size: 20 + Math.random() * 10, speed: 0, alpha: 0, vx: (Math.random() - 0.5) * 0.6, vy: 1.5 + Math.random() * 0.8 }); } }
      if (!isRaining && window.__wasRaining) { window.__wasRaining = false; }
      if (isRaining && clouds.length < 14 && time % 30 === 0) { const side = Math.floor(Math.random() * 2); if (side === 0) clouds.push({ x: -80, y: 20 + Math.random() * 90, size: 20 + Math.random() * 10, speed: 0, alpha: 0, vx: 0.4 + Math.random() * 0.25, vy: 0 }); else if (side === 1) clouds.push({ x: 880, y: 20 + Math.random() * 90, size: 20 + Math.random() * 10, speed: 0, alpha: 0, vx: -(0.4 + Math.random() * 0.25), vy: 0 }); else clouds.push({ x: 100 + Math.random() * 600, y: -60, size: 20 + Math.random() * 10, speed: 0, alpha: 0, vx: (Math.random() - 0.5) * 0.6, vy: 1.5 }); }
      for (let ci = clouds.length - 1; ci >= 0; ci--) { const c = clouds[ci]; if (c.vx === undefined) c.vx = c.speed; if (c.vy === undefined) c.vy = 0; c.x += c.vx; c.y += c.vy; if (isRaining) c.alpha = Math.min(0.85, c.alpha + 0.03); else c.alpha -= 0.02; if (c.x > 1100 || c.x < -300 || c.y > 700 || c.y < -300 || c.alpha <= 0) clouds.splice(ci, 1); }
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
          y: raftScreenY + raftRef.current.height * 0.6 + Math.random() * raftRef.current.height * 0.4,
          size: 3 + Math.random() * 4,
          speed: 0.7 + Math.random() * 0.5,
          alpha: 0.6 + Math.random() * 0.3,
          life: 70,
        });
        // Right side particle
        wakeParticles.push({
          x: raftX + raftW + Math.random() * 8 - 4,
          y: raftScreenY + raftRef.current.height * 0.6 + Math.random() * raftRef.current.height * 0.4,
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
        const dx = (player.x + player.width / 2) - (hookTargetItem.x + hookTargetItem.width / 2);
        const dy = (player.y + player.height / 2) - (hookTargetItem.y + hookTargetItem.height / 2);
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
      if (keys.ArrowLeft) { player.x -= 4; isWalking = true; }
      if (keys.ArrowRight) { player.x += 4; isWalking = true; }
      if (keys.ArrowUp) { player.y -= 3; isWalking = true; }
      if (keys.ArrowDown) { player.y += 3; isWalking = true; }
      
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
      }
      else walkCycle = 0;

      const feetX = player.x + player.width / 2;
      const feetY = player.y + player.height;
      const onRaft = feetX >= raftRef.current.x - 5 && 
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
        const regenRate = (wellFed ? TUNABLE.regenWellFed : TUNABLE.regenStarving) * DIFF.regenBonus;
        if (statsRef.current.health < maxHealth) statsRef.current.health = Math.min(maxHealth, statsRef.current.health + regenRate);
      }

      if ((typeof window !== 'undefined' ? window.__hasRodRef : false) && keys.F && fishingState === 'idle') {
        fishingState = 'casting'; fishingTimer = 30;
        bobberX = player.x + player.width / 2 + (Math.random() > 0.5 ? 60 : -60); bobberY = raftScreenY + raftRef.current.height + 60 + Math.random() * 40;
      }
      if (fishingState === 'casting') { fishingTimer--; if (fishingTimer <= 0) { fishingState = 'waiting'; fishingTimer = 180 + Math.random() * 120; } }
      else if (fishingState === 'waiting') {
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
        if (fishingTimer <= 0) { fishingState = 'idle'; } // Timeout — no fish
      }
      else if (fishingState === 'caught') { if (keys.F) { statsRef.current.fish += 1; fishCaught += 1; onXp(XP_REWARDS.catchFish); fishingState = 'idle'; } }

      if (attackTimer > 0) attackTimer--;
      if (cookingTimer > 0) cookingTimer--;
      const weapon = WEAPON_TIERS[spearTierRef.current];
      // RAFT-302: Fighter "Might" boosts damage, "Swift" shortens cooldown.
      const spearDamage = weapon.damage * perkRef.current.damageMult;
      if ((typeof window !== 'undefined' ? window.__hasSpearRef : false) && keys.Space && attackTimer === 0) {
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
          const kBox = { x: kraken.x - KRAKEN_BOX / 2, y: kraken.y - KRAKEN_BOX / 2, width: KRAKEN_BOX, height: KRAKEN_BOX };
          if (inAttackArc(player, kBox, KRAKEN_REACH)) {
            kraken.hp -= spearDamage;
            kraken.hitFlash = 20;
            spawnDamageNumber(kraken.x, kraken.y - 60, spearDamage, '#FF8FD6');
            hitLanded = true;
            if (kraken.hp <= 0) {
              statsRef.current.health = applyHeal(statsRef.current.health, KRAKEN_HEAL_ON_KILL, maxHealth);
              statsRef.current.hunger = Math.min(100, statsRef.current.hunger + 40);
              window.__chestMessage = { text: 'KRAKEN DEFEATED!', time: 180 };
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
      if (window.__hint && window.__hint.time > 0) window.__hint.time--;
      // RAFT-505: mirror the nearest threat so the HUD can show a warning.
      window.__threat = shark ? 'shark' : frogs.length > 0 ? 'frog' : null;
      if (shark && window.__hasSpearRef) showHint('attackShark', 'A shark is here — press ATTACK (SPACE)!');
      else if (frogs.length > 0 && window.__hasSpearRef) showHint('attackFrog', 'Frogs incoming — press ATTACK (SPACE)!');
      else if (statsRef.current.hunger < 30 && (statsRef.current.fish + cookedFish + driedFish) > 0) showHint('eat', 'You are hungry — tap the 🐟 button to eat.');
      else if (statsRef.current.thirst < 30) showHint('drink', 'You are thirsty — drink water (☔ barrel in the rain).');
      else if (items.length > 0 && window.__hasHammerRef) showHint('hook', 'Press HOOK (H) to reel in floating debris.');
      else if (fishes.length > 0 && window.__hasRodRef) showHint('fish', 'Fish are near — press FISH (F) to cast your line.');
      else if (!window.__hasSpearRef && statsRef.current.wood >= 3) showHint('craftSpear', 'Craft a Spear (C) so you can defend yourself.');

      // RAFT-104: sharks only appear from Day 4 and spawn faster as days pass.
      if (!shark && isEnemyUnlocked('shark', day) && time > SHARK_SPAWN_AFTER_FRAMES && Math.random() < SHARK_SPAWN_CHANCE * scale.spawnMult / DIFF.enemySpawnMult) { spawnShark(); }
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
          const hitRadius = fs.sizeCategory === 'large' ? 35
                          : fs.sizeCategory === 'medium' ? 55
                          : 70;
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
            if (Math.abs((fs.x + fs.width / 2) - sCX) < shark.width / 2 &&
                Math.abs((fs.y + fs.height / 2) - sCY) < shark.height / 2) {
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
              for (let sp = 0; sp < 6; sp++) wakeParticles.push({ x: sharkCX2, y: sharkCY2, size: 2 + Math.random() * 3, speed: -0.5 - Math.random(), alpha: 0.9, life: 30 });
              const safeLeft = raftRef.current.x + raftRef.current.width * 0.30;
              const safeRight = raftRef.current.x + raftRef.current.width * 0.70;
              const inSafeMiddle = playerCX >= safeLeft && playerCX <= safeRight;
              if (intactWalls() > 0) {
                // RAFT-204/110: an intact wall absorbs the bite (and loses HP).
                buildGridRef.current = damageFirstOfKind(buildGridRef.current, 'wall', SHARK_RAFT_DAMAGE);
              } else if (isInWater || !inSafeMiddle) {
                statsRef.current.health = applyDamage(statsRef.current.health, SHARK_BITE_DAMAGE * enemyDamageMult);
                spawnDamageNumber(playerCX, player.y, Math.round(SHARK_BITE_DAMAGE * enemyDamageMult * 10) / 10, '#FF6B6B');
              } else {
                // Middle still takes chip damage and the raft is chewed.
                statsRef.current.health = applyDamage(statsRef.current.health, SHARK_SAFE_MIDDLE_DAMAGE * enemyDamageMult);
                statsRef.current.raftHealth -= SHARK_RAFT_DAMAGE;
                if (statsRef.current.raftHealth < 0) statsRef.current.raftHealth = 0;
                spawnDamageNumber(playerCX, player.y, Math.round(SHARK_SAFE_MIDDLE_DAMAGE * enemyDamageMult * 10) / 10, '#FFA36B');
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
            if (d < closestDist) { closestDist = d; closestFood = fi; }
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
              const pushStrength = (180 - dist) / 180 * 0.5;
              f.vx += (dx / (dist || 1)) * pushStrength;
              f.vy += (dy / (dist || 1)) * pushStrength;
            }
          }
          
          // === WAVE FORCE (pushes all fish upward) ===
          // Small fish feel the wave strongly, large fish resist it
          const waveForce = f.sizeCategory === 'small' ? 0.06
                          : f.sizeCategory === 'medium' ? 0.04
                          : 0.02;
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
          const maxSpd = fleeing ? 3.5 
                        : f.sizeCategory === 'large' ? 2.8
                        : f.sizeCategory === 'medium' ? 2.0
                        : 1.6;
          if (spd > maxSpd) {
            f.vx = (f.vx / spd) * maxSpd;
            f.vy = (f.vy / spd) * maxSpd;
          }
          
          f.x += f.vx;
          f.y += f.vy;
          f.facingRight = f.vx > 0;
          
          // Bounce off left/right edges
          if (f.x < 20) { f.x = 20; f.vx = Math.abs(f.vx); }
          if (f.x + f.width > 780) { f.x = 780 - f.width; f.vx = -Math.abs(f.vx); }
          // Bounce off bottom
          if (f.y + f.height > 620) { f.y = 620 - f.height; f.vy = -Math.abs(f.vy); }
          // Small/medium fish that go off top simply respawn from bottom (don't leave screen)
          // (Despawn handled below if truly off)
          
          // === RAFT COLLISION ===
          if (!f.hasAttached && f.y < raftBottomY + 20 && f.y + f.height > raftTopY - 10) {
            if (f.x + f.width > raftRef.current.x - 5 && f.x < raftRef.current.x + raftRef.current.width + 5) {
              const roll2 = Math.random();
              f.hasAttached = true;
              
              // Determine which side the fish came from (based on velocity)
              // facingRight = true means fish is moving right (facing right)
              const movingRight = f.vx > 0.1;
              const movingLeft = f.vx < -0.1;
              const movingUp = f.vy < -0.1;
              const movingDown = f.vy > 0.1;
              
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
                f.offsetY = Math.max(10, Math.min(raftRef.current.height - f.height - 10, f.y - raftTopY));
                f.graceTimer = 120;
                f.restTimer = 300 + Math.random() * 600;
                f.graceTimer = 120; // 2 seconds before player can eat
              } else {
                // Land on top
                f.state = 'onRaft';
                f.offsetX = Math.max(4, Math.min(raftRef.current.width - f.width - 4, f.x - raftRef.current.x));
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

      // RAFT-404: fish are no longer eaten by touch. They must be speared
      // (see the attack block) or hooked; merely swimming into the player is
      // now harmless, so the old touch-to-eat loop has been removed.

      // RAFT-104: frog pressure grows with the day (cap + spawn rate).
      const frogInterval = Math.max(60, Math.floor(FROG_SPAWN_INTERVAL * DIFF.enemySpawnMult / scale.spawnMult));
      if (time % frogInterval === 0 && frogs.length < scale.frogCap) spawnFrog();
      for (let i = frogs.length - 1; i >= 0; i--) {
        const frog = frogs[i];
        frog.hopPhase += 0.15;
        if (frog.x < 400) frog.x += 0.5; else frog.x -= 0.5;
        frog.y -= WORLD_SCROLL_SPEED * 0.5;
        frog.shootTimer--;
        if (frog.shootTimer <= 0) { spawnProjectile(frog); frog.shootTimer = 120 + Math.random() * 120; }
        
        // RAFT-111: frog contact damage scales with difficulty + day.
        if (frog.x < player.x + player.width && frog.x + frog.width > player.x &&
            frog.y < player.y + player.height && frog.y + frog.height > player.y) {
          if (invulnerabilityTimer <= 0) {
            statsRef.current.health = applyDamage(statsRef.current.health, FROG_CONTACT_DAMAGE * enemyDamageMult);
            invulnerabilityTimer = PLAYER_INVULN_FRAMES;
          }
        }
        
        if (frog.x < -100 || frog.x > 900 || frog.y < -100) frogs.splice(i, 1);
      }
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i]; proj.x += proj.vx; proj.y += proj.vy - WORLD_SCROLL_SPEED * 0.5;
        // RAFT-110: intact walls intercept shots crossing the wall band.
        if (intactWalls() > 0 && proj.y > raftScreenY - WALL_BLOCK_HEIGHT && proj.y < raftScreenY + 30) {
          for (let sp = 0; sp < 4; sp++) wakeParticles.push({ x: proj.x, y: proj.y, size: 1.5 + Math.random() * 2, speed: -0.5, alpha: 0.9, life: 20 });
          projectiles.splice(i, 1); continue;
        }
        if (proj.x < player.x + player.width && proj.x + proj.size > player.x && proj.y < player.y + player.height && proj.y + proj.size > player.y) {
          if (invulnerabilityTimer <= 0) { statsRef.current.health = applyDamage(statsRef.current.health, FROG_PROJECTILE_DAMAGE * enemyDamageMult); invulnerabilityTimer = PLAYER_INVULN_FRAMES * 2; }
          projectiles.splice(i, 1); continue;
        }
        if (proj.x < -50 || proj.x > 850 || proj.y < -50 || proj.y > 650) projectiles.splice(i, 1);
      }
      if (invulnerabilityTimer > 0) invulnerabilityTimer--;

      // RAFT-103/108: animate floating loot + damage numbers.
      for (let i = lootDrops.length - 1; i >= 0; i--) {
        const d = lootDrops[i];
        d.y += d.vy; d.vy *= 0.97; d.life--;
        if (d.life <= 0) lootDrops.splice(i, 1);
      }
      for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const dn = damageNumbers[i];
        dn.y -= 0.8; dn.life--;
        if (dn.life <= 0) damageNumbers.splice(i, 1);
      }

      spawnTimer++;
      if (spawnTimer > 120) { spawnItem(); spawnTimer = 0; }
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (item === hookTargetItem) continue;
        item.y += item.speed;
        item.rotation += item.rotationSpeed;
        // Check collision with RAFT
        const itemCenterX = item.x + item.width / 2;
        const raftHit = itemCenterX >= raftRef.current.x && 
                        itemCenterX <= raftRef.current.x + raftRef.current.width &&
                        item.y + item.height >= raftScreenY && 
                        item.y <= raftScreenY + raftRef.current.height;
        
        // Check collision with PLAYER (AABB)
        const playerHit = item.x < player.x + player.width &&
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
          } items.splice(i, 1); continue;
        }
        if (item.y > 640) items.splice(i, 1);
      }

      // ===== RAFT-305: islands & floating chests (exploration) =====
      const grantExploreLoot = (table: LootDrop[], x: number, y: number) => {
        for (const drop of rollTable(table)) {
          if (drop.type === 'wood') { statsRef.current.wood += drop.amount; woodGathered += drop.amount; }
          else if (drop.type === 'plastic') statsRef.current.plastic += drop.amount;
          else { statsRef.current.fish += drop.amount; fishCaught += drop.amount; }
          lootDrops.push({ x, y, type: drop.type, amount: drop.amount, life: 60, vy: -0.9 - Math.random() * 0.4 });
        }
      };
      islandTimer += 1;
      if (islandTimer >= ISLAND_SPAWN_PERIOD && islands.length < 2) { islandTimer = 0; spawnIsland(); }
      chestTimer += 1;
      if (chestTimer >= CHEST_SPAWN_PERIOD && chests.length < 3) { chestTimer = 0; spawnChest(); }
      for (let i = islands.length - 1; i >= 0; i--) {
        const isl = islands[i];
        isl.x += isl.vx;
        isl.y += isl.vy;
        isl.life -= 1;
        const hitX = isl.x < raftRef.current.x + raftRef.current.width && isl.x + isl.width > raftRef.current.x;
        const hitY = isl.y < raftScreenY + raftRef.current.height && isl.y + isl.height > raftScreenY - 40;
        if (!isl.collected && hitX && hitY) {
          isl.collected = true;
          islandsFound += 1;
          grantExploreLoot(ISLAND_LOOT, isl.x + isl.width / 2, isl.y);
          onXp(XP_REWARDS.explore);
          if (typeof window !== 'undefined') window.__chestMessage = { text: 'ISLAND DISCOVERED!', time: 180 };
        }
        if (isl.life <= 0 || isl.x > 1000 || isl.x + isl.width < -200) islands.splice(i, 1);
      }
      for (let i = chests.length - 1; i >= 0; i--) {
        const ch = chests[i];
        ch.x += ch.vx;
        ch.y += ch.vy;
        ch.life -= 1;
        ch.glow = (ch.glow + 0.08) % (Math.PI * 2);
        const hitX = ch.x < raftRef.current.x + raftRef.current.width && ch.x + ch.size > raftRef.current.x;
        const hitY = ch.y < raftScreenY + raftRef.current.height && ch.y + ch.size > raftScreenY - 30;
        if (!ch.opened && hitX && hitY) {
          ch.opened = true;
          islandsFound += 1;
          grantExploreLoot(CHEST_LOOT, ch.x, ch.y);
          onXp(XP_REWARDS.explore);
          if (typeof window !== 'undefined') window.__chestMessage = { text: 'CHEST OPENED!', time: 180 };
        }
        if (ch.life <= 0 || ch.x > 1000 || ch.x + ch.size < -200) chests.splice(i, 1);
      }

      // RAFT-306: fire the win condition exactly once when the run reaches WIN_DAY.
      if (!victoryFired && statsRef.current.day >= WIN_DAY) {
        victoryFired = true;
        onVictoryRef.current?.();
      }

      if (time - lastStatsUpdate > 10) { onStatsUpdate(statsPayload()); lastStatsUpdate = time; }
    };

    const drawChest = (ch: TreasureChest) => {
      const cx = ch.x;
      const cy = ch.y;
      const s = ch.size;

      // Underwater shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + s + 4, s * 0.9, s * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ch.rotation * 0.3); // slight tilt only

      // === Glow aura (pulsing) ===
      const glowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, s * 1.8);
      glowGrad.addColorStop(0, "rgba(255, 215, 0, " + (0.5 * ch.glow) + ")");
      glowGrad.addColorStop(0.5, "rgba(255, 200, 50, " + (0.2 * ch.glow) + ")");
      glowGrad.addColorStop(1, "rgba(255, 180, 0, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, s * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // === Chest body (bottom half) ===
      ctx.fillStyle = (typeof SKIN_MAP !== 'undefined' && activeSkin && SKIN_MAP[activeSkin]) ? SKIN_MAP[activeSkin].c : '#8B4513';
      ctx.fillRect(-s * 0.85, -s * 0.1, s * 1.7, s * 0.9);

      // Wood plank lines
      ctx.strokeStyle = '#5D3A0F';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-s * 0.85, s * 0.2); ctx.lineTo(s * 0.85, s * 0.2);
      ctx.moveTo(-s * 0.85, s * 0.5); ctx.lineTo(s * 0.85, s * 0.5);
      ctx.stroke();

      // === Chest lid (top half — arched) ===
      ctx.fillStyle = (typeof SKIN_MAP !== 'undefined' && activeSkin && SKIN_MAP[activeSkin]) ? SKIN_MAP[activeSkin].a : '#A0522D';
      ctx.beginPath();
      ctx.moveTo(-s * 0.85, -s * 0.1);
      ctx.quadraticCurveTo(0, -s * 0.9, s * 0.85, -s * 0.1);
      ctx.closePath();
      ctx.fill();

      // Lid highlight
      ctx.fillStyle = '#C67B4A';
      ctx.beginPath();
      ctx.moveTo(-s * 0.7, -s * 0.15);
      ctx.quadraticCurveTo(0, -s * 0.7, s * 0.5, -s * 0.2);
      ctx.quadraticCurveTo(0, -s * 0.4, -s * 0.7, -s * 0.15);
      ctx.closePath();
      ctx.fill();

      // === Gold straps ===
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(-s * 0.9, -s * 0.1, s * 0.15, s * 0.9);
      ctx.fillRect(s * 0.75, -s * 0.1, s * 0.15, s * 0.9);
      // Top strap on lid
      ctx.beginPath();
      ctx.moveTo(-s * 0.08, -s * 0.85);
      ctx.lineTo(s * 0.08, -s * 0.85);
      ctx.lineTo(s * 0.08, -s * 0.1);
      ctx.lineTo(-s * 0.08, -s * 0.1);
      ctx.closePath();
      ctx.fill();

      // === Lock (gold) ===
      ctx.fillStyle = '#B8860B';
      ctx.beginPath();
      ctx.arc(0, -s * 0.05, s * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(0, -s * 0.05, s * 0.15, 0, Math.PI * 2);
      ctx.fill();
      // Keyhole
      ctx.fillStyle = '#5D3A0F';
      ctx.beginPath();
      ctx.arc(0, -s * 0.1, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-s * 0.03, -s * 0.08, s * 0.06, s * 0.15);

      // === Sparkles around chest ===
      for (let sp = 0; sp < 4; sp++) {
        const ang = time * 0.03 + sp * (Math.PI / 2);
        const dist = s * 1.5;
        const sx = Math.cos(ang) * dist;
        const sy = Math.sin(ang) * dist * 0.6;
        const alpha = (Math.sin(time * 0.1 + sp) + 1) * 0.5;
        ctx.fillStyle = "rgba(255, 255, 200, " + alpha + ")";
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Floating "?" hint above chest
      if (!ch.opened) {
        ctx.font = 'bold 14px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText('★', cx, cy - s * 1.5);
        ctx.fillStyle = '#FFD700';
        ctx.fillText('★', cx, cy - s * 1.5);
        ctx.textAlign = 'start';
      }
    };

    const drawCloud = (c: { x: number; y: number; size: number; alpha: number; vx?: number; vy?: number; speed: number; }) => {
      const cx = c.x;
      const cy = c.y;
      const s = c.size;
      const a = c.alpha;
      if (a <= 0.02) return;

      // Soft dark base (shadow)
      ctx.fillStyle = "rgba(90, 105, 125, " + (a * 0.85) + ")";
      ctx.beginPath();
      ctx.ellipse(cx, cy + s * 0.15, s * 0.95, s * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mid gray (main body)
      ctx.fillStyle = "rgba(150, 160, 175, " + a + ")";
      ctx.beginPath();
      ctx.ellipse(cx - s * 0.35, cy + s * 0.05, s * 0.5, s * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + s * 0.3, cy + s * 0.05, s * 0.55, s * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, cy - s * 0.05, s * 0.65, s * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lighter top bumps (higher)
      ctx.fillStyle = "rgba(200, 210, 225, " + a + ")";
      ctx.beginPath();
      ctx.ellipse(cx - s * 0.3, cy - s * 0.2, s * 0.35, s * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + s * 0.05, cy - s * 0.28, s * 0.45, s * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + s * 0.4, cy - s * 0.15, s * 0.3, s * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bright highlight top
      ctx.fillStyle = "rgba(245, 250, 255, " + (a * 0.9) + ")";
      ctx.beginPath();
      ctx.ellipse(cx + s * 0.05, cy - s * 0.35, s * 0.28, s * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Soft bottom drips
      ctx.fillStyle = "rgba(120, 135, 155, " + (a * 0.4) + ")";
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.ellipse(cx + i * s * 0.35, cy + s * 0.3, s * 0.18, s * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawIsland = (isl: Island) => {
      const ix = isl.x;
      const iy = isl.y;
      const iw = isl.width;
      const ih = isl.height;

      // === Water shadow / reflection below island ===
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(ix + iw / 2, iy + ih + 6, iw / 2, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // === Island base (rocky/earthy) ===
      // Bottom (darker)
      ctx.fillStyle = '#6B4423';
      ctx.beginPath();
      ctx.moveTo(ix + 8, iy + ih);
      ctx.lineTo(ix + iw - 8, iy + ih);
      ctx.lineTo(ix + iw - 15, iy + ih - 12);
      ctx.lineTo(ix + 15, iy + ih - 12);
      ctx.closePath();
      ctx.fill();

      // Middle (light dirt)
      ctx.fillStyle = (typeof SKIN_MAP !== 'undefined' && activeSkin && SKIN_MAP[activeSkin]) ? SKIN_MAP[activeSkin].a : '#A0522D';
      ctx.beginPath();
      ctx.moveTo(ix + 15, iy + ih - 12);
      ctx.lineTo(ix + iw - 15, iy + ih - 12);
      ctx.lineTo(ix + iw - 20, iy + ih - 20);
      ctx.lineTo(ix + 20, iy + ih - 20);
      ctx.closePath();
      ctx.fill();

      // Top grass layer
      ctx.fillStyle = '#4CAF50';
      ctx.beginPath();
      ctx.moveTo(ix + 20, iy + ih - 20);
      ctx.lineTo(ix + iw - 20, iy + ih - 20);
      ctx.lineTo(ix + iw - 30, iy + ih - 28);
      ctx.lineTo(ix + 30, iy + ih - 28);
      ctx.closePath();
      ctx.fill();

      // Top grass highlight
      ctx.fillStyle = '#66BB6A';
      ctx.beginPath();
      ctx.moveTo(ix + 30, iy + ih - 28);
      ctx.lineTo(ix + iw - 30, iy + ih - 28);
      ctx.lineTo(ix + iw - 35, iy + ih - 32);
      ctx.lineTo(ix + 35, iy + ih - 32);
      ctx.closePath();
      ctx.fill();

      // Grass tufts (small bumps)
      ctx.fillStyle = '#388E3C';
      for (let i = 0; i < 8; i++) {
        const gx = ix + 30 + (iw - 60) * (i / 7);
        ctx.beginPath();
        ctx.moveTo(gx, iy + ih - 32);
        ctx.lineTo(gx + 3, iy + ih - 36);
        ctx.lineTo(gx + 6, iy + ih - 32);
        ctx.closePath();
        ctx.fill();
      }

      // === Trees ===
      isl.trees.forEach((tree) => {
        const tx = ix + tree.x;
        const ty = iy + ih - 32 + tree.y;
        // Trunk
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(tx - 2, ty, 4, tree.size);
        // Foliage (triangle pine)
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(tx, ty - tree.size * 0.8);
        ctx.lineTo(tx + tree.size * 0.7, ty);
        ctx.lineTo(tx - tree.size * 0.7, ty);
        ctx.closePath();
        ctx.fill();
        // Foliage highlight
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.moveTo(tx, ty - tree.size * 0.8);
        ctx.lineTo(tx + tree.size * 0.3, ty - tree.size * 0.2);
        ctx.lineTo(tx - tree.size * 0.3, ty - tree.size * 0.2);
        ctx.closePath();
        ctx.fill();
      });

      // === Rocks ===
      isl.rocks.forEach((rock) => {
        const rx = ix + rock.x;
        const ry = iy + ih - 22 + rock.y;
        ctx.fillStyle = '#607D8B';
        ctx.beginPath();
        ctx.arc(rx, ry, rock.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#90A4AE';
        ctx.beginPath();
        ctx.arc(rx - rock.size * 0.3, ry - rock.size * 0.3, rock.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });

      // === If collected, show a +5W +3P floating text ===
      if (isl.collected && isl.life > 2300) {
        const age = 2400 - isl.life;
        ctx.font = 'bold 12px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        const txt = '+5W +3P';
        ctx.strokeText(txt, ix + iw / 2, iy - 10 - age * 0.15);
        ctx.fillStyle = '#FFD700';
        ctx.fillText(txt, ix + iw / 2, iy - 10 - age * 0.15);
        ctx.textAlign = 'start';
      }
    };

    const drawFish = (fish: Fish) => {
      const cx = fish.x + fish.width / 2;
      const cy = fish.y + fish.height / 2;
      const tailWag = Math.sin(fish.tailPhase) * (fish.height * 0.35);

      // Water ripple
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + fish.height * 0.6, fish.width / 2, fish.height * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glow for attached/onRaft fish (only if still has bites left)
      if ((fish.state === 'attached' || fish.state === 'onRaft') && fish.bitesLeft > 0) {
        const glowPulse = 0.3 + Math.sin(time * 0.1) * 0.15;
        ctx.fillStyle = `rgba(255, 220, 100, ${glowPulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(cx, cy, fish.width * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      // === ROTATION based on velocity ===
      let rotation = 0;
      if (fish.state === 'attached' || fish.state === 'onRaft') {
        // Face the direction the fish came from (attachFacing: 1 = right, -1 = left)
        rotation = fish.attachFacing >= 0 ? 0 : Math.PI;
      } else {
        const spd = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
        if (spd > 0.1) rotation = Math.atan2(fish.vy, fish.vx);
        else rotation = fish.facingRight ? 0 : Math.PI;
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      const hw = fish.width / 2;
      const hh = fish.height / 2;

      // === TAIL FIN (scaled to fish size) ===
      const tailSpread = hh * 1.1;
      const tailLen = hw * 0.35;
      ctx.fillStyle = fish.color;
      ctx.beginPath();
      ctx.moveTo(-hw + 2, 0);
      ctx.lineTo(-hw - tailLen, -tailSpread + tailWag);
      ctx.lineTo(-hw - tailLen * 1.3, tailWag);
      ctx.lineTo(-hw - tailLen, tailSpread + tailWag);
      ctx.closePath();
      ctx.fill();
      // Tail darker edge
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // === BODY (scaled ellipse) ===
      if (fish.isGolden) { const gGrad = ctx.createRadialGradient(0, -hh * 0.3, 0, 0, 0, hw * 1.2); gGrad.addColorStop(0, '#FFF8DC'); gGrad.addColorStop(0.4, '#FFD700'); gGrad.addColorStop(1, '#B8860B'); ctx.fillStyle = gGrad; } else { ctx.fillStyle = fish.color; }
      ctx.beginPath();
      ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
      ctx.fill();
      if (fish.isGolden) { ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2); ctx.stroke(); for (let gsp = 0; gsp < 3; gsp++) { const gAng = time * 0.05 + gsp * 2.09; ctx.fillStyle = 'rgba(255, 240, 150, ' + (0.7 + Math.sin(time * 0.1 + gsp) * 0.3) + ')'; ctx.beginPath(); ctx.arc(Math.cos(gAng) * hw * 1.3, Math.sin(gAng) * hh * 1.3, 1.5, 0, Math.PI * 2); ctx.fill(); } }

      // === BELLY (lighter bottom half) ===
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.ellipse(hw * 0.05, hh * 0.3, hw * 0.75, hh * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // === BACK STRIPE (darker top) ===
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, -hh * 0.5, hw * 0.85, hh * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // === SCALE TEXTURE (for medium & large fish only) ===
      if (fish.sizeCategory !== 'small') {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.lineWidth = 0.8;
        const scaleCount = fish.sizeCategory === 'large' ? 5 : 3;
        for (let row = 0; row < scaleCount; row++) {
          const sy = -hh * 0.4 + (hh * 0.8 / scaleCount) * row;
          const arcCount = Math.floor(hw * 0.9 / (hh * 0.3));
          for (let col = 0; col < arcCount; col++) {
            const sx = -hw * 0.6 + (hw * 1.2 / arcCount) * col + (row % 2) * (hw * 0.1);
            ctx.beginPath();
            ctx.arc(sx, sy, hh * 0.18, 0, Math.PI);
            ctx.stroke();
          }
        }
      }

      // === DORSAL FIN (scaled) ===
      const dorsalH = hh * 0.7;
      const dorsalW = hw * 0.55;
      ctx.fillStyle = fish.color;
      ctx.beginPath();
      ctx.moveTo(-dorsalW * 0.5, -hh + 1);
      ctx.quadraticCurveTo(-dorsalW * 0.1, -hh - dorsalH, dorsalW * 0.6, -hh + 1);
      ctx.closePath();
      ctx.fill();
      // Dorsal fin darker edge
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // === SIDE PECTORAL FIN (scaled) ===
      const pectW = hw * 0.35;
      const pectH = hh * 0.5;
      ctx.fillStyle = fish.color;
      ctx.beginPath();
      ctx.moveTo(-hw * 0.05, hh * 0.1);
      ctx.quadraticCurveTo(-hw * 0.05 - pectW, hh * 0.5, hw * 0.15, hh * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // === REALISTIC EYE (scaled, positioned properly) ===
      // Eye position: forward-top area of head
      const eyeX = hw * 0.48;
      const eyeY = -hh * 0.25;
      // Eye size scales but with caps (not too small/big)
      const eyeR = Math.max(1.6, Math.min(hh * 0.22, 3.5));
      
      // Socket shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, eyeR + 0.8, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye white (thin ring visible)
      ctx.fillStyle = '#F5F5F5';
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
      ctx.fill();
      
      // Iris (dark, most of visible area)
      ctx.fillStyle = '#0D0D0D';
      ctx.beginPath();
      ctx.arc(eyeX + eyeR * 0.15, eyeY, eyeR * 0.85, 0, Math.PI * 2);
      ctx.fill();
      
      // Shine (top-left highlight)
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.arc(eyeX - eyeR * 0.35, eyeY - eyeR * 0.4, eyeR * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // === GILL LINE (curved line behind eye) ===
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = Math.max(0.8, hh * 0.08);
      ctx.beginPath();
      ctx.moveTo(hw * 0.2, -hh * 0.5);
      ctx.quadraticCurveTo(hw * 0.15, 0, hw * 0.2, hh * 0.5);
      ctx.stroke();

      // === MOUTH (soft curve at the front) ===
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = Math.max(0.9, hh * 0.08);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hw * 0.92, -hh * 0.05);
      ctx.quadraticCurveTo(hw * 0.82, hh * 0.25, hw * 0.6, hh * 0.15);
      ctx.stroke();
      ctx.lineCap = 'butt';

      ctx.restore();

      // Outline
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, hw, hh, rotation, 0, Math.PI * 2);
      ctx.stroke();

      // Bites counter for attached fish
      if (fish.state === 'attached' || fish.state === 'onRaft') {
        ctx.fillStyle = 'rgba(255, 240, 100, 0.95)';
        ctx.font = 'bold ' + Math.max(10, fish.height * 0.7) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 2;
        ctx.strokeText('×' + fish.bitesLeft, cx, cy - fish.height * 1.1);
        ctx.fillText('×' + fish.bitesLeft, cx, cy - fish.height * 1.1);
      }
    };

    const drawFrog = (frog: Frog) => {
      const cx = frog.x + frog.width / 2;
      const cy = frog.y + frog.height / 2;
      const hopY = Math.sin(frog.hopPhase) * 2;

      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(cx, cy + 18, 18, 4, 0, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#1E8449';
      ctx.beginPath(); ctx.ellipse(cx - 16, cy + 10 + hopY, 8, 6, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 16, cy + 10 + hopY, 8, 6, 0.5, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#2C7A3D';
      ctx.beginPath(); ctx.ellipse(cx, cy + hopY, 18, 14, 0, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#5BA86C';
      ctx.beginPath(); ctx.ellipse(cx, cy + 3 + hopY, 11, 7, 0, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#1A5E2A';
      ctx.beginPath(); ctx.arc(cx - 9, cy - 3 + hopY, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 5, cy - 6 + hopY, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 11, cy + 1 + hopY, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx - 4, cy + 8 + hopY, 2, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#2C7A3D';
      ctx.beginPath(); ctx.arc(cx - 8, cy - 12 + hopY, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 8, cy - 12 + hopY, 6, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#F5F5DC';
      ctx.beginPath(); ctx.ellipse(cx - 8, cy - 12 + hopY, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 8, cy - 12 + hopY, 4, 3, 0, 0, Math.PI * 2); ctx.fill();

      const lookX = player.x > cx ? 1.5 : -1.5;
      ctx.fillStyle = '#8B0000';
      ctx.beginPath(); ctx.arc(cx - 8 + lookX, cy - 12 + hopY, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 8 + lookX, cy - 12 + hopY, 2.5, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
      ctx.beginPath(); ctx.arc(cx - 8 + lookX, cy - 12 + hopY, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 8 + lookX, cy - 12 + hopY, 4, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = '#0A2810';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - 13, cy - 19 + hopY); ctx.lineTo(cx - 4, cy - 16 + hopY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 13, cy - 19 + hopY); ctx.lineTo(cx + 4, cy - 16 + hopY); ctx.stroke();
      ctx.lineCap = 'butt';

      // === FROG MOUTH: closed by default, open when charging/firing ===
      const isFiring = frog.shootTimer < 25;
      if (isFiring) {
        // Mouth WIDE OPEN (charging poison)
        const openAmount = Math.min(1, (25 - frog.shootTimer) / 15);
        const mouthRadius = 5 + openAmount * 5;
        // Dark mouth interior
        ctx.fillStyle = '#2A0A0A';
        ctx.beginPath();
        ctx.arc(cx, cy + 8 + hopY, mouthRadius, 0, Math.PI * 2);
        ctx.fill();
        // Mouth rim
        ctx.strokeStyle = '#0A2810';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy + 8 + hopY, mouthRadius, 0, Math.PI * 2);
        ctx.stroke();
        // Tongue (small pink)
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.arc(cx, cy + 8 + hopY + 2, mouthRadius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        // Sharp teeth around the mouth
        ctx.fillStyle = '#FFFFFF';
        for (let t = 0; t < 5; t++) {
          const angle = Math.PI * 0.15 + (Math.PI * 0.7 / 4) * t;
          const tx = cx + Math.cos(angle) * mouthRadius;
          const ty = cy + 8 + hopY + Math.sin(angle) * mouthRadius;
          const nx = Math.cos(angle + Math.PI);
          const ny = Math.sin(angle + Math.PI);
          ctx.beginPath();
          ctx.moveTo(tx + Math.cos(angle + 1.4) * 2, ty + Math.sin(angle + 1.4) * 2);
          ctx.lineTo(tx + nx * 3, ty + ny * 3);
          ctx.lineTo(tx + Math.cos(angle - 1.4) * 2, ty + Math.sin(angle - 1.4) * 2);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // Mouth CLOSED (small frown)
        ctx.strokeStyle = '#0A2810';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy + 9 + hopY, 6, Math.PI + 0.4, -0.4);
        ctx.stroke();
        // Small fangs poking out (subtle)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(cx - 3, cy + 6 + hopY);
        ctx.lineTo(cx - 2, cy + 8 + hopY);
        ctx.lineTo(cx - 1, cy + 6 + hopY);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 1, cy + 6 + hopY);
        ctx.lineTo(cx + 2, cy + 8 + hopY);
        ctx.lineTo(cx + 3, cy + 6 + hopY);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = '#1E8449';
      ctx.beginPath(); ctx.arc(cx - 12, cy + 6 + hopY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 12, cy + 6 + hopY, 3, 0, Math.PI * 2); ctx.fill();

      if (frog.shootTimer < 20) {
        ctx.fillStyle = 'rgba(142, 68, 173, 0.8)';
        ctx.beginPath(); ctx.arc(cx, cy + hopY, 3 + (20 - frog.shootTimer) * 0.3, 0, Math.PI * 2); ctx.fill();
      }
    };

    const drawShark = (shark: Shark) => {
      const cx = shark.x + shark.width / 2;
      const cy = shark.y + shark.height / 2;
      const tailWave = Math.sin(shark.tailPhase) * 8;
      
      // Determine facing direction from velocity
      const angle = Math.atan2(shark.vy, shark.vx);
      const facingRight = shark.vx >= 0;

      // Water disturbance
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.ellipse(cx, cy + 20, 60, 6, 0, 0, Math.PI * 2); ctx.fill();

      ctx.save();
      ctx.translate(cx, cy);
      // Rotate only slightly based on vertical component (max ±30 degrees)
      const tilt = Math.max(-0.5, Math.min(0.5, shark.vy * 0.15));
      ctx.rotate(tilt);
      ctx.scale(facingRight ? 1 : -1, 1);

      // Now draw shark centered at (0, 0), head pointing right
      // Tail fin (left side)
      ctx.fillStyle = '#4A4A4A';
      ctx.beginPath();
      ctx.moveTo(-80, 0);
      ctx.lineTo(-100, tailWave - 15);
      ctx.lineTo(-100, tailWave + 15);
      ctx.closePath();
      ctx.fill();

      // Body
      ctx.fillStyle = '#5D6D7E';
      ctx.beginPath();
      ctx.moveTo(-80, 0);
      ctx.quadraticCurveTo(-40, -22, 50, -12);
      ctx.quadraticCurveTo(85, 0, 50, 12);
      ctx.quadraticCurveTo(-40, 22, -80, 0);
      ctx.closePath();
      ctx.fill();

      // Belly
      ctx.fillStyle = '#85929E';
      ctx.beginPath();
      ctx.moveTo(-60, 2);
      ctx.quadraticCurveTo(10, 12, 50, 8);
      ctx.quadraticCurveTo(10, 8, -60, 2);
      ctx.closePath();
      ctx.fill();

      // Dorsal fin (top)
      ctx.fillStyle = '#3D4A57';
      ctx.beginPath();
      ctx.moveTo(-10, -18);
      ctx.lineTo(10, -42);
      ctx.lineTo(30, -18);
      ctx.closePath();
      ctx.fill();

      // Pectoral fin (side)
      ctx.beginPath();
      ctx.moveTo(-20, 5);
      ctx.lineTo(-30, 25);
      ctx.lineTo(0, 12);
      ctx.closePath();
      ctx.fill();

      // Eye
      ctx.fillStyle = '#FFF';
      ctx.beginPath(); ctx.arc(50, -4, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(51, -4, 2.5, 0, Math.PI * 2); ctx.fill();

      // === SHARK MOUTH — closed by default, opens during bite/fire ===
      if (shark.mouthOpen > 0) {
        // Mouth WIDE OPEN
        const openAmt = Math.min(1, shark.mouthOpen / 40);
        const gape = 6 + openAmt * 14;
        
        // Dark mouth interior (big triangular void)
        ctx.fillStyle = '#1A0505';
        ctx.beginPath();
        ctx.moveTo(78, 0);
        ctx.lineTo(50, -gape * 0.6);
        ctx.lineTo(48, 0);
        ctx.lineTo(50, gape * 0.6);
        ctx.closePath();
        ctx.fill();
        
        // Tongue (pink inside)
        ctx.fillStyle = '#C0392B';
        ctx.beginPath();
        ctx.ellipse(58, gape * 0.15, 8, gape * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Upper teeth row
        ctx.fillStyle = '#FFF';
        for (let i = 0; i < 4; i++) {
          const tx = 52 + i * 8;
          const ty = -gape * 0.55 + i * 0.8;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx + 3, ty + 6);
          ctx.lineTo(tx + 6, ty);
          ctx.closePath();
          ctx.fill();
        }
        // Lower teeth row
        for (let i = 0; i < 4; i++) {
          const tx = 52 + i * 8;
          const ty = gape * 0.55 - i * 0.8;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx + 3, ty - 6);
          ctx.lineTo(tx + 6, ty);
          ctx.closePath();
          ctx.fill();
        }
        
        // Mouth rim (dark line around it)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(78, 0);
        ctx.lineTo(50, -gape * 0.6);
        ctx.moveTo(78, 0);
        ctx.lineTo(50, gape * 0.6);
        ctx.stroke();
        
        // Blood particles when biting
        if (shark.mouthOpen > 30) {
          ctx.fillStyle = 'rgba(200, 0, 0, 0.7)';
          for (let i = 0; i < 5; i++) {
            const bx = 55 + Math.random() * 20;
            const by = -10 + Math.random() * 20;
            ctx.beginPath();
            ctx.arc(bx, by, 1.5 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else {
        // Mouth CLOSED (subtle line)
        ctx.strokeStyle = '#2C3E50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(75, 3);
        ctx.quadraticCurveTo(60, 8, 40, 5);
        ctx.stroke();
        
        // Small fangs peeking out
        ctx.fillStyle = '#FFF';
        for (let i = 0; i < 3; i++) {
          const tx = 46 + i * 8;
          ctx.beginPath();
          ctx.moveTo(tx, 4);
          ctx.lineTo(tx + 2, 7);
          ctx.lineTo(tx + 4, 4);
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.restore();
    };

    const drawWood = (item: Item) => {
      ctx.save();
      ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
      ctx.rotate(item.rotation);
      const w = item.width; const h = item.height;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(2, 2, w / 2, h / 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = (typeof SKIN_MAP !== 'undefined' && activeSkin && SKIN_MAP[activeSkin]) ? SKIN_MAP[activeSkin].c : '#8B4513'; ctx.fillRect(-w / 2, -h / 3, w, h * 2 / 3);
      ctx.fillStyle = (typeof SKIN_MAP !== 'undefined' && activeSkin && SKIN_MAP[activeSkin]) ? SKIN_MAP[activeSkin].a : '#A0522D'; ctx.fillRect(-w / 2, -h / 3, w, h / 6);
      ctx.fillStyle = '#5D3A0F'; ctx.fillRect(-w / 2, h / 6, w, h / 6);
      ctx.strokeStyle = '#5D3A0F'; ctx.lineWidth = 1;
      for (let i = -w / 2 + 4; i < w / 2; i += 6) {
        ctx.beginPath(); ctx.moveTo(i, -h / 3 + 2); ctx.lineTo(i + 2, h / 3 - 2); ctx.stroke();
      }
      ctx.fillStyle = '#D2B48C'; ctx.beginPath(); ctx.ellipse(-w / 2 + 1, 0, 3, h / 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#C4A57B'; ctx.beginPath(); ctx.ellipse(w / 2 - 1, 0, 2, h / 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const drawPlastic = (item: Item) => {
      ctx.save();
      ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
      ctx.rotate(item.rotation);
      const w = item.width; const h = item.height;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(2, 2, w / 2.5, h / 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#D6EAF8'; ctx.fillRect(-w / 4, -h / 3, w / 2, h * 5 / 6);
      ctx.fillStyle = '#EBF5FB'; ctx.fillRect(-w / 4 + 2, -h / 3 + 2, 4, h * 5 / 6 - 4);
      ctx.fillStyle = '#A9CCE3'; ctx.fillRect(w / 4 - 4, -h / 3, 4, h * 5 / 6);
      ctx.fillStyle = '#D6EAF8'; ctx.fillRect(-w / 8, -h / 2, w / 4, h / 6);
      ctx.fillStyle = '#3498DB'; ctx.fillRect(-w / 8 - 1, -h / 2 - 2, w / 4 + 2, 4);
      ctx.fillStyle = '#F39C12'; ctx.fillRect(-w / 4, -h / 8, w / 2, h / 5);
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-w / 4 + 3, -h / 8 + 3, w / 2 - 6, 2); ctx.fillRect(-w / 4 + 3, -h / 8 + 7, w / 2 - 10, 2);
      ctx.strokeStyle = '#5D6D7E'; ctx.lineWidth = 1;
      ctx.strokeRect(-w / 4, -h / 3, w / 2, h * 5 / 6); ctx.strokeRect(-w / 8, -h / 2, w / 4, h / 6);
      ctx.restore();
    };

    const drawVerticalRaft = (rx: number, ry: number, rw: number, rh: number) => {
      const raftLevel = Math.max(1, Math.floor((rh - 150) / 40) + 1);
      // RAFT LEVEL BADGE
      if (raftLevel >= 2) {
        const _lvX = rx + rw / 2;
        const _lvY = ry - 12;
        ctx.font = 'bold 9px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText('LV ' + raftLevel, _lvX, _lvY);
        const _lvColor = raftLevel >= 5 ? '#FFD700' : raftLevel >= 4 ? '#E74C3C' : raftLevel >= 3 ? '#3498DB' : '#2ECC71';
        ctx.fillStyle = _lvColor;
        ctx.fillText('LV ' + raftLevel, _lvX, _lvY);
        ctx.textAlign = 'start';
      }
      ctx.save();
      ctx.translate(rx + rw / 2, ry + rh / 2);
      ctx.rotate(raftTilt);
      ctx.translate(-(rx + rw / 2), -(ry + rh / 2));

      // ============ WAKE SYSTEM AROUND RAFT ============
      
      // 1. BOW WAVE (at TOP, in front of raft) — water pushed forward
      const bowY = ry - 8;
      // Layered V shape growing outward
      for (let layer = 0; layer < 3; layer++) {
        const size = 30 + layer * 20;
        const alpha = 0.75 - layer * 0.2;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 3 - layer * 0.5;
        ctx.beginPath();
        ctx.moveTo(rx + rw / 2 - size, bowY - layer * 8);
        ctx.quadraticCurveTo(rx + rw / 2, bowY - 18 - layer * 6, rx + rw / 2 + size, bowY - layer * 8);
        ctx.stroke();
      }

      // Bow foam splash (bright white water pushed up at front)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.ellipse(rx + rw / 2, ry - 2, rw / 2 + 4, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. MAIN RAFT BODY
      // Shadow under raft (below it)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(rx + rw / 2 + 5, ry + rh + 3, rw / 2 + 6, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // === FLOOR EXTENSIONS (widens the raft) ===
      const _floors = (typeof window !== 'undefined' ? window.__floorsRef : 0) || 0;
      const _walls = (typeof window !== 'undefined' ? window.__wallsRef : 0) || 0;
      const _roofs = (typeof window !== 'undefined' ? window.__roofsRef : 0) || 0;
      
      if (_floors > 0) {
        ctx.fillStyle = '#7A3B10';
        ctx.fillRect(rx - 10 * _floors, ry + 5, 10 * _floors, rh - 10);
        ctx.fillRect(rx + rw, ry + 5, 10 * _floors, rh - 10);
        ctx.strokeStyle = '#5D3A0F';
        ctx.lineWidth = 1;
        for (let f = 0; f < _floors; f++) {
          ctx.beginPath(); ctx.moveTo(rx - 10 * (f + 1), ry + 5); ctx.lineTo(rx - 10 * (f + 1), ry + rh - 5); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(rx + rw + 10 * (f + 1), ry + 5); ctx.lineTo(rx + rw + 10 * (f + 1), ry + rh - 5); ctx.stroke();
        }
      }

      // Main raft body
      const sk = SKIN_MAP[activeSkin] || SKIN_MAP['default'];
      ctx.fillStyle = sk.c;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.fillStyle = sk.a;
      ctx.fillRect(rx + 5, ry + 5, rw - 10, rh - 10);

      ctx.strokeStyle = '#6B3410';
      ctx.lineWidth = 2;
      for (let i = 15; i < rh - 10; i += 18) {
        ctx.beginPath(); ctx.moveTo(rx + 5, ry + i); ctx.lineTo(rx + rw - 5, ry + i); ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(93, 58, 15, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 12; i < rw - 10; i += 14) {
        ctx.beginPath(); ctx.moveTo(rx + i, ry + 5); ctx.lineTo(rx + i, ry + rh - 5); ctx.stroke();
      }

      ctx.strokeStyle = '#C4A57B';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(rx - 2, ry + rh * 0.25); ctx.lineTo(rx + rw + 2, ry + rh * 0.25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rx - 2, ry + rh * 0.75); ctx.lineTo(rx + rw + 2, ry + rh * 0.75); ctx.stroke();

      // CAMPFIRE ON RAFT
      const _hasCampfireDraw = (typeof window !== 'undefined' ? window.__hasCampfireRef : false);
      if (_hasCampfireDraw) {
        const _fx = rx + 15;
        const _fy = ry + rh - 15;
        const _flicker = 0.85 + Math.sin(time * 0.3) * 0.15;
        const _flicker2 = 0.9 + Math.sin(time * 0.47) * 0.1;
        const _glow = ctx.createRadialGradient(_fx, _fy, 2, _fx, _fy, 55);
        _glow.addColorStop(0, 'rgba(255, 220, 120, ' + (0.6 * _flicker) + ')');
        _glow.addColorStop(1, 'rgba(255, 140, 30, 0)');
        ctx.fillStyle = _glow;
        ctx.beginPath(); ctx.arc(_fx, _fy, 55, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5D3A0F';
        ctx.save(); ctx.translate(_fx, _fy); ctx.rotate(0.5);
        ctx.fillRect(-9, -2, 18, 4); ctx.rotate(-1.0); ctx.fillRect(-9, -2, 18, 4);
        ctx.restore();
        ctx.fillStyle = 'rgba(255, 90, 20, ' + (0.9 * _flicker) + ')';
        ctx.beginPath(); ctx.moveTo(_fx - 6, _fy - 2);
        ctx.quadraticCurveTo(_fx - 4, _fy - 14 * _flicker2, _fx, _fy - 18 * _flicker);
        ctx.quadraticCurveTo(_fx + 4, _fy - 14 * _flicker2, _fx + 6, _fy - 2);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255, 170, 40, ' + (0.9 * _flicker2) + ')';
        ctx.beginPath(); ctx.moveTo(_fx - 4, _fy - 2);
        ctx.quadraticCurveTo(_fx - 2, _fy - 10 * _flicker, _fx, _fy - 13 * _flicker2);
        ctx.quadraticCurveTo(_fx + 2, _fy - 10 * _flicker, _fx + 4, _fy - 2);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255, 240, 180, ' + _flicker + ')';
        ctx.beginPath(); ctx.moveTo(_fx - 2, _fy - 2);
        ctx.quadraticCurveTo(_fx - 1, _fy - 6 * _flicker2, _fx, _fy - 8 * _flicker);
        ctx.quadraticCurveTo(_fx + 1, _fy - 6 * _flicker2, _fx + 2, _fy - 2);
        ctx.closePath(); ctx.fill();
        for (let _sp = 0; _sp < 3; _sp++) {
          const _spAge = (time * 2 + _sp * 30) % 60;
          const _spY = _fy - 10 - _spAge * 0.4;
          const _spA = 1 - _spAge / 60;
          ctx.fillStyle = 'rgba(255, 200, 80, ' + _spA + ')';
          ctx.beginPath(); ctx.arc(_fx + Math.sin(time * 0.1 + _sp) * 3, _spY, 1, 0, Math.PI * 2); ctx.fill();
        }
      }

      ctx.strokeStyle = '#5D3A0F';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ry, rw, rh);

      // 3. SIDE FOAM STREAMS — water rushing past left and right sides
      // Two parallel vertical streams on each side, animated to slide downward
      const streamSlide = (time * 1.8) % 40;
      for (let side = -1; side <= 1; side += 2) {
        for (let s = 0; s < 2; s++) {
          const streamX = rx + rw / 2 + side * (rw / 2 + 6 + s * 8);
          // Draw 5 segments that slide down
          for (let seg = 0; seg < 5; seg++) {
            const segY = ry + ((seg * 40 + streamSlide) % (rh + 40)) - 20;
            if (segY < ry - 10 || segY > ry + rh + 10) continue;
            const alpha = 0.55 - s * 0.15 - seg * 0.05;
            if (alpha < 0.05) continue;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 3 - s * 0.8;
            ctx.beginPath();
            ctx.moveTo(streamX, segY);
            ctx.quadraticCurveTo(streamX + side * 4, segY + 8, streamX, segY + 16);
            ctx.stroke();
          }
        }
      }

      // 4. TURBULENCE — small white bubbles around the raft edges
      for (let b = 0; b < 8; b++) {
        const bubbleSide = b % 2 === 0 ? -1 : 1;
        const bubbleY = ry + 8 + ((b * 25 + (time * 1.5)) % (rh - 16));
        const bubbleX = rx + rw / 2 + bubbleSide * (rw / 2 + 10 + Math.sin(time * 0.1 + b) * 3);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, 2 + Math.sin(time * 0.15 + b) * 1, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // 5. TRAILING V-WAKE (behind raft, extends DOWNWARD) — multiple layered V's
      const wakeX = rx + rw / 2;
      for (let layer = 0; layer < 5; layer++) {
        const layerY = ry + rh + 10 + layer * 18;
        const spread = 20 + layer * 15;
        const alpha = 0.65 - layer * 0.11;
        if (alpha < 0.05) continue;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 3 - layer * 0.4;
        ctx.beginPath();
        ctx.moveTo(wakeX - spread, layerY);
        ctx.quadraticCurveTo(wakeX, layerY + 10, wakeX + spread, layerY);
        ctx.stroke();
      }

      // 6. Central vertical foam trail behind raft (extends straight down)
      const trailLen = 40 + (time * 0.5) % 30;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(wakeX, ry + rh + 8);
      ctx.lineTo(wakeX, ry + rh + 8 + trailLen);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawPlayer = (px: number, py: number, state: string) => {
      if (invulnerabilityTimer > 0 && invulnerabilityTimer % 10 < 5) return;
      const skin = '#FAD7A1'; const skinShadow = '#E5C088';
      const hair = '#5D4037'; const shirt = '#3498DB'; const shirtShadow = '#2471A3';
      const pants = '#2C3E50'; const shoe = '#1A1A1A'; const outline = '#1A1A1A';
      const armSwing = isWalking ? Math.sin(walkCycle) * 4 : 0;

      if (state === 'standing') {
        ctx.fillStyle = outline; ctx.fillRect(px + 4, py + 50, 14, 30); ctx.fillRect(px + 22, py + 50, 14, 30);
        ctx.fillStyle = pants; ctx.fillRect(px + 6, py + 52, 10, 26); ctx.fillRect(px + 24, py + 52, 10, 26);
        ctx.fillStyle = outline; ctx.fillRect(px + 2, py + 76, 18, 6); ctx.fillRect(px + 20, py + 76, 18, 6);
        ctx.fillStyle = shoe; ctx.fillRect(px + 4, py + 78, 16, 4); ctx.fillRect(px + 22, py + 78, 16, 4);
        ctx.fillStyle = outline; ctx.fillRect(px + 4, py + 24, 32, 30);
        ctx.fillStyle = shirt; ctx.fillRect(px + 6, py + 26, 28, 26);
        ctx.fillStyle = shirtShadow; ctx.fillRect(px + 6, py + 26, 28, 4);
        ctx.fillStyle = outline; ctx.fillRect(px - 4, py + 26 + armSwing, 12, 24);
        ctx.fillStyle = skin; ctx.fillRect(px - 2, py + 28 + armSwing, 8, 20);
        ctx.fillStyle = skinShadow; ctx.fillRect(px - 2, py + 46 + armSwing, 8, 6);
        ctx.fillStyle = outline; ctx.fillRect(px + 32, py + 26 - armSwing, 12, 24);
        ctx.fillStyle = skin; ctx.fillRect(px + 34, py + 28 - armSwing, 8, 20);
        ctx.fillStyle = skinShadow; ctx.fillRect(px + 34, py + 46 - armSwing, 8, 6);
        ctx.fillStyle = skinShadow; ctx.fillRect(px + 16, py + 22, 8, 4);
        ctx.fillStyle = outline; ctx.fillRect(px + 8, py + 4, 24, 22);
        ctx.fillStyle = skin; ctx.fillRect(px + 10, py + 6, 20, 18);
        ctx.fillStyle = hair; ctx.fillRect(px + 6, py, 28, 12);
        ctx.fillRect(px + 6, py + 6, 6, 10); ctx.fillRect(px + 28, py + 6, 6, 10);
        ctx.fillStyle = '#FFF'; ctx.fillRect(px + 14, py + 12, 6, 6); ctx.fillRect(px + 22, py + 12, 6, 6);
        ctx.fillStyle = '#000'; ctx.fillRect(px + 16, py + 14, 3, 4); ctx.fillRect(px + 23, py + 14, 3, 4);
        ctx.fillStyle = skinShadow; ctx.fillRect(px + 17, py + 21, 8, 2);
      } 
      else if (state === 'sitting') {
        ctx.fillStyle = outline; ctx.fillRect(px + 6, py + 54, 14, 14); ctx.fillStyle = pants; ctx.fillRect(px + 8, py + 56, 10, 10);
        ctx.fillStyle = outline; ctx.fillRect(px + 4, py + 66, 14, 14); ctx.fillStyle = pants; ctx.fillRect(px + 6, py + 68, 10, 10);
        ctx.fillStyle = outline; ctx.fillRect(px + 2, py + 78, 18, 6); ctx.fillStyle = shoe; ctx.fillRect(px + 4, py + 80, 14, 4);
        ctx.fillStyle = outline; ctx.fillRect(px + 22, py + 54, 14, 14); ctx.fillStyle = pants; ctx.fillRect(px + 24, py + 56, 10, 10);
        ctx.fillStyle = outline; ctx.fillRect(px + 24, py + 66, 14, 14); ctx.fillStyle = pants; ctx.fillRect(px + 26, py + 68, 10, 10);
        ctx.fillStyle = outline; ctx.fillRect(px + 22, py + 78, 18, 6); ctx.fillStyle = shoe; ctx.fillRect(px + 24, py + 80, 14, 4);
        ctx.fillStyle = outline; ctx.fillRect(px + 4, py + 28, 32, 28);
        ctx.fillStyle = shirt; ctx.fillRect(px + 6, py + 30, 28, 24);
        ctx.fillStyle = shirtShadow; ctx.fillRect(px + 6, py + 30, 28, 4);
        ctx.fillStyle = outline; ctx.fillRect(px - 4, py + 30, 12, 22); ctx.fillRect(px + 32, py + 30, 12, 22);
        ctx.fillStyle = skin; ctx.fillRect(px - 2, py + 32, 8, 18); ctx.fillRect(px + 34, py + 32, 8, 18);
        ctx.fillStyle = skinShadow; ctx.fillRect(px - 2, py + 48, 8, 6); ctx.fillRect(px + 34, py + 48, 8, 6);
        ctx.fillStyle = skinShadow; ctx.fillRect(px + 16, py + 26, 8, 4);
        ctx.fillStyle = outline; ctx.fillRect(px + 8, py + 8, 24, 22);
        ctx.fillStyle = skin; ctx.fillRect(px + 10, py + 10, 20, 18);
        ctx.fillStyle = hair; ctx.fillRect(px + 6, py + 4, 28, 12);
        ctx.fillRect(px + 6, py + 10, 6, 10); ctx.fillRect(px + 28, py + 10, 6, 10);
        ctx.fillStyle = '#FFF'; ctx.fillRect(px + 14, py + 16, 6, 6); ctx.fillRect(px + 22, py + 16, 6, 6);
        ctx.fillStyle = '#000'; ctx.fillRect(px + 16, py + 18, 3, 4); ctx.fillRect(px + 23, py + 18, 3, 4);
        ctx.fillStyle = skinShadow; ctx.fillRect(px + 17, py + 25, 8, 2);
      }
      else if (state === 'laying') {
        const cx = px + player.width / 2;
        ctx.fillStyle = outline; ctx.fillRect(cx - 18, py + 90, 14, 40); ctx.fillRect(cx + 4, py + 90, 14, 40);
        ctx.fillStyle = pants; ctx.fillRect(cx - 16, py + 92, 10, 36); ctx.fillRect(cx + 6, py + 92, 10, 36);
        ctx.fillStyle = outline; ctx.fillRect(cx - 20, py + 126, 18, 8); ctx.fillRect(cx + 2, py + 126, 18, 8);
        ctx.fillStyle = shoe; ctx.fillRect(cx - 18, py + 128, 14, 4); ctx.fillRect(cx + 4, py + 128, 14, 4);
        ctx.fillStyle = outline; ctx.fillRect(cx - 18, py + 50, 36, 42);
        ctx.fillStyle = shirt; ctx.fillRect(cx - 16, py + 52, 32, 38);
        ctx.fillStyle = shirtShadow; ctx.fillRect(cx - 16, py + 52, 32, 4);
        ctx.fillStyle = outline; ctx.fillRect(cx - 30, py + 56, 14, 36); ctx.fillRect(cx + 16, py + 56, 14, 36);
        ctx.fillStyle = skin; ctx.fillRect(cx - 28, py + 58, 10, 32); ctx.fillRect(cx + 18, py + 58, 10, 32);
        ctx.fillStyle = skinShadow; ctx.fillRect(cx - 28, py + 88, 10, 6); ctx.fillRect(cx + 18, py + 88, 10, 6);
        ctx.fillStyle = skinShadow; ctx.fillRect(cx - 6, py + 44, 12, 8);
        ctx.fillStyle = outline; ctx.fillRect(cx - 16, py + 14, 32, 30);
        ctx.fillStyle = skin; ctx.fillRect(cx - 14, py + 16, 28, 26);
        ctx.fillStyle = hair; ctx.fillRect(cx - 18, py + 6, 36, 14);
        ctx.fillRect(cx - 18, py + 14, 6, 20); ctx.fillRect(cx + 12, py + 14, 6, 20);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - 10, py + 28); ctx.lineTo(cx - 3, py + 28); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 3, py + 28); ctx.lineTo(cx + 10, py + 28); ctx.stroke();
        ctx.fillStyle = skinShadow; ctx.fillRect(cx - 5, py + 36, 10, 2);
      }
    };

    const drawKraken = (kr: Kraken) => {
      const kx = kr.x; const ky = kr.y;
      const wobble = Math.sin(time * 0.08) * 8;
      const isHit = kr.hitFlash > 0;
      const bodyColor = isHit ? '#FF6B6B' : '#5D3A9C';
      const darkColor = isHit ? '#B71C1C' : '#3A2258';
      ctx.fillStyle = 'rgba(200, 230, 255, 0.5)';
      ctx.beginPath(); ctx.ellipse(kx, ky + 40, 100, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = bodyColor;
      ctx.beginPath(); ctx.ellipse(kx, ky, 55, 70, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = darkColor;
      ctx.beginPath(); ctx.ellipse(kx, ky + 15, 45, 50, 0, 0, Math.PI * 2); ctx.fill();
      for (let ti = 0; ti < 4; ti++) {
        const side = ti < 2 ? -1 : 1; const ti2 = ti % 2;
        const baseY = ky + 10 + ti2 * 25;
        ctx.strokeStyle = bodyColor; ctx.lineWidth = 10 - ti2 * 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(kx + side * 40, baseY);
        ctx.bezierCurveTo(kx + side * (70 + ti2 * 10), baseY + 10 + wobble, kx + side * (55 + ti2 * 5), baseY + 40 + wobble, kx + side * (80 + ti2 * 10), baseY + 60 + wobble * 0.5);
        ctx.stroke();
      }
      ctx.strokeStyle = bodyColor; ctx.lineWidth = 14;
      ctx.beginPath(); ctx.moveTo(kx - 8, ky + 40); ctx.bezierCurveTo(kx - 15, ky + 70, kx - 5 + wobble * 0.3, ky + 90, kx + 5, ky + 110); ctx.stroke();
      ctx.fillStyle = '#FFF';
      ctx.beginPath(); ctx.ellipse(kx - 20, ky - 10, 12, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(kx + 20, ky - 10, 12, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#E74C3C';
      ctx.beginPath(); ctx.arc(kx - 22, ky - 6, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(kx + 18, ky - 6, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(kx - 22, ky - 6, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(kx + 18, ky - 6, 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(kx - 32, ky - 28); ctx.lineTo(kx - 10, ky - 22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(kx + 32, ky - 28); ctx.lineTo(kx + 10, ky - 22); ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.moveTo(kx - 8, ky + 25); ctx.lineTo(kx, ky + 40); ctx.lineTo(kx + 8, ky + 25); ctx.closePath(); ctx.fill();
      const barW = 120; const barH = 10;
      const barX = kx - barW / 2; const barY = ky - 100;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
      ctx.fillStyle = '#333'; ctx.fillRect(barX, barY, barW, barH);
      const hpW = (kr.hp / kr.maxHp) * barW;
      const hpColor = kr.hp > 3 ? '#2ECC71' : kr.hp > 1 ? '#F39C12' : '#E74C3C';
      ctx.fillStyle = hpColor; ctx.fillRect(barX, barY, hpW, barH);
      ctx.font = 'bold 12px "Press Start 2P", monospace'; ctx.textAlign = 'center';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.strokeText('KRAKEN', kx, barY - 8);
      ctx.fillStyle = '#9C27B0'; ctx.fillText('KRAKEN', kx, barY - 8);
      ctx.textAlign = 'start';
    };

    // RAFT-108: compact health bar shown above enemies while damaged.
    const drawEnemyHealthBar = (x: number, y: number, width: number, hp: number, maxHp: number, color: string) => {
      const w = Math.max(24, width * 0.6);
      const bx = x + (width - w) / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(bx - 1, y - 1, w + 2, 6);
      ctx.fillStyle = '#333'; ctx.fillRect(bx, y, w, 4);
      ctx.fillStyle = color; ctx.fillRect(bx, y, w * Math.max(0, Math.min(1, hp / maxHp)), 4);
    };

    const draw = () => {
      ctx.clearRect(0, 0, 800, 600);

      // Wave streaks moving UP
      waveStreaks.forEach((streak) => {
        ctx.strokeStyle = `rgba(200, 235, 255, ${streak.alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= streak.length; i += 4) {
          const y = streak.y + i;
          const x = streak.x + Math.sin((i / streak.length) * Math.PI * 3 + streak.phase) * streak.width;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 255, ${streak.alpha * 1.3})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i <= streak.length * 0.4; i += 4) {
          const y = streak.y + i;
          const x = streak.x + Math.sin((i / streak.length) * Math.PI * 3 + streak.phase) * streak.width - 2;
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
      islands.forEach((isl) => { if (!isl.collected) drawIsland(isl); });
      chests.forEach((ch) => drawChest(ch));

      items.forEach((item) => {
        // RAFT-403: rare loot glows so it reads as a bonus at a glance.
        if (item.rare) {
          ctx.save();
          ctx.globalAlpha = 0.55 + 0.25 * Math.sin(time * 0.15);
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width * 0.95, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        if (item.type === 'wood') drawWood(item);
        else drawPlastic(item);
      });

      frogs.forEach((frog) => drawFrog(frog));

      projectiles.forEach((proj) => {
        ctx.fillStyle = 'rgba(142, 68, 173, 0.3)';
        ctx.beginPath(); ctx.arc(proj.x, proj.y, proj.size + 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8E44AD';
        ctx.beginPath(); ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#BB8FCE';
        ctx.beginPath(); ctx.arc(proj.x - 2, proj.y - 2, proj.size / 3, 0, Math.PI * 2); ctx.fill();
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
      if ((typeof window !== 'undefined' ? window.__hasRodRef : false) && playerStateRef.current === 'standing') {
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
        ctx.ellipse(rp.x - rp.size * 0.3, rp.y - rp.size * 0.2, rp.size * 0.3, rp.size * 0.2, 0, 0, Math.PI * 2);
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

      if ((typeof window !== 'undefined' ? window.__hasSpearRef : false) && attackTimer > 15) {
        ctx.strokeStyle = '#D2691E'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(player.x + player.width, player.y + player.height / 2); ctx.lineTo(player.x + player.width + 60, player.y + player.height / 2); ctx.stroke();
        ctx.fillStyle = '#AAAAAA'; ctx.fillRect(player.x + player.width + 60, player.y + player.height / 2 - 4, 12, 8);
      }

      if (isRaining) {
        const rA = 0.75 + darkness * 0.25; ctx.strokeStyle = darkness > 0.3 ? 'rgba(255, 255, 255, ' + rA + ')' : 'rgba(200, 220, 255, ' + rA + ')'; ctx.lineWidth = 1.8;
        raindrops.forEach((drop) => { ctx.beginPath(); ctx.moveTo(drop.x, drop.y); ctx.lineTo(drop.x, drop.y + drop.length); ctx.stroke(); drop.y += drop.speed; if (drop.y > 600) { drop.y = -20; drop.x = Math.random() * 800; } });
      }

      ctx.fillStyle = `rgba(0, 0, 20, ${darkness * 0.75})`; ctx.fillRect(0, 0, 800, 600);
      if (lightningFlash > 0) { ctx.fillStyle = `rgba(255, 255, 255, ${lightningFlash})`; ctx.fillRect(0, 0, 800, 600); }
      if (isInWater) { ctx.fillStyle = 'rgba(255, 0, 0, 0.15)'; ctx.fillRect(0, 0, 800, 600); }

      // Draw clouds
      for (let _ci = 0; _ci < clouds.length; _ci++) { if (clouds[_ci].alpha > 0.03) drawCloud(clouds[_ci]); }

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
        const arcX = isDay ? (680 - arcT * 560) : (120 + arcT * 560);
        // Goes DOWN then UP (visually arcs like a hill) — peaks at top
        // arcT 0 = top-left, 0.5 = middle-lowest, 1.0 = top-right
        const arcY = 15 + Math.sin(arcT * Math.PI) * 85;

        // Only show if not raining
        if (!isRaining) {
          if (isDay) {
            // === SUN ===
            // Outer glow
            const sunGlow = ctx.createRadialGradient(arcX, arcY, 3, arcX, arcY, 50);
            sunGlow.addColorStop(0, "rgba(255, 240, 150, 0.55)");
            sunGlow.addColorStop(0.4, "rgba(255, 210, 100, 0.28)");
            sunGlow.addColorStop(1, "rgba(255, 180, 80, 0)");
            ctx.fillStyle = sunGlow;
            ctx.beginPath();
            ctx.arc(arcX, arcY, 50, 0, Math.PI * 2);
            ctx.fill();

            // Sun body
            ctx.fillStyle = "#FFEB99";
            ctx.beginPath();
            ctx.arc(arcX, arcY, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#FFD700";
            ctx.beginPath();
            ctx.arc(arcX, arcY, 12, 0, Math.PI * 2);
            ctx.fill();

            // Sun rays (rotating)
            ctx.strokeStyle = "rgba(255, 220, 100, 0.7)";
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
            moonGlow.addColorStop(0, "rgba(220, 235, 255, 0.45)");
            moonGlow.addColorStop(0.5, "rgba(180, 210, 255, 0.2)");
            moonGlow.addColorStop(1, "rgba(150, 180, 255, 0)");
            ctx.fillStyle = moonGlow;
            ctx.beginPath();
            ctx.arc(arcX, arcY, 45, 0, Math.PI * 2);
            ctx.fill();

            // Moon body
            ctx.fillStyle = "#F5F8FF";
            ctx.beginPath();
            ctx.arc(arcX, arcY, 14, 0, Math.PI * 2);
            ctx.fill();

            // Crescent shadow
            ctx.fillStyle = "rgba(20, 25, 55, 0.92)";
            ctx.beginPath();
            ctx.arc(arcX + 6, arcY - 2, 12, 0, Math.PI * 2);
            ctx.fill();

            // Craters (small dots on the moon surface)
            ctx.fillStyle = "rgba(180, 190, 210, 0.5)";
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
            const size = (i % 7 === 0) ? 2 : 1;
            const alpha = starAlpha * (0.4 + twinkle * 0.6);
            ctx.fillStyle = "rgba(255, 255, 240, " + alpha + ")";
            ctx.fillRect(sx, sy, size, size);
            // Cross-sparkle for the biggest stars
            if (i % 11 === 0) {
              ctx.fillStyle = "rgba(255, 255, 255, " + (alpha * 0.6) + ")";
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
          if (_sf.y > 600) { _sf.y = -10; _sf.x = Math.random() * 800; }
          if (_sf.x < 0) _sf.x = 800;
          if (_sf.x > 800) _sf.x = 0;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath(); ctx.arc(_sf.x, _sf.y, _sf.size, 0, Math.PI * 2); ctx.fill();
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
          ctx.strokeStyle = 'rgba(255, 220, 150, ' + (0.08 + Math.sin(time * 0.05 + _hi) * 0.04) + ')';
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
        ctx.fillStyle = 'rgba(8, 12, 35, ' + (darkness * 0.5) + ')';
        ctx.fillRect(0, 0, 800, 600);

      // CAMPFIRE LIGHT PIERCES NIGHT DARKNESS
      const _hasFireL = (typeof window !== 'undefined' ? window.__hasCampfireRef : false);
      if (_hasFireL && darkness > 0.05) {
        const _rlx = raftRef.current.x + raftBobX + 15;
        const _rly = getRaftScreenY() + raftRef.current.height - 15;
        const _lightR = 150 + Math.sin(time * 0.2) * 15;
        const _la = darkness * 0.7;
        const _lightGrad = ctx.createRadialGradient(_rlx, _rly, 8, _rlx, _rly, _lightR);
        _lightGrad.addColorStop(0, 'rgba(255, 220, 140, ' + _la + ')');
        _lightGrad.addColorStop(0.4, 'rgba(255, 180, 90, ' + (_la * 0.6) + ')');
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
          const bX = (s2 * 137 + 41) % 780 + 10;
          const bY = (s2 * 219 + 73) % 260 + 10;
          const sDrift2 = ((time * 0.1 + s2 * 25) % 900) * 0.1;
          const sX = (bX + sDrift2) % 800;
          const sY = bY;
          const twinkle2 = Math.sin(time * 0.07 + s2 * 1.7) * 0.5 + 0.5;
          const size2 = (s2 % 6 === 0) ? 1.5 : 1;
          const sAlpha2 = starFade2 * (0.5 + twinkle2 * 0.5);
          ctx.fillStyle = 'rgba(255, 255, 255, ' + sAlpha2 + ')';
          ctx.fillRect(sX, sY, size2, size2);
          if (s2 % 15 === 0) {
            ctx.fillStyle = 'rgba(220, 230, 255, ' + (sAlpha2 * 0.6) + ')';
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
        ctx.fillStyle = 'rgba(200, 210, 220, ' + (fogIntensity * 0.5) + ')';
        ctx.fillRect(0, 0, 800, 600);
      }

      // FPS DISPLAY (only if enabled in settings)
      if (typeof window !== 'undefined' && window.__showFps) {
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
        ctx.beginPath(); ctx.arc(cx, cy, 25 + (30 - damageFlash), 0, Math.PI * 2); ctx.fill();
      }

      // RAFT-108: floating damage numbers.
      ctx.textAlign = 'center';
      ctx.font = 'bold 14px "Press Start 2P", monospace';
      for (const dn of damageNumbers) {
        ctx.globalAlpha = Math.min(1, dn.life / 30);
        const shown = String(Math.round(dn.value * 10) / 10);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.strokeText(shown, dn.x, dn.y);
        ctx.fillStyle = dn.color; ctx.fillText(shown, dn.x, dn.y);
      }
      ctx.globalAlpha = 1;

      // RAFT-103: floating loot icons (already auto-collected into stats).
      for (const d of lootDrops) {
        ctx.globalAlpha = Math.min(1, d.life / 30);
        ctx.font = '16px serif';
        ctx.fillText(d.type === 'wood' ? '🪵' : d.type === 'plastic' ? '🧴' : '🐟', d.x, d.y);
        ctx.font = 'bold 10px "Press Start 2P", monospace';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText('+' + d.amount, d.x, d.y - 14);
        ctx.fillStyle = '#FFF'; ctx.fillText('+' + d.amount, d.x, d.y - 14);
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'start';

      // RAFT-108: shark health bar (kraken draws its own).
      if (shark && shark.health < shark.maxHealth) {
        drawEnemyHealthBar(shark.x, shark.y - 12, shark.width, shark.health, shark.maxHealth, '#E74C3C');
      }

      // RAFT-201/202: draw placed structures + the build-mode ghost preview.
      for (const t of buildGridRef.current.tiles) {
        const w = cellToWorld(t.col, t.row);
        ctx.globalAlpha = 0.35 + 0.65 * (t.hp / t.maxHp);
        if (t.kind === 'wall') {
          ctx.fillStyle = '#A9702F';
          ctx.fillRect(w.x + 3, w.y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
          ctx.strokeStyle = '#6B4419'; ctx.lineWidth = 2;
          ctx.strokeRect(w.x + 3, w.y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
        } else if (t.kind === 'floor') {
          ctx.fillStyle = '#C08040';
          ctx.fillRect(w.x, w.y, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#8B5A2B'; ctx.lineWidth = 1;
          ctx.strokeRect(w.x, w.y, TILE_SIZE, TILE_SIZE);
        } else if (t.kind === 'roof') {
          ctx.fillStyle = 'rgba(22,160,133,0.45)';
          ctx.fillRect(w.x, w.y, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#117864'; ctx.lineWidth = 1;
          ctx.strokeRect(w.x, w.y, TILE_SIZE, TILE_SIZE);
        } else {
          ctx.font = '22px serif';
          ctx.fillText(t.kind === 'crate' ? '📦' : t.kind === 'dryingrack' ? '🍖' : '💧', w.x + 8, w.y + 28);
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
        ctx.strokeStyle = bm.valid ? '#2ECC71' : '#E74C3C'; ctx.lineWidth = 2;
        ctx.strokeRect(w.x, w.y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#FFF'; ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(bm.kind.toUpperCase(), w.x, w.y - 4);
      }

      // RAFT-102: F3 debug overlay — attack arc + enemy hitboxes.
      if (typeof window !== 'undefined' && window.__debugHitboxes) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.9)';
        ctx.strokeRect(player.x, player.y, player.width, player.height);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
        ctx.strokeRect(player.x - SPEAR_REACH.back, player.y - SPEAR_REACH.vertical, player.width + SPEAR_REACH.front + SPEAR_REACH.back, player.height + SPEAR_REACH.vertical * 2);
        for (const frog of frogs) { ctx.strokeStyle = '#00FFFF'; ctx.strokeRect(frog.x, frog.y, frog.width, frog.height); }
        if (shark) { ctx.strokeStyle = '#FF00FF'; ctx.strokeRect(shark.x, shark.y, shark.width, shark.height); }
        if (kraken) { ctx.strokeStyle = '#FFAA00'; ctx.strokeRect(kraken.x - KRAKEN_BOX / 2, kraken.y - KRAKEN_BOX / 2, KRAKEN_BOX, KRAKEN_BOX); }
        for (const proj of projectiles) { ctx.strokeStyle = 'rgba(255,255,0,0.9)'; ctx.strokeRect(proj.x, proj.y, proj.size, proj.size); }
        const wallCount = intactWalls();
        if (wallCount > 0) { ctx.strokeStyle = 'rgba(0,128,255,0.9)'; ctx.strokeRect(raftDrawX, raftDrawY - WALL_BLOCK_HEIGHT, raftRef.current.width, WALL_BLOCK_HEIGHT); }
      }
    };

    const gameLoop = () => { pollGamepad(); update(); draw(); animationFrameId = requestAnimationFrame(gameLoop); };
    gameLoop();
    return () => {
      cancelAnimationFrame(animationFrameId);
      delete window.__setMove;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('bindingsChanged', onBindingsChanged);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [onStatsUpdate, gameOver, onGameOver]);
  // Note: walls/roofs/floors/hasHammer are used in draw, see second effect below

  return (
    <div className="relative" style={{ width: 800, height: 600 }}>
      <img
        src="/assets/backgroundscreen/waterscreen/waterbackground.gif"
        alt=""
        className="absolute inset-0 w-full h-full border-2 border-gray-700 shadow-lg"
        style={{ zIndex: 0, objectFit: 'cover', pointerEvents: 'none', opacity: 0.9 }}
        draggable={false}
      />
      <div className="absolute inset-0" style={{ zIndex: 0, pointerEvents: 'none', background: 'rgba(0, 40, 80, 0.15)' }} />
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





















































































































