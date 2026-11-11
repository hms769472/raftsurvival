// RAFT-604: tiny debug logger.
//
// Hot paths (the game loop, XP awards, per-frame audio decode) should never
// spam the console in production. Everything goes through `debug()` which is a
// no-op unless debug mode is explicitly enabled — either by a dev build, or at
// runtime via `gameStore.debug = true` (RAFT-602) / `localStorage.raftDebug = '1'`.
//
// `warn()` / `error()` stay loud on purpose: real problems should surface.

import { gameStore } from '@/lib/store';

/** True in a development build, or when debug mode is toggled on at runtime. */
export function isDebug(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  if (typeof window === 'undefined') return false;
  if (gameStore.debug) return true;
  try {
    return localStorage.getItem('raftDebug') === '1';
  } catch {
    return false;
  }
}

/** Logs only when debug mode is on. Safe to call from per-frame code. */
export function debug(...args: unknown[]): void {
  if (isDebug()) console.log('[raft]', ...args);
}

export function warn(...args: unknown[]): void {
  console.warn('[raft]', ...args);
}

export function error(...args: unknown[]): void {
  console.error('[raft]', ...args);
}
