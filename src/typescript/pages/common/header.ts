import { expect, Locator, Page } from "@playwright/test";
export class Header{
    readonly page : Page;
    readonly homeLink : Locator;
    readonly accountList: Locator;
    readonly searchBar : Locator;
    readonly searchButton : Locator;
    constructor(page: Page) {
        this.page = page;
        this.homeLink = this.page.getByRole('link', { name: 'Amazon', exact: true });
        this.accountList = this.page.getByRole('link', { name: 'Account & Lists' });
        this.searchBar = this.page.getByRole('searchbox', { name: 'Search Amazon' });
        this.searchButton = this.page.getByRole('button', { name: 'Go', exact: true });
    }
    async clickHomeLink() {
        await this.homeLink.click();
    }
    get getAccountList() {
        return this.accountList;
    }
    async enterSearchTerm(term: string) {
        await this.searchBar.fill(term);
    }
    async clickSearchButton() {
        await expect(this.searchButton).toBeVisible({ timeout: 5000 });
        await expect(this.searchButton).toBeEnabled({ timeout: 5000 });
        await this.searchButton.highlight();
        await this.searchButton.click();
    }
}