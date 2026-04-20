import { Locator, Page } from "@playwright/test";
import { SearchProductCard } from "./eventPage/eventProductCard";
export class HomePage{
    readonly page : Page;
    readonly homeLink : Locator;

    constructor(page: Page) {
        this.page = page;
        this.homeLink = this.page.getByRole('link', { name: 'Amazon', exact: true });
    }
}
