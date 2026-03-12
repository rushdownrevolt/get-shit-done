# Phase 1: Interactive Learning Shell - Research

**Researched:** 2026-03-11
**Domain:** Node.js CLI interactive terminal application (zero dependencies)
**Confidence:** HIGH

## Summary

Phase 1 builds a working CLI tool (`gsd-learn`) that displays hand-written lesson content with ANSI formatting, allows forward/backward navigation through numbered lessons, persists progress across sessions via JSON, shows an ASCII concept map of GSD's architecture, and handles errors gracefully. This phase uses hand-written content only -- no source parsing or auto-generation (that is Phase 2).

The technical domain is straightforward: Node.js built-in `readline` for keypress handling, raw ANSI escape codes for terminal formatting (matching GSD's existing `install.js` patterns), `fs` for JSON progress persistence, and `process.stdout` for rendering. The project's zero-runtime-dependency constraint means everything must use Node.js built-ins. The main risk is the Terminal UI complexity trap (spending too much time on rendering polish instead of lesson content quality).

**Primary recommendation:** Build a simple paginated text renderer with ANSI colors, readline-based navigation (n/p/q keys), JSON file progress tracking in `.planning/learn/progress.json`, and 3-5 hand-written placeholder lessons for the Command Lifecycle module. Keep the UI minimal -- think `man` pages with color, not a TUI framework.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISP-01 | Terminal output uses ANSI formatting for colors, spacing, and code blocks | Raw ANSI escape codes via `\x1b[` sequences; wrap in small `terminal.cjs` utility module matching GSD's `install.js` pattern |
| DISP-02 | Relevant GSD source code is displayed inline within lessons with line highlighting | Hand-written lessons embed code blocks with ANSI syntax highlighting (simple keyword coloring via regex); actual source file reading deferred to Phase 2 |
| DISP-03 | Current position indicator shows "Lesson N of M" and module progress | Rendered as part of lesson header using progress tracker state |
| CONT-01 | Each lesson has clear instructions: what you'll learn, what to do, what success looks like | Lesson data model includes `objective`, `content`, and `successCriteria` fields; rendered with distinct ANSI styling |
| CONT-02 | Lessons are numbered and ordered within modules with defined progression | Lessons stored as ordered array in module definition JSON; numbered by array index |
| PROG-01 | Learning progress persists across terminal sessions via local JSON storage | `.planning/learn/progress.json` with module/lesson tracking; read on startup, write on navigation |
| PROG-02 | Graceful error handling with helpful messages for common mistakes | Top-level try/catch in entry point; specific checks for: not in GSD repo, missing lesson files, corrupted progress JSON |
| PROG-03 | ASCII concept map shows where current lesson fits in overall GSD architecture | Static ASCII art string per lesson with "YOU ARE HERE" marker; stored in lesson data |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `readline` | Built-in | Keypress handling, raw mode stdin | GSD already uses readline in install.js; handles single-key navigation without dependencies |
| Node.js built-in `fs` | Built-in | Read lesson files, read/write progress JSON | Synchronous API matches GSD's patterns; `readFileSync`/`writeFileSync` |
| Node.js built-in `path` | Built-in | Cross-platform file path resolution | Required for Windows compatibility; GSD uses this everywhere |
| Node.js built-in `process` | Built-in | stdout/stdin for rendering, argv for CLI args | `process.stdout.columns`/`rows` for layout, `isTTY` for capability detection |
| Raw ANSI escape codes | N/A | Terminal colors, bold, dim, reset | GSD's `install.js` already uses `\x1b[36m` etc. No chalk/kleur needed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:test` | Built-in (18+) | Unit and integration tests | All test files |
| `node:assert` | Built-in | Test assertions | Inside test functions |
| `c8` | ^11.0.0 (devDep) | Code coverage | Already in GSD's devDependencies |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw ANSI codes | `util.styleText` (Node 20.12+) | Requires Node 20+; GSD targets 16.7+ and already uses raw ANSI in install.js. Not worth the version bump. |
| Raw ANSI codes | chalk/kleur/picocolors | Runtime dependency violates project constraint. Raw codes are 20 lines of utility. |
| `readline` | inquirer/prompts | Runtime dependency. Massive overkill for "press n/p/q" navigation. |
| Manual argv parsing | yargs/commander | Runtime dependency. GSD Learn has 2-3 flags maximum. |

**Installation:**
```bash
# No runtime dependencies to install. Zero.
# Dev dependencies already present in GSD:
npm install  # c8 and esbuild already in devDependencies
```

## Architecture Patterns

### Recommended Project Structure

```
learn/
  bin/
    gsd-learn.cjs          # CLI entry point (hashbang, arg parsing, dispatch)
  lib/
    terminal.cjs            # ANSI color utilities, screen clearing, box drawing
    renderer.cjs            # Lesson rendering (format lesson object -> terminal output)
    navigator.cjs           # Keypress handling, forward/back/quit navigation loop
    progress.cjs            # Read/write progress JSON, current position queries
    lessons.cjs             # Load lesson data from module definitions
    concept-map.cjs         # ASCII architecture diagrams with "YOU ARE HERE" markers
    errors.cjs              # User-friendly error messages for common failure modes
  content/
    modules/
      command-lifecycle/
        module.json         # Module metadata: id, title, lesson order
        lessons/
          01-welcome.json   # Individual lesson content (hand-written for Phase 1)
          02-entry-point.json
          03-dispatch.json
          ...
  tests/
    terminal.test.cjs
    renderer.test.cjs
    progress.test.cjs
    navigator.test.cjs
    lessons.test.cjs
```

### Pattern 1: Stateless Lesson Rendering

**What:** The renderer is a pure function: takes a lesson object and options, returns nothing (writes to stdout). No internal state.
**When to use:** Every lesson display.
**Example:**
```javascript
// Source: Derived from GSD's output() pattern in core.cjs
function renderLesson(lesson, progress, options) {
  const { stdout } = process;
  stdout.write(clearScreen());
  stdout.write(renderHeader(lesson, progress));
  stdout.write(renderContent(lesson.content));
  stdout.write(renderConceptMap(lesson.conceptMap));
  stdout.write(renderFooter(progress));
}
```

### Pattern 2: Event-Loop Navigation

**What:** After rendering a lesson, enter a keypress listener loop. Single keys (n, p, q) trigger navigation actions. Returns a promise that resolves with the user's action.
**When to use:** After every lesson render.
**Example:**
```javascript
// Source: Node.js readline.emitKeypressEvents documentation
const readline = require('readline');

function waitForNavigation() {
  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    const handler = (str, key) => {
      if (key.name === 'n' || key.name === 'right') {
        cleanup(); resolve('next');
      } else if (key.name === 'p' || key.name === 'left') {
        cleanup(); resolve('prev');
      } else if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
        cleanup(); resolve('quit');
      }
    };

    function cleanup() {
      process.stdin.removeListener('keypress', handler);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
    }

    process.stdin.on('keypress', handler);
    process.stdin.resume();
  });
}
```

### Pattern 3: Progress File with Atomic Writes

**What:** Read progress JSON on startup, write after each navigation action. Use `writeFileSync` for atomicity (no partial writes on crash).
**When to use:** Every session start and every lesson transition.
**Example:**
```javascript
// Source: Matches GSD's config.cjs pattern for JSON state files
const fs = require('fs');
const path = require('path');

const PROGRESS_PATH = path.join('.planning', 'learn', 'progress.json');

function loadProgress(cwd) {
  const filePath = path.join(cwd, PROGRESS_PATH);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return { version: 1, currentModule: null, currentLesson: 0, modules: {} };
  }
}

function saveProgress(cwd, progress) {
  const filePath = path.join(cwd, PROGRESS_PATH);
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(progress, null, 2), 'utf-8');
}
```

### Pattern 4: Lesson Data Model

**What:** Each lesson is a JSON object with stable fields. Content is hand-written markdown-like text for Phase 1.
**When to use:** All lesson definitions.
**Example:**
```json
{
  "id": "entry-point",
  "title": "Where Commands Start",
  "lessonNumber": 1,
  "objective": "Understand how GSD routes user commands to the right handler",
  "content": [
    { "type": "text", "value": "When you type /gsd:quick, GSD needs to figure out..." },
    { "type": "code", "language": "javascript", "value": "const cmd = args[0];\nswitch(cmd) { ... }", "highlight": [1] },
    { "type": "text", "value": "The switch statement in gsd-tools.cjs is the central dispatch..." }
  ],
  "conceptMap": "entry-point",
  "successCriteria": "You can identify where command routing happens in gsd-tools.cjs"
}
```

### Anti-Patterns to Avoid

- **Full TUI framework:** Do not build scrollable panes, mouse support, or alternate screen buffers. This is paginated text with key navigation, not vim.
- **Embedded lesson text in code:** Lesson content lives in JSON files under `content/`, not as string literals in `.cjs` modules.
- **Complex state management:** Progress is one flat JSON file. No event sourcing, no Redux-like patterns, no database.
- **Over-engineering for multiple modules:** Phase 1 has one module with 3-5 lessons. Do not build a module discovery system or plugin architecture.
- **Cursor positioning:** Avoid `\x1b[{row};{col}H` cursor positioning. Use simple sequential output with clear screen between lessons. Cursor positioning breaks on terminal resize and non-standard terminals.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ANSI color support detection | Custom terminal capability detection | `process.stdout.isTTY` + `NO_COLOR` env var check | Standard convention; 3 lines of code covers all cases |
| JSON file persistence | Custom serialization format | `JSON.parse`/`JSON.stringify` with `fs.readFileSync`/`writeFileSync` | GSD already does this for config.json and STATE.md |
| Cross-platform paths | Manual slash replacement | `path.join()` and `path.resolve()` | GSD's `toPosixPath()` exists for edge cases |
| Screen clearing | Manual ANSI sequences | `process.stdout.write('\x1b[2J\x1b[H')` or `console.clear()` | Two well-known escape codes; `console.clear()` is even simpler |
| Keypress events | Custom stdin byte parser | `readline.emitKeypressEvents(process.stdin)` | Built-in Node.js API handles all key encoding edge cases |

**Key insight:** Phase 1's technical components are all well-trodden Node.js patterns. The risk is not in the technology but in spending too much time on terminal polish instead of validating the lesson content structure.

## Common Pitfalls

### Pitfall 1: Terminal UI Complexity Trap
**What goes wrong:** Building rich interactive terminal features (syntax highlighting with full token parsing, scrollable content, animated transitions) consumes weeks and introduces fragile cross-platform issues.
**Why it happens:** CLI learning tools like rustlings look polished. Replicating that polish from scratch with raw ANSI codes requires deep terminal knowledge.
**How to avoid:** Cap ANSI usage to: bold, 6 foreground colors, dim, reset, clear screen. No cursor positioning beyond clear. Test on Windows Terminal first (primary environment per project env). Accept "boring but readable" as the quality bar.
**Warning signs:** Terminal rendering code is longer than lesson content code. Spending more than a day on "make the code block look right."

### Pitfall 2: Progress State Corruption
**What goes wrong:** Progress JSON gets corrupted (partial write on crash, manual edit gone wrong, format change between versions) and the tool crashes or loses the learner's place.
**Why it happens:** JSON file persistence seems trivial but edge cases compound: file not found, invalid JSON, missing fields, schema change.
**How to avoid:** Always `try/catch` around `JSON.parse` with a default fallback (never crash on bad progress file). Include a `version` field in the progress schema for future migration. Use `writeFileSync` (synchronous = atomic from Node's perspective). Test the "corrupted file" case explicitly.
**Warning signs:** No test for loading malformed progress JSON. Progress file has deeply nested structure.

### Pitfall 3: Raw Mode Stdin Cleanup
**What goes wrong:** `process.stdin.setRawMode(true)` is set for keypress navigation but not cleaned up on error/exit. The user's terminal stays in raw mode after the tool crashes, making their shell unusable (no echo, no line editing).
**Why it happens:** Error paths and Ctrl+C handling are often added as afterthoughts.
**How to avoid:** Always wrap raw mode in a try/finally or use `process.on('exit')` to restore. Handle SIGINT (Ctrl+C) explicitly to clean up before exiting. Test the crash path.
**Warning signs:** Terminal behaves strangely after force-quitting gsd-learn. No `process.on('exit')` handler.

### Pitfall 4: Windows Terminal ANSI Rendering Differences
**What goes wrong:** ANSI codes that look perfect in VS Code integrated terminal render differently (or not at all) in CMD.EXE or older PowerShell.
**Why it happens:** Windows Terminal supports ANSI natively since Windows 10 build 10586, but CMD.EXE and older PowerShell require `ENABLE_VIRTUAL_TERMINAL_PROCESSING`. Node.js enables this automatically when `process.stdout.isTTY` is true on modern Windows, but edge cases exist.
**How to avoid:** Test in Windows Terminal (the primary environment). Support `NO_COLOR` env var for graceful degradation. Keep ANSI usage simple (no 256-color, no true color -- stick to the basic 8 colors). GSD's `install.js` already works on Windows with these same codes, so match that baseline.
**Warning signs:** Using extended ANSI sequences (256-color `\x1b[38;5;Nm` or true color `\x1b[38;2;R;G;Bm`). Not testing on Windows.

### Pitfall 5: Lesson Content in Wrong Location
**What goes wrong:** Lesson content files are placed outside the GSD repo structure, or in a location that gets excluded by `.gitignore` or npm publish, or conflicts with existing GSD directories.
**Why it happens:** Unclear where a new tool's files should live within the existing GSD monorepo structure.
**How to avoid:** Place all gsd-learn code under `learn/` at the repo root, parallel to `get-shit-done/`. This follows GSD's top-level directory convention (bin/, commands/, agents/, get-shit-done/, docs/, now learn/). Ensure `learn/` is not in `.gitignore`. Progress file goes in `.planning/learn/` (project state, git-tracked).
**Warning signs:** Lesson files scattered across multiple directories. Progress file in home directory (loses portability with the project).

## Code Examples

### ANSI Terminal Utility Module

```javascript
// learn/lib/terminal.cjs
// Source: Matches GSD's bin/install.js ANSI pattern (lines 10-14)
'use strict';

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  underline: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;

function style(text, ...styles) {
  if (!useColor) return text;
  const prefix = styles.map(s => COLORS[s] || '').join('');
  return prefix + text + COLORS.reset;
}

function clearScreen() {
  return '\x1b[2J\x1b[H';
}

function horizontalRule(width) {
  return style('─'.repeat(width || process.stdout.columns || 80), 'dim');
}

module.exports = { COLORS, style, clearScreen, horizontalRule, useColor };
```

### Simple Syntax Highlighting for Code Blocks

```javascript
// learn/lib/terminal.cjs (continued)
// Source: Custom; keeps it simple with keyword-only highlighting
const JS_KEYWORDS = /\b(const|let|var|function|return|if|else|switch|case|require|module|exports|class|new|this|for|while|break|continue|throw|try|catch|finally|typeof|instanceof)\b/g;
const JS_STRINGS = /(["'`])(?:(?!\1).)*?\1/g;
const JS_COMMENTS = /\/\/.*/g;

