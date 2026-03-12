# GSD Learn

## What This Is

A Node.js CLI tool that teaches how GSD (Get Shit Done) works through guided, interactive terminal lessons. It parses GSD's actual source files to generate lesson content, tracks learning progress across sessions, and validates understanding through hands-on mini-projects — not quizzes. Built for a single user who wants to go from using GSD to confidently modifying it.

## Core Value

The learner can confidently modify and extend GSD for their own needs, validated by their ability to achieve creative results with GSD commands.

## Current Milestone: v2.0 GSD Commands & Workflows Module

**Goal:** Add a new Module 1 that teaches the GSD slash command and workflow layer (the markdown files that make `/gsd:*` commands work). The existing Command Lifecycle module becomes Module 2.

**Target features:**
- New module teaching slash commands (`~/.claude/commands/gsd/*.md`) and workflows (`~/.claude/get-shit-done/workflows/*.md`)
- Module restructuring: new module becomes Module 1, existing Command Lifecycle becomes Module 2
- Update Command Lifecycle mini-project to be full-stack (all 4 layers: command.md, workflow.md, echo.cjs, gsd-tools.cjs switch)

## Requirements

### Validated

<!-- Shipped and confirmed valuable in v1.0 -->

- ✓ CLI launches interactive lesson experience in terminal — v1.0
- ✓ Lessons are parsed/generated from GSD's actual source files — v1.0
- ✓ Progress tracking persists across sessions — v1.0
- ✓ Module structure: conceptual overview first, then drill into source code — v1.0
- ✓ Mini-project at end of each module — v1.0
- ✓ Mini-project results double as lesson quality measurement — v1.0
- ✓ MVP: single module (Command Lifecycle) working completely — v1.0

### Active

<!-- Current scope for v2.0 -->

- [ ] New Module 1: GSD Commands & Workflows (slash commands + workflow markdown files)
- [ ] Module renumbering: Command Lifecycle becomes Module 2
- [ ] Command Lifecycle mini-project updated to full-stack (all 4 layers)

### Out of Scope

- Web UI or browser-based experience — terminal only
- Multi-user support — single learner
- Traditional quizzes or multiple-choice testing — validation is through doing
- Video or multimedia content — text and code only
- Teaching other tools — GSD only
- Lesson content auto-updates when GSD source changes — deferred to future milestone

## Context

- This tool lives inside the GSD repo itself and teaches its own codebase
- GSD is a zero-dependency Node.js project using CommonJS modules
- GSD's architecture has TWO layers: (1) markdown layer (slash commands + workflows) and (2) Node.js layer (gsd-tools.cjs + lib modules)
- The codebase map at `.planning/codebase/` provides detailed architecture, stack, conventions, and structure docs
- v1.0 proved the teaching model works with the Command Lifecycle module — now expanding
- The new module teaches the simpler markdown layer first, so learners understand how `/gsd:*` commands work before diving into the Node.js implementation

## Constraints

- **Stack**: Node.js CLI, zero external runtime dependencies (match GSD's own approach)
- **Content source**: Parse GSD source files directly — no hand-written lesson content that drifts from reality
- **Validation model**: Learning is measured by ability to achieve creative results with GSD, not test scores
- **Module ordering**: Simpler concepts first (markdown commands) → complex concepts second (Node.js internals)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CLI-based (not web) | Matches GSD's terminal-native workflow; learner stays in their natural environment | ✓ Good |
| Parse source for content | Prevents lesson drift from actual implementation; always up to date | ✓ Good |
| Command Lifecycle as first module | Touches all major GSD concepts (state, agents, orchestration); concrete and traceable | ✓ Good |
| Mini-projects over quizzes | Measures real capability, not recall; also measures lesson quality | ✓ Good |
| MVP-first with feedback loop | De-risks lesson design before investing in full course; lessons learned inform module 2+ | ✓ Good |
| New Module 1 for slash commands | Teaches simpler markdown layer before Node.js internals; natural learning progression | — Pending |
| Full-stack mini-project for Module 2 | Learner builds all 4 layers (command.md, workflow.md, echo.cjs, switch case); proves complete understanding | — Pending |

---
*Last updated: 2026-03-12 after v2.0 milestone start*
