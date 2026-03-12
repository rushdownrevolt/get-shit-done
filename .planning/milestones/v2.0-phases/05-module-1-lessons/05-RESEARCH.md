# Phase 5: Module 1 Lessons - Research

**Researched:** 2026-03-12
**Domain:** Lesson content generation for GSD markdown-based modules using existing parser/template pipeline
**Confidence:** HIGH

## Summary

Phase 5 creates the actual lesson content for Module 1 (GSD Commands & Workflows). The infrastructure is already complete from Phase 4: `parseMarkdownFile()` extracts structured data from command specs and workflows, `assembleMarkdownPrompt()` fills the `markdown-anatomy.prompt.md` template, and the `gsd-commands` module skeleton exists with `module.json` (order: 1) and a placeholder `concept-map.txt`. The lesson display system (per-part navigation with focus/bridge fields, progressive content accumulation, concept maps) is battle-tested from the command-lifecycle module.

The work is primarily content authoring: creating 5 lesson JSON files that conform to the existing schema (`id`, `title`, `lessonNumber`, `objective`, `content[]` with focus/bridge, `conceptMap`, `successCriteria`), updating the concept map, populating the `sectionMap` in module.json, and extending `generate-lessons.cjs` to support markdown-source lessons. The key decision is whether to generate lessons via LLM prompts (using the prompt pipeline) or hand-author them directly as JSON. The existing command-lifecycle module used LLM generation via prompts; Module 1 should follow the same pattern since the `markdown-anatomy.prompt.md` template was purpose-built for this.

**Primary recommendation:** Create a lesson plan array for Module 1 in generate-lessons.cjs (or a parallel script), wire it to `parseMarkdownFile()` + `assembleMarkdownPrompt()`, generate prompt files, then hand-author or LLM-generate the lesson JSON files. The concept map and sectionMap must be updated to reflect the two-layer architecture (command spec -> workflow).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MOD1-01 | Lesson 1 -- Conceptual overview of two-layer architecture (command.md dispatches to workflow.md) | Overview prompt template exists; lesson follows `01-welcome.json` pattern from command-lifecycle; needs Module 1 specific overview content about command specs and workflows |
| MOD1-02 | Lesson 2 -- Command.md anatomy (frontmatter, XML sections, @file: references) | `parseMarkdownFile()` extracts all these fields; `markdown-anatomy.prompt.md` template designed specifically for this; use a real command spec (e.g., quick.md or echo.md) as source |
| MOD1-03 | Lesson 3 -- Workflow.md anatomy (purpose, process steps, bash code blocks) | Same parser/template pipeline; workflow files have no frontmatter, use `<purpose>`, nested `<step>` tags inside `<process>`; use a real workflow (e.g., quick.md or echo.md) as source |
| MOD1-04 | Lesson 4 -- Command-to-workflow wiring (dispatch chain from /gsd:X to execution) | Needs to show how `<execution_context>` in command spec references the workflow via `@file:` path; cross-file lesson connecting Lessons 2 and 3 |
| MOD1-06 | Bridge lesson previewing Module 2's Node.js layer | Final lesson that connects what learner knows (markdown layer) to what comes next (CJS/Node.js layer); references command-lifecycle module content |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `learn/lib/markdown-parser.cjs` | Internal | `parseMarkdownFile()` for command spec/workflow extraction | Built in Phase 4 specifically for this use case |
| `learn/lib/prompt-templates.cjs` | Internal | `assembleMarkdownPrompt()` for filling markdown-anatomy template | Built in Phase 4 with fail-loud key replacement |
| `learn/content/prompts/markdown-anatomy.prompt.md` | Internal | Prompt template for teaching .md file anatomy | Purpose-built for MOD1-02 and MOD1-03 |
| `learn/content/prompts/overview.prompt.md` | Internal | Prompt template for conceptual overview lessons | Used for MOD1-01 (same pattern as command-lifecycle Lesson 1) |
| `learn/lib/lessons.cjs` | Internal | `loadModule()` with schema validation (focus/bridge required) | Validates all lesson JSON on load |
| `learn/lib/renderer.cjs` | Internal | `renderPart()` with progressive accumulation, focus/bridge display | Handles all content types: text, code, project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `learn/lib/evaluator.cjs` | Internal | Lesson quality scoring against rubric | After generating lessons, score quality before accepting |
| `learn/bin/generate-lessons.cjs` | Internal | Prompt generation and JSON validation pipeline | Extended or paralleled for Module 1 lesson generation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| LLM-generated lesson content | Hand-authored JSON | Hand-authoring is more predictable but slower; project established LLM generation pattern in v1 |
| Extending generate-lessons.cjs | New generate-module1.cjs script | New script avoids touching working code but duplicates scaffolding; extending is cleaner since generate-lessons.cjs already has the pattern |

