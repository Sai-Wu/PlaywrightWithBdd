import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig, cucumberReporter } from 'playwright-bdd';
import * as fs from 'fs';
import * as path from 'path';

const testDir = defineBddConfig({
  features: 'src/features/*.feature',
  steps: 'src/typescript/step-definitions/*.ts',
});

/**
 * Worker Strategy for Mixed Account Testing
 * 
 * Tests MUST be tagged with either @existingUser or @newUser:
 * 
 * @existingUser:
 *   - Uses shared account
 *   - Fixture AUTOMATICALLY acquires lock before steps run
 *   - Tests serialize (one at a time) to prevent account conflicts
 *   - Lock timeout: 120 seconds (TIMEOUTS.lockWait)
 *   - Use with 1 worker or multiple workers (lock ensures serialization)
 * 
 * @newUser:
 *   - Uses fresh/independent account per test
 *   - Fixture skips lock acquisition
 *   - Tests can run concurrently safely
 *   - Use with 4+ workers for maximum parallelization
 * 
 * Recommended configurations:
 * 1. Heavy @existingUser tests: workers: 1 or 4 (lock handles serialization)
 * 2. Mostly @newUser tests: workers: 4+
 * 3. Mixed: workers: 2-4 (lock ensures safety for @existingUser)
 * 
 * Run with specific tag filter:
 * - npm test -- --grep "@existingUser" --workers=4 (lock handles serialization)
 * - npm test -- --grep "@newUser" --workers=4 (parallel safe)
 */

export default defineConfig({
  testDir,
  
  // Worker configuration: set based on your test mix
  // Default to 1 worker to avoid lock contention on shared account
  // Override with --workers flag or WORKERS env var
  workers: process.env.WORKERS ? parseInt(process.env.WORKERS) : 1,

  reporter: [
    cucumberReporter('html', {
      outputFile: 'cucumber-report/index.html',
      externalAttachments: true,
    }),
    ['html', { open: 'never' }],
  ],

  use: {
    // Base URL for all tests
    baseURL: process.env.TEST_BASE_URL || 'https://www.amazon.com/',
    
    // Artifacts for debugging
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Timeout configuration
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
  },

  // Global setup/teardown (optional)
  // globalSetup: require.resolve('./tests/global-setup.ts'),
  // globalTeardown: require.resolve('./tests/global-teardown.ts'),
});
