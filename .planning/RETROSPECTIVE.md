# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v2.2 — Module Discovery & Welcome

**Shipped:** 2026-03-14
**Phases:** 3 | **Plans:** 6 | **Sessions:** ~2

### What Was Built
- Welcome screen with GSD pitch for first-time users
- Module picker with numbered selection, progress indicators, and "Start here" flag
- Resume-to-last-position via v3 progress schema with chained v1→v2→v3 migration
- M key to return to module picker from any lesson (saves progress before switching)
- H key for progressive inline hints on mini-project steps (persists across sessions via feedback events)
- Context-dependent navigation footer with dynamic key labels

### What Worked
- Hub-and-spoke architecture (module picker as central hub) simplified all navigation paths
- Shared renderModuleList between welcome and picker eliminated duplication cleanly (DISC-04)
- All 3 phases reached Nyquist compliance with 113/113 tests — best test coverage yet
- Retroactive verification of phases 01.1 and 03 cleaned up v1.0 gaps without code changes
- Integration checker confirmed all 11 requirements wired end-to-end before completion

### What Was Inefficient
- Phase 10 VERIFICATION.md was missing — caught by milestone audit, required extra verifier run
- SUMMARY.md frontmatter `requirements_completed` field was empty across all 6 plans — 3-source cross-reference fell back to 2 sources
- VALIDATION.md files created in draft state during planning but never updated during execution — had to run validate-phase for all 3 phases at audit time
- Milestone completion ran twice (CLI + manual), creating duplicate MILESTONES.md entry that needed manual cleanup

### Patterns Established
- Action variable dispatch pattern in gsd-learn.cjs for extensible screen routing
- Inline stdout.write for hints (no screen clear) — accumulative display in terminal
- Feedback events for cross-session state (hint count persistence)
- isFirstRun as pure function for testability

### Key Lessons
1. VERIFICATION.md should never be skipped during execute-phase — Phase 10's missing file cost an extra audit cycle
2. Nyquist validation at audit time works but is slower than doing it during execution — validate-phase should be part of the execute-phase flow
3. Hub-and-spoke navigation is the right pattern for multi-module CLI tools — all transitions funnel through one central screen
4. 113 tests with zero failures (excluding pre-existing) across 3 phases proves TDD discipline pays off at scale

### Cost Observations
- Model mix: ~60% opus (executor, orchestrator), ~40% sonnet (verifier, integration checker, nyquist auditor)
- Sessions: ~2
- Notable: 6 plans in ~12 min execution (avg 2min/plan) — fastest per-plan velocity yet

---

## Milestone: v2.1 — Full-Stack Mini-Project

**Shipped:** 2026-03-13
**Phases:** 2 | **Plans:** 2 | **Sessions:** 1

### What Was Built
- Module 2 mini-project rewritten from echo to full-stack skeptic (all 4 GSD command layers)
- 4-artifact verification spec with cross-module check carry-forward from Module 1
- 5 progressive hints rewritten for full-stack skeptic guidance

### What Worked
- Small focused milestone (2 phases, 2 plans) executed extremely fast (~5 min total)
- Clean phase separation: lesson+spec in Phase 7, hints in Phase 8 — no coupling issues
- Cross-module spec carry-forward kept all Module 1 checks intact automatically

### What Was Inefficient
- Discuss-phase for Phase 8 added little value — all decisions were Claude's discretion for a simple content update
- Research was disabled but would have been overkill for a 1-file hints rewrite

### Patterns Established
- Cross-module verification continuity: when updating Module N, carry forward Module N-1 checks verbatim
- Hint rewriting as separate phase from lesson content — keeps concerns clean

### Key Lessons
1. For small content-only milestones, skip discuss-phase and go straight to plan — the overhead isn't justified
2. The progressive hint pattern (5 hints, vague→specific) scales well across different project types

### Cost Observations
- Model mix: ~70% opus (executor), ~30% sonnet (verifier, checker)
- Sessions: 1
- Notable: Fastest milestone yet — 2 plans in ~5 min avg

---

## Milestone: v2.0 — GSD Commands & Workflows Module

**Shipped:** 2026-03-12
**Phases:** 3 | **Plans:** 6 | **Sessions:** ~3

### What Was Built
- Multi-module infrastructure (progress migration, module-owned concept maps, tilde resolution, ordering)
- GSD markdown parser with nested XML extraction for command specs and workflows
- Generic {{KEY}} template system for markdown-based lesson generation
- 6-lesson module teaching GSD slash commands and workflow files
- Structural mini-project verification (11 checks) with 5 progressive hints

### What Worked
- Coarse 3-phase granularity kept planning overhead minimal for a content-heavy milestone
- Infrastructure-first approach (Phase 4) unblocked content phases completely — zero rework
- Hand-authored lessons with real source snippets produced high-quality authentic content
- Wave 0 test pattern enabled incremental delivery without blocking CI
- Milestone audit caught 7 stale checkboxes and identified tech debt cleanly

