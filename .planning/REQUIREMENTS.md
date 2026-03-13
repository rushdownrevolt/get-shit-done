# Requirements: GSD Learn

**Defined:** 2026-03-12
**Core Value:** The learner can confidently modify and extend GSD for their own needs, validated by their ability to achieve creative results with GSD commands.

## v2.1 Requirements

### Mini-Project Content

- [ ] **MP-01**: Module 2 Lesson 6 updated to reference /gsd:skeptic (building on Module 1 output) instead of standalone echo command
- [ ] **MP-02**: Module 2 Lesson 6 deliverables include all 4 layers: command.md, workflow.md, lib/skeptic.cjs handler, gsd-tools.cjs switch case

### Verification

- [ ] **VER-01**: spec.json checks Node.js artifacts (lib/skeptic.cjs handler function + gsd-tools.cjs switch case)
- [ ] **VER-02**: spec.json checks markdown artifacts from Module 1 (command.md + workflow.md still present and valid)

### Hints

- [ ] **HNT-01**: hints.json updated with full-stack guidance connecting both layers (references Module 1 work as starting point)

## Future Requirements

### Module Discovery (v2.2)

- **DISC-01**: Module discovery via listModules() scans content directories and sorts by order field
- **DISC-02**: CLI entry point supports multi-module selection with smart defaults (first incomplete module)
- **DISC-03**: generate-lessons.cjs refactored for --module flag

## Out of Scope

| Feature | Reason |
|---------|--------|
| New lessons for Module 2 | Only updating the mini-project, not rewriting Module 2 content |
| Module 1 mini-project changes | Module 1 skeptic (markdown-only) stays as-is |
| Module discovery UI | Deferred to v2.2 |
| New modules | v2.1 is a focused content update |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MP-01 | Phase 7 | Pending |
| MP-02 | Phase 7 | Pending |
| VER-01 | Phase 7 | Pending |
| VER-02 | Phase 7 | Pending |
| HNT-01 | Phase 8 | Pending |

**Coverage:**
- v2.1 requirements: 5 total
- Mapped to phases: 5
- Unmapped: 0

---
*Requirements defined: 2026-03-12*
*Last updated: 2026-03-12 after roadmap creation*
