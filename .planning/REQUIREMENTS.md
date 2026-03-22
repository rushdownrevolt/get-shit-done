# Requirements: GSD Learn

**Defined:** 2026-03-22
**Core Value:** The learner can confidently modify and extend GSD for their own needs, validated by their ability to achieve creative results with GSD commands.

## v8.0 Requirements

Requirements for v8.0 milestone. Updates existing modules for GSD v1.26-1.28 features and adds Module 7.

### Module 1 Updates (New Commands)

- [ ] **CMD-01**: Learner understands `/gsd:fast` — executing trivial tasks without planning overhead
- [ ] **CMD-02**: Learner understands `/gsd:next` — automatic workflow progression to the next logical step
- [ ] **CMD-03**: Learner understands `/gsd:ship` — creating PRs from verified work with auto-generated bodies

### Module 3 Updates (Planning Enhancements)

- [ ] **PLN-01**: Learner understands decision IDs and discuss-to-plan traceability
- [ ] **PLN-02**: Learner understands CLAUDE.md compliance as plan-checker Dimension 10

### Module 4 Updates (Agent Enhancements)

- [ ] **AGT-01**: Learner understands advisor mode — parallel research agents evaluating uncertain areas during discussion

### Module 5 Updates (Quality Enhancements)

- [ ] **QUA-01**: Learner understands enhanced verification techniques (data-flow tracing, behavioral spot-checks, environment audits)
- [ ] **QUA-02**: Learner understands stub detection — verifier identifies incomplete implementations
- [ ] **QUA-03**: Learner understands cross-phase regression gate in execute-phase
- [ ] **QUA-04**: Learner understands security hardening via centralized security.cjs module (path traversal prevention)

### Module 6 Updates (GSD-2 Enhancements)

- [ ] **G2-01**: Learner understands multi-runtime support (Cursor CLI, Gemini CLI alongside Claude Code)
- [ ] **G2-02**: Learner understands `/gsd:forensics` — post-mortem investigation for failed workflows
- [ ] **G2-03**: Learner understands developer profiling pipeline (`/gsd:profile-user`)

### Module 7 Infrastructure

- [ ] **INFR-01**: Module 7 registered in module system with correct ID, name, and lesson count
- [ ] **INFR-02**: v7→v8 progress migration preserves existing module completion data
- [ ] **INFR-03**: Module 7 skeleton lessons created with placeholder content for validation

### Module 7 Content (Workspaces & Collaboration)

- [ ] **WRK-01**: Learner understands workstream namespacing — parallel milestone development via `/gsd:workstreams`
- [ ] **WRK-02**: Learner understands multi-project workspace management from a single root
- [ ] **WRK-03**: Learner understands cross-AI peer review via `/gsd:review`
- [ ] **WRK-04**: Learner understands workspace isolation and how workstreams avoid conflicts
- [ ] **WRK-05**: Learner understands workspace lifecycle (create, switch, complete, resume)
- [ ] **WRK-06**: Learner understands collaboration patterns (review feedback, multi-runtime coordination)
- [ ] **WRK-07**: Learner understands when to use workstreams vs sequential milestones

### Module 7 Mini-Project

- [ ] **MINI-01**: Mini-project extends skeptic with a cross-AI review orchestrator
- [ ] **MINI-02**: Mini-project verification spec checks for review pipeline implementation
- [ ] **MINI-03**: 5 progressive hints guide learner through the review orchestrator build

### Export Update

- [ ] **EXPO-01**: AI curriculum export updated with Module 7 content (workspaces-collaboration.md)
- [ ] **EXPO-02**: Master README updated to include Module 7 in sequential curriculum
- [ ] **EXPO-03**: All updated module content reflected in per-module markdown docs

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

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| — | — | — |

**Coverage:**
- v8.0 requirements: 26 total
- Mapped to phases: 0
- Unmapped: 26

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after initial definition*
