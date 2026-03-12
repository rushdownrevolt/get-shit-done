---
status: complete
phase: 02-prompt-driven-content-pipeline
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md]
started: 2026-03-12T13:00:00Z
updated: 2026-03-12T13:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Parser extracts structure from GSD source files
expected: Parser extracts exports, functions, and requires from a real GSD .cjs file with non-zero counts.
result: pass

### 2. Prompt templates produce lesson-generation prompts
expected: assemblePrompt produces formatted prompt text containing parsed source context and lesson instructions.
result: pass

### 3. Overview and source-dive templates are structurally different
expected: Overview template excludes FUNCTIONS/SOURCE_CODE markers; source-dive template includes them.
result: pass

### 4. Evaluator scores lessons with weighted rubric
expected: evaluateLesson returns weighted score (field: `weighted`) and pass/fail boolean. Score of 4.0 for all-4s input with pass: true.
result: pass

### 5. Rubric threshold enforced at 3.5
expected: Scores below 3.5 return pass: false.
result: pass

### 6. Generated lessons load through Phase 1 lesson loader
expected: loadModule('command-lifecycle') returns 5 lessons with meaningful titles.
result: pass

### 7. Generated lessons contain actual GSD source code
expected: Source-dive lessons contain code blocks (field: `value`) with real GSD source code, not placeholder text.
result: pass

### 8. Two evaluation iterations exist with measurable improvement
expected: iteration-01.json and iteration-02.json exist with summary.averageWeighted showing improvement.
result: pass

### 9. Pipeline source paths resolve correctly
expected: generate-lessons.cjs resolves source file paths to actual GSD installation files and produces prompts with populated source context (exports, functions, etc.).
result: issue
reported: "Pipeline uses PROJECT_ROOT + 'get-shit-done/bin/...' which resolves to a nested copy of the repo instead of the GSD installation at ~/.claude/get-shit-done/. Generated prompts have empty exports/functions sections because the wrong files are parsed."
severity: major

### 10. All Phase 2 tests pass
expected: All 32 tests pass across parser, prompt-templates, and evaluator test files.
result: pass

## Summary

total: 10
passed: 9
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Pipeline resolves GSD source file paths correctly and produces prompts with populated source context"
  status: failed
  reason: "User reported: Pipeline uses PROJECT_ROOT + 'get-shit-done/bin/...' which resolves to a nested copy of the repo instead of the GSD installation at ~/.claude/get-shit-done/. Generated prompts have empty exports/functions sections because the wrong files are parsed."
  severity: major
  test: 9
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
