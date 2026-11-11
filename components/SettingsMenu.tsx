'use client';

import React, { useEffect, useState } from 'react';
import {
  CONTROL_ACTIONS,
  DEFAULT_BINDINGS,
  BINDING_LABELS,
  loadBindings,
  saveBindings,
  normKey,
  keyLabel,
  type ControlAction,
} from '@/lib/controls';

type Difficulty = 'easy' | 'normal' | 'hard';

type Settings = { musicOn: boolean; sfxOn: boolean; showFps: boolean; difficulty: Difficulty };

function loadSettings(): Settings {
  const fallback: Settings = { musicOn: true, sfxOn: true, showFps: false, difficulty: 'normal' };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem('raftSettings');
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    return {
      musicOn: data.musicOn ?? true,
      sfxOn: data.sfxOn ?? true,
      showFps: data.showFps ?? false,
      difficulty: data.difficulty ?? 'normal',
    };
  } catch {
    return fallback;
  }
}

interface SettingsMenuProps {
  onClose: () => void;
  /** RAFT-501: re-show the first-run tutorial from Settings. */
  onReplayTutorial?: () => void;
}

export default function SettingsMenu({ onClose, onReplayTutorial }: SettingsMenuProps) {
  const [musicOn, setMusicOn] = useState(() => loadSettings().musicOn);
  const [sfxOn, setSfxOn] = useState(() => loadSettings().sfxOn);
  const [showFps, setShowFps] = useState(() => loadSettings().showFps);
  const [difficulty, setDifficulty] = useState<Difficulty>(() => loadSettings().difficulty);
  // RAFT-503: rebindable controls.
  const [bindings, setBindings] = useState<Record<ControlAction, string>>(loadBindings);
  const [listening, setListening] = useState<ControlAction | null>(null);

  // Persist settings whenever they change and mirror them to the game loop.
  useEffect(() => {
    const data = { musicOn, sfxOn, showFps, difficulty };
    localStorage.setItem('raftSettings', JSON.stringify(data));

    // Apply music toggle via global (BackgroundMusic reads this)
    if (typeof window !== 'undefined') {
      window.__musicEnabled = musicOn;
      window.__sfxEnabled = sfxOn;
      window.__showFps = showFps;
      window.__difficulty = difficulty;

      // Dispatch event so BackgroundMusic can react immediately
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: data }));
    }
  }, [musicOn, sfxOn, showFps, difficulty]);

  // RAFT-503: capture the next key press while a row is "listening".
  useEffect(() => {
    if (!listening) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      const token = normKey(e.key);
      const next = { ...bindings, [listening]: token };
      setBindings(next);
      saveBindings(next);
      window.dispatchEvent(new CustomEvent('bindingsChanged'));
      setListening(null);
    };
    window.addEventListener('keydown', handler, { capture: true });
    return () =>
      window.removeEventListener('keydown', handler, { capture: true } as EventListenerOptions);
  }, [listening, bindings]);

  const toggleBtn = (active: boolean) =>
    'w-14 h-8 rounded-full border-2 transition-all flex items-center px-1 ' +
    (active
      ? 'bg-green-500 border-green-700 justify-end'
      : 'bg-gray-500 border-gray-700 justify-start');

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
            <span
              className="text-[#5D4037] text-[10px]"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              MUSIC
            </span>
            <button onClick={() => setMusicOn(!musicOn)} className={toggleBtn(musicOn)}>
              <div className={knob}></div>
            </button>
          </div>

          {/* SFX Toggle */}
          <div className="flex items-center justify-between bg-[#F5DEB3] border-2 border-[#8B4513] rounded p-3">
            <span
              className="text-[#5D4037] text-[10px]"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              SOUND FX
            </span>
            <button onClick={() => setSfxOn(!sfxOn)} className={toggleBtn(sfxOn)}>
              <div className={knob}></div>
            </button>
          </div>

          {/* Show FPS Toggle */}
          <div className="flex items-center justify-between bg-[#F5DEB3] border-2 border-[#8B4513] rounded p-3">
            <span
              className="text-[#5D4037] text-[10px]"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              SHOW FPS
            </span>
            <button onClick={() => setShowFps(!showFps)} className={toggleBtn(showFps)}>
              <div className={knob}></div>
            </button>
          </div>

          {/* Difficulty */}
          <div className="bg-[#F5DEB3] border-2 border-[#8B4513] rounded p-3">
            <div
              className="text-[#5D4037] text-[10px] mb-3 text-center"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              DIFFICULTY
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setDifficulty('easy')}
                className={diffBtn('easy', 'bg-green-500 border-green-700')}
              >
                EASY
              </button>
              <button
                onClick={() => setDifficulty('normal')}
                className={diffBtn('normal', 'bg-yellow-500 border-yellow-700')}
              >
                NORMAL
              </button>
              <button
                onClick={() => setDifficulty('hard')}
                className={diffBtn('hard', 'bg-red-500 border-red-700')}
              >
                HARD
              </button>
            </div>
          </div>

          {/* RAFT-503: rebindable controls */}
          <div className="bg-[#F5DEB3] border-2 border-[#8B4513] rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[#5D4037] text-[10px]"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                CONTROLS
              </span>
              <button
                onClick={() => {
                  const next = { ...DEFAULT_BINDINGS };
                  setBindings(next);
                  saveBindings(next);
                  window.dispatchEvent(new CustomEvent('bindingsChanged'));
                }}
                className="text-[8px] bg-gray-700 text-gray-200 px-2 py-1 rounded border border-gray-800"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                RESET
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {CONTROL_ACTIONS.map((action) => (
                <div key={action} className="flex items-center justify-between">
                  <span
                    className="text-[8px] text-[#5D4037]"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    {BINDING_LABELS[action]}
                  </span>
                  <button
                    onClick={() => setListening(action)}
                    className={
                      'text-[8px] px-2 py-1 rounded border w-20 text-center ' +
                      (listening === action
                        ? 'bg-yellow-400 border-yellow-600 text-black animate-pulse'
                        : 'bg-[#FFF8DC] border-[#8B4513] text-[#5D4037]')
                    }
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    {listening === action ? 'PRESS…' : keyLabel(bindings[action])}
                  </button>
                </div>
              ))}
            </div>
            <div
              className="text-[7px] text-[#5D4037] opacity-70 mt-2"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              WASD always moves. Arrow keys also work.
            </div>
          </div>

          {/* RAFT-501: replay the tutorial */}
          {onReplayTutorial && (
            <button
              onClick={onReplayTutorial}
              className="w-full bg-[#8E44AD] text-white p-3 border-2 border-[#6C3483] hover:bg-[#6C3483] transition-colors text-[10px]"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              🎓 REPLAY TUTORIAL
            </button>
          )}
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
