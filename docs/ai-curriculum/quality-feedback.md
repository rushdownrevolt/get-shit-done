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

## Lesson 9: Enhanced Verification

**Objective:** Explain data-flow tracing, behavioral spot-checks, and environment audits as verification techniques that go beyond basic test-passing.

Basic verification asks: do the tests pass? Enhanced verification asks: does data actually flow from source to destination? A component can pass all its unit tests while rendering an empty list because the API call never fires. A database query can return correct results while the component never imports the function that calls it. Enhanced verification catches these gaps through three techniques: data-flow tracing, behavioral spot-checks, and environment audits. Each targets a different class of silent failure.

```text
From verify-phase.md — Data-Flow Tracing:

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

Data-flow tracing works at three levels. Level 1 (Truths) states what a user must be able to observe -- these are written as plain English sentences like 'User can see existing messages.' Level 2 (Artifacts) identifies the files that make those truths possible and checks that they exist with real content, not stubs. Level 3 (Key Links) verifies that artifacts are actually connected to each other by running grep on source code. A Chat.tsx component that exists and has real content but never calls fetch('/api/chat') is an orphaned component -- it looks complete but does nothing. Key links catch this.

```text
From verify-phase.md — Behavioral Spot-Checks:

For each observable truth, determine if the codebase enables it.

Status:
  VERIFIED   (all supporting artifacts pass)
  FAILED     (artifact missing/stub/unwired)
  UNCERTAIN  (needs human)

For each truth:
  identify supporting artifacts ->
  check artifact status ->
  check wiring ->
  determine truth status.

Example:
  Truth: "User can see existing messages"
  Depends on:
    Chat.tsx       (renders)
    /api/chat GET  (provides)
    Message model  (schema)

  If Chat.tsx is a stub or API returns hardcoded [] -> FAILED
  If all exist, are substantive, and connected    -> VERIFIED
```

Behavioral spot-checks decompose each truth into its supporting chain. The question is not 'does Chat.tsx exist?' but 'does the chain from Message model through /api/chat GET through Chat.tsx actually deliver messages to the user?' If any link in the chain is broken -- the model has no data, the API returns an empty array, or the component never calls the API -- the truth fails. This is why GSD marks truths as VERIFIED, FAILED, or UNCERTAIN. UNCERTAIN means the automated check cannot determine the answer and a human must look.

```text
From verify-phase.md — Artifact Verification Levels:

| Exists | Substantive | Wired | Status       |
|--------|-------------|-------|--------------|
|  yes   |    yes      |  yes  | VERIFIED     |
|  yes   |    yes      |  no   | ORPHANED     |
|  yes   |    no       |   -   | STUB         |
|  no    |     -       |   -   | MISSING      |

Export-level spot check (WARNING severity):

For artifacts that pass Level 3, spot-check individual exports:
- Extract key exported symbols (functions, constants, classes)
- For each, grep for usage outside the defining file
- Flag exports with zero external call sites as
  "exported but unused"

This catches dead stores like setPlan() that exist in a
wired file but are never actually called.
```

The environment audit extends verification beyond code. It checks that artifacts are not just present but substantive -- a file with 3 lines is likely a stub even if it exists and is imported. The export-level spot-check goes deeper still: even in a file that passes all three levels (exists, substantive, wired), individual exported functions might never be called. A setPlan() function that exists, is exported, and lives in a properly wired module -- but has zero call sites outside its own file -- is dead code that signals incomplete integration.

Enhanced verification is the difference between 'it compiles' and 'it works.' Data-flow tracing ensures connections exist between components. Behavioral spot-checks ensure those connections deliver the right data. Environment audits ensure nothing is a stub or dead code. Together, they catch the most common failure mode in AI-generated code: components that look complete in isolation but are never wired together. The verifier runs these checks automatically after each phase, producing a VERIFICATION.md report with evidence for every finding.

---

## Lesson 10: Stub Detection

**Objective:** Explain how the verifier identifies incomplete implementations -- stubs, TODOs, placeholder code -- that slip through tests but prevent features from working.

A stub is code that exists structurally but does not actually do anything. It might be a function that returns an empty array, a component that renders 'Coming soon', or a handler that logs to console instead of processing data. Stubs are dangerous because they pass basic tests -- the function is callable, the component renders, the handler does not throw. But the feature does not work. Stub detection is the verifier's defense against code that looks complete but delivers nothing.

```text
From verify-phase.md — Anti-Pattern Scanning:

