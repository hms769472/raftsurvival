// Shared types for the game bridge (RAFT-602).
//
// The legacy `window.__*` globals were replaced by the typed store in
// `lib/store.ts`; only the vendor-prefixed audio constructor still needs a
// `window` declaration.

export type ChestMessage = { text: string; time: number };
export type SkinDefinition = { c: string; a: string };
export type Difficulty = 'easy' | 'normal' | 'hard';

declare global {
  interface Window {
    // Vendor-prefixed audio constructor still required on older Safari.
    webkitAudioContext?: typeof AudioContext;
  }
}
