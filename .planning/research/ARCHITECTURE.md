# Architecture Research

**Domain:** Adding Module 1 (GSD Commands & Workflows) to gsd-learn CLI
**Researched:** 2026-03-12
**Confidence:** HIGH

## System Overview

### Current State

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

### Target State

```
learn/
├── bin/gsd-learn.cjs           # MODIFIED: smart default, --list-modules, per-module progress
├── lib/
│   ├── lessons.cjs             # MODIFIED: add listModules()
│   ├── progress.cjs            # MODIFIED: v2 schema, per-module tracking, auto-migrate
│   ├── parser.cjs              # UNCHANGED
│   ├── markdown-parser.cjs     # NEW: parse .md command/workflow files
│   ├── verifier.cjs            # MODIFIED: resolve ~ paths
│   ├── prompt-templates.cjs    # MODIFIED: handle md-specific markers
│   └── [all others unchanged]
├── content/
│   ├── modules/
│   │   ├── gsd-commands/       # NEW: Module 1
│   │   │   ├── module.json     # { id, title, description, order: 1 }
│   │   │   ├── lessons/        # 01-welcome.json ... 06-mini-project.json
│   │   │   └── project/        # spec.json, hints.json
│   │   └── command-lifecycle/  # MODIFIED: order: 2, updated mini-project
│   │       ├── module.json     # Add "order": 2
│   │       ├── lessons/        # 06-mini-project.json updated for full-stack
│   │       └── project/        # spec.json expanded to 4-layer verification
│   └── prompts/
│       ├── overview.prompt.md          # UNCHANGED (reusable for Module 1 welcome)
│       ├── source-dive.prompt.md       # UNCHANGED
│       └── markdown-dive.prompt.md     # NEW: template for markdown file lessons
└── tests/
    └── markdown-parser.test.cjs  # NEW
```

### Component Responsibilities

| Component | Responsibility | Change Type |
|-----------|----------------|-------------|
| `gsd-learn.cjs` | CLI entry, flag parsing, wiring all modules together | MODIFY: smart default module, `--list-modules`, per-module progress |
| `lessons.cjs` | Load module metadata + lesson JSONs from content dir | MODIFY: add `listModules()` function |
| `progress.cjs` | Persist/load learner position | MODIFY: v2 schema with per-module tracking + auto-migration |
| `parser.cjs` | Parse .cjs source files into structured data | UNCHANGED |
| `markdown-parser.cjs` | Parse .md command/workflow files into structured data | NEW |
| `prompt-templates.cjs` | Assemble prompts from templates + context | MODIFY: add markdown-specific markers |
| `verifier.cjs` | Check project artifacts exist and match regex patterns | MODIFY: resolve `~` in artifact paths |
| `navigator.cjs` | Keypress navigation loop | UNCHANGED |
| `renderer.cjs` | Format lesson JSON blocks to ANSI terminal output | UNCHANGED |
| `hints.cjs` | Progressive hint delivery | UNCHANGED |
| `feedback.cjs` | Track project events | UNCHANGED |
| `evaluator.cjs` | Score lessons against rubric | UNCHANGED |
| `terminal.cjs` | ANSI style utilities | UNCHANGED |
| `concept-map.cjs` | Render concept map | UNCHANGED |
| `clipboard.cjs` / `clipboard-formatter.cjs` | Copy lesson to clipboard | UNCHANGED |
| `errors.cjs` | Environment validation | UNCHANGED |

## Integration Analysis

### What Already Works (No Changes Needed)

These components are module-agnostic by design and require zero modification:

1. **`navigator.cjs`** -- Takes a lessons array, render function, and progress callback. Zero module awareness.

2. **`renderer.cjs`** -- Renders any lesson object matching the JSON schema. All content types (`text`, `code`, `project`) already supported.

3. **`hints.cjs`** -- Takes a hints array. Module-agnostic.

4. **`feedback.cjs`** -- Uses projectId as key in a flat object. Multiple projects from different modules already coexist in feedback.json.

5. **`evaluator.cjs`** -- Scores by lesson ID against rubric dimensions. Module-agnostic.

6. **`terminal.cjs`** / **`concept-map.cjs`** / **`errors.cjs`** / **`clipboard*.cjs`** -- Pure utilities. Module-agnostic.

### What Needs Modification

