# Technology Stack

**Project:** GSD Learn
**Researched:** 2026-03-11

## Recommended Stack

The defining constraint is **zero runtime dependencies**, matching GSD's own philosophy. Every recommendation below uses only Node.js built-in modules. This is not a limitation -- Node.js 18+ provides everything needed for an interactive CLI learning tool.

### Core Runtime

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js | >= 18.0.0 | Runtime | Raises GSD's 16.7.0 floor to get `readline/promises`, stable `node:test`, and `util.styleText`. GSD Learn is an internal tool, not a published package -- it can require a modern Node. |
| CommonJS (.cjs) | N/A | Module format | Matches GSD's existing module system. No ESM conversion needed; interoperability with all GSD source files being parsed. |

**Why Node.js >= 18 instead of >= 16.7.0:** GSD's published package must support 16.7.0 for broad compatibility. GSD Learn is an internal development tool that only runs in the contributor's own environment. Node 18 is the oldest LTS still receiving security updates. The `readline/promises` API (stable in 18+) eliminates callback nesting in interactive prompts, and `node:test` is fully stable for testing.

### Terminal UI (Built-in)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `readline` | Built-in | User input, navigation, keypress handling | GSD already uses this in `install.js`. Handles line-by-line input, question prompts, and raw keypress events. |
| `readline/promises` | Built-in (18+) | Async prompt flow | Promise-based API avoids callback nesting for multi-step lesson interactions. Falls back to callback `readline` on older Node. |
| ANSI escape codes | N/A | Colors, formatting, cursor control | GSD already uses raw ANSI in `install.js` (`\x1b[36m` etc.). No chalk/kleur needed. Wrap in a tiny utility module for reuse. |
| `process.stdout` | Built-in | Screen rendering | Direct write for full terminal control. Supports `columns`/`rows` for layout, `isTTY` for capability detection. |

**Confidence: HIGH** -- These are the same APIs GSD already uses. No new concepts.

### Terminal Interaction Patterns

| Pattern | Implementation | Purpose |
|---------|---------------|---------|
| Paged content | `process.stdout.rows` to calculate page size, keypress listener for navigation | Lessons longer than terminal height need pagination |
| Progress indicators | ANSI cursor movement (`\x1b[A`, `\x1b[2K`) | Show lesson progress without full screen redraws |
| Syntax highlighting | Regex-based ANSI coloring for JS keywords | Highlight code snippets in lesson content. Simple token matching, not full parsing. |
| Raw mode | `process.stdin.setRawMode(true)` | Single-keypress navigation (Enter to continue, arrow keys for menus) |

### Source File Parsing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `fs.readFileSync` | Built-in | Read GSD source files | Synchronous matches GSD's patterns. Source files are small (<50KB each). |
| Regex + string parsing | N/A | Extract code structure, comments, exports | GSD source is simple CommonJS. AST parsing (acorn, etc.) is overkill and would add a dependency. Regex reliably extracts: function names from `module.exports`, JSDoc comments, section separators (`// ---`), require statements. |
| `path` | Built-in | Cross-platform file resolution | Already used throughout GSD. Essential for Windows compatibility. |

**Why NOT use an AST parser (acorn, babel, etc.):**
1. Adds a runtime dependency, violating the zero-dependency constraint
2. GSD's code follows consistent conventions (documented in CONVENTIONS.md) that make regex parsing reliable
3. We're extracting structure (function names, exports, comments), not transforming code
4. If parsing needs grow complex later, `node --experimental-vm-modules` or the built-in `vm` module can evaluate simple patterns

**Confidence: HIGH** -- Regex parsing of consistently-formatted CommonJS is a well-understood pattern.

### Progress Persistence

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| JSON file | N/A | Progress state storage | GSD already stores all state as JSON files in `.planning/`. Same pattern: `fs.readFileSync` / `fs.writeFileSync` with `JSON.parse` / `JSON.stringify`. |
| `.planning/learn/` | N/A | Progress directory | Follows GSD's convention of `.planning/` for project state. Git-tracked so progress is portable. |

