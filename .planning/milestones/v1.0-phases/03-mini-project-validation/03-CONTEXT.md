# Phase 3: Mini-Project Validation - Context

**Gathered:** 2026-03-12
**Status:** Ready for replanning (updated)

<domain>
## Phase Boundary

Learner completes a capstone mini-project that proves real capability, with progressive hints when stuck and feedback data that measures lesson quality.

</domain>

<decisions>
## Implementation Decisions

### Mini-project scope (full stack)
- The mini-project asks the learner to build a complete `/gsd:echo` command across ALL 4 layers:
  1. `~/.claude/commands/gsd/echo.md` — slash command definition
  2. `~/.claude/get-shit-done/workflows/echo.md` — workflow implementation
  3. `~/.claude/get-shit-done/bin/lib/echo.cjs` — Node.js handler module
  4. `~/.claude/get-shit-done/bin/gsd-tools.cjs` — switch case entry
- This proves the learner can wire the complete stack top-to-bottom

### Project outcome expectations
- The learner's echo command MUST actually work as a live GSD command after completion
- All files are created in the LIVE GSD installation, not the project repo copy
- The spec.json artifact paths must target the live install paths (~ expansion)
- The final test is the learner running `/gsd:echo` in Claude Code and seeing real output
- The lesson should clearly state the expected outcome: "When you're done, /gsd:echo will be a real command you can use"

### Verification approach
- Verifier performs structural checks on ALL 4 files (not just the Node.js layer)
- Structural checks: file existence + regex patterns for each file
- The final validation is MANUAL: lesson tells the learner to test by running `/gsd:echo` in Claude Code
- No automated functional test — the structural checks plus manual run IS the validation

### Hint progression
- Hints stay focused on the Node.js layer (the harder part)
- Assume the markdown files are straightforward enough from Module 1 knowledge
- Current escalation strategy (conceptual → specific file → specific pattern → step-by-step) remains

### Lesson 06 format
- Include an ASCII diagram showing the full command chain: command.md → workflow.md → gsd-tools.cjs → echo.cjs
- Follow with prose explaining each file's role
- Explicitly state all 4 live install paths — learner should not have to guess
- Deliverables list all 4 files

### Claude's Discretion
- Exact wording of lesson instructions and hints
- Whether to include a "cleanup" mechanism to remove the echo command after the exercise
- Error messaging when verification fails
- Exact structural patterns for the markdown file checks

</decisions>

<specifics>
## Specific Ideas

- User expects `/gsd:echo Does this work?` to actually run after completing the project — this IS the core promise
- This module will become Module 2 after a new milestone creates Module 1 (slash commands + workflows)
- After that new milestone, this module will be updated to account for learner already knowing the markdown layer
- The two markdown files needed are minimal: creating `~/.claude/commands/gsd/echo.md` and `~/.claude/get-shit-done/workflows/echo.md`

</specifics>

<code_context>
## Existing Code Insights

### Key Files (current state)
- `learn/content/modules/command-lifecycle/project/spec.json` — currently checks only 2 artifacts (Node.js layer), needs to check all 4
- `learn/content/modules/command-lifecycle/lessons/06-mini-project.json` — needs full-stack instructions + ASCII diagram
- `learn/content/modules/command-lifecycle/project/hints.json` — 5 hints, Node.js focused (stays as-is)
- `learn/lib/verifier.cjs` — uses `path.join(cwd, artifact.path)`, needs HOME expansion for live install paths

### Established Patterns
- verifier.cjs uses `path.join(cwd, artifact.path)` — needs to handle ~ or $HOME for live install paths
- spec.json uses relative paths currently — must switch to HOME-relative paths for all 4 artifacts

### Integration Points
- `~/.claude/commands/gsd/echo.md` — Claude Code reads this to register the slash command
- `~/.claude/get-shit-done/workflows/echo.md` — orchestrator reads this when command is invoked
- `~/.claude/get-shit-done/bin/gsd-tools.cjs` — the live command dispatcher (switch statement)
- `~/.claude/get-shit-done/bin/lib/` — where Node.js command modules live

</code_context>

<deferred>
## Deferred Ideas

- Update this module after new milestone completes Module 1 (slash commands + workflows) — the mini-project can then assume learner already knows the markdown layer
- Module renumbering: current Command Lifecycle module becomes Module 2

</deferred>

---

*Phase: 03-mini-project-validation*
*Context gathered: 2026-03-12 (updated)*
