# Project Research Summary

**Project:** gsd-learn v2.0 — Module 1 (GSD Commands & Workflows)
**Domain:** Interactive CLI teaching tool extension — adding a markdown-layer learning module
**Researched:** 2026-03-12
**Confidence:** HIGH

## Executive Summary

The gsd-learn v2.0 project adds a new Module 1 ("GSD Commands & Workflows") that teaches the markdown layer of GSD — slash command `.md` specs and workflow `.md` orchestration files — before the existing Command Lifecycle module, which becomes Module 2. The core challenge is that the entire existing teaching infrastructure (parser, prompt templates, progress tracking, concept maps, and lesson generation pipeline) was built with single-module assumptions targeting Node.js source files. Every one of these components needs either modification or a parallel implementation before Module 1 content can work correctly. The good news: 10 of 12 existing lib modules are already module-agnostic and need zero changes.

The recommended build order is infrastructure-first. Phase 1 upgrades multi-module plumbing — progress schema v1-to-v2 migration, filesystem-driven module discovery, concept map parameterization, verifier tilde path resolution — and builds the new `markdown-parser.cjs`. Only after the infrastructure is stable should Phase 2 create the lesson content (6 lessons: 1 overview, 4 dives, 1 mini-project). Phase 3 completes UX polish and expands the Module 2 mini-project to require all 4 architectural layers. Shipped lessons can be static hand-written JSON for MVP — the markdown parser is a build-time content generation tool, not a runtime dependency and not a launch blocker.

The highest-risk pitfall is not technical: markdown configuration files can produce flat "reference doc" lessons if prompt framing asks "what are the fields?" instead of "how do you create a new command?" Content quality issues are the most expensive to recover from because they require reworking prompt templates, source parsing, and lesson structure. The second highest risk is sequencing: building content before infrastructure creates rework. A close third is renaming module IDs during "renumbering" — this breaks existing `progress.json` files without any migration path. All three risks are avoidable with disciplined phase ordering.

## Key Findings

### Recommended Stack

No new runtime dependencies are needed. The zero-dependency constraint from PROJECT.md holds completely. All new work is new `.cjs` modules, `.json` content files, and `.prompt.md` templates inside the existing `learn/` directory structure. The new `markdown-parser.cjs` uses only Node.js built-ins (`fs`, `path`, `os`, `RegExp`).

The architecture research resolves the STACK.md question about importing GSD's own `frontmatter.cjs`: do NOT import it. The learn tool and gsd-tools are architecturally separate. Implement frontmatter extraction directly in `markdown-parser.cjs` with simple regex — the same zero-dependency approach `parser.cjs` uses for everything. The `prompt-templates.cjs` `assemblePrompt()` function needs a one-time refactor from hardcoded per-placeholder `.replace()` chains to a generic `{{KEY}}` replacement loop — backward-compatible, eliminates ongoing per-placeholder maintenance.

**Core technologies:**
- `Node.js >= 18.0.0` + CommonJS (`.cjs`): KEEP — all new modules follow established pattern
- `markdown-parser.cjs` (new lib module): regex-based extraction of frontmatter, XML sections, code blocks, file refs from GSD `.md` files — parallel to `parser.cjs`, not a modification of it
- New `.prompt.md` templates: `markdown-dive.prompt.md` with markdown-appropriate markers replacing JS-specific variables (`{{FRONTMATTER_FIELDS}}`, `{{PROCESS_STEPS}}`, `{{FILE_REFERENCES}}`, `{{CODE_BLOCKS}}`)
- `node:test` + `node:assert` + `c8`: KEEP — no test framework changes

### Expected Features

The 5-6 lesson + mini-project structure mirrors the proven Command Lifecycle pattern. Users expect feature parity with the existing module (navigation, clipboard copy, hints, progress tracking, concept map). The differentiator is the mini-project: build a working `/gsd:greet` command by creating both `greet.md` (command spec) and `greet.md` (workflow) in a sandbox directory, verified by `verifier.cjs` with markdown-appropriate regex checks.

**Must have (table stakes — P1):**
- `module.json` for gsd-commands (id, title, description, `order: 1`)
- Lesson 1: Conceptual overview — two-layer architecture, command.md dispatches to workflow.md
- Lesson 2: Command.md anatomy — frontmatter, XML sections, `@file:` execution_context references
- Lesson 3: Workflow.md anatomy — purpose, process steps, bash code blocks calling gsd-tools.cjs
- Lesson 4: Command-to-workflow wiring — dispatch chain from `/gsd:X` to execution
- Lesson 5/6: Mini-project — build a custom command.md + workflow.md pair in `learn/sandbox/`, verified structurally
- `spec.json` with markdown artifact checks + `hints.json` with 5 progressive hints
- Module renumbering via `order` field: gsd-commands = 1, command-lifecycle = 2 (IDs stable)
- Progress schema v1-to-v2 migration with no data loss
- Multi-module gsd-learn.cjs: smart default, `--list-modules`, `--reset --module=X`

