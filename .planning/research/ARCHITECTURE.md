# Architecture Research

**Domain:** Adding Module 1 (GSD Commands & Workflows) to gsd-learn CLI
**Researched:** 2026-03-12
**Confidence:** HIGH

## Standard Architecture

### System Overview (Current State)

```
learn/
├── bin/gsd-learn.cjs           # CLI entry point, flag parsing, main loop
├── lib/                        # Shared modules (all module-agnostic except parser)
│   ├── lessons.cjs             # loadModule(moduleId, contentDir)
│   ├── navigator.cjs           # runNavigationLoop (keypress handling)
│   ├── renderer.cjs            # renderLesson (ANSI output formatting)
│   ├── progress.cjs            # loadProgress / saveProgress (JSON file)
│   ├── parser.cjs              # parseSourceFile (.cjs JavaScript parser ONLY)
│   ├── verifier.cjs            # runVerification (spec.json artifact checks)
│   ├── hints.cjs               # getNextHint (progressive hints)
│   ├── feedback.cjs            # recordEvent (project telemetry)
│   ├── evaluator.cjs           # evaluateLesson (rubric scoring)
│   ├── terminal.cjs            # style, clearScreen, highlightJS, oscLink
│   ├── concept-map.cjs         # renderConceptMap
│   ├── errors.cjs              # validateEnvironment, formatError
│   ├── prompt-templates.cjs    # Prompt generation for LLM lesson creation
│   ├── clipboard.cjs           # copyToClipboard
│   └── clipboard-formatter.cjs # formatLessonForClipboard
├── content/
│   ├── modules/
│   │   └── command-lifecycle/  # Currently the ONLY module
│   │       ├── module.json     # { id, title, description }
│   │       ├── lessons/        # 01-welcome.json ... 06-mini-project.json
│   │       └── project/        # spec.json, hints.json
│   ├── prompts/                # LLM prompt templates for lesson generation
│   │   ├── overview.prompt.md
│   │   ├── source-dive.prompt.md
│   │   └── generated/          # Generated prompt files (01-05)
│   └── rubric/                 # Lesson quality scoring
│       ├── rubric.json
│       └── scores/
└── tests/                      # node:test based, one per lib module
```

### Component Responsibilities

| Component | Responsibility | Module-Aware? |
|-----------|----------------|---------------|
| `gsd-learn.cjs` | CLI entry, flag parsing, wiring all modules together | YES -- hardcodes `moduleId = flags.module \|\| 'command-lifecycle'` |
| `lessons.cjs` | Load module metadata + lesson JSONs from content dir | YES -- `loadModule(moduleId, contentDir)` already supports any module ID |
| `progress.cjs` | Persist/load learner position | PARTIAL -- has `currentModule` and `modules: {}` fields but stores `currentLesson` globally, not per-module |
| `navigator.cjs` | Keypress loop, lesson traversal | NO -- module-agnostic, works on any lesson array |
| `renderer.cjs` | Format lesson to ANSI string | NO -- module-agnostic, renders any lesson matching the JSON schema |
| `verifier.cjs` | Check project artifacts exist and match regex patterns | YES -- takes absolute specPath, already module-agnostic |
| `hints.cjs` | Progressive hint delivery | NO -- takes a hint array, module-agnostic |
| `feedback.cjs` | Track project events (starts, attempts, completions) | YES -- keyed by projectId, already supports multiple projects |
| `parser.cjs` | Parse .cjs source files into structured data | NO -- JavaScript-only parser, cannot parse markdown |
| `evaluator.cjs` | Score lessons against rubric | NO -- module-agnostic |

## Integration Analysis

### What Already Works (No Changes Needed)

These components are module-agnostic by design and require zero modification:

1. **`lessons.cjs`** -- `loadModule(moduleId, contentDir)` loads any module by ID from `content/modules/{moduleId}/`. Create the new directory with `module.json` + lessons and it works immediately.

2. **`navigator.cjs`** -- Takes a lessons array, render function, and progress callback. Zero module awareness. The copy, next, prev, quit actions are universal.

