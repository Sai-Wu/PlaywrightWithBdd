# PlaywrightWithBdd

A comprehensive Playwright test automation framework for Amazon.com using BDD (Behavior-Driven Development) with mixed account testing, worker locks, session persistence, and API response mocking.

## Features

### 🏗️ Architecture
- **Page Object Model (POM)**: Clean separation of selectors and test logic
  - HomePage, SearchPage, EventPage, CartPage, ProductPage, Header
  - Lazy-loaded getters in fixture for efficient resource management
  
- **Playwright-BDD Integration**: Write tests in Gherkin syntax
  - Feature files in `src/features/*.feature`
  - Step definitions organized by feature
  - Automatic code generation support

- **Test Fixture**: Centralized test context with managers
  - `testDataManager`: Handle credentials and test data
  - `workerLockManager`: Serialize tests that share resources
  - `sessionManager`: Persist and reuse authentication sessions
  - `RouteInterceptor`: Mock API responses and network errors

### 🔐 Mixed Account Strategy

Tests can use three types of accounts:

#### Existing User Account (`@existingUser` tag)
- Single account used by multiple tests
- Serialized with **worker locks** to prevent conflicts
- Tests run sequentially on the shared account
- **Use case**: Integration tests, full user journeys, premium account features

#### Parallel Account (`@parallel-account` tag)
- Independent account per test
- Can run concurrently (no locks)
- Tests run faster due to parallelization
- **Use case**: Search tests, basic navigation, independent workflows

#### New User Account Scenarios (`@newUser` tag) - ⭐ **Most Common**
- **Fresh account per test** - Each test provisions its own new account
- **Zero state guarantee** - Start from brand new account (no prior history)
- **Truly independent tests** - No cross-test pollution or race conditions
- **Maximum parallelization** - All workers can run simultaneously
- **Best for**: 
  - Onboarding flows (first-time user experience)
  - Registration and account creation validation
  - Feature tests that verify clean state behavior
  - A/B testing with new user cohorts
  - Signup → verify email → confirm purchase workflows
  - Testing default settings and preferences
- **Implementation**: Account pool or provisioning API provides new credentials per test
- **Performance**: Fastest execution pattern (full parallelization, no locks, fresh state)

### 🔄 Session Persistence

- **First login**: Full authentication (username/password)
- **Subsequent tests**: Reuse saved cookies (`.sessions/shared-session.json`)
- **Benefits**: Faster tests, reduces load on login infrastructure
- **Automatic cleanup**: Session expires after 24 hours (configurable)

### 🔒 Worker Locks

- **File-based locks** stored in `.locks/` directory
- **Prevents race conditions** when multiple tests access shared resources
- **Automatic timeout**: Prevents deadlocks (60 seconds default)
- **Debug info**: Lock files contain process ID and timestamp

### 📡 API Response Mocking

Mock API responses using Playwright's route interception:

- **HTTP Errors**: Return 4xx/5xx status codes
  ```gherkin
  When the API returns 500 for /api/orders
  ```

- **Network Errors**: Simulate timeout, connection refused, etc.
  ```gherkin
  When the network times out for /api/search
  ```

- **Custom Responses**: Mock specific response bodies
  ```gherkin
  When the API response is {"items": [], "message": "empty"} for /api/products
  ```

### 🧪 Test Data Management

#### Environment Variables (`.env`)
- Sensitive data: passwords, usernames (git-ignored)
- Override with `USERNAME`, `PASSWORD`, `TEST_BASE_URL`, etc.

#### Constants (`testData.constants.ts`)
- TypeScript exports for frequently-used values
- Timeouts, error codes, search terms, lock config

#### Test Data Resources (`src/resources/testdata/`)
- Mock response fixtures (JSON files)
- Test data files used for loading into tests

## Project Structure

