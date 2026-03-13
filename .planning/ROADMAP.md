# Roadmap: GSD Learn

## Milestones

- ✅ **v1.0 MVP** — Phases 1-3 + 01.1, 02.1 (shipped 2026-03-12)
- ✅ **v2.0 GSD Commands & Workflows Module** — Phases 4-6 (shipped 2026-03-12)
- ✅ **v2.1 Full-Stack Mini-Project** — Phases 7-8 (shipped 2026-03-13)
- 🚧 **v2.2 Module Discovery & Welcome** — Phases 9-11 (in progress)

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

### v2.2 Module Discovery & Welcome (In Progress)

**Milestone Goal:** Give learners a proper introduction to GSD Learn and let them navigate between modules

- [ ] **Phase 9: Navigation Architecture & Progress Foundation** - Two-level loop and progress schema v3 enabling module switching and resume
- [ ] **Phase 10: Welcome Screen & Module Picker** - First-time welcome, module selection UI, and returning-user experience
- [ ] **Phase 11: Key Bindings & Navigation Footer** - M/H key bindings and context-dependent footer

## Phase Details

### Phase 9: Navigation Architecture & Progress Foundation
**Goal**: Learner's position (module, lesson, part) persists correctly across sessions and module switches
**Depends on**: Phase 8
**Requirements**: WELC-02, NAV-01
**Success Criteria** (what must be TRUE):
  1. Returning user launches and is placed at their last lesson position (module + lesson) without manual navigation
  2. System correctly distinguishes first-run users (no progress) from returning users (any module started)
  3. runNavigationLoop can exit to an outer loop (not just quit), enabling module switching in later phases
  4. Progress schema auto-migrates from v2 to v3 with zero data loss for existing users
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

### Phase 10: Welcome Screen & Module Picker
**Goal**: First-time users understand what GSD Learn offers and all users can choose between modules
**Depends on**: Phase 9
**Requirements**: WELC-01, WELC-03, DISC-01, DISC-02, DISC-03, DISC-04
**Success Criteria** (what must be TRUE):
  1. First-time user sees a welcome screen explaining what they will be able to do after completing modules, before seeing any lesson content
  2. User can select a module from a picker that shows each module's title, description, and progress status (not started / in progress / completed)
  3. Module 1 is visually flagged as recommended for new users
  4. Returning user sees a slim welcome-back message (not the full welcome pitch) when entering the module picker
  5. Welcome screen and module picker share a single module list renderer (no duplicated rendering logic)
**Plans**: TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD

### Phase 11: Key Bindings & Navigation Footer
**Goal**: Learner can navigate to modules and access hints without leaving the lesson flow
**Depends on**: Phase 10
**Requirements**: NAV-02, NAV-03, NAV-04
**Success Criteria** (what must be TRUE):
  1. User can press "M" from any lesson to return to the module picker, with their current position saved
  2. User can press "H" on a mini-project step to see progressive hints inline
  3. Navigation footer displays context-appropriate keys (M always visible; H only on mini-project steps; arrows, c, q as before)
**Plans**: TBD

Plans:
- [ ] 11-01: TBD
- [ ] 11-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 9 -> 10 -> 11

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
| 9. Navigation Architecture & Progress Foundation | v2.2 | 0/? | Not started | - |
| 10. Welcome Screen & Module Picker | v2.2 | 0/? | Not started | - |
| 11. Key Bindings & Navigation Footer | v2.2 | 0/? | Not started | - |

---
*For v1.0 phase details, see: milestones/v1.0-ROADMAP.md*
*For v2.0 phase details, see: milestones/v2.0-ROADMAP.md*
*For v2.1 phase details, see: milestones/v2.1-ROADMAP.md*
