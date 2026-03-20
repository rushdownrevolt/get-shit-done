# Phase 2: Prompt-Driven Content Pipeline - Research

**Researched:** 2026-03-12
**Domain:** Source code parsing, prompt engineering for lesson generation, evaluation rubrics
**Confidence:** HIGH

## Summary

Phase 2 replaces the hand-written lesson JSON files from Phase 1 with a pipeline that (1) parses GSD source files to extract code, exports, structure, and design rationale, (2) feeds that parsed context into lesson-generation prompts, and (3) evaluates prompt output against a rubric to iterate toward quality. The existing lesson data model (JSON with `id`, `title`, `content[]`, `conceptMap`, `successCriteria`) stays intact -- Phase 2 changes how lessons are *produced*, not how they are *consumed* by the renderer.

The core technical challenge is the source parser: GSD is a zero-dependency CommonJS codebase with ~5,400 lines across 11 lib modules plus a 592-line entry point. The parser must extract function definitions, export lists, require() graphs, JSDoc comments, and section separators (`// --- Section Name ---`) to provide structured context for prompts. This is static analysis of a well-structured CommonJS codebase, not arbitrary JS parsing -- the patterns are consistent and regex-tractable.

The prompt engineering piece is a build-time operation: prompts run offline (not at lesson-display time), produce JSON lesson files, and those files are committed. Evaluation is manual-with-structure: a rubric scores each generated lesson, and scores drive prompt revisions. There is no LLM runtime dependency for end users.

**Primary recommendation:** Build a source parser as a CommonJS module (`learn/lib/parser.cjs`) that extracts structured data from GSD files, a prompt template system that injects parsed context into lesson-generation prompts, and a rubric evaluator that scores generated lessons. The pipeline runs via a `node learn/bin/generate-lessons.cjs` script. Generated lesson JSON files replace the hand-written ones in `learn/content/`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-03 | Lesson content generated via prompts using parsed GSD source as input | Source parser extracts code/exports/structure; prompt templates inject parsed context; output is lesson JSON matching Phase 1 schema |
| CONT-04 | Lessons include contextual "why" explanations covering design decisions and rationale | Parser extracts JSDoc comments, section separators, and inline comments; prompt templates instruct LLM to explain rationale, not just describe code |
| CONT-05 | Evaluation rubric scores prompt-generated lessons on accuracy, clarity, depth, pedagogical quality | JSON rubric with 5 scoring dimensions; human evaluator scores each lesson; scores tracked per prompt iteration |
| MODL-01 | MVP includes one complete module: Command Lifecycle | Pipeline generates all 5+ lessons for command-lifecycle module, replacing hand-written content |
| MODL-02 | Module starts with conceptual overview, then drills into GSD source code | Prompt templates differentiate between "overview" lesson type and "source-dive" lesson type with different context injection |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `fs` | Built-in | Read GSD source files, write generated lesson JSON | Matches GSD's synchronous file I/O patterns |
| Node.js built-in `path` | Built-in | Cross-platform path resolution for source files | GSD convention |
| Regex-based parser | N/A | Extract functions, exports, requires, comments from CommonJS | GSD's patterns are consistent enough for regex; no AST parser needed |
| JSON lesson schema | N/A | Output format matching Phase 1 lesson data model | Backward-compatible with renderer.cjs |
| Prompt templates (string interpolation) | N/A | Inject parsed source context into prompt text | No template library needed; template literals with structured sections |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:test` | Built-in (18+) | Test parser, prompt templates, rubric scoring | All test files |
| `node:assert` | Built-in | Test assertions | Inside test functions |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Regex parser | `acorn` (JS AST parser) | AST parser is more robust but adds a runtime dependency violating zero-dep constraint. GSD's CommonJS patterns are uniform enough for regex. |
| String template literals | Handlebars/EJS | Runtime dependency. Template literals with helper functions are sufficient for structured prompt text. |
| Manual rubric evaluation | Automated LLM-as-judge | Would add LLM runtime dependency and cost. Manual rubric with structured scoring is appropriate for MVP with one module. |

**Installation:**
```bash
# No new dependencies. Zero-dep constraint maintained.
```

## Architecture Patterns

### Recommended Project Structure

```
learn/
  bin/
    gsd-learn.cjs              # (existing) CLI entry point
    generate-lessons.cjs        # NEW: Lesson generation pipeline entry
  lib/
    parser.cjs                  # NEW: GSD source file parser
    prompt-templates.cjs        # NEW: Prompt template assembly
    evaluator.cjs               # NEW: Rubric evaluation scoring
    lessons.cjs                 # (existing) Load lesson JSON
    renderer.cjs                # (existing) Render lessons to terminal
    ...                         # (existing Phase 1 modules)
  content/
    modules/
      command-lifecycle/
        module.json             # (existing) Module metadata
        lessons/
          01-overview.json      # GENERATED: conceptual overview
          02-entry-point.json   # GENERATED: source deep-dive
          03-dispatch.json      # GENERATED: source deep-dive
          04-tool-modules.json  # GENERATED: source deep-dive
          05-state-config.json  # GENERATED: source deep-dive
    prompts/
      overview.prompt.md        # Prompt template for overview lessons
      source-dive.prompt.md     # Prompt template for source deep-dive lessons
    rubric/
      rubric.json               # Evaluation rubric definition
      scores/
        iteration-01.json       # Scores from first prompt iteration
        iteration-02.json       # Scores after prompt revision
  tests/
    parser.test.cjs             # NEW: Parser tests
    prompt-templates.test.cjs   # NEW: Prompt template tests
    evaluator.test.cjs          # NEW: Rubric evaluation tests
    ...                         # (existing Phase 1 tests)
