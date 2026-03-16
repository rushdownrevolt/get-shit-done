# Agent Orchestration

Learn how GSD orchestrates work through subagents -- wave-based parallelization, checkpoints, and auto-advance chains.

## Lesson 1: The Orchestration Model

**Objective:** Understand how GSD uses an orchestration model where a coordinator agent spawns specialized subagents with fresh context, rather than running everything in a single long-lived agent.

GSD breaks work into phases and plans, but who actually executes them? You might assume a single agent reads the plan and does everything. But that approach has a fatal flaw -- as an agent works through tasks, it fills its context window. By task 8 of 12, it has forgotten the nuances from task 1. Quality degrades as context fills. GSD solves this with an orchestration model: a coordinator agent spawns specialized subagents, each starting with a fresh context window.

```text
<core_principle>
Orchestrator coordinates, not executes. Each subagent loads the
full execute-plan context. Orchestrator: discover plans -> analyze
deps -> group waves -> spawn agents -> handle checkpoints ->
collect results.
</core_principle>
```

Three key insights from that principle. First, the orchestrator coordinates but never writes code itself -- it spawns agents that do the work. Second, each subagent loads full context fresh, meaning every agent starts with a clean 200k-token window. Third, the orchestrator stays lean at roughly 10-15% context usage. This means the orchestrator can manage dozens of plans without its own quality degrading. The coordinator stays sharp because it never gets bogged down in implementation details.

```text
<purpose>
Execute all plans in a phase using wave-based parallel execution.
Orchestrator stays lean -- delegates plan execution to subagents.
</purpose>
```

The execution flow follows a clear sequence of discrete responsibilities: discover plans, analyze dependencies, group into waves, spawn agents per wave, handle checkpoints, collect results. Each step is a distinct job. The orchestrator never drifts into implementation -- it never edits a source file, never writes a test, never creates a component. It only reads plan metadata and spawns agents to do the actual building. This separation of concerns prevents scope creep at the coordination level.

```text
Task(
  subagent_type="gsd-executor",
  model="{executor_model}",
  prompt="
    <objective>
    Execute plan {plan_number} of phase {phase_number}-{phase_name}.
    Commit each task atomically. Create SUMMARY.md. Update STATE.md
    and ROADMAP.md.
    </objective>

    <files_to_read>
    Read these files at execution start using the Read tool:
    - {phase_dir}/{plan_file} (Plan)
    - .planning/STATE.md (State)
    - .planning/config.json (Config)
    </files_to_read>

    <success_criteria>
    - [ ] All tasks executed
    - [ ] Each task committed individually
    - [ ] SUMMARY.md created in plan directory
    </success_criteria>
  "
)
```

Notice what the orchestrator passes: paths, not content. The executor reads files itself with its fresh 200k context window. This is the path-only delegation pattern -- the orchestrator tells agents WHERE to look, not WHAT to do. The plan file IS the instruction set. The executor loads it, reads the tasks, executes them sequentially, commits each one, and produces a SUMMARY.md. The orchestrator never sees the code being written. Now you know the orchestration model: a lean coordinator spawns fresh agents that each load their own context. Next, we'll meet the specific agent types that play each role.

---

## Lesson 2: Subagent Types

**Objective:** Learn the five specialized subagent types in GSD (executor, planner, researcher, verifier, checker) and understand what each one reads, produces, and is responsible for.

The orchestrator spawns agents, but not all agents are the same. GSD has five specialized subagent types, each designed for a specific role in the workflow. The type determines what context the agent loads and what it is responsible for producing. This specialization prevents bloat -- an executor does not need planner logic, and a researcher does not need commit protocols. Each agent loads only what it needs.

```text
<step name="parse_segments">
Routing by checkpoint type:

| Checkpoints | Pattern    | Execution                         |
|-------------|------------|-----------------------------------|
| None        | A (auto)   | Single subagent: full plan +      |
|             |            | SUMMARY + commit                  |
| Verify-only | B (segment)| Segments between checkpoints.     |
|             |            | After verify -> SUBAGENT.          |
|             |            | After decision -> MAIN             |
| Decision    | C (main)   | Execute entirely in main context  |
</step>
```

