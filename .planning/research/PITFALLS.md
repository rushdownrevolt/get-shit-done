# Pitfalls Research

**Domain:** Adding Module 1 (GSD Commands & Workflows) to gsd-learn single-module CLI
**Researched:** 2026-03-12
**Confidence:** HIGH (based on direct codebase analysis of existing system)

## Critical Pitfalls

### Pitfall 1: Parser Cannot Handle Markdown Files

**What goes wrong:**
The existing `parser.cjs` is built exclusively for CommonJS `.cjs` files. It extracts `require()` calls, `module.exports`, `function` declarations, JSDoc comments, and `UPPER_SNAKE_CASE` constants. None of these patterns exist in the markdown files that Module 1 teaches (`commands/gsd/*.md` and `workflows/*.md`). If the new module tries to reuse the existing parser, it will return empty structures for every field, producing empty or broken lessons.

**Why it happens:**
The v1.0 system was built for a single module (Command Lifecycle) that teaches Node.js internals. The parser was purpose-built for that content type. It is natural to assume "parse source files" means "use the existing parser" -- but the source files for Module 1 are a completely different format.

**How to avoid:**
Build a new markdown parser (e.g., `markdown-parser.cjs`) that extracts meaningful structures from GSD command/workflow markdown files: YAML frontmatter metadata, section headings, bash code blocks, agent spawn patterns (`/claude` calls), `@file:` references, gsd-tools.cjs command invocations within code blocks, and structured workflow steps. The existing `parser.cjs` should remain untouched -- Module 2 still needs it.

**Warning signs:**
- Lesson JSON files for Module 1 have empty `content` arrays or only `text` blocks with no `code` blocks
- The prompt templates reference `{{EXPORTS}}` or `{{FUNCTIONS}}` for markdown source files
- Generated lessons describe what a workflow "should do" instead of showing actual source snippets

**Phase to address:**
Phase 1 (Content Infrastructure) -- the markdown parser must exist before any lesson generation begins.

---

### Pitfall 2: Hardcoded Single-Module Assumptions in Progress Tracking

**What goes wrong:**
The current `progress.json` structure stores a flat `currentModule` and `currentLesson` at the top level, with an empty `modules: {}` object that is never populated. The `--status` flag reads `progress.currentModule` and `progress.currentLesson` directly. The `--reset` flag deletes the entire progress file. There is no per-module progress tracking -- switching to Module 1 would overwrite Module 2's progress, and resetting one module resets everything.

**Why it happens:**
v1.0 only had one module, so there was no need for per-module progress. The `modules: {}` field in `DEFAULT_PROGRESS` hints at future multi-module support but was never wired up. When adding Module 1, the temptation is to "just change the moduleId" without restructuring progress storage.

**How to avoid:**
Migrate progress to per-module tracking before adding Module 1 content:
```json
{
  "version": 2,
  "currentModule": "gsd-commands",
  "modules": {
    "gsd-commands": { "currentLesson": 3, "completed": false },
    "command-lifecycle": { "currentLesson": 5, "completed": false }
  }
}
```
Add a migration path from version 1 to version 2 that preserves the existing Command Lifecycle progress. Update `--reset` to accept `--module` flag for selective reset. Update `--status` to show progress across all modules.

**Warning signs:**
- Starting Module 1 clobbers Module 2 lesson position
- `--status` only shows one module's progress
- `--reset` wipes all progress with no way to reset just one module
- The `modules: {}` field remains empty after using multiple modules

**Phase to address:**
Phase 1 (Infrastructure) -- progress restructuring must happen before any multi-module navigation is built.

---

### Pitfall 3: Concept Map is Hardcoded to Command Lifecycle Architecture

**What goes wrong:**
The `concept-map.cjs` module contains a single hardcoded ASCII art diagram showing the full GSD command flow (Command Spec -> Workflow -> Tool Dispatch -> State/Config/Phase). The `sectionMap` for YOU ARE HERE markers only maps to these specific labels (`entry-point`, `command-spec`, `workflow`, `tool-dispatch`, `state`, `config`, `phase`). Module 1 teaches the markdown layer (commands and workflows), which needs its own concept map scoped to how `.md` command specs connect to workflow orchestrators, how workflows spawn agents, and how `@file:` references work. Using the existing concept map for Module 1 lessons would show the full architecture when the learner has only learned about the top two boxes.

