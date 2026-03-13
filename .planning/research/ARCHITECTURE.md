# Architecture Research

**Domain:** Module discovery UI, welcome screen, resume behavior, and new key bindings for CLI learning tool
**Researched:** 2026-03-12
**Confidence:** HIGH

## Existing Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Entry Point Layer                        │
│  gsd-learn.cjs: CLI args, flags, module loading, bootstrap  │
├─────────────────────────────────────────────────────────────┤
│                     Navigation Layer                         │
│  navigator.cjs: raw-mode key loop, lesson/part traversal    │
├─────────────────────────────────────────────────────────────┤
│                     Rendering Layer                          │
│  renderer.cjs: renderPart(), renderLesson(), banners        │
│  terminal.cjs: ANSI codes, style(), clearScreen()           │
├─────────────────────────────────────────────────────────────┤
│                     Content Layer                            │
│  lessons.cjs: loadModule(), listModules()                   │
│  concept-map.cjs, clipboard-formatter.cjs, hints.cjs       │
├─────────────────────────────────────────────────────────────┤
│                     Persistence Layer                        │
│  progress.cjs: loadProgress(), saveProgress()               │
│  feedback.cjs: recordEvent(), loadFeedback()                │
├─────────────────────────────────────────────────────────────┤
│                     Content Files                            │
│  modules/gsd-commands/module.json + lessons/*.json          │
│  modules/command-lifecycle/module.json + lessons/*.json     │
└─────────────────────────────────────────────────────────────┘
```

### Current Component Responsibilities

| Component | Responsibility | Key Exports |
|-----------|----------------|-------------|
| `gsd-learn.cjs` | CLI entry: parse flags, load module, wire render/progress callbacks, launch nav loop | `main()` |
| `navigator.cjs` | Raw-mode keypress loop, two-level lesson/part navigation, forward/back/skip/copy/quit | `runNavigationLoop()`, `waitForKey()` |
| `renderer.cjs` | Pure-function ANSI rendering: parts with progressive accumulation, completion banner, progress footer | `renderPart()`, `renderCompletionBanner()`, `groupContentItems()` |
| `terminal.cjs` | Low-level ANSI: color codes, style(), clearScreen(), horizontalRule(), code block rendering | `style()`, `clearScreen()`, `renderCodeBlock()` |
| `lessons.cjs` | Load module metadata + lesson JSON files; list all available modules | `loadModule()`, `listModules()` |
| `progress.cjs` | Read/write `progress.json` with v1-to-v2 migration; tracks currentModule, currentLesson, per-module state | `loadProgress()`, `saveProgress()` |
| `feedback.cjs` | Event-sourced project tracking (hints used, verify attempts, completion) | `recordEvent()`, `loadFeedback()` |
| `hints.cjs` | Stateless hint retrieval by index | `getNextHint()` |

### Current Data Flow

```
User launches `gsd-learn`
    |
    v
gsd-learn.cjs: parse --module flag (default: 'gsd-commands')
    |
    v
loadProgress(cwd) --> progress.json --> { currentModule, currentLesson, modules: {} }
loadModule(moduleId) --> module.json + lessons/*.json
    |
    v
runNavigationLoop(lessons, startIndex, renderFn, progressFn)
    |
    v
  [inner loop]
  waitForKey() --> 'next'|'prev'|'skip'|'copy'|'quit'
  renderFn(lesson, partIndex, ...) --> renderPart() --> stdout
  progressFn(idx) --> saveProgress()
    |
    v
Exit: "Goodbye! Your progress has been saved."
```

### Current Key Bindings (navigator.cjs waitForKey)

| Key | Action | Behavior |
|-----|--------|----------|
| `w` | next | Advance part or lesson |
| `q` | prev | Go back one part or lesson |
| `e` | skip | Skip to next lesson |
| `c` | copy | Copy lesson to clipboard |
| `Esc` | quit | Save progress and exit |
| `Ctrl+C` | quit | Save progress and exit |

### Current Progress Schema (progress.json v2)

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

The `modules` map already supports per-module lesson tracking. The top-level `currentModule` and `currentLesson` store the active session position.

### Critical Observations About Existing Architecture

1. **`listModules()` already exists** in lessons.cjs -- scans `content/modules/*/module.json`, returns sorted by `order`.
2. **`runNavigationLoop` returns void** -- it currently has no mechanism to signal WHY the loop exited.
3. **`waitForKey()` is a clean primitive** -- returns a string action name. Adding new keys is straightforward.
4. **Progress `modules` map tracks per-module state** -- but has no `lastPosition` with part-level granularity.
5. **Hint infrastructure is fully built** -- `hints.cjs`, `feedback.cjs`, and the `--hint` CLI flag all exist. The 'h' key just needs to call the same code interactively.
6. **The entry point goes straight to nav loop** -- no routing logic, no conditional screens.

## Integration Architecture for v2.2 Features

### System Overview with New Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Entry Point Layer                        │
│  gsd-learn.cjs: NEW routing logic                           │
│    first-time? --> welcome --> module picker                 │
│    returning?  --> resume prompt OR module picker            │
├─────────────────────────────────────────────────────────────┤
│                   Screen Routing Layer (NEW)                 │
│  screens.cjs: welcome screen, module picker, resume logic   │
│    renderWelcomeScreen()                                    │
│    renderModulePickerScreen()                               │
│    determineEntryRoute()                                    │
├─────────────────────────────────────────────────────────────┤
│                     Navigation Layer                         │
│  navigator.cjs: MODIFIED waitForKey() + runNavigationLoop() │
│    NEW key: 'm' --> 'modules' action                        │
│    NEW key: 'h' --> 'hint' action                           │
├─────────────────────────────────────────────────────────────┤
│                     Rendering Layer                          │
│  renderer.cjs: MODIFIED nav footer to show [m] and [h]     │
│  terminal.cjs: unchanged                                    │
├─────────────────────────────────────────────────────────────┤
│                     Content + Persistence                    │
│  lessons.cjs: unchanged (listModules already exists)        │
│  progress.cjs: MODIFIED schema v3 with lastPosition         │
│  feedback.cjs: unchanged                                    │
│  hints.cjs: unchanged (stateless, reusable as-is)           │
└─────────────────────────────────────────────────────────────┘
```

