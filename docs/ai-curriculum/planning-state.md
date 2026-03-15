# Planning & State

Understand how GSD structures projects with planning artifacts -- from PROJECT.md through milestones.

## Lesson 1: The Planning Directory

**Objective:** Understand GSD's .planning/ directory structure and the lifecycle of planning artifacts from project definition through milestone completion

Every GSD project has a .planning/ directory. It is the project's institutional memory -- a collection of markdown files that track decisions, state, and history across the entire lifecycle. Unlike code files that define behavior, these artifacts define intent and progress. GSD's planning system works because AI agents can read and write structured markdown. Each artifact follows a predictable format with YAML frontmatter and markdown sections, making them both human-readable and machine-parseable.

```text
.planning/
  PROJECT.md          # What this project is and why
  REQUIREMENTS.md     # What we need to build
  ROADMAP.md          # Phases, milestones, ordering
  STATE.md            # Where we are right now
  config.json         # GSD configuration
  phases/             # Per-phase execution records
    01-feature-name/
      01-01-PLAN.md
      01-01-SUMMARY.md
  codebase/           # Auto-generated code maps
  learn/              # Learning progress (you!)
```

The four highlighted files are the core planning artifacts. Together they form a pipeline where each artifact feeds into the next. PROJECT.md defines the what and why -- the project's purpose, audience, and core value. REQUIREMENTS.md breaks that purpose into measurable items with unique IDs. ROADMAP.md sequences those requirements into phases with dependencies. STATE.md tracks live execution position, velocity metrics, and accumulated decisions. This is not waterfall -- these are living documents that update as understanding grows.

```text
/gsd:kickoff            Creates PROJECT.md
      |
      v
/gsd:requirements       Creates REQUIREMENTS.md
      |                   (maps to PROJECT.md scope)
      v
/gsd:roadmap            Creates ROADMAP.md
      |                   (phases from requirements)
      v
/gsd:plan-phase         Creates PLAN.md files
      |                   (tasks from phase goals)
      v
/gsd:execute-phase      Creates SUMMARY.md files
      |                   (records what happened)
      v
/gsd:complete-milestone   Archives & tags
```

Here is the key insight: each command reads from previous artifacts and writes new ones. /gsd:requirements reads PROJECT.md to understand scope. /gsd:roadmap reads REQUIREMENTS.md to know what to sequence into phases. /gsd:plan-phase reads ROADMAP.md to know the phase goal, then produces PLAN.md files with concrete tasks. /gsd:execute-phase reads those plans and produces SUMMARY.md files recording what happened. This chain of reads creates full traceability -- you can always trace a task back through its plan, phase, requirement, and ultimately the project goal that spawned it.

Phase execution follows a five-step cycle. First, an optional discuss step gathers context about the domain. Second, an optional research step investigates technical approaches. Third, the plan step creates PLAN.md files with typed tasks, verification commands, and done criteria. Fourth, the execute step runs each task, commits atomically, and produces SUMMARY.md files. Fifth, a verify step checks must-haves against reality. Each phase directory accumulates these records, building a complete audit trail of what was planned versus what actually happened.

```text
phases/12-module-3-infrastructure/
  12-01-PLAN.md       # What to build
  12-01-SUMMARY.md    # What was built
  12-02-PLAN.md       # Next plan
  12-02-SUMMARY.md    # Its record
  12-VERIFICATION.md  # Phase verification
```

---

## Lesson 2: PROJECT.md: The Identity Card

**Objective:** Understand PROJECT.md anatomy -- its six sections, how Core Value drives prioritization, and how this artifact feeds all downstream planning

PROJECT.md is the project's identity card. It's created by /gsd:kickoff and is the FIRST artifact in any GSD project. Everything downstream -- REQUIREMENTS.md, ROADMAP.md, STATE.md, and every plan file -- traces back to what PROJECT.md defines. It answers three questions: What is this? Why does it matter? What are the boundaries? Every GSD project starts here, and the document lives at .planning/PROJECT.md throughout the project's lifecycle.

```markdown
## What This Is

[Current accurate description -- 2-3 sentences.
What does this product do and who is it for?
Use the user's language and framing.
Update whenever reality drifts from this description.]

## Core Value

[The ONE thing that matters most.
If everything else fails, this must work.
One sentence that drives prioritization when tradeoffs arise.]
```

Core Value is the tiebreaker. When two features compete for priority, Core Value decides. When scope creeps, Core Value is the filter. It's one sentence -- not a paragraph, not a list. The discipline of one sentence forces clarity. For example, if Core Value is "Users can find products in under 3 seconds", that tells you search performance beats visual polish every time. If a designer wants a richer product page but it slows search results, Core Value has already made the call.

