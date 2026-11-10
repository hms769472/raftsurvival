'use client';
import React from 'react';

type HUDProps = {
  health: number; hunger: number; thirst: number; fish: number; day: number; wood: number; plastic: number;
  onOpenCrafting: () => void; onOpenRecipes: () => void;
  onEat: () => void; onEatCooked: () => void; onEatDried: () => void; onCook: () => void; onDrink: () => void;
  onAttack: () => void; onHook: () => void;
  hasSpear: boolean; hasRainBarrel: boolean; barrelWater: number; raftHealth: number;
  /** RAFT-208: wood/plastic storage cap (raised by crates). */
  storageCap: number;
  /** RAFT-302: max hearts (base 5 + Fighter "Vigor" bonus). */
  maxHearts: number;
  /** RAFT-301: player level and XP fill (0..1) for the XP bar. */
  level: number; xpFill: number;
  /** RAFT-304: active objective text + progress (0..1), or null when done. */
  objective: string | null; objectiveFill: number;
  /** RAFT-305: cooked fish held (drying rack / campfire). */
  cookedFish: number;
  /** RAFT-405: dried fish held (drying rack output). */
  driedFish: number;
  /** RAFT-302: open the perk tree; shows a badge when points are available. */
  freePerkPoints: number; onOpenPerks: () => void;
  playerState: 'standing' | 'sitting' | 'laying';
  onPoseChange: (pose: 'standing' | 'sitting' | 'laying') => void;
  onMainMenu: () => void;
  /** RAFT-505: nearest active threat, drives the flashing enemy warning. */
  threat?: 'shark' | 'frog' | null;
};

