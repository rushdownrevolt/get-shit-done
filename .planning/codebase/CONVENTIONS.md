# Coding Conventions

**Analysis Date:** 2026-03-11

## Naming Patterns

**Files:**
- `.cjs` extension for CommonJS modules (e.g., `core.cjs`, `config.cjs`, `phase.cjs`)
- Test files match source module name with `.test.cjs` suffix (e.g., `config.cjs` → `config.test.cjs`)
- Test helpers in dedicated `tests/helpers.cjs`
- Descriptive module names using hyphens avoided; underscore camelCase preferred

**Functions:**
- Command functions: `cmd` prefix + operation name in camelCase (e.g., `cmdPhasesList`, `cmdConfigSet`, `cmdVerifySummary`)
- Internal/exported functions: standard camelCase without prefix (e.g., `loadConfig`, `resolveModelInternal`, `normalizePhaseName`)
- Suffixed with `Internal` for functions intended for internal use only: `resolveModelInternal`, `generateSlugInternal`, `pathExistsInternal`, `getRoadmapPhaseInternal`, `findPhaseInternal`, `searchPhaseInDir`
- Private/helper functions (not exported): camelCase (e.g., `toPosixPath`, `safeReadFile`, `execGit`)

**Variables:**
- Constants in UPPER_SNAKE_CASE (e.g., `MODEL_PROFILES`, `FRONTMATTER_SCHEMAS`)
- Configuration keys in snake_case (e.g., `model_profile`, `commit_docs`, `branching_strategy`, `model_overrides`)
- Local variables in camelCase (e.g., `tmpDir`, `configPath`, `normalized`, `existingDecimals`)
- Template/placeholder variables in kebab-case within strings (e.g., `gsd/phase-{phase}-{slug}`)

**Types:**
- No TypeScript; all code is CommonJS JavaScript
- JSDoc type annotations used for documentation: `@param {string|string[]} args`, `@param {string} cwd`
- Object shape documentation in JSDoc blocks

## Code Style

**Formatting:**
- No explicit formatter detected (no `.prettierrc` or similar config)
- Consistent 2-space indentation throughout
- Single quotes for strings (e.g., `'use strict'`, `'utf-8'`)
- Semicolons used throughout
- Line continuations wrapped at ~80-100 characters for readability
- Trailing commas in multiline structures (objects, arrays)

**Linting:**
- No explicit ESLint config detected
- Code follows loose conventions rather than strict rules
- Manual consistency maintained through code review patterns

## Import Organization

**Order:**
1. Node.js built-in modules: `require('fs')`, `require('path')`, `require('child_process')`
2. Local relative imports: `require('./core.cjs')`, `require('./frontmatter.cjs')`
3. Special requires: `require('os').tmpdir()`, `require('os').homedir()`

**Example from `verify.cjs` (line 5-8):**
```javascript
const fs = require('fs');
const path = require('path');
const { safeReadFile, normalizePhaseName, execGit, findPhaseInternal, getMilestoneInfo, output, error } = require('./core.cjs');
const { extractFrontmatter, parseMustHavesBlock } = require('./frontmatter.cjs');
const { writeStateMd } = require('./state.cjs');
```

**Path Aliases:**
- No path aliases; relative paths used exclusively
- Absolute paths via `path.join(__dirname, '..', 'get-shit-done', 'bin', 'gsd-tools.cjs')` in tests

**Module Exports:**
- Single default export via `module.exports = { func1, func2, func3, ... }`
- Exported functions grouped logically, no wrapper objects
- Barrel files not used; each module explicitly requires what it needs

## Error Handling

**Patterns:**
- Silent failure with `catch {}` (empty catch block) for non-critical operations (e.g., config file cleanup, stat operations)
- Error propagation via `error(message)` function from `core.cjs` which writes to stderr and exits with code 1
- Try-catch wraps file I/O, JSON parsing, git operations, regex matching
- No promise/async-await error handling (code is synchronous)