3. **`renderer.cjs`** -- Renders any lesson object matching the JSON schema. All three content types (`text`, `code`, `project`) already supported. The new module's lessons use the same JSON schema.

4. **`verifier.cjs`** -- Takes an absolute specPath. The `runVerification()` function reads spec.json and checks artifacts. Already supports any module's project spec.

5. **`hints.cjs`** -- Takes a hints array. Module-agnostic.

6. **`feedback.cjs`** -- Uses projectId as key in a flat object. Multiple projects from different modules already coexist in feedback.json without conflict.

7. **`evaluator.cjs`** -- Scores by lesson ID against rubric dimensions. Module-agnostic.

8. **`terminal.cjs`** -- Pure formatting utilities. Module-agnostic.

9. **`concept-map.cjs`** -- Renders any concept map string. Module-agnostic.

10. **`clipboard.cjs` / `clipboard-formatter.cjs`** -- Formats and copies any lesson. Module-agnostic.

### What Needs Modification

#### 1. `gsd-learn.cjs` -- Module Selection and Progress Wiring (CRITICAL)

**Current problem:** The CLI hardcodes `command-lifecycle` as default (line 43: `const moduleId = flags.module || 'command-lifecycle'`) and has no module discovery or listing UI.

**Required changes:**

- **Module discovery:** Import new `listModules()` from `lessons.cjs`. Use it for `--list-modules` output and smart default selection.
- **Smart default:** Instead of hardcoding `command-lifecycle`, find the first incomplete module by checking progress. Fall back to the first module by order if no progress exists.
- **`--list-modules` flag:** Show available modules with completion indicators.
- **`--status` enhancement:** Show all modules with progress, not just the current one.
- **Progress save:** Write lesson index into `modules[moduleId].currentLesson` instead of top-level `currentLesson`.
- **`--verify` and `--hint` paths:** Already use `moduleId` to resolve spec/hints paths. These work as-is when `moduleId` is correctly resolved.

**Specific lines affected:**
- Line 43: Default module selection logic
- Lines 55-61: `--status` handler (show multi-module progress)
- Lines 134-137: Progress loading (read from `modules[moduleId]`)
- Lines 146-148: Progress save callback (write to `modules[moduleId]`)

#### 2. `progress.cjs` -- Per-Module Progress Tracking (CRITICAL)

**Current schema (v1):**
```json
{
  "version": 1,
  "currentModule": "command-lifecycle",
  "currentLesson": 3,
  "modules": {}
}
```

**Required schema (v2):**
```json
{
  "version": 2,
  "currentModule": "gsd-commands",
  "modules": {
    "gsd-commands": { "currentLesson": 2, "completed": false },
    "command-lifecycle": { "currentLesson": 3, "completed": false }
  }
}
```

The `modules` field already exists as an empty object in the v1 schema -- this was clearly designed for future per-module tracking. The `currentModule` field remains as the "last active module" pointer.

**Migration strategy:** On `loadProgress()`, detect `version === 1` (or missing version). If `currentModule` and `currentLesson` exist at top level, migrate them into `modules[currentModule].currentLesson`. Bump version to 2. Save on next `saveProgress()` call. No data loss, fully transparent to the learner.

#### 3. `lessons.cjs` -- Add `listModules()` Function (MODERATE)

**Current state:** Only exports `loadModule()`. No way to discover available modules.

**New function needed:**
```javascript
function listModules(contentDir) {
  const modulesDir = path.join(contentDir, 'modules');
  const dirs = fs.readdirSync(modulesDir).filter(d => {
    const jsonPath = path.join(modulesDir, d, 'module.json');
    return fs.existsSync(jsonPath);
  });
  return dirs.map(d => {
    const meta = JSON.parse(fs.readFileSync(
      path.join(modulesDir, d, 'module.json'), 'utf-8'
    ));
    return { id: meta.id, title: meta.title, description: meta.description, order: meta.order || 999 };
  }).sort((a, b) => a.order - b.order);
}
```

This scans `content/modules/*/module.json`, reads each, and returns them sorted by the `order` field.

#### 4. `module.json` Schema -- Add `order` Field

