---
phase: 5
slug: module-1-lessons
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test + node:assert (built-in, Node 18+) |
| **Config file** | None — uses built-in test runner |
| **Quick run command** | `node --test learn/tests/lessons.test.cjs` |
| **Full suite command** | `node --test learn/tests/*.test.cjs` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test learn/tests/lessons.test.cjs`
- **After every plan wave:** Run `node --test learn/tests/*.test.cjs`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 0 | MOD1-01..06 | unit | `node --test learn/tests/lessons.test.cjs` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | MOD1-01 | unit | `node --test learn/tests/lessons.test.cjs` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | MOD1-01 | unit | `node --test learn/tests/lessons.test.cjs` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 1 | MOD1-02 | unit | `node --test learn/tests/lessons.test.cjs` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 1 | MOD1-03 | unit | `node --test learn/tests/lessons.test.cjs` | ❌ W0 | ⬜ pending |
| 05-04-01 | 04 | 2 | MOD1-04 | unit | `node --test learn/tests/lessons.test.cjs` | ❌ W0 | ⬜ pending |
| 05-05-01 | 05 | 2 | MOD1-06 | unit | `node --test learn/tests/lessons.test.cjs` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] New test cases in `lessons.test.cjs` for loading gsd-commands module with all 5 lessons
- [ ] Concept map validation: sectionMap keys match lesson conceptMap values
- [ ] Module validation: loadModule('gsd-commands') succeeds after each lesson is added

*Wave 0 creates test stubs that fail until content is created in Waves 1-2.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Lesson content teaches two-layer architecture clearly | MOD1-01 | Content quality is subjective | Read lesson 1 content, verify it explains command.md -> workflow.md dispatch |
| Code snippets use actual GSD source | MOD1-02, MOD1-03 | Content accuracy vs source file | Compare lesson code blocks against real quick.md files |
| Bridge lesson previews Module 2 concretely | MOD1-06 | Content quality | Read lesson 5, verify it mentions gsd-tools.cjs, switch routing |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
