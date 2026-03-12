# Phase 3: Mini-Project Validation - Research

**Researched:** 2026-03-12
**Domain:** CLI capstone project verification, progressive hint system, feedback data collection
**Confidence:** HIGH

## Summary

Phase 3 adds three capabilities to the existing gsd-learn tool: (1) a mini-project lesson that caps the Command Lifecycle module, giving the learner a concrete task -- build a real GSD artifact using the commands they just learned, (2) a verify command that structurally checks whether the learner produced the expected artifact (checking for file existence, structure, and GSD-pattern usage -- not exact code matching), and (3) a progressive hint system that provides escalating nudges when the learner is stuck. Additionally, time-to-complete, hints requested, and verification attempts are tracked to a local JSON file as a quality signal for lesson effectiveness (MODL-04).

The technical domain is straightforward: all new code is Node.js with zero dependencies, following the established patterns from Phases 1 and 2. The mini-project itself is the design challenge -- it must be scoped tightly enough that a learner can complete it in one sitting, but substantive enough to prove they understood the Command Lifecycle. The verification must be structural (did they produce files with the right shape?) not semantic (did they write the exact right code?). The hint system is a simple array of strings served progressively, not an AI tutor.

The key risk flagged in STATE.md -- "Phase 3 mini-project validation design is novel -- needs prototyping during planning" -- is addressable because the existing codebase provides all the building blocks: the lesson JSON format supports new content sections, progress.cjs handles persistence (extensible for feedback data), and the CLI entry point already has flag parsing for new subcommands.

**Primary recommendation:** Add a `06-mini-project.json` lesson to the Command Lifecycle module with a new `type: "project"` content section defining the task. Build a `verifier.cjs` lib module that checks the filesystem for expected artifacts. Build a `hints.cjs` lib module that serves progressive hints from a JSON array. Add `--verify` and `--hint` flags to `gsd-learn`. Track feedback data in `.planning/learn/feedback.json`. The mini-project task: "Add a new GSD command called `echo` that takes a message argument and outputs it via the standard GSD output pattern" -- this exercises entry point routing, module patterns, and output conventions from the 5 preceding lessons.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VALD-01 | User can run a verify command to check if mini-project is complete | New `--verify` flag on gsd-learn CLI dispatches to `verifier.cjs` which checks filesystem for expected artifacts |
| VALD-02 | Mini-project validation checks structural use of GSD (produced a result), not exact code match | Verifier uses file existence checks, regex pattern matching for structural elements (exports, switch case entry), not string equality |
| VALD-03 | Progressive hint system provides nudges when learner is stuck without giving answers | New `--hint` flag on gsd-learn CLI dispatches to `hints.cjs` which serves hints from a progressive array, tracking count in progress |
| VALD-04 | Quality feedback loop tracks time-to-complete, hints used, and verification attempts | New `feedback.json` file in `.planning/learn/` stores timestamped events; written by verify and hint commands |
| MODL-03 | Module ends with a mini-project where learner uses GSD to build something real | New `06-mini-project.json` lesson added to command-lifecycle module with project instructions and success criteria |
| MODL-04 | Mini-project results serve as lesson quality measurement | Feedback data (time, hints, attempts) in feedback.json provides quantitative signal on whether 5 preceding lessons prepared learner adequately |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `fs` | Built-in | Check learner's artifact files, read/write feedback JSON | Matches existing codebase pattern |
| Node.js built-in `path` | Built-in | Cross-platform path resolution | GSD convention |
| Regex structural checks | N/A | Verify learner code has expected patterns (exports, function signatures) | Same approach as parser.cjs from Phase 2; no AST needed |
| JSON data files | N/A | Hint definitions, feedback tracking, project spec | Matches lesson JSON pattern from Phases 1-2 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:test` | Built-in (18+) | Unit tests for verifier, hints, feedback | All test files |
| `node:assert` | Built-in | Test assertions | Inside test functions |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Regex structural checks | AST parser (acorn) | Runtime dependency; overkill for checking "does this file export a function and add a switch case" |
| Progressive hint array | AI-powered hint generation | Adds LLM dependency; explicitly out of scope per requirements |
| Local JSON feedback | SQLite/database | Runtime dependency; JSON file is sufficient for single-user quality signal |

**Installation:**
```bash
# No runtime dependencies to install. Zero.
```

## Architecture Patterns

### Recommended Project Structure

New and modified files for Phase 3:

```
learn/
  bin/
    gsd-learn.cjs              # MODIFY: add --verify, --hint flags
  lib/
    verifier.cjs               # NEW: structural verification of mini-project artifacts
    hints.cjs                  # NEW: progressive hint serving with count tracking
    feedback.cjs               # NEW: feedback data collection (time, hints, attempts)
    lessons.cjs                # NO CHANGE: loads 06-mini-project.json like any lesson
    renderer.cjs               # MODIFY: render new "project" content type
    progress.cjs               # NO CHANGE: hint count stored in feedback.cjs, not progress
  content/
    modules/
      command-lifecycle/
        lessons/
          06-mini-project.json # NEW: capstone project lesson
        project/
          hints.json           # NEW: progressive hint array for the mini-project
          spec.json            # NEW: project specification (expected artifacts, checks)
  tests/
    verifier.test.cjs          # NEW
    hints.test.cjs             # NEW
    feedback.test.cjs          # NEW
