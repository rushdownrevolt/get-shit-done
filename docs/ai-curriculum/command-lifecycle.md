# Command Lifecycle

Follow a GSD command from user input to execution, understanding how each piece connects.

## Lesson 1: Welcome to GSD

**Objective:** Understand GSD's architecture at a high level: what it does, why it exists, and how a command flows from user input to execution

GSD (Get Shit Done) is a CLI toolkit that replaces repetitive inline bash patterns across ~50 command, workflow, and agent files with a single centralized tool. Instead of every agent re-implementing config parsing, state management, and git operations, GSD provides one entry point that handles all of it.

Why a single tool instead of a library? Because GSD runs inside AI coding assistant sessions where each agent is spawned as an isolated process. A CLI tool is the universal interface: any agent, in any language, can shell out to `node gsd-tools.cjs <command>`. A library would require import paths, version management, and language compatibility -- none of which matter when your interface is stdin/stdout.

```javascript
// The heart of GSD: a single CLI entry point
// Usage: node gsd-tools.cjs <command> [args] [--raw]

const fs = require('fs');
const path = require('path');
const { error } = require('./lib/core.cjs');
const state = require('./lib/state.cjs');
const phase = require('./lib/phase.cjs');
```

GSD is built with zero external dependencies -- only Node.js built-ins (fs, path, child_process). Why? Because GSD runs inside sandboxed agent environments where npm install may not be available. Zero dependencies means the tool works everywhere Node.js exists, with no setup step.

The command lifecycle follows a clear path through four layers:

