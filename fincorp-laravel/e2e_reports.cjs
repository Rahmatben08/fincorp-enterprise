const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    colorScheme: 'light',
  });
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  
  try {
    console.log('Navigating to Admin Keuangan login page...');
    await page.goto('http://127.0.0.1:8000/login/manajemen', { waitUntil: 'networkidle' });
    
    console.log('Logging in as Admin Keuangan...');
    await page.fill('input[type="email"]', 'admin.keuangan@exprogio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    console.log('Navigating to /reports...');
    await page.goto('http://127.0.0.1:8000/reports', { waitUntil: 'networkidle' });
    
    // Wait for the skeleton loader to disappear
    await page.waitForSelector('text=Tindak Lanjut & Pelaporan', { state: 'visible', timeout: 10000 });
    
    console.log('Taking screenshot of Laporan Keuangan...');
    await page.waitForTimeout(1500); // Give chart/cards time to render
    await page.screenshot({ path: 'reports_redesign.png', fullPage: true });
    
    console.log('Clicking "Cetak Dokumen"...');
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Cetak Dokumen")');
    const download = await downloadPromise;
    
    const path = await download.path();
    const stats = fs.statSync(path);
    console.log(`Download successful!`);
    console.log(`Filename: ${download.suggestedFilename()}`);
    console.log(`Size: ${stats.size} bytes`);
    
  } catch (error) {
    console.error('An error occurred:', error);
    await page.screenshot({ path: 'error_reports.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
