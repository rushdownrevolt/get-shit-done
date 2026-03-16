# Requirements: GSD Learn

**Defined:** 2026-03-16
**Core Value:** The learner can confidently modify and extend GSD for their own needs, validated by their ability to achieve creative results with GSD commands.

## v1 Requirements

Requirements for v6.0 Quality & Feedback Loops Module. Each maps to roadmap phases.

### Infrastructure

- [x] **INFR-01**: Module 5 "quality-feedback" registered in module system with module.json, lessons/, project/
- [x] **INFR-02**: v5→v6 progress migration chain so Module 5 tracking works for existing users
- [x] **INFR-03**: Concept map visualizing quality & feedback lesson flow

### Lessons

- [ ] **LESS-01**: Overview lesson — the quality lifecycle (build → verify → diagnose → fix → re-verify)
- [ ] **LESS-02**: verify-work & UAT lesson — conversational testing, severity inference, persistent UAT.md
- [ ] **LESS-03**: Skeptic reviews lesson — proactive critical assessment from workflows/skeptic.md
- [ ] **LESS-04**: Debug workflows lesson — systematic debugging, hypothesis testing, persistent state
- [ ] **LESS-05**: Gap closure lesson — diagnosis → plan --gaps → execute --gaps-only cycle
- [ ] **LESS-06**: Milestone audit lesson — audit-milestone, plan-milestone-gaps, completion gates
- [ ] **LESS-07**: Synthesis lesson — quality loops in the full GSD lifecycle

### Mini-Project

- [ ] **MINI-01**: Mini-project spec with verification checks exercising quality/feedback knowledge
- [ ] **MINI-02**: 5 progressive hints for mini-project
- [ ] **MINI-03**: Mini-project lesson integrating spec into curriculum

### Export

- [ ] **EXPO-01**: AI curriculum export updated — Module 5 appears in per-module docs and master README

## v2 Requirements

Deferred to future release.

- **LESS-08**: Advanced debugging patterns lesson (multi-session, cross-phase debugging)
- **MINI-04**: Cross-module capstone project combining quality with orchestration and planning

## Out of Scope

| Feature | Reason |
|---------|--------|
| Actually running verify-work or debug in lessons | Lessons teach concepts via source code, not live execution |
| Teaching CI/CD integration | GSD is CLI-focused, not CI pipeline tooling |
| Automated quality metrics dashboard | Out of scope for a learning tool |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFR-01 | Phase 22 | Complete |
| INFR-02 | Phase 22 | Complete |
| INFR-03 | Phase 22 | Complete |
| LESS-01 | Phase 23 | Pending |
| LESS-02 | Phase 23 | Pending |
| LESS-03 | Phase 23 | Pending |
| LESS-04 | Phase 23 | Pending |
| LESS-05 | Phase 23 | Pending |
| LESS-06 | Phase 23 | Pending |
| LESS-07 | Phase 23 | Pending |
| MINI-01 | Phase 24 | Pending |
| MINI-02 | Phase 24 | Pending |
| MINI-03 | Phase 24 | Pending |
| EXPO-01 | Phase 25 | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after roadmap creation*
