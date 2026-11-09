'use client';

import { useState } from 'react';

interface LeaderboardProps {
  onClose: () => void;
}

interface ScoreEntry {
  days: number;
  fishEaten: number;
  sharksDefeated: number;
  date: string;
  difficulty: string;
}

function loadScores(): ScoreEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('raftLeaderboard');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export default function Leaderboard({ onClose }: LeaderboardProps) {
  const [scores] = useState<ScoreEntry[]>(loadScores);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#2D8FBD] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent"></div>
      <div className="z-10 bg-[#E6A15E] border-4 border-[#8B4513] p-5 rounded-lg w-[26rem] max-h-[85vh] overflow-y-auto shadow-2xl">
        <h2 className="text-xl font-bold text-[#5D4037] mb-4 text-center drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
          🏆 LEADERBOARD
        </h2>
        {scores.length === 0 ? (
          <div className="text-center text-[10px] text-[#5D4037] py-8" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            No scores yet.<br/>Play a game and die to record one!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {scores.map((s, i) => (
              <div key={i} className={`bg-[#FFF8DC] border-2 rounded p-2 ${i === 0 ? 'border-[#DAA520]' : 'border-[#8B4513]'}`}>
                <div className="flex justify-between items-center">
                  <div className="text-[11px] font-bold text-[#8B4513]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    {i === 0 ? '★ #1' : '#' + (i + 1)}
                  </div>
                  <div className="text-[8px] text-[#5D4037] uppercase" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    {s.difficulty}
                  </div>
                </div>
                <div className="text-[9px] text-[#5D4037] mt-1 leading-relaxed" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  Day {s.days} • {s.fishEaten} fish<br/>
                  {s.sharksDefeated} sharks defeated<br/>
                  <span className="opacity-60">{s.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} className="mt-4 w-full bg-[#E74C3C] text-white p-3 border-2 border-[#8B0000] hover:bg-[#C0392B] transition-colors text-xs" style={{ fontFamily: '"Press Start 2P", monospace' }}>
          BACK
        </button>
      </div>
    </div>
  );
}
