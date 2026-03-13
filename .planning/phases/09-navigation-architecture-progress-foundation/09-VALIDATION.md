---
phase: 9
slug: navigation-architecture-progress-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in, Node 18+) |
| **Config file** | None (uses node --test directly) |
| **Quick run command** | `node --test learn/tests/progress.test.cjs learn/tests/navigator.test.cjs` |
| **Full suite command** | `node --test learn/tests/*.test.cjs` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test learn/tests/progress.test.cjs learn/tests/navigator.test.cjs`
- **After every plan wave:** Run `node --test learn/tests/*.test.cjs`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 0 | WELC-02 | unit | `node --test learn/tests/progress.test.cjs` | ✅ (needs new tests) | ⬜ pending |
| 09-01-02 | 01 | 0 | NAV-01 | unit | `node --test learn/tests/progress.test.cjs` | ✅ (needs new tests) | ⬜ pending |
| 09-01-03 | 01 | 0 | NAV-01 | unit | `node --test learn/tests/navigator.test.cjs` | ✅ (needs new tests) | ⬜ pending |
| 09-02-01 | 02 | 1 | NAV-01 | unit | `node --test learn/tests/progress.test.cjs` | ✅ (needs new tests) | ⬜ pending |
| 09-02-02 | 02 | 1 | WELC-02 | unit | `node --test learn/tests/progress.test.cjs` | ✅ (needs new tests) | ⬜ pending |
| 09-02-03 | 02 | 1 | NAV-01 | unit | `node --test learn/tests/navigator.test.cjs` | ✅ (needs new tests) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `learn/tests/progress.test.cjs` — new test cases for migrateV2toV3, isFirstRun, chained migration v1->v2->v3
- [ ] `learn/tests/navigator.test.cjs` — return value contract tests for runNavigationLoop exit reasons

*No new test files needed. Existing test files cover both modules; they just need additional test cases.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Returning user resumes at correct position | WELC-02 | End-to-end user flow with TTY | Launch app after setting progress.json with a module started; verify correct lesson displayed |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
