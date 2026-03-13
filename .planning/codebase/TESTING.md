# Testing Patterns

**Analysis Date:** 2026-03-11

## Test Framework

**Runner:**
- Node.js built-in `node:test` module (native Node.js test runner, no external dependency)
- Version: Node 16.7.0+ (see `package.json` engines field)
- Config: `scripts/run-tests.cjs` (cross-platform test file glob resolver)

**Assertion Library:**
- Node.js built-in `node:assert` module
- Uses `assert.strictEqual()`, `assert.deepStrictEqual()`, `assert.ok()` for all assertions

**Run Commands:**
```bash
npm test                    # Run all tests in tests/*.test.cjs
npm run test:coverage       # Run with c8 coverage, requires 70% line coverage
```

**Coverage Tool:**
- `c8` version ^11.0.0 for coverage collection and reporting
- Coverage config: minimum 70% line coverage enforced
- Coverage scope: `get-shit-done/bin/lib/*.cjs` only (source files under test)
- Excludes: `tests/**` directory, all test files

## Test File Organization

**Location:**
- Co-located pattern: test files in `tests/` directory at project root
- Separate from source: `get-shit-done/bin/lib/` contains source, `tests/` contains tests

**Naming:**
- Pattern: `{module-name}.test.cjs` (e.g., `config.test.cjs` tests `config.cjs`)
- Test runner script: `tests/run-tests.cjs`
- Helpers module: `tests/helpers.cjs`

**Structure:**
```
tests/
├── helpers.cjs           # Test utilities (runGsdTools, createTempProject, cleanup)
├── core.test.cjs         # Tests for core.cjs
├── config.test.cjs       # Tests for config.cjs
├── phase.test.cjs        # Tests for phase.cjs
├── state.test.cjs        # Tests for state.cjs
├── frontmatter.test.cjs  # Tests for frontmatter.cjs
└── ...                   # Other test files
```

## Test Structure

**Suite Organization:**
```javascript
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

describe('config-ensure-section command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('creates config.json with expected structure and types', () => {
    const result = runGsdTools('config-ensure-section', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    // ... assertions
  });

  describe('nested describe block for related tests', () => {
    test('specific test case', () => {
      // ...
    });
  });
});
```

**Patterns:**
- `describe()` groups related tests by feature or function
- `beforeEach()` runs before each test in the describe block
- `afterEach()` cleanup: removes temp directories, restores state
- Nested `describe()` blocks for sub-features or variations
- Each `test()` is atomic and independent

## Mocking

**Framework:** No mocking library used (no sinon, jest.mock, etc.)

**Patterns:** Temp directories used instead of mocks

**Example from `config.test.cjs` (line 45-54):**
```javascript
function createTempProject() {
  const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gsd-test-'));
  fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
  return tmpDir;
}

function writeConfig(tmpDir, obj) {
  const configPath = path.join(tmpDir, '.planning', 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(obj, null, 2), 'utf-8');
}
```

**What to Mock:**
- File I/O: Use `fs.mkdtempSync()` to create isolated temp directories
- Git operations: Real git repos initialized in temp directories via `execSync('git init')`
- External state: Test uses `.gsd/` directory for Brave API key detection (real filesystem, with save/restore try/finally)

**What NOT to Mock:**
- Core node modules (fs, path, etc.) — used directly
- External CLI tools (git, node) — executed via `execSync` in tests
- Global state — cleaned up in `afterEach()`, not mocked

## Fixtures and Factories

**Test Data:**
```javascript
// Helper function from helpers.cjs
function createTempProject() {
  const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gsd-test-'));
  fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
  return tmpDir;
}

function createTempGitProject() {
  const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gsd-test-'));
  fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });

  execSync('git init', { cwd: tmpDir, stdio: 'pipe' });
  execSync('git config user.email "test@test.com"', { cwd: tmpDir, stdio: 'pipe' });
  execSync('git config user.name "Test"', { cwd: tmpDir, stdio: 'pipe' });

  fs.writeFileSync(path.join(tmpDir, '.planning', 'PROJECT.md'), '# Project\n\nTest project.\n');
  execSync('git add -A', { cwd: tmpDir, stdio: 'pipe' });
  execSync('git commit -m "initial commit"', { cwd: tmpDir, stdio: 'pipe' });

  return tmpDir;
}
```

**Location:**
- Test helpers in `tests/helpers.cjs`
- Test-specific fixtures created inline in test functions via `fs.writeFileSync()`, `fs.mkdirSync()`
- No separate fixtures directory

