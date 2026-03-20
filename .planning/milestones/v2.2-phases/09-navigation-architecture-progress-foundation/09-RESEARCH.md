# Phase 9: Navigation Architecture & Progress Foundation - Research

**Researched:** 2026-03-13
**Domain:** Node.js CLI navigation loop refactoring, JSON schema migration, progress state management
**Confidence:** HIGH

## Summary

This phase transforms the linear `gsd-learn.cjs` main flow into a loop-based architecture where `runNavigationLoop` returns an exit reason, enabling the outer loop to dispatch to a module picker (Phase 10) or quit. The progress schema must be upgraded from v2 to v3, adding per-module `completed` flag and ensuring each module independently tracks its lesson position. The existing v1-to-v2 migration pattern in `progress.cjs` provides a proven template for the v2-to-v3 migration.

The codebase is small (5 core files), well-structured, and uses only Node.js built-ins (no external dependencies). All changes are internal refactoring with a clear contract change: `runNavigationLoop` goes from returning `void` to returning `{ reason: 'quit' | 'modules' | 'completed' }`. The `gsd-learn.cjs` main() function wraps its current logic in a while-loop that re-dispatches based on the return reason.

**Primary recommendation:** Follow the existing migration pattern exactly (detect version, transform, save immediately), make `runNavigationLoop` return an exit-reason object, and restructure `main()` into a `while(true)` dispatch loop.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Returning users land straight into their last lesson position -- no interruption, no "welcome back" message
- First-time users (no progress) go to welcome screen (Phase 10 builds this; Phase 9 just detects the state)
- If user's last position was the final part of the final lesson, resume there anyway -- user can press M to go elsewhere
- No "resuming..." flash or delay
- Each module independently remembers its own lesson position in progress.modules map
- When switching modules, the previous module's position is saved and the new module resumes from its saved position
- When switching to an unstarted module, show a brief module intro (title + description + "Press any key to begin") before starting Lesson 1
- The top-level currentModule/currentLesson in progress.json tracks the most recently active module (for resume-on-launch)
- A module is "completed" when the user views the last part of the last lesson (automatic, no gating on mini-project)
- Completion is stored as a boolean `completed` flag in progress.modules[id]
- The `modules` map in progress.json already exists with `currentLesson` and `started` per module -- extend it, don't replace it

### Claude's Discretion
- Navigator return value shape (e.g., `{ reason: 'quit' | 'modules' | 'completed' }` or simpler)
- Progress schema version number (v3 or whatever makes sense)
- How the outer loop in gsd-learn.cjs is structured
- Migration strategy from v2 to v3

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WELC-02 | System detects first-run vs returning user | First-run detection via `isFirstRun()` helper checking if any module has `started: true` in progress.modules map. See Architecture Pattern 1. |
| NAV-01 | Returning user resumes at their last lesson position on launch | Progress v3 schema stores per-module `currentLesson`; top-level `currentModule`/`currentLesson` track last active. `main()` reads these on launch and passes `startIndex` to nav loop. See Architecture Pattern 2. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:readline | Node built-in | Keypress events for navigation | Already used in navigator.cjs |
| node:fs | Node built-in | Progress file read/write | Already used in progress.cjs |
| node:test | Node built-in | Test runner | Already used across all test files |
| node:assert | Node built-in | Test assertions | Already used across all test files |

### Supporting
No external dependencies. This project intentionally uses only Node.js built-ins.

### Alternatives Considered
None -- the project has zero external dependencies and this phase does not introduce any new technology needs.

## Architecture Patterns

### Recommended Changes to Existing Structure
```
learn/
  bin/
    gsd-learn.cjs          # MODIFY: wrap main() in dispatch loop
  lib/
    progress.cjs            # MODIFY: add v2->v3 migration, isFirstRun(), completion helpers
    navigator.cjs           # MODIFY: return exit reason from runNavigationLoop
    lessons.cjs             # NO CHANGE (listModules already exists)
  tests/
    progress.test.cjs       # MODIFY: add v3 migration tests, isFirstRun tests
    navigator.test.cjs      # MODIFY: add return-value contract tests
```

### Pattern 1: First-Run Detection (WELC-02)

**What:** A pure function that checks progress state to determine if this is a first-time user.
**When to use:** At the top of the main dispatch loop to decide between welcome flow (Phase 10) and resume flow.

```javascript
// In progress.cjs
function isFirstRun(progress) {
  // First run = no module has ever been started
  const moduleEntries = Object.values(progress.modules || {});
  return moduleEntries.length === 0 || !moduleEntries.some(m => m.started);
}
```