```

### Pattern 1: Source Parser Output Model

**What:** The parser reads a `.cjs` file and produces a structured object describing its contents: exports, functions, require() calls, comments, and code sections.

**When to use:** Every time a GSD source file is parsed for lesson context.

**Example:**
```javascript
// learn/lib/parser.cjs
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Parse a GSD CommonJS source file into structured data.
 *
 * @param {string} filePath - Absolute path to the .cjs file.
 * @returns {object} Parsed source structure.
 */
function parseSourceFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf-8');
  const lines = source.split('\n');

  return {
    filePath: filePath,
    fileName: path.basename(filePath),
    lineCount: lines.length,
    moduleDoc: extractModuleDoc(source),
    requires: extractRequires(lines),
    exports: extractExports(source),
    functions: extractFunctions(lines),
    sections: extractSections(lines),
    constants: extractConstants(lines),
  };
}

/**
 * Extract top-level JSDoc comment (module documentation).
 */
function extractModuleDoc(source) {
  const match = source.match(/^\/\*\*\s*\n([\s\S]*?)\*\//);
  return match ? match[1].replace(/^\s*\*\s?/gm, '').trim() : null;
}

/**
 * Extract require() calls with their variable bindings.
 */
function extractRequires(lines) {
  const requires = [];
  for (const line of lines) {
    const match = line.match(/(?:const|let|var)\s+(\{[^}]+\}|\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/);
    if (match) {
      requires.push({
        binding: match[1].trim(),
        module: match[2],
        isDestructured: match[1].startsWith('{'),
      });
    }
  }
  return requires;
}

/**
 * Extract module.exports object keys.
 */
function extractExports(source) {
  const match = source.match(/module\.exports\s*=\s*\{([^}]+)\}/s);
  if (!match) return [];
  return match[1]
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}
```

### Pattern 2: Prompt Template Assembly

**What:** Prompt templates are markdown files with placeholder markers. The assembly function replaces markers with parsed source data and lesson metadata.

**When to use:** When generating a lesson prompt to send to an LLM.

**Example:**
```javascript
// learn/lib/prompt-templates.cjs
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Assemble a prompt from a template and context data.
 *
 * @param {string} templateName - Template file name (e.g., 'source-dive').
 * @param {object} context - Parsed source data and lesson metadata.
 * @returns {string} Assembled prompt text.
 */
function assemblePrompt(templateName, context) {
  const templateDir = path.join(__dirname, '..', 'content', 'prompts');
  const templatePath = path.join(templateDir, templateName + '.prompt.md');
  let template = fs.readFileSync(templatePath, 'utf-8');

  // Replace markers
  template = template.replace('{{FILE_NAME}}', context.fileName || '');
  template = template.replace('{{MODULE_DOC}}', context.moduleDoc || 'No module documentation.');
  template = template.replace('{{EXPORTS}}', formatExports(context.exports));
  template = template.replace('{{FUNCTIONS}}', formatFunctions(context.functions));
  template = template.replace('{{REQUIRES}}', formatRequires(context.requires));
  template = template.replace('{{SOURCE_CODE}}', context.sourceCode || '');
  template = template.replace('{{LESSON_NUMBER}}', String(context.lessonNumber || 1));
  template = template.replace('{{LESSON_TITLE}}', context.lessonTitle || '');

  return template;
}

