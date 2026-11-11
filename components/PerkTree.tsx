'use client';
import React from 'react';
import { PERK_BRANCHES, PERKS, perkRank, type PerkRanks } from '@/lib/systems/perks';

type PerkTreeProps = {
  onClose: () => void;
  level: number;
  /** Unspent perk points. */
  freePoints: number;
  ranks: PerkRanks;
  onSpendPerk: (id: string) => void;
};

/** RAFT-302: perk tree modal — three branches, spend perk points on ranks. */
export default function PerkTree({
  onClose,
  level,
  freePoints,
  ranks,
  onSpendPerk,
}: PerkTreeProps) {
  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 pointer-events-auto">
      <div className="bg-[#E6A15E] border-4 border-[#8B4513] p-4 rounded-lg w-[30rem] max-h-[95%] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-sm font-bold text-[#8B4513]"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            PERKS
          </h2>
          <span
            className="text-[10px] text-[#5D4037]"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            LV {level} · Points: {freePoints}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {PERK_BRANCHES.map((branch) => (
            <div key={branch.id} className="flex flex-col gap-1.5">
              <div
                className="bg-[#8B4513] text-white text-[9px] text-center py-1 rounded"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                {branch.name}
              </div>
              {PERKS.filter((p) => p.branch === branch.id).map((perk) => {
                const rank = perkRank(ranks, perk.id);
                const maxed = rank >= perk.maxRank;
                const canBuy = !maxed && freePoints > 0;
                return (
                  <button
                    key={perk.id}
                    onClick={() => canBuy && onSpendPerk(perk.id)}
                    disabled={!canBuy}
                    className={`text-left p-2 rounded border-2 transition-colors ${maxed ? 'bg-[#2ECC71] border-[#1E8449] text-white' : canBuy ? 'bg-[#FFF8DC] border-[#DAA520] hover:bg-[#F5DEB3]' : 'bg-gray-300 border-gray-400 text-gray-600 cursor-not-allowed'}`}
                  >
                    <div
                      className="text-[8px] font-bold"
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      {perk.name} {rank}/{perk.maxRank}
                    </div>
                    <div className="text-[9px] mt-1 leading-tight">{perk.desc}</div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-[#E74C3C] text-white p-3 border-2 border-[#8B0000] hover:bg-[#C0392B] text-xs"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}
