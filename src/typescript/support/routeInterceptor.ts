import { Page, Route } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export type NetworkErrorType = 'timedout' | 'aborted' | 'accessdenied' | 'blockedbyclient' | 'blockedbyresponse';

export interface MockErrorOptions {
    statusCode?: number;
    errorType?: NetworkErrorType;
    message?: string;
}

export interface MockResponseOptions {
    statusCode?: number;
    contentType?: string;
}

/**
 * RouteInterceptor provides a convenient wrapper around Playwright's page.route() for mocking API responses.
 * Supports HTTP errors, network errors, custom responses, and file-based responses.
 * 
 * Pattern:
 * - mockHttpError(urlPattern, statusCode) - Mock HTTP error (4xx, 5xx)
 * - mockNetworkError(urlPattern, errorType) - Mock network error (timeout, abort, etc.)
 * - mockResponse(urlPattern, responseBody) - Mock successful response with custom body
 * - mockResponseFromFile(urlPattern, jsonFilePath) - Mock response from JSON file
 * - clearMocks() - Remove all mocks
 */
export class RouteInterceptor {
    private page: Page;
    private registeredHandlers: Array<{ pattern: string | RegExp; handler: (route: Route) => Promise<void> }> = [];

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Mock an HTTP error response (4xx or 5xx).
     */
    public async mockHttpError(
        urlPattern: string | RegExp,
        statusCode: number,
        message?: string
    ): Promise<void> {
        const handler = async (route: Route) => {
            await route.abort('blockedbyclient');
        };

        // Store the pattern for later cleanup
        this.registeredHandlers.push({ pattern: urlPattern, handler });

        // Use a custom handler that responds with error status
        await this.page.route(urlPattern, async (route: Route) => {
            const errorResponse = {
                statusCode,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: true,
                    statusCode,
                    message: message || `HTTP ${statusCode}`,
                }),
            };

            try {
                await route.continue({ response: errorResponse } as any);
            } catch (error) {
                // Fallback: abort if route.continue fails
                await route.abort('blockedbyclient');
            }
        });

        console.log(`Mocked HTTP ${statusCode} error for: ${urlPattern}`);
    }

    /**
     * Mock a network error (timeout, connection refused, etc.).
     */
    public async mockNetworkError(
        urlPattern: string | RegExp,
        errorType: NetworkErrorType = 'timedout'
    ): Promise<void> {
        const handler = async (route: Route) => {
            await route.abort(errorType);
        };

        this.registeredHandlers.push({ pattern: urlPattern, handler });
        await this.page.route(urlPattern, handler);

        console.log(`Mocked network error (${errorType}) for: ${urlPattern}`);
    }

    /**
     * Mock a successful response with custom body.
     */
    public async mockResponse(
        urlPattern: string | RegExp,
        responseBody: Record<string, any> | string,
        statusCode: number = 200,
        contentType: string = 'application/json'
    ): Promise<void> {
        const handler = async (route: Route) => {
            const body = typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody);

            await route.continue({
                response: {
                    statusCode,
                    contentType,
                    body,
                },
            } as any);
        };

        this.registeredHandlers.push({ pattern: urlPattern, handler });
        await this.page.route(urlPattern, handler);

        console.log(`Mocked response for: ${urlPattern}`);
    }

    /**
     * Mock a response by loading JSON from a file.
     * Useful for complex or large mock responses.
     * 
     * @param urlPattern - URL pattern to intercept
     * @param jsonFilePath - Path to JSON file (relative to project root or absolute)
     * @param statusCode - HTTP status code (default: 200)
     * @param contentType - Content-Type header (default: application/json)
     * 
     * @example
     *
     **/
    public async mockResponseFromFile(
        urlPattern: string | RegExp,
        jsonFilePath: string,
        statusCode: number = 200,
        contentType: string = 'application/json'
    ): Promise<void> {
        // Resolve file path (support both relative and absolute paths)
        const resolvedPath = path.isAbsolute(jsonFilePath)
            ? jsonFilePath
            : path.resolve(process.cwd(), jsonFilePath);

        // Read and parse JSON file
        let responseBody: string;
        try {
            const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
            responseBody = fileContent;
            
            // Validate JSON
            JSON.parse(fileContent);
        } catch (error: any) {
            throw new Error(
                `Failed to load mock response from file "${jsonFilePath}" (resolved: "${resolvedPath}"): ${error.message}`
            );
        }

        // Apply the mock using existing mockResponse logic
        const handler = async (route: Route) => {
            await route.continue({
                response: {
                    statusCode,
                    contentType,
                    body: responseBody,
                },
            } as any);
        };

        this.registeredHandlers.push({ pattern: urlPattern, handler });
        await this.page.route(urlPattern, handler);

        console.log(`Mocked response from file: ${resolvedPath} for: ${urlPattern}`);
    }

    /**
     * Mock response with delay (to simulate slow network).
     */
    public async mockResponseWithDelay(
        urlPattern: string | RegExp,
        responseBody: Record<string, any> | string,
        delayMs: number,
        statusCode: number = 200,
        contentType: string = 'application/json'
    ): Promise<void> {
        const handler = async (route: Route) => {
            await new Promise(resolve => setTimeout(resolve, delayMs));

            const body = typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody);

            await route.continue({
                response: {
                    statusCode,
                    contentType,
                    body,
                },
            } as any);
        };

        this.registeredHandlers.push({ pattern: urlPattern, handler });
        await this.page.route(urlPattern, handler);

        console.log(`Mocked response with ${delayMs}ms delay for: ${urlPattern}`);
    }

    /**
     * Clear all registered mocks.
     */
    public async clearMocks(): Promise<void> {
        try {
            // Unroute all patterns
            for (const { pattern } of this.registeredHandlers) {
                await this.page.unroute(pattern);
            }
            this.registeredHandlers = [];
            console.log('All mocks cleared');
        } catch (error) {
            console.error('Error clearing mocks:', error);
        }
    }

    /**
     * Clear a specific mock.
     */
    public async clearMock(urlPattern: string | RegExp): Promise<void> {
        try {
            await this.page.unroute(urlPattern);
            this.registeredHandlers = this.registeredHandlers.filter(
                h => h.pattern !== urlPattern
            );
            console.log(`Mock cleared for: ${urlPattern}`);
        } catch (error) {
            console.error(`Error clearing mock for ${urlPattern}:`, error);
        }
    }

    /**
     * Get list of active mocks (for debugging).
     */
    public getActiveMocks(): string[] {
        return this.registeredHandlers.map(h => String(h.pattern));
    }
}
