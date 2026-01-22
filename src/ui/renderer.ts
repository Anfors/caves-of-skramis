import { TileType, EntityType, Position } from '../game/types';
import { GameEngine } from '../game/gameEngine';
import { getViewportWidth, getViewportHeight, getTileSize } from '../config';
import { findReachableTiles, manhattanDistance } from '../utils/pathfinding';

/**
 * Highlight mode for tiles
 */
export enum HighlightMode {
  NONE = 'none',
  WALKABLE = 'walkable',
  RISKY = 'risky',
}

/**
 * Highlight colors for tiles
 */
const HIGHLIGHT_COLORS = {
  WALKABLE: 'rgba(81, 207, 102, 0.3)', // Green
  RISKY: 'rgba(255, 107, 107, 0.3)',    // Red
};

/**
 * Renderer for the game
 */
export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private baseTileSize: number; // Base tile size before zoom
  private tileSize: number;
  private viewportWidth: number = getViewportWidth();
  private viewportHeight: number = getViewportHeight();
  private zoomLevel = 1.0; // Default zoom level
  private highlightedTiles = new Map<string, HighlightMode>();
  private showHighlights = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    this.ctx = ctx;
    this.baseTileSize = getTileSize(); // Cache base tile size
    this.tileSize = this.baseTileSize;
    this.updateViewportSettings();
    this.resizeCanvas();
  }

  /**
   * Update viewport settings based on device and zoom level
   */
  private updateViewportSettings(): void {
    this.viewportWidth = getViewportWidth();
    this.viewportHeight = getViewportHeight();
    this.tileSize = Math.round(this.baseTileSize * this.zoomLevel);
  }

  /**
   * Set zoom level (0.5 to 2.0)
   */
  setZoomLevel(zoom: number): void {
    this.zoomLevel = Math.max(0.5, Math.min(2.0, zoom));
    this.updateViewportSettings();
    this.resizeCanvas();
  }

  /**
   * Get current zoom level
   */
  getZoomLevel(): number {
    return this.zoomLevel;
  }

  /**
   * Resize canvas based on viewport
   */
  private resizeCanvas(): void {
    this.canvas.width = this.viewportWidth * this.tileSize;
    this.canvas.height = this.viewportHeight * this.tileSize;
  }

  /**
   * Calculate camera position (centered on player)
   */
  getCameraPosition(engine: GameEngine): Position {
    const dungeon = engine.getDungeon();
    const state = engine.getState();

    if (!dungeon) {
      return { x: 0, y: 0 };
    }

    const cameraX = Math.max(
      0,
      Math.min(
        dungeon.width - this.viewportWidth,
        state.player.position.x - Math.floor(this.viewportWidth / 2)
      )
    );
    const cameraY = Math.max(
      0,
      Math.min(
        dungeon.height - this.viewportHeight,
        state.player.position.y - Math.floor(this.viewportHeight / 2)
      )
    );

    return { x: cameraX, y: cameraY };
  }

  /**
   * Render the game
   */
  render(engine: GameEngine): void {
    const dungeon = engine.getDungeon();
    const state = engine.getState();

    if (!dungeon) {
      return;
    }

    // Clear canvas
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate camera position (centered on player)
    const cameraPos = this.getCameraPosition(engine);
    const cameraX = cameraPos.x;
    const cameraY = cameraPos.y;

    // Render tiles
    for (let y = 0; y < this.viewportHeight; y++) {
      for (let x = 0; x < this.viewportWidth; x++) {
        const worldX = x + cameraX;
        const worldY = y + cameraY;

        if (worldX >= 0 && worldX < dungeon.width && worldY >= 0 && worldY < dungeon.height) {
          const tileKey = `${worldX},${worldY}`;
          const highlight = this.highlightedTiles.get(tileKey);
          this.renderTile(x, y, dungeon.tiles[worldY][worldX], highlight);
        }
      }
    }

    // Render entities
    for (const entity of dungeon.entities) {
      const screenX = entity.position.x - cameraX;
      const screenY = entity.position.y - cameraY;

      if (
        screenX >= 0 &&
        screenX < this.viewportWidth &&
        screenY >= 0 &&
        screenY < this.viewportHeight
      ) {
        this.renderEntity(screenX, screenY, entity.sprite, entity.type);
      }
    }

    // Render player
    const playerScreenX = state.player.position.x - cameraX;
    const playerScreenY = state.player.position.y - cameraY;
    this.renderEntity(playerScreenX, playerScreenY, state.player.sprite, EntityType.PLAYER);
  }

  /**
   * Render a tile
   */
  private renderTile(x: number, y: number, tileType: TileType, highlight?: HighlightMode): void {
    const pixelX = x * this.tileSize;
    const pixelY = y * this.tileSize;

    switch (tileType) {
      case TileType.FLOOR:
        this.ctx.fillStyle = '#3a3a3a';
        this.ctx.fillRect(pixelX, pixelY, this.tileSize, this.tileSize);
        break;
      case TileType.WALL:
        this.ctx.fillStyle = '#6a6a6a';
        this.ctx.fillRect(pixelX, pixelY, this.tileSize, this.tileSize);
        // Add some texture
        this.ctx.fillStyle = '#5a5a5a';
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.tileSize - 2, this.tileSize - 2);
        break;
      case TileType.EMPTY:
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(pixelX, pixelY, this.tileSize, this.tileSize);
        break;
    }

    // Draw highlight overlay
    if (highlight === HighlightMode.WALKABLE) {
      this.ctx.fillStyle = HIGHLIGHT_COLORS.WALKABLE;
      this.ctx.fillRect(pixelX, pixelY, this.tileSize, this.tileSize);
    } else if (highlight === HighlightMode.RISKY) {
      this.ctx.fillStyle = HIGHLIGHT_COLORS.RISKY;
      this.ctx.fillRect(pixelX, pixelY, this.tileSize, this.tileSize);
    }
  }

  /**
   * Render an entity
   */
  private renderEntity(x: number, y: number, sprite: string, type: EntityType): void {
    const pixelX = x * this.tileSize;
    const pixelY = y * this.tileSize;

    // Set color based on entity type
    let color = '#ffffff';
    switch (type) {
      case EntityType.PLAYER:
        color = '#4dabf7';
        break;
      case EntityType.ENEMY:
        color = '#ff6b6b';
        break;
      case EntityType.STAIRS:
        color = '#51cf66';
        break;
      case EntityType.ITEM:
        color = '#ffd43b';
        break;
    }

    this.ctx.fillStyle = color;
    this.ctx.font = `${this.tileSize}px 'Courier New', monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(sprite, pixelX + this.tileSize / 2, pixelY + this.tileSize / 2);
  }

  /**
   * Convert screen coordinates to world position
   */
  screenToWorld(screenX: number, screenY: number, cameraPos: Position): Position {
    const rect = this.canvas.getBoundingClientRect();
    
    // Scale coordinates to account for CSS scaling of the canvas
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const canvasX = (screenX - rect.left) * scaleX;
    const canvasY = (screenY - rect.top) * scaleY;

    const tileX = Math.floor(canvasX / this.tileSize);
    const tileY = Math.floor(canvasY / this.tileSize);

    return {
      x: tileX + cameraPos.x,
      y: tileY + cameraPos.y,
    };
  }

  /**
   * Update highlighted tiles based on current game state
   */
  updateHighlights(engine: GameEngine): void {
    this.highlightedTiles.clear();
    
    if (!this.showHighlights) {
      return;
    }

    const dungeon = engine.getDungeon();
    const state = engine.getState();
    
    if (!dungeon || !engine.isPlayerAlive()) {
      return;
    }

    // Get adjacent enemies to determine risky tiles
    const adjacentEnemies = engine.getAdjacentEnemies();

    // Find all reachable tiles
    const reachableTiles = findReachableTiles(state.player.position, dungeon);

    // Mark reachable tiles and identify risky retreat tiles
    for (const tileKey of reachableTiles) {
      const [x, y] = tileKey.split(',').map(Number);
      
      // Check if this tile would trigger a risky retreat
      let isRisky = false;
      if (adjacentEnemies.length > 0) {
        // Check if moving to this tile increases distance from any adjacent enemy
        for (const enemy of adjacentEnemies) {
          const currentDist = manhattanDistance(state.player.position, enemy.position);
          const newDist = manhattanDistance({ x, y }, enemy.position);
          if (newDist > currentDist) {
            isRisky = true;
            break;
          }
        }
      }

      this.highlightedTiles.set(tileKey, isRisky ? HighlightMode.RISKY : HighlightMode.WALKABLE);
    }
  }

  /**
   * Enable or disable highlight display
   */
  setShowHighlights(show: boolean): void {
    this.showHighlights = show;
  }

  /**
   * Check if highlights are shown
   */
  getShowHighlights(): boolean {
    return this.showHighlights;
  }
}
