import {test as base, expect, Page, BrowserContext, TestInfo } from '@playwright/test';
import { test as bddBase, createBdd } from 'playwright-bdd';
import AxeBuilder from '@axe-core/playwright';
import { CreateReport } from 'axe-html-reporter';
import * as Pages from '../pages';
import { RouteInterceptor } from './routeInterceptor';
import { testDataManager } from './testDataManager';
import { workerLockManager } from './workerLocks';
import { sessionManager } from './sessionManager';
export type AxeImpact = 'minor' | 'moderate' | 'serious' | 'critical';
export interface AccessibilityOptions{
    include?: string[];
    exclude?: string[];
    impactThreshold?: AxeImpact;
    tags?: string[];
    testCaseLabel?: string;
}
export interface TestDataContext {
    homePage: Pages.HomePage;
    searchPage: Pages.SearchPage;
    eventPage: Pages.EventPage;
    header: Pages.Header;
    mockResponses: RouteInterceptor;
}
const bdd = createBdd(bddBase) as any;
export const { Given, When, Then} = bdd; 
export const bddTest = bddBase.extend<{testDataContext : TestDataContext}>({
    testDataContext: async ({page}, use, testInfo) => {
        await buildTestDataContext({page, testInfo}, use);
    }
})
async function buildTestDataContext( 
    {page, testInfo} : {page: Page; testInfo: TestInfo},
    use: (v : TestDataContext) => Promise<void> ): Promise<void> {
    let _homePage: Pages.HomePage | null = null;
    let _searchPage: Pages.SearchPage | null = null;
    let _eventPage: Pages.EventPage | null = null;
    let _header: Pages.Header | null = null;
    let _mockResponses: RouteInterceptor | null = null;
    let _lockAcquired = false;
    let _lockedAccountId: string | null = null;

    // Automatic lock acquisition based on @existingUser tag
    const hasExistingUserTag = testInfo.tags.includes('@existingUser');
    const hasNewUserTag = testInfo.tags.includes('@newUser');
    
    if (hasExistingUserTag) {
        // Acquire lock for shared account before any step runs
        try {
            const sharedAccount = testDataManager.getAccount('shared');
            if (!sharedAccount) {
                throw new Error(
                    '[Fixture Setup] No shared account configured. ' +
                    'Check testData.config.json for shared account definition.'
                );
            }
            
            const accountId = sharedAccount.username; // Use username as unique account identifier
            
            console.log(`[Fixture Setup] Acquiring lock for @existingUser test: ${testInfo.title}`);
            await workerLockManager.acquireLock(accountId);
            _lockAcquired = true;
            _lockedAccountId = accountId;
            console.log(`[Fixture Setup] Lock acquired for account: ${accountId}`);
        } catch (error) {
            console.error(`[Fixture Setup] Failed to acquire lock:`, error);
            throw error;
        }
    } else if (hasNewUserTag) {
        // No lock needed for @newUser tests
        console.log(`[Fixture Setup] Skipping lock acquisition for @newUser test: ${testInfo.title}`);
    }

    const testDataContext: TestDataContext = {
        get homePage() {
            if (!_homePage) {
                _homePage = new Pages.HomePage(page);
            }
            return _homePage;
        },
        get searchPage() {
            if (!_searchPage) {
                _searchPage = new Pages.SearchPage(page);
            }
            return _searchPage;
        },
        get eventPage() {
            if (!_eventPage) {
                _eventPage = new Pages.EventPage(page);
            }
            return _eventPage;
        },
        get header() {
            if (!_header) {
                _header = new Pages.Header(page);
            }
            return _header;
        },
        get mockResponses() {
            if (!_mockResponses) {
                _mockResponses = new RouteInterceptor(page);
            }
            return _mockResponses;
        }
    }
    
    await use(testDataContext);

    // Cleanup: Clear all mocks after test
    if (_mockResponses !== null && _mockResponses !== undefined) {
        await (_mockResponses as RouteInterceptor).clearMocks();
    }
    
    // Cleanup: Release lock if it was acquired during setup
    if (_lockAcquired && _lockedAccountId) {
        try {
            console.log(`[Fixture Teardown] Releasing lock for account: ${_lockedAccountId}`);
            workerLockManager.releaseLock(_lockedAccountId);
            console.log(`[Fixture Teardown] Lock released successfully`);
        } catch (error) {
            console.warn(`[Fixture Teardown] Failed to release lock:`, error);
        }
    }
}

// Export managers for use in step definitions and tests
export { testDataManager, TestDataManager } from './testDataManager';
export { workerLockManager, WorkerLockManager } from './workerLocks';
export { sessionManager, SessionManager } from './sessionManager';
export { RouteInterceptor } from './routeInterceptor';