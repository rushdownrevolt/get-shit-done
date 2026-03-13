# Feature Research: Module Discovery UI & Welcome Experience

**Domain:** CLI interactive learning tool -- module navigation, onboarding, and resume behavior
**Researched:** 2026-03-12
**Confidence:** HIGH (most patterns verified against existing codebase + established CLI learning tools)

## Feature Landscape

### Table Stakes (Users Expect These)

Features that a multi-module CLI learning tool must have. Without these, the experience feels broken or confusing.

| Feature | Why Expected | Complexity | Depends On | Notes |
|---------|--------------|------------|------------|-------|
| Welcome screen for first-time users | Learner launches tool with no context; needs to know what this is and why they should care | LOW | Nothing (entry point) | Rustlings shows a welcome message on first launch. GSD Learn should pitch what the learner will achieve (modify/extend GSD). Detect first-run via absence of progress.json |
| Module picker with progress indicators | With 2+ modules, learner needs to see what's available and where they stand | MEDIUM | `listModules()` already exists in lessons.cjs | Show each module with title, description, lesson count, and progress (e.g., "4/6 lessons"). Rustlings uses checkmarks + "Pending" labels. GSD Learn should use filled/empty dots (matches existing `renderLessonProgressFooter` pattern) |
| Recommended starting module | New user doesn't know which module to start with; needs clear guidance | LOW | Module picker | Flag Module 1 (GSD Commands) as "Start here" or "Recommended". Simple: first incomplete module by order. Already have `order` field in module.json |
| Resume-to-last-position for returning users | Learner quits mid-lesson, comes back next day, expects to pick up where they left off | LOW | Progress already saved via progress.cjs | progress.json already stores `currentModule` and `currentLesson`. Currently the main entry point reads `startIndex` from progress. Need: detect returning user, show brief "Welcome back" message, auto-resume into last module/lesson |
| "M" key to return to module picker | Learner finishes a module or wants to switch; needs escape hatch back to module list | MEDIUM | Module picker screen, navigator.cjs key handling | Add 'm' to `waitForKey()` action map. Return special action that breaks out of `runNavigationLoop` back to module picker. Must save progress before switching |
| "H" key for hints during mini-project | Learner is stuck on mini-project; existing `--hint` CLI flag works but requires quitting the interactive session | LOW | hints.cjs already implements `getNextHint()`, feedback.cjs tracks hint usage | Add 'h' to `waitForKey()`. Only active on mini-project lesson (detect via `section.type === 'project'`). Render hint inline or as overlay, then re-render current part |
| Slimmer return-user module page message | Returning user doesn't need the full welcome pitch again | LOW | Welcome screen, first-run detection | First visit: full welcome pitch. Return visit: one-liner like "Welcome back. You're on Module 1, Lesson 4." |

### Differentiators (Set Product Apart)

Features not strictly required but add polish and value beyond what Rustlings/Exercism offer.

| Feature | Value Proposition | Complexity | Depends On | Notes |
|---------|-------------------|------------|------------|-------|
| Module completion state in picker | Show completed modules distinctly (checkmark, dimmed, "Complete") vs in-progress vs not-started | LOW | Module picker, progress data | Three states: not started (no progress entry), in-progress (has progress, not at end), completed (reached last lesson). Could extend progress.json modules map with `completed: true` flag |
| Animated/styled welcome banner | First impression matters; a well-crafted ASCII/box-drawing welcome screen makes the tool feel polished | LOW | Welcome screen | Use existing `style()` and box-drawing characters from terminal.cjs. Keep it fast (no npm dependencies). Rustlings uses a simple text welcome; GSD Learn can do better with existing primitives |
| Smart resume message showing context | Instead of just "Welcome back", show what the learner was working on: "You were learning about dispatch chains in Module 1" | LOW | Progress data, module/lesson metadata | Load progress, resolve module title and lesson title, display contextual message. All data already accessible |
| Module prerequisite indicators | Show that Module 2 builds on Module 1 concepts; suggest completing Module 1 first | LOW | Module picker, module.json | Add optional `prerequisites` field to module.json or derive from order. Display "Complete Module 1 first" if Module 2 is selected without Module 1 completion |
| Per-module progress persistence across module switches | When switching from Module 2 back to Module 1, resume at Module 1's last position | LOW | Progress data restructure | progress.json already has `modules` map. Need to store `currentLesson` per module in the modules map (partially implemented -- `modules[id].currentLesson` exists in migration code) |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for this specific tool.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full interactive menu system (arrow-key list selection) | Feels modern, like Inquirer.js prompts | Adds complexity to raw-mode key handling; overkill for 2-5 modules; breaks the minimal aesthetic; would need dependency or significant code | Number-key selection (press 1 for Module 1, 2 for Module 2). Simpler, faster, matches terminal culture |
| Persistent hint display overlay | Show hints in a sidebar or split pane | Terminal split-pane rendering is fragile across terminal emulators; adds massive complexity | Show hint inline below current content, or clear-and-redisplay with hint prepended. Re-render on next keypress |
| Auto-advance to next module on completion | After finishing Module 1, automatically start Module 2 | Removes learner agency; they may want to review, take a break, or do the mini-project first | Show completion banner with "Press M for module list" or "Press W to start next module" -- let them choose |
| Web-based progress dashboard | Visual progress tracking in browser | Out of scope per PROJECT.md constraints; adds HTTP dependency; breaks terminal-only model | The module picker IS the progress dashboard. Show progress dots, completion counts inline |
| Gamification (badges, streaks, XP) | Motivation through game mechanics | Distracts from the core value (learning GSD internals); adds state complexity; feels patronizing for developer audience | The mini-project IS the reward. Module completion banner already celebrates achievement |
| Undo/replay for hints | Let user un-request a hint to try again without it | Overcomplicates hint state; hints are progressive so earlier hints are less revealing anyway | Hints are already progressive (vague to specific). No need to undo -- just don't request the next one |

