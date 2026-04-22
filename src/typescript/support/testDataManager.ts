import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as testConstants from './testData.constants';

export interface TestAccount {
    role: 'shared' | 'parallel';
    username: string;
    password?: string;
}

export interface TestDataConfig {
    accounts?: TestAccount[];
    urls?: Record<string, string>;
}

/**
 * TestDataManager handles loading and merging test data from config files and environment variables.
 * Environment variables take precedence over config file values.
 * 
 * Pattern:
 * - Non-sensitive defaults in testData.config.json (committed)
 * - Sensitive overrides via .env file (git-ignored)
 */
export class TestDataManager {
    private config: TestDataConfig;
    private configPath: string;

    constructor() {
        // Load environment variables from .env file
        dotenv.config();
        
        // Load config from testData.config.json
        this.configPath = path.join(__dirname, 'testData.config.json');
        this.config = this.loadConfig();
    }

    /**
     * Load config from file. If file doesn't exist, return empty config.
     */
    private loadConfig(): TestDataConfig {
        try {
            if (fs.existsSync(this.configPath)) {
                const rawData = fs.readFileSync(this.configPath, 'utf-8');
                return JSON.parse(rawData);
            }
        } catch (error) {
            console.warn(`Failed to load test data config from ${this.configPath}:`, error);
        }
        return {};
    }

    /**
     * Get a specific account by role.
     * Attempts to load password from environment variable if not in config.
     */
    public getAccount(role: 'shared' | 'parallel'): TestAccount | null {
        const account = this.config.accounts?.find(acc => acc.role === role);
        if (!account) {
            return null;
        }

        // Merge with environment variables (env vars take precedence)
        const envKey = role === 'shared' ? 'SHARED_ACCOUNT_PASSWORD' : 'PARALLEL_ACCOUNT_PASSWORD';
        const envPassword = process.env[envKey];

        return {
            ...account,
            password: envPassword || account.password,
        };
    }

    /**
     * Get test URL (base URL or specific endpoint).
     * Allows override via environment variable: TEST_BASE_URL
     */
    public getBaseUrl(): string {
        return process.env.TEST_BASE_URL || this.config.urls?.baseUrl || 'https://www.amazon.com/';
    }

    /**
     * Get all test constants directly.
     * Use this to access typed constants with full IDE support and autocomplete.
     * Example: testDataManager.getConstants().TIMEOUTS.pageLoad
     */
    public getConstants() {
        return testConstants;
    }

    /**
     * Get all accounts.
     */
    public getAllAccounts(): TestAccount[] {
        return this.config.accounts || [];
    }

    /**
     * Get all URLs.
     */
    public getAllUrls(): Record<string, string> {
        return this.config.urls || {};
    }
}

// Export singleton instance
export const testDataManager = new TestDataManager();
