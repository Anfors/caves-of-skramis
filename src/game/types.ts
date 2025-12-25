/**
 * Position on the game grid
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Entity types in the game
 */
export enum EntityType {
  PLAYER = 'player',
  ENEMY = 'enemy',
  ITEM = 'item',
  STAIRS = 'stairs',
}

/**
 * Tile types for dungeon generation
 */
export enum TileType {
  WALL = 'wall',
  FLOOR = 'floor',
  EMPTY = 'empty',
}

/**
 * Base entity in the game world
 */
export interface Entity {
  id: string;
  type: EntityType;
  position: Position;
  sprite: string;
}

/**
 * Character stats
 */
export interface Stats {
  maxHealth: number;
  health: number;
  attack: number;
  defense: number;
  level: number;
  experience: number;
}

/**
 * Active effect on a player
 */
export interface ActiveEffect {
  id: string;
  name: string;
  type: 'damage_multiplier'; // Could be extended with other effect types in the future
  value: number;
  remainingDuration: number;
}

/**
 * Player entity
 */
export interface Player extends Entity {
  type: EntityType.PLAYER;
  stats: Stats;
  activeEffects?: ActiveEffect[];
}

/**
 * Enemy entity
 */
export interface Enemy extends Entity {
  type: EntityType.ENEMY;
  stats: Stats;
  enemyType: string;
}

/**
 * Item entity (pick-ups)
 */
export interface Item extends Entity {
  type: EntityType.ITEM;
  itemId: string;
  name: string;
}

/**
 * Game state for persistence
 */
export interface GameState {
  player: Player;
  currentFloor: number;
  seed: string;
  timestamp: number;
}

/**
 * Dungeon map
 */
export interface DungeonMap {
  width: number;
  height: number;
  tiles: TileType[][];
  entities: Entity[];
}