The executor (gsd-executor) is the workhorse of GSD. It reads a PLAN.md file, executes tasks sequentially, commits each task atomically, and creates a SUMMARY.md when finished. The routing table above shows three execution patterns: Pattern A is fully autonomous -- a single executor agent does everything. Pattern B is segmented -- the agent pauses at checkpoints for human verification. Pattern C runs in main context for plans requiring decisions. Most plans use Pattern A.

```text
Task(
  prompt=filled_prompt,
  subagent_type="gsd-planner",
  model="{planner_model}",
  description="Plan Phase {phase}"
)

# Planner prompt includes:
# <files_to_read>
# - {state_path} (Project State)
# - {roadmap_path} (Roadmap)
# - {requirements_path} (Requirements)
# - {context_path} (USER DECISIONS)
# - {research_path} (Technical Research)
# </files_to_read>
```

The planner (gsd-planner) reads phase goals from ROADMAP.md and decomposes them into concrete tasks with dependencies. It produces PLAN.md files with frontmatter containing wave numbers, depends_on arrays, files_modified lists, and autonomous flags. The planner receives project state, requirements, user decisions from discuss-phase, and research findings. It outputs structured plans that executors can follow without ambiguity.

```text
Task(
  prompt="<objective>
  Research implementation approach for Phase {phase}: {name}
  </objective>

  <files_to_read>
  - {context_path} (USER DECISIONS from /gsd:discuss-phase)
  - {requirements_path} (Project requirements)
  - {state_path} (Project decisions and history)
  </files_to_read>

  <output>
  Write to: {phase_dir}/{phase_num}-RESEARCH.md
  </output>",
  subagent_type="gsd-phase-researcher",
  model="{researcher_model}"
)
```

The researcher (gsd-phase-researcher) investigates technical approaches before planning begins. It produces a RESEARCH.md with library evaluations, architecture patterns, and recommendations. The researcher is only spawned when discovery is needed -- if the technology is well-understood, planning proceeds directly. This prevents wasted effort on research when the path is already clear.

Two more agents close the quality loop. The verifier (gsd-verifier) runs after execution to check must_haves against reality -- do the artifacts exist on disk, do the key links work, are the stated truths actually observable in the codebase? It produces a VERIFICATION.md with a pass/fail score. The checker (gsd-plan-checker) reviews PLAN.md quality before execution -- task completeness, dependency correctness, scope sanity. Together, the verifier and checker bookend execution: the checker validates the plan, the verifier validates the result.

```text
Type                  | Spawned By     | Reads          | Produces
----------------------|----------------|----------------|------------------
gsd-executor          | execute-phase  | PLAN.md        | SUMMARY.md + commits
gsd-planner           | plan-phase     | ROADMAP.md     | PLAN.md files
gsd-phase-researcher  | plan-phase     | external docs  | RESEARCH.md
gsd-verifier          | verify-phase   | SUMMARY.md     | VERIFICATION.md
gsd-plan-checker      | plan-phase     | PLAN.md        | checker report
```

Each agent type has a clear contract: what it reads, what it produces, and who spawns it. The orchestrator (execute-phase) only spawns executors and verifiers. The planning orchestrator (plan-phase) spawns planners, researchers, and checkers. This separation means each orchestrator stays focused on its domain. Now that you know WHO the agents are, the next lesson covers HOW they execute in parallel through the wave system.

---

## Lesson 3: Wave Execution

**Objective:** Understand how GSD groups plans into waves based on dependencies and executes them in parallel, with spot-check verification after each wave.

Agents know their roles, but how does the orchestrator decide what runs when? Through waves. Plans declare dependencies via the depends_on field in their frontmatter. The orchestrator reads these declarations, groups plans into waves, and runs each wave's plans in parallel. Wave 1 plans have no dependencies. Wave 2 plans depend on wave 1 completions. The dependency graph drives execution order automatically.

```yaml
# Plan 01 -- no dependencies, runs in wave 1
---
phase: 05-feature
plan: 01
wave: 1
depends_on: []
files_modified: [src/models/user.ts]
autonomous: true
---

# Plan 02 -- also no dependencies, runs in wave 1
---
phase: 05-feature
plan: 02
wave: 1
depends_on: []
files_modified: [src/api/auth.ts]
autonomous: true
---

# Plan 03 -- depends on both, runs in wave 2
---
phase: 05-feature
plan: 03
wave: 2
depends_on: [05-01, 05-02]
files_modified: [src/pages/dashboard.tsx]
autonomous: true
---
```

