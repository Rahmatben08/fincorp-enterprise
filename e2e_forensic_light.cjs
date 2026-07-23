const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  // FORCE LIGHT MODE
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, colorScheme: 'light' });
  const page = await context.newPage();
  
  let logs = [];
  
  page.on('console', msg => {
    logs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    logs.push(`[PAGE ERROR] ${error.message}\n${error.stack}`);
  });

  try {
    // Inject light mode into localStorage BEFORE loading
    await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('theme_mode', 'light');
    });

    await page.goto('http://127.0.0.1:8000/login/manajemen', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'superadmin@exprogio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://127.0.0.1:8000/dashboard', { timeout: 10000 });
    await page.waitForTimeout(3000);
    
    const mainHtml = await page.evaluate(() => {
      const main = document.querySelector('main');
      return main ? main.innerHTML : 'NO MAIN TAG FOUND';
    });
    
    fs.writeFileSync('forensic_main_html_light.txt', mainHtml);
    fs.writeFileSync('forensic_logs_light.txt', logs.join('\n'));
    await page.screenshot({ path: 'forensic_light.png' });
    
    console.log('Forensic light data saved. Main HTML length:', mainHtml.length);
  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    await browser.close();
  }
})();
