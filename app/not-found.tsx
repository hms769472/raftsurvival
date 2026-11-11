import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-[#2D8FBD] px-6 text-center">
      <div className="text-6xl">🧭</div>
      <h1
        className="text-2xl font-bold text-white drop-shadow-[0_3px_0_rgba(0,0,0,1)]"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        DRIFTED OFF COURSE
      </h1>
      <p
        className="text-[10px] text-white/90"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        404 — this page is not on the map.
      </p>
      <Link
        href="/"
        className="border-4 border-[#8B4513] bg-[#E6A15E] px-6 py-3 text-[11px] font-bold text-[#5D4037] hover:bg-[#D68D4A]"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        BACK TO SHORE
      </Link>
    </div>
  );
}