```
src/
├── features/
│   ├── Amazon.feature              # Refactored feature file with enhanced scenarios
│   └── auth-and-errors.feature     # Example scenarios (locks, sessions, mocks)
├── resources/
│   └── testdata/
│       └── response/               # Mock response fixtures (JSON files)
├── typescript/
│   ├── pages/                      # Page Object Models
│   │   ├── home.page.ts
│   │   ├── cart.page.ts
│   │   ├── product.page.ts         # ✨ New: Product details page object
│   │   ├── login.page.ts           # Enhanced: Improved login flow
│   │   ├── searchPage/search.page.ts
│   │   ├── eventPage/event.page.ts
│   │   ├── eventPage/eventProductCard.ts
│   │   ├── common/header.ts
│   │   └── index.ts                # Barrel exports
│   ├── step-definitions/           # Step implementations
│   │   ├── auth.steps.ts           # Login, session persistence
│   │   ├── mocking.steps.ts        # API error mocking
│   │   ├── navigation.steps.ts     # Navigation using POMs
│   │   ├── homepage.steps.ts       # Original steps
│   │   ├── searchpage.steps.ts     # Search page steps
│   │   ├── eventpage.steps.ts      # Event page steps
│   │   └── login.steps.ts          # Login steps
│   └── support/                    # Infrastructure & configuration
│       ├── fixture.ts              # Test context with managers
│       ├── config.ts               # Base URL and configuration
│       ├── testData.constants.ts   # TypeScript constants
│       ├── testDataLoader.ts       # Load test data from resources
│       ├── workerLocks.ts          # File-based lock management
│       ├── sessionManager.ts       # Session persistence
│       ├── routeInterceptor.ts     # API response mocking
│       └── reusableMethods.ts      # Shared test utilities
.locks/                            # (git-ignored) Worker lock files
.sessions/                         # (git-ignored) Saved sessions
.env                               # (git-ignored) Environment variables
.env.example                       # Template for .env
```

## Setup

### 1. Install Dependencies

```bash
npm install
npx playwright install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in actual credentials:

```bash
cp .env.example .env
# Edit .env with your test credentials
```

### 3. Configure Test Data (Optional)

Edit environment variables in `.env` to customize:
- Account credentials (USERNAME, PASSWORD)
- Test URLs and endpoints
- Custom timeouts

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Tag
```bash
# New user tests only (RECOMMENDED - fastest, full parallelization)
npm test -- --grep "@newUser"

# Parallel account tests only (concurrent)
npm test -- --grep "@parallel-account"

# Existing user tests only (serialized)
npm test -- --grep "@existingUser"

# API mocking tests
npm test -- --grep "@api-mocking"

# Multiple tags
npm test -- --grep "@newUser|@parallel-account"
```

### Run with Multiple Workers
```bash
# 4 workers (for new user tests - RECOMMENDED)
npm test -- --workers=4 --grep "@newUser"

# 4 workers (for parallel-account tests)
npm test -- --workers=4 --grep "@parallel-account"

# 1 worker (for existing user tests only)
npm test -- --workers=1 --grep "@existingUser"

# Override via environment variable
WORKERS=4 npm test
```

### Debug Mode
```bash
# Run with headed browser
PLAYWRIGHT_HEADLESS=false npm test

# Run in debug mode
npx playwright test --debug

# Inspect specific test
npx playwright test auth-and-errors.feature --debug
```

## Understanding the Test Tags

Use these tags to control test behavior:

| Tag | Purpose | Behavior |
|-----|---------|----------|
| `@newUser` | **Fresh account per test (RECOMMENDED)** | Full parallelization; no locks; fastest |
| `@parallel-account` | Uses independent account | Can run concurrently; multiple workers |
| `@existingUser` | Uses shared login | Serialized with locks; 1 worker |
| `@locks` | Tests lock functionality | Verifies worker serialization |
| `@session-reuse` | Tests session persistence | Verifies cookie reuse |
| `@api-mocking` | Tests error mocking | Mocks HTTP/network errors |
| `@network-errors` | Tests timeout/connection errors | Simulates network failures |
| `@navigation` | Tests POM-based navigation | Uses SearchPage, HomePage, etc. |
| `@error-handling` | Tests error detection | Verifies error UI display |
| `@mixed-scenario` | Combines multiple features | Integration scenarios |

## Worker Strategy

### Configuration

Edit `workers` in `playwright.config.ts` based on your test mix:

```typescript
// 1 worker: Heavy existingUser tests only
workers: 1

