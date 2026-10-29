import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function waitForHttp(url, timeoutMs = 25000) {
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
  console.log('>>> [1/3] Starting backend & frontend for /investigate inspection...');
  const pythonBin = 'D:\\PythonInstaller\\python.exe';
  const backendProc = spawn(
    pythonBin,
    ['-m', 'uvicorn', 'app.main:app', '--port', '8000', '--host', '127.0.0.1'],
    {
      cwd: path.join(rootDir, 'backend'),
      env: { ...process.env, PYTHONPATH: path.join(rootDir, 'backend') },
      stdio: ['ignore', 'inherit', 'inherit'],
    }
  );

  const frontendProc = spawn(
    'node',
    [path.join(rootDir, 'frontend', 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '-p', '3000'],
    {
      cwd: path.join(rootDir, 'frontend'),
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  let success = false;
  try {
    await waitForHttp('http://127.0.0.1:8000/health', 15000);
    console.log('>>> [Backend Online] http://127.0.0.1:8000/health is ready');
    await waitForHttp('http://localhost:3000', 20000);
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
      await page.waitForSelector('.react-flow__node', { timeout: 10000 });
      const nodeCount = await page.locator('.react-flow__node').count();
      console.log(`[OK] React Flow nodes rendered: ${nodeCount}`);

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

      // Save screenshot
      const screenPath = path.join(rootDir, 'docs', 'screens', `investigate-${vp.name}.png`);
      await page.screenshot({ path: screenPath, fullPage: false });
      console.log(`[Screenshot saved] ${screenPath}`);

      await context.close();
    }

    await browser.close();
    success = true;
  } catch (err) {
    console.error('Inspection failed:', err);
  } finally {
    console.log('>>> [3/3] Shutting down test servers...');
    backendProc.kill('SIGTERM');
    frontendProc.kill('SIGTERM');
    setTimeout(() => {
      try {
        backendProc.kill();
        frontendProc.kill();
      } catch {}
    }, 1000);
  }

  if (!success) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