```

### Pattern 1: Structural Verification (Not Code Matching)

**What:** The verifier checks that the learner produced artifacts with the right shape -- file exists, exports a function, has the right module pattern -- without comparing to a reference implementation.
**When to use:** The `--verify` command.
**Example:**
```javascript
// learn/lib/verifier.cjs
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Check if a file exists and contains expected structural patterns.
 *
 * @param {string} filePath - Path to check.
 * @param {Array<{pattern: RegExp, description: string}>} checks - Structural checks.
 * @returns {{ passed: boolean, results: Array<{check: string, passed: boolean}> }}
 */
function verifyArtifact(filePath, checks) {
  const results = [];

  if (!fs.existsSync(filePath)) {
    return { passed: false, results: [{ check: 'File exists: ' + filePath, passed: false }] };
  }
  results.push({ check: 'File exists: ' + filePath, passed: true });

  const content = fs.readFileSync(filePath, 'utf-8');
  for (const { pattern, description } of checks) {
    results.push({ check: description, passed: pattern.test(content) });
  }

  return {
    passed: results.every(r => r.passed),
    results,
  };
}

module.exports = { verifyArtifact };
```

### Pattern 2: Progressive Hint Delivery

**What:** Hints are stored as an ordered array. Each call to `--hint` increments a counter and reveals the next hint. Early hints are vague ("Think about where commands are routed"), later hints are specific ("Look at the switch statement in gsd-tools.cjs"). The final hint is nearly a walkthrough but still not the answer.
**When to use:** The `--hint` command.
**Example:**
```javascript
// learn/lib/hints.cjs
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Get the next hint for a project, tracking how many have been shown.
 *
 * @param {Array<string>} hints - Ordered hint array (vague to specific).
 * @param {number} hintsUsed - How many hints already shown.
 * @returns {{ hint: string|null, hintsUsed: number, remaining: number }}
 */
function getNextHint(hints, hintsUsed) {
  if (hintsUsed >= hints.length) {
    return { hint: null, hintsUsed, remaining: 0 };
  }
  return {
    hint: hints[hintsUsed],
    hintsUsed: hintsUsed + 1,
    remaining: hints.length - hintsUsed - 1,
  };
}

module.exports = { getNextHint };
```

### Pattern 3: Feedback Data Collection

**What:** Every verify attempt and hint request is logged to `feedback.json` with timestamps. This provides the quality measurement signal (MODL-04) without any infrastructure.
**When to use:** On each `--verify` and `--hint` invocation.
**Example:**
```javascript
// learn/lib/feedback.cjs
'use strict';

const fs = require('fs');
const path = require('path');

const FEEDBACK_PATH = path.join('.planning', 'learn', 'feedback.json');

function loadFeedback(cwd) {
  const filePath = path.join(cwd, FEEDBACK_PATH);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return { version: 1, projects: {} };
  }
}

