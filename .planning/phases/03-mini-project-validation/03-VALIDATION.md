---
phase: 3
slug: mini-project-validation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test + node:assert (built-in) |
| **Config file** | None — run directly with `node --test` |
| **Quick run command** | `node --test learn/tests/verifier.test.cjs learn/tests/hints.test.cjs learn/tests/feedback.test.cjs` |
| **Full suite command** | `node --test learn/tests/*.test.cjs` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test learn/tests/verifier.test.cjs learn/tests/hints.test.cjs learn/tests/feedback.test.cjs`
- **After every plan wave:** Run `node --test learn/tests/*.test.cjs`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | VALD-01 | integration | `node --test learn/tests/verifier.test.cjs` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | VALD-02 | unit | `node --test learn/tests/verifier.test.cjs` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | VALD-03 | unit | `node --test learn/tests/hints.test.cjs` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | VALD-04 | unit | `node --test learn/tests/feedback.test.cjs` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | MODL-03 | unit | `node --test learn/tests/lessons.test.cjs` | ✅ | ⬜ pending |
| 03-02-03 | 02 | 2 | MODL-04 | unit | `node --test learn/tests/feedback.test.cjs` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `learn/tests/verifier.test.cjs` — stubs for VALD-01, VALD-02
- [ ] `learn/tests/hints.test.cjs` — stubs for VALD-03
- [ ] `learn/tests/feedback.test.cjs` — stubs for VALD-04, MODL-04

*Existing infrastructure covers framework — no install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hint text guides without giving answers | VALD-03 | Content quality is subjective | Read each hint level; confirm none contain actual code |
| Mini-project is completable in one sitting | MODL-03 | Requires human timing | Follow instructions from scratch; target < 20 min |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
