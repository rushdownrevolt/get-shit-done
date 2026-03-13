# Phase 10: Welcome Screen & Module Picker - Research

**Researched:** 2026-03-13
**Domain:** Terminal UI rendering, screen flow management, Node.js CLI
**Confidence:** HIGH

## Summary

Phase 10 adds two new screens (welcome and module picker) to the existing GSD Learn CLI application. The codebase is well-structured with clear patterns: pure rendering functions return strings, a dispatch loop in `gsd-learn.cjs` manages screen transitions via an `action` variable, and progress/module data APIs already exist. All building blocks are in place -- `listModules()`, `isFirstRun()`, `waitForKey()`, `style()`, `clearScreen()`, `horizontalRule()` -- the work is primarily composing these into new render functions and wiring up the dispatch loop.

The key architectural decision is the shared `renderModuleList()` helper that both the welcome screen and the standalone picker call. This avoids duplicated rendering logic (DISC-04) while allowing different headers (full pitch vs. slim welcome-back). The dispatch loop needs three new action branches: `'welcome'` (first-time), `'picker'` (returning/post-completion), and updated `'completed'` handling that transitions to picker instead of breaking.

**Primary recommendation:** Add `renderWelcomeScreen()`, `renderModulePicker()`, and shared `renderModuleList()` to `renderer.cjs`, then wire the dispatch loop in `gsd-learn.cjs` with `action === 'welcome'` and `action === 'picker'` branches.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Combined screen: welcome pitch + module picker on one screen (no separate "press any key" welcome gate)
- Title: "GSD Learn" at the top
- Horizontal rules separate pitch from module list
- Footer: "Press a number to begin"
- Modules listed with number keys: [1], [2], etc.
- Each module shows: title on first line, description on indented second line
- Module 1 gets a "Start here" text label (only shown for first-time users or when module is not started)
- Progress display: not started = blank (or "Start here" for Module 1), in progress = "Lesson X of Y", completed = "Completed checkmark"
- Returning users launch directly to last lesson (Phase 9 behavior preserved)
- When returning users reach picker (via M key or after module completion): "Pick up where you left off." as single-line replacement for full pitch
- Completion banner -> "Press any key to continue" -> welcome-back picker screen (not quit)
- Re-entering completed module starts from Lesson 1 (review mode)
- Picker quit (q): "Goodbye! Your progress has been saved."
- Shared rendering function takes: modules array, progress data, isFirstRun boolean

### Claude's Discretion
- Exact pitch wording (tone and structure locked, specific sentences flexible)
- Spacing and visual padding within the screen
- How module descriptions are truncated if too long
- Whether the completion banner needs any updates for the new flow

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WELC-01 | User sees a welcome screen with GSD pitch on first launch | `isFirstRun()` already detects first-time; new `renderWelcomeScreen()` composes pitch + module list |
| WELC-03 | Welcome copy communicates what learner will do after completing modules | Pitch text in welcome screen header area; tone locked as "confident & direct" |
| DISC-01 | User can select a module from picker showing all modules with progress | `listModules()` returns sorted metadata; progress data from `loadProgress()` has per-module state |
| DISC-02 | Module 1 is flagged as recommended for new users | "Start here" label on Module 1 when `isFirstRun` or module not started |
| DISC-03 | Returning users see slimmer welcome-back message on module page | `isFirstRun` boolean controls header: full pitch vs. "Pick up where you left off." |
| DISC-04 | Welcome and module picker share a single module list renderer | Shared `renderModuleList(modules, progress, isFirstRun)` helper called by both screens |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `node:test` | built-in | Test runner | Already used by all 16 test files in learn/tests/ |
| Node.js `node:assert` | built-in | Test assertions | Already used project-wide |
| Node.js `readline` | built-in | Keypress handling | Already used in navigator.cjs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `terminal.cjs` | project lib | ANSI styling, clearing, rules | All rendering functions |
| `progress.cjs` | project lib | Load/save progress, isFirstRun | Dispatch loop branching |
| `lessons.cjs` | project lib | listModules(), loadModule() | Module list data source |
| `navigator.cjs` | project lib | waitForKey() | Picker key handling |
| `renderer.cjs` | project lib | Rendering patterns | Add new functions here |

No external dependencies needed. This phase uses only existing project libraries and Node.js built-ins.

## Architecture Patterns

### File Locations
```
learn/
  bin/
    gsd-learn.cjs          # Dispatch loop (modify: add welcome/picker actions)
  lib/
    renderer.cjs            # Pure render functions (add: renderWelcomeScreen, renderModulePicker, renderModuleList)
    progress.cjs            # isFirstRun(), loadProgress() (no changes needed)
    lessons.cjs             # listModules() (no changes needed)
    navigator.cjs           # waitForKey() (possibly add waitForNumberKey helper)
    terminal.cjs            # style(), clearScreen(), horizontalRule() (no changes needed)
  tests/
    renderer.test.cjs       # Extend with welcome/picker render tests
```

