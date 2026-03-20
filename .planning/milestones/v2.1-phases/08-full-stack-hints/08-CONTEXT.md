# Phase 8: Full-Stack Hints - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Update hints.json for Module 2's mini-project with progressive guidance connecting the learner's existing Module 1 markdown-layer work to the new Node.js-layer backend (handler + switch case). No changes to lesson content, spec.json, or Module 1 hints.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
- How explicitly hints reference Module 1 artifacts (path-level vs conceptual)
- Hint progression across the two Node.js artifacts (handler vs switch case weighting)
- Cross-module pedagogical tone (continuation vs fresh challenge)
- Whether to keep 5 hints or adjust count
- All hint wording and specificity levels

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Follow the established progressive disclosure pattern from both existing hints.json files.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `learn/content/modules/command-lifecycle/project/hints.json`: Current 5-hint array targeting old echo command — needs full rewrite
- `learn/content/modules/gsd-commands/project/hints.json`: Module 1 hints for skeptic markdown layer — reference for cross-module continuity

### Established Patterns
- Hints are a flat JSON array of strings, 5 elements, progressively more specific
- Pattern: overview → re-read lessons → look at directory → naming conventions → near-complete code guidance
- Final hint is the most specific but still stops short of giving full code
- Module 1 hints reference lesson numbers ("Lessons 2 and 3 showed you...")

### Integration Points
- `learn/bin/gsd-learn.cjs --hint` reads hints.json and shows next unseen hint
- Hint index tracked in learner progress state
- spec.json artifacts define what the hints should guide toward (4 artifacts: command.md, workflow.md, skeptic.cjs, switch case)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-full-stack-hints*
*Context gathered: 2026-03-13*
