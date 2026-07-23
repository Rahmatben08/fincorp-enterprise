const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  
  let logs = [];
  
  page.on('console', msg => {
    logs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    logs.push(`[PAGE ERROR] ${error.message}\n${error.stack}`);
  });

  try {
    await page.goto('http://127.0.0.1:8000/login/manajemen', { waitUntil: 'networkidle' });
    
    // Check if input exists
    try {
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await page.fill('input[type="email"]', 'superadmin@exprogio.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('http://127.0.0.1:8000/dashboard', { timeout: 10000 });
      await page.waitForTimeout(3000); // give time for hooks
      
      const mainHtml = await page.evaluate(() => {
        const main = document.querySelector('main');
        return main ? main.innerHTML : 'NO MAIN TAG FOUND';
      });
      console.log('Forensic data saved. Main HTML length:', mainHtml.length);
    } catch (e) {
      await page.screenshot({ path: 'forensic_error_prod.png' });
      console.error('Failed on prod page. Screenshot saved.');
      throw e;
    }
    
  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    fs.writeFileSync('forensic_logs_prod.txt', logs.join('\n'));
    await browser.close();
  }
})();
