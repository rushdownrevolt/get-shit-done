---
phase: 06
slug: module-1-mini-project
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner |
| **Config file** | none — tests run directly |
| **Quick run command** | `node --test learn/tests/verifier.test.cjs learn/tests/hints.test.cjs learn/tests/lessons.test.cjs` |
| **Full suite command** | `node --test learn/tests/*.test.cjs` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test learn/tests/verifier.test.cjs learn/tests/hints.test.cjs learn/tests/lessons.test.cjs`
- **After every plan wave:** Run `node --test learn/tests/*.test.cjs`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | MOD1-05 | unit | `node --test learn/tests/lessons.test.cjs` | Yes | ⬜ pending |
| 06-01-02 | 01 | 1 | MOD1-07 | unit | `node --test learn/tests/verifier.test.cjs` | Yes | ⬜ pending |
| 06-01-03 | 01 | 1 | MOD1-08 | unit | `node --test learn/tests/hints.test.cjs` | Yes | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. The lessons.test.cjs will automatically validate the new lesson file when loadModule('gsd-commands') is called. The verifier.test.cjs validates the runVerification flow. The hints.test.cjs validates getNextHint logic.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Learner can follow project instructions end-to-end | MOD1-05 | Requires human judgment on clarity | Walk through lesson 6, attempt to build skeptic command following instructions |
| Progressive hints guide without giving away answer | MOD1-08 | Requires subjective assessment of hint quality | Request all 5 hint levels, verify each adds detail without spoiling |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
