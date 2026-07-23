const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  
  page.on('response', response => {
    if (response.url().includes('/transactions')) {
      console.log(`[NETWORK] ${response.request().method()} ${response.url()} - ${response.status()}`);
    }
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
    
    console.log('Navigating to Transactions page...');
    await page.goto('http://127.0.0.1:8000/transactions', { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Jurnal Kas Finansial', { timeout: 15000 });
    
    console.log('Filling Catat Transaksi form...');
    const uniqueDescription = `E2E Test Transaction ${Date.now()}`;
    await page.fill('input[type="number"]', '12500000');
    await page.fill('textarea', uniqueDescription);
    await page.selectOption('select', { label: 'Pendapatan (+)' });
    
    console.log('Submitting new transaction...');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    // Let's check how many items are rendered in the table body
    const rowCount = await page.$$eval('tbody tr', rows => rows.length);
    console.log(`[DEBUG] Row count in table after submit: ${rowCount}`);
    
    const textFoundInDom = await page.$$eval('*', (elements, desc) => {
        return elements.filter(el => el.textContent === desc).map(el => el.tagName);
    }, uniqueDescription);
    console.log(`[DEBUG] Elements with exact description text: ${textFoundInDom.join(', ')}`);

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await browser.close();
  }
})();
