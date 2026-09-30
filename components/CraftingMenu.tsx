'use client';

import React from 'react';

type CraftingMenuProps = {
  onClose: () => void;
  onCraft: (type: string) => void;
  wood: number;
  plastic: number;
  hasRod: boolean;
  hasSpear: boolean;
  hasHammer: boolean;
  hasRainBarrel: boolean;
  walls: number;
  roofs: number;
  floors: number;
};

export default function CraftingMenu({ onClose, onCraft, wood, plastic, hasRod, hasSpear, hasHammer, hasRainBarrel, walls, roofs, floors }: CraftingMenuProps) {
  const btn = (enabled: boolean, color: string) =>
    `p-2 border-2 text-[10px] flex flex-col items-center gap-1 transition-colors rounded ${enabled ? color : 'bg-gray-400 border-gray-500 text-gray-200 cursor-not-allowed'}`;

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 pointer-events-auto">
      <div className="bg-[#E6A15E] border-4 border-[#8B4513] p-4 rounded-lg w-[26rem] shadow-2xl max-h-[95%] overflow-y-auto">
        <h2 className="text-lg font-bold text-[#8B4513] mb-3 text-center drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]" style={{ fontFamily: '"Press Start 2P", monospace' }}>CRAFTING</h2>
        
        <div className="flex justify-between text-[10px] text-[#5D4037] mb-3 px-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>
          <span>Wood: {wood}</span>
          <span>Plastic: {plastic}</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {/* BASIC */}
          <button onClick={() => onCraft('REPAIR')} disabled={wood < 5} className={btn(wood >= 5, 'bg-[#2ECC71] border-[#27AE60] hover:bg-[#27AE60] text-white')} style={{ fontFamily: '"Press Start 2P", monospace' }}>
            <span>REPAIR RAFT</span><span className="text-[9px]">5 Wood</span>
          </button>

          <button onClick={() => onCraft('ROD')} disabled={wood < 5 || hasRod} className={btn(wood >= 5 && !hasRod, 'bg-[#F39C12] border-[#D68910] hover:bg-[#D68910] text-white')} style={{ fontFamily: '"Press Start 2P", monospace' }}>
            <span>{hasRod ? '✓ FISHING ROD' : 'FISHING ROD'}</span><span className="text-[9px]">5 Wood</span>
          </button>

          <button onClick={() => onCraft('SPEAR')} disabled={wood < 8 || hasSpear} className={btn(wood >= 8 && !hasSpear, 'bg-[#E74C3C] border-[#C0392B] hover:bg-[#C0392B] text-white')} style={{ fontFamily: '"Press Start 2P", monospace' }}>
            <span>{hasSpear ? '✓ WOODEN SPEAR' : 'WOODEN SPEAR'}</span><span className="text-[9px]">8 Wood</span>
          </button>

          {/* HAMMER - unlocks building */}
          <button onClick={() => onCraft('HAMMER')} disabled={wood < 8 || hasHammer} className={btn(wood >= 8 && !hasHammer, 'bg-[#8E44AD] border-[#6C3483] hover:bg-[#6C3483] text-white')} style={{ fontFamily: '"Press Start 2P", monospace' }}>
            <span>{hasHammer ? '✓ HAMMER' : 'HAMMER 🔨'}</span><span className="text-[9px]">8 Wood (Unlocks Building)</span>
          </button>

          {/* ADVANCED BUILDING - requires Hammer */}
          <button onClick={() => onCraft('WALL')} disabled={wood < 5 || !hasHammer || walls >= 4} className={btn(wood >= 5 && hasHammer && walls < 4, 'bg-[#3498DB] border-[#2980B9] hover:bg-[#2980B9] text-white')} style={{ fontFamily: '"Press Start 2P", monospace' }}>
            <span>BUILD WALL ({walls}/4)</span><span className="text-[9px]">5 Wood {!hasHammer ? '(Need Hammer)' : ''}</span>
          </button>

          <button onClick={() => onCraft('ROOF')} disabled={wood < 3 || plastic < 2 || !hasHammer || roofs >= 1} className={btn(wood >= 3 && plastic >= 2 && hasHammer && roofs < 1, 'bg-[#16A085] border-[#117864] hover:bg-[#117864] text-white')} style={{ fontFamily: '"Press Start 2P", monospace' }}>
            <span>{roofs >= 1 ? '✓ ROOF BUILT' : 'BUILD ROOF'}</span><span className="text-[9px]">3 Wood, 2 Plastic</span>
          </button>

          <button onClick={() => onCraft('RAIN_BARREL')} disabled={wood < 6 || !hasHammer || hasRainBarrel} className={btn(wood >= 6 && hasHammer && !hasRainBarrel, 'bg-[#2980B9] border-[#1F618D] hover:bg-[#1F618D] text-white')} style={{ fontFamily: '"Press Start 2P", monospace' }}>
            <span>{hasRainBarrel ? '✓ RAIN BARREL' : 'RAIN BARREL 🌧️'}</span><span className="text-[9px]">6 Wood</span>
          </button>

          <button onClick={() => onCraft('FLOOR')} disabled={wood < 4 || !hasHammer || floors >= 2} className={btn(wood >= 4 && hasHammer && floors < 2, 'bg-[#D35400] border-[#A04000] hover:bg-[#A04000] text-white')} style={{ fontFamily: '"Press Start 2P", monospace' }}>
            <span>BUILD FLOOR ({floors}/2)</span><span className="text-[9px]">4 Wood</span>
          </button>
        </div>

        <button onClick={onClose} className="mt-4 w-full bg-[#E74C3C] text-white p-2.5 border-2 border-[#8B0000] hover:bg-[#C0392B] transition-colors text-[10px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>CLOSE</button>
      </div>
    </div>
  );
}