**Progress file structure:**
```json
{
  "version": 1,
  "currentModule": "command-lifecycle",
  "modules": {
    "command-lifecycle": {
      "started": "2026-03-11T10:00:00Z",
      "currentLesson": 3,
      "completedLessons": [1, 2],
      "miniProject": {
        "status": "not-started"
      }
    }
  }
}
```

**Why NOT SQLite/LevelDB/etc.:**
1. Runtime dependency
2. Single user, small dataset (tens of lessons, not thousands of records)
3. JSON is human-readable and git-diffable, matching GSD's transparency philosophy
4. No concurrent writes to worry about

**Confidence: HIGH** -- This is exactly how GSD stores config and state today.

### Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `node:test` | Built-in (18+) | Test runner | GSD already uses this. Built-in, zero dependencies, adequate for unit and integration tests. |
| `node:assert` | Built-in | Assertions | GSD already uses this. `assert.strictEqual`, `assert.deepStrictEqual`, `assert.throws` cover all needs. |
| `c8` | ^11.0.0 | Coverage (dev only) | Already in GSD's devDependencies. Measures test coverage without adding runtime weight. |

**Confidence: HIGH** -- Identical to GSD's existing test setup.

### Content Generation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Template strings | N/A | Lesson text generation | JavaScript template literals with embedded ANSI codes. No templating engine needed for single-format terminal output. |
| Regex extractors | N/A | Pull content from source files | Module-specific regex patterns to extract: function signatures, JSDoc blocks, require graphs, export lists, inline comments. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Colors | Raw ANSI escape codes | chalk, kleur, picocolors | Runtime dependency. GSD already uses raw ANSI. Wrapping in a 20-line utility module gives the same DX. |
| Prompts | readline (built-in) | inquirer, prompts, enquirer | Runtime dependency. Massive overkill for "press Enter to continue" and simple menu selection. |
| Argument parsing | Manual `process.argv` parsing | yargs, commander, meow | Runtime dependency. GSD Learn has minimal CLI args (maybe `--module`, `--reset`). A 10-line parser suffices. |
| Terminal UI | Raw ANSI + readline | blessed, ink, neo-blessed | Runtime dependency. Adds React-like complexity for what is essentially paginated text with navigation. |
| Source parsing | Regex | acorn, @babel/parser, tree-sitter | Runtime dependency. GSD's consistent code style makes regex reliable for structural extraction. |
| Data storage | JSON files | SQLite, lowdb, conf | Runtime dependency. Single-user, small dataset, human-readable state files. |
| Markdown rendering | Custom ANSI renderer | marked-terminal, terminal-markdown | Runtime dependency. Lesson content is generated (not user-authored markdown), so we control the format. A simple renderer for headers, code blocks, and bold is ~50 lines. |
| Testing | node:test | jest, vitest, mocha | Runtime dependency (dev). GSD already uses node:test successfully. Consistency matters more than features. |

## Architecture-Relevant Stack Decisions

### Lesson Content Pipeline

```
GSD Source Files (.cjs, .md)
    |
    v
Regex Extractors (per-module patterns)
    |
    v
Content Model (structured JS objects)
    |
    v
Terminal Renderer (ANSI-formatted strings)
    |
    v
Paged Display (readline keypress navigation)
```

**Why this pipeline matters for stack:** Every stage uses built-in Node.js. No compile step. No templating engine. Content regenerates on every run, so lessons always reflect current source code.

### Terminal Rendering Utility Module

A small utility module (~100 lines) wrapping ANSI codes, following GSD's `install.js` pattern:

```javascript
// learn/lib/terminal.cjs
const COLORS = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  underline: '\x1b[4m',
  reset: '\x1b[0m',
};

function colorize(text, color) {
  return COLORS[color] + text + COLORS.reset;
}

function heading(text) {
  return '\n' + COLORS.bold + COLORS.cyan + text + COLORS.reset + '\n';
}

function codeBlock(code, language) {
  const lines = code.split('\n').map(l => COLORS.dim + '  ' + l + COLORS.reset);
  return lines.join('\n');
}

module.exports = { COLORS, colorize, heading, codeBlock };
```

### Argument Parsing

