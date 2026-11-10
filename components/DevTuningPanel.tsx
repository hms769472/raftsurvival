'use client';
// RAFT-406: developer-only live tuning panel.
//
// It mutates the central `TUNABLE` object from lib/balance.ts, which the game
// loop reads every frame — so slider edits apply instantly with no reload.
// This component is only ever mounted in development (see app/page.tsx); in a
// production build it is not rendered and `TUNABLE` keeps its defaults.

import { useState } from 'react';
import { TUNABLE, DEFAULT_TUNABLE, TUNABLE_RANGE, setTunable, resetTunable, type TunableKey } from '@/lib/balance';

const LABELS: Record<TunableKey, string> = {
  hungerDrain: 'Hunger drain / frame',
  thirstDrain: 'Thirst drain / frame',
  starveDamage: 'Starve damage / frame',
  drownDamage: 'Drown damage / frame',
  regenWellFed: 'Regen (well fed) / frame',
  regenStarving: 'Regen (starving) / frame',
};

export default function DevTuningPanel({ onClose }: { onClose: () => void }) {
  // Mirror TUNABLE into state so the sliders re-render on change; the write to
  // TUNABLE itself is what the game loop actually consumes.
  const [values, setValues] = useState<Record<TunableKey, number>>({ ...TUNABLE });

  const setKey = (key: TunableKey, value: number) => {
    setTunable(key, value);
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => {
    resetTunable();
    setValues({ ...DEFAULT_TUNABLE });
  };

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-auto bg-black/85 border-2 border-yellow-500 rounded-lg p-3 text-white text-[11px] w-72">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-yellow-300">DEV TUNING (F4)</span>
        <div className="flex gap-2">
          <button onClick={reset} className="px-2 py-0.5 bg-gray-700 border border-gray-500 rounded">Reset</button>
          <button onClick={onClose} className="px-2 py-0.5 bg-red-700 border border-red-900 rounded">X</button>
        </div>
      </div>
      {(Object.keys(TUNABLE_RANGE) as TunableKey[]).map((key) => {
        const range = TUNABLE_RANGE[key];
        return (
          <label key={key} className="block mb-1">
            <div className="flex justify-between">
              <span>{LABELS[key]}</span>
              <span className="text-yellow-200">{values[key].toFixed(4)}</span>
            </div>
            <input
              type="range"
              min={range.min}
              max={range.max}
              step={range.step}
              value={values[key]}
              onChange={(e) => setKey(key, Number(e.target.value))}
              className="w-full"
            />
          </label>
        );
      })}
    </div>
  );
}
