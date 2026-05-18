import { Locator, Page, expect } from "@playwright/test";
import { ReusableMethods } from "../support/reusableMethods";
export class LoginPage {
    readonly page : Page;
    readonly emailInput : Locator;
    readonly continueButton : Locator;
    readonly passwordInput : Locator;
    readonly signInButton : Locator;
    constructor(page: Page) {
        this.page = page;
        this.emailInput = this.page.getByRole('textbox', { name: 'Enter mobile number or email' });
        this.continueButton = this.page.getByRole('button', { name: 'Continue' });
        this.passwordInput = this.page.getByRole('textbox', { name: 'Password' });
        this.signInButton = this.page.getByRole('button', { name: 'Sign in', exact: true });
    }
    async enterEmail(email: string) {
        await expect(this.emailInput).toBeVisible();
        await expect(this.emailInput).toBeEnabled();
        await this.emailInput.highlight();
        await this.emailInput.fill(email);
        await this.emailInput.blur(); // Trigger any validation or UI updates after entering the email
    }
    async clickContinue() {
        await expect(this.continueButton).toBeVisible({ timeout: 5000 });
        await expect(this.continueButton).toBeEnabled({ timeout: 5000 });
        await this.continueButton.highlight();
        await this.continueButton.click();
    }
    async enterPassword(password: string) {
        await expect(this.passwordInput).toBeVisible();
        await expect(this.passwordInput).toBeEnabled();
        await this.passwordInput.highlight();
        await this.passwordInput.fill(password);
        await this.passwordInput.blur(); // Trigger any validation or UI updates after entering the password
    }
    async clickSignIn() {
        await expect(this.signInButton).toBeVisible({ timeout: 5000 });
        await expect(this.signInButton).toBeEnabled({ timeout: 5000 });
        await this.signInButton.highlight();
        await this.signInButton.click();
    }
    async verifyLoginPageLoaded() {
        await ReusableMethods.waitForPageLoad(this.page);
        await this.emailInput.waitFor({ state: 'visible', timeout: 5000 });
        await expect(this.page.url()).toContain('/ap/signin');
        console.log('[LoginPage] Sign-in page is ready');
    }
}