## Feature Dependencies

```
[Welcome Screen (first-run detection)]
    |
    +---> [Module Picker with progress]
    |         |
    |         +---> [Module completion state in picker]
    |         |
    |         +---> [Smart resume message]
    |         |
    |         +---> [Recommended starting module flag]
    |
    +---> [Slimmer return-user message]

[Module Picker]
    |
    +---> ["M" key binding] (needs picker to navigate TO)
    |
    +---> [Per-module progress persistence] (needs picker to switch BETWEEN)

["H" key binding] --independent-- (no dependency on module picker)
    |
    +--requires--> [Mini-project lesson detection (section.type === 'project')]
    +--requires--> [hints.cjs getNextHint()] (already exists)
    +--requires--> [feedback.cjs recordEvent()] (already exists)
```

### Dependency Notes

- **Welcome Screen must come before Module Picker:** The welcome screen is the entry gate. First-time users see it, then land on the module picker. Returning users skip to module picker (or auto-resume).
- **Module Picker is the hub:** Both "M" key and resume behavior depend on having a module picker screen to navigate to/from.
- **"H" key is independent:** Can be built in any order. It only needs existing hint infrastructure (already shipped) and a keypress handler addition.
- **Per-module progress persistence is partially built:** The `modules` map in progress.json exists but isn't fully utilized for per-module lesson positions during module switches. This is low complexity to complete.

## MVP Definition (v2.2 Milestone)

### Must Ship

- [ ] **Welcome screen** -- First-run detection (no progress.json = first time). GSD pitch: what you'll learn, what you'll be able to do. Key to continue to module picker.
- [ ] **Module picker** -- List all modules with title, description, progress (X/Y lessons). Highlight recommended module. Number-key selection (1, 2, etc.).
- [ ] **Resume behavior** -- Returning user (progress.json exists): show brief welcome-back with context ("You were on Module 1, Lesson 4"), then either auto-resume or show module picker.
- [ ] **"M" key binding** -- From any lesson, press M to save progress and return to module picker. Add to navigator.cjs `waitForKey()`.
- [ ] **"H" key binding** -- From mini-project lesson, press H to show next progressive hint inline. No-op on non-project lessons (or show "Hints available on mini-project lessons only").
- [ ] **Slimmer return message** -- Return visits skip the full welcome, show one-liner status.

### Add If Time Permits

- [ ] **Module completion tracking** -- Set `completed: true` in progress.json when learner reaches last lesson of a module. Show checkmark in module picker.
- [ ] **Per-module lesson position** -- Store `currentLesson` per module ID in `modules` map so switching between modules preserves position in each.
- [ ] **Module prerequisite indicator** -- "Complete Module 1 first" suggestion on Module 2 if Module 1 is incomplete.

### Defer to Future Milestones

- [ ] **Interactive arrow-key module selection** -- Only valuable with 5+ modules. Current 2 modules work fine with number keys.
- [ ] **Progress statistics** -- Time spent per module, lessons per session, etc. Requires event tracking infrastructure beyond current feedback.cjs.
- [ ] **Module search/filter** -- Only needed at scale (10+ modules).

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Phase |
|---------|------------|---------------------|----------|-------|
| Welcome screen (first-run) | HIGH | LOW | P1 | Build first |
| Module picker with progress | HIGH | MEDIUM | P1 | Build second (welcome leads here) |
| Resume-to-last-position | HIGH | LOW | P1 | Build with module picker |
| "M" key to module picker | HIGH | LOW | P1 | Build after module picker exists |
| "H" key for hints | MEDIUM | LOW | P1 | Independent, build anytime |
| Slimmer return-user message | MEDIUM | LOW | P1 | Build with welcome screen |
| Module completion state | MEDIUM | LOW | P2 | Polish after core works |
| Per-module progress persistence | MEDIUM | LOW | P2 | Polish after M key works |
| Module prerequisite indicator | LOW | LOW | P3 | Only 2 modules, low urgency |

