# GSD Learn

## What This Is

A Node.js CLI tool that teaches how GSD (Get Shit Done) works through guided, interactive terminal lessons. It parses GSD's actual source files to generate lesson content, tracks per-module learning progress across sessions, and validates understanding through hands-on mini-projects — not quizzes. Ships three modules: GSD Commands & Workflows (markdown layer), Command Lifecycle (Node.js layer), and Planning & State (planning system). Features a welcome screen, module picker with progress tracking, and context-dependent navigation. Also ships an AI-ready curriculum export (`docs/ai-curriculum/`) — a self-contained master document and per-module docs that let an LLM learn GSD by reading structured markdown.

## Core Value

The learner can confidently modify and extend GSD for their own needs, validated by their ability to achieve creative results with GSD commands.

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
- ✓ Welcome screen with GSD pitch for first-time users — v2.2
- ✓ Module picker with per-module progress and recommended flag — v2.2
- ✓ Resume-to-last-position for returning users — v2.2
- ✓ "M" key binding to navigate to module page from any lesson — v2.2
- ✓ "H" key binding for hints on mini-project step — v2.2
- ✓ Context-dependent navigation footer — v2.2
- ✓ Module 1 mini-project provides real skeptic workflow as starting template — v2.3
- ✓ Template-first pedagogy: learn from working example, then customize — v2.3
- ✓ Hints updated for template-based mini-project approach — v2.3
- ✓ Module 3: Planning & State with 7 lessons covering full planning lifecycle — v3.0
- ✓ Dynamic module picker recommended flag (first uncompleted module) — v3.0
- ✓ v3→v4 progress migration chain for Module 3 tracking — v3.0
- ✓ All lesson content parsed from GSD's actual planning templates and workflows — v3.0
- ✓ Artifact-persistence mini-project: skeptic writes persistent SKEPTIC-REVIEW.md — v3.0
- ✓ 5 progressive hints for planning mini-project — v3.0
- ✓ Export script converts JSON lessons to AI-readable markdown — v4.0
- ✓ Per-module markdown docs in docs/ai-curriculum/ — v4.0
- ✓ Master README walks through entire curriculum sequentially — v4.0
- ✓ Mini-project specs and hints included in AI curriculum output — v4.0
- ✓ Script + committed output (both generated and checked in) — v4.0

### Active

<!-- v5.0 Agent Orchestration Module scope -->

- [ ] Module 4: Agent Orchestration with lessons covering subagent types, wave execution, orchestrator pattern, checkpoints, and auto-advance chains
- [ ] All lesson content parsed from GSD's actual agent configs and orchestration workflows
- [ ] Mini-project at end of module exercising agent orchestration concepts
- [ ] v4→v5 progress migration for Module 4 tracking
- [ ] AI curriculum export updated with Module 4 content

### Out of Scope

- Web UI or browser-based experience — terminal only
- Multi-user support — single learner
- Traditional quizzes or multiple-choice testing — validation is through doing
- Video or multimedia content — text and code only
- Teaching other tools — GSD only
- Lesson content auto-updates when GSD source changes — deferred to future milestone
- Part-level resume — resume to lesson start is sufficient; part-level adds complexity for minimal gain
- Module progress percentage — completion state (not started / in progress / complete) is clearer than percentages

## Context

- This tool lives inside the GSD repo itself and teaches its own codebase
- GSD is a zero-dependency Node.js project using CommonJS modules
- GSD's architecture has TWO layers: (1) markdown layer (slash commands + workflows) and (2) Node.js layer (gsd-tools.cjs + lib modules)
- The codebase map at `.planning/codebase/` provides detailed architecture, stack, conventions, and structure docs
- Shipped: ~7,200 LOC (Node.js/JSON), 3 modules, 19 lessons total, 3 mini-projects
- AI curriculum: ~3,500 LOC generated markdown (3 per-module docs + 1 master README)
- 125+ tests passing (renderer, navigator, progress, verifier, hints, feedback, markdown-renderer)
- Module 3 teaches the planning system that built gsd-learn itself (meta-recursive)

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
| Hub-and-spoke navigation | Module picker as central hub simplifies all entry/exit paths | ✓ Good |
| Shared renderModuleList | Single renderer for welcome and picker eliminates UI duplication (DISC-04) | ✓ Good |
| Inline hints via stdout.write | No screen clear on H key; hints accumulate below content naturally | ✓ Good |
| Chained progress migrations | v1→v2→v3 chain in loadProgress ensures zero data loss across versions | ✓ Good |
| Action variable dispatch pattern | Dispatch loop uses action variable for extensibility (welcome/picker/navigate) | ✓ Good |
| Template-first mini-project pedagogy | Provide real working content as starting point instead of building from scratch; learner focuses on customization and understanding | ✓ Good |
| Dynamic recommended flag | First uncompleted module gets "Start here" instead of hardcoded index; scales with any number of modules | ✓ Good |
| Artifact-persistence mini-project | Extends existing skeptic command rather than creating new artifacts; teaches read-previous/write-new pattern through a tool learner already built | ✓ Good |
| TDD for markdown renderer | Pure function rendering engine tested in isolation before wiring to export script | ✓ Good |
| Heading-level bump for master README | Simple regex bumps all headings so modules nest under a single h1; avoids AST complexity | ✓ Good |

## Current Milestone: v5.0 Agent Orchestration Module

**Goal:** Teach how GSD orchestrates work through subagents — the execution engine that turns plans into code via wave-based parallelization, checkpoints, and auto-advance chains.

**Target features:**
- Module 4: Agent Orchestration (6-7 lessons + mini-project)
- Lessons covering: subagent types, wave execution, orchestrator pattern, checkpoints, auto-advance
- Content parsed from actual .agents/ configs and orchestration workflows
- Mini-project exercising agent orchestration concepts
- AI curriculum export updated

---
*Last updated: 2026-03-15 after v5.0 milestone started*