**Should have (competitive — P2):**
- Workflow patterns lesson (simple vs orchestrator vs agent-spawning) — add after Module 1 validates
- Bridge lesson at end of Module 1 previewing Module 2's Node.js layer
- Module 2 mini-project expanded to all 4 layers (command.md + workflow.md + echo.cjs + switch case)
- Module name displayed in lesson header ("Module 1: GSD Commands / Lesson X of Y")

**Defer (v2+):**
- Module 3: Agent system deep-dive — requires both layers mastered first
- Automated lesson regeneration pipeline — static JSON is acceptable for initial module
- Cross-module concept map spanning all layers

**Anti-features to avoid:**
- Teaching all 33+ commands exhaustively — teach 3-4 representative patterns instead
- Interactive command execution within lessons — process management complexity, no learning value
- Writing mini-project artifacts to actual `~/.claude/` — risks breaking GSD install; use `learn/sandbox/`
- Auto-generating lessons from all markdown files — produces reference manual, not tutorial

### Architecture Approach

Module discovery is filesystem-driven: scan `content/modules/*/module.json`, read each, sort by `order` field. No central registry. Adding a module means creating a directory with the right structure — no code changes required in `lessons.cjs`. Two components need schema changes: `progress.cjs` upgrades from flat v1 to per-module v2 (the `modules: {}` field already exists in DEFAULT_PROGRESS — it was designed for this), and `concept-map.cjs` shifts from a hardcoded global diagram to module-owned definitions stored in each `module.json`. The `gsd-learn.cjs` entry point gets smart default selection (first incomplete module by `order`) and a `--list-modules` flag.

**Major components and change type:**
1. `progress.cjs` (MODIFY): v2 schema `modules[moduleId].currentLesson`; auto-migration from v1 preserves Command Lifecycle progress
2. `lessons.cjs` (MODIFY): adds `listModules()` that scans and sorts by `order`; `module.json` files gain `order` field
3. `gsd-learn.cjs` (MODIFY): smart default, `--list-modules`, per-module progress read/write (4 specific line changes)
4. `markdown-parser.cjs` (NEW): extracts frontmatter, XML sections, step blocks, code blocks, file refs from command/workflow `.md` files
5. `concept-map.cjs` (MODIFY): loads concept map definition from module.json instead of hardcoded constant
6. `verifier.cjs` (MINOR MOD): 4-line tilde expansion before `path.join()` enables `~/.claude/` artifact paths
7. `prompt-templates.cjs` (MODIFY): generic `{{KEY}}` replacement loop + markdown-specific markers
8. `gsd-commands/` content directory (NEW): module.json, 6 lesson JSONs, spec.json, hints.json
9. `command-lifecycle/module.json` (MODIFY): add `"order": 2`

### Critical Pitfalls

1. **Reusing `parser.cjs` for markdown files** — The JavaScript parser uses brace-counting and JS-pattern regex. It silently returns empty structures for `.md` files. Build `markdown-parser.cjs` as a separate module from scratch. Never add markdown conditionals to `parser.cjs` (god-module anti-pattern). Prevention: Phase 1.

2. **Progress schema clobbers between modules** — Current flat v1 schema overwrites `currentLesson` when switching modules. Migrate to v2 with `modules[moduleId].currentLesson` sub-objects. The `modules: {}` field already exists in DEFAULT_PROGRESS. Auto-migration must run on `loadProgress()` before any write. Prevention: Phase 1.

3. **Renaming module IDs during renumbering** — Changing `command-lifecycle` to `module-2-command-lifecycle` invalidates all existing `progress.json` files. Keep IDs stable. Use `order` field in `module.json` for display sequencing. Prevention: Phase 1 design decision — never rename module IDs.

4. **Hardcoded concept map** — `concept-map.cjs` has a single hardcoded diagram with 7 Command Lifecycle sections. Module 1 YOU ARE HERE markers will never render correctly. Move concept map definitions into each `module.json`. Prevention: Phase 1.

5. **Verifier cannot resolve HOME paths** — `verifier.cjs` does `path.join(cwd, artifact.path)` with no tilde expansion. Any `~/.claude/` artifact path produces a nonsense path. 4-line fix. Prevention: Phase 1 (or Phase 3 at latest — must precede any spec.json using `~` paths).

6. **Flat reference-doc lessons** — Markdown configuration files invite field-by-field documentation. Every lesson prompt must frame content around "how to create a new /gsd command" not "what each field means." Content quality issues require regenerating all lessons — most expensive pitfall to recover from. Prevention: Phase 2 prompt framing + prototype Lesson 1 before generating the full set.

