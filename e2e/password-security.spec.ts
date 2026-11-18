// e2e/password-security.spec.ts
// Verifies re-authentication safeguards and session revocation:
// - password change requires the current password,
// - rotating the password revokes previously issued session cookies,
// - account deletion requires the account password.
import { test, expect, Page } from '@playwright/test';

test.describe.serial('E2E Password Security: re-authentication & session revocation', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  const timestamp = Date.now();
  const testUser = {
    username: `secuser_${timestamp}`,
    email: `sectest_${timestamp}@example.com`,
    password: `Original-P@ssword-${timestamp}a`,
  };
  const newPassword = `Rotated-P@ssword-${timestamp}b`;
  // Simulates a cookie stolen before the password rotation.
  let stolenSessionCookie = '';

  test('1. Register a new user account', async () => {
    await page.goto('/');

    const registerBtn = page.getByRole('button', { name: 'Register' }).first();
    await expect(registerBtn).toBeVisible();
    await registerBtn.click();

    await page.fill('#register-username', testUser.username);
    await page.fill('#register-email', testUser.email);
    await page.fill('#register-password', testUser.password);

    const [registerResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/register') && res.request().method() === 'POST'),
      page.locator('form').getByRole('button', { name: 'Register' }).click(),
    ]);

    expect(registerResponse.status()).toBe(200);
    await expect(page).toHaveURL(/\/account/);
  });

  test('2. Capture the active session cookie (simulated theft)', async () => {
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === 'session');
    expect(sessionCookie).toBeDefined();
    stolenSessionCookie = sessionCookie!.value;
    expect(stolenSessionCookie.length).toBeGreaterThan(0);
  });

  test('3. Password change with a wrong current password is rejected', async () => {
    await page.goto('/passwordchange');
    await expect(page.getByRole('heading', { name: 'Change Password' })).toBeVisible();

    await page.fill('#current-password', 'totally-wrong-password');
    await page.fill('input[placeholder="New Password (min 15 characters)"]', newPassword);
    await page.fill('input[placeholder="Confirm New Password"]', newPassword);

    const [changeResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/password/change') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Change Password' }).click(),
    ]);

    expect(changeResponse.status()).toBe(401);
    const changeData = await changeResponse.json();
    expect(changeData.success).toBe(false);
    expect(changeData.error).toBe('Invalid credentials');

    // No success banner, the user stays on the form
    await expect(page.locator('text=Password changed successfully')).not.toBeVisible();

    // The original password still authenticates (rotation did not happen)
    await page.goto('/account');
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('4. Password change with the correct current password succeeds', async () => {
    await page.goto('/passwordchange');
    await expect(page.getByRole('heading', { name: 'Change Password' })).toBeVisible();

    await page.fill('#current-password', testUser.password);
    await page.fill('input[placeholder="New Password (min 15 characters)"]', newPassword);
    await page.fill('input[placeholder="Confirm New Password"]', newPassword);

    const [changeResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/password/change') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Change Password' }).click(),
    ]);

    expect(changeResponse.status()).toBe(200);
    const changeData = await changeResponse.json();
    expect(changeData.success).toBe(true);

    await expect(page.locator('text=Password changed successfully')).toBeVisible();
    await page.waitForURL((url) => url.pathname === '/', { timeout: 10000 });

    // The current browser keeps working: the server re-issued its session
    // with the new rotation counter.
    await page.goto('/account');
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('5. The pre-rotation (stolen) session cookie is revoked', async ({ browser }) => {
    const origin = new URL(page.url()).origin;
    const thiefContext = await browser.newContext();
    await thiefContext.addCookies([
      { name: 'session', value: stolenSessionCookie, url: `${origin}/` },
    ]);
    const thiefPage = await thiefContext.newPage();

    // The stolen cookie no longer authenticates: protected route bounces
    // back to the home page and shows the guest header.
    await thiefPage.goto('/account');
    await thiefPage.waitForURL((url) => url.pathname === '/', { timeout: 10000 });
    await expect(thiefPage.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(thiefPage.getByRole('button', { name: 'Logout' })).not.toBeVisible();

    await thiefContext.close();
  });

  test('6. Account deletion with a wrong password is rejected', async () => {
    await page.goto('/account');
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

    await page.getByRole('button', { name: 'Delete My Account' }).click();
    await expect(page.locator('#delete-password')).toBeVisible();

    await page.fill('#delete-password', 'totally-wrong-password');
    const [deleteResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/delete_my_account') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Yes, Delete' }).click(),
    ]);

    expect(deleteResponse.status()).toBe(401);
    const deleteData = await deleteResponse.json();
    expect(deleteData.success).toBe(false);
    expect(deleteData.error).toBe('Invalid credentials');

    // The account still exists: the user remains authenticated.
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('7. Account deletion with the correct password wipes the account', async () => {
    await page.goto('/account');
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

    await page.getByRole('button', { name: 'Delete My Account' }).click();
    await expect(page.locator('#delete-password')).toBeVisible();

    await page.fill('#delete-password', newPassword);
    const [deleteResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/delete_my_account') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Yes, Delete' }).click(),
    ]);

    expect(deleteResponse.status()).toBe(200);
    const deleteData = await deleteResponse.json();
    expect(deleteData.success).toBe(true);

    // Session is cleared and the account is gone: login with the (new)
    // password must fail.
    await page.waitForURL((url) => url.pathname === '/', { timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();

    await page.getByRole('button', { name: 'Login' }).click();
    await page.fill('input[placeholder="Username"]', testUser.username);
    await page.fill('input[placeholder="Password"]', newPassword);
    const [loginResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/login') && res.request().method() === 'POST'),
      page.locator('form').getByRole('button', { name: 'Login' }).click(),
    ]);
    expect(loginResponse.status()).toBe(401);
  });
});
