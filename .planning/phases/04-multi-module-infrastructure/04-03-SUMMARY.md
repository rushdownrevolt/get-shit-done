---
phase: 04-multi-module-infrastructure
plan: 03
subsystem: templates
tags: [prompt-templates, markdown, assembleMarkdownPrompt, cjs]

requires:
  - phase: 04
    plan: 02
    provides: parseMarkdownFile output shape for template key alignment
provides:
  - "assembleMarkdownPrompt() with generic {{KEY}} replacement and fail-loud missing keys"
  - "markdown-anatomy.prompt.md template for teaching .md source files"
affects: [05-module-1-lessons]

tech-stack:
  added: []
  patterns: [fail-loud template replacement, dotted key resolution, parallel template systems]

key-files:
  created: [learn/content/prompts/markdown-anatomy.prompt.md]
  modified: [learn/lib/prompt-templates.cjs]

key-decisions:
  - "Fail-loud on missing keys (throws) vs assemblePrompt's silent defaults — different use cases"
  - "Dotted key resolution supports both flat ('frontmatter.name') and nested ({frontmatter:{name}}) context"

patterns-established:
  - "Two parallel template systems: assemblePrompt for CJS sources, assembleMarkdownPrompt for .md files"
  - "Template files use {{camelCase}} keys matching parseMarkdownFile output fields"

requirements-completed: [PIPE-02, PIPE-03]

duration: ~3min
completed: 2026-03-12
---

# Phase 4 Plan 3: Template System & Prompt Assembly Summary

**Generic {{KEY}} template replacement system and markdown-anatomy prompt template for .md source file lessons**

## Performance

- **Duration:** ~3 min
- **Completed:** 2026-03-12
- **Tasks:** 2 (1 TDD, 1 template creation)
- **Tests:** 18 passing in prompt-templates suite

## Accomplishments

- `assembleMarkdownPrompt(templateName, context)` with fail-loud missing key errors
- Dotted key resolution: flat context keys and nested object traversal
- `markdown-anatomy.prompt.md` template with 10 unique placeholders aligned to parseMarkdownFile output
- Existing `assemblePrompt` completely unchanged (regression verified)

## Task Commits

1. **Task 1 GREEN:** `adf5a13` — assembleMarkdownPrompt implementation (tests pre-existing from agent)
2. **Task 2:** `173ad5c` — markdown-anatomy prompt template

## Files Created/Modified

- `learn/lib/prompt-templates.cjs` — added assembleMarkdownPrompt, resolveDottedKey helper
- `learn/content/prompts/markdown-anatomy.prompt.md` — template for command spec and workflow lessons

## Deviations from Plan

None.

## Issues Encountered

- Agent couldn't get Bash permissions — orchestrator executed plan directly.

## Self-Check: PASSED

Both key files verified on disk. Both commit hashes confirmed in git log. 18/18 tests pass.

---
*Phase: 04-multi-module-infrastructure*
*Completed: 2026-03-12*