```markdown
## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet -- ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] [Requirement 1]
- [ ] [Requirement 2]
- [ ] [Requirement 3]

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- [Exclusion 1] -- [why]
- [Exclusion 2] -- [why]
```

The three-tier requirements structure tracks lifecycle, not just current state. "Active" is what you're building now -- these are hypotheses until shipped. "Validated" is what shipped and users confirmed works -- these are locked. "Out of Scope" includes reasoning so you don't re-add things you already decided against. Requirements flow from Active to Validated as you ship, and from Active to Out of Scope when you cut. This movement is tracked, creating a history of what was built, what worked, and what was deliberately excluded.

```markdown
## Context

[Background information that informs implementation:
- Technical environment or ecosystem
- Relevant prior work or experience
- User research or feedback themes
- Known issues to address]

## Constraints

- **[Type]**: [What] -- [Why]
- **[Type]**: [What] -- [Why]

Common types: Tech stack, Timeline, Budget,
Dependencies, Compatibility, Performance, Security

## Key Decisions

<!-- Decisions that constrain future work. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| [Choice] | [Why]     | [Good / Revisit / Pending] |
```

Key Decisions is institutional memory. When Claude or a future developer asks "why did we do X?", the answer lives here -- not in someone's head, not in a Slack thread. The table captures WHAT was decided, WHY (the rationale), and the OUTCOME (whether it proved correct, needs revisiting, or is still pending evaluation). This prevents relitigating settled decisions and gives context to anyone reading the project cold. Constraints serve a similar purpose: they document hard limits on implementation so no one wastes time exploring solutions that violate known boundaries.

PROJECT.md updates when: scope changes (requirements added or removed), reality drifts from the description ("What This Is" becomes inaccurate), key decisions are made, or constraints change. The /gsd:kickoff command creates it, but every phase can update it. After each phase transition, GSD checks: Were requirements invalidated? Move to Out of Scope with a reason. Were requirements validated? Move to Validated with a phase reference. After each milestone, there's a full review -- is Core Value still the right priority? Are Out of Scope reasons still valid? The template guidance comments visible in the code blocks above tell you WHEN and HOW to update each section.

PROJECT.md feeds every downstream artifact. REQUIREMENTS.md expands the Active requirements into detailed, traceable items with IDs and acceptance criteria. ROADMAP.md sequences those requirements into phases and milestones. STATE.md references PROJECT.md for current focus and core value -- it's the first thing Claude reads to understand project context. Even plan verification connects back: must_haves in plan files trace to whether they serve the Core Value. The chain is PROJECT.md -> REQUIREMENTS.md -> ROADMAP.md -> phase plans -> STATE.md, with PROJECT.md as the root that everything else derives from.

---

## Lesson 3: Requirements and Roadmap: From Goals to Phases

**Objective:** Understand how REQUIREMENTS.md breaks project goals into trackable items with IDs and how ROADMAP.md sequences those requirements into executable phases -- including the traceability chain that connects every task back to a project goal

In the previous lesson, PROJECT.md defined what your project is, its Core Value, and its active requirements. But those requirements are just checkboxes -- they don't tell you HOW to verify them, WHEN to build them, or how to track whether they're done. REQUIREMENTS.md breaks project goals into individually trackable items with unique IDs. ROADMAP.md sequences those items into phases with success criteria. Together, they create a traceability chain: every task traces back to a requirement, and every requirement traces back to Core Value. Nothing gets built without a reason, and nothing gets forgotten.

```markdown
# Requirements: [Project Name]

**Defined:** [date]
**Core Value:** [from PROJECT.md]

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User receives email verification after signup
- [ ] **AUTH-03**: User can reset password via email link
- [ ] **AUTH-04**: User session persists across browser refresh

### [Category 2]

- [ ] **[CAT]-01**: [Requirement description]
- [ ] **[CAT]-02**: [Requirement description]

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### [Category]

- **[CAT]-01**: [Requirement description]
- **[CAT]-02**: [Requirement description]

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| [Feature] | [Why excluded] |
| [Feature] | [Why excluded] |
```

Each requirement gets a unique ID in the format [CATEGORY]-[NUMBER] -- AUTH-01, CONT-02, SOCL-03. Requirements are user-centric ("User can..."), testable (you can verify it works), and atomic (one checkable thing). The three-section structure -- v1, v2, Out of Scope -- is a scope management tool. v1 requirements are committed scope: they WILL appear in the roadmap. v2 requirements are acknowledged but deferred: they won't be in the current roadmap, but they're not forgotten. Out of Scope items are explicitly excluded WITH reasoning, so no one re-adds them without understanding why they were cut. You can't add something to v1 without removing something else or promoting from v2 -- the structure enforces discipline.

