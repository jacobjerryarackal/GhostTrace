import { chromium } from '@playwright/test';

async function main() {
  console.log('Launching browser to probe https://ghost-trace-eta.vercel.app/investigate ...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[BROWSER CONSOLE ${msg.type()}]`, msg.text()));
  page.on('pageerror', err => console.log(`[PAGE ERROR]`, err.message));
  page.on('request', req => {
    if (req.url().includes('/api/') || req.url().includes('/health')) {
      console.log(`[REQUEST] ${req.method()} ${req.url()}`);
    }
  });
  page.on('response', res => {
    if (res.url().includes('/api/') || res.url().includes('/health')) {
      console.log(`[RESPONSE] ${res.status()} ${res.url()}`);
    }
  });

  try {
    await page.goto('https://ghost-trace-eta.vercel.app/investigate', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Loaded page successfully');
    await page.waitForTimeout(3000);
    const content = await page.content();
    console.log('Page content length:', content.length);
  } catch (err) {
    console.error('Error during probe:', err);
  } finally {
    await browser.close();
  }
}

main();

