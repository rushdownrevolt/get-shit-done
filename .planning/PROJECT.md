# GSD Learn

## What This Is

A Node.js CLI tool that teaches how GSD (Get Shit Done) works through guided, interactive terminal lessons. It parses GSD's actual source files to generate lesson content, tracks per-module learning progress across sessions, and validates understanding through hands-on mini-projects — not quizzes. Currently ships two modules: GSD Commands & Workflows (markdown layer) and Command Lifecycle (Node.js layer).

## Core Value

The learner can confidently modify and extend GSD for their own needs, validated by their ability to achieve creative results with GSD commands.

## Current Milestone: v2.2 Module Discovery & Welcome

**Goal:** Give learners a proper introduction to GSD Learn and let them navigate between modules

**Target features:**
- Welcome experience pitching GSD and what the learner will achieve
- Module picker with progress indicators and recommended starting point
- Resume-where-you-left-off for returning users
- "M" key to navigate to module page from anywhere
- "H" key for hints on mini-project step

## Requirements

### Validated

<!-- Shipped and confirmed valuable -->

- ✓ CLI launches interactive lesson experience in terminal — v1.0
- ✓ Lessons are parsed/generated from GSD's actual source files — v1.0
- ✓ Progress tracking persists across sessions — v1.0
- ✓ Module structure: conceptual overview first, then drill into source code — v1.0
- ✓ Mini-project at end of each module — v1.0
- ✓ Mini-project results double as lesson quality measurement — v1.0
- ✓ MVP: single module (Command Lifecycle) working completely — v1.0
- ✓ New Module 1: GSD Commands & Workflows (6 lessons + mini-project) — v2.0
- ✓ Module renumbering: GSD Commands is Module 1, Command Lifecycle is Module 2 — v2.0
- ✓ Multi-module infrastructure with per-module progress and v1-to-v2 migration — v2.0
- ✓ GSD markdown parser for command specs and workflow files — v2.0
- ✓ Generic {{KEY}} template system for markdown-based lesson generation — v2.0
- ✓ Structural mini-project verification with progressive hints — v2.0
- ✓ Module 2 mini-project upgraded to full-stack skeptic build — v2.1
- ✓ Node.js artifact verification (skeptic.cjs handler + switch case checks) — v2.1
- ✓ Full-stack progressive hints connecting both layers — v2.1

### Active

<!-- Next milestone scope -->

- [ ] Welcome screen with GSD pitch for first-time users
- [ ] Module picker with per-module progress and recommended flag
- [ ] Resume-to-last-position for returning users
- [ ] "M" key binding to navigate to module page from any lesson
- [ ] "H" key binding for hints on mini-project step
- [ ] Slimmer return-user message on module page

### Out of Scope

- Web UI or browser-based experience — terminal only
- Multi-user support — single learner
- Traditional quizzes or multiple-choice testing — validation is through doing
- Video or multimedia content — text and code only
- Teaching other tools — GSD only
- Lesson content auto-updates when GSD source changes — deferred to future milestone
- Module discovery UI — being built in v2.2

## Context

- This tool lives inside the GSD repo itself and teaches its own codebase
- GSD is a zero-dependency Node.js project using CommonJS modules
- GSD's architecture has TWO layers: (1) markdown layer (slash commands + workflows) and (2) Node.js layer (gsd-tools.cjs + lib modules)
- The codebase map at `.planning/codebase/` provides detailed architecture, stack, conventions, and structure docs
- v1.0 proved the teaching model works with Command Lifecycle module
- v2.0 added GSD Commands & Workflows as Module 1, teaching the simpler markdown layer first
- Shipped: ~6,885 LOC (Node.js/JSON), 2 modules, 12 lessons total, 2 full-stack mini-projects
- Both mini-projects now validate real artifacts (Module 1: markdown layer, Module 2: full-stack 4-layer)
- 13 pre-existing clipboard-formatter test failures carried from v1.0 (non-blocking)

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
| New Module 1 for slash commands | Teaches simpler markdown layer before Node.js internals; natural learning progression | ✓ Good |
| Hand-authored lessons with real snippets | Real source code content produces high-quality authentic lessons | ✓ Good |
| Wave 0 test pattern | Graceful degradation enables incremental delivery without blocking CI | ✓ Good |
| Nested XML extraction in parser | Recursive regex handles GSD workflow format cleanly without DOM parser | ✓ Good |
| Full-stack mini-project for Module 2 | Learner builds all 4 layers (command.md, workflow.md, skeptic.cjs, switch case) | ✓ Good |
| Cross-module spec carry-forward | Module 2 spec carries all Module 1 checks verbatim for continuity | ✓ Good |

---
*Last updated: 2026-03-12 after v2.2 milestone start*
