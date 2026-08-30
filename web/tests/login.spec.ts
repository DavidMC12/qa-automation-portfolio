import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { users, PASSWORD } from '../fixtures/users';

test.describe('Login', () => {
  test('valid credentials land on the inventory page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard, PASSWORD);

    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('locked out user sees a locked-out error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.lockedOut, PASSWORD);

    await expect(loginPage.errorMessage).toContainText('locked out');
  });

  test('wrong password shows a generic error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard, 'wrong-password');

    await expect(loginPage.errorMessage).toContainText(
      'Username and password do not match'
    );
  });

  test('empty fields show a required-field error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginButton.click();

    await expect(loginPage.errorMessage).toContainText('Username is required');
  });
});
