const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    colorScheme: 'light'
  });
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  
  try {
    console.log('Navigating to Finance Staff login page...');
    await page.goto('http://127.0.0.1:8000/login/staf', { waitUntil: 'networkidle' });
    
    console.log('Logging in as Finance Staff...');
    await page.fill('input[type="email"]', 'finance.staff@exprogio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://127.0.0.1:8000/dashboard', { timeout: 10000 });
    console.log('Logged in successfully!');

    // Wait for charts to render
    await page.waitForTimeout(3000);
    
    console.log('Taking screenshot of Dashboard with Charts...');
    await page.screenshot({ path: 'finance_staff_dashboard_with_charts.png' });

    console.log('✅ PASS - Dashboard charts rendered');

  } catch (error) {
    console.error('E2E TEST FAILED:', error);
  } finally {
    await browser.close();
  }
})();
