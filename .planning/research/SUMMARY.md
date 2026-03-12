# Project Research Summary

**Project:** GSD Commands & Workflows — Module 1 for gsd-learn CLI
**Domain:** Interactive CLI teaching tool expansion (new learning module)
**Researched:** 2026-03-12
**Confidence:** HIGH

## Executive Summary

This project adds a new Module 1 ("GSD Commands & Workflows") to the existing gsd-learn CLI, which currently has a single module ("Command Lifecycle") teaching Node.js internals. The core challenge is that the existing system was built with single-module assumptions throughout: a JavaScript-only source parser, flat progress tracking, a hardcoded concept map, and a hardcoded default module ID. All four of these must be upgraded to multi-module-capable implementations before any new module content can work correctly. The good news: 10 of 12 existing lib modules are already module-agnostic and need zero changes.

The recommended approach is a strict phase sequence. Phase 1 upgrades the infrastructure (progress schema migration, module discovery, concept map parameterization) and builds the new markdown parser. Only after the plumbing works should Phase 2 create the lesson content for the new module (6 lessons following the established pattern: 1 overview + 4 dives + 1 mini-project). Phase 3 then polishes the multi-module UX (module selection screen, module headers in lesson display, cross-module bridge content) and extends Module 2's mini-project to require all 4 architectural layers.

The key risk is content quality: markdown-based configuration files can produce flat "reference doc" lessons if the prompt framing asks "what are the fields?" instead of "how do you create a new command?" Lesson prompts must be structured around the creation task ("build a /gsd:greet command") not the documentation task ("here is what each field means"). A secondary risk is the progress migration — the v1-to-v2 schema change must preserve existing Command Lifecycle progress or learners will be forced to redo completed lessons, which is a trust-breaking experience.

## Key Findings

### Recommended Stack

No new runtime dependencies are required. The entire implementation uses Node.js built-in APIs (`fs`, `path`, `os`, `RegExp`) and the project's existing zero-dependency constraint remains intact. The only meaningful new code artifact is `markdown-parser.cjs` — a new lib module parallel to the existing `parser.cjs` that extracts YAML frontmatter, XML-style sections, bash code blocks, and `@file:` references from GSD command and workflow markdown files.

The existing `frontmatter.cjs` from GSD's own `bin/lib/` can be required directly (same-repo require) for the YAML portion of markdown parsing, keeping the approach DRY without adding dependencies. The `prompt-templates.cjs` `assemblePrompt()` function needs a one-time refactor from hardcoded per-placeholder `.replace()` chains to a generic `{{KEY}}` replacement loop — a small backward-compatible change that eliminates ongoing maintenance for every new template variable.

**Core technologies:**
- `Node.js >= 18.0.0` (built-ins only): `fs`, `path`, `os`, `RegExp` — zero-dependency constraint enforced throughout
- `markdown-parser.cjs` (new): regex-based extraction of GSD markdown structure — same approach as existing `parser.cjs` but for .md files
- `frontmatter.cjs` (GSD existing): reused via same-repo `require()` for YAML frontmatter parsing — no new dep
- `node:test` + `node:assert` + `c8`: unchanged test infrastructure
- New prompt templates (`.prompt.md` files): `command-spec.prompt.md`, `workflow-dive.prompt.md` — markdown-appropriate variables replacing JS-specific ones

### Expected Features

The 5-lesson + mini-project structure mirrors the proven Command Lifecycle pattern exactly. Users expect feature parity with the existing module (navigation, clipboard copy, hints, progress tracking, concept map). The differentiator is the mini-project: build a working `/gsd:greet` command by creating both `greet.md` (command spec) and `greet.md` (workflow) in a sandbox directory, verified by the existing `verifier.cjs` with markdown-appropriate regex checks.

