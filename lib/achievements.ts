export type Achievement = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  condition: (stats: AchievementStats) => boolean;
};

export type AchievementStats = {
  totalFishEaten: number;
  totalWood: number;
  totalPlastic: number;
  daysSurvived: number;
  sharksDefeated: number;
  frogsKilled: number;
  maxHunger: number;
  maxThirst: number;
  builtWalls: number;
  builtRoof: number;
  builtBarrel: number;
  islandsCollected: number;
  maxRaftHealth: number;
  difficulty: 'easy' | 'normal' | 'hard';
  timePlayed: number;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_meal',
    name: 'First Meal',
    description: 'Eat your first fish',
    emoji: '🐟',
    condition: (s) => s.totalFishEaten >= 1,
  },
  {
    id: 'fisherman',
    name: 'Fisherman',
    description: 'Eat 10 fish',
    emoji: '🎣',
    condition: (s) => s.totalFishEaten >= 10,
  },
  {
    id: 'master_fisher',
    name: 'Master Fisher',
    description: 'Eat 50 fish',
    emoji: '🐠',
    condition: (s) => s.totalFishEaten >= 50,
  },
  {
    id: 'carpenter',
    name: 'Carpenter',
    description: 'Collect 50 wood',
    emoji: '🪵',
    condition: (s) => s.totalWood >= 50,
  },
  {
    id: 'lumberjack',
    name: 'Lumberjack',
    description: 'Collect 200 wood',
    emoji: '🪓',
    condition: (s) => s.totalWood >= 200,
  },
  {
    id: 'recycler',
    name: 'Recycler',
    description: 'Collect 30 plastic',
    emoji: '♻️',
    condition: (s) => s.totalPlastic >= 30,
  },
  {
    id: 'survivor_1',
    name: 'Survivor',
    description: 'Survive 3 days',
    emoji: '🌅',
    condition: (s) => s.daysSurvived >= 3,
  },
  {
    id: 'survivor_5',
    name: 'Veteran',
    description: 'Survive 5 days',
    emoji: '🏕️',
    condition: (s) => s.daysSurvived >= 5,
  },
  {
    id: 'survivor_10',
    name: 'Legend',
    description: 'Survive 10 days',
    emoji: '👑',
    condition: (s) => s.daysSurvived >= 10,
  },
  {
    id: 'shark_slayer',
    name: 'Shark Slayer',
    description: 'Defeat a shark',
    emoji: '🦈',
    condition: (s) => s.sharksDefeated >= 1,
  },
  {
    id: 'shark_hunter',
    name: 'Shark Hunter',
    description: 'Defeat 5 sharks',
    emoji: '⚔️',
    condition: (s) => s.sharksDefeated >= 5,
  },
  {
    id: 'frog_hunter',
    name: 'Frog Hunter',
    description: 'Kill 10 frogs',
    emoji: '🐸',
    condition: (s) => s.frogsKilled >= 10,
  },
  {
    id: 'builder',
    name: 'Builder',
    description: 'Build all 4 walls',
    emoji: '🏗️',
    condition: (s) => s.builtWalls >= 4,
  },
  {
    id: 'sheltered',
    name: 'Sheltered',
    description: 'Build a roof',
    emoji: '🏠',
    condition: (s) => s.builtRoof >= 1,
  },
  {
    id: 'water_collector',
    name: 'Water Collector',
    description: 'Build a rain barrel',
    emoji: '💧',
    condition: (s) => s.builtBarrel >= 1,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Discover 3 floating islands',
    emoji: '🗺️',
    condition: (s) => s.islandsCollected >= 3,
  },
  {
    id: 'hardcore',
    name: 'Hardcore',
    description: 'Survive 1 day on Hard mode',
    emoji: '🔥',
    condition: (s) => s.difficulty === 'hard' && s.daysSurvived >= 1,
  },
  {
    id: 'time_1h',
    name: 'Dedicated',
    description: 'Play for 1 hour total',
    emoji: '⏰',
    condition: (s) => s.timePlayed >= 3600000,
  },
];
