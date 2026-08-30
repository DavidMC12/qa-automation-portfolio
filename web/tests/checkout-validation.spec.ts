import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutInfoPage } from '../pages/CheckoutInfoPage';
import { users, PASSWORD } from '../fixtures/users';
import {
  missingFirstName,
  missingLastName,
  missingPostalCode,
} from '../fixtures/checkout-data';

test.describe('Checkout validation', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard, PASSWORD);

    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addToCart('Sauce Labs Backpack');
    await inventoryPage.goToCart();

    const cartPage = new CartPage(page);
    await cartPage.checkout();
  });

  test('missing first name blocks progression', async ({ page }) => {
    const infoPage = new CheckoutInfoPage(page);
    await infoPage.fillInfo(
      missingFirstName.firstName,
      missingFirstName.lastName,
      missingFirstName.postalCode
    );
    await infoPage.continue_();

    await expect(infoPage.errorMessage).toContainText('First Name is required');
  });

  test('missing last name blocks progression', async ({ page }) => {
    const infoPage = new CheckoutInfoPage(page);
    await infoPage.fillInfo(
      missingLastName.firstName,
      missingLastName.lastName,
      missingLastName.postalCode
    );
    await infoPage.continue_();

    await expect(infoPage.errorMessage).toContainText('Last Name is required');
  });

  test('missing postal code blocks progression', async ({ page }) => {
    const infoPage = new CheckoutInfoPage(page);
    await infoPage.fillInfo(
      missingPostalCode.firstName,
      missingPostalCode.lastName,
      missingPostalCode.postalCode
    );
    await infoPage.continue_();

    await expect(infoPage.errorMessage).toContainText('Postal Code is required');
  });
});
