# Codebase Concerns

**Analysis Date:** 2026-03-11

## Tech Debt

**Large Agent Definition Files:**
- Issue: Agent prompt files (`gsd-planner.md`, `gsd-debugger.md`) exceed 1200+ lines, making them difficult to maintain and refactor
- Files: `agents/gsd-planner.md` (1309 lines), `agents/gsd-debugger.md` (1257 lines), `agents/gsd-codebase-mapper.md` (772 lines)
- Impact: Changes to agent behavior require scanning massive monolithic files; increased risk of breaking existing instructions during edits
- Fix approach: Extract reusable instruction blocks into shared templates; consider splitting agent-specific sections into separate files

**Core Library Module Complexity:**
- Issue: `phase.cjs` is 901 lines with heavy phase directory scanning and normalization logic; difficult to test edge cases
- Files: `get-shit-done/bin/lib/phase.cjs`
- Impact: Changes to phase numbering/naming logic require extensive regression testing; subtle bugs in sorting/normalization compound
- Fix approach: Extract phase parsing into dedicated pure functions with unit tests; separate directory I/O from business logic

**State Mutation Without Locking:**
- Issue: `state.cjs` reads STATE.md, modifies it in memory, then writes back without any file locking or atomic operations
- Files: `get-shit-done/bin/lib/state.cjs` (especially `cmdStatePatch()` at line 121)
- Impact: If two GSD commands run in parallel against same STATE.md, race condition can corrupt the file
- Fix approach: Implement simple lock file mechanism or use atomic write-then-rename pattern; add test for concurrent patch attempts

