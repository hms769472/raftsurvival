'use client';
import { useState } from 'react';
import { slotKey, deleteSnapshot } from '@/lib/save';

interface SaveSlotsProps {
  mode: 'save' | 'load';
  onClose: () => void;
  onSelect: (slot: number) => void;
}

interface SaveSlot {
  slot: number;
  exists: boolean;
  day: number;
  health: number;
  wood: number;
  plastic: number;
  savedAt: string;
}

const EMPTY_SLOT = (slot: number): SaveSlot => ({
  slot,
  exists: false,
  day: 0,
  health: 0,
  wood: 0,
  plastic: 0,
  savedAt: '',
});

function loadSlots(): SaveSlot[] {
  const list: SaveSlot[] = [];
  for (let i = 1; i <= 3; i++) {
    if (typeof window === 'undefined') {
      list.push(EMPTY_SLOT(i));
      continue;
    }
    const data = localStorage.getItem(slotKey(i));
    if (data) {
      try {
        const d = JSON.parse(data);
        list.push({
          slot: i,
          exists: true,
          day: d.day,
          health: d.health,
          wood: d.wood,
          plastic: d.plastic,
          savedAt: d.savedAt,
        });
      } catch {
        list.push(EMPTY_SLOT(i));
      }
    } else {
      list.push(EMPTY_SLOT(i));
    }
  }
  return list;
}

export default function SaveSlots({ mode, onClose, onSelect }: SaveSlotsProps) {
  const [slots, setSlots] = useState<SaveSlot[]>(loadSlots);

  const handleDelete = (slot: number) => {
    if (confirm('Delete this save?')) {
      deleteSnapshot(slot);
      setSlots((prev) => prev.map((s) => (s.slot === slot ? EMPTY_SLOT(slot) : s)));
    }
  };

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[62]">
      <div className="bg-[#E6A15E] border-4 border-[#8B4513] p-6 rounded-lg w-[26rem] shadow-2xl">
        <h2
          className="text-lg font-bold text-[#5D4037] mb-4 text-center drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          {mode === 'save' ? '💾 SAVE GAME' : '📁 LOAD GAME'}
        </h2>
        <div className="flex flex-col gap-3">
          {slots.map((s) => (
            <div key={s.slot} className="bg-[#FFF8DC] border-2 border-[#8B4513] rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <div
                  className="text-[11px] font-bold text-[#8B4513]"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  SLOT {s.slot}
                </div>
                {s.exists && (
                  <div
                    className="text-[8px] text-[#5D4037]"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    {new Date(s.savedAt || 0).toLocaleDateString()}
                  </div>
                )}
              </div>
              {s.exists ? (
                <>
                  <div
                    className="text-[9px] text-[#5D4037] mb-2"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    Day {s.day} • ❤️ {Math.ceil(s.health)}/5
                    <br />
                    🪵 {s.wood} • 🧴 {s.plastic}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelect(s.slot)}
                      className="flex-1 bg-[#27AE60] text-white p-2 border-2 border-[#1E8449] hover:bg-[#1E8449] text-[9px]"
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      {mode === 'save' ? 'OVERWRITE' : 'LOAD'}
                    </button>
                    {mode === 'load' && (
                      <button
                        onClick={() => handleDelete(s.slot)}
                        className="bg-[#E74C3C] text-white p-2 border-2 border-[#8B0000] hover:bg-[#C0392B] text-[9px]"
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                      >
                        X
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => onSelect(s.slot)}
                  className="w-full bg-[#3498DB] text-white p-2 border-2 border-[#2980B9] hover:bg-[#2980B9] text-[9px]"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {mode === 'save' ? 'SAVE HERE' : 'EMPTY'}
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-[#E74C3C] text-white p-2 border-2 border-[#8B0000] hover:bg-[#C0392B] text-[10px]"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          BACK
        </button>
      </div>
    </div>
  );
}
