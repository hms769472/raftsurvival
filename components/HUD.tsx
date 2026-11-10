'use client';
import React from 'react';

type HUDProps = {
  health: number; hunger: number; thirst: number; fish: number; day: number; wood: number; plastic: number;
  onOpenCrafting: () => void; onOpenRecipes: () => void;
  onEat: () => void; onEatCooked: () => void; onCook: () => void; onDrink: () => void;
  onAttack: () => void; onHook: () => void;
  hasSpear: boolean; hasRainBarrel: boolean; barrelWater: number; raftHealth: number;
  /** RAFT-208: wood/plastic storage cap (raised by crates). */
  storageCap: number;
  playerState: 'standing' | 'sitting' | 'laying';
  onPoseChange: (pose: 'standing' | 'sitting' | 'laying') => void;
  onMainMenu: () => void;
};

export default function HUD({ health, hunger, thirst, fish, day, wood, plastic, onOpenCrafting, onOpenRecipes, onEat, onEatCooked, onCook, onDrink, onAttack, onHook, hasSpear, hasRainBarrel, barrelWater, raftHealth, storageCap, playerState, onPoseChange, onMainMenu }: HUDProps) {
  return (
    <>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between select-none">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1 items-start">
            <div className="flex gap-1 text-lg drop-shadow-[0_2px_0_rgba(0,0,0,1)]">
              {[1, 2, 3, 4, 5].map((heart) => <span key={heart}>{heart <= Math.ceil(health) ? '❤️' : '🖤'}</span>)}
            </div>
            <div className="text-xs text-white drop-shadow-[0_2px_0_rgba(0,0,0,1)] mt-1 leading-tight">
              <div>Wood: {wood}/{storageCap}</div>
              <div>Plastic: {plastic}/{storageCap}</div>
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <div className="w-36 h-3 bg-[#222] border border-black p-[1px]"><div className="h-full bg-[#F39C12]" style={{ width: `${Math.max(0, hunger)}%` }}></div></div>
              <div className="w-36 h-3 bg-[#222] border border-black p-[1px]"><div className="h-full bg-[#3498DB]" style={{ width: `${Math.max(0, thirst)}%` }}></div></div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] text-white">🪵</span>
                <div className="w-32 h-3 bg-[#222] border border-black p-[1px]"><div className={`h-full ${raftHealth > 60 ? 'bg-[#8B4513]' : raftHealth > 30 ? 'bg-[#D68910]' : 'bg-[#E74C3C]'}`} style={{ width: `${Math.max(0, Math.min(100, raftHealth))}%` }}></div></div>
              </div>
            </div>
            <div className="text-sm text-white drop-shadow-[0_2px_0_rgba(0,0,0,1)] mt-1">Day {day}</div>
          </div>

          <div className="flex gap-1 pointer-events-auto">
            {[1, 2, 3, 4, 5].map((slot) => (
              <div key={slot} className="w-12 h-12 bg-[#E6A15E] border-[3px] border-[#8B4513] shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] flex items-center justify-center text-xl">
                {slot === 1 && fish > 0 ? `🐟x${fish}` : ''}
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
              <div onClick={onEat} className="w-14 h-14 bg-[#E74C3C] border-[3px] border-[#8B0000] rounded-full flex items-center justify-center text-2xl cursor-pointer active:scale-90 transition-transform" title="Eat Raw">🐟</div>
              {hasRainBarrel && (<div onClick={onDrink} className="w-14 h-14 bg-[#3498DB] border-[3px] border-[#1F618D] rounded-full flex items-center justify-center text-2xl cursor-pointer" title="Drink">💧</div>)}
              <div onClick={onOpenRecipes} className="w-14 h-14 bg-[#8E44AD] border-[3px] border-[#6C3483] rounded-full flex items-center justify-center text-2xl cursor-pointer" title="Recipes">📖</div>
              <div onClick={onOpenCrafting} className="w-14 h-14 bg-[#E6A15E] border-[3px] border-[#8B4513] rounded-full flex items-center justify-center text-2xl cursor-pointer" title="Craft">⚒️</div>
              <div onClick={onHook} className="w-14 h-14 bg-[#2C3E50] border-[3px] border-[#F1C40F] rounded-full flex items-center justify-center text-2xl cursor-pointer" title="Hook">🪝</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}




