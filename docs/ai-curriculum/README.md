# GSD Curriculum: Complete AI Learning Guide

This document contains the complete GSD (Get Shit Done) curriculum. It is designed to be read sequentially — each module builds on the previous. By the end, you will understand how GSD commands work, how they execute end-to-end, and how GSD manages planning state.

## Table of Contents

- [Module 1: GSD Commands & Workflows](#module-1-gsd-commands-workflows)
  - [Lesson 1: The Two-Layer Architecture](#lesson-1-the-two-layer-architecture)
  - [Lesson 2: Command Spec Anatomy](#lesson-2-command-spec-anatomy)
  - [Lesson 3: Workflow File Anatomy](#lesson-3-workflow-file-anatomy)
  - [Lesson 4: Command to Workflow Wiring](#lesson-4-command-to-workflow-wiring)
  - [Lesson 5: Bridge to Node.js](#lesson-5-bridge-to-nodejs)
  - [Mini-Project: Build /gsd:skeptic](#mini-project-build-gsdskeptic)
- [Module 2: Command Lifecycle](#module-2-command-lifecycle)
  - [Lesson 1: Welcome to GSD](#lesson-1-welcome-to-gsd)
  - [Lesson 2: Where Commands Start](#lesson-2-where-commands-start)
  - [Lesson 3: Command Dispatch](#lesson-3-command-dispatch)
  - [Lesson 4: Tool Modules](#lesson-4-tool-modules)
  - [Lesson 5: State and Configuration](#lesson-5-state-and-configuration)
  - [Mini-Project: Build /gsd:skeptic (Full-Stack)](#mini-project-build-gsdskeptic-full-stack)
- [Module 3: Planning & State](#module-3-planning-state)
  - [Lesson 1: The Planning Directory](#lesson-1-the-planning-directory)
  - [Lesson 2: PROJECT.md: The Identity Card](#lesson-2-projectmd-the-identity-card)
  - [Lesson 3: Requirements and Roadmap: From Goals to Phases](#lesson-3-requirements-and-roadmap-from-goals-to-phases)
  - [Lesson 4: Inside a Phase: Plan, Execute, Verify](#lesson-4-inside-a-phase-plan-execute-verify)
  - [Lesson 5: State Tracking & Milestone Lifecycle](#lesson-5-state-tracking-milestone-lifecycle)
  - [Lesson 6: From Idea to Shipped Milestone](#lesson-6-from-idea-to-shipped-milestone)
  - [Mini-Project: Build Persistent Skeptic Reviews](#mini-project-build-persistent-skeptic-reviews)
- [Module 4: Agent Orchestration](#module-4-agent-orchestration)
  - [Lesson 1: The Orchestration Model](#lesson-1-the-orchestration-model)
  - [Lesson 2: Subagent Types](#lesson-2-subagent-types)
  - [Lesson 3: Wave Execution](#lesson-3-wave-execution)
  - [Lesson 4: The Orchestrator Pattern](#lesson-4-the-orchestrator-pattern)
  - [Lesson 5: Checkpoints and Gates](#lesson-5-checkpoints-and-gates)
  - [Lesson 6: Auto-Advance Chains](#lesson-6-auto-advance-chains)
  - [Lesson 7: The Full Lifecycle](#lesson-7-the-full-lifecycle)
  - [Mini-Project: Build Orchestrated Skeptic Reviews](#mini-project-build-orchestrated-skeptic-reviews)

---

## Module 1: GSD Commands & Workflows

Learn how GSD slash commands dispatch through command specs to workflow files.

### Lesson 1: The Two-Layer Architecture

**Objective:** Understand that every GSD slash command is defined by two markdown files: a command spec that declares what the command does and a workflow that contains the execution instructions.

When you type /gsd:quick in Claude, something interesting happens behind the scenes. Claude doesn't execute a compiled program or run a binary. Instead, it reads two plain markdown files. The first file is a command spec -- it declares what the command is, what arguments it takes, and what tools it needs. The second file is a workflow -- it contains the actual step-by-step instructions for execution. This two-layer architecture is the foundation of everything in GSD.

```yaml
---
name: gsd:quick
description: Execute a quick task with GSD guarantees
argument-hint: "[--full] [--discuss]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---
```

That YAML frontmatter is the command's identity card. The name field tells Claude which slash command triggers this file. The description appears in help text. The allowed-tools array is a security boundary -- it controls exactly which tools Claude can use during execution. Notice there's no actual logic here, just declarations.

```markdown
<objective>
Execute small, ad-hoc tasks with GSD guarantees
(atomic commits, STATE.md tracking).
</objective>

<execution_context>
@C:/Users/18182/.claude/get-shit-done/workflows/quick.md
</execution_context>
```

The command spec uses XML tags like <objective>, <context>, and <process> to organize its instructions. But the most important line is the @file reference inside <execution_context>. This is the wiring -- it tells Claude to load the workflow file at that path. The command spec says what; the workflow says how.

```markdown
<purpose>
Quick mode is the same system with a shorter path:
- Spawns gsd-planner (quick mode) + gsd-executor(s)
- Quick tasks live in .planning/quick/
- Updates STATE.md "Quick Tasks Completed" table
</purpose>

<process>
<step name="validate">
Run init quick to get task context...
</step>
</process>
```

Workflow files have no YAML frontmatter. They jump straight into XML sections: <purpose> explains the workflow's goal, and <process> contains named <step> tags that define execution order. The workflow also contains bash code blocks with the actual CLI commands to run. While command specs are short declarations (typically 20-50 lines), workflows can be hundreds of lines of detailed instructions.

Here's the mental model: command specs are like function signatures -- they declare the interface. Workflows are like function bodies -- they contain the implementation. When you run /gsd:quick, Claude reads the command spec to understand what tools and context it needs, then follows the workflow's step-by-step process to actually do the work. Every GSD command follows this exact pattern.

---

### Lesson 2: Command Spec Anatomy

**Objective:** Understand the structure of a GSD command spec file by examining each section of the real quick.md command spec -- frontmatter, objective, execution_context, context, and process.

A command spec is a markdown file that lives in ~/.claude/commands/gsd/ and defines a slash command. When you type /gsd:quick, Claude looks for a file called quick.md in that directory. The file has two parts: YAML frontmatter at the top that declares metadata, and XML sections below that define the command's behavior. Let's open the real quick.md and walk through every section.

```yaml
---
name: gsd:quick
description: Execute a quick task with GSD guarantees
  (atomic commits, state tracking) but skip optional agents
argument-hint: "[--full] [--discuss]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---
```

The name field (gsd:quick) is the slash command identifier -- it's what you type after the forward slash. The description appears in help text and tells both humans and Claude what this command does. The argument-hint shows what flags are available. The allowed-tools array is a security boundary: it restricts which Claude Code tools this command can use during execution. If a tool isn't listed here, the command cannot use it.

```markdown
<objective>
Execute small, ad-hoc tasks with GSD guarantees
(atomic commits, STATE.md tracking).

Quick mode is the same system with a shorter path:
- Spawns gsd-planner (quick mode) + gsd-executor(s)
- Quick tasks live in `.planning/quick/`
- Updates STATE.md "Quick Tasks Completed" table
</objective>
```

The <objective> section is the command's mission statement. It tells Claude what the command should accomplish in plain English. Notice it describes outcomes (atomic commits, state tracking) and architecture (spawns planner + executor). Claude reads this first to understand the overall intent before looking at execution details. Think of it as the 'what' -- it scopes the command without dictating implementation steps.

```markdown
<execution_context>
@C:/Users/18182/.claude/get-shit-done/workflows/quick.md
</execution_context>
```

The <execution_context> section contains an @file reference -- a path prefixed with @ that tells Claude Code to load that file as additional context. This is the critical wiring between the two layers. When Claude processes quick.md, it sees @C:/Users/18182/.claude/get-shit-done/workflows/quick.md and loads the entire workflow file. Without this line, the command spec would be a description with no instructions to follow.

```markdown
<context>
$ARGUMENTS

Context files are resolved inside the workflow
(init quick) and delegated via <files_to_read> blocks.
</context>

<process>
Execute the quick workflow from
@C:/.../workflows/quick.md end-to-end.
Preserve all workflow gates (validation,
task description, planning, execution,
state updates, commits).
</process>
```

The <context> section passes runtime data to the command -- here $ARGUMENTS captures whatever the user typed after the slash command. The <process> section provides high-level execution guidance, pointing Claude back to the workflow file for detailed steps. Notice how lean this command spec is: about 45 lines total. It declares identity (frontmatter), intent (objective), wiring (execution_context), input (context), and guidance (process). The heavy lifting lives in the workflow file.

---

### Lesson 3: Workflow File Anatomy

**Objective:** Understand the structure of a GSD workflow file by examining the real quick.md workflow -- its purpose section, process steps, embedded bash commands, and nested XML patterns.

A workflow file is a markdown file that contains step-by-step execution instructions. Unlike command specs, workflows have no YAML frontmatter -- they jump straight into XML sections. The quick.md workflow is 585 lines long and defines everything Claude does when you run /gsd:quick. Let's examine its key sections to understand the pattern that every GSD workflow follows.

```markdown
<purpose>
Execute small, ad-hoc tasks with GSD guarantees
(atomic commits, STATE.md tracking). Quick mode
spawns gsd-planner (quick mode) + gsd-executor(s),
tracks tasks in `.planning/quick/`, and updates
STATE.md's "Quick Tasks Completed" table.

With `--discuss` flag: lightweight discussion phase
before planning.

With `--full` flag: enables plan-checking
(max 2 iterations) and post-execution verification.
</purpose>
```

The <purpose> section mirrors the command spec's <objective> but with more implementation detail. It explains not just what the workflow does, but how it achieves it -- spawning sub-agents, tracking in specific directories, updating specific files. Claude reads this to understand the overall flow before diving into individual steps. Notice how it documents the flag variants: each flag changes the workflow's behavior.

```markdown
<process>
**Step 1: Parse arguments and get task description**

Parse `$ARGUMENTS` for:
- `--full` flag -> store as `$FULL_MODE` (true/false)
- `--discuss` flag -> store as `$DISCUSS_MODE` (true/false)
- Remaining text -> use as `$DESCRIPTION` if non-empty

If `$DESCRIPTION` is empty after parsing, prompt user
interactively.
```

Each step in the <process> section is a named unit of work. Step 1 parses arguments, Step 2 initializes, Step 3 creates directories, and so on. The naming is intentional: Claude processes steps sequentially and can report exactly where it is in the workflow. Steps use markdown formatting (bold headers, bullet lists, code blocks) to structure instructions clearly.

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" \
  init quick "$DESCRIPTION")
if [[ "$INIT" == @file:* ]]; then
  INIT=$(cat "${INIT#@file:}")
fi
```

Workflows embed real bash code blocks that Claude executes during the workflow. This example from Step 2 runs gsd-tools.cjs to initialize a quick task. The command returns JSON that Claude parses for configuration values. This is where the markdown layer meets the Node.js layer: the workflow tells Claude what to run, and the Node.js tools do the actual file system work, state management, and configuration updates.

```markdown
**Step 5: Spawn planner (quick mode)**

Task(
  prompt="
<planning_context>

**Mode:** ${FULL_MODE ? 'quick-full' : 'quick'}
**Directory:** ${QUICK_DIR}
**Description:** ${DESCRIPTION}

<files_to_read>
- .planning/STATE.md (Project State)
</files_to_read>

</planning_context>
",
  subagent_type="gsd-planner",
  model="{planner_model}"
)
```

Step 5 shows a pattern unique to GSD workflows: spawning sub-agents. The Task() call creates a new Claude instance with its own prompt, context files, and role. The workflow defines the prompt template inline, including nested XML tags like <planning_context> and <files_to_read>. This is how a single /gsd:quick command orchestrates a planner agent, an executor agent, and optionally a checker and verifier -- all described in plain markdown.

---

### Lesson 4: Command to Workflow Wiring

**Objective:** Trace the full dispatch chain from typing /gsd:quick to workflow execution, understanding how the command spec's @file reference loads the workflow and how each layer contributes to the final result.

You now know the anatomy of both file types: command specs declare a command's identity and intent with YAML frontmatter and XML sections. Workflow files contain the execution instructions with purpose, process steps, bash commands, and agent spawning. But how do these two files actually connect at runtime? This lesson traces the full dispatch chain -- the path from typing /gsd:quick to the workflow running its first bash command.

Step 1: You type /gsd:quick in Claude Code. Claude recognizes the gsd: prefix and looks in ~/.claude/commands/gsd/ for a file named quick.md. Step 2: Claude reads the command spec file top to bottom. It parses the YAML frontmatter to learn the command's name, description, and allowed tools. Step 3: Claude reaches the <execution_context> section and finds the @file reference. This triggers the critical handoff.

```markdown
<execution_context>
@C:/Users/18182/.claude/get-shit-done/workflows/quick.md
</execution_context>
```

Step 4: When Claude encounters the @file path, it loads the workflow file at that location as additional context. The entire 585-line workflow becomes available. Step 5: Claude reads the workflow's <purpose> section to understand the execution goal. Step 6: Claude begins executing the <process> steps sequentially -- parsing arguments, initializing tools, creating directories, spawning sub-agents. Each step may contain bash commands that Claude runs.

```yaml
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
```

The allowed-tools list in the command spec acts as a permission boundary for the entire execution. Even though the workflow file might describe complex operations, Claude can only use the tools listed in the spec. The Task tool is what enables the workflow to spawn sub-agents (planner, executor, checker). AskUserQuestion lets it prompt for input. If a tool isn't in this list, the workflow cannot use it -- this is a security guardrail built into the dispatch chain.

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" \
  init quick "$DESCRIPTION")
if [[ "$INIT" == @file:* ]]; then
  INIT=$(cat "${INIT#@file:}")
fi

## Parse JSON for: planner_model, executor_model,
## commit_docs, next_num, slug, quick_dir, task_dir
```

This bash block from the workflow's Step 2 shows the full chain in action. The command spec granted Bash tool access, so the workflow can run node commands. The gsd-tools.cjs script initializes the quick task and returns JSON configuration. Claude parses that JSON and uses the values in subsequent steps. The same pattern repeats for every GSD command: /gsd:new-project has its own spec and workflow, /gsd:execute-phase has its own pair, and each follows the same dispatch chain.

Here's the complete dispatch chain in one view: (1) user types /gsd:quick, (2) Claude reads the command spec at commands/gsd/quick.md, (3) frontmatter sets permissions and identity, (4) execution_context's @file loads the workflow, (5) workflow's purpose and process define what to execute, (6) bash code blocks call Node.js tools, (7) sub-agents are spawned via Task calls. Every GSD command you'll encounter follows this exact chain. The two-file architecture keeps declarations separate from execution, making each piece independently readable and modifiable.

---

### Lesson 5: Bridge to Node.js

**Objective:** Understand how the markdown layer (command specs and workflows) connects to the Node.js layer that actually executes CLI commands, previewing what Module 2 covers.

You now know that GSD slash commands are defined by two types of markdown files. Command specs declare what a command is -- its name, permissions, and structure. Workflows define how it executes -- step-by-step processes with bash code blocks. You've seen how @file references wire specs to workflows, and how the dispatch chain routes /gsd:quick through the whole system. But there's a question we haven't answered yet.

When a workflow says 'run node gsd-tools.cjs state advance-plan', who executes that? The markdown files are instructions for Claude, but the actual state management, file operations, and configuration updates happen in Node.js code. There's an entire layer beneath the markdown -- a CommonJS toolkit that does the real work. This is the Node.js layer, and it's what Module 2 is all about.

The entry point is gsd-tools.cjs -- a single Node.js script that acts as the CLI router. When Claude runs a bash command like 'node gsd-tools.cjs state advance-plan', the script parses the arguments and routes them through a switch statement. The first argument (like 'state' or 'config') selects which tool module to call. The remaining arguments become the specific operation and its parameters.

Behind the switch statement are the tool modules: core.cjs handles project initialization and plan management. config.cjs reads and writes the configuration JSON. phase.cjs manages phase transitions and plan counting. state.cjs updates STATE.md -- the living document that tracks where you are in a project. Each module exports functions that the CLI router calls. Module 2 walks through each of these files, showing you exactly how they work.

Remember the <process> sections in workflow files? They contain bash commands like 'node gsd-tools.cjs state advance-plan' and 'node gsd-tools.cjs roadmap update-plan-progress'. These are the connection points between the two layers. The markdown layer tells Claude what to run; the Node.js layer makes it happen. When you read Module 2, you'll recognize every CLI command from the workflows you've already studied.

The design is intentional: markdown files are easy to read, edit, and version control. They're the interface between humans and Claude. The Node.js layer handles the mechanical work -- parsing files, updating state, managing configuration -- that would be tedious and error-prone to describe in natural language. Understanding both layers means you can modify GSD at any level: tweak a workflow's instructions, add a new command spec, or extend a tool module with new functionality.

---

### Concept Map

```

  /gsd:command
        |
        v
  +------------------+
  | Overview         |
  | Two-layer arch:  |
  | specs + workflows|
  +------------------+
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
  | Dispatch Chain   |
  | spec -> workflow |
  | wiring + routing |
  +------------------+
        |
        v
  +------------------+
  | Bridge           |
  | Node.js Layer    |
  | (Module 2)       |
  +------------------+
        |
        v
  +-------------------+
  | Mini-Project      |
  | Build /gsd:skeptic|
  | (apply all)       |
  +-------------------+

```

### Mini-Project: Build /gsd:skeptic

Create a command spec + workflow pair that critiques a GSD phase

#### Artifacts

##### Skeptic command spec

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

##### Skeptic workflow

**Path:** `~/.claude/get-shit-done/workflows/skeptic.md`

**Verification Checks:**

- [ ] Has purpose section
- [ ] Has process section with steps

#### Hints

<details>
<summary>Hint 1</summary>

You have the workflow template already. Your two tasks are: customize it to reflect your own critique approach, and create the command spec that points to it. The spec is the part you write from scratch -- revisit Lessons 2 and 3 for the anatomy of each.

</details>

<details>
<summary>Hint 2</summary>

Start with the command spec. It needs YAML frontmatter (name, description, allowed-tools) and XML sections. The execution_context section is where you wire to the workflow. The workflow file already exists from the template -- focus on making the critique logic yours.

</details>

<details>
<summary>Hint 3</summary>

The command spec goes at ~/.claude/commands/gsd/skeptic.md. It needs frontmatter with name: gsd:skeptic, a description, and allowed-tools. Then four XML sections: objective, execution_context (with the @file reference to your workflow), context, and process.

</details>

<details>
<summary>Hint 4</summary>

For the command spec frontmatter: name: gsd:skeptic, description of what it does, and allowed-tools listing the tools Claude needs. In execution_context, add @~/.claude/get-shit-done/workflows/skeptic.md to wire the two layers. For the workflow, the template has purpose and process already -- your job is to make the critique steps genuinely yours.

</details>

<details>
<summary>Hint 5</summary>

Create ~/.claude/commands/gsd/skeptic.md with YAML frontmatter (name: gsd:skeptic, description, allowed-tools) and sections: objective (what skeptic does), execution_context (containing @~/.claude/get-shit-done/workflows/skeptic.md), context (what files to read), process (high-level steps). Your workflow at ~/.claude/get-shit-done/workflows/skeptic.md already has the template structure -- customize the steps, the voice, and the success criteria to reflect your personal approach to critique.

</details>


---

## Module 2: Command Lifecycle

Follow a GSD command from user input to execution, understanding how each piece connects.

### Lesson 1: Welcome to GSD

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

### Lesson 2: Where Commands Start

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

### Lesson 3: Command Dispatch

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

### Lesson 4: Tool Modules

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

### Lesson 5: State and Configuration

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

### Concept Map

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

### Mini-Project: Build /gsd:skeptic (Full-Stack)

Extend your skeptic command with a Node.js handler and switch case, completing all 4 GSD command layers

#### Artifacts

##### Skeptic command spec (Module 1)

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

##### Skeptic workflow (Module 1)

**Path:** `~/.claude/get-shit-done/workflows/skeptic.md`

**Verification Checks:**

- [ ] Has purpose section
- [ ] Has process section with steps

##### Skeptic handler module

**Path:** `~/.claude/get-shit-done/bin/lib/skeptic.cjs`

**Verification Checks:**

- [ ] File exports a module
- [ ] Follows the cmd* function naming convention
- [ ] Uses GSD output pattern

##### Switch case for skeptic command

**Path:** `~/.claude/get-shit-done/bin/gsd-tools.cjs`

**Verification Checks:**

- [ ] Skeptic case exists in switch statement

#### Hints

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


---

## Module 3: Planning & State

Understand how GSD structures projects with planning artifacts -- from PROJECT.md through milestones.

### Lesson 1: The Planning Directory

**Objective:** Understand GSD's .planning/ directory structure and the lifecycle of planning artifacts from project definition through milestone completion

Every GSD project has a .planning/ directory. It is the project's institutional memory -- a collection of markdown files that track decisions, state, and history across the entire lifecycle. Unlike code files that define behavior, these artifacts define intent and progress. GSD's planning system works because AI agents can read and write structured markdown. Each artifact follows a predictable format with YAML frontmatter and markdown sections, making them both human-readable and machine-parseable.

```text
.planning/
  PROJECT.md          # What this project is and why
  REQUIREMENTS.md     # What we need to build
  ROADMAP.md          # Phases, milestones, ordering
  STATE.md            # Where we are right now
  config.json         # GSD configuration
  phases/             # Per-phase execution records
    01-feature-name/
      01-01-PLAN.md
      01-01-SUMMARY.md
  codebase/           # Auto-generated code maps
  learn/              # Learning progress (you!)
```

The four highlighted files are the core planning artifacts. Together they form a pipeline where each artifact feeds into the next. PROJECT.md defines the what and why -- the project's purpose, audience, and core value. REQUIREMENTS.md breaks that purpose into measurable items with unique IDs. ROADMAP.md sequences those requirements into phases with dependencies. STATE.md tracks live execution position, velocity metrics, and accumulated decisions. This is not waterfall -- these are living documents that update as understanding grows.

```text
/gsd:kickoff            Creates PROJECT.md
      |
      v
/gsd:requirements       Creates REQUIREMENTS.md
      |                   (maps to PROJECT.md scope)
      v
/gsd:roadmap            Creates ROADMAP.md
      |                   (phases from requirements)
      v
/gsd:plan-phase         Creates PLAN.md files
      |                   (tasks from phase goals)
      v
/gsd:execute-phase      Creates SUMMARY.md files
      |                   (records what happened)
      v
/gsd:complete-milestone   Archives & tags
```

Here is the key insight: each command reads from previous artifacts and writes new ones. /gsd:requirements reads PROJECT.md to understand scope. /gsd:roadmap reads REQUIREMENTS.md to know what to sequence into phases. /gsd:plan-phase reads ROADMAP.md to know the phase goal, then produces PLAN.md files with concrete tasks. /gsd:execute-phase reads those plans and produces SUMMARY.md files recording what happened. This chain of reads creates full traceability -- you can always trace a task back through its plan, phase, requirement, and ultimately the project goal that spawned it.

Phase execution follows a five-step cycle. First, an optional discuss step gathers context about the domain. Second, an optional research step investigates technical approaches. Third, the plan step creates PLAN.md files with typed tasks, verification commands, and done criteria. Fourth, the execute step runs each task, commits atomically, and produces SUMMARY.md files. Fifth, a verify step checks must-haves against reality. Each phase directory accumulates these records, building a complete audit trail of what was planned versus what actually happened.

```text
phases/12-module-3-infrastructure/
  12-01-PLAN.md       # What to build
  12-01-SUMMARY.md    # What was built
  12-02-PLAN.md       # Next plan
  12-02-SUMMARY.md    # Its record
  12-VERIFICATION.md  # Phase verification
```

---

### Lesson 2: PROJECT.md: The Identity Card

**Objective:** Understand PROJECT.md anatomy -- its six sections, how Core Value drives prioritization, and how this artifact feeds all downstream planning

PROJECT.md is the project's identity card. It's created by /gsd:kickoff and is the FIRST artifact in any GSD project. Everything downstream -- REQUIREMENTS.md, ROADMAP.md, STATE.md, and every plan file -- traces back to what PROJECT.md defines. It answers three questions: What is this? Why does it matter? What are the boundaries? Every GSD project starts here, and the document lives at .planning/PROJECT.md throughout the project's lifecycle.

```markdown
### What This Is

[Current accurate description -- 2-3 sentences.
What does this product do and who is it for?
Use the user's language and framing.
Update whenever reality drifts from this description.]

### Core Value

[The ONE thing that matters most.
If everything else fails, this must work.
One sentence that drives prioritization when tradeoffs arise.]
```

Core Value is the tiebreaker. When two features compete for priority, Core Value decides. When scope creeps, Core Value is the filter. It's one sentence -- not a paragraph, not a list. The discipline of one sentence forces clarity. For example, if Core Value is "Users can find products in under 3 seconds", that tells you search performance beats visual polish every time. If a designer wants a richer product page but it slows search results, Core Value has already made the call.

```markdown
### Requirements

#### Validated

<!-- Shipped and confirmed valuable. -->

(None yet -- ship to validate)

#### Active

<!-- Current scope. Building toward these. -->

- [ ] [Requirement 1]
- [ ] [Requirement 2]
- [ ] [Requirement 3]

#### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- [Exclusion 1] -- [why]
- [Exclusion 2] -- [why]
```

The three-tier requirements structure tracks lifecycle, not just current state. "Active" is what you're building now -- these are hypotheses until shipped. "Validated" is what shipped and users confirmed works -- these are locked. "Out of Scope" includes reasoning so you don't re-add things you already decided against. Requirements flow from Active to Validated as you ship, and from Active to Out of Scope when you cut. This movement is tracked, creating a history of what was built, what worked, and what was deliberately excluded.

```markdown
### Context

[Background information that informs implementation:
- Technical environment or ecosystem
- Relevant prior work or experience
- User research or feedback themes
- Known issues to address]

### Constraints

- **[Type]**: [What] -- [Why]
- **[Type]**: [What] -- [Why]

Common types: Tech stack, Timeline, Budget,
Dependencies, Compatibility, Performance, Security

### Key Decisions

<!-- Decisions that constrain future work. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| [Choice] | [Why]     | [Good / Revisit / Pending] |
```

Key Decisions is institutional memory. When Claude or a future developer asks "why did we do X?", the answer lives here -- not in someone's head, not in a Slack thread. The table captures WHAT was decided, WHY (the rationale), and the OUTCOME (whether it proved correct, needs revisiting, or is still pending evaluation). This prevents relitigating settled decisions and gives context to anyone reading the project cold. Constraints serve a similar purpose: they document hard limits on implementation so no one wastes time exploring solutions that violate known boundaries.

PROJECT.md updates when: scope changes (requirements added or removed), reality drifts from the description ("What This Is" becomes inaccurate), key decisions are made, or constraints change. The /gsd:kickoff command creates it, but every phase can update it. After each phase transition, GSD checks: Were requirements invalidated? Move to Out of Scope with a reason. Were requirements validated? Move to Validated with a phase reference. After each milestone, there's a full review -- is Core Value still the right priority? Are Out of Scope reasons still valid? The template guidance comments visible in the code blocks above tell you WHEN and HOW to update each section.

PROJECT.md feeds every downstream artifact. REQUIREMENTS.md expands the Active requirements into detailed, traceable items with IDs and acceptance criteria. ROADMAP.md sequences those requirements into phases and milestones. STATE.md references PROJECT.md for current focus and core value -- it's the first thing Claude reads to understand project context. Even plan verification connects back: must_haves in plan files trace to whether they serve the Core Value. The chain is PROJECT.md -> REQUIREMENTS.md -> ROADMAP.md -> phase plans -> STATE.md, with PROJECT.md as the root that everything else derives from.

---

### Lesson 3: Requirements and Roadmap: From Goals to Phases

**Objective:** Understand how REQUIREMENTS.md breaks project goals into trackable items with IDs and how ROADMAP.md sequences those requirements into executable phases -- including the traceability chain that connects every task back to a project goal

In the previous lesson, PROJECT.md defined what your project is, its Core Value, and its active requirements. But those requirements are just checkboxes -- they don't tell you HOW to verify them, WHEN to build them, or how to track whether they're done. REQUIREMENTS.md breaks project goals into individually trackable items with unique IDs. ROADMAP.md sequences those items into phases with success criteria. Together, they create a traceability chain: every task traces back to a requirement, and every requirement traces back to Core Value. Nothing gets built without a reason, and nothing gets forgotten.

```markdown
## Requirements: [Project Name]

**Defined:** [date]
**Core Value:** [from PROJECT.md]

### v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

#### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User receives email verification after signup
- [ ] **AUTH-03**: User can reset password via email link
- [ ] **AUTH-04**: User session persists across browser refresh

#### [Category 2]

- [ ] **[CAT]-01**: [Requirement description]
- [ ] **[CAT]-02**: [Requirement description]

### v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

#### [Category]

- **[CAT]-01**: [Requirement description]
- **[CAT]-02**: [Requirement description]

### Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| [Feature] | [Why excluded] |
| [Feature] | [Why excluded] |
```

Each requirement gets a unique ID in the format [CATEGORY]-[NUMBER] -- AUTH-01, CONT-02, SOCL-03. Requirements are user-centric ("User can..."), testable (you can verify it works), and atomic (one checkable thing). The three-section structure -- v1, v2, Out of Scope -- is a scope management tool. v1 requirements are committed scope: they WILL appear in the roadmap. v2 requirements are acknowledged but deferred: they won't be in the current roadmap, but they're not forgotten. Out of Scope items are explicitly excluded WITH reasoning, so no one re-adds them without understanding why they were cut. You can't add something to v1 without removing something else or promoting from v2 -- the structure enforces discipline.

```markdown
### Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| [REQ-ID] | Phase [N] | Pending |

**Coverage:**
- v1 requirements: [X] total
- Mapped to phases: [Y]
- Unmapped: [Z]
```

The traceability table is the bridge between requirements and the roadmap. Every v1 requirement maps to exactly one phase. If a requirement is unmapped, that's a gap in your roadmap -- work that needs doing but has no home. Status flows as phases execute: Pending means not started, In Progress means the phase is active, Complete means the requirement has been verified. This creates an audit trail. You can always answer two questions: "Which requirement drove this work?" (look at the phase's requirement list) and "Is this requirement satisfied?" (check the status column). The traceability table is populated during roadmap creation and updated after each phase completes.

```markdown
#### Phase 1: [Name]
**Goal**: [What this phase delivers]
**Depends on**: Nothing (first phase)
**Requirements**: [REQ-01, REQ-02, REQ-03]
**Success Criteria** (what must be TRUE):
  1. [Observable behavior from user perspective]
  2. [Observable behavior from user perspective]
  3. [Observable behavior from user perspective]
**Plans**: [Number of plans]

Plans:
- [ ] 01-01: [Brief description of first plan]
- [ ] 01-02: [Brief description of second plan]
- [ ] 01-03: [Brief description of third plan]

#### Phase 2: [Name]
**Goal**: [What this phase delivers]
**Depends on**: Phase 1
**Requirements**: [REQ-04, REQ-05]
**Success Criteria** (what must be TRUE):
  1. [Observable behavior from user perspective]
  2. [Observable behavior from user perspective]
**Plans**: [Number of plans]
```

Each phase in ROADMAP.md is the execution unit. The Goal is outcome-shaped, not task-shaped -- "Users can authenticate and maintain sessions" rather than "Build login page." Dependencies declare ordering. Requirements list the REQ-IDs this phase satisfies (connecting back to REQUIREMENTS.md). Success Criteria are 2-5 observable behaviors from the user's perspective -- things you can see and verify. These success criteria flow downstream into must_haves in plan files and are checked after execution during phase verification. Plans break the phase into concrete work units. A phase might have 1-3 plans depending on scope, and each plan becomes a PLAN.md file with specific tasks.

```markdown
### Milestones

- ✅ **v1.0 MVP** - Phases 1-4 (shipped YYYY-MM-DD)
- 🚧 **v1.1 [Name]** - Phases 5-6 (in progress)
- 📋 **v2.0 [Name]** - Phases 7-10 (planned)

<details>
<summary>✅ v1.0 MVP (Phases 1-4) - SHIPPED YYYY-MM-DD</summary>

#### Phase 1: [Name]
**Goal**: [What this phase delivers]
**Plans**: 3 plans

Plans:
- [x] 01-01: [Brief description]
- [x] 01-02: [Brief description]
- [x] 01-03: [Brief description]

</details>

#### 🚧 v1.1 [Name] (In Progress)

**Milestone Goal:** [What v1.1 delivers]
```

Milestones group phases into shippable units. The emoji status indicators show progress at a glance: completed milestones are marked with a checkmark and collapsed inside details tags so they don't clutter the view, the current milestone stays expanded with an in-progress indicator, and future milestones show as planned. Phase numbering is continuous across milestones (never restart at 01) and uses integers for planned work and decimals (2.1, 2.2) for urgent insertions. The Progress table at the bottom tracks plan completion counts and status for every phase, giving a dashboard view of the entire project.

The full traceability chain runs: PROJECT.md Core Value -> REQUIREMENTS.md categories with IDs -> ROADMAP.md phases with success criteria -> PLAN.md tasks with must_haves. Each link is traceable in both directions. When a task is verified as complete, you can trace it back: this task belongs to this plan, which serves this phase, which satisfies these requirements, which deliver this Core Value. Going the other direction: this Core Value needs these requirements, which are scheduled in these phases, which are broken into these plans, which contain these tasks. Nothing gets built that doesn't serve the project goal. Nothing gets forgotten because every requirement is mapped to a phase. And when priorities shift, you can see exactly what's affected by tracing the chain. Now that you see how requirements become phases, the next lesson covers what happens INSIDE a phase -- the execution cycle of planning, executing, and verifying.

---

### Lesson 4: Inside a Phase: Plan, Execute, Verify

**Objective:** Understand the five-step phase execution cycle, PLAN.md anatomy (frontmatter and task XML), and how SUMMARY.md and VERIFICATION.md create an audit trail from goal to shipped code

In Lesson 3, you saw how requirements become phases in the roadmap -- each phase groups related requirements into a deliverable chunk of work. But what happens when a phase actually starts? Each phase follows a five-step execution cycle: discuss (optional context gathering with the user), research (optional technical investigation), plan (create PLAN.md files), execute (run tasks, produce SUMMARY.md files), and verify (check must_haves against reality). Not all steps are required -- simple phases skip discuss and research, jumping straight to planning. The three mandatory steps are plan, execute, and verify. This cycle ensures every phase produces not just code, but an audit trail proving the code achieves its goal.

```text
/gsd:discuss-phase  (optional)
       |
       v
/gsd:research-phase (optional)
       |
       v
/gsd:plan-phase     -> PLAN.md files
       |
       v
/gsd:execute-phase  -> SUMMARY.md files
       |
       v
/gsd:verify-phase   -> VERIFICATION.md
```

PLAN.md is the execution blueprint. Each phase produces 1-3 PLAN.md files, each containing 2-3 tasks. Plans have YAML frontmatter for machine-readable metadata and XML task blocks for specific implementation instructions. The key insight: plans are prompts -- they contain enough context and specificity that Claude can execute without asking clarifying questions. A well-written plan is a complete instruction set. If a different Claude instance couldn't execute it cold, the plan isn't specific enough.

```markdown
---
phase: XX-name
plan: NN
type: execute
wave: N                     # Execution wave (1, 2, 3...). Pre-computed at plan time.
depends_on: []              # Plan IDs this plan requires (e.g., ["01-01"]).
files_modified: []          # Files this plan modifies.
autonomous: true            # false if plan has checkpoints requiring user interaction
requirements: []            # Requirement IDs from ROADMAP this plan addresses.

## Goal-backward verification (derived during planning, verified after execution)
must_haves:
  truths: []                # Observable behaviors that must be true for goal achievement
  artifacts: []             # Files that must exist with real implementation
  key_links: []             # Critical connections between artifacts
---
```

Each frontmatter field serves a specific purpose. wave is the execution order -- wave 1 plans run in parallel, wave 2 waits for all wave 1 plans to finish. depends_on lists which specific plans must complete first, enabling fine-grained sequencing. files_modified declares exclusive file ownership, preventing merge conflicts when plans run in parallel. autonomous indicates whether the plan needs human checkpoints (visual verification, decisions) or can run fully unattended. requirements traces back to REQUIREMENTS.md IDs, maintaining traceability from code to business need. And must_haves is the goal-backward verification criteria: truths are observable behaviors that must be true, artifacts are files that must exist with real implementation (not stubs), and key_links are critical connections between artifacts that must be wired.

```xml
<task type="auto">
  <name>Task 1: Create User API endpoints</name>
  <files>src/features/user/api.ts</files>
  <action>GET /users (list), GET /users/:id (single), POST /users (create).
  Use User type from model. Validate email format on POST -- reject
  malformed emails with 400 status because downstream services
  assume valid email addresses.</action>
  <verify>curl tests pass for all endpoints</verify>
  <done>All CRUD operations work, invalid emails return 400</done>
</task>
```

Each task element has five children. name is action-oriented ("Create X", "Wire Y", "Add Z"). files lists exact paths this task modifies -- no ambiguity. action has specific implementation instructions including what to do, how to do it, and what to avoid and WHY (the "why" prevents future developers from removing safeguards they don't understand). verify has an automated command proving the task works -- not "check that it works" but a concrete command like "curl localhost:3000/users returns 200". done is measurable acceptance criteria -- the definition of complete. The specificity test: could a different Claude instance execute this task without asking clarifying questions? Task types include auto (fully autonomous), checkpoint:human-verify (pauses for human visual confirmation), and checkpoint:decision (pauses for human to choose between options).

```markdown
---
phase: XX-name
plan: YY
subsystem: [primary category: auth, payments, ui, api, database, infra, testing]
tags: [searchable tech: jwt, stripe, react, postgres, prisma]

## Dependency graph
requires:
  - phase: [prior phase this depends on]
    provides: [what that phase built that this uses]
provides:
  - [bullet list of what this phase built/delivered]
affects: [list of phase names or keywords that will need this context]

## Tech tracking
tech-stack:
  added: [libraries/tools added in this phase]
  patterns: [architectural/code patterns established]

key-files:
  created: [important files created]
  modified: [important files modified]

key-decisions:
  - "Decision 1"
  - "Decision 2"

requirements-completed: []  # Requirement IDs satisfied by this plan

## Metrics
duration: Xmin
completed: YYYY-MM-DD
---
```

SUMMARY.md is the execution record: what was built, how long it took, what decisions were made, and what deviated from the plan. But the frontmatter is where the real power lies. The dependency graph (requires/provides/affects) enables automatic context assembly -- when planning future phases, GSD scans all summaries and selects relevant ones based on what they provide and what the new phase needs. This means plans get the right context without manual curation. requirements-completed traces back to REQUIREMENTS.md IDs, closing the traceability loop: a requirement in PROJECT.md flows to REQUIREMENTS.md, gets sequenced in ROADMAP.md, gets addressed in PLAN.md, and is marked complete in SUMMARY.md. The chain is unbroken from intent to delivery.

VERIFICATION.md is the phase audit. After all plans in a phase execute, /gsd:verify-phase checks the must_haves from every plan against reality. It asks three questions: Are observable truths actually true? (Can the user really send a message, or does the button just log to console?) Do required artifacts exist with real implementation? (Is the API route substantive code or a stub returning hardcoded data?) Are key links wired? (Does the frontend actually call the backend, or do both exist in isolation?) Each check gets a status: VERIFIED, FAILED, or UNCERTAIN. The overall status is passed (all clear), gaps_found (critical issues remain), or human_needed (automated checks pass but visual confirmation required). If gaps are found, GSD generates fix plans -- targeted PLAN.md files that address specific gaps -- and the cycle repeats until verification passes. This is the safety net that catches the difference between "tasks completed" and "goal achieved".

---

### Lesson 5: State Tracking & Milestone Lifecycle

**Objective:** Understand STATE.md as the project's living memory that persists context across sessions, and the milestone lifecycle from completion through archival, version tagging, and retrospective

In Lesson 4, you saw how phases execute -- from PLAN.md blueprint through SUMMARY.md record to VERIFICATION.md audit. But what ties all those sessions and phases together? STATE.md is the project's short-term memory -- a single small file read first in every workflow and updated after every significant action. The problem it solves: information captured in summaries, issues, and decisions isn't systematically consumed. Each new session starts without context. STATE.md enables instant session restoration by keeping a living digest of where you are, what's been decided, and what's blocking progress. The key constraint: keep it under 100 lines. It's a digest, not an archive.

```markdown
## Project State

### Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** Real-time sync that feels instant
**Current focus:** v1.1 Security & Polish -- Phase 5

### Current Position

Phase: 5 of 6 (Security Audit)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-03-10 -- Completed Keychain migration

Progress: [██████░░░░] 62%

### Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 3.5 min
- Total execution time: 0.5 hours

### Accumulated Context

#### Decisions

- Phase 3: Used Canvas API over SVG for drawing performance
- Phase 5: Keychain storage for API keys (not UserDefaults)

#### Blockers/Concerns

- 3 pre-existing test failures (non-blocking)

### Session Continuity

Last session: 2026-03-10 14:30
Stopped at: Completed 05-01 Keychain migration plan
Resume file: None
```

STATE.md has a strict lifecycle. It's created after ROADMAP.md during project initialization. From then on, it's read first in every workflow -- /gsd:progress reads it to present status, /gsd:plan-phase reads it to inform planning decisions, /gsd:execute-phase reads it to know the current position, and /gsd:transition-phase reads it to know what's complete. It's written after every significant action: after a SUMMARY.md is created, STATE.md updates position, notes new decisions, and adds blockers. After a phase completes, it updates the progress bar, clears resolved blockers, and refreshes the Project Reference date. This is what makes context persist across sessions -- without it, every session starts from scratch.

When all phases in a milestone are complete, the complete-milestone workflow handles the shipping process. It creates a MILESTONES.md entry with stats and accomplishments, performs a full PROJECT.md evolution review (validating 'What This Is', verifying core value, moving shipped requirements to Validated, auditing Out of Scope items, updating context, and adding decisions with outcomes). It archives ROADMAP.md and REQUIREMENTS.md to a milestones/ directory, creates a git tag for the release, and writes a retrospective. This is how institutional memory is preserved -- nothing is lost, but working documents stay constant-size.

```markdown
### v1.0 MVP (Shipped: 2025-11-25)

**Delivered:** Menu bar weather app with current conditions and 3-day forecast

**Phases completed:** 1-4 (7 plans total)

**Key accomplishments:**
- Menu bar app with popover UI (AppKit)
- OpenWeather API integration with auto-refresh
- Current weather display with conditions icon
- 3-day forecast list with high/low temperatures
- Code signed and notarized for distribution

**Stats:**
- 47 files created
- 2,450 lines of Swift
- 4 phases, 7 plans, 28 tasks
- 12 days from start to ship

**Git range:** `feat(01-01)` -> `feat(04-01)`

**What's next:** Security audit and hardening for v1.1
```

When a milestone completes, the archival process preserves full history while keeping working documents constant-size. Three things happen: (1) ROADMAP.md is archived to milestones/vX.Y-ROADMAP.md and the completed milestone's phases are collapsed into a details/summary tag in the active ROADMAP, so they're still accessible but don't clutter the view. (2) REQUIREMENTS.md is archived to milestones/vX.Y-REQUIREMENTS.md and then deleted -- the next milestone starts with a fresh requirements file, keeping it scoped to current work. (3) PROJECT.md gets a full evolution review -- validate 'What This Is' still describes the product, verify core value hasn't shifted, move all shipped requirements to Validated, audit Out of Scope reasoning, update context with current codebase state, and add key decisions with outcomes. This prevents the planning documents from growing unbounded while preserving everything in the archive.

```markdown
## Roadmap: WeatherBar

### Milestones

- v1.0 MVP -- Phases 1-4 (shipped 2025-11-25)
- v1.1 Security -- Phases 5-6 (in progress)
- v2.0 Redesign -- Phases 7-10 (planned)

### Phases

<details>
<summary>v1.0 MVP (Phases 1-4) -- SHIPPED 2025-11-25</summary>

- [x] Phase 1: Foundation (2/2 plans) -- completed 2025-11-15
- [x] Phase 2: Authentication (2/2 plans) -- completed 2025-11-18
- [x] Phase 3: Core Features (3/3 plans) -- completed 2025-11-22
- [x] Phase 4: Polish (1/1 plan) -- completed 2025-11-25

</details>

#### v1.1 Security (In Progress)

- [ ] Phase 5: Security Audit (2 plans)
- [ ] Phase 6: Hardening (1 plan)
```

RETROSPECTIVE.md is a living document updated after each milestone. It captures What Was Built, What Worked, What Was Inefficient, Patterns Established, Key Lessons, and Cost Observations. But its real power is the Cross-Milestone Trends section -- tables that track process evolution (how many sessions, what changed in the process), cumulative quality (tests, coverage), and top lessons verified across multiple milestones. A lesson that appears once might be situational. A lesson that appears in three milestones is a proven pattern. The retrospective feeds forward into future planning: if 'keeping STATE.md under 100 lines improved velocity' shows up as a verified lesson, that constraint gets baked into future milestone planning.

```markdown
### Milestone: v1.0 -- MVP

**Shipped:** 2025-11-25
**Phases:** 4 | **Plans:** 7

#### What Was Built
- Menu bar weather app with popover UI
- OpenWeather API integration with auto-refresh
- Code signing and notarization pipeline

#### What Worked
- Phase-level planning prevented scope creep
- TDD on API layer caught 3 integration bugs early

#### What Was Inefficient
- Phase 3 plans were too large (4 tasks each)
- Spent time on custom icons before validating UX

#### Patterns Established
- Max 3 tasks per plan for maintainable execution
- Visual verification checkpoints after UI phases

#### Key Lessons
1. Smaller plans execute faster than larger ones
2. Verify UX before polishing visuals

---

### Cross-Milestone Trends

#### Process Evolution

| Milestone | Phases | Key Change              |
|-----------|--------|-------------------------|
| v1.0      | 4      | Established GSD cadence |

#### Top Lessons (Verified Across Milestones)

1. Smaller plans (2-3 tasks) consistently outperform larger ones
```

STATE.md and milestones are bookends of the execution cycle. STATE.md is the 'where are we now' -- live, updated constantly, read every session, kept small. Milestones are the 'where have we been' -- archived, immutable once shipped, referenced when needed for patterns and decisions. Together they solve the biggest problem in long-running AI-assisted projects: context loss. STATE.md ensures no session starts cold. Milestones ensure no lesson is forgotten. The retrospective feeds patterns forward. And the archival process keeps working documents from growing unbounded. In the next lesson, we'll bring everything together -- PROJECT.md, REQUIREMENTS.md, ROADMAP.md, PLAN.md, SUMMARY.md, STATE.md, and milestones -- into one connected mental model, and prepare you for the mini-project where you'll create your own planning artifacts.

---

### Lesson 6: From Idea to Shipped Milestone

**Objective:** Synthesize all planning concepts into one connected mental model and understand how GSD artifacts create persistent institutional memory across sessions, preparing you for the mini-project

You've now seen every planning artifact GSD produces. Let's trace a complete project lifecycle from idea to shipped milestone, seeing how each artifact feeds the next. The key insight: these aren't independent documents -- they form a chain where each artifact's output becomes the next artifact's input. PROJECT.md feeds REQUIREMENTS.md, which feeds ROADMAP.md, which feeds PLAN.md, which produces SUMMARY.md, which updates STATE.md, which tracks progress toward milestones. This chain is what makes GSD work for long-running projects where context would otherwise be lost between sessions.

```text
Idea -> /gsd:kickoff
         |
    PROJECT.md (What & Why) -- feeds -> Core value, constraints, context
         |
    REQUIREMENTS.md (What to build) -- feeds -> REQ-IDs, categories, scope
         |
    ROADMAP.md (When & order) -- feeds -> Phases, milestones, dependencies
         |
    For each phase:
         |
    PLAN.md (How to build) -- feeds -> Tasks, file ownership, must_haves
         |
    SUMMARY.md (What happened) -- feeds -> Decisions, patterns, issues
         |
    STATE.md (Where are we) -- feeds -> Position, velocity, blockers
         |
    When all phases complete:
         |
    /gsd:complete-milestone -> MILESTONES.md, archives, git tag
         |
    RETROSPECTIVE.md -- feeds -> Lessons for next milestone
```

Let's make this concrete. Imagine you're building a CLI tool for fast file search. You run /gsd:kickoff, which creates PROJECT.md capturing your core value ("fast file search across large codebases"), constraints ("must work on Windows and Linux"), and non-goals ("not a full IDE"). From PROJECT.md, /gsd:requirements creates REQUIREMENTS.md with REQ-IDs like SEARCH-01 ("index local files by content"), SEARCH-02 ("support regex patterns"), SEARCH-03 ("parse boolean queries"). From requirements, /gsd:roadmap creates ROADMAP.md grouping them into phases: Phase 1 (index engine, SEARCH-01), Phase 2 (query parser, SEARCH-02 and SEARCH-03), Phase 3 (CLI interface). Each requirement traces to exactly one phase.

Phase 1 starts: /gsd:plan-phase creates PLAN.md with 2 tasks (create index data structure, implement file walker). /gsd:execute-phase runs both tasks, producing SUMMARY.md recording what was built (B-tree index, recursive walker), decisions made (chose mmap for large files), and patterns established (streaming reads for memory safety). STATE.md updates: "Phase 1 of 3, 1/1 plans complete." Phase 2 follows the same cycle -- plan, execute, verify. Its SUMMARY.md references Phase 1's decisions: "Uses B-tree index from Phase 1, added regex support via streaming match." After Phase 3, all requirements are met. The traceability chain is unbroken: SEARCH-01 in REQUIREMENTS.md maps to Phase 1 in ROADMAP.md, addressed in Phase 1's PLAN.md, marked complete in Phase 1's SUMMARY.md.

You run /gsd:complete-milestone. It creates a MILESTONES.md entry with stats (3 phases, 4 plans, 8 tasks, 4 days). It archives ROADMAP.md and REQUIREMENTS.md to milestones/v1.0-ROADMAP.md and v1.0-REQUIREMENTS.md -- preserving the historical record while clearing the workspace. It evolves PROJECT.md, moving shipped requirements to Validated and updating context with current state. It creates a git tag v1.0. It writes RETROSPECTIVE.md capturing what worked ("streaming reads avoided memory issues") and what didn't ("should have added regex support earlier -- Phase 3 needed it"). The project is now ready for v1.1, and every decision, trade-off, and lesson learned is preserved in the artifact chain.

The key pattern is artifact persistence. Every GSD artifact solves the same fundamental problem: context loss. PROJECT.md persists the "why" across the entire project lifetime. REQUIREMENTS.md persists the "what" within a milestone. ROADMAP.md persists the "when and order." PLAN.md persists the "how" for each phase. SUMMARY.md persists "what actually happened." STATE.md persists "where we are right now." MILESTONES.md persists "where we've been." RETROSPECTIVE.md persists "what we learned." Without these artifacts, every new session starts from zero -- the developer explains the project again, Claude re-discovers the architecture, and previous decisions get unknowingly reversed. With them, continuity is automatic.

```text
Session start:
  1. Read STATE.md          -> "Phase 2 of 3, plan 1 of 2, last activity: implemented index engine"
  2. Read PROJECT.md        -> Core value, constraints, key decisions
  3. Read ROADMAP.md        -> Phase 2 depends on Phase 1, requirements SEARCH-03, SEARCH-04
  4. Read Phase 1 SUMMARY   -> Index engine uses B-tree, decided on mmap for large files
  5. Read Phase 2 PLAN      -> Task 1: build query parser, Task 2: add regex support

Result: Full context restored in < 30 seconds. No human re-explanation needed.
```

In the mini-project, you'll apply this pattern yourself. You'll extend the skeptic command you built in Module 1 to produce a persistent artifact -- SKEPTIC-REVIEW.md -- that captures findings from each run. On future runs, the workflow will read previous reviews, building continuity across sessions. This is the same read-previous/write-new pattern that STATE.md, SUMMARY.md, and RETROSPECTIVE.md all use. You're not learning a new concept -- you're applying the one pattern that makes GSD work: artifacts that persist context so the next session doesn't start from zero.

```text
Skeptic workflow (before):        Skeptic workflow (after):
  1. Read codebase                  1. Read previous SKEPTIC-REVIEW.md
  2. Analyze                        2. Read codebase
  3. Print findings                 3. Analyze (with historical context)
  4. (findings lost)                4. Write new SKEPTIC-REVIEW.md
                                    5. Print findings
                                    6. (findings persist for next run)
```

You now understand the complete GSD planning system -- from the first /gsd:kickoff through shipped milestones. The pattern is always the same: capture context in structured artifacts, read them at the start of each session, write updated versions as work progresses. This is how a solo developer and Claude can maintain coherent, long-running projects without losing institutional knowledge. The artifacts aren't bureaucracy -- they're the project's memory. And in the mini-project, you'll build that memory into a workflow yourself. Time to put it into practice.

---

### Concept Map

```
  /gsd:kickoff
        |
        v
  +------------------+
  | PROJECT.md       |
  | (What & Why)     |
  +------------------+
        |
        v
  +------------------+
  | REQUIREMENTS.md  |
  | (What to build)  |
  +------------------+
        |
        v
  +------------------+
  | ROADMAP.md       |
  | (When & order)   |
  +------------------+
        |
        v
  +------------------+     +------------------+
  | PLAN.md          |---->| SUMMARY.md       |
  | (How to build)   |     | (What happened)  |
  +------------------+     +------------------+
        |
        v
  +------------------+
  | STATE.md         |
  | (Where are we)   |
  +------------------+
        |
        v
  +------------------+
  | Milestone        |
  | (Ship & archive) |
  +------------------+

```

### Mini-Project: Build Persistent Skeptic Reviews

Extend your skeptic workflow to produce persistent SKEPTIC-REVIEW.md artifacts that accumulate institutional knowledge across runs

#### Artifacts

##### Skeptic workflow with artifact persistence

**Path:** `~/.claude/get-shit-done/workflows/skeptic.md`

**Verification Checks:**

- [ ] Has purpose section
- [ ] Has process section
- [ ] Reads previous review artifact
- [ ] Writes new review artifact

##### Persistent skeptic review artifact

**Path:** `.planning/SKEPTIC-REVIEW.md`

**Verification Checks:**

- [ ] Has date or timestamp
- [ ] Has findings or observations section

#### Hints

<details>
<summary>Hint 1</summary>

Your skeptic workflow currently analyzes a project and prints findings -- then they vanish. The artifact persistence pattern solves this: read what was found before, write what was found now. Think about what your workflow needs to DO differently, not what it needs to SAY.

</details>

<details>
<summary>Hint 2</summary>

Your workflow needs two new steps in its process section: one that reads .planning/SKEPTIC-REVIEW.md if it exists (before analysis), and one that writes findings to .planning/SKEPTIC-REVIEW.md (after analysis). The template from the lesson page shows the pattern -- press C on the lesson to copy it.

</details>

<details>
<summary>Hint 3</summary>

Add a step in your workflow's process section that reads the previous review artifact. It should check if .planning/SKEPTIC-REVIEW.md exists, read its contents for historical context, and use previous findings to inform the current analysis. If the file does not exist yet, the step should note that this is the first review.

</details>

<details>
<summary>Hint 4</summary>

Add a step that writes findings to .planning/SKEPTIC-REVIEW.md. Each run should append a new dated section (like ## 2024-03-15) rather than overwriting. Include findings, observations, and recommendations. The file accumulates over time -- that is what makes it persistent.

</details>

<details>
<summary>Hint 5</summary>

In your workflow at ~/.claude/get-shit-done/workflows/skeptic.md, add two new steps inside the process section. The first step (name it something like read_previous_reviews) reads .planning/SKEPTIC-REVIEW.md for historical context. The second step (name it something like write_review_artifact) writes the current analysis as a new dated section to .planning/SKEPTIC-REVIEW.md. Then run /gsd:skeptic on any project to generate the artifact file. Verify with --verify --module=planning-state.

</details>


---

## Module 4: Agent Orchestration

Learn how GSD orchestrates work through subagents -- wave-based parallelization, checkpoints, and auto-advance chains.

### Lesson 1: The Orchestration Model

**Objective:** Understand how GSD uses an orchestration model where a coordinator agent spawns specialized subagents with fresh context, rather than running everything in a single long-lived agent.

GSD breaks work into phases and plans, but who actually executes them? You might assume a single agent reads the plan and does everything. But that approach has a fatal flaw -- as an agent works through tasks, it fills its context window. By task 8 of 12, it has forgotten the nuances from task 1. Quality degrades as context fills. GSD solves this with an orchestration model: a coordinator agent spawns specialized subagents, each starting with a fresh context window.

```text
<core_principle>
Orchestrator coordinates, not executes. Each subagent loads the
full execute-plan context. Orchestrator: discover plans -> analyze
deps -> group waves -> spawn agents -> handle checkpoints ->
collect results.
</core_principle>
```

Three key insights from that principle. First, the orchestrator coordinates but never writes code itself -- it spawns agents that do the work. Second, each subagent loads full context fresh, meaning every agent starts with a clean 200k-token window. Third, the orchestrator stays lean at roughly 10-15% context usage. This means the orchestrator can manage dozens of plans without its own quality degrading. The coordinator stays sharp because it never gets bogged down in implementation details.

```text
<purpose>
Execute all plans in a phase using wave-based parallel execution.
Orchestrator stays lean -- delegates plan execution to subagents.
</purpose>
```

The execution flow follows a clear sequence of discrete responsibilities: discover plans, analyze dependencies, group into waves, spawn agents per wave, handle checkpoints, collect results. Each step is a distinct job. The orchestrator never drifts into implementation -- it never edits a source file, never writes a test, never creates a component. It only reads plan metadata and spawns agents to do the actual building. This separation of concerns prevents scope creep at the coordination level.

```text
Task(
  subagent_type="gsd-executor",
  model="{executor_model}",
  prompt="
    <objective>
    Execute plan {plan_number} of phase {phase_number}-{phase_name}.
    Commit each task atomically. Create SUMMARY.md. Update STATE.md
    and ROADMAP.md.
    </objective>

    <files_to_read>
    Read these files at execution start using the Read tool:
    - {phase_dir}/{plan_file} (Plan)
    - .planning/STATE.md (State)
    - .planning/config.json (Config)
    </files_to_read>

    <success_criteria>
    - [ ] All tasks executed
    - [ ] Each task committed individually
    - [ ] SUMMARY.md created in plan directory
    </success_criteria>
  "
)
```

Notice what the orchestrator passes: paths, not content. The executor reads files itself with its fresh 200k context window. This is the path-only delegation pattern -- the orchestrator tells agents WHERE to look, not WHAT to do. The plan file IS the instruction set. The executor loads it, reads the tasks, executes them sequentially, commits each one, and produces a SUMMARY.md. The orchestrator never sees the code being written. Now you know the orchestration model: a lean coordinator spawns fresh agents that each load their own context. Next, we'll meet the specific agent types that play each role.

---

### Lesson 2: Subagent Types

**Objective:** Learn the five specialized subagent types in GSD (executor, planner, researcher, verifier, checker) and understand what each one reads, produces, and is responsible for.

The orchestrator spawns agents, but not all agents are the same. GSD has five specialized subagent types, each designed for a specific role in the workflow. The type determines what context the agent loads and what it is responsible for producing. This specialization prevents bloat -- an executor does not need planner logic, and a researcher does not need commit protocols. Each agent loads only what it needs.

```text
<step name="parse_segments">
Routing by checkpoint type:

| Checkpoints | Pattern    | Execution                         |
|-------------|------------|-----------------------------------|
| None        | A (auto)   | Single subagent: full plan +      |
|             |            | SUMMARY + commit                  |
| Verify-only | B (segment)| Segments between checkpoints.     |
|             |            | After verify -> SUBAGENT.          |
|             |            | After decision -> MAIN             |
| Decision    | C (main)   | Execute entirely in main context  |
</step>
```

The executor (gsd-executor) is the workhorse of GSD. It reads a PLAN.md file, executes tasks sequentially, commits each task atomically, and creates a SUMMARY.md when finished. The routing table above shows three execution patterns: Pattern A is fully autonomous -- a single executor agent does everything. Pattern B is segmented -- the agent pauses at checkpoints for human verification. Pattern C runs in main context for plans requiring decisions. Most plans use Pattern A.

```text
Task(
  prompt=filled_prompt,
  subagent_type="gsd-planner",
  model="{planner_model}",
  description="Plan Phase {phase}"
)

## Planner prompt includes:
## <files_to_read>
## - {state_path} (Project State)
## - {roadmap_path} (Roadmap)
## - {requirements_path} (Requirements)
## - {context_path} (USER DECISIONS)
## - {research_path} (Technical Research)
## </files_to_read>
```

The planner (gsd-planner) reads phase goals from ROADMAP.md and decomposes them into concrete tasks with dependencies. It produces PLAN.md files with frontmatter containing wave numbers, depends_on arrays, files_modified lists, and autonomous flags. The planner receives project state, requirements, user decisions from discuss-phase, and research findings. It outputs structured plans that executors can follow without ambiguity.

```text
Task(
  prompt="<objective>
  Research implementation approach for Phase {phase}: {name}
  </objective>

  <files_to_read>
  - {context_path} (USER DECISIONS from /gsd:discuss-phase)
  - {requirements_path} (Project requirements)
  - {state_path} (Project decisions and history)
  </files_to_read>

  <output>
  Write to: {phase_dir}/{phase_num}-RESEARCH.md
  </output>",
  subagent_type="gsd-phase-researcher",
  model="{researcher_model}"
)
```

The researcher (gsd-phase-researcher) investigates technical approaches before planning begins. It produces a RESEARCH.md with library evaluations, architecture patterns, and recommendations. The researcher is only spawned when discovery is needed -- if the technology is well-understood, planning proceeds directly. This prevents wasted effort on research when the path is already clear.

Two more agents close the quality loop. The verifier (gsd-verifier) runs after execution to check must_haves against reality -- do the artifacts exist on disk, do the key links work, are the stated truths actually observable in the codebase? It produces a VERIFICATION.md with a pass/fail score. The checker (gsd-plan-checker) reviews PLAN.md quality before execution -- task completeness, dependency correctness, scope sanity. Together, the verifier and checker bookend execution: the checker validates the plan, the verifier validates the result.

```text
Type                  | Spawned By     | Reads          | Produces
----------------------|----------------|----------------|------------------
gsd-executor          | execute-phase  | PLAN.md        | SUMMARY.md + commits
gsd-planner           | plan-phase     | ROADMAP.md     | PLAN.md files
gsd-phase-researcher  | plan-phase     | external docs  | RESEARCH.md
gsd-verifier          | verify-phase   | SUMMARY.md     | VERIFICATION.md
gsd-plan-checker      | plan-phase     | PLAN.md        | checker report
```

Each agent type has a clear contract: what it reads, what it produces, and who spawns it. The orchestrator (execute-phase) only spawns executors and verifiers. The planning orchestrator (plan-phase) spawns planners, researchers, and checkers. This separation means each orchestrator stays focused on its domain. Now that you know WHO the agents are, the next lesson covers HOW they execute in parallel through the wave system.

---

### Lesson 3: Wave Execution

**Objective:** Understand how GSD groups plans into waves based on dependencies and executes them in parallel, with spot-check verification after each wave.

Agents know their roles, but how does the orchestrator decide what runs when? Through waves. Plans declare dependencies via the depends_on field in their frontmatter. The orchestrator reads these declarations, groups plans into waves, and runs each wave's plans in parallel. Wave 1 plans have no dependencies. Wave 2 plans depend on wave 1 completions. The dependency graph drives execution order automatically.

```yaml
## Plan 01 -- no dependencies, runs in wave 1
---
phase: 05-feature
plan: 01
wave: 1
depends_on: []
files_modified: [src/models/user.ts]
autonomous: true
---

## Plan 02 -- also no dependencies, runs in wave 1
---
phase: 05-feature
plan: 02
wave: 1
depends_on: []
files_modified: [src/api/auth.ts]
autonomous: true
---

## Plan 03 -- depends on both, runs in wave 2
---
phase: 05-feature
plan: 03
wave: 2
depends_on: [05-01, 05-02]
files_modified: [src/pages/dashboard.tsx]
autonomous: true
---
```

Wave assignment follows a simple formula: wave = max(dependency waves) + 1. Plans 01 and 02 have no dependencies, so they start in wave 1. Plan 03 depends on both wave 1 plans, so it goes to wave 2. This is computed during planning, not at runtime -- the wave number is baked into the frontmatter. The planner analyzes the dependency graph and assigns waves upfront, so the orchestrator can execute without doing dependency resolution at runtime.

```text
<step name="discover_and_group_plans">
Load plan inventory with wave grouping in one call:

PLAN_INDEX=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs"
  phase-plan-index "${PHASE_NUMBER}")

Parse JSON for: plans[] (each with id, wave, autonomous,
objective, files_modified, task_count, has_summary),
waves (map of wave number -> plan IDs), incomplete,
has_checkpoints.

Report:
### Execution Plan

**Phase {X}: {Name}** -- {total_plans} plans across {wave_count} waves

| Wave | Plans         | What it builds  |
|------|---------------|-----------------|
| 1    | 01-01, 01-02  | {from objectives, 3-8 words} |
| 2    | 01-03         | ...             |
</step>
```

At runtime, the orchestrator calls phase-plan-index which reads all PLAN.md frontmatter, groups by wave number, and returns a structured index. Plans with has_summary: true are skipped -- they have already been executed. The orchestrator then iterates waves sequentially, but within each wave, plans run in parallel. This is the key insight: sequential waves, parallel plans within each wave. Wave 1 plans all start simultaneously. Only after all wave 1 plans complete does wave 2 begin.

```text
<step name="execute_waves">
For each wave:

1. Describe what's being built (BEFORE spawning):
   Read each plan's <objective>. Extract what's being built
   and why.

2. Spawn executor agents:
   Pass paths only -- executors read files themselves with
   their fresh 200k context. This keeps orchestrator context
   lean (~10-15%).

3. Wait for all agents in wave to complete.

4. Report completion -- spot-check claims first:
   For each SUMMARY.md:
   - Verify first 2 files from key-files.created exist on disk
   - Check git log --oneline --all --grep="{phase}-{plan}"
     returns >= 1 commit
   - Check for ## Self-Check: FAILED marker
</step>
```

After each wave completes, the orchestrator does not blindly trust agent reports. It runs spot-checks: do the SUMMARY files exist? Are there git commits matching the plan ID? Is there a Self-Check: FAILED marker? This lightweight verification catches failures without requiring full re-execution. If any spot-check fails, the orchestrator reports which plan failed and asks whether to retry or continue with remaining waves.

```text
For each SUMMARY.md:
- Verify first 2 files from key-files.created exist on disk
- Check git log --oneline --all --grep="{phase}-{plan}"
  returns >= 1 commit
- Check for ## Self-Check: FAILED marker

If ANY spot-check fails:
  Report which plan failed, route to failure handler --
  ask "Retry plan?" or "Continue with remaining waves?"
```

Wave execution gives GSD its speed. Independent plans run simultaneously, each with a fresh context window. The orchestrator stays lean -- it discovers plans, groups them into waves, spawns agents, and verifies results, never touching code itself. A phase with 6 plans across 3 waves finishes far faster than serial execution, because wave 1's 3 plans all run at the same time. You have seen how plans execute in waves. Next, we will examine the orchestrator's own design -- why it deliberately stays thin and what patterns keep it effective.

---

### Lesson 4: The Orchestrator Pattern

**Objective:** Understand the lean orchestrator design principle: how the orchestrator manages context budget through path-only delegation, and why this pattern repeats at every level of GSD.

Waves show how plans execute in parallel, but why does the orchestrator itself work reliably across many plans? Because it follows a strict design principle: stay lean. The orchestrator never reads file contents, never writes code, never makes implementation decisions. It passes paths and reads summaries. This is not a suggestion -- it is a survival constraint. If the orchestrator loaded even one plan's source files, it would consume 20-30% of its context window on a single plan, leaving nothing for the remaining nine.

```text
<context_efficiency>
Orchestrator: ~10-15% context. Subagents: fresh 200k each.
No polling (Task blocks). No context bleed.
</context_efficiency>

<step name="init_context" priority="first">
Load execution context (paths only to minimize orchestrator context):

INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs"
  init execute-phase "${PHASE}")

Extract from init JSON: executor_model, commit_docs, phase_dir,
plans, incomplete_plans, state_path, config_path.
</step>
```

The context budget principle is explicit: the orchestrator targets 10-15% context usage. Claude has a finite context window. If the orchestrator reads every file, it exhausts context before finishing. Instead, it reads only paths and metadata -- frontmatter from PLAN.md files, existence checks on SUMMARY.md files. The actual file content is read by executors in their own fresh context windows. This is why gsd-tools returns JSON with paths, not file contents. The init call returns executor_model, phase_dir, plans -- all metadata. No source code, no implementation details.

```text
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs"
  init execute-phase "${PHASE_ARG}")

Parse JSON for: executor_model, verifier_model, commit_docs,
parallelization, branching_strategy, branch_name, phase_found,
phase_dir, phase_number, phase_name, phase_slug, plans,
incomplete_plans, plan_count, incomplete_count, state_exists,
roadmap_exists, phase_req_ids.
```

When the orchestrator spawns an executor, it passes a prompt containing file PATHS -- @file references -- not file contents. The executor reads those files itself. This means the orchestrator uses roughly 100-200 tokens per plan spawn, while the executor gets a fresh 200k context to work with. The orchestrator can manage 10+ plans without degrading. Each executor starts at 0% context, reads the plan, reads the source files it needs, and builds at peak quality. The orchestrator never sees the code being written.

```text
<purpose>
Create executable phase prompts (PLAN.md files) for a roadmap
phase with integrated research and verification. Default flow:
Research (if needed) -> Plan -> Verify -> Done. Orchestrates
gsd-phase-researcher, gsd-planner, and gsd-plan-checker agents
with a revision loop (max 3 iterations).
</purpose>

Load all context in one call (paths only to minimize
orchestrator context):

INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs"
  init plan-phase "$PHASE")

Parse JSON for: researcher_model, planner_model, checker_model,
research_enabled, plan_checker_enabled, phase_found, phase_dir,
phase_number, has_research, has_context, has_plans, plan_count.
```

Plan-phase is ALSO an orchestrator -- it spawns the researcher (which investigates unknowns), then the planner (which creates PLAN.md files), then the checker (which validates them), then routes back for revision if needed. This is the same pattern: coordinate, delegate, verify. GSD has multiple orchestrators, each following the same lean principle. Execute-phase coordinates executors. Plan-phase coordinates researchers, planners, and checkers. Both load paths only, both delegate actual work to fresh agents, both stay at 10-15% context.

The orchestrator pattern is not just 'delegate work to subagents.' It is a specific discipline: the orchestrator reads metadata, makes routing decisions, and verifies outcomes -- nothing else. It does not peek at source files 'just to understand.' It does not 'help' the executor by pre-reading context. Every byte of context the orchestrator consumes is context it cannot use for coordinating the next plan. This discipline is what makes 10-plan phases possible. Next, we will see what happens when the orchestrator cannot run autonomously -- how checkpoints pause execution and resume after human decisions.

---

### Lesson 5: Checkpoints and Gates

**Objective:** Understand how GSD uses checkpoints for human-in-the-loop control: the three checkpoint types, the autonomous flag, continuation agents, and execution routing patterns.

Lean orchestrators run plans autonomously, but not ALL work can be fully automated. Visual verification, deployment approval, external service setup -- these need human judgment. GSD handles this through checkpoints: structured pause points in plan execution. The key principle is automation first -- Claude automates everything it can, then checkpoints verify the result. Checkpoints do not replace automation; they confirm it worked.

```yaml
## Plan with no checkpoints -- runs fully autonomously
---
phase: 05-feature
plan: 01
autonomous: true
---

## Plan with checkpoints -- pauses for human input
---
phase: 05-feature
plan: 02
autonomous: false
---

## A checkpoint task inside a plan:
<task type="checkpoint:human-verify" gate="blocking">
  <name>Verify login page renders correctly</name>
  <what-built>Login form with email/password fields and OAuth buttons</what-built>
  <how-to-verify>
    1. Visit http://localhost:3000/login
    2. Confirm email and password fields are visible
    3. Test with credentials: admin@test.com / password123
    4. Verify redirect to dashboard after login
  </how-to-verify>
  <resume-signal>"approved" or describe issues found</resume-signal>
</task>
```

There are three checkpoint types. checkpoint:human-verify (90% of cases) -- Claude automates everything, then the human confirms it works by visiting a URL, clicking through UI, or checking visual output. checkpoint:decision (9%) -- the human makes an implementation choice between options that Claude cannot decide alone. checkpoint:human-action (1%, rare) -- a truly unavoidable manual step like clicking an email verification link or entering a 2FA code. The critical rule: if Claude CAN do it via CLI or API, Claude MUST do it. Checkpoints verify AFTER automation, not replace it.

```text
<step name="checkpoint_handling">
Plans with autonomous: false require user interaction.

When executor returns a checkpoint:
- human-verify  -> Auto-spawn continuation agent
                   with user_response = "approved".
                   Log: Auto-approved checkpoint.
- decision      -> Auto-spawn continuation agent
                   with user_response = first option.
                   Log: Auto-selected: [option].
- human-action  -> Present to user (cannot be automated).
                   Auth gates cannot be automated.

Standard flow (not auto-mode):
1. Spawn agent for checkpoint plan
2. Agent runs until checkpoint -> returns structured state
3. Agent return includes: completed tasks table,
   current task + blocker, checkpoint type/details
4. Present to user with verification steps
5. User responds: "approved" | issue description | decision
6. Spawn CONTINUATION agent (NOT resume)
7. Continuation agent verifies previous commits,
   continues from resume point
8. Repeat until plan completes
</step>
```

When an executor hits a checkpoint task, it stops and returns its state: completed tasks with commit hashes, the current blocker, and what is awaited from the user. The orchestrator presents this to the user with specific verification steps. The user responds -- approved, an issue description, or a decision selection. Then a CONTINUATION agent is spawned. This is critical: not a resume of the old agent, but a fresh agent that picks up from where the checkpoint was. It verifies previous commits exist, loads the plan, and continues from the resume point. This preserves the fresh-context principle even across human checkpoints.

```text
<step name="parse_segments">
Routing by checkpoint type:

| Checkpoints  | Pattern        | Execution                    |
|--------------|----------------|------------------------------|
| None         | A (autonomous) | Single subagent: full plan   |
|              |                | + SUMMARY + commit           |
| Verify-only  | B (segmented)  | Segments between checkpoints |
|              |                | After verify -> SUBAGENT     |
|              |                | After decision -> MAIN       |
| Decision     | C (main)       | Execute entirely in main     |
|              |                | context                      |

Fresh context per subagent preserves peak quality.
Main context stays lean.
</step>
```

The routing is automatic based on checkpoint types found in the plan. Pattern A plans have no checkpoints -- they get one executor that does everything autonomously. Pattern B plans have verify-only checkpoints -- they get segmented execution where autonomous segments run as subagents and checkpoint segments pause for human input. Pattern C plans have decision checkpoints -- they execute entirely in the main orchestrator context because complex decisions need the orchestrator's full awareness. The executor scans for checkpoint tasks and routes accordingly, before any code runs.

Checkpoints create human-in-the-loop control without sacrificing automation. The orchestrator runs everything it can, pauses only when it must, and uses fresh continuation agents to maintain quality after pauses. Most plans (Pattern A) never pause at all. The few that do (Patterns B and C) get precise, structured interactions rather than vague 'is this okay?' prompts. Next, we will see the opposite end of the control spectrum -- how GSD chains entire phases together for fully hands-free execution with auto-advance.

---

### Lesson 6: Auto-Advance Chains

**Objective:** Understand how GSD chains phase lifecycles together for hands-free execution using the --auto flag and auto-advance configuration.

Checkpoints give human control when needed, but GSD can also run entire phase lifecycles hands-free. The auto-advance system chains plan -> execute -> verify -> transition automatically using the --auto flag. A single command can plan a phase, execute all its plans in waves, verify the results, mark the phase complete, and advance to the next one -- all without human interaction.

```text
Sync chain flag with intent -- if user invoked manually
(no --auto), clear the ephemeral chain flag:

if [[ ! "$ARGUMENTS" =~ --auto ]]; then
  node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" \
    config-set workflow._auto_chain_active false
fi

Read both the chain flag and user preference:

AUTO_CHAIN=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" \
  config-get workflow._auto_chain_active || echo "false")
AUTO_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" \
  config-get workflow.auto_advance || echo "false")
```

There are two auto-advance mechanisms. First, the --auto flag on a single invocation, which sets _auto_chain_active for that run. This is ephemeral -- it clears when the chain ends or the user invokes manually without the flag. Second, workflow.auto_advance in config.json, which is the persistent user preference -- it stays on until the user turns it off. When either is true, the system auto-approves checkpoints: human-verify gets 'approved,' decisions get the first option. Only human-action checkpoints (like auth gates) still pause.

```text
<step name="verify_completion">
Check current phase has all plan summaries:

ls .planning/phases/XX-current/*-PLAN.md | sort
ls .planning/phases/XX-current/*-SUMMARY.md | sort

Verification logic:
- Count PLAN files
- Count SUMMARY files
- If counts match: all plans complete
- If counts don't match: incomplete
</step>

<step name="update_roadmap_and_state">
TRANSITION=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs"
  phase complete "${current_phase}")

The CLI handles:
- Marking the phase checkbox as [x] complete with today's date
- Updating plan count to final (e.g., "3/3 plans complete")
- Updating the Progress table (Status -> Complete, adding date)
- Advancing STATE.md to next phase
- Detecting if this is the last phase in the milestone
</step>
```

The chain works like this: execute-phase completes all plans, then transition marks the phase done and advances STATE.md. If auto-advance is on, the next phase starts automatically. This creates a pipeline: plan Phase 5 -> execute Phase 5 -> verify Phase 5 -> transition to Phase 6 -> plan Phase 6 -> execute Phase 6, all without user interaction. The --no-transition flag breaks the chain if you want to stop after execution. The chain also stops at milestone boundaries -- when the last phase completes, the auto-advance flag is cleared automatically.

```text
Auto-mode checkpoint handling:

When executor returns a checkpoint AND auto-mode is active:

- checkpoint:human-verify
  -> Auto-spawn continuation agent
     with user_response = "approved"
  -> Log: Auto-approved checkpoint

- checkpoint:decision
  -> Auto-spawn continuation agent
     with user_response = first option
  -> Log: Auto-selected: [option]

- checkpoint:human-action
  -> Present to user (existing behavior)
  -> Auth gates cannot be automated
  -> Chain PAUSES here
```

In auto-mode, human-verify checkpoints are instantly approved -- the assumption is that if the automation passed its own verification, it is good enough to continue. Decision checkpoints auto-select the first option, because GSD planners front-load the recommended choice as option one. Only human-action checkpoints (like entering a 2FA code or clicking an email link) still pause the chain. This means a 10-phase milestone with verify-only checkpoints can run end-to-end without any user input at all.

Auto-advance completes the automation story. At one extreme, every plan has checkpoints and humans verify each step. At the other, the --auto flag chains entire milestones. Most real usage falls in between: auto-advance runs the pipeline, but a human-action checkpoint pauses for a deployment secret or a visual review that truly cannot be automated. The next lesson synthesizes everything -- how orchestration connects to the full GSD lifecycle from project definition to milestone completion.

---

### Lesson 7: The Full Lifecycle

**Objective:** Synthesize how all orchestration concepts compose into the complete GSD lifecycle, from project definition through milestone completion.

This final lesson connects all the pieces. You have learned: the orchestration model (Lesson 1), the five agent types (Lesson 2), wave execution (Lesson 3), lean orchestrator design (Lesson 4), checkpoints (Lesson 5), and auto-advance (Lesson 6). Now we will see how these compose into the complete GSD lifecycle -- from the first command to milestone completion.

```text
The Complete GSD Lifecycle:

/gsd:kickoff           -> PROJECT.md
/gsd:requirements      -> REQUIREMENTS.md
/gsd:roadmap           -> ROADMAP.md (phases with goals)

/gsd:discuss-phase N   -> CONTEXT.md (user decisions)

/gsd:plan-phase N      [ORCHESTRATOR]
  |-> gsd-phase-researcher  -> RESEARCH.md
  |-> gsd-planner           -> PLAN.md files
  |-> gsd-plan-checker      -> revision loop (max 3)

/gsd:execute-phase N   [ORCHESTRATOR]
  |-> discover plans, group into waves
  |-> Wave 1: spawn executors in parallel
  |     |-> gsd-executor -> commits + SUMMARY.md
  |     |-> gsd-executor -> commits + SUMMARY.md
  |-> spot-check Wave 1 results
  |-> Wave 2: spawn executors (depend on Wave 1)
  |     |-> gsd-executor -> commits + SUMMARY.md
  |-> checkpoint plans: pause -> human -> continuation
  |-> gsd-verifier -> VERIFICATION.md

/gsd:transition        -> advance STATE.md, next phase
/gsd:complete-milestone -> archive, retrospective
```

Let's walk through a concrete example: building a user authentication feature. /gsd:plan-phase reads the phase goal from ROADMAP.md, spawns a researcher to investigate auth libraries, then a planner that creates 2 plans -- database schema plus API routes in wave 1, login UI in wave 2. The checker verifies the plans have proper dependencies and frontmatter. /gsd:execute-phase discovers the 2 plans, groups them by wave. Wave 1's executor creates the database schema, implements API routes, commits each task atomically. Wave 2's executor creates the login form, wires it to the API. Both produce SUMMARY.md files with commit hashes and file inventories.

```text
### Execution Plan

**Phase 5: User Authentication** -- 2 plans across 2 waves

| Wave | Plans | What it builds                    |
|------|-------|-----------------------------------|
| 1    | 05-01 | Database schema and auth API      |
| 2    | 05-02 | Login UI wired to auth endpoints  |

---
### Wave 1

**05-01: Auth Schema and API**
JWT authentication with refresh token rotation using jose
library. Creates users table, password hashing with bcrypt,
login/register/refresh endpoints with validation.

Spawning 1 agent...

---
### Wave 1 Complete

**05-01: Auth Schema and API**
JWT auth with refresh rotation -- 4 tasks, 6 files created.
Login UI (Wave 2) can now reference auth endpoints.

---
### Wave 2

**05-02: Login UI**
React login form with email/password fields, error handling,
and redirect on successful auth.

Spawning 1 agent...
```

Five key principles make this work. First, fresh context per agent -- quality never degrades because every executor starts with a clean context window. Second, path-only delegation -- the orchestrator stays lean at 10-15% by passing file paths, not file contents. Third, pre-computed waves -- dependency resolution happens during planning, not at runtime, so the orchestrator executes without analyzing code. Fourth, atomic commits -- each task is independently verifiable in git history. Fifth, spot-check verification -- the orchestrator trusts but verifies by checking file existence and commit history. These are not aspirational -- they are enforced by the workflow structure itself.

```text
Why fresh context matters -- quality vs. context usage:

| Context Usage | Quality    | Agent State               |
|---------------|------------|---------------------------|
| 0-30%         | PEAK       | Full attention, creative  |
|               |            | solutions, thorough code  |
| 30-50%        | GOOD       | Solid output, occasional  |
|               |            | shortcuts in edge cases   |
| 50-70%        | DEGRADING  | Rushing, minimal tests,   |
|               |            | copy-paste patterns       |
| 70%+          | POOR       | Hallucinations, skipped   |
|               |            | steps, incomplete output  |
```

Without fresh context per agent, a long-running session would hit 70%+ context by the third plan, producing rushed, minimal output. With orchestration, every plan gets 0-30% context -- peak quality every time. This is not theoretical. GSD's own development demonstrates it: 36+ plans executed with consistent 2-4 minute completion times and thorough output across every plan, because each executor started fresh. The orchestrator pattern is the reason a 10-plan phase produces the same quality on plan 10 as on plan 1.

GSD's orchestration is not magic -- it is structured decomposition. Break work into phases. Break phases into plans. Break plans into tasks. Assign waves by dependency. Spawn agents with fresh context. Verify results. Advance automatically. Every piece you learned in this module is a specific mechanism serving this decomposition: the orchestration model (coordinate, not execute), agent types (specialized roles), waves (parallel when possible, sequential when dependent), lean design (paths not content), checkpoints (human judgment where needed), auto-advance (hands-free when possible). In the next step -- the mini-project -- you will apply these concepts yourself.

---

### Concept Map

```
  Agent Orchestration
        |
        v
  +-------------------------+
  | Overview                |
  | (The orchestration      |
  |  model & why agents)    |
  +-------------------------+
        |
        v
  +-------------------------+
  | Subagent Types          |
  | (Executor, planner,     |
  |  researcher, verifier,  |
  |  checker)               |
  +-------------------------+
        |
        v
  +-------------------------+
  | Wave Execution          |
  | (Parallel spawning,     |
  |  wave grouping,         |
  |  depends_on)            |
  +-------------------------+
        |
        v
  +-------------------------+
  | Orchestrator Pattern    |
  | (Context budget, lean   |
  |  orchestrator, routing) |
  +-------------------------+
        |
        v
  +-------------------------+
  | Checkpoints             |
  | (Autonomous flags,      |
  |  human-in-the-loop,     |
  |  verification gates)    |
  +-------------------------+
        |
        v
  +-------------------------+
  | Auto-Advance            |
  | (Plan -> execute ->     |
  |  verify piping, chain   |
  |  automation)            |
  +-------------------------+
        |
        v
  +-------------------------+
  | Synthesis               |
  | (Full lifecycle         |
  |  connection, putting    |
  |  it all together)       |
  +-------------------------+

```

### Mini-Project: Build Orchestrated Skeptic Reviews

Extend your skeptic workflow with subagent-style parallel review -- multiple review aspects organized in waves, with an orchestrator step that aggregates findings

#### Artifacts

##### Skeptic workflow with orchestration layer

**Path:** `~/.claude/get-shit-done/workflows/skeptic.md`

**Verification Checks:**

- [ ] Has purpose section
- [ ] Has process section
- [ ] Defines wave-based or parallel review structure
- [ ] Defines multiple review subagents or aspects
- [ ] Has orchestrator step that aggregates subagent findings
- [ ] Writes aggregated findings to review artifact

#### Hints

<details>
<summary>Hint 1</summary>

Your skeptic workflow currently does one big review. The orchestration model splits work across specialized agents that run in parallel. Think about what different ASPECTS of a project a skeptic could review independently -- architecture, conventions, dependencies -- each as its own 'subagent' step.

</details>

<details>
<summary>Hint 2</summary>

The orchestration pattern has three layers: define the subagents (what each reviews), organize them into waves (which run in parallel), and aggregate the results (orchestrator collects findings). All three layers go inside your workflow's process section as new steps.

</details>

<details>
<summary>Hint 3</summary>

Add steps that each focus on one review aspect. For example: one step reviews architecture decisions, another checks convention compliance, another analyzes dependencies. Mark which steps can run in the same wave (parallel). Then add an aggregation step that combines all findings before writing to SKEPTIC-REVIEW.md.

</details>

<details>
<summary>Hint 4</summary>

In your workflow's process section, add 2-3 steps like: step 'review_architecture' examines project structure and design decisions, step 'review_conventions' checks coding standards and naming patterns, step 'review_dependencies' analyzes external dependencies. Group these as 'Wave 1' (they are independent and can run in parallel). Then add a step 'aggregate_findings' that combines results from all review steps into the final output.

</details>

<details>
<summary>Hint 5</summary>

In your skeptic workflow at ~/.claude/get-shit-done/workflows/skeptic.md, add these steps inside the process section: (a) 2-3 review subagent steps, each named review_* and focused on one aspect (architecture, conventions, dependencies). Mark them as Wave 1 since they are independent. (b) An aggregate_findings step that collects findings from all review subagents and writes the combined analysis to SKEPTIC-REVIEW.md. The wave structure and aggregation pattern are what verification checks for -- the specific review aspects are your creative choice.

</details>

