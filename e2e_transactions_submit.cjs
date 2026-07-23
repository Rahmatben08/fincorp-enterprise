const { chromium } = require('playwright');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true
  });
  const page = await context.newPage();
  
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
    
    console.log('Navigating to Transactions page...');
    await page.goto('http://127.0.0.1:8000/transactions', { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Jurnal Kas Finansial', { timeout: 15000 });
    
    console.log('--- TEST 1: First Transaction ---');
    console.log('Filling Catat Transaksi form...');
    const desc1 = `E2E Test 1 ${Date.now()}`;
    await page.fill('input[type="number"]', '1000000');
    await page.fill('textarea', desc1);
    await page.selectOption('select', { label: 'Pendapatan (+)' });
    
    console.log('Submitting first transaction...');
    // We don't await the click immediately because we want to catch the "Menyimpan..." state
    page.click('button[type="submit"]');
    
    // Wait for the button to become disabled and show "Menyimpan..."
    console.log('Waiting for "Menyimpan..." state...');
    await page.waitForSelector('button[type="submit"]:has-text("Menyimpan...")');
    console.log('Taking screenshot DURING process...');
    await page.screenshot({ path: 'C:\\Users\\ghali\\.gemini\\antigravity\\brain\\7adebd63-ab2a-44ff-82ad-e2a23f86c45f\\transactions_button_saving.png' });
    
    // Wait for the new transaction to appear in the table BODY specifically
    await page.waitForSelector(`tbody tr:has-text("${desc1}")`, { timeout: 15000 });
    
    // Wait for the button to return to normal state
    console.log('Waiting for button to return to "Simpan Transaksi"...');
    await page.waitForSelector('button[type="submit"]:not([disabled]):has-text("Simpan Transaksi")');
    console.log('Taking screenshot AFTER process...');
    await page.screenshot({ path: 'C:\\Users\\ghali\\.gemini\\antigravity\\brain\\7adebd63-ab2a-44ff-82ad-e2a23f86c45f\\transactions_button_normal.png' });

    console.log('--- TEST 2: Second Transaction without Refresh ---');
    const desc2 = `E2E Test 2 ${Date.now()}`;
    await page.fill('input[type="number"]', '2000000');
    await page.fill('textarea', desc2);
    
    console.log('Submitting second transaction...');
    await page.click('button[type="submit"]');
    
    // Wait for the second transaction to appear in the table
    await page.waitForSelector(`tbody tr:has-text("${desc2}")`, { timeout: 15000 });
    console.log('Second transaction appeared! Taking final screenshot...');
    await page.screenshot({ path: 'C:\\Users\\ghali\\.gemini\\antigravity\\brain\\7adebd63-ab2a-44ff-82ad-e2a23f86c45f\\transactions_after_second_submit.png' });

    console.log('Cleaning up test data...');
    try {
        const artisanCmd = `php artisan tinker --execute="\\App\\Models\\Transaction::where('description', 'like', 'E2E Test%')->delete();"`;
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
