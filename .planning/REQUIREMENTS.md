# Requirements: GSD Learn

**Defined:** 2026-03-15
**Core Value:** The learner can confidently modify and extend GSD for their own needs, validated by their ability to achieve creative results with GSD commands.

## v1 Requirements

Requirements for v5.0 Agent Orchestration Module. Each maps to roadmap phases.

### Infrastructure

- [x] **INFR-01**: Module 4 "agent-orchestration" registered in module system with module.json, lessons/, project/
- [x] **INFR-02**: v4→v5 progress migration chain so Module 4 tracking works for existing users
- [x] **INFR-03**: Concept map visualizing agent orchestration lesson flow

### Lessons

- [x] **LESS-01**: Overview lesson — the orchestration model (orchestrators coordinate, executors build, fresh context per agent)
- [x] **LESS-02**: Subagent types lesson — executor, planner, researcher, verifier, checker roles from .agents/ configs
- [x] **LESS-03**: Wave execution lesson — plan discovery, wave grouping, parallel spawning, spot-check verification
- [ ] **LESS-04**: Orchestrator pattern lesson — context budget, path-only delegation, lean orchestrator principle
- [ ] **LESS-05**: Checkpoints and gates lesson — autonomous flags, human-in-the-loop, checkpoint continuation
- [ ] **LESS-06**: Auto-advance chains lesson — plan→execute→verify piping, --auto flag, --no-transition
- [ ] **LESS-07**: Bridge/synthesis lesson connecting orchestration to the full GSD lifecycle

### Mini-Project

- [ ] **MINI-01**: Mini-project spec with verification checks exercising orchestration knowledge
- [ ] **MINI-02**: 5 progressive hints for mini-project
- [ ] **MINI-03**: Mini-project lesson integrating spec into curriculum

### Export

- [ ] **EXPO-01**: AI curriculum export updated — Module 4 appears in per-module docs and master README

## v2 Requirements

Deferred to future release.

- **LESS-08**: Advanced debugging workflows lesson (debug sessions, checkpoints, resolution)
- **LESS-09**: Config and settings system lesson
- **MINI-04**: Cross-module mini-project combining orchestration with planning artifacts

## Out of Scope

| Feature | Reason |
|---------|--------|
| Teaching hooks or MCP integration | Separate domain, not core orchestration |
| Actually spawning real agents in lessons | Lessons teach concepts via source code, not live execution |
| Modifying the agent system itself | Module teaches existing system, doesn't extend it |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFR-01 | Phase 18 | Complete |
| INFR-02 | Phase 18 | Complete |
| INFR-03 | Phase 18 | Complete |
| LESS-01 | Phase 19 | Complete |
| LESS-02 | Phase 19 | Complete |
| LESS-03 | Phase 19 | Complete |
| LESS-04 | Phase 19 | Pending |
| LESS-05 | Phase 19 | Pending |
| LESS-06 | Phase 19 | Pending |
| LESS-07 | Phase 19 | Pending |
| MINI-01 | Phase 20 | Pending |
| MINI-02 | Phase 20 | Pending |
| MINI-03 | Phase 20 | Pending |
| EXPO-01 | Phase 21 | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-03-15*
*Last updated: 2026-03-15 after roadmap creation*
