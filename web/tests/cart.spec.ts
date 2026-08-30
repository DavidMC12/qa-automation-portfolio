import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { users, PASSWORD } from '../fixtures/users';

const ITEM_1 = 'Sauce Labs Backpack';
const ITEM_2 = 'Sauce Labs Bike Light';

test.describe('Cart', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard, PASSWORD);
  });

  test('adding an item updates the cart badge', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addToCart(ITEM_1);

    expect(await inventoryPage.getCartBadgeCount()).toBe(1);
  });

  test('adding multiple items accumulates the badge count', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addToCart(ITEM_1);
    await inventoryPage.addToCart(ITEM_2);

    expect(await inventoryPage.getCartBadgeCount()).toBe(2);
  });

  test('removing an item from the inventory page clears the badge', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addToCart(ITEM_1);
    await inventoryPage.removeFromCart(ITEM_1);

    expect(await inventoryPage.getCartBadgeCount()).toBe(0);
  });

  test('removing an item from the cart page removes it from the list', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addToCart(ITEM_1);
    await inventoryPage.addToCart(ITEM_2);
    await inventoryPage.goToCart();

    const cartPage = new CartPage(page);
    await cartPage.removeItem(ITEM_1);

    const remaining = await cartPage.getCartItemNames();
    expect(remaining).toEqual([ITEM_2]);
  });

  test('cart contents persist across navigation', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addToCart(ITEM_1);
    await inventoryPage.goToCart();

    const cartPage = new CartPage(page);
    await expect(cartPage.cartItems).toHaveCount(1);

    await page.goBack();
    expect(await inventoryPage.getCartBadgeCount()).toBe(1);
  });
});
