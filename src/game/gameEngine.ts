import {
  GameState,
  Player,
  Position,
  EntityType,
  DungeonMap,
  TileType,
  Enemy,
  Entity,
  Item,
  ActiveEffect,
} from './types';
import { DungeonGenerator } from './dungeonGenerator';
import { generateSeed } from '../utils/random';
import { PICKUPS } from '../config';

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
      activeEffects: [],
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

    // Check for items
    const item = this.getEntityAt(newPos, EntityType.ITEM) as Item;
    if (item) {
      const pickupResult = this.pickupItem(item);
      // Move player after picking up item
      this.state.player.position = newPos;
      // Enemy turn
      this.enemyTurn();
      return { success: true, message: pickupResult };
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
    // Get base player attack
    let playerAttack = this.state.player.stats.attack;
    
    // Apply damage multiplier if active
    const damageMultiplier = this.getActiveDamageMultiplier();
    playerAttack = Math.floor(playerAttack * damageMultiplier);
    
    const enemyDefense = enemy.stats.defense;
    const damage = Math.max(1, playerAttack - enemyDefense);

    enemy.stats.health -= damage;

    let message = `You hit the ${enemy.enemyType} for ${damage} damage!`;
    if (damageMultiplier > 1) {
      message += ` (${damageMultiplier}x damage!)`;
    }
    
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

    // Consume damage multiplier effects after combat
    this.consumeEffects();

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
      // Pathfinding AI: move towards player if within range using shortest path
      const distance = this.getDistance(enemy.position, this.state.player.position);

      if (distance < 8) {
        const nextStep = this.findNextStepTowards(
          enemy.position,
          this.state.player.position
        );

        if (nextStep) {
          const { dx, dy } = nextStep;
          this.moveEnemy(enemy, dx, dy);
        }
      }
    }
  }

  /**
   * Find the next step towards a target using BFS pathfinding.
   * Returns the delta (dx, dy) for the first step, or null if no path exists.
   */
  private findNextStepTowards(
    start: Position,
    target: Position
  ): { dx: number; dy: number } | null {
    if (!this.dungeon) return null;

    // Early exit if already at target
    if (start.x === target.x && start.y === target.y) {
      return null;
    }

    const width = this.dungeon.width;
    const height = this.dungeon.height;

    const visited: boolean[][] = [];
    const prev: (Position | null)[][] = [];
    for (let y = 0; y < height; y++) {
      visited[y] = [];
      prev[y] = [];
      for (let x = 0; x < width; x++) {
        visited[y][x] = false;
        prev[y][x] = null;
      }
    }

    const queue: Position[] = [];
    queue.push({ x: start.x, y: start.y });
    visited[start.y][start.x] = true;

    const directions: Position[] = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];

    const isWalkable = (x: number, y: number): boolean => {
      if (
        x < 0 ||
        x >= width ||
        y < 0 ||
        y >= height ||
        this.dungeon!.tiles[y][x] === TileType.WALL
      ) {
        return false;
      }

      // Allow stepping onto the target even if something else is there
      if (x === target.x && y === target.y) {
        return true;
      }

      // Avoid tiles occupied by other enemies
      const occupiedByEnemy = this.getEntityAt(
        { x, y },
        EntityType.ENEMY
      );
      return !occupiedByEnemy;
    };

    // BFS to find shortest path
    while (queue.length > 0) {
      const current = queue.shift() as Position;

      if (current.x === target.x && current.y === target.y) {
        break;
      }

      for (const dir of directions) {
        const nx = current.x + dir.x;
        const ny = current.y + dir.y;

        if (!isWalkable(nx, ny)) continue;
        if (visited[ny][nx]) continue;

        visited[ny][nx] = true;
        prev[ny][nx] = { x: current.x, y: current.y };
        queue.push({ x: nx, y: ny });
      }
    }

    // No path if target was never visited
    if (!visited[target.y] || !visited[target.y][target.x]) {
      return null;
    }

    // Reconstruct path from target back to start
   let step: Position = { x: target.x, y: target.y };
    let previous: Position | null = prev[step.y][step.x];

    // Walk backwards until we reach the tile adjacent to start
    while (previous && !(previous.x === start.x && previous.y === start.y)) {
      step = previous;
      previous = prev[step.y][step.x];
    }

    // If there is no valid previous step, no movement
    if (!previous) {
      return null;
    }

    const dx = step.x - start.x;
    const dy = step.y - start.y;

    // Normalize dx, dy to -1, 0, or 1
    const normDx = dx === 0 ? 0 : dx / Math.abs(dx);
    const normDy = dy === 0 ? 0 : dy / Math.abs(dy);

    return { dx: normDx, dy: normDy };
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
      // Design choice: on level up, the player is fully healed to the new maxHealth.
      // If desired, this behavior can be made configurable instead of always fully restoring health.
      this.state.player.stats.health = this.state.player.stats.maxHealth;
      this.state.player.stats.attack += 2;
      this.state.player.stats.defense += 1;
      return `Level up! You are now level ${this.state.player.stats.level}!`;
    }
    return null;
  }

  /**
   * Pick up an item and apply its effects
   */
  private pickupItem(item: Item): string {
    // Find the pickup config
    const pickupConfig = PICKUPS.find(p => p.id === item.itemId);
    if (!pickupConfig) {
      return 'Unknown item';
    }

    // Remove item from dungeon
    this.removeEntity(item.id);

    let message = `You picked up ${pickupConfig.name}! `;

    // Apply effect based on type
    if (pickupConfig.effect.type === 'health') {
      const healAmount = Math.floor(this.state.player.stats.maxHealth * pickupConfig.effect.value);
      const actualHeal = Math.min(
        healAmount,
        this.state.player.stats.maxHealth - this.state.player.stats.health
      );
      this.state.player.stats.health += actualHeal;
      message += `Healed ${actualHeal} HP!`;
    } else if (pickupConfig.effect.type === 'damage_multiplier') {
      // Add active effect
      if (!this.state.player.activeEffects) {
        this.state.player.activeEffects = [];
      }
      
      const effect: ActiveEffect = {
        id: pickupConfig.id,
        name: pickupConfig.name,
        type: 'damage_multiplier',
        value: pickupConfig.effect.value,
        remainingDuration: pickupConfig.effect.duration || 1,
      };
      
      this.state.player.activeEffects.push(effect);
      message += `Damage increased ${pickupConfig.effect.value}x for the next ${effect.remainingDuration} encounter(s)!`;
    }

    return message;
  }

  /**
   * Get the current damage multiplier from active effects
   */
  private getActiveDamageMultiplier(): number {
    if (!this.state.player.activeEffects || this.state.player.activeEffects.length === 0) {
      return 1;
    }

    let multiplier = 1;
    for (const effect of this.state.player.activeEffects) {
      if (effect.type === 'damage_multiplier' && effect.remainingDuration > 0) {
        multiplier *= effect.value;
      }
    }

    return multiplier;
  }

  /**
   * Consume active effects after combat
   */
  private consumeEffects(): void {
    if (!this.state.player.activeEffects) {
      return;
    }

    // Decrease duration for all effects
    for (const effect of this.state.player.activeEffects) {
      if (effect.remainingDuration > 0) {
        effect.remainingDuration--;
      }
    }

    // Remove expired effects
    this.state.player.activeEffects = this.state.player.activeEffects.filter(
      effect => effect.remainingDuration > 0
    );
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
