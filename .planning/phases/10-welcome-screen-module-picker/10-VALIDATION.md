---
phase: 10
slug: welcome-screen-module-picker
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in, Node 18+) |
| **Config file** | None (uses node --test directly) |
| **Quick run command** | `node --test learn/tests/renderer.test.cjs` |
| **Full suite command** | `node --test learn/tests/*.test.cjs` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test learn/tests/renderer.test.cjs`
- **After every plan wave:** Run `node --test learn/tests/*.test.cjs`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | WELC-01, WELC-03, DISC-01, DISC-02, DISC-03, DISC-04 | unit | `node --test learn/tests/renderer.test.cjs` | Extend existing | ⬜ pending |
| 10-02-01 | 02 | 2 | WELC-01, DISC-01, DISC-03 | unit | `node --test learn/tests/renderer.test.cjs learn/tests/navigator.test.cjs` | Extend existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `learn/tests/renderer.test.cjs` — new test cases for renderWelcomeScreen, renderModulePicker, renderModuleList
- [ ] `learn/tests/navigator.test.cjs` — picker key handling tests (if picker key logic added to navigator)

*No new test files needed. Existing test files cover both modules; they just need additional test cases.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| First-time user sees welcome screen before lesson content | WELC-01 | End-to-end user flow with TTY | Reset progress, launch app, verify welcome screen displays |
| Module picker shows correct progress after partial completion | DISC-01 | Requires real progress state + visual confirmation | Complete 3 lessons of Module 1, press M, verify "Lesson 3 of 6" |
| Module completion flows to picker | DISC-03 | End-to-end flow with completion banner | Complete final lesson, verify banner then picker appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
