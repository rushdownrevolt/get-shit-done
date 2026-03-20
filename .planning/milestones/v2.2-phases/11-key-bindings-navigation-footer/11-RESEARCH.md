# Phase 11: Key Bindings & Navigation Footer - Research

**Researched:** 2026-03-13
**Domain:** Node.js CLI keypress handling, progressive hint display, context-aware footer rendering
**Confidence:** HIGH

## Summary

This phase adds two new key bindings (M for module picker, H for hints) to the existing lesson navigation loop and makes the navigation footer context-dependent. The codebase is well-structured for these additions: `waitForKey()` in navigator.cjs already handles five keys with a clean pattern, `runNavigationLoop()` already returns `{ reason: 'modules' }` and the dispatch loop in gsd-learn.cjs already handles the `'modules'` return reason with `action = 'picker'`. The hint infrastructure (`getNextHint`, `hints.json` files, feedback tracking) exists from the CLI `--hint` flag and just needs to be wired into the navigation loop.

The main work is: (1) adding M and H key handlers to `waitForKey()`, (2) handling those actions in `runNavigationLoop()` -- M saves position and returns `{ reason: 'modules' }`, H loads and displays the next hint inline, (3) making the footer string in `renderPart()` dynamic based on whether the current step is a mini-project step.

**Primary recommendation:** Extend the existing key handler pattern in `waitForKey()`, handle new actions in `runNavigationLoop()`, and parameterize the footer string in `renderPart()` with a context object. Keep changes minimal and follow established patterns exactly.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None explicitly locked -- all implementation details are at Claude's discretion.

### Claude's Discretion
- **M key behavior**: How position is saved before jumping to picker, whether there's a visual confirmation or immediate jump. Prior context: `runNavigationLoop` already returns `{ reason: 'modules' }` and the dispatch loop already handles `action = 'picker'` -- just needs the M keypress wired in `waitForKey()`.
- **H key & inline hints**: How hints display inline during mini-project steps (overlay, append, replace section). Currently hints are CLI-only via `--hint` flag with `hints.json` arrays. Need to load hints within the navigation loop and show progressively on H press. Detection of mini-project step needed to gate H availability.
- **Footer layout & context rules**: How the footer adapts based on context. Current hardcoded footer: `[w] Next  [q] Back  [e] Skip lesson  [c] Copy  [esc] Quit`. Requirements say: M always visible, H only on mini-project steps, arrows/c/q as before. Claude decides exact layout, spacing, and conditional logic.
- All wording, spacing, visual treatment, and edge case handling

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NAV-02 | User can press "M" from any lesson to return to module picker | `waitForKey()` needs 'm' -> 'modules' mapping; `runNavigationLoop()` saves progress via existing `progressFn` then returns `{ reason: 'modules' }`; dispatch loop already handles this return reason |
| NAV-03 | User can press "H" on mini-project step to see progressive hints | Hints infrastructure exists (`getNextHint`, `hints.json`, feedback tracking); needs hint state passed into `runNavigationLoop` opts; mini-project detection via `lesson.content.some(s => s.type === 'project')`; H key gated to only resolve on project steps |
| NAV-04 | Footer displays available keys based on current context | Footer in `renderPart()` line 262 is hardcoded string; needs to become a function accepting context flags (`isMiniProjectStep`); M always shown, H only on project steps |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js readline | built-in | Keypress event handling | Already used in `waitForKey()` and `waitForPickerKey()` |
| node:test | built-in | Test framework | Already used across all test files |
| node:assert | built-in | Assertions | Already used across all test files |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| hints.cjs | local | `getNextHint(hints, hintsUsed)` | When H is pressed on a mini-project step |
| feedback.cjs | local | `loadFeedback`, `recordEvent` | Track hint usage for progressive reveal |
| renderer.cjs | local | `renderPart`, footer rendering | Context-aware footer generation |

No new dependencies needed. Everything is built on existing project modules.

## Architecture Patterns

### Current Key Handler Pattern (FOLLOW EXACTLY)
```javascript
// In waitForKey() -- existing pattern for each key:
if (key.name === 'x') {
  cleanup(); resolve('action');
}
```

Add M and H following the same pattern:
```javascript
} else if (key.name === 'm') {
  cleanup(); resolve('modules');
} else if (key.name === 'h') {
  cleanup(); resolve('hint');
}
```

### Navigation Loop Action Handler Pattern
```javascript
// In runNavigationLoop() inner while(true) -- existing pattern:
} else if (action === 'quit') {
  progressFn(currentLesson);
  return { reason: 'quit' };
}
```

Add modules handler:
```javascript
} else if (action === 'modules') {
  progressFn(currentLesson);
  return { reason: 'modules' };
}
```