A minimal parser matching GSD's own patterns:

```javascript
// learn/bin/gsd-learn.cjs
const args = process.argv.slice(2);
const flags = {};
const positional = [];
for (const arg of args) {
  if (arg.startsWith('--')) {
    const [key, val] = arg.slice(2).split('=');
    flags[key] = val || true;
  } else {
    positional.push(arg);
  }
}
```

Expected commands: `gsd-learn` (start/resume), `gsd-learn --module=command-lifecycle`, `gsd-learn --reset`, `gsd-learn --status`.

## Installation

```bash
# No runtime dependencies to install.

# Dev dependencies (already present in GSD)
npm install -D c8 esbuild
```

GSD Learn lives inside the GSD repo. No separate package.json. No additional npm install. The `bin` entry or a simple script alias launches it.

## Node.js Version Strategy

| Feature Needed | Minimum Node Version | Used By |
|----------------|---------------------|---------|
| `readline` | 0.x | User prompts |
| `fs.readFileSync` | 0.x | File reading |
| `readline/promises` | 17.0 (stable 18.0) | Async prompts |
| `node:test` | 18.0 (stable) | Testing |
| `process.stdout.columns` | 0.x | Terminal width |
| `process.stdin.setRawMode` | 0.x | Keypress handling |
| `util.styleText` | 21.7 (stable) | Optional: built-in color API |

**Recommendation:** Target Node.js >= 18.0.0. This is conservative (18 is a past LTS) while unlocking the async readline and stable test runner. Do NOT require Node 21+ just for `util.styleText` -- raw ANSI codes work everywhere and match GSD's existing patterns.

**Confidence: MEDIUM** -- The Node 18 floor is opinionated. If the learner runs Node 16, they'll need to upgrade. This is acceptable for an internal dev tool.

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| TypeScript | GSD is JavaScript. Adding a compile step for an internal tool creates friction and diverges from the codebase being taught. |
| React/Ink | Terminal UI framework overkill. Adds React dependency tree for what is essentially paginated text. |
| chalk/kleur/picocolors | Even "tiny" color libraries are unnecessary when raw ANSI codes work and GSD already uses them. |
| inquirer/prompts | Interactive prompt libraries handle edge cases (autocomplete, validation) that GSD Learn doesn't need. Simple readline covers it. |
| Any database | JSON files in `.planning/` are the right storage for single-user progress tracking. |
| ESM modules | GSD is CommonJS. Teaching GSD with a different module system would be confusing. |
| Any bundler for production | The tool runs from source. No build step needed for CommonJS. |
| marked/markdown-it | Lesson content is generated, not parsed from markdown. Control the output format directly. |

## Confidence Assessment

| Decision | Confidence | Rationale |
|----------|------------|-----------|
| Zero runtime dependencies | HIGH | Explicit constraint from PROJECT.md. GSD proves this works at scale. |
| Node.js built-in readline | HIGH | GSD already uses this for interactive prompts in install.js. |
| Raw ANSI escape codes | HIGH | GSD already uses this pattern. Well-understood, no abstraction needed. |
| Regex source parsing | HIGH | GSD's consistent coding conventions (documented) make regex reliable. |
| JSON file progress storage | HIGH | Matches GSD's existing state management pattern exactly. |
| Node >= 18 floor | MEDIUM | Opinionated for an internal tool. Justified by readline/promises and node:test. |
| No AST parser | MEDIUM | Correct for MVP. If lesson content needs deeper code analysis later, may revisit. |

## Sources

- GSD `package.json` -- zero production dependencies, Node >= 16.7.0 engine requirement
- GSD `bin/install.js` -- existing readline and ANSI color patterns
- GSD `.planning/codebase/STACK.md` -- built-in module usage documentation
- GSD `.planning/codebase/CONVENTIONS.md` -- code style consistency that enables regex parsing
- GSD `.planning/PROJECT.md` -- zero-dependency constraint, terminal-only requirement
- Node.js documentation for `readline`, `readline/promises`, `node:test` (training data, MEDIUM confidence on exact version availability boundaries)

---

*Stack research: 2026-03-11*
