const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    colorScheme: 'light'
  });
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  
  try {
    console.log('Navigating to Admin Keuangan login page...');
    await page.goto('http://127.0.0.1:8000/login/manajemen', { waitUntil: 'networkidle' });
    
    console.log('Logging in as Admin Keuangan...');
    await page.fill('input[type="email"]', 'admin.keuangan@exprogio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    console.log('Navigating to /taxes...');
    await page.goto('http://127.0.0.1:8000/taxes', { waitUntil: 'networkidle' });
    
    // Wait for the skeleton loader to disappear
    await page.waitForSelector('text=Kalkulator Pajak', { state: 'visible', timeout: 10000 });
    
    // Ensure the tables have data
    await page.waitForSelector('text=INV-2026-001', { state: 'visible', timeout: 10000 });
    await page.waitForSelector('text=Budi Santoso', { state: 'visible', timeout: 10000 });

    await page.waitForTimeout(1500); // Give data time to render
    
    console.log('Taking screenshot of Tax Engine...');
    await page.screenshot({ path: 'taxes_redesign.png', fullPage: true });
    
  } catch (error) {
    console.error('An error occurred:', error);
    await page.screenshot({ path: 'error_taxes.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
