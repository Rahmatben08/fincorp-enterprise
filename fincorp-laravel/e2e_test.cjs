const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  
  try {
    console.log('Navigating to landing page...');
    await page.goto('http://127.0.0.1:8000/', { waitUntil: 'networkidle' });
    
    console.log('Clicking Manajemen login gateway...');
    await page.click('a[href="/login/manajemen"]');
    
    console.log('Logging in as Admin Keuangan...');
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', 'admin.keuangan@exprogio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    console.log('Waiting for dashboard to load...');
    await page.waitForSelector('text=Dashboard Keuangan', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    console.log('Toggling Light Mode...');
    try {
      const lightModeButton = await page.$('text="Light Mode"');
      if (lightModeButton) {
        await lightModeButton.click();
        await page.waitForTimeout(1000); // Wait for transition
        console.log('Light Mode activated.');
      }
    } catch (e) {
      console.log('Error toggling Light Mode:', e);
    }
    
    // Take 'Before' screenshot
    await page.screenshot({ path: 'C:\\Users\\ghali\\.gemini\\antigravity\\brain\\7adebd63-ab2a-44ff-82ad-e2a23f86c45f\\dashboard_e2e_before.png' });
    console.log('Saved before screenshot.');

    // Click "Setuju" on the first pending transaction
    console.log('Clicking "Setuju" on Tugas Verifikasi...');
    const setujuButton = await page.$('button:has-text("Setuju")');
    if (setujuButton) {
      await setujuButton.click();
      console.log('Clicked Setuju. Waiting for API to finish...');
      await page.waitForTimeout(3000); // Wait for API and UI refresh
    } else {
      console.log('Could not find Setuju button. Maybe no pending transactions?');
    }
    
    // Take 'After' screenshot
    await page.screenshot({ path: 'C:\\Users\\ghali\\.gemini\\antigravity\\brain\\7adebd63-ab2a-44ff-82ad-e2a23f86c45f\\dashboard_e2e_after.png' });
    console.log('Saved after screenshot.');
    
    console.log('Done.');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await browser.close();
  }
})();
