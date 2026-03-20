# Requirements: GSD Learn

**Defined:** 2026-03-19
**Core Value:** The learner can confidently modify and extend GSD for their own needs, validated by their ability to achieve creative results with GSD commands.

## v7.0 Requirements

Requirements for Module 6: GSD-2 — The Agent Application.

### Infrastructure

- [ ] **INFR-01**: Module 6 registered in module registry with title, description, and section map
- [ ] **INFR-02**: v6→v7 progress migration preserves all existing module completion data
- [ ] **INFR-03**: Module 6 lesson JSON files load and render correctly in the learning shell

### Lessons

- [ ] **LESS-01**: Lesson 1 (Overview) teaches why GSD-2 exists, v1→v2 evolution, Milestone→Slice→Task hierarchy
- [ ] **LESS-02**: Lesson 2 (Dispatch Pipeline) teaches state machine, deriveState→resolveDispatch, unit dispatch
- [ ] **LESS-03**: Lesson 3 (Context Engineering) teaches fresh sessions, prompt pre-loading, .gsd/ artifacts, inlined context
- [ ] **LESS-04**: Lesson 4 (Auto Mode) teaches the auto loop, crash recovery, stuck detection, timeout supervision
- [ ] **LESS-05**: Lesson 5 (Git & Worktrees) teaches branch-per-milestone, squash merge, worktree isolation
- [ ] **LESS-06**: Lesson 6 (Skills & Extensions) teaches skill discovery, extension manifest, custom skill authoring
- [ ] **LESS-07**: Lesson 7 (Synthesis) teaches how all pieces connect, v1 vs v2 mental model comparison

### Mini-Project

- [ ] **MINI-01**: Mini-project spec defines a hands-on task extending the learner's GSD knowledge
- [ ] **MINI-02**: Structural verification checks validate mini-project completion
- [ ] **MINI-03**: 5 progressive hints guide learner through mini-project

### Export

- [ ] **EXPO-01**: AI curriculum export updated with Module 6 content (gsd-2-agent-application.md + master README)

## Future Requirements

### Advanced GSD-2

- **ADV-01**: Lesson on parallel orchestration and multi-worker auto mode
- **ADV-02**: Lesson on headless mode and CI/CD integration
- **ADV-03**: Lesson on cost management and token optimization profiles

## Out of Scope

| Feature | Reason |
|---------|--------|
| Teaching GSD-2 installation/setup | Module teaches architecture concepts, not user onboarding |
| Live GSD-2 execution within lessons | gsd-learn is read-only teaching; learner runs GSD-2 separately |
| GSD-2 migration tooling | Migration is a GSD-2 feature, not a teaching topic |
| Parallel orchestration deep-dive | Complex topic deferred to future module |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFR-01 | Phase 26 | Pending |
| INFR-02 | Phase 26 | Pending |
| INFR-03 | Phase 26 | Pending |
| LESS-01 | Phase 27 | Pending |
| LESS-02 | Phase 27 | Pending |
| LESS-03 | Phase 27 | Pending |
| LESS-04 | Phase 28 | Pending |
| LESS-05 | Phase 28 | Pending |
| LESS-06 | Phase 28 | Pending |
| LESS-07 | Phase 28 | Pending |
| MINI-01 | Phase 29 | Pending |
| MINI-02 | Phase 29 | Pending |
| MINI-03 | Phase 29 | Pending |
| EXPO-01 | Phase 30 | Pending |

**Coverage:**
- v7.0 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after roadmap creation*