### Component Change Summary

| Component | Change Type | What Changes |
|-----------|-------------|--------------|
| `screens.cjs` | **NEW** | Welcome screen rendering, module picker rendering, entry-route decision logic |
| `gsd-learn.cjs` | **MODIFY** | Route to welcome/picker/resume instead of jumping straight into nav loop; outer module-selection loop |
| `navigator.cjs` | **MODIFY** | Add 'm' and 'h' key handlers in `waitForKey()`; handle 'modules' and 'hint' actions in `runNavigationLoop`; change return type from void to `{ reason }` |
| `renderer.cjs` | **MODIFY** | Update nav footer text to include [m] Modules and conditionally [h] Hint on project lessons |
| `progress.cjs` | **MODIFY** | Add `lastPosition` field for resume-to-exact-position; bump to v3 with v2-to-v3 migration |
| `lessons.cjs` | **UNCHANGED** | `listModules()` already exists and works |
| `terminal.cjs` | **UNCHANGED** | Style primitives sufficient for all new screens |
| `hints.cjs` | **UNCHANGED** | Stateless `getNextHint()` reusable from nav loop |
| `feedback.cjs` | **UNCHANGED** | Event recording reusable for interactive hint tracking |

## Architectural Patterns

### Pattern 1: Screen Routing via Entry Decision Function

**What:** A pure function `determineEntryRoute(progress)` examines persisted progress and returns one of three routes: `'welcome'`, `'resume'`, or `'module-picker'`.