#### 1. `progress.cjs` -- v2 Schema with Per-Module Tracking (CRITICAL)

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

The `modules` field already exists as an empty object -- it was designed for this. The `currentModule` field remains as the "last active module" pointer.

**Migration strategy:** On `loadProgress()`, detect `version === 1` (or missing version). If `currentModule` and `currentLesson` exist at top level, migrate them into `modules[currentModule].currentLesson`. Bump version to 2. Save on next `saveProgress()` call. No data loss, fully transparent.

#### 2. `lessons.cjs` -- Add `listModules()` Function (MODERATE)

**Current state:** Only exports `loadModule()`. No way to discover available modules.

**New function:**
```javascript
function listModules(contentDir) {
  const modulesDir = path.join(contentDir || path.join(__dirname, '..', 'content'), 'modules');
  const dirs = fs.readdirSync(modulesDir).filter(d => {
    return fs.existsSync(path.join(modulesDir, d, 'module.json'));
  });
  return dirs.map(d => {
    const meta = JSON.parse(fs.readFileSync(path.join(modulesDir, d, 'module.json'), 'utf-8'));
    return { id: meta.id, title: meta.title, description: meta.description, order: meta.order || 999 };
  }).sort((a, b) => a.order - b.order);
}
```

Scans `content/modules/*/module.json`, reads each, returns sorted by `order` field.

#### 3. `gsd-learn.cjs` -- Multi-Module Wiring (CRITICAL)

**Changes:**
- **Smart default:** Replace hardcoded `'command-lifecycle'` with first-module-by-order from `listModules()`.
- **`--list-modules` flag:** Show available modules with completion indicators.
- **`--status` enhancement:** Show all modules with progress.
- **Progress read/write:** Use `modules[moduleId].currentLesson` instead of top-level `currentLesson`.

**Specific lines affected:**
- Line 43: `const moduleId = flags.module || 'command-lifecycle'` -- replace with smart default
- Lines 55-61: `--status` handler -- show multi-module progress
- Lines 134-137: Progress loading -- read from `modules[moduleId]`
- Lines 146-148: Progress save callback -- write to `modules[moduleId]`

#### 4. `verifier.cjs` -- Home Directory Path Resolution (SMALL)

**Problem:** Module 2's full-stack mini-project needs to verify files in `~/.claude/`. The verifier currently joins paths with `cwd`:
```javascript
const filePath = path.join(cwd, artifact.path);
```

**Fix:** Resolve `~` prefix before joining:
```javascript
let filePath = artifact.path;
if (filePath.startsWith('~')) {
  filePath = path.join(os.homedir(), filePath.slice(1));
} else {
  filePath = path.join(cwd, artifact.path);
}
```

This is a 4-line change. Enables spec.json to use `~/.claude/commands/gsd/echo.md` as an artifact path.

#### 5. `prompt-templates.cjs` -- Markdown-Specific Markers (MODERATE)

Add new marker replacements for markdown-parsed context:

| New Marker | Source | Purpose |
|------------|--------|---------|
| `{{FILE_PURPOSE}}` | xmlSections.purpose or xmlSections.objective | What the file does |
| `{{FRONTMATTER_FIELDS}}` | Formatted frontmatter key-value pairs | Command metadata |
| `{{PROCESS_STEPS}}` | xmlSections steps, formatted | Workflow structure |
| `{{FILE_REFERENCES}}` | @file: patterns | Dependencies |
| `{{CODE_BLOCKS}}` | Embedded bash/code blocks | Implementation details |

Existing markers (`{{FILE_NAME}}`, `{{SOURCE_CODE}}`, `{{LESSON_NUMBER}}`, `{{LESSON_TITLE}}`, `{{FOCUS}}`) remain unchanged and work for both .cjs and .md lessons.

### What Needs to Be Created

#### 1. `learn/lib/markdown-parser.cjs` (NEW)

The existing `parser.cjs` extracts JavaScript-specific structures. Markdown files need completely different extraction.

**What it extracts:**
- YAML frontmatter (between `---` delimiters): name, description, argument-hint, allowed-tools
- XML-style sections: `<objective>`, `<execution_context>`, `<context>`, `<process>`, `<purpose>`
- Step blocks: `<step name="...">` within `<process>`
- File references: `@path/to/file` patterns
- Embedded code blocks: triple-backtick fenced blocks with language tags

