# Stack Research: v2.2 Module Discovery & Welcome

**Domain:** CLI learning tool -- module discovery UI, welcome screen, resume behavior, new key bindings
**Researched:** 2026-03-12
**Confidence:** HIGH

## Executive Decision

**No new dependencies needed.** Every feature in v2.2 is buildable with the Node.js built-in modules already in use. This is not a hedge -- the codebase already has all the primitives: raw terminal input (`readline`), ANSI rendering (`terminal.cjs`), JSON progress persistence (`progress.cjs`), and module listing (`lessons.cjs` `listModules()`). The work is UI composition and control flow, not capability gaps.

## Existing Stack (No Changes)

### Core Technologies

| Technology | Version | Purpose | Status for v2.2 |
|------------|---------|---------|------------------|
| Node.js | >= 16.7.0 | Runtime | Sufficient -- all needed APIs available |
| `fs` | built-in | Progress persistence, module discovery | Already used in `progress.cjs`, `lessons.cjs` |
| `path` | built-in | Cross-platform path resolution | Already used everywhere |
| `readline` | built-in | Raw keypress events via `emitKeypressEvents` | Already used in `navigator.cjs` |
| `process.stdout` | built-in | ANSI terminal rendering | Already used in `renderer.cjs`, `terminal.cjs` |

### Rendering Primitives Already Available

| Primitive | Location | Reusable For |
|-----------|----------|-------------|
| `style(text, ...styles)` | `terminal.cjs` | Welcome screen text, module picker styling |
| `clearScreen()` | `terminal.cjs` | Welcome/module picker screen transitions |
| `horizontalRule(width)` | `terminal.cjs` | Section dividers in new screens |
| `COLORS` object | `terminal.cjs` | All new UI elements (cyan, green, yellow, dim, bold, etc.) |
| `renderCompletionBanner()` | `renderer.cjs` | Pattern to follow for welcome/picker screens |
| `renderBridgeSection()` | `renderer.cjs` | Box-drawing pattern if needed for module cards |

### Navigation Primitives Already Available

| Primitive | Location | Reusable For |
|-----------|----------|-------------|
| `waitForKey()` | `navigator.cjs` | Adding M and H key handlers |
| `setupCleanExit()` | `navigator.cjs` | Already handles stdin raw mode cleanup |
| `runNavigationLoop()` | `navigator.cjs` | Needs modification for M/H exit actions |
| `computePrevPosition()` | `navigator.cjs` | No changes needed |

### Data Primitives Already Available

| Primitive | Location | Reusable For |
|-----------|----------|-------------|
| `loadProgress()` / `saveProgress()` | `progress.cjs` | Resume-to-last-position (already stores `currentModule` + `currentLesson` + per-module `modules` map) |
| `listModules()` | `lessons.cjs` | Module picker -- already reads all `module.json` files, returns `{id, title, description, order}`, sorts by order |
| `loadModule()` | `lessons.cjs` | Loading selected module after picker |
| `getNextHint()` | `hints.cjs` | H key hint display |
| `loadFeedback()` | `feedback.cjs` | Counting hints used for H key context |

## What Needs to Be Built (Not Installed)

### 1. Welcome Screen Renderer

**New function -- either in `renderer.cjs` or a new `welcome.cjs`**

Uses existing: `style()`, `clearScreen()`, `horizontalRule()`, `COLORS`

This is a pure render function that returns a string, same pattern as `renderCompletionBanner()`. No new primitives needed. Content is a static pitch for GSD Learn: what you will achieve, how it works, press any key to continue.

**Recommendation:** Put in a new `welcome.cjs` to keep `renderer.cjs` focused on lesson rendering. Welcome screen is a distinct concern.

### 2. Module Picker Renderer + Selection

**New `module-picker.cjs` module**

Uses existing: `style()`, `clearScreen()`, `horizontalRule()`, `listModules()`, `loadProgress()`

Renders a list of modules with:
- Module number, title, and description (from `module.json` via `listModules()`)
- Progress indicator per module (from `progress.modules[moduleId]`)
- Recommended flag on first incomplete module
- Number-key selection (press 1, 2, etc.)

**Key decision: Number keys (1-9) for selection, not arrow keys.**

| Approach | Pros | Cons |
|----------|------|------|
| Number keys | Matches single-keypress pattern (w/q/e/c), no cursor state, instant selection, works in all terminals | Limited to 9 modules |
| Arrow keys + Enter | Familiar UI pattern | Requires tracking selected index across re-renders, adds state machine complexity, needs Enter confirmation |

**Use number keys.** Two modules now, scales to 9 before needing redesign. The entire codebase uses single-keypress-resolves-action pattern. Arrow key selection would be the only stateful UI element.

