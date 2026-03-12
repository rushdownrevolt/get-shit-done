# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

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

### Cumulative Quality

| Milestone | Tests | Known Failures | Zero-Dep Additions |
|-----------|-------|----------------|-------------------|
| v1.0 | ~50 | 13 (clipboard) | 0 |
| v2.0 | ~71 | 13 (clipboard, carried) | 0 |

### Top Lessons (Verified Across Milestones)

1. Infrastructure phases that produce clean APIs make all subsequent phases faster — validated in both v1.0 (Phase 1 → Phase 2-3) and v2.0 (Phase 4 → Phase 5-6)
2. Real source code in lessons is essential for authenticity — both modules use actual GSD source snippets
3. Stale bookkeeping is the #1 process gap — milestone audits catch what execution misses
