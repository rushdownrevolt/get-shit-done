# Requirements: GSD Learn

**Defined:** 2026-03-13
**Core Value:** The learner can confidently modify and extend GSD for their own needs, validated by their ability to achieve creative results with GSD commands.

## v2.2 Requirements

Requirements for Module Discovery & Welcome milestone. Each maps to roadmap phases.

### Welcome & Onboarding

- [x] **WELC-01**: User sees a welcome screen with GSD pitch on first launch
- [x] **WELC-02**: System detects first-run vs returning user
- [x] **WELC-03**: Welcome copy communicates what the learner will be able to do after completing modules

### Module Discovery

- [x] **DISC-01**: User can select a module from a picker showing all modules with progress indicators
- [x] **DISC-02**: Module 1 is flagged as recommended for new users
- [x] **DISC-03**: Returning users see a slimmer welcome-back message on module page
- [x] **DISC-04**: Welcome and module picker share a single module list renderer

### Navigation & Resume

- [x] **NAV-01**: Returning user resumes at their last lesson position on launch
- [x] **NAV-02**: User can press "M" from any lesson to return to module picker
- [x] **NAV-03**: User can press "H" on mini-project step to see progressive hints
- [x] **NAV-04**: Footer displays available keys based on current context (M, H, arrows, etc.)

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Content Freshness

- **FRESH-01**: Lesson content auto-updates when GSD source files change

### Module Management

- **MGMT-01**: Module discovery handles 10+ modules with scrollable list

## Out of Scope

| Feature | Reason |
|---------|--------|
| Arrow-key module picker | Number keys match existing single-keypress patterns; only 2 modules |
| Part-level resume | Resume to lesson start is sufficient; part-level adds complexity for minimal gain |
| Module progress percentage | Completion state (not started / in progress / complete) is clearer than percentages |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WELC-01 | Phase 10 | Complete |
| WELC-02 | Phase 9 | Complete |
| WELC-03 | Phase 10 | Complete |
| DISC-01 | Phase 10 | Complete |
| DISC-02 | Phase 10 | Complete |
| DISC-03 | Phase 10 | Complete |
| DISC-04 | Phase 10 | Complete |
| NAV-01 | Phase 9 | Complete |
| NAV-02 | Phase 11 | Complete |
| NAV-03 | Phase 11 | Complete |
| NAV-04 | Phase 11 | Complete |

**Coverage:**
- v2.2 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 after roadmap creation*
