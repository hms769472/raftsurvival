'use client';

import React, { useEffect, useState } from 'react';

interface SettingsMenuProps {
  onClose: () => void;
}

export default function SettingsMenu({ onClose }: SettingsMenuProps) {
  const [musicOn, setMusicOn] = useState(true);
  const [sfxOn, setSfxOn] = useState(true);
  const [showFps, setShowFps] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');

  // Load saved settings
  useEffect(() => {
    const saved = localStorage.getItem('raftSettings');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setMusicOn(data.musicOn ?? true);
        setSfxOn(data.sfxOn ?? true);
        setShowFps(data.showFps ?? false);
        setDifficulty(data.difficulty ?? 'normal');
      } catch (e) { /* ignore */ }
    }
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    const data = { musicOn, sfxOn, showFps, difficulty };
    localStorage.setItem('raftSettings', JSON.stringify(data));

    // Apply music toggle via global (BackgroundMusic reads this)
    if (typeof window !== 'undefined') {
      (window as any).__musicEnabled = musicOn;
      (window as any).__sfxEnabled = sfxOn; // __sfxWindowGlobal
      (window as any).__showFps = showFps;
      (window as any).__difficulty = difficulty;

      // Dispatch event so BackgroundMusic can react immediately
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: data }));
    }
  }, [musicOn, sfxOn, showFps, difficulty]);

  const toggleBtn = (active: boolean) =>
    'w-14 h-8 rounded-full border-2 transition-all flex items-center px-1 ' +
    (active ? 'bg-green-500 border-green-700 justify-end' : 'bg-gray-500 border-gray-700 justify-start');

  const knob = 'w-6 h-6 rounded-full bg-white shadow-md';

  const diffBtn = (level: 'easy' | 'normal' | 'hard', color: string) =>
    'px-4 py-2 text-[10px] border-2 rounded transition-all ' +
    (difficulty === level
      ? color + ' text-white'
      : 'bg-gray-700 border-gray-800 text-gray-300 hover:bg-gray-600');

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#2D8FBD] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent"></div>

      <div className="z-10 bg-[#E6A15E] border-4 border-[#8B4513] p-8 rounded-lg w-[28rem] shadow-2xl">
        <h2
          className="text-2xl font-bold text-[#5D4037] mb-6 text-center drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          SETTINGS
        </h2>

        <div className="flex flex-col gap-4">
          {/* Music Toggle */}
          <div className="flex items-center justify-between bg-[#F5DEB3] border-2 border-[#8B4513] rounded p-3">
            <span className="text-[#5D4037] text-[10px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              MUSIC
            </span>
            <button onClick={() => setMusicOn(!musicOn)} className={toggleBtn(musicOn)}>
              <div className={knob}></div>
            </button>
          </div>

          {/* SFX Toggle */}
          <div className="flex items-center justify-between bg-[#F5DEB3] border-2 border-[#8B4513] rounded p-3">
            <span className="text-[#5D4037] text-[10px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              SOUND FX
            </span>
            <button onClick={() => setSfxOn(!sfxOn)} className={toggleBtn(sfxOn)}>
              <div className={knob}></div>
            </button>
          </div>

          {/* Show FPS Toggle */}
          <div className="flex items-center justify-between bg-[#F5DEB3] border-2 border-[#8B4513] rounded p-3">
            <span className="text-[#5D4037] text-[10px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              SHOW FPS
            </span>
            <button onClick={() => setShowFps(!showFps)} className={toggleBtn(showFps)}>
              <div className={knob}></div>
            </button>
          </div>

          {/* Difficulty */}
          <div className="bg-[#F5DEB3] border-2 border-[#8B4513] rounded p-3">
            <div className="text-[#5D4037] text-[10px] mb-3 text-center" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              DIFFICULTY
            </div>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setDifficulty('easy')} className={diffBtn('easy', 'bg-green-500 border-green-700')}>
                EASY
              </button>
              <button onClick={() => setDifficulty('normal')} className={diffBtn('normal', 'bg-yellow-500 border-yellow-700')}>
                NORMAL
              </button>
              <button onClick={() => setDifficulty('hard')} className={diffBtn('hard', 'bg-red-500 border-red-700')}>
                HARD
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-[#E74C3C] text-white p-3 border-2 border-[#8B0000] hover:bg-[#C0392B] transition-colors text-xs"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          BACK
        </button>
      </div>
    </div>
  );
}