| Pattern              | Search                                    | Severity  |
|----------------------|-------------------------------------------|-----------|
| TODO/FIXME/XXX/HACK  | grep -n -E "TODO|FIXME|XXX|HACK"          | Warning   |
| Placeholder content  | grep -n -iE "placeholder|coming soon|     | Blocker   |
|                      |  will be here"                            |           |
| Empty returns        | grep -n -E "return null|return {}|        | Warning   |
|                      |  return []|=> {}"                         |           |
| Log-only functions   | Functions containing only console.log     | Warning   |

Categorize:
  Blocker  (prevents goal)
  Warning  (incomplete)
  Info     (notable)
```

The verifier scans every file modified in the phase against four stub patterns. TODO and FIXME comments signal work the developer intended to finish but did not. Placeholder content like 'coming soon' is a blocker -- it directly prevents the feature from working. Empty returns (return null, return {}, return []) mean data never reaches the consumer. Log-only functions appear to handle events but discard them. Each pattern maps to a severity: blockers prevent the phase goal from being achieved, warnings indicate incomplete work that may need attention.

```text
From verify-phase.md — Artifact Stub Detection:

Artifact status from verification result:
- exists=false           -> MISSING
- issues not empty       -> STUB
  (check issues for "Only N lines" or "Missing pattern")
- passed=true            -> VERIFIED (Levels 1-2 pass)

Level 3 -- Wired (manual check for artifacts that pass 1-2):

grep -r "import.*$artifact_name" src/ --include="*.ts"
grep -r "$artifact_name" src/ --include="*.ts" | grep -v "import"

WIRED   = imported AND used
ORPHANED = exists but not imported/used

A 3-line file that exports a function signature and
returns null is detected as STUB -- it passes the
"exists" check but fails the "substantive" check
because its issues array contains "Only 3 lines."
```

The verifier combines grep-based pattern detection with size heuristics. A file with only 3 lines cannot contain a real implementation -- it is flagged as a stub even if it has no TODO comments. The issues array captures what specifically is wrong: 'Only N lines' means the file is too small to be substantive, 'Missing pattern' means expected content (like a specific function name or API call) was not found. This multi-signal approach catches stubs that any single check would miss.

```text
From verify-phase.md — Stub Reporting in VERIFICATION.md:

Scan Anti-patterns section of the verification report:

## Anti-Patterns Found

| File                        | Pattern           | Severity | Line |
|-----------------------------|-------------------|----------|------|
| src/api/comments.ts         | return []          | Warning  | 42   |
| src/components/Feed.tsx     | placeholder        | Blocker  | 15   |
| src/utils/format.ts         | TODO               | Warning  | 8    |

## Artifact Status

| Artifact                    | Exists | Substantive | Wired   | Status   |
|-----------------------------|--------|-------------|---------|----------|
| src/api/comments.ts         | yes    | no          | -       | STUB     |
| src/components/Feed.tsx     | yes    | no          | -       | STUB     |
| src/components/Chat.tsx     | yes    | yes         | yes     | VERIFIED |
```

The VERIFICATION.md report gives a clear, actionable view of every stub. The anti-patterns table shows exact file, pattern matched, severity, and line number. The artifact status table shows which files passed all verification levels and which are stubs. When the verifier finds blockers, it generates fix plans -- targeted tasks that replace the stub with a real implementation. A 'return []' in src/api/comments.ts becomes a task: 'Replace empty return with actual database query.' The stub is not just detected -- it triggers a concrete remediation path.

Stub detection is one layer in GSD's quality system. It works alongside data-flow tracing (Lesson 9) to catch incomplete implementations. A component might be wired correctly (key links pass) but return empty data (stub detection catches it). Or a component might have real content (stub detection passes) but never be imported (data-flow tracing catches it). Together, these techniques ensure that code is not just present and connected, but actually delivers real data to real users. The next lesson covers how GSD prevents regressions across phases.

---

## Lesson 11: Regression Gate

**Objective:** Explain how execute-phase runs cross-phase regression checks before advancing, preventing phase N+1 from silently breaking what phase N delivered.

In a multi-phase project, each phase builds on what previous phases delivered. Phase 1 creates the database schema, Phase 2 builds the API, Phase 3 creates the UI. But Phase 3's changes might break Phase 2's API routes, or Phase 2's migrations might alter Phase 1's schema. Without regression checks, these breakages go undetected until the milestone audit -- by which point the damage is spread across multiple phases and much harder to fix. The regression gate catches these problems immediately, before advancing to the next phase.

```text
From execute-phase.md — Regression Gate Design:

Orchestrator coordinates, not executes. Each subagent loads
the full execute-plan context.

Orchestrator workflow:
  discover plans ->
  analyze deps ->
  group waves ->
  spawn agents ->
  handle checkpoints ->
  collect results

After all waves complete, the orchestrator runs verification:

  gsd-verifier -> VERIFICATION.md

The verifier checks:
  1. All must_haves from every PLAN.md in the phase
  2. Artifacts exist, are substantive, and are wired
  3. Key links verified with grep on actual source
  4. Anti-patterns scanned (stubs, TODOs, placeholders)
  5. Requirements coverage from REQUIREMENTS.md
```

The regression gate operates at the boundary between execution and advancement. After all plans in a phase complete, the orchestrator spawns a gsd-verifier agent. This agent does not just check the current phase -- it verifies that previous phase outputs still work by checking must_haves, artifacts, and key links. If Phase 3 altered a file that Phase 2 depends on, the key link verification will catch it: the grep pattern from Phase 2's must_haves will fail against the modified file. The gate blocks advancement until all verification passes.

```text
From verify-phase.md — Gate Pass/Fail Logic:

Determine overall status:

passed:
  All truths VERIFIED
  All artifacts pass levels 1-3
  All key links WIRED
  No blocker anti-patterns

gaps_found:
  Any truth FAILED
  Artifact MISSING/STUB
  Key link NOT_WIRED
  Or blocker found

human_needed:
  All automated checks pass
  But human verification items remain

Orchestrator routes:
  passed      -> update_roadmap (advance to next phase)
  gaps_found  -> create/execute fixes, re-verify
  human_needed -> present to user
```

When the gate returns 'gaps_found', the orchestrator does not just stop -- it creates fix plans. The verifier clusters related gaps (e.g., 'API stub + component unwired' becomes one fix plan: 'Wire frontend to backend'), generates targeted tasks with specific files and actions, and orders them by dependency: fix missing artifacts first, then stubs, then wiring, then re-verify. The fix plans execute in the same automated pipeline. Only after all gaps are resolved and re-verification passes does the system advance to the next phase.

```text
From verify-phase.md — Fix Plan Generation:

If gaps_found:

1. Cluster related gaps:
   API stub + component unwired -> "Wire frontend to backend"
   Multiple missing artifacts   -> "Complete core implementation"
   Wiring only issues           -> "Connect existing components"

2. Generate plan per cluster:
   Objective, 2-3 tasks (files/action/verify each),
   re-verify step.
   Keep focused: single concern per plan.

3. Order by dependency:
   Fix missing  -> fix stubs -> fix wiring -> verify

Orchestrator routes:
  passed      -> update roadmap, advance
  gaps_found  -> create/execute fixes, re-verify
  human_needed -> present to user for manual check
```

The clustering step is important. Without it, a single broken feature could produce dozens of individual gap findings: missing function, unwired component, stub return, failed truth. Clustering groups these into a coherent fix: 'Wire the comments feature' with tasks that address the function, the component, and the wiring in sequence. This mirrors how a developer would fix the issue -- as one coherent change, not as isolated patches.

The regression gate is the quality system's boundary enforcer. While stub detection (Lesson 10) catches incomplete code within a phase and enhanced verification (Lesson 9) traces data flow, the regression gate prevents advancement until everything checks out. It enforces the principle that later work must not break earlier work. Combined with atomic commits (each task independently verifiable), wave-based execution (dependency-aware ordering), and the fix-then-re-verify cycle, the regression gate ensures that milestone completion means all phases work together, not just individually.

---

## Lesson 12: Security Hardening

**Objective:** Explain how the centralized security.cjs module prevents path traversal, prompt injection, and other security issues in an AI-driven tool.

GSD generates markdown files that become LLM system prompts. It reads user-supplied file paths. It executes shell commands. Each of these is a potential attack vector. Path traversal could let a malicious argument escape the project directory. Prompt injection could embed rogue instructions in planning documents. Shell metacharacters could execute arbitrary commands. GSD centralizes all security checks in a single module -- security.cjs -- so every tool calls into one validated, tested defense layer instead of implementing its own ad-hoc checks.

```javascript
// From security.cjs — Path Validation:

function validatePath(filePath, baseDir, opts = {}) {
  if (!filePath || typeof filePath !== 'string') {
    return { safe: false, resolved: '', error: 'Empty or invalid file path' };
  }

  // Reject null bytes (can bypass path checks in some environments)
  if (filePath.includes('\0')) {
    return { safe: false, resolved: '', error: 'Path contains null bytes' };
  }

  // Resolve symlinks in base directory
  let resolvedBase;
  try {
    resolvedBase = fs.realpathSync(path.resolve(baseDir));
  } catch {
    resolvedBase = path.resolve(baseDir);
  }

  // ... resolve the target path ...

  // The resolved path must start with the base directory
  if (resolvedPath !== resolvedBase &&
      !normalizedPath.startsWith(normalizedBase)) {
    return {
      safe: false,
      resolved: resolvedPath,
      error: `Path escapes allowed directory: ${resolvedPath}`
    };
  }

  return { safe: true, resolved: resolvedPath };
}
```

The validatePath function prevents path traversal by resolving the user-supplied path to its absolute form and checking that it falls within the allowed base directory. It handles three edge cases that simpler checks miss: null bytes (which can bypass string-based path checks in some environments), symlinks (which can make a path appear to be inside the base directory while actually pointing outside), and absolute paths (which bypass relative path assumptions). The function resolves symlinks using fs.realpathSync on both the base directory and the target path before comparing.

```javascript
// From security.cjs — Prompt Injection Detection:

const INJECTION_PATTERNS = [
  // Direct instruction override attempts
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?previous/i,
  /override\s+(system|previous)\s+(prompt|instructions)/i,

  // Role/identity manipulation
  /you\s+are\s+now\s+(?:a|an|the)\s+/i,
  /pretend\s+(?:you(?:'re| are)\s+|to\s+be\s+)/i,

  // System prompt extraction
  /(?:print|output|reveal|show)\s+(?:your\s+)?(?:system\s+)?prompt/i,

  // Hidden instruction markers
  /<\/?(?:system|assistant|human)>/i,
  /\[SYSTEM\]/i,
  /\[INST\]/i,

  // Exfiltration attempts
  /(?:send|post|fetch|curl)\s+(?:to|from)\s+https?:\/\//i,
];

function scanForInjection(text, opts = {}) {
  const findings = [];
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      findings.push(`Matched injection pattern: ${pattern.source}`);
    }
  }
  return { clean: findings.length === 0, findings };
}
```

Prompt injection is particularly relevant for GSD because user-supplied text (project descriptions, phase goals, task names) flows into markdown files that become agent system prompts. If a malicious user embeds 'ignore all previous instructions' in a task name, that text would appear in the executor agent's prompt. The scanForInjection function detects five categories of injection: instruction overrides, role manipulation, prompt extraction, hidden instruction markers (XML tags mimicking system boundaries), and exfiltration attempts. This is defense-in-depth -- the primary defense is proper input/output boundaries in agent prompts.

```javascript
// From security.cjs — Convenience Wrapper and Exports:

function requireSafePath(filePath, baseDir, label, opts = {}) {
  const result = validatePath(filePath, baseDir, opts);
  if (!result.safe) {
    throw new Error(
      `${label || 'Path'} validation failed: ${result.error}`
    );
  }
  return result.resolved;
}

module.exports = {
  // Path safety
  validatePath,
  requireSafePath,

  // Prompt injection
  INJECTION_PATTERNS,
  scanForInjection,
  sanitizeForPrompt,

  // Shell safety
  validateShellArg,

  // JSON safety
  safeJsonParse,

  // Input validation
  validatePhaseNumber,
  validateFieldName,
};
```

Tools call into security.cjs before performing any file operation or accepting user input. The requireSafePath wrapper is the most common pattern: pass a user-supplied path and a base directory, get back either a safe resolved path or an exception. Other tools use scanForInjection before embedding user text in agent prompts, validateShellArg before constructing shell commands, safeJsonParse before processing JSON input, and validatePhaseNumber before using phase arguments in file path construction. Each function returns structured results (not just true/false) so callers know exactly what failed and why.

Centralized security has three advantages over scattered checks. First, consistency: every path validation uses the same null-byte check, symlink resolution, and containment logic. A bug fix in validatePath fixes every tool at once. Second, testability: security.cjs can be unit-tested in isolation with adversarial inputs (paths with ../, null bytes, symlinks) without running the full tool chain. Third, auditability: a security review examines one file, not dozens of scattered checks across the codebase. This pattern -- centralize validation, export functions, call before every operation -- applies to any tool that handles untrusted input, not just GSD.

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

