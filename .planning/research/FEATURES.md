# Feature Research

**Domain:** Interactive CLI teaching module for GSD slash commands and workflows
**Researched:** 2026-03-12
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features the learner assumes exist. Missing these = module feels incomplete or broken compared to the existing Command Lifecycle module.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Conceptual overview lesson (Lesson 1) | Established pattern from Command Lifecycle module. Learner needs mental model before source dives. Must explain the two-layer markdown architecture: command.md dispatches to workflow.md. | LOW | Reuse `overview` prompt template. Source material: the relationship between `commands/gsd/*.md` and `workflows/*.md`. |
| Source-dive: command.md anatomy | Learner must see inside a real command file to understand frontmatter (name, description, allowed-tools), XML sections (objective, execution_context, process), and how `@file:` references wire commands to workflows. | LOW | Parse a simple command like `echo.md` or `help.md`. Reuse `source-dive` prompt template with markdown adaptation. |
| Source-dive: workflow.md anatomy | Learner must see inside a real workflow file to understand the `<purpose>`, `<required_reading>`, `<process>` structure, bash code blocks calling gsd-tools.cjs, and agent spawning via Task(). | MEDIUM | Parse a simple workflow like `echo.md` first, then reference a complex one. Key challenge: existing `parser.cjs` extracts exports/functions/requires from `.cjs` files only. Markdown files need a different content assembly approach (see Content Assembly section below). |
| Source-dive: command-to-workflow wiring | Learner must understand the dispatch chain: user types `/gsd:X` -> runtime loads `commands/gsd/X.md` -> command's `execution_context` points to `workflows/X.md` -> workflow orchestrates. This is the "aha" moment of the module. | LOW | Side-by-side snippets from echo command + echo workflow. |
| Mini-project lesson (final lesson) | Established pattern. Learner builds something real, verified structurally. Without this, the module is passive reading, not validated learning. | MEDIUM | Must verify markdown artifacts, not JavaScript. See mini-project design section below. |
| module.json configuration | Command Lifecycle module has module.json with id, title, description. New module needs the same. Lesson infrastructure expects it via `loadModule()` in lessons.cjs. | LOW | Create `learn/content/modules/gsd-commands/module.json`. |
| Progressive hint system for mini-project | Command Lifecycle provides 5 progressive hints. Learner expects the same safety net. | LOW | Create `hints.json` following established pattern: vague -> specific, never gives the answer. |
| Navigation, progress tracking, clipboard copy | Infrastructure features already built. Learner expects them to work identically for the new module. | LOW | Zero new code needed. Existing `navigator.cjs`, `progress.cjs`, `clipboard.cjs` handle any module with the right content directory structure. |
| Module selection / renumbering | PROJECT.md requires this module to be Module 1 and Command Lifecycle to become Module 2. Currently `gsd-learn.cjs` defaults to `--module=command-lifecycle`. There is no module listing or ordering mechanism -- just a `--module` flag. | MEDIUM | Needs either: (a) a module registry/manifest defining order, or (b) updating the default to `gsd-commands` and adding a `--list-modules` flag, or (c) a module menu at startup. See Module Renumbering section below. |

### Differentiators (Competitive Advantage)