Wave assignment follows a simple formula: wave = max(dependency waves) + 1. Plans 01 and 02 have no dependencies, so they start in wave 1. Plan 03 depends on both wave 1 plans, so it goes to wave 2. This is computed during planning, not at runtime -- the wave number is baked into the frontmatter. The planner analyzes the dependency graph and assigns waves upfront, so the orchestrator can execute without doing dependency resolution at runtime.

```text
<step name="discover_and_group_plans">
Load plan inventory with wave grouping in one call:

PLAN_INDEX=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs"
  phase-plan-index "${PHASE_NUMBER}")

Parse JSON for: plans[] (each with id, wave, autonomous,
objective, files_modified, task_count, has_summary),
waves (map of wave number -> plan IDs), incomplete,
has_checkpoints.

Report:
## Execution Plan

**Phase {X}: {Name}** -- {total_plans} plans across {wave_count} waves

| Wave | Plans         | What it builds  |
|------|---------------|-----------------|
| 1    | 01-01, 01-02  | {from objectives, 3-8 words} |
| 2    | 01-03         | ...             |
</step>
```

At runtime, the orchestrator calls phase-plan-index which reads all PLAN.md frontmatter, groups by wave number, and returns a structured index. Plans with has_summary: true are skipped -- they have already been executed. The orchestrator then iterates waves sequentially, but within each wave, plans run in parallel. This is the key insight: sequential waves, parallel plans within each wave. Wave 1 plans all start simultaneously. Only after all wave 1 plans complete does wave 2 begin.

```text
<step name="execute_waves">
For each wave:

1. Describe what's being built (BEFORE spawning):
   Read each plan's <objective>. Extract what's being built
   and why.

2. Spawn executor agents:
   Pass paths only -- executors read files themselves with
   their fresh 200k context. This keeps orchestrator context
   lean (~10-15%).

3. Wait for all agents in wave to complete.

4. Report completion -- spot-check claims first:
   For each SUMMARY.md:
   - Verify first 2 files from key-files.created exist on disk
   - Check git log --oneline --all --grep="{phase}-{plan}"
     returns >= 1 commit
   - Check for ## Self-Check: FAILED marker
</step>
```

After each wave completes, the orchestrator does not blindly trust agent reports. It runs spot-checks: do the SUMMARY files exist? Are there git commits matching the plan ID? Is there a Self-Check: FAILED marker? This lightweight verification catches failures without requiring full re-execution. If any spot-check fails, the orchestrator reports which plan failed and asks whether to retry or continue with remaining waves.

```text
For each SUMMARY.md:
- Verify first 2 files from key-files.created exist on disk
- Check git log --oneline --all --grep="{phase}-{plan}"
  returns >= 1 commit
- Check for ## Self-Check: FAILED marker

If ANY spot-check fails:
  Report which plan failed, route to failure handler --
  ask "Retry plan?" or "Continue with remaining waves?"
```

Wave execution gives GSD its speed. Independent plans run simultaneously, each with a fresh context window. The orchestrator stays lean -- it discovers plans, groups them into waves, spawns agents, and verifies results, never touching code itself. A phase with 6 plans across 3 waves finishes far faster than serial execution, because wave 1's 3 plans all run at the same time. You have seen how plans execute in waves. Next, we will examine the orchestrator's own design -- why it deliberately stays thin and what patterns keep it effective.

---

## Lesson 4: The Orchestrator Pattern

**Objective:** Understand the lean orchestrator design principle: how the orchestrator manages context budget through path-only delegation, and why this pattern repeats at every level of GSD.

Waves show how plans execute in parallel, but why does the orchestrator itself work reliably across many plans? Because it follows a strict design principle: stay lean. The orchestrator never reads file contents, never writes code, never makes implementation decisions. It passes paths and reads summaries. This is not a suggestion -- it is a survival constraint. If the orchestrator loaded even one plan's source files, it would consume 20-30% of its context window on a single plan, leaving nothing for the remaining nine.

