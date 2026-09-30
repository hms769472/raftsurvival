'use client';

import { useEffect, useRef } from 'react';

type GameProps = {
  onStatsUpdate: (stats: { health: number; hunger: number; fish: number; day: number; wood: number; plastic: number }) => void;
  craftAction: { type: string; id: number } | null;
  onCraftComplete: () => void;
  raftWidth: number;
  hasRod: boolean;
  hasSpear: boolean;
  hasHammer: boolean;
  walls: number;
  roofs: number;
  floors: number;
  gameOver: boolean;
  onGameOver: () => void;
  playerState: 'standing' | 'sitting' | 'laying';
};

type Frog = { x: number; y: number; width: number; height: number; shootTimer: number; direction: number; hopPhase: number; };
type Projectile = { x: number; y: number; vx: number; vy: number; size: number; };
type Raindrop = { x: number; y: number; length: number; speed: number; };
type Item = { x: number; y: number; width: number; height: number; speed: number; type: 'wood' | 'plastic'; rotation: number; rotationSpeed: number; };
type Shark = { x: number; y: number; vx: number; vy: number; width: number; height: number; speed: number; health: number; state: 'wandering' | 'attacking' | 'passing' | 'retreating'; attackTimer: number; tailPhase: number; willAttack: boolean; mouthOpen: number; };
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

const RAFT_WIDTH = 80;
const RAFT_CENTER_Y = 300;
const WORLD_SCROLL_SPEED = 2.2;

