'use client';

import { useState, useCallback, useEffect } from 'react';
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

  // Check for existing save after mount (deferred so we never call setState
  // synchronously inside an effect, which would trigger cascading renders).
  useEffect(() => {
    const id = window.setTimeout(() => {
      setHasSave(!!localStorage.getItem('raftSave'));
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

  // ESC key handler
  useEffect(() => {
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && scene === 'playing' && !gameOver) {
        setScene('menu');
        setIsCraftingOpen(false);
      }
    };
    window.addEventListener('keydown', escHandler);
    return () => window.removeEventListener('keydown', escHandler);
  }, [scene, gameOver]);

  // Keyboard shortcuts for crafting, sit, lay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'c' && scene === 'playing' && !gameOver) setIsCraftingOpen(prev => !prev);
      if (e.key.toLowerCase() === 'r' && scene === 'playing' && !gameOver) setIsRecipeBookOpen(prev => !prev);
      if (e.key.toLowerCase() === 's' && scene === 'playing' && !gameOver) setPlayerState(prev => prev === 'sitting' ? 'standing' : 'sitting');
      if (e.key.toLowerCase() === 'l' && scene === 'playing' && !gameOver) setPlayerState(prev => prev === 'laying' ? 'standing' : 'laying');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scene, gameOver]);

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

  const handleSaveAndQuit = () => {
    const saveData = {
      health, hunger, thirst, fish, day, wood, plastic, raftWidth,
      hasRod, hasSpear, hasHammer, hasRainBarrel, hasCampfire, walls, roofs, floors, raftHealth,
    };
    localStorage.setItem('raftSave', JSON.stringify(saveData));
    setHasSave(true);
    setGameOver(false);
    setScene('menu');
  };

  const handleLoadGame = () => {
    const saved = localStorage.getItem('raftSave');
    if (saved) {
      const data = JSON.parse(saved);
      setHealth(data.health);
      setHunger(data.hunger);
      setThirst(data.thirst ?? 100);
      setRaftHealth(data.raftHealth ?? 100);
      setFish(data.fish);
      setDay(data.day);
      setWood(data.wood);
      setPlastic(data.plastic);
      setRaftWidth(data.raftWidth || 150);
      setHasRod(data.hasRod || false);
      setHasSpear(data.hasSpear || false);
      setHasHammer(data.hasHammer || false);
      setHasRainBarrel(data.hasRainBarrel || false);
      setHasCampfire(data.hasCampfire || false);
      setWalls(data.walls || 0);
      setRoofs(data.roofs || 0);
      setFloors(data.floors || 0);
      setGameId(prev => prev + 1);
      setGameOver(false);
      setPlayerState('standing');
      setScene('playing');
    }
  };

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
          onPlay={() => { setGameOver(false); setPlayerState('standing'); setScene('playing'); }}
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
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-12">
            <BackgroundMusic />
          </div>
          <button
            onClick={() => { setScene('menu'); setIsCraftingOpen(false); }}
            className="absolute top-2 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto bg-black/80 hover:bg-black text-white px-4 py-2 rounded text-[12px] border-2 border-yellow-500 cursor-pointer"
          >
            [ESC] Main Menu
          </button>
        </div>
      )}
      <AchievementToast />
    </main>
  );
}