// 2 workers: Mixed existingUser and newUser tests
workers: 2

// 4 workers: Mostly newUser and parallel-account tests (RECOMMENDED)
workers: 4
```

Or override at runtime:
```bash
WORKERS=4 npm test -- --grep "@newUser"
npm test -- --workers=4
```

### How It Works

1. **New User Tests** (⭐ Most Common)
   - No locks acquired
   - Each test gets fresh credentials from account pool
   - All tests run fully parallel
   - Zero state guarantee (clean account each time)

2. **Parallel Account Tests**
   - No locks acquired
   - Each test uses existing (non-shared) account
   - Can run concurrently
   - May reuse session if account has prior history

3. **Existing User Tests**
   - Acquire lock via `WorkerLockManager.acquireLock('shared')`
   - Run test sequentially (other tests wait)
   - Release lock after test completes
   - Lock timeout: 60 seconds (prevents deadlock)

4. **Lock Files**
   - Created in `.locks/` directory (git-ignored)
   - Contain timestamp and process ID
   - Cleaned up automatically after tests

## Session Management

### How Sessions Work

1. **First Test** (any account type)
   ```
   Login → Save cookies → Create .sessions/[role]-session.json
   ```

2. **Second Test** (same account role)
   ```
   Load cookies → Apply to browser context → Skip login
   ```

3. **Session Expiration**
   - Default: 24 hours
   - Configure in `SESSION_CONFIG.sessionTimeout`
   - Expired sessions are discarded; test performs fresh login

### Manual Session Management

```typescript
// In step definitions:
import { sessionManager } from '../support/sessionManager';

// Save session after login
const cookies = await context.cookies();
await sessionManager.saveSession('shared', cookies);

// Load session for reuse
const session = await sessionManager.loadSession('shared');
if (session) {
  await context.addCookies(session.cookies);
}

// Clear session manually
sessionManager.clearSession('shared');
```

## API Response Mocking

### Mock HTTP Errors

```gherkin
When the API returns 404 for /api/products
When the API returns 500 with message "Server error" for /api/orders
```

```typescript
// In step definition:
await testDataContext.mockResponses.mockHttpError(
  '**/api/products',
  404,
  'Not Found'
);
```

### Mock Network Errors

```gherkin
When the network times out for /api/search
When the connection is refused for /api/checkout
```

```typescript
// In step definition:
await testDataContext.mockResponses.mockNetworkError(
  '**/api/search',
  'timedout'  // or 'aborted', 'accessdenied'
);
```

### Mock Custom Responses

```gherkin
When the API response is {"items": []} for /api/search
```

```typescript
// In step definition:
await testDataContext.mockResponses.mockResponse(
  '**/api/search',
  { items: [], message: 'No products' },
  200
);
```

### Mock Responses from JSON Files

For complex or large mock responses, load from JSON fixture files:

```gherkin
When the API response is loaded from file src/resources/data/products.json for /api/products
When the API response is loaded from file src/resources/data/orders.json with status 202 for /api/orders
```

**Benefits**:
- ✅ Organize complex responses in separate files
- ✅ Reuse responses across multiple tests
- ✅ Easy to update fixtures without code changes
- ✅ Version control friendly (JSON diffs)

**Directory Structure**:
```
src/
├── resources/
│   └── data/                  # Mock response fixtures
│       ├── products.json      # Product list response
│       ├── orders.json        # Order history response
│       ├── empty-search.json  # Empty search results
│       └── user-profile.json  # User data response
```

**Example fixture file** (`src/fixtures/products.json`):
```json
{
  "products": [
    {
      "id": "1",
      "title": "Laptop Computer",
      "price": 999.99,
      "inStock": true,
      "rating": 4.5
    }
  ],
  "total": 1
}
```

**Step definitions**:
```typescript
// Load response from file with default 200 status
When('the API response is loaded from file {string} for {string}',
  async ({ testDataContext }, filePath: string, endpoint: string) => {
    await testDataContext.mockResponses.mockResponseFromFile(
      buildUrlPattern(endpoint),
      filePath,
      200
    );
  }
);