function formatExports(exports) {
  if (!exports || exports.length === 0) return 'None';
  return exports.map(e => '- `' + e + '`').join('\n');
}

function formatFunctions(functions) {
  if (!functions || functions.length === 0) return 'None';
  return functions.map(f =>
    '### `' + f.name + '`\n' +
    (f.jsdoc ? f.jsdoc + '\n' : '') +
    'Lines ' + f.startLine + '-' + f.endLine + '\n' +
    '```javascript\n' + f.code + '\n```'
  ).join('\n\n');
}

module.exports = { assemblePrompt };
```

### Pattern 3: Evaluation Rubric Scoring

**What:** A JSON rubric defines scoring dimensions. An evaluator module scores a generated lesson against the rubric and records results for tracking iteration progress.

**When to use:** After each prompt generates a lesson, before deciding whether to iterate.

**Example:**
```javascript
// learn/lib/evaluator.cjs
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Rubric dimensions for lesson evaluation.
 */
const RUBRIC = {
  accuracy: {
    description: 'Code snippets and explanations match actual GSD source',
    weight: 0.25,
    scale: { 1: 'Wrong code/explanations', 3: 'Mostly correct, minor errors', 5: 'Exact match with source' },
  },
  clarity: {
    description: 'Explanations are understandable to someone new to the codebase',
    weight: 0.20,
    scale: { 1: 'Confusing or jargon-heavy', 3: 'Understandable but could be clearer', 5: 'Crystal clear progression' },
  },
  depth: {
    description: 'Appropriate level of detail -- not too shallow, not overwhelming',
    weight: 0.20,
    scale: { 1: 'Surface-level or overwhelming', 3: 'Reasonable depth', 5: 'Perfect balance of depth and accessibility' },
  },
  whyExplanations: {
    description: 'Includes design rationale ("why"), not just code description ("what")',
    weight: 0.20,
    scale: { 1: 'No rationale', 3: 'Some rationale', 5: 'Every key decision explained' },
  },
  conceptMapConnection: {
    description: 'Lesson connects to the architecture concept map appropriately',
    weight: 0.15,
    scale: { 1: 'No connection to architecture', 3: 'Mentions architecture', 5: 'Clear "you are here" in the bigger picture' },
  },
};

/**
 * Score a lesson against the rubric.
 *
 * @param {object} scores - Object with dimension names as keys, 1-5 scores as values.
 * @returns {{ weighted: number, dimensions: object, pass: boolean }}
 */
function evaluateLesson(scores) {
  let weighted = 0;
  const dimensions = {};

  for (const [dim, config] of Object.entries(RUBRIC)) {
    const score = scores[dim] || 1;
    dimensions[dim] = { score, weight: config.weight, contribution: score * config.weight };
    weighted += score * config.weight;
  }

  return {
    weighted: Math.round(weighted * 100) / 100,
    dimensions,
    pass: weighted >= 3.5,  // Minimum threshold for acceptable quality
  };
}

module.exports = { RUBRIC, evaluateLesson };
```

### Pattern 4: Pipeline Orchestration

**What:** A generation script ties parser, prompt templates, and evaluator together. It reads GSD source files, generates prompts, and writes lesson JSON files.

**When to use:** Running `node learn/bin/generate-lessons.cjs` to regenerate lesson content.

**Example:**
```javascript
// learn/bin/generate-lessons.cjs
#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { parseSourceFile } = require('../lib/parser.cjs');
const { assemblePrompt } = require('../lib/prompt-templates.cjs');

const GSD_ROOT = path.resolve(__dirname, '..', '..');
const CONTENT_DIR = path.join(__dirname, '..', 'content');

