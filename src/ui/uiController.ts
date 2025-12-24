import { GameEngine } from '../game/gameEngine';

/**
 * UI Controller for managing DOM elements
 */
export class UIController {
  private healthDisplay: HTMLElement;
  private levelDisplay: HTMLElement;
  private floorDisplay: HTMLElement;
  private messageLog: HTMLElement;
  private messages: Array<{ text: string; type: string }> = [];
  private maxMessages = 10;

  constructor() {
    const healthDisplay = document.getElementById('health-display');
    const levelDisplay = document.getElementById('level-display');
    const floorDisplay = document.getElementById('floor-display');
    const messageLog = document.getElementById('message-log');

    if (!healthDisplay) {
      throw new Error("Required UI element with id 'health-display' was not found in the DOM.");
    }
    if (!levelDisplay) {
      throw new Error("Required UI element with id 'level-display' was not found in the DOM.");
    }
    if (!floorDisplay) {
      throw new Error("Required UI element with id 'floor-display' was not found in the DOM.");
    }
    if (!messageLog) {
      throw new Error("Required UI element with id 'message-log' was not found in the DOM.");
    }

    this.healthDisplay = healthDisplay;
    this.levelDisplay = levelDisplay;
    this.floorDisplay = floorDisplay;
    this.messageLog = messageLog;
  }

  /**
   * Update UI with current game state
   */
  update(engine: GameEngine): void {
    const state = engine.getState();

    this.healthDisplay.textContent = `${state.player.stats.health} / ${state.player.stats.maxHealth}`;
    this.levelDisplay.textContent = `${state.player.stats.level} (${state.player.stats.experience} XP)`;
    this.floorDisplay.textContent = `${state.currentFloor}`;

    // Update health color
    const healthPercent = state.player.stats.health / state.player.stats.maxHealth;
    if (healthPercent > 0.5) {
      this.healthDisplay.style.color = '#51cf66';
    } else if (healthPercent > 0.25) {
      this.healthDisplay.style.color = '#ffd43b';
    } else {
      this.healthDisplay.style.color = '#ff6b6b';
    }
  }

  /**
   * Add a message to the log
   */
  addMessage(text: string, type: string = 'info'): void {
    this.messages.push({ text, type });
    
    // Keep only last N messages
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }

    this.renderMessages();
  }

  /**
   * Render messages to the log
   */
  private renderMessages(): void {
    this.messageLog.innerHTML = '';
    
    for (const message of this.messages) {
      const div = document.createElement('div');
      div.className = `message message-${message.type}`;
      div.textContent = message.text;
      this.messageLog.appendChild(div);
    }

    // Scroll to bottom
    this.messageLog.scrollTop = this.messageLog.scrollHeight;
  }

  /**
   * Show save code modal
   */
  showSaveCode(code: string): void {
    const message = `Your save code:\n\n${code}\n\nCopy this code to restore your progress later.`;
    alert(message);
  }

  /**
   * Prompt for save code
   */
  promptForSaveCode(): string | null {
    return prompt('Enter your save code:');
  }

  /**
   * Show game over message
   */
  showGameOver(floor: number, level: number): void {
    const message = `Game Over!\n\nYou reached floor ${floor} at level ${level}.\n\nGet a save code to preserve your level progress!`;
    alert(message);
  }
}
