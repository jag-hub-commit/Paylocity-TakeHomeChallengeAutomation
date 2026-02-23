const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pageObjects/LoginPage');
const { BenefitsDashboard } = require('../../pageObjects/BenefitsDashboard');
const { AddEditEmployeeModal } = require('../../pageObjects/AddEditEmployeeModal');
const { DeleteModal } = require('../../pageObjects/DeleteModal');
const { generateRandomAlphabeticalString, generateRandomDependentNumber, netPaymentAndBenefitsDetailsOfEmployee } = require('../../utils/HelperClass');

test.describe.configure({ mode: 'serial' });

test.describe('Employee Benefits UI Tests', () => {
    let page, dashboard, modal, delModal;
    let employeeNameForCleanup = null;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        dashboard = new BenefitsDashboard(page);
        modal = new AddEditEmployeeModal(page);
        delModal = new DeleteModal(page);

        const loginPage = new LoginPage(page);
        await loginPage.LoginIntoApplication(
            "https://wmxrwq14uc.execute-api.us-east-1.amazonaws.com/Prod/Account/LogIn", 
            "TestUser893", "e2r^NQ_[SFfF"
        );
    });

    //Validates all columns and handles ID check for update testcase  
    async function verifyEmployeeRowDetails(name, dependants, expectedId = null) {
        const [benefits, netPay] = netPaymentAndBenefitsDetailsOfEmployee(dependants);
        
        // Grab the ID from the first column (index 0)
        const actualId = (await dashboard.validateEmployeeDetailsInDashboard(name, 0)).trim();
        
        if (expectedId) {
            expect(actualId, "Employee ID should remain unchanged after update").toBe(expectedId);
        }

        //Keeping Last Name and First Name same as UI has it flipped (BUG)
        const expectedDetails = [
            name,               
            name,               
            dependants.toString(),
            "52000.00",
            "2000.00",
           Number(benefits).toFixed(2), 
           Number(netPay).toFixed(2)    
        ];

        for (let i = 0; i < expectedDetails.length; i++) {
            const actualValue = await dashboard.validateEmployeeDetailsInDashboard(name, i + 1);
            expect(actualValue.trim()).toBe(expectedDetails[i]);
        }
        return actualId; 
    }

    test.afterEach(async () => {
        if (employeeNameForCleanup) {
            const deleteBtn = page.locator("#employeesTable tbody tr")
                .filter({ has: page.locator('td').filter({ hasText: employeeNameForCleanup }) })
                .locator(".fa-times");

            if (await deleteBtn.count() > 0) {
                await deleteBtn.first().click();
                await page.locator("#deleteEmployee").click();
                await expect(page.locator("#deleteModal")).toBeHidden();
            }
            employeeNameForCleanup = null;
        }
    });

    test('1. Add and Verify Employee Details Including Benefit Calculation', async () => {
        const name = "User" + generateRandomAlphabeticalString(5); 
        const dependents = generateRandomDependentNumber();
        employeeNameForCleanup = name;

        await dashboard.clickAddEmployeeButton();
        await modal.addOrEditEmployee(name, name, dependents, false);

        await verifyEmployeeRowDetails(name, dependents);
    });

    test('2. Edit Employee Details and Verify The New Updated Details', async () => {
        const originalName = "Orig" + generateRandomAlphabeticalString(5);
        const updatedName = "Edit" + generateRandomAlphabeticalString(5);
        const initialDeps = 0;
        const updatedDeps = generateRandomDependentNumber();
        
        //  Add Employee
        await dashboard.clickAddEmployeeButton();
        await modal.addOrEditEmployee(originalName, originalName, initialDeps, false);

        // Store Id After Employee Creation So We Can Match Its Same Once The Employee Details Is Updated
        const originalId = await verifyEmployeeRowDetails(originalName, initialDeps);
        console.log(`Captured Employee ID: ${originalId}`);

        // Edit Employee Details
        await dashboard.clickEditIconButton(originalName);
        await modal.updateButton.waitFor({ state: 'visible' });
        await modal.addOrEditEmployee(updatedName, updatedName, updatedDeps, true);
        
        employeeNameForCleanup = updatedName; 

        // Verify details AND check that the ID matches the originalId
        await verifyEmployeeRowDetails(updatedName, updatedDeps, originalId);
    });

    test('3. Delete Employee and Verify It Is Removed From DashBoard', async () => {
        const name = "Del" + generateRandomAlphabeticalString(5);
        await dashboard.clickAddEmployeeButton();
        await modal.addOrEditEmployee(name, name, 0, false);
        await dashboard.clickDeleteIconButton(name);
        await delModal.clickOnDeleteEmployeeButton();   
        const row = page.locator("#employeesTable tbody tr").filter({ hasText: name });
        await expect(row).toHaveCount(0);
    });

    test.afterAll(async () => { 
        if (page) await page.close(); 
    });
});