## Implications for Roadmap

The build order is determined by hard dependencies: infrastructure must exist before content, content must exist before UX polish and Module 2 expansion. Suggested 3-phase structure:

### Phase 1: Multi-Module Infrastructure

**Rationale:** All subsequent phases depend on this. Progress migration, module discovery, concept map parameterization, and verifier path resolution must exist before any Module 1 content is created or tested. The markdown parser belongs here too — it is needed as input to content generation in Phase 2. All existing tests must pass throughout Phase 1. This phase produces no user-visible content, only correct plumbing.

**Delivers:** A gsd-learn CLI capable of hosting multiple modules with correct per-module progress tracking, filesystem-driven module discovery, smart default selection, and a working markdown parser ready to feed lesson generation.

**Addresses:** Module renumbering (order field), navigation UX (listModules, --list-modules), progress persistence, cross-directory verification

**Avoids:** Pitfalls 1, 2, 3, 4, 5 (all infrastructure-layer issues)

**Sub-tasks (1a and 1b are independent, can parallelize):**
- 1a: `progress.cjs` v2 schema + auto-migration function (no dependencies)
- 1b: `lessons.cjs` `listModules()` + add `"order": 2` to command-lifecycle/module.json (no dependencies)
- 1c: `gsd-learn.cjs` multi-module wiring — smart default, --list-modules, per-module progress (depends on 1a + 1b)
- 1d: `concept-map.cjs` module-owned definitions (independent)
- 1e: `verifier.cjs` tilde path resolution (independent)
- 1f: `markdown-parser.cjs` new module with tests against real command.md and workflow.md files (independent)

### Phase 2: Module 1 Content

**Rationale:** With infrastructure stable, content can be created cleanly. The markdown parser (Phase 1f) provides structured data to feed new prompt templates. Start with Lesson 1 as a prototype and review before generating the full set — catches framing issues before they propagate to all 6 lessons. Lesson content should be curated and hand-edited JSON (the same approach Command Lifecycle uses in production) even if initially generated via LLM.

**Delivers:** Complete gsd-commands module: 6 lesson JSONs, spec.json, hints.json. Module is fully playable end-to-end — learner can navigate all lessons and complete the mini-project.

**Uses:** `markdown-parser.cjs` (Phase 1f), new `markdown-dive.prompt.md` template, reused `overview.prompt.md` for Lesson 1

**Implements:** `content/modules/gsd-commands/` directory with all content artifacts; sandbox directory for mini-project

**Avoids:** Pitfall 6 (flat reference docs) — enforce creation-task framing in prompt templates; Pitfall 1 (empty parser output) — Phase 1 parser provides real source snippets

### Phase 3: UX Polish and Module 2 Expansion

**Rationale:** Once Module 1 exists and is validated by real learners (or dogfooding), cross-module UX improvements and the expanded Module 2 mini-project can be added. These depend on both modules being complete. The Module 2 mini-project expansion is deliberately last — it references Module 1 concepts and artifacts, so Module 1 must be stable before the cross-module spec is written.

**Delivers:** Polished multi-module UX (module name in lesson header, bridge lesson at end of Module 1, prerequisite warning for Module 2 mini-project); Module 2 mini-project expanded to verify all 4 architectural layers; `generate-lessons.cjs` refactored for `--module` flag support.

**Implements:** Updated command-lifecycle/project/spec.json (4 artifacts), updated hints.json, bridge lesson content, module header in renderer output

**Avoids:** Pitfall 7 (cross-layer wiring in 4-layer mini-project) — spec.json must include cross-file regex checks, not just per-artifact existence checks

### Phase Ordering Rationale

- Infrastructure precedes content: parser, progress schema, and module discovery are hard dependencies for everything else
- 1a and 1b can run in parallel — they touch different files with no shared state
- 1c depends on 1a and 1b completing — it wires both into the CLI entry point
- 1d, 1e, 1f are independent of each other and of 1a-1c — all can run in parallel if bandwidth allows
- Phase 2 starts only after Phase 1 is fully tested — content built on broken infrastructure requires rework
- Phase 3 starts only after Module 1 is validated — Module 2 expansion references Module 1 concepts

### Research Flags

Phases where `/gsd:research-phase` is NOT needed (well-documented, standard patterns):
- **Phase 1a-1e:** All changes are surgical modifications to fully analyzed files. Before/after schemas documented in ARCHITECTURE.md and PITFALLS.md. No ambiguity.
- **Phase 1f (markdown-parser.cjs):** GSD markdown files have consistent conventions confirmed by inspecting real files. Regex extraction patterns are straightforward.
- **Phase 3:** Small targeted additions to existing, well-understood files.

