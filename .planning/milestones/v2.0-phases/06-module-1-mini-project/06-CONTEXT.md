# Phase 6: Module 1 Mini-Project - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Learner completes a capstone project building `/gsd:skeptic` — a custom command.md + workflow.md pair that critiques a phase/plan/milestone. Verified structurally with full anatomy coverage and cross-file wiring checks. Includes progressive hints and a bonus auto-detect challenge.

</domain>

<decisions>
## Implementation Decisions

### Project task: build /gsd:skeptic
- Learner builds a real `/gsd:skeptic` command that critiques a current phase, plan, or milestone
- Two files in the live GSD install:
  1. `~/.claude/commands/gsd/skeptic.md` — command spec
  2. `~/.claude/get-shit-done/workflows/skeptic.md` — workflow implementation
- Base version requires a phase number argument (e.g., `/gsd:skeptic 5`)
- If no argument provided, the command should ask for one (or tell user to provide one)
- Command is real and usable after completion — learner can actually run `/gsd:skeptic` in Claude Code
- Doesn't need to be super robust initially — something that can be refined over time

### Guidance level
- Claude's Discretion — determine appropriate guidance level based on what Lessons 1-5 already taught
- Lessons 2-3 covered full anatomy of both file types; Lesson 4 covered dispatch chain wiring
- Learner should have enough knowledge to build the structure; content/critique logic is the creative part

### Verification: full anatomy coverage with cross-file wiring
- spec.json checks ALL structural elements taught in Lessons 2-4:
  - command.md: frontmatter (name, description, allowed-tools), all XML sections (objective, execution_context, context, process), @file references
  - workflow.md: purpose section, process section with steps
- Cross-file wiring: verify that command.md's execution_context @file reference actually points to the workflow.md path
- Final validation is MANUAL: lesson tells learner to run `/gsd:skeptic {phase}` in Claude Code and see real critique output
- Files verified at live install paths (tilde expansion via verifier.cjs)

### Bonus challenge: auto-detect current phase
- Presented as inline "Going Further" section after main project completes
- No separate verification — just a suggestion with conceptual guidance
- Hints at reading STATE.md specifically: "STATE.md tracks the current phase — your workflow could read it"
- Learner extends their working skeptic command to auto-detect instead of requiring an argument

### Claude's Discretion
- Hint strategy: 5 progressive hints for markdown-only artifacts (different from Module 2's Node.js hints)
- Lesson format: how Lesson 6 presents the task (ASCII diagram, paths, instructions layout)
- Exact wording of lesson instructions, hints, and bonus section
- Whether to include a cleanup mechanism for removing skeptic after the exercise
- Error messaging when verification fails
- Exact regex patterns for structural checks in spec.json

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `learn/content/modules/command-lifecycle/project/spec.json`: Reference for artifact check structure (path + regex checks array). Module 1's spec.json follows same format but targets .md files at live install paths
- `learn/content/modules/command-lifecycle/project/hints.json`: Reference for 5-hint progressive escalation pattern. Module 1 hints focus on markdown structure, not Node.js
- `learn/lib/verifier.cjs`: Already handles tilde path expansion (Phase 4). Runs regex checks against file contents
- `learn/lib/renderer.cjs`: Renders mini-project lesson with deliverables, verification commands, hint access
- `learn/lib/feedback.cjs`: Tracks time-to-complete, hints used, verification attempts

### Established Patterns
- spec.json: array of artifacts, each with path + checks (pattern + description)
- hints.json: array of 5 strings, escalating from conceptual to step-by-step
- Mini-project lesson JSON: uses same schema as teaching lessons but includes project-specific content
- Verification runs in the project directory context, resolving paths against home directory for live install

### Integration Points
- New directory: `learn/content/modules/gsd-commands/project/` (parallel to command-lifecycle/project/)
- New files: spec.json, hints.json in that directory
- New lesson: `learn/content/modules/gsd-commands/lessons/06-mini-project.json`
- Verifier reads spec.json from the module's project/ directory

</code_context>

<specifics>
## Specific Ideas

- `/gsd:skeptic` is a genuinely useful command — critiques phases/plans/milestones, refinable over time
- The base version with a required phase argument keeps it simple; the bonus auto-detect via STATE.md reading adds depth
- Cross-file wiring verification is key — it proves the learner understands the Lesson 4 dispatch chain concept, not just individual file structure
- Real command in live GSD install means the learner sees immediate, tangible results

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-module-1-mini-project*
*Context gathered: 2026-03-12*