function highlightJS(code) {
  if (!useColor) return code;
  return code
    .replace(JS_COMMENTS, match => style(match, 'dim'))
    .replace(JS_STRINGS, match => style(match, 'green'))
    .replace(JS_KEYWORDS, match => style(match, 'cyan'));
}
```

### Lesson Navigation Loop

```javascript
// learn/lib/navigator.cjs
// Source: Node.js readline.emitKeypressEvents docs + GSD's synchronous patterns
'use strict';

const readline = require('readline');

function setupCleanExit() {
  const restore = () => {
    if (process.stdin.isTTY) {
      try { process.stdin.setRawMode(false); } catch {}
    }
  };
  process.on('exit', restore);
  process.on('SIGINT', () => { restore(); process.exit(0); });
  process.on('SIGTERM', () => { restore(); process.exit(0); });
}

async function runNavigationLoop(lessons, startIndex, renderFn, progressFn) {
  setupCleanExit();
  let current = startIndex;

  while (true) {
    renderFn(lessons[current], current, lessons.length);
    const action = await waitForKey();

    if (action === 'next' && current < lessons.length - 1) {
      current++;
      progressFn(current);
    } else if (action === 'prev' && current > 0) {
      current--;
    } else if (action === 'quit') {
      progressFn(current);
      break;
    }
  }
}

