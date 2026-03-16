# Quality & Feedback Loops

Learn how GSD verifies work and closes the feedback loop -- UAT, skeptic reviews, debug workflows, and gap closure cycles.

## Lesson 1: The Quality Lifecycle

**Objective:** Understand the quality lifecycle loop that GSD uses at every level: build -> verify -> diagnose -> fix -> re-verify. This loop is not aspirational -- it is enforced by the workflow structure.

GSD automates execution with agents, but how does it know the output is correct? Completing tasks does not equal achieving goals. A "create chat component" task can pass while producing a placeholder that renders nothing. The component file exists, the task is marked done, but the user cannot send messages. GSD solves this with a quality lifecycle: build -> verify -> diagnose -> fix -> re-verify. This loop runs at every level -- per-task, per-phase, per-milestone. Each level has dedicated workflows that enforce the loop automatically.

```text
<purpose>
Validate built features through conversational testing with persistent
state. Creates UAT.md that tracks test progress, survives /clear, and
feeds gaps into /gsd:plan-phase --gaps.

User tests, Claude records. One test at a time. Plain text responses.
</purpose>
```

That is verify-work -- the entry point to the quality loop. It validates what was built through conversational testing and creates a persistent UAT.md file. But verification happens at a higher level too. After execute-phase completes all plans, verify-phase checks whether the phase GOAL was achieved -- not just whether tasks completed. If gaps are found, diagnose-issues investigates root causes, then plan-phase --gaps creates targeted fix plans, then execute-phase --gaps-only runs them. This is the re-verify cycle: gaps drive new work until the goal is truly met.

```text
<core_principle>
**Task completion \u2260 Goal achievement**

A task "create chat component" can be marked complete when the
component is a placeholder. The task was done -- but the goal
"working chat interface" was not achieved.

Goal-backward verification:
1. What must be TRUE for the goal to be achieved?
2. What must EXIST for those truths to hold?
3. What must be WIRED for those artifacts to function?

Then verify each level against the actual codebase.
</core_principle>
```

Those three questions -- what must be TRUE, what must EXIST, what must be WIRED -- are the goal-backward verification framework. They flip the perspective from "did we do stuff?" to "did we achieve the goal?" At the milestone level, the same pattern repeats: audit-milestone aggregates all phase verifications, checks cross-phase integration, and assesses requirements coverage. If gaps remain, plan-milestone-gaps creates new phases. The loop is the same at every level: check -> diagnose -> fix -> re-check. This is not aspirational -- it is enforced by the workflow structure.

```text
<core_principle>
**Diagnose before planning fixes.**

UAT tells us WHAT is broken (symptoms). Debug agents find WHY
(root cause). plan-phase --gaps then creates targeted fixes based
on actual causes, not guesses.

Without diagnosis: "Comment doesn't refresh" -> guess at fix -> maybe wrong
With diagnosis: "Comment doesn't refresh" -> "useEffect missing dependency" -> precise fix
</core_principle>
```

Without root cause analysis, plan-phase --gaps would create fixes based on symptoms. "Doesn't refresh" might lead to a guess -- add a setTimeout, force a re-render, clear a cache. With diagnosis, debug agents find the actual cause: "useEffect missing dependency in CommentList.tsx." Now plan-phase --gaps creates a precise, targeted fix. This is the difference between guessing and knowing. The quality lifecycle depends on this step -- diagnosis turns symptoms into actionable causes, making the fix cycle converge instead of looping endlessly.

You now know the quality lifecycle: build -> verify -> diagnose -> fix -> re-verify. This loop runs at task level (verify-work tests features), phase level (verify-phase checks goal achievement), and milestone level (audit-milestone checks cross-phase integration). Each level uses the same pattern: check whether the goal was achieved, diagnose why it was not, create targeted fixes, and re-check. Next, we will dive deep into verify-work and UAT -- how GSD conducts conversational testing and creates persistent records that survive context window clears.

---

## Lesson 2: Verify-Work & UAT

**Objective:** Understand how GSD verifies built features through conversational testing with verify-work, how severity is inferred from natural language, and how UAT.md persists testing state across sessions to feed gaps into the fix cycle.

The quality lifecycle starts with verification. But how does GSD actually verify that built features work? Through /gsd:verify-work, which conducts conversational testing. Claude presents what SHOULD happen, and the user confirms or describes what is different. There are no pass/fail buttons, no severity dropdowns, no test forms. Just: "here is what should happen, does it?" The user types naturally and Claude handles the rest -- logging results, inferring severity, tracking progress.

