# Phase 29: Mini-Project - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the Module 6 mini-project: spec.json (with structural verification checks), hints.json (5 progressive hints), and the lesson 08-mini-project.json content. The mini-project should exercise GSD-2 concepts taught in Lessons 1-7.

</domain>

<decisions>
## Implementation Decisions

### Mini-Project Design
- Template-first pedagogy: provide working example, learner customizes
- The learner extends their skeptic workflow/command with GSD-2-inspired capabilities
- Structural verification via regex pattern checks in spec.json (same format as Modules 1-5)
- 5 progressive hints from conceptual to concrete
- Mini-project lesson (08-mini-project.json) introduces the task and provides the template

### Mini-Project Concept
- Learner adds a "dispatch loop" to their skeptic command — inspired by GSD-2's auto mode pattern
- The skeptic should be able to: read project state, decide what to review next, dispatch subagents with focused context, and track what's been reviewed
- This exercises: state machine pattern (Lesson 2), context engineering (Lesson 3), auto loop (Lesson 4), and worktree-style isolation (Lesson 5)

### Claude's Discretion
- Specific artifact checks and regex patterns in spec.json
- Exact hint wording and progression
- Mini-project lesson narrative framing

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Skeleton files from Phase 26: lessons/08-mini-project.json, project/spec.json, project/hints.json
- Prior mini-project specs from Modules 1-5 provide the exact format
- Module 5's quality-feedback mini-project is the most recent reference

### Established Patterns
- spec.json: id, moduleId, title, description, artifacts[] with path and checks[] (pattern + description)
- hints.json: array of 5 strings, progressively more specific
- 08-mini-project.json: lesson format with project-type blocks introducing the task
- Artifact path targets the skeptic workflow: ~/.claude/get-shit-done/workflows/skeptic.md

### Integration Points
- Verifier reads spec.json and runs checks against learner's files
- Hints displayed via H key binding on mini-project step
- Mini-project lesson renders as final lesson in module sequence

</code_context>

<specifics>
## Specific Ideas

- The "dispatch loop" concept ties directly to Lesson 4's auto mode teaching
- Pattern checks should verify the learner added: state tracking, dispatch logic, context injection, review coverage tracking
- Hints should build from "think about what auto mode does" to specific implementation guidance

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
