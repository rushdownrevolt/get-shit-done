# Stack Research: Module 1 — GSD Commands & Workflows

**Domain:** Teaching module for GSD slash commands (.md) and workflows (.md)
**Researched:** 2026-03-12
**Confidence:** HIGH

## Executive Summary

No new libraries or dependencies are needed. The existing zero-dependency stack is sufficient. The work is entirely about extending the current codebase with a **markdown parser** (new) alongside the existing **CJS parser**, new prompt templates for markdown-centric lessons, and new content artifacts. This research documents exactly what changes, what stays the same, and what to avoid adding.

## What Stays the Same (DO NOT CHANGE)

The v1.0 stack research (previously in this file) documented the core foundation. All of it remains valid:

| Component | Status | Notes |
|-----------|--------|-------|
| Node.js >= 18.0.0 | KEEP | No new Node APIs needed |
| CommonJS (.cjs) | KEEP | All new modules use .cjs |
| Zero runtime dependencies | KEEP | Hard constraint from PROJECT.md |
| `readline` + raw mode | KEEP | Navigation unchanged |
| ANSI escape codes via `terminal.cjs` | KEEP | Rendering unchanged |
| JSON file progress in `.planning/learn/` | KEEP | Progress schema extends naturally |
| `node:test` + `node:assert` | KEEP | Testing approach unchanged |
| `c8` for coverage | KEEP | Dev dependency unchanged |
| Regex-based source parsing | KEEP | Extended, not replaced |

**Confidence: HIGH** -- These are proven in production from v1.0.

## What's New for Module 1

### 1. Markdown File Parser (New Module)

**Need:** The existing `parser.cjs` only handles `.cjs` files (extracting functions, requires, exports, constants). Module 1 teaches markdown files: slash commands (`commands/gsd/*.md`) and workflows (`get-shit-done/workflows/*.md`). These have fundamentally different structure.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Regex + string parsing | N/A (built-in) | Parse markdown structure from command and workflow files | Same zero-dependency approach as CJS parser. Markdown files follow GSD conventions consistently (YAML frontmatter, XML-like section tags, bash code blocks). |
| GSD's own `frontmatter.cjs` | Existing | Parse YAML frontmatter from command .md files | Already built and tested in `get-shit-done/bin/lib/frontmatter.cjs`. Can be required directly -- it's a CommonJS module in the same repo. |

**What the markdown parser needs to extract:**

From **command files** (`commands/gsd/*.md`):
- YAML frontmatter: `name`, `description`, `argument-hint`, `allowed-tools`
- Section blocks: `<context>`, `<objective>`, `<execution_context>`, `<process>`
- `@` file references (e.g., `@~/.claude/get-shit-done/workflows/new-project.md`)
- Flag definitions from context blocks

