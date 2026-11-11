'use client';
import React from 'react';

type VictoryProps = {
  day: number;
  level: number;
  coinsEarned: number;
  onNewGamePlus: () => void;
  onMainMenu: () => void;
};

/** RAFT-306: win screen shown after surviving to WIN_DAY, with a New Game+ hook. */
export default function Victory({
  day,
  level,
  coinsEarned,
  onNewGamePlus,
  onMainMenu,
}: VictoryProps) {
  return (
    <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-[90]">
      <div className="text-7xl mb-4">🏝️</div>
      <h1
        className="text-3xl font-bold text-[#F5D76E] mb-6 tracking-widest drop-shadow-[0_4px_0_rgba(0,0,0,1)] text-center"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        YOU SURVIVED!
      </h1>
      <div className="bg-[#FFF8DC] border-4 border-[#DAA520] rounded-lg p-5 mb-6 w-72 text-center">
        <div
          className="text-[10px] text-[#5D4037] mb-2"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          Days survived: {day}
        </div>
        <div
          className="text-[10px] text-[#5D4037] mb-2"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          Level reached: {level}
        </div>
        <div
          className="text-[10px] text-[#5D4037]"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          🪙 Coins earned: {coinsEarned}
        </div>
      </div>
      <div className="flex flex-col gap-4 w-64">
        <button
          onClick={onNewGamePlus}
          className="bg-[#2ECC71] text-white text-sm p-4 border-4 border-[#1E8449] hover:bg-[#27AE60] font-bold"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          NEW GAME +
        </button>
        <button
          onClick={onMainMenu}
          className="bg-[#E6A15E] text-[#5D4037] text-sm p-4 border-4 border-[#8B4513] hover:bg-[#D68D4A] font-bold"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          MAIN MENU
        </button>
      </div>
    </div>
  );
}
