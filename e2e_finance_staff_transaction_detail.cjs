const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    colorScheme: 'light'
  });
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  
  try {
    console.log('Navigating to Finance Staff login page...');
    await page.goto('http://127.0.0.1:8000/login/staf', { waitUntil: 'networkidle' });
    
    console.log('Logging in as Finance Staff...');
    await page.fill('input[type="email"]', 'finance.staff@exprogio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://127.0.0.1:8000/dashboard', { timeout: 10000 });
    console.log('Logged in successfully!');

    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Click "Detail" on the first row (Pembelian Server Internal or similar)
    console.log('Clicking Detail on a transaction...');
    const detailBtn = await page.$('button:has-text("Detail")');
    if (detailBtn) {
        await detailBtn.click();
        await page.waitForTimeout(1000); // wait for modal animation
        console.log('Taking screenshot of Transaction Detail Modal...');
        await page.screenshot({ path: 'finance_staff_transaction_detail_modal.png' });
    } else {
        console.log('No Detail button found!');
    }

    console.log('✅ PASS - Transaction detail modal rendered');

  } catch (error) {
    console.error('E2E TEST FAILED:', error);
  } finally {
    await browser.close();
  }
})();
