exports.BenefitsDashboard = class BenefitsDashboard {
    constructor(page) {
        this.page = page;
        this.AddEmployeeButton = page.locator("#add");
        this.employeeTable = page.locator("#employeesTable");
    }

    async getEmployeeRow(name) {
        // Look for the specific name in the 3rd column (index 2)
        return this.page.locator("#employeesTable tbody tr").filter({
            has: this.page.locator('td').nth(2).filter({ hasText: name })
        });
    }

    async clickAddEmployeeButton() {
        await this.AddEmployeeButton.click();
    }

    async validateEmployeeDetailsInDashboard(name, colIndex) {
        const row = await this.getEmployeeRow(name);
        const cellValue = await row.locator('td').nth(colIndex).innerText();
        return cellValue.trim();
    }

    async clickEditIconButton(name) {
        const row = await this.getEmployeeRow(name);
        await row.locator(".fa-edit").click();
    }

    async clickDeleteIconButton(name) {
        const row = await this.getEmployeeRow(name);
        await row.locator(".fa-times").click();
    }
}