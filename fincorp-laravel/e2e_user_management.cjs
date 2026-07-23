const { chromium } = require('playwright');
const fs = require('fs');

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

    console.log('Navigating to /user-approvals...');
    await page.goto('http://127.0.0.1:8000/user-approvals', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Screenshot Tab "Menunggu Persetujuan"
    console.log('Taking screenshot of initial pending tab...');
    await page.screenshot({ path: 'user_management_pending.png' });
    
    // Klik Setujui "Test Pending Approve"
    console.log('Clicking Setujui for Test Pending Approve...');
    const approveBtn = page.locator('tr:has-text("Test Pending Approve") >> button:has-text("Setujui")');
    if (await approveBtn.count() > 0) {
      await approveBtn.click();
      await page.waitForTimeout(2000); // wait for success banner
      console.log('Taking screenshot after Approve...');
      await page.screenshot({ path: 'user_management_after_approve.png' });
      console.log('✅ PASS: Approve action');
    } else {
      console.log('❌ FAIL: Test Pending Approve not found');
    }

    // Klik Tolak "Test Pending Reject"
    console.log('Clicking Tolak for Test Pending Reject...');
    const rejectBtn = page.locator('tr:has-text("Test Pending Reject") >> button:has-text("Tolak")');
    if (await rejectBtn.count() > 0) {
      page.once('dialog', dialog => dialog.accept());
      await rejectBtn.click();
      await page.waitForTimeout(2000); // wait for success banner / empty state
      console.log('Taking screenshot after Reject (should show empty state)...');
      await page.screenshot({ path: 'user_management_after_reject.png' });
      console.log('✅ PASS: Reject action');
    } else {
      console.log('❌ FAIL: Test Pending Reject not found');
    }

    // Switch ke Tab "User Aktif"
    console.log('Switching to Active Tab...');
    await page.click('button:has-text("User Aktif")');
    await page.waitForTimeout(2000);
    console.log('Taking screenshot of Active Users tab...');
    await page.screenshot({ path: 'user_management_active.png' });
    
    // Test Nonaktifkan salah satu user (misalnya "Test Pending Approve" yang tadi sudah disetujui dan masuk aktif)
    console.log('Clicking Nonaktifkan for Test Pending Approve...');
    const deactivateBtn = page.locator('tr:has-text("Test Pending Approve") >> button:has-text("Nonaktifkan")');
    if (await deactivateBtn.count() > 0) {
      page.once('dialog', dialog => dialog.accept());
      await deactivateBtn.click();
      await page.waitForTimeout(2000);
      console.log('Taking screenshot after Deactivate...');
      await page.screenshot({ path: 'user_management_after_deactivate.png' });
      console.log('✅ PASS: Deactivate action');
    } else {
      console.log('❌ FAIL: Deactivate button not found for Test Pending Approve');
    }

  } catch (err) {
    console.error('Error during E2E Test:', err);
  } finally {
    await browser.close();
  }
})();