Features that make this module valuable beyond "more lessons." These connect to the Core Value: learner can confidently modify and extend GSD.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Mini-project: build a custom slash command end-to-end (command.md + workflow.md) | THE differentiator. The learner creates a real, functional `/gsd:` command by writing two markdown files. Proves they understand the full markdown layer. Verified by checking file structure, frontmatter fields, and workflow step presence. | MEDIUM | Analogous to the echo command mini-project but targeting the markdown layer instead of JavaScript. See detailed design below. |
| Workflow patterns lesson (simple vs orchestrator vs agent-spawning) | Not all workflows are equal. Some are trivial (echo, help -- just output text), some orchestrate multi-step processes (quick -- parse args, init, spawn planner, spawn executor, update state), some spawn parallel subagents (execute-phase, new-project). Teaching this taxonomy helps learners identify which pattern to use when building their own commands. | MEDIUM | Source-dive comparing echo.md (trivial), health.md (tool call), and a workflow excerpt showing Task() agent spawning. |
| Bridge content connecting Module 1 to Module 2 | The markdown layer and Node.js layer work together. Showing how workflow bash blocks call `node gsd-tools.cjs <command>` creates a "this is how everything connects" moment and motivates Module 2. | LOW | Woven into the workflow anatomy lesson rather than standalone. Show the bash code block and connect forward to Module 2's entry-point lesson. |
| Updated Module 2 mini-project: full-stack (all 4 layers) | Per PROJECT.md, the Command Lifecycle mini-project should expand to require command.md + workflow.md + echo.cjs + switch case. This validates cross-module understanding. | MEDIUM | Depends on Module 1 being complete. Update `spec.json` to add two more artifact checks for command.md and workflow.md. Update hints.json to cover the markdown layer. |
| Concept map spanning both layers | "You are here" marker showing command-to-workflow-to-tool flow. Helps learner see where each lesson fits in the overall GSD architecture. | LOW | Extend existing `conceptMap` field in lesson JSON. New sections: "command-layer", "workflow-layer", "wiring", "patterns", "mini-project". |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Teaching every command and workflow exhaustively | "Cover all 33+ commands and 36+ workflows" seems thorough | Overwhelming, repetitive, unmaintainable. Most commands follow 2-3 patterns. Teaching all of them is like teaching every function in a library instead of the API design. | Teach 3-4 representative commands (trivial, moderate, complex) and the patterns they embody. Learner extrapolates to the rest. |
| Interactive command execution within lessons | "Let learner run `/gsd:echo` from within the lesson" | gsd-learn runs in a Node.js terminal process. Launching Claude Code commands from within it creates process management complexity, unclear error states, and conflates the teaching tool with the taught tool. | Lessons describe what happens. Mini-project has the learner create files and verify statically. Learner can run commands in a separate terminal. |
| Auto-generating lessons from ALL markdown source files | "Just parse every .md file and create a lesson" | Produces shallow, disconnected lessons. Good teaching requires narrative arc, deliberate sequencing, and curated examples. Auto-gen from all files produces a reference manual, not a tutorial. | Hand-curate the lesson plan (which files, which order, which focus). Use the generation pipeline to assemble content from curated sources. |
| Agent system deep-dive in this module | "Teach how agents like gsd-planner and gsd-executor work" | Agents are the most complex part of GSD. They depend on understanding both the markdown layer AND the Node.js layer. Including them in Module 1 violates the "simple first" principle. | Mention agents briefly in the workflow patterns lesson (they are spawned via Task()). Defer deep agent teaching to a potential future Module 3. |
| Quizzes or multiple-choice questions | "Add knowledge checks between lessons" | PROJECT.md explicitly excludes these. Validation is through doing (mini-projects), not recall. | The mini-project IS the assessment. Progressive hints guide without giving answers. |
| Teaching markdown/YAML syntax generically | "Explain YAML frontmatter, XML tags" | General knowledge, not GSD-specific. Learner is a developer who already knows markdown. | Assume markdown/YAML literacy. Focus on GSD-specific conventions: why frontmatter has `allowed-tools`, why `<execution_context>` uses `@file:` references. |
| Writing mini-project files to actual GSD install directory | "Make the command actually work by writing to ~/.claude/" | Risks breaking the GSD install if learner writes malformed files. Cleanup is harder. Requires elevated file system access. | Use a sandbox directory (`learn/sandbox/`). Verification checks the same structural patterns. Learner can copy to real location after passing. |

## Feature Dependencies

```
module.json (gsd-commands module identity)
    +-- standalone, no dependencies

Lesson 1: Conceptual Overview
    +--requires--> module.json
    +--requires--> Content for markdown-focused overview (hand-written or new prompt template)

Lesson 2: Command.md Anatomy
    +--requires--> Lesson 1 (overview provides mental model)
    +--requires--> Content assembly handles markdown source files (see Content Assembly)

Lesson 3: Workflow.md Anatomy
    +--requires--> Lesson 2 (learner already knows command.md)
    +--requires--> Content assembly handles markdown source files

Lesson 4: Command-to-Workflow Wiring
    +--requires--> Lessons 2 + 3 (both sides of the connection)

Lesson 5 (optional): Workflow Patterns
    +--requires--> Lesson 3 (basic workflow anatomy)

Mini-Project Lesson (final)
    +--requires--> All previous lessons
    +--requires--> spec.json (artifact checks targeting .md files)
    +--requires--> hints.json (progressive hints)
    +--requires--> Sandbox directory structure

Module selection mechanism
    +--requires--> New module content exists
    +--requires--> gsd-learn.cjs updated for multi-module support

Updated Module 2 Mini-Project (full-stack)
    +--requires--> Module 1 complete and validated
    +--requires--> Updated spec.json with 4 artifacts (command.md, workflow.md, echo.cjs, switch case)
```