// Load response with custom status code
When('the API response is loaded from file {string} with status {int} for {string}',
  async ({ testDataContext }, filePath: string, statusCode: number, endpoint: string) => {
    await testDataContext.mockResponses.mockResponseFromFile(
      buildUrlPattern(endpoint),
      filePath,
      statusCode
    );
  }
);
```

**TypeScript usage** (in tests):
```typescript
// Direct method call
await testDataContext.mockResponses.mockResponseFromFile(
  '**/api/products',
  'src/resources/data/products.json',
  200
);

// With custom status
await testDataContext.mockResponses.mockResponseFromFile(
  '**/api/orders',
  'src/resources/data/orders.json',
  202  // Accepted
);
```

### Cleanup

Mocks are automatically cleared after each test via fixture teardown:

```typescript
// In fixture.ts (buildTestDataContext):
await use(testDataContext);

// Cleanup: Clear all mocks after test
if (_mockResponses) {
  await _mockResponses.clearMocks();
}
```

## Page Object Models

### Available POMs

All POMs are lazy-loaded in the test fixture:

```typescript
// In step definitions or tests:
const { testDataContext } = await use();

testDataContext.homePage      // HomePage POM
testDataContext.searchPage    // SearchPage POM
testDataContext.eventPage     // EventPage POM
testDataContext.productPage   // ProductPage POM ✨ NEW
testDataContext.header        // Header component
```

### Creating New POMs

1. Create class in `src/typescript/pages/`:

```typescript
export class ProductDetailsPage {
  readonly page: Page;
  readonly productTitle: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.productTitle = this.page.locator('h1');
  }
  
  async getPrice() {
    return this.page.locator('span.price').textContent();
  }
}
```

2. Export from `src/typescript/pages/index.ts`:

```typescript
export { ProductDetailsPage } from './productDetails.page';
```

3. Add lazy getter to fixture:

```typescript
export type TestDataContext = {
  // ... existing POMs
  productDetailsPage: Pages.ProductDetailsPage;
}

// In buildTestDataContext:
let _productDetailsPage: Pages.ProductDetailsPage | null = null;

get productDetailsPage() {
  if (!_productDetailsPage) {
    _productDetailsPage = new Pages.ProductDetailsPage(page);
  }
  return _productDetailsPage;
}
```

## Debugging

### Check Lock Status

```typescript
import { workerLockManager } from '../support/workerLocks';

// In tests or steps:
const status = workerLockManager.getLockStatus();
console.log('Current locks:', status);
```

### Check Session Status

```typescript
import { sessionManager } from '../support/sessionManager';

// In tests or steps:
const info = sessionManager.getSessionInfo('shared');
console.log('Session info:', info);
// Output: { exists: true, age: 5000, valid: true }
```

### View Active Mocks

```typescript
// In step definitions:
const mocks = testDataContext.mockResponses.getActiveMocks();
console.log('Active mocks:', mocks);
```

### Enable Debug Logging

```bash
# Playwright debug mode
PWDEBUG=1 npm test

