'use client';
import React, { useEffect, useState } from 'react';

interface TutorialProps {
  onDismiss: () => void;
}

const STEPS = [
  { emoji: '🎮', title: 'MOVE', text: 'Use Arrow Keys to move your character on the raft' },
  { emoji: '🪝', title: 'HOOK', text: 'Press H to throw hook and catch floating wood/plastic' },
  { emoji: 'C', title: 'CRAFTING', text: 'Press C to open crafting menu' },
  { emoji: '🎣', title: 'FISHING', text: 'Craft a Fishing Rod, then press F to fish for food' },
  { emoji: '🔱', title: 'COMBAT', text: 'Craft a Spear, press SPACE to attack frogs and sharks' },
  { emoji: '🦈', title: 'DANGER', text: 'Stand in the MIDDLE of raft to avoid shark bites!' },
  { emoji: '🍔', title: 'SURVIVE', text: 'Watch hunger and thirst bars — eat and drink before they empty' },
  { emoji: '💧', title: 'WATER', text: 'Craft Rain Barrel (6 wood) to collect water during rain' },
];

export default function Tutorial({ onDismiss }: TutorialProps) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      localStorage.setItem('raftTutorialSeen', '1');
      onDismiss();
    } else {
      setStep(step + 1);
    }
  };
  const skip = () => {
    localStorage.setItem('raftTutorialSeen', '1');
    onDismiss();
  };

  return (
    <div className="absolute inset-0 bg-black/85 flex items-center justify-center z-[70]">
      <div className="bg-[#E6A15E] border-4 border-[#8B4513] p-6 rounded-lg w-[26rem] shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <div className="text-[10px] text-[#5D4037]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            TUTORIAL {step + 1}/{STEPS.length}
          </div>
          <button onClick={skip} className="text-[9px] text-[#8B4513] hover:text-[#E74C3C]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            SKIP
          </button>
        </div>
        <div className="text-center mb-4">
          <div className="text-6xl mb-3">{s.emoji}</div>
          <div className="text-lg font-bold text-[#8B4513] mb-2" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            {s.title}
          </div>
          <div className="text-[10px] text-[#5D4037] leading-relaxed" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            {s.text}
          </div>
        </div>
        <div className="flex justify-center gap-1 mb-4">
          {STEPS.map((_, i) => (
            <div key={i} className={'w-2 h-2 rounded-full ' + (i === step ? 'bg-[#8B4513]' : 'bg-[#8B4513]/30')}></div>
          ))}
        </div>
        <button onClick={next} className="w-full bg-[#27AE60] text-white p-3 border-2 border-[#1E8449] hover:bg-[#1E8449] transition-colors text-xs" style={{ fontFamily: '"Press Start 2P", monospace' }}>
          {isLast ? 'GOT IT!' : 'NEXT →'}
        </button>
      </div>
    </div>
  );
}
