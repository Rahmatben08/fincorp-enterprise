const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('response', async response => {
    if (response.url().includes('/transactions') && response.request().method() === 'POST') {
      const status = response.status();
      const body = await response.text();
      console.log(`[NETWORK] POST /transactions - ${status}`);
      console.log(`[NETWORK] Body: ${body}`);
    }
  });

  try {
    await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('theme_mode', 'light');
      localStorage.setItem('theme', 'light');
    });
    await page.reload({ waitUntil: 'networkidle' });

    await page.click('a[href="/login/manajemen"]');
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'admin.keuangan@exprogio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('text=Dashboard Keuangan', { timeout: 15000 });
    
    await page.goto('http://127.0.0.1:8000/transactions', { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Jurnal Kas Finansial', { timeout: 15000 });
    
    const uniqueDescription = `E2E Test Transaction ${Date.now()}`;
    await page.fill('input[type="number"]', '12500000');
    await page.fill('textarea', uniqueDescription);
    await page.selectOption('select', { label: 'Pendapatan (+)' });
    
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
