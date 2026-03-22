# Milestones: GSD Learn

## v8.0 GSD v1.26-1.28 Module Updates (Shipped: 2026-03-22)

**Phases completed:** 6 phases, 8 plans, 11 tasks

**Key accomplishments:**

- 5 new lessons across Modules 1 and 3 teaching /gsd:fast, /gsd:next, /gsd:ship, decision ID traceability, and CLAUDE.md Dimension 10 compliance
- 8 new lessons added across Modules 4, 5, and 6 covering advisor mode, enhanced verification, stub detection, regression gates, security hardening, multi-runtime support, forensics debugging, and developer profiling -- all using real source snippets from GSD workflows and GSD-2 source files.
- Module 7 registered as workspaces-collaboration with 8 sectionMap entries and v7-to-v8 progress migration adding module entry per D-09
- 8 skeleton JSON lessons for Module 7 with placeholder content, sequential numbering, and sectionMap-matching IDs
- 4 full lessons teaching workspaces and collaboration with real snippets from worktree-manager.ts, workspace-index.ts, and review/SKILL.md
- Three workspace lessons with real GSD source snippets covering isolation layers, lifecycle phases, and collaboration patterns including workstreams vs milestones decision guidance
- Cross-AI review orchestrator challenge with 6 structural checks, 5 progressive hints, and template-first pedagogy following Modules 5/6 pattern
- Regenerated AI curriculum export with Module 7 (Workspaces & Collaboration) and v8.0 lesson updates across all 7 modules

---

## v7.0 GSD-2 — The Agent Application (Shipped: 2026-03-20)

**Phases completed:** 5 phases, 10 plans, 0 tasks

**Key accomplishments:**

- (none recorded)

---

## v6.0 — Quality & Feedback Loops Module (Shipped: 2026-03-16)

**Completed:** 2026-03-16
**Phases:** 22, 23, 24, 25 (4 phases, 5 plans)
**Last phase number:** 25

**What shipped:**

- Module 5: Quality & Feedback Loops with 8 lessons (7 content + 1 mini-project) teaching verify-work/UAT, skeptic reviews, debug workflows, gap closure, and milestone audit
- All lesson content uses real code snippets from GSD's verification and debugging workflows
- Mini-project: quality verification extension to the skeptic command (severity, UAT checklist, gap tracking)
- v5→v6 progress migration chain (29 tests passing)
- AI curriculum updated — quality-feedback.md (706 lines) + master README with all 5 modules

**Requirements completed:** INFR-01, INFR-02, INFR-03, LESS-01, LESS-02, LESS-03, LESS-04, LESS-05, LESS-06, LESS-07, MINI-01, MINI-02, MINI-03, EXPO-01

**Key learnings:**

- Full auto-advance pipeline across all 4 phases in a single session (same as v5.0)
- Proven module template: infra → content (2 waves) → mini-project → export scales to 5th module
- Skeptic lesson adapted successfully despite missing workflows/skeptic.md — used verify-phase.md + plan-checker instead

---

## v5.0 — Agent Orchestration Module (Shipped: 2026-03-16)

**Completed:** 2026-03-16
**Phases:** 18, 19, 20, 21 (4 phases, 5 plans)
**Last phase number:** 21

**What shipped:**

- Module 4: Agent Orchestration with 8 lessons (7 content + 1 mini-project) teaching subagent types, wave execution, orchestrator pattern, checkpoints, and auto-advance chains
- All lesson content uses real code snippets from GSD's .agents/ configs and orchestration workflows
- Mini-project: learner extends skeptic with parallel review subagents organized in waves with aggregation
- v4→v5 progress migration chain with save-once refactor (25 tests passing)
- AI curriculum updated — agent-orchestration.md (701 lines) + master README with all 4 modules

**Requirements completed:** INFR-01, INFR-02, INFR-03, LESS-01, LESS-02, LESS-03, LESS-04, LESS-05, LESS-06, LESS-07, MINI-01, MINI-02, MINI-03, EXPO-01

**Key learnings:**

- Full auto-advance pipeline (plan → execute → verify) across all 4 phases in a single session
- Mirrors v3.0 pattern (infra → content waves → mini-project) — proven structure scales to new modules
- Content phases benefit from wave splitting (lessons 1-3, then 4-7) for manageable executor context

---

## v4.0 — AI-Ready Curriculum (Shipped: 2026-03-15)

