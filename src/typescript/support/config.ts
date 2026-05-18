import { testDataManager } from './testDataLoader';

/**
 * Base URL configuration - integrates with TestDataManager
 * Allows override via TEST_BASE_URL environment variable
 */
export const LOCK_CONFIG = {
    timeout: 60000, // 60 seconds max wait for lock
    pollInterval: 100, // Check every 100ms if lock is available
    maxRetries: 5,
} as const;

export const SESSION_CONFIG = {
    sessionDir: '.sessions',
    lockDir: '.locks',
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
} as const;
export const TIMEOUTS = {
    pageLoad: 30000,
    element: 10000,
    login: 15000,
    networkError: 5000,
    lockWait: 120000,  // 2 minutes: Allow queued workers enough time to acquire lock
} as const;
/**
 * Export testDataManager for use throughout the application
 */
export { testDataManager } from './testDataLoader';
