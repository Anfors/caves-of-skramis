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
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '1000';

    // Create modal container
    const modal = document.createElement('div');
    modal.style.backgroundColor = '#1e1e1e';
    modal.style.color = '#ffffff';
    modal.style.padding = '16px';
    modal.style.borderRadius = '8px';
    modal.style.maxWidth = '90%';
    modal.style.width = '420px';
    modal.style.boxSizing = 'border-box';
    modal.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)';

    const title = document.createElement('h2');
    title.textContent = 'Your save code';
    title.style.margin = '0 0 12px 0';
    title.style.fontSize = '1.2rem';

    const description = document.createElement('p');
    description.textContent = 'Copy this code to restore your progress later:';
    description.style.margin = '0 0 8px 0';

    const textarea = document.createElement('textarea');
    textarea.value = code;
    textarea.readOnly = true;
    textarea.style.width = '100%';
    textarea.style.boxSizing = 'border-box';
    textarea.style.minHeight = '80px';
    textarea.style.marginBottom = '12px';
    textarea.style.padding = '8px';
    textarea.style.borderRadius = '4px';
    textarea.style.border = '1px solid #555';
    textarea.style.backgroundColor = '#121212';
    textarea.style.color = '#ffffff';
    textarea.style.fontFamily = 'monospace';

    const buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.justifyContent = 'flex-end';
    buttonRow.style.gap = '8px';

    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.style.padding = '6px 12px';
    copyButton.style.borderRadius = '4px';
    copyButton.style.border = 'none';
    copyButton.style.cursor = 'pointer';
    copyButton.style.backgroundColor = '#4dabf7';
    copyButton.style.color = '#000';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.padding = '6px 12px';
    closeButton.style.borderRadius = '4px';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.style.backgroundColor = '#868e96';
    closeButton.style.color = '#000';

    const closeModal = () => {
      if (overlay.parentElement) {
        document.body.removeChild(overlay);
      }
    };

    copyButton.addEventListener('click', () => {
      textarea.select();
      try {
        document.execCommand('copy');
      } catch {
        // Ignore copy errors; user can still manually copy
      }
    });

   closeButton.addEventListener('click', () => {
      closeModal();
    });

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closeModal();
      }
    });

    buttonRow.appendChild(copyButton);
    buttonRow.appendChild(closeButton);

    modal.appendChild(title);
    modal.appendChild(description);
    modal.appendChild(textarea);
    modal.appendChild(buttonRow);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    textarea.focus();
  }

  /**
   * Prompt for save code
   */
  promptForSaveCode(): Promise<string | null> {
    return new Promise((resolve) => {
      // Create overlay
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.zIndex = '1000';

      // Create modal container
      const modal = document.createElement('div');
      modal.style.backgroundColor = '#1e1e1e';
      modal.style.color = '#ffffff';
      modal.style.padding = '16px';
      modal.style.borderRadius = '8px';
      modal.style.maxWidth = '90%';
      modal.style.width = '420px';
      modal.style.boxSizing = 'border-box';
      modal.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)';

      const title = document.createElement('h2');
      title.textContent = 'Enter your save code';
      title.style.margin = '0 0 12px 0';
      title.style.fontSize = '1.2rem';

      const description = document.createElement('p');
      description.textContent = 'Paste your save code below to restore your progress:';
      description.style.margin = '0 0 8px 0';

      const input = document.createElement('textarea');
      input.placeholder = 'Enter your save code';
      input.style.width = '100%';
      input.style.boxSizing = 'border-box';
      input.style.minHeight = '80px';
      input.style.marginBottom = '12px';
      input.style.padding = '8px';
      input.style.borderRadius = '4px';
      input.style.border = '1px solid #555';
      input.style.backgroundColor = '#121212';
      input.style.color = '#ffffff';
      input.style.fontFamily = 'monospace';

      const buttonRow = document.createElement('div');
      buttonRow.style.display = 'flex';
      buttonRow.style.justifyContent = 'flex-end';
      buttonRow.style.gap = '8px';

      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.style.padding = '6px 12px';
      cancelButton.style.borderRadius = '4px';
      cancelButton.style.border = 'none';
      cancelButton.style.cursor = 'pointer';
      cancelButton.style.backgroundColor = '#868e96';
      cancelButton.style.color = '#000';

      const submitButton = document.createElement('button');
      submitButton.textContent = 'Load';
      submitButton.style.padding = '6px 12px';
      submitButton.style.borderRadius = '4px';
      submitButton.style.border = 'none';
      submitButton.style.cursor = 'pointer';
      submitButton.style.backgroundColor = '#51cf66';
      submitButton.style.color = '#000';

      const closeModal = (value: string | null) => {
        if (overlay.parentElement) {
          document.body.removeChild(overlay);
        }
        resolve(value);
      };

      cancelButton.addEventListener('click', () => {
        closeModal(null);
      });

      submitButton.addEventListener('click', () => {
        const trimmed = input.value.trim();
        if (trimmed.length === 0) {
          closeModal(null);
        } else {
          closeModal(trimmed);
        }
      });

      input.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          submitButton.click();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          cancelButton.click();
        }
      });

      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
          closeModal(null);
        }
      });

      buttonRow.appendChild(cancelButton);
      buttonRow.appendChild(submitButton);

      modal.appendChild(title);
      modal.appendChild(description);
      modal.appendChild(input);
      modal.appendChild(buttonRow);

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      input.focus();
    });
  }

  /**
   * Show game over message
   */
  showGameOver(floor: number, level: number): void {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '1000';

    // Create modal container
    const modal = document.createElement('div');
    modal.style.backgroundColor = '#1e1e1e';
    modal.style.color = '#ffffff';
    modal.style.padding = '16px';
    modal.style.borderRadius = '8px';
    modal.style.maxWidth = '90%';
    modal.style.width = '420px';
    modal.style.boxSizing = 'border-box';
    modal.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)';

    const title = document.createElement('h2');
    title.textContent = 'Game Over';
    title.style.margin = '0 0 12px 0';
    title.style.fontSize = '1.2rem';

    const message = document.createElement('p');
    message.textContent = `You reached floor ${floor} at level ${level}.`;
    message.style.margin = '0 0 8px 0';

    const hint = document.createElement('p');
    hint.textContent = 'Get a save code to preserve your level progress!';
    hint.style.margin = '0 0 12px 0';

    const buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.justifyContent = 'flex-end';
    buttonRow.style.gap = '8px';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.padding = '6px 12px';
    closeButton.style.borderRadius = '4px';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.style.backgroundColor = '#868e96';
    closeButton.style.color = '#000';

    const closeModal = () => {
      if (overlay.parentElement) {
        document.body.removeChild(overlay);
      }
    };

    closeButton.addEventListener('click', () => {
      closeModal();
    });

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closeModal();
      }
    });

    buttonRow.appendChild(closeButton);

    modal.appendChild(title);
    modal.appendChild(message);
    modal.appendChild(hint);
    modal.appendChild(buttonRow);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }
}
