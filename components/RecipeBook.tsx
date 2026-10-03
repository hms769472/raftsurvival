'use client';

import React from 'react';

interface RecipeBookProps {
  onClose: () => void;
}

export default function RecipeBook({ onClose }: RecipeBookProps) {
  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[60] pointer-events-auto">
      <div className="bg-[#E6A15E] border-4 border-[#8B4513] p-4 rounded-lg w-[30rem] max-h-[90%] overflow-y-auto shadow-2xl">
        <h2 className="text-lg font-bold text-[#5D4037] mb-3 text-center drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]" style={{ fontFamily: '"Press Start 2P", monospace' }}>📖 RECIPE BOOK</h2>
        <div className="flex flex-col gap-2">
          <div className="bg-[#FFF8DC] border-2 border-[#8B4513] rounded p-2">
            <div className="text-[10px] font-bold text-[#8B4513] mb-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>🔨 HAMMER</div>
            <div className="text-[9px] text-[#5D4037]" style={{ fontFamily: '"Press Start 2P", monospace' }}>Cost: 8 Wood</div>
            <div className="text-[8px] text-[#8B4513] mt-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>Unlocks all advanced building</div>
          </div>
          <div className="bg-[#FFF8DC] border-2 border-[#8B4513] rounded p-2">
            <div className="text-[10px] font-bold text-[#8B4513] mb-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>🎣 FISHING ROD</div>
            <div className="text-[9px] text-[#5D4037]" style={{ fontFamily: '"Press Start 2P", monospace' }}>Cost: 5 Wood</div>
            <div className="text-[8px] text-[#8B4513] mt-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>Press F to cast. Catch fish for food</div>
          </div>
          <div className="bg-[#FFF8DC] border-2 border-[#8B4513] rounded p-2">
            <div className="text-[10px] font-bold text-[#8B4513] mb-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>🔱 WOODEN SPEAR</div>
            <div className="text-[9px] text-[#5D4037]" style={{ fontFamily: '"Press Start 2P", monospace' }}>Cost: 8 Wood</div>
            <div className="text-[8px] text-[#8B4513] mt-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>Press SPACE to attack frogs and sharks</div>
          </div>
          <div className="bg-[#FFF8DC] border-2 border-[#8B4513] rounded p-2">
            <div className="text-[10px] font-bold text-[#8B4513] mb-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>🌧️ RAIN BARREL</div>
            <div className="text-[9px] text-[#5D4037]" style={{ fontFamily: '"Press Start 2P", monospace' }}>Cost: 6 Wood</div>
            <div className="text-[8px] text-[#8B4513] mt-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>Collects rainwater. Click 💧 to drink</div>
          </div>
          <div className="bg-[#FFF8DC] border-2 border-[#8B4513] rounded p-2">
            <div className="text-[10px] font-bold text-[#8B4513] mb-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>🔥 CAMPFIRE</div>
            <div className="text-[9px] text-[#5D4037]" style={{ fontFamily: '"Press Start 2P", monospace' }}>Cost: 5 Wood</div>
            <div className="text-[8px] text-[#8B4513] mt-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>Warmth at night. No cold damage</div>
          </div>
          <div className="bg-[#FFF8DC] border-2 border-[#8B4513] rounded p-2">
            <div className="text-[10px] font-bold text-[#8B4513] mb-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>🏗️ WALLS / ROOF / FLOORS</div>
            <div className="text-[9px] text-[#5D4037]" style={{ fontFamily: '"Press Start 2P", monospace' }}>5 Wood each (need Hammer)</div>
            <div className="text-[8px] text-[#8B4513] mt-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>Expands your raft and shelter</div>
          </div>
          <div className="bg-[#FFF8DC] border-2 border-[#8B4513] rounded p-2 mt-1">
            <div className="text-[10px] font-bold text-[#8B4513] mb-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>💡 TIPS</div>
            <div className="text-[8px] text-[#5D4037] leading-loose" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              • Hook (H key) catches floating items<br/>
              • Stand on raft middle to avoid shark<br/>
              • Golden fish = double hunger<br/>
              • Treasure chests & shipwrecks = big loot<br/>
              • Collect food before night
            </div>
          </div>
        </div>
        <button onClick={onClose} className="mt-3 w-full bg-[#E74C3C] text-white p-2 border-2 border-[#8B0000] hover:bg-[#C0392B] transition-colors text-[10px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>CLOSE</button>
      </div>
    </div>
  );
}
