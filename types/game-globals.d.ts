// Typed declarations for the legacy `window.__*` bridge globals used to pass
// state between the React tree and the imperative canvas game loop.
//
// Centralised here so call-sites can drop `(window as any)` and stay type-safe.
// These globals are migrated to a proper store in a later phase (RAFT-602).

export type ChestMessage = { text: string; time: number };
export type SkinDefinition = { c: string; a: string };
export type Difficulty = 'easy' | 'normal' | 'hard';

declare global {
  interface Window {
    // Snapshot mirrors written by <Game>, read by menus / draw code.
    __wallsRef?: number;
    __roofsRef?: number;
    __floorsRef?: number;
    __hasRodRef?: boolean;
    __hasSpearRef?: boolean;
    __hasHammerRef?: boolean;
    __hasCampfireRef?: boolean;
    __hasRainBarrelRef?: boolean;
    __sfxEnabled?: boolean;
    __showFps?: boolean;
    __musicEnabled?: boolean;
    __difficulty?: Difficulty;
    __barrelWater?: number;
    __wasRaining?: boolean;
    __chestMessage?: ChestMessage | null;
    /** RAFT-502: contextual one-shot hint shown near the top of the HUD. */
    __hint?: ChestMessage | null;
    /** RAFT-505: nearest active threat, used for the HUD enemy warning. */
    __threat?: 'shark' | 'frog' | null;
    /** RAFT-504: virtual joystick feeds movement into the game's key state. */
    __setMove?: (dir: 'left' | 'right' | 'up' | 'down', pressed: boolean) => void;
    /** Debug overlay: draws attack arcs / enemy hitboxes when true (RAFT-102). */
    __debugHitboxes?: boolean;
    /** RAFT-604: enables the `debug()` logger at runtime. */
    __debug?: boolean;

    // Action hooks exposed by <Game> for the React HUD buttons.
    __eatFishFromGame?: () => void;
    __drinkWaterFromGame?: () => void;
    __cookFish?: () => void;
    __eatCookedFish?: () => void;
    /** RAFT-405: eat a dried fish from the drying rack. */
    __eatDriedFish?: () => void;
    /** XP sink for kills/loot (wired to the progression system in Phase 3). */
    __onXpFromGame?: (amount: number) => void;

    // Vendor-prefixed audio constructor still required on older Safari.
    webkitAudioContext?: typeof AudioContext;
  }
}