```text
<context_efficiency>
Orchestrator: ~10-15% context. Subagents: fresh 200k each.
No polling (Task blocks). No context bleed.
</context_efficiency>

<step name="init_context" priority="first">
Load execution context (paths only to minimize orchestrator context):

INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs"
  init execute-phase "${PHASE}")

Extract from init JSON: executor_model, commit_docs, phase_dir,
plans, incomplete_plans, state_path, config_path.
</step>
```

The context budget principle is explicit: the orchestrator targets 10-15% context usage. Claude has a finite context window. If the orchestrator reads every file, it exhausts context before finishing. Instead, it reads only paths and metadata -- frontmatter from PLAN.md files, existence checks on SUMMARY.md files. The actual file content is read by executors in their own fresh context windows. This is why gsd-tools returns JSON with paths, not file contents. The init call returns executor_model, phase_dir, plans -- all metadata. No source code, no implementation details.

```text
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs"
  init execute-phase "${PHASE_ARG}")

Parse JSON for: executor_model, verifier_model, commit_docs,
parallelization, branching_strategy, branch_name, phase_found,
phase_dir, phase_number, phase_name, phase_slug, plans,
incomplete_plans, plan_count, incomplete_count, state_exists,
roadmap_exists, phase_req_ids.
```

When the orchestrator spawns an executor, it passes a prompt containing file PATHS -- @file references -- not file contents. The executor reads those files itself. This means the orchestrator uses roughly 100-200 tokens per plan spawn, while the executor gets a fresh 200k context to work with. The orchestrator can manage 10+ plans without degrading. Each executor starts at 0% context, reads the plan, reads the source files it needs, and builds at peak quality. The orchestrator never sees the code being written.

```text
<purpose>
Create executable phase prompts (PLAN.md files) for a roadmap
phase with integrated research and verification. Default flow:
Research (if needed) -> Plan -> Verify -> Done. Orchestrates
gsd-phase-researcher, gsd-planner, and gsd-plan-checker agents
with a revision loop (max 3 iterations).
</purpose>

Load all context in one call (paths only to minimize
orchestrator context):

INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs"
  init plan-phase "$PHASE")

Parse JSON for: researcher_model, planner_model, checker_model,
research_enabled, plan_checker_enabled, phase_found, phase_dir,
phase_number, has_research, has_context, has_plans, plan_count.
```

Plan-phase is ALSO an orchestrator -- it spawns the researcher (which investigates unknowns), then the planner (which creates PLAN.md files), then the checker (which validates them), then routes back for revision if needed. This is the same pattern: coordinate, delegate, verify. GSD has multiple orchestrators, each following the same lean principle. Execute-phase coordinates executors. Plan-phase coordinates researchers, planners, and checkers. Both load paths only, both delegate actual work to fresh agents, both stay at 10-15% context.

The orchestrator pattern is not just 'delegate work to subagents.' It is a specific discipline: the orchestrator reads metadata, makes routing decisions, and verifies outcomes -- nothing else. It does not peek at source files 'just to understand.' It does not 'help' the executor by pre-reading context. Every byte of context the orchestrator consumes is context it cannot use for coordinating the next plan. This discipline is what makes 10-plan phases possible. Next, we will see what happens when the orchestrator cannot run autonomously -- how checkpoints pause execution and resume after human decisions.

---

## Lesson 5: Checkpoints and Gates

**Objective:** Understand how GSD uses checkpoints for human-in-the-loop control: the three checkpoint types, the autonomous flag, continuation agents, and execution routing patterns.

Lean orchestrators run plans autonomously, but not ALL work can be fully automated. Visual verification, deployment approval, external service setup -- these need human judgment. GSD handles this through checkpoints: structured pause points in plan execution. The key principle is automation first -- Claude automates everything it can, then checkpoints verify the result. Checkpoints do not replace automation; they confirm it worked.

