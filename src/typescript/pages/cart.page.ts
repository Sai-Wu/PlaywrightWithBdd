import { Page, Locator } from "@playwright/test";
import { ReusableMethods } from "../support/reusableMethods";
export class CartPage {
    readonly page : Page;
    readonly shoppingCart : Locator;
    readonly yourItemsSection : Locator;
    constructor(page: Page){
        this.page = page;
        this.shoppingCart = page.locator('#sc-active-cart');
        this.yourItemsSection = page.locator('#sc-secondary-list');
    }
    async getCartItems(){
        return await this.shoppingCart.locator('div.sc-list-item-content');
    }
    async getCartSubTotal(){
        return await this.shoppingCart.locator('#sc-active-cart').locator('#sc-subtotal-amount-activecart');
    }
    async calculateItemTotal(){
        const listOfItems = await this.getCartItems();
        let total = 0;
        for(const item of await listOfItems.all()){
            const itemPrice = await item.locator('div.sc-item-price-block').locator('span.a-price.apex-price-to-pay-value');
            const itemQuantity = await item.locator('div.a-stepper-inner-container').locator('div.a-declarative');
            const itemPriceValue = await ReusableMethods.getNumericValueFromText( itemPrice );
            const itemQuantityValue = await ReusableMethods.getNumericValueFromText( itemQuantity );
            console.log(`Item Price: ${itemPriceValue}, Item Quantity: ${itemQuantityValue}`);
            console.log(`Current Total: ${total}`);
            total += itemPriceValue * itemQuantityValue;
            console.log(`Updated Total after adding item: ${total}`);
        }
        console.log(`Final Calculated Total: ${total}`);
        return total;
    }

}