1. **Entry Point** (gsd-tools.cjs): Parses CLI arguments, handles --cwd and --raw flags
2. **Command Router**: A switch statement dispatches to the right module based on the first argument
3. **Tool Modules** (lib/*.cjs): Each module owns one domain -- state.cjs for STATE.md, config.cjs for config.json, phase.cjs for phase operations
4. **Output**: Results are JSON-serialized to stdout (or raw text with --raw flag)

```javascript
switch (command) {
  case 'state': {
    const subcommand = args[1];
    if (subcommand === 'json') {
      state.cmdStateJson(cwd, raw);
    } else if (subcommand === 'update') {
      state.cmdStateUpdate(cwd, args[2], args[3]);
    }
    break;
  }
  case 'commit': {
    commands.cmdCommit(cwd, message, files, raw, amend);
    break;
  }
}
```

Why a switch statement instead of a command registry pattern? Because GSD has a fixed, known set of commands. A registry adds indirection for extensibility that isn't needed -- the tool is maintained alongside the commands that use it. The switch statement makes it trivially easy to see every supported command in one place.

In this module, you will trace this entire path across five lessons:
1. This welcome and orientation [YOU ARE HERE] -- the big picture
2. Where commands start -- entry point argument parsing (gsd-tools.cjs lines 145-176)
3. Command dispatch -- the switch statement router (gsd-tools.cjs lines 178-589)
4. Tool modules -- core.cjs, config.cjs, phase.cjs module patterns (lib/*.cjs)
5. State and configuration -- STATE.md regex parsing and config CRUD (state.cjs, config.cjs)

Each lesson builds on the previous one. By lesson 5, you will have traced a complete command from `node gsd-tools.cjs state advance-plan` all the way through to the STATE.md file being rewritten with updated frontmatter.

Navigation: Press [n] for next lesson, [p] for previous, [q] to quit. Your progress is saved automatically.

---

## Lesson 2: Where Commands Start

**Objective:** Understand how gsd-tools.cjs parses CLI arguments, handles the --cwd and --raw flags, and sets up the execution context before dispatching commands

Every GSD command begins in gsd-tools.cjs. Before any command logic runs, the entry point must answer three questions: What directory are we working in? Does the caller want raw output? What command was requested?

```javascript
async function main() {
  const args = process.argv.slice(2);

  // Optional cwd override for sandboxed subagents running outside project root.
  let cwd = process.cwd();
  const cwdEqArg = args.find(arg => arg.startsWith('--cwd='));
  const cwdIdx = args.indexOf('--cwd');
  if (cwdEqArg) {
    const value = cwdEqArg.slice('--cwd='.length).trim();
    if (!value) error('Missing value for --cwd');
    args.splice(args.indexOf(cwdEqArg), 1);
    cwd = path.resolve(value);
  }
```

Why does --cwd exist? Sandboxed subagents may be spawned in a temporary directory, not the project root. Without --cwd, every file operation would target the wrong directory. The flag supports both `--cwd /path` (two args) and `--cwd=/path` (single arg) formats because different shells construct arguments differently. Notice that the --cwd argument is spliced out of the args array after extraction -- downstream code never sees it.

```javascript
  if (!fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory()) {
    error(`Invalid --cwd: ${cwd}`);
  }

  const rawIndex = args.indexOf('--raw');
  const raw = rawIndex !== -1;
  if (rawIndex !== -1) args.splice(rawIndex, 1);

  const command = args[0];
```

The --raw flag controls output format. Without it, GSD outputs JSON (machine-readable for programmatic callers). With --raw, it outputs plain text (human-readable for shell pipelines). This dual-mode design lets the same tool serve both AI agents (who parse JSON) and humans (who read text). Like --cwd, --raw is spliced out so command handlers receive clean argument arrays.

```javascript
const fs = require('fs');
const path = require('path');
const { error } = require('./lib/core.cjs');
const state = require('./lib/state.cjs');
const phase = require('./lib/phase.cjs');
const roadmap = require('./lib/roadmap.cjs');
const verify = require('./lib/verify.cjs');
const config = require('./lib/config.cjs');
const template = require('./lib/template.cjs');
const milestone = require('./lib/milestone.cjs');
const commands = require('./lib/commands.cjs');
const init = require('./lib/init.cjs');
const frontmatter = require('./lib/frontmatter.cjs');
```

Why are all modules loaded eagerly at the top instead of lazily inside each switch case? Because GSD is a CLI tool that exits after one command. Lazy loading would save startup time only if some modules were expensive to load, but all of GSD's modules are small CommonJS files with no heavy initialization. Eager loading keeps the code straightforward: all dependencies are declared upfront, making it easy to see what the tool needs.

The require chain follows a consistent pattern: each lib module imports from core.cjs for shared utilities (output, error, path helpers), then exports cmd* functions that the router calls. This creates a clean one-way dependency: gsd-tools.cjs -> lib/*.cjs -> core.cjs.

```javascript
  if (!command) {
    error('Usage: gsd-tools <command> [args] [--raw] [--cwd <path>]\n' +
      'Commands: state, resolve-model, find-phase, commit, ' +
      'verify-summary, verify, frontmatter, template, ...');
  }
```

Error handling is immediate and fail-fast. The error() function from core.cjs writes to stderr and exits with code 1. There is no try/catch around the entry point -- if something goes wrong, the process crashes with a clear message. Why? Because GSD commands are atomic operations called by agents. A partial success is worse than a clear failure, since agents can detect exit code 1 and report the error.

You have now seen the first layer of the command lifecycle: argument parsing and context setup. In the previous lesson (Welcome), you saw the four-layer architecture. In the next lesson (Command Dispatch), you will follow the `command` variable into the switch statement that routes it to handler functions. The pattern you learned here -- splice flags out, validate early, fail fast -- sets the stage for how commands are processed downstream.

---

## Lesson 3: Command Dispatch

**Objective:** Understand how GSD's switch statement routes commands to handler functions, including two-level dispatch for commands with sub-commands

Once gsd-tools.cjs has parsed --cwd and --raw, it reads args[0] as the command name. A switch statement maps that string to the right module function. This is the command router -- the central hub that connects the CLI interface to all of GSD's functionality.

```javascript
  const command = args[0];

  if (!command) {
    error('Usage: gsd-tools <command> [args] [--raw] [--cwd <path>]\n' +
      'Commands: state, resolve-model, find-phase, commit, ...');
  }

  switch (command) {
    case 'state': {
      const subcommand = args[1];
      if (subcommand === 'json') {
        state.cmdStateJson(cwd, raw);
      } else if (subcommand === 'update') {
        state.cmdStateUpdate(cwd, args[2], args[3]);
      }
      break;
    }
```

Why a switch statement instead of a command registry or plugin pattern? Because GSD has a fixed, known command set. A registry adds indirection -- you'd have to search multiple files to find what commands exist. The switch makes every command visible in one scroll. When you want to add a command, you add a case. When you want to find how a command works, you search for `case 'command-name'`.

```javascript
    case 'resolve-model': {
      commands.cmdResolveModel(cwd, args[1], raw);
      break;
    }

    case 'find-phase': {
      phase.cmdFindPhase(cwd, args[1], raw);
      break;
    }

    case 'commit': {
      const amend = args.includes('--amend');
      const filesIndex = args.indexOf('--files');
      const endIndex = filesIndex !== -1 ? filesIndex : args.length;
      const messageArgs = args.slice(1, endIndex).filter(a => !a.startsWith('--'));
      const message = messageArgs.join(' ') || undefined;
      const files = filesIndex !== -1 ? args.slice(filesIndex + 1).filter(a => !a.startsWith('--')) : [];
      commands.cmdCommit(cwd, message, files, raw, amend);
      break;
    }
```

Notice the naming convention: every handler function starts with `cmd` followed by the module domain and operation in camelCase. `find-phase` maps to `phase.cmdFindPhase()`, `resolve-model` maps to `commands.cmdResolveModel()`. This convention lets you predict function names from command names.

The `commit` case shows argument parsing inline within the switch. Why not extract it to a helper? Because each command's argument structure is different -- commit takes --files and --amend, state takes sub-commands, scaffold takes --phase and --name. Inline parsing keeps each command's interface self-contained and avoids a generic args-parsing abstraction that would need to handle every case.

```javascript
    case 'state': {
      const subcommand = args[1];
      if (subcommand === 'json') {
        state.cmdStateJson(cwd, raw);
      } else if (subcommand === 'update') {
        state.cmdStateUpdate(cwd, args[2], args[3]);
      } else if (subcommand === 'patch') {
        const patches = {};
        for (let i = 2; i < args.length; i += 2) {
          const key = args[i].replace(/^--/, '');
          const value = args[i + 1];
          if (key && value !== undefined) {
            patches[key] = value;
          }
        }
        state.cmdStatePatch(cwd, patches, raw);
      } else if (subcommand === 'advance-plan') {
        state.cmdStateAdvancePlan(cwd, raw);
      } else {
        state.cmdStateLoad(cwd, raw);
      }
      break;
    }
```

The `state` command uses two-level dispatch: args[0] selects the module, args[1] selects the sub-command. This pattern appears for state, phase, verify, frontmatter, template, and init -- commands with multiple related operations. The if/else chain inside each case acts as a second-level router. Notice the else clause at line 19: when no sub-command matches, it falls through to `cmdStateLoad` as the default. This means `gsd-tools state` with no sub-command still works.

```javascript
    case 'init': {
      const workflow = args[1];
      switch (workflow) {
        case 'execute-phase':
          init.cmdInitExecutePhase(cwd, args[2], raw);
          break;
        case 'plan-phase':
          init.cmdInitPlanPhase(cwd, args[2], raw);
          break;
        case 'resume':
          init.cmdInitResume(cwd, raw);
          break;
        default:
          error(`Unknown init workflow: ${workflow}`);
      }
      break;
    }
```

The `init` command uses a nested switch instead of if/else -- this is the only place where a second switch appears. Why? Because init has many sub-commands (execute-phase, plan-phase, new-project, quick, resume, etc.) and a switch with explicit cases reads more clearly than a long if/else chain. The default case provides a specific error message listing available workflows, guiding the user to the correct command.

You have now seen how args flow from the entry point (Lesson 2) into the router. Each case in the switch calls a cmd* function from a lib module -- these are the tool modules you will explore in Lesson 4. The naming convention (cmd + Module + Operation) creates a direct mapping: when you see `phase.cmdPhaseAdd()` in the switch, you know to look in lib/phase.cjs. In Lesson 5, you will follow one of these calls (state.cmdStateAdvancePlan) all the way to STATE.md being rewritten.

---

## Lesson 4: Tool Modules

**Objective:** Understand how GSD's lib/*.cjs modules are structured, the distinction between cmd* functions and internal helpers, and how core.cjs provides the shared output/error pattern

GSD's real work happens in library modules under get-shit-done/bin/lib/. Each module owns one domain:

  core.cjs      - Shared utilities: output/error, path helpers, config loading, git operations
  config.cjs    - Config file CRUD (config-ensure-section, config-set, config-get)
  state.cjs     - STATE.md reading, writing, and progression engine
  phase.cjs     - Phase directory lifecycle (add, insert, remove, complete)
  roadmap.cjs   - ROADMAP.md parsing and progress updates
  verify.cjs    - Verification and validation suite
  commands.cjs  - Git commits, slugs, timestamps, scaffolding
  init.cjs      - Compound initialization commands for workflows
  frontmatter.cjs - YAML frontmatter CRUD operations

Why this many small modules instead of fewer large ones? Because each module maps to a command namespace. When the switch statement dispatches `phase add`, it calls `phase.cmdPhaseAdd()`. The module boundary matches the user's mental model of the command structure. You never need to guess which file handles a command -- it's always `lib/{namespace}.cjs`.

```javascript
/**
 * Config - Planning config CRUD operations
 */

const fs = require('fs');
const path = require('path');
const { output, error } = require('./core.cjs');

function cmdConfigEnsureSection(cwd, raw) {
  const configPath = path.join(cwd, '.planning', 'config.json');
  const planningDir = path.join(cwd, '.planning');

  try {
    if (!fs.existsSync(planningDir)) {
      fs.mkdirSync(planningDir, { recursive: true });
    }
  } catch (err) {
    error('Failed to create .planning directory: ' + err.message);
  }

  if (fs.existsSync(configPath)) {
    const result = { created: false, reason: 'already_exists' };
    output(result, raw, 'exists');
    return;
  }
```

Every module follows the same structure: JSDoc module comment, require Node built-ins, require core.cjs for shared utilities, define functions, export at the bottom. The key import is `{ output, error }` from core.cjs -- these are the only two ways a cmd* function can end. This constraint makes every command predictable: it either succeeds (output + exit 0) or fails (error + exit 1).

```javascript
function output(result, raw, rawValue) {
  if (raw && rawValue !== undefined) {
    process.stdout.write(String(rawValue));
  } else {
    const json = JSON.stringify(result, null, 2);
    // Large payloads exceed Claude Code's Bash tool buffer (~50KB).
    // Write to tmpfile and output the path prefixed with @file:
    if (json.length > 50000) {
      const tmpPath = path.join(require('os').tmpdir(),
        `gsd-${Date.now()}.json`);
      fs.writeFileSync(tmpPath, json, 'utf-8');
      process.stdout.write('@file:' + tmpPath);
    } else {
      process.stdout.write(json);
    }
  }
  process.exit(0);
}

function error(message) {
  process.stderr.write('Error: ' + message + '\n');
  process.exit(1);
}
```

Why does output() have a 50KB buffer check? Because GSD runs inside AI agent sessions where stdout is captured into a buffer. Large JSON payloads (like full roadmap analysis) can exceed this buffer. The solution: write to a temp file and return `@file:/path` so the caller can read it. This is a real-world constraint that shaped the architecture -- the tool had to adapt to its execution environment.

There are two kinds of functions in every module:

1. **cmd* functions** (cmdConfigSet, cmdPhaseAdd) -- Called from the switch dispatch. They parse arguments, do work, and call output() or error(). They always exit the process.

2. **Internal functions** (loadConfig, findPhaseInternal, resolveModelInternal) -- Called by other modules. They return values normally and never call output() or error(). Some use the 'Internal' suffix to signal they are not dispatch targets.

```javascript
function loadConfig(cwd) {
  const configPath = path.join(cwd, '.planning', 'config.json');
  const defaults = {
    model_profile: 'balanced',
    commit_docs: true,
    search_gitignored: false,
    branching_strategy: 'none',
    parallelization: true,
    brave_search: false,
  };

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      model_profile: get('model_profile') ?? defaults.model_profile,
      commit_docs: get('commit_docs') ?? defaults.commit_docs,
      // ... more fields with ?? fallbacks
    };
  } catch {
    return defaults;
  }
}
```

The loadConfig pattern is core.cjs's most important internal function. It always returns a valid object -- if the file is missing, corrupted, or partially filled, every field falls back to a sensible default via the ?? (nullish coalescing) operator. Why? Because GSD must work even before a project is initialized. An agent calling `gsd-tools resolve-model gsd-executor` before running `config-ensure-section` should get a reasonable answer, not a crash.

```javascript
module.exports = {
  MODEL_PROFILES,
  output,
  error,
  safeReadFile,
  loadConfig,
  isGitIgnored,
  execGit,
  escapeRegex,
  normalizePhaseName,
  comparePhaseNum,
  findPhaseInternal,
  getRoadmapPhaseInternal,
  resolveModelInternal,
  generateSlugInternal,
  getMilestoneInfo,
  getMilestonePhaseFilter,
  toPosixPath,
};
```

Why a single module.exports object at the bottom instead of inline exports? CommonJS allows both patterns, but GSD consistently uses the bottom-of-file approach. This makes the module's public API visible in one glance -- you can scroll to the end of any file to see what it exports. It also prevents accidental early exports and makes it clear that all exports are intentional.

You have now seen how the four-layer architecture from Lesson 1 is implemented: the entry point (Lesson 2) feeds args to the router (Lesson 3), which calls cmd* functions in these tool modules. The key patterns to carry forward: output/error as the only exit paths, cmd* vs internal function distinction, defensive defaults in loadConfig, and the 50KB buffer workaround for large payloads. In the final lesson, you will see how state.cjs and config.cjs actually read and write their files -- completing the lifecycle from CLI input to persistent state.

---

## Lesson 5: State and Configuration

**Objective:** Understand how STATE.md is parsed with regex, how the frontmatter sync engine keeps YAML and markdown in sync, and how config.json provides defensive defaults with migration support

GSD needs to remember things between sessions: which phase you are on, what decisions were made, how the project is configured. Two files handle this:

  .planning/config.json  - Project settings (model profile, feature flags, branching strategy)
  .planning/STATE.md     - Current position, decisions, blockers, performance metrics, session continuity

config.json is a simple JSON file. STATE.md is more interesting: it's a Markdown file that's both human-readable AND machine-parseable.

```javascript
function stateExtractField(content, fieldName) {
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Try **Field:** bold format first
  const boldPattern = new RegExp(
    `\\*\\*${escaped}:\\*\\*\\s*(.+)`, 'i'
  );
  const boldMatch = content.match(boldPattern);
  if (boldMatch) return boldMatch[1].trim();
  // Fall back to plain Field: format
  const plainPattern = new RegExp(`^${escaped}:\\s*(.+)`, 'im');
  const plainMatch = content.match(plainPattern);
  return plainMatch ? plainMatch[1].trim() : null;
}
```

Why regex instead of a Markdown parser? Three reasons: (1) Zero dependencies -- no markdown-it, no remark, no unified. (2) STATE.md uses a predictable format with bold labels (`**Status:** Executing`) that regex handles perfectly. (3) The same regex approach handles both the bold Markdown format and plain-text format, making STATE.md flexible in how it's written. The regex is escaped to handle field names with special characters safely.

```javascript
function stateReplaceField(content, fieldName, newValue) {
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const boldPattern = new RegExp(
    `(\\*\\*${escaped}:\\*\\*\\s*)(.*)`, 'i'
  );
  if (boldPattern.test(content)) {
    return content.replace(boldPattern,
      (_match, prefix) => `${prefix}${newValue}`);
  }
  const plainPattern = new RegExp(`(^${escaped}:\\s*)(.*)`, 'im');
  if (plainPattern.test(content)) {
    return content.replace(plainPattern,
      (_match, prefix) => `${prefix}${newValue}`);
  }
  return null;
}
```

stateReplaceField preserves the field prefix (the bold markers and colon) while replacing only the value. This means editing STATE.md programmatically doesn't break its Markdown formatting. The function returns null if the field isn't found, letting callers handle missing fields gracefully. This extract/replace pair is the foundation of every state mutation in GSD.

```javascript
function writeStateMd(statePath, content, cwd) {
  const synced = syncStateFrontmatter(content, cwd);
  fs.writeFileSync(statePath, synced, 'utf-8');
}

