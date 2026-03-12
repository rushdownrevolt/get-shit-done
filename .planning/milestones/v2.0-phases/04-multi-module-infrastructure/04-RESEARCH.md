# Phase 4: Multi-Module Infrastructure - Research

**Researched:** 2026-03-12
**Domain:** Node.js CJS module architecture, JSON schema migration, markdown parsing, template systems
**Confidence:** HIGH

## Summary

Phase 4 builds the plumbing that lets gsd-learn host multiple modules. The work spans six distinct subsystems: (1) progress schema migration from v1 to v2 with per-module state, (2) module-owned concept map definitions replacing the hardcoded constant, (3) tilde path resolution in the verifier, (4) hardcoded Module 1 default startup, (5) a new purpose-built markdown parser for GSD command specs and workflows, and (6) a generic `{{KEY}}` template system alongside the existing CJS-specific `assemblePrompt()`.

All code is CommonJS with zero external dependencies. The existing codebase uses `node:test` + `node:assert` for testing, hand-rolled parsers, and a filesystem-driven content model (`learn/content/modules/{id}/`). The project has strong separation of concerns -- each `.cjs` file does one thing, exports a small API, and has a corresponding test file.

**Primary recommendation:** Implement as three waves -- (1) infrastructure changes to existing files (progress migration, concept map refactor, verifier tilde expansion, default startup), (2) new markdown parser module, (3) new template system. Each wave is independently testable.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- New `markdown-parser.cjs` -- parallel to `parser.cjs`, never modify parser.cjs
- Handles command specs (`commands/gsd/*.md`) and workflow files (`workflows/*.md`) only -- purpose-built for these two formats
- Not a general-purpose GSD markdown parser -- scoped to what Module 1 teaches
- Parse YAML frontmatter into a JavaScript object (key-value pairs), reuse existing `frontmatter.cjs:extractFrontmatter()` internally
- Extract all `@file:` references into a dedicated array
- Extract fenced code blocks with language annotation
- New generic `assembleMarkdownPrompt()` with simple `{{KEY}}` replacement from a flat context object
- Format functions run BEFORE template fill -- they prepare the context object, not the template
- Existing CJS pipeline left untouched -- `assemblePrompt()` stays as-is for CJS templates
- Two parallel systems: `assemblePrompt()` for CJS sources, `assembleMarkdownPrompt()` for markdown sources
- New markdown-specific template lives in `learn/content/prompts/` directory alongside existing templates
- Fail loudly on missing keys -- throw error if `{{KEY}}` in template has no matching context value

### Claude's Discretion
- Progress migration strategy (v1 to v2 schema, migration UX, messaging)
- Concept map ownership format (how modules define their own concept maps)
- XML section extraction format (named map vs array)
- Code block extraction structure
- Tilde path resolution implementation in verifier
- Module 2 renumbering approach (order field in module.json)
- Default startup behavior (hardcoded Module 1, Lesson 1)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Progress tracking supports per-module state with v1-to-v2 auto-migration (no data loss) | Progress schema migration pattern documented; current v1 schema analyzed; migration function design provided |
| INFRA-02 | Concept map loads from module-owned definitions instead of hardcoded constant | Current hardcoded CONCEPT_MAP analyzed; module.json extension pattern documented |
| INFRA-03 | Verifier resolves `~/` paths for home-directory artifact verification | Current path.join(cwd, artifact.path) analyzed; os.homedir() expansion pattern documented |
| INFRA-04 | gsd-learn starts in Module 1, Lesson 1 by default (hardcoded, no module selection UI) | Current startup flow in gsd-learn.cjs analyzed; module ordering via `order` field documented |
| PIPE-01 | Markdown parser extracts frontmatter, XML sections, code blocks, and file references from .md files | Both target formats (command spec, workflow) analyzed with real examples; extraction patterns documented |
| PIPE-02 | Prompt templates use generic `{{KEY}}` replacement instead of hardcoded per-placeholder chains | Current assemblePrompt() analyzed; new assembleMarkdownPrompt() design documented |
| PIPE-03 | Markdown-specific prompt template exists for teaching .md source files | Template location and naming convention documented; integration with markdown parser output |
| MOD2-01 | Command Lifecycle module renumbered to Module 2 via `order: 2` in module.json (ID unchanged) | Current module.json schema analyzed; order field extension documented |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `fs` | N/A | File I/O for all modules | Zero dependencies project policy |
| Node.js built-in `path` | N/A | Path manipulation | Zero dependencies project policy |
| Node.js built-in `os` | N/A | `os.homedir()` for tilde expansion | Zero dependencies project policy |
| node:test + node:assert | Node 18+ | Testing framework | Already established in all 15 test files |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `get-shit-done/bin/lib/frontmatter.cjs` | Internal | `extractFrontmatter()` for YAML parsing | Reuse inside markdown-parser.cjs for command spec frontmatter |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled YAML parsing | js-yaml npm package | Project has zero-dependency policy; existing extractFrontmatter() works |
| Hand-rolled XML extraction | xml2js or similar | Project has zero-dependency policy; XML sections are simple named blocks, regex suffices |
| Mustache/Handlebars for templates | npm template libraries | Overkill for simple `{{KEY}}` replacement; fail-loud behavior easier to implement custom |