**When to use:** At startup in `gsd-learn.cjs`, before entering any navigation loop.

**Trade-offs:** Keeps routing logic testable and separate from rendering. The entry point stays thin. Easy to add new routes later.

```javascript
// screens.cjs
function determineEntryRoute(progress) {
  // First-time user: no modules started
  if (!progress.currentModule && Object.keys(progress.modules).length === 0) {
    return 'welcome';
  }
  // Returning user with saved position: offer resume
  if (progress.currentModule && progress.lastPosition) {
    return 'resume';
  }
  // Returning user without clear position: show picker
  return 'module-picker';
}
```

### Pattern 2: Hub-and-Spoke Navigation with Module Picker as Hub

**What:** Welcome screen and resume prompt both flow into the module picker. The module picker returns a `moduleId`, then `gsd-learn.cjs` enters `runNavigationLoop`. The 'm' key returns control to the module picker.

**When to use:** Every screen transition that needs module selection.

**Trade-offs:** Creates a natural hub model. Module picker is the single navigation nexus. Avoids deeply nested state machines.

```
[Welcome] --(any key)--> [Module Picker] --(select)--> [Navigation Loop]
                              ^                              |
                              | ('m' key returns here)       |
                              +------------------------------+

[Resume Prompt] --(w/yes)--> [Navigation Loop at saved position]
                --(m/no)---> [Module Picker]
```

### Pattern 3: Navigation Loop Returns Exit Reason

**What:** `runNavigationLoop` returns `{ reason: 'quit' }` or `{ reason: 'modules' }` instead of void. This lets the outer loop in `gsd-learn.cjs` decide whether to exit or re-enter the module picker.

**When to use:** For the 'm' key module-switching behavior.

**Trade-offs:** Small breaking change to return contract. All existing callers must handle the return value (only gsd-learn.cjs calls it). Clean separation between inner lesson navigation and outer screen routing.

```javascript
// navigator.cjs - modified return
async function runNavigationLoop(lessons, startIndex, renderFn, progressFn, opts) {
  // ... existing loop ...
  // On 'm' key:    progressFn(currentLesson); return { reason: 'modules' };
  // On quit/esc:   progressFn(currentLesson); return { reason: 'quit' };
  // On completion: progressFn(currentLesson); return { reason: 'completed' };
}

// gsd-learn.cjs - outer loop
while (true) {
  const moduleId = await showModulePicker(progress, contentDir);
  if (!moduleId) break; // user quit from picker
  const mod = loadModule(moduleId, contentDir);
  const result = await runNavigationLoop(mod.lessons, startIdx, renderFn, progressFn, opts);
  if (result.reason === 'quit') break;
  // result.reason === 'modules' or 'completed' --> loop back to picker
}
```

### Pattern 4: In-Lesson Hint Overlay via 'h' Key

**What:** The 'h' key triggers hint display inline during the navigation loop, only active when the current lesson contains a `project` content block. Non-project lessons ignore 'h' silently.

**When to use:** Mini-project lessons only.

**Trade-offs:** Reuses existing `getNextHint()` from `hints.cjs` and `recordEvent()`/`loadFeedback()` from `feedback.cjs`. Display hint as a temporary overlay (clear screen, show hint, wait for key, re-render current part). No new persistence needed -- hint tracking already uses feedback event sourcing.

```javascript
// In navigator.cjs waitForKey handler:
} else if (key.name === 'h') {
  cleanup(); resolve('hint');
}

// In runNavigationLoop, handle 'hint' action:
// 1. Check if current lesson has project content --> if not, ignore (continue)
// 2. Load hints.json for current module
// 3. Count previous hint_requested events from feedback.cjs
// 4. Call getNextHint(hints, hintsUsed)
// 5. Display hint overlay (clearScreen + hint text + "press any key")
// 6. Wait for key, then re-render current part (continue inner loop)
```

## Data Flow Changes

### New Startup Flow