## Architecture Patterns

### Lesson Content Structure
```
learn/content/modules/gsd-commands/
  module.json              # id, title, description, order: 1, sectionMap
  concept-map.txt          # ASCII art showing command-spec -> workflow flow
  lessons/
    01-overview.json       # MOD1-01: Two-layer architecture overview
    02-command-anatomy.json # MOD1-02: Command.md anatomy
    03-workflow-anatomy.json # MOD1-03: Workflow.md anatomy
    04-dispatch-chain.json  # MOD1-04: Command-to-workflow wiring
    05-bridge.json          # MOD1-06: Bridge to Module 2
```

### Pattern 1: Lesson JSON Schema (Established)
**What:** Every lesson JSON file must conform to this exact schema, validated by `loadModule()` in `lessons.cjs`.
**When to use:** Always -- every lesson file.

Required fields:
```json
{
  "id": "kebab-case-id",
  "title": "Human-readable title",
  "lessonNumber": 1,
  "objective": "One sentence describing what learner will understand",
  "content": [
    {
      "type": "text",
      "value": "Explanation text...",
      "focus": "3-8 word phrase describing this block",
      "bridge": "One sentence connecting to next block"
    },
    {
      "type": "code",
      "language": "markdown",
      "value": "actual source content",
      "highlight": [1, 3],
      "focus": "What this code demonstrates",
      "bridge": "How this connects to what comes next"
    }
  ],
  "conceptMap": "section-name-for-you-are-here-marker",
  "successCriteria": "What learner can do/explain after this lesson"
}
```

Validation rules (from `lessons.cjs` lines 44-60):
- Required top-level fields: `id`, `title`, `lessonNumber`, `objective`, `content`, `conceptMap`, `successCriteria`
- Every content item MUST have `focus` (string, truthy) and `bridge` (string, truthy)
- `focus` should be 3-8 words
- `bridge` is one sentence connecting to next block; last item's bridge references next lesson title

### Pattern 2: Concept Map with sectionMap
**What:** Each lesson's `conceptMap` field references a key in `module.json`'s `sectionMap`, which maps to a label in `concept-map.txt` for the "YOU ARE HERE" marker.
**When to use:** Every lesson needs a valid `conceptMap` value.

Current gsd-commands module.json has empty sectionMap -- must be populated:
```json
{
  "id": "gsd-commands",
  "title": "GSD Commands & Workflows",
  "description": "Learn how GSD slash commands dispatch through command specs to workflow files.",
  "order": 1,
  "sectionMap": {
    "overview": "Overview",
    "command-spec": "Command Spec",
    "workflow": "Workflow",
    "dispatch": "Dispatch Chain",
    "bridge": "Bridge"
  }
}
```

The concept-map.txt must be updated from placeholder to real content:
```
  /gsd:command
        |
        v
  +------------------+
  | Command Spec     |
  | (.md frontmatter |
  |  + XML sections) |
  +------------------+
        |
        v  @file: reference
  +------------------+
  | Workflow          |
  | (steps, process, |
  |  code blocks)    |
  +------------------+
        |
        v
  +------------------+
  | Node.js Layer    |
  | (Module 2)       |
  +------------------+
```

### Pattern 3: Prompt Generation Pipeline for Markdown Sources
**What:** Generate assembled prompt text files that can be fed to an LLM to produce lesson JSON.
**When to use:** For Lessons 2-4 which teach specific .md source files.

