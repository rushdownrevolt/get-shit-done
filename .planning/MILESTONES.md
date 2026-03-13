# Milestones: GSD Learn
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
