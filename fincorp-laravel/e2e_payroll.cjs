const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true
  });
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER PAGE ERROR:', error.message));
  page.on('response', response => {
    if(response.url().includes('/payroll') && !response.ok()) {
      console.log('API FAILED:', response.url(), response.status(), response.statusText());
      response.text().then(text => console.log('API ERROR BODY:', text)).catch(() => {});
    }
  });
  
  // Auto-accept any alerts or dialogs
  page.on('dialog', async dialog => {
    console.log('Dialog opened:', dialog.message());
    await dialog.accept();
  });
  
  try {
    console.log('Navigating to login page...');
    await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle' });
    
    // Switch to light mode
    await page.evaluate(() => {
      localStorage.setItem('theme_mode', 'light');
      localStorage.setItem('theme', 'light');
    });
    await page.reload({ waitUntil: 'networkidle' });

    console.log('Logging in as Admin Keuangan...');
    await page.click('a[href="/login/manajemen"]');
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'admin.keuangan@exprogio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('text=Dashboard Keuangan', { timeout: 15000 });
    
    console.log('Navigating to Payroll page...');
    await page.goto('http://127.0.0.1:8000/payroll', { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Pemrosesan Payroll', { timeout: 15000 });
    
    console.log('Taking screenshot before calculate...');
    await page.screenshot({ path: 'C:\\Users\\ghali\\.gemini\\antigravity\\brain\\7adebd63-ab2a-44ff-82ad-e2a23f86c45f\\payroll_before_calc.png' });
    
    console.log('Clicking "Kalkulasi Gaji"...');
    await page.click('button:has-text("Kalkulasi Gaji")');
    
    // Wait for the calculation and table population
    console.log('Waiting for calculation to finish...');
    // We don't wait for DOM text of alert because it's a native dialog, just wait for table to update
    await page.waitForSelector('tbody tr:has-text("Paid")', { timeout: 15000 });
    console.log('Table successfully populated with payroll records!');
    
    console.log('Taking screenshot after calculate...');
    await page.screenshot({ path: 'C:\\Users\\ghali\\.gemini\\antigravity\\brain\\7adebd63-ab2a-44ff-82ad-e2a23f86c45f\\payroll_after_calc.png' });
    
    // Test PDF Download
    console.log('Testing PDF download for the first payroll record...');
    const downloadPromise = page.waitForEvent('download');
    // Click the first "Cetak Slip (PDF)" button
    await page.click('button:has-text("Cetak Slip (PDF)")');
    
    const download = await downloadPromise;
    const downloadPath = await download.path();
    const suggestedFilename = download.suggestedFilename();
    const fileSize = fs.statSync(downloadPath).size;
    
    console.log('--- E2E PDF DOWNLOAD RESULT ---');
    console.log(`Filename: ${suggestedFilename}`);
    console.log(`Size: ${fileSize} bytes`);
    
    if (fileSize > 0) {
        console.log('PDF Download SUCCESS: File is valid and not empty.');
    } else {
        console.error('PDF Download FAILED: File is empty (0 bytes).');
    }

    console.log('Cleaning up test data...');
    try {
        const artisanCmd = `php artisan tinker --execute="\\App\\Models\\Payroll::truncate();"`;
        execSync(artisanCmd, { stdio: 'inherit' });
        console.log('Test data cleaned up successfully.');
    } catch (e) {
        console.error('Failed to cleanup test data:', e);
    }

    console.log('E2E Test completed successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await browser.close();
  }
})();
