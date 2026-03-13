# GSD Orchestrators & Skills — Layer 4 Deep Dive

## What This Document Covers

This is the fourth layer in our progressive architectural exploration of Get Shit Done (GSD). Where Layer 3 examined the 12 agent prompt definitions (the "workers"), this layer examines the orchestration logic that *wires those agents together* — the `/gsd:*` commands and their backing workflow files that form the control plane of the entire system.

**Previous layers:**
- Layer 1: Codebase analysis documents (`.planning/codebase/` structure)
- Layer 2: State machine internals (`state.cjs`, `core.cjs`, `phase.cjs`, `frontmatter.cjs`)
- Layer 3: Agent prompt definitions (all 12 `.md` agent files)

**This layer covers:**
- The two-tier command architecture (commands → workflows)
- All 19 core workflow files and their orchestration patterns
- Agent spawning mechanics and context budget management
- The full project lifecycle pipeline
- Cross-cutting concerns: auto-advance, error recovery, state management

---

## 1. The Two-Tier Command Architecture

GSD's user-facing interface is a set of `/gsd:*` slash commands. These live in two tiers:

### Tier 1: Commands (`/commands/gsd/*.md`)

Thin markdown wrappers — typically 20-40 lines. Their job is minimal:

1. Parse arguments from the user's invocation
2. Load execution context (workflow path, phase arguments)
3. Delegate to the corresponding workflow file via `Skill()` (not `Task()`)