```yaml
# Plan with no checkpoints -- runs fully autonomously
---
phase: 05-feature
plan: 01
autonomous: true
---

# Plan with checkpoints -- pauses for human input
---
phase: 05-feature
plan: 02
autonomous: false
---

# A checkpoint task inside a plan:
<task type="checkpoint:human-verify" gate="blocking">
  <name>Verify login page renders correctly</name>
  <what-built>Login form with email/password fields and OAuth buttons</what-built>
  <how-to-verify>
    1. Visit http://localhost:3000/login
    2. Confirm email and password fields are visible
    3. Test with credentials: admin@test.com / password123
    4. Verify redirect to dashboard after login
  </how-to-verify>
  <resume-signal>"approved" or describe issues found</resume-signal>
</task>
```

There are three checkpoint types. checkpoint:human-verify (90% of cases) -- Claude automates everything, then the human confirms it works by visiting a URL, clicking through UI, or checking visual output. checkpoint:decision (9%) -- the human makes an implementation choice between options that Claude cannot decide alone. checkpoint:human-action (1%, rare) -- a truly unavoidable manual step like clicking an email verification link or entering a 2FA code. The critical rule: if Claude CAN do it via CLI or API, Claude MUST do it. Checkpoints verify AFTER automation, not replace it.

```text
<step name="checkpoint_handling">
Plans with autonomous: false require user interaction.

When executor returns a checkpoint:
- human-verify  -> Auto-spawn continuation agent
                   with user_response = "approved".
                   Log: Auto-approved checkpoint.
- decision      -> Auto-spawn continuation agent
                   with user_response = first option.
                   Log: Auto-selected: [option].
- human-action  -> Present to user (cannot be automated).
                   Auth gates cannot be automated.

Standard flow (not auto-mode):
1. Spawn agent for checkpoint plan
2. Agent runs until checkpoint -> returns structured state
3. Agent return includes: completed tasks table,
   current task + blocker, checkpoint type/details
4. Present to user with verification steps
5. User responds: "approved" | issue description | decision
6. Spawn CONTINUATION agent (NOT resume)
7. Continuation agent verifies previous commits,
   continues from resume point
8. Repeat until plan completes
</step>
```

When an executor hits a checkpoint task, it stops and returns its state: completed tasks with commit hashes, the current blocker, and what is awaited from the user. The orchestrator presents this to the user with specific verification steps. The user responds -- approved, an issue description, or a decision selection. Then a CONTINUATION agent is spawned. This is critical: not a resume of the old agent, but a fresh agent that picks up from where the checkpoint was. It verifies previous commits exist, loads the plan, and continues from the resume point. This preserves the fresh-context principle even across human checkpoints.

```text
<step name="parse_segments">
Routing by checkpoint type:

| Checkpoints  | Pattern        | Execution                    |
|--------------|----------------|------------------------------|
| None         | A (autonomous) | Single subagent: full plan   |
|              |                | + SUMMARY + commit           |
| Verify-only  | B (segmented)  | Segments between checkpoints |
|              |                | After verify -> SUBAGENT     |
|              |                | After decision -> MAIN       |
| Decision     | C (main)       | Execute entirely in main     |
|              |                | context                      |

Fresh context per subagent preserves peak quality.
Main context stays lean.
</step>
```

The routing is automatic based on checkpoint types found in the plan. Pattern A plans have no checkpoints -- they get one executor that does everything autonomously. Pattern B plans have verify-only checkpoints -- they get segmented execution where autonomous segments run as subagents and checkpoint segments pause for human input. Pattern C plans have decision checkpoints -- they execute entirely in the main orchestrator context because complex decisions need the orchestrator's full awareness. The executor scans for checkpoint tasks and routes accordingly, before any code runs.

Checkpoints create human-in-the-loop control without sacrificing automation. The orchestrator runs everything it can, pauses only when it must, and uses fresh continuation agents to maintain quality after pauses. Most plans (Pattern A) never pause at all. The few that do (Patterns B and C) get precise, structured interactions rather than vague 'is this okay?' prompts. Next, we will see the opposite end of the control spectrum -- how GSD chains entire phases together for fully hands-free execution with auto-advance.

---

## Lesson 6: Auto-Advance Chains

**Objective:** Understand how GSD chains phase lifecycles together for hands-free execution using the --auto flag and auto-advance configuration.