**Current `command-lifecycle/module.json`:**
```json
{
  "id": "command-lifecycle",
  "title": "Command Lifecycle",
  "description": "Follow a GSD command from user input to execution..."
}
```

**Updated:**
```json
{
  "id": "command-lifecycle",
  "title": "Command Lifecycle",
  "description": "Follow a GSD command from user input to execution...",
  "order": 2
}
```

The `order` field determines module sequence. `gsd-commands` gets `"order": 1`, `command-lifecycle` gets `"order": 2`. Missing `order` defaults to 999 (sorts last).

### What Needs to Be Created

#### New Content: `learn/content/modules/gsd-commands/`

```
learn/content/modules/gsd-commands/
├── module.json
├── lessons/
│   ├── 01-welcome.json          # GSD's two-layer architecture overview
│   ├── 02-slash-commands.json    # Command.md anatomy: frontmatter, sections
│   ├── 03-workflows.json        # Workflow.md anatomy: purpose, steps, patterns
│   ├── 04-command-workflow.json  # Trace: execute-phase.md command -> workflow
│   ├── 05-patterns.json         # Cross-cutting: init steps, checkpoints, agents
│   └── 06-mini-project.json     # Build a command.md + workflow.md pair
└── project/
    ├── spec.json                 # Verify command.md + workflow.md exist with correct structure
    └── hints.json                # 5 progressive hints (vague to specific)
```

**Module metadata:**
```json
{
  "id": "gsd-commands",
  "title": "GSD Commands & Workflows",
  "description": "Learn how GSD slash commands and workflow markdown files orchestrate AI-powered development workflows.",
  "order": 1
}
```

#### New Parser: `learn/lib/markdown-parser.cjs`

The existing `parser.cjs` only handles `.cjs` JavaScript files (extracts requires, exports, functions, constants, JSDoc). The new module teaches markdown files. A separate parser is needed.

**What it extracts from command/workflow `.md` files:**
- YAML frontmatter (name, description, argument-hint, allowed-tools)
- XML-style sections (`<objective>`, `<execution_context>`, `<context>`, `<process>`)
- File references (`@path/to/file` patterns in execution_context)
- Step names and contents within `<process>` blocks (`<step name="...">`)
- Bash code blocks within steps

**Why a separate module (not extending parser.cjs):** JavaScript and markdown have completely different structures. `parser.cjs` extracts JS-specific constructs (require graphs, function bodies, brace-counting for scope). Markdown parsing extracts frontmatter and XML-like sections. Mixing them violates single responsibility and makes both harder to test and maintain.

#### New Prompt Template: `learn/content/prompts/markdown-dive.prompt.md`

Analogous to `source-dive.prompt.md` but for markdown command/workflow files. Template variables include parsed frontmatter fields, section contents, file references, and step names instead of functions/exports/requires.

The existing `overview.prompt.md` template can be reused as-is for the welcome lesson (lesson 01) since it is not file-type-specific.

#### Updated Mini-Project: Command Lifecycle (Module 2)

The existing mini-project spec only requires 2 artifacts:
1. `get-shit-done/bin/lib/echo.cjs` (handler module)
2. Switch case in `gsd-tools.cjs`

Per PROJECT.md, this should expand to all 4 layers:
1. `~/.claude/commands/gsd/echo.md` (slash command)
2. `~/.claude/get-shit-done/workflows/echo.md` (workflow)
3. `get-shit-done/bin/lib/echo.cjs` (handler module)
4. Switch case in `gsd-tools.cjs`

**Note:** Artifacts 1-2 live in the user's home directory (`~/.claude/`), not the repo. The verifier resolves paths relative to `cwd` (line 44 of verifier.cjs: `path.join(cwd, artifact.path)`). Paths starting with `~` or absolute paths will need either:
- A small verifier enhancement to handle home-relative paths, OR
- The spec uses absolute paths (less portable), OR
- The spec only verifies repo-local artifacts and the lesson text tells the learner to also create the command/workflow files

**Recommendation:** Extend the verifier to resolve `~` in artifact paths. This is a 3-line change in `runVerification()`.

