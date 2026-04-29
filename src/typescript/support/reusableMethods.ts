import { Locator, Page } from '@playwright/test';
export class ReusableMethods {
    static async waitForPageLoad(page: Page, timeout: number = 10000) {
        await page.waitForEvent('load', { timeout });
        await page.waitForEvent('domcontentloaded', { timeout });
        await this.waitForServiceWorkerReady(page, timeout);
        console.log('[ReusableMethods] Page load complete');
    }
    private static async waitForServiceWorkerReady(page: Page, timeout: number = 10000) {
        try {
            const serviceWorker = await page.evaluate(() => navigator.serviceWorker);
            if (!serviceWorker) {
                console.warn('[ReusableMethods] No service worker found on the page: ' + page.url());
                return;
            }
            await page.waitForFunction(() => {
                return navigator.serviceWorker && navigator.serviceWorker.ready;
            }, { timeout });
            console.log('[ReusableMethods] Service worker is ready');
        } catch (error) {
            console.warn('[ReusableMethods] Service worker did not become ready within timeout');
        }
    }
    static async getNumericValueFromText(locator: Locator): Promise<number> {
        const text = await locator.textContent();
        if(!text) return 0;
        
        // Match patterns like $xx.xx or $x,xxx.xx (currency format)
        const currencyMatch = text.match(/\$[\d,]+\.?\d{0,2}/);
        if (!currencyMatch) return 0;
        
        // Extract numeric part by removing $ and commas
        const numericString = currencyMatch[0].replace(/[$,]/g, '');
        return parseFloat(numericString);
    }
}