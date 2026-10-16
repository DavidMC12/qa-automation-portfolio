import path from 'node:path';
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { users, PASSWORD } from '../../fixtures/users';

// Baselines are always captured from standard_user. visual_user is SauceDemo's
// deliberately broken account: it renders the same catalogue with a placeholder
// image on the Backpack and a shifted "Add to cart" button on the last card, and
// it randomises every price on each load. Prices are hidden (layout intact) so
// the only differences left between the two accounts are the deterministic
// defects, never the noise.
const HIDE_PRICES = path.join(__dirname, 'hide-prices.css');

test.describe('Visual regression', () => {
  test('login page matches the baseline', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(page).toHaveScreenshot('login-page.png');
  });

  test('inventory grid of standard_user matches the baseline', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard, PASSWORD);

    const inventoryPage = new InventoryPage(page);
    await expect(inventoryPage.inventoryItems).toHaveCount(6);
    await expect(inventoryPage.inventoryList).toHaveScreenshot('inventory-grid.png', {
      stylePath: HIDE_PRICES,
    });
  });

  test('inventory grid of visual_user is flagged as different from the baseline', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.visual, PASSWORD);

    const inventoryPage = new InventoryPage(page);
    await expect(inventoryPage.inventoryItems).toHaveCount(6);
    // Passes only while the visual diff keeps detecting the known defects: if
    // the comparison ever went blind, this test would turn red.
    await expect(inventoryPage.inventoryList).not.toHaveScreenshot('inventory-grid.png', {
      stylePath: HIDE_PRICES,
    });
  });
});
