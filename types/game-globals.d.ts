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
    /** Debug overlay: draws attack arcs / enemy hitboxes when true (RAFT-102). */
    __debugHitboxes?: boolean;

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
