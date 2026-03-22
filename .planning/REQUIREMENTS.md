# Requirements: GSD Learn

**Defined:** 2026-03-22
**Core Value:** The learner can confidently modify and extend GSD for their own needs, validated by their ability to achieve creative results with GSD commands.

## v8.0 Requirements

Requirements for v8.0 milestone. Updates existing modules for GSD v1.26-1.28 features and adds Module 7.

### Module 1 Updates (New Commands)

- [x] **CMD-01**: Learner understands `/gsd:fast` — executing trivial tasks without planning overhead
- [x] **CMD-02**: Learner understands `/gsd:next` — automatic workflow progression to the next logical step
- [x] **CMD-03**: Learner understands `/gsd:ship` — creating PRs from verified work with auto-generated bodies

### Module 3 Updates (Planning Enhancements)

- [x] **PLN-01**: Learner understands decision IDs and discuss-to-plan traceability
- [x] **PLN-02**: Learner understands CLAUDE.md compliance as plan-checker Dimension 10

### Module 4 Updates (Agent Enhancements)

- [x] **AGT-01**: Learner understands advisor mode — parallel research agents evaluating uncertain areas during discussion

### Module 5 Updates (Quality Enhancements)

- [x] **QUA-01**: Learner understands enhanced verification techniques (data-flow tracing, behavioral spot-checks, environment audits)
- [x] **QUA-02**: Learner understands stub detection — verifier identifies incomplete implementations
- [x] **QUA-03**: Learner understands cross-phase regression gate in execute-phase
- [x] **QUA-04**: Learner understands security hardening via centralized security.cjs module (path traversal prevention)

### Module 6 Updates (GSD-2 Enhancements)

- [x] **G2-01**: Learner understands multi-runtime support (Cursor CLI, Gemini CLI alongside Claude Code)
- [x] **G2-02**: Learner understands `/gsd:forensics` — post-mortem investigation for failed workflows
- [x] **G2-03**: Learner understands developer profiling pipeline (`/gsd:profile-user`)

### Module 7 Infrastructure

- [x] **INFR-01**: Module 7 registered in module system with correct ID, name, and lesson count
- [x] **INFR-02**: v7→v8 progress migration preserves existing module completion data
- [x] **INFR-03**: Module 7 skeleton lessons created with placeholder content for validation

### Module 7 Content (Workspaces & Collaboration)

- [x] **WRK-01**: Learner understands workstream namespacing — parallel milestone development via `/gsd:workstreams`
- [x] **WRK-02**: Learner understands multi-project workspace management from a single root
- [x] **WRK-03**: Learner understands cross-AI peer review via `/gsd:review`
- [x] **WRK-04**: Learner understands workspace isolation and how workstreams avoid conflicts
- [x] **WRK-05**: Learner understands workspace lifecycle (create, switch, complete, resume)
- [x] **WRK-06**: Learner understands collaboration patterns (review feedback, multi-runtime coordination)
- [x] **WRK-07**: Learner understands when to use workstreams vs sequential milestones

### Module 7 Mini-Project

- [x] **MINI-01**: Mini-project extends skeptic with a cross-AI review orchestrator
- [x] **MINI-02**: Mini-project verification spec checks for review pipeline implementation
- [x] **MINI-03**: 5 progressive hints guide learner through the review orchestrator build

### Export Update

- [x] **EXPO-01**: AI curriculum export updated with Module 7 content (workspaces-collaboration.md)
- [x] **EXPO-02**: Master README updated to include Module 7 in sequential curriculum
- [x] **EXPO-03**: All updated module content reflected in per-module markdown docs

## Future Requirements

### Advanced Workspace Features

- **FUT-01**: Learner understands workspace merging strategies
- **FUT-02**: Learner understands conflict resolution between workstreams

### Additional Commands Coverage

- **FUT-03**: Lessons for `/gsd:plant-seed`, `/gsd:pr-branch`, `/gsd:audit-uat`
- **FUT-04**: Lessons for `/gsd:milestone-summary`, `/gsd:profile-user` deep dive

## Out of Scope

| Feature | Reason |
|---------|--------|
| MCP tool awareness for subagents | Too implementation-specific for teaching module |
| Workstream-aware planning state details | Internal state management, not learner-facing concept |
| Interactive installer internals | Installation mechanics, not GSD workflow concepts |
| Temp file reaper implementation | Maintenance feature, not conceptual teaching point |
| WAITING.json signals | Internal machine-readable format, not user-facing |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CMD-01 | Phase 31 | Complete |
| CMD-02 | Phase 31 | Complete |
| CMD-03 | Phase 31 | Complete |
| PLN-01 | Phase 31 | Complete |
| PLN-02 | Phase 31 | Complete |
| AGT-01 | Phase 31 | Complete |
| QUA-01 | Phase 31 | Complete |
| QUA-02 | Phase 31 | Complete |
| QUA-03 | Phase 31 | Complete |
| QUA-04 | Phase 31 | Complete |
| G2-01 | Phase 31 | Complete |
| G2-02 | Phase 31 | Complete |
| G2-03 | Phase 31 | Complete |
| INFR-01 | Phase 32 | Complete |
| INFR-02 | Phase 32 | Complete |
| INFR-03 | Phase 32 | Complete |
| WRK-01 | Phase 33 | Complete |
| WRK-02 | Phase 33 | Complete |
| WRK-03 | Phase 33 | Complete |
| WRK-04 | Phase 34 | Complete |
| WRK-05 | Phase 34 | Complete |
| WRK-06 | Phase 34 | Complete |
| WRK-07 | Phase 34 | Complete |
| MINI-01 | Phase 35 | Complete |
| MINI-02 | Phase 35 | Complete |
| MINI-03 | Phase 35 | Complete |
| EXPO-01 | Phase 36 | Complete |
| EXPO-02 | Phase 36 | Complete |
| EXPO-03 | Phase 36 | Complete |

**Coverage:**
- v8.0 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after roadmap creation*