The pipeline for markdown-source lessons:
1. `parseMarkdownFile(sourceFilePath)` -- get structured data
2. Format the parsed data into a flat context object (format functions prepare strings)
3. `assembleMarkdownPrompt('markdown-anatomy', context)` -- fill template
4. Write assembled prompt to `learn/content/prompts/generated/`
5. Feed to LLM -> get JSON response
6. Validate JSON against lesson schema
7. Place in `learn/content/modules/gsd-commands/lessons/`

Context object keys needed by `markdown-anatomy.prompt.md`:
- `lessonNumber` (number)
- `lessonTitle` (string)
- `focus` (string -- what to focus on in this lesson)
- `fileName` (from parser)
- `fileType` (from parser: 'command-spec' or 'workflow')
- `frontmatterFormatted` (formatted string of frontmatter fields)
- `sectionsFormatted` (formatted string of XML sections)
- `fileReferencesFormatted` (formatted string of @file refs)
- `codeBlocksFormatted` (formatted string of code blocks)
- `sourceCode` (raw .md file content)

### Pattern 4: Overview and Bridge Lessons (No Source File)
**What:** Lessons 1 (overview) and 5 (bridge) don't parse a specific .md source file.
**When to use:** MOD1-01 and MOD1-06.

For the overview lesson (MOD1-01):
- Use `overview.prompt.md` template (same as command-lifecycle Lesson 1)
- Provide `MODULE_OVERVIEW` context about the two-layer architecture
- Or hand-author the JSON directly (the overview is conceptual, not source-driven)

For the bridge lesson (MOD1-06):
- Hand-author JSON -- it's a conceptual bridge, not a source-code lesson
- Content connects markdown layer knowledge to Node.js layer (Module 2)
- Reference what learner already knows from command-lifecycle module

### Anti-Patterns to Avoid
- **Missing focus/bridge fields:** `loadModule()` throws on missing focus or bridge in any content item. Every single content block needs both.
- **Non-truthy focus/bridge:** Validation checks `!item.focus || typeof item.focus !== 'string'` -- empty strings fail.
- **Inventing code content:** Code blocks in lessons must use ACTUAL content from GSD source files, not invented markup.
- **Two code blocks back-to-back:** Template guidelines require alternating text and code blocks.
- **Overlong code snippets:** Keep to 5-15 lines per snippet with highlights on important lines.
- **Modifying existing lesson files:** command-lifecycle lessons are untouched -- this phase only creates gsd-commands lessons.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown file parsing | Custom extraction for each lesson | `parseMarkdownFile()` from `markdown-parser.cjs` | Already handles frontmatter, XML sections, @file refs, code blocks |
| Prompt assembly | String concatenation in lesson scripts | `assembleMarkdownPrompt()` from `prompt-templates.cjs` | Fail-loud on missing keys catches errors early |
| Lesson validation | Custom field checking | `loadModule()` from `lessons.cjs` | Already validates all required fields including focus/bridge |
| Concept map rendering | Custom ASCII art display | `renderConceptMap()` from `concept-map.cjs` | Loads from module directory, handles sectionMap markers |

**Key insight:** All the infrastructure for creating and displaying Module 1 lessons already exists. This phase is about content creation using established tools, not building new infrastructure.

## Common Pitfalls

### Pitfall 1: focus/bridge Validation Strictness
**What goes wrong:** Lesson JSON loads but crashes at runtime because focus or bridge is empty, null, or missing.
**Why it happens:** `lessons.cjs` does strict validation: `!item.focus || typeof item.focus !== 'string'` throws.
**How to avoid:** Every content item (text, code) must have a non-empty string for both `focus` and `bridge`. Test by calling `loadModule('gsd-commands')` after creating lesson files.
**Warning signs:** Errors like "content[X] missing required field: focus" when running gsd-learn.

### Pitfall 2: conceptMap Value Must Match sectionMap Keys
**What goes wrong:** Lesson renders but "YOU ARE HERE" marker never appears on concept map.
**Why it happens:** The `conceptMap` field in lesson JSON must match a key in `module.json`'s `sectionMap`. If the key doesn't exist, `renderConceptMap` silently skips the marker.
**How to avoid:** Define all section keys in sectionMap before creating lessons. Verify each lesson's `conceptMap` value exists as a key.
**Warning signs:** Concept map renders without any highlighting.