**Return structure:**
```javascript
function parseMarkdownFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf-8');
  const lines = source.split('\n');

  return {
    filePath,
    fileName: path.basename(filePath),
    lineCount: lines.length,
    type: detectType(filePath),           // 'command' | 'workflow'
    frontmatter: extractFrontmatter(source),
    xmlSections: extractXmlSections(source),
    steps: extractSteps(source),
    codeBlocks: extractCodeBlocks(source),
    fileReferences: extractFileReferences(source),
  };
}
```

**Structural parallel with parser.cjs:**

| parser.cjs | markdown-parser.cjs | Teaching parallel |
|------------|---------------------|-------------------|
| `moduleDoc` (JSDoc) | `xmlSections.purpose` | "What does this file do?" |
| `requires` (require calls) | `fileReferences` (@file: refs) | "What does it depend on?" |
| `exports` (module.exports) | `frontmatter` (name, flags) | "What does it expose?" |
| `functions` (function bodies) | `steps` (process steps) | "What are the logical units?" |
| `sections` (separator comments) | `xmlSections` | "How is it organized?" |

**Why separate from parser.cjs:** JavaScript parsing uses brace-counting for function scope, regex for require/export patterns. Markdown parsing uses YAML delimiter detection, XML tag matching, and triple-backtick fence detection. These are fundamentally different algorithms. Mixing them into one module would create a god-module that is hard to test and reason about.

#### 2. `learn/content/prompts/markdown-dive.prompt.md` (NEW)

Analogous to `source-dive.prompt.md` but for markdown command/workflow files:

```markdown
# Markdown File Deep-Dive Lesson Generator

## Lesson Metadata
- **Lesson Number:** {{LESSON_NUMBER}}
- **Title:** {{LESSON_TITLE}}
- **Focus Area:** {{FOCUS}}

## Source File Context

**File:** {{FILE_NAME}}

### File Purpose
{{FILE_PURPOSE}}

### Frontmatter (Command Metadata)
{{FRONTMATTER_FIELDS}}

### Process Steps
{{PROCESS_STEPS}}

### File References
{{FILE_REFERENCES}}

### Embedded Code Blocks
{{CODE_BLOCKS}}

### Full Source
```markdown
{{SOURCE_CODE}}
```

## Instructions
[Adapted guidelines for teaching markdown structure]
```

The existing `overview.prompt.md` is reusable as-is for Module 1's welcome lesson.

#### 3. Module 1 Content: `learn/content/modules/gsd-commands/`

**Module metadata (`module.json`):**
```json
{
  "id": "gsd-commands",
  "title": "GSD Commands & Workflows",
  "description": "Learn how GSD slash commands and workflow markdown files orchestrate AI-powered development workflows.",
  "order": 1
}
```

**Lesson plan (6 lessons):**

| # | ID | Type | Title | Sources | Focus |
|---|-----|------|-------|---------|-------|
| 1 | welcome-commands | overview | How GSD Commands Work | (none) | Two-layer architecture: command.md specs + workflow.md orchestration |
| 2 | slash-commands | md-dive | Anatomy of a Slash Command | commands/gsd/echo.md, commands/gsd/new-project.md | Frontmatter, XML sections, @file references |
| 3 | workflows | md-dive | Anatomy of a Workflow | workflows/echo.md, workflows/execute-phase.md | Purpose, process steps, bash code blocks |
| 4 | command-workflow-link | md-dive | Commands Connect to Workflows | commands/gsd/new-project.md + workflows/new-project.md | execution_context -> workflow data flow |
| 5 | patterns | md-dive | Cross-Cutting Patterns | workflows/execute-phase.md, workflows/plan-phase.md | Init steps, checkpoints, agent spawning |
| 6 | mini-project | project | Build a Slash Command | (none) | Create command.md + workflow.md pair |

