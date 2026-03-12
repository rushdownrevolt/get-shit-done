# Phase 4: Multi-Module Infrastructure - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

gsd-learn can host multiple modules with correct per-module progress tracking, filesystem-driven concept maps, tilde path resolution, and a markdown parser ready to feed lesson generation. No Module 1 content is created here — just the plumbing that Phase 5 builds on.

</domain>

<decisions>
## Implementation Decisions

### Markdown parser scope
- New `markdown-parser.cjs` — parallel to `parser.cjs`, never modify parser.cjs
- Handles command specs (`commands/gsd/*.md`) and workflow files (`workflows/*.md`) only — purpose-built for these two formats
- Not a general-purpose GSD markdown parser — scoped to what Module 1 teaches

### Markdown parser: frontmatter handling
- Parse YAML frontmatter into a JavaScript object (key-value pairs)
- Reuse existing `frontmatter.cjs:extractFrontmatter()` internally
- Prompt templates can reference individual fields (e.g., `{{frontmatter.description}}`, `{{frontmatter.name}}`)

### Markdown parser: XML sections
- Claude's Discretion — pick the extraction format (named map vs array of pairs) based on what makes prompt templates cleanest for teaching these sections in lessons

### Markdown parser: file references
- Extract all `@file:` references into a dedicated array (e.g., `fileReferences: ["~/.claude/get-shit-done/workflows/echo.md"]`)
- Lessons can highlight "this command references these files" as a distinct teaching point

### Markdown parser: code blocks
- Extract fenced code blocks with language annotation
- Claude's Discretion on exact structure

### Prompt template system
- New generic `assembleMarkdownPrompt()` with simple `{{KEY}}` replacement from a flat context object
- Format functions run BEFORE template fill — they prepare the context object, not the template
- Clean separation: formatters produce strings, template just injects them
- **Existing CJS pipeline left untouched** — `assemblePrompt()` stays as-is for CJS templates (separation of concerns, focused architecture — like GSD itself)
- Two parallel systems: `assemblePrompt()` for CJS sources, `assembleMarkdownPrompt()` for markdown sources

### Prompt template: location
- New markdown-specific template (e.g., `markdown-anatomy.prompt.md`) lives in the same `learn/content/prompts/` directory alongside existing templates
- Naming convention distinguishes source type

### Prompt template: error handling
- Fail loudly on missing keys — if a `{{KEY}}` in the template has no matching context value, throw an error
- Catches template/context mismatches during lesson generation rather than producing broken lessons

### Claude's Discretion
- Progress migration strategy (v1→v2 schema, migration UX, messaging)
- Concept map ownership format (how modules define their own concept maps)
- XML section extraction format (named map vs array)
- Code block extraction structure
- Tilde path resolution implementation in verifier
- Module 2 renumbering approach (order field in module.json)
- Default startup behavior (hardcoded Module 1, Lesson 1)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontmatter.cjs:extractFrontmatter()`: Already parses YAML frontmatter — reuse inside markdown-parser.cjs
- `parser.cjs:parseSourceFile()`: Reference for output shape (returns structured object with named fields) — markdown parser follows similar pattern
- `prompt-templates.cjs:assemblePrompt()`: Existing CJS template system — stays untouched, new function added alongside
- `progress.cjs`: Current schema has `version`, `currentModule`, `currentLesson`, `modules: {}` — needs v2 migration for per-module state
- `concept-map.cjs`: Hardcoded `CONCEPT_MAP` constant + `sectionMap` — needs refactoring to load from module definitions
- `verifier.cjs:runVerification()`: Uses `path.join(cwd, artifact.path)` — needs tilde expansion for home-directory paths
- `lessons.cjs:loadModule()`: Loads module by ID from content directory — needs `order` field support for renumbering

### Established Patterns
- Parser modules return structured objects (parser.cjs returns `{ filePath, fileName, moduleDoc, requires, exports, functions, sections, constants }`)
- Zero external dependencies — all parsing is hand-rolled
- CommonJS modules with `module.exports = { func1, func2 }`
- Prompt templates live in `learn/content/prompts/` as `.prompt.md` files

### Integration Points
- `learn/content/modules/command-lifecycle/module.json` — needs `order: 2` field added
- New Module 1 directory: `learn/content/modules/gsd-commands/` (or similar) with `module.json` having `order: 1`
- `learn/lib/prompt-templates.cjs` — add `assembleMarkdownPrompt()` export
- `learn/lib/markdown-parser.cjs` — new file, parallel to parser.cjs
- `learn/bin/generate-lessons.cjs` — will need to use new parser + template for markdown-based lessons (Phase 5)

</code_context>

<specifics>
## Specific Ideas

- User explicitly wants separation of concerns — CJS and markdown pipelines stay independent, "just like GSD"
- The markdown parser is purpose-built for the two file types Module 1 teaches, not a general-purpose solution
- Fail-loud error handling on missing template keys — catch problems during generation, not in the learner's hands

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-multi-module-infrastructure*
*Context gathered: 2026-03-12*
