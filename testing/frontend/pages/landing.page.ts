import {expect, type Page, type Locator} from '@playwright/test'

export class LandingPage {
    constructor(private readonly page: Page) {}

    logoutButton():Locator {
        return this.page.getByText('Log out')
    }

    landingHeader(): Locator {
        return this.page.getByText('Logged In Successfully');   
    }

    async logOut() {
        await this.logoutButton().click()
    }
}