**Key insight:** The progress.modules map is empty `{}` for brand-new users. For users who have started any module, at least one entry will have `started: true`. This is a clean binary check.

**Phase 9 scope:** Export `isFirstRun()` and use it in `main()` to branch. Phase 9 detects the state; Phase 10 builds the actual welcome screen. In Phase 9, first-run users should fall through to the default module (gsd-commands) since the welcome screen doesn't exist yet.

### Pattern 2: Navigation Loop Return Contract

**What:** `runNavigationLoop` returns an object describing why it exited, instead of `void`.
**When to use:** Every call to `runNavigationLoop` should handle the return value.

```javascript
// Return value shape
// { reason: 'quit' }       -- user pressed Escape/Ctrl+C
// { reason: 'modules' }    -- user pressed M (Phase 11 adds the key; Phase 9 adds the contract)
// { reason: 'completed' }  -- user reached end of final lesson

async function runNavigationLoop(lessons, startIndex, renderFn, progressFn, opts) {
  // ... existing loop logic ...

  // At completion banner (line ~122 current):
  return { reason: 'completed' };

  // At quit action (line ~158 current):
  return { reason: 'quit' };

  // Future: M key handler returns { reason: 'modules' }
  // Phase 9 just establishes the contract; Phase 11 adds the M key binding
}
```

**Important:** The current `return;` statements on lines 122 and 158 become `return { reason: 'completed' }` and `return { reason: 'quit' }` respectively. The implicit end-of-loop fall-through should also return `{ reason: 'completed' }`.

### Pattern 3: Outer Dispatch Loop in main()

**What:** Transform the linear `main()` into a loop that can re-enter module selection.
**When to use:** This is the new structure of `gsd-learn.cjs`.

```javascript
async function main() {
  // ... validation, flag handling (--reset, --status, --verify, --hint) unchanged ...

  const progress = loadProgress(cwd);
  const contentDir = path.join(__dirname, '..', 'content');

  // Phase 9: detect first-run (Phase 10 will use this for welcome screen)
  const firstRun = isFirstRun(progress);

  // Determine starting module
  let activeModuleId = progress.currentModule || 'gsd-commands';

  let action = 'navigate'; // or 'welcome' or 'picker' in future phases

  while (true) {
    if (action === 'navigate') {
      const mod = loadModule(activeModuleId, contentDir);
      const moduleProgress = progress.modules[activeModuleId] || { currentLesson: 0, started: false };
      const startIndex = Math.min(moduleProgress.currentLesson || 0, mod.lessons.length - 1);

      // Mark module as started, update top-level tracking
      progress.currentModule = activeModuleId;
      if (!progress.modules[activeModuleId]) {
        progress.modules[activeModuleId] = { currentLesson: 0, started: true, completed: false };
      }
      progress.modules[activeModuleId].started = true;

      // ... set up renderFn, progressFn ...

      const result = await runNavigationLoop(mod.lessons, startIndex, renderFn, progressFn, opts);

      if (result.reason === 'quit') {
        break;
      } else if (result.reason === 'modules') {
        action = 'picker'; // Future: Phase 10 handles this
        continue;
      } else if (result.reason === 'completed') {
        progress.modules[activeModuleId].completed = true;
        saveProgress(cwd, progress);
        break; // Phase 10 will change this to go to picker
      }
    }
    // Future: action === 'welcome', action === 'picker'
    break;
  }

  process.stdout.write('\nGoodbye! Your progress has been saved.\n');
}
```

### Pattern 4: Progress Schema v2 to v3 Migration

**What:** Extend the existing migration chain to add v3 fields.
**When to use:** In `loadProgress()` after the existing v1-to-v2 migration.

```javascript
const DEFAULT_PROGRESS = {
  version: 3,
  currentModule: null,
  currentLesson: 0,
  modules: {},
};

function migrateV2toV3(progress) {
  if (progress.version >= 3) return progress;

  const migrated = {
    version: 3,
    currentModule: progress.currentModule,
    currentLesson: progress.currentLesson,
    modules: {},
  };

  // Preserve all existing module data, add completed field
  for (const [id, modData] of Object.entries(progress.modules || {})) {
    migrated.modules[id] = {
      ...modData,
      completed: modData.completed || false,
    };
  }

  return migrated;
}

function loadProgress(cwd) {
  // ... existing read logic ...

  // Chain migrations: v1 -> v2 -> v3
  if (progress.version < 2) {
    progress = migrateV1toV2(progress);
  }
  if (progress.version < 3) {
    progress = migrateV2toV3(progress);
    saveProgress(cwd, progress);  // Persist migration
  }

  return progress;
}
```