## Data Flow

### Current Flow (Single Module)

```
CLI args
    ↓
moduleId = flags.module || 'command-lifecycle'   (hardcoded default)
    ↓
loadModule(moduleId, contentDir)
    ↓
loadProgress(cwd) → startIndex = progress.currentLesson   (global, not per-module)
    ↓
runNavigationLoop(lessons, startIndex, renderFn, progressFn)
    ↓
saveProgress(cwd, { currentModule, currentLesson })   (single global position)
```

### Required Flow (Multi-Module)

```
CLI args
    ↓
listModules(contentDir) → ordered module list
    ↓
moduleId = flags.module || smartDefault(progress, modules)
    ↓
loadModule(moduleId, contentDir)
    ↓
loadProgress(cwd) → startIndex = progress.modules[moduleId].currentLesson
    ↓
runNavigationLoop(lessons, startIndex, renderFn, progressFn)
    ↓
saveProgress(cwd, { currentModule: moduleId, modules: { [moduleId]: { currentLesson } } })
```

### Lesson Content Generation Flow (Build-Time, Not Runtime)

```
Source files:
  ~/.claude/commands/gsd/*.md       (slash commands)
  ~/.claude/get-shit-done/workflows/*.md   (workflows)
         ↓
markdown-parser.cjs → { frontmatter, sections, fileRefs, steps }
         ↓
markdown-dive.prompt.md   (template + parsed data = LLM prompt)
         ↓
LLM generates lesson JSON
         ↓
learn/content/modules/gsd-commands/lessons/NN-slug.json
```

This is the same pattern used for the existing module: `parser.cjs` feeds `source-dive.prompt.md`, LLM generates lesson JSONs, JSONs are committed to the content directory. Content generation is a development-time workflow, not a runtime operation.

## Recommended Build Order

### Phase 1: Multi-Module Infrastructure (Code Changes)

Build the plumbing before creating content. All existing tests must continue passing.

**1a. `progress.cjs` -- v2 schema with per-module tracking**
- Add migration logic: v1 -> v2 (move top-level `currentLesson` into `modules[currentModule]`)
- Backward-compatible: v1 files auto-migrate on load
- Keep `loadProgress()` / `saveProgress()` function signatures unchanged
- Tests: migration from v1, fresh v2 creation, module lookup, completed flag

**1b. `lessons.cjs` -- add `listModules()` function** (parallel with 1a)
- Scan `content/modules/*/module.json`, return array sorted by `order` field
- Handle missing `order` (default to 999)
- Add `order` field to existing `command-lifecycle/module.json` (`"order": 2`)
- Tests: ordering, missing order defaults, empty modules dir, module without module.json skipped

**1c. `gsd-learn.cjs` -- multi-module wiring** (depends on 1a + 1b)
- Smart default module selection using `listModules()` + progress state
- `--list-modules` flag with completion indicators
- `--status` shows all modules
- Progress read/write uses `modules[moduleId]` sub-object
- Tests: updated integration expectations for navigator.test, CLI flag tests

### Phase 2: Markdown Parser + Prompt Template (New Code)

**2a. `markdown-parser.cjs`** -- New module
- Parse YAML frontmatter (between `---` fences)
- Extract XML-style sections and their content
- Extract `@path/to/file` references
- Extract `<step name="...">` blocks
- Tests: parse real command.md files, parse real workflow.md files, malformed input

**2b. `markdown-dive.prompt.md`** -- New prompt template
- Template variables: frontmatter fields, section contents, file references, step names
- Guidelines adapted for markdown structure (vs JavaScript structure in source-dive.prompt.md)

### Phase 3: New Module Content (Content Creation)

**3a. Module metadata and structure**
- Create `gsd-commands/module.json` with `"order": 1`
- Create lessons/ and project/ directories

**3b. Generate lesson prompts using markdown parser**
- Run `markdown-parser.cjs` against target command/workflow files
- Feed output into `markdown-dive.prompt.md` to create per-lesson prompts
- Save generated prompts to `content/prompts/generated/`

