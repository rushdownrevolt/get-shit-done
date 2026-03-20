# Phase 10: Welcome Screen & Module Picker - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

First-time users see a welcome screen with GSD pitch and module picker combined on one screen. Returning users resume directly at their last lesson (existing Phase 9 behavior). The picker is also accessible via M key (Phase 11) and after module completion. All users share the same module list renderer.

</domain>

<decisions>
## Implementation Decisions

### Welcome Screen (First-Time Users)
- Combined screen: welcome pitch + module picker on one screen (no separate "press any key" welcome gate)
- Confident & direct tone: "Learn to build your own AI workflows. Two modules. Real GSD source code. By the end, you'll ship a custom command from scratch."
- Title: "GSD Learn" at the top
- Horizontal rules separate the pitch from the module list
- Footer: "Press a number to begin"

### Module Picker Layout
- Modules listed with number keys: [1], [2], etc. (arrow keys explicitly out of scope per REQUIREMENTS)
- Each module shows: title on first line, description on indented second line
- Module 1 gets a "Start here" text label (only shown for first-time users or when module is not started)
- Progress display per module:
  - First-time / not started: "Start here" (Module 1 only) or blank
  - In progress: "Lesson 3 of 6"
  - Completed: "Completed ✓"
- Completion state, not percentage (per REQUIREMENTS out-of-scope decision)

### Welcome-Back Experience (Returning Users)
- Returning users launch directly to their last lesson (no picker on launch) — Phase 9 behavior preserved
- When returning users reach the picker (via M key or after module completion), they see: "Pick up where you left off." as a single-line replacement for the full pitch
- Same module list layout with progress indicators

### Flow Between Screens
- First-time launch: Welcome+picker screen → pick module → module intro → start lesson
- Returning launch: Straight to last lesson (no picker)
- Module completion: Completion banner → "Press any key to continue" → welcome-back picker screen
- Picker quit (q): "Goodbye! Your progress has been saved." — same existing message
- Re-entering completed module: Starts from Lesson 1 (review mode)

### Shared Module List Renderer (DISC-04)
- Welcome screen and picker share a single rendering function for the module list
- Function takes: modules array, progress data, isFirstRun boolean
- Output differs only in: "Start here" label (first-run only), progress indicators (returning users)

### Claude's Discretion
- Exact pitch wording (tone and structure are locked, specific sentences are flexible)
- Spacing and visual padding within the screen
- How module descriptions are truncated if too long
- Whether the completion banner needs any updates for the new flow

</decisions>

<specifics>
## Specific Ideas

- The preview mockup the user chose: title → horizontal rule → pitch (3-4 lines) → horizontal rule → module list → "Press a number to begin"
- "Start here" text for Module 1 recommendation — not an arrow, not color-only
- "Pick up where you left off." as the returning-user one-liner — not "Welcome back"
- Completion banner already exists (renderCompletionBanner) — just needs "Press any key to continue" added and flow to picker instead of quit

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `listModules()` in lessons.cjs: returns sorted module metadata (id, title, description, order) — ready for picker
- `isFirstRun()` in progress.cjs: detects first-time vs returning user — ready for welcome/picker branching
- `renderCompletionBanner()` in renderer.cjs: full-screen banner pattern — extend for "press any key" flow
- `waitForKey()` in navigator.cjs: single-keypress handler — use for picker selection and banner dismissal
- `style()` and `clearScreen()` in terminal.cjs: ANSI styling and screen clearing
- `horizontalRule()` in terminal.cjs: separator lines matching existing visual style

### Established Patterns
- Dispatch loop in gsd-learn.cjs: already has `action` variable with 'navigate' and stubs for 'welcome'/'picker'
- `renderPart()` and `renderLesson()` use `process.stdout.write()` for all output
- Navigation footer pattern: `[key] Action  [key] Action` format
- Module intro pattern: title + description + "Press any key to begin" (already implemented for unstarted modules)

### Integration Points
- `gsd-learn.cjs` dispatch loop: add `action === 'welcome'` and `action === 'picker'` branches
- `action = 'navigate'` already exists — picker sets `activeModuleId` then sets `action = 'navigate'`
- `result.reason === 'completed'`: currently breaks — change to set `action = 'picker'`
- New render functions needed: `renderWelcomeScreen()` and `renderModulePicker()` in renderer.cjs
- Both render functions call a shared `renderModuleList()` helper

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-welcome-screen-module-picker*
*Context gathered: 2026-03-13*
