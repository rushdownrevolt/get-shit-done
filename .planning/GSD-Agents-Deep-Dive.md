# GSD Agents Layer — Annotated Deep Dive

## What This Document Covers

This is Layer 4 of our GSD architecture exploration. Previous layers covered:

- **Layer 1**: `.planning/codebase/` analysis documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- **Layer 2**: Deep dive into ARCHITECTURE.md and STRUCTURE.md
- **Layer 3**: State machine internals (state.cjs, core.cjs, phase.cjs, frontmatter.cjs)

This layer examines all **12 agent definitions** — the markdown prompt files that define what each AI agent knows, how it thinks, and what it produces.

---

## The Key Architectural Insight: Agents Are Prompts, Not Code

The single most important thing to understand about the GSD agent layer is that **agents are not code files**. They are `.md` files — sophisticated system prompts with YAML frontmatter — stored in `/agents/`. Each one gets fed to an AI model as its identity and instructions.

The CJS infrastructure (covered in Layer 3) handles execution mechanics — spawning agents, managing state transitions, parsing frontmatter. The agents themselves are pure instruction sets: "You are X. Your job is Y. Here is how you think about it."

This is a fundamentally different architecture from traditional multi-agent systems where agents are code modules with methods. Here, agents are **documents that become behavior** through the AI model interpreting them.

---

## Agent Anatomy: The Universal Structure

Every agent follows the same structural skeleton:

### YAML Frontmatter

```yaml
---
name: gsd-executor          # Identity
description: ...             # What orchestrators see when choosing agents
tools: Read, Write, Bash...  # Tool access (varies by agent role)
color: green                 # Terminal/UI identification
skills:
  - gsd-executor-workflow    # Linked workflow skills
# hooks:                     # Optional PostToolUse hooks (commented out)
---
```

**The `tools` field is the capability boundary.** The executor gets `Read, Write, Edit, Bash, Grep, Glob` (full builder toolkit). The integration-checker gets only `Read, Bash, Grep, Glob` (read-only investigator). The project-researcher gets `Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*` (external research access). Tool access shapes what an agent can do as much as its prompt does.

### XML-Structured Body

Every agent organizes its instructions in XML sections. The common sections are:

| Section | Purpose | Present In |
|---------|---------|------------|
| `<role>` | Identity, spawn context, core responsibilities | All 12 |
| `<philosophy>` | How to think, not just what to do | Most |
| `<execution_flow>` | Step-by-step procedure | All 12 |
| `<structured_returns>` | Exact output format for orchestrator | All 12 |
| `<success_criteria>` | Self-check before returning | All 12 |
| `<anti_patterns>` | What NOT to do | Several |
| `<downstream_consumer>` | Who reads your output and how | Several |

The `<structured_returns>` section is critical for the orchestrator pattern. Every agent returns markdown in a predictable format (`## PHASE VERIFIED`, `## PLAN CREATED`, `## RESEARCH COMPLETE`, etc.) that the orchestrator can parse to determine next steps.

### The Mandatory Initial Read Pattern

Every single agent contains this instruction:

> **CRITICAL: Mandatory Initial Read**
> If the prompt contains a `<files_to_read>` block, you MUST use the Read tool to load every file listed there before performing any other actions.

This is how orchestrators pass context to agents. Rather than dumping file contents into the prompt (which would explode context windows), orchestrators pass file paths and trust agents to load them. It's lazy loading for AI context.

---

## The 12 Agents: A Taxonomy

The agents fall into four functional groups:

### Group 1: The Build Pipeline (Linear Flow)

These agents execute in sequence during normal project progression:

```
roadmapper → planner → executor → verifier
```

### Group 2: The Research Layer (Parallel + Synthesis)

These agents gather information before building begins:

```
project-researcher (×4 parallel) → research-synthesizer → roadmapper
phase-researcher → planner
```

### Group 3: The Quality Gates (Verification)

These agents check work before and after execution:

```
plan-checker (pre-execution) → executor → verifier (post-execution)
integration-checker (cross-phase) → nyquist-auditor (test gaps)
```

### Group 4: Support Agents

```
codebase-mapper (exploration)
debugger (reactive, spawned on failure)
```

---

## Group 1: The Build Pipeline

### gsd-executor.md (489 lines) — "The Doer"

**Spawned by:** `/gsd:execute-phase` orchestrator
**Tools:** Read, Write, Edit, Bash, Grep, Glob (full builder kit)
**Color:** green

