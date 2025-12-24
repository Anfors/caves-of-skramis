import {
  GameState,
  Player,
  Position,
  EntityType,
  DungeonMap,
  TileType,
  Enemy,
  Entity,
} from './types';
import { DungeonGenerator } from './dungeonGenerator';
import { generateSeed } from '../utils/random';

/**
 * Game action result
 */
export interface GameAction {
  success: boolean;
  message?: string;
  combat?: CombatResult;
}

/**
 * Combat result
 */
export interface CombatResult {
  damage: number;
  killed: boolean;
  enemyDamage?: number;
}

/**
 * Main game engine
 */
export class GameEngine {
  private state: GameState;
  private dungeon: DungeonMap | null = null;
  private messageCallback?: (message: string, type: string) => void;

  constructor(state?: Partial<GameState>) {
    if (state && state.player) {
      // Load from save
      this.state = state as GameState;
      this.state.player.position = { x: 0, y: 0 }; // Will be set when dungeon generates
    } else {
      // New game
      this.state = this.createNewGameState();
    }
    this.generateDungeon();
  }

  /**
   * Create a new game state
   */
  private createNewGameState(): GameState {
    const player: Player = {
      id: 'player',
      type: EntityType.PLAYER,
      position: { x: 0, y: 0 },
      sprite: '@',
      stats: {
        maxHealth: 100,
        health: 100,
        attack: 5,
        defense: 2,
        level: 1,
        experience: 0,
      },
    };

    return {
      player,
      currentFloor: 1,
      seed: generateSeed(),
      timestamp: Date.now(),
    };
  }

  /**
   * Generate a new dungeon for the current floor
   */
  private generateDungeon(): void {
    const generator = new DungeonGenerator(
      `${this.state.seed}-${this.state.currentFloor}`,
      50,
      50
    );
    this.dungeon = generator.generate(this.state.currentFloor);

    // Place player in first room (top-left floor tile)
    for (let y = 0; y < this.dungeon.height; y++) {
      for (let x = 0; x < this.dungeon.width; x++) {
        if (this.dungeon.tiles[y][x] === TileType.FLOOR) {
          this.state.player.position = { x, y };
          return;
        }
      }
    }
  }

  /**
   * Move player in a direction
   */
  movePlayer(dx: number, dy: number): GameAction {
    if (!this.dungeon) {
      return { success: false, message: 'No dungeon loaded' };
    }

    const newPos: Position = {
      x: this.state.player.position.x + dx,
      y: this.state.player.position.y + dy,
    };

    // Check bounds
    if (
      newPos.x < 0 ||
      newPos.x >= this.dungeon.width ||
      newPos.y < 0 ||
      newPos.y >= this.dungeon.height
    ) {
      return { success: false, message: 'Out of bounds' };
    }

    // Check if wall
    if (this.dungeon.tiles[newPos.y][newPos.x] === TileType.WALL) {
      return { success: false, message: 'There is a wall there' };
    }

    // Check for enemy
    const enemy = this.getEntityAt(newPos, EntityType.ENEMY) as Enemy;
    if (enemy) {
      return this.attack(enemy);
    }

    // Check for stairs
    const stairs = this.getEntityAt(newPos, EntityType.STAIRS);
    if (stairs) {
      this.descendStairs();
      return { success: true, message: `Descended to floor ${this.state.currentFloor}!` };
    }

    // Move player
    this.state.player.position = newPos;
    
    // Enemy turn
    this.enemyTurn();

    return { success: true };
  }

  /**
   * Attack an enemy
   */
  private attack(enemy: Enemy): GameAction {
    const playerAttack = this.state.player.stats.attack;
    const enemyDefense = enemy.stats.defense;
    const damage = Math.max(1, playerAttack - enemyDefense);

    enemy.stats.health -= damage;

    let message = `You hit the ${enemy.enemyType} for ${damage} damage!`;
    let killed = false;

    if (enemy.stats.health <= 0) {
      killed = true;
      this.removeEntity(enemy.id);
      const expGain = 10 * enemy.stats.level;
      this.state.player.stats.experience += expGain;
      message += ` The ${enemy.enemyType} is defeated! (+${expGain} XP)`;
      
      // Check for level up
      const levelUpMessage = this.checkLevelUp();
      if (levelUpMessage) {
        message += ` ${levelUpMessage}`;
      }
    }

    // Enemy counterattack if still alive
    let enemyDamage = 0;
    if (!killed) {
      const enemyAttack = enemy.stats.attack;
      const playerDefense = this.state.player.stats.defense;
      enemyDamage = Math.max(1, enemyAttack - playerDefense);
      this.state.player.stats.health -= enemyDamage;
      message += ` The ${enemy.enemyType} hits you for ${enemyDamage} damage!`;

      if (this.state.player.stats.health <= 0) {
        message += ' You have died!';
      }
    }

    return {
      success: true,
      message,
      combat: { damage, killed, enemyDamage },
    };
  }

