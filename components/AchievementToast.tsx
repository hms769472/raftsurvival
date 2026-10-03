'use client';

import React, { useEffect, useState } from 'react';

interface ToastData {
  emoji: string;
  name: string;
  description: string;
}

export default function AchievementToast() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ToastData;
      setToast(detail);
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
      setTimeout(() => setToast(null), 4500);
    };
    window.addEventListener('achievementUnlocked', handler);
    return () => window.removeEventListener('achievementUnlocked', handler);
  }, []);

  if (!toast) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-[100] transition-all duration-500 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-96 opacity-0'
      }`}
    >
      <div className="bg-[#FFF8DC] border-4 border-[#DAA520] rounded-lg p-3 shadow-2xl flex items-center gap-3 min-w-[280px]">
        <div className="text-4xl">{toast.emoji}</div>
        <div className="flex flex-col">
          <span
            className="text-[9px] text-[#DAA520] mb-1"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            ★ ACHIEVEMENT ★
          </span>
          <span
            className="text-[11px] font-bold text-[#8B4513]"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            {toast.name}
          </span>
          <span
            className="text-[8px] text-[#5D4037] mt-1"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            {toast.description}
          </span>
        </div>
      </div>
    </div>
  );
}
