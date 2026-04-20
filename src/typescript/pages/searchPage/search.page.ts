import { Locator, Page } from "@playwright/test";
export class SearchPage{
    readonly page : Page;
    readonly homeLink : Locator;
    readonly productRow: Locator;
    readonly productCard: Locator;
    constructor(page: Page) {
        this.page = page;
        this.homeLink = this.page.getByRole('link', { name: 'Amazon', exact: true });
        this.productRow = this.page.locator('div.puisg-row');
        this.productCard = this.page.locator('div.puis-card-container');
    }
    get listOfProductCards(){
        return this.productCard;
    }
    get listOfProductRows(){
        return this.productRow;
    }
}

//TODO : Add to cart. Go to cart. Calculate total. Decide if it meets a set budget. Try adding stuff from event or from search