'use client';

import { useEffect } from 'react';

// Route-level error boundary: a crash inside the game tree shows a styled
// pixel-screen instead of a blank page, with a one-tap recovery.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Local crash telemetry only — never sent off-device.
    console.error('[raft] runtime error', error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-[#2D8FBD] px-6 text-center">
      <div className="text-6xl">🌊</div>
      <h1
        className="text-2xl font-bold text-white drop-shadow-[0_3px_0_rgba(0,0,0,1)]"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        LOST AT SEA
      </h1>
      <p
        className="max-w-md text-[10px] leading-relaxed text-white/90"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        Something went wrong while sailing. Your progress is saved locally.
      </p>
      <button
        onClick={reset}
        className="border-4 border-[#8B4513] bg-[#E6A15E] px-6 py-3 text-[11px] font-bold text-[#5D4037] hover:bg-[#D68D4A]"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        TRY AGAIN
      </button>
    </div>
  );
}