```
User launches `gsd-learn`
    |
    v
gsd-learn.cjs: parse flags (--module, --reset, --status, etc.)
    |
    v  (no special flags)
loadProgress(cwd) --> progress.json (v3)
    |
    v
determineEntryRoute(progress)
    |
    +-- 'welcome' --> renderWelcomeScreen() --> waitForKey()
    |                     |
    |                     v  (any key)
    +-- 'module-picker' --+------> renderModulePickerScreen(modules, progress)
    |                                |
    |                                v  (number key selects module)
    |                          [loadModule, enter nav loop]
    |                                |
    |                      'm' key --+--> [back to module picker]
    |                      quit/esc -+--> [exit]
    |
    +-- 'resume' --> renderResumePrompt(lastPosition, moduleTitle)
                       |               |
                       v (w=yes)       v (m=browse)
                [nav loop at           |
                 saved position]       +---> [module picker]
```

### Modified Navigation Loop Flow

```
runNavigationLoop(lessons, startIndex, renderFn, progressFn, opts)
    |
    v
  [inner loop]
  waitForKey() --> 'next'|'prev'|'skip'|'copy'|'quit'|'modules'|'hint'
    |
    +-- 'modules' --> save progress, return { reason: 'modules' }
    +-- 'hint' --> check project lesson, show overlay, re-render, continue
    +-- 'quit' --> save progress, return { reason: 'quit' }
    +-- (others) --> existing behavior unchanged
```

### Progress Schema v3

```json
{
  "version": 3,
  "currentModule": "gsd-commands",
  "currentLesson": 3,
  "lastPosition": {
    "module": "gsd-commands",
    "lesson": 3,
    "part": 2
  },
  "modules": {
    "gsd-commands": { "currentLesson": 3, "started": true },
    "command-lifecycle": { "currentLesson": 0, "started": true }
  }
}
```

The `lastPosition` field enables resume-to-exact-position including part index. Migration from v2 to v3: synthesize `lastPosition` from `currentModule` and `currentLesson`, set `part: 0`.

## Integration Points

### New File: screens.cjs

| Function | Inputs | Outputs | Dependencies |
|----------|--------|---------|--------------|
| `determineEntryRoute(progress)` | progress object | `'welcome'` / `'resume'` / `'module-picker'` | None (pure function) |
| `renderWelcomeScreen()` | None | ANSI string for stdout | `terminal.cjs` (style, clearScreen, horizontalRule) |
| `renderModulePickerScreen(modules, progress)` | module list + progress | ANSI string for stdout | `terminal.cjs` |
| `renderResumePrompt(lastPosition, moduleTitle)` | position + title | ANSI string for stdout | `terminal.cjs` |
| `waitForModuleSelection(modules)` | module list | Promise resolving to moduleId or null | Raw keypress handling (reuse `waitForKey` pattern) |

### Modified File: navigator.cjs

| Change | Detail |
|--------|--------|
| `waitForKey()` | Add `'m'` -> `'modules'` and `'h'` -> `'hint'` to key handler switch |
| `runNavigationLoop()` return type | Change from `void` to `Promise<{ reason: 'quit' \| 'modules' \| 'completed' }>` |
| `runNavigationLoop()` 'modules' handler | Save progress, return `{ reason: 'modules' }` |
| `runNavigationLoop()` 'hint' handler | Check for project content, display hint overlay, re-render |
| `runNavigationLoop()` opts | Accept `moduleId` and `contentDir` for hint file loading |

### Modified File: renderer.cjs

| Change | Detail |
|--------|--------|
| `renderPart()` nav footer | Add `[m] Modules` always; add `[h] Hint` conditionally when lesson has project content |
| Footer rendering | Detect project content via `lesson.content.some(s => s.type === 'project')` |

### Modified File: progress.cjs

