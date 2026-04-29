import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as testConstants from './testData.constants';

/**
 * TestDataLoader loading test data from JSON files.
 * 
 * Pattern:
 * - Non-sensitive defaults in testData.config.json (committed)
 * - Sensitive overrides via .env file (git-ignored)
 */
export class TestDataLoader {

    constructor() {
    }
    
    /**
     * Loads test data from a JSON file.
     * @param file - Location is based on src/resources/testdata
     * @returns 
     */
    public async loadTestDataFrom(file : string) {
        const filePath = testConstants.TESTDATA_LOCATION + file;
        try {
            const data = await fs.promises.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Failed to load test data from ${filePath}:`, error);
            throw error;
        }
    }

}

// Export singleton instance
export const testDataManager = new TestDataLoader();