```text
<philosophy>
**Show expected, ask if reality matches.**

Claude presents what SHOULD happen. User confirms or describes
what's different.
- "yes" / "y" / "next" / empty -> pass
- Anything else -> logged as issue, severity inferred

No Pass/Fail buttons. No severity questions. Just: "Here's what
should happen. Does it?"
</philosophy>
```

Notice "severity inferred" on line 6. When the user says "works but doesn't show until I refresh," Claude infers that as a major issue without asking "how severe is this?" The inference follows natural language: crash/error/fails -> blocker, doesn't work/wrong/missing -> major, slow/weird/minor -> minor, color/spacing/alignment -> cosmetic. This keeps the flow conversational. Tests come from what was actually built -- verify-work reads SUMMARY.md files from the completed phase and generates tests from the actual deliverables, not from a test plan written beforehand.

```text
---
status: testing | complete | diagnosed
phase: XX-name
source: [list of SUMMARY.md files tested]
started: [ISO timestamp]
updated: [ISO timestamp]
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: [N]
name: [test name]
expected: |
  [what user should observe]
awaiting: user response

## Tests

### 1. [Test Name]
expected: [observable behavior]
result: [pending]

### 2. [Test Name]
expected: [observable behavior]
result: pass

### 3. [Test Name]
expected: [observable behavior]
result: issue
reported: "[verbatim user response]"
severity: major
```

UAT.md is persistent because Claude's context window gets cleared between sessions -- via /clear or starting a new conversation. Without a persistent file, test progress would be lost. UAT.md acts as the source of truth for testing state. When the user resumes testing, verify-work reads UAT.md and picks up where it left off. The Current Test section is overwritten each time (it always reflects NOW), while Tests entries are append-only. The status field in frontmatter tracks the lifecycle: testing -> complete -> diagnosed.

```text
## Gaps

<!-- YAML format for plan-phase --gaps consumption -->
- truth: "[expected behavior from test]"
  status: failed
  reason: "User reported: [verbatim response]"
  severity: blocker | major | minor | cosmetic
  test: [N]
  root_cause: ""     # Filled by diagnosis
  artifacts: []      # Filled by diagnosis
  missing: []        # Filled by diagnosis
  debug_session: ""  # Filled by diagnosis

## Summary

total: [N]
passed: [N]
issues: [N]
pending: [N]
skipped: [N]
```

This is the critical connection: UAT.md gaps feed directly into /gsd:plan-phase --gaps. Each gap has a truth (what should be true), a reason (what the user observed), and severity. After diagnosis fills in root_cause, artifacts, and missing fields, the planner reads these structured gaps and creates targeted fix plans. This is the loop from Lesson 1 in action: verify-work creates UAT.md -> gaps found -> diagnose-issues finds root causes -> plan-phase --gaps creates fix plans -> execute-phase --gaps-only runs fixes -> verify-work re-tests. The UAT.md file is the bridge between finding problems and fixing them.

Verify-work catches problems AFTER building, and it relies on human observation -- the user tries features and reports what happens. But what about gaps humans miss? What about structural problems invisible in the UI, like a component that renders correctly but fetches from a hardcoded array instead of the API? Next, we will see how verify-phase uses goal-backward analysis and how the plan-checker validates plans before execution -- GSD's built-in skeptic that catches what reactive testing cannot.

---

## Lesson 3: Skeptic Reviews

**Objective:** Understand how GSD uses proactive critical assessment through two mechanisms: verify-phase's goal-backward analysis that questions outcomes after execution, and the plan-checker that validates plans before execution begins.

Verify-work tests AFTER building and relies on human observation. But what about gaps humans miss? What about structural problems invisible in the UI -- a component that renders correctly but fetches from a hardcoded array instead of the real API? GSD has a built-in skeptic: mechanisms that proactively question whether work actually achieves its goals. This skepticism operates at two levels. Verify-phase challenges outcomes after execution: did the goal get achieved? The plan-checker challenges plans before execution: is this plan complete enough to succeed?

