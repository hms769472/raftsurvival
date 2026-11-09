// Central gameplay balance constants for Raft Survival v0.2.
// Every gameplay-affecting number should live here (never hard-coded in components).

export const FRAMES_PER_SECOND = 60;
export const MS_PER_FRAME = 1000 / FRAMES_PER_SECOND;

// One in-game day === 2 real minutes (120s * 60fps). Shared by the HUD day
// counter and the achievement "days survived" tracker.
export const DAY_LENGTH = 60 * 60 * 2;

// Player health is tracked in "hearts".
export const MAX_HEALTH = 5;

// Raft structural integrity (0-100).
export const MAX_RAFT_HEALTH = 100;