### Pitfall 3: Source File Paths Are Platform-Specific
**What goes wrong:** `parseMarkdownFile()` works locally but paths in command specs use absolute Windows paths (`C:/Users/...`).
**Why it happens:** GSD command specs contain hardcoded absolute paths for `@file:` references.
**How to avoid:** When generating prompts, read source files using resolved paths. The `fileReferences` array from the parser will contain the raw paths -- format them for display but don't depend on them for file loading.
**Warning signs:** Path errors when running generate on different machines.

### Pitfall 4: Lesson Numbering Must Be Contiguous
**What goes wrong:** Navigation breaks or lessons appear out of order.
**Why it happens:** `loadModule()` sorts lesson files by filename (`01-`, `02-`, etc.) and navigation uses array indices.
**How to avoid:** Number files sequentially: `01-overview.json`, `02-command-anatomy.json`, `03-workflow-anatomy.json`, `04-dispatch-chain.json`, `05-bridge.json`. Ensure `lessonNumber` in JSON matches the file prefix.
**Warning signs:** Gaps in lesson sequence, wrong "Lesson N of M" display.

### Pitfall 5: generate-lessons.cjs Is Hardcoded to command-lifecycle
**What goes wrong:** Running generate-lessons.cjs generates prompts for the wrong module.
**Why it happens:** The `LESSON_PLAN` array and `validateAndCopy` function reference `command-lifecycle` module paths.
**How to avoid:** Either: (a) add a `--module` flag to generate-lessons.cjs with a Module 1 lesson plan, or (b) create a separate generation script for Module 1. Option (a) is cleaner long-term but option (b) is safer for this phase.
**Warning signs:** Generated prompts reference wrong source files.

### Pitfall 6: Bridge Lesson Must Reference Next Module
**What goes wrong:** Bridge lesson (Lesson 5) feels disconnected or doesn't set up expectations.
**Why it happens:** The bridge lesson needs to preview Module 2 (Command Lifecycle -- Node.js layer) but Module 2 content already exists.
**How to avoid:** The bridge should mention specific things from Module 2 -- entry point (gsd-tools.cjs), switch statement routing, tool modules. The learner will recognize these from the command spec's `<process>` which references Node.js CLI commands.
**Warning signs:** Bridge feels generic rather than connecting to concrete Module 2 content.

## Code Examples

### Lesson Plan for Module 1 (generate-lessons integration)
```javascript
// Source: pattern from existing LESSON_PLAN in generate-lessons.cjs
const MODULE1_LESSON_PLAN = [
  {
    lessonNumber: 1,
    id: 'overview',
    type: 'overview',
    title: 'The Two-Layer Architecture',
    template: 'overview',
    sources: [],
    focus: 'command specs dispatch to workflow files',
  },
  {
    lessonNumber: 2,
    id: 'command-anatomy',
    type: 'markdown-anatomy',
    title: 'Command Spec Anatomy',
    template: 'markdown-anatomy',
    sources: ['commands/gsd/quick.md'],  // or echo.md
    focus: 'YAML frontmatter, XML sections, @file references',
  },
  {
    lessonNumber: 3,
    id: 'workflow-anatomy',
    type: 'markdown-anatomy',
    title: 'Workflow File Anatomy',
    template: 'markdown-anatomy',
    sources: ['workflows/quick.md'],  // or echo.md
    focus: 'purpose, process steps, bash code blocks',
  },
  {
    lessonNumber: 4,
    id: 'dispatch-chain',
    type: 'markdown-anatomy',
    title: 'Command to Workflow Wiring',
    template: 'markdown-anatomy',
    sources: ['commands/gsd/quick.md', 'workflows/quick.md'],
    focus: 'execution_context @file reference, dispatch chain',
  },
  {
    lessonNumber: 5,
    id: 'bridge',
    type: 'bridge',
    title: 'Bridge to Node.js',
    template: null,  // hand-authored
    sources: [],
    focus: 'preview of Module 2 Node.js layer',
  },
];
```