# Verbose output
DEBUG=pw:api npm test
```

## Troubleshooting

### Lock Timeout Error: "Failed to acquire lock within X ms"

**Problem**: Test fails with lock timeout instead of lock release

**Root Cause**: Multiple workers competing for shared account with limited lock timeout

**Scenarios that cause this**:
1. 3+ workers all using `@existingUser` tests
2. Lock timeout (60-120s) < total wait for all queued workers
3. Worker A finishes, Worker B acquires lock, Worker C still waiting

**Solutions**:

**Option 1: Use 1 Worker for Existing User Tests** (Recommended)
```bash
npm test -- --grep "@existingUser" --workers=1
npm test -- --grep "@newUser" --workers=4
```

**Option 2: Increase Lock Timeout** (Quick Fix)
```typescript
// src/typescript/support/testData.constants.ts
export const TIMEOUTS = {
    lockWait: 300000,  // Increase from 2min to 5min
} as const;
```

**Option 3: Cleanup Stale Locks**
```bash
# Remove old lock files that may be orphaned
rm -rf .locks/
rm -rf .sessions/
npm test
```

**Option 4: Check Lock Status During Test**
```typescript
import { workerLockManager } from '../support/workerLocks';

const status = workerLockManager.getLockStatus();
console.log('Current locks:', status);
// Output: { shared: { pid: 1234, timestamp: 1234567890, age: 5000 } }
```

### Tests Hang on Lock Acquisition

**Problem**: Test waits indefinitely, never acquires lock

**Possible Causes**:
1. Stale lock file from crashed test
2. Worker process still holding lock
3. File system permissions issue

**Solutions**:
1. Check `.locks/` directory for old lock files
   ```bash
   ls -la .locks/
   # If files are > 5 minutes old, safe to delete
   rm .locks/*.lock
   ```

2. Use cleanup in test setup:
   ```typescript
   import { workerLockManager } from '../support/workerLocks';
   
   workerLockManager.cleanupStaleLocks(5 * 60 * 1000); // Clean locks > 5min old
   ```

3. Restart test suite:
   ```bash
   npm test
   ```

### Session Not Being Reused

**Solution**:
1. Check `.sessions/` directory for saved session
2. Verify session hasn't expired (24 hours default)
3. Ensure same account role used in both tests

```bash
# Clear all sessions to force fresh login
rm -r .sessions/
```

### Mock Not Applied

**Problem**: API response not mocked

**Solution**:
1. Verify URL pattern matches actual endpoint
2. Check console logs for mock registration
3. Ensure mock is applied before navigation

```typescript
// Apply mock before navigating:
await testDataContext.mockResponses.mockHttpError('**/api/products', 500);
await page.goto('https://amazon.com');
```

### Worker Lock Timeout

**Problem**: "Failed to acquire lock within X ms"

**Solution**:
1. Reduce number of workers: `npm test -- --workers=1`
2. Increase lock timeout in `testData.constants.ts`
3. Check if another test is holding lock indefinitely

## Best Practices

### 1. Tag Tests Appropriately

```gherkin
# RECOMMENDED: New user tests for most scenarios
@newUser @navigation @error-handling
Scenario: User can search and view results

# Use existing user account only when necessary
@existingUser @locks @session-reuse
Scenario: Admin modifies shared settings that affect other tests
```

### 2. Use Lazy-Loaded POMs

```typescript
// Good: Only loads when accessed
testDataContext.searchPage.listOfProductCards

// Avoid: Creating POMs manually
new SearchPage(page)  // Doesn't benefit from lazy loading
```

### 3. Mock Errors Before Navigation

```gherkin
When the API returns 500 for /api/orders
And I navigate to the orders page
Then I should see an error
```

### 4. Clean Up Mocks (Automatic)

```typescript
// No need to manually clear mocks; fixture handles it:
await use(testDataContext);

// Cleanup happens automatically:
if (_mockResponses) {
  await _mockResponses.clearMocks();
}
```

### 5. Use Constants for Magic Values

```typescript
// Good: Use constants
import { TIMEOUTS, ERROR_CODES } from '../support/testData.constants';
await page.waitForTimeout(TIMEOUTS.pageLoad);