This is the core agent — the one that actually builds things. It takes a PLAN.md and turns it into working code.

#### Key Design Decisions

**Atomic task execution with per-task commits.** The executor doesn't build everything then commit. Each task gets its own commit. This means if an execution fails mid-plan, you have a clean rollback point at the last completed task. The commit protocol uses `gsd-tools.cjs commit` which updates STATE.md automatically.

**Three execution patterns:** The executor handles three distinct scenarios:

- **Pattern A (Fully Autonomous):** No checkpoints in the plan. Execute everything, commit per task, create SUMMARY.md.
- **Pattern B (Has Checkpoints):** Execute until checkpoint, stop, return status for human review.
- **Pattern C (Continuation):** Resuming after a checkpoint was approved. Pick up where left off.

This maps directly to the state machine's `checkpoint_pending` state from Layer 3.

**The Deviation Rules (1-4):** This is one of the most interesting design elements. The executor will encounter situations where the plan doesn't match reality. The rules determine what it can do autonomously vs. what requires human approval:

- **Rule 1 (Bug in plan):** Fix silently. E.g., plan says "edit line 45" but the code has changed — find the right line.
- **Rule 2 (Critical functionality):** Fix and note. E.g., a function is missing error handling that would crash the app.
- **Rule 3 (Blocker):** Fix to unblock. E.g., a dependency isn't installed.
- **Rule 4 (Architectural change):** STOP AND ASK. E.g., the task requires restructuring the database schema in a way the plan didn't anticipate.

Rules 1-3 are auto-fix because they preserve intent. Rule 4 is ask-first because it changes intent.

**Analysis paralysis guard:** "5+ consecutive reads without action = stuck signal." This prevents the executor from endlessly reading files without producing output — a real failure mode for AI agents.

**TDD execution flow:** Tests come first in the executor's workflow. Write test → run test (should fail) → implement → run test (should pass) → commit. This isn't optional — it's the default execution model.

#### Downstream Connection

The executor produces `SUMMARY.md` files for each plan execution. These summaries are consumed by the verifier to check if the phase goal was actually achieved. The executor also updates `STATE.md` via the commit tool, which the state machine (Layer 3) reads to track project position.

---

### gsd-planner.md (1309 lines) — "The Architect"

**Spawned by:** `/gsd:plan-phase` orchestrator
**Tools:** Read, Write, Bash, Grep, Glob
**Color:** blue

At 1309 lines, this is the largest agent — and for good reason. Planning is the most intellectually complex task in the system. The planner transforms phase goals and success criteria into executable task breakdowns.

#### Key Design Decisions

**"Plans are prompts, not documents that become prompts."** This philosophy statement reveals something deep about the architecture. A PLAN.md isn't documentation — it's literally the instruction set that gets fed to the executor agent. Every word in a plan is a directive that an AI will interpret and act on.

**Context budget management:** Plans are limited to 2-3 tasks and 5-8 files to prevent quality degradation from context overflow. This is a practical concession to AI context window limitations — if you give an executor a 20-task plan touching 40 files, the quality of execution degrades sharply on later tasks.

**CONTEXT.md as constraint system:** The planner must honor three types of constraints:

- **Locked Decisions:** Non-negotiable. "Use PostgreSQL" means use PostgreSQL, don't research alternatives.
- **Claude's Discretion:** Freedom areas. "Choose whatever testing library makes sense."
- **Deferred Ideas:** Out of scope. "Real-time notifications — do not build this now."

**Goal-backward must-haves derivation:** Instead of "what tasks should we do?", the planner asks "what must be TRUE when this plan completes?" and works backwards. Must-haves have three levels:

- **Truths:** Observable user behaviors ("User can log in")
- **Artifacts:** Files that must exist ("auth.ts", "login.test.ts")
- **Key Links:** Wiring between artifacts ("LoginForm submits to /api/auth")

**Three operating modes:**

- **Standard:** Fresh plan for a phase
- **Gap Closure:** Plan to fix specific failures found by the verifier
- **Revision:** Incorporate user feedback on an existing plan

**Dependency graphs and execution waves:** Plans don't just list tasks — they organize them into waves that can execute in parallel. Wave 0 is foundation (no dependencies), Wave 1 depends on Wave 0, etc. This maps to how the executor processes work.

#### Why It's the Largest Agent

