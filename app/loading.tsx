// Route-level loading UI. The game boots client-side, so this only flashes
// briefly while the route chunk is fetched.
export default function Loading() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#2D8FBD]">
      <div className="text-5xl">🏝️</div>
      <div
        className="text-[12px] text-white animate-pulse drop-shadow-[0_2px_0_rgba(0,0,0,1)]"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        LOADING...
      </div>
    </div>
  );
}