| Change | Detail |
|--------|--------|
| Schema bump | `version: 3`, add `lastPosition` field |
| `migrateV2toV3()` | New migration function: synthesize `lastPosition` from existing fields |
| `saveProgress()` | Accept and persist `lastPosition` alongside existing fields |
| `loadProgress()` | Chain migration: v1->v2 (existing), v2->v3 (new) |

### Modified File: gsd-learn.cjs

| Change | Detail |
|--------|--------|
| Startup routing | Replace direct `runNavigationLoop` call with `determineEntryRoute` + screen routing |
| Outer loop | Module-picker -> nav-loop -> module-picker cycle driven by `runNavigationLoop` return reason |
| Progress save | Update `lastPosition` on each `progressFn` callback (include part index) |
| Welcome/resume | Show welcome for first-time users; resume prompt for returning users with `lastPosition` |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `screens.cjs` <-> `gsd-learn.cjs` | Direct function calls | screens.cjs exports pure render functions + route decision |
| `screens.cjs` <-> `terminal.cjs` | Direct require | Reuse style(), clearScreen(), horizontalRule() |
| `navigator.cjs` <-> `gsd-learn.cjs` | Return value contract | `runNavigationLoop` returns `{ reason }` -- breaking change from void |
| `navigator.cjs` <-> `hints.cjs` | Direct require (lazy) | Nav loop calls `getNextHint()` only when 'h' pressed on project lesson |
| `navigator.cjs` <-> `feedback.cjs` | Direct require (lazy) | Nav loop calls `recordEvent()` + `loadFeedback()` for hint tracking |
| `progress.cjs` <-> all consumers | Schema v3 migration | Transparent auto-migration on `loadProgress()` |

## Recommended Build Order

Build order follows dependency chains. Foundational changes first, then features that depend on them.

| Order | Component | Rationale |
|-------|-----------|-----------|
| **1** | `progress.cjs` v3 schema + migration | Everything downstream needs `lastPosition`. Small, isolated, fully testable. No UI changes. |
| **2** | `navigator.cjs` key bindings + return contract | Add 'm' and 'h' to `waitForKey()`. Change `runNavigationLoop` return to `{ reason }`. This is the breaking API change -- do it early so gsd-learn.cjs can adapt. |
| **3** | `renderer.cjs` footer updates | Update nav footer to show [m] Modules always and [h] Hint on project lessons. Pure rendering, testable in isolation. |
| **4** | `screens.cjs` (new file) | Welcome screen, module picker, resume prompt, route decision. All pure rendering functions. Depends on terminal.cjs (unchanged) and progress schema (step 1). |
| **5** | `gsd-learn.cjs` entry routing | Wire everything together: `determineEntryRoute` -> screens -> outer module-picker loop -> nav loop. Depends on steps 1-4. |
| **6** | 'h' key hint overlay in navigator | Integrate hints.cjs + feedback.cjs into nav loop's hint action handler. Last because it needs the nav loop's module context (from step 5 wiring) to locate hints.json. |

**Why this order:**
- Steps 1-3 are independent, testable foundation changes with no cross-dependencies.
- Step 2 introduces the breaking change to `runNavigationLoop`'s return type. Step 5 (which consumes it) must come after.
- Step 4 is self-contained new code. Placed after step 1 because the module picker reads progress data to show completion indicators.
- Step 5 is the integration point wiring all new components. It depends on everything before it.
- Step 6 is last because hint overlay needs module context (contentDir, moduleId) threaded through the nav loop, which step 5 establishes.

## Key Design Decisions

### Module Picker Selection Mechanism

Use number keys (1, 2, ...) for module selection. With 2 modules this is simpler than arrow-key cursor navigation. If module count exceeds 9 in future, add arrow-key support -- but that is premature now.

### Welcome Screen Content

Static string in `screens.cjs`, not a content file. The welcome pitches GSD Learn itself (what you will be able to do), not GSD internals. It is a 10-second read, not a tutorial. "Press any key to continue" advances to module picker.