### Pattern 1: Pure Render Functions (Existing Pattern)
**What:** All render functions return strings, never write to stdout directly. The caller writes.
**When to use:** Every new render function in this phase.
**Example from codebase:**
```javascript
// From renderer.cjs -- renderCompletionBanner returns a string
function renderCompletionBanner(opts) {
  const parts = [];
  parts.push(clearScreen());
  // ... compose parts ...
  return parts.join('');
}
// Caller in gsd-learn.cjs writes:
process.stdout.write(banner);
```

### Pattern 2: Dispatch Loop with Action Variable (Existing Pattern)
**What:** The main `while(true)` loop in gsd-learn.cjs switches on an `action` variable to determine which screen to show.
**When to use:** Adding welcome and picker screen transitions.
**Current code (line 143):**
```javascript
let action = 'navigate'; // Future: 'welcome', 'picker'
while (true) {
  if (action === 'navigate') {
    // ... existing lesson navigation ...
  }
  // Future: action === 'welcome', action === 'picker'
  break;
}
```

### Pattern 3: Shared Module List Renderer (New -- DISC-04)
**What:** A single `renderModuleList()` function called by both welcome screen and picker screen.
**Signature:**
```javascript
function renderModuleList(modules, progressData, isFirstRun) {
  // Returns string with module entries: [1] Title\n      Description\n      Progress
}
```
**Both callers compose:**
- Welcome screen: clearScreen + title + rule + pitch + rule + renderModuleList() + footer
- Picker screen: clearScreen + "Pick up where you left off." + rule + renderModuleList() + footer

### Pattern 4: Keypress Number Selection (New)
**What:** Wait for a number key (1, 2, etc.) or q to quit from the picker screen.
**Implementation:** Either extend `waitForKey()` or create `waitForPickerKey(moduleCount)` that resolves with `{ action: 'select', index: N }` or `{ action: 'quit' }`.
**Key insight:** The existing `waitForKey()` maps specific keys to named actions. A picker-specific variant maps number keys to module indices.

### Anti-Patterns to Avoid
- **Writing to stdout in render functions:** All existing renderers return strings. Do not break this pattern by having renderWelcomeScreen or renderModulePicker call process.stdout.write.
- **Duplicating the module list layout:** DISC-04 explicitly requires a shared renderer. Do not create separate list rendering logic in welcome vs. picker.
- **Hardcoding module count:** Use `listModules()` output length. Even though there are currently 2 modules, the code should handle N modules.
- **Modifying progress.cjs or lessons.cjs:** These APIs already provide everything needed. No changes required.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Module metadata | Custom module scanning | `listModules()` in lessons.cjs | Already sorts by order, reads module.json |
| First-run detection | File existence checks | `isFirstRun()` in progress.cjs | Checks if any module has been started |
| Module progress state | Custom progress tracking | `progress.modules[id]` from `loadProgress()` | Has started/completed/currentLesson fields |
| Terminal styling | Raw ANSI codes | `style()` from terminal.cjs | Handles NO_COLOR env, consistent formatting |
| Screen clearing | Custom escape sequences | `clearScreen()` from terminal.cjs | Already returns correct ANSI sequence |
| Key input handling | Custom stdin listeners | `waitForKey()` from navigator.cjs | Handles raw mode, cleanup, cross-platform |

## Common Pitfalls

### Pitfall 1: Forgetting to Set Module as Started Before Navigation
**What goes wrong:** If the picker transitions to navigate without marking the module as started, the module intro screen shows every time.
**Why it happens:** The current code in gsd-learn.cjs checks `moduleProgress.started` to decide whether to show the module intro.
**How to avoid:** When picker selects a module, the dispatch loop must set `progress.modules[id].started = true` before transitioning to `action = 'navigate'`. Actually, the existing navigate branch already does this (line 164), so the picker just needs to set `activeModuleId` and `action = 'navigate'`.

### Pitfall 2: Completion Flow Breaks Existing Behavior
**What goes wrong:** Module completion currently breaks out of the loop and exits. Phase 10 needs it to go to picker instead.
**Why it happens:** Line 216: `break;` after `result.reason === 'completed'`.
**How to avoid:** Change `break` to `action = 'picker'; continue;` so the dispatch loop shows the picker after completion.

