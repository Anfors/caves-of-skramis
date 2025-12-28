import { GameState, EntityType } from '../game/types';
import { PLAYER_START, PLAYER_LEVEL_UP } from '../config';

/**
 * Encode game state to a save code
 */
export function encodeGameState(state: GameState): string {
  const data = {
    l: state.player.stats.level,
    e: state.player.stats.experience,
    f: state.currentFloor,
    s: state.seed,
    // Timestamp is stored so save metadata (e.g. playtime tracking, leaderboards, or future time-based validation)
    // can be derived from the decoded game state, even though it is not part of checksum or game logic here.
    t: state.timestamp,
  };

  const json = JSON.stringify(data);
  const encoded = btoa(json);
  
  // Add checksum for validation
  const checksum = simpleChecksum(encoded);
  return `${encoded}-${checksum}`;
}

/**
 * Decode a save code to game state data
 */
export function decodeSaveCode(code: string): Partial<GameState> | null {
  try {
    const parts = code.split('-');
    if (parts.length !== 2) {
      return null;
    }

    const [encoded, checksum] = parts;
    
    // Validate checksum
    if (simpleChecksum(encoded) !== checksum) {
      return null;
    }

    const json = atob(encoded);
    const data = JSON.parse(json);

    // Use defaulted level value to prevent NaN when data.l is undefined
    const level = data.l ?? 1;

    return {
      player: {
        id: 'player',
        type: EntityType.PLAYER,
        position: { x: 0, y: 0 },
        sprite: PLAYER_START.sprite,
        stats: {
          level: level,
          experience: data.e ?? 0,
          maxHealth: PLAYER_START.maxHealth + (level - 1) * PLAYER_LEVEL_UP.healthIncrease,
          health: PLAYER_START.maxHealth + (level - 1) * PLAYER_LEVEL_UP.healthIncrease,
          attack: PLAYER_START.attack + (level - 1) * PLAYER_LEVEL_UP.attackIncrease,
          defense: PLAYER_START.defense + (level - 1) * PLAYER_LEVEL_UP.defenseIncrease,
        },
      },
      currentFloor: data.f ?? 1,
      seed: data.s,
      timestamp: data.t,
    };
  } catch {
    return null;
  }
}

/**
 * Simple checksum for validation
 *
 * Uses a 32-bit hash to provide a much larger space of possible values
 * than the previous modulo-based approach.
 */
function simpleChecksum(str: string): string {
  // FNV-1a style 32-bit hash
  let hash = 0x811c9dc5; // 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0; // 16777619, keep as unsigned 32-bit
  }
  return (hash >>> 0).toString(36);
}

/**
 * Validate a save code
 */
export function validateSaveCode(code: string): boolean {
  return decodeSaveCode(code) !== null;
}