// Avoid: Hardcoded values
await page.waitForTimeout(30000);
```

### 6. Document Lock Requirements

```gherkin
@existingUser @locks
Scenario: Scenario that modifies shared state
  # This scenario modifies shared account state
  # Lock ensures only one test runs at a time
```

## Performance Tips

### 1. Prefer New User Tests (⭐ FASTEST)

```gherkin
@newUser  # Fresh account per test; full parallelization
Scenario: Search test with new user account
```

**Benefits**:
- ✅ Maximum parallelization (all workers run simultaneously)
- ✅ Zero state guarantee (clean account every time)
- ✅ No cross-test pollution or race conditions
- ✅ Fastest overall suite execution

### 2. Use Parallel Tests When New Users Not Available

```gherkin
@parallel-account  # No locks; can run concurrently
Scenario: Search test with existing account
```

### 3. Reuse Sessions for Existing User Accounts

First test logs in (slow):
```gherkin
@existingUser @session-reuse
Scenario: First test - login
  Given I am logged in as existing user
```

Second test reuses session (fast):
```gherkin
@existingUser @session-reuse
Scenario: Second test - reuse session
  Given I am logged in as existing user
```

### 3. Mock Instead of Real API Calls

```gherkin
# Fast: Mock error response
When the API returns 500 for /api/orders

# Slow: Wait for actual API to fail
When I try to place an order without payment info
```

### 4. Optimize Worker Count

```bash
# Measure test duration with different worker counts:
npm test -- --workers=1  # Baseline
npm test -- --workers=2  # Better parallelization
npm test -- --workers=4  # Diminishing returns
```

## Contributing

When adding new tests:

1. ✅ **Use `@newUser` by default** (recommended for most tests)
2. ✅ Only use `@existingUser` if tests modify shared state that affects other tests
3. ✅ Add appropriate `@tag` annotations for test categorization
4. ✅ Use POMs via `testDataContext` (lazy-loaded)
5. ✅ Mock external APIs instead of calling real endpoints
6. ✅ Store test data in environment variables or fixture files under `src/resources/testdata/`

## Reporting

### Run Tests with Reports

```bash
npm test
```

Reports are generated in:
- `cucumber-report/index.html` - BDD-style report
- `test-results/` - Playwright HTML report

### View Reports

```bash
# Open Cucumber report
open cucumber-report/index.html

# Open Playwright report
npx playwright show-report
```

## CI/CD Integration

### GitHub Actions Example - Recommended Approach

To optimize test execution, run test types separately with appropriate worker counts:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  # Run newUser tests concurrently (4 workers) - FASTEST, RECOMMENDED
  test-new-user:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm test -- --grep "@newUser" --workers=4
      
      - uses: actions/upload-artifact@v2
        if: always()
        with:
          name: test-results-new-user
          path: test-results/

  # Run parallel-account tests concurrently (4 workers)
  test-parallel-account:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm test -- --grep "@parallel-account" --workers=4
      
      - uses: actions/upload-artifact@v2
        if: always()
        with:
          name: test-results-parallel
          path: test-results/

  # Run existingUser tests sequentially (1 worker)
  test-existing-user:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm test -- --grep "@existingUser" --workers=1
      
      - uses: actions/upload-artifact@v2
        if: always()
        with:
          name: test-results-existing-user
          path: test-results/
```

### Worker Lock & Timeout Management

**Important:** When multiple workers try to use the shared account:

1. **Lock Acquisition Timeout**: 2 minutes (120 seconds)
   - Allows queued workers to wait for lock release
   - Configured in `TIMEOUTS.lockWait`

2. **Exponential Backoff**: Lock polling uses exponential backoff
   - Reduces CPU usage during polling
   - Poll interval: starts at 100ms, increases to max 2 seconds

