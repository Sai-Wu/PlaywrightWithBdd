import { Given, When, Then, TestDataContext } from '../support/fixture';
import { TestDataLoader } from '../support/testDataLoader';
import { sessionManager } from '../support/sessionManager';
import { expect, Page, BrowserContext } from '@playwright/test';
import { testAccount, URLS } from '../support/testData.constants';

Then('I should see the login page', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    await testDataContext.loginPage.verifyLoginPageLoaded();
});
When('I navigate to the login page from the homepage', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    //Tries to log in by few different ways. If one does not work, move to next scenario until all ways are exhausted. 
    //1. Click button in header 'Hello, Sign in Account & Lists'
    //2. Hover over 'Hello, Sign in Account & Lists' and click 'Sign in' link from dropdown
    await testDataContext.homePage.verifyHomePageLoaded();
    const accountList = await testDataContext.homePage.getAccountList();
    let signInSuccessful = false;
    
    try {
        // Method 1: Hover and click dropdown link
        try {
            await accountList.hover();
            const signInButton = await page.getByRole('link', { name: 'Sign in', exact: true });
            await expect(signInButton).toBeVisible();
            await expect(signInButton).toBeEnabled();
            await signInButton.highlight();
            await signInButton.click();
            await expect(page.url()).toContain(URLS.loginPage);
            signInSuccessful = true;
            console.log('[LoginStep] Method 1 (hover + dropdown) succeeded');
        } catch (error) {
            console.warn('[LoginStep] Method 1 failed (hover + dropdown): ' + error);
            // Method 2: Click account list directly
            await expect(accountList).toBeVisible();
            await expect(accountList).toBeEnabled();
            await accountList.highlight();
            await accountList.click();
            await expect(testDataContext.loginPage.emailInput).toBeVisible();
            await expect(page.url()).toContain(URLS.loginPage);
            signInSuccessful = true;
            console.log('[LoginStep] Method 2 (direct click) succeeded');
        }
    } finally {
        console.log(`[LoginStep] Login navigation attempt completed. Success: ${signInSuccessful}`);
    }
});
When('I login with credentials', async ({ testDataContext, context, page }: { testDataContext: TestDataContext; context: BrowserContext; page: Page }) => { 
    // Check if envAccount session exists and is recent
    const existingSession = await sessionManager.loadSession('envAccount');
    
    if (existingSession) {
        console.log('[LoginStep] Found existing envAccount session, reusing cookies');
        await sessionManager.applySession(context, 'envAccount');
        await page.reload(); // Reload to apply cookies
        await page.goto(URLS.baseUrl);
        await expect(page.url()).toContain(URLS.baseUrl);
        console.log('[LoginStep] Session applied and homepage loaded');
    } else {
        console.log('[LoginStep] No valid envAccount session found, performing login');
        await testDataContext.loginPage.enterEmail(testAccount.email as string);
        await testDataContext.loginPage.clickContinue();
        await testDataContext.loginPage.enterPassword(testAccount.password as string);
        await testDataContext.loginPage.clickSignIn();
        await expect(page.url()).toContain(URLS.baseUrl);
        const cookies = await context.cookies();
        await sessionManager.saveSession('envAccount', cookies);
    }
});
Then('I should be logged in successfully', async({page, testDataContext}: {page: Page; testDataContext: TestDataContext}) => {
    await expect(page.url()).toContain(URLS.baseUrl);
    await expect(testDataContext.header.accountList).toBeVisible();
    await expect(testDataContext.header.accountList).toHaveText(/Hello, [\w\s]+/);
})
