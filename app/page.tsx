'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
import BackgroundMusic from '@/components/BackgroundMusic';
import { loadSnapshot, saveSnapshot, hasSnapshot, type GameSnapshot, type SnapshotStore } from '@/lib/save';

export default function Home() {
  const [scene, setScene] = useState<'menu' | 'playing' | 'settings' | 'credits' | 'coop' | 'achievements'>('menu');
  const [gameId, setGameId] = useState(0);
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
  const [isCraftingOpen, setIsCraftingOpen] = useState(false);
  const [isRecipeBookOpen, setIsRecipeBookOpen] = useState(false);
  const [craftAction, setCraftAction] = useState<{ type: string; id: number } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const [playerState, setPlayerState] = useState<'standing' | 'sitting' | 'laying'>('standing');
  const [gameScale, setGameScale] = useState(1);
  const [barrelWater, setBarrelWater] = useState(0);
  // Snapshot the Game writes every frame; the page persists it on save/autosave.
  const snapshotStore: SnapshotStore = useRef<GameSnapshot | null>(null);
  const [initialState, setInitialState] = useState<GameSnapshot | null>(null);
  const [showPause, setShowPause] = useState(false);

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

  // Poll barrel water from game (Game exposes it via window.__barrelWater)
  useEffect(() => {
    const interval = setInterval(() => {
      const w = window.__barrelWater;
      if (typeof w === 'number') setBarrelWater(w);
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
        setIsCraftingOpen(false);
        setIsRecipeBookOpen(false);
        setShowPause(prev => !prev);
      }
    };
    window.addEventListener('keydown', escHandler);
    return () => window.removeEventListener('keydown', escHandler);
  }, [scene, gameOver]);

  // Keyboard shortcuts for crafting, sit, lay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (scene !== 'playing' || gameOver || showPause) return;
      if (e.key.toLowerCase() === 'c') setIsCraftingOpen(prev => !prev);
      if (e.key.toLowerCase() === 'r') setIsRecipeBookOpen(prev => !prev);
      if (e.key.toLowerCase() === 's') setPlayerState(prev => prev === 'sitting' ? 'standing' : 'sitting');
      if (e.key.toLowerCase() === 'l') setPlayerState(prev => prev === 'laying' ? 'standing' : 'laying');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scene, gameOver, showPause]);

  // Raft expansion (handled directly in handleCraft to avoid a state-sync effect)

  const handleStatsUpdate = useCallback((stats: { health: number; hunger: number; thirst: number; fish: number; day: number; wood: number; plastic: number; raftHealth: number }) => {
    setHealth(stats.health);
    setHunger(stats.hunger);
    setThirst(stats.thirst ?? 100);
    setFish(stats.fish);
    setDay(stats.day);
    setWood(stats.wood);
    setPlastic(stats.plastic);
    setRaftHealth(stats.raftHealth ?? 100);
  }, []);

  const handleCraft = (type: string) => {
    if (type === 'ROD') setHasRod(true);
    if (type === 'SPEAR') setHasSpear(true);
    if (type === 'HAMMER') setHasHammer(true);
    if (type === 'RAIN_BARREL') setHasRainBarrel(true);
    if (type === 'CAMPFIRE') setHasCampfire(true);
    if (type === 'WALL') setWalls(prev => Math.min(prev + 1, 4));
    if (type === 'ROOF') setRoofs(prev => Math.min(prev + 1, 1));
    if (type === 'FLOOR') setFloors(prev => Math.min(prev + 1, 2));
    if (type === 'EXPAND') setRaftWidth(prev => prev + 40);
    setCraftAction({ type, id: Date.now() });
  };

  const handleCraftComplete = useCallback(() => setCraftAction(null), []);

  const handleCook = () => { window.__cookFish?.(); };
  const handleEatCooked = () => { window.__eatCookedFish?.(); };

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

  const handleGameOver = useCallback(() => {
    try {
      const stats = JSON.parse(localStorage.getItem('raftAchStats') || '{}');
      const earned = Math.floor(day * 5) + Math.floor((stats.totalFishEaten || 0) * 0.5);
      if (earned > 0) {
        const current = parseInt(localStorage.getItem('raftCoins') || '0');
        localStorage.setItem('raftCoins', String(current + earned));
      }
    } catch (e) {}
    setGameOver(true); // COINS REWARD v2
  }, []);

  const handleRespawn = () => {
    setGameOver(false);
    setGameId(prev => prev + 1);
    setHealth(5);
    setHunger(100);
    setThirst(100);
    setRaftHealth(100);
    setFish(0);
    setDay(1);
    setWood(0);
    setPlastic(0);
    setRaftWidth(150);
    setHasRod(false);
    setHasSpear(false);
    setHasHammer(false);
    setHasRainBarrel(false);
    setHasCampfire(false);
    setWalls(0);
    setRoofs(0);
    setFloors(0);
    setPlayerState('standing');
  };

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

  // RAFT-006: restore the exact run from the persisted snapshot.
  const handleLoadGame = useCallback(() => {
    const data = loadSnapshot();
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
    setHasHammer(data.hasHammer);
    setHasRainBarrel(data.hasRainBarrel);
    setHasCampfire(data.hasCampfire);
    setWalls(data.walls);
    setRoofs(data.roofs);
    setFloors(data.floors);
    setBarrelWater(data.barrelWater);
    setHasSave(true);
    setGameOver(false);
    setShowPause(false);
    setPlayerState('standing');
    setGameId(prev => prev + 1);
    setScene('playing');
  }, []);

  // RAFT-007: fresh run — clear any loaded snapshot so <Game> boots from defaults.
  const handlePlay = useCallback(() => {
    setInitialState(null);
    setGameOver(false);
    setShowPause(false);
    setPlayerState('standing');
    setScene('playing');
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black relative overflow-hidden">
      {scene === 'achievements' ? (
        <AchievementsPanel onClose={() => setScene('menu')} />
      ) : scene === 'coop' ? (
        <CoopMenu onClose={() => setScene('menu')} />
      ) : scene === 'credits' ? (
        <CreditsScreen onClose={() => setScene('menu')} />
      ) : scene === 'settings' ? (
        <SettingsMenu onClose={() => setScene('menu')} />
      ) : scene === 'menu' ? (
        <MainMenu
          onPlay={handlePlay}
          onLoad={handleLoadGame}
          onSettings={() => setScene('settings')}
          onCredits={() => setScene('credits')}
          onCoop={() => setScene('coop')}
          onAchievements={() => setScene('achievements')}
          hasSave={hasSave}
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
            playerState={playerState}
            initialState={initialState}
            snapshotStore={snapshotStore}
            paused={showPause}
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
            onDrink={handleDrink}
            onAttack={handleAttack}
            onHook={handleHook}
            hasSpear={hasSpear}
            hasRainBarrel={hasRainBarrel}
            barrelWater={barrelWater}
            raftHealth={raftHealth}
            playerState={playerState}
            onPoseChange={setPlayerState}
            onMainMenu={() => { setScene('menu'); setIsCraftingOpen(false); setIsRecipeBookOpen(false); }}
          />
          {isRecipeBookOpen && (
            <RecipeBook onClose={() => setIsRecipeBookOpen(false)} />
          )}
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
            />
          )}
          {gameOver && <GameOver onRespawn={handleRespawn} onSaveAndQuit={handleSaveAndQuit} />}
          {showPause && !gameOver && (
            <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/70">
              <div className="bg-[#FFF8DC] border-4 border-[#DAA520] rounded-lg p-6 flex flex-col items-center gap-4 min-w-[320px] shadow-2xl">
                <h2
                  className="text-[14px] text-[#8B4513] tracking-widest"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  PAUSED
                </h2>
                <button
                  onClick={handleSaveAndQuit}
                  className="w-full bg-[#8B4513] hover:bg-[#5D4037] text-white px-4 py-2 rounded text-[10px]"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  SAVE &amp; QUIT
                </button>
                <button
                  onClick={handleQuit}
                  className="w-full bg-[#8B4513] hover:bg-[#5D4037] text-white px-4 py-2 rounded text-[10px]"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  QUIT
                </button>
                <button
                  onClick={() => setShowPause(false)}
                  className="w-full bg-[#DAA520] hover:bg-[#B8860B] text-black px-4 py-2 rounded text-[10px]"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-12">
            <BackgroundMusic />
          </div>
          <button
            onClick={() => { setIsCraftingOpen(false); setShowPause(true); }}
            className="absolute top-2 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto bg-black/80 hover:bg-black text-white px-4 py-2 rounded text-[12px] border-2 border-yellow-500 cursor-pointer"
          >
            [ESC] Pause
          </button>
        </div>
      )}
      <AchievementToast />
    </main>
  );
}