// Define the Command Lifecycle module lesson plan
const LESSON_PLAN = [
  {
    lessonNumber: 1,
    type: 'overview',
    title: 'Welcome to GSD',
    template: 'overview',
    sources: [],  // Overview uses module-level context, not specific files
  },
  {
    lessonNumber: 2,
    type: 'source-dive',
    title: 'Where Commands Start',
    template: 'source-dive',
    sources: ['get-shit-done/bin/gsd-tools.cjs'],
    focus: 'entry point, require() imports, cwd/args setup',
  },
  {
    lessonNumber: 3,
    type: 'source-dive',
    title: 'Command Dispatch',
    template: 'source-dive',
    sources: ['get-shit-done/bin/gsd-tools.cjs'],
    focus: 'switch statement routing, sub-command dispatch, cmd naming convention',
  },
  {
    lessonNumber: 4,
    type: 'source-dive',
    title: 'Tool Modules',
    template: 'source-dive',
    sources: [
      'get-shit-done/bin/lib/core.cjs',
      'get-shit-done/bin/lib/config.cjs',
      'get-shit-done/bin/lib/phase.cjs',
    ],
    focus: 'module boundaries, export patterns, utility functions',
  },
  {
    lessonNumber: 5,
    type: 'source-dive',
    title: 'State and Configuration',
    template: 'source-dive',
    sources: [
      'get-shit-done/bin/lib/state.cjs',
      'get-shit-done/bin/lib/config.cjs',
    ],
    focus: 'STATE.md operations, config.json CRUD, persistence patterns',
  },
];

// Parse sources and generate prompts
for (const lesson of LESSON_PLAN) {
  const parsedSources = lesson.sources.map(src => {
    const fullPath = path.join(GSD_ROOT, src);
    return parseSourceFile(fullPath);
  });

  const context = {
    lessonNumber: lesson.lessonNumber,
    lessonTitle: lesson.title,
    focus: lesson.focus || '',
    parsedSources,
    // Flatten for single-source lessons
    ...(parsedSources.length === 1 ? parsedSources[0] : {}),
  };

  const prompt = assemblePrompt(lesson.template, context);

  // Write the assembled prompt for review/execution
  const promptOutPath = path.join(CONTENT_DIR, 'prompts', 'generated',
    lesson.lessonNumber.toString().padStart(2, '0') + '-' + lesson.title.toLowerCase().replace(/\s+/g, '-') + '.txt');
  fs.mkdirSync(path.dirname(promptOutPath), { recursive: true });
  fs.writeFileSync(promptOutPath, prompt, 'utf-8');

  process.stdout.write('Generated prompt for lesson ' + lesson.lessonNumber + ': ' + lesson.title + '\n');
}
```

### Anti-Patterns to Avoid

- **Runtime LLM calls:** Do NOT call an LLM at lesson-display time. The pipeline generates lesson JSON files offline. The user never needs API keys or internet access to learn.
- **Full AST parsing:** Do NOT add `acorn`, `babel`, or `typescript` as dependencies for parsing. GSD's CommonJS patterns are uniform -- regex extraction is sufficient and maintains zero-dep.
- **Over-abstracting the parser:** Do NOT build a general-purpose JS parser. Build a GSD-specific parser that handles CommonJS `module.exports`, `require()`, function declarations, JSDoc, and section separators. That is all.
- **Automated evaluation without human judgment:** Do NOT build an LLM-as-judge for the rubric. The rubric is scored by a human reviewing generated lessons. Automation comes in v2 if needed.
- **Generating lessons in code instead of data:** Lesson content MUST end up as JSON files in `learn/content/`. Do not embed generated content in `.cjs` modules. The renderer reads JSON.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CommonJS export extraction | Full JS parser | Regex matching `module.exports = { ... }` | GSD's export pattern is 100% consistent: single `module.exports = { name1, name2 }` at end of every file |
| Require graph building | Dynamic import resolution | Regex matching `require('./...')` patterns | GSD uses only relative requires for local modules; no dynamic requires, no conditional requires |
| Function boundary detection | Token-level parser | Line-by-line brace counting with `function` keyword detection | GSD functions are top-level declarations with consistent indentation; no nested function expressions to worry about |
| Prompt template rendering | Template engine (Handlebars, EJS) | String `replace()` with `{{MARKER}}` convention | A dozen markers at most; template engines add dependency and complexity for zero gain |
| JSON schema validation | JSON Schema library | Manual field presence checks in `lessons.cjs` | Already implemented in Phase 1; 7 required fields checked with a for loop |

**Key insight:** GSD's codebase is remarkably consistent in its patterns. The parser can rely on this consistency rather than handling arbitrary JavaScript.

## Common Pitfalls

### Pitfall 1: Parser Scope Creep
**What goes wrong:** Building a parser that handles edge cases that don't exist in GSD (arrow functions as exports, dynamic requires, computed property names, class syntax).
**Why it happens:** Developer instinct to handle all possible JavaScript patterns.
**How to avoid:** Survey every `.cjs` file in `get-shit-done/bin/lib/` before writing the parser. Document the actual patterns found. Build for THOSE patterns only. GSD uses: `function` declarations, `module.exports = { name1, name2 }`, `require('./relative.cjs')`, `const UPPER_CASE = ...` constants, `// --- Section ---` separators, JSDoc `/** ... */` blocks.
**Warning signs:** Parser code is longer than 200 lines. Parser handles patterns not found in GSD source.

