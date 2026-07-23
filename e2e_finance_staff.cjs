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
    // We must use the staf portal for finance_staff
    await page.goto('http://127.0.0.1:8000/login/staf', { waitUntil: 'networkidle' });
    
    console.log('Logging in as Finance Staff...');
    await page.fill('input[type="email"]', 'finance.staff@exprogio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Wait for the skeleton loader to disappear
    await page.waitForSelector('text=Dashboard Staf Keuangan', { state: 'visible', timeout: 10000 });
    
    // Ensure data is loaded
    await page.waitForSelector('text=Total Pendapatan', { state: 'visible' });
    await page.waitForTimeout(2000); // Give charts time to render

    console.log('Taking BEFORE screenshot of Finance Staff Dashboard...');
    await page.screenshot({ path: 'finance_staff_dashboard_before.png', fullPage: true });

    // Validate draft submit button
    const submitBtn = await page.locator('button:has-text("Submit untuk Approval")').count();
    if (submitBtn > 0) {
      console.log('Draft transaction found! Testing submit...');
      await page.click('button:has-text("Submit untuk Approval")');
      await page.waitForTimeout(1500); // Wait for toast and state update
      
      console.log('Taking AFTER screenshot of Finance Staff Dashboard...');
      await page.screenshot({ path: 'finance_staff_dashboard_after.png', fullPage: true });
      console.log('✅ PASS - Submit successfully executed');
    } else {
      console.log('❌ FAIL - No draft transaction found to submit.');
    }
    
    console.log('E2E Checks completed.');
  } catch (error) {
    console.error('An error occurred:', error);
    await page.screenshot({ path: 'error_finance_staff.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
