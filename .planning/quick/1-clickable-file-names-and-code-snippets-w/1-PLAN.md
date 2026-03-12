---
phase: quick-1
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - learn/lib/terminal.cjs
  - learn/lib/renderer.cjs
  - learn/content/modules/command-lifecycle/lessons/02-entry-point.json
  - learn/content/modules/command-lifecycle/lessons/03-dispatch.json
  - learn/content/modules/command-lifecycle/lessons/04-tool-modules.json
  - learn/content/modules/command-lifecycle/lessons/05-state-and-config.json
  - learn/tests/terminal.test.cjs
  - learn/tests/renderer.test.cjs
autonomous: true
requirements: [QUICK-1]

must_haves:
  truths:
    - "Code snippets in lessons show line numbers in a left gutter"
    - "Key lines (from highlight array) are visually distinct via ANSI background color"
    - "Code snippets with a source file show a clickable header that opens VS Code at the right line"
    - "Terminals without OSC 8 support see plain text file paths (graceful degradation)"
  artifacts:
    - path: "learn/lib/terminal.cjs"
      provides: "oscLink() helper and renderCodeBlock() with line numbers + highlights"
      exports: ["oscLink", "renderCodeBlock"]
    - path: "learn/lib/renderer.cjs"
      provides: "Updated code section rendering using renderCodeBlock with clickable header"
    - path: "learn/content/modules/command-lifecycle/lessons/02-entry-point.json"
      provides: "source field on code sections referencing bin/gsd-tools.cjs with startLine"
  key_links:
    - from: "learn/lib/renderer.cjs"
      to: "learn/lib/terminal.cjs"
      via: "imports oscLink, renderCodeBlock"
      pattern: "require.*terminal"
    - from: "learn/lib/renderer.cjs"
      to: "lesson JSON code sections"
      via: "reads section.source, section.highlight"
      pattern: "section\\.source"
---

<objective>
Add clickable file names and line-referenced code snippets to the GSD Learn terminal UI.

Purpose: When lessons reference source files, users can click to open them in VS Code and see which lines matter via highlighted gutter line numbers.
Output: Updated terminal.cjs with OSC 8 + code block helpers, updated renderer.cjs using them, lesson JSON files with source metadata.
</objective>

<execution_context>
@C:/Users/18182/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/18182/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@learn/lib/terminal.cjs
@learn/lib/renderer.cjs
@learn/tests/terminal.test.cjs
@learn/tests/renderer.test.cjs
@learn/content/modules/command-lifecycle/lessons/02-entry-point.json

<interfaces>
<!-- Existing terminal.cjs exports used by renderer -->
From learn/lib/terminal.cjs:
```javascript
const COLORS = { reset, bold, dim, underline, red, green, yellow, blue, magenta, cyan, white };
function style(text, ...styles) // returns ANSI-styled text, noop if !useColor
function highlightJS(code)      // JS syntax highlighting with ANSI
const useColor;                 // boolean: whether TTY supports color
// Also exports _styleWithColor, _styleNoColor, _highlightJSWithColor, _highlightJSNoColor for testing
```

From learn/lib/renderer.cjs:
```javascript
function renderLesson(lesson, currentIndex, totalLessons) // pure function -> string
// Code block rendering at lines 61-67:
//   style('    \u2502 ', 'dim') prefix, highlightJS on value, split by newlines
```

