---
phase: quick
plan: 8
subsystem: learn-clipboard
tags: [bugfix, clipboard, concept-map]
key-files:
  modified:
    - learn/lib/clipboard-formatter.cjs
    - learn/lib/navigator.cjs
    - learn/bin/gsd-learn.cjs
    - learn/tests/clipboard-formatter.test.cjs
decisions:
  - "Mirror concept-map.cjs file-loading pattern rather than exporting shared constant"
  - "Skip concept map section entirely when moduleDir is undefined (graceful degradation)"
metrics:
  duration: 102s
  completed: "2026-03-15T13:43:53Z"
---

# Quick Task 8: Fix Copy Bug - Cannot Read Properties of Undefined Summary

Replaced broken CONCEPT_MAP import with file-based concept map loading, threading moduleDir from entry point through navigator to clipboard formatter.

## What Was Done

### Task 1: Fix clipboard-formatter to load concept map from file
- Removed non-existent `CONCEPT_MAP` import from `concept-map.cjs`
- Removed hardcoded `sectionMap` object
- Added `moduleDir` as 4th parameter to `formatLessonForClipboard`
- Loads concept map from `concept-map.txt` and sectionMap from `module.json` at runtime
- Gracefully skips concept map when moduleDir is undefined or file is missing
- **Commit:** 6ccb8cb

### Task 2: Thread moduleDir through navigator and entry point
- Added `moduleDir: moduleDir` to opts object in `gsd-learn.cjs` line 267
- Updated navigator copy handler to pass `opts.moduleDir` as 4th argument
- Updated JSDoc for `runNavigationLoop` to document `opts.moduleDir`
- **Commit:** b6259b8

### Task 3: Update tests for new moduleDir parameter
- Updated all `formatLessonForClipboard` calls to pass `moduleDir` (pointing to gsd-commands module)
- Added new test: "handles missing moduleDir gracefully"
- All 15 tests pass (previously 13 were failing due to the CONCEPT_MAP crash)
- **Commit:** 1f53f5d

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| `formatLessonForClipboard.length === 4` | PASS |
| All 15 clipboard-formatter tests pass | PASS |
| No `CONCEPT_MAP` references in `learn/lib/` | PASS |
