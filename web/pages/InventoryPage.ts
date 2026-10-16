import { Page, Locator } from '@playwright/test';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage {
  readonly page: Page;
  readonly sortDropdown: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly inventoryItems: Locator;
  readonly inventoryList: Locator;
  readonly itemPrices: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartLink = page.locator('.shopping_cart_link');
    this.inventoryItems = page.locator('.inventory_item');
    this.inventoryList = page.locator('.inventory_list');
    this.itemPrices = page.locator('.inventory_item_price');
  }

  private itemContainer(itemName: string): Locator {
    return this.inventoryItems.filter({ hasText: itemName });
  }

  async addToCart(itemName: string) {
    await this.itemContainer(itemName).getByRole('button', { name: 'Add to cart' }).click();
  }

  async removeFromCart(itemName: string) {
    await this.itemContainer(itemName).getByRole('button', { name: 'Remove' }).click();
  }

  async sortBy(option: SortOption) {
    await this.sortDropdown.selectOption(option);
  }

  async getProductNames(): Promise<string[]> {
    return this.page.locator('.inventory_item_name').allTextContents();
  }

  async getProductPrices(): Promise<number[]> {
    const texts = await this.page.locator('.inventory_item_price').allTextContents();
    return texts.map((t) => Number(t.replace('$', '')));
  }

  async goToCart() {
    await this.cartLink.click();
  }
}
