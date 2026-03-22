# GSD Learn

## What This Is

A Node.js CLI tool that teaches how GSD (Get Shit Done) works through guided, interactive terminal lessons. It parses GSD's actual source files to generate lesson content, tracks per-module learning progress across sessions, and validates understanding through hands-on mini-projects — not quizzes. Ships six modules: GSD Commands & Workflows (markdown layer), Command Lifecycle (Node.js layer), Planning & State (planning system), Agent Orchestration (subagent execution engine), Quality & Feedback Loops (verification and debugging), and GSD-2: The Agent Application (the evolution from prompt framework to standalone CLI). Features a welcome screen, module picker with progress tracking, and context-dependent navigation. Also ships an AI-ready curriculum export (`docs/ai-curriculum/`) — a self-contained master document and per-module docs that let an LLM learn GSD by reading structured markdown.

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
- ✓ Module 4: Agent Orchestration with 8 lessons covering subagent types, wave execution, orchestrator pattern, checkpoints, auto-advance — v5.0
- ✓ v4→v5 progress migration for Module 4 tracking — v5.0
- ✓ AI curriculum export updated with Module 4 content — v5.0
- ✓ Module 5: Quality & Feedback Loops with 8 lessons covering verify-work, UAT, skeptic, debug, gap closure, milestone audit — v6.0
- ✓ v5→v6 progress migration for Module 5 tracking — v6.0
- ✓ AI curriculum export updated with Module 5 content — v6.0
- ✓ Module 6: GSD-2 — The Agent Application with 8 lessons covering dispatch pipeline, auto mode, git worktrees, skills/extensions, context engineering — v7.0
- ✓ v6→v7 progress migration for Module 6 tracking — v7.0
- ✓ AI curriculum export updated with Module 6 content — v7.0

### Active

<!-- v8.0 scope -->

- Update Module 1 lessons for new GSD v1.26-1.28 slash commands (forensics, fast, ship, next, profile-user, etc.)
- Update Module 3 lessons for decision IDs, CLAUDE.md compliance (plan-checker Dimension 10)
- Update Module 4 lessons for advisor mode, cross-AI peer review, MCP tool awareness
- Update Module 5 lessons for enhanced verification (data-flow tracing, stub detection, regression gate, security hardening)
- Update Module 6 lessons for multi-runtime support, forensics debugging, developer profiling
- New Module 7: Workspaces & Collaboration (workstream namespacing, multi-project workspaces, cross-AI peer review)
- Module 7 infrastructure (v7→v8 progress migration, module registration)
- AI curriculum export updated with all module changes

## Current Milestone: v8.0 GSD v1.26-1.28 Module Updates

**Goal:** Update existing GSD Learn modules for features added in GSD v1.26-1.28 and add Module 7: Workspaces & Collaboration

**Target features:**
- Update Modules 1, 3, 4, 5, 6 for new GSD features (10+ new commands, advisor mode, enhanced verification, multi-runtime)
- New Module 7: Workspaces & Collaboration — workstream namespacing, multi-project workspaces, cross-AI peer review
- Module 7 infrastructure with v7→v8 progress migration
- AI curriculum export with all changes

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
- Shipped: ~10,300 LOC (Node.js/JSON), 6 modules, 43 lessons total, 6 mini-projects
- AI curriculum: ~5,600 LOC generated markdown (6 per-module docs + 1 master README)
- 300 tests passing (renderer, navigator, progress, verifier, hints, feedback, markdown-renderer)
- Module 3 teaches the planning system that built gsd-learn itself (meta-recursive)
- GSD-2 (v2.35.0) installed globally via `npm install -g gsd-pi` — source at `C:/Users/18182/AppData/Roaming/npm/node_modules/gsd-pi/`
- GSD-2 is a TypeScript CLI built on Pi SDK; source files for lessons live in `src/resources/extensions/gsd/` (prompts, templates, skills, auto mode)

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
| GSD-2 source as external content | Module 6 uses real snippets from npm-installed gsd-pi package rather than parsing own codebase; works because GSD-2 is installed globally | ✓ Good |
| Dispatch-loop mini-project | Learner extends skeptic with auto-mode-inspired state machine; exercises concepts from all 7 lessons | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-22 after v8.0 milestone start*
