import { Given, When, Then, TestDataContext } from '../support/fixture';
import { TestDataLoader } from '../support/testDataLoader';
import { sessionManager } from '../support/sessionManager';
import { expect, Page, BrowserContext } from '@playwright/test';
import { testAccount, URLS } from '../support/testData.constants';

Then('I should see the login page', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    await testDataContext.loginPage.verifyLoginPageLoaded();
});
When('I navigate to the login page from the homepage', async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
    await testDataContext.homePage.verifyHomePageLoaded();
    await testDataContext.homePage.clickAccountList();
});
When('I login with credentials', async ({ testDataContext, context, page }: { testDataContext: TestDataContext; context: BrowserContext; page: Page }) => { 
    await testDataContext.loginPage.enterEmail(testAccount.email as string);
    await testDataContext.loginPage.clickContinue();
    await testDataContext.loginPage.enterPassword(testAccount.password as string);
    await testDataContext.loginPage.clickSignIn();
    await page.url().includes(URLS.baseUrl);
    const cookies = await context.cookies();
    await sessionManager.saveSession('envAccount', cookies);
});