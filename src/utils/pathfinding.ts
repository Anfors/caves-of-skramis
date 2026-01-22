import { Position, TileType, DungeonMap, EntityType } from '../game/types';

/**
 * Calculate Manhattan distance between two positions
 */
export function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Node for A* pathfinding
 */
interface PathNode {
  pos: Position;
  g: number; // Cost from start
  h: number; // Heuristic cost to goal
  f: number; // Total cost (g + h)
  parent: PathNode | null;
}

/**
 * Find path from start to goal using A* algorithm
 * Returns array of positions from start to goal (excluding start, including goal)
 * Returns empty array if no path exists
 */
export function findPath(
  start: Position,
  goal: Position,
  dungeon: DungeonMap,
  isWalkableCallback?: (x: number, y: number) => boolean
): Position[] {
  // Early exit if start equals goal
  if (start.x === goal.x && start.y === goal.y) {
    return [];
  }

  const width = dungeon.width;
  const height = dungeon.height;

  // Default walkability check
  const isWalkable = (x: number, y: number): boolean => {
    if (
      x < 0 ||
      x >= width ||
      y < 0 ||
      y >= height ||
      dungeon.tiles[y][x] === TileType.WALL
    ) {
      return false;
    }

    // Allow goal position even if occupied
    if (x === goal.x && y === goal.y) {
      return true;
    }

    // Use custom callback if provided
    if (isWalkableCallback) {
      return isWalkableCallback(x, y);
    }

    // Default: check if tile is occupied by enemy
    const occupiedByEnemy = dungeon.entities.find(
      (e) => e.position.x === x && e.position.y === y && e.type === EntityType.ENEMY
    );
    return !occupiedByEnemy;
  };

  // Check if goal is reachable (walls or out of bounds)
  if (
    goal.x < 0 ||
    goal.x >= width ||
    goal.y < 0 ||
    goal.y >= height ||
    dungeon.tiles[goal.y][goal.x] === TileType.WALL
  ) {
    return [];
  }

  const openSet = new Map<string, PathNode>();
  const closedSet = new Set<string>();

  const startNode: PathNode = {
    pos: start,
    g: 0,
    h: manhattanDistance(start, goal),
    f: manhattanDistance(start, goal),
    parent: null,
  };

  const posKey = (pos: Position) => `${pos.x},${pos.y}`;
  openSet.set(posKey(start), startNode);

  const directions: Position[] = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (openSet.size > 0) {
    // Find node with lowest f score
    let current: PathNode | null = null;
    let currentKey = '';
    for (const [key, node] of openSet) {
      if (!current || node.f < current.f) {
        current = node;
        currentKey = key;
      }
    }

    if (!current) break;

    // Reached goal
    if (current.pos.x === goal.x && current.pos.y === goal.y) {
      const path: Position[] = [];
      let node: PathNode | null = current;
      while (node && node.parent) {
        path.unshift(node.pos);
        node = node.parent;
      }
      return path;
    }

    openSet.delete(currentKey);
    closedSet.add(currentKey);

    // Check neighbors
    for (const dir of directions) {
      const neighborPos: Position = {
        x: current.pos.x + dir.x,
        y: current.pos.y + dir.y,
      };

      if (!isWalkable(neighborPos.x, neighborPos.y)) {
        continue;
      }

      const neighborKey = posKey(neighborPos);
      if (closedSet.has(neighborKey)) {
        continue;
      }

      const g = current.g + 1;
      const h = manhattanDistance(neighborPos, goal);
      const f = g + h;

      const existingNode = openSet.get(neighborKey);
      if (!existingNode || g < existingNode.g) {
        openSet.set(neighborKey, {
          pos: neighborPos,
          g,
          h,
          f,
          parent: current,
        });
      }
    }
  }

  return []; // No path found
}

/**
 * Find all reachable tiles from start position using BFS
 * Returns set of position keys that are reachable
 */
export function findReachableTiles(
  start: Position,
  dungeon: DungeonMap,
  maxDistance?: number,
  isWalkableCallback?: (x: number, y: number) => boolean
): Set<string> {
  const width = dungeon.width;
  const height = dungeon.height;
  const reachable = new Set<string>();

  // Default walkability check
  const isWalkable = (x: number, y: number): boolean => {
    if (
      x < 0 ||
      x >= width ||
      y < 0 ||
      y >= height ||
      dungeon.tiles[y][x] === TileType.WALL
    ) {
      return false;
    }

    // Use custom callback if provided
    if (isWalkableCallback) {
      return isWalkableCallback(x, y);
    }

    // Default: check if tile is occupied by enemy
    const occupiedByEnemy = dungeon.entities.find(
      (e) => e.position.x === x && e.position.y === y && e.type === EntityType.ENEMY
    );
    return !occupiedByEnemy;
  };

  const visited = new Set<string>();
  const queue: { pos: Position; dist: number }[] = [{ pos: start, dist: 0 }];
  const posKey = (pos: Position) => `${pos.x},${pos.y}`;

  visited.add(posKey(start));

  const directions: Position[] = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    // Skip if exceeded max distance
    if (maxDistance !== undefined && current.dist > maxDistance) {
      continue;
    }

    // Add to reachable (except start position)
    if (current.pos.x !== start.x || current.pos.y !== start.y) {
      reachable.add(posKey(current.pos));
    }

    // Check neighbors
    for (const dir of directions) {
      const neighborPos: Position = {
        x: current.pos.x + dir.x,
        y: current.pos.y + dir.y,
      };

      const neighborKey = posKey(neighborPos);
      if (visited.has(neighborKey)) {
        continue;
      }

      if (!isWalkable(neighborPos.x, neighborPos.y)) {
        continue;
      }

      visited.add(neighborKey);
      queue.push({ pos: neighborPos, dist: current.dist + 1 });
    }
  }

  return reachable;
}
