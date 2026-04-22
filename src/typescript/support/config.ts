import { testDataManager } from './testDataManager';

/**
 * Base URL configuration - integrates with TestDataManager
 * Allows override via TEST_BASE_URL environment variable
 */
export const baseUrl = testDataManager.getBaseUrl();

/**
 * Export testDataManager for use throughout the application
 */
export { testDataManager } from './testDataManager';
