# Phase 26: Module Infrastructure - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Register Module 6 (GSD-2 — The Agent Application) in the module system, create v6→v7 progress migration, and create skeleton lesson JSON files for all 7 lessons + mini-project.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Module registry: `learn/lib/lessons.cjs` — `loadModule()` and `listModules()` discover modules from `learn/content/modules/{moduleId}/module.json`
- Progress migration: `learn/lib/progress.cjs` — chained migrations v1→v2→v3→v4→v5→v6, each a simple version-bump function
- Lesson JSON format: structured with `id`, `title`, `lessonNumber`, `objective`, `content` (array of text/code blocks), `conceptMap`, `successCriteria`

### Established Patterns
- Module directory: `learn/content/modules/{moduleId}/` with `module.json` + `lessons/` subdirectory
- module.json fields: `id`, `title`, `description`, `order`, `sectionMap` (key-value pairs)
- Migration pattern: `migrateV5toV6()` checks `version >= 6`, returns with bumped version — copy for v6→v7
- Default version in progress.cjs needs bumping from 6 to 7
- loadProgress() chain calls each migration in sequence

### Integration Points
- Module picker: auto-discovers modules from content directory
- Progress file: `.planning/learn/progress.json` (version 6 currently)
- Section maps: 6-8 entries mapping internal keys to display titles
- Existing modules: gsd-commands (order 1), command-lifecycle (2), planning-state (3), agent-orchestration (4), quality-feedback (5) → new module needs order 6

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
