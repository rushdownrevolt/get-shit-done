# Pitfalls Research

**Domain:** Adding module discovery UI, welcome screen, resume behavior, and key binding changes to existing CLI learning tool
**Researched:** 2026-03-12
**Confidence:** HIGH (based on direct codebase analysis of existing system)

## Critical Pitfalls

### Pitfall 1: Navigation Loop Cannot Break Out to Module Selection

**What goes wrong:**
The current `runNavigationLoop()` in `navigator.cjs` is a sealed loop -- it iterates lessons within a single module and only exits via `return` (quit or end of module). Adding an "M" key to navigate to a module picker requires breaking out of this loop mid-lesson and transitioning to a different UI state. If "M" is handled like other keys (returning an action string), the navigation loop has no mechanism to pause its state, show a module picker, and then either resume the current module or start a different one. The loop would either exit entirely (losing the learner's in-lesson position) or the module picker would need to be embedded inside the loop (creating a tangled mess).

**Why it happens:**
The navigator was designed for single-module linear traversal. It has no concept of "leave and come back" or "switch context." The natural instinct is to add `else if (action === 'module')` alongside the existing `next/prev/skip/copy/quit` handlers, but the loop's architecture does not support re-entry at a specific lesson+part position after a context switch.

**How to avoid:**
Design a two-level loop architecture:
1. **Outer loop** (in `gsd-learn.cjs`): Manages application state -- welcome screen, module selection, and launching the lesson navigator. This loop persists across module switches.
2. **Inner loop** (existing `runNavigationLoop`): Handles lesson/part navigation within a module. When "M" is pressed, it returns a special `'module'` action that causes the outer loop to show the module picker. The outer loop then either re-enters the same module (at the saved position) or starts a different module.

The key insight: `runNavigationLoop` should return its exit reason (`'quit'` vs `'module'` vs `'completed'`) so the caller can decide what happens next. Currently it returns `undefined` (void).

**Warning signs:**
- "M" key works but dumps the learner back to terminal prompt instead of showing module picker
- Pressing "M" then selecting the same module restarts from lesson 1 instead of resuming
- Module picker is rendered inside `renderPart()` creating a UI state the navigator was not designed for

**Phase to address:**
Phase 1 (Navigation Architecture) -- the outer loop and navigator return values must be designed before any new key bindings or screens are built.

---

### Pitfall 2: Welcome Screen Shown to Returning Users on Every Launch

**What goes wrong:**
A welcome/intro screen is added for first-time users, but without proper gating it shows on every `gsd-learn` invocation. Returning users who have completed lessons are forced to press a key to dismiss the welcome screen before they can resume. This is especially annoying for the "resume where you left off" feature -- the whole point of resume is instant continuation, but a welcome screen adds friction.

**Why it happens:**
The distinction between "first-time user" and "returning user" is not currently tracked. `progress.json` has `currentLesson: 0` for both a fresh user and a user who has never advanced past lesson 0. Without a clear "has seen welcome" or "has started any module" signal, the welcome screen either always shows or requires fragile heuristics.

**How to avoid:**
Use progress.json state to determine first-time vs returning:
- **First-time user:** No progress.json exists, OR progress.json exists but `modules` object is empty (no module has `started: true`). Show full welcome screen.
- **Returning user:** At least one module has `started: true` in progress. Skip welcome, go directly to resume or module picker.
- Add a `welcomeSeen: true` field to progress.json after the first welcome display for an unambiguous signal.

The "slimmer return-user message on module page" in the requirements already anticipates this -- but the implementation must gate on a reliable signal, not guess.

**Warning signs:**
- Returning users complain about "having to skip the intro every time"
- Welcome screen logic uses `currentLesson === 0` as proxy for "new user" (wrong -- a user could be on lesson 0 of Module 2 after completing Module 1)
- No test covers the returning-user path

**Phase to address:**
Phase 1 (Welcome and Resume) -- the first-time/returning detection must be implemented before building either the welcome screen or resume behavior.

---

### Pitfall 3: "H" Key Conflicts With Existing Hint Architecture

**What goes wrong:**
The requirements say "H key for hints on mini-project step." But hints currently work via the CLI flag `--hint`, which loads from `hints.json`, tracks hint count in `feedback.json`, and returns progressive hints. Adding an "H" key inside the navigation loop means hints must work inline (displayed on the current screen) rather than as a separate CLI invocation. If "H" just shells out to `gsd-learn --hint`, the screen clears and the learner loses their lesson context. If "H" tries to render hints inline, it must integrate with the feedback tracking system from within the navigator -- something the navigator currently has no access to.

**Why it happens:**
The hint system was designed as a standalone CLI operation (`--hint` flag), not as an interactive in-lesson feature. The navigator does not receive module context, feedback state, or hint data. Retrofitting "H" into the navigator requires threading several dependencies through that the navigator was intentionally kept free of.

**How to avoid:**
Two options:
1. **Option A (simpler):** "H" key only appears and works on the mini-project part. When pressed, it renders the next hint inline below the project content (appended to the current render), increments the hint counter in feedback.json, and re-renders on next keypress. Pass a `hintFn` callback to `runNavigationLoop` that the navigator calls when "H" is pressed on a project part.
2. **Option B (over-engineered):** Make the navigator aware of the full hint/feedback system. This adds too many dependencies to a module that is currently clean.

Choose Option A. The navigator stays thin -- it just calls a callback. The callback (defined in `gsd-learn.cjs`) has access to module context, hint data, and feedback tracking.

**Warning signs:**
- "H" key is silently ignored because `waitForKey()` does not handle it
- "H" key works on every part, not just the mini-project part (confusing -- hints are only for projects)
- Hint display clears the screen and shows raw hint text with no lesson context
- Hint count is not tracked (pressing "H" always shows hint 1)

**Phase to address:**
Phase 2 (Key Bindings) -- "H" key should be added after the navigation architecture is settled (Phase 1) so the callback pattern is already in place.

---

### Pitfall 4: Resume Logic Puts Returning User on Wrong Part Within a Lesson

**What goes wrong:**
Progress tracking saves `currentLesson` (the lesson index) but not `currentPart` (the part index within a lesson). When a returning user resumes, they land on part 0 of their saved lesson, even if they had progressed to part 3 of 5 before quitting. For long lessons with many parts, this is frustrating -- the learner must press "W" repeatedly to get back to where they were.

**Why it happens:**
The `progressFn` callback in `gsd-learn.cjs` only saves the lesson index: `progress.currentLesson = idx`. The part index is a transient variable inside `runNavigationLoop`'s inner `while` loop and is never persisted. This was acceptable when lessons were short, but with the block-based content system (progressive accumulation), lessons can have 5-8 parts.

**How to avoid:**
Extend per-module progress to include `currentPart`:
```json
{
  "modules": {
    "gsd-commands": { "currentLesson": 3, "currentPart": 2, "started": true }
  }
}
```
Update `progressFn` to accept and save both lesson and part indices. Update `runNavigationLoop` to call `progressFn` on every part advance (not just lesson advance). Update the resume path to pass `startPart` to the navigator.

Caution: saving on every part advance means more frequent writes to progress.json. This is fine for a CLI tool (not a hot loop), but the progressFn callback signature needs to change from `(lessonIndex)` to `(lessonIndex, partIndex)`.

**Warning signs:**
- User resumes and sees "Part 1 of 5" when they were on part 4 before quitting
- Progress.json has no `currentPart` field
- `runNavigationLoop`'s `startPart` parameter is always 0 from the entry point

**Phase to address:**
Phase 1 (Resume Behavior) -- part-level progress must be implemented alongside lesson-level resume.

---

### Pitfall 5: Module Picker Shows No Useful Progress Information

**What goes wrong:**
A module picker is built that lists module names but does not show meaningful progress indicators. The learner sees "Module 1: GSD Commands" and "Module 2: Command Lifecycle" but cannot tell which one they have started, how far they are, or which is recommended. Without progress context, the module picker is just a menu -- it does not help the learner make a decision.

**Why it happens:**
The `listModules()` function in `lessons.cjs` returns module metadata (id, title, description, order) but has no access to progress data. Building the module picker requires combining data from two sources: `listModules()` for module metadata and `loadProgress()` for per-module completion state. It is easy to build the picker using only module metadata and forget to integrate progress.

**How to avoid:**
Design the module picker renderer to accept both module list and progress data. For each module, compute and display:
- **Status:** Not started / In progress (lesson X of Y) / Completed
- **Recommended flag:** Highlight the recommended starting module (Module 1 for new users, next incomplete module for returning users)
- **Lesson progress:** "3 of 6 lessons" or a progress bar/dots

The per-module progress in `progress.json` already tracks `currentLesson` and `started`. Add a `completed` flag (set when the learner sees the completion banner). Use these fields to compute display status.

**Warning signs:**
- Module picker shows a flat list of names with no progress indicators
- User cannot tell which module to start without prior knowledge
- No "recommended" marker for the logical next module
- Completed modules look the same as not-started modules

**Phase to address:**
Phase 2 (Module Picker UI) -- the picker must integrate progress data, not just module metadata.

---

### Pitfall 6: Key Binding "M" Collides With Future Keys or Platform Expectations

**What goes wrong:**
Adding "M" for module navigation and "H" for hints expands the key space from 5 keys (w/q/e/c/esc) to 7. The navigation footer already shows `[w] Next  [q] Back  [e] Skip lesson  [c] Copy  [esc] Quit`. Adding `[m] Modules  [h] Hints` makes the footer long and cluttered. Worse, key collision risks increase: "m" and "h" are lowercase letters that could conflict with terminal escape sequences on some platforms, or with future features.

**Why it happens:**
The key binding system in `waitForKey()` is a flat if/else chain with no validation, no grouping by context, and no documentation of which keys are reserved. Each new feature just adds another `else if`. There is no concept of context-dependent keys (e.g., "H" only active on project parts).

**How to avoid:**
1. **Context-dependent key display:** Only show relevant keys in the footer. On regular lesson parts: `[w] Next  [q] Back  [e] Skip  [c] Copy  [m] Modules  [esc] Quit`. On mini-project parts: add `[h] Hint`. This keeps the footer readable.
2. **Key registry pattern:** Instead of a flat if/else chain, use a key map object that `waitForKey()` consults. This makes it easy to see all bindings at a glance and prevents accidental collisions.
3. **Document reserved keys:** Comment in `waitForKey()` which keys are taken and which are available for future use.

The footer formatting is the visible symptom -- the underlying issue is that key bindings are implicit in control flow rather than explicit in a data structure.

**Warning signs:**
- Navigation footer wraps to two lines in narrow terminals (< 80 columns)
- "H" key does something on non-project parts where it should be ignored
- Adding a third new key requires modifying `waitForKey()`, `renderPart()` footer, and the navigator loop in three separate files

**Phase to address:**
Phase 2 (Key Bindings) -- implement context-dependent keys and footer rendering together.

---

### Pitfall 7: Welcome Screen and Module Picker Are Two Separate Flows With Duplicated Logic

**What goes wrong:**
The welcome screen (first-time user) and module picker (returning user or "M" key) are built as separate render functions with duplicated module listing, progress display, and selection logic. When the module list changes or progress display is updated, both flows need updating. They diverge over time -- the welcome screen shows stale progress indicators while the module picker shows current ones, or vice versa.

**Why it happens:**
Welcome and module picker feel like different features: "welcome is for new users, module picker is for returning users." But they share the core interaction: show available modules with progress, let the user pick one. The only difference is the welcome screen has an introductory pitch before the module list.

**How to avoid:**
Build one composable module picker component. The welcome screen wraps it with an intro banner. The "M" key flow calls it directly. The returning-user launch flow calls it with a slim header. All three entry points use the same module rendering and selection logic.

Structure:
- `renderModuleList(modules, progress)` -- pure render function for the module list with progress
- `renderWelcomeScreen(modules, progress)` -- calls `renderModuleList` after the intro pitch
- `renderModulePicker(modules, progress)` -- calls `renderModuleList` with a minimal header

**Warning signs:**
- Module progress is displayed differently on the welcome screen vs the "M" key module picker
- Bug fix to module display requires changes in two places
- Welcome screen lists modules but module picker uses a different sorting or filtering

**Phase to address:**
Phase 1 (Architecture) -- design the composable module list component before building either the welcome screen or module picker.

---

### Pitfall 8: Resume Behavior Ignores Module Completion State

**What goes wrong:**
A returning user who has completed all modules launches `gsd-learn` and the resume logic tries to resume them into... what? If `currentModule` points to a completed module and `currentLesson` equals the last lesson index, the navigator immediately shows the completion banner and exits. The user is stuck in a loop of launch -> completion banner -> exit.

**Why it happens:**
Resume logic naively reads `currentModule` and `currentLesson` from progress and feeds them to the navigator without checking whether the module is already completed. The happy path (user is mid-module) works fine, but the edge case (user finished everything) was not considered.

**How to avoid:**
Resume logic should check completion state before auto-resuming:
- **All modules completed:** Go to module picker with a congratulatory message. Let them revisit any module.
- **Current module completed, others not started:** Go to module picker with the next incomplete module recommended.
- **Current module in progress:** Resume to saved lesson+part position (normal path).

This requires a `completed` flag in per-module progress. Set it when the completion banner is displayed. Check it in the resume logic before entering the navigation loop.

**Warning signs:**
- Completing a module and relaunching shows the completion banner again immediately
- No way to navigate to the module picker after completing the last module without using `--module` flag
- Resume logic does not distinguish "completed module" from "in-progress module at last lesson"

**Phase to address:**
Phase 1 (Resume Behavior) -- completion state tracking and resume edge cases must be handled together.

---

### Pitfall 9: Progress Save During Module Switch Loses In-Lesson Position

**What goes wrong:**
User is on Module 1, Lesson 3, Part 4. They press "M" to switch modules, select Module 2, and start exploring. Later they press "M" again and go back to Module 1. They land on Lesson 3, Part 0 -- their part position was not saved when they switched away.

**Why it happens:**
The "M" key triggers a navigation loop exit. The current `progressFn` only saves lesson index on lesson transitions (advancing to next lesson) or on quit. It does not save the current part position, and it does not fire on "module switch" exits. The part index is lost when the navigator returns.

**How to avoid:**
When the navigator exits for any reason (quit, module switch, completion), it should save the current lesson AND part position. This means:
1. `runNavigationLoop` must return its final position: `{ lesson, part, reason }` where reason is `'quit' | 'module' | 'completed'`.
2. The outer loop in `gsd-learn.cjs` saves the returned position to per-module progress before proceeding.

This ties directly to Pitfall 4 (resume at part level). Both require the same progress schema change and the same navigator return value enhancement.

**Warning signs:**
- Switching modules and switching back always lands on part 0 of the saved lesson
- Progress is only saved on lesson advance, not on mid-lesson exit
- `runNavigationLoop` returns `undefined` instead of exit state

**Phase to address:**
Phase 1 (Navigation Architecture) -- navigator return values and part-level progress save must be implemented together.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Welcome screen as a special case in `gsd-learn.cjs` main() | Quick to add an if-block at the top of main() | Welcome logic, module picker logic, and resume logic all pile up in main() making it a 200+ line procedural function | Never -- extract screen rendering and state machine logic into separate modules |
| Hardcoding "M" and "H" into `waitForKey()` if/else chain | Fastest way to add new keys | Each new key is another branch; no documentation of which keys are available; context-dependent behavior (H only on project parts) becomes nested conditions | Acceptable for "M" (always active) but not for "H" (context-dependent) -- "H" needs the callback pattern |
| Skipping part-level progress persistence | Avoids changing progress schema and progressFn signature | Resume always lands on part 0; module switch loses part position; user frustration grows with longer lessons | Only acceptable if all lessons have 3 or fewer parts -- currently some have 5-8 |
| Using `process.stdout.write()` for welcome/module screens instead of building a renderer | Quick visual output without new module | Screen rendering is scattered across gsd-learn.cjs (welcome), renderer.cjs (lessons), and inline stdout writes (module picker); no consistent styling | Never -- use the existing terminal.cjs styling functions and create a proper screen renderer |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `waitForKey()` + new keys | Adding "m" and "h" to the flat if/else without updating the return type annotation | Update the JSDoc return type from `'next'\|'prev'\|'skip'\|'copy'\|'quit'` to include `'module'` and `'hint'`. Update all callers to handle new action types. |
| Module picker + `listModules()` | Calling `listModules()` but forgetting to call `loadProgress()` to get completion data | The module picker needs both: `listModules(contentDir)` for metadata AND `loadProgress(cwd)` for per-module status. Pass both to the renderer. |
| Resume + `runNavigationLoop` start params | Passing `startIndex` for lesson but ignoring `startPart` parameter (currently hardcoded to 0 inside the loop) | The `startPart` variable in `runNavigationLoop` is set to 0 at line 84. Either add a `startPart` parameter to the function signature, or have the caller set the `startPart` value on the first iteration by passing it through opts. |
| Welcome screen + progress save | Showing welcome, user selects module, but progress is not updated until they advance a lesson | Save `currentModule` to progress immediately when the user selects a module from the picker, before entering the navigation loop. Currently `progress.currentModule = moduleId` happens in main() but is not persisted until `progressFn` fires. |
| "H" key + hint tracking | Displaying hint text but not incrementing `hintsUsed` in feedback.json | The `recordEvent()` call currently lives in the `--hint` CLI flag handler. When "H" is pressed inline, the same `recordEvent()` must be called. Pass feedback tracking into the hint callback. |
| Navigation footer + terminal width | Adding `[m] Modules` and `[h] Hints` to footer without checking terminal width | Use `process.stdout.columns` to conditionally abbreviate keys: full labels above 100 columns, short labels (`[m] Mod  [h] Hint`) below 80. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Welcome screen is too long (multi-page scroll) | User skips it entirely, missing the value pitch | Keep welcome to one screen (no scrolling). 3-4 lines of pitch, then the module list. Everything visible at once. |
| Module picker requires typing a number or name | Error-prone input; user types wrong thing and gets error message | Use single-keypress selection: `[1] Module 1  [2] Module 2`. Matches existing navigation pattern (single key, immediate response). |
| "M" key exits current lesson with no confirmation | User accidentally presses "M" and loses their reading position | Two options: (a) save position before exiting so they can resume exactly, or (b) show a confirmation "Leave lesson? [y/n]". Option (a) is better -- it matches the "resume where you left off" philosophy. |
| Resume message does not tell user where they are | User sees "Resuming..." but does not know which module or lesson they are jumping to | Show a brief status: "Resuming Module 1: GSD Commands -- Lesson 3 of 6". Give them 1 second to read it, or let them press any key to continue. |
| Hint shown inline replaces lesson content | Pressing "H" clears the screen and shows only the hint; lesson context lost | Append hint below the mini-project content, above the navigation footer. Re-render the full part with the hint added. User can still see the project instructions alongside the hint. |
| No visual distinction between "recommended" and other modules | Module picker lists modules but the learner does not know where to start | Add a clear marker: `[1] Module 1: GSD Commands  <-- Start here` or use color/bold to highlight the recommended module. |

## "Looks Done But Isn't" Checklist

- [ ] **Welcome gating:** Verify that returning users (progress.json exists with started modules) skip the welcome screen and go directly to resume or module picker
- [ ] **Resume position:** Verify that resume restores both lesson AND part index, not just lesson
- [ ] **Module switch round-trip:** Verify that pressing "M" from Module 1, selecting Module 2, pressing "M" again, and selecting Module 1 returns to the exact lesson+part position
- [ ] **Module completion flag:** Verify that completed modules are marked as completed in progress.json and display as completed in the module picker
- [ ] **All-modules-completed edge case:** Verify that launching gsd-learn after completing all modules shows the module picker (not an infinite completion banner loop)
- [ ] **"H" key context:** Verify that "H" key only responds on mini-project parts, not on regular lesson parts
- [ ] **"H" key tracking:** Verify that pressing "H" inline increments the hint counter in feedback.json (same as `--hint` flag)
- [ ] **Footer readability:** Verify that the navigation footer with all keys fits within 80 columns without wrapping
- [ ] **"M" key position save:** Verify that pressing "M" saves current lesson+part to progress before showing the module picker
- [ ] **Welcome screen height:** Verify that the full welcome screen (pitch + module list) fits in one terminal screen (24-30 lines) without scrolling
- [ ] **Module picker progress:** Verify that the module picker shows per-module progress (not started / lesson X of Y / completed) for each module
- [ ] **Slim return-user message:** Verify that the module page shows a shorter message for returning users vs first-time users

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Navigator cannot break out for module selection | MEDIUM | Refactor `runNavigationLoop` to return exit reason and position. Add outer loop in gsd-learn.cjs. Requires changing navigator API but not its internal logic. |
| Welcome screen shown every launch | LOW | Add `welcomeSeen` field to progress.json. Gate welcome display on this field. Small change. |
| "H" key conflicts with hint architecture | LOW | Add hint callback parameter to `runNavigationLoop`. Navigator calls it when "H" pressed. Callback handles feedback tracking. Clean separation. |
| Resume lands on wrong part | MEDIUM | Extend progress schema to include `currentPart`. Update progressFn signature. Update navigator start logic. Requires touching progress.cjs, navigator.cjs, and gsd-learn.cjs. |
| Module picker has no progress info | LOW | Pass both module list and progress data to picker renderer. Compute display status from existing progress fields. |
| Key binding clutter | LOW | Context-dependent footer rendering. Only show relevant keys for current part type. Small renderer change. |
| Welcome and module picker duplicated | MEDIUM | Extract shared `renderModuleList()` function. Both welcome and picker call it. Requires some refactoring of already-built screens. |
| Resume ignores completion state | LOW | Add `completed` flag to per-module progress. Check before auto-resume. Small logic addition. |
| Module switch loses part position | MEDIUM | Same fix as Pitfall 4 (part-level progress). Navigator returns final position on exit. Outer loop saves it. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Navigator cannot break out | Phase 1: Navigation Architecture | `runNavigationLoop` returns `{ lesson, part, reason }` object; outer loop exists in gsd-learn.cjs |
| Welcome shown every launch | Phase 1: Welcome & Resume | progress.json has `welcomeSeen` field; returning users bypass welcome screen |
| Resume lands on wrong part | Phase 1: Welcome & Resume | progress.json has `currentPart` per module; resume restores exact position |
| Resume ignores completion | Phase 1: Welcome & Resume | Completed modules have `completed: true`; all-completed state goes to picker |
| Module switch loses position | Phase 1: Navigation Architecture | "M" key triggers position save before exit; round-trip preserves position |
| Welcome/picker duplication | Phase 1: Navigation Architecture | Shared `renderModuleList()` used by both welcome and picker |
| "H" key conflicts | Phase 2: Key Bindings & Hints | "H" key uses callback pattern; hint callback handles feedback tracking |
| Key binding clutter | Phase 2: Key Bindings & Hints | Footer is context-dependent; "H" only shown on project parts; fits 80 columns |
| Module picker no progress | Phase 2: Module Picker UI | Picker shows status (not started / in progress / completed) and recommended flag |
| "M" key collision risk | Phase 2: Key Bindings & Hints | Key registry documents all bindings; waitForKey return type updated |

## Sources

- Direct codebase analysis of `learn/lib/navigator.cjs` -- sealed navigation loop with no exit-and-return mechanism; `waitForKey()` handles 5 keys (w/q/e/c/esc); `startPart` hardcoded to 0
- Direct codebase analysis of `learn/lib/progress.cjs` -- per-module progress tracks `currentLesson` and `started` but no `currentPart` or `completed` fields
- Direct codebase analysis of `learn/bin/gsd-learn.cjs` -- flat main() with no outer loop; module selection via `--module` flag only; progress.currentModule set but not persisted until progressFn fires
- Direct codebase analysis of `learn/lib/renderer.cjs` -- navigation footer hardcoded at line 262; `renderPart()` has no concept of context-dependent key display
- Direct codebase analysis of `learn/lib/hints.cjs` -- stateless `getNextHint()` function; hint tracking lives in gsd-learn.cjs `--hint` handler, not in navigator
- Direct codebase analysis of `learn/lib/lessons.cjs` -- `listModules()` returns metadata without progress data; designed for listing, not for picker UI
- `.planning/PROJECT.md` -- v2.2 milestone requirements: welcome screen, module picker, resume, "M" key, "H" key, slimmer return-user message

---
*Pitfalls research for: gsd-learn v2.2 -- Module Discovery UI, Welcome Screen, Resume Behavior, Key Bindings*
*Researched: 2026-03-12*