**Must have (table stakes):**
- `module.json` for gsd-commands (id, title, description, order: 1) — module infrastructure requires it
- Lesson 1: Conceptual overview of the two-layer architecture (command.md dispatches to workflow.md)
- Lesson 2: Command.md anatomy (frontmatter fields, XML sections, `@file:` execution_context references)
- Lesson 3: Workflow.md anatomy (purpose, process steps, bash code blocks calling gsd-tools.cjs)
- Lesson 4: Command-to-workflow wiring (dispatch chain from `/gsd:X` to execution)
- Lesson 5/6: Mini-project — build a custom slash command + workflow pair, verified structurally
- `spec.json` with markdown artifact checks and `hints.json` with 5 progressive hints
- Module renumbering via `order` field: gsd-commands = 1, command-lifecycle = 2
- Progress schema migration v1 to v2 (per-module lesson tracking without data loss)

**Should have (competitive):**
- Workflow patterns lesson (simple vs orchestrator vs agent-spawning) — add if learner feedback requests it
- Bridge content at end of Module 1 previewing Module 2's Node.js layer
- Updated Module 2 mini-project requiring all 4 layers (command.md + workflow.md + echo.cjs + switch case)
- Module name displayed in lesson header ("Module 1: GSD Commands / Lesson X of Y")

**Defer (v2+):**
- Module 3: Agent system deep-dive — requires understanding both layers first
- Markdown-aware automated lesson regeneration pipeline — hand-curated content is fine for initial module
- Cross-module concept map visualization spanning all layers

### Architecture Approach

The architecture follows a content-driven module discovery pattern: modules are self-contained directories under `learn/content/modules/{id}/` with their own `module.json` containing an `order` field. No central registry file. The `listModules()` function (new, added to `lessons.cjs`) scans and sorts by `order` field. Two critical infrastructure components need schema changes: `progress.cjs` upgrades from flat v1 to per-module v2 with auto-migration, and `concept-map.cjs` shifts from a hardcoded single diagram to module-owned concept map definitions stored in `module.json`. The `gsd-learn.cjs` entry point gets smart default module selection (first incomplete module by order) and a `--list-modules` flag.

**Major components:**
1. `progress.cjs` (modified) — v2 schema with per-module `currentLesson` tracking; auto-migrates v1 files on load
2. `lessons.cjs` (modified) — adds `listModules()` function; `module.json` gains `order` field for sequence control
3. `gsd-learn.cjs` (modified) — smart default selection, `--list-modules` flag, per-module progress read/write
4. `markdown-parser.cjs` (new) — extracts frontmatter, XML sections, file refs, steps from command/workflow .md files
5. `content/modules/gsd-commands/` (new) — module.json, 6 lesson JSONs, spec.json, hints.json
6. `concept-map.cjs` (modified) — loads concept map from module.json instead of hardcoded constant
7. `verifier.cjs` (minor mod) — 3-line addition to resolve `~` paths for home-directory artifact checking

### Critical Pitfalls

1. **Markdown parser gap** — `parser.cjs` is JavaScript-only and returns empty structures for .md files. Build `markdown-parser.cjs` as a separate module in Phase 1 before any lesson generation begins. Never extend `parser.cjs` with markdown conditionals (violates single responsibility, creates a god-module).

2. **Progress schema clobbers between modules** — The v1 flat `currentLesson` field is overwritten when switching modules. Migrate to v2 per-module schema (`modules[moduleId].currentLesson`) with a transparent migration function. The `modules: {}` field already exists in DEFAULT_PROGRESS — it was clearly designed for this.

3. **Hardcoded concept map** — `concept-map.cjs` has a single hardcoded diagram for Command Lifecycle. Module 1 lessons will show the wrong "YOU ARE HERE" markers unless concept maps are moved into each `module.json`. Fix in Phase 1 before content creation.

4. **Module renumbering breaks progress** — Changing the `command-lifecycle` module ID to reflect new ordering will invalidate all existing `progress.json` files. Keep the module ID `command-lifecycle` stable. Use the `order` field in `module.json` for display sequencing only. IDs are internal identifiers, not display names.

