exports.LoginPage = class LoginPage {
    constructor(page) {
        this.page = page;
        this.userNameInput = page.locator("#Username");
        this.passwordInput = page.locator("#Password");
        this.loginButton = page.locator("button.btn-primary");
    }

    async LoginIntoApplication(url, user, pass) {
        await this.page.goto(url);
        await this.userNameInput.fill(user);
        await this.passwordInput.fill(pass);
        await this.loginButton.click();
        //Waiting till add employee button is enabled in benefits dashboard
        await this.page.getByRole('button', { name: 'Add Employee' }).waitFor({ state: 'visible' });
    }
}