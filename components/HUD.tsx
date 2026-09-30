'use client';

import React from 'react';

type HUDProps = {
  health: number; hunger: number; fish: number; day: number; wood: number; plastic: number;
  onOpenCrafting: () => void; onEat: () => void; onAttack: () => void; onHook: () => void; hasSpear: boolean;
  playerState: 'standing' | 'sitting' | 'laying';
  onPoseChange: (pose: 'standing' | 'sitting' | 'laying') => void;
};

export default function HUD({ health, hunger, fish, day, wood, plastic, onOpenCrafting, onEat, onAttack, onHook, hasSpear, playerState, onPoseChange }: HUDProps) {
  return (
    <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between select-none">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1 items-start">
          <div className="flex gap-1 text-lg drop-shadow-[0_2px_0_rgba(0,0,0,1)]">
            {[1, 2, 3, 4, 5].map((heart) => <span key={heart}>{heart <= Math.ceil(health) ? '❤️' : '🖤'}</span>)}
          </div>
          <div className="text-xs text-white drop-shadow-[0_2px_0_rgba(0,0,0,1)] mt-1 leading-tight">
            <div>Wood: {wood}</div><div>Plastic: {plastic}</div>
          </div>
          <div className="flex flex-col gap-1 mt-1">
            <div className="w-36 h-3 bg-[#222] border border-black p-[1px]"><div className="h-full bg-[#F39C12]" style={{ width: `${Math.max(0, hunger)}%` }}></div></div>
            <div className="w-36 h-3 bg-[#222] border border-black p-[1px]"><div className="h-full bg-[#3498DB] w-[50%]"></div></div>
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
        <button className="pointer-events-auto bg-[#E74C3C] text-white text-xs px-4 py-3 border-[3px] border-[#8B0000] hover:bg-[#C0392B] transition-colors drop-shadow-[0_2px_0_rgba(0,0,0,1)]" style={{ fontFamily: '"Press Start 2P", monospace' }}>Main Menu</button>

        <div className="flex flex-col gap-2 items-end">
          {/* Pose Buttons */}
          <div className="flex gap-1 pointer-events-auto bg-black/60 p-2 rounded-lg">
            <button 
              onClick={() => onPoseChange('standing')}
              className={`px-3 py-2 text-xs font-bold rounded border-2 ${playerState === 'standing' ? 'bg-yellow-500 border-yellow-700 text-black' : 'bg-gray-700 border-gray-900 text-white hover:bg-gray-600'}`}
            >STAND</button>
            <button 
              onClick={() => onPoseChange('sitting')}
              className={`px-3 py-2 text-xs font-bold rounded border-2 ${playerState === 'sitting' ? 'bg-yellow-500 border-yellow-700 text-black' : 'bg-gray-700 border-gray-900 text-white hover:bg-gray-600'}`}
            >SIT</button>
            <button 
              onClick={() => onPoseChange('laying')}
              className={`px-3 py-2 text-xs font-bold rounded border-2 ${playerState === 'laying' ? 'bg-yellow-500 border-yellow-700 text-black' : 'bg-gray-700 border-gray-900 text-white hover:bg-gray-600'}`}
            >LAY</button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 pointer-events-auto">
            {hasSpear && (
              <div onClick={onAttack} className="w-14 h-14 bg-[#D35400] border-[3px] border-[#A04000] rounded-full flex items-center justify-center text-2xl shadow-lg cursor-pointer hover:bg-[#E67E22] transition-colors" title="Attack (Spacebar)">
                🔱
              </div>
            )}
            <div onClick={onEat} className="w-14 h-14 bg-[#E74C3C] border-[3px] border-[#8B0000] rounded-full flex items-center justify-center text-2xl shadow-lg cursor-pointer hover:bg-[#C0392B] transition-colors" title="Eat Fish">🐟</div>
            <div onClick={onOpenCrafting} className="w-14 h-14 bg-[#E6A15E] border-[3px] border-[#8B4513] rounded-full flex items-center justify-center text-2xl shadow-lg cursor-pointer hover:bg-[#D68D4A] transition-colors">⚒️</div>
            <div onClick={onHook} className="w-14 h-14 bg-[#2C3E50] border-[3px] border-[#F1C40F] rounded-full flex items-center justify-center text-2xl shadow-lg cursor-pointer hover:bg-[#34495E] transition-colors" title="Throw Hook (H)">🪝</div>
          </div>
        </div>
      </div>
    </div>
  );
}

