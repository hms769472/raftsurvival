// RAFT-602: typed replacement for the legacy `window.__*` bridge globals.
//
// The imperative canvas loop (<Game>) and the React tree (HUD, menus, toasts,
// touch controls) need to exchange state and trigger one-shot actions. Instead
// of sprinkling untyped globals on `window`, everything now flows through this
// single module:
//
//   gameStore    — mutable state mirrored out of the loop for React to read
//   gameCommands — one-shot actions <Game> exposes to the React tree
//
// Both are plain module singletons: the loop writes them directly each frame,
// and components read them (via their own rAF/interval polls) so no React
// re-render is required on the hot path.

import type { ChestMessage, Difficulty } from '@/types/game-globals';

export type Threat = 'shark' | 'frog' | null;
export type MoveDir = 'left' | 'right' | 'up' | 'down';

/** State mirrored out of the game loop for React components to read. */
export type GameStore = {
  /** Rain-barrel water (0-100), driven by the loop and shown in the HUD. */
  barrelWater: number;
  /** RAFT-505: nearest active threat, drives the HUD enemy warning. */
  threat: Threat;
  /** Placed structure counts, kept in sync with the build grid. */
  walls: number;
  roofs: number;
  floors: number;
  /** Tool ownership, mirrored from <Game> props for the draw pass. */
  hasRod: boolean;
  hasSpear: boolean;
  hasHammer: boolean;
  hasCampfire: boolean;
  hasRainBarrel: boolean;
  /** Player settings mirrored from SettingsMenu. */
  sfxEnabled: boolean;
  musicEnabled: boolean;
  showFps: boolean;
  difficulty: Difficulty;
  /** RAFT-604: enables the `debug()` logger at runtime. */
  debug: boolean;
  /** Debug overlay: draws attack arcs / enemy hitboxes when true (RAFT-102). */
  debugHitboxes: boolean;
  /** Rain edge-detection state owned by the loop. */
  wasRaining: boolean;
  /** RAFT-502: contextual one-shot hint shown near the top of the HUD. */
  hint: ChestMessage | null;
  /** World-event banner ("ISLAND DISCOVERED!", "CHEST OPENED!", ...). */
  chestMessage: ChestMessage | null;
};

export const gameStore: GameStore = {
  barrelWater: 0,
  threat: null,
  walls: 0,
  roofs: 0,
  floors: 0,
  hasRod: false,
  hasSpear: false,
  hasHammer: false,
  hasCampfire: false,
  hasRainBarrel: false,
  sfxEnabled: true,
  musicEnabled: true,
  showFps: false,
  difficulty: 'normal',
  debug: false,
  debugHitboxes: false,
  wasRaining: false,
  hint: null,
  chestMessage: null,
};

/** One-shot actions <Game> registers for the React HUD/menus to invoke. */
export type GameCommands = {
  setMove: (dir: MoveDir, pressed: boolean) => void;
  eatRawFish: () => void;
  drinkWater: () => void;
  cookFish: () => void;
  eatCookedFish: () => void;
  eatDriedFish: () => void;
};

export const gameCommands: Partial<GameCommands> = {};

/** Clear every registered command (called when the game loop tears down). */
export function resetGameCommands(): void {
  for (const key of Object.keys(gameCommands) as (keyof GameCommands)[]) {
    delete gameCommands[key];
  }
}
