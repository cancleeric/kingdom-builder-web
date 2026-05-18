import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto('http://localhost:8087/design-system', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.screenshot({
  path: 'test-results/design-system-preview.png',
  fullPage: true,
});
console.log('Screenshot saved to test-results/design-system-preview.png');
await browser.close();