```text
Goal-backward verification:
1. What must be TRUE for the goal to be achieved?
2. What must EXIST for those truths to hold?
3. What must be WIRED for those artifacts to function?

Then verify each level against the actual codebase.

must_haves:
  truths:
    - "User can see existing messages"
    - "User can send a message"
    - "Messages persist across refresh"
  artifacts:
    - path: "src/components/Chat.tsx"
      provides: "Message list rendering"
    - path: "src/app/api/chat/route.ts"
      provides: "Message CRUD operations"
  key_links:
    - from: "src/components/Chat.tsx"
      to: "/api/chat"
      via: "fetch in useEffect"
      pattern: "fetch.*api/chat"
```

Goal-backward verification flips the perspective from producer to skeptic. Instead of asking "did all tasks pass?" it asks "what must be TRUE for the goal to be achieved?" A task "create chat component" can be marked done while the component is a placeholder. Goal-backward catches this because the truth "user can send messages" requires actual wiring, not just file existence. The verifier checks that artifacts exist, that they contain substantive implementation (not stubs), and that critical connections between them actually work.

```text
key_links:
  - from: "src/components/Chat.tsx"
    to: "/api/chat"
    via: "fetch in useEffect"
    pattern: "fetch.*api/chat"
  - from: "src/app/api/chat/route.ts"
    to: "prisma.message"
    via: "Prisma query in handler"
    pattern: "prisma\\.message"

Verification checks each key_link:
| Exists | Substantive | Wired | Status     |
|--------|-------------|-------|------------|
| Y      | Y           | Y     | VERIFIED   |
| Y      | Y           | N     | ORPHANED   |
| Y      | N           | -     | STUB       |
| N      | -           | -     | MISSING    |
```

Key links are the critical connections where breakage causes cascading failures. "Chat.tsx fetches from /api/chat via useEffect" -- if that fetch call is missing, the component renders but shows nothing. Key links have regex patterns that the verifier greps for in actual source code. This is not trust-based verification -- it is evidence-based. The verifier reads the actual file and confirms the pattern exists. A file can pass existence checks and even contain substantial code, but if the key link pattern is missing, it is flagged as ORPHANED -- present but not wired.

```text
<quality_gate>
- [ ] PLAN.md files created in phase directory
- [ ] Each plan has valid frontmatter
- [ ] Tasks are specific and actionable
- [ ] Every task has <read_first> with at least the file being modified
- [ ] Every task has <acceptance_criteria> with grep-verifiable conditions
- [ ] Every <action> contains concrete values (no "align X with Y")
- [ ] Dependencies correctly identified
- [ ] Waves assigned for parallel execution
- [ ] must_haves derived from phase goal
</quality_gate>
```

The plan-checker (gsd-plan-checker) reviews plans BEFORE execution starts. It checks: are all requirements covered? Are dependencies correct? Are tasks complete enough to execute without clarification? Does every task have acceptance criteria that can be verified with grep or a test command? Are must_haves derived from the phase goal for goal-backward verification? If the checker finds issues, it sends them back to the planner for revision -- up to three iterations. This prevents the "build first, find out it was wrong later" pattern. Plans are validated before any execution context is spent on them.

GSD's skeptic reviews operate at two levels: goal-backward verification AFTER execution checks that goals were achieved (not just tasks completed), and plan-checker validation BEFORE execution ensures plans are complete and precise. Together, they catch problems from both directions -- structural gaps that testing misses (orphaned components, unwired connections) and plan defects that would waste execution context (vague actions, missing acceptance criteria). Next, we will see the debug workflow: when bugs DO get through, how does GSD turn symptoms into root causes through hypothesis testing and persistent debug state?

---

## Lesson 4: Debug Workflows

**Objective:** Understand how GSD systematically debugs issues using parallel debug agents, hypothesis testing, and persistent DEBUG.md state that survives context window clears.

Skeptic reviews catch structural problems, but sometimes bugs get through to testing. When verify-work finds issues, GSD does not just guess at fixes. It uses a systematic debug workflow: diagnose-issues spawns parallel debug agents, each investigating one gap with hypothesis testing and persistent state. The orchestrator stays lean -- it parses gaps from UAT.md, spawns one agent per gap, collects root causes, and updates UAT.md with diagnoses. No guessing, no random changes -- structured investigation.

