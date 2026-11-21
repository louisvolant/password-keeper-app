import { expect, test } from '@playwright/test';

const PERSONAL_PAGE = 'https://www.louisvolant.com';
const PORTFOLIO = 'https://www.louisvolant.com/portfolio';

test.describe('Footer personal links', () => {
  test('landing and legal pages link to Personal Page and Portfolio in the footer', async ({ page }) => {
    for (const path of ['/', '/confidentiality-rules', '/general-conditions']) {
      await page.goto(path);

      const footer = page.locator('footer');
      const personal = footer.getByRole('link', { name: 'Personal Page' });
      await expect(personal).toBeVisible();
      await expect(personal).toHaveAttribute('href', PERSONAL_PAGE);
      await expect(personal).toHaveAttribute('target', '_blank');
      await expect(personal).toHaveAttribute('rel', 'noopener noreferrer');

      const portfolio = footer.getByRole('link', { name: 'Portfolio' });
      await expect(portfolio).toBeVisible();
      await expect(portfolio).toHaveAttribute('href', PORTFOLIO);
      await expect(portfolio).toHaveAttribute('target', '_blank');
      await expect(portfolio).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  test('authenticated app view keeps the same personal links in the footer', async ({ page }) => {
    await page.route('**/api/check-auth', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ isAuthenticated: true, user: { username: 'footer_tester' } }),
      });
    });

    await page.route('**/api/vault/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ hasVault: false }),
      });
    });

    await page.goto('/account');
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

    const footer = page.locator('footer');
    const personal = footer.getByRole('link', { name: 'Personal Page' });
    await expect(personal).toHaveAttribute('href', PERSONAL_PAGE);
    await expect(personal).toHaveAttribute('target', '_blank');
    await expect(personal).toHaveAttribute('rel', 'noopener noreferrer');

    const portfolio = footer.getByRole('link', { name: 'Portfolio' });
    await expect(portfolio).toHaveAttribute('href', PORTFOLIO);
    await expect(portfolio).toHaveAttribute('target', '_blank');
    await expect(portfolio).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