The planner carries the most domain knowledge because it must translate abstract goals into concrete, file-level instructions. It needs to understand project structure, testing conventions, file naming patterns, dependency management, and how to decompose work without losing coherence. Every other agent either operates on a smaller scope (executor: one task) or a higher level of abstraction (roadmapper: phases).

---

### gsd-roadmapper.md (652 lines) — "The Strategist"

**Spawned by:** `/gsd:new-project` orchestrator
**Tools:** Read, Write, Bash, Grep, Glob
**Color:** purple

The roadmapper operates at the highest level of abstraction — it takes requirements and creates the phase structure for the entire project.

#### Key Design Decisions

**"Derive phases from requirements. Don't impose structure."** The roadmapper explicitly rejects template-based planning. "Every project needs Setup → Core → Features → Polish" is called out as an anti-pattern. Instead, requirements are grouped by natural delivery boundaries.

**Anti-enterprise philosophy:** "If it sounds like corporate PM theater, delete it." No sprints, no stakeholder management, no resource allocation, no Gantt charts. The system is designed for one developer + one AI, and the roadmapper enforces this simplicity.

**100% coverage is non-negotiable.** Every v1 requirement maps to exactly one phase. No orphans (requirements without a phase), no duplicates (requirements in multiple phases). The roadmapper builds an explicit coverage map and blocks until it reaches 100%.

**Granularity calibration from config.json:**

| Granularity | Typical Phases | What It Means |
|-------------|----------------|---------------|
| Coarse | 3-5 | Combine aggressively |
| Standard | 5-8 | Balanced grouping |
| Fine | 8-12 | Let natural boundaries stand |

**Two mandatory phase representations in ROADMAP.md:** A summary checklist (quick overview) AND detailed sections with `### Phase X:` headers. The headers are parsed by downstream tools — if you only write the checklist, phase lookups fail. This is a data contract between the roadmapper and the planner.

**Goal-backward at phase level:** For each phase, the question is "What must be TRUE for users when this phase completes?" — not "What should we build?" This produces success criteria like "User can log in and stay logged in across browser sessions" rather than task lists like "Build authentication."

#### Dual Output

The roadmapper creates two files:
- **ROADMAP.md** — Phase structure, requirements mapping, success criteria
- **STATE.md** — Project memory (current position, metrics, decisions, blockers)

Both are consumed by downstream agents and the state machine infrastructure.

---

### gsd-verifier.md (581 lines) — "The Skeptic"

**Spawned by:** `/gsd:verify-phase` or `/gsd:validate-phase`
**Tools:** Read, Bash, Grep, Glob (read-only — cannot modify code)
**Color:** yellow

The verifier checks whether a phase actually achieved its goal. It's deliberately adversarial — its instructions say "Do NOT trust SUMMARY.md claims."

#### Key Design Decisions

**Goal-backward verification:** "Did the phase achieve its GOAL, not just complete its TASKS?" A phase where all tasks are done but the user can't actually log in is a failed phase.

**Three-level artifact verification:**

1. **Exists:** File is present on disk
2. **Substantive:** File contains real implementation (not stubs)
3. **Wired:** File is connected to the rest of the system (imported, called, used)

This three-level check is the verifier's core contribution. Many AI systems produce files that exist and look substantive but aren't actually connected to anything. The verifier catches this.

**Stub detection patterns:** The verifier knows what stubs look like:

- React components that return `<div>TODO</div>` or placeholder text
- API routes that return hardcoded data
- Functions with `// TODO: implement` comments
- Empty catch blocks, console.log-only error handlers

**Key link verification patterns:**

- Component → API (does the React component actually call the endpoint?)
- API → Database (does the route actually query the database?)
- Form → Handler (does form submission trigger the right handler?)
- State → Render (does state change cause the right UI update?)

**Anti-pattern scanning:** Grep for `TODO`, `FIXME`, `console.log` in handlers, empty `catch` blocks, hardcoded test data in production code.

**Re-verification mode:** When run after gap closure, the verifier focuses on previously failed items while doing a quick regression on previously passed items. This prevents the fix-one-break-another cycle.

**Does NOT commit.** The verifier is read-only. It reports findings; the orchestrator decides what to do with them.

---

## Group 2: The Research Layer

### gsd-project-researcher.md (631 lines) — "The Scout"

**Spawned by:** `/gsd:new-project` or `/gsd:new-milestone`
**Tools:** Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__* (external access)
**Color:** cyan