**Why it happens:**
The concept map was built as a single global constant rather than a per-module resource. Since v1.0 had one module, there was no reason to parameterize it.

**How to avoid:**
Make concept maps module-specific. Either: (a) move concept map definitions into each module's `module.json` (as a `conceptMap` field with the ASCII art and section mappings), or (b) create a concept map registry in `concept-map.cjs` keyed by module ID. Option (a) is better because it keeps module content self-contained.

**Warning signs:**
- Module 1 lessons show the Tool Dispatch / State / Config / Phase diagram when they should show the Command -> Workflow -> Agent flow
- YOU ARE HERE markers never highlight anything because Module 1's `conceptMap` field values don't match the hardcoded `sectionMap`

**Phase to address:**
Phase 1 (Infrastructure) -- concept maps must be per-module before Module 1 lessons can render correctly.

---

### Pitfall 4: Module Renumbering Breaks Existing User Progress

**What goes wrong:**
The project requires the new module to become Module 1 and Command Lifecycle to become Module 2. If module IDs change (e.g., from `command-lifecycle` to `module-2-command-lifecycle`), existing progress.json files that reference `"currentModule": "command-lifecycle"` will point to a nonexistent module. Worse, if lesson content is renumbered to reflect the new module ordering, saved `currentLesson` indices will land on the wrong lesson.

**Why it happens:**
The natural instinct when renumbering is to rename directories, change IDs in module.json, and update lesson numbers. But the progress file is stored in the user's project directory (`.planning/learn/progress.json`), separate from the content. There is no mechanism to detect or migrate stale references.

**How to avoid:**
Keep the module ID `command-lifecycle` unchanged. Module IDs are internal identifiers, not display names. Add a `displayOrder` or `order` field to `module.json` to control presentation order without changing IDs. The module title can change to "Module 2: Command Lifecycle" for display purposes while the ID stays stable. This avoids any migration complexity.

