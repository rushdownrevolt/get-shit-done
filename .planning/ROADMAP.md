# Roadmap: GSD Learn

## Milestones

- ✅ **v1.0 MVP** — Phases 1-3 + 01.1, 02.1 (shipped 2026-03-12)
- ✅ **v2.0 GSD Commands & Workflows Module** — Phases 4-6 (shipped 2026-03-12)
- ✅ **v2.1 Full-Stack Mini-Project** — Phases 7-8 (shipped 2026-03-13)
- ✅ **v2.2 Module Discovery & Welcome** — Phases 9-11 (shipped 2026-03-14)
- ✅ **v2.3 Mini-Project Template Improvement** — Phase 11.1 (shipped 2026-03-15)
- ✅ **v3.0 Planning & State Module** — Phases 12-15 (shipped 2026-03-15)
- 🚧 **v4.0 AI-Ready Curriculum** — Phases 16-17 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-3 + 01.1, 02.1) — SHIPPED 2026-03-12</summary>

- [x] Phase 1: Interactive Learning Shell (2/2 plans) — completed 2026-03-12
- [x] Phase 01.1: Block-based Display (2/2 plans) — completed 2026-03-12
- [x] Phase 01.2: Progressive Accumulation (3/3 plans) — completed 2026-03-12
- [x] Phase 2: Prompt-Driven Content Pipeline (2/2 plans) — completed 2026-03-12
- [x] Phase 02.1: Clipboard Copy (1/1 plan) — completed 2026-03-12
- [x] Phase 3: Mini-Project Validation (3/3 plans) — completed 2026-03-12

</details>

<details>
<summary>v2.0 GSD Commands & Workflows Module (Phases 4-6) — SHIPPED 2026-03-12</summary>

- [x] Phase 4: Multi-Module Infrastructure (3/3 plans) — completed 2026-03-12
- [x] Phase 5: Module 1 Lessons (2/2 plans) — completed 2026-03-12
- [x] Phase 6: Module 1 Mini-Project (1/1 plan) — completed 2026-03-12

</details>

<details>
<summary>v2.1 Full-Stack Mini-Project (Phases 7-8) — SHIPPED 2026-03-13</summary>

- [x] Phase 7: Full-Stack Lesson and Verification (1/1 plan) — completed 2026-03-13
- [x] Phase 8: Full-Stack Hints (1/1 plan) — completed 2026-03-13

</details>

<details>
<summary>v2.2 Module Discovery & Welcome (Phases 9-11) — SHIPPED 2026-03-14</summary>

- [x] Phase 9: Navigation Architecture & Progress Foundation (2/2 plans) — completed 2026-03-13
- [x] Phase 10: Welcome Screen & Module Picker (2/2 plans) — completed 2026-03-13
- [x] Phase 11: Key Bindings & Navigation Footer (2/2 plans) — completed 2026-03-14

</details>

<details>
<summary>v2.3 Mini-Project Template Improvement (Phase 11.1) — SHIPPED 2026-03-15</summary>

- [x] Phase 11.1: Improve Module 1 mini-project to provide skeptic workflow template (1/1 plan) — completed 2026-03-15

</details>

<details>
<summary>v3.0 Planning & State Module (Phases 12-15) — SHIPPED 2026-03-15</summary>

- [x] Phase 12: Module 3 Infrastructure & First Lessons (3/3 plans) — completed 2026-03-15
- [x] Phase 13: Requirements, Roadmap & Phase Lifecycle Lessons (2/2 plans) — completed 2026-03-15
- [x] Phase 14: State, Milestones & Bridge Lessons (2/2 plans) — completed 2026-03-15
- [x] Phase 15: Planning Mini-Project (2/2 plans) — completed 2026-03-15

</details>

### v4.0 AI-Ready Curriculum

- [x] **Phase 16: Per-Module Export** - Build export script that converts JSON lessons to per-module markdown docs with code blocks, mini-project specs, hints, and concept maps (completed 2026-03-15)
- [ ] **Phase 17: Master Document & Commit** - Assemble master README combining all modules sequentially, and commit all generated output

## Phase Details

