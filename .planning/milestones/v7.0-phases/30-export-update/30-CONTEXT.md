# Phase 30: Export Update - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Update the AI curriculum export to include Module 6 (GSD-2 — The Agent Application). Run the export script to generate gsd-2-agent-application.md and update the master README.md with Module 6 content.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. The export script already handles new modules automatically.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Export script: `learn/bin/export-docs.cjs` — generates per-module markdown + master README
- Markdown renderer: `learn/lib/markdown-renderer.cjs` — converts lesson JSON to markdown
- Existing AI curriculum at `docs/ai-curriculum/` — 5 per-module docs + README.md

### Established Patterns
- Run `node learn/bin/export-docs.cjs` to regenerate all docs
- Script auto-discovers modules and generates per-module files
- Master README combines all modules with heading-level bump
- Output is committed alongside script

### Integration Points
- New file: `docs/ai-curriculum/gsd-2-agent-application.md`
- Updated file: `docs/ai-curriculum/README.md` (master doc with Module 6 added)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
