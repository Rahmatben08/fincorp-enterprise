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
    console.log('Navigating to Employee (Staf) login page...');
    await page.goto('http://127.0.0.1:8000/login/staf', { waitUntil: 'networkidle' });
    
    console.log('Logging in as Employee...');
    await page.fill('input[type="email"]', 'budi.santoso@exprogio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // It should navigate to /dashboard and show the Dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    console.log('Taking screenshot of Employee Dashboard...');
    await page.waitForTimeout(2000); // Wait for data to load and chart animations if any
    await page.screenshot({ path: 'employee_redesign.png', fullPage: true });
    
    console.log('Opening Reimbursement modal...');
    await page.click('button:has-text("Ajukan Reimbursement Baru")');
    await page.waitForSelector('form >> text=Nominal (Rp)');
    await page.waitForTimeout(500); // Wait for modal animation
    await page.screenshot({ path: 'employee_rmb_modal.png', fullPage: false });
    
    console.log('E2E Test completed successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
    await page.screenshot({ path: 'error_employee.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
