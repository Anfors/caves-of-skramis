import { TileType, EntityType, Position } from '../game/types';
import { GameEngine } from '../game/gameEngine';
import { getViewportWidth, getViewportHeight, getTileSize } from '../config';

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

    // Render tiles
    for (let y = 0; y < this.viewportHeight; y++) {
      for (let x = 0; x < this.viewportWidth; x++) {
        const worldX = x + cameraX;
        const worldY = y + cameraY;

        if (worldX >= 0 && worldX < dungeon.width && worldY >= 0 && worldY < dungeon.height) {
          this.renderTile(x, y, dungeon.tiles[worldY][worldX]);
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
  private renderTile(x: number, y: number, tileType: TileType): void {
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
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;

    const tileX = Math.floor(canvasX / this.tileSize);
    const tileY = Math.floor(canvasY / this.tileSize);

    return {
      x: tileX + cameraPos.x,
      y: tileY + cameraPos.y,
    };
  }
}