function saveFeedback(cwd, feedback) {
  const filePath = path.join(cwd, FEEDBACK_PATH);
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(feedback, null, 2), 'utf-8');
}

/**
 * Record a feedback event for a project.
 *
 * @param {string} cwd - Working directory.
 * @param {string} projectId - Mini-project identifier.
 * @param {string} eventType - 'verify_attempt' | 'hint_requested' | 'project_started' | 'project_completed'
 * @param {object} [data] - Additional event data (e.g., { passed: true, checks: [...] })
 */
function recordEvent(cwd, projectId, eventType, data) {
  const feedback = loadFeedback(cwd);
  if (!feedback.projects[projectId]) {
    feedback.projects[projectId] = { events: [], startedAt: null, completedAt: null };
  }
  const project = feedback.projects[projectId];
  project.events.push({
    type: eventType,
    timestamp: new Date().toISOString(),
    data: data || {},
  });
  if (eventType === 'project_started' && !project.startedAt) {
    project.startedAt = new Date().toISOString();
  }
  if (eventType === 'project_completed') {
    project.completedAt = new Date().toISOString();
  }
  saveFeedback(cwd, feedback);
}

module.exports = { loadFeedback, saveFeedback, recordEvent, FEEDBACK_PATH };
```

### Pattern 4: Mini-Project Lesson Content

**What:** The mini-project lesson uses the existing lesson JSON schema but adds a `type: "project"` content section that the renderer displays differently (with clear task instructions, expected deliverables, and how-to-verify instructions).
**When to use:** The 06-mini-project.json lesson file.
**Example:**
```json
{
  "id": "mini-project",
  "title": "Mini-Project: Build a GSD Command",
  "lessonNumber": 6,
  "objective": "Apply everything from lessons 1-5 to add a new command to GSD",
  "content": [
    {
      "type": "text",
      "value": "You have traced the full command lifecycle. Now prove you understand it by building something real."
    },
    {
      "type": "project",
      "task": "Add a new 'echo' command to GSD that takes a message and outputs it using the standard GSD output pattern",
      "deliverables": [
        "A handler function in an appropriate lib/*.cjs file",
        "A new case in the gsd-tools.cjs switch statement",
        "Output that follows the GSD JSON/raw dual-output pattern"
      ],
      "verifyCommand": "node learn/bin/gsd-learn.cjs --verify",
      "hintCommand": "node learn/bin/gsd-learn.cjs --hint"
    }
  ],
  "conceptMap": "mini-project",
  "successCriteria": "Running --verify shows all checks passing: file exists, function exported, switch case added, output follows GSD pattern"
}
```

### Anti-Patterns to Avoid

- **Exact code matching:** Never compare learner output to a reference string. Check structural properties (file exists, exports present, pattern used) only. Different variable names, comments, and formatting are all valid.
- **AI-powered hints:** The hint system is a static array of strings, not a dynamic tutor. This stays within the "zero LLM dependency at runtime" constraint.
- **Complex project scope:** The mini-project must be completable in 15-30 minutes by someone who read the 5 preceding lessons. "Add an echo command" is the right granularity. "Build a new workflow orchestrator" is too ambitious.
- **Blocking verification:** Verification should be runnable multiple times without side effects. It reads the filesystem, reports results, and logs feedback. It never modifies the learner's code.
- **Over-engineering feedback schema:** The feedback file is a simple JSON append log. No aggregation, no dashboards, no statistics engine. The data exists for manual review to assess lesson quality before building Module 2.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON persistence | Custom serialization | `JSON.parse`/`JSON.stringify` with `fs.readFileSync`/`writeFileSync` | Matches progress.cjs pattern exactly |
| Timestamp generation | Custom date formatting | `new Date().toISOString()` | ISO 8601 is universally parseable |
| Regex escaping | Custom escape function | Copy the pattern from parser.cjs (already in the codebase) | Proven in Phase 2 |
| CLI flag parsing | Flag parsing library | Extend existing `flags` object in gsd-learn.cjs | Already works for --reset, --status, --module |
| File existence checks | Custom file system wrappers | `fs.existsSync()` | GSD convention throughout codebase |

**Key insight:** Phase 3's technical components are simple compositions of patterns already established in Phases 1 and 2. The novelty is in the mini-project design (what task to give the learner) and the verification logic (what structural checks to run), not in new infrastructure.

## Common Pitfalls

### Pitfall 1: Mini-Project Scope Creep
**What goes wrong:** The mini-project asks the learner to do too much (build a full workflow, modify multiple files across the codebase) and they get stuck not because lessons were bad but because the task was unreasonably large.
**Why it happens:** It feels like a bigger project = better validation. But a capstone should test comprehension of what was taught, not introduce new concepts.
**How to avoid:** The mini-project should exercise exactly the concepts from lessons 1-5: entry point routing, switch dispatch, module function pattern, output convention, and maybe config/state interaction. "Add a new echo command" hits 4 of these 5 and is completable in one sitting.
**Warning signs:** More than 3 files need to be created. Estimated time > 30 minutes. Learner needs knowledge not covered in lessons 1-5.

### Pitfall 2: Brittle Verification Checks
**What goes wrong:** Verification checks are too specific -- looking for exact function names, exact export syntax, or exact file paths. Any creative interpretation by the learner causes false negatives.
**Why it happens:** Writing structural checks is harder than writing exact-match checks. The temptation is to check `module.exports = { cmdEcho }` literally.
**How to avoid:** Check for patterns, not literals. "File exports at least one function" (check for `module.exports`), "Switch statement has a new case" (check for `case 'echo'` or whatever the command name is), "Function uses output() or process.stdout.write" (check for output pattern). Keep checks at 3-5 broad structural properties.
**Warning signs:** More than 6 verification checks. Any check that includes variable names. Regex patterns longer than one line.

### Pitfall 3: Hints That Give Away the Answer
**What goes wrong:** Progressive hints escalate too fast, with hint 2 or 3 basically being the solution. The learner uses hints as a walkthrough instead of thinking.
**Why it happens:** When writing hints, it is hard to calibrate the gap between "nudge" and "answer." The hint author knows the solution and forgets what the learner does not know.
**How to avoid:** Write 5-6 hints with deliberate escalation: (1) reframe the problem, (2) point to the relevant lesson, (3) name the specific file, (4) name the specific pattern, (5) describe the steps without code. Never include actual code in hints.
**Warning signs:** Any hint contains `function`, `const`, `module.exports`, or `case`. Fewer than 4 hints total.

### Pitfall 4: Feedback File Location Conflict
**What goes wrong:** Feedback data written to the same file as progress data, making the progress.json schema complex and backwards-incompatible.
**Why it happens:** Both are "learner state" and it seems natural to merge them.
**How to avoid:** Keep feedback.json separate from progress.json. They serve different purposes: progress tracks navigation position (needed every session), feedback tracks quality signals (needed once per mini-project, analyzed offline). Different files, different schemas, different update patterns.
**Warning signs:** progress.json grows beyond 4 top-level fields. Feedback events mixed into module progress.

### Pitfall 5: Verification Modifies Learner Code
**What goes wrong:** The verify command "fixes" or "normalizes" the learner's code as part of verification, or creates files that were supposed to be the learner's deliverable.
**Why it happens:** Trying to be helpful by auto-correcting issues found during verification.
**How to avoid:** Verification is read-only. It reads the filesystem, evaluates checks, reports results, logs feedback. It never writes to the learner's project files. The only writes are to feedback.json.
**Warning signs:** The verifier module imports `writeFileSync`. The verifier takes a `--fix` flag.

## Code Examples

### CLI Entry Point Modifications

```javascript
// learn/bin/gsd-learn.cjs additions
// Add to the flags dispatch section, after --status handling:

