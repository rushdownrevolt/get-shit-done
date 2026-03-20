---
phase: 1
slug: interactive-learning-shell
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` + `node:assert` (built-in) |
| **Config file** | `scripts/run-tests.cjs` (existing GSD test runner) |
| **Quick run command** | `node --test learn/tests/*.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test learn/tests/*.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | DISP-01 | unit | `node --test learn/tests/terminal.test.cjs` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 0 | DISP-02 | unit | `node --test learn/tests/renderer.test.cjs` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 0 | DISP-03 | unit | `node --test learn/tests/renderer.test.cjs` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 0 | CONT-01 | unit | `node --test learn/tests/lessons.test.cjs` | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 0 | CONT-02 | unit | `node --test learn/tests/lessons.test.cjs` | ❌ W0 | ⬜ pending |
| 01-01-06 | 01 | 0 | PROG-01 | unit | `node --test learn/tests/progress.test.cjs` | ❌ W0 | ⬜ pending |
| 01-01-07 | 01 | 0 | PROG-02 | integration | `node --test learn/tests/errors.test.cjs` | ❌ W0 | ⬜ pending |
| 01-01-08 | 01 | 0 | PROG-03 | unit | `node --test learn/tests/concept-map.test.cjs` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `learn/tests/terminal.test.cjs` — stubs for DISP-01 (ANSI formatting)
- [ ] `learn/tests/renderer.test.cjs` — stubs for DISP-02, DISP-03 (code blocks, position indicator)
- [ ] `learn/tests/lessons.test.cjs` — stubs for CONT-01, CONT-02 (lesson data model, ordering)
- [ ] `learn/tests/progress.test.cjs` — stubs for PROG-01 (persistence)
- [ ] `learn/tests/errors.test.cjs` — stubs for PROG-02 (error handling)
- [ ] `learn/tests/concept-map.test.cjs` — stubs for PROG-03 (concept map)
- [ ] Update `scripts/run-tests.cjs` to include `learn/tests/` glob

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| ANSI colors render correctly on user's terminal | DISP-01 | Visual confirmation needed | Run `gsd-learn`, verify colors display in terminal |
| Keyboard navigation feels responsive | CONT-02 | UX/feel check | Navigate forward/backward through lessons, check responsiveness |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
