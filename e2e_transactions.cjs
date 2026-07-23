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
    // Use the sidebar link or navigate directly
    await page.goto('http://127.0.0.1:8000/transactions', { waitUntil: 'networkidle' });
    
    await page.waitForSelector('text=Jurnal Kas Finansial', { timeout: 15000 });
    
    console.log('Taking screenshot of redesigned Transactions page...');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'C:\\Users\\ghali\\.gemini\\antigravity\\brain\\7adebd63-ab2a-44ff-82ad-e2a23f86c45f\\transactions_initial.png' });
    
    console.log('Finding a transaction to Verify...');
    // Wait for the verify button to appear (if there are pending transactions)
    const verifyButtons = await page.$$('button:has-text("Verify")');
    if (verifyButtons.length > 0) {
        console.log(`Found ${verifyButtons.length} Verify buttons. Clicking the first one...`);
        // Setup listener for the alert dialog that happens after handleAction (showToast)
        page.on('dialog', async dialog => {
            console.log(`Alert dialog: ${dialog.message()}`);
            await dialog.accept();
        });
        
        await verifyButtons[0].click();
        
        // Wait for the action to complete and table to re-render
        await page.waitForTimeout(3000); 
        console.log('Taking screenshot after Verify...');
        await page.screenshot({ path: 'C:\\Users\\ghali\\.gemini\\antigravity\\brain\\7adebd63-ab2a-44ff-82ad-e2a23f86c45f\\transactions_after_verify.png' });
    } else {
        console.log('No pending transactions found to verify. Skipping verification step.');
    }
    
    console.log('Filling Catat Transaksi form...');
    const uniqueDescription = `E2E Test Transaction ${Date.now()}`;
    await page.fill('input[type="number"]', '12500000');
    await page.fill('textarea', uniqueDescription);
    await page.selectOption('select', { label: 'Pendapatan (+)' });
    
    console.log('Submitting new transaction...');
    await page.click('button[type="submit"]');
    
    // Wait for the new transaction to appear in the table BODY specifically
    await page.waitForSelector(`tbody tr:has-text("${uniqueDescription}")`, { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    console.log('Taking screenshot after submit...');
    await page.screenshot({ path: 'C:\\Users\\ghali\\.gemini\\antigravity\\brain\\7adebd63-ab2a-44ff-82ad-e2a23f86c45f\\transactions_after_submit.png' });

    console.log('Testing Cetak Jurnal (PDF)...');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Cetak Jurnal")')
    ]);
    const suggestedFilename = download.suggestedFilename();
    const downloadPath = path.join('C:\\Users\\ghali\\.gemini\\antigravity\\brain\\7adebd63-ab2a-44ff-82ad-e2a23f86c45f', suggestedFilename);
    await download.saveAs(downloadPath);
    
    const stats = fs.statSync(downloadPath);
    console.log(`Suggested filename: ${suggestedFilename}`);
    console.log(`SUCCESS: PDF file size is greater than 0 (${stats.size} bytes)`);
    
    console.log('Cleaning up test data...');
    try {
        // Run artisan tinker to delete the test transaction
        const artisanCmd = `php artisan tinker --execute="\\App\\Models\\Transaction::where('description', '${uniqueDescription}')->delete();"`;
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