## Architecture Patterns

### Current Project Structure
```
learn/
  bin/
    gsd-learn.cjs          # CLI entry point
    generate-lessons.cjs    # Lesson generation script
  lib/
    parser.cjs              # CJS source file parser (DO NOT MODIFY)
    prompt-templates.cjs    # CJS template system (add new export here)
    progress.cjs            # Progress load/save (modify for v2 migration)
    concept-map.cjs         # Concept map rendering (refactor for module ownership)
    verifier.cjs            # Artifact verification (add tilde expansion)
    lessons.cjs             # Module loader (add order field support)
    markdown-parser.cjs     # NEW: markdown file parser
    ...
  content/
    modules/
      command-lifecycle/    # Existing module (add order: 2 to module.json)
        module.json
        lessons/
        project/
      gsd-commands/         # NEW: Module 1 placeholder (Phase 5 fills content)
        module.json         # order: 1, basic metadata
    prompts/
      overview.prompt.md
      source-dive.prompt.md
      markdown-anatomy.prompt.md  # NEW: markdown-specific template
  tests/
    markdown-parser.test.cjs      # NEW
    ...existing test files...
```

### Pattern 1: Schema Migration on Load
**What:** When `loadProgress()` reads a v1 progress file, it auto-migrates to v2 in memory and writes back.
**When to use:** Any time the persisted schema evolves but existing data must survive.
**Recommendation:**

The current v1 progress.json:
```json
{
  "version": 1,
  "currentModule": "command-lifecycle",
  "currentLesson": 5,
  "modules": {}
}
```

The v2 schema should be:
```json
{
  "version": 2,
  "currentModule": "command-lifecycle",
  "currentLesson": 5,
  "modules": {
    "command-lifecycle": {
      "currentLesson": 5,
      "started": true
    }
  }
}
```

Migration logic in `loadProgress()`:
```javascript
function migrateV1toV2(progress) {
  if (progress.version >= 2) return progress;
  const migrated = { ...progress, version: 2 };
  // Preserve existing module progress
  if (progress.currentModule && !migrated.modules[progress.currentModule]) {
    migrated.modules[progress.currentModule] = {
      currentLesson: progress.currentLesson || 0,
      started: true,
    };
  }
  return migrated;
}
```

Key decisions:
- Migration runs inside `loadProgress()`, transparent to callers
- Migrated data is saved back immediately so migration is one-time
- `currentModule` and `currentLesson` remain as top-level fields (current position)
- `modules` object gains per-module state (lesson position, started flag)

### Pattern 2: Module-Owned Concept Maps
**What:** Each module defines its own concept map content in module.json instead of a hardcoded constant.
**Recommendation:**

