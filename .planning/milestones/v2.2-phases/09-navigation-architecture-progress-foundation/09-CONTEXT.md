# Phase 9: Navigation Architecture & Progress Foundation - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the navigation loop re-enterable (exit with reason, outer loop in gsd-learn.cjs) and upgrade progress schema to support per-module position tracking, first-run detection, and completion state. This is the architectural foundation for Phase 10 (welcome/picker) and Phase 11 (M/H keys).

</domain>

<decisions>
## Implementation Decisions

### Resume Flow
- Returning users land straight into their last lesson position — no interruption, no "welcome back" message
- First-time users (no progress) go to welcome screen (Phase 10 builds this; Phase 9 just detects the state)
- If user's last position was the final part of the final lesson, resume there anyway — user can press M to go elsewhere
- No "resuming..." flash or delay

### Per-Module Position Saving
- Each module independently remembers its own lesson position in progress.modules map
- When switching modules, the previous module's position is saved and the new module resumes from its saved position
- When switching to an unstarted module, show a brief module intro (title + description + "Press any key to begin") before starting Lesson 1
- The top-level currentModule/currentLesson in progress.json tracks the most recently active module (for resume-on-launch)

### Completion State Tracking
- A module is "completed" when the user views the last part of the last lesson (automatic, no gating on mini-project)
- Completion is stored as a boolean `completed` flag in progress.modules[id]
- Module picker shows:
  - Not started: no indicator
  - In progress: "Lesson 3 of 6"
  - Completed: "Completed ✓ (6 of 6)"

### Claude's Discretion
- Navigator return value shape (e.g., `{ reason: 'quit' | 'modules' | 'completed' }` or simpler)
- Progress schema version number (v3 or whatever makes sense)
- How the outer loop in gsd-learn.cjs is structured
- Migration strategy from v2 to v3

</decisions>

<specifics>
## Specific Ideas

- Brief module intro for unstarted modules: title + description + "Press any key to begin" — simple, no elaborate screen
- The `modules` map in progress.json already exists with `currentLesson` and `started` per module — extend it, don't replace it

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `progress.cjs`: loadProgress/saveProgress with v1→v2 migration pattern — extend for v2→v3
- `progress.json` schema v2: `{ version, currentModule, currentLesson, modules: { [id]: { currentLesson, started } } }`
- `listModules()` in lessons.cjs: returns sorted module metadata (id, title, description, order)
- `waitForKey()` in navigator.cjs: single-keypress handler, trivially extensible for M/H keys
- `runNavigationLoop()` in navigator.cjs: the sealed loop that needs a return contract

### Established Patterns
- v1→v2 migration in progress.cjs: detect version, transform, save immediately — follow same pattern for v3
- Navigator uses labeled `outer:` loop with `continue outer` for lesson transitions
- `gsd-learn.cjs` main() is linear: parse args → load progress → load module → run nav loop → goodbye

### Integration Points
- `runNavigationLoop()` return value: currently void, needs to return exit reason so gsd-learn.cjs can re-enter module picker
- `progressFn` callback in nav loop: currently saves lesson index — may need to also save completion state
- `gsd-learn.cjs` main(): needs to become a loop (welcome/picker → nav loop → back to picker on M)
- `progress.modules[id]`: needs `completed` boolean field added

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-navigation-architecture-progress-foundation*
*Context gathered: 2026-03-13*
