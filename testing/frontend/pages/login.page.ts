// @ts-check
import { type Page, type Locator } from '@playwright/test';
import {env} from '../../../utils/env'

export class LoginPage {
    constructor(private readonly page: Page) {}

    userField(): Locator {
        return this.page.locator('#username')
    }

    passwordField(): Locator {
        return this.page.locator('#password')
    }

    submitButton(): Locator {
        return this.page.locator('#submit')
    }

    wrongUserError(): Locator {
        return this.page.getByText('Your username is invalid!').first()
    }

    wrongPasswordError(): Locator {
        return this.page.getByText('Your password is invalid!').first()
    }

    async open() {
        await this.page.goto(env.uiUrl)
    }

    async fillUser(username: string) {
        await this.userField().fill(username)
    }

    async fillPassword(password: string) {
        await this.passwordField().fill(password)
    }

    async clickSubmit() {
        await this.submitButton().click()
    }

    
}