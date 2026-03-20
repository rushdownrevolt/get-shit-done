# Phase 27: Lesson Content (Lessons 1-3) - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Create lesson content for Module 6 Lessons 1-3: Overview (v1→v2 evolution), Dispatch Pipeline (state machine), and Context Engineering (fresh sessions, prompt pre-loading). Each lesson uses real GSD-2 source code snippets.

</domain>

<decisions>
## Implementation Decisions

### Content Structure
- 8 blocks per lesson (5 text, 3 code) — established pacing pattern from Modules 3-5
- Text blocks: focus statement + bridge to next block
- Code blocks: real snippets from GSD-2 source files, not hand-crafted examples
- Each lesson follows concept map entry (overview, dispatch-pipeline, context-engineering)

### Source Material for Lessons
- GSD-2 is installed at: C:/Users/18182/AppData/Roaming/npm/node_modules/gsd-pi/
- Key source paths for Lessons 1-3:
  - Lesson 1 (Overview): README.md (v1 vs v2 comparison table), src/resources/GSD-WORKFLOW.md (hierarchy definition), src/resources/extensions/gsd/prompts/system.md (agent identity)
  - Lesson 2 (Dispatch Pipeline): src/resources/extensions/gsd/auto-dispatch.ts, auto-loop.ts, auto.ts (state machine and dispatch logic)
  - Lesson 3 (Context Engineering): src/resources/extensions/gsd/prompts/ directory (all dispatch prompts), src/resources/extensions/gsd/templates/ (artifact templates), GSD-WORKFLOW.md (file locations)

### Claude's Discretion
- Specific code snippet selection within source files
- Lesson narrative flow and conceptual framing
- Which v1 vs v2 comparisons to highlight in Lesson 1

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Skeleton lesson JSONs already created in Phase 26: `learn/content/modules/gsd2-agent-application/lessons/01-overview.json` through `03-context-engineering.json`
- Module 6 sectionMap already defined with entries: overview, dispatch-pipeline, context-engineering, auto-mode, git-worktrees, skills-extensions, synthesis, mini-project
- Existing lesson content from Modules 3-5 provides reference for block structure and pacing

### Established Patterns
- Lessons use JSON format with `content` array of blocks
- Each block has `type` (text/code/project), `title`, and content fields
- Code blocks include `language`, `code` (the snippet), and `explanation`
- Text blocks include `focus` and `bridge` fields
- Lesson JSON includes `conceptMap` reference matching sectionMap key

### Integration Points
- Lesson files replace skeleton content in `learn/content/modules/gsd2-agent-application/lessons/`
- Module picker and navigation automatically render content from JSON
- Export script (`learn/bin/export-docs.cjs`) generates AI curriculum from lesson JSON

</code_context>

<specifics>
## Specific Ideas

- Lesson 1 should use the v1 vs v2 comparison table from GSD-2's README as a key teaching artifact
- Lesson 2 should walk through an actual dispatch cycle: STATE.md → deriveState → resolveDispatch → fresh session
- Lesson 3 should show a real dispatch prompt with inlined context to demonstrate how GSD-2 pre-loads everything

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
