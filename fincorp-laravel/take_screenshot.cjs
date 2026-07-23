const { chromium } = require('playwright');
const { spawn, exec } = require('child_process');
const fs = require('fs');

(async () => {
  console.log('Starting PHP and Vite servers...');
  const server = exec('php artisan serve');
  const vite = exec('npm run dev');
  
  // Wait for servers to be ready
  await new Promise(r => setTimeout(r, 8000));

  console.log('Launching browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  let robotoLoaded = false;
  
  page.on('response', response => {
    if (response.url().includes('fonts.googleapis.com') || response.url().includes('fonts.gstatic.com')) {
      console.log(`Font network request: ${response.url()} [${response.status()}]`);
      if (response.status() === 200) robotoLoaded = true;
    }
  });

  try {
    console.log('Navigating to landing page...');
    await page.goto('http://127.0.0.1:8000/', { timeout: 60000 });
    
    console.log('Clicking Manajemen login gateway...');
    await page.waitForSelector('a[href="/login/manajemen"]', { timeout: 15000 });
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
      } else {
        console.log('Already in Light Mode or button not found.');
      }
    } catch (e) {
      console.log('Error toggling Light Mode:', e);
    }
    
    // Check computed font-family
    const fontFamily = await page.evaluate(() => {
      const el = document.querySelector('h1');
      return window.getComputedStyle(el).fontFamily;
    });
    console.log(`Computed font-family for H1: ${fontFamily}`);

    const screenshotPath = 'C:\\Users\\ghali\\.gemini\\antigravity\\brain\\7adebd63-ab2a-44ff-82ad-e2a23f86c45f\\dashboard_real.png';
    console.log(`Taking screenshot to ${screenshotPath}`);
    
    // Wait for animations to finish before taking screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    console.log(`Screenshot saved successfully.`);
  } catch (e) {
    console.error('Error during testing:', e);
    await page.screenshot({ path: 'C:\\Users\\ghali\\.gemini\\antigravity\\brain\\7adebd63-ab2a-44ff-82ad-e2a23f86c45f\\error.png', fullPage: true });
    
    // Dump the HTML so we can see what actually rendered
    const html = await page.content();
    fs.writeFileSync('C:\\Users\\ghali\\.gemini\\antigravity\\brain\\7adebd63-ab2a-44ff-82ad-e2a23f86c45f\\dom.html', html);
    
    console.log('Saved error.png and dom.html');
  } finally {
    await browser.close();
    server.kill();
    vite.kill();
    console.log('Done.');
  }
})();
