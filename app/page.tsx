'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import MainMenu from '@/components/MainMenu';
import SettingsMenu from '@/components/SettingsMenu';
import CreditsScreen from '@/components/CreditsScreen';
import CoopMenu from '@/components/CoopMenu';
import AchievementsPanel from '@/components/AchievementsPanel';
import AchievementToast from '@/components/AchievementToast';
import Game from '@/components/Game';
import HUD from '@/components/HUD';
import RecipeBook from '@/components/RecipeBook';
import CraftingMenu from '@/components/CraftingMenu';
import GameOver from '@/components/GameOver';
import PerkTree from '@/components/PerkTree';
import Victory from '@/components/Victory';
import SkinShop from '@/components/SkinShop';
import BackgroundMusic from '@/components/BackgroundMusic';
import DevTuningPanel from '@/components/DevTuningPanel';
import Tutorial from '@/components/Tutorial';
import PauseMenu from '@/components/PauseMenu';
import SaveSlots from '@/components/SaveSlots';
import Leaderboard from '@/components/Leaderboard';
import HintToast from '@/components/HintToast';
import TouchControls from '@/components/TouchControls';
import { loadSnapshot, saveSnapshot, hasSnapshot, type GameSnapshot, type SnapshotStore } from '@/lib/save';
import { nextWeaponTier, BASE_RAFT_HEIGHT, EXPAND_SIZE, MAX_HEALTH, type WeaponTier } from '@/lib/balance';
import { matchAction, loadBindings } from '@/lib/controls';
import { DEFAULT_PROGRESSION, addXp, xpProgress, type ProgressionState } from '@/lib/systems/progression';
import { canRankUp, perkEffects, rankUp, type PerkRanks } from '@/lib/systems/perks';
import {
  EMPTY_OBJECTIVE_STATS,
  advanceChain,
  currentObjective,
  objectiveProgress,
  type Objective,
  type ObjectiveStats,
} from '@/lib/systems/objectives';

// RAFT-406: the live tuning panel is a developer tool — never shipped.
const IS_DEV = process.env.NODE_ENV !== 'production';
// RAFT-506: Co-op has no networking yet, so keep it out of the main menu.
const COOP_ENABLED = false;

