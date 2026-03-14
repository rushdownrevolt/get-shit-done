---
phase: 03-mini-project-validation
plan: 03
subsystem: learning
tags: [verifier, paths, live-install, tilde-expansion, content]

# Dependency graph
requires:
  - phase: 03-mini-project-validation
    plan: 01
    provides: verifier.cjs with resolvePath, spec.json, hints.json, 06-mini-project.json
  - phase: 03-mini-project-validation
    plan: 02
    provides: --verify and --hint CLI integration
provides:
  - All content files reference live GSD installation (~/.claude/get-shit-done/) paths
  - verifier.cjs resolvePath expands ~ to os.homedir() (already implemented in plan 01)
  - Lesson 06 explicitly tells learner they are working in the live install
affects: [learner-experience, mini-project-outcome]

# Tech tracking
tech-stack:
  added: []
  patterns: [tilde-path-expansion-for-live-install]

key-files:
  created: []
  modified:
    - learn/content/modules/command-lifecycle/project/spec.json
    - learn/content/modules/command-lifecycle/project/hints.json
    - learn/content/modules/command-lifecycle/lessons/06-mini-project.json

key-decisions:
  - "Task 1 (verifier tilde expansion) was already implemented in plan 03-01 -- verified in place, no code changes needed"
  - "All 4 spec.json artifact paths now use ~/ prefix for live install targeting"

patterns-established:
  - "Content files use ~/.claude/get-shit-done/ paths so learner creates files in live installation"

requirements-completed: [VALD-01, VALD-02, MODL-03]

# Metrics
duration: 2min
completed: 2026-03-14
---

# Phase 3 Plan 3: Live Install Path Alignment Summary

**Updated spec.json, hints.json, and lesson 06 to target ~/.claude/get-shit-done/ live installation paths, ensuring /gsd:skeptic actually works after completion**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-14T21:17:38Z
- **Completed:** 2026-03-14T21:19:54Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- All 4 spec.json artifact paths now start with ~/.claude/get-shit-done/ (previously 2 used project-local paths)
- hints.json updated to reference ~/.claude/get-shit-done/ paths instead of project-local get-shit-done/
- Lesson 06 explicitly tells learner they are creating files in the live GSD installation and that /gsd:skeptic will work when done
- verifier.cjs resolvePath already handles tilde expansion (implemented in plan 03-01, verified here)

## Task Commits

Each task was committed atomically:

1. **Task 1: Update verifier.cjs path resolution (TDD)** - No commit needed; resolvePath with tilde expansion already implemented in plan 03-01 and verified passing (9/9 verifier tests)
2. **Task 2: Update spec.json, hints.json, and lesson 06 to use live install paths** - `27683c8` (feat)

## Files Created/Modified
- `learn/content/modules/command-lifecycle/project/spec.json` - Updated artifacts 3 and 4 from project-local to ~/.claude/get-shit-done/ paths
- `learn/content/modules/command-lifecycle/project/hints.json` - Updated hints 3, 4, and 5 to reference ~/.claude/get-shit-done/ paths
- `learn/content/modules/command-lifecycle/lessons/06-mini-project.json` - Added live install explanation, updated deliverables and git checkout tip

## Decisions Made
- Task 1 (verifier tilde expansion) was already fully implemented in plan 03-01 with resolvePath exported and tested -- no duplicate work needed
- All 4 spec.json artifact paths use ~/ prefix (not just the 2 Node.js layer files the plan originally targeted)

## Deviations from Plan

### Task 1 Already Complete

Task 1 specified TDD implementation of resolvePath in verifier.cjs. This was already implemented in plan 03-01 (committed as f11b82e). The function signature differs slightly from the plan (cwd, artifactPath vs artifactPath, cwd) but the behavior matches exactly. All 9 verifier tests pass. No code changes were needed.

---

**Total deviations:** 1 (Task 1 pre-implemented -- verified in place)
**Impact on plan:** No scope change. Task 1 was verified rather than re-implemented.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 is now fully complete (all 3 plans done)
- Mini-project verification targets live install paths
- Learner's completed /gsd:skeptic command will actually work as a live GSD command

## Self-Check: PASSED

All 3 modified files exist. Commit 27683c8 verified in git log.

---
*Phase: 03-mini-project-validation*
*Completed: 2026-03-14*
