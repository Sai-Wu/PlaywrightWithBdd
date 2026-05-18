import * as fs from 'fs';
import * as path from 'path';
import { BrowserContext } from '@playwright/test';
import { SESSION_CONFIG } from './config';

export interface StoredSession {
    accountRole: 'shared' | 'parallel' | 'envAccount';
    cookies: any[];
    localStorage?: Record<string, string>;
    sessionStorage?: Record<string, string>;
    timestamp: number;
}

/**
 * SessionManager handles storing and loading authentication sessions (cookies, tokens, etc.).
 * Allows tests to reuse existing sessions instead of logging in every time.
 * 
 * Pattern:
 * - saveSession(accountRole, cookies) - Store session to disk
 * - loadSession(accountRole) - Load session from disk
 * - applySession(context, accountRole) - Apply stored session to a browser context
 * - clearSession(accountRole) - Delete stored session
 * 
 * Sessions are stored in .sessions/ directory as JSON files (git-ignored).
 */
export class SessionManager {
    private sessionsDir: string;
    private sessionTimeout: number;

    constructor(
        sessionsDir: string = SESSION_CONFIG.sessionDir,
        sessionTimeout: number = SESSION_CONFIG.sessionTimeout
    ) {
        this.sessionsDir = sessionsDir;
        this.sessionTimeout = sessionTimeout;
        this.ensureSessionsDir();
    }

    /**
     * Ensure .sessions directory exists.
     */
    private ensureSessionsDir(): void {
        if (!fs.existsSync(this.sessionsDir)) {
            fs.mkdirSync(this.sessionsDir, { recursive: true });
        }
    }

    /**
     * Get path to session file for a given account role.
     */
    private getSessionPath(accountRole: 'shared' | 'parallel' | 'envAccount'): string {
        return path.join(this.sessionsDir, `${accountRole}-session.json`);
    }

    /**
     * Check if session file exists and is not expired.
     * Also validates that cookies haven't expired based on their expires property.
     * Automatically deletes expired session files to keep storage clean.
     */
    private isSessionValid(sessionPath: string): boolean {
        if (!fs.existsSync(sessionPath)) {
            return false;
        }

        try {
            const data = JSON.parse(fs.readFileSync(sessionPath, 'utf-8')) as StoredSession;
            
            // Check session age
            const sessionAge = Date.now() - data.timestamp;
            if (sessionAge >= this.sessionTimeout) {
                console.log('[SessionManager] Session expired: too old, deleting...');
                fs.unlinkSync(sessionPath);
                return false;
            }

            // Check if any cookies have expired
            if (data.cookies && data.cookies.length > 0) {
                const now = Date.now();
                const hasValidCookies = data.cookies.some(cookie => {
                    // If no expires property, treat as session cookie (valid)
                    if (!cookie.expires) {
                        return true;
                    }
                    // expires is typically in seconds for Playwright cookies
                    // Convert to milliseconds if necessary
                    const expiresMs = typeof cookie.expires === 'number' && cookie.expires < 10000000000 
                        ? cookie.expires * 1000 
                        : cookie.expires;
                    return expiresMs > now;
                });

                if (!hasValidCookies) {
                    console.log('[SessionManager] Session expired: all cookies have expired, deleting...');
                    fs.unlinkSync(sessionPath);
                    return false;
                }
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Save session (cookies, localStorage, sessionStorage) to disk.
     */
    public async saveSession(
        accountRole: 'shared' | 'parallel' | 'envAccount',
        cookies: any[],
        localStorage?: Record<string, string>,
        sessionStorage?: Record<string, string>
    ): Promise<void> {
        const sessionPath = this.getSessionPath(accountRole);
        const session: StoredSession = {
            accountRole,
            cookies,
            localStorage,
            sessionStorage,
            timestamp: Date.now(),
        };

        try {
            fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2), 'utf-8');
            console.log(`Session saved for account role "${accountRole}" at ${sessionPath}`);
        } catch (error) {
            console.error(`Failed to save session for account role "${accountRole}":`, error);
            throw error;
        }
    }

    /**
     * Load session from disk.
     * Returns null if session doesn't exist or is expired.
     */
    public async loadSession(accountRole: 'shared' | 'parallel' | 'envAccount'): Promise<StoredSession | null> {
        const sessionPath = this.getSessionPath(accountRole);
        console.log(`Attempting to load session for account role "${accountRole}" from ${sessionPath}`);
        if (!this.isSessionValid(sessionPath)) {
            console.log(
                `Session not found or expired for account role "${accountRole}" at ${sessionPath}`
            );
            return null;
        }

        try {
            const data = JSON.parse(fs.readFileSync(sessionPath, 'utf-8')) as StoredSession;
            const sessionAge = Date.now() - data.timestamp;
            console.log(
                `Loaded session for account role "${accountRole}" (age: ${sessionAge}ms)`
            );
            return data;
        } catch (error) {
            console.error(`Failed to load session for account role "${accountRole}":`, error);
            return null;
        }
    }

    /**
     * Apply stored session to a browser context (add cookies, localStorage, etc.).
     */
    public async applySession(
        context: BrowserContext,
        accountRole: 'shared' | 'parallel' | 'envAccount'
    ): Promise<boolean> {
        const session = await this.loadSession(accountRole);
        if (!session) {
            return false;
        }

        try {
            // Add cookies
            if (session.cookies && session.cookies.length > 0) {
                await context.addCookies(session.cookies);
                console.log(`Applied ${session.cookies.length} cookies to context`);
            }

            // Note: localStorage and sessionStorage require a page to be opened
            // and cannot be applied directly to the context. They're stored for reference.
            // If needed, open a page and set them manually:
            // const page = await context.newPage();
            // for (const [key, value] of Object.entries(session.localStorage || {})) {
            //     await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);
            // }

            return true;
        } catch (error) {
            console.error(`Failed to apply session for account role "${accountRole}":`, error);
            return false;
        }
    }

    /**
     * Clear (delete) stored session.
     */
    public clearSession(accountRole: 'shared' | 'parallel' | 'envAccount'): void {
        const sessionPath = this.getSessionPath(accountRole);
        try {
            if (fs.existsSync(sessionPath)) {
                fs.unlinkSync(sessionPath);
                console.log(`Session cleared for account role "${accountRole}"`);
            }
        } catch (error) {
            console.warn(`Failed to clear session for account role "${accountRole}":`, error);
        }
    }

    /**
     * Clear all stored sessions.
     */
    public clearAllSessions(): void {
        try {
            if (fs.existsSync(this.sessionsDir)) {
                const files = fs.readdirSync(this.sessionsDir);
                for (const file of files) {
                    fs.unlinkSync(path.join(this.sessionsDir, file));
                }
                console.log(`All sessions cleared`);
            }
        } catch (error) {
            console.warn('Failed to clear all sessions:', error);
        }
    }

    /**
     * Get session info without loading the full session (for debugging).
     */
    public getSessionInfo(accountRole: 'shared' | 'parallel' | 'envAccount'): { exists: boolean; age: number; valid: boolean } {
        const sessionPath = this.getSessionPath(accountRole);
        const exists = fs.existsSync(sessionPath);

        if (!exists) {
            return { exists: false, age: -1, valid: false };
        }

        try {
            const stats = fs.statSync(sessionPath);
            const age = Date.now() - stats.mtimeMs;
            const valid = age < this.sessionTimeout;
            return { exists, age, valid };
        } catch (error) {
            return { exists, age: -1, valid: false };
        }
    }
}

// Export singleton instance
export const sessionManager = new SessionManager();
