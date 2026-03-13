# Project Research Summary

**Project:** GSD Learn v2.2 — Module Discovery & Welcome
**Domain:** CLI interactive learning tool — module navigation, onboarding, resume behavior, key bindings
**Researched:** 2026-03-12
**Confidence:** HIGH

## Executive Summary

GSD Learn v2.2 adds a module discovery layer on top of a well-structured single-module CLI learning tool. All four research areas converge on the same diagnosis: the primitives needed already exist in the codebase — `listModules()`, `loadProgress()`, `getNextHint()`, `style()`, `clearScreen()` — and this milestone is primarily a control-flow and UI composition problem, not a capability gap. No new dependencies are required. The zero-dependency constraint from PROJECT.md is fully achievable.

The recommended approach is a hub-and-spoke architecture. The module picker becomes the central navigation hub: the welcome screen (first-time users), resume prompt (returning users), and the "M" key (mid-session switches) all converge on the same module picker. A two-level loop structure handles the transition — an outer loop in `gsd-learn.cjs` manages screen routing and module selection, while the existing `runNavigationLoop` handles lesson/part navigation within a selected module. The most important structural change is making `runNavigationLoop` return an exit reason (`{ reason: 'quit' | 'modules' | 'completed' }`) instead of void, which is the architectural unlock for everything else in v2.2.

The primary risks are subtle state bugs rather than missing capabilities: resume logic that ignores module completion state, part-level position lost on module switch, and the welcome screen appearing for returning users on every launch. All are preventable by getting the progress schema right in Phase 1 before building any UI. The research is unanimous: `progress.cjs` and `navigator.cjs` changes must land first, because every downstream feature — screens, routing, key bindings — depends on their APIs being correct.

## Key Findings

### Recommended Stack

No new runtime dependencies. Every v2.2 feature is buildable with Node.js built-ins and existing codebase primitives. STACK.md explicitly catalogs the reusable surface: `style()`, `clearScreen()`, `horizontalRule()`, and `COLORS` from `terminal.cjs` cover all new screen rendering; `waitForKey()` from `navigator.cjs` handles all key input; `listModules()` from `lessons.cjs` already returns sorted module metadata; `loadProgress()`/`saveProgress()` from `progress.cjs` already tracks `currentModule` and per-module state. The work is composition, not installation.

**Core technologies (existing — no changes needed):**
- Node.js >= 16.7.0: runtime — all APIs available since Node 12+, including `readline.emitKeypressEvents`
- `terminal.cjs`: ANSI color/style/clear primitives — already provides everything needed for new screens
- `lessons.cjs`: `listModules()` — already scans all `module.json` files, returns sorted by `order`
- `progress.cjs`: `loadProgress()`/`saveProgress()` — already stores `currentModule`, `currentLesson`, per-module `modules` map
- `hints.cjs` + `feedback.cjs`: `getNextHint()` + `recordEvent()` — already built for `--hint` flag; reusable for inline "H" key

**New files to create (not install):**
- `learn/lib/welcome.cjs` or `learn/lib/screens.cjs` — welcome screen, module picker, resume prompt, `determineEntryRoute()` logic

**What not to add:** `inquirer`, `blessed`, `chalk`, `boxen`, `figlet`, `conf` — all have zero-dependency alternatives already in the codebase.

### Expected Features

**Must have (table stakes):**
- Welcome screen for first-time users — learner launches with no context; needs pitch before module list; detect via `progress.modules` being empty
- Module picker with progress indicators — title, description, lesson count, and status (not started / in progress / completed) per module
- Recommended starting module flag — highlight first incomplete module; derived from `order` field already in `module.json`
- Resume-to-last-position for returning users — `progress.json` already stores enough; add part-level position, slim banner with context
- "M" key to return to module picker — saves progress and exits nav loop cleanly; requires two-level loop architecture
- "H" key for hints during mini-project — reuse existing `hints.cjs`/`feedback.cjs`; active only on `section.type === 'project'` parts
- Slimmer return-user message — one-liner status instead of full welcome pitch for returning users