### Pitfall 3: Review Mode Lesson Index
**What goes wrong:** Returning to a completed module doesn't reset to lesson 0.
**Why it happens:** `moduleProgress.currentLesson` still points to the last lesson after completion.
**How to avoid:** When a completed module is selected from the picker, explicitly set `startIndex = 0` or reset `progress.modules[id].currentLesson = 0` before navigating.

### Pitfall 4: Raw Mode Leaks
**What goes wrong:** If the picker key handler doesn't properly clean up raw mode, subsequent screens break.
**Why it happens:** `waitForKey()` manages raw mode internally, but a custom picker key handler might not.
**How to avoid:** Either reuse `waitForKey()` pattern exactly, or ensure any new key handler follows the same cleanup pattern (remove listener, setRawMode false, pause stdin).

### Pitfall 5: Off-by-One in Number Key Mapping
**What goes wrong:** User presses "1" but selects Module 2, or vice versa.
**Why it happens:** Modules are 0-indexed in the array but 1-indexed on screen.
**How to avoid:** Display `[N+1]` for module at index N. Map keypress `'1'` to index 0, `'2'` to index 1, etc. Validate that pressed number is within range.

## Code Examples

### Welcome Screen Render Function
```javascript
// New function in renderer.cjs
function renderWelcomeScreen(modules, progressData) {
  const parts = [];
  parts.push(clearScreen());
  parts.push('\n');
  parts.push(style('  GSD Learn', 'bold', 'cyan'));
  parts.push('\n\n');
  parts.push(horizontalRule(60));
  parts.push('\n\n');
  // Pitch text (Claude's discretion on exact wording)
  parts.push('  Learn to build your own AI workflows.\n');
  parts.push('  Two modules. Real GSD source code.\n');
  parts.push('  By the end, you\'ll ship a custom command from scratch.\n');
  parts.push('\n');
  parts.push(horizontalRule(60));
  parts.push('\n\n');
  parts.push(renderModuleList(modules, progressData, true));
  parts.push('\n');
  parts.push('  Press a number to begin\n');
  return parts.join('');
}
```

### Module Picker Render Function
```javascript
// New function in renderer.cjs
function renderModulePicker(modules, progressData) {
  const parts = [];
  parts.push(clearScreen());
  parts.push('\n');
  parts.push(style('  Pick up where you left off.', 'dim'));
  parts.push('\n\n');
  parts.push(horizontalRule(60));
  parts.push('\n\n');
  parts.push(renderModuleList(modules, progressData, false));
  parts.push('\n');
  parts.push('  Press a number to begin  [q] Quit\n');
  return parts.join('');
}
```

### Shared Module List Renderer
```javascript
// New function in renderer.cjs
function renderModuleList(modules, progressData, isFirstRun) {
  const parts = [];
  modules.forEach((mod, i) => {
    const num = i + 1;
    const modProgress = progressData.modules[mod.id] || {};
    // Title line
    parts.push('  [' + num + '] ' + style(mod.title, 'bold'));
    // "Start here" label for Module 1 when first-run or not started
    if (i === 0 && (isFirstRun || !modProgress.started)) {
      parts.push('  ' + style('Start here', 'cyan'));
    }
    parts.push('\n');
    // Description (indented)
    parts.push('      ' + style(mod.description, 'dim'));
    parts.push('\n');
    // Progress indicator
    if (modProgress.completed) {
      parts.push('      ' + style('Completed \u2713', 'green'));
      parts.push('\n');
    } else if (modProgress.started && modProgress.currentLesson > 0) {
      // Need total lessons -- caller should enrich modules with lessonCount
      parts.push('      ' + style('Lesson ' + (modProgress.currentLesson + 1) + ' of ' + (mod.lessonCount || '?'), 'yellow'));
      parts.push('\n');
    }
    parts.push('\n');
  });
  return parts.join('');
}
```

### Dispatch Loop Changes
```javascript
// In gsd-learn.cjs -- expanded while(true) loop
let action = firstRun ? 'welcome' : 'navigate';

while (true) {
  if (action === 'welcome') {
    const modules = listModules(contentDir);
    // Enrich with lesson counts for progress display
    process.stdout.write(renderWelcomeScreen(modules, progress));
    const selected = await waitForPickerKey(modules.length);
    if (selected.action === 'quit') break;
    activeModuleId = modules[selected.index].id;
    action = 'navigate';
  } else if (action === 'picker') {
    const modules = listModules(contentDir);
    process.stdout.write(renderModulePicker(modules, progress));
    const selected = await waitForPickerKey(modules.length);
    if (selected.action === 'quit') break;
    activeModuleId = modules[selected.index].id;
    // Reset lesson for completed modules (review mode)
    if (progress.modules[activeModuleId]?.completed) {
      progress.modules[activeModuleId].currentLesson = 0;
      saveProgress(cwd, progress);
    }
    action = 'navigate';
  } else if (action === 'navigate') {
    // ... existing navigate logic ...
    // Change: result.reason === 'completed' sets action = 'picker' instead of break
  }
}
```

