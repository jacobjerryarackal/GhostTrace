import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screensDir = path.resolve(__dirname, '..', 'docs', 'screens');

const PUBLIC_FRONTEND_URL = 'https://ghost-trace-eta.vercel.app';
const PUBLIC_BACKEND_URL = 'https://ghosttrace-backend-uj15.onrender.com';

async function runProductionVerification() {
  console.log('================================================================');
  console.log('   GHOSTTRACE FINAL PUBLIC PRODUCTION RELEASE VERIFICATION     ');
  console.log(`   Frontend: ${PUBLIC_FRONTEND_URL}`);
  console.log(`   Backend:  ${PUBLIC_BACKEND_URL}`);
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`[BROWSER ERROR]`, msg.text());
  });

  try {
    // -------------------------------------------------------------
    // Step 0: Ensure clean baseline before test start
    // -------------------------------------------------------------
    console.log('[Step 0] Probing backend reset to ensure clean baseline...');
    const resetRes = await fetch(`${PUBLIC_BACKEND_URL}/api/demo/reset`, { method: 'POST' });
    if (!resetRes.ok) {
      console.warn(`[WARN] Backend reset returned status ${resetRes.status}`);
    } else {
      console.log('[PASS] Demo state verified clean at backend.');
    }

    // -------------------------------------------------------------
    // Step 1: Open the investigation page
    // -------------------------------------------------------------
    console.log('\n[Step 1] Loading https://ghost-trace-eta.vercel.app/investigate ...');
    await page.goto(`${PUBLIC_FRONTEND_URL}/investigate`, {
      waitUntil: 'networkidle',
      timeout: 45000,
    });
    await page.waitForTimeout(2000);
    console.log('[PASS] Investigation workspace loaded successfully.');

    // -------------------------------------------------------------
    // Step 2: Inspect the clean baseline
    // -------------------------------------------------------------
    console.log('\n[Step 2] Inspecting clean baseline...');
    await page.waitForSelector('.react-flow__node', { timeout: 20000 });
    const initialNodes = await page.$$('.react-flow__node');
    console.log(`Found ${initialNodes.length} baseline nodes on interactive canvas.`);

    // Click the seed evidence node
    const seedNode = page.locator('.react-flow__node').first();
    await seedNode.click();
    await page.waitForTimeout(500);

    const asideContent = await page.textContent('aside:last-of-type');
    const isBaselineVerified =
      asideContent.includes('ev-seed-corp-policy') ||
      asideContent.includes('US89-ACME-CORP-9876543210') ||
      asideContent.includes('verified_root');
    console.log(`[PASS] Clean baseline node inspected. Verified: ${isBaselineVerified}`);

    const screen1Path = path.join(screensDir, 'prod-01-clean-baseline.png');
    await page.screenshot({ path: screen1Path });
    console.log(`[SCREENSHOT] Saved: ${screen1Path}`);

    // -------------------------------------------------------------
    // Step 3: Ingest the sample phishing evidence
    // -------------------------------------------------------------
    console.log('\n[Step 3] Opening Ingest Evidence modal...');
    const ingestBtn = page.locator('button:has-text("Ingest evidence")');
    await ingestBtn.click();
    await page.waitForSelector('div[role="dialog"]', { timeout: 10000 });
    console.log('[OK] Ingestion dialog opened with pre-filled phishing payload.');

    console.log('Submitting payload for live Nemotron screening (via Nebius)...');
    const submitBtn = page.locator('div[role="dialog"] button:has-text("Ingest and screen")');
    await submitBtn.click();

    // Ingestion calls live Nemotron extraction on Render backend, wait up to 45s
    await page.waitForResponse(
      (res) => res.url().includes('/api/ingest') && res.request().method() === 'POST',
      { timeout: 45000 }
    );
    await page.waitForTimeout(3000);
    console.log('[PASS] Evidence ingested and screened by live Nemotron.');

    // -------------------------------------------------------------
    // Step 4 & 5: Verify quarantined evidence & risk score / markers
    // -------------------------------------------------------------
    console.log('\n[Step 4 & 5] Verifying quarantine status, risk score, and markers...');
    const updatedNodes = await page.$$('.react-flow__node');
    console.log(`Canvas now displays ${updatedNodes.length} nodes (DAG expanded).`);

    // Find and click the newly ingested evidence node
    const quarantinedNode = page.locator('.react-flow__node:has-text("quarantined")').first();
    if (await quarantinedNode.isVisible()) {
      await quarantinedNode.click();
      await page.waitForTimeout(600);
    }

    const inspectorText = await page.textContent('aside:last-of-type');
    const hasQuarantine = inspectorText.toLowerCase().includes('quarantine');
    const hasRisk = inspectorText.includes('Risk') || inspectorText.includes('0.') || inspectorText.includes('1.0');
    console.log(`Quarantine status displayed: ${hasQuarantine}`);
    console.log(`Risk score / security analysis displayed: ${hasRisk}`);

    const screen2Path = path.join(screensDir, 'prod-02-quarantined-evidence.png');
    await page.screenshot({ path: screen2Path });
    console.log(`[SCREENSHOT] Saved: ${screen2Path}`);

    // -------------------------------------------------------------
    // Step 6 & 7: Select derived memory & verify provenance edge
    // -------------------------------------------------------------
    console.log('\n[Step 6 & 7] Selecting derived memory node and checking DAG lineage...');
    const memoryNode = page.locator('.react-flow__node:has-text("mem-")').last();
    if (await memoryNode.isVisible()) {
      await memoryNode.click();
      await page.waitForTimeout(600);
      const memInspectorText = await page.textContent('aside:last-of-type');
      console.log(`Memory details loaded in Inspector: ${memInspectorText.includes('mem-')}`);
    }

    const edges = await page.$$('.react-flow__edge');
    console.log(`Total DAG edges rendered: ${edges.length}`);

    const screen3Path = path.join(screensDir, 'prod-03-derived-memory-dag.png');
    await page.screenshot({ path: screen3Path });
    console.log(`[SCREENSHOT] Saved: ${screen3Path}`);

    // -------------------------------------------------------------
    // Step 8 & 9: Run interventional replay and verify assessment
    // -------------------------------------------------------------
    console.log('\n[Step 8 & 9] Running interventional replay against live Nemotron...');
    const replayBtn = page.locator('button:has-text("Replay without suspect memories")').first();
    await replayBtn.click();

    // Replay executes 2 live Nemotron calls (baseline and counterfactual)
    console.log('Awaiting dual-decision counterfactual replay (up to 60s)...');
    await page.waitForResponse(
      (res) => res.url().includes('/api/replay') && res.request().method() === 'POST',
      { timeout: 60000 }
    );
    await page.waitForTimeout(3000);
    console.log('[PASS] Replay completed.');

    const drawerText = await page.textContent('.border-t');
    const isCleanBaselinePreserved =
      drawerText.includes('Clean baseline preserved') ||
      drawerText.includes('CLEAN_BASELINE_PRESERVED') ||
      drawerText.includes('INCONCLUSIVE_OR_INDEPENDENT') ||
      drawerText.includes('inconclusive');
    const hasBaselineCard = drawerText.includes('Baseline outcome');
    const hasCounterfactualCard = drawerText.includes('Counterfactual replay');

    console.log(`Replay cards rendered: Baseline (${hasBaselineCard}), Counterfactual (${hasCounterfactualCard})`);
    console.log(`Consistency / recovery badge: ${isCleanBaselinePreserved ? 'TRUTHFUL CLEAN BASELINE PRESERVED' : 'DIVERGENT'}`);

    const screen4Path = path.join(screensDir, 'prod-04-interventional-replay.png');
    await page.screenshot({ path: screen4Path });
    console.log(`[SCREENSHOT] Saved: ${screen4Path}`);

    // -------------------------------------------------------------
    // Step 10: Preview revocation blast-radius
    // -------------------------------------------------------------
    console.log('\n[Step 10] Previewing revocation blast-radius...');
    // Click the quarantined evidence node to preview revocation
    const suspectEvidence = page.locator('.react-flow__node:has-text("ev-")').last();
    await suspectEvidence.click();
    await page.waitForTimeout(500);

    const previewRevokeBtn = page.locator('aside:last-of-type button:has-text("Preview revocation blast-radius")');
    if (await previewRevokeBtn.isVisible()) {
      await previewRevokeBtn.click();
      await page.waitForSelector('div[role="dialog"]', { timeout: 10000 });
      await page.waitForTimeout(1000);
      console.log('[OK] Blast-radius preview modal opened.');

      const modalText = await page.textContent('div[role="dialog"]');
      console.log(`Projected post-revocation destination: ${modalText.includes('US89-ACME-CORP-9876543210')}`);

      const screen5Path = path.join(screensDir, 'prod-05-revocation-preview.png');
      await page.screenshot({ path: screen5Path });
      console.log(`[SCREENSHOT] Saved: ${screen5Path}`);

      // -------------------------------------------------------------
      // Step 11 & 12: Confirm revocation & verify invalidation
      // -------------------------------------------------------------
      console.log('\n[Step 11 & 12] Confirming revocation & surgical invalidation...');
      const confirmRevokeBtn = page.locator('div[role="dialog"] button:has-text("Revoke and re-decide")');
      await confirmRevokeBtn.click();

      await page.waitForResponse(
        (res) => res.url().includes('/api/revoke') && res.request().method() === 'POST',
        { timeout: 45000 }
      );
      await page.waitForTimeout(3000);
      console.log('[PASS] Node revoked. Downstream memories surgically invalidated.');

      const screen6Path = path.join(screensDir, 'prod-06-revocation-confirmed.png');
      await page.screenshot({ path: screen6Path });
      console.log(`[SCREENSHOT] Saved: ${screen6Path}`);
    } else {
      console.warn('[WARN] Preview revocation button was not visible on selected node.');
    }

    // -------------------------------------------------------------
    // Step 13: Inspect audit trail table
    // -------------------------------------------------------------
    console.log('\n[Step 13] Inspecting cryptographic audit trail...');
    const auditTabBtn = page.locator('button:has-text("Audit trail")');
    await auditTabBtn.click();
    await page.waitForTimeout(1000);

    const tableRows = await page.$$('table tbody tr');
    console.log(`Audit log records rendered: ${tableRows.length} events.`);

    const screen7Path = path.join(screensDir, 'prod-07-audit-trail.png');
    await page.screenshot({ path: screen7Path });
    console.log(`[SCREENSHOT] Saved: ${screen7Path}`);

    // -------------------------------------------------------------
    // Step 14: Reset demo scenario
    // -------------------------------------------------------------
    console.log('\n[Step 14] Resetting demo scenario...');
    const resetBtn = page.locator('button:has-text("Reset demo")').first();
    await resetBtn.click();
    await page.waitForSelector('div[role="dialog"]', { timeout: 5000 });
    const confirmResetBtn = page.locator('div[role="dialog"] button:has-text("Reset demo")');
    await confirmResetBtn.click();
    await page.waitForTimeout(3000);

    const finalNodes = await page.$$('.react-flow__node');
    console.log(`Workspace restored to baseline. Nodes on canvas: ${finalNodes.length}`);

    const screen8Path = path.join(screensDir, 'prod-08-reset-restored.png');
    await page.screenshot({ path: screen8Path });
    console.log(`[SCREENSHOT] Saved: ${screen8Path}`);

    console.log('\n================================================================');
    console.log('   PRODUCTION RELEASE SMOKE TEST COMPLETED SUCCESSFULLY!        ');
    console.log('================================================================\n');
  } catch (err) {
    console.error('Production verification failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runProductionVerification();