export default function Game({ onStatsUpdate, craftAction, onCraftComplete, raftWidth, hasRod, hasSpear, hasHammer, walls, roofs, floors, gameOver, onGameOver, playerState }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const waveSoundRef = useRef<{ noiseSource: AudioBufferSourceNode; lfo: OscillatorNode; } | null>(null);
  const statsRef = useRef({ health: 5, hunger: 100, fish: 0, day: 1, wood: 0, plastic: 0 });
  const raftRef = useRef({ x: 400 - RAFT_WIDTH / 2, y: RAFT_CENTER_Y, width: RAFT_WIDTH, height: 150 });

  const playerStateRef = useRef(playerState);
  useEffect(() => { playerStateRef.current = playerState; }, [playerState]);

  useEffect(() => {
    raftRef.current.height = raftWidth;
    raftRef.current.x = 400 - RAFT_WIDTH / 2;
  }, [raftWidth]);

  useEffect(() => {
    if (!craftAction) return;
    if (craftAction.type === 'REPAIR') {
      if (statsRef.current.wood >= 5) { statsRef.current.wood -= 5; statsRef.current.health = 5; }
    } else if (craftAction.type === 'EXPAND') {
      if (statsRef.current.wood >= 10 && statsRef.current.plastic >= 5) { statsRef.current.wood -= 10; statsRef.current.plastic -= 5; raftRef.current.height += 40; }
    } else if (craftAction.type === 'ROD') {
      if (statsRef.current.wood >= 5) { statsRef.current.wood -= 5; }
    } else if (craftAction.type === 'SPEAR') {
      if (statsRef.current.wood >= 8) { statsRef.current.wood -= 8; }
    } else if (craftAction.type === 'HAMMER') {
      if (statsRef.current.wood >= 8) { statsRef.current.wood -= 8; }
    } else if (craftAction.type === 'WALL') {
      if (statsRef.current.wood >= 5) { statsRef.current.wood -= 5; }
    } else if (craftAction.type === 'ROOF') {
      if (statsRef.current.wood >= 3 && statsRef.current.plastic >= 2) { statsRef.current.wood -= 3; statsRef.current.plastic -= 2; }
    } else if (craftAction.type === 'FLOOR') {
      if (statsRef.current.wood >= 4) { statsRef.current.wood -= 4; }
    }
    // Immediately update the HUD with new resource counts
    onStatsUpdate({ ...statsRef.current });
    onCraftComplete();
  }, [craftAction, onCraftComplete]);

  // Keep building refs in sync when props change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__wallsRef = walls;
      (window as any).__roofsRef = roofs;
      (window as any).__floorsRef = floors;
      (window as any).__hasRodRef = hasRod;
      (window as any).__hasSpearRef = hasSpear;
      (window as any).__hasHammerRef = hasHammer;
    }
  }, [walls, roofs, floors, hasRod, hasSpear, hasHammer]);

  // Water waves ambient sound
  useEffect(() => {
    const startWaveSound = () => {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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

  const playDamageSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    
    let frogs: Frog[] = [];
    let projectiles: Projectile[] = [];
    let raindrops: Raindrop[] = [];
    let items: Item[] = [];
    let shark: Shark | null = null;
    let waveStreaks: WaveStreak[] = [];
    let wakeParticles: WakeParticle[] = [];
    let fishes: Fish[] = [];
    let fishFoods: FishFood[] = [];

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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keys.ArrowLeft = true;
      if (e.key === 'ArrowRight') keys.ArrowRight = true;
      if (e.key === 'ArrowUp') keys.ArrowUp = true;
      if (e.key === 'ArrowDown') keys.ArrowDown = true;
      if (e.key.toLowerCase() === 'f') keys.F = true;
      if (e.key === ' ') keys.Space = true;
      if (e.key.toLowerCase() === 'h') keys.H = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keys.ArrowLeft = false;
      if (e.key === 'ArrowRight') keys.ArrowRight = false;
      if (e.key === 'ArrowUp') keys.ArrowUp = false;
      if (e.key === 'ArrowDown') keys.ArrowDown = false;
      if (e.key.toLowerCase() === 'f') keys.F = false;
      if (e.key === ' ') keys.Space = false;
      if (e.key.toLowerCase() === 'h') keys.H = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    let time = 0;
    let animationFrameId: number;
    let lastStatsUpdate = 0;
    let invulnerabilityTimer = 0;
    let lightningTimer = 0;
    let lightningFlash = 0;
    let isRaining = false;
    let rainTimer = 0;
    let spawnTimer = 0;
    let attackTimer = 0;
    let eatCooldown = 0;

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
    let hookTargetItem: any = null;
    let fishingTimer = 0;
    let bobberX = 0;
    let bobberY = 0;

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
        offsetX: 0,
        offsetY: 0,
        hasAttached: false,
        wanderAngle: Math.random() * Math.PI * 2,
        wanderTimer: 0,
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
        hasAttached: false,
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

    const spawnItem = () => {
      const types: ('wood' | 'plastic')[] = ['wood', 'plastic'];
      items.push({
        x: Math.random() * (800 - 30),
        y: -40,
        width: 40, height: 30,
        speed: 2.5 + Math.random() * 2,
        type: types[Math.floor(Math.random() * types.length)],
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
      });
    };

    const spawnShark = () => {
      const willAttack = Math.random() < 0.5;
      const edge = Math.floor(Math.random() * 4);
      const spd = 2;
      let sx = 0, sy = 0, svx = 0, svy = 0;
      if (edge === 0) { sx = -180; sy = 150 + Math.random() * 300; svx = spd; svy = 0; }
      else if (edge === 1) { sx = 980; sy = 150 + Math.random() * 300; svx = -spd; svy = 0; }
      else if (edge === 2) { sx = 100 + Math.random() * 600; sy = -180; svx = 0; svy = spd; }
      else { sx = 100 + Math.random() * 600; sy = 780; svx = 0; svy = -spd; }
      shark = { x: sx, y: sy, vx: svx, vy: svy, width: 160, height: 70, speed: spd, health: 3, state: 'wandering', attackTimer: 0, tailPhase: 0, willAttack, mouthOpen: 0 };
    };

        const getRaftScreenY = () => RAFT_CENTER_Y + raftBobY + Math.max(0, startupRiseOffset);

    // Expose eat function to parent — React state can't touch statsRef directly
    if (typeof window !== 'undefined') {
      (window as any).__eatFishFromGame = () => {
        if (statsRef.current.fish > 0) {
          statsRef.current.fish -= 1;
          statsRef.current.hunger = Math.min(100, statsRef.current.hunger + 40);
        }
      };
    }

    const update = () => {
      if (gameOver) return;
      time += 1;
      if (startupRiseOffset > 0) startupRiseOffset -= 2.5;
      
      const DAY_LENGTH = 60 * 60 * 5;
      const dayProgress = (time % DAY_LENGTH) / DAY_LENGTH;
      darkness = dayProgress > 0.5 ? (dayProgress - 0.5) * 2 : 0;
      statsRef.current.day = Math.floor(time / DAY_LENGTH) + 1;

      raftBobY = Math.sin(time * 0.04) * 4;
      raftBobX = Math.cos(time * 0.025) * 2;
      raftTilt = Math.sin(time * 0.035) * 0.03;

      const raftScreenY = getRaftScreenY();
      const raftDeltaY = raftScreenY - lastRaftY;
      const raftScreenX = raftRef.current.x + raftBobX;
      const raftDeltaX = raftScreenX - lastRaftX;

      statsRef.current.hunger -= 0.005;
      if (statsRef.current.hunger < 0) statsRef.current.hunger = 0;
      if (statsRef.current.hunger === 0) {
        statsRef.current.health -= 0.01;
        if (statsRef.current.health < 0) statsRef.current.health = 0;
      }

      if (statsRef.current.health < prevHealth - 0.05 && damageCooldown <= 0) {
        damageFlash = 30;
        damageCooldown = 60;
        playDamageSound();
      }
      prevHealth = statsRef.current.health;
      
      if (damageFlash > 0) damageFlash--;
      if (damageCooldown > 0) damageCooldown--;

      if (statsRef.current.health <= 0) { onGameOver(); return; }

      rainTimer++;
      if (!isRaining && rainTimer > 600 + Math.random() * 600) { isRaining = true; rainTimer = 0; }
      else if (isRaining && rainTimer > 900 + Math.random() * 600) { isRaining = false; rainTimer = 0; }
      lightningTimer++;
      if (isRaining && lightningTimer > 300 + Math.random() * 300) { lightningFlash = 1.0; lightningTimer = 0; }
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

      // === HOOK LOGIC ===
      if (hookCooldown > 0) hookCooldown--;
      
      if (keys.H && hookState === 'idle' && hookCooldown <= 0) {
        hookState = 'throwing';
        hookThrowProgress = 0;
        hookX = player.x + player.width / 2;
        hookY = player.y + player.height / 2;
      }
      
      if (hookState === 'throwing') {
        hookThrowProgress += 7;
        hookY = player.y + player.height / 2 - hookThrowProgress;
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          if (hookX >= it.x - 6 && hookX <= it.x + it.width + 6 &&
              hookY >= it.y - 6 && hookY <= it.y + it.height + 6) {
            hookTargetItem = it;
            hookState = 'pulling';
            break;
          }
        }
        if (hookThrowProgress >= 280) {
          hookState = 'returning';
        }
      }
      
      if (hookState === 'pulling' && hookTargetItem) {
        const dx = (player.x + player.width / 2) - (hookTargetItem.x + hookTargetItem.width / 2);
        const dy = (player.y + player.height / 2) - (hookTargetItem.y + hookTargetItem.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 40) {
          statsRef.current[hookTargetItem.type]++;
          const idx = items.indexOf(hookTargetItem);
          if (idx >= 0) items.splice(idx, 1);
          hookTargetItem = null;
          hookState = 'returning';
        } else {
          hookTargetItem.x += (dx / dist) * 5;
          hookTargetItem.y += (dy / dist) * 5;
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
          hookCooldown = 45;
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

      if (isWalking) walkCycle += 0.3;
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

      if (isInWater) { statsRef.current.health -= 0.005; if (statsRef.current.health < 0) statsRef.current.health = 0; }
      else { if (statsRef.current.health < 5) statsRef.current.health += 0.001; }

      if ((typeof window !== 'undefined' ? (window as any).__hasRodRef : false) && keys.F && fishingState === 'idle') {
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
      else if (fishingState === 'caught') { if (keys.F) { statsRef.current.fish += 1; fishingState = 'idle'; } }

      if (attackTimer > 0) attackTimer--;
      if (eatCooldown > 0) eatCooldown--;
      if ((typeof window !== 'undefined' ? (window as any).__hasSpearRef : false) && keys.Space && attackTimer === 0) {
        attackTimer = 30;
        for (let i = frogs.length - 1; i >= 0; i--) {
          const frog = frogs[i];
          if (frog.x < player.x + player.width + 40 && frog.x + frog.width > player.x - 20 && frog.y < player.y + player.height && frog.y + frog.height > player.y) {
            frogs.splice(i, 1);
          }
        }
        if (shark && shark.x < player.x + 120 && shark.x + shark.width > player.x - 40) {
          shark.health--;
          if (shark.health <= 0) { shark = null; }
          else { shark.state = 'retreating'; shark.attackTimer = 180; }
        }
      }

      if (!shark && time > 1200 && Math.random() < 0.005) { spawnShark(); }
      if (shark) {
        shark.tailPhase += 0.2;
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
            // === SHARK BITE LOGIC (robust) ===
            // Shark lunges at raft. Player is safe in middle, in danger at edges or in water.
            const playerCX = player.x + player.width / 2;
            const playerCY = player.y + player.height / 2;
            const sharkCX2 = shark.x + shark.width / 2;
            const sharkCY2 = shark.y + shark.height / 2;
            const distX = Math.abs(sharkCX2 - playerCX);
            const distY = Math.abs(sharkCY2 - playerCY);
            const euclidDist = Math.sqrt(distX * distX + distY * distY);
            const inSharkRange = euclidDist < 250;
            
            console.log('[SHARK BITE] dist=' + euclidDist.toFixed(0) + ' inRange=' + inSharkRange + ' isInWater=' + isInWater + ' playerCX=' + playerCX.toFixed(0));
            
            if (inSharkRange) {
              const safeLeft = raftRef.current.x + raftRef.current.width * 0.30;
              const safeRight = raftRef.current.x + raftRef.current.width * 0.70;
              const inSafeMiddle = playerCX >= safeLeft && playerCX <= safeRight;
              
              console.log('[SHARK BITE] safeLeft=' + safeLeft.toFixed(0) + ' safeRight=' + safeRight.toFixed(0) + ' inSafe=' + inSafeMiddle);
              
              if (isInWater) {
                statsRef.current.health -= 1;
                if (statsRef.current.health < 0) statsRef.current.health = 0;
                shark.mouthOpen = 40;
                console.log('[SHARK BITE] Player in water - BIT!');
              } else if (!inSafeMiddle) {
                statsRef.current.health -= 1;
                if (statsRef.current.health < 0) statsRef.current.health = 0;
                shark.mouthOpen = 40;
                console.log('[SHARK BITE] Player at EDGE - BIT!');
              } else {
                statsRef.current.raftHealth -= 15;
                if (statsRef.current.raftHealth < 0) statsRef.current.raftHealth = 0;
                shark.mouthOpen = 40;
                console.log('[SHARK BITE] Player in SAFE middle - raft damaged');
              }
            } else {
              console.log('[SHARK BITE] Player out of range - nothing');
            }
            shark.state = 'retreating';
            shark.attackTimer = 120;
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

// === DEDICATED FISH-EATING CHECK (runs after fish positions are set) ===
      // Player hitbox (generous)
      const pLeft = player.x - 5;
      const pRight = player.x + player.width + 5;
      const pTop = player.y - 5;
      const pBottom = player.y + player.height + 5;
      
      for (let i = fishes.length - 1; i >= 0; i--) {
        const f = fishes[i];
        const fLeft = f.x;
        const fRight = f.x + f.width;
        const fTop = f.y;
        const fBottom = f.y + f.height;
        
        // Skip if fish just attached (1 second grace period)
        if (f.graceTimer > 0) continue; // SKIP: fish is safe during grace // SKIP: fish is safe during grace
        
        // AABB overlap check
        if (fLeft < pRight && fRight > pLeft && fTop < pBottom && fBottom > pTop) {
          // EAT!
          if (eatCooldown <= 0) {
            statsRef.current.hunger = Math.min(100, statsRef.current.hunger + 20);
            statsRef.current.fish += 1;
            eatCooldown = 15;
          }
          
          // Chomp particles (always)
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
          
          // Fish ALWAYS disappears
          fishes.splice(i, 1);
        }
      }

      if (time % 240 === 0 && frogs.length < 4) spawnFrog();
      for (let i = frogs.length - 1; i >= 0; i--) {
        const frog = frogs[i];
        frog.hopPhase += 0.15;
        if (frog.x < 400) frog.x += 0.5; else frog.x -= 0.5;
        frog.y -= WORLD_SCROLL_SPEED * 0.5;
        frog.shootTimer--;
        if (frog.shootTimer <= 0) { spawnProjectile(frog); frog.shootTimer = 120 + Math.random() * 120; }
        
        // Frog body damage on player contact
        if (frog.x < player.x + player.width && frog.x + frog.width > player.x &&
            frog.y < player.y + player.height && frog.y + frog.height > player.y) {
          if (invulnerabilityTimer <= 0) {
            statsRef.current.health -= 1;
            invulnerabilityTimer = 60;
            if (statsRef.current.health < 0) statsRef.current.health = 0;
          }
        }
        
        if (frog.x < -100 || frog.x > 900 || frog.y < -100) frogs.splice(i, 1);
      }
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i]; proj.x += proj.vx; proj.y += proj.vy - WORLD_SCROLL_SPEED * 0.5;
        if (proj.x < player.x + player.width && proj.x + proj.size > player.x && proj.y < player.y + player.height && proj.y + proj.size > player.y) {
          if (invulnerabilityTimer <= 0) { statsRef.current.health -= 1; invulnerabilityTimer = 60; if (statsRef.current.health < 0) statsRef.current.health = 0; }
          projectiles.splice(i, 1); continue;
        }
        if (proj.x < -50 || proj.x > 850 || proj.y < -50 || proj.y > 650) projectiles.splice(i, 1);
      }
      if (invulnerabilityTimer > 0) invulnerabilityTimer--;

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
          statsRef.current[item.type]++; items.splice(i, 1); continue;
        }
        if (item.y > 640) items.splice(i, 1);
      }

      if (time - lastStatsUpdate > 10) { onStatsUpdate({ ...statsRef.current }); lastStatsUpdate = time; }
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
      ctx.fillStyle = fish.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
      ctx.fill();

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
      ctx.fillStyle = '#8B4513'; ctx.fillRect(-w / 2, -h / 3, w, h * 2 / 3);
      ctx.fillStyle = '#A0522D'; ctx.fillRect(-w / 2, -h / 3, w, h / 6);
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
      const _floors = (typeof window !== 'undefined' ? (window as any).__floorsRef : 0) || 0;
      const _walls = (typeof window !== 'undefined' ? (window as any).__wallsRef : 0) || 0;
      const _roofs = (typeof window !== 'undefined' ? (window as any).__roofsRef : 0) || 0;
      
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
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.fillStyle = '#A0522D';
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

      items.forEach((item) => {
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

      // === FISHING ROD (visible in player's hand) ===
      if ((typeof window !== 'undefined' ? (window as any).__hasRodRef : false) && playerStateRef.current === 'standing') {
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

      if ((typeof window !== 'undefined' ? (window as any).__hasSpearRef : false) && attackTimer > 15) {
        ctx.strokeStyle = '#D2691E'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(player.x + player.width, player.y + player.height / 2); ctx.lineTo(player.x + player.width + 60, player.y + player.height / 2); ctx.stroke();
        ctx.fillStyle = '#AAAAAA'; ctx.fillRect(player.x + player.width + 60, player.y + player.height / 2 - 4, 12, 8);
      }

      if (isRaining) {
        ctx.strokeStyle = 'rgba(200, 220, 255, 0.6)'; ctx.lineWidth = 1;
        raindrops.forEach((drop) => { ctx.beginPath(); ctx.moveTo(drop.x, drop.y); ctx.lineTo(drop.x, drop.y + drop.length); ctx.stroke(); drop.y += drop.speed; if (drop.y > 600) { drop.y = -20; drop.x = Math.random() * 800; } });
      }

      ctx.fillStyle = `rgba(0, 0, 20, ${darkness * 0.75})`; ctx.fillRect(0, 0, 800, 600);
      if (lightningFlash > 0) { ctx.fillStyle = `rgba(255, 255, 255, ${lightningFlash})`; ctx.fillRect(0, 0, 800, 600); }
      if (isInWater) { ctx.fillStyle = 'rgba(255, 0, 0, 0.15)'; ctx.fillRect(0, 0, 800, 600); }

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
    };

    const gameLoop = () => { update(); draw(); animationFrameId = requestAnimationFrame(gameLoop); };
    gameLoop();
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
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








































