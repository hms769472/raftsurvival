'use client';

import React from 'react';

interface CreditsScreenProps {
  onClose: () => void;
}

export default function CreditsScreen({ onClose }: CreditsScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#2D8FBD] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent"></div>

      <div className="z-10 bg-[#E6A15E] border-4 border-[#8B4513] p-6 rounded-lg w-[26rem] max-h-[85vh] overflow-y-auto shadow-2xl">
        <h2
          className="text-2xl font-bold text-[#5D4037] mb-6 text-center drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          CREDITS
        </h2>

        <div
          className="flex flex-col gap-5 text-[#5D4037] text-[10px] leading-relaxed"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          {/* Created By */}
          <div className="bg-[#F5DEB3] border-2 border-[#8B4513] rounded p-3">
            <div className="text-[#8B4513] mb-2 text-[11px]">CREATED BY</div>
            <div className="text-[9px]">Morrow Foundry</div>
          </div>

          {/* Artwork By */}
          <div className="bg-[#F5DEB3] border-2 border-[#8B4513] rounded p-3">
            <div className="text-[#8B4513] mb-2 text-[11px]">ARTWORK BY</div>
            <div className="text-[9px]">Morrow Foundry</div>
          </div>

          {/* Music By */}
          <div className="bg-[#F5DEB3] border-2 border-[#8B4513] rounded p-3">
            <div className="text-[#8B4513] mb-2 text-[11px]">MUSIC BY</div>
            <div className="text-[9px]">Free Assets Collection</div>
          </div>

          {/* Contributors */}
          <div className="bg-[#F5DEB3] border-2 border-[#8B4513] rounded p-3">
            <div className="text-[#8B4513] mb-2 text-[11px]">CONTRIBUTORS</div>
            <div className="text-[9px] leading-loose">
              Morrow Foundry
              <br />
              Open Source Community
              <br />
              Kenney Assets
              <br />
              Freesound
            </div>
          </div>

          {/* Special Thanks */}
          <div className="bg-[#F5DEB3] border-2 border-[#8B4513] rounded p-3">
            <div className="text-[#8B4513] mb-2 text-[11px]">SPECIAL THANKS</div>
            <div className="text-[9px] leading-loose">
              All playtesters
              <br />
              The Raft Survival community
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-[#F5DEB3] border-2 border-[#8B4513] rounded p-3">
            <div className="text-[#8B4513] mb-2 text-[11px]">FOLLOW US</div>
            <div className="flex gap-3 justify-center text-2xl">
              <span className="cursor-pointer hover:scale-110 transition-transform" title="Discord">
                💬
              </span>
              <span
                className="cursor-pointer hover:scale-110 transition-transform"
                title="Facebook"
              >
                📘
              </span>
              <span
                className="cursor-pointer hover:scale-110 transition-transform"
                title="Instagram"
              >
                📷
              </span>
              <span className="cursor-pointer hover:scale-110 transition-transform" title="Twitter">
                🐦
              </span>
              <span className="cursor-pointer hover:scale-110 transition-transform" title="YouTube">
                📺
              </span>
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
