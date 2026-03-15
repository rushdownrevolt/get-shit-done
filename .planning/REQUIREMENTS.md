# Requirements: GSD Learn

**Defined:** 2026-03-15
**Core Value:** The learner can confidently modify and extend GSD for their own needs, validated by their ability to achieve creative results with GSD commands.

## v3.0 Requirements

Requirements for Module 3: Planning & State. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: Module 3 registered in module system with module.json, concept-map.txt, lessons/, and project/ directories
- [x] **INFRA-02**: Progress migration chain extended (v3→v4) to support Module 3 lesson tracking
- [x] **INFRA-03**: Module picker updated to show 3 modules with correct ordering and recommended flag logic

### Lessons — Planning Overview

- [x] **PLAN-01**: Lesson 1 teaches the .planning/ directory structure and the planning lifecycle (project → requirements → roadmap → phases → milestone)
- [x] **PLAN-02**: Lesson 1 content parsed from GSD's actual planning templates and workflow files

### Lessons — Project Definition

- [ ] **PROJ-01**: Lesson 2 teaches PROJECT.md anatomy — sections (What This Is, Core Value, Requirements, Context, Constraints, Key Decisions), evolution triggers, how it feeds downstream
- [ ] **PROJ-02**: Lesson 2 content parsed from GSD's templates/project.md

### Lessons — Requirements & Roadmap

- [ ] **REQR-01**: Lesson 3 teaches REQUIREMENTS.md structure — REQ-ID format, categories, traceability table, v1/v2/out-of-scope sections
- [ ] **REQR-02**: Lesson 3 teaches ROADMAP.md structure — phase numbering, milestone grouping, progress table, success criteria derivation
- [ ] **REQR-03**: Lesson 3 shows how requirements map to phases (the traceability chain)
- [ ] **REQR-04**: Lesson 3 content parsed from GSD's templates/requirements.md and actual ROADMAP.md structure

### Lessons — Phase Lifecycle

- [ ] **PHSE-01**: Lesson 4 teaches the phase execution cycle: context → research → plan → execute → verify
- [ ] **PHSE-02**: Lesson 4 teaches PLAN.md anatomy — frontmatter (wave, depends_on, files_modified), task XML format, verification criteria, must_haves
- [ ] **PHSE-03**: Lesson 4 teaches SUMMARY.md and VERIFICATION.md as execution records
- [ ] **PHSE-04**: Lesson 4 content parsed from GSD's templates/plan.md, summary.md, and workflows

### Lessons — State & Milestones

- [ ] **MILE-01**: Lesson 5 teaches STATE.md as the live position tracker — current phase, decisions, blockers, session info
- [ ] **MILE-02**: Lesson 5 teaches the milestone lifecycle — completion, archival, MILESTONES.md, version tagging
- [ ] **MILE-03**: Lesson 5 content parsed from GSD's templates and complete-milestone workflow

### Lessons — Bridge to Practice

- [ ] **BRDG-01**: Lesson 6 synthesizes all planning concepts — shows how a real GSD project flows from idea through shipped milestone
- [ ] **BRDG-02**: Lesson 6 prepares the learner for the mini-project by connecting all artifacts into one mental model

### Mini-Project

- [ ] **MINI-01**: Mini-project extends the learner's existing skeptic command to produce a persistent artifact (e.g., SKEPTIC-REVIEW.md) capturing findings from each run
- [ ] **MINI-02**: Skeptic workflow updated to read previous review artifacts on future runs, enabling continuity across sessions
- [ ] **MINI-03**: Lesson provides the artifact-writing workflow pattern as a template (template-first pedagogy), learner customizes the output format and persistence logic
- [ ] **MINI-04**: Structural verification checks the workflow contains both read-previous and write-new patterns, and that the artifact file has expected sections (date, findings)
- [ ] **MINI-05**: 5 progressive hints guide from conceptual (why artifacts persist state) to specific (read/write patterns in the workflow)
- [ ] **MINI-06**: Mini-project outcome is a skeptic command that accumulates institutional knowledge across runs — a real tool the learner will use

## Future Requirements

### Advanced Topics (v4.0+)

- **ADV-01**: Lesson on agent orchestration (how plan-phase, execute-phase coordinate subagents)
- **ADV-02**: Lesson on the verification/validation pipeline (Nyquist, UAT, gap closure)
- **ADV-03**: Lesson on debug workflow and session management

## Out of Scope

| Feature | Reason |
|---------|--------|
| Teaching GSD agent internals (subagent configs, prompts) | Too deep for Module 3 — belongs in future advanced module |
| Interactive planning simulation | Complexity not justified — template-first approach is sufficient |
| Auto-grading planning quality | Structural verification is sufficient — quality is subjective |
| Teaching non-GSD planning tools | GSD-only constraint from PROJECT.md |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 12 | Complete |
| INFRA-02 | Phase 12 | Complete |
| INFRA-03 | Phase 12 | Complete |
| PLAN-01 | Phase 12 | Complete |
| PLAN-02 | Phase 12 | Complete |
| PROJ-01 | Phase 12 | Pending |
| PROJ-02 | Phase 12 | Pending |
| REQR-01 | Phase 13 | Pending |
| REQR-02 | Phase 13 | Pending |
| REQR-03 | Phase 13 | Pending |
| REQR-04 | Phase 13 | Pending |
| PHSE-01 | Phase 13 | Pending |
| PHSE-02 | Phase 13 | Pending |
| PHSE-03 | Phase 13 | Pending |
| PHSE-04 | Phase 13 | Pending |
| MILE-01 | Phase 14 | Pending |
| MILE-02 | Phase 14 | Pending |
| MILE-03 | Phase 14 | Pending |
| BRDG-01 | Phase 14 | Pending |
| BRDG-02 | Phase 14 | Pending |
| MINI-01 | Phase 15 | Pending |
| MINI-02 | Phase 15 | Pending |
| MINI-03 | Phase 15 | Pending |
| MINI-04 | Phase 15 | Pending |
| MINI-05 | Phase 15 | Pending |
| MINI-06 | Phase 15 | Pending |

**Coverage:**
- v3.0 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-03-15*
*Last updated: 2026-03-15 after roadmap creation*