**Cleanup Pattern (example from `core.test.cjs` line 37-46):**
```javascript
beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-core-test-'));
  fs.mkdirSync(path.join(tmpDir, '.planning'), { recursive: true });
  originalCwd = process.cwd();
});

afterEach(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
```

## Coverage

**Requirements:** 70% line coverage enforced on source files

**View Coverage:**
```bash
npm run test:coverage
```

**Scope:**
- Includes: `get-shit-done/bin/lib/*.cjs` (all library files)
- Excludes: `tests/**` (test files themselves)
- Enforced via c8 CLI: `--check-coverage --lines 70`

**Current Status:** Not all source files covered (some modules like `template.cjs` may have partial coverage)

## Test Types

**Unit Tests:**
- Scope: Individual functions in isolation (e.g., `loadConfig`, `extractFrontmatter`, `normalizePhaseName`)
- Approach: Create temp state, call function, assert output
- Example from `core.test.cjs` (line 55-64): Test `loadConfig` returns defaults when config missing

**Integration Tests:**
- Scope: CLI commands and multi-module interactions (e.g., `config-ensure-section` command creates proper config structure)
- Approach: Use `runGsdTools()` helper to execute CLI, parse JSON output, verify file changes
- Example from `config.test.cjs` (line 42-64): Test `config-ensure-section` command creates proper config structure with correct types
- File system state verified post-execution

**CLI Tests:**
- Most tests are CLI integration tests using `runGsdTools()` helper
- Helper handles both `execSync` (shell string) and `execFileSync` (array safe from shell expansion) approaches
- Tests verify exit code, stdout/stderr capture, JSON parsing

**E2E Tests:**
- Not explicitly separated; CLI tests serve as light E2E (command → state change → verification)
- Real git repos initialized for git-dependent tests

## Common Patterns

**Async Testing:**
- No async/await in tests; all synchronous via `execSync()`, `fs.readFileSync()`, etc.
- No promise handling needed

**Error Testing (example from `config.test.cjs` line 97-105):**
```javascript
test('returns defaults when config.json contains invalid JSON', () => {
  fs.writeFileSync(
    path.join(tmpDir, '.planning', 'config.json'),
    'not valid json {{{{'
  );
  const config = loadConfig(tmpDir);
  assert.strictEqual(config.model_profile, 'balanced');
  assert.strictEqual(config.commit_docs, true);
});
```

**Regression Testing:**
- Tests documented with regression IDs (e.g., `REG-01`, `REG-04`) as comments
- REG-01: `loadConfig` model_overrides field was omitted from return (now fixed + tested)
- REG-04: `extractFrontmatter` splits quoted commas incorrectly in inline arrays (behavior documented in test with comment about known limitation)

**Example from `core.test.cjs` (line 85-89):**
```javascript
// Bug: loadConfig previously omitted model_overrides from return value
test('returns model_overrides when present (REG-01)', () => {
  writeConfig({ model_overrides: { 'gsd-executor': 'opus' } });
  const config = loadConfig(tmpDir);
  assert.deepStrictEqual(config.model_overrides, { 'gsd-executor': 'opus' });
});
```

## Test Data Management

**Helpers API from `tests/helpers.cjs`:**

```javascript
/**
 * Run gsd-tools command.
 * @param {string|string[]} args - Command string (shell-interpreted) or array
 *   of arguments (shell-bypassed via execFileSync, safe for JSON and dollar signs).
 * @param {string} cwd - Working directory.
 */
function runGsdTools(args, cwd = process.cwd()) {
  // Returns { success: boolean, output: string, error?: string }
}

function createTempProject() {
  // Creates tmpDir with .planning/phases/, returns path
}

function createTempGitProject() {
  // Creates tmpDir with git repo initialized, initial commit
}

function cleanup(tmpDir) {
  // Removes tmpDir recursively
}
```

**Usage Pattern (from `phase.test.cjs` line 31-46):**
```javascript
test('lists phase directories sorted numerically', () => {
  // Create out-of-order directories
  fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '10-final'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '02-api'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-foundation'), { recursive: true });

  const result = runGsdTools('phases list', tmpDir);
  assert.ok(result.success, `Command failed: ${result.error}`);

  const output = JSON.parse(result.output);
  assert.strictEqual(output.count, 3, 'should have 3 directories');
  assert.deepStrictEqual(
    output.directories,
    ['01-foundation', '02-api', '10-final'],
    'should be sorted numerically'
  );
});
```

---

*Testing analysis: 2026-03-11*