### Dependency Notes

- **Content assembly for markdown files is the critical dependency.** The existing `parser.cjs` extracts exports, functions, and require() calls from `.cjs` files (see `extractRequires()`, `extractExports()`, `extractFunctions()`). Markdown command/workflow files have entirely different structure: YAML frontmatter, XML-like sections, bash code blocks. The `generate-lessons.cjs` pipeline calls `parseSourceFile()` and feeds results into prompt templates. Three options: (a) extend parser.cjs with a `parseMarkdownFile()` function that extracts frontmatter fields, XML sections, and code blocks, (b) hand-write lesson JSON directly (bypassing the generation pipeline for this module), or (c) create a markdown-specific prompt template that takes raw file content. Option (b) is fastest for MVP; option (a) aligns with the long-term "parse source for content" principle from PROJECT.md.
- **Module selection needs real work.** Currently `gsd-learn.cjs` has `const moduleId = flags.module || 'command-lifecycle'` (line 43). There is no module listing, no ordering, no way to know which modules exist without reading the `--module` flag docs. With two modules, this needs at minimum: (1) changing the default or showing a module picker, (2) some ordering concept so Module 1 (gsd-commands) comes before Module 2 (command-lifecycle). The `loadModule()` function in `lessons.cjs` already handles any module ID by directory lookup -- the gap is in discovery and ordering, not loading.
- **`generate-lessons.cjs` is hardcoded to command-lifecycle.** The `validateAndCopy()` function writes to `content/modules/command-lifecycle/lessons/` (line 135). The `LESSON_PLAN` array defines only Command Lifecycle lessons. To support the new module in the generation pipeline, needs either a separate LESSON_PLAN or a module parameter. Not a blocker for MVP if lessons are hand-written.
- **Mini-project verification works with existing infrastructure.** The `verifier.cjs` uses regex pattern checks defined in `spec.json`. These regexes work on any file content, including markdown. No verifier changes needed -- just different patterns in spec.json (e.g., `"pattern": "^---"` for frontmatter, `"pattern": "<objective>"` for required sections).
- **Module 2 update depends on Module 1 shipping first.** The full-stack mini-project references concepts from both modules. Sequence: ship Module 1 -> validate -> update Module 2 mini-project.
- **Progress tracking uses string module IDs.** The `progress.json` stores `currentModule: "command-lifecycle"` as a string ID, not a number. Module "renumbering" is conceptual (which module comes first in the learning path), not literal (no module numbers in the data). This simplifies things: the new module gets ID `gsd-commands`, the existing keeps `command-lifecycle`. Ordering is a UI/discovery concern.

## Content Assembly Strategy

The existing lesson pipeline works like this:

```
parser.cjs(file.cjs) -> structured data -> prompt-templates.cjs -> prompt text -> LLM -> lesson JSON
```

For Module 1 (markdown source files), there are two viable approaches:

### Approach A: Hand-Written Lesson JSON (MVP)

Write lesson JSON files directly into `learn/content/modules/gsd-commands/lessons/`. This is what the Command Lifecycle module actually ships with -- the LLM-generated content was reviewed and committed as static JSON. The pipeline generates prompts, but the shipped lessons are static files.

**Pros:** Fastest path, full narrative control, no parser changes needed.
**Cons:** Content can drift from source files if GSD commands change (though this is already deferred to a future milestone per PROJECT.md "out of scope").

### Approach B: Markdown Parser Extension (Post-MVP)

Add `parseMarkdownFile()` to parser.cjs that extracts:
- YAML frontmatter fields (name, description, allowed-tools, argument-hint)
- XML-like sections (objective, execution_context, context, process)
- Bash code blocks within process sections
- @file: references

**Pros:** Aligns with "parse source for content" principle, enables regeneration.
**Cons:** More work, not needed for initial ship, markdown structure is less uniform than .cjs files.

**Recommendation:** Use Approach A for MVP. The lessons are curated content, not auto-generated documentation. The Command Lifecycle module already ships hand-edited JSON. Approach B is a P3 enhancement.

## Module Renumbering Design

The goal: learner encounters Module 1 (GSD Commands & Workflows) before Module 2 (Command Lifecycle). Current state: `gsd-learn.cjs` defaults to `command-lifecycle` with no module discovery.

### Minimum Viable Renumbering

1. **Add a module manifest** at `learn/content/modules/manifest.json`:
   ```json
   {
     "modules": [
       { "id": "gsd-commands", "number": 1, "title": "GSD Commands & Workflows" },
       { "id": "command-lifecycle", "number": 2, "title": "Command Lifecycle" }
     ]
   }
   ```