**3c. Generate lesson JSONs via LLM**
- Lesson 01: GSD two-layer architecture overview (uses `overview.prompt.md`)
- Lesson 02: Slash command anatomy (frontmatter, objective, execution_context, process)
- Lesson 03: Workflow anatomy (purpose, process steps, bash code blocks)
- Lesson 04: Trace execute-phase from command.md through workflow.md
- Lesson 05: Cross-cutting patterns (init steps, checkpoints, agent spawning, state updates)
- Lesson 06: Mini-project description (build command.md + workflow.md pair)

**3d. Mini-project spec and hints**
- `project/spec.json`: Verify command.md has frontmatter with `name` field, has `<execution_context>` with workflow reference; verify workflow.md has `<purpose>` and `<process>` sections
- `project/hints.json`: 5 progressive hints from vague to specific

### Phase 4: Command Lifecycle Mini-Project Update

**4a. Update `command-lifecycle/project/spec.json`** to require all 4 layers:
- `~/.claude/commands/gsd/echo.md` (slash command)
- `~/.claude/get-shit-done/workflows/echo.md` (workflow)
- `get-shit-done/bin/lib/echo.cjs` (handler module -- already verified)
- `gsd-tools.cjs` switch case (already verified)

**4b. Extend `verifier.cjs`** to resolve home-directory paths (`~` prefix -> `os.homedir()`)

**4c. Update `command-lifecycle/project/hints.json`** with hints covering all 4 layers

**4d. Update lesson `06-mini-project.json`** to describe the full-stack project scope

## Architectural Patterns

### Pattern 1: Content-Driven Module Discovery

**What:** Modules are discovered by scanning the filesystem for `module.json` files. No central registry.
**When to use:** When modules are self-contained directories with their own metadata.
**Trade-offs:** Pro: Adding a module is just creating a directory. No other file to update. Con: Requires filesystem scan on every `--list-modules` call (trivially fast for this scale).

### Pattern 2: Schema Migration in Progress Files

**What:** Progress files carry a `version` field. On load, detect old versions and migrate in-place.
**When to use:** When changing the shape of persisted state in a tool real humans depend on.
**Trade-offs:** Pro: Learner never loses progress. Transparent upgrade. Con: Migration code must be maintained indefinitely (acceptable for a 1-to-2 migration).

### Pattern 3: Separate Parsers per File Type

**What:** One parser module per source file type (`.cjs` files vs `.md` files).
**When to use:** When file types have fundamentally different structure.
**Trade-offs:** Pro: Clean separation, focused tests, no conditional branching. Con: Slight code duplication (both read files, both return structured objects). The duplication is trivial and not worth abstracting.

## Anti-Patterns

### Anti-Pattern 1: Module Registry File

**What people do:** Create a central `modules.json` listing all modules in order.
**Why it is wrong:** Two files to maintain per module addition. The registry drifts from reality when someone creates a module directory but forgets the registry.
**Do this instead:** Put `order` in each module's own `module.json`. Discovery function scans and sorts.

### Anti-Pattern 2: Breaking Progress Backward Compatibility

**What people do:** Change the progress schema shape without versioning/migration.
**Why it is wrong:** The learner loses their place. In a teaching tool, making someone redo lessons they already completed is a trust-breaking experience.
**Do this instead:** Version the schema. Auto-migrate v1 to v2 transparently on load.

### Anti-Pattern 3: Extending parser.cjs for Markdown

**What people do:** Add markdown parsing conditionally inside the existing JavaScript parser.
**Why it is wrong:** `parser.cjs` extracts JS constructs (requires, exports, functions, brace-counted bodies, JSDoc). Markdown has frontmatter, XML-like sections, file references. Mixing them creates a god-module that is hard to test and reason about.
**Do this instead:** Create `markdown-parser.cjs` as a separate module with its own test file.

### Anti-Pattern 4: Hardcoding Module Order in the CLI

**What people do:** Put module sequencing logic in `gsd-learn.cjs` (`if moduleId === 'gsd-commands' ...`).
**Why it is wrong:** Every new module requires CLI code changes. The CLI should be module-agnostic.
**Do this instead:** Module ordering lives in content metadata (`order` field). CLI discovers and sorts generically.

