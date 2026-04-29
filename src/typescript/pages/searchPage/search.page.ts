import { Locator, Page } from "@playwright/test";
import { Header } from "../common/header";
export class SearchPage{
    readonly page : Page;
    readonly header: Header;
    readonly productRow: Locator;
    readonly productCard: Locator;
    constructor(page: Page) {
        this.page = page;
        this.header = new Header(this.page);
        this.productRow = this.page.locator('div.puisg-row');
        this.productCard = this.page.locator('div.puis-card-container');
    }
    get listOfProductCards(){
        return this.productCard;
    }
    get listOfProductRows(){
        return this.productRow;
    }
    async clickHomeLink() {
        await this.header.clickHomeLink();
    }
}

//TODO : Add to cart. Go to cart. Calculate total. Decide if it meets a set budget. Try adding stuff from event or from search