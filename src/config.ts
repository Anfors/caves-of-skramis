/**
 * Game configuration constants
 */

/**
 * Viewport dimensions for desktop
 * Covers about one room and a little bit more (~15x15 tiles)
 */
export const DESKTOP_VIEWPORT_WIDTH = 17;
export const DESKTOP_VIEWPORT_HEIGHT = 13;

/**
 * Viewport dimensions for mobile
 * Smaller viewport with larger tiles for easier touch interaction
 */
export const MOBILE_VIEWPORT_WIDTH = 13;
export const MOBILE_VIEWPORT_HEIGHT = 11;

/**
 * Tile size for desktop (in pixels)
 */
export const DESKTOP_TILE_SIZE = 24;

/**
 * Tile size for mobile (in pixels)
 * Larger tiles make it easier to tap on mobile devices
 */
export const MOBILE_TILE_SIZE = 32;

/**
 * Check if the device is mobile
 * Uses hybrid approach: user agent + window width for better coverage
 * - User agent catches mobile browsers that may have large viewports
 * - Window width catches responsive layouts and tablets
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
}

/**
 * Get viewport width based on device type
 */
export function getViewportWidth(): number {
  return isMobileDevice() ? MOBILE_VIEWPORT_WIDTH : DESKTOP_VIEWPORT_WIDTH;
}

/**
 * Get viewport height based on device type
 */
export function getViewportHeight(): number {
  return isMobileDevice() ? MOBILE_VIEWPORT_HEIGHT : DESKTOP_VIEWPORT_HEIGHT;
}

/**
 * Get tile size based on device type
 */
export function getTileSize(): number {
  return isMobileDevice() ? MOBILE_TILE_SIZE : DESKTOP_TILE_SIZE;
}

// Legacy exports for backward compatibility (use dynamic functions above instead)
export const VIEWPORT_WIDTH = DESKTOP_VIEWPORT_WIDTH;
export const VIEWPORT_HEIGHT = DESKTOP_VIEWPORT_HEIGHT;

/**
 * Pick-up item configuration
 */
export interface PickupConfig {
  id: string;
  name: string;
  sprite: string;
  description: string;
  effect: PickupEffect;
}

export interface PickupEffect {
  type: 'health' | 'damage_multiplier';
  value: number; // For health: percentage (0.5 = 50%), for damage_multiplier: multiplier (2 = 2x)
  duration?: number; // Number of encounters (for power-ups), undefined for instant effects
}

/**
 * Available pick-ups in the game
 * Can be extended by adding new entries to this array
 */
export const PICKUPS: PickupConfig[] = [
  {
    id: 'health_potion',
    name: 'Health Potion',
    sprite: '!',
    description: 'Heals 50% of max health',
    effect: {
      type: 'health',
      value: 0.5,
    },
  },
  {
    id: 'damage_power_up',
    name: 'Power Crystal',
    sprite: '*',
    description: 'Doubles damage for the next encounter',
    effect: {
      type: 'damage_multiplier',
      value: 2,
      duration: 1,
    },
  },
];

/**
 * Player starting configuration
 */
export interface PlayerConfig {
  sprite: string;
  maxHealth: number;
  attack: number;
  defense: number;
  level: number;
  experience: number;
}

export const PLAYER_START: PlayerConfig = {
  sprite: '@',
  maxHealth: 100,
  attack: 5,
  defense: 2,
  level: 1,
  experience: 0,
};

/**
 * Player level-up configuration
 */
export interface PlayerLevelUpConfig {
  healthIncrease: number;
  attackIncrease: number;
  defenseIncrease: number;
  experiencePerLevel: number; // Base XP needed, multiplied by level
}

export const PLAYER_LEVEL_UP: PlayerLevelUpConfig = {
  healthIncrease: 20,
  attackIncrease: 2,
  defenseIncrease: 1,
  experiencePerLevel: 100, // Base XP needed, multiplied by level
};

/**
 * Monster type configuration
 */
export interface MonsterTypeConfig {
  name: string;
  sprite: string;
}

/**
 * Monster stats configuration
 */
export interface MonsterStatsConfig {
  baseHealth: number;
  healthPerFloor: number;
  baseAttack: number;
  attackPerFloor: number;
  baseDefense: number;
  defensePerFloor: number;
  experienceReward: number; // Base XP, multiplied by level
}

/**
 * Available monster types
 * Can be extended by adding new entries to this array
 */
export const MONSTER_TYPES: MonsterTypeConfig[] = [
  { name: 'goblin', sprite: 'g' },
  { name: 'orc', sprite: 'o' },
  { name: 'troll', sprite: 'T' },
  { name: 'skeleton', sprite: 's' },
  { name: 'wraith', sprite: 'W' },
];

/**
 * Monster stats scaling configuration
 */
export const MONSTER_STATS: MonsterStatsConfig = {
  baseHealth: 20,
  healthPerFloor: 10,
  baseAttack: 3,
  attackPerFloor: 2,
  baseDefense: 1,
  defensePerFloor: 1,
  experienceReward: 10,
};