```markdown
## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| [REQ-ID] | Phase [N] | Pending |

**Coverage:**
- v1 requirements: [X] total
- Mapped to phases: [Y]
- Unmapped: [Z]
```

The traceability table is the bridge between requirements and the roadmap. Every v1 requirement maps to exactly one phase. If a requirement is unmapped, that's a gap in your roadmap -- work that needs doing but has no home. Status flows as phases execute: Pending means not started, In Progress means the phase is active, Complete means the requirement has been verified. This creates an audit trail. You can always answer two questions: "Which requirement drove this work?" (look at the phase's requirement list) and "Is this requirement satisfied?" (check the status column). The traceability table is populated during roadmap creation and updated after each phase completes.

```markdown
### Phase 1: [Name]
**Goal**: [What this phase delivers]
**Depends on**: Nothing (first phase)
**Requirements**: [REQ-01, REQ-02, REQ-03]
**Success Criteria** (what must be TRUE):
  1. [Observable behavior from user perspective]
  2. [Observable behavior from user perspective]
  3. [Observable behavior from user perspective]
**Plans**: [Number of plans]

Plans:
- [ ] 01-01: [Brief description of first plan]
- [ ] 01-02: [Brief description of second plan]
- [ ] 01-03: [Brief description of third plan]

### Phase 2: [Name]
**Goal**: [What this phase delivers]
**Depends on**: Phase 1
**Requirements**: [REQ-04, REQ-05]
**Success Criteria** (what must be TRUE):
  1. [Observable behavior from user perspective]
  2. [Observable behavior from user perspective]
**Plans**: [Number of plans]
```

Each phase in ROADMAP.md is the execution unit. The Goal is outcome-shaped, not task-shaped -- "Users can authenticate and maintain sessions" rather than "Build login page." Dependencies declare ordering. Requirements list the REQ-IDs this phase satisfies (connecting back to REQUIREMENTS.md). Success Criteria are 2-5 observable behaviors from the user's perspective -- things you can see and verify. These success criteria flow downstream into must_haves in plan files and are checked after execution during phase verification. Plans break the phase into concrete work units. A phase might have 1-3 plans depending on scope, and each plan becomes a PLAN.md file with specific tasks.

```markdown
## Milestones

- ✅ **v1.0 MVP** - Phases 1-4 (shipped YYYY-MM-DD)
- 🚧 **v1.1 [Name]** - Phases 5-6 (in progress)
- 📋 **v2.0 [Name]** - Phases 7-10 (planned)

<details>
<summary>✅ v1.0 MVP (Phases 1-4) - SHIPPED YYYY-MM-DD</summary>

### Phase 1: [Name]
**Goal**: [What this phase delivers]
**Plans**: 3 plans

Plans:
- [x] 01-01: [Brief description]
- [x] 01-02: [Brief description]
- [x] 01-03: [Brief description]

</details>

### 🚧 v1.1 [Name] (In Progress)

**Milestone Goal:** [What v1.1 delivers]
```

Milestones group phases into shippable units. The emoji status indicators show progress at a glance: completed milestones are marked with a checkmark and collapsed inside details tags so they don't clutter the view, the current milestone stays expanded with an in-progress indicator, and future milestones show as planned. Phase numbering is continuous across milestones (never restart at 01) and uses integers for planned work and decimals (2.1, 2.2) for urgent insertions. The Progress table at the bottom tracks plan completion counts and status for every phase, giving a dashboard view of the entire project.

The full traceability chain runs: PROJECT.md Core Value -> REQUIREMENTS.md categories with IDs -> ROADMAP.md phases with success criteria -> PLAN.md tasks with must_haves. Each link is traceable in both directions. When a task is verified as complete, you can trace it back: this task belongs to this plan, which serves this phase, which satisfies these requirements, which deliver this Core Value. Going the other direction: this Core Value needs these requirements, which are scheduled in these phases, which are broken into these plans, which contain these tasks. Nothing gets built that doesn't serve the project goal. Nothing gets forgotten because every requirement is mapped to a phase. And when priorities shift, you can see exactly what's affected by tracing the chain. Now that you see how requirements become phases, the next lesson covers what happens INSIDE a phase -- the execution cycle of planning, executing, and verifying.

---

## Lesson 4: Inside a Phase: Plan, Execute, Verify

