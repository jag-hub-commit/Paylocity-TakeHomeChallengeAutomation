const { test, expect } = require('@playwright/test');
const { 
    generateRandomAlphabeticalString, 
    generateRandomDependentNumber, 
    calculateNetPaymentAndBenefitsDetailsOfEmployee 
} = require('../../utils/HelperClass');

const API_URL = 'https://wmxrwq14uc.execute-api.us-east-1.amazonaws.com/Prod/api/employees';
const AUTH_TOKEN = 'Basic VGVzdFVzZXI4OTM6ZTJyXk5RX1tTRmZG';

test.describe('Employee Benefits API Tests', () => {
    // Store Id For Test Data CleanUp
    let createdIds = [];

    test.use({
        extraHTTPHeaders: {
            'Authorization': AUTH_TOKEN,
            'Content-Type': 'application/json',
        }
    });

    test.afterEach(async ({ request }) => {
        for (const id of createdIds) {
            const response = await request.delete(`${API_URL}/${id}`);
            expect(response.status()).toBe(200);
        }
        createdIds = []; 
    });

 async function postEmployee(request, customData = {}) {
    const payload = {
        firstName: customData.firstName || generateRandomAlphabeticalString(6),
        lastName: customData.lastName || generateRandomAlphabeticalString(8),
        dependants: customData.dependants ?? generateRandomDependentNumber()
    };

    try {
        const response = await request.post(API_URL, { data: payload });
        // If status is not 200
        if (response.status() !== 200) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status()}: ${errorText}`);
        }
        const body = await response.json();
        // Store the ID for cleanup
        if (body.id) {
            createdIds.push(body.id);
        }

        return { sent: payload, received: body };

    } catch (error) {
        console.error(`PostEmployee Method Failed! Payload: ${JSON.stringify(payload)}`);
        console.error(`Error Details: ${error.message}`);
        throw error; 
    }
}

    test('Validate Creation Of An Employee and Verify Benefit Calculations Of The Employee ', async ({ request }) => {
        const { sent, received } = await postEmployee(request);
        const [expectedBenefits, expectedNetPay] = calculateNetPaymentAndBenefitsDetailsOfEmployee(sent.dependants);

        //Validate employee details and benefit calculations
        expect(received.firstName).toBe(sent.firstName);
        expect(received.lastName).toBe(sent.lastName);
        expect(received.dependants).toBe(sent.dependants); 
        expect(received.benefitsCost).toBeCloseTo(expectedBenefits, 2);
        expect(received.net).toBeCloseTo(expectedNetPay, 2);
    });

    test('Get An Individual Employee By ID', async ({ request }) => {
        const { received } = await postEmployee(request, { firstName: 'Fetch' });     
        const getResponse = await request.get(`${API_URL}/${received.id}`);
        expect(getResponse.status()).toBe(200);     
        const fetchedData = await getResponse.json();
        expect(fetchedData.id).toBe(received.id);
        //Validate employee details and benefit calculations
        expect(received.firstName).toBe(fetchedData.firstName);
        expect(received.lastName).toBe(fetchedData.lastName);
        expect(received.dependants).toBe(fetchedData.dependants); 
    });

    test('Delete An Employee And Verify It Is Removed', async ({ request }) => {
        const { received } = await postEmployee(request, { firstName: 'DeleteMe' });

        const deleteResponse = await request.delete(`${API_URL}/${received.id}`);
        expect(deleteResponse.status()).toBe(200);

        // Remove from cleanup array since we deleted it in this testcase
        createdIds = createdIds.filter(id => id !== received.id);
        const listResponse = await request.get(API_URL);
        const allEmployees = await listResponse.json();
        expect(allEmployees.some(emp => emp.id === received.id)).toBe(false);
    });

    test('Update Employee Details And Validate It Is Updated Successfully', async ({ request }) => {
        //Initial Payload
        const { received } = await postEmployee(request, { 
            firstName: 'Update', 
            lastName: 'Initial', 
            dependants: 2 
        });

        const updatedLastName = 'Modified';
        const updatedDependants = 5;
        const [updatedExpectedBenefits, updatedExpectedNetPay] = calculateNetPaymentAndBenefitsDetailsOfEmployee(updatedDependants);

        //Updated Payload
        const putPayload = {
            id: received.id,
            firstName: received.firstName,
            lastName: updatedLastName,
            dependants: updatedDependants
        };

        const putResponse = await request.put(API_URL, { data: putPayload });
        expect(putResponse.status()).toBe(200);

        const getResponse = await request.get(`${API_URL}/${received.id}`);
        const finalData = await getResponse.json();

        //Validate Employee is Updated
        //Validate Id and First Name is same as the post Payload
        expect(finalData.id).toBe(received.id);
        expect(finalData.firstName).toBe(received.firstName);
        expect(finalData.lastName).toBe(updatedLastName);
        expect(finalData.dependants).toBe(updatedDependants);
        expect(finalData.benefitsCost).toBeCloseTo(updatedExpectedBenefits, 2);
        expect(finalData.net).toBeCloseTo(updatedExpectedNetPay, 2);
    });

    test('Validation Errors For Invalid Post Payload', async ({ request }) => {
        const invalidPayload = {
            firstName: "", 
            lastName: "A".repeat(51), 
            dependants: 33
        };

        const response = await request.post(API_URL, { data: invalidPayload });
        expect(response.status()).toBe(400);

        const errorResponse = await response.json();
        const messages = errorResponse.map(err => err.errorMessage);

        expect(messages).toContain("The FirstName field is required.");
        expect(messages).toContain("The field LastName must be a string with a maximum length of 50.");
        expect(messages).toContain("The field Dependants must be between 0 and 32.");
    });

    test('Validation Errors For Invalid Put Payload', async ({ request }) => {
        const { received } = await postEmployee(request, { firstName: 'Valid', lastName: 'User' });

        const invalidPutPayload = {
            id: received.id,
            firstName: "A".repeat(51), 
            lastName: "", 
            dependants: -5 
        };

        const response = await request.put(API_URL, { data: invalidPutPayload });
        expect(response.status()).toBe(400);

        const errorResponse = await response.json();
        const errorMessages = errorResponse.map(err => err.errorMessage);
        
        expect(errorMessages).toContain("The field FirstName must be a string with a maximum length of 50.");
        expect(errorMessages).toContain("The LastName field is required.");  
        expect(errorMessages).toContain("The field Dependants must be between 0 and 32.");
    });
});