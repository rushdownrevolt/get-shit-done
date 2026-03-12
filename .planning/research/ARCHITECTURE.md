# Architecture Patterns

**Domain:** Interactive CLI learning tool (GSD Learn)
**Researched:** 2026-03-11

## Recommended Architecture

GSD Learn is a **pipeline architecture** with five distinct components connected by a unidirectional data flow: Source Parser reads GSD files, Content Generator transforms parsed data into lesson structures, Lesson Renderer presents content interactively in the terminal, Progress Tracker persists learning state, and Mini-Project Runner scaffolds and validates hands-on exercises.

```
                                  +-------------------+
                                  |  GSD Source Files  |
                                  | (workflows, agents,|
                                  |  lib, commands)    |
                                  +---------+---------+
                                            |
                                            v
+-------------------+           +-------------------+
|   CLI Entry       |---------->|  Source Parser     |
|   (gsd-learn.cjs) |           |  (parser/*.cjs)    |
+-------------------+           +---------+---------+
        |                                 |
        |  user command                   |  parsed AST / metadata
        |  (lesson, progress, project)    v
        |                       +-------------------+
        |                       | Content Generator  |
        |                       | (content/*.cjs)    |
        |                       +---------+---------+
        |                                 |
        |                                 |  lesson objects
        |                                 v
        |                       +-------------------+
        +---------------------->| Lesson Renderer    |
        |                       | (renderer/*.cjs)   |
        |                       +---------+---------+
        |                                 |
        |                                 |  completion events
        |                                 v
        |                       +-------------------+
        +---------------------->| Progress Tracker   |
        |                       | (progress/*.cjs)   |
        |                       +---------+---------+
        |                                 |
        |                                 |  module complete?
        |                                 v
        |                       +-------------------+
        +---------------------->| Mini-Project Runner|
                                | (projects/*.cjs)   |
                                +-------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With | Input | Output |
|-----------|---------------|-------------------|-------|--------|
| **CLI Entry** | Parse user commands, route to appropriate subsystem | All components | `argv` | Dispatches to renderer, progress, or project runner |
| **Source Parser** | Read and parse GSD source files into structured metadata | Content Generator | File paths to GSD sources | Parsed structures: function signatures, workflow steps, agent roles, data flows |
| **Content Generator** | Transform parsed metadata into lesson content objects | Lesson Renderer | Parsed source structures + module definitions | Ordered lesson objects with text, code snippets, annotations, navigation |
| **Lesson Renderer** | Present lessons interactively in terminal with navigation | Progress Tracker | Lesson objects | User completion events, navigation actions |
| **Progress Tracker** | Persist and query learning state across sessions | CLI Entry, Lesson Renderer, Mini-Project Runner | Completion events, state queries | Current position, completion status, module readiness |
| **Mini-Project Runner** | Scaffold, explain, and validate hands-on exercises | Progress Tracker | Module context, project definitions | Validation results, feedback |

### Data Flow

**Lesson Delivery Flow (primary path):**
1. User runs `gsd-learn start` or `gsd-learn continue`
2. CLI Entry checks Progress Tracker for current position
3. Source Parser reads relevant GSD source files for current module/lesson
4. Content Generator transforms parsed data into lesson objects, injecting actual source code
5. Lesson Renderer presents lesson interactively (paged text, highlighted code, prompts to continue)
6. On lesson completion, Progress Tracker records progress
7. On module completion, Mini-Project Runner activates

**Content Generation Flow (build-time or lazy):**
1. Source Parser walks GSD directory tree, identifies target files per module definition
2. For each file: extract function signatures, parse workflow steps, identify agent roles, map data flows
3. Content Generator matches parsed data to lesson templates defined in module configs
4. Lesson objects contain: narrative text (with `{{source}}` interpolation), code blocks from actual files, annotations, and "try it" prompts

**Progress Persistence Flow:**
1. Progress stored in `.gsd-learn/progress.json` in user's home directory (not in project `.planning/` to avoid repo pollution)
2. Structure: `{ modules: { "command-lifecycle": { completed: ["lesson-1", "lesson-2"], currentLesson: "lesson-3", startedAt, lastAccessedAt } } }`
3. Read on startup, written after each lesson completion
4. Mini-project results appended as `{ projectId, completedAt, feedbackScore }`

**Source Change Detection Flow:**
1. On lesson load, Source Parser hashes target files
2. Compare against cached hashes in progress file
3. If changed: regenerate affected lesson content (lazy invalidation)
4. User sees current source, never stale content

## Component Deep Dives

### Source Parser (`lib/parser/`)

The most architecturally critical component. Must extract meaningful structure from GSD's source files without requiring GSD to annotate itself for teaching purposes.

**Parsing strategies by file type:**

| GSD File Type | Location | What to Extract | Parsing Approach |
|---------------|----------|-----------------|------------------|
| CommonJS modules | `bin/lib/*.cjs` | Function names, exports, require graph, JSDoc | Regex-based extraction of `function`, `module.exports`, `require()`, JSDoc blocks |
| Workflow markdown | `workflows/*.md` | Step sequence, agent spawns, bash commands, state transitions | Markdown section parsing + code block extraction |
| Agent prompts | `agents/*.md` | Role, responsibilities, tools, input/output contracts | Frontmatter extraction + section heading parsing |
| Command specs | `commands/gsd/*.md` | Flags, descriptions, workflow links | Frontmatter extraction |
| Config/templates | `templates/`, `references/` | Schema shapes, default values | JSON parsing, markdown section parsing |

**Why regex over AST:** GSD is zero-dependency. Adding `acorn` or `@babel/parser` breaks the constraint. Regex is sufficient for the extraction granularity needed (function signatures, exports, requires) -- we are not doing code transformation, just extraction. GSD's code style is consistent enough (see CONVENTIONS.md) that regex patterns will be reliable.

**Key parser functions:**
- `parseModule(filePath)` -- returns `{ functions: [], exports: [], requires: [], jsdoc: [] }`
- `parseWorkflow(filePath)` -- returns `{ title, steps: [{ type, content, codeBlock }], agentSpawns: [] }`
- `parseAgent(filePath)` -- returns `{ name, role, tools, responsibilities: [] }`
- `parseCommand(filePath)` -- returns `{ name, description, flags: [], workflow }`

### Content Generator (`lib/content/`)

Transforms parser output into lesson objects using module definition files.

**Module definition format** (stored as JSON in `lib/modules/`):

```javascript
// modules/command-lifecycle.json
{
  "id": "command-lifecycle",
  "title": "Command Lifecycle: Following /gsd:quick End-to-End",
  "lessons": [
    {
      "id": "entry-point",
      "title": "Where Commands Start",
      "sources": ["get-shit-done/bin/gsd-tools.cjs"],
      "focus": ["main dispatch switch", "command routing"],
      "narrative": "lesson-templates/entry-point.md"
    },
    {
      "id": "state-machine",
      "title": "The State Machine",
      "sources": ["get-shit-done/bin/lib/state.cjs", "get-shit-done/bin/lib/core.cjs"],
      "focus": ["cmdStateLoad", "cmdStateUpdate", "STATE.md format"],
      "narrative": "lesson-templates/state-machine.md"
    }
  ],
  "miniProject": {
    "id": "custom-command",
    "title": "Build a Custom GSD Command",
    "template": "projects/custom-command/"
  }
}
```

**Narrative templates** use `{{source:filePath:functionName}}` interpolation to inject actual source code. This is the mechanism that keeps lessons current -- templates are stable, injected code updates automatically.

### Lesson Renderer (`lib/renderer/`)

Interactive terminal presentation using Node.js built-in `readline` and ANSI escape codes. No external dependencies.

**Rendering capabilities (all achievable with builtins):**
- Paged output with "press Enter to continue" (readline)
- Syntax-highlighted code blocks (ANSI color codes applied via simple token matching -- keywords, strings, comments)
- Section headers with box-drawing characters
- Progress indicator showing lesson N of M
- Navigation: next, previous, table of contents, quit

**Why not Ink/Blessed:** Zero-dependency constraint. `readline` + ANSI escapes handle the needed interactions. The lesson experience is fundamentally sequential (read, then continue) not a complex UI. Over-engineering the renderer is a common pitfall for CLI learning tools.

**Key renderer contract:**
```javascript
// renderer.cjs
function renderLesson(lessonObject, options) {
  // Returns: { action: 'next' | 'prev' | 'toc' | 'quit', completedSections: [] }
}

function renderTOC(moduleObject, progressState) {
  // Returns: { selectedLesson: 'lesson-id' }
}
```

### Progress Tracker (`lib/progress/`)

Thin persistence layer. Reads/writes a single JSON file.

**Storage location:** `~/.gsd-learn/progress.json`

**Why home directory, not `.planning/`:**
- Learning progress is personal, not project state
- Avoids polluting the GSD repo with non-GSD artifacts
- Survives project directory changes or reinstalls
- Single learner constraint means no conflict resolution needed

**Key functions:**
- `loadProgress()` -- reads or initializes progress file
- `markLessonComplete(moduleId, lessonId)` -- records completion with timestamp
- `getCurrentPosition(moduleId)` -- returns next incomplete lesson
- `recordProjectResult(moduleId, result)` -- stores mini-project outcome and feedback

### Mini-Project Runner (`lib/projects/`)

Scaffolds hands-on exercises and validates results. This is GSD Learn's validation mechanism -- learning is proven by doing, not by answering questions.

**How validation works:**
1. Runner explains the project goal and provides starter context
2. Learner uses actual GSD commands to complete the project (they leave gsd-learn temporarily)
3. Runner checks for expected artifacts: files created, commands run, git commits made
4. Validation is structural, not content-matching: "Did you create a workflow file?" not "Does your workflow match this exact text"

**Validation strategies:**
- File existence checks (`fs.existsSync`)
- Git log inspection for expected commit patterns
- File content pattern matching (does the workflow file contain a bash code block?)
- GSD state checks (did STATE.md update?)

**Feedback loop for lesson quality:**
- After project completion, prompt: "Rate how prepared the lessons made you feel (1-5)"
- Store alongside project results
- This data informs module iteration (per PROJECT.md requirement)

## Patterns to Follow

### Pattern 1: Lazy Content Generation
**What:** Generate lesson content on-demand when a lesson is requested, not upfront for all lessons.
**When:** Always. Source files may change between sessions.
**Why:** Ensures content freshness, avoids stale cache bugs, reduces startup time.
```javascript
function loadLesson(moduleId, lessonId) {
  const moduleDef = require(`../modules/${moduleId}.json`);
  const lessonDef = moduleDef.lessons.find(l => l.id === lessonId);
  const parsed = lessonDef.sources.map(s => parseSource(s));
  return generateLesson(lessonDef, parsed);
}
```

### Pattern 2: Template Interpolation for Source Freshness
**What:** Narrative templates reference source code by path and symbol name; actual code is injected at render time.
**When:** Every lesson that shows GSD source code.
**Why:** Templates describe context and explanation (stable); source code provides the examples (changes with GSD). Separating them prevents content drift.
```javascript
// In narrative template:
// "The dispatch logic lives in the main switch statement:"
// {{source:get-shit-done/bin/gsd-tools.cjs:mainSwitch}}

function interpolateSource(template, parsedSources) {
  return template.replace(/\{\{source:(.+?):(.+?)\}\}/g, (_, filePath, symbol) => {
    const source = parsedSources[filePath];
    return source.extractSymbol(symbol) || `// ${symbol} not found in ${filePath}`;
  });
}
```

### Pattern 3: Match GSD's Own Patterns
**What:** Use the same coding conventions, module structure, and architectural patterns that GSD uses.
**When:** All code in GSD Learn.
**Why:** GSD Learn lives inside the GSD repo. Consistency reduces cognitive load. Also, the learner sees GSD Learn's code as another example of GSD-style code. Use CommonJS, `cmd` prefix, `output()`/`error()` pattern, 2-space indentation, single quotes.

### Pattern 4: Stateless Rendering
**What:** The renderer has no memory between invocations. Progress state comes from the tracker; content comes from the generator.
**When:** Always.
**Why:** Simplifies the renderer to a pure function. Makes testing trivial. Prevents state synchronization bugs between renderer and tracker.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Embedded Lesson Content in Code
**What:** Writing lesson text directly in JavaScript files as string literals.
**Why bad:** Impossible to maintain, impossible to diff, mixes concerns. Lesson authors should edit markdown, not JavaScript.
**Instead:** Lesson narrative lives in markdown template files. Code injects source snippets via interpolation.

### Anti-Pattern 2: Full TUI Framework
**What:** Using Ink, Blessed, or similar for a complex terminal UI with panels, scrolling, mouse support.
**Why bad:** Violates zero-dependency constraint. Adds massive complexity for a fundamentally sequential reading experience. Learning tools need clarity, not UI chrome.
**Instead:** `readline` + ANSI escape codes. Paged output. Simple key-based navigation.

### Anti-Pattern 3: Pre-Building All Lessons at Install Time
**What:** Running the parser across all GSD source at startup and caching all generated content.
**Why bad:** Stale cache when source changes. Slow startup. Unnecessary work for lessons the learner hasn't reached.
**Instead:** Lazy generation per lesson. Hash-based invalidation for the rare case of revisiting a lesson after source changes.

### Anti-Pattern 4: Complex Validation for Mini-Projects
**What:** Trying to deeply analyze learner code quality, style, or correctness in mini-projects.
**Why bad:** Brittle, frustrating, false negatives. The goal is to verify the learner DID the thing, not that they did it perfectly.
**Instead:** Structural validation (file exists, has expected sections, git history shows work). Combine with self-assessment rating.

### Anti-Pattern 5: Separate Config System
**What:** Creating a new configuration system for GSD Learn (settings file, options, preferences).
**Why bad:** GSD already has CONFIG.json patterns. Adding another config system creates confusion.
**Instead:** If GSD Learn needs config, extend `.planning/config.json` with a `learn` section using existing `config-set` / `config-get` patterns. But for MVP, hardcode defaults -- config is premature.

## Suggested Build Order

Build order follows data flow dependencies. Each component is testable independently once its dependencies exist.

```
Phase 1: Foundation
  1. CLI Entry (command parsing, dispatch skeleton)
  2. Progress Tracker (read/write progress file)
  -- These have no upstream dependencies, enable testing the shell --

Phase 2: Content Pipeline
  3. Source Parser (parse GSD modules, workflows, agents)
  4. Content Generator (module definitions, template interpolation)
  -- Parser must exist before generator; both must exist before renderer can show real content --

Phase 3: Interactive Experience
  5. Lesson Renderer (paged output, navigation, ANSI formatting)
  6. Wire everything: CLI -> Parser -> Generator -> Renderer -> Tracker
  -- Renderer needs generator output format finalized first --

Phase 4: Validation
  7. Mini-Project Runner (scaffold, validate, collect feedback)
  8. First complete module: Command Lifecycle
  -- Projects need all other components working; first module is the integration test --
```

**Dependency graph:**
```
CLI Entry ──────────────────────────────────> (standalone)
Progress Tracker ───────────────────────────> (standalone)
Source Parser ──────────────────────────────> (standalone, reads filesystem)
Content Generator ─────────────────────────> depends on: Source Parser
Lesson Renderer ───────────────────────────> depends on: Content Generator output format
Mini-Project Runner ───────────────────────> depends on: Progress Tracker, filesystem
Full Integration ──────────────────────────> depends on: all above
```

**Why this order:**
- CLI Entry and Progress Tracker are leaf nodes with no upstream dependencies -- build first to establish the command interface and state management
- Source Parser is the riskiest component (regex-based extraction from real source files) -- build early so issues surface before downstream components depend on its output format
- Content Generator defines the lesson object shape that the Renderer consumes -- its interface must stabilize before Renderer work begins
- Mini-Project Runner is the last-mile validation and only needed when a complete module exists
- The first complete module (Command Lifecycle) serves as the end-to-end integration test for the entire architecture

## Scalability Considerations

| Concern | MVP (1 module) | 5 modules | 20+ modules |
|---------|----------------|-----------|-------------|
| Content generation speed | Instant (3-5 files) | <1s (15-25 files) | Lazy loading prevents scaling issues |
| Progress file size | <1KB | <5KB | <20KB, still single JSON file |
| Module discovery | Hardcoded module list | Module registry file | Module registry with dependency ordering |
| Source parser reliability | Test against known files | Parser may hit edge cases in new file types | Need parser test suite covering all GSD file patterns |
| Lesson maintenance | Manual template writing | Template patterns emerge, some reuse | Template inheritance or composition needed |

For MVP, none of these are concerns. The architecture handles scaling through lazy content generation and the module definition pattern. The first scaling decision point is when module count exceeds what a single developer can manually maintain (roughly 10+ modules).

## Sources

- GSD codebase architecture: `.planning/codebase/ARCHITECTURE.md` (HIGH confidence -- primary source)
- GSD conventions: `.planning/codebase/CONVENTIONS.md` (HIGH confidence -- defines code style contract)
- GSD stack: `.planning/codebase/STACK.md` (HIGH confidence -- defines zero-dependency constraint)
- GSD project definition: `.planning/PROJECT.md` (HIGH confidence -- defines requirements)
- Interactive CLI tool patterns: Based on training data knowledge of tools like `javascripting`, `how-to-npm`, `learnyounode` workshopper ecosystem, `freeCodeCamp` CLI tools (MEDIUM confidence -- patterns are well-established but not verified against current versions)

---

*Architecture analysis: 2026-03-11*