### Picker Key Handler
```javascript
// New function in navigator.cjs
function waitForPickerKey(moduleCount) {
  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    const handler = (str, key) => {
      if (!key) return;
      // Number keys 1-9
      const num = parseInt(key.name, 10) || parseInt(str, 10);
      if (num >= 1 && num <= moduleCount) {
        cleanup(); resolve({ action: 'select', index: num - 1 });
      } else if (key.name === 'q' || key.name === 'escape' || (key.ctrl && key.name === 'c')) {
        cleanup(); resolve({ action: 'quit' });
      }
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

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct lesson launch | Dispatch loop with action variable | Phase 9 (v2.2) | Enables welcome/picker screens |
| Flat progress (v1) | Per-module progress with started/completed (v3) | Phase 9 (v2.2) | Picker can show per-module status |
| Single module hardcoded | `listModules()` + `loadModule()` | Phase 7 (v2.1) | Dynamic module discovery for picker |

## Open Questions

1. **Lesson count in module list**
   - What we know: `listModules()` returns metadata (id, title, description, order) but NOT lesson count
   - What's unclear: Do we need to call `loadModule()` for each to get `lessons.length`, or enrich `listModules()`?
   - Recommendation: Add a lightweight `countLessons` option to `listModules()` or compute it in the dispatch loop by counting lesson files. Avoid calling `loadModule()` which parses all lesson JSON.

2. **Completion banner "Press any key to continue" wording**
   - What we know: Current banner shows stats then `waitForKey()` with no prompt text
   - What's unclear: Should we add the text to `renderCompletionBanner` or to the caller?
   - Recommendation: Add it to `renderCompletionBanner` output (add a line to the parts array). Minor change.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` + `node:assert` |
| Config file | None needed (built-in runner) |
| Quick run command | `node --test learn/tests/renderer.test.cjs` |
| Full suite command | `node --test learn/tests/*.test.cjs` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WELC-01 | renderWelcomeScreen returns string with pitch and module list | unit | `node --test learn/tests/renderer.test.cjs` | Extend existing |
| WELC-03 | Welcome copy includes outcome-oriented pitch text | unit | `node --test learn/tests/renderer.test.cjs` | Extend existing |
| DISC-01 | renderModuleList shows all modules with progress indicators | unit | `node --test learn/tests/renderer.test.cjs` | Extend existing |
| DISC-02 | Module 1 shows "Start here" for first-time users | unit | `node --test learn/tests/renderer.test.cjs` | Extend existing |
| DISC-03 | renderModulePicker shows slim "Pick up where you left off." | unit | `node --test learn/tests/renderer.test.cjs` | Extend existing |
| DISC-04 | Both welcome and picker call renderModuleList (shared renderer) | unit | `node --test learn/tests/renderer.test.cjs` | Extend existing |

### Sampling Rate
- **Per task commit:** `node --test learn/tests/renderer.test.cjs`
- **Per wave merge:** `node --test learn/tests/*.test.cjs`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] New test cases in `learn/tests/renderer.test.cjs` -- covers WELC-01, WELC-03, DISC-01, DISC-02, DISC-03, DISC-04
- [ ] New test file `learn/tests/picker-keys.test.cjs` -- covers waitForPickerKey if added to navigator.cjs (or extend navigator.test.cjs)

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `learn/bin/gsd-learn.cjs` (dispatch loop, action variable, existing completion flow)
- Direct code inspection of `learn/lib/renderer.cjs` (pure render pattern, renderCompletionBanner)
- Direct code inspection of `learn/lib/progress.cjs` (isFirstRun, per-module progress schema v3)
- Direct code inspection of `learn/lib/lessons.cjs` (listModules API, loadModule API)
- Direct code inspection of `learn/lib/navigator.cjs` (waitForKey pattern, raw mode management)
- Direct code inspection of `learn/lib/terminal.cjs` (style, clearScreen, horizontalRule APIs)
- Module metadata: gsd-commands (order 1) and command-lifecycle (order 2)

### Secondary (MEDIUM confidence)
- CONTEXT.md user decisions (locked flow and layout choices)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries are project-internal, directly inspected
- Architecture: HIGH - dispatch loop pattern already exists with stubs for welcome/picker
- Pitfalls: HIGH - identified from actual code flow analysis (completion break, review mode reset, raw mode)

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable internal codebase, no external dependencies)