Checkpoints give human control when needed, but GSD can also run entire phase lifecycles hands-free. The auto-advance system chains plan -> execute -> verify -> transition automatically using the --auto flag. A single command can plan a phase, execute all its plans in waves, verify the results, mark the phase complete, and advance to the next one -- all without human interaction.

```text
Sync chain flag with intent -- if user invoked manually
(no --auto), clear the ephemeral chain flag:

if [[ ! "$ARGUMENTS" =~ --auto ]]; then
  node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" \
    config-set workflow._auto_chain_active false
fi

Read both the chain flag and user preference:

AUTO_CHAIN=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" \
  config-get workflow._auto_chain_active || echo "false")
AUTO_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" \
  config-get workflow.auto_advance || echo "false")
```

There are two auto-advance mechanisms. First, the --auto flag on a single invocation, which sets _auto_chain_active for that run. This is ephemeral -- it clears when the chain ends or the user invokes manually without the flag. Second, workflow.auto_advance in config.json, which is the persistent user preference -- it stays on until the user turns it off. When either is true, the system auto-approves checkpoints: human-verify gets 'approved,' decisions get the first option. Only human-action checkpoints (like auth gates) still pause.

```text
<step name="verify_completion">
Check current phase has all plan summaries:

ls .planning/phases/XX-current/*-PLAN.md | sort
ls .planning/phases/XX-current/*-SUMMARY.md | sort

Verification logic:
- Count PLAN files
- Count SUMMARY files
- If counts match: all plans complete
- If counts don't match: incomplete
</step>

<step name="update_roadmap_and_state">
TRANSITION=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs"
  phase complete "${current_phase}")

The CLI handles:
- Marking the phase checkbox as [x] complete with today's date
- Updating plan count to final (e.g., "3/3 plans complete")
- Updating the Progress table (Status -> Complete, adding date)
- Advancing STATE.md to next phase
- Detecting if this is the last phase in the milestone
</step>
```

The chain works like this: execute-phase completes all plans, then transition marks the phase done and advances STATE.md. If auto-advance is on, the next phase starts automatically. This creates a pipeline: plan Phase 5 -> execute Phase 5 -> verify Phase 5 -> transition to Phase 6 -> plan Phase 6 -> execute Phase 6, all without user interaction. The --no-transition flag breaks the chain if you want to stop after execution. The chain also stops at milestone boundaries -- when the last phase completes, the auto-advance flag is cleared automatically.

```text
Auto-mode checkpoint handling:

When executor returns a checkpoint AND auto-mode is active:

- checkpoint:human-verify
  -> Auto-spawn continuation agent
     with user_response = "approved"
  -> Log: Auto-approved checkpoint

- checkpoint:decision
  -> Auto-spawn continuation agent
     with user_response = first option
  -> Log: Auto-selected: [option]

- checkpoint:human-action
  -> Present to user (existing behavior)
  -> Auth gates cannot be automated
  -> Chain PAUSES here
```

In auto-mode, human-verify checkpoints are instantly approved -- the assumption is that if the automation passed its own verification, it is good enough to continue. Decision checkpoints auto-select the first option, because GSD planners front-load the recommended choice as option one. Only human-action checkpoints (like entering a 2FA code or clicking an email link) still pause the chain. This means a 10-phase milestone with verify-only checkpoints can run end-to-end without any user input at all.

Auto-advance completes the automation story. At one extreme, every plan has checkpoints and humans verify each step. At the other, the --auto flag chains entire milestones. Most real usage falls in between: auto-advance runs the pipeline, but a human-action checkpoint pauses for a deployment secret or a visual review that truly cannot be automated. The next lesson synthesizes everything -- how orchestration connects to the full GSD lifecycle from project definition to milestone completion.

---

## Lesson 7: The Full Lifecycle

**Objective:** Synthesize how all orchestration concepts compose into the complete GSD lifecycle, from project definition through milestone completion.

This final lesson connects all the pieces. You have learned: the orchestration model (Lesson 1), the five agent types (Lesson 2), wave execution (Lesson 3), lean orchestrator design (Lesson 4), checkpoints (Lesson 5), and auto-advance (Lesson 6). Now we will see how these compose into the complete GSD lifecycle -- from the first command to milestone completion.