**Critical detail:** The v1-to-v2 migration already runs first. The v2-to-v3 migration only adds `completed: false` to existing module entries. Zero data loss by design.

### Pattern 5: Per-Module Position Saving in progressFn

**What:** The `progressFn` callback must save lesson position to both top-level AND per-module state.
**When to use:** In the progressFn closure within the dispatch loop.

```javascript
const progressFn = (idx) => {
  // Top-level (for resume-on-launch)
  progress.currentLesson = idx;
  // Per-module (for module switching)
  progress.modules[activeModuleId].currentLesson = idx;
  saveProgress(cwd, progress);
};
```

**Key insight:** The current `progressFn` only updates `progress.currentLesson` (top-level). It does NOT update the per-module entry. This means module switching would lose position. The fix is a one-line addition.

### Anti-Patterns to Avoid
- **Don't add a "resuming..." message or delay:** User decision explicitly forbids this. Resume should be instant and silent.
- **Don't gate completion on mini-project:** Completion fires when user views last part of last lesson, period.
- **Don't replace the modules map:** Extend existing entries with `completed` field, don't rebuild.
- **Don't couple first-run detection to welcome screen:** Phase 9 detects the state; Phase 10 renders the screen. Keep them separate.
- **Don't add M key handling in Phase 9:** Phase 9 establishes the return contract (`reason: 'modules'`). Phase 11 adds the actual M keybinding in `waitForKey`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema migration | Custom diffing/patching | Chained version-check functions (migrateV1toV2, migrateV2toV3) | Proven pattern already in codebase; simple, linear, testable |
| Module listing | Custom directory scanning | `listModules()` from lessons.cjs | Already exists, returns sorted metadata |
| Keypress handling | Raw stdin parsing | `waitForKey()` from navigator.cjs | Already handles raw mode, cleanup, key mapping |

## Common Pitfalls

### Pitfall 1: progressFn Only Updating Top-Level State
**What goes wrong:** Module switching appears to work but position is lost because `progressFn` only writes to `progress.currentLesson`, not `progress.modules[id].currentLesson`.
**Why it happens:** The current progressFn closure only updates the top-level field.
**How to avoid:** Always update BOTH `progress.currentLesson` AND `progress.modules[activeModuleId].currentLesson` in the progressFn.
**Warning signs:** Switching away from a module and back resets to lesson 0.

### Pitfall 2: Migration Not Persisting to Disk
**What goes wrong:** v2-to-v3 migration runs in memory but isn't saved, so it re-runs every launch.
**Why it happens:** Forgetting to call `saveProgress()` after migration.
**How to avoid:** Follow the v1-to-v2 pattern exactly -- it calls `saveProgress(cwd, migrated)` immediately after migration.
**Warning signs:** Progress file on disk still shows `"version": 2` after migration should have run.

### Pitfall 3: startIndex Exceeding Lesson Count
**What goes wrong:** If a module's saved `currentLesson` exceeds the actual lesson count (e.g., content was shortened), the nav loop crashes or shows blank.
**Why it happens:** Stale progress data pointing to a lesson that no longer exists.
**How to avoid:** Already handled: `Math.min(moduleProgress.currentLesson || 0, mod.lessons.length - 1)`. Ensure this pattern is used in the new code.
**Warning signs:** Crash on launch with a specific module.

### Pitfall 4: Completion Flag Set Prematurely
**What goes wrong:** Module marked complete before user actually views the last part.
**Why it happens:** Setting `completed = true` at lesson transition instead of at the actual end.
**How to avoid:** Set `completed = true` only when `runNavigationLoop` returns `{ reason: 'completed' }`. The navigator already detects end-of-module (line 107-121 in current code).
**Warning signs:** Module shows "Completed" after reaching last lesson but not last part.

### Pitfall 5: Breaking the Existing Return Behavior
**What goes wrong:** Code that currently doesn't check return value of `runNavigationLoop` breaks when it starts returning an object.
**Why it happens:** In JavaScript, changing `return;` to `return { reason: 'quit' }` is backward-compatible (callers that ignore the return value are unaffected). This is actually safe.
**How to avoid:** Not a real risk in JavaScript, but verify no code does `if (!result)` type checks on the return value.

## Code Examples

### v2 Progress Data (Current)
```json
{
  "version": 2,
  "currentModule": "gsd-commands",
  "currentLesson": 3,
  "modules": {
    "gsd-commands": { "currentLesson": 3, "started": true }
  }
}
```

