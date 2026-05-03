/**
 * This file will contain step defs for home page and the header that is commmon across most pages.
 */
import { createBdd } from "playwright-bdd";
import { test, TestDataContext } from "../support/fixture";
import { URLS } from "../support/testData.constants";
import { expect, Page } from "@playwright/test";
import { TIMEOUTS } from "../support/config";
const { Given, When, Then } = createBdd(test);

Given('I navigate to the homepage', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    const baseUrl = URLS.baseUrl;
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    
    // Verify we're on the homepage
    const homeContent = testDataContext.homePage;    
    console.log('[Navigation] On homepage');
});
When('I search for {string} from the homepage', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }, searchTerm: string) => {
    // Find search box
    const searchInput = page.locator('input[placeholder*="Search"], input#twotabsearchtextbox');
    await searchInput.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
    await searchInput.fill(searchTerm);
    await searchInput.press('Enter');
});