**Objective:** Understand the five-step phase execution cycle, PLAN.md anatomy (frontmatter and task XML), and how SUMMARY.md and VERIFICATION.md create an audit trail from goal to shipped code

In Lesson 3, you saw how requirements become phases in the roadmap -- each phase groups related requirements into a deliverable chunk of work. But what happens when a phase actually starts? Each phase follows a five-step execution cycle: discuss (optional context gathering with the user), research (optional technical investigation), plan (create PLAN.md files), execute (run tasks, produce SUMMARY.md files), and verify (check must_haves against reality). Not all steps are required -- simple phases skip discuss and research, jumping straight to planning. The three mandatory steps are plan, execute, and verify. This cycle ensures every phase produces not just code, but an audit trail proving the code achieves its goal.

```text
/gsd:discuss-phase  (optional)
       |
       v
/gsd:research-phase (optional)
       |
       v
/gsd:plan-phase     -> PLAN.md files
       |
       v
/gsd:execute-phase  -> SUMMARY.md files
       |
       v
/gsd:verify-phase   -> VERIFICATION.md
```

PLAN.md is the execution blueprint. Each phase produces 1-3 PLAN.md files, each containing 2-3 tasks. Plans have YAML frontmatter for machine-readable metadata and XML task blocks for specific implementation instructions. The key insight: plans are prompts -- they contain enough context and specificity that Claude can execute without asking clarifying questions. A well-written plan is a complete instruction set. If a different Claude instance couldn't execute it cold, the plan isn't specific enough.

```markdown
---
phase: XX-name
plan: NN
type: execute
wave: N                     # Execution wave (1, 2, 3...). Pre-computed at plan time.
depends_on: []              # Plan IDs this plan requires (e.g., ["01-01"]).
files_modified: []          # Files this plan modifies.
autonomous: true            # false if plan has checkpoints requiring user interaction
requirements: []            # Requirement IDs from ROADMAP this plan addresses.

# Goal-backward verification (derived during planning, verified after execution)
must_haves:
  truths: []                # Observable behaviors that must be true for goal achievement
  artifacts: []             # Files that must exist with real implementation
  key_links: []             # Critical connections between artifacts
---
```

Each frontmatter field serves a specific purpose. wave is the execution order -- wave 1 plans run in parallel, wave 2 waits for all wave 1 plans to finish. depends_on lists which specific plans must complete first, enabling fine-grained sequencing. files_modified declares exclusive file ownership, preventing merge conflicts when plans run in parallel. autonomous indicates whether the plan needs human checkpoints (visual verification, decisions) or can run fully unattended. requirements traces back to REQUIREMENTS.md IDs, maintaining traceability from code to business need. And must_haves is the goal-backward verification criteria: truths are observable behaviors that must be true, artifacts are files that must exist with real implementation (not stubs), and key_links are critical connections between artifacts that must be wired.

```xml
<task type="auto">
  <name>Task 1: Create User API endpoints</name>
  <files>src/features/user/api.ts</files>
  <action>GET /users (list), GET /users/:id (single), POST /users (create).
  Use User type from model. Validate email format on POST -- reject
  malformed emails with 400 status because downstream services
  assume valid email addresses.</action>
  <verify>curl tests pass for all endpoints</verify>
  <done>All CRUD operations work, invalid emails return 400</done>
</task>
```