export default function Home() {
  const [scene, setScene] = useState<'menu' | 'playing' | 'settings' | 'credits' | 'coop' | 'achievements' | 'skins' | 'leaderboard'>('menu');
  const [gameId, setGameId] = useState(0);
  const [showDevPanel, setShowDevPanel] = useState(false);
  // RAFT-501: first-run tutorial overlay.
  const [showTutorial, setShowTutorial] = useState(false);
  // RAFT-507: in-game save-slot picker ('save' | 'load' | null).
  const [saveSlotsMode, setSaveSlotsMode] = useState<'save' | 'load' | null>(null);
  const [health, setHealth] = useState(5);
  const [hunger, setHunger] = useState(100);
  const [thirst, setThirst] = useState(100);
  const [fish, setFish] = useState(0);
  const [day, setDay] = useState(1);
  const [wood, setWood] = useState(5); // starting bonus
  const [plastic, setPlastic] = useState(3); // starting bonus
  const [raftWidth, setRaftWidth] = useState(150);
  const [raftHealth, setRaftHealth] = useState(100);
  const [hasRod, setHasRod] = useState(false);
  const [hasSpear, setHasSpear] = useState(false);
  const [hasHammer, setHasHammer] = useState(false);
  const [hasRainBarrel, setHasRainBarrel] = useState(false);
  const [hasCampfire, setHasCampfire] = useState(false);
  const [walls, setWalls] = useState(0);
  const [roofs, setRoofs] = useState(0);
  const [floors, setFloors] = useState(0);
  const [storageCap, setStorageCap] = useState(100);
  const [needsRepair, setNeedsRepair] = useState(false);
  const [isCraftingOpen, setIsCraftingOpen] = useState(false);
  const [isRecipeBookOpen, setIsRecipeBookOpen] = useState(false);
  const [craftAction, setCraftAction] = useState<{ type: string; id: number } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const [playerState, setPlayerState] = useState<'standing' | 'sitting' | 'laying'>('standing');
  const [gameScale, setGameScale] = useState(1);
  const [barrelWater, setBarrelWater] = useState(0);
  // RAFT-505: nearest active threat (mirrored from <Game>) for the HUD warning.
  const [threat, setThreat] = useState<'shark' | 'frog' | null>(null);
  const [spearTier, setSpearTier] = useState<WeaponTier>('wooden');
  // RAFT-301/302/304: progression, perks and objectives owned by the page.
  const [progression, setProgression] = useState<ProgressionState>(DEFAULT_PROGRESSION);
  const [perkRanks, setPerkRanks] = useState<PerkRanks>({});
  const [objectiveIndex, setObjectiveIndex] = useState(0);
  const [objectiveFill, setObjectiveFill] = useState(0);
  const [cookedFish, setCookedFish] = useState(0);
  // RAFT-405: dried fish produced by the drying rack.
  const [driedFish, setDriedFish] = useState(0);
  const [isPerkOpen, setIsPerkOpen] = useState(false);
  const [rewardAction, setRewardAction] = useState<{ wood?: number; plastic?: number; id: number } | null>(null);
  // RAFT-306: win screen.
  const [victory, setVictory] = useState(false);
  const [victoryCoins, setVictoryCoins] = useState(0);
  // RAFT-304: monotonic objective counters, updated from the game's stats.
  const objectiveStatsRef = useRef<ObjectiveStats>({ ...EMPTY_OBJECTIVE_STATS });
  const objectiveIndexRef = useRef(0);
  const progressionRef = useRef(progression);
  const perkRanksRef = useRef(perkRanks);
  const dayRef = useRef(day);
  // Snapshot the Game writes every frame; the page persists it on save/autosave.
  const snapshotStore: SnapshotStore = useRef<GameSnapshot | null>(null);
  const [initialState, setInitialState] = useState<GameSnapshot | null>(null);
  const [showPause, setShowPause] = useState(false);

  // Keep the victory reward in sync with the live day counter.
  useEffect(() => { dayRef.current = day; }, [day]);

  // RAFT-301: award XP, level up, and toast on a level gain.
  const applyXp = useCallback((amount: number) => {
    const result = addXp(progressionRef.current, amount);
    if (result.state === progressionRef.current) return;
    progressionRef.current = result.state;
    setProgression(result.state);
    if (result.leveledUp) {
      window.dispatchEvent(new CustomEvent('achievementUnlocked', {
        detail: {
          emoji: '⭐',
          name: `LEVEL ${result.state.level}`,
          description: `+${result.levelsGained} perk point${result.levelsGained > 1 ? 's' : ''} earned`,
        },
      }));
    }
  }, []);

  // RAFT-304: grant an objective's reward exactly once, then toast.
  const grantObjectiveRewards = useCallback((completed: Objective[]) => {
    let xp = 0, coins = 0, wood = 0, plastic = 0;
    for (const o of completed) {
      xp += o.reward.xp ?? 0;
      coins += o.reward.coins ?? 0;
      wood += o.reward.wood ?? 0;
      plastic += o.reward.plastic ?? 0;
    }
    if (xp > 0) applyXp(xp);
    if (coins > 0) {
      try {
        const cur = parseInt(localStorage.getItem('raftCoins') || '0', 10);
        localStorage.setItem('raftCoins', String(cur + coins));
      } catch { /* storage disabled */ }
    }
    if (wood > 0 || plastic > 0) {
      setRewardAction({ wood: wood || undefined, plastic: plastic || undefined, id: Date.now() });
    }
    const last = completed[completed.length - 1];
    if (last) {
      window.dispatchEvent(new CustomEvent('achievementUnlocked', {
        detail: { emoji: '🎯', name: 'OBJECTIVE COMPLETE', description: last.text },
      }));
    }
  }, [applyXp]);

  // RAFT-306: surviving to the win day pays out coins and opens the victory screen.
  const handleVictory = useCallback(() => {
    const earned = 100 + dayRef.current * 10;
    try {
      const cur = parseInt(localStorage.getItem('raftCoins') || '0', 10);
      localStorage.setItem('raftCoins', String(cur + earned));
    } catch { /* storage disabled */ }
    setVictoryCoins(earned);
    setVictory(true);
  }, []);

  const handleRewardComplete = useCallback(() => setRewardAction(null), []);

  // RAFT-302: spend a perk point on one rank of a perk.
  const handleSpendPerk = useCallback((id: string) => {
    const prog = progressionRef.current;
    if (!canRankUp(perkRanksRef.current, id, prog.perkPoints)) return;
    const nextRanks = rankUp(perkRanksRef.current, id);
    perkRanksRef.current = nextRanks;
    setPerkRanks(nextRanks);
    const nextProg: ProgressionState = {
      ...prog,
      perkPoints: prog.perkPoints - 1,
      spentPerks: prog.spentPerks + 1,
    };
    progressionRef.current = nextProg;
    setProgression(nextProg);
  }, []);

  // RAFT-302: derived perk modifiers fed to the simulation.
  const effects = useMemo(() => perkEffects(perkRanks), [perkRanks]);
  const activeObjective = currentObjective(objectiveIndex);

  // Persist the latest autosave.
  const persist = useCallback(() => {
    if (snapshotStore.current) saveSnapshot(snapshotStore.current);
  }, [snapshotStore]);

  // Check for existing save after mount (deferred so we never call setState
  // synchronously inside an effect, which would trigger cascading renders).
  useEffect(() => {
    const id = window.setTimeout(() => {
      setHasSave(hasSnapshot());
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  // Compute scale to fill viewport keeping 4:3 aspect ratio
  useEffect(() => {
    const updateScale = () => {
      const sx = window.innerWidth / 800;
      const sy = window.innerHeight / 600;
      setGameScale(Math.min(sx, sy));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Poll barrel water + threat from game (Game exposes them via window.__*).
  useEffect(() => {
    const interval = setInterval(() => {
      const w = window.__barrelWater;
      if (typeof w === 'number') setBarrelWater(w);
      setThreat(window.__threat ?? null);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // RAFT-007: autosave every 30s while playing, plus on tab hide/close.
  useEffect(() => {
    if (scene !== 'playing') return;
    const intervalId = window.setInterval(persist, 30000);
    const flush = () => persist();
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', flush);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', flush);
    };
  }, [scene, persist]);

  // RAFT-008: ESC pauses the run and opens the confirm modal instead of quitting directly.
  useEffect(() => {
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && scene === 'playing' && !gameOver) {
        if (isPerkOpen) { setIsPerkOpen(false); return; }
        setIsCraftingOpen(false);
        setIsRecipeBookOpen(false);
        setShowPause(prev => !prev);
      }
    };
    window.addEventListener('keydown', escHandler);
    return () => window.removeEventListener('keydown', escHandler);
  }, [scene, gameOver, isPerkOpen]);

  // Keyboard shortcuts for crafting, sit, lay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // RAFT-406: F4 toggles the dev tuning panel (development builds only).
      if (e.key === 'F4' && IS_DEV) {
        e.preventDefault();
        setShowDevPanel((prev) => !prev);
        return;
      }
      if (scene !== 'playing' || gameOver || isPerkOpen) return;
      // RAFT-507: P / Escape toggles the pause menu.
      if (e.key.toLowerCase() === 'p' || e.key === 'Escape') {
        e.preventDefault();
        setShowPause(prev => !prev);
        return;
      }
      if (showPause) return;
      // RAFT-503: crafting hotkey follows the player's binding.
      const action = matchAction(loadBindings(), e.key);
      if (action === 'craft') setIsCraftingOpen(prev => !prev);
      if (e.key.toLowerCase() === 'r') setIsRecipeBookOpen(prev => !prev);
      // NOTE: sit/lay are HUD buttons now — WASD owns S/W/A/D for movement.
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scene, gameOver, showPause, isPerkOpen]);

  // Raft expansion (handled directly in handleCraft to avoid a state-sync effect)

  const handleStatsUpdate = useCallback((stats: { health: number; hunger: number; thirst: number; fish: number; day: number; wood: number; plastic: number; raftHealth: number; walls?: number; roofs?: number; floors?: number; raftSize?: number; capacity?: number; damaged?: boolean; cookedFish?: number; driedFish?: number; kills?: number; islands?: number; structures?: number; crafted?: number; woodGathered?: number; fishCaught?: number }) => {
    setHealth(stats.health);
    setHunger(stats.hunger);
    setThirst(stats.thirst ?? 100);
    setFish(stats.fish);
    setDay(stats.day);
    setWood(stats.wood);
    setPlastic(stats.plastic);
    setRaftHealth(stats.raftHealth ?? 100);
    // RAFT-207: the game owns deck size; mirror it so the craft menu shows cost.
    if (typeof stats.raftSize === 'number') setRaftWidth(stats.raftSize);
    if (typeof stats.capacity === 'number') setStorageCap(stats.capacity);
    if (typeof stats.walls === 'number') setWalls(stats.walls);
    if (typeof stats.roofs === 'number') setRoofs(stats.roofs);
    if (typeof stats.floors === 'number') setFloors(stats.floors);
    if (typeof stats.damaged === 'boolean') setNeedsRepair(stats.damaged);
    if (typeof stats.cookedFish === 'number') setCookedFish(stats.cookedFish);
    if (typeof stats.driedFish === 'number') setDriedFish(stats.driedFish);

    // RAFT-304: fold the monotonic run counters into the objective tracker and
    // advance the chain, granting rewards for anything that just completed.
    const prev = objectiveStatsRef.current;
    const next: ObjectiveStats = {
      woodGathered: Math.max(prev.woodGathered, stats.woodGathered ?? 0),
      fishCaught: Math.max(prev.fishCaught, stats.fishCaught ?? 0),
      structuresBuilt: Math.max(prev.structuresBuilt, stats.structures ?? 0),
      kills: Math.max(prev.kills, stats.kills ?? 0),
      islandsFound: Math.max(prev.islandsFound, stats.islands ?? 0),
      crafted: Math.max(prev.crafted, stats.crafted ?? 0),
      day: Math.max(prev.day, stats.day ?? 1),
    };
    objectiveStatsRef.current = next;
    const active = currentObjective(objectiveIndexRef.current);
    if (active) setObjectiveFill(objectiveProgress(active, next));
    const advanced = advanceChain(objectiveIndexRef.current, next);
    if (advanced.index !== objectiveIndexRef.current) {
      objectiveIndexRef.current = advanced.index;
      setObjectiveIndex(advanced.index);
      if (advanced.completed.length > 0) grantObjectiveRewards(advanced.completed);
    }
  }, [grantObjectiveRewards]);

  const handleCraft = (type: string) => {
    if (type === 'ROD') setHasRod(true);
    if (type === 'SPEAR') setHasSpear(true);
    if (type === 'HAMMER') setHasHammer(true);
    if (type === 'RAIN_BARREL') setHasRainBarrel(true);
    if (type === 'CAMPFIRE') setHasCampfire(true);
    if (type === 'SPEAR_UPGRADE') setSpearTier(prev => nextWeaponTier(prev) ?? prev);
    // RAFT-201/202: building now happens in-game (Build Mode, key B); the game
    // owns resource deduction, deck size and grid state for REPAIR/EXPAND.
    setCraftAction({ type, id: Date.now() });
  };

  const handleCraftComplete = useCallback(() => setCraftAction(null), []);

  // RAFT-207: how many expansions have been bought (drives the EXPAND cost).
  const expansions = Math.max(0, Math.round((raftWidth - BASE_RAFT_HEIGHT) / EXPAND_SIZE));

  const handleCook = () => { window.__cookFish?.(); };
  const handleEatCooked = () => { window.__eatCookedFish?.(); };
  // RAFT-405: eat a dried fish (the drying rack's output).
  const handleEatDried = () => { window.__eatDriedFish?.(); };

  const handleEat = () => {
    window.__eatFishFromGame?.();
  };

  const handleDrink = () => {
    window.__drinkWaterFromGame?.();
  };

  const handleAttack = () => {
    const event = new KeyboardEvent('keydown', { key: ' ' });
    window.dispatchEvent(event);
    setTimeout(() => {
      const upEvent = new KeyboardEvent('keyup', { key: ' ' });
      window.dispatchEvent(upEvent);
    }, 100);
  };

  const handleHook = () => {
    const event = new KeyboardEvent('keydown', { key: 'h' });
    window.dispatchEvent(event);
    setTimeout(() => {
      const upEvent = new KeyboardEvent('keyup', { key: 'h' });
      window.dispatchEvent(upEvent);
    }, 100);
  };

  // RAFT-504: touch "FISH" button mirrors the F key.
  const handleFish = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
    setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'f' })), 100);
  };

  const handleGameOver = useCallback(() => {
    try {
      const stats = JSON.parse(localStorage.getItem('raftAchStats') || '{}');
      const earned = Math.floor(day * 5) + Math.floor((stats.totalFishEaten || 0) * 0.5);
      if (earned > 0) {
        const current = parseInt(localStorage.getItem('raftCoins') || '0');
        localStorage.setItem('raftCoins', String(current + earned));
      }
      // RAFT-507: record a local leaderboard entry for this run.
      const diff = (localStorage.getItem('raftSettings') ? JSON.parse(localStorage.getItem('raftSettings')!)?.difficulty : 'normal') || 'normal';
      const entry = {
        days: day,
        fishEaten: Math.floor(stats.totalFishEaten || 0),
        sharksDefeated: Math.floor(stats.sharksDefeated || 0),
        date: new Date().toLocaleDateString(),
        difficulty: String(diff),
      };
      const board = JSON.parse(localStorage.getItem('raftLeaderboard') || '[]');
      const list = Array.isArray(board) ? board : [];
      list.push(entry);
      list.sort((a: { days: number }, b: { days: number }) => b.days - a.days);
      localStorage.setItem('raftLeaderboard', JSON.stringify(list.slice(0, 10)));
    } catch (e) {}
    setGameOver(true); // COINS REWARD v2
  }, [day]);

  // RAFT-301/302/304/306: reset page-owned meta state for a fresh run. New Game+
  // keeps earned perk ranks (and coins) as a prestige bonus.
  const resetProgression = useCallback((keepPerks: boolean) => {
    const fresh: ProgressionState = { ...DEFAULT_PROGRESSION };
    progressionRef.current = fresh;
    setProgression(fresh);
    if (!keepPerks) {
      perkRanksRef.current = {};
      setPerkRanks({});
    }
    objectiveStatsRef.current = { ...EMPTY_OBJECTIVE_STATS };
    objectiveIndexRef.current = 0;
    setObjectiveIndex(0);
    setObjectiveFill(0);
    setCookedFish(0);
    setRewardAction(null);
    setVictory(false);
  }, []);

  const resetHudValues = useCallback(() => {
    setHealth(5);
    setHunger(100);
    setThirst(100);
    setRaftHealth(100);
    setFish(0);
    setCookedFish(0);
    setDriedFish(0);
    setDay(1);
    setWood(0);
    setPlastic(0);
    setRaftWidth(150);
    setHasRod(false);
    setHasSpear(false);
    setSpearTier('wooden');
    setHasHammer(false);
    setHasRainBarrel(false);
    setHasCampfire(false);
    setWalls(0);
    setRoofs(0);
    setFloors(0);
    setPlayerState('standing');
  }, []);

  const handleRespawn = () => {
    setGameOver(false);
    setGameId(prev => prev + 1);
    resetHudValues();
    resetProgression(false);
  };

  // RAFT-306: New Game+ starts a fresh run but keeps perks + coins.
  const handleNewGamePlus = useCallback(() => {
    resetProgression(true);
    resetHudValues();
    setInitialState(null);
    setGameOver(false);
    setShowPause(false);
    setIsPerkOpen(false);
    setGameId(prev => prev + 1);
    setScene('playing');
  }, [resetProgression, resetHudValues]);

  // RAFT-006/007: persist the live snapshot written by <Game> every frame.
  const handleSaveAndQuit = useCallback(() => {
    const snap = snapshotStore.current ?? initialState;
    if (snap) {
      saveSnapshot(snap);
      setHasSave(true);
    }
    setGameOver(false);
    setShowPause(false);
    setScene('menu');
  }, [snapshotStore, initialState]);

  // RAFT-007: quit without saving (keeps any earlier autosave intact).
  const handleQuit = useCallback(() => {
    setGameOver(false);
    setShowPause(false);
    setScene('menu');
  }, []);

  // RAFT-006/507: restore the exact run from a persisted slot.
  const loadFromSlot = useCallback((slot: number) => {
    const data = loadSnapshot(slot);
    if (!data) return;
    // Hydrate React HUD state so the first paint already matches the save.
    setInitialState(data);
    setHealth(data.health);
    setHunger(data.hunger);
    setThirst(data.thirst);
    setRaftHealth(data.raftHealth);
    setFish(data.fish);
    setDay(data.day);
    setWood(data.wood);
    setPlastic(data.plastic);
    setRaftWidth(data.raftWidth);
    setHasRod(data.hasRod);
    setHasSpear(data.hasSpear);
    setSpearTier(data.spearTier);
    setHasHammer(data.hasHammer);
    setHasRainBarrel(data.hasRainBarrel);
    setHasCampfire(data.hasCampfire);
    setWalls(data.walls);
    setRoofs(data.roofs);
    setFloors(data.floors);
    setBarrelWater(data.barrelWater);
    // RAFT-301/302/304: restore progression, perks and objective progress.
    setProgression(data.progression);
    progressionRef.current = data.progression;
    setPerkRanks(data.perkRanks);
    perkRanksRef.current = data.perkRanks;
    setObjectiveIndex(data.objectiveIndex);
    objectiveIndexRef.current = data.objectiveIndex;
    objectiveStatsRef.current = { ...EMPTY_OBJECTIVE_STATS };
    setObjectiveFill(0);
    setCookedFish(data.cookedFish);
    setDriedFish(data.driedFish);
    setRewardAction(null);
    setVictory(false);
    setHasSave(true);
    setGameOver(false);
    setShowPause(false);
    setPlayerState('standing');
    setGameId(prev => prev + 1);
    setScene('playing');
  }, []);

  // RAFT-507: open the save-slot picker ('save' from the pause menu, 'load' from the main menu).
  const handleOpenSaveSlots = useCallback((mode: 'save' | 'load') => {
    setShowPause(false);
    setSaveSlotsMode(mode);
  }, []);

  // RAFT-507: write the live snapshot into the chosen slot.
  const handleSelectSaveSlot = useCallback((slot: number) => {
    const snap = snapshotStore.current ?? initialState;
    if (snap) {
      saveSnapshot(snap, slot);
      setHasSave(true);
    }
    setSaveSlotsMode(null);
  }, [snapshotStore, initialState]);

  // RAFT-007: fresh run — clear any loaded snapshot so <Game> boots from defaults.
  const handlePlay = useCallback(() => {
    setInitialState(null);
    setGameOver(false);
    setShowPause(false);
    setIsPerkOpen(false);
    setPlayerState('standing');
    resetProgression(false);
    // RAFT-501: show the tutorial the first time the game is played.
    try {
      if (!localStorage.getItem('raftTutorialSeen')) setShowTutorial(true);
    } catch {}
    setScene('playing');
  }, [resetProgression]);

  // RAFT-501: replay the tutorial from Settings.
  const handleReplayTutorial = useCallback(() => {
    try { localStorage.removeItem('raftTutorialSeen'); } catch {}
    setShowTutorial(true);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black relative overflow-hidden">
      {scene === 'achievements' ? (
        <AchievementsPanel onClose={() => setScene('menu')} />
      ) : scene === 'coop' ? (
        <CoopMenu onClose={() => setScene('menu')} />
      ) : scene === 'leaderboard' ? (
        <Leaderboard onClose={() => setScene('menu')} />
      ) : scene === 'credits' ? (
        <CreditsScreen onClose={() => setScene('menu')} />
      ) : scene === 'settings' ? (
        <SettingsMenu onClose={() => setScene('menu')} onReplayTutorial={handleReplayTutorial} />
      ) : scene === 'skins' ? (
        <SkinShop onClose={() => setScene('menu')} />
      ) : scene === 'menu' ? (
        <MainMenu
          onPlay={handlePlay}
          onLoad={() => handleOpenSaveSlots('load')}
          onSettings={() => setScene('settings')}
          onCredits={() => setScene('credits')}
          onCoop={() => setScene('coop')}
          onAchievements={() => setScene('achievements')}
          onSkins={() => setScene('skins')}
          onLeaderboard={() => setScene('leaderboard')}
          hasSave={hasSave}
          showCoop={COOP_ENABLED}
        />
      ) : (
        <div
          className="relative border-4 border-gray-800 shadow-2xl"
          style={{
            width: 800,
            height: 600,
            transform: `scale(${gameScale})`,
            transformOrigin: 'center center',
          }}
        >
          <Game
            key={gameId}
            onStatsUpdate={handleStatsUpdate}
            craftAction={craftAction}
            onCraftComplete={handleCraftComplete}
            raftWidth={raftWidth}
            hasRod={hasRod}
            hasSpear={hasSpear}
            hasHammer={hasHammer}
            hasRainBarrel={hasRainBarrel}
            hasCampfire={hasCampfire}
            walls={walls}
            roofs={roofs}
            floors={floors}
            gameOver={gameOver}
            onGameOver={handleGameOver}
            onVictory={handleVictory}
            playerState={playerState}
            initialState={initialState}
            snapshotStore={snapshotStore}
            paused={showPause}
            spearTier={spearTier}
            perkEffects={effects}
            onXp={applyXp}
            rewardAction={rewardAction}
            onRewardComplete={handleRewardComplete}
            progression={progression}
            perkRanks={perkRanks}
            objectiveIndex={objectiveIndex}
          />
          <HUD
            health={health}
            hunger={hunger}
            thirst={thirst}
            fish={fish}
            day={day}
            wood={wood}
            plastic={plastic}
            onOpenCrafting={() => setIsCraftingOpen(true)}
            onOpenRecipes={() => setIsRecipeBookOpen(true)}
            onEat={handleEat}
            onCook={handleCook}
            onEatCooked={handleEatCooked}
            onEatDried={handleEatDried}
            onDrink={handleDrink}
            onAttack={handleAttack}
            onHook={handleHook}
            hasSpear={hasSpear}
            hasRainBarrel={hasRainBarrel}
            barrelWater={barrelWater}
            raftHealth={raftHealth}
            storageCap={storageCap}
            maxHearts={Math.round(MAX_HEALTH + effects.maxHealthBonus)}
            level={progression.level}
            xpFill={xpProgress(progression)}
            objective={activeObjective ? activeObjective.text : null}
            objectiveFill={objectiveFill}
            cookedFish={cookedFish}
            driedFish={driedFish}
            freePerkPoints={progression.perkPoints}
            onOpenPerks={() => setIsPerkOpen(true)}
            playerState={playerState}
            onPoseChange={setPlayerState}
            onMainMenu={() => { setScene('menu'); setIsCraftingOpen(false); setIsRecipeBookOpen(false); setIsPerkOpen(false); }}
            threat={threat}
          />
          {isRecipeBookOpen && (
            <RecipeBook onClose={() => setIsRecipeBookOpen(false)} />
          )}
          {IS_DEV && showDevPanel && <DevTuningPanel onClose={() => setShowDevPanel(false)} />}
          {isCraftingOpen && (
            <CraftingMenu
              onClose={() => setIsCraftingOpen(false)}
              onCraft={handleCraft}
              wood={wood}
              plastic={plastic}
              hasRod={hasRod}
              hasSpear={hasSpear}
              hasHammer={hasHammer}
              hasRainBarrel={hasRainBarrel}
              hasCampfire={hasCampfire}
              walls={walls}
              roofs={roofs}
              floors={floors}
              spearTier={spearTier}
              needsRepair={needsRepair}
              expansions={expansions}
              capacity={storageCap}
              level={progression.level}
            />
          )}
          {isPerkOpen && (
            <PerkTree
              onClose={() => setIsPerkOpen(false)}
              level={progression.level}
              freePoints={progression.perkPoints}
              ranks={perkRanks}
              onSpendPerk={handleSpendPerk}
            />
          )}
          {gameOver && <GameOver onRespawn={handleRespawn} onSaveAndQuit={handleSaveAndQuit} />}
          {victory && !gameOver && (
            <Victory
              day={day}
              level={progression.level}
              coinsEarned={victoryCoins}
              onNewGamePlus={handleNewGamePlus}
              onMainMenu={() => { setVictory(false); setScene('menu'); }}
            />
          )}
          {showPause && !gameOver && !saveSlotsMode && (
            <PauseMenu
              onResume={() => setShowPause(false)}
              onSave={() => handleOpenSaveSlots('save')}
              onLoad={() => handleOpenSaveSlots('load')}
              onSettings={() => { setShowPause(false); setScene('settings'); }}
              onQuit={handleQuit}
            />
          )}
          {/* RAFT-507: multiple save slots (in-game save/load or from the main menu). */}
          {saveSlotsMode && (
            <SaveSlots
              mode={saveSlotsMode}
              onClose={() => setSaveSlotsMode(null)}
              onSelect={saveSlotsMode === 'save' ? handleSelectSaveSlot : loadFromSlot}
            />
          )}
          {/* RAFT-501: first-run / replay tutorial overlay. */}
          {showTutorial && <Tutorial onDismiss={() => setShowTutorial(false)} />}
          {/* RAFT-502: contextual hints + world messages. */}
          <HintToast />
          {/* RAFT-504: on-screen controls for touch devices. */}
          <TouchControls
            onAttack={handleAttack}
            onFish={handleFish}
            onHook={handleHook}
            onCraft={() => setIsCraftingOpen(prev => !prev)}
          />
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-12">
            <BackgroundMusic />
          </div>
          <button
            onClick={() => { setIsCraftingOpen(false); setShowPause(true); }}
            className="absolute top-2 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto bg-black/80 hover:bg-black text-white px-4 py-2 rounded text-[12px] border-2 border-yellow-500 cursor-pointer"
          >
            [P] Pause
          </button>
        </div>
      )}
      <AchievementToast />
    </main>
  );
}