**Mini-project spec (`project/spec.json`):**
```json
{
  "id": "gsd-commands-project",
  "moduleId": "gsd-commands",
  "title": "Build a GSD Slash Command",
  "description": "Create command.md and workflow.md files for a new GSD command",
  "artifacts": [
    {
      "description": "Slash command file",
      "path": "~/.claude/commands/gsd/echo.md",
      "checks": [
        { "pattern": "^---", "description": "Has YAML frontmatter" },
        { "pattern": "name:\\s*gsd:", "description": "Has name field with gsd: prefix" },
        { "pattern": "<execution_context>", "description": "Has execution_context section" }
      ]
    },
    {
      "description": "Workflow file",
      "path": "~/.claude/get-shit-done/workflows/echo.md",
      "checks": [
        { "pattern": "<purpose>|<process>", "description": "Has purpose or process section" },
        { "pattern": "<step", "description": "Has at least one step" }
      ]
    }
  ]
}
```

#### 4. Updated Module 2 Content

**Updated `command-lifecycle/module.json`:**
```json
{
  "id": "command-lifecycle",
  "title": "Command Lifecycle",
  "description": "Follow a GSD command from user input to execution, understanding how each piece connects.",
  "order": 2
}
```

**Updated `command-lifecycle/project/spec.json`** -- add 2 new artifacts:
```json
{
  "id": "command-lifecycle-project",
  "moduleId": "command-lifecycle",
  "title": "Build a Full-Stack GSD Command",
  "description": "Add a new command across all 4 layers: command.md, workflow.md, echo.cjs, gsd-tools.cjs switch",
  "artifacts": [
    {
      "description": "Slash command file",
      "path": "~/.claude/commands/gsd/echo.md",
      "checks": [
        { "pattern": "name:\\s*gsd:echo", "description": "Has name: gsd:echo" }
      ]
    },
    {
      "description": "Workflow file",
      "path": "~/.claude/get-shit-done/workflows/echo.md",
      "checks": [
        { "pattern": "<process>", "description": "Has process section" }
      ]
    },
    {
      "description": "Echo handler module",
      "path": "get-shit-done/bin/lib/echo.cjs",
      "checks": [
        { "pattern": "module\\.exports", "description": "File exports a module" },
        { "pattern": "function\\s+cmd", "description": "Follows cmd* naming convention" }
      ]
    },
    {
      "description": "Switch case for echo command",
      "path": "get-shit-done/bin/gsd-tools.cjs",
      "checks": [
        { "pattern": "case\\s+['\"]echo['\"]", "description": "Echo case exists in switch statement" }
      ]
    }
  ]
}
```

## Data Flow

### Lesson Content Generation Flow (Build-Time)

```
Source files (at build time):
  ~/.claude/commands/gsd/*.md       (slash commands)
  ~/.claude/get-shit-done/workflows/*.md   (workflows)
         |
         v
markdown-parser.cjs --> { frontmatter, xmlSections, steps, codeBlocks, fileRefs }
         |
         v
prompt-templates.cjs + markdown-dive.prompt.md --> assembled LLM prompt
         |
         v
LLM generates lesson JSON --> validated and copied to lessons/
         |
         v
learn/content/modules/gsd-commands/lessons/NN-slug.json
```

This matches the existing pattern: `parser.cjs` feeds `source-dive.prompt.md`, LLM generates lesson JSONs. Content generation is development-time, not runtime.

### Runtime Lesson Flow (Multi-Module)

```
CLI args
    |
    v
listModules(contentDir) --> [{ id: 'gsd-commands', order: 1 }, { id: 'command-lifecycle', order: 2 }]
    |
    v
moduleId = flags.module || smartDefault(progress, modules)
    |
    v
loadModule(moduleId, contentDir) --> { id, title, lessons[] }
    |
    v
loadProgress(cwd) --> startIndex = progress.modules[moduleId].currentLesson
    |
    v
runNavigationLoop(lessons, startIndex, renderFn, progressFn)
    |
    v
saveProgress(cwd, { currentModule: moduleId, modules: { [moduleId]: { currentLesson } } })
```

### Mini-Project Verification Flow

```
Module 1 (gsd-commands) verifies:
  +-- ~/.claude/commands/gsd/echo.md      (has frontmatter + execution_context)
  +-- ~/.claude/get-shit-done/workflows/echo.md  (has purpose/process + steps)

Module 2 (command-lifecycle) verifies ALL 4 LAYERS:
  +-- ~/.claude/commands/gsd/echo.md      (has name: gsd:echo)
  +-- ~/.claude/get-shit-done/workflows/echo.md  (has process section)
  +-- get-shit-done/bin/lib/echo.cjs      (exports cmd* function)
  +-- get-shit-done/bin/gsd-tools.cjs     (has case 'echo')
```