5. **Flat "reference doc" lesson content** — Markdown configuration files invite field-by-field documentation rather than task-oriented teaching. Every lesson prompt must frame content around "how to create a new /gsd command" not "what this field means." Content quality issues are the most expensive pitfall to recover from — regenerating all lessons requires reworking prompt templates, source parsing, and lesson structure.

## Implications for Roadmap

Based on research, the build must be sequenced infrastructure-first. Content depends on the parser. Multi-module navigation depends on the progress schema. Suggested 3-phase structure:

### Phase 1: Multi-Module Infrastructure
**Rationale:** Eight of the nine architectural changes needed are infrastructure changes that block all subsequent phases. The markdown parser must exist before content generation. Progress migration must happen before module switching works. Concept map parameterization must happen before Module 1 lessons can render correctly. All existing tests must continue passing throughout.
**Delivers:** A gsd-learn CLI capable of hosting multiple modules, with correct per-module progress tracking, module discovery, smart default selection, and a working markdown parser ready to feed lesson generation.
**Addresses:** Module renumbering (order field), navigation UX (listModules, --list-modules flag), progress persistence
**Avoids:** Pitfalls 2 (progress clobber), 3 (concept map wrong diagram), 4 (renumbering breaks progress)
**Sub-tasks (1a + 1b can be parallelized):**
- 1a: `progress.cjs` v2 schema + v1-to-v2 migration
- 1b: `lessons.cjs` listModules() + `order` field in module.json
- 1c: `gsd-learn.cjs` multi-module wiring (depends on 1a + 1b)
- 1d: `concept-map.cjs` module-owned definitions
- 1e: `markdown-parser.cjs` new module with tests

### Phase 2: Module 1 Content Generation
**Rationale:** With infrastructure in place, content can be generated cleanly. The markdown parser provides structured data to feed new prompt templates, which feed the LLM to produce lesson JSONs. Lesson content must be framed as task-oriented teaching, not reference documentation. Generate Lesson 1 first and review before generating lessons 2-6 to catch framing issues early.
**Delivers:** 6 complete lesson JSON files, spec.json, hints.json for the gsd-commands module; module is fully playable end-to-end.
**Uses:** `markdown-parser.cjs` (Phase 1), `command-spec.prompt.md` and `workflow-dive.prompt.md` (new), existing `overview.prompt.md` (reused for Lesson 1)
**Implements:** `content/modules/gsd-commands/` directory with all content artifacts
**Avoids:** Pitfall 5 (flat reference docs) — enforce creation-task framing in prompt templates; Pitfall 1 (parser gap) — parser from Phase 1 provides real source snippets

### Phase 3: UX Polish and Module 2 Update
**Rationale:** Once Module 1 content exists and is playable, cross-module UX and the expanded Module 2 mini-project can be completed. These are lower-risk, smaller changes that depend on both modules existing and being validated.
**Delivers:** Polished multi-module experience; Module 2 mini-project expanded to require all 4 architectural layers (command.md + workflow.md + echo.cjs + switch case in gsd-tools.cjs).
**Implements:** Module name in lesson header, bridge lesson at end of Module 1, prerequisite warning for Module 2 mini-project, verifier `~` path resolution for home-directory artifact checking, updated Module 2 spec.json and hints.json

### Phase Ordering Rationale