### Anti-Pattern 5: Copy-Pasting Full Markdown Files into Lesson Content

**What people do:** Embed entire command.md or workflow.md contents as lesson `text` blocks.
**Why it is wrong:** Content drifts from actual source files. Lessons become walls of text. The learner does not learn to read the files themselves.
**Do this instead:** Show focused snippets of actual markdown files in `code` blocks (same pattern as JavaScript lessons). Use the markdown parser to identify which sections to highlight. Reference the source file path so the learner can open it.

## Integration Points

### Internal Boundaries (Module-to-Module)

| Boundary | Communication | Changes Needed |
|----------|---------------|----------------|
| `gsd-learn.cjs` -> `lessons.cjs` | Direct require, function call | Add `listModules()` import and call |
| `gsd-learn.cjs` -> `progress.cjs` | Direct require, function call | Read/write `modules[moduleId]` sub-object (no API signature change) |
| `lessons.cjs` -> `content/modules/*/module.json` | Filesystem read | Add `order` field to existing module.json |
| `verifier.cjs` -> `content/modules/*/project/spec.json` | Filesystem read | New spec.json for gsd-commands; handle `~` paths for command-lifecycle update |
| NEW: `markdown-parser.cjs` -> source markdown files | Filesystem read | Build-time only, not runtime |
| NEW: `markdown-dive.prompt.md` -> prompt generation | Template interpolation | Build-time only |

### External Dependencies (GSD Source Files Being Taught)

| Source Location | Used By | When | Risk |
|----------------|---------|------|------|
| `~/.claude/commands/gsd/*.md` | Lesson content generation (build-time) | Phase 3 | Stable format. Files exist after GSD install. |
| `~/.claude/get-shit-done/workflows/*.md` | Lesson content generation (build-time) | Phase 3 | Stable format. Files exist after GSD install. |
| `~/.claude/commands/gsd/echo.md` | Mini-project verification (runtime) | Phase 4 | Created by the learner. Verifier needs `~` path resolution. |
| `~/.claude/get-shit-done/workflows/echo.md` | Mini-project verification (runtime) | Phase 4 | Created by the learner. Verifier needs `~` path resolution. |

**Key risk:** Source files for the new module live in `~/.claude/`, not in the repo. Lesson content generation (a build-time step run by the developer) requires these files to exist. The runtime learner experience only reads pre-generated lesson JSONs from `content/modules/` and does not parse source files directly.

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Module ID: `gsd-commands` | Short, matches `/gsd:*` prefix, easy to type with `--module gsd-commands` |
| 6 lessons per module | Proven by Module 2 (command-lifecycle). 1 overview + 4 deep-dives + 1 mini-project. |
| Module 1 mini-project: build command.md + workflow.md | Natural complement to Module 2's Node.js mini-project. Together they cover all 4 layers. |
| `order` field in module.json (not registry file) | Self-contained modules. No central file to maintain. |
| Separate `markdown-parser.cjs` | JS and markdown have different structures. Separate parsers, separate tests, clean boundaries. |
| Progress v2 with auto-migration | Backward compatible. No learner data loss. Transparent upgrade. |
| `listModules()` in lessons.cjs (not standalone) | lessons.cjs already reads module.json. Keeps module loading logic in one place. |
| Verifier `~` path resolution | 3-line addition enables home-directory artifact checking for the full-stack mini-project. |

## Sources

- Direct codebase analysis of all files in `learn/` directory (HIGH confidence)
- Existing `command-lifecycle` module structure as proven pattern (HIGH confidence)
- GSD slash command files at `~/.claude/commands/gsd/` -- read and analyzed (HIGH confidence)
- GSD workflow files at `~/.claude/get-shit-done/workflows/` -- read and analyzed (HIGH confidence)
- PROJECT.md v2.0 milestone requirements (HIGH confidence)

---
*Architecture research for: gsd-learn Module 1 (GSD Commands & Workflows) integration*
*Researched: 2026-03-12*
