import { createBdd } from "playwright-bdd";
import { test, TestDataContext } from "../support/fixture";
import { URLS } from "../support/testData.constants";
import { expect, Page } from "@playwright/test";
import { ReusableMethods } from "../support/reusableMethods";
import { TIMEOUTS } from "../support/config";
const { Given, When, Then } = createBdd(test);

Then('I should see search results', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    // Verify URL contains search params
    expect(page.url()).toContain('/s?');
    // Verify results are displayed
    const results = page.locator('div[data-component-type="s-search-result"]');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
    console.log(`[Navigation] Found ${count} search results`);
});
Then('I should see product cards', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    const searchPage = testDataContext.searchPage;
    
    // Wait for product cards to be visible
    await searchPage.listOfProductCards.first().waitFor({ state: 'visible', timeout: TIMEOUTS.pageLoad });
    
    const cardCount = await searchPage.listOfProductCards.count();
    expect(cardCount).toBeGreaterThan(0);
    
    console.log(`[Navigation] Found ${cardCount} product cards`);
});

Then('I should see {int} or more product cards', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }, minCards: number) => {
    const searchPage = testDataContext.searchPage;
    const cardCount = await searchPage.listOfProductCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(minCards);
    
    console.log(`[Navigation] Found ${cardCount} product cards (minimum: ${minCards})`);
});
Then('Add a product to cart from the search results that is less than or equal to {float} dollars', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }, budget: number) => {
    const listOfProducts  = testDataContext.searchPage.listOfProductCards;
    const count = await listOfProducts.count();
    let productAdded = false;
    for(let i=0; i<count; i++){
        if(!productAdded){  
            const price : number = await ReusableMethods.getNumericValueFromText(await testDataContext.searchPage.getProductAmount(i));
            if(price <= budget){
                const addToCartButton = await testDataContext.searchPage.getAddToCart(i);
                addToCartButton.scrollIntoViewIfNeeded();
                await expect(addToCartButton).toBeVisible();
                await expect(addToCartButton).toBeEnabled();
                await addToCartButton.highlight();
                await addToCartButton.click();
                productAdded = true;
                console.log(`Added product ${i} to cart for $${price}, within budget of $${budget}`);
                break;
            }
        }
    }
    if(!productAdded){
        throw new Error(`No product found within the budget of $${budget}`);
    }
});
When('I search for {string}', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }, searchTerm: string) => {
    // Find search box
    const searchInput = page.locator('input[placeholder*="Search"], input#twotabsearchtextbox');
    await searchInput.waitFor({ state: 'visible' });
    
    await searchInput.clear();
    await searchInput.fill(searchTerm);
    
    // Submit search
    const searchBtn = page.locator('button[type="submit"]:has-text("Go"), input[type="submit"][value="Go"]');
    if (await searchBtn.count() > 0) {
        await searchBtn.click();
    } else {
        // Fallback: press Enter
        await searchInput.press('Enter');
    }
    
    // Wait for search results
    //await testDataContext.searchPage.
    await testDataContext.searchPage.verifySearchPageLoaded(searchTerm);
    console.log(`[Navigation] Searched for: ${searchTerm}`);
});