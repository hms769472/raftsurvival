'use client';

import React, { useState } from 'react';

interface CoopMenuProps {
  onClose: () => void;
}

export default function CoopMenu({ onClose }: CoopMenuProps) {
  const [status, setStatus] = useState<'idle' | 'searching' | 'unavailable'>('idle');

  const handleHost = () => {
    setStatus('unavailable');
    setTimeout(() => setStatus('idle'), 3000);
  };

  const handleJoin = () => {
    setStatus('searching');
    setTimeout(() => setStatus('unavailable'), 2500);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#2D8FBD] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent"></div>

      <div className="z-10 bg-[#E6A15E] border-4 border-[#8B4513] p-8 rounded-lg w-[26rem] shadow-2xl">
        <h2
          className="text-2xl font-bold text-[#5D4037] mb-2 text-center drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          CO-OP
        </h2>

        <div
          className="text-center text-[10px] text-[#8B4513] mb-6"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          Multiplayer Mode
        </div>

        {/* Status message */}
        <div className="bg-[#F5DEB3] border-2 border-[#8B4513] rounded p-3 mb-6 min-h-[4rem] flex items-center justify-center">
          {status === 'idle' && (
            <div
              className="text-center text-[9px] text-[#5D4037]"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              Play with friends!
              <br />
              Host or join a game.
            </div>
          )}
          {status === 'searching' && (
            <div
              className="text-center text-[9px] text-[#2980B9]"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              Searching for games...
              <div className="mt-2 animate-pulse">●●●</div>
            </div>
          )}
          {status === 'unavailable' && (
            <div
              className="text-center text-[9px] text-[#E74C3C]"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              ⚠️ Coming Soon
              <br />
              Co-op is under development
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={handleHost}
            disabled={status === 'searching'}
            className="bg-[#27AE60] text-white p-3 border-2 border-[#1E8449] hover:bg-[#1E8449] transition-colors text-[11px] disabled:opacity-50"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            🏠 HOST GAME
          </button>

          <button
            onClick={handleJoin}
            disabled={status === 'searching'}
            className="bg-[#2980B9] text-white p-3 border-2 border-[#1F618D] hover:bg-[#1F618D] transition-colors text-[11px] disabled:opacity-50"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            🔍 JOIN GAME
          </button>
        </div>

        {/* Info */}
        <div className="bg-[#F5DEB3] border-2 border-[#8B4513] rounded p-3 mb-6">
          <div
            className="text-[9px] text-[#5D4037] leading-loose"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            Features planned:
            <br />
            • 2-4 player co-op
            <br />
            • Shared raft building
            <br />
            • Voice chat
            <br />• Trade resources
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#E74C3C] text-white p-3 border-2 border-[#8B0000] hover:bg-[#C0392B] transition-colors text-xs"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          BACK
        </button>
      </div>
    </div>
  );
}