**Should have (differentiators):**
- Module completion state in picker — `completed: true` flag in per-module progress; checkmarks on finished modules
- Per-module lesson+part position persistence — store `currentLesson` and `currentPart` per module so switching back restores exact position
- Smart resume message with context — "You were on Module 1, Lesson 4" rather than generic "Welcome back"
- Context-dependent navigation footer — show `[h] Hint` only on mini-project parts; keeps footer readable at 80 columns

**Defer to future milestones:**
- Arrow-key cursor navigation for module selection — number keys (1-9) sufficient for current 2 modules; arrow keys add state machine complexity for marginal gain
- Progress statistics (time spent, lessons per session) — requires event tracking infrastructure beyond current `feedback.cjs`
- Module search/filter — only needed at scale (10+ modules)
- Web-based progress dashboard — out of scope per PROJECT.md; breaks terminal-only model

### Architecture Approach

The architecture research identifies four concrete patterns: (1) a pure `determineEntryRoute(progress)` function that routes to `'welcome'`, `'resume'`, or `'module-picker'` at startup, keeping routing logic testable; (2) hub-and-spoke navigation with the module picker as the hub that all entry paths converge on; (3) `runNavigationLoop` returning `{ reason, lesson, part }` instead of void so the outer loop can distinguish quit from module-switch and save exact position; (4) the "H" key using a `hintFn` callback passed to the nav loop, keeping the navigator clean of hint/feedback dependencies. The build order follows hard dependencies: progress schema first, navigator API second, renderer footer third, screens module fourth, entry-point routing fifth, hint overlay sixth.

**Major components:**
1. `screens.cjs` (NEW) — welcome screen, module picker, resume prompt, shared `renderModuleList()`, `determineEntryRoute()` routing logic
2. `gsd-learn.cjs` (MODIFIED) — outer module-selection loop; routes to screens; handles `runNavigationLoop` return reason
3. `navigator.cjs` (MODIFIED) — add `m` and `h` to `waitForKey()`; change `runNavigationLoop` return from void to `{ reason, lesson, part }`
4. `renderer.cjs` (MODIFIED) — context-dependent navigation footer: `[m] Modules` always, `[h] Hint` on project lessons only
5. `progress.cjs` (MODIFIED) — add `lastPosition` and `completed` fields; bump schema to v3 with auto-migration from v2

**Unchanged:** `terminal.cjs`, `lessons.cjs`, `hints.cjs`, `feedback.cjs`, `parser.cjs`, `clipboard.cjs`, `verifier.cjs`, and all content files.

### Critical Pitfalls

1. **Navigation loop cannot break out to module selection** — The current `runNavigationLoop` is a sealed loop that returns void. The "M" key cannot pause it, show the module picker, and resume. Fix before anything else: change the return type to `{ reason, lesson, part }` and add an outer loop in `gsd-learn.cjs`. This is the load-bearing change for all of v2.2.

2. **Welcome screen shown to returning users on every launch** — Without explicit gating, the welcome screen fires on every invocation, breaking the "resume where you left off" experience. Use `progress.modules` to detect returning users: if any module has `started: true`, skip the welcome. Add a `welcomeSeen` field for an unambiguous signal.

3. **Resume logic ignores module completion state** — If all modules are completed, naive resume creates a loop of launch → completion banner → exit. Check `completed` flag before auto-resuming; route all-completed users to the module picker with a congratulatory message.

4. **Part-level position lost on module switch** — The "M" key exits the nav loop, but the current `progressFn` only saves lesson index on lesson transitions. Part position is lost. Fix: have `runNavigationLoop` return final `{ lesson, part }` and have the outer loop save it before showing the module picker. (Shares the same fix as pitfall 1.)

5. **Welcome screen and module picker built as duplicated flows** — Welcome screen (first-time users) and module picker (returning users and "M" key) share the core interaction: show modules with progress, let user pick one. If built separately, they diverge. Fix: one shared `renderModuleList(modules, progress)` function. Both screens wrap it with different headers.

## Implications for Roadmap

Based on the combined research, a three-phase structure is strongly indicated by hard dependencies.

### Phase 1: Navigation Architecture & Progress Foundation

**Rationale:** This is the load-bearing change. `runNavigationLoop`'s return contract, part-level progress persistence, and the outer module-selection loop must exist before any screens or key bindings can be built against them. Building UI before this foundation is wasted work — it would need rearchitecting once the nav loop change lands. This phase produces no user-visible UI; it is entirely about correct plumbing.

