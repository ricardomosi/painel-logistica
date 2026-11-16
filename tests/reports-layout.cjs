const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawn } = require('node:child_process');
const http = require('node:http');

const PLAYWRIGHT_PATH = 'C:\\Users\\ricar\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright';
const { chromium } = require(PLAYWRIGHT_PATH);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PREVIEW_PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PREVIEW_PORT}/`;

function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(url, (res) => {
          res.resume();
          if (res.statusCode && res.statusCode < 500) {
            resolve();
          } else if (Date.now() - start > timeoutMs) {
            reject(new Error(`Server responded ${res.statusCode}`));
          } else {
            setTimeout(check, 300);
          }
        })
        .on('error', () => {
          if (Date.now() - start > timeoutMs) {
            reject(new Error('Timed out waiting for Vite preview server'));
          } else {
            setTimeout(check, 300);
          }
        });
    };
    check();
  });
}

async function openRelatoriosTab(page) {
  const isAlreadyDashboard = await page.locator('#dashboard-view').isVisible().catch(() => false);
  if (isAlreadyDashboard) return;

  const deskBtn = page.locator('#btn-tab-relatorio-desk');
  if (await deskBtn.isVisible().catch(() => false)) {
    await deskBtn.click();
  } else {
    const mobBtn = page.locator('#btn-tab-relatorio-mob');
    await mobBtn.waitFor({ state: 'visible', timeout: 10000 });
    await mobBtn.click();
  }
  await page.locator('#dashboard-view').waitFor({ state: 'visible', timeout: 15000 });
}

function resolveBrowserExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  return candidates.find((p) => fs.existsSync(p));
}

async function run() {
  const tmpDownloads = fs.mkdtempSync(path.join(os.tmpdir(), 'jpatricio-pw-'));
  let previewProc = null;
  let browser = null;

  try {
    console.log('1. Starting Vite preview server...');
    const viteBin = path.join(PROJECT_ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
    previewProc = spawn(process.execPath, [viteBin, 'preview', '--port', String(PREVIEW_PORT), '--host', '127.0.0.1', '--strictPort'], {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
    });

    await waitForServer(BASE_URL, 20000);
    console.log('   Vite preview server ready at', BASE_URL);

    const executablePath = resolveBrowserExecutable();
    browser = await chromium.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}),
    });
    const context = await browser.newContext({
      acceptDownloads: true,
      viewport: { width: 1280, height: 800 },
    });

    // Seed authenticated Admin session matching AuthContext localStorage schema
    await context.addInitScript(() => {
      try {
        localStorage.setItem(
          'active_logistics_user',
          JSON.stringify({
            user: {
              id: '00000000-0000-0000-0000-000000000001',
              email: 'admin@jpatricio.com.br',
            },
            profile: {
              id: '00000000-0000-0000-0000-000000000001',
              email: 'admin@jpatricio.com.br',
              nome: 'Admin E2E',
              role: 'admin',
            },
          })
        );
      } catch {
        // Ignore
      }
    });

    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore optional offline Google Maps network errors in headless test environments
        if (text.includes('maps.googleapis.com') || text.includes('ERR_NAME_NOT_RESOLVED')) return;
        consoleErrors.push(text);
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err?.message || String(err));
    });

    console.log('2. Navigating to app...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for visible desktop tab button on initial 1280x800 viewport
    try {
      await page.locator('#btn-tab-relatorio-desk').waitFor({ state: 'visible', timeout: 20000 });
    } catch (waitErr) {
      const debugSnapshot = await page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        text: (document.body?.innerText || '').slice(0, 500),
        htmlIds: Array.from(document.querySelectorAll('[id]')).slice(0, 25).map((el) => el.id),
      }));
      console.error('DEBUG SNAPSHOT ON TIMEOUT:', JSON.stringify(debugSnapshot, null, 2));
      console.error('CONSOLE ERRORS SO FAR:', consoleErrors);
      console.error('PAGE ERRORS SO FAR:', pageErrors);
      throw waitErr;
    }

    const viewports = [
      { name: 'Desktop-XL', width: 1536, height: 900 },
      { name: 'Desktop', width: 1280, height: 800 },
      { name: 'Laptop', width: 1024, height: 768 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile-L', width: 390, height: 844 },
      { name: 'Mobile-M', width: 375, height: 812 },
      { name: 'Mobile-S', width: 320, height: 720 },
    ];

    console.log('3. Checking multi-viewport responsive layout (zero horizontal overflow)...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await openRelatoriosTab(page, vp.width);
      await page.waitForTimeout(250);

      const overflowCheck = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        bodyScrollWidth: document.body.scrollWidth,
      }));

      if (overflowCheck.scrollWidth > overflowCheck.innerWidth + 1) {
        throw new Error(
          `[${vp.name} ${vp.width}px] Horizontal overflow on DashboardView: scrollWidth=${overflowCheck.scrollWidth} > innerWidth=${overflowCheck.innerWidth}`
        );
      }

      // Open full-screen modal at each viewport & verify zero horizontal overflow
      await page.locator('#btn-open-fullscreen-report').click();
      await page.locator('#fullscreen-report-modal').waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(200);

      const modalOverflow = await page.evaluate(() => {
        const modal = document.getElementById('fullscreen-report-modal');
        const offenders = [];
        if (modal) {
          const vw = window.innerWidth;
          modal.querySelectorAll('*').forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.right > vw + 1) {
              offenders.push(`${el.tagName}#${el.id || ''}.${String(el.className || '').slice(0, 50)} (right=${rect.right.toFixed(1)})`);
            }
          });
        }
        return {
          docScrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          modalScrollWidth: modal ? modal.scrollWidth : 0,
          offenders: offenders.slice(0, 6),
        };
      });

      if (modalOverflow.modalScrollWidth > modalOverflow.innerWidth + 1) {
        throw new Error(
          `[${vp.name} ${vp.width}px] Horizontal overflow inside FullScreenReportModal: modalScrollWidth=${modalOverflow.modalScrollWidth} > innerWidth=${modalOverflow.innerWidth}. Offenders: ${modalOverflow.offenders.join(' | ')}`
        );
      }

      await page.locator('#btn-close-fullscreen-report').click();
      await page.locator('#fullscreen-report-modal').waitFor({ state: 'hidden', timeout: 5000 });
      console.log(`   [PASS] ${vp.name} (${vp.width}px): Dashboard + Fullscreen Modal fit cleanly.`);
    }

    // Functional & Download E2E checks on Desktop 1280x800
    console.log('4. Verifying default Todo Historico (Mar-Nov 2026), map selection & PDF/Excel exports...');
    await page.setViewportSize({ width: 1280, height: 800 });
    await openRelatoriosTab(page, 1280);

    // Wait briefly for Supabase + legacy Sheets history to load & verify Todo Historico is default
    await page.waitForTimeout(2500);
    const presetActiveClass = await page.locator('#btn-preset-all_history').getAttribute('class');
    if (!presetActiveClass || !presetActiveClass.includes('bg-[#0081A7]')) {
      throw new Error(`Expected #btn-preset-all_history to be active by default, got class: ${presetActiveClass}`);
    }
    const dashDateStart = await page.locator('#dash-date-start').inputValue();
    const dashDateEnd = await page.locator('#dash-date-end').inputValue();
    console.log(`   Default Todo Histórico date window: ${dashDateStart} -> ${dashDateEnd}`);
    if (dashDateStart >= '2026-09-01') {
      throw new Error(`Expected historical deliveries before Sep 2026 in Todo Histórico, got start=${dashDateStart}`);
    }

    // Stress-test DeliveryHeatmap location list selection on DashboardView (must never freeze)
    const heatBtns = page.locator('#dashboard-view button:has-text("entregas")');
    const heatBtnCount = await heatBtns.count();
    if (heatBtnCount === 0) {
      throw new Error('Expected at least 1 clickable location button in DeliveryHeatmap');
    }
    const t0 = Date.now();
    for (let i = 0; i < Math.min(heatBtnCount, 3); i++) {
      await heatBtns.nth(i).click();
    }
    const elapsed = Date.now() - t0;
    console.log(`   [PASS] Clicked ${Math.min(heatBtnCount, 3)} heatmap locations smoothly in ${elapsed}ms.`);

    // Open full-screen report
    await page.locator('#btn-open-fullscreen-report').click();
    await page.locator('#fullscreen-report-modal').waitFor({ state: 'visible', timeout: 10000 });

    const startVal = await page.locator('#report-modal-date-start').inputValue();
    const endVal = await page.locator('#report-modal-date-end').inputValue();
    if (!startVal || !endVal) {
      throw new Error(`Date start/end inputs empty inside FullScreenReportModal: start=${startVal}, end=${endVal}`);
    }
    console.log(`   Period displayed cleanly: ${startVal} -> ${endVal}`);

    // Verify rendered Chart.js canvases inside modal
    const canvasInfo = await page.evaluate(() => {
      const canvases = Array.from(document.querySelectorAll('#fullscreen-report-modal canvas'));
      return {
        count: canvases.length,
        rendered: canvases.filter((c) => c.width > 0 && c.height > 0).length,
      };
    });
    if (canvasInfo.count < 5 || canvasInfo.rendered < 5) {
      throw new Error(`Expected >= 5 Chart.js canvases inside FullScreenReportModal, got count=${canvasInfo.count}, rendered=${canvasInfo.rendered}`);
    }
    console.log(`   [PASS] ${canvasInfo.rendered}/${canvasInfo.count} Chart.js canvases rendered with non-zero dimensions.`);

    // Toggle Total vs Por Mes switches inside modal
    await page.locator('[data-testid="seller-mode-total"]').click();
    await page.locator('[data-testid="seller-mode-monthly"]').click();
    await page.locator('[data-testid="vehicle-mode-total"]').click();
    await page.locator('[data-testid="material-mode-total"]').click();
    await page.locator('[data-testid="client-mode-total"]').click();
    await page.locator('[data-testid="location-mode-total"]').click();
    console.log('   [PASS] Total / Por Mês mode switches respond cleanly.');

    // Verify PDF download inside modal
    const [pdfDownload] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      page.locator('#btn-export-pdf-fullscreen').click(),
    ]);
    const pdfFilename = pdfDownload.suggestedFilename();
    const pdfPath = path.join(tmpDownloads, pdfFilename);
    await pdfDownload.saveAs(pdfPath);
    const pdfBytes = fs.readFileSync(pdfPath);
    if (!pdfFilename.endsWith('.pdf') || pdfBytes.length < 3000 || pdfBytes.subarray(0, 4).toString() !== '%PDF') {
      throw new Error(`Invalid PDF download: file=${pdfFilename}, bytes=${pdfBytes.length}`);
    }
    console.log(`   [PASS] PDF export verified: ${pdfFilename} (${pdfBytes.length} bytes).`);

    // Verify Excel download inside modal
    const [xlsxDownload] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      page.locator('#btn-export-excel-fullscreen').click(),
    ]);
    const xlsxFilename = xlsxDownload.suggestedFilename();
    const xlsxPath = path.join(tmpDownloads, xlsxFilename);
    await xlsxDownload.saveAs(xlsxPath);
    const xlsxBytes = fs.readFileSync(xlsxPath);
    if (!xlsxFilename.endsWith('.xlsx') || xlsxBytes.length < 3000 || xlsxBytes.subarray(0, 2).toString() !== 'PK') {
      throw new Error(`Invalid Excel download: file=${xlsxFilename}, bytes=${xlsxBytes.length}`);
    }
    console.log(`   [PASS] Excel export verified: ${xlsxFilename} (${xlsxBytes.length} bytes).`);

    // Close modal via Escape key
    await page.keyboard.press('Escape');
    await page.locator('#fullscreen-report-modal').waitFor({ state: 'hidden', timeout: 5000 });
    console.log('   [PASS] Escape key closes FullScreenReportModal cleanly.');

    // 5. Verify MapPickerModal open -> DMS coordinate pick -> confirm -> close -> RE-OPEN flow (must not freeze)
    console.log('5. Stress-testing MapPickerModal open/confirm/reopen stability on Entregas...');
    await page.locator('#btn-tab-entrega-desk').click();
    await page.locator('button:has-text("Nova Entrega")').first().click();
    await page.locator('h2:has-text("Nova Entrega"), h3:has-text("Nova Entrega")').first().waitFor({ state: 'visible', timeout: 8000 });

    const openMapAndTest = async (attempt) => {
      await page.locator('button:has-text("Mapa")').first().click();
      await page.locator('h3:has-text("Confirmar Local")').waitFor({ state: 'visible', timeout: 5000 });
      const searchBox = page.locator('input[placeholder*="coordenadas"]');
      await searchBox.fill("5°13'18.5\"S 37°17'40.3\"W");
      await page.locator('button:has-text("Buscar")').click();
      await page.locator('button:has-text("Confirmar Local")').click();
      await page.locator('h3:has-text("Confirmar Local")').waitFor({ state: 'hidden', timeout: 5000 });
      console.log(`   [PASS] MapPickerModal cycle #${attempt} completed with zero freeze.`);
    };

    await openMapAndTest(1);
    await openMapAndTest(2);

    // Close DeliveryModal cleanly via Escape or close button
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    if (pageErrors.length > 0) {
      throw new Error(`Page runtime errors encountered:\n${pageErrors.join('\n')}`);
    }
    if (consoleErrors.length > 0) {
      throw new Error(`Console errors encountered:\n${consoleErrors.join('\n')}`);
    }

    console.log('ALL PLAYWRIGHT E2E & RESPONSIVE LAYOUT CHECKS PASSED!');
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (previewProc) previewProc.kill();
    try {
      fs.rmSync(tmpDownloads, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

run().catch((err) => {
  console.error('PLAYWRIGHT TEST FAILED:', err);
  process.exit(1);
});
