import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function waitForHttp(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      http
        .get(url, (res) => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
            resolve(true);
          } else {
            setTimeout(check, 500);
          }
        })
        .on('error', () => {
          if (Date.now() - start > timeoutMs) {
            reject(new Error(`Timeout waiting for ${url}`));
          } else {
            setTimeout(check, 500);
          }
        });
    }
    check();
  });
}

async function main() {
  console.log('>>> [1/3] Starting Next.js server on port 3000 for Landing page inspection...');
  const frontendProc = spawn(
    'node',
    [path.join(rootDir, 'frontend', 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '-p', '3000'],
    {
      cwd: path.join(rootDir, 'frontend'),
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  frontendProc.stderr.on('data', (d) => {
    const s = d.toString();
    if (s.includes('error')) console.error(`Frontend stderr: ${s}`);
  });

  try {
    await waitForHttp('http://localhost:3000', 25000);
    console.log('>>> [Frontend Online] http://localhost:3000 is ready');

    console.log('>>> [2/3] Launching Playwright browser...');
    const browser = await chromium.launch({ headless: true });

    const viewports = [
      { name: '1440', width: 1440, height: 900 },
      { name: '768', width: 768, height: 1024 },
      { name: '390', width: 390, height: 844 },
    ];

    for (const vp of viewports) {
      console.log(`\n--- Inspecting / (Landing) at ${vp.width}x${vp.height} (${vp.name}) ---`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      await page.goto('http://localhost:3000', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      await page.waitForTimeout(1000);

      // Check overflow
      const overflow = await page.evaluate(() => {
        return {
          docWidth: document.documentElement.scrollWidth,
          winWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
        };
      });
      console.log(
        `[Overflow check] docWidth=${overflow.docWidth}px, winWidth=${overflow.winWidth}px -> Overflow: ${overflow.hasOverflow}`
      );

      // Save screenshot under docs/screens/
      const screenPath = path.join(rootDir, 'docs', 'screens', `landing-${vp.name}.png`);
      await page.screenshot({ path: screenPath, fullPage: false });
      console.log(`[Screenshot saved] ${screenPath}`);

      // Also save full page screenshot for complete visual review
      const fullScreenPath = path.join(rootDir, 'docs', 'screens', `landing-${vp.name}-full.png`);
      await page.screenshot({ path: fullScreenPath, fullPage: true });

      await context.close();
    }

    await browser.close();
    console.log('\n>>> All landing page screenshots captured successfully!');
  } finally {
    console.log('>>> [3/3] Shutting down frontend server...');
    frontendProc.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error('Inspection failed:', err);
  process.exit(1);
});

