import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the Game Setup screen.
 * Encapsulates all interactions with the player-configuration panel
 * shown before the game starts.
 */
export class SetupPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Navigate to the app (optionally with a seed for deterministic randomness). */
  async goto(seed?: number): Promise<void> {
    const url = seed !== undefined ? `/?seed=${seed}` : '/';
    await this.page.goto(url);
  }

  /** The main heading on the setup screen. */
  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Kingdom Builder' });
  }

  /** The "Game Setup" sub-heading. */
  get setupHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Game Setup' });
  }

  /** Click the player-count button (2, 3, or 4). */
  async selectPlayerCount(count: 2 | 3 | 4): Promise<void> {
    await this.page.getByRole('button', { name: String(count), exact: true }).click();
  }

  /** Set the name for the player at the given 0-based index. */
  async setPlayerName(index: number, name: string): Promise<void> {
    const inputs = this.page.getByRole('textbox');
    await inputs.nth(index).fill(name);
  }

  /** Set a player's type to 'human' or 'bot' (0-based index). */
  async setPlayerType(index: number, type: 'human' | 'bot'): Promise<void> {
    const label = type === 'human' ? '🧑 Human' : '🤖 Computer';
    const playerSection = this.page.locator('.border.rounded-lg.p-4').nth(index);
    await playerSection.getByRole('button', { name: label }).click();
  }

  /** Click the "Start Game" button. */
  async startGame(): Promise<void> {
    await this.page.getByRole('button', { name: 'Start Game' }).click();
  }
}
