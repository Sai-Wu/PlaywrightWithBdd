import { Locator, Page } from "@playwright/test";
import { SearchProductCard } from "./eventProductCard";
export class EventPage{
    readonly page : Page;
    readonly homeLink : Locator;
    readonly productCardList: SearchProductCard;

    constructor(page: Page) {
        this.page = page;
        this.homeLink = this.page.getByRole('link', { name: 'Amazon', exact: true });
        this.productCardList = new SearchProductCard(this.page);
    }
}
