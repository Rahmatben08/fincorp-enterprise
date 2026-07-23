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

    // Wait for the dashboard to finish initial loading and settling
    await page.waitForTimeout(2000);

    // 1. Go to Receivables
    console.log('Navigating to /receivables...');
    await page.goto('http://127.0.0.1:8000/receivables', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Click "Lihat Detail" on the first row
    console.log('Clicking Lihat Detail on Receivables...');
    const detailBtn = await page.$('button:has-text("Lihat Detail")');
    if (detailBtn) {
        await detailBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'finance_staff_receivables_modal.png' });
        console.log('Screenshot of receivables modal taken!');
        
        // click Tutup
        const tutupBtn = await page.$('button:has-text("Tutup")');
        if (tutupBtn) await tutupBtn.click();
        await page.waitForTimeout(500);
    } else {
        console.log('No Lihat Detail button found in Receivables!');
    }

    // 2. Go to Payables
    console.log('Navigating to /payables...');
    await page.goto('http://127.0.0.1:8000/payables', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Click "Lihat Detail" on the first row
    console.log('Clicking Lihat Detail on Payables...');
    const detailBtn2 = await page.$('button:has-text("Lihat Detail")');
    if (detailBtn2) {
        await detailBtn2.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'finance_staff_payables_modal.png' });
        console.log('Screenshot of payables modal taken!');
    } else {
        console.log('No Lihat Detail button found in Payables!');
    }

    console.log('✅ PASS - Receivables and Payables accessed successfully');

  } catch (error) {
    console.error('E2E TEST FAILED:', error);
  } finally {
    await browser.close();
  }
})();
