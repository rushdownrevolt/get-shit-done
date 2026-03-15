# Requirements: GSD Learn

**Defined:** 2026-03-15
**Core Value:** The learner can confidently modify and extend GSD for their own needs, validated by their ability to achieve creative results with GSD commands.

## v1 Requirements

Requirements for v4.0 AI-Ready Curriculum. Each maps to roadmap phases.

### Export Pipeline

- [x] **EXPT-01**: Export script reads all module JSON files and produces markdown output
- [x] **EXPT-02**: Script is runnable via `node learn/bin/export-docs.cjs` with no arguments
- [x] **EXPT-03**: Script outputs to `docs/ai-curriculum/` directory
- [x] **EXPT-04**: Running script regenerates all docs from current lesson JSON (idempotent)

### Per-Module Docs

- [x] **MODD-01**: Each module produces one markdown file with all lessons rendered sequentially
- [x] **MODD-02**: Code blocks rendered with language annotations (```yaml, ```markdown, etc.)
- [x] **MODD-03**: Mini-project spec included with verification checks listed
- [x] **MODD-04**: Progressive hints included after mini-project section
- [x] **MODD-05**: Module concept map included as ASCII diagram

### Master Document

- [x] **MSTR-01**: Single README.md combines all modules in learning order (Module 1 → 2 → 3)
- [x] **MSTR-02**: Table of contents with links to each module and lesson
- [x] **MSTR-03**: Self-contained — AI reads one file to learn complete GSD curriculum

### Output Management

- [x] **OUTM-01**: Generated docs committed to `docs/ai-curriculum/` in repo
- [x] **OUTM-02**: Export script and output both exist (script generates, output is checked in)

## v2 Requirements

Deferred to future release.

- **EXPT-05**: Watch mode — auto-regenerate docs when lesson JSON changes
- **MSTR-04**: Include GSD architecture overview section before lessons
- **MODD-06**: Include cross-references between modules (e.g., "builds on Module 1 concept X")

## Out of Scope

| Feature | Reason |
|---------|--------|
| PDF or HTML output | Markdown is universally readable by LLMs |
| Lesson content editing | This milestone exports existing content, not authoring |
| AI-specific prompt engineering in output | Clean documentation is better than prompt-engineered text |
| Interactive elements in output | Static docs for context window ingestion |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| EXPT-01 | Phase 16 | Complete |
| EXPT-02 | Phase 16 | Complete |
| EXPT-03 | Phase 16 | Complete |
| EXPT-04 | Phase 16 | Complete |
| MODD-01 | Phase 16 | Complete |
| MODD-02 | Phase 16 | Complete |
| MODD-03 | Phase 16 | Complete |
| MODD-04 | Phase 16 | Complete |
| MODD-05 | Phase 16 | Complete |
| MSTR-01 | Phase 17 | Complete |
| MSTR-02 | Phase 17 | Complete |
| MSTR-03 | Phase 17 | Complete |
| OUTM-01 | Phase 17 | Complete |
| OUTM-02 | Phase 17 | Complete |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-03-15*
*Last updated: 2026-03-15 after roadmap creation*