  /**
   * Enemy turn
   */
  private enemyTurn(): void {
    if (!this.dungeon) return;

    const enemies = this.dungeon.entities.filter(
      (e) => e.type === EntityType.ENEMY
    ) as Enemy[];

    for (const enemy of enemies) {
      // Simple AI: move towards player if within range
      const distance = this.getDistance(enemy.position, this.state.player.position);
      
      if (distance < 8) {
        const dx = Math.sign(this.state.player.position.x - enemy.position.x);
        const dy = Math.sign(this.state.player.position.y - enemy.position.y);

        // Try to move towards player
        if (Math.abs(dx) > Math.abs(dy)) {
          if (!this.moveEnemy(enemy, dx, 0)) {
            this.moveEnemy(enemy, 0, dy);
          }
        } else {
          if (!this.moveEnemy(enemy, 0, dy)) {
            this.moveEnemy(enemy, dx, 0);
          }
        }
      }
    }
  }

  /**
   * Move an enemy
   */
  private moveEnemy(enemy: Enemy, dx: number, dy: number): boolean {
    if (!this.dungeon) return false;

    const newPos: Position = {
      x: enemy.position.x + dx,
      y: enemy.position.y + dy,
    };

    // Check bounds and walls
    if (
      newPos.x < 0 ||
      newPos.x >= this.dungeon.width ||
      newPos.y < 0 ||
      newPos.y >= this.dungeon.height ||
      this.dungeon.tiles[newPos.y][newPos.x] === TileType.WALL
    ) {
      return false;
    }

    // Check if player is there
    if (newPos.x === this.state.player.position.x && newPos.y === this.state.player.position.y) {
      // Attack player
      const damage = Math.max(1, enemy.stats.attack - this.state.player.stats.defense);
      this.state.player.stats.health -= damage;
      this.addMessage(`The ${enemy.enemyType} hits you for ${damage} damage!`, 'combat');
      
      if (this.state.player.stats.health <= 0) {
        this.addMessage('You have died!', 'combat');
      }
      return true;
    }

    // Check if another enemy is there
    if (this.getEntityAt(newPos, EntityType.ENEMY)) {
      return false;
    }

    enemy.position = newPos;
    return true;
  }

  /**
   * Descend to next floor
   */
  private descendStairs(): void {
    this.state.currentFloor++;
    this.generateDungeon();
    this.addMessage(`You descend to floor ${this.state.currentFloor}`, 'info');
  }

  /**
   * Check for level up
   */
  private checkLevelUp(): string | null {
    const expNeeded = this.state.player.stats.level * 100;
    if (this.state.player.stats.experience >= expNeeded) {
      this.state.player.stats.level++;
      this.state.player.stats.experience -= expNeeded;
      this.state.player.stats.maxHealth += 20;
      this.state.player.stats.health = this.state.player.stats.maxHealth;
      this.state.player.stats.attack += 2;
      this.state.player.stats.defense += 1;
      return `Level up! You are now level ${this.state.player.stats.level}!`;
    }
    return null;
  }

  /**
   * Get entity at position
   */
  private getEntityAt(pos: Position, type?: EntityType): Entity | undefined {
    if (!this.dungeon) return undefined;
    return this.dungeon.entities.find(
      (e) => e.position.x === pos.x && e.position.y === pos.y && (!type || e.type === type)
    );
  }

  /**
   * Remove entity by id
   */
  private removeEntity(id: string): void {
    if (!this.dungeon) return;
    this.dungeon.entities = this.dungeon.entities.filter((e) => e.id !== id);
  }

  /**
   * Get distance between two positions
   */
  private getDistance(pos1: Position, pos2: Position): number {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
  }

  /**
   * Add message to log
   */
  private addMessage(message: string, type: string): void {
    if (this.messageCallback) {
      this.messageCallback(message, type);
    }
  }

  /**
   * Set message callback
   */
  setMessageCallback(callback: (message: string, type: string) => void): void {
    this.messageCallback = callback;
  }

  /**
   * Get current game state
   */
  getState(): GameState {
    return this.state;
  }

  /**
   * Get current dungeon
   */
  getDungeon(): DungeonMap | null {
    return this.dungeon;
  }

  /**
   * Check if player is alive
   */
  isPlayerAlive(): boolean {
    return this.state.player.stats.health > 0;
  }
}