### What Was Inefficient
- Nyquist VALIDATION.md files left in draft state across all 3 phases — process gap not caught until audit
- ROADMAP.md progress table not updated during execution — manual bookkeeping fell behind
- REQUIREMENTS.md checkboxes for Phase 4 not updated — traceability table went stale
- Phase 01.2 gap closure (01.2-03) added mid-milestone for content grouping — should have been in original scope

### Patterns Established
- Module-owned assets: each module directory is self-contained (module.json, concept-map.txt, lessons/, project/)
- Two parallel template systems: assemblePrompt for CJS sources, assembleMarkdownPrompt for .md files
- Auto-migration pattern: loadProgress detects v1 schema and migrates transparently
- Wave 0 test scaffold: tests pass with partial content, validate fully when complete

### Key Lessons
1. Markdown-based lessons (teaching .md files) are simpler to build than CJS-based lessons — content is more accessible
2. Real source code snippets in lessons are worth the extraction effort — authenticity drives learning quality
3. Stale bookkeeping (checkboxes, progress tables, VALIDATION.md) accumulates silently — milestone audit is essential to catch it
4. Infrastructure phases that produce clean APIs make content phases trivially fast (4 min avg for Phase 5-6 plans)

### Cost Observations
- Model mix: ~80% sonnet (agents), ~20% opus (orchestration)
- Sessions: ~3 (planning, execution, audit+completion)
- Notable: 6 plans in ~25 min total — infrastructure investment paid off in fast content phases

---

## Milestone: v1.0 — Command Lifecycle Module

**Shipped:** 2026-03-12
**Phases:** 6 (1, 01.1, 01.2, 2, 02.1, 3) | **Plans:** 13 | **Sessions:** ~5

### What Was Built
- Interactive learning shell with ANSI formatting, navigation, progress tracking
- Block-based display with progressive accumulation and focus/bridge annotations
- Prompt-driven content pipeline with source parser, templates, evaluator
- Clipboard copy (press 'c' for LLM-friendly markdown)
- Mini-project validation with structural verifier, progressive hints, feedback tracking
- Complete Command Lifecycle module (6 lessons)

### What Worked
- MVP-first approach de-risked lesson design before committing to full course
- Regex-based parsing proved sufficient for GSD's consistent CommonJS patterns
- Mini-project design validated: structural verification + progressive hints works well
- Rapid iteration: average plan execution ~3.5 min

### What Was Inefficient
- Phase 01.1 and 01.2 inserted mid-milestone — display model wasn't right initially
- Clipboard formatter tests (13 failures) never fixed — carried forward as tech debt
- Phase 02.1 was reactive insertion rather than planned — clipboard copy discovered as need during testing

### Patterns Established
- TDD RED-GREEN-REFACTOR for all feature plans
- Atomic commits per task within plans
- SUMMARY.md as structured execution record

### Key Lessons
1. Display model needs to be right before investing in content — Phase 01.1/01.2 insertions were necessary but could have been anticipated
2. Mini-projects are a better learning assessment than any quiz format
3. Prompt engineering pipeline with evaluation rubric produces consistently good lesson content

### Cost Observations
- Model mix: ~70% sonnet, ~30% opus
- Sessions: ~5
- Notable: 13 plans in ~28 min — very efficient for an MVP with 6 inserted phases

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Plans | Key Change |
|-----------|----------|--------|-------|------------|
| v1.0 | ~5 | 6 | 13 | Established TDD, atomic commits, SUMMARY.md pattern |
| v2.0 | ~3 | 3 | 6 | Coarse granularity, infrastructure-first, milestone audit |
| v2.1 | 1 | 2 | 2 | Focused content update, cross-module verification |
| v2.2 | ~2 | 3 | 6 | Full Nyquist compliance, integration checker, hub-and-spoke nav |

### Cumulative Quality

| Milestone | Tests | Known Failures | Nyquist Compliant |
|-----------|-------|----------------|-------------------|
| v1.0 | ~50 | 13 (clipboard) | No |
| v2.0 | ~71 | 13 (clipboard, carried) | No (draft) |
| v2.1 | ~71 | 13 (clipboard, carried) | No (draft) |
| v2.2 | 113 | 13 (clipboard, carried) | Yes (3/3 phases) |

### Top Lessons (Verified Across Milestones)

1. Infrastructure phases that produce clean APIs make all subsequent phases faster — validated in v1.0, v2.0, and v2.2 (Phase 9 architecture → Phase 10-11 UI)
2. Real source code in lessons is essential for authenticity — both modules use actual GSD source snippets
3. Stale bookkeeping is the #1 process gap — milestone audits catch what execution misses (v2.0 checkboxes, v2.2 missing VERIFICATION.md)
4. Small focused milestones execute faster per-plan than large ones (v2.2: 2min/plan vs v1.0: 3.5min/plan)
5. Hub-and-spoke navigation simplifies CLI tool design — all transitions through one central screen
