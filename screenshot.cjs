const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const BASE = 'https://localhost:5173';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    ignoreHTTPSErrors: true,
  });

  // 1. Home page — today (empty state, shows entry form + yesterday recap)
  const homePage = await context.newPage();
  await homePage.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await homePage.waitForTimeout(2000);
  await homePage.screenshot({ path: path.join(SCREENSHOT_DIR, '01-home.png'), fullPage: true });
  console.log('✓ 01-home.png');
  await homePage.close();

  // 2. Discussion — entry detail page for 5/26, "对话" tab
  const discPage = await context.newPage();
  await discPage.goto(`${BASE}/entry/2026-05-26`, { waitUntil: 'networkidle' });
  await discPage.waitForTimeout(2000);
  const discussTab = discPage.locator('button:has-text("对话")');
  if (await discussTab.count() > 0) {
    await discussTab.first().click();
    await discPage.waitForTimeout(1000);
    await discPage.screenshot({ path: path.join(SCREENSHOT_DIR, '02-discussion.png'), fullPage: true });
    console.log('✓ 02-discussion.png');
  } else {
    console.log('✗ discussion tab not found');
  }
  await discPage.close();

  // 3. History page
  const historyPage = await context.newPage();
  await historyPage.goto(`${BASE}/history`, { waitUntil: 'networkidle' });
  await historyPage.waitForTimeout(1500);
  await historyPage.screenshot({ path: path.join(SCREENSHOT_DIR, '03-history.png'), fullPage: true });
  console.log('✓ 03-history.png');
  await historyPage.close();

  // 4. Entry detail page (5/26) — notes + summary
  const detailPage = await context.newPage();
  await detailPage.goto(`${BASE}/entry/2026-05-26`, { waitUntil: 'networkidle' });
  await detailPage.waitForTimeout(1500);
  await detailPage.screenshot({ path: path.join(SCREENSHOT_DIR, '04-entry-detail.png'), fullPage: true });
  console.log('✓ 04-entry-detail.png');
  await detailPage.close();

  // 5. Export path dialog
  const histPage = await context.newPage();
  await histPage.goto(`${BASE}/history`, { waitUntil: 'networkidle' });
  await histPage.waitForTimeout(1500);

  const selectBtn = histPage.locator('button:has-text("选择导出")');
  if (await selectBtn.count() > 0) {
    await selectBtn.first().click();
    await histPage.waitForTimeout(500);

    const firstEntry = histPage.locator('button:has-text("条笔记")').first();
    if (await firstEntry.count() > 0) {
      await firstEntry.click();
      await histPage.waitForTimeout(300);
    }

    const exportBtn = histPage.locator('button:has-text("导出到 Obsidian")');
    if (await exportBtn.count() > 0) {
      await exportBtn.first().click();
      await histPage.waitForTimeout(500);
      await histPage.screenshot({ path: path.join(SCREENSHOT_DIR, '05-export-dialog.png') });
      console.log('✓ 05-export-dialog.png');
    } else {
      console.log('✗ export button not found');
    }
  } else {
    console.log('✗ select export button not found');
  }
  await histPage.close();

  await browser.close();
  console.log('\nDone!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
