const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
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
    
    console.log('--- TEST: One click, then click again empty ---');
    await page.fill('input[type="number"]', '1000000');
    await page.fill('textarea', `E2E Reproduce ${Date.now()}`);
    await page.selectOption('select', { label: 'Pendapatan (+)' });
    
    console.log('Clicking submit ONCE...');
    page.click('button[type="submit"]'); // Do not await immediately to check state
    
    await page.waitForTimeout(500);
    const textDuring = await page.textContent('button[type="submit"]');
    console.log(`Button text DURING submit: ${textDuring.trim()}`);
    
    await page.waitForTimeout(3000);
    const textAfter = await page.textContent('button[type="submit"]');
    console.log(`Button text AFTER submit finishes: ${textAfter.trim()}`);
    
    console.log('Clicking submit AGAIN without filling anything...');
    page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    const textAfterSecond = await page.textContent('button[type="submit"]');
    console.log(`Button text AFTER second empty submit: ${textAfterSecond.trim()}`);

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await browser.close();
  }
})();