2. **Update gsd-learn.cjs default** to show module selection when no `--module` flag is provided and no `currentModule` is in progress. When a module is in progress (stored in progress.json), resume it directly.

3. **Module completion detection:** When learner finishes the last lesson of Module 1, show a prompt suggesting Module 2. Add module completion tracking to progress.json:
   ```json
   {
     "currentModule": "gsd-commands",
     "currentLesson": 3,
     "modules": {
       "gsd-commands": { "completed": false, "lastLesson": 3 },
       "command-lifecycle": { "completed": true, "lastLesson": 5 }
     }
   }
   ```

### What Does NOT Need to Change

- `loadModule()` in `lessons.cjs` -- already loads any module by ID
- `progress.cjs` -- already uses string IDs for modules
- `navigator.cjs` -- module-agnostic, operates on lesson arrays
- `renderer.cjs` -- module-agnostic
- `verifier.cjs` -- loads spec.json by module ID path
- `hints.cjs` -- stateless, operates on hint arrays

The renumbering is primarily a **UI concern** (which module appears first, how modules are listed) and a **progress concern** (tracking per-module state), not a deep infrastructure change.

## MVP Definition

### Launch With

Minimum set to deliver a complete, verified learning experience for the markdown layer.

- [ ] `module.json` for gsd-commands module (id, title, description)
- [ ] Lesson 1: Conceptual overview of the markdown layer (command.md + workflow.md relationship, two-layer architecture)
- [ ] Lesson 2: Command.md anatomy (frontmatter fields, XML sections, @file: execution_context references)
- [ ] Lesson 3: Workflow.md anatomy (purpose, process steps, bash code blocks calling gsd-tools.cjs)
- [ ] Lesson 4: Command-to-workflow wiring (dispatch chain from `/gsd:X` to workflow execution)
- [ ] Lesson 5: Mini-project (build a custom slash command: command.md + workflow.md pair)
- [ ] `spec.json` with markdown artifact checks for mini-project verification
- [ ] `hints.json` with 5 progressive hints for mini-project
- [ ] Sandbox directory for mini-project artifacts (`learn/sandbox/`)
- [ ] Module manifest for ordering (`learn/content/modules/manifest.json`)
- [ ] gsd-learn.cjs updated: module selection/listing, default to first module in manifest
- [ ] Per-module progress tracking in progress.json (modules object with per-module state)

### Add After Validation

Features to add once the 5-lesson module works and learner feedback confirms approach.

- [ ] Lesson on workflow patterns (simple vs orchestrator vs agent-spawning) -- add if learners ask "which pattern do I use when?"
- [ ] Updated Module 2 mini-project requiring all 4 layers (command.md + workflow.md + echo.cjs + switch case)
- [ ] Lesson generation pipeline entry for new module (new LESSON_PLAN in generate-lessons.cjs)
- [ ] Markdown-aware parser mode in parser.cjs for automated content regeneration

### Future Consideration

- [ ] Module 3: Agent system deep-dive -- defer until Modules 1-2 prove the teaching model scales
- [ ] Module 4: Template and reference system -- lower learner demand
- [ ] Cross-module concept map visualization spanning all layers

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Conceptual overview lesson | HIGH | LOW | P1 |
| Command.md anatomy lesson | HIGH | LOW | P1 |
| Workflow.md anatomy lesson | HIGH | MEDIUM | P1 |
| Command-to-workflow wiring lesson | HIGH | LOW | P1 |
| Mini-project + spec.json + hints.json | HIGH | MEDIUM | P1 |
| Module manifest + ordering | MEDIUM | LOW | P1 |
| gsd-learn.cjs multi-module support | MEDIUM | MEDIUM | P1 |
| Per-module progress tracking | MEDIUM | LOW | P1 |
| Sandbox directory for mini-project | MEDIUM | LOW | P1 |
| Workflow patterns lesson | MEDIUM | MEDIUM | P2 |
| Full-stack Module 2 mini-project update | MEDIUM | MEDIUM | P2 |
| Lesson generation pipeline for new module | LOW | MEDIUM | P2 |
| Markdown-aware parser mode | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch -- the 5-lesson module with verification, hints, module selection, and renumbering
- P2: Should have, add after Module 1 validation confirms the approach works
- P3: Nice to have, future milestone work

## Mini-Project Design: Build a Custom Slash Command

