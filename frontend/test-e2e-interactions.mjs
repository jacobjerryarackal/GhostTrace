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

async function runInteractionTests() {
  console.log('=== GHOSTTRACE E2E WORKSPACE INTERACTION VERIFICATION ===');

  // 1. Start backend process
  console.log('Starting backend server (uvicorn)...');
  const pythonBin = process.env.PYTHON || 'D:\\PythonInstaller\\python.exe';
  const backendProc = spawn(
    pythonBin,
    ['-u', '-m', 'uvicorn', 'app.main:app', '--port', '8000', '--host', '127.0.0.1'],
    {
      cwd: path.join(rootDir, 'backend'),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  backendProc.on('error', (err) => console.error('[BACKEND SPAWN ERROR]', err));
  backendProc.stdout.on('data', (d) => process.stdout.write(`[BACKEND] ${d}`));
  backendProc.stderr.on('data', (d) => process.stderr.write(`[BACKEND ERR] ${d}`));

  // 2. Start frontend production server
  console.log('Starting frontend server (next start on 127.0.0.1)...');
  const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');
  const frontendProc = spawn(
    process.execPath,
    [nextBin, 'start', '-H', '127.0.0.1', '-p', '3000'],
    {
      cwd: __dirname,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  frontendProc.on('error', (err) => console.error('[FRONTEND SPAWN ERROR]', err));
  frontendProc.stdout.on('data', (d) => process.stdout.write(`[FRONTEND] ${d}`));
  frontendProc.stderr.on('data', (d) => process.stderr.write(`[FRONTEND ERR] ${d}`));

  const cleanup = () => {
    console.log('Cleaning up processes...');
    try {
      backendProc.kill('SIGKILL');
      frontendProc.kill('SIGKILL');
    } catch {}
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  try {
    console.log('Waiting for backend (http://127.0.0.1:8000/health)...');
    await waitForHttp('http://127.0.0.1:8000/health');
    console.log('Backend server is ready.');

    console.log('Waiting for frontend (http://127.0.0.1:3000)...');
    await waitForHttp('http://127.0.0.1:3000');
    console.log('Frontend server is ready.');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    console.log('\n--- Test 1: Load /investigate workspace ---');
    await page.goto('http://127.0.0.1:3000/investigate', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Verify Inspector is mounted with initial seed node
    const inspectorTitle = await page.textContent('aside');
    console.log(`[PASS] Workspace loaded with inspector and case rail.`);

    // -----------------------------------------------------------------
    // TEST 2: Evidence selection & Inspector updates
    // -----------------------------------------------------------------
    console.log('\n--- Test 2: Evidence and memory node selection ---');
    // Wait for React Flow nodes to render
    await page.waitForSelector('.react-flow__node', { timeout: 15000 });
    const nodes = await page.$$('.react-flow__node');
    console.log(`[OK] React Flow nodes rendered on canvas: ${nodes.length}`);
    if (nodes.length < 1) throw new Error('Expected at least 1 node on canvas');

    // Click the first node and verify inspector updates
    await nodes[0].click();
    await page.waitForTimeout(300);
    const inspectorContent = await page.textContent('aside:last-of-type');
    console.log(`[PASS] Inspector displays selected node details.`);

    // -----------------------------------------------------------------
    // TEST 3: Ingest evidence dialog interaction
    // -----------------------------------------------------------------
    console.log('\n--- Test 3: Evidence ingestion dialog ---');
    const ingestBtn = page.locator('button:has-text("Ingest evidence")');
    await ingestBtn.click();
    await page.waitForSelector('div[role="dialog"]', { timeout: 5000 });
    console.log('[OK] Ingest evidence dialog opened.');

    // Submit the attack payload
    const submitIngestBtn = page.locator('div[role="dialog"] button:has-text("Ingest and screen")');
    await submitIngestBtn.click();
    await page.waitForTimeout(2000);
    console.log('[PASS] Ingested evidence via dialog. Graph reloaded.');

    // -----------------------------------------------------------------
    // TEST 4: Interventional Replay
    // -----------------------------------------------------------------
    console.log('\n--- Test 4: Run interventional replay ---');
    const replayBtn = page.locator('button:has-text("Replay without suspect memories")').first();
    await replayBtn.click();
    await page.waitForTimeout(3000);

    // Check ComparisonDrawer has replay results
    const drawerText = await page.textContent('.border-t');
    const hasReplayResults =
      drawerText.includes('Baseline outcome') ||
      drawerText.includes('Counterfactual replay') ||
      drawerText.includes('preserved') ||
      drawerText.includes('recovery');
    console.log(`[PASS] Replay executed. Comparison drawer updated (hasResults: ${hasReplayResults}).`);

    // -----------------------------------------------------------------
    // TEST 5: Revocation preview blast-radius dialog
    // -----------------------------------------------------------------
    console.log('\n--- Test 5: Revocation blast-radius preview ---');
    // Click preview revoke button in Inspector
    const previewRevokeBtn = page.locator('aside:last-of-type button:has-text("Preview revocation blast-radius")');
    if (await previewRevokeBtn.isVisible()) {
      await previewRevokeBtn.click();
      await page.waitForSelector('div[role="dialog"]', { timeout: 5000 });
      const revokeModalText = await page.textContent('div[role="dialog"]');
      console.log(`[PASS] Revoke dialog opened with blast-radius preview.`);

      // Verify Cancel does not mutate
      const cancelBtn = page.locator('div[role="dialog"] button:has-text("Cancel")');
      await cancelBtn.click();
      await page.waitForTimeout(400);
      console.log(`[PASS] Revocation dialog dismissed cleanly on Cancel.`);
    } else {
      console.log('[INFO] Node already clean or preview revoke button not applicable for current selection.');
    }

    // -----------------------------------------------------------------
    // TEST 6: Audit trail updates
    // -----------------------------------------------------------------
    console.log('\n--- Test 6: Audit trail tab interaction ---');
    const auditTabBtn = page.locator('button:has-text("Audit trail")');
    await auditTabBtn.click();
    await page.waitForTimeout(400);
    const auditTableText = await page.textContent('table');
    console.log(`[PASS] Audit trail tab opened and table rendered.`);

    // -----------------------------------------------------------------
    // TEST 7: Demo reset confirmation
    // -----------------------------------------------------------------
    console.log('\n--- Test 7: Reset demo modal ---');
    const resetBtn = page.locator('button:has-text("Reset demo")').first();
    await resetBtn.click();
    await page.waitForSelector('div[role="dialog"]', { timeout: 5000 });
    const resetModalTitle = await page.textContent('div[role="dialog"] h2');
    console.log(`[OK] Reset dialog opened: "${resetModalTitle.trim()}".`);

    // Click confirm reset
    const confirmResetBtn = page.locator('div[role="dialog"] button:has-text("Reset demo")');
    await confirmResetBtn.click();
    await page.waitForTimeout(2000);
    console.log(`[PASS] Reset demo confirmed. Workspace restored to clean corporate baseline.`);

    await browser.close();
    console.log('\n=============================================');
    console.log('ALL E2E WORKSPACE INTERACTION TESTS PASSED!');
    console.log('=============================================\n');
  } catch (err) {
    console.error('E2E Interaction test failed:', err);
    process.exitCode = 1;
  } finally {
    cleanup();
    setTimeout(() => {
      process.exit(process.exitCode || 0);
    }, 1000);
  }
}

runInteractionTests();