- Infrastructure must precede content: the markdown parser is a hard dependency for lesson generation; progress migration is a hard dependency for multi-module navigation. Building content on broken infrastructure creates rework.
- Content before polish: the bridge lesson, module headers, and Module 2 mini-project update all require Module 1 lessons to exist and be validated first.
- Phase 1 sub-tasks 1a and 1b are independent (progress.cjs and lessons.cjs touch different files) and can be developed in parallel to compress timeline.
- Module 2 mini-project update is deliberately last — it references Module 1 concepts, so Module 1 must be complete and validated before the cross-module spec.json is written.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1e (markdown-parser.cjs):** STACK.md already examined real command/workflow files and confirmed consistent tag patterns, but regex extractors should be spot-checked against 3-5 real files (trivial, not representative, and complex) before finalizing the parser interface.
- **Phase 2 (lesson content):** Prompt framing quality cannot be pre-validated. Recommend treating Lesson 1 generation as a prototype step — review output before generating the full set, and be prepared to revise prompt template framing before committing to all 6 lessons.

Phases with standard patterns (skip research-phase):
- **Phase 1a-1c (infrastructure modifications):** All files are fully analyzed. Changes are mechanical with clear before/after schemas documented in ARCHITECTURE.md and PITFALLS.md.
- **Phase 1d (concept-map.cjs):** Small refactor, well-understood component. Move constant to module.json, update one function to accept parameter.
- **Phase 3 (UX polish):** All changes are small targeted additions to existing files. No novel patterns required.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero-dependency constraint is firm; all needed capabilities confirmed in existing codebase with line-level analysis. No external library decisions needed. |
| Features | HIGH | Existing module provides a proven 6-lesson template. Feature scope is bounded. Anti-features are clearly called out with rationale. |
| Architecture | HIGH | Direct codebase analysis of every affected file. Before/after schemas documented. Migration strategy specified. Sub-task dependencies mapped. |
| Pitfalls | HIGH | All pitfalls identified from direct code inspection, not speculation. Recovery costs estimated. Specific line references provided for affected code. |

**Overall confidence:** HIGH

### Gaps to Address

- **Lesson content quality:** Research identifies the risk of flat reference-doc lessons but cannot pre-validate prompt framing quality until the first lesson is generated. Mitigate by treating Lesson 1 as a prototype with explicit review gate before generating lessons 2-6.
- **Homedir-based source paths:** The markdown parser uses `os.homedir() + '/.claude/'` paths, which requires GSD to be installed (not just cloned). This is the existing pattern in `generate-lessons.cjs` and is acceptable for development-time content generation, but should be documented in the generation script comments.
- **Verifier `~` path resolution:** The 3-line change to `verifier.cjs` for tilde expansion is specified but not fully implemented in research. Confirm whether `path.resolve()` or explicit `os.homedir()` string substitution is the right approach during Phase 3 implementation.

## Sources

### Primary (HIGH confidence)
- `learn/lib/parser.cjs` — confirms JavaScript-only scope, motivates separate markdown-parser.cjs
- `learn/lib/progress.cjs` — confirms flat v1 schema with unused `modules: {}` field designed for future use
- `learn/lib/concept-map.cjs` — confirms hardcoded single-module diagram and section map
- `learn/bin/gsd-learn.cjs` — confirms hardcoded default moduleId and single-module progress flow
- `learn/content/prompts/overview.prompt.md` and `source-dive.prompt.md` — confirms JavaScript-specific template variables
- `learn/content/modules/command-lifecycle/` — proven 6-lesson module structure used as template
- `~/.claude/commands/gsd/` (33 command .md files examined) — confirms consistent frontmatter + XML tag conventions
- `~/.claude/get-shit-done/workflows/` (35 workflow .md files examined) — confirms step structure and bash block patterns
- `.planning/PROJECT.md` — v2.0 milestone requirements and hard constraints (zero runtime dependencies)

### Secondary (MEDIUM confidence)
- `.planning/codebase/ARCHITECTURE.md` — GSD two-layer architecture overview (markdown + Node.js layers)
- `.planning/codebase/CONVENTIONS.md` — markdown conventions consistency confirmed across GSD files
- `get-shit-done/bin/lib/frontmatter.cjs` — YAML parser confirmed available for same-repo reuse

---
*Research completed: 2026-03-12*
*Ready for roadmap: yes*
