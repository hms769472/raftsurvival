'use client';

import React from 'react';

type GameOverProps = {
  onRespawn: () => void;
  onSaveAndQuit: () => void;
};

export default function GameOver({ onRespawn, onSaveAndQuit }: GameOverProps) {
  return (
    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
      <div className="text-8xl mb-6">💀</div>
      <h1
        className="text-5xl font-bold text-white mb-12 tracking-widest drop-shadow-[0_4px_0_rgba(255,0,0,1)]"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        YOU DIED!
      </h1>

      <div className="flex flex-col gap-6 w-64">
        <button
          onClick={onRespawn}
          className="bg-[#E6A15E] text-[#5D4037] text-sm p-4 border-4 border-[#8B4513] hover:bg-[#D68D4A] transition-colors w-full font-bold"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          RESPAWN
        </button>
        <button
          onClick={onSaveAndQuit}
          className="bg-[#E6A15E] text-[#5D4037] text-sm p-4 border-4 border-[#8B4513] hover:bg-[#D68D4A] transition-colors w-full font-bold"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          SAVE & QUIT
        </button>
      </div>
    </div>
  );
}
