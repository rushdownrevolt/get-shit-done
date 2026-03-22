# Phase 32: Module 7 Infrastructure - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning
**Source:** Auto-mode (discuss-phase --auto)

<domain>
## Phase Boundary

Register Module 7 (Workspaces & Collaboration) in the module system, add v7→v8 progress migration, and create skeleton lessons with placeholder content. This follows the exact same infrastructure pattern used for Modules 3-6 (Phases 12, 18, 22, 26).

</domain>

<decisions>
## Implementation Decisions

### Module Registration
- **D-01:** Module ID is `workspaces-collaboration` (kebab-case, matching existing convention)
- **D-02:** Module title is "Workspaces & Collaboration"
- **D-03:** Module order is 7 (sequential after gsd2-agent-application at order 6)
- **D-04:** Module description: "Learn how GSD enables parallel development with workstream namespacing, multi-project workspaces, and cross-AI peer review — collaboration patterns that scale beyond single-milestone execution."

### Lesson Structure
- **D-05:** 8 lessons total (7 content + 1 mini-project), matching Modules 4-6 pattern
- **D-06:** sectionMap keys: overview, workstream-namespacing, multi-project-workspaces, cross-ai-peer-review, workspace-isolation, workspace-lifecycle, collaboration-patterns, mini-project
- **D-07:** Skeleton lessons use single placeholder text block with focus/bridge for validation (established in Phase 26)

### Progress Migration
- **D-08:** Add migrateV7toV8 function in learn/lib/progress.cjs following the exact chain pattern (v1→v2→...→v7→v8)
- **D-09:** Migration adds `workspaces-collaboration` module to progress with `{ started: false, completed: false, lessonsCompleted: {} }`
- **D-10:** Update loadProgress to call migrateV7toV8 when version < 8

### Claude's Discretion
- Module description exact wording (D-04 is a starting point)
- Skeleton lesson objective/focus/bridge text (as long as they reference the correct topics per sectionMap)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Module System
- `learn/content/modules/gsd2-agent-application/module.json` — Most recent module registration (order 6, sectionMap pattern)
- `learn/content/modules/gsd-commands/module.json` — First module registration (order 1)

### Progress Migration
- `learn/lib/progress.cjs` — Migration chain (migrateV1toV2 through migrateV6toV7, loadProgress)
- `learn/tests/progress.test.cjs` — Migration test patterns

### Skeleton Lessons
- `learn/content/modules/gsd2-agent-application/lessons/01-overview.json` — Latest module's lesson structure

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- module.json structure: `{ id, title, description, order, sectionMap }` — same for all 6 modules
- progress.cjs migration chain: each migration adds new module with `{ started, completed, lessonsCompleted }` and increments version
- Skeleton lesson JSON: `{ id, title, objective, lessonNumber, content: [{ type: "text", text: "..." }], conceptMap, successCriteria: [] }`

### Established Patterns
- All 6 modules follow identical registration pattern
- Migration chain is strictly sequential (v1→v2→...→v7→v8)
- Tests verify migration preserves prior module data
- sectionMap last entry is always "mini-project"

### Integration Points
- learn/bin/gsd-learn.cjs loads modules dynamically from learn/content/modules/
- Module picker auto-detects modules — no code changes needed beyond module.json
- Progress file at ~/.gsd-learn/progress.json — migration runs on load

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follows established infrastructure pattern from Phases 12, 18, 22, 26.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 32-module-7-infrastructure*
*Context gathered: 2026-03-22 via auto-mode*
