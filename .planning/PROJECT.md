# GSD Learn

## What This Is

A Node.js CLI tool that teaches how GSD (Get Shit Done) works through guided, interactive terminal lessons. It parses GSD's actual source files to generate lesson content, tracks learning progress across sessions, and validates understanding through hands-on mini-projects — not quizzes. Built for a single user who wants to go from using GSD to confidently modifying it.

## Core Value

The learner can confidently modify and extend GSD for their own needs, validated by their ability to achieve creative results with GSD commands.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] CLI launches interactive lesson experience in terminal
- [ ] Lessons are parsed/generated from GSD's actual source files (workflows, agents, configs, templates)
- [ ] Progress tracking persists across sessions (pick up where you left off)
- [ ] Module structure: conceptual overview first, then drill into source code
- [ ] Mini-project at end of each module — use GSD to build something real as proof of learning
- [ ] Mini-project results double as lesson quality measurement (feedback loop for iterating module design)
- [ ] MVP: single module (Command Lifecycle — follow `/gsd:quick` end-to-end) working completely before expanding
- [ ] Lesson content auto-updates when GSD source changes

### Out of Scope

- Web UI or browser-based experience — terminal only
- Multi-user support — single learner
- Traditional quizzes or multiple-choice testing — validation is through doing
- Video or multimedia content — text and code only
- Teaching other tools — GSD only

## Context

- This tool lives inside the GSD repo itself and teaches its own codebase
- GSD is a zero-dependency Node.js project using CommonJS modules
- GSD's architecture: CLI entry → tool library → workflow orchestrators → specialized agents
- The codebase map at `.planning/codebase/` provides detailed architecture, stack, conventions, and structure docs
- The learner's end goal is modification confidence, not just usage proficiency
- MVP module (Command Lifecycle via `/gsd:quick`) naturally touches state machine, agent spawning, planning, execution, and commits — making it an ideal first module
- The MVP also serves as a design experiment: assess lesson quality before building more modules

## Constraints

- **Stack**: Node.js CLI, zero external runtime dependencies (match GSD's own approach)
- **Content source**: Parse GSD source files directly — no hand-written lesson content that drifts from reality
- **Validation model**: Learning is measured by ability to achieve creative results with GSD, not test scores
- **Iteration**: MVP must include a feedback mechanism to assess whether the teaching approach works before expanding

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CLI-based (not web) | Matches GSD's terminal-native workflow; learner stays in their natural environment | — Pending |
| Parse source for content | Prevents lesson drift from actual implementation; always up to date | — Pending |
| Command Lifecycle as first module | Touches all major GSD concepts (state, agents, orchestration); concrete and traceable | — Pending |
| Mini-projects over quizzes | Measures real capability, not recall; also measures lesson quality | — Pending |
| MVP-first with feedback loop | De-risks lesson design before investing in full course; lessons learned inform module 2+ | — Pending |

---
*Last updated: 2026-03-11 after initialization*
