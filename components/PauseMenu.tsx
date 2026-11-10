'use client';
import React from 'react';

interface PauseMenuProps {
  onResume: () => void;
  onSave: () => void;
  onLoad: () => void;
  onSettings: () => void;
  onQuit: () => void;
}

export default function PauseMenu({ onResume, onSave, onLoad, onSettings, onQuit }: PauseMenuProps) {
  return (
    <div className="absolute inset-0 bg-black/75 flex items-center justify-center z-[65] pointer-events-auto">
      <div className="bg-[#E6A15E] border-4 border-[#8B4513] p-6 rounded-lg w-[20rem] shadow-2xl">
        <h2 className="text-xl font-bold text-[#5D4037] mb-6 text-center drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
          ⏸️ PAUSED
        </h2>
        <div className="flex flex-col gap-3">
          <button onClick={onResume} className="bg-[#27AE60] text-white p-3 border-2 border-[#1E8449] hover:bg-[#1E8449] transition-colors text-[10px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            ▶️ RESUME
          </button>
          <button onClick={onSave} className="bg-[#16A085] text-white p-3 border-2 border-[#117A65] hover:bg-[#117A65] transition-colors text-[10px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            💾 SAVE GAME
          </button>
          <button onClick={onLoad} className="bg-[#8E44AD] text-white p-3 border-2 border-[#6C3483] hover:bg-[#6C3483] transition-colors text-[10px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            📁 LOAD GAME
          </button>
          <button onClick={onSettings} className="bg-[#3498DB] text-white p-3 border-2 border-[#2980B9] hover:bg-[#2980B9] transition-colors text-[10px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            ⚙️ SETTINGS
          </button>
          <button onClick={onQuit} className="bg-[#E74C3C] text-white p-3 border-2 border-[#8B0000] hover:bg-[#C0392B] transition-colors text-[10px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            🚪 MAIN MENU
          </button>
        </div>
        <div className="mt-4 text-center text-[8px] text-[#5D4037] opacity-70" style={{ fontFamily: '"Press Start 2P", monospace' }}>
          Press P to resume
        </div>
      </div>
    </div>
  );
}