```text
The Complete GSD Lifecycle:

/gsd:kickoff           -> PROJECT.md
/gsd:requirements      -> REQUIREMENTS.md
/gsd:roadmap           -> ROADMAP.md (phases with goals)

/gsd:discuss-phase N   -> CONTEXT.md (user decisions)

/gsd:plan-phase N      [ORCHESTRATOR]
  |-> gsd-phase-researcher  -> RESEARCH.md
  |-> gsd-planner           -> PLAN.md files
  |-> gsd-plan-checker      -> revision loop (max 3)

/gsd:execute-phase N   [ORCHESTRATOR]
  |-> discover plans, group into waves
  |-> Wave 1: spawn executors in parallel
  |     |-> gsd-executor -> commits + SUMMARY.md
  |     |-> gsd-executor -> commits + SUMMARY.md
  |-> spot-check Wave 1 results
  |-> Wave 2: spawn executors (depend on Wave 1)
  |     |-> gsd-executor -> commits + SUMMARY.md
  |-> checkpoint plans: pause -> human -> continuation
  |-> gsd-verifier -> VERIFICATION.md

/gsd:transition        -> advance STATE.md, next phase
/gsd:complete-milestone -> archive, retrospective
```

Let's walk through a concrete example: building a user authentication feature. /gsd:plan-phase reads the phase goal from ROADMAP.md, spawns a researcher to investigate auth libraries, then a planner that creates 2 plans -- database schema plus API routes in wave 1, login UI in wave 2. The checker verifies the plans have proper dependencies and frontmatter. /gsd:execute-phase discovers the 2 plans, groups them by wave. Wave 1's executor creates the database schema, implements API routes, commits each task atomically. Wave 2's executor creates the login form, wires it to the API. Both produce SUMMARY.md files with commit hashes and file inventories.

```text
## Execution Plan

**Phase 5: User Authentication** -- 2 plans across 2 waves

| Wave | Plans | What it builds                    |
|------|-------|-----------------------------------|
| 1    | 05-01 | Database schema and auth API      |
| 2    | 05-02 | Login UI wired to auth endpoints  |

---
## Wave 1

**05-01: Auth Schema and API**
JWT authentication with refresh token rotation using jose
library. Creates users table, password hashing with bcrypt,
login/register/refresh endpoints with validation.

Spawning 1 agent...

---
## Wave 1 Complete

**05-01: Auth Schema and API**
JWT auth with refresh rotation -- 4 tasks, 6 files created.
Login UI (Wave 2) can now reference auth endpoints.

---
## Wave 2

**05-02: Login UI**
React login form with email/password fields, error handling,
and redirect on successful auth.

Spawning 1 agent...
```

Five key principles make this work. First, fresh context per agent -- quality never degrades because every executor starts with a clean context window. Second, path-only delegation -- the orchestrator stays lean at 10-15% by passing file paths, not file contents. Third, pre-computed waves -- dependency resolution happens during planning, not at runtime, so the orchestrator executes without analyzing code. Fourth, atomic commits -- each task is independently verifiable in git history. Fifth, spot-check verification -- the orchestrator trusts but verifies by checking file existence and commit history. These are not aspirational -- they are enforced by the workflow structure itself.

```text
Why fresh context matters -- quality vs. context usage:

| Context Usage | Quality    | Agent State               |
|---------------|------------|---------------------------|
| 0-30%         | PEAK       | Full attention, creative  |
|               |            | solutions, thorough code  |
| 30-50%        | GOOD       | Solid output, occasional  |
|               |            | shortcuts in edge cases   |
| 50-70%        | DEGRADING  | Rushing, minimal tests,   |
|               |            | copy-paste patterns       |
| 70%+          | POOR       | Hallucinations, skipped   |
|               |            | steps, incomplete output  |
```

Without fresh context per agent, a long-running session would hit 70%+ context by the third plan, producing rushed, minimal output. With orchestration, every plan gets 0-30% context -- peak quality every time. This is not theoretical. GSD's own development demonstrates it: 36+ plans executed with consistent 2-4 minute completion times and thorough output across every plan, because each executor started fresh. The orchestrator pattern is the reason a 10-plan phase produces the same quality on plan 10 as on plan 1.

