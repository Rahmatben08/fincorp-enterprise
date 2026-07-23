const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    colorScheme: 'light'
  });
  const page = await context.newPage();
  
  // Handle alerts/confirms
  page.on('dialog', async dialog => {
    console.log(`Dialog triggered: ${dialog.message()}`);
    await dialog.accept();
  });

  page.on('console', msg => {
    if (msg.type() !== 'warning') {
        console.log('BROWSER CONSOLE:', msg.type(), msg.text());
    }
  });
  
  try {
    console.log('Navigating to Manager login page...');
    await page.goto('http://127.0.0.1:8000/login/manajemen', { waitUntil: 'networkidle' });
    
    console.log('Logging in as Manager...');
    await page.fill('input[type="email"]', 'manager.proyek@exprogio.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://127.0.0.1:8000/dashboard', { timeout: 10000 });
    console.log('✅ PASS: Login Manager');

    // Wait for data to load
    await page.waitForTimeout(3000);
    
    console.log('Taking screenshot of initial dashboard state...');
    await page.screenshot({ path: 'manager_dashboard_initial.png' });
    console.log('✅ PASS: Initial Dashboard Render');

    // TEST APPROVE
    console.log('Clicking Setujui on Pembelian Server Internal (ID 14)...');
    // Assuming the table contains "Pembelian Server Internal"
    // Find the row containing "Pembelian Server Internal"
    const approveBtn = await page.$('tr:has-text("Pembelian Server Internal") >> button:has-text("Setujui")');
    if (approveBtn) {
        await approveBtn.click();
        await page.waitForTimeout(2000);
        console.log('Taking screenshot after Approve...');
        await page.screenshot({ path: 'manager_dashboard_after_approve.png' });
        console.log('✅ PASS: Test Approve');
    } else {
        console.log('❌ FAIL: Test Approve - Button not found');
    }

    // TEST REJECT
    console.log('Clicking Tolak on Test Reject Manajer...');
    const rejectBtn = await page.$('tr:has-text("Test Reject Manajer") >> button:has-text("Tolak")');
    if (rejectBtn) {
        await rejectBtn.click();
        await page.waitForTimeout(2000);
        console.log('Taking screenshot after Reject...');
        await page.screenshot({ path: 'manager_dashboard_after_reject.png' });
        console.log('✅ PASS: Test Reject');
    } else {
        console.log('❌ FAIL: Test Reject - Button not found');
    }

    // CREATE A NEW VERIFIED TX FOR MODAL TEST VIA EVAL
    // We don't have to do it via eval, we can just click "Detail" on whatever is left if any, or we skip if none.
    // The user said: "setelah approve/reject, buat 1 transaksi verified baru untuk test modal". We can't run php from inside browser test easily.
    // Wait, the user already provided the bash script for Test Reject.
    // Wait, I can just click "Detail" BEFORE rejecting it!
    // Or, wait, the user's instructions say:
    // "6. Buat transaksi verified baru untuk test Tolak: php artisan tinker..." (I did this in Step 4)
    // "8. Verifikasi modal Detail berfungsi (setelah approve/reject, buat 1 transaksi verified baru untuk test modal)"
    // I can't easily run php artisan from within this Node script using playwright unless I use child_process.
    // Let's use child_process to create a new verified transaction just for the modal test.
    
    const { execSync } = require('child_process');
    console.log('Creating a new verified transaction for Modal test...');
    execSync(`php artisan tinker --execute="App\\Models\\Transaction::create(['date' => '2026-07-23', 'description' => 'Test Detail Modal Manajer', 'type' => 'income', 'amount' => 1500000, 'status' => 'verified', 'created_by' => 4, 'verified_by' => 2, 'verified_at' => now()]);"`);
    
    // Reload to get the new data
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const detailBtn = await page.$('tr:has-text("Test Detail Modal Manajer") >> button:has-text("Detail")');
    if (detailBtn) {
        await detailBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'manager_dashboard_modal_detail.png' });
        console.log('✅ PASS: Test Modal Detail');
        
        // Close modal
        const closeBtn = await page.$('button:has-text("Tutup")');
        if (closeBtn) await closeBtn.click();
    } else {
        console.log('❌ FAIL: Test Modal Detail - Button not found');
    }

    console.log('Taking final screenshot of dashboard state...');
    await page.screenshot({ path: 'manager_dashboard_final.png' });

  } catch (error) {
    console.error('E2E TEST FAILED:', error);
  } finally {
    await browser.close();
  }
})();