**Warning signs:**
- After update, running `gsd-learn --status` shows "Module not found" errors
- User's saved progress.json references a module ID that no longer exists in `content/modules/`
- Lesson indices mismatch (user was on lesson 3 but now sees lesson 4's content at index 3)

**Phase to address:**
Phase 1 (Infrastructure) -- module ordering strategy must be decided before any content is created.

---

### Pitfall 5: Prompt Templates Assume JavaScript Source Code Input

**What goes wrong:**
The existing lesson generation prompts (`overview.prompt.md` and `source-dive.prompt.md`) have template variables like `{{EXPORTS}}`, `{{FUNCTIONS}}`, `{{REQUIRES}}`, `{{SOURCE_CODE}}` -- all JavaScript-specific constructs. The source-dive prompt literally says "Parse a GSD CommonJS source file." These prompts cannot generate lessons for markdown files without modification. Using them as-is would produce lessons that awkwardly try to explain markdown files using JavaScript terminology.

**Why it happens:**
The prompt templates were designed for a single content type. The v1.0 lesson generation pipeline was: parse .cjs file -> fill template variables -> generate lesson JSON. For markdown files, the pipeline needs different parsing, different template variables, and different instructional framing.

**How to avoid:**
Create new prompt templates for markdown content:
- `command-spec.prompt.md` -- for teaching command definition files (frontmatter metadata, description, flags, workflow references)
- `workflow-dive.prompt.md` -- for teaching workflow orchestration files (step sequences, agent spawning, state management patterns, gsd-tools.cjs calls)

These templates should have markdown-appropriate variables: `{{FRONTMATTER}}`, `{{SECTIONS}}`, `{{BASH_BLOCKS}}`, `{{AGENT_SPAWNS}}`, `{{GSD_TOOL_CALLS}}`.

**Warning signs:**
- Lesson generator prompts reference `{{FUNCTIONS}}` or `{{EXPORTS}}` for markdown files
- Generated lessons describe markdown files as if they were JavaScript modules
- Lessons fail to explain the key structural elements of command/workflow markdown (frontmatter, step numbering, agent references)

**Phase to address:**
Phase 2 (Content Generation) -- new prompts needed before generating Module 1 lessons, but after the markdown parser (Phase 1) provides the structured data to fill template variables.

---

### Pitfall 6: generate-lessons.cjs LESSON_PLAN is Hardcoded to Command Lifecycle

**What goes wrong:**
The `generate-lessons.cjs` script contains a hardcoded `LESSON_PLAN` array with 5 entries, all for the Command Lifecycle module. It references specific `.cjs` source files (`bin/gsd-tools.cjs`, `bin/lib/core.cjs`, etc.) and uses `parseSourceFile()` from the .cjs parser. The `validateAndCopy()` function writes output to a hardcoded path: `content/modules/command-lifecycle/lessons/`. Adding Module 1 requires either duplicating this entire script (creating drift) or refactoring it to be module-aware.

**Why it happens:**
v1.0 only needed one lesson plan, so making the script generic was unnecessary. The lesson plan is not loaded from a config file -- it is embedded directly in the generator code alongside the pipeline logic.

**How to avoid:**
Separate the lesson plan data from the generation logic. Move each module's lesson plan to a `lesson-plan.json` (or `lesson-plan.cjs` for flexibility) inside its module directory (`content/modules/{id}/lesson-plan.json`). Refactor `generate-lessons.cjs` to accept a `--module` flag, load the plan from the module directory, and select the appropriate parser based on the source file extension (`.cjs` uses `parser.cjs`, `.md` uses the new `markdown-parser.cjs`). Keep `validateAndCopy()` generic by deriving the output path from the module ID.

**Warning signs:**
- Someone copies `generate-lessons.cjs` to `generate-module1-lessons.cjs` as a quick fix
- Module 1 lesson plan is hardcoded in a second location with no shared structure
- Adding Module 3 would require yet another copy of the generation script

**Phase to address:**
Phase 1 (Content Infrastructure) -- the generator refactor should happen alongside the markdown parser, before any Module 1 content generation.

---

### Pitfall 7: Expanding Mini-Project from 2 to 4 Layers Without Cross-Layer Verification

**What goes wrong:**
The current Command Lifecycle mini-project (`spec.json`) verifies 2 artifacts independently: (1) `echo.cjs` exists with exports, cmd function, and output pattern, and (2) `gsd-tools.cjs` has a `case 'echo'` in its switch. These checks are independent -- they do not verify the artifacts work together. Expanding to 4 layers (command.md, workflow.md, echo.cjs, gsd-tools.cjs switch case) multiplies the independent-check problem. The learner could create all 4 files but wire them incorrectly: the command.md might reference a different workflow name than what they created, or the workflow.md might call a different gsd-tools.cjs command than the one they added. All 4 regex checks would pass, but the feature would not actually work.

**Why it happens:**
Regex-based structural verification can only confirm "this pattern exists in this file." It cannot verify cross-file relationships like "command.md's workflow field matches the workflow file name" or "workflow.md calls the same gsd-tools.cjs command that the switch case handles." The v1.0 2-layer project was simple enough that cross-layer issues were unlikely (there are only so many ways to connect echo.cjs to a switch case). At 4 layers, the wiring becomes the hard part.

**How to avoid:**
Two complementary strategies:
1. **Add cross-layer regex checks to spec.json:** For example, check that command.md contains a reference to the workflow filename, and check that workflow.md contains a `gsd-tools.cjs` invocation matching the command name. These are still regex-based but verify cross-file consistency.
2. **Make the mini-project instructions explicit about wiring:** Each layer's instructions should state exactly what name/reference connects it to the next layer. "Your command.md's description should reference your workflow. Your workflow.md should call `node gsd-tools.cjs echo`." This reduces the chance of naming mismatches.

Do NOT attempt runtime verification (actually executing the command) -- that would require spawning Claude Code with the learner's custom command, which is way out of scope.

**Warning signs:**
- All 4 artifact checks pass but the learner says "I created everything but it doesn't actually work when I try it"
- The spec.json has 4 artifact entries but zero checks that reference content from another artifact
- Mini-project hints only cover individual file creation, never the wiring between files

**Phase to address:**
Phase 3 (Mini-Project Update) -- the expanded spec.json and hints must be designed with cross-layer verification in mind.

---

### Pitfall 8: Teaching "What" Without "How to Modify"

**What goes wrong:**
Module 1 teaches markdown files (slash commands and workflows). The danger is creating lessons that merely describe the structure of these files without teaching the learner how to create or modify their own. Unlike Module 2 where code patterns provide clear "here's how to add a new command" transferable knowledge, markdown configuration files can feel like documentation reading. The learner finishes the module knowing what the files contain but unable to write new ones.

**Why it happens:**
Markdown-based configuration is inherently declarative -- there is less "why was this designed this way?" to explain compared to code. It is tempting to fill lessons with "this field means X, that field means Y" reference material rather than building problem-solving skills.

**How to avoid:**
Structure Module 1 lessons around the question "What happens when I want to add a new /gsd command?" rather than "What does each field in a command.md file mean?" Each lesson should include a practical mental exercise: "If you wanted to add /gsd:my-custom-command, which file would you create? What frontmatter would you need?" The mini-project should have the learner create a new command.md + workflow.md pair, not just read existing ones.

**Warning signs:**
- Lessons are structured as "here are the fields" reference docs rather than "here's how the pieces connect" narratives
- No lesson connects the creation of a command.md to its workflow.md -- they are taught in isolation
- Mini-project only asks learner to identify existing files rather than create new ones

**Phase to address:**
Phase 2 (Content Generation) -- lesson narrative design must prioritize "how to modify" framing.

---

### Pitfall 9: Verifier Path Resolution Mixes cwd and HOME Paths

**What goes wrong:**
The `runVerification()` function in `verifier.cjs` resolves all artifact paths relative to `cwd` (`path.join(cwd, artifact.path)`). The current mini-project checks files inside the repo (`get-shit-done/bin/lib/echo.cjs`), which works because the learner runs `gsd-learn` from the repo root. But the v2.0 4-layer mini-project needs to verify files that live in the user's HOME-based GSD install (`~/.claude/commands/gsd/` and `~/.claude/get-shit-done/workflows/`). The existing verifier has no concept of HOME path expansion. If spec.json uses `~/.claude/commands/gsd/echo.md` as an artifact path, `path.join(cwd, '~/.claude/...')` produces a nonsense path.

**Why it happens:**
v1.0 artifacts were all repo-relative. The 4-layer expansion introduces artifacts in two different path roots: repo-relative for .cjs files and HOME-relative for .md files in the Claude install directory.

**How to avoid:**
Add a path resolution strategy to the verifier. Two options:
1. **Prefix convention in spec.json:** Use `~` prefix for HOME-relative paths and no prefix for cwd-relative. Add tilde expansion in `runVerification()` before `path.join()`.
2. **Path variables in spec.json:** Use `{{HOME}}` or `{{GSD_ROOT}}` placeholders that the verifier resolves at runtime.

Option 1 is simpler and matches Unix conventions the learner already knows. The ROADMAP phase 3 already has a plan (`03-03-PLAN.md`) noted for "Fix artifact paths to target live GSD install + verifier HOME expansion" -- this must be completed before the 4-layer mini-project can work.

**Warning signs:**
- `gsd-learn --verify` reports "File not found" for markdown artifacts that the learner clearly created
- spec.json artifact paths contain `~` or absolute paths that `path.join(cwd, ...)` mangles
- Verification passes on the developer's machine (where repo root happens to be near HOME) but fails elsewhere

**Phase to address:**
Phase 1 (Infrastructure) -- verifier path resolution must handle both cwd-relative and HOME-relative paths before the 4-layer spec.json is created.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Duplicating parser.cjs and modifying for markdown | Quick markdown parsing without refactoring | Two parsers with no shared interface; each module addition requires a new parser | Never -- build a separate markdown-parser.cjs from scratch instead of forking the JS parser |
| Keeping progress.json flat (version 1 format) | No migration needed, ship faster | Every future module addition hits the same progress-clobbering bug | Never -- the migration from v1 to v2 format is trivial and prevents ongoing issues |
| Hardcoding Module 1 concept map alongside Module 2's | Quick visual result | concept-map.cjs becomes a growing dump of hardcoded diagrams, one per module | Only if you cap at 2 modules permanently -- unlikely given the project trajectory |
| Generating Module 1 lessons manually (hand-written JSON) instead of using parsed source | Skip building markdown parser entirely | Lessons drift from actual source files, violating the core project constraint ("parse GSD source files directly") | Only for initial prototyping during content design, never for shipped lessons |
| Reusing verifier.cjs regex checks for markdown mini-project | Quick verification without new code | Regex patterns designed for .cjs files will not validate markdown artifact structure | Never -- the mini-project spec.json should define markdown-appropriate checks |
| Copying generate-lessons.cjs for Module 1 | Fast path to lesson generation without refactoring | Two generation scripts with duplicated pipeline logic; divergent behavior over time | Only as a temporary spike to test markdown lesson generation before committing to the refactor |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Module loading (`lessons.cjs`) | Assuming `loadModule()` needs changes for new modules | `loadModule()` is already generic -- it loads any `content/modules/{id}/module.json`. Just create the new module directory with the right structure. No code changes needed in lessons.cjs. |
| Navigation loop (`navigator.cjs`) | Modifying navigator to handle module switching | Navigator handles a single lesson array and does not need to know about modules. Module selection happens in `gsd-learn.cjs` before the navigation loop starts. Add module selection logic in the CLI entry point, not the navigator. |
| Verification (`verifier.cjs`) | Reusing Command Lifecycle verification patterns for markdown artifacts | Create a new `spec.json` in `content/modules/gsd-commands/project/spec.json` with markdown-appropriate regex checks (e.g., checking for YAML frontmatter `---` blocks, specific field names, workflow step structure). |
| Concept map rendering | Passing Module 1 section names to the existing `renderConceptMap()` | The function's `sectionMap` only knows Command Lifecycle sections. Either extend the section map with Module 1 sections (creates coupling) or make concept maps module-owned resources loaded from module.json. |
| Lesson renderer (`renderer.cjs`) | Assuming markdown source files need a new content type | The renderer already handles `text`, `code`, and `project` content types. Markdown source snippets can use the existing `code` type with `language: "markdown"`. No renderer changes needed for basic rendering -- only concept map rendering needs to be module-aware. |
| Feedback system (`feedback.cjs`) | Assuming feedback needs restructuring for multi-module | `feedback.json` already uses project IDs as keys (`projects[projectId]`). Each module's spec.json defines its own project ID. The feedback system is already module-aware -- just create a unique project ID for Module 1's mini-project. |
| 4-layer mini-project artifacts | Putting all 4 artifact checks in one spec.json with no cross-layer validation | Design spec.json with cross-referencing checks: artifact 3 (workflow.md) should include a regex that matches the command name defined in artifact 1 (command.md). This catches wiring errors, not just existence. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No module selection UI | Learner must know to pass `--module=gsd-commands` flag; default still goes to command-lifecycle | Add a module selection screen when no `--module` flag is passed. Show available modules with completion status. Or change the default to Module 1 since it is now the recommended starting point. |
| Module 1 and Module 2 feel disconnected | Learner finishes Module 1 (markdown layer) and starts Module 2 (Node.js layer) with no bridge | Add a bridge lesson at the end of Module 1 that previews how the markdown layer connects to the Node.js layer. "You now know how commands and workflows are structured. Module 2 shows what happens when gsd-tools.cjs executes the commands these workflows call." |
| Full-stack mini-project in Module 2 assumes Module 1 knowledge | Learner who skips Module 1 and jumps to Module 2 cannot complete the 4-layer mini-project | Add a prerequisite check: if Module 1 is not completed, show a warning when starting Module 2's mini-project. Do not block -- just inform. |
| No visual distinction between modules | Learner cannot tell which module they are in while navigating lessons | Add the module name to the lesson header. Currently the header shows "Lesson X of Y" -- change to "Module 1: GSD Commands / Lesson X of Y". |
| Lessons for markdown files feel flat compared to code-heavy Module 2 | Markdown lessons are all `text` blocks with occasional `code` blocks showing yaml/markdown. Less visual variety than Module 2's highlighted JavaScript. | Use the `code` content type liberally with `language: "yaml"` for frontmatter and `language: "bash"` for workflow steps. Add a new content type `callout` or use bold text patterns to highlight key structural rules. |
| 4-layer mini-project overwhelms learner | Going from 2 artifacts (echo.cjs + switch case) to 4 artifacts (command.md + workflow.md + echo.cjs + switch case) doubles the work without clear guidance on ordering | Structure the mini-project instructions as a sequential checklist: "Step 1: Create command.md. Step 2: Create workflow.md. Step 3: Create echo.cjs. Step 4: Add switch case." Progressive hints should follow the same order. |

## "Looks Done But Isn't" Checklist

- [ ] **Module selection:** Verify that `gsd-learn` without `--module` flag handles two modules gracefully (not just defaulting to the old module)
- [ ] **Progress migration:** Verify that an existing `progress.json` (version 1) is correctly migrated to version 2 format without losing Command Lifecycle progress
- [ ] **Module 1 concept map:** Verify the concept map renders correctly with YOU ARE HERE markers for Module 1 lessons (not showing Module 2's diagram)
- [ ] **Module 1 lessons parse real source:** Verify that every `code` block in Module 1 lessons contains actual content from the source markdown files, not hand-written approximations
- [ ] **Mini-project verification:** Verify that `gsd-learn --verify --module=gsd-commands` runs spec.json checks appropriate for markdown artifacts (not .cjs patterns)
- [ ] **Hints system:** Verify that `gsd-learn --hint --module=gsd-commands` loads hints from the correct module's `project/hints.json`, not the default Command Lifecycle hints
- [ ] **Module ordering:** Verify that `--status` shows Module 1 before Module 2 in display order, regardless of internal module IDs
- [ ] **Cross-module links:** Verify the bridge between Module 1 and Module 2 -- the final Module 1 lesson should reference Module 2, and Module 2's updated mini-project should reference all 4 layers including the markdown ones taught in Module 1
- [ ] **Reset per-module:** Verify that `--reset --module=gsd-commands` only resets Module 1 progress, not Module 2
- [ ] **4-layer cross-references:** Verify that the expanded spec.json includes at least one cross-layer check (e.g., workflow.md references the command name, switch case imports from the correct echo.cjs path)
- [ ] **HOME path resolution:** Verify that `--verify` correctly resolves `~` paths to the user's actual HOME directory for markdown artifacts in `~/.claude/`
- [ ] **generate-lessons.cjs:** Verify that running lesson generation for Module 1 uses the markdown parser, not the .cjs parser, and outputs to the correct module directory

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Parser cannot handle markdown | MEDIUM | Build markdown-parser.cjs from scratch. Does not require modifying existing parser.cjs. Estimated effort: one focused phase. |
| Progress tracking clobbers between modules | LOW | Add version 2 progress format with migration function. Small change to progress.cjs -- the `modules: {}` field was already designed for this. |
| Concept map shows wrong diagram | LOW | Move concept maps into module.json. Update renderConceptMap() to accept a map definition instead of using a global constant. Small refactor. |
| Module renumbering breaks progress | LOW if caught early, HIGH if shipped | If IDs were already changed: add an alias map in loadModule() that redirects old IDs to new ones. Better: keep IDs stable and use display order. |
| Lessons are reference docs not learning material | HIGH | Requires regenerating all Module 1 lesson content with different prompt framing. Content quality issues are expensive to fix after generation because the prompt templates, source parsing, and lesson structure all need rework. |
| Full-stack mini-project unclear without Module 1 | LOW | Add prerequisite warning check in gsd-learn.cjs before entering Module 2's mini-project lesson. Small code addition. |
| generate-lessons.cjs hardcoded to one module | MEDIUM | Extract lesson plan to config files, add --module flag, add parser dispatch by file extension. Moderate refactor but well-scoped. |
| Cross-layer wiring wrong in 4-layer project | MEDIUM | Add cross-file regex checks to spec.json. Requires designing checks carefully -- each check must reference a concrete string that appears in the paired file. |
| Verifier cannot resolve HOME paths | LOW | Add tilde expansion in runVerification() before path.join(). Small, self-contained change. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Parser cannot handle markdown | Phase 1: Content Infrastructure | markdown-parser.cjs exists and produces structured output from command.md and workflow.md files |
| Progress tracking single-module | Phase 1: Content Infrastructure | progress.json uses version 2 format; switching modules preserves per-module lesson position |
| Concept map hardcoded | Phase 1: Content Infrastructure | Each module.json contains its own concept map; renderConceptMap() loads from module data |
| Module renumbering breaks progress | Phase 1: Content Infrastructure | Module IDs are stable; display order controlled by `order` field in module.json |
| generate-lessons.cjs hardcoded | Phase 1: Content Infrastructure | Generator accepts --module flag, loads lesson plan from module directory, dispatches to correct parser |
| Verifier path resolution | Phase 1: Content Infrastructure | runVerification() expands ~ to HOME; tests confirm cross-root path resolution |
| Prompt templates assume JavaScript | Phase 2: Content Generation | New prompt templates exist for markdown source; generated lessons reference actual markdown structures |
| Lessons are flat reference docs | Phase 2: Content Generation | Lessons follow "how to add a new command" narrative arc; each lesson includes a practical mental exercise |
| Cross-layer wiring in 4-layer project | Phase 3: Mini-Project Update | spec.json includes cross-layer regex checks; hints cover wiring between layers, not just individual file creation |
| No module selection UX | Phase 3: Navigation and Polish | Running `gsd-learn` with no flag shows module picker or auto-selects Module 1 |
| Modules feel disconnected | Phase 3: Navigation and Polish | Bridge lesson exists at end of Module 1; Module 2 intro references Module 1 concepts |
| Full-stack mini-project prerequisites | Phase 3: Navigation and Polish | Module 2 mini-project shows prerequisite warning if Module 1 not completed |

## Sources

- Direct codebase analysis of `learn/lib/parser.cjs` (line-by-line: only handles .cjs files via extractRequires, extractExports, extractFunctions, extractSections, extractConstants)
- Direct codebase analysis of `learn/lib/progress.cjs` (flat structure, unused `modules: {}` field, version 1 format)
- Direct codebase analysis of `learn/lib/concept-map.cjs` (hardcoded single CONCEPT_MAP constant and sectionMap with 7 Command Lifecycle entries)
- Direct codebase analysis of `learn/bin/gsd-learn.cjs` (hardcoded `moduleId` default to `command-lifecycle`, single-module progress flow)
- Direct codebase analysis of `learn/bin/generate-lessons.cjs` (hardcoded LESSON_PLAN array with 5 Command Lifecycle entries, hardcoded output path to `command-lifecycle/lessons/`)
- Direct codebase analysis of `learn/lib/verifier.cjs` (path.join(cwd, artifact.path) with no HOME expansion)
- Direct codebase analysis of `learn/content/modules/command-lifecycle/project/spec.json` (2 artifacts with .cjs-specific regex checks)
- Direct codebase analysis of `learn/content/prompts/` (JavaScript-specific template variables)
- `.planning/PROJECT.md` (v2.0 milestone requirements: new Module 1, renumbering, 4-layer mini-project)
- `.planning/codebase/ARCHITECTURE.md` (GSD two-layer architecture: markdown + Node.js)
- `.planning/ROADMAP.md` (existing phase 03-03-PLAN.md notes verifier HOME expansion as pending work)

---
*Pitfalls research for: gsd-learn v2.0 -- Module 1 (GSD Commands & Workflows), module renumbering, 4-layer mini-project*
*Researched: 2026-03-12*