if (flags.verify) {
  // Run mini-project verification
  const { runVerification } = require('../lib/verifier.cjs');
  const result = runVerification(cwd, moduleId);
  process.stdout.write(result.output);
  process.exit(result.passed ? 0 : 1);
}

if (flags.hint) {
  // Show next progressive hint
  const { showNextHint } = require('../lib/hints.cjs');
  const result = showNextHint(cwd, moduleId);
  process.stdout.write(result.output);
  process.exit(0);
}
```

### Project Spec Format

```json
{
  "id": "command-lifecycle-project",
  "moduleId": "command-lifecycle",
  "title": "Build a GSD Echo Command",
  "description": "Add a new 'echo' command to gsd-tools.cjs that outputs a message using the standard GSD output pattern",
  "artifacts": [
    {
      "description": "Echo handler function exists",
      "path": "get-shit-done/bin/lib/echo.cjs",
      "checks": [
        { "pattern": "module\\.exports", "description": "File exports a module" },
        { "pattern": "function\\s+cmd", "description": "Follows the cmd* function naming convention" }
      ]
    },
    {
      "description": "Switch case added for echo command",
      "path": "get-shit-done/bin/gsd-tools.cjs",
      "checks": [
        { "pattern": "case\\s+['\"]echo['\"]", "description": "Echo case exists in switch statement" }
      ]
    }
  ]
}
```

### Verification Output Rendering

```javascript
// Rendered verification output example using existing terminal.cjs style utilities
const { style } = require('./terminal.cjs');