Module 2's full-stack check naturally validates Module 1's artifacts still exist.

## Recommended Build Order

Dependencies determine ordering. Each step depends only on completed predecessors.

### Phase 1: Multi-Module Infrastructure

All existing tests must continue passing. This is pure plumbing.

**1a. `progress.cjs` v2 schema** (no dependencies)
- Per-module `currentLesson` in `modules[moduleId]` sub-object
- Auto-migration from v1 (move top-level `currentLesson` into `modules[currentModule]`)
- Tests: v1 migration, fresh v2 creation, per-module read/write

**1b. `lessons.cjs` add `listModules()`** (parallel with 1a)
- Scan `content/modules/*/module.json`, return sorted by `order`
- Add `"order": 2` to existing `command-lifecycle/module.json`
- Tests: ordering, missing order defaults to 999, missing module.json skipped

**1c. `gsd-learn.cjs` multi-module wiring** (depends on 1a + 1b)
- Smart default using `listModules()` + progress
- `--list-modules` flag
- Progress read/write uses `modules[moduleId]`
- Tests: CLI flag tests, integration with updated progress format

**1d. `verifier.cjs` tilde path resolution** (parallel with 1a-1c)
- Resolve `~` prefix to `os.homedir()` in artifact paths
- Tests: tilde resolution, normal paths unchanged

### Phase 2: Markdown Parser + Prompt Templates

**2a. `markdown-parser.cjs`** (no dependencies on Phase 1)
- Parse YAML frontmatter between `---` fences
- Extract XML-style sections (`<purpose>`, `<process>`, etc.)
- Extract `<step name="...">` blocks
- Extract `@path/to/file` references
- Extract fenced code blocks
- Detect file type: command vs workflow
- Tests: parse real command.md, parse real workflow.md, malformed input, edge cases

**2b. `markdown-dive.prompt.md`** (depends on 2a output structure)
- Template with markdown-specific markers
- Guidelines for teaching markdown file structure

**2c. `prompt-templates.cjs` updates** (depends on 2b)
- Add markdown-specific marker replacements
- Existing markers remain unchanged

### Phase 3: Module 1 Content

**3a. Module metadata** (depends on Phase 1 for ordering)
- Create `gsd-commands/module.json` with `"order": 1`

**3b. Generate lesson prompts** (depends on 2a, 2b, 2c)
- Update `generate-lessons.cjs` with Module 1 lesson plan
- Run markdown-parser against target command/workflow files
- Feed into markdown-dive template
- Generate prompt files

**3c. Generate and validate lesson JSONs** (depends on 3b)
- Feed prompts to LLM
- Validate JSON schema
- Copy to `gsd-commands/lessons/`

**3d. Module 1 mini-project** (depends on 1d for tilde paths)
- Create `spec.json` checking command.md + workflow.md
- Create `hints.json` with 5 progressive hints
- Create lesson 06 (project description)

### Phase 4: Module 2 Full-Stack Update

**4a. Update `command-lifecycle/project/spec.json`** (depends on 1d)
- Add command.md and workflow.md artifact checks (with `~` paths)

**4b. Update `command-lifecycle/project/hints.json`** (parallel with 4a)
- Add hints for markdown layer artifacts

**4c. Update lesson `06-mini-project.json`** (parallel with 4a)
- Describe full-stack deliverables (all 4 layers)

## Architectural Patterns

### Pattern 1: Separate Parsers per File Type

**What:** One parser module per source file type (`parser.cjs` for .cjs, `markdown-parser.cjs` for .md).
**When to use:** When file types have fundamentally different structures.
**Trade-offs:** Pro: clean separation, focused tests, no conditional branching. Con: slight code duplication (both read files, both return structured objects). The duplication is trivial and not worth abstracting.

### Pattern 2: Content-Driven Module Discovery

**What:** Modules are discovered by scanning filesystem for `module.json` files. No central registry.
**When to use:** When modules are self-contained directories with their own metadata.
**Trade-offs:** Pro: adding a module is just creating a directory. Con: requires filesystem scan (trivially fast at this scale).

### Pattern 3: Schema Migration in Progress Files

