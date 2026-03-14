---
phase: 11
slug: key-bindings-navigation-footer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none — uses node --test directly |
| **Quick run command** | `node --test learn/tests/navigator.test.cjs learn/tests/renderer.test.cjs` |
| **Full suite command** | `node --test learn/tests/*.test.cjs` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test learn/tests/navigator.test.cjs learn/tests/renderer.test.cjs`
- **After every plan wave:** Run `node --test learn/tests/*.test.cjs`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | NAV-02 | unit | `node --test learn/tests/navigator.test.cjs` | Existing, needs new tests | ⬜ pending |
| 11-01-02 | 01 | 1 | NAV-04 | unit | `node --test learn/tests/renderer.test.cjs` | Existing, needs new tests | ⬜ pending |
| 11-02-01 | 02 | 1 | NAV-03 | unit | `node --test learn/tests/renderer.test.cjs` | Existing, needs new tests | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `learn/tests/renderer.test.cjs` — add tests for dynamic footer with/without mini-project context
- [ ] `learn/tests/navigator.test.cjs` — add tests verifying 'modules' and 'hint' are valid action types in the export contract

*Existing infrastructure covers framework and fixtures.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| M key returns to module picker from live lesson | NAV-02 | Requires TTY raw mode interaction | Launch gsd-learn, navigate to any lesson, press M, verify picker appears |
| H key shows hints inline on project step | NAV-03 | Requires TTY raw mode interaction | Launch gsd-learn, navigate to mini-project step, press H, verify hint appears |
| H key is silent on non-project steps | NAV-03 | Requires TTY | Navigate to non-project step, press H, verify no effect |

*All manual-only behaviors are due to TTY requirements in readline keypress handling.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
