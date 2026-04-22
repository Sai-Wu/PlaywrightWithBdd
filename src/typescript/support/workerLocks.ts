import * as fs from 'fs';
import * as path from 'path';
import { LOCK_CONFIG } from './testData.constants';

/**
 * WorkerLockManager handles file-based locks for serializing tests that share a common resource.
 * Useful for tests that use the same account and must not run concurrently.
 * 
 * Lock files are stored in .locks/ directory and are git-ignored.
 * Lock files contain metadata about the lock holder: timestamp and process ID.
 * 
 * Pattern:
 * - acquireLock(accountId, timeout) - Waits up to timeout ms to acquire lock
 * - releaseLock(accountId) - Release lock
 * - withLock(accountId, callback) - Acquire, run callback, release
 */
export class WorkerLockManager {
    private locksDir: string;

    constructor(locksDir: string = '.locks') {
        this.locksDir = locksDir;
        this.ensureLocksDir();
    }

    /**
     * Ensure .locks directory exists.
     */
    private ensureLocksDir(): void {
        if (!fs.existsSync(this.locksDir)) {
            fs.mkdirSync(this.locksDir, { recursive: true });
        }
    }

    /**
     * Get path to lock file for a given resource ID (e.g., accountId).
     */
    private getLockPath(resourceId: string): string {
        return path.join(this.locksDir, `${resourceId}.lock`);
    }

    /**
     * Check if lock file exists and is still valid (not stale).
     */
    private isLockValid(lockPath: string, stalenessThreshold: number = 5 * 60 * 1000): boolean {
        if (!fs.existsSync(lockPath)) {
            return false;
        }

        try {
            const stats = fs.statSync(lockPath);
            const lockAge = Date.now() - stats.mtimeMs;
            return lockAge < stalenessThreshold;
        } catch {
            return false;
        }
    }

    /**
     * Acquire lock for a resource. Waits up to timeout ms.
     * Throws error if lock cannot be acquired within timeout.
     * Uses exponential backoff to reduce polling overhead.
     */
    public async acquireLock(resourceId: string, timeout: number = LOCK_CONFIG.timeout): Promise<void> {
        const lockPath = this.getLockPath(resourceId);
        const lockData = JSON.stringify({
            timestamp: Date.now(),
            pid: process.pid,
            resourceId,
        });

        const startTime = Date.now();
        let pollInterval = LOCK_CONFIG.pollInterval as number;
        const maxPollInterval = 2000; // Cap backoff at 2 seconds

        while (Date.now() - startTime < timeout) {
            // Check if lock is available (doesn't exist or is stale)
            if (!this.isLockValid(lockPath)) {
                try {
                    // Try to write lock file atomically (fails if already exists on some OS)
                    fs.writeFileSync(lockPath, lockData, { flag: 'wx' });
                    return; // Lock acquired successfully
                } catch (error: any) {
                    // File already exists or permission error; try again after poll interval
                    if (error.code !== 'EEXIST') {
                        throw error; // Re-throw unexpected errors
                    }
                }
            }

            // Wait before retrying (exponential backoff to reduce CPU usage)
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            
            // Increase poll interval exponentially, but cap at maxPollInterval
            pollInterval = Math.min(pollInterval * 1.5, maxPollInterval);
        }

        throw new Error(
            `Failed to acquire lock for resource "${resourceId}" within ${timeout}ms. ` +
            `Lock may be held by another test. Check ${lockPath} for details.`
        );
    }

    /**
     * Release lock for a resource.
     * Silently ignores if lock doesn't exist.
     */
    public releaseLock(resourceId: string): void {
        const lockPath = this.getLockPath(resourceId);
        try {
            if (fs.existsSync(lockPath)) {
                fs.unlinkSync(lockPath);
            }
        } catch (error) {
            console.warn(`Failed to release lock for "${resourceId}":`, error);
        }
    }

    /**
     * Acquire lock, run callback, then release lock.
     * If callback throws, lock is still released.
     */
    public async withLock<T>(
        resourceId: string,
        callback: () => Promise<T>,
        timeout?: number
    ): Promise<T> {
        await this.acquireLock(resourceId, timeout);
        try {
            return await callback();
        } finally {
            this.releaseLock(resourceId);
        }
    }

    /**
     * Force-release all locks. Use with caution; only for cleanup.
     */
    public forceReleaseAllLocks(): void {
        try {
            if (fs.existsSync(this.locksDir)) {
                const files = fs.readdirSync(this.locksDir);
                for (const file of files) {
                    fs.unlinkSync(path.join(this.locksDir, file));
                }
            }
        } catch (error) {
            console.warn('Failed to force-release all locks:', error);
        }
    }

    /**
     * Clean up stale locks (older than threshold).
     * Useful to call at test suite start to prevent hung tests from leaving orphaned locks.
     */
    public cleanupStaleLocks(stalenessThreshold: number = 10 * 60 * 1000): void {
        try {
            if (!fs.existsSync(this.locksDir)) {
                return;
            }

            const files = fs.readdirSync(this.locksDir);
            for (const file of files) {
                const lockPath = path.join(this.locksDir, file);
                const stats = fs.statSync(lockPath);
                const lockAge = Date.now() - stats.mtimeMs;

                if (lockAge > stalenessThreshold) {
                    fs.unlinkSync(lockPath);
                    console.log(`Cleaned up stale lock: ${file} (age: ${lockAge}ms)`);
                }
            }
        } catch (error) {
            console.warn('Failed to clean up stale locks:', error);
        }
    }

    /**
     * Get current lock holders (for debugging).
     */
    public getLockStatus(): Record<string, { pid: number; timestamp: number; age: number }> {
        const status: Record<string, any> = {};

        try {
            if (!fs.existsSync(this.locksDir)) {
                return status;
            }

            const files = fs.readdirSync(this.locksDir);
            for (const file of files) {
                const lockPath = path.join(this.locksDir, file);
                const data = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
                const resourceId = file.replace('.lock', '');
                status[resourceId] = {
                    ...data,
                    age: Date.now() - data.timestamp,
                };
            }
        } catch (error) {
            console.warn('Failed to get lock status:', error);
        }

        return status;
    }
}

// Export singleton instance
export const workerLockManager = new WorkerLockManager();