### Pitfall 2: Prompt Output Doesn't Match Lesson Schema
**What goes wrong:** The LLM generates lesson content that doesn't conform to the Phase 1 JSON schema (`{ id, title, lessonNumber, objective, content[], conceptMap, successCriteria }`), causing the renderer to crash.
**Why it happens:** LLMs produce variable-structure output unless the expected schema is explicitly specified in the prompt with examples.
**How to avoid:** Include the exact JSON schema in every prompt template, with a complete example lesson. Add a validation step in the pipeline that checks generated JSON against the schema before writing it to `content/`. Include explicit instructions for the content array types (`text` and `code` with `language`, `value`, and optional `highlight`).
**Warning signs:** Generated lessons crash the renderer. Lessons have extra fields or missing required fields.

### Pitfall 3: Losing "Why" in Favor of "What"
**What goes wrong:** Generated lessons describe what the code does ("this function reads a file") but not why it was designed that way ("synchronous reads are used because GSD runs in a single-threaded CLI context where async adds complexity without benefit").
**Why it happens:** LLMs default to describing code mechanically unless explicitly instructed to explain design rationale.
**How to avoid:** The prompt template must explicitly instruct: "For every code snippet, explain WHY this design choice was made, not just WHAT it does. Reference the project's constraints (zero-dependency, CommonJS, CLI-native) to justify patterns." The rubric's `whyExplanations` dimension catches this during evaluation.
**Warning signs:** `whyExplanations` rubric score consistently below 3. Lessons read like API documentation instead of teaching material.

### Pitfall 4: Over-stuffing Source Context into Prompts
**What goes wrong:** Sending entire 500-900 line source files into the prompt, causing the LLM to lose focus and produce unfocused lessons that try to cover everything.
**Why it happens:** "More context must be better" intuition.
**How to avoid:** The parser should extract *relevant sections* of source files, not entire files. Each lesson's plan specifies a `focus` area. The prompt template should include only the functions, exports, and sections relevant to that focus. For a 900-line file, the relevant excerpt might be 50-100 lines.
**Warning signs:** Prompts exceed 5,000 tokens of source context. Generated lessons mention functions unrelated to the lesson's focus.

### Pitfall 5: Not Tracking Iteration
**What goes wrong:** Prompts are tweaked ad-hoc without recording what changed and whether it helped. No way to tell if iteration N is better than iteration N-1.
**Why it happens:** "I'll just tweak this prompt and re-run" without discipline.
**How to avoid:** Each iteration gets a numbered scores file (`iteration-01.json`, `iteration-02.json`). Each file records: prompt version (hash or diff), per-lesson scores, weighted total, and notes on what changed. The pipeline should make it easy to compare scores across iterations.
**Warning signs:** No iteration score files. Prompts edited in place without versioning.

## Code Examples

### GSD Source File Patterns (What the Parser Must Handle)

```javascript
// Pattern 1: Module documentation (JSDoc at top)
/**
 * Core -- Shared utilities, constants, and internal helpers
 */

// Pattern 2: Requires
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Pattern 3: Section separators
// --- Model Profile Table -----

// Pattern 4: Constants
const MODEL_PROFILES = {
  'gsd-planner': { quality: 'opus', balanced: 'opus', budget: 'sonnet' },
  // ...
};

// Pattern 5: Function declarations with JSDoc
/** Normalize a relative path to always use forward slashes. */
function toPosixPath(p) {
  return p.split(path.sep).join('/');
}

// Pattern 6: Exported command functions (cmd prefix)
function cmdStateLoad(cwd, raw) {
  // ...
}

// Pattern 7: module.exports at file end
module.exports = {
  MODEL_PROFILES,
  output,
  error,
  safeReadFile,
  loadConfig,
  // ...
};
```

### Prompt Template Example

