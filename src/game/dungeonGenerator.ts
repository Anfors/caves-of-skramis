import { DungeonMap, TileType, Position, Entity, EntityType, Enemy, Item } from './types';
import { SeededRandom } from '../utils/random';
import { PICKUPS } from '../config';

/**
 * Room in the dungeon
 */
interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Generate a dungeon using BSP (Binary Space Partitioning)
 */
export class DungeonGenerator {
  private random: SeededRandom;
  private width: number;
  private height: number;

  constructor(seed: string, width = 50, height = 50) {
    this.random = new SeededRandom(seed);
    this.width = width;
    this.height = height;
  }

  /**
   * Generate a new dungeon map
   */
  generate(floor: number): DungeonMap {
    const tiles: TileType[][] = [];
    
    // Initialize with walls
    for (let y = 0; y < this.height; y++) {
      tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        tiles[y][x] = TileType.WALL;
      }
    }

    // Generate rooms
    const rooms = this.generateRooms();
    
    // Carve out rooms
    for (const room of rooms) {
      this.carveRoom(tiles, room);
    }

    // Connect rooms with corridors
    this.connectRooms(tiles, rooms);

    // Generate entities
    const entities = this.generateEntities(rooms, floor);

    return {
      width: this.width,
      height: this.height,
      tiles,
      entities,
    };
  }

  private generateRooms(): Room[] {
    const rooms: Room[] = [];
    const attempts = 30;
    const minRoomSize = 4;
    const maxRoomSize = 10;

    for (let i = 0; i < attempts; i++) {
      const width = this.random.nextInt(minRoomSize, maxRoomSize);
      const height = this.random.nextInt(minRoomSize, maxRoomSize);
      const x = this.random.nextInt(1, this.width - width - 1);
      const y = this.random.nextInt(1, this.height - height - 1);

      const newRoom = { x, y, width, height };

      // Check if room overlaps with existing rooms
      let overlaps = false;
      for (const room of rooms) {
        if (this.roomsOverlap(newRoom, room)) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        rooms.push(newRoom);
      }
    }

    return rooms;
  }

  private roomsOverlap(room1: Room, room2: Room): boolean {
    return (
      room1.x < room2.x + room2.width + 1 &&
      room1.x + room1.width + 1 > room2.x &&
      room1.y < room2.y + room2.height + 1 &&
      room1.y + room1.height + 1 > room2.y
    );
  }

  private carveRoom(tiles: TileType[][], room: Room): void {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        tiles[y][x] = TileType.FLOOR;
      }
    }
  }

  private connectRooms(tiles: TileType[][], rooms: Room[]): void {
    for (let i = 0; i < rooms.length - 1; i++) {
      const room1 = rooms[i];
      const room2 = rooms[i + 1];

      const start = this.getRoomCenter(room1);
      const end = this.getRoomCenter(room2);

      // Horizontal corridor
      for (let x = Math.min(start.x, end.x); x <= Math.max(start.x, end.x); x++) {
        if (tiles[start.y][x] !== TileType.FLOOR) {
          tiles[start.y][x] = TileType.FLOOR;
        }
      }

      // Vertical corridor
      for (let y = Math.min(start.y, end.y); y <= Math.max(start.y, end.y); y++) {
        if (tiles[y][end.x] !== TileType.FLOOR) {
          tiles[y][end.x] = TileType.FLOOR;
        }
      }
    }
  }

  private getRoomCenter(room: Room): Position {
    return {
      x: Math.floor(room.x + room.width / 2),
      y: Math.floor(room.y + room.height / 2),
    };
  }

  private generateEntities(rooms: Room[], floor: number): Entity[] {
    const entities: Entity[] = [];

    // Place stairs in the last room
    if (rooms.length > 0) {
      const lastRoom = rooms[rooms.length - 1];
      const center = this.getRoomCenter(lastRoom);
      entities.push({
        id: 'stairs',
        type: EntityType.STAIRS,
        position: center,
        sprite: '>',
      });
    }

    // Place enemies (skip first room for player spawn)
    const enemyCount = Math.min(3 + floor * 2, 15);
    for (let i = 0; i < enemyCount && i < rooms.length - 1; i++) {
      const room = rooms[i + 1];
      const position = this.getRandomPositionInRoom(room);
      
      const enemyTypes = ['goblin', 'orc', 'troll', 'skeleton', 'wraith'];
      const enemyType = this.random.choose(enemyTypes);
      
      const enemy: Enemy = {
        id: `enemy-${i}`,
        type: EntityType.ENEMY,
        position,
        sprite: this.getEnemySprite(enemyType),
        enemyType,
        stats: {
          maxHealth: 20 + floor * 10,
          health: 20 + floor * 10,
          attack: 3 + floor * 2,
          defense: 1 + floor,
          level: floor,
          experience: 0,
        },
      };
      
      entities.push(enemy);
    }

    // Place items (pick-ups) in some rooms
    const itemCount = Math.min(2 + Math.floor(floor / 2), rooms.length - 2);
    let itemsPlaced = 0;
    let attempts = 0;
    const maxAttempts = itemCount * 10; // Try multiple times to place each item
    
    while (itemsPlaced < itemCount && attempts < maxAttempts && rooms.length > 1) {
      attempts++;
      
      // Find a random room (skip first room for player spawn)
      const roomIndex = this.random.nextInt(1, rooms.length - 1);
      const room = rooms[roomIndex];
      const position = this.getRandomPositionInRoom(room);
      
      // Check if position is already occupied
      const occupied = entities.some(e => e.position.x === position.x && e.position.y === position.y);
      if (occupied) continue;
      
      // Choose a random pickup from config
      const pickup = this.random.choose(PICKUPS);
      
      const item: Item = {
        id: `item-${itemsPlaced}`,
        type: EntityType.ITEM,
        position,
        sprite: pickup.sprite,
        itemId: pickup.id,
        name: pickup.name,
      };
      
      entities.push(item);
      itemsPlaced++;
    }

    return entities;
  }

  private getRandomPositionInRoom(room: Room): Position {
    return {
      x: this.random.nextInt(room.x + 1, room.x + room.width - 2),
      y: this.random.nextInt(room.y + 1, room.y + room.height - 2),
    };
  }

  private getEnemySprite(enemyType: string): string {
    const sprites: Record<string, string> = {
      goblin: 'g',
      orc: 'o',
      troll: 'T',
      skeleton: 's',
      wraith: 'W',
    };
    return sprites[enemyType] || 'e';
  }
}
