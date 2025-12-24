import { GameState, EntityType } from '../game/types';

/**
 * Encode game state to a save code
 */
export function encodeGameState(state: GameState): string {
  const data = {
    l: state.player.stats.level,
    e: state.player.stats.experience,
    f: state.currentFloor,
    s: state.seed,
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

    return {
      player: {
        id: 'player',
        type: EntityType.PLAYER,
        position: { x: 0, y: 0 },
        sprite: '@',
        stats: {
          level: data.l || 1,
          experience: data.e || 0,
          maxHealth: 100 + (data.l - 1) * 20,
          health: 100 + (data.l - 1) * 20,
          attack: 5 + (data.l - 1) * 2,
          defense: 2 + (data.l - 1),
        },
      },
      currentFloor: data.f || 1,
      seed: data.s,
      timestamp: data.t,
    };
  } catch {
    return null;
  }
}

/**
 * Simple checksum for validation
 */
function simpleChecksum(str: string): string {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i) * (i + 1);
  }
  return (sum % 10000).toString(36);
}

/**
 * Validate a save code
 */
export function validateSaveCode(code: string): boolean {
  return decodeSaveCode(code) !== null;
}