```markdown
<!-- learn/content/prompts/source-dive.prompt.md -->
# Source Code Deep-Dive Lesson Generator

You are creating a lesson for GSD Learn, a terminal-based interactive tutorial that teaches
developers how GSD (Get Shit Done) works internally.

## Lesson Metadata
- **Lesson Number:** {{LESSON_NUMBER}}
- **Title:** {{LESSON_TITLE}}
- **Focus Area:** {{FOCUS}}

## Source File Context

**File:** {{FILE_NAME}}
{{MODULE_DOC}}

### Exported Functions
{{EXPORTS}}

### Key Functions (with code)
{{FUNCTIONS}}

### Dependencies (require() calls)
{{REQUIRES}}

## Output Requirements

Generate a JSON lesson file with this EXACT schema:

```json
{
  "id": "kebab-case-id",
  "title": "{{LESSON_TITLE}}",
  "lessonNumber": {{LESSON_NUMBER}},
  "objective": "One sentence: what the learner will understand after this lesson",
  "content": [
    { "type": "text", "value": "Explanation text..." },
    { "type": "code", "language": "javascript", "value": "actual code from source", "highlight": [1, 3] },
    { "type": "text", "value": "Why this code is designed this way..." }
  ],
  "conceptMap": "section-name-for-you-are-here-marker",
  "successCriteria": "One sentence: what the learner can do/explain after this lesson"
}
```

## Content Guidelines

1. **Alternate text and code blocks.** Never put two code blocks back-to-back.
2. **Code blocks must use ACTUAL source code** from the file. Do not invent code.
3. **Every code block must be followed by a "why" explanation.** Why was this design chosen?
   Reference GSD's constraints: zero dependencies, CommonJS, CLI-native, cross-platform.
4. **Keep code snippets focused.** 5-15 lines per snippet. Highlight the most important lines.
5. **The `highlight` array uses 1-based line numbers** within the snippet (not the source file).
6. **Target audience:** A developer who uses GSD but has never read its source code.
7. **Tone:** Direct, practical, no filler. Like a senior developer explaining their code to a new team member.
```

### Rubric JSON Example

```json
{
  "version": 1,
  "dimensions": {
    "accuracy": {
      "description": "Code snippets and explanations match actual GSD source",
      "weight": 0.25,
      "scale": {
        "1": "Wrong code or explanations that contradict source",
        "2": "Multiple inaccuracies",
        "3": "Mostly correct, minor errors",
        "4": "Accurate with trivial omissions",
        "5": "Exact match with source, all explanations verified"
      }
    },
    "clarity": {
      "description": "Explanations are understandable to someone new to the codebase",
      "weight": 0.20
    },
    "depth": {
      "description": "Appropriate level of detail",
      "weight": 0.20
    },
    "whyExplanations": {
      "description": "Includes design rationale, not just code description",
      "weight": 0.20
    },
    "conceptMapConnection": {
      "description": "Lesson connects to the architecture concept map",
      "weight": 0.15
    }
  },
  "passThreshold": 3.5,
  "minimumPerDimension": 2
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hand-written lesson JSON | Prompt-generated from parsed source | Phase 2 (now) | Lessons stay in sync with source; content quality is measurable and iterable |
| No evaluation criteria | Rubric-scored evaluation | Phase 2 (now) | Prompt iterations are data-driven, not gut-feel |
| Full file as context | Parsed/focused source excerpts | Phase 2 (now) | Better lesson focus; less LLM distraction from irrelevant code |

**Not applicable:**
- No deprecated libraries or APIs to worry about; this phase introduces new code using the same Node.js built-ins as Phase 1.

## Open Questions

1. **Which LLM runs the lesson-generation prompts?**
   - What we know: The prompts are run offline by the developer. The generated JSON is committed. End users never call an LLM.
   - What's unclear: Whether to document a specific model (Claude, GPT-4) or keep prompts model-agnostic.
   - Recommendation: Keep prompts model-agnostic. The pipeline produces prompt text files; the developer pastes them into their preferred LLM. Document "tested with Claude Sonnet" but don't hard-code a model dependency.

2. **How many prompt iterations are "enough"?**
   - What we know: CONT-05 requires "at least one round" where evaluation results drove specific changes.
   - What's unclear: Whether 2 iterations suffice or more are needed.
   - Recommendation: Plan for exactly 2 iterations: (1) initial generation + evaluation, (2) prompt revision based on scores + re-evaluation. If weighted score >= 3.5 after iteration 2, accept. If not, a third iteration is allowed but should prompt reconsidering the prompt structure rather than just tweaking wording.

3. **Should the parser extract function bodies or just signatures?**
   - What we know: Lessons need actual source code with "why" explanations. The existing hand-written lessons include 5-15 line code snippets.
   - What's unclear: Whether to include full function bodies (which can be 50+ lines) or just the first N lines.
   - Recommendation: Extract full function bodies but let the prompt template specify which functions to include. The `focus` field in the lesson plan controls scope. The prompt can instruct: "Select the most relevant 5-15 lines from each function."

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` + `node:assert` (built-in, matching Phase 1) |
| Config file | `scripts/run-tests.cjs` (existing GSD test runner) |
| Quick run command | `node --test learn/tests/parser.test.cjs learn/tests/prompt-templates.test.cjs learn/tests/evaluator.test.cjs` |
| Full suite command | `npm test` (runs all tests including Phase 1 + Phase 2) |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-03 | Parser extracts exports, functions, requires from .cjs files | unit | `node --test learn/tests/parser.test.cjs` | Wave 0 |
| CONT-03 | Prompt template injects parsed context correctly | unit | `node --test learn/tests/prompt-templates.test.cjs` | Wave 0 |
| CONT-03 | Generated lesson JSON conforms to Phase 1 schema | unit | `node --test learn/tests/parser.test.cjs` | Wave 0 |
| CONT-04 | Prompt template includes "why" instruction | unit | `node --test learn/tests/prompt-templates.test.cjs` | Wave 0 |
| CONT-05 | Evaluator scores lessons correctly with weighted rubric | unit | `node --test learn/tests/evaluator.test.cjs` | Wave 0 |
| CONT-05 | Evaluator pass/fail threshold works at 3.5 | unit | `node --test learn/tests/evaluator.test.cjs` | Wave 0 |
| MODL-01 | Pipeline generates all Command Lifecycle lessons | integration | `node learn/bin/generate-lessons.cjs && node --test learn/tests/lessons.test.cjs` | Wave 0 |
| MODL-02 | Overview and source-dive templates produce different content structures | unit | `node --test learn/tests/prompt-templates.test.cjs` | Wave 0 |