**Delivers:** Two-level loop in `gsd-learn.cjs`; `runNavigationLoop` returns `{ reason, lesson, part }`; progress schema v3 with `lastPosition`, `completed`, and per-module `currentPart` fields; auto-migration from v2; part-level progress save on every transition including module switch.

**Addresses:** Resume-to-last-position, module completion tracking, per-module position persistence across switches
**Avoids:** Pitfalls 1 (sealed nav loop), 4 (wrong resume part), 8 (resume ignores completion), 9 (module switch loses part position)

**Files:** `progress.cjs` (v3 schema + migration), `navigator.cjs` (return type change + outer-loop signal), `gsd-learn.cjs` (outer loop structure — no screens yet, just loop skeleton)

### Phase 2: Welcome Screen & Module Picker

**Rationale:** With the navigation architecture in place, screen rendering becomes pure UI composition using existing primitives. The shared `renderModuleList()` component must be built once and used by both the welcome screen and the module picker — designing them independently risks divergence and duplicated logic.

**Delivers:** First-time welcome screen with GSD pitch; module picker showing title, description, lesson count, progress status, recommended flag; slim returning-user resume message with context; `determineEntryRoute()` routing logic.

**Addresses:** Welcome screen for first-time users, module picker with progress indicators, recommended starting module, slimmer return-user message, smart context in resume message
**Avoids:** Pitfalls 2 (welcome every launch), 5 (picker with no progress info), 7 (welcome/picker duplication)

**Files:** `screens.cjs` (new), `gsd-learn.cjs` (wired to outer loop from Phase 1)

### Phase 3: Key Bindings & Navigation Footer

**Rationale:** "M" key depends on Phase 1 (outer loop) and Phase 2 (module picker exists as destination). "H" key depends on Phase 1 (nav loop restructure) for the `hintFn` callback pattern. The navigation footer changes depend on both key bindings being defined. Grouping them completes the interactive experience in one phase.

**Delivers:** `m` and `h` added to `waitForKey()`; context-dependent navigation footer (`[h] Hint` only on project lessons); `hintFn` callback wired through `runNavigationLoop`; inline hint display integrated with `feedback.cjs` hint tracking.

**Addresses:** "M" key to module picker, "H" key for mini-project hints, key binding clutter (context-dependent footer at 80 columns)
**Avoids:** Pitfalls 3 ("H" key conflicts with hint architecture — callback pattern keeps navigator clean), 6 (key binding clutter — context-dependent footer)

**Files:** `navigator.cjs` (m/h handlers, hintFn callback), `renderer.cjs` (context-dependent footer), `gsd-learn.cjs` (hintFn callback definition, module context threading)

### Phase Ordering Rationale

- Phase 1 before everything: it changes the API contract of `runNavigationLoop`. All downstream code must be written against the new contract. Doing it first means Phases 2 and 3 build on a stable foundation.
- Progress schema (v3) is the first task within Phase 1 — smallest, most isolated, fully testable, no cross-dependencies.
- Phase 2 before Phase 3: the "M" key must have a module picker destination to navigate to. A dead key that compiles but does nothing is a test failure waiting to happen.
- "H" key grouped in Phase 3 alongside "M" key because they share the callback pattern threading through the nav loop established in Phase 1.
- The ARCHITECTURE.md build order (progress → navigator → renderer → screens → entry point → hint overlay) is the recommended task sequence within this phase structure.

### Research Flags

Phases needing a planning checkpoint before implementation:

- **Phase 1 (progressFn signature change):** The change from `(lessonIndex)` to `(lessonIndex, partIndex)` touches every call site of `progressFn` in `gsd-learn.cjs`. Verify all call sites are identified before writing any code. May be 2-3 sites, or more if the flag handlers also call it.
- **Phase 3 (hint overlay re-render):** How to append a hint below current rendered content without clearing lesson context is not fully specified. The architecture says "clear screen + hint + re-render current part" but this may cause visible flicker with the progressive accumulation renderer. Review `renderPart()` output before implementing.
- **Phase 3 (footer at 80 columns):** With 7 keys in the footer, a concrete character count is needed before finalizing the format. The research flags this risk; PITFALLS.md suggests abbreviated labels below 80 columns (`[m] Mod  [h] Hint`). Verify exact widths before writing the renderer change.

