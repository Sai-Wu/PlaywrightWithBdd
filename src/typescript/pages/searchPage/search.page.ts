import { Locator, Page, expect } from "@playwright/test";
import { Header } from "../common/header";
export class SearchPage{
    readonly page : Page;
    readonly header: Header;
    //readonly productRow: Locator;
    readonly productCard: Locator;
    readonly searchResultsList: Locator;
    constructor(page: Page) {
        this.page = page;
        this.header = new Header(this.page);
        //product row is part of product card. product card is part of search results list
        //this.productRow = this.page.locator('div.puisg-row');
        this.productCard = this.page.locator('div.puis-card-container');
        this.searchResultsList = this.page.locator('div.s-result-list');
    }
    get getSearchResultsList(){
        return this.searchResultsList;
    }
    get listOfProductCards(){
        return this.searchResultsList.locator('div.puis-card-container');
    }
    async clickHomeLink() {
        await this.header.clickHomeLink();
    }
    async getAddToCart(index : number){
        return this.listOfProductCards.nth(index).getByRole('button',{name:'Add to cart'});
    }
    async getProductCartSection(index : number){
        return this.listOfProductCards.nth(index).locator('div.puisg-row').locator('div.puisg-row',{hasText:'add to cart'});
    }
    async getProductAmount(index : number){
        console.log(`Getting price for product at index ${index}`);
        const productSection = await this.getProductCartSection(index);
        return productSection.locator('span.a-price').first();
    }
    async getDiscountedAmount(index : number){
        const productSection = await this.getProductCartSection(index);
        return productSection.locator('span.a-price.apex-price-to-pay');
    }
    async verifySearchPageLoaded(searchTerm?: string){
        await this.page.waitForEvent('load');
        if(searchTerm){
            await expect(this.page.url()).toContain('/s?');
            await expect(this.page.url()).toContain(`k=${encodeURIComponent(searchTerm)}`);
            await expect((await this.page.title()).toLowerCase()).toContain(searchTerm.toLowerCase());
        }
    }
}

//TODO : Add to cart. Go to cart. Calculate total. Decide if it meets a set budget. Try adding stuff from event or from search