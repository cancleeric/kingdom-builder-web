import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

// Intercept console and get pathname
page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

await page.goto('http://localhost:8087/design-system', { waitUntil: 'networkidle' });
const pathname = await page.evaluate(() => window.location.pathname);
const title = await page.title();
const h1 = await page.$eval('h1', el => el.textContent).catch(() => 'no h1');
console.log('pathname:', pathname);
console.log('title:', title);
console.log('h1:', h1);
await browser.close();
