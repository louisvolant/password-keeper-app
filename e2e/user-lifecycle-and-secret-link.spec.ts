import { test, expect, Page } from '@playwright/test';

test.describe.serial('E2E User Flow: Register, Login, Ephemeral Link & Logout', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  const timestamp = Date.now();
  const testUser = {
    username: `user_${timestamp}`,
    email: `test_${timestamp}@example.com`,
    password: `P@ssword123456789!`,
  };
  const secretPayload = `Top secret token: ${timestamp}-${Math.random().toString(36).substring(2)}`;
  let createdLinkUrl = '';
  let createdIdentifier = '';

  test('1. Register a new user account', async () => {
    await page.goto('/');

    // Open Register modal from header
    const registerBtn = page.getByRole('button', { name: 'Register' }).first();
    await expect(registerBtn).toBeVisible();
    await registerBtn.click();

    // Verify modal is displayed
    const modalHeading = page.getByRole('heading', { name: 'Register' });
    await expect(modalHeading).toBeVisible();

    // Fill registration form
    await page.fill('#register-username', testUser.username);
    await page.fill('#register-email', testUser.email);
    await page.fill('#register-password', testUser.password);

    // Wait for the register API response on submit
    const [registerResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/register') && res.request().method() === 'POST'),
      page.locator('form').getByRole('button', { name: 'Register' }).click(),
    ]);

    expect(registerResponse.status()).toBe(200);
    const registerData = await registerResponse.json();
    expect(registerData.success).toBe(true);

    // After successful registration, user should be redirected to /account
    await expect(page).toHaveURL(/\/account/);
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('2. Log out from the application', async () => {
    await page.goto('/account');
    const logoutBtn = page.getByRole('button', { name: 'Logout' });
    await expect(logoutBtn).toBeVisible();

    const [logoutResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/logout')),
      logoutBtn.click(),
    ]);

    expect(logoutResponse.status()).toBe(200);

    // Verify user is logged out (Login & Register buttons visible)
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Register' }).first()).toBeVisible();

    // Verify protected page is redirected
    await page.goto('/account');
    await expect(page).toHaveURL(/\//);
  });

  test('3. Log in with registered credentials', async () => {
    await page.goto('/');

    // Open Login modal
    const loginBtn = page.getByRole('button', { name: 'Login' });
    await expect(loginBtn).toBeVisible();
    await loginBtn.click();

    const modalHeading = page.getByRole('heading', { name: 'Login' });
    await expect(modalHeading).toBeVisible();

    // Fill login credentials
    await page.fill('input[placeholder="Username"]', testUser.username);
    await page.fill('input[placeholder="Password"]', testUser.password);

    // Submit and await login API response
    const [loginResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/login') && res.request().method() === 'POST'),
      page.locator('form').getByRole('button', { name: 'Login' }).click(),
    ]);

    expect(loginResponse.status()).toBe(200);
    const loginData = await loginResponse.json();
    expect(loginData.success).toBe(true);

    // Verify redirected to account and authenticated
    await expect(page).toHaveURL(/\/account/);
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('4. Create an encoded temporary secret URL', async () => {
    await page.goto('/temporarycontent');
    await expect(page.getByRole('heading', { name: 'Create Temporary Content' })).toBeVisible();

    // Fill secret content in textarea
    const contentTextarea = page.locator('textarea#content');
    await expect(contentTextarea).toBeVisible();
    await contentTextarea.fill(secretPayload);

    // Submit temporary content
    const [saveResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/savetemporarycontent') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Save Temporary Content' }).click(),
    ]);

    expect(saveResponse.status()).toBe(200);
    const saveData = await saveResponse.json();
    expect(saveData.success).toBe(true);
    expect(saveData.identifier).toBeTruthy();

    createdIdentifier = saveData.identifier;

    // Verify success banner and generated link
    await expect(page.locator('.alert-success')).toBeVisible();
    await expect(page.getByText('Content saved! Share this link:')).toBeVisible();

    createdLinkUrl = await page.locator('.alert-success a').innerText();
    expect(createdLinkUrl).toContain(`/securelinkview/${createdIdentifier}`);

    // Verify link appears in "Your Temporary Links" table
    const tableRow = page.locator('table tbody tr', { hasText: createdIdentifier });
    await expect(tableRow).toBeVisible();
  });

  test('5. Verify encoded content can be retrieved and decoded', async ({ browser }) => {
    // Open a separate incognito browser context to read the secret link as an external recipient
    const recipientContext = await browser.newContext();
    const recipientPage = await recipientContext.newPage();
    await recipientPage.goto(createdLinkUrl);

    // Verify recipient sees the decoded secret payload in the textarea
    const secretTextarea = recipientPage.locator('textarea');
    await expect(secretTextarea).toBeVisible({ timeout: 15000 });
    await expect(secretTextarea).toHaveValue(secretPayload);
    await recipientContext.close();
  });

  test('6. Burn-after-read content is deleted after its first read', async ({ browser }) => {
    const burnPayload = `Burn after read token: ${timestamp}-${Math.random().toString(36).substring(2)}`;
    await page.goto('/temporarycontent');
    await expect(page.getByRole('heading', { name: 'Create Temporary Content' })).toBeVisible();

    // Switch the access strategy toggle to "Burn After Read" (oneread)
    const strategyToggle = page.locator('input.toggle');
    await strategyToggle.check();

    const contentTextarea = page.locator('textarea#content');
    await contentTextarea.fill(burnPayload);

    const [saveResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/savetemporarycontent') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Save Temporary Content' }).click(),
    ]);

    expect(saveResponse.status()).toBe(200);
    const saveData = await saveResponse.json();
    expect(saveData.success).toBe(true);
    const burnLinkUrl = await page.locator('.alert-success a').innerText();

    // First recipient reads the secret successfully
    const recipientContext = await browser.newContext();
    const recipientPage = await recipientContext.newPage();
    await recipientPage.goto(burnLinkUrl);
    await expect(recipientPage.locator('textarea')).toHaveValue(burnPayload, { timeout: 15000 });
    await recipientContext.close();

    // Second recipient must find the content permanently gone
    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    await secondPage.goto(burnLinkUrl);
    await expect(secondPage.locator('.alert-error')).toBeVisible({ timeout: 15000 });
    await expect(secondPage.locator('.alert-error')).toContainText('Content not found or expired');
    await secondContext.close();
  });

  test('7. Password-protected content requires the correct link password', async ({ browser }) => {
    const protectedPayload = `Protected token: ${timestamp}-${Math.random().toString(36).substring(2)}`;
    const linkPassword = 'link-password-123';
    await page.goto('/temporarycontent');
    await expect(page.getByRole('heading', { name: 'Create Temporary Content' })).toBeVisible();

    // Enable "Protect with Password" and set the link password
    await page.locator('input.checkbox').check();
    const passwordInput = page.locator('input#password');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(linkPassword);

    const contentTextarea = page.locator('textarea#content');
    await contentTextarea.fill(protectedPayload);

    const [saveResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/savetemporarycontent') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Save Temporary Content' }).click(),
    ]);

    expect(saveResponse.status()).toBe(200);
    const saveData = await saveResponse.json();
    expect(saveData.success).toBe(true);
    const protectedLinkUrl = await page.locator('.alert-success a').innerText();

    // Recipient gets a password prompt, not the content
    const recipientContext = await browser.newContext();
    const recipientPage = await recipientContext.newPage();
    await recipientPage.goto(protectedLinkUrl);
    await expect(recipientPage.getByLabel('Enter Password')).toBeVisible({ timeout: 15000 });

    // Wrong password is rejected without disclosing the content
    await recipientPage.locator('#password').fill('wrong-password');
    await recipientPage.getByRole('button', { name: 'Submit' }).click();
    await expect(recipientPage.locator('.alert-error')).toBeVisible({ timeout: 15000 });
    await expect(recipientPage.locator('.alert-error')).toContainText('Invalid password');

    // Correct password reveals the secret
    await recipientPage.locator('#password').fill(linkPassword);
    await recipientPage.getByRole('button', { name: 'Submit' }).click();
    await expect(recipientPage.locator('textarea')).toHaveValue(protectedPayload, { timeout: 15000 });
    await recipientContext.close();
  });

  test('8. Delete the created temporary secret URL', async () => {
    await page.goto('/temporarycontent');
    await expect(page.getByRole('heading', { name: 'Your Temporary Links' })).toBeVisible();

    const linkRow = page.locator('table tbody tr', { hasText: createdIdentifier });
    await expect(linkRow).toBeVisible();

    // Click Delete in the row
    const deleteBtn = linkRow.getByRole('button', { name: 'Delete' });
    const [deleteResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/deleteusertemporarycontent') && res.request().method() === 'POST'),
      deleteBtn.click(),
    ]);

    expect(deleteResponse.status()).toBe(200);
    const deleteData = await deleteResponse.json();
    expect(deleteData.success).toBe(true);

    // Verify the row is removed from the table
    await expect(page.locator('table tbody tr', { hasText: createdIdentifier })).not.toBeVisible();
  });

  test('9. Log out from the application (Déconnexion)', async () => {
    // Click Logout from the header
    const logoutBtn = page.getByRole('button', { name: 'Logout' });
    await expect(logoutBtn).toBeVisible();

    const [logoutResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/logout')),
      logoutBtn.click(),
    ]);

    expect(logoutResponse.status()).toBe(200);

    // Verify user is logged out: header shows Login and Register buttons
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Register' }).first()).toBeVisible();

    // Verify protected route /account now redirects unauthenticated users
    await page.goto('/account');
    await expect(page).toHaveURL(/\//);
  });
});