**What:** Progress files carry a `version` field. On load, detect old versions and migrate in-place.
**When to use:** When changing the shape of persisted state that real humans depend on.
**Trade-offs:** Pro: learner never loses progress. Con: migration code must be maintained (acceptable for v1-to-v2).

## Anti-Patterns

### Anti-Pattern 1: Extending parser.cjs for Markdown

**What people do:** Add `if (filePath.endsWith('.md'))` branches to existing parser.cjs.
**Why it is wrong:** `parser.cjs` extracts JS-specific constructs (brace-counted function bodies, require graphs, JSDoc). Markdown needs frontmatter, XML tags, code fences. Mixing them creates a god-module.
**Do this instead:** Create `markdown-parser.cjs` as a parallel parser with its own test file.

### Anti-Pattern 2: Module Registry File

**What people do:** Create a central `modules.json` listing all modules in order.
**Why it is wrong:** Two files to maintain per module. The registry drifts from reality.
**Do this instead:** Put `order` in each module's own `module.json`. Discovery function scans and sorts.

### Anti-Pattern 3: Breaking Progress Backward Compatibility

**What people do:** Change the progress schema without versioning/migration.
**Why it is wrong:** The learner loses their place. Making someone redo lessons they completed breaks trust.
**Do this instead:** Version the schema. Auto-migrate v1 to v2 transparently on load.

### Anti-Pattern 4: Sharing Mini-Projects Across Modules

**What people do:** Have Module 1 and Module 2 share a single project spec.
**Why it is wrong:** Module 1 focuses on markdown layers. Module 2 focuses on Node.js layers. A shared spec means neither module verifies independently.
**Do this instead:** Module 1 spec checks command.md + workflow.md. Module 2 spec checks all 4 layers. Module 2 naturally re-validates Module 1 artifacts.

### Anti-Pattern 5: Importing GSD's frontmatter.cjs into learn/

**What people do:** Import `get-shit-done/bin/lib/frontmatter.cjs` to parse command.md frontmatter.
**Why it is wrong:** The learn tool is architecturally separate from gsd-tools. Importing from `get-shit-done/bin/lib/` creates a cross-boundary dependency.
**Do this instead:** Implement frontmatter extraction in `markdown-parser.cjs` with simple regex, matching how `parser.cjs` uses regex for everything.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Change |
|----------|---------------|--------|
| `gsd-learn.cjs` -> `lessons.cjs` | Direct require, function call | Add `listModules()` import |
| `gsd-learn.cjs` -> `progress.cjs` | Direct require, function call | Read/write `modules[moduleId]` sub-object |
| `lessons.cjs` -> `content/modules/*/module.json` | Filesystem read | Add `order` field |
| `verifier.cjs` -> artifact files | Filesystem read | Resolve `~` prefix in paths |
| `generate-lessons.cjs` -> `markdown-parser.cjs` | Direct require (build-time only) | New import |
| `generate-lessons.cjs` -> `prompt-templates.cjs` | assemblePrompt() call | New md-specific markers |

### External Dependencies (GSD Source Files)

| Source Location | Used By | When | Risk |
|----------------|---------|------|------|
| `~/.claude/commands/gsd/*.md` | Lesson content generation | Build-time | Stable. Files exist after GSD install. |
| `~/.claude/get-shit-done/workflows/*.md` | Lesson content generation | Build-time | Stable. Files exist after GSD install. |
| `~/.claude/commands/gsd/echo.md` | Mini-project verification | Runtime | Created by learner. Needs `~` path resolution. |
| `~/.claude/get-shit-done/workflows/echo.md` | Mini-project verification | Runtime | Created by learner. Needs `~` path resolution. |

**Key note:** Command specs live under `~/.claude/commands/gsd/`, NOT under `~/.claude/get-shit-done/`. Path resolution must account for this different base directory.

## Sources

- Direct codebase analysis of all files in `learn/` directory (HIGH confidence)
- Existing `command-lifecycle` module structure as proven pattern (HIGH confidence)
- GSD slash command files at `~/.claude/commands/gsd/` -- read and analyzed (HIGH confidence)
- GSD workflow files at `~/.claude/get-shit-done/workflows/` -- read and analyzed (HIGH confidence)
- PROJECT.md v2.0 milestone requirements (HIGH confidence)

---
*Architecture research for: gsd-learn Module 1 (GSD Commands & Workflows) integration*
*Researched: 2026-03-12*