### Formatting parseMarkdownFile Output for Template Context
```javascript
// Source: pattern matching markdown-anatomy.prompt.md template keys
function buildMarkdownContext(parsed, lesson) {
  const context = {
    lessonNumber: lesson.lessonNumber,
    lessonTitle: lesson.title,
    focus: lesson.focus,
    fileName: parsed.fileName,
    fileType: parsed.fileType,
    frontmatterFormatted: formatFrontmatter(parsed.frontmatter),
    sectionsFormatted: formatSections(parsed.sections),
    fileReferencesFormatted: formatFileRefs(parsed.fileReferences),
    codeBlocksFormatted: formatCodeBlocks(parsed.codeBlocks),
    sourceCode: parsed.body,
  };
  return context;
}

function formatFrontmatter(fm) {
  if (!fm || Object.keys(fm).length === 0) return 'No frontmatter (workflow files have no YAML header).';
  return Object.entries(fm)
    .map(([k, v]) => `- **${k}:** ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('\n');
}

function formatSections(sections) {
  if (!sections || Object.keys(sections).length === 0) return 'No XML sections found.';
  return Object.entries(sections)
    .map(([tag, body]) => {
      const content = Array.isArray(body) ? body.join('\n---\n') : body;
      return `### <${tag}>\n${content}`;
    })
    .join('\n\n');
}

function formatFileRefs(refs) {
  if (!refs || refs.length === 0) return 'No @file references found.';
  return refs.map(r => `- \`@${r}\``).join('\n');
}

