import { GameEngine } from './game/gameEngine';
import { Renderer } from './ui/renderer';
import { UIController } from './ui/uiController';
import { encodeGameState, decodeSaveCode } from './utils/saveCode';

/**
 * Main game application
 */
class Game {
  private engine: GameEngine;
  private renderer: Renderer;
  private uiController: UIController;
  private canvas: HTMLCanvasElement;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.renderer = new Renderer(this.canvas);
    this.uiController = new UIController();
    this.engine = new GameEngine();

    this.setupEngine();
    this.setupEventListeners();
    this.uiController.addMessage('Welcome to the Caves of Skramis!', 'info');
    this.uiController.addMessage('Use arrow keys or WASD to move.', 'info');
    this.start();
  }

  /**
   * Setup engine callbacks
   */
  private setupEngine(): void {
    this.engine.setMessageCallback((message: string, type: string) => {
      this.uiController.addMessage(message, type);
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Keyboard controls
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Touch controls for mobile
    this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
    this.canvas.addEventListener('click', (e) => this.handleClick(e));

    // Button controls
    const newGameBtn = document.getElementById('new-game-btn');
    const saveCodeBtn = document.getElementById('save-code-btn');
    const loadCodeBtn = document.getElementById('load-code-btn');

    newGameBtn?.addEventListener('click', () => this.newGame());
    saveCodeBtn?.addEventListener('click', () => this.showSaveCode());
    loadCodeBtn?.addEventListener('click', () => this.loadSaveCode());
  }

  /**
   * Handle keyboard input
   */
  private handleKeyboard(e: KeyboardEvent): void {
    if (!this.engine.isPlayerAlive()) {
      return;
    }

    let dx = 0;
    let dy = 0;

    switch (e.key.toLowerCase()) {
      case 'arrowup':
      case 'w':
        dy = -1;
        break;
      case 'arrowdown':
      case 's':
        dy = 1;
        break;
      case 'arrowleft':
      case 'a':
        dx = -1;
        break;
      case 'arrowright':
      case 'd':
        dx = 1;
        break;
      case ' ':
        // Wait/skip turn
        this.uiController.addMessage('You wait...', 'info');
        this.update();
        return;
      default:
        return;
    }

    e.preventDefault();

    if (dx !== 0 || dy !== 0) {
      const result = this.engine.movePlayer(dx, dy);
      if (result.message) {
        const type = result.combat ? 'combat' : 'info';
        this.uiController.addMessage(result.message, type);
      }
      this.update();

      if (!this.engine.isPlayerAlive()) {
        this.gameOver();
      }
    }
  }

  /**
   * Handle touch input
   */
  private handleTouch(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      this.handlePointerInput(touch.clientX, touch.clientY);
    }
  }

  /**
   * Handle click input
   */
  private handleClick(e: MouseEvent): void {
    this.handlePointerInput(e.clientX, e.clientY);
  }

  /**
   * Handle pointer input (mouse or touch)
   */
  private handlePointerInput(screenX: number, screenY: number): void {
    if (!this.engine.isPlayerAlive()) {
      return;
    }

    const state = this.engine.getState();
    const dungeon = this.engine.getDungeon();
    
    if (!dungeon) {
      return;
    }

    // Calculate camera position
    const viewportWidth = 40;
    const viewportHeight = 30;
    const cameraX = Math.max(
      0,
      Math.min(
        dungeon.width - viewportWidth,
        state.player.position.x - Math.floor(viewportWidth / 2)
      )
    );
    const cameraY = Math.max(
      0,
      Math.min(
        dungeon.height - viewportHeight,
        state.player.position.y - Math.floor(viewportHeight / 2)
      )
    );

    const worldPos = this.renderer.screenToWorld(screenX, screenY, { x: cameraX, y: cameraY });

    // Move towards clicked position
    const dx = Math.sign(worldPos.x - state.player.position.x);
    const dy = Math.sign(worldPos.y - state.player.position.y);

    if (dx !== 0 || dy !== 0) {
      const result = this.engine.movePlayer(dx, dy);
      if (result.message) {
        const type = result.combat ? 'combat' : 'info';
        this.uiController.addMessage(result.message, type);
      }
      this.update();

      if (!this.engine.isPlayerAlive()) {
        this.gameOver();
      }
    }
  }

  /**
   * Start the game loop
   */
  private start(): void {
    this.update();
    this.gameLoop();
  }

  /**
   * Game loop
   */
  private gameLoop = (): void => {
    this.render();
    requestAnimationFrame(this.gameLoop);
  };

  /**
   * Update game state
   */
  private update(): void {
    this.uiController.update(this.engine);
  }

  /**
   * Render game
   */
  private render(): void {
    this.renderer.render(this.engine);
  }

  /**
   * New game
   */
  private newGame(): void {
    this.engine = new GameEngine();
    this.setupEngine();
    this.uiController.addMessage('New game started!', 'success');
    this.uiController.addMessage('Explore the dungeon and defeat enemies!', 'info');
    this.update();
  }

  /**
   * Show save code
   */
  private showSaveCode(): void {
    const state = this.engine.getState();
    const code = encodeGameState(state);
    this.uiController.showSaveCode(code);
  }

  /**
   * Load save code
   */
  private async loadSaveCode(): Promise<void> {
    const code = await this.uiController.promptForSaveCode();
    if (!code) {
      return;
    }

    const savedState = decodeSaveCode(code);
    if (!savedState) {
      this.uiController.addMessage('Invalid save code!', 'combat');
      return;
    }

    this.engine = new GameEngine(savedState);
    this.setupEngine();
    this.uiController.addMessage('Game loaded from save code!', 'success');
    this.uiController.addMessage(
      `Welcome back! Level ${savedState.player?.stats.level || 1}`,
      'info'
    );
    this.update();
  }

  /**
   * Game over
   */
  private gameOver(): void {
    const state = this.engine.getState();
    this.uiController.showGameOver(state.currentFloor, state.player.stats.level);
  }
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new Game());
} else {
  new Game();
}
