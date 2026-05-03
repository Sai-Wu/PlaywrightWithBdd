import { createBdd } from "playwright-bdd";
import { test, TestDataContext } from "../support/fixture";
import { URLS } from "../support/testData.constants";
import { expect, Page } from "@playwright/test";
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