```text
<purpose>
Orchestrate parallel debug agents to investigate UAT gaps and find root causes.

After UAT finds gaps, spawn one debug agent per gap. Each agent investigates
autonomously with symptoms pre-filled from UAT. Collect root causes, update
UAT.md gaps with diagnosis, then hand off to plan-phase --gaps with actual
diagnoses.

Orchestrator stays lean: parse gaps, spawn agents, collect results, update UAT.
</purpose>

<core_principle>
**Diagnose before planning fixes.**

UAT tells us WHAT is broken (symptoms). Debug agents find WHY (root cause).
plan-phase --gaps then creates targeted fixes based on actual causes, not guesses.

Without diagnosis: "Comment doesn't refresh" -> guess at fix -> maybe wrong
With diagnosis: "Comment doesn't refresh" -> "useEffect missing dependency" -> precise fix
</core_principle>
```

The debug orchestration flow works like this: diagnose-issues reads the Gaps section of UAT.md. For each gap, it extracts the truth (what should happen), the severity, and the reason (what the user reported). Then it spawns one debug agent per gap -- all in parallel. Each agent investigates autonomously with symptoms pre-filled from UAT, so no time is wasted gathering information the system already has. The orchestrator stays lean: parse gaps, spawn agents, collect results, update UAT.md with diagnoses.

```text
---
status: gathering | investigating | fixing | verifying | awaiting_human_verify | resolved
trigger: "[verbatim user input]"
created: [ISO timestamp]
updated: [ISO timestamp]
---

## Current Focus
<!-- OVERWRITE on each update - always reflects NOW -->

hypothesis: [current theory being tested]
test: [how testing it]
expecting: [what result means if true/false]
next_action: [immediate next step]

## Symptoms
<!-- Written during gathering, then immutable -->

expected: [what should happen]
actual: [what actually happens]
errors: [error messages if any]
reproduction: [how to trigger]

## Eliminated
<!-- APPEND only - prevents re-investigating after /clear -->

- hypothesis: [theory that was wrong]
  evidence: [what disproved it]
  timestamp: [when eliminated]

## Evidence
<!-- APPEND only - facts discovered during investigation -->

- timestamp: [when found]
  checked: [what was examined]
  found: [what was observed]
  implication: [what this means]
```

The hypothesis-testing methodology is the heart of the debug workflow. The agent states a hypothesis ("useEffect missing dependency"), designs a test to confirm or deny it, records what the result would mean, then executes. If the hypothesis is wrong, it goes into the Eliminated section -- which is append-only to prevent re-investigating the same dead end after a context clear. If the hypothesis is right, it goes into Resolution with the root_cause and fix. This structured approach prevents the "change random things and hope" anti-pattern. Every investigation step produces evidence, and eliminated theories are never revisited.

```text
Extract gaps from UAT.md (YAML format):

```yaml
- truth: "Comment appears immediately after submission"
  status: failed
  reason: "User reported: works but doesn't show until I refresh the page"
  severity: major
  test: 2
  artifacts: []
  missing: []
```

Diagnosis plan table:

| Gap (Truth)                               | Severity |
|-------------------------------------------|----------|
| Comment appears immediately after submit  | major    |
| Reply button positioned correctly         | minor    |
| Delete removes comment                    | blocker  |

Each agent will:
1. Create DEBUG-{slug}.md with symptoms pre-filled
2. Investigate autonomously (read code, form hypotheses, test)
3. Return root cause
```

DEBUG.md files persist across context clears. If a debug session is interrupted, the agent picks up from the Current Focus section -- which is always overwritten to reflect the current state. It reads Eliminated to avoid repeating dead-end investigations, and reads Evidence for accumulated facts. The Symptoms section is written once during the gathering phase and becomes immutable -- the original bug description never changes even as understanding evolves. This persistence means an investigation can survive any number of session boundaries without losing progress or repeating work.

Debug agents find root causes for individual gaps. But how does the system turn those diagnoses into organized fix plans and close the loop? After diagnose-issues completes, UAT.md gaps are updated with root_cause, artifacts (files involved), and missing (things to add or fix). This diagnosed state feeds directly into plan-phase --gaps, which creates targeted fix plans based on actual causes rather than symptoms. Next, we will see the gap closure cycle that takes diagnosed gaps all the way to targeted fixes.

---

## Lesson 5: Gap Closure

**Objective:** Understand the gap closure cycle: how diagnosed gaps flow from UAT.md through plan-phase --gaps to create targeted fix plans, and how execute --gaps-only runs only those plans for surgical fixes.

