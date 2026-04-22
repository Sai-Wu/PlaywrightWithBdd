import { Given, When, Then, TestDataContext } from '../support/fixture';
import { testDataManager } from '../support/testDataManager';
import { TIMEOUTS, URLS } from '../support/testData.constants';
import { expect, Page } from '@playwright/test';

/**
 * Navigation-related step definitions using Page Object Models.
 * Handles navigation, searching, and product discovery.
 */

Given('I am on the homepage', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    const baseUrl = testDataManager.getBaseUrl();
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    
    // Verify we're on the homepage
    const homeContent = testDataContext.homePage;
    expect(homeContent.homeLink).toBeDefined();
    
    console.log('[Navigation] On homepage');
});

Given('I am on the login page', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    const loginUrl = 'https://www.amazon.com/ap/signin';
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
    
    const signInHeader = page.locator('h1:has-text("Sign in")');
    await signInHeader.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
    
    console.log('[Navigation] On login page');
});

Given('I am on the search page', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    const baseUrl = testDataManager.getBaseUrl();
    await page.goto(`${baseUrl}s`, { waitUntil: 'domcontentloaded' });
    
    const searchPage = testDataContext.searchPage;
    expect(searchPage).toBeDefined();
    
    console.log('[Navigation] On search page');
});

When('I navigate to the homepage', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    const homePage = testDataContext.homePage;
    await homePage.homeLink.click();
    
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });
    console.log('[Navigation] Navigated to homepage');
});

When('I search for {string}', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }, searchTerm: string) => {
    // Find search box
    const searchInput = page.locator('input[placeholder*="Search"], input#twotabsearchtextbox');
    await searchInput.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
    
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
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });
    console.log(`[Navigation] Searched for: ${searchTerm}`);
});

When('I click the search button', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    const searchBtn = page.locator('button[type="submit"]:has-text("Go"), input[type="submit"][value="Go"]');
    await searchBtn.click();
    
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });
    console.log('[Navigation] Search submitted');
});

When('I wait for the page to load', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    await page.waitForLoadState('domcontentloaded', { timeout: TIMEOUTS.pageLoad });
    console.log('[Navigation] Page loaded');
});

Then('I should see the homepage', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    const homePage = testDataContext.homePage;
    await homePage.homeLink.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
    
    expect(page.url()).toContain('amazon.com');
    console.log('[Navigation] Homepage is visible');
});

Then('I should see product cards', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    const searchPage = testDataContext.searchPage;
    
    // Wait for product cards to be visible
    await searchPage.listOfProductCards.first().waitFor({ state: 'visible', timeout: TIMEOUTS.pageLoad });
    
    const cardCount = await searchPage.listOfProductCards.count();
    expect(cardCount).toBeGreaterThan(0);
    
    console.log(`[Navigation] Found ${cardCount} product cards`);
});

Then('I should see search results', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    // Verify URL contains search params
    expect(page.url()).toContain('/s?');
    
    // Verify results are displayed
    const results = page.locator('div[data-component-type="s-search-result"]');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
    
    console.log(`[Navigation] Found ${count} search results`);
});

Then('I should see {int} or more product cards', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }, minCards: number) => {
    const searchPage = testDataContext.searchPage;
    
    const cardCount = await searchPage.listOfProductCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(minCards);
    
    console.log(`[Navigation] Found ${cardCount} product cards (minimum: ${minCards})`);
});

Then('the first product should have a title', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    const eventPage = testDataContext.eventPage;
    
    const firstCard = page.locator('h2').first();
    await firstCard.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
    
    const title = await firstCard.textContent();
    expect(title).toBeTruthy();
    
    console.log(`[Navigation] First product title: ${title}`);
});

Then('the first product should have a price', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    const priceLocator = page.locator('span.a-price-whole').first();
    await priceLocator.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
    
    const price = await priceLocator.textContent();
    expect(price).toBeTruthy();
    
    console.log(`[Navigation] First product price: ${price}`);
});

Then('I should see the header', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    const header = testDataContext.header;
    await header.homeLink.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
    
    console.log('[Navigation] Header is visible');
});

Then('the page title should be {string}', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }, expectedTitle: string) => {
    const pageTitle = await page.title();
    expect(pageTitle).toContain(expectedTitle);
    
    console.log(`[Navigation] Page title verified: ${pageTitle}`);
});

Then('I should be on the {string} page', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }, pageName: string) => {
    const currentUrl = page.url();
    
    // Map page names to URL patterns
    const pagePatterns: Record<string, RegExp> = {
        'home': /amazon\.com\/?$/,
        'search': /amazon\.com\/s/,
        'login': /amazon\.com\/ap\/signin/,
        'product': /amazon\.com\/dp\//,
    };
    
    const pattern = pagePatterns[pageName.toLowerCase()];
    if (pattern) {
        expect(currentUrl).toMatch(pattern);
    }
    
    console.log(`[Navigation] Verified on ${pageName} page`);
});

When('I go back', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    await page.goBack({ waitUntil: 'domcontentloaded' });
    console.log('[Navigation] Navigated back');
});

When('I go forward', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    await page.goForward({ waitUntil: 'domcontentloaded' });
    console.log('[Navigation] Navigated forward');
});

When('I refresh the page', async ({ page }: { page: Page }) => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    console.log('[Navigation] Page refreshed');
});
