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
  console.log('>>> [1/3] Starting Next.js server on port 3000...');
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
      console.log(`\n--- Inspecting /investigate at ${vp.width}x${vp.height} (${vp.name}) ---`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      await page.goto('http://localhost:3000/investigate', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Wait for React Flow nodes to render
      await page.waitForSelector('.react-flow__node', { timeout: 15000 });
      await page.waitForTimeout(800);
      const nodeCount = await page.locator('.react-flow__node').count();
      console.log(`[OK] React Flow nodes rendered: ${nodeCount}`);

      const nodeDebug = await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll('.react-flow__node')).map(el => {
          const inner = el.firstElementChild;
          return {
            rect: el.getBoundingClientRect(),
            style: el.getAttribute('style'),
            text: el.innerText.substring(0, 40).replace(/\n/g, ' '),
            innerBg: inner ? window.getComputedStyle(inner).backgroundColor : null,
            innerBorder: inner ? window.getComputedStyle(inner).borderColor : null,
            innerColor: inner ? window.getComputedStyle(inner).color : null,
          };
        });
        const vp = document.querySelector('.react-flow__viewport');
        return { nodes, vpStyle: vp ? vp.getAttribute('style') : null };
      });
      console.log('Node debug:', JSON.stringify(nodeDebug, null, 2));

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
      const screenPath = path.join(rootDir, 'docs', 'screens', `investigate-${vp.name}.png`);
      await page.screenshot({ path: screenPath, fullPage: false });
      console.log(`[Screenshot saved] ${screenPath}`);

      // Also save in frontend directory for convenience
      const frontendScreenPath = path.join(rootDir, 'frontend', `screenshot-investigate-${vp.name}.png`);
      await page.screenshot({ path: frontendScreenPath, fullPage: false });

      await context.close();
    }

    await browser.close();
    console.log('\n>>> All screenshots captured successfully!');
  } finally {
    console.log('>>> [3/3] Shutting down frontend server...');
    frontendProc.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error('Inspection failed:', err);
  process.exit(1);
});