Phases with standard patterns (no additional research needed):

- **Phase 2 (screen rendering):** Pure ANSI rendering with existing `terminal.cjs` primitives. `renderCompletionBanner()` in `renderer.cjs` is the proven template to follow. No new techniques.
- **Phase 3 (key binding addition):** Adding two `else if` branches to `waitForKey()` is mechanical. The existing pattern is clear.
- **Phase 1 (progress schema migration):** The v1-to-v2 migration in `progress.cjs` already exists as a reference. The v2-to-v3 migration follows the same pattern.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified by direct codebase analysis; all needed primitives confirmed to exist with expected APIs; zero-dependency constraint confirmed achievable with no tradeoffs |
| Features | HIGH | Patterns verified against existing codebase and competitor analysis (Rustlings, Exercism); P1/P2/P3 prioritization grounded in dependency graph and user value |
| Architecture | HIGH | Based on direct codebase analysis of every file involved; `listModules()`, progress schema, and hint infrastructure all confirmed to exist; five anti-patterns explicitly identified with concrete reasoning |
| Pitfalls | HIGH | Every pitfall grounded in specific observable codebase behavior: sealed loop (void return), hardcoded `startPart=0` at line 84 of navigator.cjs, missing `currentPart` field in progress schema, missing `completed` flag — not speculative |

**Overall confidence:** HIGH

### Gaps to Address

- **`progressFn` call site count:** The change from `(lessonIndex)` to `(lessonIndex, partIndex)` must update all callers. Research identifies the pattern but not the exact count of call sites in `gsd-learn.cjs`. Enumerate before Phase 1 implementation.
- **Hint overlay re-render strategy:** Appending hint below progressive-accumulation content without screen flicker is not fully designed. Quick review of `renderPart()` output is warranted before Phase 3 implementation.
- **Footer character count at 80 columns:** Full vs abbreviated key labels for the 7-key footer needs a concrete measurement. Decide on the format before writing the `renderer.cjs` change in Phase 3.

## Sources

### Primary (HIGH confidence — direct codebase analysis)

- `learn/lib/navigator.cjs` — sealed navigation loop with void return; `waitForKey()` current key map (5 keys); `startPart` hardcoded to 0 at line 84
- `learn/lib/renderer.cjs` — `renderPart()` accumulation pattern; footer format; `renderCompletionBanner()` as reference template
- `learn/lib/progress.cjs` — v2 schema confirmed; per-module `currentLesson` and `started` fields; no `currentPart` or `completed` fields; v1-to-v2 migration as pattern reference
- `learn/lib/lessons.cjs` — `listModules()` confirmed to exist; returns `{id, title, description, order}` sorted by order; no progress data
- `learn/lib/hints.cjs` — `getNextHint()` stateless API confirmed; ready for navigator integration
- `learn/lib/feedback.cjs` — `recordEvent()`/`loadFeedback()` confirmed for hint tracking
- `learn/lib/terminal.cjs` — `style()`, `clearScreen()`, `horizontalRule()`, `COLORS` confirmed available
- `learn/bin/gsd-learn.cjs` — current control flow; flag parsing; `progressFn` callback pattern; hardcoded single-module entry
- `learn/content/modules/*/module.json` — module metadata structure confirmed
- `.planning/PROJECT.md` — v2.2 milestone requirements; zero-dependency constraint

### Secondary (MEDIUM confidence — competitor analysis)

- [Rustlings usage documentation](https://rustlings.rust-lang.org/usage/) — watch mode commands, hint key, list navigation patterns
- [Rustlings GitHub](https://github.com/rust-lang/rustlings) — exercise list UI, progress indicators (checkmarks, "Pending" labels)
- [Command Line Interface Guidelines](https://clig.dev/) — general CLI UX best practices
- [Gemini CLI session management](https://developers.googleblog.com/pick-up-exactly-where-you-left-off-with-session-management-in-gemini-cli/) — resume pattern reference

---
*Research completed: 2026-03-12*
*Ready for roadmap: yes*