module.exports = { runNavigationLoop, setupCleanExit };
```

### CLI Entry Point

```javascript
// learn/bin/gsd-learn.cjs
#!/usr/bin/env node
// Source: Matches GSD's gsd-tools.cjs entry point pattern
'use strict';

const path = require('path');
const fs = require('fs');

// Verify we are in the GSD repo
const cwd = process.cwd();
const gsdToolsPath = path.join(cwd, 'get-shit-done', 'bin', 'gsd-tools.cjs');
if (!fs.existsSync(gsdToolsPath)) {
  process.stderr.write(
    'Error: gsd-learn must be run from the GSD repository root.\n' +
    'Current directory: ' + cwd + '\n' +
    'Expected to find: get-shit-done/bin/gsd-tools.cjs\n'
  );
  process.exit(1);
}

// Parse minimal CLI args
const args = process.argv.slice(2);
const flags = {};
for (const arg of args) {
  if (arg.startsWith('--')) {
    const [key, val] = arg.slice(2).split('=');
    flags[key] = val || true;
  }
}

// Dispatch
if (flags.reset) {
  // Reset progress
} else if (flags.status) {
  // Show progress summary
} else {
  // Start/resume lesson navigation
}
```

### ASCII Concept Map with "YOU ARE HERE" Marker

```javascript
// learn/lib/concept-map.cjs
'use strict';

