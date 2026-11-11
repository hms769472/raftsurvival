'use client';

import React from 'react';

interface MainMenuProps {
  onPlay: () => void;
  onLoad: () => void;
  onSettings: () => void;
  onCredits: () => void;
  onCoop: () => void;
  onAchievements: () => void;
  onSkins: () => void;
  onLeaderboard: () => void;
  hasSave: boolean;
  /** RAFT-506: Co-op stays hidden until networking exists. */
  showCoop?: boolean;
}

export default function MainMenu({
  onPlay,
  onLoad,
  onSettings,
  onCredits,
  onCoop,
  onAchievements,
  onSkins,
  onLeaderboard,
  hasSave,
  showCoop = false,
}: MainMenuProps) {
  return (
    <div className="flex flex-col items-center justify-between h-screen bg-[#2D8FBD] relative overflow-hidden py-6">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent"></div>

      {/* Top section — Title */}
      <div className="z-10 flex flex-col items-center pt-2">
        <h1
          className="text-5xl font-bold text-white tracking-wider drop-shadow-[0_5px_0_rgba(0,0,0,1)] mb-2 text-center"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          STRANDED
        </h1>
        <h2
          className="text-3xl font-bold text-[#F5D76E] tracking-wider drop-shadow-[0_3px_0_rgba(0,0,0,1)] text-center"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          ON A RAFT
        </h2>
      </div>

      {/* Middle section — Menu buttons */}
      <div
        className="z-10 flex flex-col gap-4 text-xl font-bold text-black items-center"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        <button
          onClick={onPlay}
          className="hover:text-white transition-colors drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]"
        >
          PLAY
        </button>
        {hasSave && (
          <button
            onClick={onLoad}
            className="hover:text-white transition-colors drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]"
          >
            LOAD GAME
          </button>
        )}
        {showCoop && (
          <button
            onClick={onCoop}
            className="hover:text-white transition-colors drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]"
          >
            CO-OP
          </button>
        )}
        <button
          onClick={onLeaderboard}
          className="hover:text-white transition-colors drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]"
        >
          LEADERBOARD
        </button>
        <button
          onClick={onSettings}
          className="hover:text-white transition-colors drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]"
        >
          SETTINGS
        </button>
        <button
          onClick={onAchievements}
          className="hover:text-white transition-colors drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]"
        >
          ACHIEVEMENTS
        </button>
        <button
          onClick={onSkins}
          className="hover:text-white transition-colors drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]"
        >
          SKINS
        </button>
        <button
          onClick={onCredits}
          className="hover:text-white transition-colors drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]"
        >
          CREDITS
        </button>
      </div>

      {/* Bottom section — Credit badge */}
      <div className="z-10 flex items-center gap-3 whitespace-nowrap pb-1">
        <div className="h-[2px] w-6 bg-yellow-400 opacity-80"></div>
        <div
          className="bg-black/40 border border-yellow-400/60 px-3 py-1.5 rounded-full"
          style={{ boxShadow: '0 2px 0 rgba(0,0,0,0.4)' }}
        >
          <span
            className="text-yellow-100 text-[9px] tracking-widest"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            GAME BY MORROW FOUNDRY
          </span>
        </div>
        <div className="h-[2px] w-6 bg-yellow-400 opacity-80"></div>
      </div>
    </div>
  );
}
