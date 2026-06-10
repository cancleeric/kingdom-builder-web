import { test, expect } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';
import { GamePage } from '../pages/GamePage';

/**
 * Multiplayer E2E tests — legacy file (superseded).
 *
 * Both fixme scenarios below are now covered by multiplayer-platform.spec.ts (R42-T3):
 *
 *   Scenario 1 (host creates room + guest joins):
 *     → Superseded by multiplayer-platform.spec.ts scenarios 1 + 2
 *       ("host creates room and room ID appears" + "guest joins room and lobby shows 2 players")
 *
 *   Scenario 2 (board state synchronization):
 *     → Covered structurally by multiplayer-platform.spec.ts scenario 3
 *       ("host starts game and canvas renders with zero pageerrors").
 *       Full bidirectional placement-sync E2E requires dedicated WS E2E infra
 *       (both Vite dev + npm run server in webServer) — tracked separately.
 *
 * The fixme blocks are retained below as historical record but will not run.
 * See multiplayer-platform.spec.ts for the active, passing coverage.
 */

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('i18nextLng', 'en');
    });
    await page.evaluate(() => {
        try {
            localStorage.setItem('i18nextLng', 'en');
        } catch {
            // ignore storage access errors before first navigation
        }
    });
});

// ─── Scenario 1: Host creates room and guest joins ──────────────────────────

test.fixme('multiplayer: host creates room and guest joins', async ({ browser }) => {
    // Create two independent browser contexts (host and guest)
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    const hostSetup = new SetupPage(hostPage);
    const hostGame = new GamePage(hostPage);
    const guestSetup = new SetupPage(guestPage);
    const guestGame = new GamePage(guestPage);

    // Host creates a room
    await hostSetup.goto();
    await expect(hostSetup.setupHeading).toBeVisible();

    // Click "Create Room" or "Multiplayer" button (adjust selector as needed)
    await hostPage.getByRole('button', { name: /create.*room|multiplayer/i }).click();

    // Wait for room code to appear (adjust selector to match your UI)
    const roomCode = await hostPage.locator('[data-testid="room-code"]').textContent();
    expect(roomCode).toBeTruthy();

    // Configure host player and start waiting for guest
    await hostSetup.setPlayerName(0, 'Host Alice');
    await hostPage.getByRole('button', { name: /start.*room|ready/i }).click();

    // Guest joins using the room code
    await guestSetup.goto();
    await expect(guestSetup.setupHeading).toBeVisible();
    await guestPage.getByRole('button', { name: /join.*room/i }).click();
    await guestPage.getByPlaceholder(/room.*code/i).fill(roomCode!);
    await guestPage.getByRole('button', { name: /join/i }).click();

    // Both contexts should now see the game board
    await expect(hostGame.header).toBeVisible({ timeout: 10_000 });
    await expect(guestGame.header).toBeVisible({ timeout: 10_000 });

    // Host draws a card and places a settlement
    await hostGame.clickDrawCard();
    await expect(hostGame.liveRegion).toContainText('PlaceSettlements');
    await hostGame.clickValidCell();

    // Guest should see the settlement appear on their board (sync check)
    // Wait for the settlement count to update on guest's board
    await guestPage.waitForTimeout(500); // Allow time for WebSocket sync

    // Verify guest sees the same game state (aria-live or settlement count)
    const guestLive = await guestGame.liveRegion.textContent();
    expect(guestLive).toContain('PlaceSettlements'); // Phase must sync

    await hostContext.close();
    await guestContext.close();
});

// ─── Scenario 2: Board state synchronization between players ─────────────────

test.fixme('multiplayer: board state syncs between host and guest', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    const hostGame = new GamePage(hostPage);
    const guestGame = new GamePage(guestPage);

    // (Assume room is already set up from previous test; in practice, factor
    //  this into a shared helper function for multiplayer setup.)
    await hostPage.goto('/?room=test-sync-room');
    await guestPage.goto('/?room=test-sync-room');

    await expect(hostGame.header).toBeVisible();
    await expect(guestGame.header).toBeVisible();

    // Host completes a full turn
    await hostGame.drawAndPlace(3);
    await hostGame.clickEndTurn();

    // Guest should now see their turn start (DrawCard phase)
    await expect(guestGame.liveRegion).toContainText('DrawCard', { timeout: 2000 });

    // Guest draws a card
    await guestGame.clickDrawCard();
    await expect(guestGame.liveRegion).toContainText('PlaceSettlements');

    // Host should see guest's phase change reflected in the aria-live region
    await hostPage.waitForTimeout(500);
    await expect(hostGame.liveRegion).toContainText('PlaceSettlements');

    await hostContext.close();
    await guestContext.close();
});
