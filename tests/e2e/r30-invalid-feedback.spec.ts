import { test, expect, Page } from '@playwright/test';

async function startGame(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Single Player' }).click();
  await page.getByRole('button', { name: 'Start Game' }).click();
  // Skip onboarding/tutorial if shown
  const skipBtn = page.getByRole('button', { name: /skip/i });
  if (await skipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await skipBtn.click();
  }
}

async function drawCard(page: Page) {
  // Use aria-label to target the TurnBanner draw button specifically
  const drawBtn = page.getByRole('button', { name: 'Draw terrain card to start your turn' }).first();
  await drawBtn.waitFor({ state: 'visible', timeout: 10000 });
  await drawBtn.click();
}

test.describe('R30 invalid placement visual feedback', () => {
  test('A: invalid click shows hint toast + shake class on clicked cell', async ({ page }) => {
    await startGame(page);
    await drawCard(page);

    // Wait for PlaceSettlements — at least one valid cell should appear
    const validCell = page.locator('[role="gridcell"][aria-disabled="false"]').first();
    await validCell.waitFor({ timeout: 8000 });

    // Register observer before clicking, click inside the same evaluate call
    const { shakeDetected, hintToastText } = await page.evaluate(async () => {
      return new Promise<{ shakeDetected: boolean; hintToastText: string }>((resolve) => {
        let shakeFound = false;
        const deadline = setTimeout(() => {
          observer.disconnect();
          // Check for hint toast text at timeout
          const statuses = document.querySelectorAll('[role="status"][aria-live="polite"]');
          let toastTxt = '';
          statuses.forEach(el => {
            const t = el.textContent ?? '';
            if (t && (t.includes('place') || t.includes('terrain') || t.includes('adjacent') ||
                t.includes('occupied') || t.includes('放') || t.includes('須') || t.includes('格'))) {
              toastTxt = t;
            }
          });
          resolve({ shakeDetected: shakeFound, hintToastText: toastTxt });
        }, 1500);

        const observer = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'class') {
              const el = m.target as Element;
              const cn = el.getAttribute('class') ?? '';
              if (cn.includes('animate-hex-invalid-shake')) {
                shakeFound = true;
              }
            }
          }
        });

        const svg = document.querySelector('svg');
        if (svg) {
          observer.observe(svg, { subtree: true, attributes: true, attributeFilter: ['class'] });
        }

        // Click invalid cell
        const invalidCells = document.querySelectorAll('[role="gridcell"][aria-disabled="true"]');
        if (invalidCells.length > 0) {
          const target = invalidCells[0] as HTMLElement;
          target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

          // After React re-render, also poll the DOM directly for the shake class
          const pollInterval = setInterval(() => {
            const shakeEls = document.querySelectorAll('.animate-hex-invalid-shake');
            if (shakeEls.length > 0) {
              shakeFound = true;
              clearInterval(pollInterval);
            }
          }, 16); // poll every frame
          setTimeout(() => clearInterval(pollInterval), 1400);
        }
      });
    });

    // Wait for React to render toast
    await page.waitForTimeout(400);

    // Also check via Playwright locator for redundancy
    const toasts = page.locator('[role="status"][aria-live="polite"]');
    const toastCount = await toasts.count();
    let hintToastVisible = hintToastText !== '';
    let finalToastText = hintToastText;
    for (let i = 0; i < toastCount; i++) {
      const txt = await toasts.nth(i).textContent();
      if (txt && (
        txt.includes('place') || txt.includes('terrain') || txt.includes('adjacent') ||
        txt.includes('occupied') || txt.includes('放') || txt.includes('須') || txt.includes('格')
      )) {
        hintToastVisible = true;
        finalToastText = txt;
        break;
      }
    }

    console.log('shakeDetected:', shakeDetected, '| hintToastVisible:', hintToastVisible, '| toast:', finalToastText);

    // Take screenshot for CEO review
    await page.screenshot({ path: '/tmp/r30-invalid-flash-toast.png', fullPage: false });

    // Toast must appear
    expect(hintToastVisible).toBe(true);
    // Shake should also be detected (via MutationObserver)
    expect(shakeDetected).toBe(true);
  });

  test('B: valid placement does NOT trigger shake animation', async ({ page }) => {
    await startGame(page);
    await drawCard(page);

    const validCell = page.locator('[role="gridcell"][aria-disabled="false"]').first();
    await validCell.waitFor({ timeout: 8000 });

    // Watch for invalid shake BEFORE clicking a valid cell
    const invalidShakeOnValid = await page.evaluate(async () => {
      return new Promise<boolean>((resolve) => {
        let found = false;
        const deadline = setTimeout(() => resolve(found), 1000);

        const observer = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'class') {
              const el = m.target as Element;
              const cn = el.getAttribute('class') ?? '';
              if (cn.includes('animate-hex-invalid-shake')) {
                found = true;
                clearTimeout(deadline);
                observer.disconnect();
                resolve(true);
                return;
              }
            }
          }
        });

        const svg = document.querySelector('svg');
        if (svg) observer.observe(svg, { subtree: true, attributes: true, attributeFilter: ['class'] });

        // Click a VALID cell
        const validCells = document.querySelectorAll('[role="gridcell"][aria-disabled="false"]');
        if (validCells.length > 0) {
          (validCells[0] as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
        } else {
          clearTimeout(deadline);
          resolve(false);
        }
      });
    });

    console.log('invalidShakeOnValid:', invalidShakeOnValid);
    await page.screenshot({ path: '/tmp/r30-valid-placement-ok.png', fullPage: false });
    expect(invalidShakeOnValid).toBe(false);
  });

  test('C: debounce — 5 rapid clicks produce fewer than 5 shake triggers', async ({ page }) => {
    await startGame(page);
    await drawCard(page);

    const validCell = page.locator('[role="gridcell"][aria-disabled="false"]').first();
    await validCell.waitFor({ timeout: 8000 });

    const shakeCount = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        let count = 0;

        const obs = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'class') {
              const el = m.target as Element;
              const cn = el.getAttribute('class') ?? '';
              if (cn.includes('animate-hex-invalid-shake')) {
                count++;
              }
            }
          }
        });

        const svg = document.querySelector('svg');
        if (svg) obs.observe(svg, { subtree: true, attributes: true, attributeFilter: ['class'] });

        const invalidCells = document.querySelectorAll('[role="gridcell"][aria-disabled="true"]');
        const target = invalidCells[0] as HTMLElement;
        if (target) {
          for (let i = 0; i < 5; i++) {
            target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }
        }

        setTimeout(() => {
          obs.disconnect();
          resolve(count);
        }, 800);
      });
    });

    console.log('shakeCount for 5 rapid clicks:', shakeCount);
    // Debounce should prevent 5 separate triggers; expect fewer than 5
    expect(shakeCount).toBeLessThan(5);
  });

  test('D: hint toast auto-dismisses after ~1800ms', async ({ page }) => {
    await startGame(page);
    await drawCard(page);

    const validCell = page.locator('[role="gridcell"][aria-disabled="false"]').first();
    await validCell.waitFor({ timeout: 8000 });

    // Trigger invalid click
    await page.evaluate(() => {
      const invalidCells = document.querySelectorAll('[role="gridcell"][aria-disabled="true"]');
      if (invalidCells.length > 0) {
        (invalidCells[0] as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });

    await page.waitForTimeout(300);
    // Toast should be visible now
    const toasts = page.locator('[role="status"][aria-live="polite"]');
    let toastTextBefore = '';
    const count = await toasts.count();
    for (let i = 0; i < count; i++) {
      const txt = await toasts.nth(i).textContent();
      if (txt && (txt.includes('place') || txt.includes('terrain') || txt.includes('放') || txt.includes('須'))) {
        toastTextBefore = txt;
        break;
      }
    }

    // Wait for auto-dismiss (1800ms + buffer)
    await page.waitForTimeout(2200);

    // Toast should be gone (null message → null render)
    let toastStillThere = false;
    const countAfter = await toasts.count();
    for (let i = 0; i < countAfter; i++) {
      const txt = await toasts.nth(i).textContent();
      if (txt && txt === toastTextBefore && toastTextBefore !== '') {
        toastStillThere = true;
        break;
      }
    }

    console.log('toastTextBefore:', toastTextBefore, '| toastStillThere after 2.2s:', toastStillThere);
    expect(toastTextBefore).not.toBe('');
    expect(toastStillThere).toBe(false);
  });
});
