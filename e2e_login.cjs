const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  
  try {
    console.log('Navigating to landing page...');
    await page.goto('http://127.0.0.1:8000/', { waitUntil: 'networkidle' });
    
    // Evaluate if theme is dark, switch to light for screenshot
    await page.evaluate(() => {
      localStorage.setItem('theme_mode', 'light');
      localStorage.setItem('theme', 'light');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const html = await page.content();
    fs.writeFileSync('C:\\Users\\ghali\\.gemini\\antigravity\\brain\\7adebd63-ab2a-44ff-82ad-e2a23f86c45f\\login_gateway_dom.html', html);

    console.log('Taking screenshot of redesigned Login Gateway...');
    await page.screenshot({ path: 'C:\\Users\\ghali\\.gemini\\antigravity\\brain\\7adebd63-ab2a-44ff-82ad-e2a23f86c45f\\login_gateway_new.png' });
    
    console.log('Clicking Manajemen login gateway...');
    // Try to find the link containing "Manajemen" text
    const manajemenLink = await page.$('text=Manajemen');
    if (manajemenLink) {
        await manajemenLink.click();
    } else {
        console.log("Could not find text Manajemen! Clicking fallback a tag...");
        await page.click('a[href="/login/manajemen"]');
    }
    
    console.log('Waiting for login form to load...');
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    
    console.log('Taking screenshot of redesigned Login Form...');
    await page.screenshot({ path: 'C:\\Users\\ghali\\.gemini\\antigravity\\brain\\7adebd63-ab2a-44ff-82ad-e2a23f86c45f\\login_form_new.png' });

    console.log('Logging in as Admin Keuangan...');
    await page.fill('input[type="email"]', 'admin.keuangan@exprogio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    console.log('Waiting for dashboard to load...');
    await page.waitForSelector('text=Dashboard Keuangan', { timeout: 15000 });
    
    console.log('Taking screenshot of Dashboard after successful login...');
    await page.waitForTimeout(2000); // Allow time for charts/transitions
    await page.screenshot({ path: 'C:\\Users\\ghali\\.gemini\\antigravity\\brain\\7adebd63-ab2a-44ff-82ad-e2a23f86c45f\\login_success_dashboard.png' });
    
    console.log('Done.');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await browser.close();
  }
})();
