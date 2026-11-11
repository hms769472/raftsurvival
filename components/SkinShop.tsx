'use client';

import { useState } from 'react';

interface SkinShopProps {
  onClose: () => void;
}

interface ShopSkin {
  id: string;
  name: string;
  cost: number;
  color: string;
  accent: string;
}

const SKINS: ShopSkin[] = [
  { id: 'default', name: 'Classic Wood', cost: 0, color: '#8B4513', accent: '#A0522D' },
  { id: 'dark', name: 'Dark Oak', cost: 50, color: '#3E2723', accent: '#5D4037' },
  { id: 'bamboo', name: 'Bamboo', cost: 100, color: '#F9A825', accent: '#FBC02D' },
  { id: 'ice', name: 'Ice Raft', cost: 200, color: '#B3E5FC', accent: '#E1F5FE' },
  { id: 'lava', name: 'Lava', cost: 300, color: '#BF360C', accent: '#E64A19' },
  { id: 'gold', name: 'Golden', cost: 500, color: '#FFD700', accent: '#FFF176' },
  { id: 'neon', name: 'Neon', cost: 750, color: '#9C27B0', accent: '#E040FB' },
  { id: 'dragon', name: 'Dragon Scale', cost: 1000, color: '#1B5E20', accent: '#4CAF50' },
];

function loadCoins(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const c = localStorage.getItem('raftCoins');
    if (c) {
      const n = parseInt(c, 10);
      if (!Number.isNaN(n)) return n;
    }
  } catch {}
  return 0;
}

function loadOwned(): string[] {
  if (typeof window === 'undefined') return ['default'];
  try {
    const o = localStorage.getItem('raftOwnedSkins');
    if (o) {
      const parsed = JSON.parse(o);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return ['default'];
}

function loadSelected(): string {
  if (typeof window === 'undefined') return 'default';
  try {
    const s = localStorage.getItem('raftSelectedSkin');
    if (s) return s;
  } catch {}
  return 'default';
}

export default function SkinShop({ onClose }: SkinShopProps) {
  const [coins, setCoins] = useState(loadCoins);
  const [owned, setOwned] = useState<string[]>(loadOwned);
  const [selected, setSelected] = useState(loadSelected);

  const save = (newCoins: number, newOwned: string[], newSelected: string) => {
    localStorage.setItem('raftCoins', String(newCoins));
    localStorage.setItem('raftOwnedSkins', JSON.stringify(newOwned));
    localStorage.setItem('raftSelectedSkin', newSelected);
  };

  const buy = (skin: ShopSkin) => {
    if (owned.includes(skin.id)) {
      setSelected(skin.id);
      save(coins, owned, skin.id);
      return;
    }
    if (coins < skin.cost) return;
    const newCoins = coins - skin.cost;
    const newOwned = [...owned, skin.id];
    setCoins(newCoins);
    setOwned(newOwned);
    setSelected(skin.id);
    save(newCoins, newOwned, skin.id);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#2D8FBD] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent"></div>
      <div className="z-10 bg-[#E6A15E] border-4 border-[#8B4513] p-5 rounded-lg w-[28rem] max-h-[88vh] overflow-y-auto shadow-2xl">
        <h2
          className="text-lg font-bold text-[#5D4037] mb-3 text-center drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          🎨 RAFT SKINS
        </h2>
        <div className="bg-[#FFF8DC] border-2 border-[#8B4513] rounded p-2 mb-3 text-center">
          <div
            className="text-[10px] text-[#8B4513]"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            🪙 COINS: {coins}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {SKINS.map((skin) => {
            const isOwned = owned.includes(skin.id);
            const isSelected = selected === skin.id;
            const canBuy = !isOwned && coins >= skin.cost;
            return (
              <div
                key={skin.id}
                className={`border-2 rounded p-2 flex items-center gap-3 ${isSelected ? 'bg-[#FFF8DC] border-[#DAA520]' : 'bg-[#F5DEB3] border-[#8B4513]'}`}
              >
                <div
                  className="w-12 h-8 rounded border-2 border-black flex-shrink-0"
                  style={{
                    background: `linear-gradient(180deg, ${skin.accent} 0%, ${skin.color} 100%)`,
                  }}
                ></div>
                <div className="flex-1">
                  <div
                    className="text-[9px] font-bold text-[#5D4037]"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    {skin.name}
                  </div>
                  {!isOwned && (
                    <div
                      className="text-[8px] text-[#8B4513] mt-1"
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      🪙 {skin.cost}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => buy(skin)}
                  disabled={!isOwned && !canBuy}
                  className={`px-3 py-2 text-[8px] rounded border-2 ${isSelected ? 'bg-[#2ECC71] border-[#1E8449] text-white' : isOwned ? 'bg-[#3498DB] border-[#2980B9] text-white hover:bg-[#2980B9]' : canBuy ? 'bg-[#F39C12] border-[#D68910] text-white hover:bg-[#D68910]' : 'bg-gray-500 border-gray-600 text-gray-300 cursor-not-allowed'}`}
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {isSelected ? 'IN USE' : isOwned ? 'USE' : 'BUY'}
                </button>
              </div>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-[#E74C3C] text-white p-3 border-2 border-[#8B0000] hover:bg-[#C0392B] transition-colors text-xs"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          BACK
        </button>
      </div>
    </div>
  );
}
