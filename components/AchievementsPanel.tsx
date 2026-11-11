'use client';

import { useState } from 'react';
import { ACHIEVEMENTS } from '@/lib/achievements';

interface AchievementsPanelProps {
  onClose: () => void;
}

function loadUnlocked(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('raftAchievements');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export default function AchievementsPanel({ onClose }: AchievementsPanelProps) {
  const [unlocked] = useState<string[]>(loadUnlocked);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#2D8FBD] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent"></div>

      <div className="z-10 bg-[#E6A15E] border-4 border-[#8B4513] p-5 rounded-lg w-[32rem] max-h-[90vh] overflow-y-auto shadow-2xl">
        <h2
          className="text-xl font-bold text-[#5D4037] mb-4 text-center drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          ACHIEVEMENTS
        </h2>

        <div
          className="text-center text-[#5D4037] text-[10px] mb-4"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          {unlocked.length} / {ACHIEVEMENTS.length} UNLOCKED
        </div>

        <div className="flex flex-col gap-2">
          {ACHIEVEMENTS.map((a) => {
            const isUnlocked = unlocked.includes(a.id);
            return (
              <div
                key={a.id}
                className={`flex items-center gap-3 p-2 rounded border-2 ${
                  isUnlocked
                    ? 'bg-[#FFF8DC] border-[#DAA520]'
                    : 'bg-[#D3D3D3] border-[#808080] opacity-60'
                }`}
              >
                <div className={`text-2xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                  {isUnlocked ? a.emoji : '🔒'}
                </div>
                <div className="flex flex-col flex-1">
                  <span
                    className="text-[10px] font-bold"
                    style={{
                      fontFamily: '"Press Start 2P", monospace',
                      color: isUnlocked ? '#8B4513' : '#555',
                    }}
                  >
                    {a.name}
                  </span>
                  <span
                    className="text-[9px] mt-1"
                    style={{
                      fontFamily: '"Press Start 2P", monospace',
                      color: isUnlocked ? '#5D4037' : '#666',
                    }}
                  >
                    {a.description}
                  </span>
                </div>
                {isUnlocked && <span className="text-[#DAA520] text-2xl">✓</span>}
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full bg-[#E74C3C] text-white p-3 border-2 border-[#8B0000] hover:bg-[#C0392B] transition-colors text-xs"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          BACK
        </button>
      </div>
    </div>
  );
}
