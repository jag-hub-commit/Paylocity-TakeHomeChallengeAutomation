exports.DeleteModal = class DeleteModal {
    constructor(page) {
        this.page = page;    
        this.modalContainer = page.locator("#deleteModal");  
        this.deleteButton = this.modalContainer.locator("#deleteEmployee");
        this.firstNameText = this.modalContainer.locator("#deleteFirstName");
        this.lastNameText = this.modalContainer.locator("#deleteLastName");
        this.cancelButton = this.modalContainer.locator("button.btn-secondary", { hasText: 'Cancel' });
        this.closeIcon = this.modalContainer.locator("button.close");
        this.modalBodyMessage = this.modalContainer.locator(".modal-body .row");
    }

    async clickOnDeleteEmployeeButton() {
        await this.deleteButton.click();
        await this.modalContainer.waitFor({ state: 'hidden' });
    }

    async clickCancelModal() {
        await this.cancelButton.click();
        await this.modalContainer.waitFor({ state: 'hidden' });
    }

    async isDeleteEmployeeModalDisplayed() {
        await this.modalContainer.waitFor({ state: 'visible' });
        return await this.modalContainer.isVisible();
    }

    async getModalContentText() {
        return await this.modalBodyMessage.innerText();
    }
}