### Sampling Rate

- **Per task commit:** `node --test learn/tests/parser.test.cjs learn/tests/prompt-templates.test.cjs learn/tests/evaluator.test.cjs`
- **Per wave merge:** `npm test` (full suite including Phase 1 tests)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `learn/tests/parser.test.cjs` -- covers CONT-03 (source parsing accuracy)
- [ ] `learn/tests/prompt-templates.test.cjs` -- covers CONT-03, CONT-04, MODL-02 (template assembly, "why" instructions, template types)
- [ ] `learn/tests/evaluator.test.cjs` -- covers CONT-05 (rubric scoring, threshold)

## Sources

### Primary (HIGH confidence)

- GSD source files in `get-shit-done/bin/lib/*.cjs` -- Direct inspection of 11 CommonJS modules (5,421 total lines) confirming consistent patterns: `module.exports = { ... }`, `require()`, `function` declarations, JSDoc, section separators
- Phase 1 implementation in `learn/` -- Direct inspection of lesson data model, renderer, and content structure
- `.planning/codebase/CONVENTIONS.md` -- Naming patterns, code style, module boundaries confirming regex-tractable parsing
- `.planning/codebase/ARCHITECTURE.md` -- GSD's layered architecture confirming Command Lifecycle as the ideal first module

### Secondary (MEDIUM confidence)

- `.planning/STATE.md` blockers noting "Phase 2 needs survey of GSD's actual CommonJS export patterns before parser design" -- Confirmed: all 11 modules use identical `module.exports = { name1, name2, ... }` pattern at end of file
- `.planning/REQUIREMENTS.md` -- CONT-03, CONT-04, CONT-05, MODL-01, MODL-02 requirement definitions

### Tertiary (LOW confidence)

- None -- all findings verified against actual source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies; same Node.js built-ins as Phase 1; parser targets known, inspected source patterns
- Architecture: HIGH -- builds on proven Phase 1 structure; new modules follow established conventions; lesson JSON schema unchanged
- Pitfalls: HIGH -- informed by actual source file inspection; parser scope explicitly bounded by surveyed patterns
- Prompt engineering: MEDIUM -- prompt template design and rubric thresholds will need iteration (that is the point of the evaluation loop)

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (GSD source patterns stable; no expected changes to CommonJS structure)
