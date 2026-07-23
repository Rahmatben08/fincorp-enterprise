const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  // FORCE LIGHT MODE
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  const page = await context.newPage();
  
  page.on('pageerror', err => {
    console.error('PAGE_ERROR_DETECTED:', err.message);
    console.error(err.stack);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`BROWSER_CONSOLE [${msg.type()}]:`, msg.text());
    }
  });

  try {
    console.log('Logging in as Superadmin...');
    await page.goto('http://127.0.0.1:8000/login/manajemen', { waitUntil: 'networkidle' });
    
    // Force local storage theme_mode to light just in case
    await page.evaluate(() => {
      localStorage.setItem('theme_mode', 'light');
    });
    
    await page.fill('input[type="email"]', 'superadmin@exprogio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://127.0.0.1:8000/dashboard');
    console.log('✅ PASS: Login Superadmin');
    
    await page.waitForTimeout(5000);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('BODY TEXT LENGTH:', bodyText.length);
    if (bodyText.length < 500) {
      console.error('ERROR: Page looks blank.');
    }
    
    await page.screenshot({ path: 'superadmin_light.png', fullPage: true });
  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    await browser.close();
  }
})();
