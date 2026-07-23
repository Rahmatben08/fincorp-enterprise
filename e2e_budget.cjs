const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, colorScheme: 'light' });
  
  const testRole = async (email, role, expectSuccess) => {
    const page = await context.newPage();
    console.log(`\nTesting role: ${role} (${email})`);
    try {
      await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle' });
      // Depending on role, might need /login/staf or /login/manajemen
      const loginUrl = (role === 'finance_staff') ? 'http://127.0.0.1:8000/login/staf' : 'http://127.0.0.1:8000/login/manajemen';
      await page.goto(loginUrl, { waitUntil: 'networkidle' });

      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
      await page.waitForURL('http://127.0.0.1:8000/dashboard');
      
      console.log(`Logged in as ${role}`);
      
      // Navigate to /budgets
      console.log(`Navigating to /budgets for ${role}...`);
      await page.goto('http://127.0.0.1:8000/budgets', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const bodyText = await page.innerText('body');
      const isDenied = bodyText.includes('403') || bodyText.includes('Akses Ditolak') || bodyText.includes('Access Denied');
      
      if (expectSuccess) {
          if (isDenied) {
              console.log(`❌ FAIL: ${role} should have access, but got 403`);
          } else {
              console.log(`✅ PASS: ${role} has access to /budgets`);
              if (role === 'manajer') {
                  console.log('Taking screenshot for manajer dashboard...');
                  await page.screenshot({ path: 'budget_dashboard_manajer.png' });
                  
                  // Verify percentage progress bar width is present
                  const isProgressBarPresent = await page.evaluate(() => {
                      const bars = document.querySelectorAll('div[style*="width"]');
                      return bars.length > 0;
                  });
                  if (isProgressBarPresent) {
                      console.log('✅ PASS: Progress bars are visible');
                  } else {
                      console.log('❌ FAIL: Progress bars missing');
                  }
              }
          }
      } else {
          if (isDenied || page.url() !== 'http://127.0.0.1:8000/budgets') {
              console.log(`✅ PASS: ${role} is correctly denied access to /budgets`);
          } else {
              console.log(`❌ FAIL: ${role} accessed /budgets but should not be allowed`);
          }
      }
    } catch (err) {
      console.error(`Error in ${role} test:`, err);
    } finally {
      await page.close();
    }
  };

  try {
    await testRole('manager.proyek@exprogio.com', 'manajer', true);
    await testRole('admin.keuangan@exprogio.com', 'admin_keuangan', true);
    await testRole('finance.staff@exprogio.com', 'finance_staff', false);
  } catch (error) {
    console.error('E2E TEST FATAL ERROR:', error);
  } finally {
    await browser.close();
  }
})();
