import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutInfoPage } from '../pages/CheckoutInfoPage';
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage';
import { users, PASSWORD } from '../fixtures/users';
import { validCheckoutInfo } from '../fixtures/checkout-data';

test('full checkout happy path', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(users.standard, PASSWORD);

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.addToCart('Sauce Labs Backpack');
  await inventoryPage.addToCart('Sauce Labs Bike Light');
  await inventoryPage.goToCart();

  const cartPage = new CartPage(page);
  await cartPage.checkout();

  const infoPage = new CheckoutInfoPage(page);
  await infoPage.fillInfo(
    validCheckoutInfo.firstName,
    validCheckoutInfo.lastName,
    validCheckoutInfo.postalCode
  );
  await infoPage.continue_();

  const overviewPage = new CheckoutOverviewPage(page);
  const itemTotal = await overviewPage.getItemTotal();
  const tax = await overviewPage.getTax();
  const total = await overviewPage.getTotal();
  expect(total).toBeCloseTo(itemTotal + tax, 2);

  await overviewPage.finish();

  const completePage = new CheckoutCompletePage(page);
  await expect(completePage.completeHeader).toContainText('Thank you for your order!');
});