### Hint Display Pattern (Inline, Below Current Content)
The hint action should NOT return from the loop. It should display the hint inline and re-render. Pattern:
```javascript
} else if (action === 'hint') {
  // Only act if current step has project content
  if (opts && opts.hints && isMiniProjectStep(lesson)) {
    const result = getNextHint(opts.hints, opts.hintsUsed || 0);
    if (result.hint !== null) {
      opts.hintsUsed = result.hintsUsed;
      // Display hint inline (append to screen, don't re-render)
      process.stdout.write('\n  ' + style('Hint ' + result.hintsUsed + ' of ' + opts.hints.length + ':', 'yellow', 'bold') + '\n');
      process.stdout.write('  ' + result.hint + '\n');
      if (result.remaining > 0) {
        process.stdout.write('  ' + style(result.remaining + ' hint(s) remaining', 'dim') + '\n');
      }
      // Record hint event
      if (opts.recordHintFn) opts.recordHintFn(result.hintsUsed - 1);
    }
  }
  continue; // Stay on current step
}
```

### Footer Context Pattern
Replace hardcoded footer string with a function:
```javascript
function renderNavigationFooter(opts) {
  const keys = ['[w] Next', '[q] Back', '[e] Skip lesson', '[c] Copy'];
  keys.push('[m] Modules');
  if (opts && opts.isMiniProjectStep) {
    keys.push('[h] Hint');
  }
  keys.push('[esc] Quit');
  return '  ' + keys.join('  ');
}
```

### Mini-Project Step Detection
Already established in the codebase:
```javascript
const isMiniProjectStep = lesson.content.some(s => s.type === 'project');
```

This checks whether ANY content item in the lesson is a project block. Since hints are per-module (not per-step), this is the correct granularity. Only lesson 06 in each module has project content.

### Data Flow for Hints
```
gsd-learn.cjs (navigate branch)
  -> loads hints.json for active module
  -> loads feedback to get hintsUsed count
  -> passes { hints, hintsUsed, recordHintFn } in opts to runNavigationLoop
  -> runNavigationLoop uses these when H is pressed
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hint progression | Custom hint counter | `getNextHint()` from hints.cjs | Already handles bounds checking, returns hint/remaining/count |
| Hint tracking | Custom persistence | `recordEvent` + `loadFeedback` from feedback.cjs | Already tracks hint_requested events per project |
| Key handling | New input system | Extend existing `waitForKey()` | Pattern is proven, handles raw mode cleanup properly |

## Common Pitfalls

### Pitfall 1: Forgetting to Clean Up Raw Mode on M Key
**What goes wrong:** If M exits the navigation loop without proper cleanup, stdin stays in raw mode
**Why it happens:** The cleanup happens inside `waitForKey()` before resolving, but `runNavigationLoop` also calls `setupCleanExit`
**How to avoid:** M action follows the same pattern as 'quit' -- `progressFn(currentLesson); return { reason: 'modules' };` -- the `waitForKey` cleanup runs before resolve, so this is safe
**Warning signs:** Terminal becomes unresponsive after pressing M

### Pitfall 2: H Key Active on Non-Project Lessons
**What goes wrong:** Pressing H on a regular text lesson tries to show hints when there are none
**Why it happens:** Not gating the hint action on mini-project detection
**How to avoid:** Check `isMiniProjectStep(lesson)` before acting on the hint action. Also don't show [h] in footer unless on a project step. The key can still be pressed but should be silently ignored.
**Warning signs:** Error or undefined hint text on normal lessons

### Pitfall 3: Hint Count Not Persisting Across Sessions
**What goes wrong:** User sees the same hints every time they re-enter a mini-project lesson
**Why it happens:** hintsUsed is initialized from feedback events but not persisted during the session
**How to avoid:** Use `recordEvent(cwd, projectId, 'hint_requested', ...)` on each H press, and initialize hintsUsed from `loadFeedback()` count of hint_requested events when entering navigate mode
**Warning signs:** Hints reset to #1 on every lesson visit

### Pitfall 4: Footer in renderLesson vs renderPart
**What goes wrong:** Only renderPart gets the dynamic footer, but renderLesson still has the old hardcoded footer
**Why it happens:** renderLesson (line 69) has a separate hardcoded footer from renderPart (line 262)
**How to avoid:** Both functions need the same dynamic footer. However, `renderLesson` appears to be unused in the current flow -- `renderPart` is the active renderer called by `runNavigationLoop`. Verify by searching for `renderLesson` calls. If unused, update it for consistency but prioritize `renderPart`.
**Warning signs:** Inconsistent footer display in edge cases

### Pitfall 5: Module ID Mismatch for Hints Path
**What goes wrong:** hints.json path doesn't match the active module ID
**Why it happens:** hardcoded module ID instead of using `activeModuleId`
**How to avoid:** Build hints path from `activeModuleId`: `path.join(contentDir, 'modules', activeModuleId, 'project', 'hints.json')`
**Warning signs:** File not found error or wrong module's hints shown

## Code Examples

### Existing waitForKey Pattern (Source: learn/lib/navigator.cjs:35-64)
```javascript
function waitForKey() {
  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    const handler = (str, key) => {
      if (!key) return;
      if (key.name === 'w') { cleanup(); resolve('next'); }
      else if (key.name === 'q') { cleanup(); resolve('prev'); }
      // ... etc
    };
    function cleanup() {
      process.stdin.removeListener('keypress', handler);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.stdin.pause();
    }
    process.stdin.on('keypress', handler);
    process.stdin.resume();
  });
}
```

### Existing Hint Infrastructure (Source: learn/lib/hints.cjs)
```javascript
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
```

### Existing Dispatch Loop (Source: learn/bin/gsd-learn.cjs:239-249)
```javascript
if (result.reason === 'quit') {
  break;
} else if (result.reason === 'modules') {
  action = 'picker';
  continue;
} else if (result.reason === 'completed') {
  progress.modules[activeModuleId].completed = true;
  saveProgress(cwd, progress);
  action = 'picker';
  continue;
}
```

### Hints Path Pattern (Source: learn/bin/gsd-learn.cjs:103)
```javascript
const hintsPath = path.join(__dirname, '..', 'content', 'modules', hintModuleId, 'project', 'hints.json');
```

### Current Hardcoded Footer (Source: learn/lib/renderer.cjs:262)
```javascript
parts.push('  [w] Next  [q] Back  [e] Skip lesson  [c] Copy  [esc] Quit');
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single module, no picker | Hub-and-spoke with module picker | Phase 10 (v2.2) | M key now has a destination to return to |
| CLI-only hints (`--hint` flag) | Will add inline H key hints | Phase 11 | Users don't need to exit lesson flow for hints |
| Hardcoded footer | Will be context-dependent | Phase 11 | Footer accurately reflects available actions |