### 3. Resume Logic

**Modification to `gsd-learn.cjs` main()**

Uses existing: `loadProgress()` returns `{ currentModule, currentLesson, modules }` -- all data needed for resume detection.

Decision tree:
- `progress.currentModule === null` -> first-time user -> show welcome screen -> module picker
- `progress.currentModule !== null` and has lesson progress -> returning user -> slim "Welcome back" banner -> auto-resume to saved position
- User presses M during navigation -> save progress -> show module picker -> restart with selected module

The progress schema already supports this. The `currentModule` field plus `modules[id].currentLesson` gives exact resume position. No schema migration needed.

### 4. Key Binding Extensions

**Modification to `navigator.cjs` `waitForKey()`**

Current key map:
```
w -> 'next'    (advance to next part)
q -> 'prev'    (go back one part)
e -> 'skip'    (skip to next lesson)
c -> 'copy'    (copy full lesson to clipboard)
escape/Ctrl+C -> 'quit'
```

Add:
```
m -> 'modules'  (navigate to module picker)
h -> 'hints'    (show next hint on mini-project step)
```

This is two new `else if` branches in the keypress handler. The action strings flow through `runNavigationLoop()` which needs two new handlers:

**`'modules'` handler:** Save progress, return from `runNavigationLoop()` with an exit reason so `gsd-learn.cjs` knows to show module picker instead of exiting.

**`'hints'` handler:** Load hints for current module, count previous hint events via `loadFeedback()`, call `getNextHint()`, render hint inline below current content, wait for another keypress to dismiss. Only active on lessons containing a `project` content block (no-op on regular lessons).

### 5. Navigation Footer Update

**Modification to `renderer.cjs` `renderPart()`**

Current footer:
```
  [w] Next  [q] Back  [e] Skip lesson  [c] Copy  [esc] Quit
```

New footer (regular lessons):
```
  [w] Next  [q] Back  [e] Skip  [c] Copy  [m] Modules  [esc] Quit
```

New footer (mini-project lessons):
```
  [w] Next  [q] Back  [e] Skip  [c] Copy  [m] Modules  [h] Hint  [esc] Quit
```

### 6. Progress Schema (Minor Extension)

Current schema (v2):
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

**Optional addition** for module picker display:
```json
{
  "modules": {
    "gsd-commands": {
      "currentLesson": 6,
      "started": true,
      "completed": true
    }
  }
}
```

The `completed` flag lets the picker show checkmarks. This is backward-compatible (missing field = false). No version bump or migration needed -- just set it when the completion banner is shown.

### 7. Control Flow Restructure

Current flow in `gsd-learn.cjs`:
```
main() -> loadModule(hardcoded 'gsd-commands') -> runNavigationLoop() -> exit
```

New flow:
```
main() -> checkProgress() ->
  first-time:  renderWelcome() -> waitForKey() -> showModulePicker() -> selectModule() -> runNavigationLoop()
  returning:   showResumeBanner() -> loadModule(saved) -> runNavigationLoop()
  M key exit:  save progress -> showModulePicker() -> selectModule() -> runNavigationLoop()
```

The main function becomes a while loop that re-enters module picker when `runNavigationLoop()` exits with reason `'modules'`. This is the largest structural change in v2.2.

**Return value from `runNavigationLoop()`:** Currently returns `undefined` (void). Change to return an exit reason string: `'quit'` or `'modules'`. This is a backward-compatible change -- callers that don't check the return value are unaffected.

## New Files (Recommended)

| File | Purpose | Rationale |
|------|---------|-----------|
| `learn/lib/welcome.cjs` | Welcome screen render function | Keeps `renderer.cjs` focused on lesson rendering |
| `learn/lib/module-picker.cjs` | Module picker render + number-key selection loop | Self-contained screen with its own key handling |

## Modified Files

| File | Change | Scope |
|------|--------|-------|
| `learn/lib/navigator.cjs` | Add `m` and `h` to `waitForKey()`, handle in `runNavigationLoop()`, return exit reason | ~30 lines |
| `learn/lib/renderer.cjs` | Update navigation footer string to include [m] and conditional [h] | ~5 lines |
| `learn/lib/progress.cjs` | Set `completed: true` when module finishes (optional) | ~3 lines |
| `learn/bin/gsd-learn.cjs` | Welcome/picker/resume orchestration, while loop for M key re-entry | Major restructure of `main()` |

## Unchanged Files

