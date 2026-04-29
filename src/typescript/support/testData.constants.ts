/**
 * Test data constants exported as TypeScript.
 * Used in tests for hardcoded values that don't change frequently.
 */

import path from "node:path";
export const testAccount = {
    email : process.env.USERNAME,
    password : process.env.PASSWORD,
};
export const TESTDATA_LOCATION = path.join(__dirname, '../../resources/testdata/');
export const TESTDATA_FILES = {
    mockResponses: 'response/mock-response.json',
};

export const ERROR_CODES = {
    notFound: 404,
    serverError: 500,
    unauthorized: 401,
    forbidden: 403,
    badRequest: 400,
    serviceUnavailable: 503,
} as const;

export const URLS = {
    baseUrl: 'https://www.amazon.com/',
    loginPage: 'https://www.amazon.com/ap/signin',
    homepage: 'https://www.amazon.com/',
    searchPage: 'https://www.amazon.com/s',
} as const;

export const SEARCH_TERMS = {
    electronics: 'laptop',
    books: 'playwright testing',
    home: 'coffee maker',
} as const;

export const MOCK_SCENARIOS = {
    notFound: { statusCode: 404, message: 'Not found' },
    serverError: { statusCode: 500, message: 'Internal server error' },
    unauthorized: { statusCode: 401, message: 'Unauthorized' },
    forbidden: { statusCode: 403, message: 'Forbidden' },
    timeout: { errorType: 'timedout', message: 'Request timeout' },
    connectionRefused: { errorType: 'aborted', message: 'Connection refused' },
} as const;
export const AXE_IMPACT_LEVELS = ['minor', 'moderate', 'serious', 'critical'] as const;
export const AXE_TAGS = {
    wcag2a: 'wcag2a',
    wcag2aa: 'wcag2aa',
    wcag2aaa: 'wcag2aaa',
    bestPractices: 'best-practices',
    experimental: 'experimental',
} as const;
export const AXE_TEST_CASE_LABELS = {
    homepage: 'Homepage Accessibility',
    searchPage: 'Search Page Accessibility',
    productPage: 'Product Page Accessibility',
} as const;