## Open Questions

1. **Should renderLesson also get the dynamic footer?**
   - What we know: `renderLesson` has a hardcoded footer at line 69 but appears unused in current navigation flow (renderPart is used exclusively via renderFn)
   - What's unclear: Whether any code path still calls renderLesson
   - Recommendation: Update for consistency but not critical path

2. **Should H key be completely silent on non-project steps, or show a brief message?**
   - What we know: The CONTEXT.md says H only on mini-project steps. Footer won't show [h] on non-project steps.
   - Recommendation: Silently ignore -- no footer key means no expectation

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | none -- uses node --test directly |
| Quick run command | `node --test learn/tests/navigator.test.cjs learn/tests/renderer.test.cjs` |
| Full suite command | `node --test learn/tests/*.test.cjs` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NAV-02 | M key returns 'modules' action from waitForKey | unit (export/contract) | `node --test learn/tests/navigator.test.cjs` | Existing file, needs new tests |
| NAV-02 | runNavigationLoop returns { reason: 'modules' } on M press | manual-only | N/A -- requires TTY | N/A |
| NAV-03 | getNextHint returns correct progressive hints | unit | `node --test learn/tests/hints.test.cjs` | Existing |
| NAV-03 | H key triggers hint display on project steps only | manual-only | N/A -- requires TTY | N/A |
| NAV-04 | renderNavigationFooter shows M always, H conditionally | unit | `node --test learn/tests/renderer.test.cjs` | Existing file, needs new tests |

### Sampling Rate
- **Per task commit:** `node --test learn/tests/navigator.test.cjs learn/tests/renderer.test.cjs`
- **Per wave merge:** `node --test learn/tests/*.test.cjs`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `learn/tests/renderer.test.cjs` -- add tests for dynamic footer with/without mini-project context
- [ ] `learn/tests/navigator.test.cjs` -- add tests verifying 'modules' and 'hint' are valid action types in the export contract

## Sources

### Primary (HIGH confidence)
- Direct code reading: `learn/lib/navigator.cjs` -- waitForKey, runNavigationLoop, waitForPickerKey patterns
- Direct code reading: `learn/lib/renderer.cjs` -- renderPart, renderLesson, renderLessonProgressFooter, footer hardcoding
- Direct code reading: `learn/bin/gsd-learn.cjs` -- dispatch loop, hint CLI logic, module loading
- Direct code reading: `learn/lib/hints.cjs` -- getNextHint API
- Direct code reading: `learn/content/modules/*/project/hints.json` -- hint data format (flat string arrays)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all code directly inspected, no external dependencies
- Architecture: HIGH - extending established patterns with minimal new logic
- Pitfalls: HIGH - identified from direct code analysis of edge cases

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable internal codebase, no external dependencies)
