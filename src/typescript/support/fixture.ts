import {test as base, expect, Page } from '@playwright/test';
import { test as bddBase, createBdd } from 'playwright-bdd';
import AxeBuilder from '@axe-core/playwright';
import { CreateReport } from 'axe-html-reporter';
import * as Pages from '../pages';
export type AxeImpact = 'minor' | 'moderate' | 'serious' | 'critical';
export interface AccessibilityOptions{
    include?: string[];
    exclude?: string[];
    impactThreshold?: AxeImpact;
    tags?: string[];
    testCaseLabel?: string;
}
export type TestDataContext = {
    homePage : Pages.HomePage;
}
const bdd = createBdd(bddBase) as any;
export const { Given, When, Then} = bdd || {}; 
export const bddTest = bddBase.extend<{testDataContext : TestDataContext}>({
    testDataContext: async ({page}, use, testInfo) => {
        await buildTestDataContext({page}, use, testInfo);
    }
})
async function buildTestDataContext( 
    {page} : {page: Page},
    use: (v : TestDataContext) => Promise<void>,
    testInfo: any ): Promise<void> {
    let _homePage : Pages.HomePage | null = null;

    const testDataContext: TestDataContext = {
        get homePage(){
            if(!_homePage){
                _homePage = new Pages.HomePage(page);
            }
            return _homePage;
        }
    }
    await use(testDataContext);
}