## Competitor/Reference Feature Analysis

| Feature | Rustlings | Exercism CLI | GSD Learn Approach |
|---------|-----------|--------------|-------------------|
| Welcome/onboarding | Text welcome on first run, then straight into exercises | Web-based onboarding, CLI is just a download tool | Terminal welcome screen with GSD pitch, then module picker |
| Module/track discovery | Single ordered list (no modules); `l` key opens interactive exercise list | Web-based track browser; CLI has no discovery UI | Module picker screen with progress, number-key selection |
| Progress display | Progress bar `[>---] 1/84`, checkmarks on completed | Web dashboard | Per-module filled/empty dots (consistent with existing lesson footer) |
| Resume behavior | Automatic -- watches file system, picks up at first unsolved exercise | Web-based, CLI doesn't track progress | Auto-detect via progress.json, show context, resume or picker |
| Hint system | `h` key in watch mode shows current exercise hint | Web-based hints on exercise page | `H` key shows progressive hint inline on mini-project lessons |
| Navigation keys | `l` list, `h` hint, `q` quit, `r` run | N/A (not interactive) | `w` next, `q` back, `e` skip, `c` copy, `m` modules, `h` hint, `esc` quit |

## Implementation Notes for Existing Codebase

### First-Run Detection
The simplest approach: check if `progress.json` exists via `fs.existsSync()` before calling `loadProgress()`. Currently `loadProgress()` silently returns `DEFAULT_PROGRESS` on file-not-found, which loses the "is this a first visit?" signal. Either add an `existsProgress(cwd)` helper, or check `progress.currentModule === null` (which is the default and indicates no module has ever been selected).

### Module Picker Rendering
Use existing `style()`, `horizontalRule()`, and `clearScreen()` from terminal.cjs. The `listModules()` function in lessons.cjs already returns sorted module metadata. Combine with progress data to show per-module lesson counts. Render as a new function in renderer.cjs (e.g., `renderModulePicker(modules, progress)`).

### Key Binding Expansion
The `waitForKey()` function in navigator.cjs is the single point of change. Add `'m'` and `'h'` handlers. The `runNavigationLoop()` needs a new return value or callback for the 'm' action to signal "return to module picker" vs "quit entirely". Suggestion: return an object `{ action: 'quit' | 'modules', lessonIndex }` instead of just returning void.

### Main Loop Restructure
Currently `gsd-learn.cjs` runs a single `runNavigationLoop()` call and exits. The new flow needs an outer loop:

```
1. Check progress (first-time vs returning)
2. Show welcome OR welcome-back
3. Show module picker (or auto-resume with 'r' key option)
4. Enter navigation loop for selected module
5. On 'M' key: break back to step 3
6. On quit: save and exit
```

This means wrapping the current main flow in an outer loop. The `runNavigationLoop()` return value tells the outer loop whether to show the module picker again or exit entirely.

### "H" Key Context Sensitivity
The hint key should only be active when the current lesson contains project content. The navigator needs to know whether the current lesson is a mini-project. Options:
1. Pass a `lessonMeta` object to `waitForKey()` that includes `hasProject` boolean
2. Have `runNavigationLoop` conditionally handle 'h' based on current lesson content
3. Always handle 'h' in `waitForKey()` but show "No hints for this lesson" on non-project lessons

Option 2 is cleanest -- the navigator already has access to the lesson object.

## Sources

- [Rustlings usage documentation](https://rustlings.rust-lang.org/usage/) -- Watch mode commands, hint key, list navigation
- [Rustlings GitHub repository](https://github.com/rust-lang/rustlings) -- Exercise list UI, progress indicators
- [Rustlings progress indicator discussion](https://github.com/rust-lang/rustlings/issues/360) -- Community expectations for progress display
- [Command Line Interface Guidelines](https://clig.dev/) -- General CLI UX best practices
- [Exercism CLI onboarding issues](https://github.com/exercism/exercism/issues/2047) -- Difficulties with CLI-first onboarding
- [Gemini CLI session management](https://developers.googleblog.com/pick-up-exactly-where-you-left-off-with-session-management-in-gemini-cli/) -- Resume pattern
- Existing codebase analysis: progress.cjs, navigator.cjs, lessons.cjs, renderer.cjs, gsd-learn.cjs

---
*Feature research for: GSD Learn v2.2 Module Discovery & Welcome*
*Researched: 2026-03-12*
