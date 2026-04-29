import { Locator, Page } from "@playwright/test";
import { SearchProductCard } from "./eventProductCard";
import { Header } from "../common/header";
export class EventPage{
    readonly page : Page;
    readonly header: Header;
    readonly productCardList: SearchProductCard;

    constructor(page: Page) {
        this.page = page;
        this.header = new Header(this.page);
        this.productCardList = new SearchProductCard(this.page);
    }
    async clickHomeLink() {
        await this.header.clickHomeLink();
    }
}