**Completed:** 2026-03-15
**Phases:** 16, 17 (2 phases, 3 plans)
**Last phase number:** 17

**What shipped:**

- TDD-built markdown rendering engine (6 functions, 12 tests) converting JSON lessons to clean markdown
- Export script (`node learn/bin/export-docs.cjs`) producing all docs idempotently from lesson JSON
- 3 per-module curriculum docs (gsd-commands, command-lifecycle, planning-state) with full lesson content, code blocks, mini-project specs, progressive hints, and concept maps
- 1,760-line master README.md — self-contained AI curriculum with TOC and all 3 modules in learning order
- All generated docs committed alongside the export script for easy access

**Requirements completed:** EXPT-01, EXPT-02, EXPT-03, EXPT-04, MODD-01, MODD-02, MODD-03, MODD-04, MODD-05, MSTR-01, MSTR-02, MSTR-03, OUTM-01, OUTM-02

**Key learnings:**

- Full auto-advance pipeline (plan → execute → verify) across both phases in a single session
- Small focused milestone (2 phases) from milestone init to completion in ~15 min
- TDD approach for renderer paid off — clean separation between rendering engine and orchestration script

---

## v3.0 — Planning & State Module (Shipped: 2026-03-15)

**Completed:** 2026-03-15
**Phases:** 12, 13, 14, 15 (4 phases, 9 plans)
**Last phase number:** 15

**What shipped:**

- Module 3: Planning & State with 7 lessons (6 content + 1 mini-project) teaching the full GSD planning lifecycle
- Lessons cover .planning/ directory structure, PROJECT.md anatomy, REQUIREMENTS.md/ROADMAP.md structure, phase execution cycle, STATE.md tracking, milestone lifecycle, and synthesis
- All lesson content parsed from GSD's actual planning templates and workflow files
- Artifact-persistence mini-project: learner extends skeptic command to write persistent SKEPTIC-REVIEW.md and read previous reviews
- Dynamic module picker recommended flag (first uncompleted module instead of hardcoded index)
- v3→v4 progress migration chain for Module 3 lesson tracking

**Requirements completed:** INFRA-01, INFRA-02, INFRA-03, PLAN-01, PLAN-02, PROJ-01, PROJ-02, REQR-01, REQR-02, REQR-03, REQR-04, PHSE-01, PHSE-02, PHSE-03, PHSE-04, MILE-01, MILE-02, MILE-03, BRDG-01, BRDG-02, MINI-01, MINI-02, MINI-03, MINI-04, MINI-05, MINI-06

**Key learnings:**

- Full auto-advance pipeline (plan → execute → verify) across 4 phases completed in a single session
- Parallel lesson creation in wave-based execution worked smoothly for content-only phases
- Template-first pedagogy validated again: mini-project provides workflow pattern, learner customizes
- Plan checker caught a conceptMap collision (Lesson 6 "overview" → "mini-project") before execution — revision loop works

**Tech debt carried forward:**

- 13 pre-existing clipboard-formatter.test.cjs failures (from v1.0, non-blocking)

---

## v2.3 — Mini-Project Template Improvement (Shipped: 2026-03-15)

**Completed:** 2026-03-15
**Phases:** 11.1 (1 phase, 1 plan)
**Last phase number:** 11.1

**What shipped:**

- Module 1 mini-project now provides the real GSD skeptic workflow as a starting template
- Lesson 6 shifted from "build from scratch" to "learn from a working example, then customize"
- All 5 progressive hints rewritten for template-based approach
- Clipboard copy (C key) delivers the complete workflow template

**Key learnings:**

- Template-first pedagogy works well for complex structures — learner focuses on understanding and customization rather than structural guesswork
- Single-phase milestones execute very efficiently (~45 min discuss → plan → execute → verify → complete)

**Tech debt carried forward:**

- 13 pre-existing clipboard-formatter.test.cjs failures (from v1.0 Phase 02.1)

---

## v2.2 — Module Discovery & Welcome (Shipped: 2026-03-14)

**Completed:** 2026-03-14
**Phases:** 9, 10, 11 (3 phases, 6 plans)
**Last phase number:** 11

**What shipped:**

- Welcome screen with GSD pitch for first-time users, communicating what they'll build
- Module picker with per-module progress indicators and "Start here" recommended flag
- Resume-to-last-position for returning users via v3 progress schema with chained migration
- "M" key binding to navigate to module page from any lesson (saves progress before switching)
- "H" key binding for progressive inline hints on mini-project steps (persists across sessions)
- Context-dependent navigation footer showing available keys based on current screen

