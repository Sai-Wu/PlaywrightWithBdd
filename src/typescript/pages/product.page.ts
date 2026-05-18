import { Locator, Page, expect } from "@playwright/test";
export class ProductPage {
    readonly page : Page;
    readonly productTitle : Locator;
    //product details of price, seller, 
    readonly productInfo : Locator;
    //customize product
    readonly productAccordion: Locator;
    constructor(page: Page) {
        this.page = page;
        this.productTitle = page.locator('#productTitle');
        this.productInfo = page.locator('#desktop_accordion');
        this.productAccordion = page.locator('#centerCol');
    }
    get addToCartButton(){
        return this.productInfo.getByRole('button', { name: 'Add to Cart' });
    }
    get buyNowButton(){
        return this.productInfo.getByRole('button', { name: 'Buy Now' });
    }
}