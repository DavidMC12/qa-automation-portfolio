import { Page, Locator } from '@playwright/test';

export class CheckoutOverviewPage {
  readonly page: Page;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.subtotalLabel = page.locator('.summary_subtotal_label');
    this.taxLabel = page.locator('.summary_tax_label');
    this.totalLabel = page.locator('.summary_total_label');
    this.finishButton = page.locator('#finish');
  }

  private async parseMoney(locator: Locator): Promise<number> {
    const text = await locator.textContent();
    const match = text?.match(/\$([\d.]+)/);
    return match ? Number(match[1]) : NaN;
  }

  async getItemTotal(): Promise<number> {
    return this.parseMoney(this.subtotalLabel);
  }

  async getTax(): Promise<number> {
    return this.parseMoney(this.taxLabel);
  }

  async getTotal(): Promise<number> {
    return this.parseMoney(this.totalLabel);
  }

  async finish() {
    await this.finishButton.click();
  }
}
