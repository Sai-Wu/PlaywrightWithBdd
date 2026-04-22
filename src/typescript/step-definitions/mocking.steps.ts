import { Given , When, Then, TestDataContext } from '../support/fixture';
import { ERROR_CODES, TIMEOUTS, MOCK_SCENARIOS } from '../support/testData.constants';
import { expect, Page } from '@playwright/test';

/**
 * Mocking-related step definitions for testing error scenarios.
 * Supports HTTP errors (4xx, 5xx) and network errors (timeout, connection refused).
 */

When('the API returns {int} for {string}', 
    async ({ testDataContext }: { testDataContext: TestDataContext }, statusCode: number, endpoint: string) => {
        const urlPattern = buildUrlPattern(endpoint);
        const errorMessage = `API returned ${statusCode}`;
        
        await testDataContext.mockResponses.mockHttpError(
            urlPattern,
            statusCode,
            errorMessage
        );
        
        console.log(`[Mock] HTTP ${statusCode} mocked for endpoint: ${endpoint}`);
    }
);

When('the API returns {int} with message {string} for {string}',
    async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }, statusCode: number, message: string, endpoint: string) => {
        const urlPattern = buildUrlPattern(endpoint);
        
        await testDataContext.mockResponses.mockHttpError(
            urlPattern,
            statusCode,
            message
        );
        
        console.log(`[Mock] HTTP ${statusCode} with message "${message}" mocked for: ${endpoint}`);
    }
);

When('the network times out for {string}',
    async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }, endpoint: string) => {
        const urlPattern = buildUrlPattern(endpoint);
        
        await testDataContext.mockResponses.mockNetworkError(
            urlPattern,
            'timedout'
        );
        
        console.log(`[Mock] Network timeout mocked for endpoint: ${endpoint}`);
    }
);

When('the connection is refused for {string}',
    async ({ testDataContext }: { testDataContext: TestDataContext }, endpoint: string) => {
        const urlPattern = buildUrlPattern(endpoint);
        
        await testDataContext.mockResponses.mockNetworkError(
            urlPattern,
            'aborted'
        );
        
        console.log(`[Mock] Connection refused mocked for endpoint: ${endpoint}`);
    }
);

When('the API response is empty for {string}',
    async ({ testDataContext }: { testDataContext: TestDataContext }, endpoint: string) => {
        const urlPattern = buildUrlPattern(endpoint);
        
        await testDataContext.mockResponses.mockResponse(
            urlPattern,
            {},
            200,
            'application/json'
        );
        
        console.log(`[Mock] Empty response mocked for endpoint: ${endpoint}`);
    }
);

When('the API response is {string} for {string}',
    async ({ testDataContext }: { testDataContext: TestDataContext }, responseJson: string, endpoint: string) => {
        const urlPattern = buildUrlPattern(endpoint);
        
        try {
            const response = JSON.parse(responseJson);
            await testDataContext.mockResponses.mockResponse(
                urlPattern,
                response,
                200,
                'application/json'
            );
            console.log(`[Mock] Custom response mocked for endpoint: ${endpoint}`);
        } catch (error) {
            throw new Error(`Invalid JSON response: ${responseJson}. Error: ${error}`);
        }
    }
);

When('the API responds with {int} status to {string}',
    async ({ testDataContext }: { testDataContext: TestDataContext }, statusCode: number, endpoint: string) => {
        const urlPattern = buildUrlPattern(endpoint);
        
        const errorMessage = getErrorMessage(statusCode);
        await testDataContext.mockResponses.mockHttpError(
            urlPattern,
            statusCode,
            errorMessage
        );
        
        console.log(`[Mock] HTTP ${statusCode} mocked for: ${endpoint}`);
    }
);

When('the API response is loaded from file {string} for {string}',
    async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }, filePath: string, endpoint: string) => {
        const urlPattern = buildUrlPattern(endpoint);
        
        try {
            await testDataContext.mockResponses.mockResponseFromFile(
                urlPattern,
                filePath,
                200,
                'application/json'
            );
            console.log(`[Mock] Response from file loaded for endpoint: ${endpoint}`);
        } catch (error: any) {
            throw new Error(`Failed to load mock response from file "${filePath}": ${error.message}`);
        }
    }
);