**Example from `config.cjs` (line 85-95):**
```javascript
try {
  const raw = fs.readFileSync(configPath, 'utf-8');
  const parsed = JSON.parse(raw);
  // Migration logic...
  try { fs.writeFileSync(configPath, JSON.stringify(parsed, null, 2), 'utf-8'); } catch {}
} catch {
  // Silent failure — return defaults
}
```

**Exit on Error:**
```javascript
function error(message) {
  process.stderr.write('Error: ' + message + '\n');
  process.exit(1);
}
```

## Logging

**Framework:** Console via `process.stdout.write()` and `process.stderr.write()`

**Patterns:**
- JSON output via `output(result, raw, rawValue)` function from `core.cjs`
- Large payloads (>50KB) written to temp file with `@file:` prefix for Claude Code tool compatibility
- Debug info not logged; operational output only
- Errors written to stderr, success output to stdout

**Example from `core.cjs` (line 35-51):**
```javascript
function output(result, raw, rawValue) {
  if (raw && rawValue !== undefined) {
    process.stdout.write(String(rawValue));
  } else {
    const json = JSON.stringify(result, null, 2);
    if (json.length > 50000) {
      const tmpPath = path.join(require('os').tmpdir(), `gsd-${Date.now()}.json`);
      fs.writeFileSync(tmpPath, json, 'utf-8');
      process.stdout.write('@file:' + tmpPath);
    } else {
      process.stdout.write(json);
    }
  }
  process.exit(0);
}
```

## Comments

**When to Comment:**
- File-level module description at top in JSDoc block: `/** \n * Module Name — Description \n */`
- Section separators using horizontal lines: `// ─── Section Name ────────────────────...`
- Inline comments for non-obvious logic (e.g., regex patterns, migration logic)
- Bug documentation via comments: `// REG-01: bug description` with corresponding test

**JSDoc/TSDoc:**
- Used sparingly; primarily for exported functions with parameters
- Parameter types in JSDoc: `@param {string|string[]} args`
- Parameter descriptions: `@param {string} cwd - Working directory`
- No return type annotation (JavaScript convention)

**Example from `helpers.cjs` (line 11-16):**
```javascript
/**
 * Run gsd-tools command.
 *
 * @param {string|string[]} args - Command string (shell-interpreted) or array
 *   of arguments (shell-bypassed via execFileSync, safe for JSON and dollar signs).
 * @param {string} cwd - Working directory.
 */
```

## Function Design

**Size:**
- Typical functions 30-100 lines
- Large functions like `cmdPhasesList` up to 85 lines acceptable when dealing with multi-step operations
- Utility functions kept to 10-30 lines

**Parameters:**
- Most functions: `(cwd, options, raw)` or `(cwd, field, value, raw)` pattern
- `cwd` is always first parameter for git/file operations
- `raw` is boolean flag for raw text output vs JSON (always last)
- Options as object when multiple flags: `{ type, phase, includeArchived }`
- No default parameters; explicit checks for presence

**Return Values:**
- No explicit returns; always call `output()` or `error()` which call `process.exit()`
- Output via `output(resultObject, raw, rawTextValue)` for JSON + text variants
- Error via `error(message)` for immediate failure

## Module Design

**Exports:**
- Modules export function and constant collections via `module.exports = { func1, func2, ... }`
- No wrapper classes; flat function export
- Related functions grouped in same module by domain (all phase operations in `phase.cjs`, all config operations in `config.cjs`)

**Module Boundaries:**
- `core.cjs`: Shared utilities, constants, path helpers, model resolution, output/error handling
- `config.cjs`: Config file CRUD operations
- `phase.cjs`: Phase directory and lifecycle operations
- `roadmap.cjs`: ROADMAP.md parsing and updates
- `frontmatter.cjs`: YAML frontmatter parsing and serialization
- `state.cjs`: STATE.md reading and writing
- `verify.cjs`: Verification and validation operations
- `commands.cjs`: CLI command dispatcher
- `gsd-tools.cjs`: Main entry point that routes to command modules

**Barrel Files:**
- Not used; each test explicitly requires needed functions
- Single responsibility per require: `require('./core.cjs')` imports all core utilities

---

*Convention analysis: 2026-03-11*