Debug agents found root causes and updated UAT.md with diagnoses. Now what? The gap closure cycle turns those diagnoses into targeted fix plans. The flow is: diagnose-issues updates UAT.md status to "diagnosed" with root_cause, artifacts, and missing fields filled in. Then plan-phase --gaps reads those diagnosed gaps and creates fix plans with mode: gap_closure. Finally, execute-phase --gaps-only runs just those fix plans. Each step carries forward the diagnosis -- planners do not re-investigate, they read the root cause and create precise tasks.

```text
plan-phase receives --gaps flag:

1. Skip research (gaps already diagnosed)
2. Load gap sources:
   - VERIFICATION.md (code verification gaps)
   - UAT.md with "status: diagnosed" (user testing gaps)
3. Pass to planner with mode: gap_closure

Planner prompt includes:
<planning_context>
**Mode:** gap_closure

<files_to_read>
- {verification_path} (Verification Gaps)
- {uat_path} (UAT Gaps - diagnosed)
</files_to_read>
</planning_context>

The planner reads diagnosed gaps and creates targeted fix plans
instead of planning new features from scratch.
```

What makes gap closure targeted: each gap carries its diagnosis forward. A diagnosed gap in UAT.md has a truth (what should be TRUE), a reason (what went wrong), a root_cause (what the debug agent found), artifacts (files with issues), and missing (things to add or fix). The planner does not guess -- it reads the diagnosed root cause and creates tasks that address the specific missing items. The gap_closure mode flag tracks that these plans exist to close gaps, not add new features. This is the difference between "something is broken, figure it out" and "this specific thing in this specific file needs this specific change."

```text
Diagnosed gap in UAT.md (after diagnose-issues):

```yaml
- truth: "Comment appears immediately after submission"
  status: diagnosed
  reason: "User reported: works but doesn't show until I refresh"
  severity: major
  test: 2
  root_cause: "useEffect in CommentList.tsx missing commentCount dependency"
  artifacts:
    - path: "src/components/CommentList.tsx"
      issue: "useEffect missing dependency"
  missing:
    - "Add commentCount to useEffect dependency array"
    - "Trigger re-render when new comment added"
  debug_session: .planning/debug/comment-not-refreshing.md
```

This diagnosed gap feeds directly into plan-phase --gaps.
The planner creates tasks from root_cause and missing fields.
```

When running execute-phase with --gaps-only, only gap closure plans execute. This prevents re-running already-complete plans. Gap closure plans get sequential plan numbers after existing plans (if plans 01-03 exist, gap plans start at 04), their own wave assignments based on dependencies, and their own verification. After execution, verify-work can re-test to confirm gaps are closed. The execution is surgical: only the diagnosed issues get fixed, only the affected files get modified, only the relevant tests get re-run.

```text
Gap becomes phase tasks (from plan-milestone-gaps):

gap:
  id: DASH-01
  description: "User sees their data"
  reason: "Dashboard exists but doesn't fetch from API"
  missing:
    - "useEffect with fetch to /api/user/data"
    - "State for user data"
    - "Render user data in JSX"

becomes:

phase: "Wire Dashboard Data"
tasks:
  - name: "Add data fetching"
    files: [src/components/Dashboard.tsx]
    action: "Add useEffect that fetches /api/user/data on mount"

  - name: "Add state management"
    files: [src/components/Dashboard.tsx]
    action: "Add useState for userData, loading, error states"

  - name: "Render user data"
    files: [src/components/Dashboard.tsx]
    action: "Replace placeholder with userData.map rendering"
```

After gap closure plans execute, the system can run verify-work again. If new issues are found, the cycle repeats: diagnose -> plan --gaps -> execute --gaps-only -> verify again. Each iteration is targeted and smaller than the last. In practice, most gaps close in one cycle because root cause diagnosis prevents symptom-chasing. The cycle converges because each iteration addresses specific, diagnosed causes rather than guessing. If a fix introduces a new problem, the next iteration catches it with a fresh diagnosis -- not by reverting to guesswork.

Gap closure fixes problems within a single phase. But what about gaps that span multiple phases? What about ensuring an entire milestone hangs together? Phase 1 might create a database schema, Phase 2 an API, Phase 3 a UI -- each phase can pass verification individually while the cross-phase wiring is broken. Next, we will see how audit-milestone checks the big picture and plan-milestone-gaps creates cross-phase fixes.

---

## Lesson 6: Milestone Audit

**Objective:** Understand how audit-milestone aggregates phase verifications, checks cross-phase integration, and enforces completion gates -- and how plan-milestone-gaps turns audit gaps into new fix phases.

