---
phase: 04
slug: multi-module-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test + node:assert (built-in, Node 18+) |
| **Config file** | None — uses built-in test runner |
| **Quick run command** | `node --test learn/tests/{file}.test.cjs` |
| **Full suite command** | `node --test learn/tests/*.test.cjs` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test learn/tests/{changed-file}.test.cjs`
- **After every plan wave:** Run `node --test learn/tests/*.test.cjs`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | INFRA-01 | unit | `node --test learn/tests/progress.test.cjs` | Exists (needs new tests) | ⬜ pending |
| 04-01-02 | 01 | 1 | INFRA-02 | unit | `node --test learn/tests/concept-map.test.cjs` | Exists (needs rewrite) | ⬜ pending |
| 04-01-03 | 01 | 1 | INFRA-03 | unit | `node --test learn/tests/verifier.test.cjs` | Exists (needs new tests) | ⬜ pending |
| 04-01-04 | 01 | 1 | INFRA-04 | integration | `node --test learn/tests/lessons.test.cjs` | Exists (needs new tests) | ⬜ pending |
| 04-01-05 | 01 | 1 | MOD2-01 | unit | `node --test learn/tests/lessons.test.cjs` | Exists (needs new tests) | ⬜ pending |
| 04-02-01 | 02 | 2 | PIPE-01 | unit | `node --test learn/tests/markdown-parser.test.cjs` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | PIPE-02 | unit | `node --test learn/tests/prompt-templates.test.cjs` | Exists (needs new tests) | ⬜ pending |
| 04-02-03 | 02 | 2 | PIPE-03 | unit | `node --test learn/tests/prompt-templates.test.cjs` | Exists (needs new tests) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `learn/tests/markdown-parser.test.cjs` — stubs for PIPE-01 (new file)
- [ ] `learn/lib/frontmatter.cjs` — local copy of extractFrontmatter for learn/ independence
- [ ] New test cases in `progress.test.cjs` for v1→v2 migration (INFRA-01)
- [ ] New test cases in `verifier.test.cjs` for tilde path resolution (INFRA-03)
- [ ] New test cases in `concept-map.test.cjs` for module-owned concept maps (INFRA-02)
- [ ] New test cases in `prompt-templates.test.cjs` for assembleMarkdownPrompt (PIPE-02, PIPE-03)
- [ ] New test cases in `lessons.test.cjs` for order field sorting (INFRA-04, MOD2-01)

*Existing infrastructure covers test runner and assertion needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| v1 progress preserved after upgrade | INFRA-01 | Requires real progress.json on disk | 1. Backup progress.json 2. Run gsd-learn 3. Verify lesson position unchanged |

*All other phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