The project researcher answers "What does this domain ecosystem look like?" before any building begins.

#### Key Design Decisions

**Three research modes:**

| Mode | Trigger | Focus |
|------|---------|-------|
| Ecosystem (default) | "What exists for X?" | Libraries, frameworks, SOTA vs deprecated |
| Feasibility | "Can we do X?" | Technical achievability, blockers |
| Comparison | "Compare A vs B" | Feature matrix, recommendation |

**Confidence-tiered source hierarchy:**

- **HIGH:** Context7 (version-aware library docs), official documentation
- **MEDIUM:** WebSearch verified against official source
- **LOW:** WebSearch only, single source, unverified

The agent is explicitly told: "Claude's training data is 6-18 months stale. Knowledge may be outdated, incomplete, or wrong." This self-awareness drives the verification protocol.

**"Investigation, not confirmation."** Bad research starts with a hypothesis and finds supporting evidence. Good research gathers evidence and forms conclusions. This is stated as a core philosophy.

**Brave Search API integration:** When `brave_search: true` in config, the agent uses a dedicated search binary (`gsd-tools.cjs websearch`) for higher-quality results with less SEO spam.

**Five output files:** SUMMARY.md, STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md — each with detailed templates. The FEATURES.md introduces a useful taxonomy: Table Stakes (expected), Differentiators (valued), Anti-Features (explicitly don't build).

**Does NOT commit.** Researchers run in parallel; the synthesizer commits everything together.

---

### gsd-research-synthesizer.md (249 lines) — "The Editor"

**Spawned by:** `/gsd:new-project` (after 4 parallel researchers complete)
**Tools:** Read, Write, Bash
**Color:** purple

The smallest of the "substantive" agents (249 lines). Its job is simple but critical: read the 4 research files produced by parallel researcher agents and synthesize them into a cohesive SUMMARY.md.

#### Key Design Decisions

**"Synthesized, not concatenated."** The quality indicator makes this explicit — findings must be integrated, not just copied from each file. The synthesizer looks for patterns across research domains (e.g., a pitfall from PITFALLS.md that constrains a choice in STACK.md).

**This agent commits.** Unlike the researchers (who write but don't commit), the synthesizer commits ALL research files together. This is the synchronization point for the parallel research pipeline.

**Roadmap implications are the most important section.** The synthesizer must translate research into concrete phase suggestions with rationale, feature groupings, and research flags for which phases need deeper investigation during planning.

**Minimal tool access:** Only Read, Write, and Bash. No web search, no external tools. The synthesizer works entirely with existing files — it doesn't do new research, it integrates existing research.

---

### gsd-phase-researcher.md (555 lines) — "The Specialist"

**Spawned by:** `/gsd:research-phase` orchestrator
**Tools:** Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*
**Color:** cyan

While the project researcher does broad domain research before any building, the phase researcher does targeted research for a specific phase before planning begins.

#### Key Design Decisions

**Answers "What do I need to know to PLAN this phase well?"** — not "What does this domain look like?" The scope is narrower and more tactical.

**Produces RESEARCH.md** consumed directly by the planner agent. The output must be actionable for plan creation, not academic.

**Same confidence hierarchy** as the project researcher (Context7 → Official Docs → WebSearch), but applied to phase-specific questions.

**Validation Architecture section:** The phase researcher specifically investigates testing infrastructure for Nyquist compliance — test framework availability, requirement-to-test mapping, and Wave 0 gaps. This feeds the planner's test-first execution model.

**CONTEXT.md constrains scope:** Locked decisions mean "research deeply for this specific choice, don't explore alternatives." This prevents the researcher from wasting time investigating options the user has already decided against.

---

## Group 3: The Quality Gates

### gsd-plan-checker.md (708 lines) — "The Reviewer"

**Spawned by:** `/gsd:plan-phase` orchestrator (after planner, before executor)
**Tools:** Read, Bash, Grep, Glob (read-only)
**Color:** orange

The plan-checker verifies plans WILL achieve the phase goal BEFORE execution. The verifier checks AFTER. This is the pre-execution quality gate.

#### Key Design Decisions

**8 verification dimensions:**

1. **Requirement coverage** — Do tasks cover all phase requirements?
2. **Task completeness** — Are tasks fully specified?
3. **Dependency correctness** — Are dependencies accurate?
4. **Key links planned** — Will artifacts be wired together?
5. **Scope sanity** — Is this feasible in context?
6. **Verification derivation** — Can we verify success?
7. **Context compliance** — Do plans honor CONTEXT.md constraints?
8. **Nyquist compliance** — Is test coverage planned?

**Scope thresholds:**

| Tasks per Plan | Classification |
|---------------|----------------|
| 2-3 | Target (optimal) |
| 4 | Warning |
| 5+ | Blocker (must split) |

This enforces the context budget principle from the planner — too many tasks in a plan degrades AI execution quality.

**Structured YAML issues with severities:** The plan-checker outputs issues as `blocker`, `warning`, or `info`. Blockers prevent execution; warnings are noted but don't block.

**"Does NOT check code existence."** The plan-checker is a static analysis agent — it reads plans and checks them against requirements, CONTEXT.md, and structural rules. It never touches the codebase. Code verification is the verifier's job.

---

### gsd-integration-checker.md (445 lines) — "The Wiring Inspector"

**Spawned by:** Milestone auditor (cross-phase verification)
**Tools:** Read, Bash, Grep, Glob (read-only)
**Color:** blue

The integration checker operates at a different level than the verifier. While the verifier checks individual phases, the integration checker verifies that **phases work together as a system**.

#### Key Design Decisions

**"Existence ≠ Integration."** This is the core principle. A component can exist without being imported. An API can exist without being called. The integration checker only cares about connections.

**Four verification dimensions:**

1. **Exports → Imports** — Phase 1 exports `getCurrentUser`, Phase 3 actually imports and calls it?
2. **APIs → Consumers** — `/api/users` route exists, something fetches from it?
3. **Forms → Handlers** — Form submits to API, API processes, result displays?
4. **Data → Display** — Database has data, UI renders it?

**Bash-heavy verification:** Unlike other agents that primarily use Read, the integration checker is built around bash scripts that grep codebases for import/export patterns, API consumers, and auth protection. It has complete bash functions for `check_export_used()`, `check_api_consumed()`, `check_auth_protection()`, and full E2E flow verification functions.

**Requirements Integration Map:** The integration checker maps each requirement to its cross-phase wiring path (e.g., "Phase 1 export → Phase 3 import → consumer component") and flags requirements with no cross-phase touchpoints.

**Structured YAML output:** Findings are returned in `wiring` (connected/orphaned/missing) and `flows` (complete/broken) categories, with specific break points for broken flows.

---

### gsd-nyquist-auditor.md (178 lines) — "The Test Gap Filler"

**Spawned by:** `/gsd:validate-phase`
**Tools:** Read, Write, Edit, Bash, Glob, Grep
**Color:** #8B5CF6 (purple)

The smallest agent at 178 lines. It has one focused job: fill Nyquist validation gaps by generating and running tests.

#### Key Design Decisions

**Implementation files are READ-ONLY.** The Nyquist auditor can only create/modify test files, fixtures, and VALIDATION.md. If it finds an implementation bug, it ESCALATES — it never fixes implementation code. This is a critical safety boundary.

**Gap type handling:**

| Gap Type | Action |
|----------|--------|
| `no_test_file` | Create test file |
| `test_fails` | Diagnose and fix the test (not implementation) |
| `no_automated_command` | Determine command, update map |

**Debug loop with max 3 iterations:** If a test fails, the auditor gets 3 attempts to fix it. After that, it escalates. This prevents infinite debugging loops.

**Framework-aware test generation:**

| Framework | File Pattern | Runner |
|-----------|-------------|--------|
| pytest | `test_{name}.py` | `pytest {file} -v` |
| jest | `{name}.test.ts` | `npx jest {file}` |
| vitest | `{name}.test.ts` | `npx vitest run {file}` |
| go test | `{name}_test.go` | `go test -v -run {Name}` |

**Behavioral test names, not structural:** `test_user_can_reset_password` (what), not `test_reset_function` (how). This aligns with the system-wide goal-backward philosophy.

**Three return types:** `GAPS FILLED` (all resolved), `PARTIAL` (some resolved, some escalated), `ESCALATE` (none resolved). The orchestrator uses these to determine whether to proceed or loop back.

---

## Group 4: Support Agents

### gsd-codebase-mapper.md (772 lines) — "The Cartographer"

**Spawned by:** `/gsd:map-codebase` orchestrator
**Tools:** Read, Write, Bash, Grep, Glob
**Color:** cyan

The codebase mapper explores an existing codebase and produces documentation in `.planning/codebase/`. It's the "understand what we're working with" agent.

#### Key Design Decisions

**Four focus areas, each with dedicated output files:**

| Focus | Output Files |
|-------|-------------|
| `tech` | STACK.md, INTEGRATIONS.md |
| `arch` | ARCHITECTURE.md, STRUCTURE.md |
| `quality` | CONVENTIONS.md, TESTING.md |
| `concerns` | CONCERNS.md |

**"Be prescriptive, not descriptive."** The output says "Use X pattern" not "X pattern is used." This makes the documentation actionable for the planner and executor rather than merely informational.

**Forbidden files list:** The mapper is explicitly told never to read `.env`, credentials, API keys, or secret files. This is both a security measure and a practical one — these files don't help with architectural understanding.

**Returns brief confirmation, not document contents.** When the mapper finishes, it tells the orchestrator "I wrote STACK.md and INTEGRATIONS.md" — it does NOT return the contents. This reduces context transfer between agents and keeps the orchestrator's context window clean.

**Full templates for all 7 document types.** The mapper has the most detailed output templates of any agent, ensuring consistent documentation structure across projects.

---

### gsd-debugger.md (1257 lines) — "The Detective"

**Spawned by:** `/gsd:debug` orchestrator
**Tools:** Read, Write, Edit, Bash, Grep, Glob
**Color:** red

The second-largest agent at 1257 lines. Debugging is complex enough to warrant extensive instruction.

#### Key Design Decisions

**Scientific method debugging.** The debugger follows a formal hypothesis → test → conclude cycle. It doesn't just try fixes — it forms hypotheses about root causes, designs tests to verify or eliminate them, and tracks evidence.

**Philosophy section on meta-debugging:** The debugger has a unique section about debugging your own code — recognizing cognitive biases (anchoring, confirmation bias, sunk cost), knowing when to restart an investigation, and the "rubber duck" technique.

**Investigation techniques catalog:**

- Binary search (narrow down the cause by halving the problem space)
- Rubber duck (explain the problem to expose assumptions)
- Minimal reproduction (strip away everything non-essential)
- Working backwards (start from the error, trace causation chain)
- Differential debugging (what changed between working and broken?)
- Git bisect (find the exact commit that introduced the bug)
- Comment-out-everything (remove code until it works, add back until it breaks)

**Persistent debug file protocol.** Debug sessions survive context resets via files at `.planning/debug/`. Each debug session has:

- **Current Focus** (mutable — overwritten as investigation progresses)
- **Symptoms** (immutable after gathering phase — locked evidence)
- **Eliminated** (append-only — hypotheses proven wrong)
- **Evidence** (append-only — discovered facts)
- **Resolution** (overwritten when solution found)

This file structure means if the AI agent loses context mid-debug (which happens), it can reload the debug file and resume where it left off.

**Status transitions:** `gathering → investigating → fixing → verifying → awaiting_human_verify → resolved`

**Two operating modes:**

- `find_root_cause_only` — Diagnose, don't fix. Useful when the user wants to understand before deciding on a fix.
- `find_and_fix` (default) — Full cycle: find the bug, fix it, verify the fix.

**Human verification checkpoint required before marking resolved.** The debugger can't self-certify its fix. A human must confirm the bug is actually fixed. This prevents false-positive resolution.

---

## Cross-Cutting Patterns

### Pattern 1: The Orchestrator Contract

Every agent follows the same communication pattern with orchestrators:

1. **Receive context** via `<files_to_read>` block
2. **Load context** using Read tool (mandatory first action)
3. **Execute workflow** per `<execution_flow>`
4. **Return structured result** per `<structured_returns>` with status header (`## PHASE VERIFIED`, `## PLAN CREATED`, etc.)

The return headers are parseable by orchestrators to determine next steps. This is the inter-agent communication protocol.

### Pattern 2: File-Based Context Transfer

Agents don't pass context to each other directly. They write files, and downstream agents read those files:

```
project-researcher → .planning/research/STACK.md → synthesizer → .planning/research/SUMMARY.md → roadmapper
roadmapper → .planning/ROADMAP.md → planner
planner → .planning/phases/N/PLAN.md → plan-checker → executor
executor → .planning/phases/N/SUMMARY.md → verifier
```

Files are the message bus. This is robust against context loss — if an agent crashes, its output files persist.

### Pattern 3: Goal-Backward Thinking

Multiple agents apply the same methodology:

- **Roadmapper:** "What must be TRUE for users when this phase completes?"
- **Planner:** "What must be TRUE when this plan completes?" (must-haves)
- **Plan-checker:** "Will this plan make those truths TRUE?"
- **Verifier:** "ARE those truths TRUE?"

The same question at four levels creates a verification chain: intent → plan → pre-check → post-check.

### Pattern 4: Read-Only Verification

Verification agents (verifier, plan-checker, integration-checker) are deliberately given no write access to implementation files. They observe and report. This prevents a quality gate from accidentally becoming a fixer — which would hide problems rather than surfacing them.

The Nyquist auditor is a partial exception: it can write test files but NOT implementation files. Implementation bugs are escalated, never fixed.

### Pattern 5: Confidence and Honesty

Research agents carry an explicit confidence framework (HIGH/MEDIUM/LOW) tied to source quality. The system philosophy states:

- "I couldn't find X" is valuable
- "LOW confidence" is valuable
- "Sources contradict" is valuable
- Never pad findings or hide uncertainty

This anti-hallucination discipline is enforced at the prompt level, not the code level.

### Pattern 6: Anti-Enterprise

The roadmapper's "If it sounds like corporate PM theater, delete it" philosophy permeates the system. No sprints, no stakeholders, no resource allocation, no Gantt charts, no change management. The entire system is designed for one person + one AI building software together.

---

## Data Flow: The Complete Pipeline

```
                    ┌─────────────────┐
                    │   User Request   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Orchestrator    │ (CJS layer — see Layer 3)
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
    │ Researcher ×4 │ │ Researcher │ │ Researcher │  (parallel)
    │   (STACK)     │ │ (FEATURES) │ │  (ARCH)   │
    └─────────┬─────┘ └─────┬─────┘ └─────┬─────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │   Synthesizer    │ (merges research, commits)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Roadmapper     │ (creates ROADMAP.md + STATE.md)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Phase Researcher │ (optional, per-phase)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    Planner       │ (creates PLAN.md)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Plan Checker    │ (pre-execution quality gate)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    Executor      │ (builds code, per-task commits)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    Verifier      │ (post-execution quality gate)
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───┐  ┌──────▼──────┐  ┌───▼──────────┐
     │  Nyquist   │  │ Integration │  │   Debugger   │
     │  Auditor   │  │  Checker    │  │  (on failure) │
     └────────────┘  └─────────────┘  └──────────────┘
```

---

## Connection to Layer 3 (State Machine)

The agent layer sits on top of the state machine layer:

| State Machine Concept | Agent Layer Manifestation |
|----------------------|--------------------------|
| `executing` state | Executor agent running |
| `checkpoint_pending` | Executor hits checkpoint, returns Pattern B |
| `verifying` state | Verifier agent running |
| `phase_complete` | Verifier returns `## PHASE VERIFIED` with all green |
| `needs_replanning` | Verifier returns gaps, orchestrator spawns planner in gap-closure mode |
| Phase transitions | Orchestrator reads ROADMAP.md for next phase |
| STATE.md updates | Executor's commit tool auto-updates STATE.md |
| Frontmatter parsing | `frontmatter.cjs` parses agent `.md` files to extract tools, skills, color |

The agents don't know about the state machine. They just follow their prompts and return structured results. The orchestrator + state machine interprets those results and drives transitions.

---

## What Makes This Architecture Unusual

1. **Agents are documents, not code.** The entire behavioral layer is markdown. You can read an agent's complete behavior by reading its `.md` file. There's no hidden logic.

2. **File system as message bus.** Agents communicate through files, not function calls or message queues. This makes the system observable (check the file system to see what happened) and resilient (files survive agent crashes).

3. **Adversarial verification.** The verifier is explicitly told to distrust the executor's claims. The plan-checker doesn't trust the planner's scope estimates. This builds in checks against AI overconfidence.

4. **Prompt engineering as architecture.** The system's sophistication lives in prompt design, not code complexity. The CJS layer (Layer 3) is relatively simple — state machine, file parsing, process spawning. The agents carry the intelligence.

5. **Solo developer optimization.** Every design decision assumes one human + one AI. This removes entire categories of complexity (coordination, communication, resource allocation) and lets the system focus on the actual work.