The mini-project is the most important feature in the module. It validates whether the lessons actually taught the learner to build something real.

### Task

Build a new `/gsd:greet` command that displays a personalized greeting using GSD conventions. The learner creates two files: a command specification and its orchestrating workflow.

### Deliverables

1. **Command specification** (`learn/sandbox/commands/gsd/greet.md`):
   - Valid YAML frontmatter with `name: gsd:greet`, `description`, and `allowed-tools`
   - `<objective>` section describing what the command does
   - `<execution_context>` with `@file:` reference pointing to the workflow file
   - `<process>` section delegating to the workflow

2. **Workflow file** (`learn/sandbox/workflows/greet.md`):
   - `<purpose>` section explaining the workflow's job
   - `<process>` section with at least one step
   - At least one bash code block (can call gsd-tools.cjs echo or a simple shell command)
   - Step for formatting and displaying output

### Verification Checks (spec.json)

The spec.json artifact checks use the same regex pattern system as the existing Command Lifecycle mini-project. Each check targets a structural element the lessons taught:

**Command file checks:**
- `{ "pattern": "^---", "description": "Has YAML frontmatter delimiter" }`
- `{ "pattern": "name:\\s*gsd:", "description": "Name follows gsd: convention" }`
- `{ "pattern": "description:", "description": "Has description field" }`
- `{ "pattern": "<objective>", "description": "Has objective section" }`
- `{ "pattern": "<execution_context>", "description": "Has execution_context section" }`
- `{ "pattern": "@file:", "description": "References workflow via @file:" }`

**Workflow file checks:**
- `{ "pattern": "<purpose>", "description": "Has purpose section" }`
- `{ "pattern": "<process>", "description": "Has process section" }`
- `{ "pattern": "```bash", "description": "Has bash code block" }`

### Why This Design

- **Mirrors the echo command pattern.** The learner studied echo.md (command) and echo.md (workflow) in lessons 2-4. Greet follows the same structure with room for creativity in the greeting message and workflow logic.
- **Sandbox avoids polluting the real GSD install.** Files go in `learn/sandbox/`, not `~/.claude/`. Safe to experiment. Learner can copy to the real location after verification if they want to see it work.
- **Creative freedom within structural constraints.** The learner decides what the greeting says and how the workflow works, but the file structure must follow GSD conventions. Tests understanding, not copy-paste ability.
- **Progressive hints guide without solving.** Hints reference specific lessons and get more specific, but never provide the actual content.

### Hint Progression (5 levels)

1. "Think about the two files you studied in lessons 2-4. Your greet command follows exactly the same pattern."
2. "Lesson 2 showed you the anatomy of a command.md file. Re-read it and note the three sections every command needs: objective, execution_context, and process."
3. "Your workflow.md needs a purpose section explaining what it does, and a process section with steps. Check lesson 3 for the exact structure."
4. "The execution_context in your command.md must use an @file: reference pointing to your workflow.md. This is the wiring that connects them."
5. "Command file: YAML frontmatter (name: gsd:greet, description, allowed-tools) plus objective, execution_context (@file: pointing to workflow), and process sections. Workflow file: purpose, process with at least one step containing a bash code block. The content is up to you."

## Sources

- Existing Command Lifecycle module structure: `learn/content/modules/command-lifecycle/` (6 lessons, module.json, project/spec.json, project/hints.json)
- GSD command file examples: `~/.claude/commands/gsd/*.md` (33 files: echo.md, help.md, quick.md, execute-phase.md, new-project.md, etc.)
- GSD workflow file examples: `~/.claude/get-shit-done/workflows/*.md` (36 files: echo.md, quick.md, help.md, execute-phase.md, etc.)
- GSD architecture documentation: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`
- Learning tool source code: `learn/bin/gsd-learn.cjs` (entry point, line 43: module default), `learn/lib/lessons.cjs` (loadModule), `learn/lib/progress.cjs` (progress format), `learn/lib/navigator.cjs` (navigation loop), `learn/lib/parser.cjs` (CJS-only parser), `learn/bin/generate-lessons.cjs` (hardcoded LESSON_PLAN and command-lifecycle validateAndCopy)
- Prompt templates: `learn/content/prompts/overview.prompt.md`, `source-dive.prompt.md`
- PROJECT.md: v2.0 milestone context, constraints, key decisions
- Confidence: HIGH -- all findings based on direct source code analysis

---
*Feature research for: GSD Commands & Workflows teaching module*
*Researched: 2026-03-12*
