'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { gameCommands } from '@/lib/store';

// RAFT-504: on-screen touch controls for phones/tablets.
//
// A left-thumb virtual joystick drives movement (fed to the game through the
// `gameCommands.setMove` bridge — RAFT-602 — so the canvas loop keeps a single
// source of truth), while the right-hand buttons reuse the same synthetic-key
// handlers the HUD buttons already use. Renders nothing on non-touch devices.
type Props = {
  onAttack: () => void;
  onFish: () => void;
  onHook: () => void;
  onCraft: () => void;
};

type Dir = 'left' | 'right' | 'up' | 'down';
const DIRS: Dir[] = ['left', 'right', 'up', 'down'];

export default function TouchControls({ onAttack, onFish, onHook, onCraft }: Props) {
  // Detected without a setState-in-effect (avoids a hydration mismatch + cascading render).
  const isTouch = useSyncExternalStore(
    () => () => {},
    () =>
      typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0),
    () => false,
  );
  const padRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const active = useRef<Record<Dir, boolean>>({
    left: false,
    right: false,
    up: false,
    down: false,
  });
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  // Release every direction we own when the component unmounts (e.g. pause).
  useEffect(
    () => () => {
      for (const d of DIRS) gameCommands.setMove?.(d, false);
    },
    [],
  );

  if (!isTouch) return null;

  const applyDirs = (next: Record<Dir, boolean>) => {
    for (const d of DIRS) {
      if (next[d] !== active.current[d]) {
        active.current[d] = next[d];
        gameCommands.setMove?.(d, next[d]);
      }
    }
  };

  const handlePoint = (clientX: number, clientY: number) => {
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const radius = rect.width / 2;
    const dead = radius * 0.28;
    const clamp = (v: number) => Math.max(-radius * 0.6, Math.min(radius * 0.6, v));
    setKnob({ x: clamp(dx), y: clamp(dy) });
    applyDirs({ left: dx < -dead, right: dx > dead, up: dy < -dead, down: dy > dead });
  };

  const endDrag = () => {
    dragging.current = false;
    setKnob({ x: 0, y: 0 });
    applyDirs({ left: false, right: false, up: false, down: false });
  };

  const btn =
    'w-16 h-16 rounded-full border-[3px] flex items-center justify-center text-2xl select-none touch-none active:scale-90 transition-transform';

  return (
    <div className="absolute inset-0 z-40 pointer-events-none select-none">
      {/* Virtual joystick (bottom-left, above the HUD's Main Menu button). */}
      <div
        ref={padRef}
        className="absolute left-4 bottom-20 w-36 h-36 rounded-full bg-black/30 border-2 border-white/30 pointer-events-auto touch-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragging.current = true;
          handlePoint(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (dragging.current) handlePoint(e.clientX, e.clientY);
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className="absolute w-16 h-16 rounded-full bg-white/50 border-2 border-white/70"
          style={{ left: `calc(50% - 2rem + ${knob.x}px)`, top: `calc(50% - 2rem + ${knob.y}px)` }}
        />
      </div>

      {/* Action buttons (bottom-right, above the HUD's action row). */}
      <div className="absolute right-4 bottom-20 grid grid-cols-2 gap-2 pointer-events-auto">
        <div onClick={onAttack} className={`${btn} bg-[#D35400] border-[#A04000]`} title="Attack">
          🔱
        </div>
        <div onClick={onFish} className={`${btn} bg-[#27AE60] border-[#1E8449]`} title="Fish">
          🎣
        </div>
        <div onClick={onHook} className={`${btn} bg-[#2C3E50] border-[#F1C40F]`} title="Hook">
          🪝
        </div>
        <div onClick={onCraft} className={`${btn} bg-[#E6A15E] border-[#8B4513]`} title="Craft">
          ⚒️
        </div>
      </div>
    </div>
  );
}