function syncStateFrontmatter(content, cwd) {
  const body = stripFrontmatter(content);
  const fm = buildStateFrontmatter(body, cwd);
  const yamlStr = reconstructFrontmatter(fm);
  return `---\n${yamlStr}\n---\n\n${body}`;
}
```

Why does writeStateMd exist instead of raw writeFileSync? Because STATE.md has dual representations: the human-readable Markdown body AND a YAML frontmatter block at the top. Every time the body changes, the frontmatter must be regenerated to stay in sync. buildStateFrontmatter extracts machine-readable fields from the Markdown body (phase, plan, status, progress), and syncStateFrontmatter prepends the updated YAML. This means tools can read state via `gsd-tools state json` (fast YAML parse) while humans read the Markdown.

```javascript
function cmdConfigSet(cwd, keyPath, value, raw) {
  const configPath = path.join(cwd, '.planning', 'config.json');

  // Parse value (handle booleans and numbers)
  let parsedValue = value;
  if (value === 'true') parsedValue = true;
  else if (value === 'false') parsedValue = false;
  else if (!isNaN(value) && value !== '') parsedValue = Number(value);

  // Set nested value using dot notation (e.g., "workflow.research")
  const keys = keyPath.split('.');
  let current = config;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === undefined || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = parsedValue;
}
```

config-set supports dot notation (workflow.research) for nested values. Why? Because config.json has nested sections (workflow, git, planning) and agents need to set individual fields without knowing the full config structure. The auto-parsing of 'true'/'false'/numbers from strings is necessary because CLI arguments are always strings -- without it, `config-set commit_docs true` would store the string "true" instead of the boolean true.

```javascript
function cmdStateAdvancePlan(cwd, raw) {
  let content = fs.readFileSync(statePath, 'utf-8');
  const currentPlan = parseInt(
    stateExtractField(content, 'Current Plan'), 10
  );
  const totalPlans = parseInt(
    stateExtractField(content, 'Total Plans in Phase'), 10
  );

  if (currentPlan >= totalPlans) {
    content = stateReplaceField(content, 'Status',
      'Phase complete \u2014 ready for verification') || content;
  } else {
    const newPlan = currentPlan + 1;
    content = stateReplaceField(content, 'Current Plan',
      String(newPlan)) || content;
    content = stateReplaceField(content, 'Status',
      'Ready to execute') || content;
  }
  writeStateMd(statePath, content, cwd);
}
```

cmdStateAdvancePlan shows the full state mutation lifecycle: extract fields from markdown, compute new values, replace fields in content, write through writeStateMd (which syncs frontmatter). The `|| content` fallback after stateReplaceField ensures that if a field doesn't exist, the original content is preserved rather than becoming null. Why this defensive pattern? Because STATE.md is both human-edited and machine-edited. A human might rename a section or delete a field -- the tool should gracefully skip the missing field rather than crash or silently discard the entire file.

You have now traced the complete command lifecycle across all five lessons:

1. **Welcome**: The four-layer architecture (entry point -> router -> modules -> output)
2. **Entry Point**: --cwd/--raw parsing, eager module loading, fail-fast error handling
3. **Command Dispatch**: switch routing, two-level dispatch, cmd* naming convention
4. **Tool Modules**: output/error exit pattern, cmd* vs internal functions, defensive defaults
5. **State and Config** [YOU ARE HERE]: regex-based STATE.md parsing, frontmatter sync, config CRUD

The key design thread: every piece of GSD is built for reliability in automated environments. Zero dependencies, defensive defaults, fail-fast errors, dual-format output (JSON + raw), and the regex-based state engine all serve the same goal: a tool that works correctly even when called by agents with no human oversight.

---

## Concept Map

```

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

