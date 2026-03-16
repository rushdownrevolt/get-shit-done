# Roadmap: GSD Learn

## Milestones

- ✅ **v1.0 MVP** — Phases 1-3 + 01.1, 02.1 (shipped 2026-03-12)
- ✅ **v2.0 GSD Commands & Workflows Module** — Phases 4-6 (shipped 2026-03-12)
- ✅ **v2.1 Full-Stack Mini-Project** — Phases 7-8 (shipped 2026-03-13)
- ✅ **v2.2 Module Discovery & Welcome** — Phases 9-11 (shipped 2026-03-14)
- ✅ **v2.3 Mini-Project Template Improvement** — Phase 11.1 (shipped 2026-03-15)
- ✅ **v3.0 Planning & State Module** — Phases 12-15 (shipped 2026-03-15)
- ✅ **v4.0 AI-Ready Curriculum** — Phases 16-17 (shipped 2026-03-15)
- 🚧 **v5.0 Agent Orchestration Module** — Phases 18-21 (in progress)

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

<details>
<summary>v4.0 AI-Ready Curriculum (Phases 16-17) — SHIPPED 2026-03-15</summary>

- [x] Phase 16: Per-Module Export (2/2 plans) — completed 2026-03-15
- [x] Phase 17: Master Document & Commit (1/1 plan) — completed 2026-03-15

</details>

### 🚧 v5.0 Agent Orchestration Module (In Progress)

**Milestone Goal:** Teach how GSD orchestrates work through subagents — wave-based parallelization, checkpoints, and auto-advance chains.

- [x] **Phase 18: Module Infrastructure** - Scaffold Module 4 with module.json, directory structure, progress migration, and concept map (completed 2026-03-16)
- [ ] **Phase 19: Lesson Content** - Author all 7 lessons covering orchestration model through synthesis
- [ ] **Phase 20: Mini-Project** - Spec, progressive hints, and mini-project lesson exercising orchestration concepts
- [ ] **Phase 21: Export Update** - Re-run AI curriculum export to include Module 4

## Phase Details

### Phase 18: Module Infrastructure
**Goal**: Module 4 exists in the system and returning users can track their progress
**Depends on**: Nothing (first phase of v5.0)
**Requirements**: INFR-01, INFR-02, INFR-03
**Success Criteria** (what must be TRUE):
  1. Module picker shows "Agent Orchestration" as Module 4 with correct recommended flag behavior
  2. Existing users' progress files migrate cleanly from v4 to v5 schema with zero data loss
  3. concept-map.txt exists showing the lesson flow from orchestration overview through synthesis
  4. Module directory structure matches convention: module.json, lessons/, project/
**Plans**: 1 plan

Plans:
- [ ] 18-01-PLAN.md — Scaffold Module 4 directory, v4->v5 progress migration, and concept map

### Phase 19: Lesson Content
**Goal**: Learner can work through 7 lessons that teach agent orchestration from GSD's actual source
**Depends on**: Phase 18
**Requirements**: LESS-01, LESS-02, LESS-03, LESS-04, LESS-05, LESS-06, LESS-07
**Success Criteria** (what must be TRUE):
  1. Learner can navigate all 7 lessons sequentially with working next/back navigation
  2. Each lesson contains real code snippets extracted from GSD's .agents/ configs and orchestration workflows
  3. Learner progresses from "what is orchestration" through subagent roles, wave execution, orchestrator pattern, checkpoints, auto-advance, to full lifecycle synthesis
  4. All 7 lesson JSON files load and render correctly in the existing lesson display engine
**Plans**: 2 plans

Plans:
- [ ] 19-01-PLAN.md — Lessons 1-3: Overview, Subagent Types, Wave Execution
- [ ] 19-02-PLAN.md — Lessons 4-7: Orchestrator Pattern, Checkpoints, Auto-Advance, Synthesis

### Phase 20: Mini-Project
**Goal**: Learner exercises orchestration knowledge by building something that passes structural verification
**Depends on**: Phase 19
**Requirements**: MINI-01, MINI-02, MINI-03
**Success Criteria** (what must be TRUE):
  1. Mini-project lesson appears as the final step in Module 4 with spec-based verification
  2. Verification checks exercise orchestration concepts (not just file existence)
  3. 5 progressive hints guide the learner from stuck to solution without giving away the answer
  4. Pressing "H" on the mini-project step reveals hints inline, persisted across sessions
**Plans**: TBD

Plans:
- [ ] 20-01: TBD

### Phase 21: Export Update
**Goal**: AI curriculum docs include Module 4 so LLMs can learn agent orchestration by reading markdown
**Depends on**: Phase 20
**Requirements**: EXPO-01
**Success Criteria** (what must be TRUE):
  1. Running `node learn/bin/export-docs.cjs` produces agent-orchestration.md in docs/ai-curriculum/
  2. Master README.md includes Module 4 content in correct learning order after Module 3
**Plans**: TBD

Plans:
- [ ] 21-01: TBD

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
| 15. Planning Mini-Project | v3.0 | 2/2 | Complete | 2026-03-15 |
| 16. Per-Module Export | v4.0 | 2/2 | Complete | 2026-03-15 |
| 17. Master Document & Commit | v4.0 | 1/1 | Complete | 2026-03-15 |
| 18. Module Infrastructure | 1/1 | Complete    | 2026-03-16 | - |
| 19. Lesson Content | 1/2 | In Progress|  | - |
| 20. Mini-Project | v5.0 | 0/? | Not started | - |
| 21. Export Update | v5.0 | 0/? | Not started | - |

---
*For v1.0 phase details, see: milestones/v1.0-ROADMAP.md*
*For v2.0 phase details, see: milestones/v2.0-ROADMAP.md*
*For v2.1 phase details, see: milestones/v2.1-ROADMAP.md*
*For v2.2 phase details, see: milestones/v2.2-ROADMAP.md*
*For v2.3 phase details, see: milestones/v2.3-ROADMAP.md*
*For v3.0 phase details, see: milestones/v3.0-ROADMAP.md*
*For v4.0 phase details, see: milestones/v4.0-ROADMAP.md*