const { style } = require('./terminal.cjs');

const CONCEPT_MAP = `
  User types /gsd:quick
        |
        v
  +------------------+     +------------------+
  | Command Spec     |---->| Workflow          |
  | commands/gsd/    |     | workflows/*.md    |
  +------------------+     +--------+---------+
                                    |
                                    v
                           +------------------+
                           | Tool Dispatch    |
                           | gsd-tools.cjs    |
                           +--------+---------+
                                    |
                       +------------+------------+
                       |            |            |
                       v            v            v
                 +---------+  +---------+  +---------+
                 | State   |  | Config  |  | Phase   |
                 | state   |  | config  |  | phase   |
                 | .cjs    |  | .cjs    |  | .cjs    |
                 +---------+  +---------+  +---------+
`;

function renderConceptMap(currentSection) {
  const marker = ' <-- YOU ARE HERE';
  // Replace the section name with a highlighted version
  let map = CONCEPT_MAP;
  if (currentSection) {
    map = map.replace(
      new RegExp('(\\|\\s*' + currentSection + ')', 'i'),
      style('$1' + marker, 'yellow', 'bold')
    );
  }
  return style('Architecture Overview:', 'bold', 'cyan') + '\n' + style(map, 'dim') + '\n';
}

module.exports = { renderConceptMap, CONCEPT_MAP };
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `util.styleText` for colors | Raw ANSI escape codes | N/A (project constraint) | `util.styleText` is stable in Node 22.13+ but project targets Node 16.7+. Raw codes are the correct choice. |
| `readline` callbacks | `readline/promises` async API | Node 18+ stable | Could use async API if we bump Node floor to 18+, but callback/event style works fine for this use case |
| External color libraries (chalk) | Zero-dep raw ANSI | GSD project convention | Project explicitly avoids runtime dependencies |