function formatCodeBlocks(blocks) {
  if (!blocks || blocks.length === 0) return 'No fenced code blocks found.';
  return blocks.map((b, i) => {
    return `### Block ${i + 1} (${b.language || 'no language'})\n\`\`\`${b.language || ''}\n${b.code}\n\`\`\``;
  }).join('\n\n');
}
```

### Which Source Files to Use for Each Lesson

Best source file candidates based on teaching value:

**Lesson 2 (Command Spec Anatomy -- MOD1-02):** Use `quick.md` command spec.
- Has rich frontmatter (name, description, argument-hint, allowed-tools array)
- Has all four XML sections (objective, execution_context, context, process)
- Has @file reference to workflow
- Good complexity for teaching

**Lesson 3 (Workflow Anatomy -- MOD1-03):** Use `quick.md` workflow.
- Has purpose, required_reading, process with multiple named steps
- Has nested step tags demonstrating XML nesting
- Has bash code blocks
- Success criteria section
- Substantial enough to show workflow patterns

**Lesson 4 (Dispatch Chain -- MOD1-04):** Use both `quick.md` files together.
- Shows the connection: command spec's `<execution_context>` -> @file reference -> workflow
- Cross-references sections from both files
- Demonstrates the full chain from `/gsd:quick` to execution

Alternative: `echo.md` pair is simpler (good for a minimal example) but `quick.md` is more representative of real GSD usage.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CJS-only source lessons | CJS + markdown source lessons | Phase 4 | Module 1 can teach .md files using dedicated parser/template |
| Single hardcoded module | Multi-module with order field | Phase 4 | Module 1 (gsd-commands) is order: 1, Module 2 (command-lifecycle) is order: 2 |
| Hardcoded concept map | Module-owned concept-map.txt | Phase 4 | Each module defines its own architecture diagram |

## Open Questions

1. **Source file selection for lessons**
   - What we know: `quick.md` (command + workflow) is the richest example; `echo.md` is the simplest.
   - What's unclear: Whether to use one consistent example throughout (quick.md) or vary between lessons.
   - Recommendation: Use `quick.md` for Lessons 2 and 3 (consistency helps learner follow the chain) and both files in Lesson 4 (dispatch chain). Mention `echo.md` as a simpler example the learner can explore.

2. **Lesson generation approach**
   - What we know: command-lifecycle used LLM generation via prompts; infrastructure for markdown-anatomy prompts exists.
   - What's unclear: Whether to generate prompts and feed to LLM, or hand-author lesson JSON directly.
   - Recommendation: Generate prompts using the pipeline (validates the Phase 4 infrastructure), then hand-review/edit the resulting JSON. For overview and bridge lessons (no source file), hand-author directly.

3. **generate-lessons.cjs extension strategy**
   - What we know: Current script is hardcoded to command-lifecycle LESSON_PLAN and uses `assemblePrompt` (CJS templates).
   - What's unclear: Whether to add a --module flag or create a parallel script.
   - Recommendation: Add `--module gsd-commands` flag support with a separate MODULE1_LESSON_PLAN that uses `parseMarkdownFile` + `assembleMarkdownPrompt`. The `--from-json` validation flow can be reused with a different target directory.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test + node:assert (built-in, Node 18+) |
| Config file | None -- uses built-in test runner |
| Quick run command | `node --test learn/tests/{file}.test.cjs` |
| Full suite command | `node --test learn/tests/*.test.cjs` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MOD1-01 | Overview lesson loads and validates (focus/bridge, required fields) | unit | `node --test learn/tests/lessons.test.cjs` | Exists (needs new tests for gsd-commands module) |
| MOD1-02 | Command anatomy lesson loads with valid content blocks | unit | `node --test learn/tests/lessons.test.cjs` | Exists (needs new tests) |
| MOD1-03 | Workflow anatomy lesson loads with valid content blocks | unit | `node --test learn/tests/lessons.test.cjs` | Exists (needs new tests) |
| MOD1-04 | Dispatch chain lesson loads, references both file types | unit | `node --test learn/tests/lessons.test.cjs` | Exists (needs new tests) |
| MOD1-06 | Bridge lesson loads, has bridge content referencing Module 2 | unit | `node --test learn/tests/lessons.test.cjs` | Exists (needs new tests) |

### Sampling Rate
- **Per task commit:** `node --test learn/tests/lessons.test.cjs`
- **Per wave merge:** `node --test learn/tests/*.test.cjs`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] New test cases in `lessons.test.cjs` for loading gsd-commands module with all 5 lessons
- [ ] Concept map validation: sectionMap keys match lesson conceptMap values
- [ ] Module 1 lesson JSON files (the actual content -- 5 files)
- [ ] Updated concept-map.txt with real architecture diagram
- [ ] Updated module.json with populated sectionMap
- [ ] Format functions for building markdown template context (frontmatter, sections, file refs, code blocks)

## Sources

### Primary (HIGH confidence)
- Direct code analysis of `learn/lib/markdown-parser.cjs` -- parseMarkdownFile output shape, extraction functions
- Direct code analysis of `learn/lib/prompt-templates.cjs` -- assembleMarkdownPrompt with fail-loud keys
- Direct code analysis of `learn/content/prompts/markdown-anatomy.prompt.md` -- 10 template placeholders
- Direct code analysis of `learn/lib/lessons.cjs` -- loadModule validation (focus/bridge required)
- Direct code analysis of `learn/lib/renderer.cjs` -- renderPart with progressive accumulation
- Direct code analysis of `learn/bin/generate-lessons.cjs` -- LESSON_PLAN structure, generatePrompts flow
- Direct code analysis of `learn/bin/gsd-learn.cjs` -- default moduleId='gsd-commands'
- Direct code analysis of `learn/content/modules/gsd-commands/module.json` -- current skeleton state
- Direct code analysis of `learn/content/modules/command-lifecycle/lessons/01-welcome.json` -- lesson schema reference
- Real GSD command spec: `~/.claude/commands/gsd/quick.md` -- 45 lines, rich example
- Real GSD workflow: `~/.claude/get-shit-done/workflows/quick.md` -- 585 lines, full workflow
- Real GSD command spec: `~/.claude/commands/gsd/echo.md` -- 20 lines, minimal example
- Phase 4 summaries: 04-01, 04-02, 04-03 confirming all infrastructure complete

### Secondary (MEDIUM confidence)
- None needed -- all findings based on direct code analysis

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all infrastructure verified in codebase, Phase 4 deliverables confirmed
- Architecture: HIGH -- lesson schema, validation, rendering all established and battle-tested
- Pitfalls: HIGH -- identified from actual validation code in lessons.cjs and real concept-map rendering

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable -- internal codebase, no external dependency churn)