From **workflow files** (`get-shit-done/workflows/*.md`):
- Section blocks: `<purpose>`, `<required_reading>`, `<process>`, `<auto_mode>`, etc.
- Bash code blocks with `gsd-tools.cjs` calls
- Agent spawn patterns (`/claude ...` or Task tool calls)
- `@file:` references
- Step numbering and structure (## 1. Setup, ## 2. Questioning, etc.)

**Implementation approach:** A new `learn/lib/md-parser.cjs` module, parallel to the existing `parser.cjs`. Not a replacement -- CJS parser still needed for Module 2.

```javascript
// learn/lib/md-parser.cjs -- structure sketch
module.exports = {
  parseCommandFile,   // Parse commands/gsd/*.md
  parseWorkflowFile,  // Parse get-shit-done/workflows/*.md
};
```

**Why NOT reuse GSD's `frontmatter.cjs` directly for everything:**
GSD's frontmatter parser handles YAML header extraction. But lesson content needs more: section tags, code blocks, cross-references, step structure. The frontmatter parser is useful for the YAML portion only. The rest requires markdown-specific extraction that doesn't exist in GSD today.

**Why regex is still the right choice for markdown:**
1. GSD's markdown files follow strict conventions: XML-like tags (`<purpose>`, `<process>`), numbered step headers, fenced code blocks
2. No nested markdown-in-markdown complexity
3. We need structure extraction, not rendering
4. A full markdown AST parser (remark, unified, markdown-it) would add dependencies and parse structure we don't need

**Confidence: HIGH** -- Examined actual command and workflow files. Tags and structure are consistent and regex-parseable.

### 2. New Prompt Templates (New Files)

**Need:** The existing prompt templates (`overview.prompt.md`, `source-dive.prompt.md`) are designed for CJS source code lessons. Module 1 needs templates tuned for markdown file content.

| Template | Purpose | Key Placeholders |
|----------|---------|------------------|
| `command-overview.prompt.md` | Lesson about what slash commands are and how they work | `{{COMMAND_LIST}}`, `{{EXAMPLE_COMMAND}}`, `{{FRONTMATTER_EXAMPLE}}` |
| `command-dive.prompt.md` | Deep-dive into a specific command .md file | `{{COMMAND_NAME}}`, `{{FRONTMATTER}}`, `{{SECTIONS}}`, `{{FILE_REFERENCES}}`, `{{SOURCE_MARKDOWN}}` |
| `workflow-dive.prompt.md` | Deep-dive into a workflow .md file | `{{WORKFLOW_NAME}}`, `{{PURPOSE}}`, `{{STEPS}}`, `{{TOOL_CALLS}}`, `{{AGENT_SPAWNS}}`, `{{SOURCE_MARKDOWN}}` |
| `connection.prompt.md` | Lesson connecting command -> workflow -> tool chain | `{{COMMAND_FILE}}`, `{{WORKFLOW_FILE}}`, `{{TOOL_CALLS}}`, `{{DATA_FLOW}}` |

**Implementation:** New files in `learn/content/prompts/`. The existing `prompt-templates.cjs` `assemblePrompt()` function already handles `{{PLACEHOLDER}}` replacement generically -- it just needs the new template files, not code changes.

Wait -- re-examining `prompt-templates.cjs`, it actually hardcodes specific placeholder names in the replace chain. It does NOT do generic placeholder replacement. Each new placeholder needs a corresponding `.replace()` call.

**Recommended change:** Refactor `assemblePrompt()` to accept a context object and do generic replacement:

```javascript
// Replace all {{KEY}} with context[KEY]
for (const [key, value] of Object.entries(context)) {
  const placeholder = '{{' + key.toUpperCase() + '}}';
  template = template.replaceAll(placeholder, String(value || ''));
}
```

This is a small, backward-compatible change (existing keys still work) that avoids adding a new `.replace()` line for every future placeholder.

**Confidence: HIGH** -- Template system is simple; the change is mechanical.

### 3. Updated Lesson Plan and Generation Script

**Need:** `generate-lessons.cjs` currently has a hardcoded `LESSON_PLAN` array for the command-lifecycle module. Module 1 needs its own lesson plan.

| Change | What | Why |
|--------|------|-----|
| New lesson plan constant | `LESSON_PLAN_COMMANDS_WORKFLOWS` array in generate-lessons.cjs | Defines the lesson sequence for Module 1 |
| Module ID routing | `--module=gsd-commands` flag support | Generate prompts for the correct module |
| Source paths for markdown | `sources: ['../../commands/gsd/new-project.md']` entries using relative-from-GSD-root paths | Points parser at .md files instead of .cjs files |
| New lesson type | `type: 'command-dive'` and `type: 'workflow-dive'` alongside existing `'overview'` and `'source-dive'` | Routes to correct parser and template |

**Lesson plan structure (recommended):**

```
Lesson 1: Overview -- What are slash commands and workflows?
Lesson 2: Command Anatomy -- Deep-dive into a command .md file (new-project.md)
Lesson 3: Workflow Anatomy -- Deep-dive into a workflow .md file (new-project.md)
Lesson 4: The Connection -- How command -> workflow -> tools chain together
Lesson 5: Mini-project -- Build a custom slash command + workflow
```

**Confidence: HIGH** -- Follows the exact pattern established in v1.0.

### 4. New Content Directory Structure

```
learn/content/modules/gsd-commands/
  module.json                    # Module metadata
  lessons/                       # Generated lesson JSON files
    01-overview.json
    02-command-anatomy.json
    03-workflow-anatomy.json
    04-the-connection.json
    05-mini-project.json
  project/
    spec.json                    # Mini-project verification spec
    hints.json                   # Progressive hints
```

**No new libraries needed.** Same directory conventions, same JSON format, same verification system.

### 5. Updated Mini-Project Spec

**Need:** Module 1's mini-project should have the learner create a slash command (.md) and a workflow (.md). The existing `verifier.cjs` checks file existence and regex patterns -- this works for .md files identically to .cjs files.

```json
{
  "artifacts": [
    {
      "description": "Custom slash command file",
      "path": "commands/gsd/my-command.md",
      "checks": [
        { "pattern": "^---", "description": "Has YAML frontmatter" },
        { "pattern": "name:\\s*gsd:", "description": "Has gsd: prefixed name" },
        { "pattern": "<execution_context>", "description": "References a workflow" }
      ]
    },
    {
      "description": "Custom workflow file",
      "path": "get-shit-done/workflows/my-command.md",
      "checks": [
        { "pattern": "<purpose>", "description": "Has purpose section" },
        { "pattern": "<process>", "description": "Has process section" },
        { "pattern": "gsd-tools\\.cjs", "description": "Calls gsd-tools" }
      ]
    }
  ]
}
```

**Confidence: HIGH** -- `verifier.cjs` is file-type agnostic. It reads any file and runs regex checks.

### 6. Module Renumbering Support

**Need:** Current progress tracks `currentModule: "command-lifecycle"`. Module 1 becomes `gsd-commands`, Module 2 becomes `command-lifecycle`. Progress file needs a `moduleOrder` concept.

**Change:** Add a top-level `modules.json` or extend `gsd-learn.cjs` with module ordering:

```json
{
  "modules": [
    { "id": "gsd-commands", "number": 1, "title": "GSD Commands & Workflows" },
    { "id": "command-lifecycle", "number": 2, "title": "Command Lifecycle" }
  ]
}
```

This is a data file, not a library addition. The `--module` flag already exists in `gsd-learn.cjs`.

**Confidence: HIGH** -- Minimal change, follows existing patterns.

## Reuse Opportunities (Existing Code That Serves Module 1)

| Existing Module | Reuse for Module 1 | Notes |
|-----------------|---------------------|-------|
| `learn/lib/lessons.cjs` | Load gsd-commands module | Already generic: `loadModule(moduleId)` |
| `learn/lib/renderer.cjs` | Render markdown-source lessons | Content format is the same JSON schema (text, code blocks) |
| `learn/lib/navigator.cjs` | Lesson navigation | Fully module-agnostic |
| `learn/lib/progress.cjs` | Track Module 1 progress | Already supports multiple modules by ID |
| `learn/lib/verifier.cjs` | Verify mini-project | File-type agnostic regex checking |
| `learn/lib/hints.cjs` | Progressive hints | Reads from any hints.json |
| `learn/lib/feedback.cjs` | Track learning events | Module-agnostic event recording |
| `learn/lib/terminal.cjs` | ANSI formatting | No changes needed |
| `learn/lib/clipboard.cjs` | Copy lesson to clipboard | No changes needed |
| `learn/lib/clipboard-formatter.cjs` | Format lesson for clipboard | No changes needed |
| `learn/lib/errors.cjs` | Error formatting | No changes needed |
| `learn/lib/evaluator.cjs` | Score lesson quality | No changes needed |

**Key insight:** 10 of 12 existing lib modules need zero changes. Only `parser.cjs` gets a sibling (`md-parser.cjs`) and `prompt-templates.cjs` gets a small refactor.

## What NOT to Add

| Technology | Why Not | What to Do Instead |
|------------|---------|-------------------|
| markdown-it / remark / unified | Runtime dependency. We parse structure, not render markdown. GSD's markdown follows strict conventions that regex handles. | Write `md-parser.cjs` with targeted regex extractors |
| gray-matter (YAML frontmatter lib) | Runtime dependency. GSD already has `frontmatter.cjs` that does this. | Require GSD's own `frontmatter.cjs` for YAML portions |
| js-yaml | Runtime dependency. GSD's frontmatter parser handles the YAML subset used in command/workflow files. | Use GSD's `extractFrontmatter()` |
| Any templating engine (handlebars, ejs, mustache) | Runtime dependency. The `{{PLACEHOLDER}}` replacement in prompt-templates.cjs is sufficient. | Extend existing `assemblePrompt()` with generic replacement |
| glob / fast-glob | Runtime dependency for file discovery. | Use `fs.readdirSync` + `.filter()` -- already the pattern in `lessons.cjs` |
| New test framework | Consistency matters more than features. | Keep `node:test` + `node:assert` |
| Any AST parser for markdown | Overkill. Command files use XML-like tags (`<purpose>`, `<process>`), not complex nested markdown. | Regex extraction of tagged sections |

## Integration Points

### GSD's Own frontmatter.cjs

The learn tool can `require()` GSD's frontmatter parser directly:

```javascript
// Path from learn/lib/ to GSD's lib/
const { extractFrontmatter } = require('../../get-shit-done/bin/lib/frontmatter.cjs');
```

This is an in-repo require, not an external dependency. It keeps YAML parsing DRY.

**Risk:** If GSD's frontmatter module changes API, the learn tool breaks. Mitigation: both are in the same repo and tested together.

**Confidence: HIGH** -- Same-repo requires are standard practice.

### Source File Locations

The markdown parser needs to know where command and workflow files live. Two approaches:

1. **Hardcoded relative paths** from repo root (simpler, matches existing CJS parser pattern)
2. **Detect from installed location** via `os.homedir() + '/.claude/'` (matches `generate-lessons.cjs` which uses `GSD_ROOT`)

**Recommendation:** Use approach 2 (homedir-based) to match the existing `GSD_ROOT` pattern in `generate-lessons.cjs`. This ensures lessons are generated from the actually-installed GSD files, not just the repo copy.

```javascript
const GSD_ROOT = path.join(os.homedir(), '.claude', 'get-shit-done');
const COMMANDS_DIR = path.join(os.homedir(), '.claude', 'commands', 'gsd');
```

### Updated Command Lifecycle Mini-Project (Module 2)

Per PROJECT.md, the existing Module 2 mini-project expands to "full-stack (all 4 layers)." The spec.json grows from 2 artifacts to 4:

```json
{
  "artifacts": [
    { "path": "commands/gsd/echo.md", "checks": [...] },
    { "path": "get-shit-done/workflows/echo.md", "checks": [...] },
    { "path": "get-shit-done/bin/lib/echo.cjs", "checks": [...] },
    { "path": "get-shit-done/bin/gsd-tools.cjs", "checks": [...] }
  ]
}
```

No new libraries needed -- same `verifier.cjs` with more artifact entries.

## Installation

```bash
# No new runtime dependencies.
# No new dev dependencies.
# No npm install changes.
```

All work is new .cjs modules, .json content files, and .prompt.md templates within the existing `learn/` directory.

## Version Compatibility

| Component | Compatible With | Notes |
|-----------|-----------------|-------|
| New `md-parser.cjs` | Node >= 18.0.0 | Uses only `fs`, `path`, `RegExp` -- works on any Node version, but project floor is 18 |
| GSD `frontmatter.cjs` | Node >= 16.7.0 | GSD's own module, designed for broad compatibility |
| New prompt templates | `prompt-templates.cjs` | Backward compatible if `assemblePrompt()` is refactored to generic replacement |
| New `module.json` | `lessons.cjs` `loadModule()` | Existing loader is already generic by module ID |

## Confidence Assessment

| Decision | Confidence | Rationale |
|----------|------------|-----------|
| No new dependencies | HIGH | PROJECT.md constraint + all needs met by built-in APIs |
| New md-parser.cjs module | HIGH | Examined actual command/workflow files; tags are consistent and regex-parseable |
| Reuse GSD's frontmatter.cjs | HIGH | Same repo, same runtime, tested module |
| Generic prompt template refactor | HIGH | Small change, backward compatible, eliminates per-placeholder maintenance |
| 10/12 existing modules unchanged | HIGH | Verified by reading every lib module -- they're content-agnostic |
| Homedir-based source paths | MEDIUM | Matches existing pattern but requires GSD to be installed (not just cloned) |
| Module ordering via modules.json | MEDIUM | Simple approach; could also hardcode in gsd-learn.cjs |

## Sources

- `learn/lib/parser.cjs` -- existing CJS parser, confirms what's missing for .md files
- `learn/lib/prompt-templates.cjs` -- hardcoded placeholders, confirms refactor need
- `learn/lib/lessons.cjs` -- generic `loadModule()`, confirms no changes needed
- `learn/lib/verifier.cjs` -- file-agnostic regex checks, confirms no changes needed
- `learn/bin/generate-lessons.cjs` -- hardcoded lesson plan, confirms extension pattern
- `learn/bin/gsd-learn.cjs` -- module flag already exists, confirms routing support
- `commands/gsd/new-project.md` -- actual command file structure (frontmatter + XML tags)
- `get-shit-done/workflows/new-project.md` -- actual workflow file structure (XML tags + bash blocks)
- `get-shit-done/bin/lib/frontmatter.cjs` -- YAML parser available for reuse
- `.planning/codebase/CONVENTIONS.md` -- confirms consistent markdown conventions across GSD

---

*Stack research for: GSD Commands & Workflows Module (v2.0)*
*Researched: 2026-03-12*
