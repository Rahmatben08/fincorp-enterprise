const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  
  try {
    await page.goto('http://127.0.0.1:8000/login/manajemen', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'superadmin@exprogio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://127.0.0.1:8000/dashboard', { timeout: 10000 });
    await page.waitForTimeout(3000); // give time for charts to render
    
    await page.screenshot({ path: 'superadmin_redesign.png' });
    console.log('Screenshot saved to superadmin_redesign.png');
    
  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    await browser.close();
  }
})();