export default function HUD({ health, hunger, thirst, fish, day, wood, plastic, onOpenCrafting, onOpenRecipes, onEat, onEatCooked, onEatDried, onCook, onDrink, onAttack, onHook, hasSpear, hasRainBarrel, barrelWater, raftHealth, storageCap, maxHearts, level, xpFill, objective, objectiveFill, cookedFish, driedFish, freePerkPoints, onOpenPerks, playerState, onPoseChange, onMainMenu, threat }: HUDProps) {
  return (
    <>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between select-none">
        {/* RAFT-505: flashing warning when an enemy is on the raft. */}
        {threat && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
            <div className="px-3 py-1 bg-[#E74C3C]/90 border-2 border-[#8B0000] rounded text-white text-[11px] font-bold tracking-wide" style={{ animation: 'pulse 0.6s infinite' }}>
              {threat === 'shark' ? '🦈 SHARK ATTACK!' : '🐸 FROGS INCOMING!'}
            </div>
          </div>
        )}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1 items-start">
            <div className="flex gap-1 text-lg drop-shadow-[0_2px_0_rgba(0,0,0,1)]">
              {Array.from({ length: Math.max(1, maxHearts) }, (_, i) => i + 1).map((heart) => <span key={heart}>{heart <= Math.ceil(health) ? '❤️' : '🖤'}</span>)}
            </div>
            <div className="text-xs text-white drop-shadow-[0_2px_0_rgba(0,0,0,1)] mt-1 leading-tight">
              <div>Wood: {wood}/{storageCap}</div>
              <div>Plastic: {plastic}/{storageCap}</div>
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center gap-1">
                <span className="text-[10px] w-3 text-center">🍖</span>
                <div className="w-36 h-3 bg-[#222] border border-black p-[1px]"><div className="h-full bg-[#F39C12]" style={{ width: `${Math.max(0, hunger)}%` }}></div></div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] w-3 text-center">💧</span>
                <div className="w-36 h-3 bg-[#222] border border-black p-[1px]"><div className="h-full bg-[#3498DB]" style={{ width: `${Math.max(0, thirst)}%` }}></div></div>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] w-3 text-center">🪵</span>
                <div className="w-32 h-3 bg-[#222] border border-black p-[1px]"><div className={`h-full ${raftHealth > 60 ? 'bg-[#8B4513]' : raftHealth > 30 ? 'bg-[#D68910]' : 'bg-[#E74C3C]'}`} style={{ width: `${Math.max(0, Math.min(100, raftHealth))}%` }}></div></div>
              </div>
            </div>
            <div className="text-sm text-white drop-shadow-[0_2px_0_rgba(0,0,0,1)] mt-1">Day {day}</div>
            {/* RAFT-301: level + XP bar */}
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-yellow-200 drop-shadow-[0_2px_0_rgba(0,0,0,1)]" style={{ fontFamily: '"Press Start 2P", monospace' }}>LV{level}</span>
              <div className="w-28 h-2.5 bg-[#222] border border-black p-[1px]">
                <div className="h-full bg-[#9B59B6]" style={{ width: `${Math.round(xpFill * 100)}%` }}></div>
              </div>
            </div>
            {/* RAFT-304: active objective */}
            {objective && (
              <div className="mt-1 max-w-[11rem]">
                <div className="text-[9px] text-white drop-shadow-[0_2px_0_rgba(0,0,0,1)] leading-tight">🎯 {objective}</div>
                <div className="w-28 h-1.5 bg-[#222] border border-black p-[1px] mt-0.5">
                  <div className="h-full bg-[#2ECC71]" style={{ width: `${Math.round(objectiveFill * 100)}%` }}></div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-1 pointer-events-auto">
            {[1, 2, 3, 4, 5].map((slot) => (
              <div key={slot} className="w-12 h-12 bg-[#E6A15E] border-[3px] border-[#8B4513] shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] flex items-center justify-center text-xl">
                {slot === 1 && fish > 0 ? `🐟x${fish}` : slot === 2 && cookedFish > 0 ? `🍗x${cookedFish}` : slot === 3 && driedFish > 0 ? `🥓x${driedFish}` : ''}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-end w-full">
          <div onClick={onMainMenu} className="pointer-events-auto bg-[#E74C3C] text-white text-xs px-4 py-3 border-[3px] border-[#8B0000] cursor-pointer" style={{ fontFamily: '"Press Start 2P", monospace' }}>Main Menu</div>

          <div className="flex flex-col gap-2 items-end">
            <div className="flex gap-1 pointer-events-auto bg-black/60 p-2 rounded-lg">
              <button onClick={() => onPoseChange('standing')} className={`px-3 py-2 text-xs font-bold rounded border-2 ${playerState === 'standing' ? 'bg-yellow-500 border-yellow-700 text-black' : 'bg-gray-700 border-gray-900 text-white'}`}>STAND</button>
              <button onClick={() => onPoseChange('sitting')} className={`px-3 py-2 text-xs font-bold rounded border-2 ${playerState === 'sitting' ? 'bg-yellow-500 border-yellow-700 text-black' : 'bg-gray-700 border-gray-900 text-white'}`}>SIT</button>
              <button onClick={() => onPoseChange('laying')} className={`px-3 py-2 text-xs font-bold rounded border-2 ${playerState === 'laying' ? 'bg-yellow-500 border-yellow-700 text-black' : 'bg-gray-700 border-gray-900 text-white'}`}>LAY</button>
            </div>

            <div className="flex gap-2 pointer-events-auto">
              {hasSpear && (<div onClick={onAttack} className="w-14 h-14 bg-[#D35400] border-[3px] border-[#A04000] rounded-full flex items-center justify-center text-2xl cursor-pointer" title="Attack">🔱</div>)}
              <div onClick={onCook} className="w-14 h-14 bg-[#E67E22] border-[3px] border-[#A04000] rounded-full flex items-center justify-center text-2xl cursor-pointer active:scale-90 transition-transform" title="Cook Fish">🍳</div>
              <div onClick={onEatCooked} className="w-14 h-14 bg-[#F1C40F] border-[3px] border-[#B7950B] rounded-full flex items-center justify-center text-2xl cursor-pointer active:scale-90 transition-transform" title="Eat Cooked">🍽️</div>
              {driedFish > 0 && (<div onClick={onEatDried} className="w-14 h-14 bg-[#B9770E] border-[3px] border-[#7E5109] rounded-full flex items-center justify-center text-2xl cursor-pointer active:scale-90 transition-transform" title="Eat Dried">🥓</div>)}
              <div onClick={onEat} className="w-14 h-14 bg-[#E74C3C] border-[3px] border-[#8B0000] rounded-full flex items-center justify-center text-2xl cursor-pointer active:scale-90 transition-transform" title="Eat Raw">🐟</div>
              {hasRainBarrel && (<div onClick={onDrink} className="w-14 h-14 bg-[#3498DB] border-[3px] border-[#1F618D] rounded-full flex items-center justify-center text-2xl cursor-pointer" title="Drink">💧</div>)}
              <div onClick={onOpenRecipes} className="w-14 h-14 bg-[#8E44AD] border-[3px] border-[#6C3483] rounded-full flex items-center justify-center text-2xl cursor-pointer" title="Recipes">📖</div>
              <div onClick={onOpenCrafting} className="w-14 h-14 bg-[#E6A15E] border-[3px] border-[#8B4513] rounded-full flex items-center justify-center text-2xl cursor-pointer" title="Craft">⚒️</div>
              <div onClick={onOpenPerks} className={`relative w-14 h-14 border-[3px] rounded-full flex items-center justify-center text-2xl cursor-pointer ${freePerkPoints > 0 ? 'bg-[#9B59B6] border-[#7D3C98]' : 'bg-[#6C3483] border-[#4A235A]'}`} title="Perks">
                ⭐
                {freePerkPoints > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#E74C3C] text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center border border-black">{freePerkPoints}</span>
                )}
              </div>
              <div onClick={onHook} className="w-14 h-14 bg-[#2C3E50] border-[3px] border-[#F1C40F] rounded-full flex items-center justify-center text-2xl cursor-pointer" title="Hook">🪝</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}




