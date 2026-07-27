import { expect, test} from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import {env} from '../../../utils/env'
import { LandingPage } from '../pages/landing.page';


test.describe('Login tests', () => {

    test('Correct login test', async ({page}) => {
        const loginPage = new LoginPage(page)

        await loginPage.open()
        await loginPage.fillUser(env.user.username)
        await loginPage.fillPassword(env.user.password)
        await loginPage.clickSubmit()
        
        const landingPage = new LandingPage(page)
        await expect(landingPage.landingHeader()).toBeVisible()
    })

    test('Incorrect password test', async ({page}) => {
        const loginPage = new LoginPage(page)
        
        await loginPage.open()
        await loginPage.fillUser(env.user.username)
        await loginPage.fillPassword('wrongPassword')
        await loginPage.clickSubmit()
        
        const landingPage = new LandingPage(page)
        await expect(landingPage.landingHeader()).toBeHidden()
        await expect(loginPage.wrongPasswordError()).toBeVisible()
    })

    test('Incorrect user test', async ({page}) => {
        const loginPage = new LoginPage(page)
        
        await loginPage.open()
        await loginPage.fillUser('notUser')
        await loginPage.fillPassword(env.user.password)
        await loginPage.clickSubmit()

        const landingPage = new LandingPage(page)
        await expect(landingPage.landingHeader()).toBeHidden()
        await expect(loginPage.wrongUserError()).toBeVisible()
    })
})
