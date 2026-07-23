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
    console.log('Navigating to Investor login page...');
    await page.goto('http://127.0.0.1:8000/login/investor', { waitUntil: 'networkidle' });
    
    console.log('Logging in as Investor...');
    await page.fill('input[placeholder="Email"]', 'investor@fincorp.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // It should navigate to /dashboard and show the InvestorPortal
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    console.log('Taking screenshot of redesigned Investor Dashboard...');
    await page.waitForTimeout(1000); // Wait for data to load
    await page.screenshot({ path: 'investor_redesign.png', fullPage: true });
    
    console.log('E2E Test completed successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
    await page.screenshot({ path: 'error_investor.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