```

## Mini-Project: Build /gsd:skeptic (Full-Stack)

Extend your skeptic command with a Node.js handler and switch case, completing all 4 GSD command layers

### Artifacts

#### Skeptic command spec (Module 1)

**Path:** `~/.claude/commands/gsd/skeptic.md`

**Verification Checks:**

- [ ] Has YAML frontmatter block
- [ ] Has name field set to gsd:skeptic
- [ ] Has description field in frontmatter
- [ ] Has allowed-tools field in frontmatter
- [ ] Has objective section
- [ ] Has execution_context section
- [ ] execution_context references skeptic workflow via @file
- [ ] Has context section
- [ ] Has process section

#### Skeptic workflow (Module 1)

**Path:** `~/.claude/get-shit-done/workflows/skeptic.md`

**Verification Checks:**

- [ ] Has purpose section
- [ ] Has process section with steps

#### Skeptic handler module

**Path:** `~/.claude/get-shit-done/bin/lib/skeptic.cjs`

**Verification Checks:**

- [ ] File exports a module
- [ ] Follows the cmd* function naming convention
- [ ] Uses GSD output pattern

#### Switch case for skeptic command

**Path:** `~/.claude/get-shit-done/bin/gsd-tools.cjs`

**Verification Checks:**

- [ ] Skeptic case exists in switch statement

### Hints

<details>
<summary>Hint 1</summary>

You already built the markdown layer in Module 1 -- the command spec and workflow are done. Now think about what makes a command actually run. Your skeptic command needs a Node.js backend: a handler module and a way for the dispatcher to find it.

</details>

<details>
<summary>Hint 2</summary>

Lessons 4 (Tool Modules) and 5 (State and Configuration) showed you exactly how existing handlers work. Re-read them and pay attention to how each command gets its own module file and how the switch statement in gsd-tools.cjs routes commands to handlers.

</details>

<details>
<summary>Hint 3</summary>

Look at ~/.claude/get-shit-done/bin/lib/ -- each command domain has its own .cjs file. Your skeptic command needs one too. Then look at the switch statement in ~/.claude/get-shit-done/bin/gsd-tools.cjs to see how existing commands are wired up.

</details>

<details>
<summary>Hint 4</summary>

Your handler module needs to export a function following the cmd* naming convention (like cmdSkeptic). Check how existing handlers like cmdConfigSet or cmdPhasesList are structured -- they use process.stdout.write or the output() pattern. The switch case in ~/.claude/get-shit-done/bin/gsd-tools.cjs needs a case 'skeptic' entry that imports and calls your handler.

</details>

<details>
<summary>Hint 5</summary>

Create ~/.claude/get-shit-done/bin/lib/skeptic.cjs with a cmdSkeptic function that uses process.stdout.write for output, then export it via module.exports. Next, add case 'skeptic': in the switch statement in ~/.claude/get-shit-done/bin/gsd-tools.cjs to import your module and call the handler. Follow the same import-and-call pattern you see in the existing switch cases.

</details>