| File | Why No Changes |
|------|---------------|
| `terminal.cjs` | All rendering primitives already exist |
| `lessons.cjs` | `listModules()` and `loadModule()` already do what is needed |
| `hints.cjs` | `getNextHint()` already works; just needs to be called from navigator |
| `parser.cjs` | Content generation is out of scope for v2.2 |
| `md-parser.cjs` | Content generation is out of scope for v2.2 |
| `prompt-templates.cjs` | No new lesson content generation |
| `verifier.cjs` | Verification flow unchanged |
| `feedback.cjs` | Event recording unchanged |
| `clipboard.cjs` | Copy functionality unchanged |
| `clipboard-formatter.cjs` | Formatting unchanged |
| `errors.cjs` | Error handling unchanged |
| `evaluator.cjs` | Scoring unchanged |
| `concept-map.cjs` | Concept maps unchanged |
| `frontmatter.cjs` | Not involved in v2.2 features |

## What NOT to Add

| Avoid | Why | What to Do Instead |
|-------|-----|-------------------|
| `inquirer` / `prompts` | Adds runtime dependency to a zero-dependency project; overkill for 2-item number-key selection | Number-key selection with existing `waitForKey()` pattern |
| `blessed` / `ink` / `neo-blessed` | Full TUI frameworks are massive overkill; existing ANSI primitives handle everything | Compose with existing `style()`, `clearScreen()` |
| `chalk` | Project has its own ANSI color implementation in `terminal.cjs` | Use existing `style()` function |
| `figlet` / `ascii-art` | ASCII art banners add noise and a dependency for a welcome screen | Use `style()` with bold/color for headers |
| `boxen` | Unicode box drawing already done manually in `renderBridgeSection()` | Copy the box-drawing pattern if needed |
| `conf` / `configstore` | Progress handled by plain JSON file I/O in `progress.cjs` | Use existing `loadProgress()`/`saveProgress()` |
| `ansi-escapes` / `term-size` | Already using raw ANSI codes and `process.stdout.columns` | Continue with existing approach |
| Arrow-key cursor navigation | Adds state tracking complexity for module selection with 2-4 items | Number keys for instant selection |
| Event emitter for screen transitions | Over-engineering for 3 screens (welcome, picker, lesson) | Simple function calls with return values |

## Installation

```bash
# No new runtime dependencies.
# No new dev dependencies.
# No npm install changes.
```

## Version Compatibility

| Concern | Status | Notes |
|---------|--------|-------|
| Node.js >= 16.7.0 | Compatible | All APIs used (`readline.emitKeypressEvents`, raw mode, ANSI codes) available since Node 12+ |
| Windows terminal | Compatible | ANSI escape codes work in Windows Terminal, VS Code terminal, modern cmd.exe (Win 10+) |
| `process.stdout.columns` | Compatible | Used for responsive width; falls back to 80 in `horizontalRule()` |
| Progress file backward compat | Compatible | New `completed` field is additive; old progress files work without it |

## Confidence Assessment

| Decision | Confidence | Rationale |
|----------|------------|-----------|
| No new dependencies | HIGH | PROJECT.md hard constraint + all needs met by existing primitives |
| Number keys for module selection | HIGH | Matches existing keypress pattern, 2 modules now, scales to 9 |
| Resume via existing progress schema | HIGH | `currentModule` + `modules[id].currentLesson` already stored |
| `waitForKey()` extension for M/H | HIGH | Two new else-if branches; identical pattern to existing keys |
| Return exit reason from nav loop | HIGH | Backward-compatible change; minimal surface area |
| New `welcome.cjs` + `module-picker.cjs` | HIGH | Separation of concerns; follows existing module-per-feature pattern |
| H key inline hints | MEDIUM | Inline display keeps context but may need screen re-render logic |

## Sources

- Codebase analysis: `learn/lib/navigator.cjs` -- keypress handling, navigation loop, exit flow
- Codebase analysis: `learn/lib/renderer.cjs` -- render patterns, footer format, `renderCompletionBanner()` as template
- Codebase analysis: `learn/lib/progress.cjs` -- schema, load/save, migration pattern
- Codebase analysis: `learn/lib/lessons.cjs` -- `listModules()` already exists and returns sorted modules
- Codebase analysis: `learn/lib/hints.cjs` -- `getNextHint()` API, ready for navigator integration
- Codebase analysis: `learn/lib/terminal.cjs` -- all ANSI primitives confirmed available
- Codebase analysis: `learn/bin/gsd-learn.cjs` -- current control flow, flag parsing, module loading
- Codebase analysis: `learn/content/modules/*/module.json` -- module metadata structure
- Project context: `.planning/PROJECT.md` -- v2.2 requirements, zero-dependency constraint
- Stack reference: `.planning/codebase/STACK.md` -- confirms zero runtime dependencies

---
*Stack research for: GSD Learn v2.2 Module Discovery & Welcome*
*Researched: 2026-03-12*
