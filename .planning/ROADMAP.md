# Roadmap: GSD Learn

## Milestones

- ✅ **v1.0 MVP** — Phases 1-3 + 01.1, 02.1 (shipped 2026-03-12)
- ✅ **v2.0 GSD Commands & Workflows Module** — Phases 4-6 (shipped 2026-03-12)
- **v2.1 Full-Stack Mini-Project** — Phases 7-8 (in progress)

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

### v2.1 Full-Stack Mini-Project (Phases 7-8)

- [x] **Phase 7: Full-Stack Lesson and Verification** - Update Module 2 lesson 6 content and spec.json to cover all 4 skeptic layers
- [ ] **Phase 8: Full-Stack Hints** - Update hints.json with guidance connecting markdown and Node.js layers

## Phase Details

### Phase 7: Full-Stack Lesson and Verification
**Goal**: Learner receives a mini-project that builds on their Module 1 skeptic command by adding the Node.js backend
**Depends on**: Phase 6 (Module 1 mini-project must exist as the foundation)
**Requirements**: MP-01, MP-02, VER-01, VER-02
**Success Criteria** (what must be TRUE):
  1. Module 2 Lesson 6 references /gsd:skeptic from Module 1 as the starting point (not a standalone echo command)
  2. Lesson 6 deliverables list all 4 layers: command.md, workflow.md, lib/skeptic.cjs handler, gsd-tools.cjs switch case
  3. spec.json verifies Node.js artifacts exist (lib/skeptic.cjs handler function and gsd-tools.cjs switch case)
  4. spec.json verifies Module 1 markdown artifacts remain present and valid (command.md and workflow.md)
  5. Running the verifier against a complete skeptic implementation reports all checks passing
**Plans:** 1 plan
Plans:
- [x] 07-01-PLAN.md — Update lesson 6 content and spec.json from echo to full-stack skeptic

### Phase 8: Full-Stack Hints
**Goal**: Learner gets progressive guidance that connects their existing markdown-layer work to the new Node.js-layer work
**Depends on**: Phase 7 (hints must match the updated lesson content and spec checks)
**Requirements**: HNT-01
**Success Criteria** (what must be TRUE):
  1. hints.json references Module 1 output as the starting point (learner knows they are extending, not starting fresh)
  2. Hints provide progressive guidance for both Node.js artifacts (echo.cjs handler creation, then switch case wiring)
  3. Hints follow the existing progressive disclosure pattern (general direction first, specific code guidance later)
**Plans:** 1 plan
Plans:
- [ ] 08-01-PLAN.md — Rewrite hints.json with full-stack skeptic progressive guidance

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
| 8. Full-Stack Hints | v2.1 | 0/1 | Not started | - |

---
*For v1.0 phase details, see: milestones/v1.0-ROADMAP.md (if archived)*
*For v2.0 phase details, see: milestones/v2.0-ROADMAP.md*