Gap closure fixes problems within a single phase. But a milestone spans multiple phases. Phase 1 might create a database schema, Phase 2 an API, Phase 3 a UI -- each phase can pass verification individually while the cross-phase wiring is broken. The API might not use the schema types. The UI might call endpoints that do not exist. GSD checks the big picture with audit-milestone, which aggregates phase verifications and checks cross-phase integration. Individual phase passes do not guarantee milestone success.

```text
<purpose>
Verify milestone achieved its definition of done by aggregating phase
verifications, checking cross-phase integration, and assessing requirements
coverage. Reads existing VERIFICATION.md files (phases already verified
during execute-phase), aggregates tech debt and deferred gaps, then spawns
integration checker for cross-phase wiring.
</purpose>

Step 1 - Determine Milestone Scope:
- Identify all phase directories in scope
- Extract milestone definition of done from ROADMAP.md
- Extract requirements mapped to this milestone from REQUIREMENTS.md

Step 2 - Read All Phase Verifications:
- For each phase, read VERIFICATION.md
- Extract: status, critical gaps, non-critical gaps, anti-patterns, requirements coverage
- Missing VERIFICATION.md = "unverified phase" = blocker
```

The audit has three layers. First, phase verification aggregation: read every VERIFICATION.md and aggregate status, gaps, anti-patterns, and requirements coverage. If any phase is unverified, that is a blocker -- you cannot complete a milestone with unchecked phases. Second, integration checking: spawn a gsd-integration-checker subagent that examines cross-phase wiring. Does the API use the schema types? Does the UI call the right API endpoints? Third, requirements coverage: compare actual verified requirements against REQUIREMENTS.md using a three-source cross-reference to find anything unsatisfied.

```text
From each VERIFICATION.md, extract:
- Status: passed | gaps_found
- Critical gaps (blockers)
- Non-critical gaps (tech debt, deferred items)
- Anti-patterns found (TODOs, stubs, placeholders)
- Requirements coverage (which requirements satisfied/blocked)

Missing VERIFICATION.md = "unverified phase" = blocker

Step 3 - Spawn Integration Checker:
  Check cross-phase integration and E2E flows.
  Phases: {phase_dirs}
  Phase exports: {from SUMMARYs}
  API routes: {routes created}
  Milestone Requirements: {REQ-IDs with descriptions}
  MUST map each integration finding to affected requirement IDs.
  Verify cross-phase wiring and E2E user flows.
```

The audit produces a structured result with completion gates. If critical gaps exist -- requirements unsatisfied, integration broken, unverified phases -- the milestone CANNOT be completed. These are gates, not suggestions. Non-critical items like tech debt and minor deferred gaps are recorded but do not block completion. The gate is binary: all critical items resolved or the milestone stays open. This prevents shipping a milestone that looks done but has fundamental gaps hiding in the cross-phase wiring.

```text
<purpose>
Create all phases necessary to close gaps identified by /gsd:audit-milestone.
Reads MILESTONE-AUDIT.md, groups gaps into logical phases, creates phase
entries in ROADMAP.md, and offers to plan each phase.
</purpose>

Load Audit Results - parse three gap categories:
- gaps.requirements -- unsatisfied requirements
- gaps.integration -- missing cross-phase connections
- gaps.flows -- broken E2E flows

Prioritize Gaps:
| Priority | Action                          |
|----------|---------------------------------|
| must     | Create phase, blocks milestone  |
| should   | Create phase, recommended       |
| nice     | Ask user: include or defer?     |
```

Plan-milestone-gaps closes the milestone loop: it reads audit gaps, groups them by priority and logical concern (same affected phase, same subsystem, dependency order), creates new phase entries in ROADMAP.md, and offers to plan each phase. Must-priority gaps get phases automatically. Nice-priority gaps ask the user. This creates a clean path from "audit found problems" to "here are the specific phases that fix them." The same execute -> verify loop runs on these new phases. After all gap phases complete, re-audit confirms the milestone is truly done.

Milestone audit completes the quality picture at the highest level. In the next lesson, we will step back and see how ALL these quality mechanisms -- verify-work, skeptic reviews, debug workflows, gap closure, and milestone audit -- compose into a single coherent feedback system. Each mechanism handles a different scale and failure mode, but together they form layered, persistent, evidence-based quality assurance.

---

## Lesson 7: The Quality Feedback System

