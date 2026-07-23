const { chromium } = require('playwright');

(async () => {
  console.log('Starting Playwright Forensic Test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  
  // 1. Tangkap console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('CONSOLE ERROR:', msg.text());
    }
  });

  // 2. Tangkap uncaught exceptions
  page.on('pageerror', error => {
    console.error('PAGE ERROR (uncaught exception):', error.message);
    console.error('STACK TRACE:\n', error.stack);
  });

  try {
    console.log('Navigating to login page...');
    await page.goto('http://127.0.0.1:8000/login/manajemen', { waitUntil: 'networkidle' });
    
    console.log('Logging in as Superadmin...');
    await page.fill('input[type="email"]', 'superadmin@exprogio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    console.log('Waiting for /dashboard...');
    await page.waitForURL('http://127.0.0.1:8000/dashboard', { timeout: 10000 });
    console.log('Successfully navigated to /dashboard.');
    
    console.log('Waiting 3 seconds to ensure render attempts complete...');
    await page.waitForTimeout(3000);
    
    console.log('Check if page is blank...');
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Body Text Length:', bodyText.length);
    if (bodyText.length < 500) {
      console.log('WARNING: Body text is suspiciously short.');
    }
    
    await page.screenshot({ path: 'forensic_debug.png', fullPage: true });
    console.log('Screenshot saved to forensic_debug.png');

  } catch (err) {
    console.error('TEST SCRIPT CRASHED:', err.message);
  } finally {
    await browser.close();
    console.log('Forensic Test Complete.');
  }
})();