Phases that benefit from a planning checkpoint (design review, not full research):
- **Phase 2, Lesson 1:** Treat as a prototype with explicit review before generating lessons 2-6. Catching framing issues early prevents regenerating all content.
- **Phase 3, spec.json design:** The cross-layer regex checks in the 4-artifact Module 2 spec require careful design — each cross-check must reference a concrete string appearing in a paired file. Worth a design session before writing spec.json.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All findings from direct codebase inspection. Zero-dependency constraint confirmed from PROJECT.md and verified against every existing lib module. No external library decisions required. |
| Features | HIGH | Feature list derived from direct comparison with existing Command Lifecycle module structure and PROJECT.md v2.0 requirements. Anti-features confirmed by examining what exists and what would conflict. |
| Architecture | HIGH | Component change list verified by reading every file in `learn/lib/`. The 10-of-12 unchanged modules confirmed by examining actual function signatures. Data flow diagrams derived from actual code, not inference. |
| Pitfalls | HIGH | Every pitfall backed by a specific file and observable behavior (e.g., `path.join(cwd, artifact.path)` with no tilde handling in verifier.cjs; `modules: {}` empty object in progress.cjs; hardcoded sectionMap in concept-map.cjs). Not speculative — observed. |

**Overall confidence:** HIGH

### Gaps to Address

- **Lesson narrative quality:** Research identifies the risk but cannot pre-validate prompt framing quality until Lesson 1 is generated and reviewed. Mitigate by treating Lesson 1 as a prototype with an explicit review gate. Budget time for prompt template revision before generating all 6 lessons.

- **Sandbox vs live directory for Module 1 mini-project:** FEATURES.md recommends `learn/sandbox/` to avoid polluting the GSD install. ARCHITECTURE.md's sample spec.json uses `~/.claude/` paths. Resolve this at the start of Phase 2: use sandbox for Module 1 (new command creation, risk of malformed files), use `~/.claude/` for Module 2 (pre-existing echo command, paths are known and deterministic).

- **Concept map content for Module 1:** Research specifies moving concept maps into `module.json` but does not define the actual ASCII diagram for the GSD Commands module. This is a content authoring task, not a technical gap. Author the diagram during Phase 2 lesson writing alongside Lesson 1.

- **generate-lessons.cjs refactor scope:** Both STACK.md and PITFALLS.md flag the hardcoded lesson generation script. Scoped to Phase 3. Keep bounded: extract lesson plan to config, add `--module` flag, dispatch parser by file extension. Shipped lessons remain static JSON — the refactor unblocks future content regeneration, not the initial launch.

## Sources

### Primary (HIGH confidence — direct codebase analysis)
- `learn/lib/parser.cjs` — confirmed CJS-only extraction; markdown input returns empty structures
- `learn/lib/progress.cjs` — confirmed flat v1 schema; unused `modules: {}` field already in DEFAULT_PROGRESS
- `learn/lib/concept-map.cjs` — confirmed hardcoded single CONCEPT_MAP constant with 7 Command Lifecycle sectionMap entries
- `learn/bin/gsd-learn.cjs` — confirmed hardcoded `command-lifecycle` default (line 43); flat single-module progress flow
- `learn/bin/generate-lessons.cjs` — confirmed hardcoded LESSON_PLAN array + hardcoded output path to command-lifecycle/lessons/
- `learn/lib/verifier.cjs` — confirmed `path.join(cwd, artifact.path)` with no HOME expansion
- `learn/lib/lessons.cjs` — confirmed generic `loadModule(moduleId)`; no `listModules()` function exists
- `learn/content/modules/command-lifecycle/` — confirmed complete module structure used as proven pattern
- `commands/gsd/new-project.md`, `commands/gsd/execute-phase.md` — confirmed consistent YAML frontmatter + XML tag structure
- `get-shit-done/workflows/new-project.md` — confirmed XML tag structure + bash code block patterns
- `learn/content/modules/command-lifecycle/project/spec.json` — confirmed regex check pattern for mini-project verification
- `.planning/PROJECT.md` — v2.0 milestone requirements; zero runtime dependency constraint

### Secondary (MEDIUM confidence — project documentation)
- `.planning/codebase/ARCHITECTURE.md` — GSD two-layer architecture (markdown layer + Node.js layer)
- `.planning/ROADMAP.md` — existing phase context; phase 03-03-PLAN.md notes verifier HOME expansion as pending work
- `get-shit-done/bin/lib/frontmatter.cjs` — examined and ruled out for cross-boundary import; regex re-implementation recommended

---
*Research completed: 2026-03-12*
*Ready for roadmap: yes*