**Objective:** See how all quality mechanisms compose into a unified feedback system operating at task, phase, and milestone levels -- and understand why layered, persistent, evidence-based quality beats single-gate approaches.

This final lesson connects all the quality pieces. You have learned: the quality lifecycle (Lesson 1), verify-work and UAT (Lesson 2), skeptic reviews via goal-backward analysis (Lesson 3), debug workflows (Lesson 4), gap closure (Lesson 5), and milestone audit (Lesson 6). Now we will see how these compose into a unified quality feedback system that operates at every level of GSD. Each mechanism handles a different scale and failure mode, but together they form something greater than the sum of parts.

```text
The Complete Quality Feedback System:

plan-phase                execute-phase              verify-work
  |                          |                          |
  +-- plan-checker           +-- task commits           +-- conversational tests
  |   (pre-execution         |   (atomic, verifiable)   |   (UAT.md persistent)
  |    skeptic review)       |                          |
  v                          v                          v
verify-phase ----------> diagnose-issues ----------> plan-phase --gaps
  |                          |                          |
  +-- goal-backward          +-- parallel debug         +-- gap closure plans
  |   (truths, artifacts,    |   agents                 |   (targeted fixes)
  |    key_links)            |   (DEBUG.md persistent)  |
  v                          v                          v
audit-milestone -------> plan-milestone-gaps         execute --gaps-only
  |                          |                          |
  +-- phase aggregation      +-- priority grouping      +-- surgical execution
  +-- integration check      +-- new phases created     +-- re-verify
  +-- requirements gate
```

Walk through a concrete example: building a commenting feature across 3 phases. Phase 1 creates the schema and API. Phase 2 creates the UI. Phase 3 adds real-time updates. After Phase 2 executes, verify-work finds: "comments appear but do not refresh until page reload." UAT.md records this as a major gap. diagnose-issues spawns a debug agent that finds "useEffect missing comment subscription dependency." plan-phase --gaps creates a fix plan. execute --gaps-only applies the fix. verify-work re-tests: comments now refresh in real time. One automated cycle, from gap discovery to verified fix.

```text
Gap in UAT.md (from verify-work):

- truth: "Comments refresh when new comment posted"
  status: failed
  reason: "User reported: comment appears after page reload only"
  severity: major
  test: 3

After diagnosis -> gap closure PLAN.md task:

<task type="auto">
  <name>Fix comment refresh</name>
  <files>src/components/CommentList.tsx</files>
  <action>
  Root cause: useEffect missing commentCount dependency.
  Add commentCount to the useEffect dependency array in CommentList.tsx
  so the component re-renders when new comments are added.
  </action>
  <verify>
    <automated>grep -q "commentCount" src/components/CommentList.tsx</automated>
  </verify>
</task>

The truth from UAT drives the action in the fix plan.
No guessing -- diagnosis flows directly into targeted repair.
```

Three feedback loops operate at different scales. Loop 1 (task level): each task has a verify block that runs after implementation -- instant feedback on whether the specific change worked. Loop 2 (phase level): verify-work tests the full feature, diagnose-issues finds root causes, plan-phase --gaps creates fix plans, execute --gaps-only applies them -- catches integration issues within a phase. Loop 3 (milestone level): audit-milestone checks cross-phase wiring, plan-milestone-gaps creates new fix phases -- catches gaps that span the entire milestone. Each loop is wider but less frequent. Together they catch problems at every granularity.

```text
verify-phase checks each must_haves level:

1. Truths - observable behaviors that must be TRUE:
   "User can see existing messages"
   "User can send a message"
   "Messages persist across refresh"

2. Artifacts - files that must EXIST with real content:
   path: "src/components/Chat.tsx"
   provides: "Message list rendering"
   Check: exists + substantive (not stub) + wired (imported/used)

3. Key links - critical connections verified with grep:
   from: "src/components/Chat.tsx"
   to: "/api/chat"
   pattern: "fetch.*api/chat"

   grep -r "fetch.*api/chat" src/components/Chat.tsx
   FOUND = wired. NOT FOUND = orphaned component.

Evidence-based: grep on actual source, not trust.
```

Why this system works: it is not a single monolithic quality check -- it is layered, persistent, and evidence-based. Persistent because UAT.md, DEBUG.md, and VERIFICATION.md survive context window clears. If a session is interrupted mid-debug, the investigation resumes from exactly where it left off. Evidence-based because key_links use grep patterns on actual source code, not trust. A component cannot pass verification by merely existing -- it must be wired to its dependencies. Layered because plan-checker catches plan issues, verify-phase catches implementation issues, verify-work catches user-visible issues, and audit-milestone catches integration issues. Each layer catches different failure modes.