Each task element has five children. name is action-oriented ("Create X", "Wire Y", "Add Z"). files lists exact paths this task modifies -- no ambiguity. action has specific implementation instructions including what to do, how to do it, and what to avoid and WHY (the "why" prevents future developers from removing safeguards they don't understand). verify has an automated command proving the task works -- not "check that it works" but a concrete command like "curl localhost:3000/users returns 200". done is measurable acceptance criteria -- the definition of complete. The specificity test: could a different Claude instance execute this task without asking clarifying questions? Task types include auto (fully autonomous), checkpoint:human-verify (pauses for human visual confirmation), and checkpoint:decision (pauses for human to choose between options).

```markdown
---
phase: XX-name
plan: YY
subsystem: [primary category: auth, payments, ui, api, database, infra, testing]
tags: [searchable tech: jwt, stripe, react, postgres, prisma]

# Dependency graph
requires:
  - phase: [prior phase this depends on]
    provides: [what that phase built that this uses]
provides:
  - [bullet list of what this phase built/delivered]
affects: [list of phase names or keywords that will need this context]

# Tech tracking
tech-stack:
  added: [libraries/tools added in this phase]
  patterns: [architectural/code patterns established]

key-files:
  created: [important files created]
  modified: [important files modified]

key-decisions:
  - "Decision 1"
  - "Decision 2"

requirements-completed: []  # Requirement IDs satisfied by this plan

# Metrics
duration: Xmin
completed: YYYY-MM-DD
---
```

SUMMARY.md is the execution record: what was built, how long it took, what decisions were made, and what deviated from the plan. But the frontmatter is where the real power lies. The dependency graph (requires/provides/affects) enables automatic context assembly -- when planning future phases, GSD scans all summaries and selects relevant ones based on what they provide and what the new phase needs. This means plans get the right context without manual curation. requirements-completed traces back to REQUIREMENTS.md IDs, closing the traceability loop: a requirement in PROJECT.md flows to REQUIREMENTS.md, gets sequenced in ROADMAP.md, gets addressed in PLAN.md, and is marked complete in SUMMARY.md. The chain is unbroken from intent to delivery.

VERIFICATION.md is the phase audit. After all plans in a phase execute, /gsd:verify-phase checks the must_haves from every plan against reality. It asks three questions: Are observable truths actually true? (Can the user really send a message, or does the button just log to console?) Do required artifacts exist with real implementation? (Is the API route substantive code or a stub returning hardcoded data?) Are key links wired? (Does the frontend actually call the backend, or do both exist in isolation?) Each check gets a status: VERIFIED, FAILED, or UNCERTAIN. The overall status is passed (all clear), gaps_found (critical issues remain), or human_needed (automated checks pass but visual confirmation required). If gaps are found, GSD generates fix plans -- targeted PLAN.md files that address specific gaps -- and the cycle repeats until verification passes. This is the safety net that catches the difference between "tasks completed" and "goal achieved".

---

## Lesson 5: State Tracking & Milestone Lifecycle

**Objective:** Understand STATE.md as the project's living memory that persists context across sessions, and the milestone lifecycle from completion through archival, version tagging, and retrospective

In Lesson 4, you saw how phases execute -- from PLAN.md blueprint through SUMMARY.md record to VERIFICATION.md audit. But what ties all those sessions and phases together? STATE.md is the project's short-term memory -- a single small file read first in every workflow and updated after every significant action. The problem it solves: information captured in summaries, issues, and decisions isn't systematically consumed. Each new session starts without context. STATE.md enables instant session restoration by keeping a living digest of where you are, what's been decided, and what's blocking progress. The key constraint: keep it under 100 lines. It's a digest, not an archive.

```markdown
# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** Real-time sync that feels instant
**Current focus:** v1.1 Security & Polish -- Phase 5

## Current Position

Phase: 5 of 6 (Security Audit)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-03-10 -- Completed Keychain migration

Progress: [██████░░░░] 62%

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 3.5 min
- Total execution time: 0.5 hours

## Accumulated Context

### Decisions

- Phase 3: Used Canvas API over SVG for drawing performance
- Phase 5: Keychain storage for API keys (not UserDefaults)

### Blockers/Concerns

- 3 pre-existing test failures (non-blocking)

## Session Continuity

Last session: 2026-03-10 14:30
Stopped at: Completed 05-01 Keychain migration plan
Resume file: None
```

STATE.md has a strict lifecycle. It's created after ROADMAP.md during project initialization. From then on, it's read first in every workflow -- /gsd:progress reads it to present status, /gsd:plan-phase reads it to inform planning decisions, /gsd:execute-phase reads it to know the current position, and /gsd:transition-phase reads it to know what's complete. It's written after every significant action: after a SUMMARY.md is created, STATE.md updates position, notes new decisions, and adds blockers. After a phase completes, it updates the progress bar, clears resolved blockers, and refreshes the Project Reference date. This is what makes context persist across sessions -- without it, every session starts from scratch.

When all phases in a milestone are complete, the complete-milestone workflow handles the shipping process. It creates a MILESTONES.md entry with stats and accomplishments, performs a full PROJECT.md evolution review (validating 'What This Is', verifying core value, moving shipped requirements to Validated, auditing Out of Scope items, updating context, and adding decisions with outcomes). It archives ROADMAP.md and REQUIREMENTS.md to a milestones/ directory, creates a git tag for the release, and writes a retrospective. This is how institutional memory is preserved -- nothing is lost, but working documents stay constant-size.

```markdown
## v1.0 MVP (Shipped: 2025-11-25)

**Delivered:** Menu bar weather app with current conditions and 3-day forecast

**Phases completed:** 1-4 (7 plans total)

**Key accomplishments:**
- Menu bar app with popover UI (AppKit)
- OpenWeather API integration with auto-refresh
- Current weather display with conditions icon
- 3-day forecast list with high/low temperatures
- Code signed and notarized for distribution

**Stats:**
- 47 files created
- 2,450 lines of Swift
- 4 phases, 7 plans, 28 tasks
- 12 days from start to ship

**Git range:** `feat(01-01)` -> `feat(04-01)`

**What's next:** Security audit and hardening for v1.1
```

When a milestone completes, the archival process preserves full history while keeping working documents constant-size. Three things happen: (1) ROADMAP.md is archived to milestones/vX.Y-ROADMAP.md and the completed milestone's phases are collapsed into a details/summary tag in the active ROADMAP, so they're still accessible but don't clutter the view. (2) REQUIREMENTS.md is archived to milestones/vX.Y-REQUIREMENTS.md and then deleted -- the next milestone starts with a fresh requirements file, keeping it scoped to current work. (3) PROJECT.md gets a full evolution review -- validate 'What This Is' still describes the product, verify core value hasn't shifted, move all shipped requirements to Validated, audit Out of Scope reasoning, update context with current codebase state, and add key decisions with outcomes. This prevents the planning documents from growing unbounded while preserving everything in the archive.

```markdown
# Roadmap: WeatherBar

## Milestones

- v1.0 MVP -- Phases 1-4 (shipped 2025-11-25)
- v1.1 Security -- Phases 5-6 (in progress)
- v2.0 Redesign -- Phases 7-10 (planned)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-4) -- SHIPPED 2025-11-25</summary>

- [x] Phase 1: Foundation (2/2 plans) -- completed 2025-11-15
- [x] Phase 2: Authentication (2/2 plans) -- completed 2025-11-18
- [x] Phase 3: Core Features (3/3 plans) -- completed 2025-11-22
- [x] Phase 4: Polish (1/1 plan) -- completed 2025-11-25

</details>

### v1.1 Security (In Progress)

- [ ] Phase 5: Security Audit (2 plans)
- [ ] Phase 6: Hardening (1 plan)
```

RETROSPECTIVE.md is a living document updated after each milestone. It captures What Was Built, What Worked, What Was Inefficient, Patterns Established, Key Lessons, and Cost Observations. But its real power is the Cross-Milestone Trends section -- tables that track process evolution (how many sessions, what changed in the process), cumulative quality (tests, coverage), and top lessons verified across multiple milestones. A lesson that appears once might be situational. A lesson that appears in three milestones is a proven pattern. The retrospective feeds forward into future planning: if 'keeping STATE.md under 100 lines improved velocity' shows up as a verified lesson, that constraint gets baked into future milestone planning.

```markdown
## Milestone: v1.0 -- MVP

**Shipped:** 2025-11-25
**Phases:** 4 | **Plans:** 7

### What Was Built
- Menu bar weather app with popover UI
- OpenWeather API integration with auto-refresh
- Code signing and notarization pipeline

### What Worked
- Phase-level planning prevented scope creep
- TDD on API layer caught 3 integration bugs early

### What Was Inefficient
- Phase 3 plans were too large (4 tasks each)
- Spent time on custom icons before validating UX

### Patterns Established
- Max 3 tasks per plan for maintainable execution
- Visual verification checkpoints after UI phases

### Key Lessons
1. Smaller plans execute faster than larger ones
2. Verify UX before polishing visuals

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Key Change              |
|-----------|--------|-------------------------|
| v1.0      | 4      | Established GSD cadence |

### Top Lessons (Verified Across Milestones)

1. Smaller plans (2-3 tasks) consistently outperform larger ones
```

STATE.md and milestones are bookends of the execution cycle. STATE.md is the 'where are we now' -- live, updated constantly, read every session, kept small. Milestones are the 'where have we been' -- archived, immutable once shipped, referenced when needed for patterns and decisions. Together they solve the biggest problem in long-running AI-assisted projects: context loss. STATE.md ensures no session starts cold. Milestones ensure no lesson is forgotten. The retrospective feeds patterns forward. And the archival process keeps working documents from growing unbounded. In the next lesson, we'll bring everything together -- PROJECT.md, REQUIREMENTS.md, ROADMAP.md, PLAN.md, SUMMARY.md, STATE.md, and milestones -- into one connected mental model, and prepare you for the mini-project where you'll create your own planning artifacts.

---

## Lesson 6: From Idea to Shipped Milestone

**Objective:** Synthesize all planning concepts into one connected mental model and understand how GSD artifacts create persistent institutional memory across sessions, preparing you for the mini-project

You've now seen every planning artifact GSD produces. Let's trace a complete project lifecycle from idea to shipped milestone, seeing how each artifact feeds the next. The key insight: these aren't independent documents -- they form a chain where each artifact's output becomes the next artifact's input. PROJECT.md feeds REQUIREMENTS.md, which feeds ROADMAP.md, which feeds PLAN.md, which produces SUMMARY.md, which updates STATE.md, which tracks progress toward milestones. This chain is what makes GSD work for long-running projects where context would otherwise be lost between sessions.

```text
Idea -> /gsd:kickoff
         |
    PROJECT.md (What & Why) -- feeds -> Core value, constraints, context
         |
    REQUIREMENTS.md (What to build) -- feeds -> REQ-IDs, categories, scope
         |
    ROADMAP.md (When & order) -- feeds -> Phases, milestones, dependencies
         |
    For each phase:
         |
    PLAN.md (How to build) -- feeds -> Tasks, file ownership, must_haves
         |
    SUMMARY.md (What happened) -- feeds -> Decisions, patterns, issues
         |
    STATE.md (Where are we) -- feeds -> Position, velocity, blockers
         |
    When all phases complete:
         |
    /gsd:complete-milestone -> MILESTONES.md, archives, git tag
         |
    RETROSPECTIVE.md -- feeds -> Lessons for next milestone
```

Let's make this concrete. Imagine you're building a CLI tool for fast file search. You run /gsd:kickoff, which creates PROJECT.md capturing your core value ("fast file search across large codebases"), constraints ("must work on Windows and Linux"), and non-goals ("not a full IDE"). From PROJECT.md, /gsd:requirements creates REQUIREMENTS.md with REQ-IDs like SEARCH-01 ("index local files by content"), SEARCH-02 ("support regex patterns"), SEARCH-03 ("parse boolean queries"). From requirements, /gsd:roadmap creates ROADMAP.md grouping them into phases: Phase 1 (index engine, SEARCH-01), Phase 2 (query parser, SEARCH-02 and SEARCH-03), Phase 3 (CLI interface). Each requirement traces to exactly one phase.

Phase 1 starts: /gsd:plan-phase creates PLAN.md with 2 tasks (create index data structure, implement file walker). /gsd:execute-phase runs both tasks, producing SUMMARY.md recording what was built (B-tree index, recursive walker), decisions made (chose mmap for large files), and patterns established (streaming reads for memory safety). STATE.md updates: "Phase 1 of 3, 1/1 plans complete." Phase 2 follows the same cycle -- plan, execute, verify. Its SUMMARY.md references Phase 1's decisions: "Uses B-tree index from Phase 1, added regex support via streaming match." After Phase 3, all requirements are met. The traceability chain is unbroken: SEARCH-01 in REQUIREMENTS.md maps to Phase 1 in ROADMAP.md, addressed in Phase 1's PLAN.md, marked complete in Phase 1's SUMMARY.md.

You run /gsd:complete-milestone. It creates a MILESTONES.md entry with stats (3 phases, 4 plans, 8 tasks, 4 days). It archives ROADMAP.md and REQUIREMENTS.md to milestones/v1.0-ROADMAP.md and v1.0-REQUIREMENTS.md -- preserving the historical record while clearing the workspace. It evolves PROJECT.md, moving shipped requirements to Validated and updating context with current state. It creates a git tag v1.0. It writes RETROSPECTIVE.md capturing what worked ("streaming reads avoided memory issues") and what didn't ("should have added regex support earlier -- Phase 3 needed it"). The project is now ready for v1.1, and every decision, trade-off, and lesson learned is preserved in the artifact chain.

The key pattern is artifact persistence. Every GSD artifact solves the same fundamental problem: context loss. PROJECT.md persists the "why" across the entire project lifetime. REQUIREMENTS.md persists the "what" within a milestone. ROADMAP.md persists the "when and order." PLAN.md persists the "how" for each phase. SUMMARY.md persists "what actually happened." STATE.md persists "where we are right now." MILESTONES.md persists "where we've been." RETROSPECTIVE.md persists "what we learned." Without these artifacts, every new session starts from zero -- the developer explains the project again, Claude re-discovers the architecture, and previous decisions get unknowingly reversed. With them, continuity is automatic.

```text
Session start:
  1. Read STATE.md          -> "Phase 2 of 3, plan 1 of 2, last activity: implemented index engine"
  2. Read PROJECT.md        -> Core value, constraints, key decisions
  3. Read ROADMAP.md        -> Phase 2 depends on Phase 1, requirements SEARCH-03, SEARCH-04
  4. Read Phase 1 SUMMARY   -> Index engine uses B-tree, decided on mmap for large files
  5. Read Phase 2 PLAN      -> Task 1: build query parser, Task 2: add regex support

Result: Full context restored in < 30 seconds. No human re-explanation needed.
```

In the mini-project, you'll apply this pattern yourself. You'll extend the skeptic command you built in Module 1 to produce a persistent artifact -- SKEPTIC-REVIEW.md -- that captures findings from each run. On future runs, the workflow will read previous reviews, building continuity across sessions. This is the same read-previous/write-new pattern that STATE.md, SUMMARY.md, and RETROSPECTIVE.md all use. You're not learning a new concept -- you're applying the one pattern that makes GSD work: artifacts that persist context so the next session doesn't start from zero.

```text
Skeptic workflow (before):        Skeptic workflow (after):
  1. Read codebase                  1. Read previous SKEPTIC-REVIEW.md
  2. Analyze                        2. Read codebase
  3. Print findings                 3. Analyze (with historical context)
  4. (findings lost)                4. Write new SKEPTIC-REVIEW.md
                                    5. Print findings
                                    6. (findings persist for next run)
```

You now understand the complete GSD planning system -- from the first /gsd:kickoff through shipped milestones. The pattern is always the same: capture context in structured artifacts, read them at the start of each session, write updated versions as work progresses. This is how a solo developer and Claude can maintain coherent, long-running projects without losing institutional knowledge. The artifacts aren't bureaucracy -- they're the project's memory. And in the mini-project, you'll build that memory into a workflow yourself. Time to put it into practice.

---

## Concept Map

```
  /gsd:kickoff
        |
        v
  +------------------+
  | PROJECT.md       |
  | (What & Why)     |
  +------------------+
        |
        v
  +------------------+
  | REQUIREMENTS.md  |
  | (What to build)  |
  +------------------+
        |
        v
  +------------------+
  | ROADMAP.md       |
  | (When & order)   |
  +------------------+
        |
        v
  +------------------+     +------------------+
  | PLAN.md          |---->| SUMMARY.md       |
  | (How to build)   |     | (What happened)  |
  +------------------+     +------------------+
        |
        v
  +------------------+
  | STATE.md         |
  | (Where are we)   |
  +------------------+
        |
        v
  +------------------+
  | Milestone        |
  | (Ship & archive) |
  +------------------+

```

## Mini-Project: Build Persistent Skeptic Reviews

Extend your skeptic workflow to produce persistent SKEPTIC-REVIEW.md artifacts that accumulate institutional knowledge across runs

### Artifacts

#### Skeptic workflow with artifact persistence

**Path:** `~/.claude/get-shit-done/workflows/skeptic.md`

**Verification Checks:**

- [ ] Has purpose section
- [ ] Has process section
- [ ] Reads previous review artifact
- [ ] Writes new review artifact

#### Persistent skeptic review artifact

**Path:** `.planning/SKEPTIC-REVIEW.md`

**Verification Checks:**

- [ ] Has date or timestamp
- [ ] Has findings or observations section

### Hints

<details>
<summary>Hint 1</summary>

Your skeptic workflow currently analyzes a project and prints findings -- then they vanish. The artifact persistence pattern solves this: read what was found before, write what was found now. Think about what your workflow needs to DO differently, not what it needs to SAY.

</details>

<details>
<summary>Hint 2</summary>

Your workflow needs two new steps in its process section: one that reads .planning/SKEPTIC-REVIEW.md if it exists (before analysis), and one that writes findings to .planning/SKEPTIC-REVIEW.md (after analysis). The template from the lesson page shows the pattern -- press C on the lesson to copy it.

</details>

<details>
<summary>Hint 3</summary>

Add a step in your workflow's process section that reads the previous review artifact. It should check if .planning/SKEPTIC-REVIEW.md exists, read its contents for historical context, and use previous findings to inform the current analysis. If the file does not exist yet, the step should note that this is the first review.

</details>

<details>
<summary>Hint 4</summary>

Add a step that writes findings to .planning/SKEPTIC-REVIEW.md. Each run should append a new dated section (like ## 2024-03-15) rather than overwriting. Include findings, observations, and recommendations. The file accumulates over time -- that is what makes it persistent.

</details>

<details>
<summary>Hint 5</summary>

In your workflow at ~/.claude/get-shit-done/workflows/skeptic.md, add two new steps inside the process section. The first step (name it something like read_previous_reviews) reads .planning/SKEPTIC-REVIEW.md for historical context. The second step (name it something like write_review_artifact) writes the current analysis as a new dated section to .planning/SKEPTIC-REVIEW.md. Then run /gsd:skeptic on any project to generate the artifact file. Verify with --verify --module=planning-state.

</details>

