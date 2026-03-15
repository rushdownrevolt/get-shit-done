# Roadmap: GSD Learn

## Milestones

- ✅ **v1.0 MVP** — Phases 1-3 + 01.1, 02.1 (shipped 2026-03-12)
- ✅ **v2.0 GSD Commands & Workflows Module** — Phases 4-6 (shipped 2026-03-12)
- ✅ **v2.1 Full-Stack Mini-Project** — Phases 7-8 (shipped 2026-03-13)
- ✅ **v2.2 Module Discovery & Welcome** — Phases 9-11 (shipped 2026-03-14)
- ✅ **v2.3 Mini-Project Template Improvement** — Phase 11.1 (shipped 2026-03-15)
- **v3.0 Planning & State Module** — Phases 12-15 (in progress)

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

### v3.0 Planning & State Module (In Progress)

**Milestone Goal:** Teach how GSD's planning system works — from project definition through milestone lifecycle — so learners can plan and structure their own work using GSD artifacts.

- [x] **Phase 12: Module 3 Infrastructure & First Lessons** - Register Module 3, create Lessons 1-2 (planning overview + project definition) (completed 2026-03-15)
- [x] **Phase 13: Requirements, Roadmap & Phase Lifecycle Lessons** - Create Lessons 3-4 covering the core planning artifacts and execution cycle (completed 2026-03-15)
- [x] **Phase 14: State, Milestones & Bridge Lessons** - Create Lessons 5-6 covering live state tracking, milestone lifecycle, and synthesis (completed 2026-03-15)
- [ ] **Phase 15: Planning Mini-Project** - Artifact-persistence mini-project with verification and progressive hints

## Phase Details

### Phase 12: Module 3 Infrastructure & First Lessons
**Goal**: Learner can launch Module 3 and complete Lessons 1-2 covering the planning directory structure and PROJECT.md anatomy
**Depends on**: Phase 11.1 (v2.3 complete)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, PLAN-01, PLAN-02, PROJ-01, PROJ-02
**Success Criteria** (what must be TRUE):
  1. Module picker shows 3 modules with Module 3 listed and correct recommended flag logic
  2. Learner can navigate into Module 3 and see Lesson 1 teaching the .planning/ directory structure and planning lifecycle
  3. Learner can complete Lesson 2 which explains PROJECT.md anatomy with content parsed from GSD's actual templates
  4. Progress tracking works for Module 3 lessons (v4 schema migration applied)
**Plans**: 3 plans
Plans:
- [x] 12-01-PLAN.md — Register Module 3, progress migration v3->v4, fix module picker recommended logic
- [x] 12-02-PLAN.md — Create Lesson 1: Planning Overview (.planning/ directory structure and lifecycle)
- [x] 12-03-PLAN.md — Create Lesson 2: PROJECT.md anatomy and downstream feeding

### Phase 13: Requirements, Roadmap & Phase Lifecycle Lessons
**Goal**: Learner understands how requirements become phases and how phases execute, through Lessons 3-4
**Depends on**: Phase 12
**Requirements**: REQR-01, REQR-02, REQR-03, REQR-04, PHSE-01, PHSE-02, PHSE-03, PHSE-04
**Success Criteria** (what must be TRUE):
  1. Learner can complete Lesson 3 which teaches REQUIREMENTS.md structure, ROADMAP.md structure, and the traceability chain from requirements to phases
  2. Lesson 3 content is parsed from GSD's actual templates/requirements.md and ROADMAP.md structure
  3. Learner can complete Lesson 4 which teaches the phase execution cycle (context, research, plan, execute, verify), PLAN.md anatomy, and SUMMARY.md/VERIFICATION.md as execution records
  4. Lesson 4 content is parsed from GSD's actual templates/plan.md, summary.md, and workflows
**Plans**: 2 plans
Plans:
- [x] 13-01-PLAN.md — Create Lesson 3: Requirements and Roadmap (REQUIREMENTS.md structure, ROADMAP.md structure, traceability chain)
- [x] 13-02-PLAN.md — Create Lesson 4: Phase Lifecycle (execution cycle, PLAN.md anatomy, SUMMARY.md and VERIFICATION.md)

### Phase 14: State, Milestones & Bridge Lessons
**Goal**: Learner understands the full planning lifecycle from live state tracking through milestone completion, and can synthesize all concepts into one mental model
**Depends on**: Phase 13
**Requirements**: MILE-01, MILE-02, MILE-03, BRDG-01, BRDG-02
**Success Criteria** (what must be TRUE):
  1. Learner can complete Lesson 5 which teaches STATE.md as the live position tracker and the milestone lifecycle (completion, archival, version tagging)
  2. Lesson 5 content is parsed from GSD's actual templates and complete-milestone workflow
  3. Learner can complete Lesson 6 which synthesizes all planning concepts and prepares them for the mini-project
  4. After Lesson 6, learner has a connected mental model of how a real GSD project flows from idea through shipped milestone
**Plans**: 2 plans
Plans:
- [x] 14-01-PLAN.md — Create Lesson 5: State Tracking and Milestone Lifecycle (STATE.md structure, milestone completion, archival, retrospective)
- [x] 14-02-PLAN.md — Create Lesson 6: Bridge to Practice (synthesis of all concepts, artifact flow, mini-project preparation)

### Phase 15: Planning Mini-Project
**Goal**: Learner builds a persistent-artifact skeptic command that accumulates institutional knowledge across runs
**Depends on**: Phase 14
**Requirements**: MINI-01, MINI-02, MINI-03, MINI-04, MINI-05, MINI-06
**Success Criteria** (what must be TRUE):
  1. Mini-project lesson provides the artifact-writing workflow pattern as a template (template-first pedagogy) and the learner customizes it
  2. Structural verification confirms the workflow contains both read-previous and write-new patterns, and the artifact file has expected sections
  3. Five progressive hints guide the learner from conceptual (why artifacts persist state) to specific (read/write patterns)
  4. The completed mini-project produces a skeptic command that writes persistent SKEPTIC-REVIEW.md artifacts and reads previous ones for continuity
**Plans**: 2 plans
Plans:
- [ ] 15-01-PLAN.md — Create mini-project lesson with artifact-persistence template and structural verification
- [ ] 15-02-PLAN.md — Create progressive hints for mini-project

## Progress

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
| 15. Planning Mini-Project | v3.0 | 0/2 | Not started | - |

---
*For v1.0 phase details, see: milestones/v1.0-ROADMAP.md*
*For v2.0 phase details, see: milestones/v2.0-ROADMAP.md*
*For v2.1 phase details, see: milestones/v2.1-ROADMAP.md*
*For v2.2 phase details, see: milestones/v2.2-ROADMAP.md*
*For v2.3 phase details, see: milestones/v2.3-ROADMAP.md*
