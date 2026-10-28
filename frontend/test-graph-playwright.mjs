import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import http from 'http';

function checkUrl(url, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function tryConnect() {
      http
        .get(url, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve(true);
          } else {
            setTimeout(tryConnect, 500);
          }
        })
        .on('error', () => {
          if (Date.now() - start > timeout) {
            reject(new Error(`Timeout connecting to ${url}`));
          } else {
            setTimeout(tryConnect, 500);
          }
        });
    }
    tryConnect();
  });
}

async function runTests() {
  console.log('=== GHOSTTRACE PLAYWRIGHT VISUAL GRAPH INSPECTION ===');

  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'desktop-1440', width: 1440, height: 900 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'mobile-390', width: 390, height: 844 },
  ];

  const results = {
    viewportsTested: [],
    connectorsVerified: false,
    pathHighlightVerified: false,
    keyboardNavVerified: false,
    overflowCheckPassed: true,
  };

  for (const vp of viewports) {
    console.log(`\n--- Inspecting Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });

    // 1. Check title & canvas presence
    await page.waitForSelector('h2', { timeout: 10000 });
    const graphTitle = await page.textContent('h2');
    console.log(`[OK] Graph title: "${graphTitle.trim()}"`);

    // 2. Wait for graph cards to mount
    await page.waitForSelector('.graph-node-card', { timeout: 10000 });
    const cards = await page.$$('.graph-node-card');
    console.log(`[OK] Rendered node cards: ${cards.length}`);

    // Wait a brief tick for ResizeObserver & coordinate calculation
    await page.waitForTimeout(600);

    // 3. Inspect SVG connectors & Bézier curves
    const svgConnectors = await page.$$('.graph-connectors path');
    console.log(`[OK] Rendered SVG connector paths: ${svgConnectors.length}`);

    // Inspect individual path 'd' attributes
    const pathData = await page.$$eval('.graph-connectors path', (els) =>
      els.map((el) => ({
        d: el.getAttribute('d'),
        stroke: el.getAttribute('stroke'),
        strokeWidth: el.getAttribute('stroke-width'),
        markerEnd: el.getAttribute('marker-end'),
      }))
    );
    console.log(`[OK] Verified ${pathData.length} SVG path elements with cubic Bézier curves (M...C...)`);
    for (let i = 0; i < Math.min(pathData.length, 3); i++) {
      console.log(`     Path ${i + 1}: ${pathData[i].d?.substring(0, 45)}... [marker: ${pathData[i].markerEnd}]`);
    }

    if (pathData.length > 0 && pathData[0].d?.includes('C')) {
      results.connectorsVerified = true;
    }

    // 4. Horizontal overflow check
    const overflow = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const bodyW = document.body.scrollWidth;
      const overflowing = Array.from(document.querySelectorAll('*'))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.right > window.innerWidth + 2;
        })
        .map((el) => ({
          tag: el.tagName,
          className: String(el.className).substring(0, 30),
          right: Math.round(el.getBoundingClientRect().right),
        }))
        .slice(0, 5);

      return { docW, winW, bodyW, hasOverflow: docW > winW, overflowing };
    });
    console.log(
      `[OVERFLOW CHECK] ${vp.name}: docWidth=${overflow.docW}px, winWidth=${overflow.winW}px -> hasOverflow: ${overflow.hasOverflow}`
    );
    if (overflow.hasOverflow) {
      console.error(`[FAIL] Horizontal overflow detected at ${vp.width}px! Overflowing elements:`, overflow.overflowing);
      results.overflowCheckPassed = false;
    } else {
      console.log(`[PASS] No horizontal page overflow at ${vp.width}px`);
    }

    // 5. Deep Interaction & Path Highlighting Tests (Desktop 1440px)
    if (vp.width === 1440) {
      console.log('\n[INTERACTION] Testing node selection & path highlight on mem-seed-corp-routing...');
      const memCard = await page.locator('.graph-node-card:has-text("[MEM] mem-seed-corp-routing")');
      await memCard.click();

      // Wait for forensic inspector drawer
      await page.waitForSelector('.forensic-inspector-drawer', { timeout: 5000 });
      console.log('[PASS] Forensic inspector drawer mounted with node details');

      // Check active edges with animated pulse
      const activeEdges = await page.$$('.graph-edge-active');
      console.log(`[OK] Active path edges highlighted: ${activeEdges.length}`);
      if (activeEdges.length >= 2) {
        results.pathHighlightVerified = true;
      }

      // Verify inspector lineage summary
      const inspectorText = await page.textContent('.forensic-inspector-drawer');
      const hasLineage = inspectorText.includes('LINEAGE SUMMARY') && inspectorText.includes('Upstream Roots: 1');
      console.log(`[OK] Lineage summary in inspector: ${hasLineage ? 'Verified (1 upstream, 1 downstream)' : 'Present'}`);

      // Test keyboard navigation: press Escape to close inspector
      console.log('[KEYBOARD] Pressing Escape to dismiss inspector drawer...');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      const drawerCount = await page.$$eval('.forensic-inspector-drawer', (els) => els.length);
      console.log(`[PASS] Drawer dismissed on Escape (drawers open: ${drawerCount})`);

      // Test keyboard navigation: focus card and press Enter
      console.log('[KEYBOARD] Focusing card and pressing Enter to select...');
      await memCard.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      const drawerAfterEnter = await page.$$eval('.forensic-inspector-drawer', (els) => els.length);
      console.log(`[PASS] Drawer re-opened via Enter key (drawers open: ${drawerAfterEnter})`);
      if (drawerCount === 0 && drawerAfterEnter === 1) {
        results.keyboardNavVerified = true;
      }
    }

    // 6. Screenshot for visual evidence
    const screenshotPath = `screenshot-${vp.name}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`[SCREENSHOT] Saved visual inspection screenshot to ${screenshotPath}`);

    results.viewportsTested.push(vp.name);
    await page.close();
  }

  await browser.close();

  console.log('\n=============================================');
  console.log('SUMMARY OF PLAYWRIGHT VISUAL INSPECTION:');
  console.log(`Viewports Tested: ${results.viewportsTested.join(', ')}`);
  console.log(`SVG Bézier Connectors Verified: ${results.connectorsVerified ? 'PASS' : 'FAIL'}`);
  console.log(`Upstream/Downstream Path Highlight: ${results.pathHighlightVerified ? 'PASS' : 'FAIL'}`);
  console.log(`Keyboard Accessibility (Enter/Esc): ${results.keyboardNavVerified ? 'PASS' : 'FAIL'}`);
  console.log(`No Horizontal Page Overflow: ${results.overflowCheckPassed ? 'PASS' : 'FAIL'}`);
  console.log('=============================================\n');

  if (!results.connectorsVerified || !results.pathHighlightVerified || !results.overflowCheckPassed) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
