const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    colorScheme: 'light',
  });
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  
  try {
    console.log('Navigating to login page...');
    await page.goto('http://127.0.0.1:8000/login/manajemen', { waitUntil: 'networkidle' });
    
    console.log('Logging in as Superadmin...');
    await page.fill('input[placeholder="Email"]', 'superadmin@exprogio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    console.log('Navigating to Audit Trail page...');
    await page.goto('http://127.0.0.1:8000/audit-trail', { waitUntil: 'networkidle' });
    
    await page.waitForSelector('text=Audit Trail Aktivitas Sistem', { timeout: 10000 });
    
    // Wait for data to load
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    
    console.log('Taking screenshot of redesigned Audit Trail...');
    await page.screenshot({ path: 'audit_trail_redesign.png', fullPage: true });
    
    console.log('E2E Test completed successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
    await page.screenshot({ path: 'error.png', fullPage: true });
    const html = await page.content();
    require('fs').writeFileSync('dom.html', html);
  } finally {
    await browser.close();
  }
})();