3. **Race Condition Prevention**:
   ```
   Worker A acquires lock → runs test → releases lock
   Worker B (waiting) → acquires lock on next poll
   Worker C (waiting) → acquires lock after Worker B finishes
   ```

   If lock timeout < test timeout:
   - ✅ Lock waits (2min) > Playwright timeout (30s) = Worker will retry on new test
   - ❌ Lock timeout (30s) < many workers queued = Lock timeout error possible

### Best Practice: Separate Runs by Account Type

**DO THIS** (Recommended - Fastest):
```bash
# Run newUser tests: 4 workers, full parallelization (FASTEST)
npm test -- --grep "@newUser" --workers=4

# Run parallel-account tests: 4 workers, full concurrency
npm test -- --grep "@parallel-account" --workers=4

# Run existingUser tests: 1 worker, no lock contention
npm test -- --grep "@existingUser" --workers=1
```

**AVOID THIS** (Causes lock timeout races):
```bash
# Multiple workers competing for shared account lock with mixed tests
npm test -- --workers=4  # If mix of existingUser/newUser/parallel tests
```

### Configuration Reference

**Lock & Timeout Settings** (`src/typescript/support/testData.constants.ts`):

```typescript
export const LOCK_CONFIG = {
    timeout: 60000,        // Default lock wait: 60 seconds
    pollInterval: 100,     // Initial poll: 100ms
    maxRetries: 5,
} as const;

export const TIMEOUTS = {
    pageLoad: 30000,       // Playwright: 30 seconds
    element: 10000,
    login: 15000,
    networkError: 5000,
    lockWait: 120000,      // Lock: 2 minutes (allows queued workers)
} as const;

export const SESSION_CONFIG = {
    sessionDir: '.sessions',
    lockDir: '.locks',
    sessionTimeout: 24 * 60 * 60 * 1000,  // 24 hours
} as const;
```

**Worker Configuration** (`playwright.config.ts`):

```typescript
// Default: 1 worker (safest for mixed tests)
workers: process.env.WORKERS ? parseInt(process.env.WORKERS) : 1,

// Override:
WORKERS=4 npm test -- --grep "@parallel-account"
npm test -- --workers=4
```

## Changelog

### Latest Update (May 17, 2026)

**feat: Refactor Amazon feature scenarios, enhance login flow, and add product page functionality**

#### Added
- ✨ **New `ProductPage` POM** (`src/typescript/pages/product.page.ts`)
  - Complete page object model for product details page
  - Methods for product interactions and validation
  - Fully integrated with test fixture

#### Enhanced
- 🔐 **Login Flow Improvements** (`login.page.ts`, `login.steps.ts`)
  - Better error handling during authentication
  - Improved session validation
  - More robust element locators
  
- 📄 **Amazon Feature Refactor** (`src/features/Amazon.feature`)
  - Streamlined and clarified test scenarios
  - Better test coverage organization
  - Improved naming and structure

- 🛠️ **Configuration Updates**
  - Updated `playwright.config.ts` with optimized settings
  - Enhanced `fixture.ts` with better resource management
  - Improved `sessionManager.ts` for session handling
  - Updated constants in `testData.constants.ts`

- 🎯 **Page Objects & Steps**
  - Enhanced `home.page.ts` selectors and methods
  - Improved `searchPage/search.page.ts` functionality
  - Updated `eventPage/eventProductCard.ts` interactions
  - Refined step definitions for homepage, login, and search

#### Statistics
- **Files Modified**: 16
- **Files Added**: 1
- **Insertions**: 217
- **Deletions**: 40

#### Migration Guide
If upgrading from previous version:
1. No breaking changes to existing tests
2. New `ProductPage` can be used via `testDataContext.productPage`
3. Login flow improvements are backward compatible
4. Consider refactoring tests to use new ProductPage features

## License

[Your License Here]
