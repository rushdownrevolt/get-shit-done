# Phase 3: Mini-Project Validation - Context

**Gathered:** 2026-03-12
**Status:** Ready for replanning

<domain>
## Phase Boundary

Learner completes a capstone mini-project that proves real capability, with progressive hints when stuck and feedback data that measures lesson quality.

</domain>

<decisions>
## Implementation Decisions

### Project outcome expectations
- The learner's echo command MUST actually work as a live GSD command after completion
- Learner creates files in the LIVE GSD installation (~/.claude/get-shit-done/bin/lib/), not the project repo copy
- The spec.json artifact paths must target ~/.claude/get-shit-done/ not get-shit-done/ (project-local)
- After passing --verify, running `/gsd:echo` (or `node ~/.claude/get-shit-done/bin/gsd-tools.cjs echo "message"`) should produce real output

### Verification depth
- Structural checks (regex patterns) remain as the verification mechanism
- Since the learner modifies the real gsd-tools.cjs and creates echo.cjs in the live install, the command works by definition if structural checks pass
- No need for the verifier to do additional wiring — the learner does the full wiring themselves

### Lesson clarity
- Lesson 06 (mini-project) must explicitly state the live GSD install paths where files go
- Learner should not have to guess paths — lesson tells them exactly where to create echo.cjs and where gsd-tools.cjs lives
- Hints focus on code patterns (function signatures, export patterns, switch case syntax), not path discovery
- The lesson should clearly state the expected outcome: "When you're done, /gsd:echo will be a real command you can use"

### Claude's Discretion
- Exact wording of lesson instructions and hints
- Whether to include a "cleanup" mechanism to remove the echo command after the exercise
- Error messaging when verification fails

</decisions>

<specifics>
## Specific Ideas

- User expected `/gsd:echo Does this work?` to actually run after completing the project — this IS the core promise
- The current spec.json points to `get-shit-done/bin/lib/echo.cjs` (project-local) but should point to `~/.claude/get-shit-done/bin/lib/echo.cjs` (live install)
- The current spec.json points to `get-shit-done/bin/gsd-tools.cjs` for the switch case check but should point to `~/.claude/get-shit-done/bin/gsd-tools.cjs`

</specifics>

<code_context>
## Existing Code Insights

### Key Files to Update
- `learn/content/modules/command-lifecycle/project/spec.json` — artifact paths need to change to live install
- `learn/content/modules/command-lifecycle/lessons/06-mini-project.json` — lesson text needs explicit paths
- `learn/content/modules/command-lifecycle/project/hints.json` — hints reference paths that need updating
- `learn/lib/verifier.cjs` — resolves paths from spec.json against cwd; may need to resolve ~ or $HOME

### Established Patterns
- verifier.cjs uses `path.join(cwd, artifact.path)` — needs to handle absolute paths or HOME expansion
- spec.json uses relative paths currently — switching to absolute or HOME-relative paths is a design choice

### Integration Points
- gsd-tools.cjs at ~/.claude/get-shit-done/bin/gsd-tools.cjs is the live command dispatcher
- ~/.claude/get-shit-done/bin/lib/ is where command modules live

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-mini-project-validation*
*Context gathered: 2026-03-12*