Lesson JSON code section schema (current):
```json
{ "type": "code", "language": "javascript", "value": "...", "highlight": [4, 5] }
```
<!-- highlight is 1-based line numbers within the snippet -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add OSC 8 hyperlink and code block rendering to terminal.cjs</name>
  <files>learn/lib/terminal.cjs, learn/tests/terminal.test.cjs</files>
  <behavior>
    - oscLink(url, displayText) returns OSC 8 escaped string when useColor is true
    - oscLink(url, displayText) returns plain displayText when useColor is false
    - _oscLinkWithColor(url, displayText) always returns OSC 8 string (for testing)
    - renderCodeBlock(code, options) returns string with line number gutter (right-aligned, dim)
    - renderCodeBlock with highlight array marks those lines with yellow background (\x1b[43m)
    - renderCodeBlock without highlight renders all lines in normal style
    - Line numbers are 1-based by default, or start from options.startLine if provided
    - _renderCodeBlockWithColor and _renderCodeBlockNoColor for testing (follow existing pattern)
  </behavior>
  <action>
Add to terminal.cjs:

1. `oscLink(url, displayText)` function:
   - If `!useColor`, return `displayText` (graceful degradation per user decision)
   - Otherwise return `\x1b]8;;${url}\x1b\\${displayText}\x1b]8;;\x1b\\`
   - Export `_oscLinkWithColor` (always applies OSC 8) and `_oscLinkNoColor` (returns displayText) for testing

2. Add `COLORS.bgYellow = '\x1b[43m'` for highlighted line background.

3. `renderCodeBlock(code, options)` function:
   - `options`: `{ highlight: number[], startLine: number }` (all optional)
   - Split code by `\n`, compute gutter width from max line number
   - For each line: `{gutterNum} | {highlightJS(line)}`
   - Gutter number right-aligned, styled dim
   - If line number is in `highlight` array, prefix the entire line with `COLORS.bgYellow` and append `COLORS.reset`
   - If `!useColor`, render plain line numbers without ANSI
   - Export `_renderCodeBlockWithColor` and `_renderCodeBlockNoColor` following existing test helper pattern

Add corresponding tests to terminal.test.cjs following existing test patterns (node:test, assert). Test both the forced-color and no-color variants.
  </action>
  <verify>
    <automated>node --test learn/tests/terminal.test.cjs</automated>
  </verify>
  <done>oscLink produces OSC 8 sequences, renderCodeBlock produces line-numbered gutter output with highlighted lines, all tests pass</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Update renderer to use clickable headers and line-numbered code blocks</name>
  <files>learn/lib/renderer.cjs, learn/tests/renderer.test.cjs, learn/content/modules/command-lifecycle/lessons/02-entry-point.json, learn/content/modules/command-lifecycle/lessons/03-dispatch.json, learn/content/modules/command-lifecycle/lessons/04-tool-modules.json, learn/content/modules/command-lifecycle/lessons/05-state-and-config.json</files>
  <behavior>
    - Code sections with source field render a clickable file header above the code block
    - Code sections without source field render code block with no header (backward compatible)
    - The clickable header uses oscLink with vscode://file/{absolutePath}:{startLine} URI
    - Code blocks use renderCodeBlock instead of manual line joining
    - Highlight array is passed through to renderCodeBlock
  </behavior>
  <action>
**Part A: Update renderer.cjs code block rendering (lines 61-67)**

Replace the existing code block rendering in renderLesson with:

1. Import `oscLink` and `renderCodeBlock` from terminal.cjs (add to existing require)
2. For `section.type === 'code'`:
   - If `section.source` exists (object with `file` and optional `startLine`):
     - Compute absolute path: `path.resolve(process.cwd(), section.source.file)`
     - Build VS Code URI: `vscode://file/${absolutePath}:${startLine || 1}`
     - Display text: `section.source.file:${startLine || 1}` (relative path + line)
     - Render header: `oscLink(uri, displayText)` styled dim+underline, on its own line
   - Call `renderCodeBlock(section.value, { highlight: section.highlight, startLine: section.source?.startLine || 1 })`
   - Push result with trailing newline

**Part B: Add source metadata to lesson JSON files**

Add `"source"` field to code sections in lessons 02-05 where code comes from real GSD files:
- 02-entry-point.json: code sections reference `"file": "bin/gsd-tools.cjs"` with appropriate `startLine` values (approximate line numbers where these snippets appear in the real file)
- 03-dispatch.json: same pattern for dispatch code
- 04-tool-modules.json: reference appropriate lib files
- 05-state-and-config.json: reference appropriate lib files

Schema for source field: `{ "file": "relative/path.cjs", "startLine": 10 }`
Only add source to code sections that genuinely come from real files. If a code snippet is illustrative/synthetic, omit source.

**Part C: Update renderer tests**

Add tests to renderer.test.cjs:
- Test that a code section with `source: { file: "bin/gsd-tools.cjs", startLine: 10 }` produces output containing the file path text
- Test that a code section without source still renders correctly (backward compat)
- Test that highlight array values appear in rendered output with line numbers
  </action>
  <verify>
    <automated>node --test learn/tests/renderer.test.cjs && node --test learn/tests/terminal.test.cjs</automated>
  </verify>
  <done>Code blocks in lessons show line-numbered gutter with highlighted key lines. Code sections with source metadata display a clickable file header using OSC 8 vscode:// URIs. Lessons without source field render identically to before. All tests pass.</done>
</task>

</tasks>

<verification>
1. `node --test learn/tests/terminal.test.cjs` -- all terminal tests pass including new oscLink and renderCodeBlock tests
2. `node --test learn/tests/renderer.test.cjs` -- all renderer tests pass including clickable header and line number tests
3. `node --test learn/tests/` -- full test suite passes with no regressions
4. Manual spot check: `node learn/cli.cjs start command-lifecycle` and navigate to lesson 2 -- code blocks show line numbers, highlighted lines are visually distinct, file header is visible above code
</verification>

<success_criteria>
- Code snippets display line numbers in a dim gutter
- Highlighted lines (from JSON highlight array) have yellow background
- Code sections with source field show clickable file path header (OSC 8 vscode:// link)
- Terminals without color support see plain text (no escape sequence garbage)
- All existing tests continue to pass (no regressions)
</success_criteria>

<output>
After completion, create `.planning/quick/1-clickable-file-names-and-code-snippets-w/1-SUMMARY.md`
</output>
