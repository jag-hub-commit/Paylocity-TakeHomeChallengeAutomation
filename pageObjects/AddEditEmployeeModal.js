const { expect } = require('@playwright/test');

exports.AddEditEmployeeModal = class AddEditEmployeeModal {
    constructor(page) {
        this.page = page;
        this.modalContainer = page.locator("#employeeModal");
        this.firstName = this.modalContainer.locator("#firstName");
        this.lastName = this.modalContainer.locator("#lastName");
        this.dependent = this.modalContainer.locator("#dependants");
        this.addButton = this.modalContainer.locator("#addEmployee");
        this.updateButton = this.modalContainer.locator("#updateEmployee");
    }

    async addOrEditEmployee(firstName, lastName, dependent = 0, isEdit) {
        await this.modalContainer.waitFor({ state: 'visible' });

        await this.firstName.fill(firstName);
        await this.lastName.fill(lastName);
        await this.dependent.fill(dependent.toString());
        const actionButton = isEdit ? this.updateButton : this.addButton;
       
        // Wait for button to be clickable
        await actionButton.waitFor({ state: 'visible' });
        await actionButton.click();
        await expect(this.modalContainer).toBeHidden({ timeout: 10000 });
    }
}