GSD's orchestration is not magic -- it is structured decomposition. Break work into phases. Break phases into plans. Break plans into tasks. Assign waves by dependency. Spawn agents with fresh context. Verify results. Advance automatically. Every piece you learned in this module is a specific mechanism serving this decomposition: the orchestration model (coordinate, not execute), agent types (specialized roles), waves (parallel when possible, sequential when dependent), lean design (paths not content), checkpoints (human judgment where needed), auto-advance (hands-free when possible). In the next step -- the mini-project -- you will apply these concepts yourself.

---

## Concept Map

```
  Agent Orchestration
        |
        v
  +-------------------------+
  | Overview                |
  | (The orchestration      |
  |  model & why agents)    |
  +-------------------------+
        |
        v
  +-------------------------+
  | Subagent Types          |
  | (Executor, planner,     |
  |  researcher, verifier,  |
  |  checker)               |
  +-------------------------+
        |
        v
  +-------------------------+
  | Wave Execution          |
  | (Parallel spawning,     |
  |  wave grouping,         |
  |  depends_on)            |
  +-------------------------+
        |
        v
  +-------------------------+
  | Orchestrator Pattern    |
  | (Context budget, lean   |
  |  orchestrator, routing) |
  +-------------------------+
        |
        v
  +-------------------------+
  | Checkpoints             |
  | (Autonomous flags,      |
  |  human-in-the-loop,     |
  |  verification gates)    |
  +-------------------------+
        |
        v
  +-------------------------+
  | Auto-Advance            |
  | (Plan -> execute ->     |
  |  verify piping, chain   |
  |  automation)            |
  +-------------------------+
        |
        v
  +-------------------------+
  | Synthesis               |
  | (Full lifecycle         |
  |  connection, putting    |
  |  it all together)       |
  +-------------------------+

```

## Mini-Project: Build Orchestrated Skeptic Reviews

Extend your skeptic workflow with subagent-style parallel review -- multiple review aspects organized in waves, with an orchestrator step that aggregates findings

### Artifacts

#### Skeptic workflow with orchestration layer

**Path:** `~/.claude/get-shit-done/workflows/skeptic.md`

**Verification Checks:**

- [ ] Has purpose section
- [ ] Has process section
- [ ] Defines wave-based or parallel review structure
- [ ] Defines multiple review subagents or aspects
- [ ] Has orchestrator step that aggregates subagent findings
- [ ] Writes aggregated findings to review artifact

### Hints

<details>
<summary>Hint 1</summary>

Your skeptic workflow currently does one big review. The orchestration model splits work across specialized agents that run in parallel. Think about what different ASPECTS of a project a skeptic could review independently -- architecture, conventions, dependencies -- each as its own 'subagent' step.

</details>

<details>
<summary>Hint 2</summary>

The orchestration pattern has three layers: define the subagents (what each reviews), organize them into waves (which run in parallel), and aggregate the results (orchestrator collects findings). All three layers go inside your workflow's process section as new steps.

</details>

<details>
<summary>Hint 3</summary>

Add steps that each focus on one review aspect. For example: one step reviews architecture decisions, another checks convention compliance, another analyzes dependencies. Mark which steps can run in the same wave (parallel). Then add an aggregation step that combines all findings before writing to SKEPTIC-REVIEW.md.

</details>

<details>
<summary>Hint 4</summary>

In your workflow's process section, add 2-3 steps like: step 'review_architecture' examines project structure and design decisions, step 'review_conventions' checks coding standards and naming patterns, step 'review_dependencies' analyzes external dependencies. Group these as 'Wave 1' (they are independent and can run in parallel). Then add a step 'aggregate_findings' that combines results from all review steps into the final output.

</details>

<details>
<summary>Hint 5</summary>

In your skeptic workflow at ~/.claude/get-shit-done/workflows/skeptic.md, add these steps inside the process section: (a) 2-3 review subagent steps, each named review_* and focused on one aspect (architecture, conventions, dependencies). Mark them as Wave 1 since they are independent. (b) An aggregate_findings step that collects findings from all review subagents and writes the combined analysis to SKEPTIC-REVIEW.md. The wave structure and aggregation pattern are what verification checks for -- the specific review aspects are your creative choice.

</details>

