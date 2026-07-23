const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, colorScheme: 'light' });
  const page = await context.newPage();
  
  try {
    console.log('Logging in as Superadmin...');
    await page.goto('http://127.0.0.1:8000/login/manajemen', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'superadmin@exprogio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://127.0.0.1:8000/dashboard');
    console.log('✅ PASS: Login Superadmin');

    await page.waitForTimeout(2000);
    
    // Screenshot Dashboard Superadmin Chart
    console.log('Taking screenshot of Dashboard Superadmin Chart...');
    await page.screenshot({ path: 'C:/Users/ghali/.gemini/antigravity/brain/7adebd63-ab2a-44ff-82ad-e2a23f86c45f/superadmin_dashboard_chart_fixed.png', fullPage: true });
    console.log('✅ PASS: Dashboard Screenshot');
    
  } catch (err) {
    console.error('Error during E2E Test:', err);
  } finally {
    await browser.close();
  }
})();