**Deprecated/outdated:**
- `keypress` npm package: Unnecessary since Node.js added `readline.emitKeypressEvents()` as built-in (available since Node 0.x).

## Open Questions

1. **Node.js minimum version for gsd-learn**
   - What we know: GSD's published package targets Node 16.7+. Prior research recommends Node 18+ for gsd-learn (async readline, stable node:test).
   - What's unclear: Whether the user's environment reliably has Node 18+. The current dev machine runs Node 24.13.1.
   - Recommendation: Target Node 16.7+ for compatibility (matching GSD's own floor), using callback-style readline. If async readline is needed later, bump the requirement then. The keypress event API and ANSI codes work fine on Node 16+.

2. **Progress file location: `.planning/learn/` vs `~/.gsd-learn/`**
   - What we know: Prior research suggests home directory to avoid repo pollution. GSD's own state lives in `.planning/`.
   - What's unclear: Whether progress should be per-project or global.
   - Recommendation: Use `.planning/learn/progress.json` (project-local). This follows GSD's convention, is git-trackable, and the learner is learning THIS specific GSD codebase. If they clone a fresh copy, starting over makes sense.

3. **How many placeholder lessons for Phase 1?**
   - What we know: Phase 1 uses hand-written content. Phase 2 auto-generates from source.
   - What's unclear: How many lessons are enough to validate the shell works without over-investing in content that will be replaced.
   - Recommendation: 3-5 lessons covering the Command Lifecycle entry point. Enough to test navigation, progress persistence, and concept map. Content can be placeholder-quality since Phase 2 replaces it.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` + `node:assert` (built-in) |
| Config file | `scripts/run-tests.cjs` (existing GSD test runner) |
| Quick run command | `node --test learn/tests/*.test.cjs` |
| Full suite command | `npm test` (runs all tests including gsd-learn) |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISP-01 | ANSI formatting produces expected escape sequences | unit | `node --test learn/tests/terminal.test.cjs` | -- Wave 0 |
| DISP-02 | Code blocks render with syntax highlighting | unit | `node --test learn/tests/renderer.test.cjs` | -- Wave 0 |
| DISP-03 | Position indicator shows "Lesson N of M" | unit | `node --test learn/tests/renderer.test.cjs` | -- Wave 0 |
| CONT-01 | Lesson data model includes objective, content, successCriteria | unit | `node --test learn/tests/lessons.test.cjs` | -- Wave 0 |
| CONT-02 | Lessons load in numbered order from module definition | unit | `node --test learn/tests/lessons.test.cjs` | -- Wave 0 |
| PROG-01 | Progress persists across load/save cycles | unit | `node --test learn/tests/progress.test.cjs` | -- Wave 0 |
| PROG-02 | Graceful error on wrong directory / missing files | integration | `node --test learn/tests/errors.test.cjs` | -- Wave 0 |
| PROG-03 | Concept map renders with "YOU ARE HERE" marker | unit | `node --test learn/tests/concept-map.test.cjs` | -- Wave 0 |

### Sampling Rate

- **Per task commit:** `node --test learn/tests/*.test.cjs`
- **Per wave merge:** `npm test` (full suite including existing GSD tests)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `learn/tests/terminal.test.cjs` -- covers DISP-01 (ANSI formatting)
- [ ] `learn/tests/renderer.test.cjs` -- covers DISP-02, DISP-03 (code blocks, position indicator)
- [ ] `learn/tests/lessons.test.cjs` -- covers CONT-01, CONT-02 (lesson data model, ordering)
- [ ] `learn/tests/progress.test.cjs` -- covers PROG-01 (persistence)
- [ ] `learn/tests/errors.test.cjs` -- covers PROG-02 (error handling)
- [ ] `learn/tests/concept-map.test.cjs` -- covers PROG-03 (concept map)
- [ ] Test infrastructure: update `scripts/run-tests.cjs` to include `learn/tests/` glob

## Sources

### Primary (HIGH confidence)
- GSD `bin/install.js` lines 10-14 -- existing ANSI color pattern used in the project
- GSD `package.json` -- zero production dependencies, Node >= 16.7.0 engine requirement
- GSD `.planning/codebase/CONVENTIONS.md` -- coding conventions (CommonJS, 2-space indent, single quotes)
- GSD `.planning/codebase/STACK.md` -- built-in module usage, zero-dep constraint
- GSD `.planning/codebase/TESTING.md` -- node:test patterns, temp dir fixtures, helpers API
- GSD `.planning/research/STACK.md` -- prior project-level research on recommended stack
- GSD `.planning/research/ARCHITECTURE.md` -- prior research on component boundaries and data flow

### Secondary (MEDIUM confidence)
- [Node.js readline documentation](https://nodejs.org/api/readline.html) -- emitKeypressEvents, setRawMode
- [Node.js util.styleText documentation](https://nodejs.org/api/util.html) -- confirmed available Node 20.12+, stable Node 22.13+
- [Styling console text in Node.js (2ality)](https://2ality.com/2025/05/ansi-escape-sequences-nodejs.html) -- ANSI escape code reference

### Tertiary (LOW confidence)
- Windows Terminal ANSI support details -- multiple web sources agree Windows Terminal supports ANSI natively since Windows 10 build 10586, but exact Node.js behavior on older CMD.EXE unverified against current versions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero-dependency Node.js built-ins; GSD already uses all of these
- Architecture: HIGH -- simple CLI tool with well-understood patterns; prior project research validates approach
- Pitfalls: HIGH -- terminal UI complexity trap and raw mode cleanup are well-documented Node.js concerns
- Lesson data model: MEDIUM -- hand-written JSON lessons for Phase 1 is a pragmatic choice but the exact schema may need iteration during implementation

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable domain; Node.js built-in APIs do not change)