**Workflow Agent Spawn Fragility:**
- Issue: 32 workflow/agent files contain spawn patterns that must be manually kept in sync across all files (e.g., `@file:` protocol handling)
- Files: All files in `get-shit-done/workflows/`, `agents/`
- Impact: Recent fix for `@file:` protocol (#841) had to be applied to all 32 files manually; future cross-cutting changes compound this risk
- Fix approach: Generate workflow/agent stanzas from templates rather than maintaining copies; DRY principle for spawn patterns

**Shell Script Quoting Inconsistencies:**
- Issue: Mix of shell quoting styles across workflow files (single quotes, double quotes, backticks); Windows PowerShell compatibility gaps
- Files: All workflow `.md` files containing bash code blocks
- Impact: Scripts fail on Windows or with arguments containing special characters; recent cross-platform fixes (#841) suggest ongoing fragility
- Fix approach: Standardize on `printf` (no echo); use consistent quoting for paths; validate syntax with ShellCheck

## Known Bugs

**Git Check-Ignore Edge Case:**
- Symptoms: `isGitIgnored()` may return incorrect results when `.gitignore` is not present or when checks run on Windows
- Files: `get-shit-done/bin/lib/core.cjs` (line 140)
- Trigger: Running GSD on fresh repo without .gitignore, or on Windows with non-standard path separators
- Workaround: Manually verify paths are in .gitignore; path separator normalization in `toPosixPath()` mitigates Windows cases
- Note: Function already uses `--no-index` flag to handle tracked files, but still vulnerable to missing .gitignore edge case

**Large Init Payload Truncation:**
- Symptoms: Init commands producing >50KB JSON output cause agent hallucination of `/tmp` paths instead of reading from actual temp file
- Files: `get-shit-done/bin/lib/core.cjs` (lines 40-48), affects all init consumers in workflows
- Trigger: Large projects with many phases, milestones, or complex state
- Workaround: Recent fix #841 adds `@file:` protocol prefix; all workflow/agent files must handle this prefix explicitly
- Risk: If any workflow/agent forgets to add `if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi` line, command will fail

**Milestone Info Resolution Precedence:**
- Symptoms: `getMilestoneInfo()` may return wrong milestone when in-progress milestones are nested in `<details>` blocks in MILESTONES.md
- Files: `get-shit-done/bin/lib/core.cjs` (getMilestoneInfo function)
- Trigger: MILESTONES.md with collapsed completed milestones using `<details>` tags
- Workaround: Ensure in-progress milestone marker appears before any collapsed sections
- Fix: Function now prefers in-progress marker over first milestone (v1.22.2 fix)

**State Field Parsing Fragility:**
- Symptoms: STATE.md field extraction fails silently if field format doesn't match bold (`**Field:**`) or plain (`Field:`) patterns
- Files: `get-shit-done/bin/lib/state.cjs` (stateExtractField function at line 12)
- Trigger: Custom field formats, inconsistent spacing, or malformed state files
- Workaround: Stick to bold/plain field formats; don't add extra whitespace around colons
- Fix approach: Add logging/errors when field not found; validate format during state creation

## Security Considerations

**Command Injection Risk in execGit:**
- Risk: Shell command construction via string concatenation, though some args are checked against whitelist regex
- Files: `get-shit-done/bin/lib/core.cjs` (line 156)
- Current mitigation: Arguments matching `[a-zA-Z0-9._\-/=:@]+` pass through; others are single-quoted and escaped
- Recommendations:
  - Consider using `execFile` with argument array instead of shell string concatenation (safer, eliminates quoting complexity)
  - Add unit tests for malicious input patterns (git branch names with special chars, commit messages with backticks, etc.)

**Shell Injection via Commit Messages:**
- Risk: Commit message stored in STATE.md could be re-executed if slurped into shell without proper quoting
- Files: Workflows that do `$(state get commit_message)` without quotes
- Current mitigation: Some workflows use `"$(state get ...)"` with double quotes, but consistency is not enforced
- Recommendations: Add linter rule; grep for `$(...)`-style usage in all workflows and wrap with quotes; document best practices

**Path Traversal in phase/file operations:**
- Risk: User-supplied phase names or file paths could contain `../` sequences
- Files: `get-shit-done/bin/lib/phase.cjs`, `get-shit-done/bin/lib/state.cjs` (path.join() calls)
- Current mitigation: `path.join()` normalizes paths, preventing traversal above base directories
- Recommendations: Add explicit validation that resolved paths remain within `.planning/` directory; add test cases for `../`, `...`, symlinks

**Environment Variable Exposure:**
- Risk: `process.env.BRAVE_API_KEY` and other secrets stored in env vars are logged or output in error messages
- Files: `get-shit-done/bin/lib/commands.cjs` (cmdWebsearch at line 320)
- Current mitigation: No explicit credential logging detected in search function
- Recommendations:
  - Audit all error paths for accidental env var logging
  - Never output `process.env` directly; sanitize before output
  - Add pre-commit hook to detect `process.env.` + credential-like names in logs/output

## Performance Bottlenecks

**Synchronous File Operations in Phase Scanning:**
- Problem: `phase.cjs` performs multiple synchronous `fs.readdirSync()` calls for each phase lookup; no caching
- Files: `get-shit-done/bin/lib/phase.cjs` (searchPhaseInDir function at line 214, used by findPhaseInternal)
- Cause: Every phase lookup triggers full directory scan; projects with 50+ phases incur O(n) I/O per command
- Improvement path:
  - Cache phase directory listing at startup (invalidated on phase directory changes)
  - Use `fs.watch()` to detect phase dir modifications and invalidate cache
  - Precompute phase map on `init`; store in `.planning/config.json` or `.planning/.phase-cache`

**Regex Compilation in Loops:**
- Problem: `comparePhaseNum()` compiles regex patterns every call; called in sorts
- Files: `get-shit-done/bin/lib/core.cjs` (comparePhaseNum at line 186, called from phase sorting)
- Cause: Line `String(a).match(/^(\d+)([A-Z])?((?:\.\d+)*)/i)` re-compiles on every comparison
- Improvement path: Pre-compile regex as module-level constant; reuse across all calls

**Git Command Spawning for Every Status Check:**
- Problem: Each `isGitIgnored()` call spawns a git subprocess; heavy workload if checking many files
- Files: `get-shit-done/bin/lib/core.cjs` (isGitIgnored at line 134)
- Cause: No caching of gitignore rules; every path requires a subprocess call
- Improvement path:
  - Cache gitignore rules once per run (read .gitignore, parse it, use in-process checks)
  - Or batch multiple file checks in single git call (git check-ignore supports multiple paths)

**JSON Serialization for Large Codebases:**
- Problem: `history-digest` and init commands serialize entire project state to JSON; large projects can exceed 50KB threshold
- Files: `get-shit-done/bin/lib/core.cjs` (output function at line 35)
- Cause: When JSON >50KB, written to temp file; agents must parse `@file:` protocol (complexity, risk of missing it)
- Improvement path:
  - Stream large responses to temp file directly instead of buffering in memory
  - Consider gzip compression for large payloads
  - Document expected maximum project size and provide guidance on splitting phases if threshold is hit

## Fragile Areas

**Frontmatter Parsing:**
- Files: `get-shit-done/bin/lib/frontmatter.cjs` (299 lines)
- Why fragile: YAML-like parsing with custom regex; edge cases with special chars in values, nested lists, or multiline strings
- Safe modification: Add test cases for edge cases (quotes in values, newlines, unicode); use stricter regex or switch to proper YAML parser if complexity grows
- Test coverage: Tests exist but may not cover all edge cases (multiline descriptions, escaped quotes in metadata)

**Phase Numbering and Sorting Logic:**
- Files: `get-shit-done/bin/lib/core.cjs` (comparePhaseNum, normalizePhaseName at lines 177-212)
- Why fragile: Complex regex and multi-part comparison logic for handling "01", "01A", "01.1", "01A.2" formats
- Safe modification: Any change to phase naming must include comprehensive tests for all format combinations; document the phase naming spec
- Test coverage: Good coverage (phase.test.cjs), but edge cases with unusual decimals or letters may not be tested

**Milestone Archival and Version Tracking:**
- Files: `get-shit-done/bin/lib/milestone.cjs` (241 lines), especially archival logic at line 131
- Why fragile: Archival deletes phases, renames files, creates archives; any file operation failure leaves partial state
- Safe modification: Must ensure all file ops are atomic or have rollback; add transaction-like logging
- Test coverage: Tests exist but may not cover failure cases (disk full, permission denied, concurrent access)

**State Patching Regex Replacements:**
- Files: `get-shit-done/bin/lib/state.cjs` (cmdStatePatch at line 121)
- Why fragile: Uses regex.replace() to update STATE.md fields; if pattern matching is wrong, could corrupt the file
- Safe modification: Validate regex patterns thoroughly; consider safer field update approach (parse structure, modify, regenerate)
- Test coverage: Tests exist, but edge cases with special regex chars in field names or values could break it

## Scaling Limits

**Phase Directory Count:**
- Current capacity: No hard limit; tested up to ~50 phases
- Limit: Beyond 100+ phases, `fs.readdirSync()` scans become noticeable; sorting becomes O(n log n)
- Scaling path: Implement phase caching; consider hierarchical phase directories (Phase 01-10, Phase 11-20, etc.) if scaling to 100+ phases

**State File Size:**
- Current capacity: No known limit; typical STATE.md is <10KB
- Limit: Very large STATE.md (>1MB) with many field updates could slow down patch operations
- Scaling path: For large projects, consider splitting STATE into separate files per concern (state.roles.md, state.decisions.md)

**JSON Payload Size:**
- Current capacity: Core.js buffers to 50KB before spilling to temp file
- Limit: Projects with 100+ phases and complex summaries exceed 50KB; agents must handle `@file:` protocol
- Scaling path: Increase threshold or implement streaming; ensure all workflow/agent consumers handle @file: protocol

**Concurrent Workflow Execution:**
- Current capacity: Assumes sequential execution; no file locking
- Limit: Running two GSD commands in parallel can corrupt STATE.md or git state
- Scaling path: Implement simple file locking (lock file in .planning/.locks/); document that GSD is not designed for parallel execution

## Dependencies at Risk

**No Production Dependencies:**
- Risk: GSD relies only on Node.js built-in modules (fs, path, child_process, os); no external package dependencies
- Impact: Reduces attack surface and dependency vulnerabilities
- Note: This is a strength, not a risk; but test suite uses built-in test runner (requires Node 18+)

**Node.js Version Requirement:**
- Risk: `package.json` specifies `"engines": { "node": ">=16.7.0" }` but codebase uses modern features (optional chaining, nullish coalescing)
- Files: `package.json` at line 39
- Impact: May not work on Node 16.7.0 (e.g., `exec` with custom options may not be available)
- Recommendations: Bump minimum version to 16.13.0+ or add compatibility shims; run tests against declared minimum version in CI

**Brave API Dependency (Optional):**
- Risk: Websearch feature depends on external Brave API; if API goes down or auth fails, feature silently degrades
- Files: `get-shit-done/bin/lib/commands.cjs` (cmdWebsearch at line 320)
- Impact: Users may not know why search is not working
- Recommendations: Log API failures at least once per session; consider fallback to built-in search

## Missing Critical Features

**No Rollback/Undo Mechanism:**
- Problem: GSD creates phase directories, commits, modifies STATE.md; no way to undo if something goes wrong
- Blocks: Users cannot safely experiment with GSD or recover from mistakes
- Impact: High; users must manually git reset or delete directories if workflow fails midway
- Recommendations: Add `gsd undo` command that reverts last commit and deletes created directories; maintain `.planning/.undo-stack` file

**No Atomic Multi-File Operations:**
- Problem: Commands like `complete-milestone` create archives, rename files, commit; if any step fails, partial state remains
- Blocks: Cannot safely complete milestones on unreliable systems (network mounts, Windows antivirus locking files)
- Impact: Medium; cleanup requires manual intervention
- Recommendations: Implement transaction-like semantics (write to .tmp files, validate, then move to final location)

**No Configuration Validation:**
- Problem: `config.json` is loaded but not validated against schema; malformed values are silently ignored
- Blocks: Users cannot detect config mistakes until runtime
- Impact: Low; defaults kick in, but confusing behavior
- Recommendations: Add `gsd config validate` command; schema file in `.planning/config.schema.json`

## Test Coverage Gaps

**Integration Tests Missing:**
- Untested area: Multi-step workflows like `complete-milestone` that touch multiple files and git operations
- Files: `get-shit-done/bin/lib/milestone.cjs`, workflow files
- Risk: Changes to phase archival or commit logic could break production workflows silently
- Priority: High
- Recommended tests: Full workflow execution (init → create phases → complete milestone) with pre/post validation

**Windows-Specific Test Coverage:**
- Untested area: Path separators, shell quoting, symlinks on Windows
- Files: All paths in phase.cjs, commands.cjs
- Risk: Cross-platform fixes like `toPosixPath()` and `@file:` protocol may still have gaps on Windows
- Priority: High (recent Windows bugs like #841 suggest gaps)
- Recommended: CI matrix with Windows + PowerShell execution

**Edge Cases in Regex Patterns:**
- Untested area: Phase names with unusual formats (leading zeros, multiple letters, deep decimals), state fields with special characters
- Files: `core.cjs` (comparePhaseNum), `state.cjs` (stateExtractField), `phase.cjs` (phase parsing)
- Risk: Subtle sorting bugs, field extraction failures on valid but unusual input
- Priority: Medium
- Recommended tests: Fuzzing with random phase names; test fields with quotes, newlines, unicode

**Error Path Coverage:**
- Untested area: Disk I/O failures (permission denied, disk full), git command failures, missing directories
- Files: All modules using fs.* and execGit()
- Risk: Error handling is sometimes swallowed with try/catch with no fallback
- Priority: Medium
- Recommended: Add chaos-engineering tests (mock fs failures, git failures) to ensure graceful degradation

**Concurrency and Race Conditions:**
- Untested area: Multiple GSD commands running in parallel; simultaneous file writes to STATE.md or phase directories
- Files: `state.cjs` (cmdStatePatch), all file-writing commands
- Risk: File corruption if two commands modify STATE.md simultaneously
- Priority: High
- Recommended: Add tests that spawn multiple child processes writing to same files; validate no corruption

