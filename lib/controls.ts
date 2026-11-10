// RAFT-503: central, player-rebindable key bindings.
//
// Movement always also accepts WASD (the arrow bindings are what get stored),
// while the action keys (attack / fish / hook / build / craft) are fully
// rebindable from Settings. Bindings live in localStorage under `raftBindings`
// and are read by the canvas game loop, so a rebind takes effect immediately.

export type ControlAction = 'left' | 'right' | 'up' | 'down' | 'attack' | 'fish' | 'hook' | 'build' | 'craft';

export const CONTROL_ACTIONS: ControlAction[] = ['left', 'right', 'up', 'down', 'attack', 'fish', 'hook', 'build', 'craft'];

export const DEFAULT_BINDINGS: Record<ControlAction, string> = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  up: 'ArrowUp',
  down: 'ArrowDown',
  attack: 'space',
  fish: 'f',
  hook: 'h',
  build: 'b',
  craft: 'c',
};

export const BINDING_LABELS: Record<ControlAction, string> = {
  left: 'Move Left',
  right: 'Move Right',
  up: 'Move Up',
  down: 'Move Down',
  attack: 'Attack',
  fish: 'Fish',
  hook: 'Hook',
  build: 'Build Mode',
  craft: 'Crafting',
};

/** WASD always works in addition to the stored movement bindings. */
export const MOVE_ALIASES: Partial<Record<ControlAction, string[]>> = {
  left: ['a'],
  right: ['d'],
  up: ['w'],
  down: ['s'],
};

const STORAGE_KEY = 'raftBindings';

/** Normalises a raw `KeyboardEvent.key` into a stable token. */
export function normKey(raw: string): string {
  if (raw === ' ' || raw === 'Spacebar' || raw === 'Space') return 'space';
  if (raw.length === 1) return raw.toLowerCase();
  return raw;
}

/** Human-friendly label for a binding token (shown in Settings). */
export function keyLabel(token: string): string {
  if (token === 'space') return 'SPACE';
  if (token.startsWith('Arrow')) return token.slice(5).toUpperCase(); // "Left" -> "LEFT"
  return token.length === 1 ? token.toUpperCase() : token;
}

export function loadBindings(): Record<ControlAction, string> {
  const fallback = { ...DEFAULT_BINDINGS };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const data = JSON.parse(raw) as Partial<Record<ControlAction, string>>;
    const merged = { ...fallback };
    for (const action of CONTROL_ACTIONS) {
      const v = data[action];
      if (typeof v === 'string' && v.length > 0) merged[action] = v;
    }
    return merged;
  } catch {
    return fallback;
  }
}

export function saveBindings(bindings: Record<ControlAction, string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
  } catch {
    /* ignore */
  }
}

/** Resolves a keydown to a control action, honouring WASD aliases + fallback defaults. */
export function matchAction(
  bindings: Record<ControlAction, string>,
  rawKey: string,
): ControlAction | null {
  const key = normKey(rawKey);
  for (const action of CONTROL_ACTIONS) {
    if (bindings[action] === key) return action;
    if (MOVE_ALIASES[action]?.includes(key)) return action;
  }
  return null;
}