GSD's quality system embodies one principle: close the loop. Every verification feeds back into planning. Every gap drives targeted fixes. Every fix gets re-verified. This is not a waterfall quality gate at the end; it is continuous feedback woven into every workflow. The result is a system where problems are caught at the right level, diagnosed with evidence, fixed with precision, and confirmed with re-testing. In the next step (the mini-project), you will apply these quality concepts by building your own verification workflow.

---

## Concept Map

```
  Quality & Feedback Loops
        |
        v
  +-------------------------+
  | Overview                |
  | (Quality lifecycle:     |
  |  build -> verify ->     |
  |  diagnose -> fix ->     |
  |  re-verify)             |
  +-------------------------+
        |
        v
  +-------------------------+
  | Verify-Work & UAT       |
  | (Conversational testing,|
  |  severity levels,       |
  |  persistent UAT.md)     |
  +-------------------------+
        |
        v
  +-------------------------+
  | Skeptic Reviews         |
  | (Proactive critical     |
  |  assessment, skeptic.md,|
  |  pre-emptive quality)   |
  +-------------------------+
        |
        v
  +-------------------------+
  | Debug Workflows         |
  | (Systematic debugging,  |
  |  hypothesis testing,    |
  |  persistent state)      |
  +-------------------------+
        |
        v
  +-------------------------+
  | Gap Closure             |
  | (Diagnosis -> plan      |
  |  --gaps -> execute      |
  |  --gaps-only cycle)     |
  +-------------------------+
        |
        v
  +-------------------------+
  | Milestone Audit         |
  | (audit-milestone,       |
  |  plan-milestone-gaps,   |
  |  completion gates)      |
  +-------------------------+
        |
        v
  +-------------------------+
  | Synthesis               |
  | (Quality loops in the   |
  |  full GSD lifecycle,    |
  |  putting it together)   |
  +-------------------------+

```

## Mini-Project: Add Quality Verification to Skeptic Reviews

Extend your skeptic workflow with a verify-findings section -- after the review completes, run a UAT-style verification checklist against the findings, infer severity levels, and track gaps between what was reviewed and what was missed

### Artifacts

#### Skeptic workflow with quality verification section

**Path:** `~/.claude/get-shit-done/workflows/skeptic.md`

**Verification Checks:**

- [ ] Has a verify/validation section after the review steps
- [ ] Defines severity levels for classifying findings
- [ ] Has a UAT-style checklist with acceptance criteria or pass/fail checks
- [ ] Tracks coverage gaps identifying what was not reviewed
- [ ] Produces a verification summary separate from the review
- [ ] Verification step depends on review completion

### Hints

<details>
<summary>Hint 1</summary>

Your skeptic workflow reviews code but never checks its own work. Quality systems verify their own output. Think about what a UAT tester would check after reading the skeptic's findings -- are they thorough? Are severity levels justified? What areas were never examined?

</details>

<details>
<summary>Hint 2</summary>

You need a new step (or steps) AFTER the aggregation step. This verify-findings section examines the review output, not the original code. It asks: did we cover everything? How severe are these findings? What did we miss?

</details>

<details>
<summary>Hint 3</summary>

Add a step like verify_findings or quality_check after aggregate_findings. In it, define severity levels (critical/major/minor), create a checklist of verification criteria, and identify gaps in coverage -- areas the review subagents did not examine.

</details>

<details>
<summary>Hint 4</summary>

After your aggregate_findings step, add a verify_findings step that: (a) classifies each finding by severity (critical/major/minor), (b) runs through a checklist of quality criteria (are findings actionable? do they cite evidence? are severity levels justified?), (c) identifies coverage gaps (what areas of the project were NOT reviewed), and (d) produces a verification summary section.

</details>

<details>
<summary>Hint 5</summary>

In your skeptic workflow after the aggregation step, add a step named verify_findings (or similar). Inside it: (a) define severity categories and classify aggregated findings into them, (b) list acceptance criteria as a checklist (findings are specific, evidence-based, actionable, severity-justified), (c) track gaps by listing project areas or aspects not covered by any review subagent, (d) write a verification summary. The verification must depend on review completion (place it after aggregation or note the dependency).

</details>

