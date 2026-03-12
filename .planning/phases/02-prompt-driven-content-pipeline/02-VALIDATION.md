---
phase: 2
slug: prompt-driven-content-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` + `node:assert` (built-in, matching Phase 1) |
| **Config file** | `scripts/run-tests.cjs` (existing GSD test runner) |
| **Quick run command** | `node --test learn/tests/parser.test.cjs learn/tests/prompt-templates.test.cjs learn/tests/evaluator.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test learn/tests/parser.test.cjs learn/tests/prompt-templates.test.cjs learn/tests/evaluator.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | CONT-03 | unit | `node --test learn/tests/parser.test.cjs` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 0 | CONT-03, CONT-04, MODL-02 | unit | `node --test learn/tests/prompt-templates.test.cjs` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 0 | CONT-05 | unit | `node --test learn/tests/evaluator.test.cjs` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 0 | MODL-01 | integration | `node learn/bin/generate-lessons.cjs && node --test learn/tests/lessons.test.cjs` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `learn/tests/parser.test.cjs` — stubs for CONT-03 (source parsing accuracy)
- [ ] `learn/tests/prompt-templates.test.cjs` — stubs for CONT-03, CONT-04, MODL-02 (template assembly, "why" instructions, template types)
- [ ] `learn/tests/evaluator.test.cjs` — stubs for CONT-05 (rubric scoring, threshold)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Generated lesson quality | CONT-04 | Subjective "why" explanation quality | Read generated lessons, verify explanations are insightful not generic |
| Prompt iteration improvement | CONT-05 | Requires comparing before/after quality | Compare initial vs revised prompt outputs side by side |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