Add `conceptMap` and `sectionMap` fields to module.json:
```json
{
  "id": "command-lifecycle",
  "title": "Command Lifecycle",
  "description": "...",
  "order": 2,
  "conceptMap": "  User types /gsd:quick\n        |\n        v\n  +------------------+     ...",
  "sectionMap": {
    "entry-point": "Command Spec",
    "command-spec": "Command Spec",
    "workflow": "Workflow"
  }
}
```

Alternative (recommended -- cleaner): Store concept map as a separate file in the module directory:
```
modules/command-lifecycle/concept-map.txt    # ASCII art
modules/command-lifecycle/module.json        # references concept-map.txt, includes sectionMap
```

Refactor `concept-map.cjs`:
- `renderConceptMap(moduleDir, currentSection)` -- loads from module directory
- Falls back to empty/generic map if file missing
- `sectionMap` stays in module.json (small, structured data)

### Pattern 3: Parallel Parser Architecture
**What:** `markdown-parser.cjs` exists alongside `parser.cjs` with similar output shape but different extraction logic.
**When to use:** When source formats differ fundamentally but downstream consumers expect similar structure.

The markdown parser output shape (recommended):
```javascript
{
  filePath: '/path/to/quick.md',
  fileName: 'quick.md',
  fileType: 'command-spec',  // or 'workflow'
  frontmatter: { name: 'gsd:quick', description: '...', 'allowed-tools': [...] },
  sections: { objective: '...', execution_context: '...', process: '...' },
  fileReferences: ['~/.claude/get-shit-done/workflows/quick.md'],
  codeBlocks: [{ language: 'bash', code: '...' }],
  body: '...',  // full content after frontmatter
}
```

### Pattern 4: Generic Template with Fail-Loud
**What:** `assembleMarkdownPrompt()` uses simple regex replacement but throws on unresolved keys.
**Recommendation:**

```javascript
function assembleMarkdownPrompt(templateName, context) {
  const templatePath = path.join(TEMPLATE_DIR, templateName + '.prompt.md');
  let template = fs.readFileSync(templatePath, 'utf-8');

  // Replace all {{KEY}} with context values
  template = template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
    // Support dotted keys like frontmatter.description
    const value = resolveDottedKey(context, key);
    if (value === undefined) {
      throw new Error('Missing template key: ' + key + ' in template: ' + templateName);
    }
    return String(value);
  });

  return template;
}
```

Key difference from `assemblePrompt()`: no hardcoded replacements, no defaults -- fails on missing keys.

### Anti-Patterns to Avoid
- **Modifying parser.cjs:** User explicitly locked this -- markdown parser is a separate module
- **Modifying assemblePrompt():** Existing CJS pipeline stays untouched -- add new function alongside
- **Adding npm dependencies:** Zero-dependency policy is absolute
- **General-purpose markdown parsing:** The parser handles exactly two formats (command specs and workflows), not arbitrary markdown
- **Renaming module IDs:** The `command-lifecycle` ID must never change (progress.json references it); only the `order` field changes display position

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom YAML parser | `extractFrontmatter()` from `get-shit-done/bin/lib/frontmatter.cjs` | Already handles nested objects, arrays, inline arrays; battle-tested in GSD tooling |
| Home directory detection | Custom path logic | `os.homedir()` | Cross-platform (Windows, macOS, Linux); handles edge cases |
| JSON schema migration | Version-checking scattered across codebase | Single `migrateV1toV2()` in progress.cjs | Centralized, testable, runs once on load |