### v3 Progress Data (Target)
```json
{
  "version": 3,
  "currentModule": "gsd-commands",
  "currentLesson": 3,
  "modules": {
    "gsd-commands": { "currentLesson": 3, "started": true, "completed": false },
    "command-lifecycle": { "currentLesson": 0, "started": false, "completed": false }
  }
}
```

### First-Run Progress Data
```json
{
  "version": 3,
  "currentModule": null,
  "currentLesson": 0,
  "modules": {}
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single module, linear flow | Per-module position tracking in dispatch loop | Phase 9 (now) | Enables module switching in Phase 10/11 |
| `runNavigationLoop` returns void | Returns `{ reason }` exit contract | Phase 9 (now) | Enables dispatch loop to re-enter picker |
| v2 schema (no completion) | v3 schema with `completed` boolean | Phase 9 (now) | Module picker can show completion state |

## Open Questions

1. **Should `currentLesson` at top level be kept in sync with per-module currentLesson?**
   - What we know: Currently `progress.currentLesson` is the only lesson tracker. After v3, each module has its own `currentLesson`.
   - What's unclear: Whether top-level `currentLesson` should be deprecated or kept as a convenience alias.
   - Recommendation: Keep top-level `currentLesson` in sync with the active module's lesson. It serves as the quick-access "where was I?" for resume-on-launch without needing to look up `progress.modules[progress.currentModule].currentLesson`. Both fields update together.

2. **Should the nav loop return `'completed'` or `'quit'` when user presses key after completion banner?**
   - What we know: Currently, after the completion banner, `waitForKey()` is called and then the function returns void.
   - What's unclear: Whether this should be `'completed'` (user finished the module) or `'quit'` (user dismissed).
   - Recommendation: Return `'completed'` -- the reason the loop ended is module completion, regardless of the key pressed to dismiss the banner. This lets the outer loop set `completed = true`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, Node 18+) |
| Config file | None (uses node --test directly) |
| Quick run command | `node --test learn/tests/progress.test.cjs learn/tests/navigator.test.cjs` |
| Full suite command | `node --test learn/tests/*.test.cjs` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WELC-02 | isFirstRun detects empty modules map as first-run | unit | `node --test learn/tests/progress.test.cjs` | Exists (needs new tests) |
| WELC-02 | isFirstRun detects started modules as returning user | unit | `node --test learn/tests/progress.test.cjs` | Exists (needs new tests) |
| NAV-01 | v2-to-v3 migration preserves currentLesson and adds completed | unit | `node --test learn/tests/progress.test.cjs` | Exists (needs new tests) |
| NAV-01 | v2-to-v3 migration is idempotent (v3 data unchanged) | unit | `node --test learn/tests/progress.test.cjs` | Exists (needs new tests) |
| NAV-01 | runNavigationLoop returns exit reason object | unit | `node --test learn/tests/navigator.test.cjs` | Exists (needs new tests) |
| NAV-01 | progressFn updates both top-level and per-module currentLesson | unit | `node --test learn/tests/progress.test.cjs` | Exists (needs new tests) |

### Sampling Rate
- **Per task commit:** `node --test learn/tests/progress.test.cjs learn/tests/navigator.test.cjs`
- **Per wave merge:** `node --test learn/tests/*.test.cjs`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `learn/tests/progress.test.cjs` -- needs new test cases for migrateV2toV3, isFirstRun, chained migration v1->v2->v3
- [ ] `learn/tests/navigator.test.cjs` -- needs return value contract tests (computePrevPosition tests exist; return value tests do not)

No new test files needed. Existing test files cover both modules; they just need additional test cases.

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `learn/lib/progress.cjs` (77 lines), `learn/lib/navigator.cjs` (185 lines), `learn/bin/gsd-learn.cjs` (184 lines), `learn/lib/lessons.cjs` (114 lines)
- Direct code inspection of `learn/tests/progress.test.cjs` (164 lines), `learn/tests/navigator.test.cjs` (98 lines)
- Current progress.json on disk: `{ "version": 2, "currentModule": "gsd-commands", "currentLesson": 0, "modules": {} }`
- Module metadata: 2 modules exist (gsd-commands order=1, command-lifecycle order=2)

### Secondary (MEDIUM confidence)
- None needed -- this is purely internal refactoring of well-understood code

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero external deps, all Node built-ins already in use
- Architecture: HIGH -- all source files read, patterns derived from existing code
- Pitfalls: HIGH -- derived from direct code analysis of actual data flow

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable internal codebase, no external dependency drift)
