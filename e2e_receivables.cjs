const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    colorScheme: 'light',
    acceptDownloads: true
  });
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  
  try {
    console.log('Navigating to Admin Keuangan login page...');
    await page.goto('http://127.0.0.1:8000/login/manajemen', { waitUntil: 'networkidle' });
    
    console.log('Logging in as Admin Keuangan...');
    await page.fill('input[type="email"]', 'admin.keuangan@exprogio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    console.log('Navigating to /receivables...');
    await page.goto('http://127.0.0.1:8000/receivables', { waitUntil: 'networkidle' });
    
    // Wait for the skeleton loader to disappear
    await page.waitForSelector('text=Aging Schedule & Piutang', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(1500); // Give data time to render
    
    console.log('Taking screenshot of Manajemen Piutang...');
    await page.screenshot({ path: 'receivables_redesign.png', fullPage: true });

    console.log('Testing PDF Generation...');
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Cetak Daftar Piutang")');
    const download = await downloadPromise;
    const path = await download.path();
    const stats = fs.statSync(path);
    console.log(`Download successful!`);
    console.log(`Filename: ${download.suggestedFilename()}`);
    console.log(`Size: ${stats.size} bytes`);
    
    console.log('Testing Lihat Detail...');
    // Find the first "Lihat Detail" button and click it
    await page.click('button:has-text("Lihat Detail")');
    await page.waitForSelector('text=Detail Invoice Piutang', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(1000);
    console.log('Taking screenshot of Modal Lihat Detail...');
    await page.screenshot({ path: 'receivables_modal.png', fullPage: true });

    // Check if Tandai Lunas exists
    const markPaidExists = await page.locator('button:has-text("Tandai Lunas")').count();
    if (markPaidExists > 0) {
        console.log('Clicking Tandai Lunas...');
        
        // Setup dialog handler for window.alert
        page.once('dialog', async dialog => {
            console.log(`Dialog message: ${dialog.message()}`);
            await dialog.accept();
        });

        await page.click('button:has-text("Tandai Lunas")');
        
        // Wait for the modal to close or the page to update
        await page.waitForTimeout(2000);
        console.log('Taking screenshot after Tandai Lunas...');
        await page.screenshot({ path: 'receivables_after_paid.png', fullPage: true });
    } else {
        console.log('Invoice already paid or button not found. Closing modal.');
        await page.click('button:has-text("Tutup")');
    }
    
  } catch (error) {
    console.error('An error occurred:', error);
    await page.screenshot({ path: 'error_receivables.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