**Key insight:** The frontmatter parser at `get-shit-done/bin/lib/frontmatter.cjs` already handles the exact YAML format used in GSD command specs. However, it depends on `./core.cjs` for `safeReadFile`, `output`, `error` -- the `extractFrontmatter()` function itself only takes a content string and has no side effects, but you need to either: (a) extract just that function, or (b) require the module and only use `extractFrontmatter`. Option (b) means taking a dependency on `get-shit-done/bin/lib/frontmatter.cjs` which couples learn/ to get-shit-done/. **Recommendation:** Copy the `extractFrontmatter()` function into a local `learn/lib/frontmatter.cjs` utility (it's ~80 lines, pure function, no deps). This maintains learn/'s independence.

## Common Pitfalls

### Pitfall 1: Progress Migration Data Loss
**What goes wrong:** Migration silently drops fields or overwrites existing per-module data.
**Why it happens:** v1 has `currentLesson` at top level AND potentially in `modules` object; migration must reconcile both.
**How to avoid:** Migration function is pure (input -> output), tested with real v1 progress.json shapes. Test with the actual current progress: `{ version: 1, currentModule: "command-lifecycle", currentLesson: 5, modules: {} }`.
**Warning signs:** Tests that only use synthetic data, not real progress shapes.

### Pitfall 2: Tilde Expansion Platform Differences
**What goes wrong:** `~/` expansion works on macOS/Linux but breaks on Windows where home paths use backslashes.
**Why it happens:** Naive string replacement of `~/` with homedir doesn't account for path separators.
**How to avoid:** Use `path.join(os.homedir(), artifact.path.replace(/^~[\/\\]/, ''))` -- let `path.join` handle separator normalization.
**Warning signs:** Tests that hardcode `/` in paths.

### Pitfall 3: frontmatter.cjs Dependency Chain
**What goes wrong:** Requiring `get-shit-done/bin/lib/frontmatter.cjs` pulls in `core.cjs` which has side effects and different error handling.
**Why it happens:** The frontmatter module was built for CLI use with `output()` and `error()` from core.cjs.
**How to avoid:** Copy the pure `extractFrontmatter()` function into learn/lib/frontmatter.cjs. It has zero external deps -- just string parsing.
**Warning signs:** `require()` paths that reach outside `learn/` directory.

### Pitfall 4: XML Section Regex Greediness
**What goes wrong:** Regex like `<purpose>(.*)</purpose>` matches across multiple sections.
**Why it happens:** Greedy `.` with `s` flag (dotall) matches too much.
**How to avoid:** Use non-greedy `[\s\S]*?` pattern: `<(\w+)>([\s\S]*?)<\/\1>`.
**Warning signs:** Test with files that have multiple XML sections (command specs have objective, execution_context, context, process).

### Pitfall 5: Template Key Collision
**What goes wrong:** `{{KEY}}` replacement hits literal double-braces in code examples within templates.
**Why it happens:** Template contains code samples that show `{{...}}` syntax.
**How to avoid:** The `assembleMarkdownPrompt` pattern `\{\{(\w+(?:\.\w+)*)\}\}` only matches word characters and dots -- won't match `{{...}}` with special chars. But be aware if template keys could appear in example code.
**Warning signs:** Templates that teach about template syntax.

### Pitfall 6: Module Order vs Module ID Confusion
**What goes wrong:** Code uses `order` field as array index or assumes order is contiguous.
**Why it happens:** `order: 1` and `order: 2` seem like indices.
**How to avoid:** `order` is only for display sorting. Module lookup is always by ID string. Never use `order` as an index.
**Warning signs:** Code like `modules[order - 1]`.

## Code Examples

### GSD Command Spec Format (Real Example: echo.md)
```markdown
---
name: gsd:echo
description: Repeat text back to user.
allowed-tools:
  - Read
  - Bash
---

<objective>
Simply repeat text back to user.
</objective>

<execution_context>
@C:/Users/18182/.claude/get-shit-done/workflows/echo.md
</execution_context>

<process>
Execute the echo workflow from @C:/Users/18182/.claude/get-shit-done/workflows/echo.md end-to-end.
</process>
```

### GSD Workflow Format (Real Example: echo.md)
```markdown
<purpose>
Validate `.planning/` directory integrity and report actionable issues.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>
<step name="parse_args">
**Parse arguments:**
</step>

<step name="run_echo_command">
**Run health validation:**

` `` bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs echo"
` ``
</step>
</process>
```

Key differences between formats:
- **Command specs** have YAML frontmatter; workflows do not
- **Command specs** have top-level XML sections (objective, execution_context, context, process)
- **Workflows** have XML sections including nested `<step>` elements within `<process>`
- **Both** can contain `@file:` references and fenced code blocks
- **Both** use `<purpose>` or `<objective>` as their main description section

### XML Section Extraction (Recommended: Named Map)
```javascript
function extractXmlSections(content) {
  const sections = {};
  const regex = /<(\w+)>([\s\S]*?)<\/\1>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const tag = match[1];
    const body = match[2].trim();
    // Handle duplicate tags by converting to array
    if (sections[tag]) {
      if (!Array.isArray(sections[tag])) {
        sections[tag] = [sections[tag]];
      }
      sections[tag].push(body);
    } else {
      sections[tag] = body;
    }
  }
  return sections;
}
```

Rationale for named map over array: Templates reference sections by name (`{{sections.objective}}`), making named access essential. Array would require filtering.

Note: Nested `<step>` elements within `<process>` will be included in the process body as raw text. The parser does not need to recursively parse steps -- the template can present the process section as-is for teaching purposes.

### Tilde Path Resolution
```javascript
function resolvePath(cwd, artifactPath) {
  if (artifactPath.startsWith('~/') || artifactPath.startsWith('~\\')) {
    return path.join(os.homedir(), artifactPath.slice(2));
  }
  return path.join(cwd, artifactPath);
}
```

### File Reference Extraction
```javascript
function extractFileReferences(content) {
  const refs = [];
  const regex = /@([^\s<>]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const ref = match[1];
    // Filter to file-like references (contain path separators or file extensions)
    if (ref.includes('/') || ref.includes('\\') || ref.includes('.')) {
      refs.push(ref);
    }
  }
  return refs;
}
```

### Code Block Extraction
```javascript
function extractCodeBlocks(content) {
  const blocks = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push({
      language: match[1] || null,
      code: match[2].trim(),
    });
  }
  return blocks;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded CONCEPT_MAP constant | Module-owned concept map files | Phase 4 | Each module defines its own architecture diagram |
| Single module hardcoded to command-lifecycle | Order-based module system with default start | Phase 4 | Enables multi-module without discovery UI |
| Hardcoded per-placeholder template replacement | Generic `{{KEY}}` replacement with fail-loud | Phase 4 | New markdown templates don't need code changes |
| CJS-only source parsing | CJS parser + markdown parser (parallel) | Phase 4 | Enables Module 1 to teach .md files |

## Open Questions

1. **frontmatter.cjs location strategy**
   - What we know: The existing `extractFrontmatter()` in `get-shit-done/bin/lib/frontmatter.cjs` works for command spec YAML. It depends on `./core.cjs`.
   - What's unclear: Whether to copy the function or create a thin wrapper.
   - Recommendation: Copy just `extractFrontmatter()` (~80 lines) into `learn/lib/frontmatter.cjs` to keep learn/ self-contained. The function is pure -- takes string, returns object.

2. **Concept map file format**
   - What we know: Current map is a JS string constant with ASCII art.
   - What's unclear: Whether to store as `.txt` file or as a field in module.json.
   - Recommendation: Store as `concept-map.txt` in the module directory. ASCII art is multi-line and awkward in JSON. Keep `sectionMap` in module.json (small, structured).

3. **Workflow nested step parsing depth**
   - What we know: Workflows have `<step name="...">` nested inside `<process>`.
   - What's unclear: Whether the parser should extract individual steps or treat process as a flat block.
   - Recommendation: Extract the outer `<process>` section as-is (including step tags). Individual step parsing can be added later if needed. The teaching value is in showing the overall structure, not parsing every step.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test + node:assert (built-in, Node 18+) |
| Config file | None -- uses built-in test runner |
| Quick run command | `node --test learn/tests/{file}.test.cjs` |
| Full suite command | `node --test learn/tests/*.test.cjs` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | v1-to-v2 progress migration preserves data | unit | `node --test learn/tests/progress.test.cjs` | Exists (needs new tests) |
| INFRA-02 | Concept map loads from module directory | unit | `node --test learn/tests/concept-map.test.cjs` | Exists (needs rewrite) |
| INFRA-03 | Verifier resolves `~/` paths to home dir | unit | `node --test learn/tests/verifier.test.cjs` | Exists (needs new tests) |
| INFRA-04 | Default startup loads Module 1, Lesson 1 | integration | `node --test learn/tests/lessons.test.cjs` | Exists (needs new tests) |
| PIPE-01 | Markdown parser extracts frontmatter, XML, code blocks, file refs | unit | `node --test learn/tests/markdown-parser.test.cjs` | New file needed |
| PIPE-02 | assembleMarkdownPrompt replaces keys, throws on missing | unit | `node --test learn/tests/prompt-templates.test.cjs` | Exists (needs new tests) |
| PIPE-03 | Markdown-specific prompt template file exists and works | unit | `node --test learn/tests/prompt-templates.test.cjs` | Exists (needs new tests) |
| MOD2-01 | Command Lifecycle module.json has order: 2 | unit | `node --test learn/tests/lessons.test.cjs` | Exists (needs new tests) |

### Sampling Rate
- **Per task commit:** `node --test learn/tests/{changed-file}.test.cjs`
- **Per wave merge:** `node --test learn/tests/*.test.cjs`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `learn/tests/markdown-parser.test.cjs` -- covers PIPE-01 (new file)
- [ ] `learn/lib/frontmatter.cjs` -- local copy of extractFrontmatter for learn/ independence
- [ ] New test cases in `progress.test.cjs` for v1-to-v2 migration
- [ ] New test cases in `verifier.test.cjs` for tilde path resolution
- [ ] New test cases in `concept-map.test.cjs` for module-owned concept maps
- [ ] New test cases in `prompt-templates.test.cjs` for assembleMarkdownPrompt
- [ ] New test cases in `lessons.test.cjs` for order field sorting

## Sources

### Primary (HIGH confidence)
- Direct code analysis of `learn/lib/progress.cjs` -- current v1 schema shape, load/save API
- Direct code analysis of `learn/lib/concept-map.cjs` -- hardcoded CONCEPT_MAP, sectionMap, renderConceptMap API
- Direct code analysis of `learn/lib/verifier.cjs` -- path.join(cwd, artifact.path) pattern, verifyArtifact/runVerification API
- Direct code analysis of `learn/lib/prompt-templates.cjs` -- assemblePrompt with hardcoded replacements
- Direct code analysis of `learn/lib/parser.cjs` -- parseSourceFile output shape (reference for markdown parser)
- Direct code analysis of `learn/lib/lessons.cjs` -- loadModule with module.json schema
- Direct code analysis of `learn/bin/gsd-learn.cjs` -- CLI entry point, moduleId default, startup flow
- Direct code analysis of `get-shit-done/bin/lib/frontmatter.cjs` -- extractFrontmatter implementation
- Real GSD command spec: `~/.claude/commands/gsd/echo.md`, `~/.claude/commands/gsd/quick.md`
- Real GSD workflow: `~/.claude/get-shit-done/workflows/echo.md`, `~/.claude/get-shit-done/workflows/quick.md`
- Current progress.json: `{ version: 1, currentModule: "command-lifecycle", currentLesson: 5, modules: {} }`
- Current module.json: `{ id: "command-lifecycle", title: "Command Lifecycle", description: "..." }`
- All 15 existing test files verified using `node:test` + `node:assert` pattern

### Secondary (MEDIUM confidence)
- None needed -- all findings based on direct code analysis

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero-dependency CJS codebase fully analyzed, all source files read
- Architecture: HIGH -- all six subsystems have clear existing code to modify or parallel
- Pitfalls: HIGH -- identified from real code patterns and cross-platform concerns

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable -- internal codebase, no external dependency churn)