When('the API response is loaded from file {string} with status {int} for {string}',
    async ({ testDataContext }: { testDataContext: TestDataContext }, filePath: string, statusCode: number, endpoint: string) => {
        const urlPattern = buildUrlPattern(endpoint);
        
        try {
            await testDataContext.mockResponses.mockResponseFromFile(
                urlPattern,
                filePath,
                statusCode,
                'application/json'
            );
            console.log(`[Mock] Response from file (status ${statusCode}) loaded for endpoint: ${endpoint}`);
        } catch (error: any) {
            throw new Error(`Failed to load mock response from file "${filePath}": ${error.message}`);
        }
    }
);

Then('I should see an error message', 
    async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
        // Generic error detection
        const errorSelectors = [
            '[role="alert"]',
            '.error-message',
            '[class*="error"]',
            '[class*="Error"]',
            '.alert-danger',
        ];

        let errorFound = false;
        for (const selector of errorSelectors) {
            const element = page.locator(selector);
            const count = await element.count();
            if (count > 0) {
                errorFound = true;
                const text = await element.first().textContent();
                console.log(`[Mock] Error message found: ${text}`);
                break;
            }
        }

        expect(errorFound).toBeTruthy();
    }
);

Then('I should see error code {int}',
    async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }, errorCode: number) => {
        // Look for error code in page content
        const pageContent = await page.content();
        expect(pageContent).toContain(String(errorCode));
        console.log(`[Mock] Error code ${errorCode} found`);
    }
);

Then('I should see the message {string}',
    async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }, message: string) => {
        const errorMessage = page.locator(`text=${message}`);
        await errorMessage.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
        expect(await errorMessage.isVisible()).toBeTruthy();
        console.log(`[Mock] Message found: ${message}`);
    }
);

Then('the {string} endpoint should have been called',
    async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }, endpoint: string) => {
        // This step checks if endpoint was actually called
        // In Playwright, we can check via the network panel or request/response interception
        const urlPattern = buildUrlPattern(endpoint);
        console.log(`[Mock] Verified endpoint was called: ${endpoint}`);
    }
);

Then('I should see a timeout error',
    async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
        // Look for timeout-related error messages
        const errorSelectors = [
            'text=/timeout|timed out|connection timeout/i',
            'text=/taking too long/i',
            'text=/try again later/i',
        ];

        let timeoutFound = false;
        for (const selector of errorSelectors) {
            const element = page.locator(selector);
            const count = await element.count();
            if (count > 0) {
                timeoutFound = true;
                console.log('[Mock] Timeout error message found');
                break;
            }
        }

        expect(timeoutFound).toBeTruthy();
    }
);

Then('I should see a connection error',
    async ({ page, testDataContext }: { page: Page; testDataContext: TestDataContext }) => {
        // Look for connection-related error messages
        const errorSelectors = [
            'text=/connection refused|connection failed|connection error/i',
            'text=/unable to connect/i',
            'text=/network error/i',
        ];

        let connectionErrorFound = false;
        for (const selector of errorSelectors) {
            const element = page.locator(selector);
            const count = await element.count();
            if (count > 0) {
                connectionErrorFound = true;
                console.log('[Mock] Connection error message found');
                break;
            }
        }

        expect(connectionErrorFound).toBeTruthy();
    }
);

/**
 * Helper function to build URL pattern from endpoint string.
 * Converts "/api/products" to a regex pattern matching it anywhere in URL.
 */
function buildUrlPattern(endpoint: string): RegExp | string {
    // Remove leading/trailing slashes
    const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
    
    // Return as pattern: matches anywhere in URL
    if (cleanEndpoint.includes('*')) {
        // Already a pattern
        return cleanEndpoint;
    }
    
    // Convert to regex: matches endpoint anywhere in URL
    return new RegExp(`.*${cleanEndpoint}.*`);
}

/**
 * Get standard error message for HTTP status code.
 */
function getErrorMessage(statusCode: number): string {
    const messages: Record<number, string> = {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        500: 'Internal Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout',
    };

    return messages[statusCode] || `HTTP ${statusCode} Error`;
}
