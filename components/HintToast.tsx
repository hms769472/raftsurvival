'use client';
// RAFT-502 / L-25: renders the one-shot gameplay messages the canvas loop writes
// to the game store (RAFT-602) — `gameStore.hint` (contextual hints) and
// `gameStore.chestMessage` (world events such as "ISLAND DISCOVERED!"). The loop
// decrements each timer every frame; this component only reads them, so it never
// owns game state.

import { useEffect, useState } from 'react';
import type { ChestMessage } from '@/types/game-globals';
import { gameStore } from '@/lib/store';

type Active = { message: ChestMessage; kind: 'hint' | 'chest' };

export default function HintToast() {
  const [active, setActive] = useState<Active | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const hint = gameStore.hint;
      const chest = gameStore.chestMessage;
      if (hint && hint.time > 0) {
        setActive((prev) => (prev?.message === hint ? prev : { message: hint, kind: 'hint' }));
      } else if (chest && chest.time > 0) {
        setActive((prev) => (prev?.message === chest ? prev : { message: chest, kind: 'chest' }));
      } else {
        setActive(null);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!active) return null;
  const isHint = active.kind === 'hint';

  return (
    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-[55] pointer-events-none">
      <div
        className={
          'px-4 py-2 rounded border-2 text-[10px] text-center shadow-lg ' +
          (isHint
            ? 'bg-[#2C3E50]/90 border-[#5DADE2] text-[#D6EAF8]'
            : 'bg-black/85 border-yellow-500 text-yellow-200')
        }
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        {isHint ? '💡 ' : ''}
        {active.message.text}
      </div>
    </div>
  );
}
