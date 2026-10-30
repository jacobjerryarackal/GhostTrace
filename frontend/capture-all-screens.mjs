import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const screensDir = path.join(rootDir, 'docs', 'screens');

if (!fs.existsSync(screensDir)) {
  fs.mkdirSync(screensDir, { recursive: true });
}

function waitForHttp(url, timeoutMs = 25000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
          resolve(true);
        } else {
          setTimeout(check, 300);
        }
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
        } else {
          setTimeout(check, 300);
        }
      });
    };
    check();
  });
}

async function main() {
  console.log('=== GHOSTTRACE SCREENSHOT CAPTURE SUITE ===');
  console.log(`Screenshots will be saved to: ${screensDir}`);

  // 1. Start backend process (FastAPI on port 8000)
  console.log('Starting backend server (uvicorn)...');
  const backendProc = spawn(
    'python',
    ['-m', 'uvicorn', 'app.main:app', '--port', '8000', '--host', '127.0.0.1'],
    {
      cwd: path.join(rootDir, 'backend'),
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  backendProc.stdout.on('data', (d) => process.stdout.write(`[BACKEND] ${d}`));
  backendProc.stderr.on('data', (d) => process.stderr.write(`[BACKEND ERR] ${d}`));

  // 2. Start Next.js production server using direct node binary on 127.0.0.1
  console.log('Starting frontend server (next start on 127.0.0.1)...');
  const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');
  const frontendProc = spawn(
    process.execPath,
    [nextBin, 'start', '-H', '127.0.0.1', '-p', '3000'],
    {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  frontendProc.stdout.on('data', (d) => process.stdout.write(`[FRONTEND] ${d}`));
  frontendProc.stderr.on('data', (d) => process.stderr.write(`[FRONTEND ERR] ${d}`));

  const cleanup = () => {
    console.log('Cleaning up child processes...');
    try {
      backendProc.kill('SIGKILL');
      frontendProc.kill('SIGKILL');
    } catch {}
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  try {
    console.log('Waiting for frontend (http://127.0.0.1:3000)...');
    await waitForHttp('http://127.0.0.1:3000');
    console.log('Frontend server is ready!');

    const browser = await chromium.launch({ headless: true });

    const viewports = [
      { name: '1440', width: 1440, height: 900 },
      { name: '768', width: 768, height: 1024 },
      { name: '390', width: 390, height: 844 },
    ];

    const routes = [
      { name: 'landing', path: '/' },
      { name: 'investigate', path: '/investigate' },
      { name: 'benchmark', path: '/benchmark' },
      { name: 'method', path: '/method' },
    ];

    for (const vp of viewports) {
      console.log(`\n========================================`);
      console.log(`VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`========================================`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2, // 2x retina pixel density
      });
      const page = await context.newPage();

      for (const route of routes) {
        const targetUrl = `http://127.0.0.1:3000${route.path}`;
        console.log(`Navigating to ${route.name} (${targetUrl})...`);
        await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
        
        // Wait for fonts and canvas to settle
        await page.waitForTimeout(1500);

        const outPath = path.join(screensDir, `${route.name}-${vp.name}.png`);
        await page.screenshot({ path: outPath, fullPage: false });
        console.log(`[SAVED] ${outPath}`);
      }

      await context.close();
    }

    await browser.close();
    console.log('\nSUCCESS: All 12 screenshots captured successfully!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
    process.exitCode = 1;
  } finally {
    cleanup();
    setTimeout(() => {
      process.exit(process.exitCode || 0);
    }, 1000);
  }
}

main();
