import { Locator, Page } from "@playwright/test";
import { SearchProductCard } from "./eventPage/eventProductCard";
import { URLS } from "../support/testData.constants";
import { Header } from "./common/header";
import { expect } from "@playwright/test";
export class HomePage{
    readonly page : Page;
    readonly header: Header; 

    constructor(page: Page) {
        this.page = page;
        this.header = new Header(this.page);
    }
    async clickHomeLink() {
        await this.header.clickHomeLink();
    }
    async clickAccountList() {
        await expect(this.header.getAccountList).toBeVisible();
        await expect(this.header.getAccountList).toBeEnabled();
        await expect(this.header.getAccountList).toHaveText('Sign In');
        await this.header.getAccountList.highlight();
        await this.header.getAccountList.click();
    }
    async verifyHomePageLoaded() {
        await this.page.url().includes(URLS.baseUrl);
        await this.page.waitForLoadState('load');
        await this.page.waitForLoadState('domcontentloaded');

    }
}