### Resume Prompt UX

Returning users see a slim one-line message: "Resume [Module Title], Lesson N? [w] Yes [m] Browse modules". Reuses existing key bindings (w=forward, m=modules) so the user needs zero new learning for the resume prompt.

### "Recommended" Module Indicator

Module picker shows a "Recommended" flag on the first module the user has not completed. Determine by checking `progress.modules`: first module (by order) where entry is missing or lesson < total lessons gets the flag.

### Part-Level Resume vs Lesson-Level Resume

Store part index in `lastPosition` for completeness, but resume to part 0 of the saved lesson. Rationale: parts within a lesson are fast to re-traverse (press 'w' a few times). Resuming mid-part would require storing progressive accumulation state, which adds complexity with minimal UX benefit.

## Anti-Patterns

### Anti-Pattern 1: Putting Screen Logic in gsd-learn.cjs

**What people do:** Inline welcome screen rendering, module picker rendering, and routing logic directly in the entry point.
**Why it is wrong:** gsd-learn.cjs is already 184 lines of flag parsing and wiring. Adding 200+ lines of screen rendering makes it untestable and hard to modify.
**Do this instead:** Create `screens.cjs` with pure rendering functions. Entry point only calls them and handles outer control flow.

### Anti-Pattern 2: Nested Navigation State Machine

**What people do:** Build a state machine that tracks "current screen" (welcome/picker/lesson) inside a single navigation loop.
**Why it is wrong:** The existing `runNavigationLoop` is clean because it only handles lesson/part navigation. Mixing screen-level navigation into it creates tangled state.
**Do this instead:** Hub-and-spoke: outer loop in gsd-learn.cjs handles screen transitions, inner loop (runNavigationLoop) handles lesson navigation. 'm' key exits the inner loop cleanly.

### Anti-Pattern 3: Breaking waitForKey() Abstraction

**What people do:** Change `waitForKey()` to return different types depending on context (string for lessons, object for picker).
**Why it is wrong:** `waitForKey()` is a clean, reusable primitive. Overloading it breaks the abstraction.
**Do this instead:** Create a separate `waitForPickerKey(modules)` in screens.cjs for number-key selection. Keep `waitForKey()` returning simple action strings -- just add 'm' and 'h' to the set.

### Anti-Pattern 4: Storing Hint State in Progress

**What people do:** Track hints-shown-count in progress.json alongside lesson position.
**Why it is wrong:** Hint tracking is already handled by feedback.cjs with event sourcing. Duplicating in progress.json creates sync issues.
**Do this instead:** Read hint count from `feedback.cjs` events (already implemented in `--hint` CLI flag handler). The 'h' key handler follows the same pattern.

### Anti-Pattern 5: Complex Part-Level Resume

**What people do:** Store and restore exact part index, progressive accumulation state, and scroll position for resume.
**Why it is wrong:** Parts within a lesson take 5-10 seconds to re-traverse. Storing accumulation state adds schema complexity for marginal UX gain.
**Do this instead:** Resume to lesson start (part 0). User presses 'w' a few times to get back to where they were. Store part in `lastPosition` for display purposes only ("You were on Lesson 4, Part 3").

## Sources

- Direct codebase analysis of `learn/lib/*.cjs` and `learn/bin/gsd-learn.cjs` (HIGH confidence)
- Existing `listModules()` in lessons.cjs confirms module discovery already built (HIGH confidence)
- Progress schema v2 in progress.cjs confirms per-module tracking foundation exists (HIGH confidence)
- Feedback event sourcing in feedback.cjs confirms hint tracking infrastructure exists (HIGH confidence)
- Navigator key binding pattern in navigator.cjs confirms clean extension approach (HIGH confidence)
- PROJECT.md v2.2 milestone requirements for feature scope (HIGH confidence)

---
*Architecture research for: Module discovery UI and welcome experience integration*
*Researched: 2026-03-12*
