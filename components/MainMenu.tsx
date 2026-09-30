'use client';

import React from 'react';

interface MainMenuProps {
  onPlay: () => void;
  onLoad: () => void;
  hasSave: boolean;
}

export default function MainMenu({ onPlay, onLoad, hasSave }: MainMenuProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#2D8FBD] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent"></div>

      <div className="z-10 flex flex-col items-center pt-16 pb-12 w-full px-4">
        {/* Title */}
        <div className="flex flex-col items-center mb-14">
          <h1
            className="text-6xl font-bold text-white tracking-wider drop-shadow-[0_6px_0_rgba(0,0,0,1)] mb-3 text-center"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            STRANDED
          </h1>
          <h2
            className="text-4xl font-bold text-[#F5D76E] tracking-wider drop-shadow-[0_4px_0_rgba(0,0,0,1)] text-center"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            ON A RAFT
          </h2>
        </div>

        {/* Menu buttons */}
        <div className="flex flex-col gap-7 text-2xl font-bold text-black items-center" style={{ fontFamily: '"Press Start 2P", monospace' }}>
          <button onClick={onPlay} className="hover:text-white transition-colors drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]">PLAY</button>
          {hasSave && (
            <button onClick={onLoad} className="hover:text-white transition-colors drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]">LOAD GAME</button>
          )}
          <button className="hover:text-white transition-colors drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]">CO-OP</button>
          <button className="hover:text-white transition-colors drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]">SETTINGS</button>
          <button className="hover:text-white transition-colors drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]">CREDITS</button>
        </div>

        {/* Game By credit — badge style below menu */}
        <div className="mt-16 flex items-center gap-3 whitespace-nowrap">
          <div className="h-[2px] w-8 bg-yellow-400 opacity-80"></div>
          <div
            className="bg-black/40 border border-yellow-400/60 px-4 py-2 rounded-full"
            style={{ boxShadow: '0 2px 0 rgba(0,0,0,0.4)' }}
          >
            <span
              className="text-yellow-100 text-[10px] tracking-widest"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              GAME BY MORROW FOUNDRY
            </span>
          </div>
          <div className="h-[2px] w-8 bg-yellow-400 opacity-80"></div>
        </div>
      </div>
    </div>
  );
}
