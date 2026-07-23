const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Logging in as Manager...');
    await page.goto('http://127.0.0.1:8000/login/manajemen', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'manager.proyek@exprogio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://127.0.0.1:8000/dashboard');
    console.log('Logged in.');
    await page.waitForTimeout(2000);

    const checkMenu = async (name) => {
        const link = await page.$(`a:has-text("${name}")`);
        if (link) {
            await link.click();
            await page.waitForTimeout(2000);
            
            // Check for error boundary or blank page
            const h1 = await page.$('h1, h2, h3');
            const h1Text = h1 ? await h1.innerText() : 'No Heading';
            const body = await page.innerText('body');
            
            let status = 'OK';
            if (body.includes('403') || body.includes('Unauthorized') || body.includes('Forbidden')) {
                status = '403 Forbidden';
            } else if (body.includes('404') || body.includes('Not Found')) {
                status = '404 Not Found';
            } else if (body.includes('Error') || body.includes('Exception')) {
                status = 'Error';
            } else if (body.trim().length === 0 || (!body.includes('Dashboard') && !body.includes(name))) {
                // Heuristic for blank or unexpected
                status = 'Possible Blank/Generic';
            }

            console.log(`Menu [${name}]: ${status} (Heading: ${h1Text.replace(/\n/g, ' ')})`);
            
            // Go back to dashboard just in case
            await page.goto('http://127.0.0.1:8000/dashboard', { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
        } else {
            console.log(`Menu [${name}]: Not Found in Sidebar`);
        }
    };

    const menus = [
        'Jurnal Transaksi',
        'Payroll Karyawan',
        'Manajemen Anggaran',
        'Laporan Keuangan',
        'Manajemen Piutang',
        'Manajemen Utang',
        'Pajak'
    ];

    for (const menu of menus) {
        await checkMenu(menu);
    }
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await browser.close();
  }
})();