**Requirements completed:** WELC-01, WELC-02, WELC-03, DISC-01, DISC-02, DISC-03, DISC-04, NAV-01, NAV-02, NAV-03, NAV-04

**Key learnings:**

- Hub-and-spoke architecture (module picker as central navigation hub) simplifies all entry/exit paths
- Shared renderer pattern (renderModuleList) eliminates UI duplication between welcome and picker
- Inline hints via stdout.write (no screen clear) feels natural in terminal context
- All 3 phases Nyquist-compliant with 113/113 tests passing

**Tech debt carried forward:**

- 13 pre-existing clipboard-formatter.test.cjs failures (from v1.0 Phase 02.1)
- `--hint` CLI flag path lacks try/catch around hints.json read (latent crash)

---

## v2.1 — Full-Stack Mini-Project (Shipped: 2026-03-13)

**Completed:** 2026-03-13
**Phases:** 7, 8 (2 phases, 2 plans)
**Last phase number:** 8

**What shipped:**

- Module 2 mini-project rewritten from standalone echo to full-stack skeptic command extending Module 1
- 4-layer verification spec (command.md, workflow.md, skeptic.cjs handler, gsd-tools.cjs switch case)
- All 9 Module 1 spec checks carried forward verbatim into Module 2 for cross-module continuity
- Progressive hints rewritten to acknowledge Module 1 work and guide Node.js backend creation

**Requirements completed:** MP-01, MP-02, VER-01, VER-02, HNT-01

**Key learnings:**

- Small focused milestones (2 phases) execute very efficiently (~5 min total)
- Cross-module verification continuity (carrying forward checks) prevents regression
- Hint rewriting is a separate concern from lesson content — clean phase separation works

**Tech debt carried forward:**

- 13 pre-existing clipboard-formatter.test.cjs failures (from v1.0 Phase 02.1)

---

## v2.0 — GSD Commands & Workflows Module (Shipped: 2026-03-12)

**Completed:** 2026-03-12
**Phases:** 4, 5, 6 (3 phases, 6 plans)
**Last phase number:** 6

**What shipped:**

- Multi-module infrastructure with v1-to-v2 progress auto-migration (zero data loss)
- GSD markdown parser for command specs and workflow files (nested XML extraction)
- Generic `{{KEY}}` template system with fail-loud replacement for lesson generation
- 6-lesson GSD Commands & Workflows module using real source code content
- Structural mini-project verification (11 checks) with 5 progressive hints
- Module renumbering — GSD Commands is Module 1, Command Lifecycle becomes Module 2

**Requirements completed:** INFRA-01 through INFRA-04, PIPE-01 through PIPE-03, MOD1-01 through MOD1-08, MOD2-01

**Key learnings:**

- Markdown parser with nested XML extraction handles GSD's workflow format cleanly
- Hand-authored lessons with real source snippets produce high-quality content
- Wave 0 test pattern enables incremental delivery with graceful degradation
- Average plan execution: ~4 min; total milestone execution: ~25 min

**Tech debt carried forward:**

- 13 pre-existing clipboard-formatter.test.cjs failures (from v1.0 Phase 02.1)
- 3 Nyquist VALIDATION.md files in draft state (process gap, not code gap)

---

## v1.0 — Command Lifecycle Module (Complete)

**Completed:** 2026-03-12
**Phases:** 1, 2, 02.1, 3 (4 phases, 8 plans)
**Last phase number:** 3

**What shipped:**

- Interactive Learning Shell (terminal rendering, progress tracking, navigation)
- Prompt-Driven Content Pipeline (source parser, prompt templates, evaluator, lesson generation)
- Clipboard Copy (press 'c' to copy lesson as LLM-friendly markdown)
- Mini-Project Validation (verifier, progressive hints, feedback tracking)
- One complete module: Command Lifecycle (follow `/gsd:quick` end-to-end)

**Requirements completed:** DISP-01 through DISP-03, CONT-01 through CONT-05, PROG-01 through PROG-03, VALD-01 through VALD-04, MODL-01 through MODL-04, CP-01 through CP-06

**Key learnings:**

- Regex-based parsing is sufficient for GSD's consistent CommonJS patterns
- Prompt engineering pipeline generates quality lessons with evaluation-driven iteration
- Mini-project design validated: structural verification + progressive hints works
- Average plan execution: 4 min; total milestone execution: ~22 min