### Phase 16: Per-Module Export
**Goal**: Users can run a single script to produce clean, complete markdown documentation for each learning module
**Depends on**: Nothing (first phase of v4.0; reads existing lesson JSON from v3.0)
**Requirements**: EXPT-01, EXPT-02, EXPT-03, EXPT-04, MODD-01, MODD-02, MODD-03, MODD-04, MODD-05
**Success Criteria** (what must be TRUE):
  1. Running `node learn/bin/export-docs.cjs` with no arguments produces 3 markdown files in `docs/ai-curriculum/` (one per module)
  2. Each module doc contains all lessons rendered sequentially with code blocks using correct language annotations (```yaml, ```markdown, etc.)
  3. Each module doc includes the mini-project spec with verification checks listed, followed by progressive hints
  4. Each module doc includes the concept map rendered as ASCII diagram
  5. Re-running the script on unchanged JSON produces identical output (idempotent regeneration)
**Plans**: 2 plans

Plans:
- [ ] 16-01-PLAN.md — TDD markdown renderer (lesson, project, hints, concept-map rendering)
- [ ] 16-02-PLAN.md — Export script orchestration and end-to-end verification

### Phase 17: Master Document & Commit
**Goal**: An AI can read one file to learn the complete GSD curriculum, and all generated docs are committed to the repo
**Depends on**: Phase 16
**Requirements**: MSTR-01, MSTR-02, MSTR-03, OUTM-01, OUTM-02
**Success Criteria** (what must be TRUE):
  1. `docs/ai-curriculum/README.md` exists and combines all 3 modules in learning order (Module 1 -> 2 -> 3)
  2. README includes a table of contents with links to each module section and lesson
  3. README is self-contained — an AI reading only this file understands the complete GSD curriculum
  4. Both the export script (`learn/bin/export-docs.cjs`) and all generated docs (`docs/ai-curriculum/`) are committed to the repo
**Plans**: TBD

Plans:
- [ ] 17-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 16 -> 17

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Interactive Learning Shell | v1.0 | 2/2 | Complete | 2026-03-12 |
| 01.1. Block-based Display | v1.0 | 2/2 | Complete | 2026-03-12 |
| 01.2. Progressive Accumulation | v1.0 | 3/3 | Complete | 2026-03-12 |
| 2. Prompt-Driven Content Pipeline | v1.0 | 2/2 | Complete | 2026-03-12 |
| 02.1. Clipboard Copy | v1.0 | 1/1 | Complete | 2026-03-12 |
| 3. Mini-Project Validation | v1.0 | 3/3 | Complete | 2026-03-12 |
| 4. Multi-Module Infrastructure | v2.0 | 3/3 | Complete | 2026-03-12 |
| 5. Module 1 Lessons | v2.0 | 2/2 | Complete | 2026-03-12 |
| 6. Module 1 Mini-Project | v2.0 | 1/1 | Complete | 2026-03-12 |
| 7. Full-Stack Lesson and Verification | v2.1 | 1/1 | Complete | 2026-03-13 |
| 8. Full-Stack Hints | v2.1 | 1/1 | Complete | 2026-03-13 |
| 9. Navigation Architecture & Progress Foundation | v2.2 | 2/2 | Complete | 2026-03-13 |
| 10. Welcome Screen & Module Picker | v2.2 | 2/2 | Complete | 2026-03-13 |
| 11. Key Bindings & Navigation Footer | v2.2 | 2/2 | Complete | 2026-03-14 |
| 11.1. Improve Module 1 mini-project | v2.3 | 1/1 | Complete | 2026-03-15 |
| 12. Module 3 Infrastructure & First Lessons | v3.0 | 3/3 | Complete | 2026-03-15 |
| 13. Requirements, Roadmap & Phase Lifecycle Lessons | v3.0 | 2/2 | Complete | 2026-03-15 |
| 14. State, Milestones & Bridge Lessons | v3.0 | 2/2 | Complete | 2026-03-15 |
| 15. Planning Mini-Project | v3.0 | 2/2 | Complete | 2026-03-15 |
| 16. Per-Module Export | 2/2 | Complete    | 2026-03-15 | - |
| 17. Master Document & Commit | v4.0 | 0/? | Not started | - |

---
*For v1.0 phase details, see: milestones/v1.0-ROADMAP.md*
*For v2.0 phase details, see: milestones/v2.0-ROADMAP.md*
*For v2.1 phase details, see: milestones/v2.1-ROADMAP.md*
*For v2.2 phase details, see: milestones/v2.2-ROADMAP.md*
*For v2.3 phase details, see: milestones/v2.3-ROADMAP.md*
*For v3.0 phase details, see: milestones/v3.0-ROADMAP.md*