function formatVerificationResult(result) {
  const parts = [];
  parts.push(style('Mini-Project Verification', 'bold', 'cyan'));
  parts.push('\n\n');

  for (const check of result.results) {
    const icon = check.passed ? style('[PASS]', 'green') : style('[FAIL]', 'red');
    parts.push('  ' + icon + ' ' + check.check + '\n');
  }

  parts.push('\n');
  if (result.passed) {
    parts.push(style('All checks passed! Mini-project complete.', 'green', 'bold'));
  } else {
    parts.push(style('Some checks failed. Use --hint for guidance.', 'yellow'));
  }
  parts.push('\n');
  return parts.join('');
}
```

## The Mini-Project Design

### What the Learner Builds

The mini-project for the Command Lifecycle module asks the learner to **add a new `echo` command to GSD**. This is the right scope because:

1. **Entry point routing** (Lesson 2): They must add a `case 'echo':` to the switch statement
2. **Command dispatch** (Lesson 3): They must follow the two-level dispatch pattern
3. **Tool module patterns** (Lesson 4): They must create a `cmd*` function with the output/error exit pattern
4. **Output conventions** (Lessons 1, 4): They must use JSON/raw dual-output

What it does NOT require (keeping scope tight):
- No state.cjs or config.cjs interaction (optional stretch goal)
- No new file creation beyond 1 module + 1 switch case
- No knowledge of frontmatter, regex parsing, or the sync engine

### Alternative Mini-Project Considered

"Add a new `validate` subcommand that checks if a custom file exists" -- this was considered but rejected because it requires understanding the verify.cjs module, which is not covered in the 5 lessons. The echo command stays within lesson scope.

### Verification Checks (5 total)

1. File `get-shit-done/bin/lib/echo.cjs` exists
2. File contains `module.exports`
3. File contains a function following `cmd` naming convention
4. `gsd-tools.cjs` contains `case 'echo'` (or `case "echo"`)
5. The echo module file contains `process.stdout.write` or `output(` (output pattern)

These are broad enough that creative implementations pass, narrow enough that incomplete work fails.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Quiz-based validation | Project-based validation | Educational consensus | Testing creation > testing recall; more predictive of real capability |
| Exact output matching (like Exercism) | Structural verification | Modern learning tools | Allows creative solutions; reduces frustration from false negatives |
| Single hint / no hints | Progressive disclosure hints | Common in game tutorials | Reduces abandonment; preserves learning by not giving answer immediately |

**Deprecated/outdated:**
- Multiple-choice as learning validation: Explicitly out of scope per REQUIREMENTS.md. Project-based validation is the chosen model.

## Open Questions

1. **Exact mini-project task wording**
   - What we know: "Add an echo command" exercises 4 of 5 lesson concepts and is completable in ~20 minutes.
   - What's unclear: The exact wording, deliverable list, and success criteria for the lesson JSON. This is content design, not technical design.
   - Recommendation: Draft during planning, iterate during implementation. The verification checks constrain the space -- the lesson content just needs to describe what those checks expect.

2. **Whether learner modifies actual GSD files or a sandbox copy**
   - What we know: The task says "add a command to GSD." If the learner modifies the real gsd-tools.cjs, they are modifying a production tool.
   - What's unclear: Whether this is acceptable or whether we should provide a sandbox directory.
   - Recommendation: Let the learner modify the real files. The echo command is additive (new case, new file) and cannot break existing functionality. This reinforces the "build something real" principle. The lesson should note that `git checkout` can undo changes if needed.

3. **When to record "project_started" timestamp**
   - What we know: We need time-to-complete for VALD-04.
   - What's unclear: Whether "started" means "viewed the mini-project lesson" or "ran first verify/hint."
   - Recommendation: Record start time when the learner first views lesson 06 (the mini-project lesson). This requires a small modification to the navigation progress callback to detect when the mini-project lesson is first reached.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` + `node:assert` (built-in) |
| Config file | None -- run directly with `node --test` |
| Quick run command | `node --test learn/tests/verifier.test.cjs learn/tests/hints.test.cjs learn/tests/feedback.test.cjs` |
| Full suite command | `node --test learn/tests/*.test.cjs` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VALD-01 | --verify flag runs verification and reports pass/fail | integration | `node --test learn/tests/verifier.test.cjs` | Wave 0 |
| VALD-02 | Verification uses structural checks (regex), not exact match | unit | `node --test learn/tests/verifier.test.cjs` | Wave 0 |
| VALD-03 | --hint returns progressive hints, tracks count | unit | `node --test learn/tests/hints.test.cjs` | Wave 0 |
| VALD-04 | Feedback events logged to feedback.json with timestamps | unit | `node --test learn/tests/feedback.test.cjs` | Wave 0 |
| MODL-03 | 06-mini-project.json loads correctly as a lesson | unit | `node --test learn/tests/lessons.test.cjs` | Existing (extend) |
| MODL-04 | Feedback data captures time-to-complete, hints, attempts | unit | `node --test learn/tests/feedback.test.cjs` | Wave 0 |

### Sampling Rate

- **Per task commit:** `node --test learn/tests/verifier.test.cjs learn/tests/hints.test.cjs learn/tests/feedback.test.cjs`
- **Per wave merge:** `node --test learn/tests/*.test.cjs`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `learn/tests/verifier.test.cjs` -- covers VALD-01, VALD-02
- [ ] `learn/tests/hints.test.cjs` -- covers VALD-03
- [ ] `learn/tests/feedback.test.cjs` -- covers VALD-04, MODL-04

## Sources

### Primary (HIGH confidence)

- Existing codebase: `learn/lib/progress.cjs` -- persistence pattern to follow for feedback.cjs
- Existing codebase: `learn/lib/parser.cjs` -- regex structural analysis pattern to follow for verifier.cjs
- Existing codebase: `learn/bin/gsd-learn.cjs` -- CLI flag dispatch pattern to extend
- Existing codebase: `learn/lib/renderer.cjs` -- rendering pattern to extend for project content type
- Existing codebase: `learn/content/modules/command-lifecycle/lessons/*.json` -- lesson schema to match
- Existing codebase: `get-shit-done/bin/gsd-tools.cjs` -- the target GSD tool the learner modifies

### Secondary (MEDIUM confidence)

- GSD Learn REQUIREMENTS.md -- explicit out-of-scope items (no AI tutoring, no quizzes, no gamification)
- STATE.md blocker note -- "Phase 3 mini-project validation design is novel" (addressed by grounding in existing patterns)

### Tertiary (LOW confidence)

- None -- all findings grounded in existing codebase analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies; extends existing Node.js built-in patterns from Phases 1-2
- Architecture: HIGH -- all new modules follow established patterns (progress.cjs for persistence, parser.cjs for regex checks, renderer.cjs for display)
- Mini-project design: MEDIUM -- the "echo command" task is well-scoped but the exact lesson content and hint wording need iteration during implementation
- Pitfalls: HIGH -- scope creep and brittle verification are well-understood risks with clear mitigations

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable domain; extends existing codebase patterns)