The `Skill()` call is deliberate. GSD discovered that `Task()` creates nested agent contexts, which triggers a known Claude Code bug (#686) where deeply nested agents freeze. `Skill()` keeps execution flat — the workflow runs in the *same* context as the command, preserving the orchestrator's ability to manage the conversation.

**Example command structure** (from `execute-phase.md`):
```
execution_context:
  workflow: get-shit-done/workflows/execute-phase.md
  args: [phase_number]
```

The command reads its workflow path, passes it to `Skill()`, and the workflow takes over.

### Tier 2: Workflows (`/get-shit-done/workflows/*.md`)

The real orchestration logic — 75 to 1100+ lines each. These are structured markdown documents with XML-like tags (`<purpose>`, `<process>`, `<step>`, `<success_criteria>`) that guide Claude through multi-step orchestration procedures.

Every workflow follows a common skeleton:

```
<purpose> — What this workflow accomplishes
<required_reading> — Reference files to load first
<process>
  <step name="init"> — Load context via gsd-tools.cjs init
  <step name="..."> — Core logic steps
  <step name="..."> — Agent spawning / user interaction
</process>
<success_criteria> — Checklist for completion
```

The `gsd-tools.cjs init <command>` pattern deserves attention. Rather than reading files directly, every workflow calls this Node.js tool to get a JSON payload of pre-computed context: file paths, flags, state snapshots, phase metadata. This is a context budget optimization — the orchestrator gets exactly the data it needs without reading entire files.

---

## 2. The Project Lifecycle Pipeline

GSD's workflows form a directed pipeline that takes a project from "idea" to "shipped milestone." Understanding this pipeline is key to understanding how all 19 workflows interconnect.

### 2.1 Project Initialization

**`new-project.md`** (~1112 lines) — The largest workflow, handling the full zero-to-roadmap sequence:

```
User idea → Questioning → Research → Requirements → Roadmap
```

**Questioning phase:** Uses a structured protocol (referenced from `questioning.md`) to extract project scope, constraints, and priorities. The key insight is that GSD captures *what the user cares about* before doing any technical analysis.

**Research phase:** Spawns 4 parallel `gsd-phase-researcher` agents, each investigating a different facet (architecture, patterns, risks, prior art). A 5th `gsd-research-synthesizer` agent merges their findings. The parallelism is deliberate — each researcher gets a fresh 200k context window, avoiding the context budget problem that would occur if a single agent tried to research everything.

**Requirements phase:** Scoped per category via `AskUserQuestion` with `multiSelect: true`. Requirements get IDs in the format `[CATEGORY]-[NUMBER]` (e.g., `AUTH-01`, `NOTIF-02`). These IDs persist through the entire milestone lifecycle and appear in verification reports, traceability tables, and audit documents.

**Roadmap generation:** Spawns `gsd-roadmapper` with all accumulated context. The roadmapper produces a phased plan with dependency ordering, success criteria per phase, and a dependency graph.

### 2.2 Phase Planning

Before any phase executes, it needs a plan. GSD offers two entry points:

**`discuss-phase.md`** (677 lines) — Interactive context gathering. This workflow embodies a specific philosophy: *User = visionary, Claude = builder.* The discussion:

1. Scouts the existing codebase for relevant code
2. Surfaces "gray areas" — decisions that aren't clearly covered by existing project decisions
3. Carries forward prior decisions from PROJECT.md (won't re-ask what's already decided)
4. Has explicit scope-creep guardrails (won't let discussion expand beyond the phase's stated goal)
5. Produces a `CONTEXT.md` file that feeds into planning

The output CONTEXT.md captures: decisions made, gray areas resolved, codebase context discovered, and scope boundaries confirmed.

**`plan-phase.md`** (~561 lines) — The planning pipeline proper:

```
[CONTEXT.md if exists] → Research → Plan → Verify → [Revise if needed, max 3]
```

1. **Research** (optional): If the phase involves unknowns, spawns `gsd-phase-researcher` to investigate
2. **Planning**: Spawns `gsd-planner` with phase goal, requirements, and context. The planner produces a PLAN.md with tasks grouped into dependency waves
3. **Verification**: Spawns `gsd-plan-checker` to review the plan against requirements and detect gaps
4. **Revision loop**: If the checker finds issues, the planner revises. Maximum 3 iterations before presenting to user as-is

The plan-checker is a quality gate — it ensures plans have proper `must_haves` frontmatter (truths, artifacts, key_links), task dependencies are ordered correctly, and nothing contradicts existing project decisions.

### 2.3 Phase Execution

**`execute-phase.md`** (~460 lines) — The wave-based parallel execution orchestrator.

Plans group their tasks into dependency waves. Within each wave, tasks run in parallel (separate `gsd-executor` agents). Across waves, execution is sequential — wave 2 waits for wave 1 to complete.

Three execution patterns exist, determined by plan complexity and profile settings:

| Pattern | Context | Checkpoints | Use Case |
|---------|---------|-------------|----------|
| A — Autonomous | Subagent | None | Simple, low-risk plans |
| B — Segmented | Subagent | Verify-only | Standard plans with testable outputs |
| C — Main context | Orchestrator | Decision checkpoints | Complex plans requiring human judgment |

Checkpoint types follow a distribution: ~90% human-verify (confirm output looks right), ~9% decision (choose between approaches), ~1% human-action (user must do something Claude can't).

**`execute-plan.md`** (450 lines) — Single plan execution within a phase. Handles:
- TDD support (test-first when configured)
- Deviation rules (4 tiers of autonomy)
- Agent tracking via `agent-history.json` and `current-agent-id.txt`

The deviation rules are a critical safety mechanism:

| Rule | Trigger | Action |
|------|---------|--------|
| Rule 1: Bug | Hit a bug blocking the task | Auto-fix, continue |
| Rule 2: Missing Critical | Dependency not mentioned in plan | Auto-add, continue |
| Rule 3: Blocking | Can't proceed without change | Auto-adjust, log deviation |
| Rule 4: Architectural | Fundamental approach change needed | Stop, ask user |

Rules 1-3 are autonomous — the executor handles them without interrupting the user. Rule 4 is the only one that pauses execution.

### 2.4 Verification & Validation

GSD separates *verification* (did we build it right?) from *validation* (did we build the right thing?).

**`verify-phase.md`** (244 lines) — Goal-backward verification. The core principle: *task completion ≠ goal achievement.* A task "create chat component" can be marked complete when the component is a placeholder. Goal-backward verification asks:

1. **What must be TRUE** for the goal to be achieved? (observable behaviors)
2. **What must EXIST** for those truths to hold? (artifacts — files, functions, routes)
3. **What must be WIRED** for those artifacts to function? (imports, API calls, state bindings)

Three sources for must-haves, in priority order:
1. PLAN frontmatter `must_haves` field
2. ROADMAP.md Success Criteria for the phase
3. Derived from the phase goal (fallback)

Artifact verification operates at three levels:

| Level | Check | Status |
|-------|-------|--------|
| 1. Exists | File is present at expected path | MISSING if not |
| 2. Substantive | File has real implementation (not stub/placeholder) | STUB if placeholder |
| 3. Wired | File is imported AND used by other code | ORPHANED if unused |

Anti-pattern scanning catches: TODO/FIXME/HACK comments, placeholder content ("coming soon"), empty returns, log-only functions.

When gaps are found, the workflow clusters related gaps and generates fix plans automatically.

**`validate-phase.md`** (168 lines) — Nyquist validation (named after the Nyquist sampling theorem analogy: every signal needs sufficient sampling to be faithfully reproduced; every requirement needs a test).

Three input states:
- State A: VALIDATION.md exists → audit existing validation
- State B: No VALIDATION.md but SUMMARYs exist → reconstruct from artifacts
- State C: No SUMMARYs → exit (phase not executed yet)

Spawns `gsd-nyquist-auditor` to write missing tests. The auditor gets max 3 debug iterations per test before escalating. Tests that can't be automated get classified as "manual-only."

Can be disabled via `/gsd:settings` — not every project needs automated test coverage.

**`verify-work.md`** (584 lines) — User Acceptance Testing pipeline. This is the *human-in-the-loop* verification:

```
Create test cases → Present one at a time → Infer severity → Diagnose → Plan fixes → Verify plans
```

Key design decisions:
- **Test cases derived from SUMMARY.md** — tests what was *actually built*, not what was planned
- **Cold-start smoke test injection** — auto-prepended when server/startup files were modified
- **One test at a time** — prevents cognitive overload, lets user focus
- **Severity inferred, never asked** — the workflow reads natural language descriptions and classifies as blocker/major/minor/cosmetic. GSD never interrupts the user with "how severe is this?"
- **Batched file writes** — writes to disk on issue detection, every 5 passes, or at completion (not after every single test)

When issues are found, the pipeline chains automatically:
1. `diagnose-issues.md` → parallel `gsd-debugger` agents (one per gap)
2. `gsd-planner` in `gap_closure` mode → fix plans
3. `gsd-plan-checker` → verify fix plans (max 3 revision iterations)
4. Routes to `/gsd:execute-phase --gaps-only`

### 2.5 Phase Transition

**`transition.md`** (545 lines) — The connective tissue between phases. After execution and verification:

1. **PROJECT.md evolution** — requirements get reclassified:
   - Validated: proven by implementation
   - Invalidated: disproven or no longer relevant
   - Emerged: new requirements discovered during work
2. **STATE.md update** — current position, recent decisions, session continuity
3. **Auto-advance chain management** — if `--auto` flag is active *and* `_auto_chain_active` config is set *and* user has `auto_advance` preference enabled, the next phase starts automatically

The auto-advance chain is GSD's fully autonomous mode. When all three conditions align, the system pipelines from execution → verification → transition → next phase planning → next phase execution without human intervention.

### 2.6 Milestone Completion

**`audit-milestone.md`** (333 lines) — Milestone-level verification before closing out:

- **3-source cross-reference**: checks requirements against VERIFICATION.md (per-phase), SUMMARY frontmatter (per-plan), and REQUIREMENTS.md traceability table
- **Spawns `gsd-integration-checker`** for cross-phase integration verification
- **Nyquist compliance** aggregate across all phases

**`complete-milestone.md`** (765 lines) — Full lifecycle closure:

1. **Readiness check**: `roadmap analyze` confirms all phases complete
2. **Requirements audit**: counts checked-off vs. total, surfaces incomplete with 3 options (proceed/audit/abort)
3. **Stats gathering**: git log analysis, LOC changes, timeline
4. **PROJECT.md evolution review**: 6-point checklist (description accuracy, core value, requirements audit, context update, decisions audit, constraints check)
5. **ROADMAP.md reorganization**: completed milestone sections collapsed into `<details>` blocks
6. **Archival**: `gsd-tools milestone complete` creates `milestones/v[X.Y]-*` directories, archives ROADMAP.md and REQUIREMENTS.md
7. **Retrospective writing**: living `RETROSPECTIVE.md` with cross-milestone trends
8. **Branch handling**: squash merge, merge with history, delete, or keep
9. **Git tagging**: annotated tags with optional push

**`new-milestone.md`** (385 lines) — The brownfield equivalent of `new-project.md`. Key differences:
- Loads existing PROJECT.md, MILESTONES.md, STATE.md context
- Research decision persisted to config (won't re-ask "should I research?" every milestone)
- Researchers get milestone-aware prompts focusing ONLY on new features
- Phase numbering continues from the previous milestone's last phase
- REQ-ID numbering continues from existing IDs

---

## 3. Supporting Workflows

### 3.1 Session Management

**`resume-project.md`** (308 lines) — Session restoration. Triggers on "continue," "what's next," "where were we," "resume."

Detection hierarchy for incomplete work:
1. **Interrupted agents** — `has_interrupted_agent` from init, recoverable via `Task(resume=agent_id)`
2. **`.continue-here` files** — mid-plan checkpoints written by executors
3. **PLANs without SUMMARYs** — execution started but not completed

Smart routing: interrupted agent → checkpoint → incomplete plan → transition ready → plan ready → execute ready.

Can reconstruct STATE.md from artifacts if missing — handles cases where STATE.md predates the project, was accidentally deleted, or wasn't included in a clone.

**Quick resume mode**: "continue" or "go" → skip the options menu, execute primary action immediately.

**`progress.md`** (383 lines) — Rich status reporting with smart routing. Uses `roadmap analyze` and `state-snapshot` for minimal context consumption.

Six routing paths:

| Route | Condition | Action |
|-------|-----------|--------|
| A | Unexecuted plans exist | `/gsd:execute-phase` |
| B | Phase needs planning | Check CONTEXT.md → discuss or plan |
| C | Phase complete, more remain | Next phase |
| D | Milestone complete | `/gsd:complete-milestone` |
| E | UAT gaps found | `/gsd:plan-phase --gaps` |
| F | Between milestones | `/gsd:new-milestone` |

### 3.2 Research & Diagnosis

**`research-phase.md`** (75 lines) — Standalone research spawner. Thin wrapper around `gsd-phase-researcher`. Three return types: RESEARCH COMPLETE, CHECKPOINT REACHED, RESEARCH INCONCLUSIVE. Note that `plan-phase` integrates research automatically; this command exists for standalone "I want to investigate before deciding" use cases.

**`diagnose-issues.md`** (220 lines) — Parallel debug orchestration. Spawns one `gsd-debugger` agent per UAT gap. Agents produce root cause analysis only — no fixes. The separation of diagnosis from remediation is intentional: diagnosis is exploratory, fix planning is structured.

**`map-codebase.md`** (317 lines) — Codebase mapping with 4 parallel `gsd-codebase-mapper` agents producing 7 analysis documents. Includes a security scan before committing (won't commit files containing secrets/credentials).

### 3.3 Ad-Hoc Execution

**`quick.md`** (602 lines) — For tasks that don't warrant a full phase cycle. Composable flags:

- `--discuss` — lightweight gray area surfacing, produces CONTEXT.md (omits `code_context` and `deferred` sections that the full discuss-phase captures)
- `--full` — adds plan-checking (max 2 iterations) and post-execution verification
- Both flags can combine: `--discuss --full`

Requires an active ROADMAP.md — quick tasks live within the project context, not standalone. Tracked in `.planning/quick/NNN-slug/` with sequential numbering. STATE.md gets a "Quick Tasks Completed" table entry.

The workflow includes a workaround for the `classifyHandoffIfNeeded` bug: instead of trusting agent-reported status, it checks for summary file existence + git log to confirm work actually completed.

### 3.4 Gap Closure

**`plan-milestone-gaps.md`** (275 lines) — Creates new phases from audit-discovered gaps.

Priority classification:
- **Must** — blocks milestone completion, phase auto-created
- **Should** — recommended, phase auto-created
- **Nice** — user decides via AskUserQuestion

Groups related gaps into logical phases (same affected component, same subsystem, dependency order). Phase numbering continues from highest existing phase.

Updates both ROADMAP.md (new phases) and REQUIREMENTS.md (traceability table). Resets unchecked requirements: `[x]` → `[ ]` for requirements the audit found unsatisfied — they need to pass again after fixes.

---

## 4. Cross-Cutting Architectural Patterns

### 4.1 Context Budget Management

The single most important architectural constraint in GSD is the 200k token context window. Every design decision traces back to this:

- **Orchestrator stays at ~10-15% context** — reads metadata, not full files
- **`gsd-tools.cjs init`** returns pre-computed JSON — paths, flags, counts, not file contents
- **`<files_to_read>` context passing** — orchestrators pass file *paths* to agents, not file contents. Each agent reads what it needs in its own fresh context window
- **`summary-extract --fields one_liner`** — pulls a single field from structured frontmatter instead of reading entire SUMMARY.md files
- **`roadmap analyze`** — returns structured JSON of all phases/plans/status without reading ROADMAP.md raw
- **Parallel agent spawning** — 4 researchers each get 200k, vs. 1 researcher splitting 200k four ways

### 4.2 Agent Spawning Pattern

Every agent spawn follows this template:

```
Task(
  prompt = "Read [agent-file].md for instructions.\n\n" +
    "<files_to_read>{paths}</files_to_read>" +
    "<context>{structured data}</context>" +
    "<constraints>{guardrails}</constraints>",
  subagent_type = "gsd-[agent-name]",
  model = "{resolved_model}",
  description = "[short description]"
)
```

Key elements:
- Agent reads its own instructions first (self-prompting)
- File paths passed, not contents
- Constraints section sets behavioral guardrails
- Model resolved via `gsd-tools resolve-model` (configurable per agent role)

### 4.3 The Init Pattern

Every workflow starts with:

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init <command> [args])
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

The `@file:` fallback handles large JSON outputs that exceed shell variable limits — gsd-tools writes to a temp file and returns a pointer.

Different init commands return different context shapes:
- `init resume` — state existence flags, interrupted agent info, commit docs
- `init progress` — phase counts, current/next phase, milestone version, file paths
- `init phase-op <N>` — phase directory, number, name, slug, plan count

### 4.4 State Continuity

GSD maintains state across sessions through several mechanisms:

1. **STATE.md** — current position, recent decisions, blockers, session continuity
2. **`agent-history.json`** — tracks spawned agents for recovery
3. **`current-agent-id.txt`** — identifies the active agent
4. **`.continue-here` files** — mid-plan checkpoints with resumption context
5. **SUMMARY frontmatter** — structured data on each completed plan (extractable via `summary-extract`)

The `resume-project.md` workflow can reconstruct STATE.md entirely from artifacts if the file is lost — a resilience pattern that handles accidental deletion, partial clones, and projects that predate STATE.md introduction.

### 4.5 Auto-Advance Chain

The fully autonomous pipeline requires three conditions:

1. `--auto` flag on the current command
2. `_auto_chain_active` config flag set to true
3. User's `auto_advance` preference enabled

When all align, execution flows: plan → execute → verify → transition → next phase → repeat. The chain breaks on: Rule 4 deviations, verification failures requiring human judgment, or milestone boundaries.

### 4.6 Error Recovery Patterns

GSD has several tiers of error recovery:

**Agent level:** Deviation rules 1-3 handle bugs, missing dependencies, and blocking issues autonomously.

**Plan level:** `execute-plan.md` tracks agent IDs. If a session ends mid-execution, `resume-project.md` detects the interrupted agent and offers to resume it.

**Phase level:** `.continue-here` files mark exactly where execution stopped. The next session can pick up from the checkpoint rather than re-executing completed work.

**Verification level:** When `verify-phase.md` finds gaps, it generates fix plans automatically. When `verify-work.md` (UAT) finds issues, it chains diagnosis → planning → verification in a single pipeline.

**Milestone level:** `audit-milestone.md` catches cross-phase integration issues. `plan-milestone-gaps.md` creates targeted fix phases.

### 4.7 The Yolo Mode Pattern

Several workflows support a "yolo" mode (from the `set-profile` configuration) that auto-approves certain user gates. This includes:
- Skipping scope verification prompts in `complete-milestone.md`
- Auto-proceeding through gap analysis confirmation
- Reducing checkpoint frequency during execution

It's a trust dial — users who know what they're doing can eliminate confirmation prompts and let the pipeline run faster.

---

## 5. Workflow Dependency Map

The following shows how workflows call each other, forming the full pipeline:

```
new-project.md
  ├── [spawns] gsd-phase-researcher (×4, parallel)
  ├── [spawns] gsd-research-synthesizer
  ├── [spawns] gsd-requirements-analyst
  └── [spawns] gsd-roadmapper

discuss-phase.md → produces CONTEXT.md
  └── [feeds into] plan-phase.md

plan-phase.md
  ├── [spawns] gsd-phase-researcher (optional)
  ├── [spawns] gsd-planner
  └── [spawns] gsd-plan-checker (max 3 revisions)

execute-phase.md
  ├── [calls] execute-plan.md (per plan)
  │     └── [spawns] gsd-executor
  ├── [calls] verify-phase.md (post-execution)
  └── [calls] transition.md (post-verification)

verify-phase.md
  └── [generates] fix plans if gaps found

validate-phase.md
  └── [spawns] gsd-nyquist-auditor

verify-work.md (UAT)
  ├── [calls] diagnose-issues.md
  │     └── [spawns] gsd-debugger (×N, parallel)
  ├── [spawns] gsd-planner (gap_closure mode)
  └── [spawns] gsd-plan-checker (max 3 revisions)

audit-milestone.md
  ├── [spawns] gsd-integration-checker
  └── [feeds into] plan-milestone-gaps.md

complete-milestone.md
  └── [archives] → new-milestone.md (next cycle)

resume-project.md → routes to any of the above
progress.md → routes to any of the above
quick.md → lightweight version of plan → execute → verify
```

---

## 6. The 19 Workflows at a Glance

| Workflow | Lines | Purpose | Key Agents |
|----------|-------|---------|------------|
| `new-project.md` | ~1112 | Zero-to-roadmap initialization | 4× researcher, synthesizer, requirements, roadmapper |
| `discuss-phase.md` | 677 | Interactive context gathering | — (orchestrator-only) |
| `plan-phase.md` | ~561 | Phase planning with verification | researcher, planner, plan-checker |
| `execute-phase.md` | ~460 | Wave-based parallel execution | executor (×N) |
| `execute-plan.md` | 450 | Single plan execution | executor |
| `verify-phase.md` | 244 | Goal-backward code verification | — (orchestrator-only) |
| `validate-phase.md` | 168 | Nyquist test coverage | nyquist-auditor |
| `verify-work.md` | 584 | UAT testing pipeline | debugger (×N), planner, plan-checker |
| `transition.md` | 545 | Phase transition & PROJECT.md evolution | — (orchestrator-only) |
| `audit-milestone.md` | 333 | Milestone-level verification | integration-checker |
| `complete-milestone.md` | 765 | Milestone archival & retrospective | — (orchestrator-only) |
| `new-milestone.md` | 385 | Brownfield milestone initialization | 4× researcher, synthesizer, requirements, roadmapper |
| `plan-milestone-gaps.md` | 275 | Gap closure phase creation | — (orchestrator-only) |
| `diagnose-issues.md` | 220 | Parallel debug orchestration | debugger (×N) |
| `map-codebase.md` | 317 | Codebase analysis & mapping | codebase-mapper (×4) |
| `resume-project.md` | 308 | Session restoration | — (routing only) |
| `progress.md` | 383 | Status reporting & smart routing | — (routing only) |
| `quick.md` | 602 | Ad-hoc task execution | planner, executor, plan-checker |
| `research-phase.md` | 75 | Standalone research | phase-researcher |

---

## 7. Key Observations

**The orchestrator never does the work.** Every workflow follows the same pattern: load context → make routing decisions → spawn agents → process results → update state. The orchestrator is a dispatcher, not a worker.

**Context is the primary constraint, not compute.** Nearly every architectural decision — parallel agents, `<files_to_read>` passing, summary extraction, init payloads — exists to manage the 200k token context window. This is the dominant force shaping GSD's architecture.

**State lives in files, not memory.** STATE.md, CONTEXT.md, `.continue-here`, `agent-history.json` — everything is persisted to disk. Sessions are ephemeral; the `.planning/` directory is the source of truth. This enables the reconstruction pattern where STATE.md can be rebuilt from artifacts alone.

**Quality gates are multiplicative.** A phase passes through: plan-checker (pre-execution), verify-phase (post-execution), validate-phase (test coverage), verify-work (UAT), audit-milestone (cross-phase), and 3-source cross-reference. Each gate catches different failure modes. The system is designed so that *something* catches every category of gap.

**The human is always the final authority.** Despite automation (auto-advance, deviation rules, severity inference), every irreversible action routes through the user. Rule 4 deviations pause. Milestone completion requires confirmation. UAT is fundamentally human-driven. GSD amplifies human judgment rather than replacing it.
