import { Locator, Page } from "@playwright/test";
export class SearchProductCard{
    readonly page : Page;
    readonly productCard: Locator;
    readonly addToCartButton: Locator;
    readonly productTitle : Locator;
    readonly productPrice : Locator;
    constructor(page: Page) {
        this.page = page;
        this.productCard = this.page.locator('[data-testid="product-card"]');
        this.addToCartButton = this.productCard.getByRole('button', { name: 'Add to Cart' });
        this.productTitle = this.productCard.locator('span.a-truncate-cut');
        this.productPrice = this.productCard.getByTestId("price-section");
    }
    //Returns actual price of product if there is any offer or savings. 
    get actualPrice(){
        return this.productPrice.locator('span.a-price',{hasNotText:'List'});
    }
    get listPrice(){
        return this.productPrice.locator('span.a-price',{hasText:'List'});
    }
}
