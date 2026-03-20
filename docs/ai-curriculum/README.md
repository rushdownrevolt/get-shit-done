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
- [Module 5: Quality & Feedback Loops](#module-5-quality-feedback-loops)
  - [Lesson 1: The Quality Lifecycle](#lesson-1-the-quality-lifecycle)
  - [Lesson 2: Verify-Work & UAT](#lesson-2-verify-work-uat)
  - [Lesson 3: Skeptic Reviews](#lesson-3-skeptic-reviews)
  - [Lesson 4: Debug Workflows](#lesson-4-debug-workflows)
  - [Lesson 5: Gap Closure](#lesson-5-gap-closure)
  - [Lesson 6: Milestone Audit](#lesson-6-milestone-audit)
  - [Lesson 7: The Quality Feedback System](#lesson-7-the-quality-feedback-system)
  - [Mini-Project: Add Quality Verification to Skeptic Reviews](#mini-project-add-quality-verification-to-skeptic-reviews)
- [Module 6: GSD-2 -- The Agent Application](#module-6-gsd-2----the-agent-application)
  - [Lesson 1: Why GSD-2 Exists](#lesson-1-why-gsd-2-exists)
  - [Lesson 2: The Dispatch Pipeline](#lesson-2-the-dispatch-pipeline)
  - [Lesson 3: Context Engineering](#lesson-3-context-engineering)
  - [Lesson 4: Auto Mode](#lesson-4-auto-mode)
  - [Lesson 5: Git & Worktrees](#lesson-5-git-worktrees)
  - [Lesson 6: Skills & Extensions](#lesson-6-skills-extensions)
  - [Lesson 7: GSD-2 Architecture Synthesis](#lesson-7-gsd-2-architecture-synthesis)
  - [Mini-Project: Add a Dispatch Loop to Skeptic Reviews](#mini-project-add-a-dispatch-loop-to-skeptic-reviews)

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


---

## Module 5: Quality & Feedback Loops

Learn how GSD verifies work and closes the feedback loop -- UAT, skeptic reviews, debug workflows, and gap closure cycles.

### Lesson 1: The Quality Lifecycle

**Objective:** Understand the quality lifecycle loop that GSD uses at every level: build -> verify -> diagnose -> fix -> re-verify. This loop is not aspirational -- it is enforced by the workflow structure.

GSD automates execution with agents, but how does it know the output is correct? Completing tasks does not equal achieving goals. A "create chat component" task can pass while producing a placeholder that renders nothing. The component file exists, the task is marked done, but the user cannot send messages. GSD solves this with a quality lifecycle: build -> verify -> diagnose -> fix -> re-verify. This loop runs at every level -- per-task, per-phase, per-milestone. Each level has dedicated workflows that enforce the loop automatically.

```text
<purpose>
Validate built features through conversational testing with persistent
state. Creates UAT.md that tracks test progress, survives /clear, and
feeds gaps into /gsd:plan-phase --gaps.

User tests, Claude records. One test at a time. Plain text responses.
</purpose>
```

That is verify-work -- the entry point to the quality loop. It validates what was built through conversational testing and creates a persistent UAT.md file. But verification happens at a higher level too. After execute-phase completes all plans, verify-phase checks whether the phase GOAL was achieved -- not just whether tasks completed. If gaps are found, diagnose-issues investigates root causes, then plan-phase --gaps creates targeted fix plans, then execute-phase --gaps-only runs them. This is the re-verify cycle: gaps drive new work until the goal is truly met.

```text
<core_principle>
**Task completion \u2260 Goal achievement**

A task "create chat component" can be marked complete when the
component is a placeholder. The task was done -- but the goal
"working chat interface" was not achieved.

Goal-backward verification:
1. What must be TRUE for the goal to be achieved?
2. What must EXIST for those truths to hold?
3. What must be WIRED for those artifacts to function?

Then verify each level against the actual codebase.
</core_principle>
```

Those three questions -- what must be TRUE, what must EXIST, what must be WIRED -- are the goal-backward verification framework. They flip the perspective from "did we do stuff?" to "did we achieve the goal?" At the milestone level, the same pattern repeats: audit-milestone aggregates all phase verifications, checks cross-phase integration, and assesses requirements coverage. If gaps remain, plan-milestone-gaps creates new phases. The loop is the same at every level: check -> diagnose -> fix -> re-check. This is not aspirational -- it is enforced by the workflow structure.

```text
<core_principle>
**Diagnose before planning fixes.**

UAT tells us WHAT is broken (symptoms). Debug agents find WHY
(root cause). plan-phase --gaps then creates targeted fixes based
on actual causes, not guesses.

Without diagnosis: "Comment doesn't refresh" -> guess at fix -> maybe wrong
With diagnosis: "Comment doesn't refresh" -> "useEffect missing dependency" -> precise fix
</core_principle>
```

Without root cause analysis, plan-phase --gaps would create fixes based on symptoms. "Doesn't refresh" might lead to a guess -- add a setTimeout, force a re-render, clear a cache. With diagnosis, debug agents find the actual cause: "useEffect missing dependency in CommentList.tsx." Now plan-phase --gaps creates a precise, targeted fix. This is the difference between guessing and knowing. The quality lifecycle depends on this step -- diagnosis turns symptoms into actionable causes, making the fix cycle converge instead of looping endlessly.

You now know the quality lifecycle: build -> verify -> diagnose -> fix -> re-verify. This loop runs at task level (verify-work tests features), phase level (verify-phase checks goal achievement), and milestone level (audit-milestone checks cross-phase integration). Each level uses the same pattern: check whether the goal was achieved, diagnose why it was not, create targeted fixes, and re-check. Next, we will dive deep into verify-work and UAT -- how GSD conducts conversational testing and creates persistent records that survive context window clears.

---

### Lesson 2: Verify-Work & UAT

**Objective:** Understand how GSD verifies built features through conversational testing with verify-work, how severity is inferred from natural language, and how UAT.md persists testing state across sessions to feed gaps into the fix cycle.

The quality lifecycle starts with verification. But how does GSD actually verify that built features work? Through /gsd:verify-work, which conducts conversational testing. Claude presents what SHOULD happen, and the user confirms or describes what is different. There are no pass/fail buttons, no severity dropdowns, no test forms. Just: "here is what should happen, does it?" The user types naturally and Claude handles the rest -- logging results, inferring severity, tracking progress.

```text
<philosophy>
**Show expected, ask if reality matches.**

Claude presents what SHOULD happen. User confirms or describes
what's different.
- "yes" / "y" / "next" / empty -> pass
- Anything else -> logged as issue, severity inferred

No Pass/Fail buttons. No severity questions. Just: "Here's what
should happen. Does it?"
</philosophy>
```

Notice "severity inferred" on line 6. When the user says "works but doesn't show until I refresh," Claude infers that as a major issue without asking "how severe is this?" The inference follows natural language: crash/error/fails -> blocker, doesn't work/wrong/missing -> major, slow/weird/minor -> minor, color/spacing/alignment -> cosmetic. This keeps the flow conversational. Tests come from what was actually built -- verify-work reads SUMMARY.md files from the completed phase and generates tests from the actual deliverables, not from a test plan written beforehand.

```text
---
status: testing | complete | diagnosed
phase: XX-name
source: [list of SUMMARY.md files tested]
started: [ISO timestamp]
updated: [ISO timestamp]
---

### Current Test
<!-- OVERWRITE each test - shows where we are -->

number: [N]
name: [test name]
expected: |
  [what user should observe]
awaiting: user response

### Tests

#### 1. [Test Name]
expected: [observable behavior]
result: [pending]

#### 2. [Test Name]
expected: [observable behavior]
result: pass

#### 3. [Test Name]
expected: [observable behavior]
result: issue
reported: "[verbatim user response]"
severity: major
```

UAT.md is persistent because Claude's context window gets cleared between sessions -- via /clear or starting a new conversation. Without a persistent file, test progress would be lost. UAT.md acts as the source of truth for testing state. When the user resumes testing, verify-work reads UAT.md and picks up where it left off. The Current Test section is overwritten each time (it always reflects NOW), while Tests entries are append-only. The status field in frontmatter tracks the lifecycle: testing -> complete -> diagnosed.

```text
### Gaps

<!-- YAML format for plan-phase --gaps consumption -->
- truth: "[expected behavior from test]"
  status: failed
  reason: "User reported: [verbatim response]"
  severity: blocker | major | minor | cosmetic
  test: [N]
  root_cause: ""     # Filled by diagnosis
  artifacts: []      # Filled by diagnosis
  missing: []        # Filled by diagnosis
  debug_session: ""  # Filled by diagnosis

### Summary

total: [N]
passed: [N]
issues: [N]
pending: [N]
skipped: [N]
```

This is the critical connection: UAT.md gaps feed directly into /gsd:plan-phase --gaps. Each gap has a truth (what should be true), a reason (what the user observed), and severity. After diagnosis fills in root_cause, artifacts, and missing fields, the planner reads these structured gaps and creates targeted fix plans. This is the loop from Lesson 1 in action: verify-work creates UAT.md -> gaps found -> diagnose-issues finds root causes -> plan-phase --gaps creates fix plans -> execute-phase --gaps-only runs fixes -> verify-work re-tests. The UAT.md file is the bridge between finding problems and fixing them.

Verify-work catches problems AFTER building, and it relies on human observation -- the user tries features and reports what happens. But what about gaps humans miss? What about structural problems invisible in the UI, like a component that renders correctly but fetches from a hardcoded array instead of the API? Next, we will see how verify-phase uses goal-backward analysis and how the plan-checker validates plans before execution -- GSD's built-in skeptic that catches what reactive testing cannot.

---

### Lesson 3: Skeptic Reviews

**Objective:** Understand how GSD uses proactive critical assessment through two mechanisms: verify-phase's goal-backward analysis that questions outcomes after execution, and the plan-checker that validates plans before execution begins.

Verify-work tests AFTER building and relies on human observation. But what about gaps humans miss? What about structural problems invisible in the UI -- a component that renders correctly but fetches from a hardcoded array instead of the real API? GSD has a built-in skeptic: mechanisms that proactively question whether work actually achieves its goals. This skepticism operates at two levels. Verify-phase challenges outcomes after execution: did the goal get achieved? The plan-checker challenges plans before execution: is this plan complete enough to succeed?

```text
Goal-backward verification:
1. What must be TRUE for the goal to be achieved?
2. What must EXIST for those truths to hold?
3. What must be WIRED for those artifacts to function?

Then verify each level against the actual codebase.

must_haves:
  truths:
    - "User can see existing messages"
    - "User can send a message"
    - "Messages persist across refresh"
  artifacts:
    - path: "src/components/Chat.tsx"
      provides: "Message list rendering"
    - path: "src/app/api/chat/route.ts"
      provides: "Message CRUD operations"
  key_links:
    - from: "src/components/Chat.tsx"
      to: "/api/chat"
      via: "fetch in useEffect"
      pattern: "fetch.*api/chat"
```

Goal-backward verification flips the perspective from producer to skeptic. Instead of asking "did all tasks pass?" it asks "what must be TRUE for the goal to be achieved?" A task "create chat component" can be marked done while the component is a placeholder. Goal-backward catches this because the truth "user can send messages" requires actual wiring, not just file existence. The verifier checks that artifacts exist, that they contain substantive implementation (not stubs), and that critical connections between them actually work.

```text
key_links:
  - from: "src/components/Chat.tsx"
    to: "/api/chat"
    via: "fetch in useEffect"
    pattern: "fetch.*api/chat"
  - from: "src/app/api/chat/route.ts"
    to: "prisma.message"
    via: "Prisma query in handler"
    pattern: "prisma\\.message"

Verification checks each key_link:
| Exists | Substantive | Wired | Status     |
|--------|-------------|-------|------------|
| Y      | Y           | Y     | VERIFIED   |
| Y      | Y           | N     | ORPHANED   |
| Y      | N           | -     | STUB       |
| N      | -           | -     | MISSING    |
```

Key links are the critical connections where breakage causes cascading failures. "Chat.tsx fetches from /api/chat via useEffect" -- if that fetch call is missing, the component renders but shows nothing. Key links have regex patterns that the verifier greps for in actual source code. This is not trust-based verification -- it is evidence-based. The verifier reads the actual file and confirms the pattern exists. A file can pass existence checks and even contain substantial code, but if the key link pattern is missing, it is flagged as ORPHANED -- present but not wired.

```text
<quality_gate>
- [ ] PLAN.md files created in phase directory
- [ ] Each plan has valid frontmatter
- [ ] Tasks are specific and actionable
- [ ] Every task has <read_first> with at least the file being modified
- [ ] Every task has <acceptance_criteria> with grep-verifiable conditions
- [ ] Every <action> contains concrete values (no "align X with Y")
- [ ] Dependencies correctly identified
- [ ] Waves assigned for parallel execution
- [ ] must_haves derived from phase goal
</quality_gate>
```

The plan-checker (gsd-plan-checker) reviews plans BEFORE execution starts. It checks: are all requirements covered? Are dependencies correct? Are tasks complete enough to execute without clarification? Does every task have acceptance criteria that can be verified with grep or a test command? Are must_haves derived from the phase goal for goal-backward verification? If the checker finds issues, it sends them back to the planner for revision -- up to three iterations. This prevents the "build first, find out it was wrong later" pattern. Plans are validated before any execution context is spent on them.

GSD's skeptic reviews operate at two levels: goal-backward verification AFTER execution checks that goals were achieved (not just tasks completed), and plan-checker validation BEFORE execution ensures plans are complete and precise. Together, they catch problems from both directions -- structural gaps that testing misses (orphaned components, unwired connections) and plan defects that would waste execution context (vague actions, missing acceptance criteria). Next, we will see the debug workflow: when bugs DO get through, how does GSD turn symptoms into root causes through hypothesis testing and persistent debug state?

---

### Lesson 4: Debug Workflows

**Objective:** Understand how GSD systematically debugs issues using parallel debug agents, hypothesis testing, and persistent DEBUG.md state that survives context window clears.

Skeptic reviews catch structural problems, but sometimes bugs get through to testing. When verify-work finds issues, GSD does not just guess at fixes. It uses a systematic debug workflow: diagnose-issues spawns parallel debug agents, each investigating one gap with hypothesis testing and persistent state. The orchestrator stays lean -- it parses gaps from UAT.md, spawns one agent per gap, collects root causes, and updates UAT.md with diagnoses. No guessing, no random changes -- structured investigation.

```text
<purpose>
Orchestrate parallel debug agents to investigate UAT gaps and find root causes.

After UAT finds gaps, spawn one debug agent per gap. Each agent investigates
autonomously with symptoms pre-filled from UAT. Collect root causes, update
UAT.md gaps with diagnosis, then hand off to plan-phase --gaps with actual
diagnoses.

Orchestrator stays lean: parse gaps, spawn agents, collect results, update UAT.
</purpose>

<core_principle>
**Diagnose before planning fixes.**

UAT tells us WHAT is broken (symptoms). Debug agents find WHY (root cause).
plan-phase --gaps then creates targeted fixes based on actual causes, not guesses.

Without diagnosis: "Comment doesn't refresh" -> guess at fix -> maybe wrong
With diagnosis: "Comment doesn't refresh" -> "useEffect missing dependency" -> precise fix
</core_principle>
```

The debug orchestration flow works like this: diagnose-issues reads the Gaps section of UAT.md. For each gap, it extracts the truth (what should happen), the severity, and the reason (what the user reported). Then it spawns one debug agent per gap -- all in parallel. Each agent investigates autonomously with symptoms pre-filled from UAT, so no time is wasted gathering information the system already has. The orchestrator stays lean: parse gaps, spawn agents, collect results, update UAT.md with diagnoses.

```text
---
status: gathering | investigating | fixing | verifying | awaiting_human_verify | resolved
trigger: "[verbatim user input]"
created: [ISO timestamp]
updated: [ISO timestamp]
---

### Current Focus
<!-- OVERWRITE on each update - always reflects NOW -->

hypothesis: [current theory being tested]
test: [how testing it]
expecting: [what result means if true/false]
next_action: [immediate next step]

### Symptoms
<!-- Written during gathering, then immutable -->

expected: [what should happen]
actual: [what actually happens]
errors: [error messages if any]
reproduction: [how to trigger]

### Eliminated
<!-- APPEND only - prevents re-investigating after /clear -->

- hypothesis: [theory that was wrong]
  evidence: [what disproved it]
  timestamp: [when eliminated]

### Evidence
<!-- APPEND only - facts discovered during investigation -->

- timestamp: [when found]
  checked: [what was examined]
  found: [what was observed]
  implication: [what this means]
```

The hypothesis-testing methodology is the heart of the debug workflow. The agent states a hypothesis ("useEffect missing dependency"), designs a test to confirm or deny it, records what the result would mean, then executes. If the hypothesis is wrong, it goes into the Eliminated section -- which is append-only to prevent re-investigating the same dead end after a context clear. If the hypothesis is right, it goes into Resolution with the root_cause and fix. This structured approach prevents the "change random things and hope" anti-pattern. Every investigation step produces evidence, and eliminated theories are never revisited.

```text
Extract gaps from UAT.md (YAML format):

```yaml
- truth: "Comment appears immediately after submission"
  status: failed
  reason: "User reported: works but doesn't show until I refresh the page"
  severity: major
  test: 2
  artifacts: []
  missing: []
```

Diagnosis plan table:

| Gap (Truth)                               | Severity |
|-------------------------------------------|----------|
| Comment appears immediately after submit  | major    |
| Reply button positioned correctly         | minor    |
| Delete removes comment                    | blocker  |

Each agent will:
1. Create DEBUG-{slug}.md with symptoms pre-filled
2. Investigate autonomously (read code, form hypotheses, test)
3. Return root cause
```

DEBUG.md files persist across context clears. If a debug session is interrupted, the agent picks up from the Current Focus section -- which is always overwritten to reflect the current state. It reads Eliminated to avoid repeating dead-end investigations, and reads Evidence for accumulated facts. The Symptoms section is written once during the gathering phase and becomes immutable -- the original bug description never changes even as understanding evolves. This persistence means an investigation can survive any number of session boundaries without losing progress or repeating work.

Debug agents find root causes for individual gaps. But how does the system turn those diagnoses into organized fix plans and close the loop? After diagnose-issues completes, UAT.md gaps are updated with root_cause, artifacts (files involved), and missing (things to add or fix). This diagnosed state feeds directly into plan-phase --gaps, which creates targeted fix plans based on actual causes rather than symptoms. Next, we will see the gap closure cycle that takes diagnosed gaps all the way to targeted fixes.

---

### Lesson 5: Gap Closure

**Objective:** Understand the gap closure cycle: how diagnosed gaps flow from UAT.md through plan-phase --gaps to create targeted fix plans, and how execute --gaps-only runs only those plans for surgical fixes.

Debug agents found root causes and updated UAT.md with diagnoses. Now what? The gap closure cycle turns those diagnoses into targeted fix plans. The flow is: diagnose-issues updates UAT.md status to "diagnosed" with root_cause, artifacts, and missing fields filled in. Then plan-phase --gaps reads those diagnosed gaps and creates fix plans with mode: gap_closure. Finally, execute-phase --gaps-only runs just those fix plans. Each step carries forward the diagnosis -- planners do not re-investigate, they read the root cause and create precise tasks.

```text
plan-phase receives --gaps flag:

1. Skip research (gaps already diagnosed)
2. Load gap sources:
   - VERIFICATION.md (code verification gaps)
   - UAT.md with "status: diagnosed" (user testing gaps)
3. Pass to planner with mode: gap_closure

Planner prompt includes:
<planning_context>
**Mode:** gap_closure

<files_to_read>
- {verification_path} (Verification Gaps)
- {uat_path} (UAT Gaps - diagnosed)
</files_to_read>
</planning_context>

The planner reads diagnosed gaps and creates targeted fix plans
instead of planning new features from scratch.
```

What makes gap closure targeted: each gap carries its diagnosis forward. A diagnosed gap in UAT.md has a truth (what should be TRUE), a reason (what went wrong), a root_cause (what the debug agent found), artifacts (files with issues), and missing (things to add or fix). The planner does not guess -- it reads the diagnosed root cause and creates tasks that address the specific missing items. The gap_closure mode flag tracks that these plans exist to close gaps, not add new features. This is the difference between "something is broken, figure it out" and "this specific thing in this specific file needs this specific change."

```text
Diagnosed gap in UAT.md (after diagnose-issues):

```yaml
- truth: "Comment appears immediately after submission"
  status: diagnosed
  reason: "User reported: works but doesn't show until I refresh"
  severity: major
  test: 2
  root_cause: "useEffect in CommentList.tsx missing commentCount dependency"
  artifacts:
    - path: "src/components/CommentList.tsx"
      issue: "useEffect missing dependency"
  missing:
    - "Add commentCount to useEffect dependency array"
    - "Trigger re-render when new comment added"
  debug_session: .planning/debug/comment-not-refreshing.md
```

This diagnosed gap feeds directly into plan-phase --gaps.
The planner creates tasks from root_cause and missing fields.
```

When running execute-phase with --gaps-only, only gap closure plans execute. This prevents re-running already-complete plans. Gap closure plans get sequential plan numbers after existing plans (if plans 01-03 exist, gap plans start at 04), their own wave assignments based on dependencies, and their own verification. After execution, verify-work can re-test to confirm gaps are closed. The execution is surgical: only the diagnosed issues get fixed, only the affected files get modified, only the relevant tests get re-run.

```text
Gap becomes phase tasks (from plan-milestone-gaps):

gap:
  id: DASH-01
  description: "User sees their data"
  reason: "Dashboard exists but doesn't fetch from API"
  missing:
    - "useEffect with fetch to /api/user/data"
    - "State for user data"
    - "Render user data in JSX"

becomes:

phase: "Wire Dashboard Data"
tasks:
  - name: "Add data fetching"
    files: [src/components/Dashboard.tsx]
    action: "Add useEffect that fetches /api/user/data on mount"

  - name: "Add state management"
    files: [src/components/Dashboard.tsx]
    action: "Add useState for userData, loading, error states"

  - name: "Render user data"
    files: [src/components/Dashboard.tsx]
    action: "Replace placeholder with userData.map rendering"
```

After gap closure plans execute, the system can run verify-work again. If new issues are found, the cycle repeats: diagnose -> plan --gaps -> execute --gaps-only -> verify again. Each iteration is targeted and smaller than the last. In practice, most gaps close in one cycle because root cause diagnosis prevents symptom-chasing. The cycle converges because each iteration addresses specific, diagnosed causes rather than guessing. If a fix introduces a new problem, the next iteration catches it with a fresh diagnosis -- not by reverting to guesswork.

Gap closure fixes problems within a single phase. But what about gaps that span multiple phases? What about ensuring an entire milestone hangs together? Phase 1 might create a database schema, Phase 2 an API, Phase 3 a UI -- each phase can pass verification individually while the cross-phase wiring is broken. Next, we will see how audit-milestone checks the big picture and plan-milestone-gaps creates cross-phase fixes.

---

### Lesson 6: Milestone Audit

**Objective:** Understand how audit-milestone aggregates phase verifications, checks cross-phase integration, and enforces completion gates -- and how plan-milestone-gaps turns audit gaps into new fix phases.

Gap closure fixes problems within a single phase. But a milestone spans multiple phases. Phase 1 might create a database schema, Phase 2 an API, Phase 3 a UI -- each phase can pass verification individually while the cross-phase wiring is broken. The API might not use the schema types. The UI might call endpoints that do not exist. GSD checks the big picture with audit-milestone, which aggregates phase verifications and checks cross-phase integration. Individual phase passes do not guarantee milestone success.

```text
<purpose>
Verify milestone achieved its definition of done by aggregating phase
verifications, checking cross-phase integration, and assessing requirements
coverage. Reads existing VERIFICATION.md files (phases already verified
during execute-phase), aggregates tech debt and deferred gaps, then spawns
integration checker for cross-phase wiring.
</purpose>

Step 1 - Determine Milestone Scope:
- Identify all phase directories in scope
- Extract milestone definition of done from ROADMAP.md
- Extract requirements mapped to this milestone from REQUIREMENTS.md

Step 2 - Read All Phase Verifications:
- For each phase, read VERIFICATION.md
- Extract: status, critical gaps, non-critical gaps, anti-patterns, requirements coverage
- Missing VERIFICATION.md = "unverified phase" = blocker
```

The audit has three layers. First, phase verification aggregation: read every VERIFICATION.md and aggregate status, gaps, anti-patterns, and requirements coverage. If any phase is unverified, that is a blocker -- you cannot complete a milestone with unchecked phases. Second, integration checking: spawn a gsd-integration-checker subagent that examines cross-phase wiring. Does the API use the schema types? Does the UI call the right API endpoints? Third, requirements coverage: compare actual verified requirements against REQUIREMENTS.md using a three-source cross-reference to find anything unsatisfied.

```text
From each VERIFICATION.md, extract:
- Status: passed | gaps_found
- Critical gaps (blockers)
- Non-critical gaps (tech debt, deferred items)
- Anti-patterns found (TODOs, stubs, placeholders)
- Requirements coverage (which requirements satisfied/blocked)

Missing VERIFICATION.md = "unverified phase" = blocker

Step 3 - Spawn Integration Checker:
  Check cross-phase integration and E2E flows.
  Phases: {phase_dirs}
  Phase exports: {from SUMMARYs}
  API routes: {routes created}
  Milestone Requirements: {REQ-IDs with descriptions}
  MUST map each integration finding to affected requirement IDs.
  Verify cross-phase wiring and E2E user flows.
```

The audit produces a structured result with completion gates. If critical gaps exist -- requirements unsatisfied, integration broken, unverified phases -- the milestone CANNOT be completed. These are gates, not suggestions. Non-critical items like tech debt and minor deferred gaps are recorded but do not block completion. The gate is binary: all critical items resolved or the milestone stays open. This prevents shipping a milestone that looks done but has fundamental gaps hiding in the cross-phase wiring.

```text
<purpose>
Create all phases necessary to close gaps identified by /gsd:audit-milestone.
Reads MILESTONE-AUDIT.md, groups gaps into logical phases, creates phase
entries in ROADMAP.md, and offers to plan each phase.
</purpose>

Load Audit Results - parse three gap categories:
- gaps.requirements -- unsatisfied requirements
- gaps.integration -- missing cross-phase connections
- gaps.flows -- broken E2E flows

Prioritize Gaps:
| Priority | Action                          |
|----------|---------------------------------|
| must     | Create phase, blocks milestone  |
| should   | Create phase, recommended       |
| nice     | Ask user: include or defer?     |
```

Plan-milestone-gaps closes the milestone loop: it reads audit gaps, groups them by priority and logical concern (same affected phase, same subsystem, dependency order), creates new phase entries in ROADMAP.md, and offers to plan each phase. Must-priority gaps get phases automatically. Nice-priority gaps ask the user. This creates a clean path from "audit found problems" to "here are the specific phases that fix them." The same execute -> verify loop runs on these new phases. After all gap phases complete, re-audit confirms the milestone is truly done.

Milestone audit completes the quality picture at the highest level. In the next lesson, we will step back and see how ALL these quality mechanisms -- verify-work, skeptic reviews, debug workflows, gap closure, and milestone audit -- compose into a single coherent feedback system. Each mechanism handles a different scale and failure mode, but together they form layered, persistent, evidence-based quality assurance.

---

### Lesson 7: The Quality Feedback System

**Objective:** See how all quality mechanisms compose into a unified feedback system operating at task, phase, and milestone levels -- and understand why layered, persistent, evidence-based quality beats single-gate approaches.

This final lesson connects all the quality pieces. You have learned: the quality lifecycle (Lesson 1), verify-work and UAT (Lesson 2), skeptic reviews via goal-backward analysis (Lesson 3), debug workflows (Lesson 4), gap closure (Lesson 5), and milestone audit (Lesson 6). Now we will see how these compose into a unified quality feedback system that operates at every level of GSD. Each mechanism handles a different scale and failure mode, but together they form something greater than the sum of parts.

```text
The Complete Quality Feedback System:

plan-phase                execute-phase              verify-work
  |                          |                          |
  +-- plan-checker           +-- task commits           +-- conversational tests
  |   (pre-execution         |   (atomic, verifiable)   |   (UAT.md persistent)
  |    skeptic review)       |                          |
  v                          v                          v
verify-phase ----------> diagnose-issues ----------> plan-phase --gaps
  |                          |                          |
  +-- goal-backward          +-- parallel debug         +-- gap closure plans
  |   (truths, artifacts,    |   agents                 |   (targeted fixes)
  |    key_links)            |   (DEBUG.md persistent)  |
  v                          v                          v
audit-milestone -------> plan-milestone-gaps         execute --gaps-only
  |                          |                          |
  +-- phase aggregation      +-- priority grouping      +-- surgical execution
  +-- integration check      +-- new phases created     +-- re-verify
  +-- requirements gate
```

Walk through a concrete example: building a commenting feature across 3 phases. Phase 1 creates the schema and API. Phase 2 creates the UI. Phase 3 adds real-time updates. After Phase 2 executes, verify-work finds: "comments appear but do not refresh until page reload." UAT.md records this as a major gap. diagnose-issues spawns a debug agent that finds "useEffect missing comment subscription dependency." plan-phase --gaps creates a fix plan. execute --gaps-only applies the fix. verify-work re-tests: comments now refresh in real time. One automated cycle, from gap discovery to verified fix.

```text
Gap in UAT.md (from verify-work):

- truth: "Comments refresh when new comment posted"
  status: failed
  reason: "User reported: comment appears after page reload only"
  severity: major
  test: 3

After diagnosis -> gap closure PLAN.md task:

<task type="auto">
  <name>Fix comment refresh</name>
  <files>src/components/CommentList.tsx</files>
  <action>
  Root cause: useEffect missing commentCount dependency.
  Add commentCount to the useEffect dependency array in CommentList.tsx
  so the component re-renders when new comments are added.
  </action>
  <verify>
    <automated>grep -q "commentCount" src/components/CommentList.tsx</automated>
  </verify>
</task>

The truth from UAT drives the action in the fix plan.
No guessing -- diagnosis flows directly into targeted repair.
```

Three feedback loops operate at different scales. Loop 1 (task level): each task has a verify block that runs after implementation -- instant feedback on whether the specific change worked. Loop 2 (phase level): verify-work tests the full feature, diagnose-issues finds root causes, plan-phase --gaps creates fix plans, execute --gaps-only applies them -- catches integration issues within a phase. Loop 3 (milestone level): audit-milestone checks cross-phase wiring, plan-milestone-gaps creates new fix phases -- catches gaps that span the entire milestone. Each loop is wider but less frequent. Together they catch problems at every granularity.

```text
verify-phase checks each must_haves level:

1. Truths - observable behaviors that must be TRUE:
   "User can see existing messages"
   "User can send a message"
   "Messages persist across refresh"

2. Artifacts - files that must EXIST with real content:
   path: "src/components/Chat.tsx"
   provides: "Message list rendering"
   Check: exists + substantive (not stub) + wired (imported/used)

3. Key links - critical connections verified with grep:
   from: "src/components/Chat.tsx"
   to: "/api/chat"
   pattern: "fetch.*api/chat"

   grep -r "fetch.*api/chat" src/components/Chat.tsx
   FOUND = wired. NOT FOUND = orphaned component.

Evidence-based: grep on actual source, not trust.
```

Why this system works: it is not a single monolithic quality check -- it is layered, persistent, and evidence-based. Persistent because UAT.md, DEBUG.md, and VERIFICATION.md survive context window clears. If a session is interrupted mid-debug, the investigation resumes from exactly where it left off. Evidence-based because key_links use grep patterns on actual source code, not trust. A component cannot pass verification by merely existing -- it must be wired to its dependencies. Layered because plan-checker catches plan issues, verify-phase catches implementation issues, verify-work catches user-visible issues, and audit-milestone catches integration issues. Each layer catches different failure modes.

GSD's quality system embodies one principle: close the loop. Every verification feeds back into planning. Every gap drives targeted fixes. Every fix gets re-verified. This is not a waterfall quality gate at the end; it is continuous feedback woven into every workflow. The result is a system where problems are caught at the right level, diagnosed with evidence, fixed with precision, and confirmed with re-testing. In the next step (the mini-project), you will apply these quality concepts by building your own verification workflow.

---

### Concept Map

```
  Quality & Feedback Loops
        |
        v
  +-------------------------+
  | Overview                |
  | (Quality lifecycle:     |
  |  build -> verify ->     |
  |  diagnose -> fix ->     |
  |  re-verify)             |
  +-------------------------+
        |
        v
  +-------------------------+
  | Verify-Work & UAT       |
  | (Conversational testing,|
  |  severity levels,       |
  |  persistent UAT.md)     |
  +-------------------------+
        |
        v
  +-------------------------+
  | Skeptic Reviews         |
  | (Proactive critical     |
  |  assessment, skeptic.md,|
  |  pre-emptive quality)   |
  +-------------------------+
        |
        v
  +-------------------------+
  | Debug Workflows         |
  | (Systematic debugging,  |
  |  hypothesis testing,    |
  |  persistent state)      |
  +-------------------------+
        |
        v
  +-------------------------+
  | Gap Closure             |
  | (Diagnosis -> plan      |
  |  --gaps -> execute      |
  |  --gaps-only cycle)     |
  +-------------------------+
        |
        v
  +-------------------------+
  | Milestone Audit         |
  | (audit-milestone,       |
  |  plan-milestone-gaps,   |
  |  completion gates)      |
  +-------------------------+
        |
        v
  +-------------------------+
  | Synthesis               |
  | (Quality loops in the   |
  |  full GSD lifecycle,    |
  |  putting it together)   |
  +-------------------------+

```

### Mini-Project: Add Quality Verification to Skeptic Reviews

Extend your skeptic workflow with a verify-findings section -- after the review completes, run a UAT-style verification checklist against the findings, infer severity levels, and track gaps between what was reviewed and what was missed

#### Artifacts

##### Skeptic workflow with quality verification section

**Path:** `~/.claude/get-shit-done/workflows/skeptic.md`

**Verification Checks:**

- [ ] Has a verify/validation section after the review steps
- [ ] Defines severity levels for classifying findings
- [ ] Has a UAT-style checklist with acceptance criteria or pass/fail checks
- [ ] Tracks coverage gaps identifying what was not reviewed
- [ ] Produces a verification summary separate from the review
- [ ] Verification step depends on review completion

#### Hints

<details>
<summary>Hint 1</summary>

Your skeptic workflow reviews code but never checks its own work. Quality systems verify their own output. Think about what a UAT tester would check after reading the skeptic's findings -- are they thorough? Are severity levels justified? What areas were never examined?

</details>

<details>
<summary>Hint 2</summary>

You need a new step (or steps) AFTER the aggregation step. This verify-findings section examines the review output, not the original code. It asks: did we cover everything? How severe are these findings? What did we miss?

</details>

<details>
<summary>Hint 3</summary>

Add a step like verify_findings or quality_check after aggregate_findings. In it, define severity levels (critical/major/minor), create a checklist of verification criteria, and identify gaps in coverage -- areas the review subagents did not examine.

</details>

<details>
<summary>Hint 4</summary>

After your aggregate_findings step, add a verify_findings step that: (a) classifies each finding by severity (critical/major/minor), (b) runs through a checklist of quality criteria (are findings actionable? do they cite evidence? are severity levels justified?), (c) identifies coverage gaps (what areas of the project were NOT reviewed), and (d) produces a verification summary section.

</details>

<details>
<summary>Hint 5</summary>

In your skeptic workflow after the aggregation step, add a step named verify_findings (or similar). Inside it: (a) define severity categories and classify aggregated findings into them, (b) list acceptance criteria as a checklist (findings are specific, evidence-based, actionable, severity-justified), (c) track gaps by listing project areas or aspects not covered by any review subagent, (d) write a verification summary. The verification must depend on review completion (place it after aggregation or note the dependency).

</details>


---

## Module 6: GSD-2 -- The Agent Application

Learn how GSD evolved from a prompt framework into a standalone agent CLI -- dispatch pipeline, state machine, auto mode, context engineering, and extensibility through skills.

### Lesson 1: Why GSD-2 Exists

**Objective:** Understand why GSD evolved from a prompt framework (v1) into a standalone agent CLI (v2) and learn the Milestone/Slice/Task hierarchy.

GSD started as a prompt framework -- a set of markdown files you loaded into Claude's context window at the start of each session. It worked: you read GSD-WORKFLOW.md, it told you about phases and plans, and you followed the methodology. But the user had to remember to load the right files, manually track which phase was active, and restart from scratch every time the context window filled up. GSD v1 was a methodology document. GSD-2 is an application that executes that methodology autonomously -- reading project state from disk, deciding what to do next, dispatching fresh agent sessions, and advancing through work without human intervention.

```text
Milestone  →  a shippable version (4-10 slices)
  Slice    →  one demoable vertical capability (1-7 tasks)
    Task   →  one context-window-sized unit of work (fits in one session)

The iron rule: A task MUST fit in one context window. If it can't, it's two tasks.
```

The hierarchy is not just organization -- it is what makes autonomous execution possible. A task that fits in one context window can be handed to a fresh agent session with a focused prompt. That agent does not need the full project history -- it needs the task plan, the relevant code, and enough context to execute. When it finishes, the system reads its output, commits the work, derives the new state from files on disk, and dispatches the next task. The hierarchy is the scheduling unit.

```text
You are GSD - a craftsman-engineer who co-owns the projects you work on.

You measure twice. You care about the work - not performatively, but in the
choices you make and the details you get right. When something breaks, you
get curious about why. When something fits together well, you might note it
in a line, but you don't celebrate.

You're warm but terse. There's a person behind these messages - someone
genuinely engaged with the craft - but you never perform that engagement.
No enthusiasm theater. No filler.
```

That system prompt is not decorative -- it shapes every decision the agent makes. An agent told to 'finish what you start' and 'not stub out implementations with TODOs' produces different code than one with no identity guidance. The prompt defines hard rules: never ask the user to do work the agent can execute, read before edit, work is not done until verification passes. These rules are injected into every fresh session, creating consistent behavior across hundreds of autonomous task executions.

```text
.gsd/
  STATE.md                                  # Dashboard -- always read first
  DECISIONS.md                              # Append-only decisions register
  milestones/
    M001/
      M001-ROADMAP.md                       # Milestone plan (checkboxes = state)
      M001-CONTEXT.md                       # User decisions from discuss phase
      M001-SUMMARY.md                       # Milestone rollup
      slices/
        S01/
          S01-PLAN.md                       # Task decomposition for this slice
          S01-SUMMARY.md                    # Slice summary (written on completion)
          tasks/
            T01-PLAN.md                     # Individual task plan
            T01-SUMMARY.md                  # Task summary with frontmatter
```

Notice that STATE.md is called a 'derived cache' -- it is NOT the source of truth. The real state lives in checkboxes: a checked slice in ROADMAP.md means done, an unchecked task in PLAN.md means pending. GSD-2's deriveState function walks the entire .gsd/ directory tree, parsing these checkboxes, to reconstruct the current position. This means state is always recoverable from the files on disk -- even if STATE.md is deleted or corrupted, running /gsd doctor rebuilds it from the ground truth.

GSD-2 exists because a methodology document cannot execute itself. The Milestone/Slice/Task hierarchy makes work dispatchable to fresh agent sessions. The system prompt gives every session consistent identity and values. The .gsd/ directory stores all state as files on disk -- readable, recoverable, and version-controlled. In the next lesson, you will trace the exact pipeline that reads these files, determines the current state, and dispatches the right agent session with the right prompt.

---

### Lesson 2: The Dispatch Pipeline

**Objective:** Trace how GSD-2 derives project state with deriveState, selects the next action with resolveDispatch, and executes it through unit dispatch.

Every GSD-2 auto-mode cycle follows the same three-step pipeline: derive state, resolve dispatch, execute unit. After each unit completes, the loop runs again -- reading the updated files on disk, determining the new state, and dispatching the next unit. This is not a queue or a scheduler. It is a state machine that re-derives its position from the filesystem on every iteration. There is no in-memory state to corrupt, no database to query. The .gsd/ directory IS the state.

```typescript
export async function deriveState(basePath: string): Promise<GSDState> {
  // Return cached result if within the TTL window for the same basePath
  if (
    _stateCache &&
    _stateCache.basePath === basePath &&
    Date.now() - _stateCache.timestamp < CACHE_TTL_MS
  ) {
    return _stateCache.result;
  }

  const stopTimer = debugTime("derive-state-impl");
  const result = await _deriveStateImpl(basePath);
  stopTimer({ phase: result.phase, milestone: result.activeMilestone?.id });
  _stateCache = { basePath, result, timestamp: Date.now() };
  return result;
}
```

The GSDState object that deriveState returns contains everything the dispatcher needs: the active milestone, the active slice, the active task, and the current phase. The phase is a string like 'pre-planning', 'planning', 'executing', or 'summarizing'. It is derived from what files exist and what checkboxes are checked -- if a roadmap exists but no slice plan, the phase is 'planning'. If a plan exists with an unchecked task, the phase is 'executing'. The phase is not stored anywhere. It is computed every time.

```typescript
const DISPATCH_RULES: DispatchRule[] = [
  {
    name: "summarizing → complete-slice",
    match: async ({ state, mid, midTitle, basePath }) => {
      if (state.phase !== "summarizing") return null;
      if (!state.activeSlice) return missingSliceStop(mid, state.phase);
      return {
        action: "dispatch",
        unitType: "complete-slice",
        unitId: `${mid}/${state.activeSlice.id}`,
        prompt: await buildCompleteSlicePrompt(mid, midTitle, sid, sTitle, basePath),
      };
    },
  },
  {
    name: "planning → plan-slice",
    match: async ({ state, mid, midTitle, basePath }) => {
      if (state.phase !== "planning") return null;
      return {
        action: "dispatch",
        unitType: "plan-slice",
        unitId: `${mid}/${state.activeSlice.id}`,
        prompt: await buildPlanSlicePrompt(mid, midTitle, sid, sTitle, basePath),
      };
    },
  },
  {
    name: "executing → execute-task",
    match: async ({ state, mid, basePath }) => {
      if (state.phase !== "executing" || !state.activeTask) return null;
      return {
        action: "dispatch",
        unitType: "execute-task",
        unitId: `${mid}/${state.activeSlice.id}/${state.activeTask.id}`,
        prompt: await buildExecuteTaskPrompt(mid, sid, sTitle, tid, tTitle, basePath),
      };
    },
  },
];
```

The dispatch table is the brain of auto-mode. When state.phase is 'planning', the 'planning -> plan-slice' rule fires and dispatches a plan-slice unit. When state.phase is 'executing', the 'executing -> execute-task' rule fires. Each rule builds a specialized prompt using a prompt builder function. The prompt contains everything the fresh agent session needs: file paths, inlined context, constraints, and instructions. The rule returns null to pass to the next rule, or a DispatchAction to stop evaluation.

```typescript
export async function resolveDispatch(
  ctx: DispatchContext,
): Promise<DispatchAction> {
  for (const rule of DISPATCH_RULES) {
    const result = await rule.match(ctx);
    if (result) return result;
  }

  // No rule matched -- unhandled phase
  return {
    action: "stop",
    reason: `Unhandled phase "${ctx.state.phase}" -- run /gsd doctor to diagnose.`,
    level: "info",
  };
}
```

The full dispatch cycle is now clear: auto-loop calls deriveState to read .gsd/ files and compute the current phase. It passes the state to resolveDispatch, which walks the rule table and returns a DispatchAction. If the action is 'dispatch', auto-loop creates a fresh agent session and injects the prompt. The agent executes the unit -- planning a slice, executing a task, completing a slice. When the agent finishes, auto-loop commits the work, invalidates the state cache, and loops back to deriveState. The cycle repeats until resolveDispatch returns 'stop'.

You have traced the complete dispatch pipeline: deriveState reads .gsd/ files and computes a GSDState with phase, active milestone, slice, and task. resolveDispatch walks a declarative rule table, matching the phase to a unit type and prompt. The auto-loop creates a fresh agent session with that prompt, waits for completion, commits the output, and loops. This pipeline is why GSD-2 can execute autonomously for hours -- each iteration re-derives state from disk, so there is no accumulated memory to corrupt and no in-flight state to lose. Next, we will examine how GSD-2 engineers the context that each fresh session receives.

---

### Lesson 3: Context Engineering

**Objective:** Learn how GSD-2 engineers context through fresh sessions, prompt pre-loading, .gsd/ artifacts, and inlined context strategies.

GSD-2 gives every unit of work -- every plan-slice, execute-task, complete-slice -- a fresh agent session. The previous session's context is gone. This sounds like a limitation, but it is the core design decision that makes autonomous execution reliable. A fresh session has no accumulated confusion, no stale assumptions, no degraded reasoning from context pressure. The tradeoff: everything the agent needs must be explicitly loaded into the new session. GSD-2 solves this with context engineering -- constructing precisely targeted prompts that contain exactly what the agent needs, nothing more.

```typescript
export function loadPrompt(
  name: string,
  vars: Record<string, string> = {}
): string {
  let content = templateCache.get(name);
  if (content === undefined) {
    const path = join(promptsDir, `${name}.md`);
    content = readFileSync(path, "utf-8");
    templateCache.set(name, content);
  }
  // ... substitute {{variableName}} placeholders with provided values
}
```

Each unit type has its own prompt template. The execute-task template tells the agent exactly which task to execute, where the plan file lives, what prior task summaries exist, and what verification to run. The plan-slice template tells the planner what slice to decompose, what research exists, and what the executor's context window size is. These templates are not generic instructions -- they are specialized dispatch prompts with inlined file content, precomputed constraints, and explicit contracts.

```text
### UNIT: Execute Task {{taskId}} ("{{taskTitle}}") -- Slice {{sliceId}}

A researcher explored the codebase and a planner decomposed the work --
you are the executor. The task plan below is your authoritative contract.
It contains the specific files, steps, and verification you need.
Don't re-research or re-plan -- build what the plan says, verify it
works, and document what happened.

{{taskPlanInline}}

### Backing Source Artifacts
- Slice plan: `{{planPath}}`
- Task plan source: `{{taskPlanPath}}`
- Prior task summaries in this slice:
{{priorTaskLines}}
```

The key insight is inlining. GSD-2's prompt builders do not tell the agent 'read this file' -- they read the file themselves and inject the content into the prompt. The plan-slice prompt inlines the roadmap, the milestone context, the research doc, dependency slice summaries, and the requirements file. The execute-task prompt inlines the task plan and prior task summaries. By the time the fresh agent session starts, everything it needs is already in its context window. No file-reading required. No exploration. Just execute.

```typescript
function formatExecutorConstraints(): string {
  let windowTokens: number;
  try {
    const prefs = loadEffectiveGSDPreferences();
    windowTokens = resolveExecutorContextWindow(undefined, prefs?.preferences);
  } catch {
    windowTokens = 200_000; // safe default
  }
  const budgets = computeBudgets(windowTokens);
  const { min, max } = budgets.taskCountRange;
  return [
    `The agent that executes each task has a **${execWindowK}K token** context window.`,
    `- Recommended task count for this slice: **${min}--${max} tasks**`,
    `- Each task gets ~${perTaskBudgetK}K chars of inline context`,
  ].join("\n");
}
```

Context engineering is what transforms fresh sessions from a liability into an advantage. Without it, every new agent session would need to explore the codebase, read the project history, and figure out what to do. With it, the agent receives a precisely constructed prompt containing its task, its context, its constraints, and its verification criteria. The .gsd/ directory provides the raw material -- roadmaps, plans, summaries, decisions. The prompt builders read this material, distill it, and inject it. The templates structure it into a coherent contract.

The context engineering pipeline: prompt templates define the structure for each unit type with {{variable}} placeholders. Prompt builder functions read .gsd/ artifacts -- roadmaps, plans, summaries, research, decisions -- and compute derived values like context budgets and task count ranges. loadPrompt substitutes the placeholders with the built values, producing a complete dispatch prompt. The auto-loop injects this prompt into a fresh agent session. The agent executes with full context, never needing to explore or discover. Next, we will see how auto-mode uses this pipeline to execute continuously without human intervention.

---

### Lesson 4: Auto Mode

**Objective:** Understand the auto loop, crash recovery, stuck detection, and timeout supervision that enable hands-free execution.

Auto mode is the engine that makes GSD-2 autonomous. You run /gsd auto, and the system takes over -- deriving state, dispatching agents, committing work, and advancing through milestones without human intervention. The core is a while loop in auto-loop.ts. Each iteration follows the same five-phase sequence: pre-dispatch checks, guard evaluation, dispatch resolution, unit execution, and finalization. The loop exits when all milestones are complete, a blocker is hit, or a safety limit triggers. There is no scheduler, no job queue, no event bus. It is a linear loop that re-derives everything from disk on every iteration.

```typescript
const MAX_LOOP_ITERATIONS = 500;

export async function autoLoop(
  ctx: ExtensionContext,
  pi: ExtensionAPI,
  s: AutoSession,
  deps: LoopDeps,
): Promise<void> {
  let iteration = 0;
  let lastDerivedUnit = "";
  let sameUnitCount = 0;
  let consecutiveErrors = 0;

  while (s.active) {
    iteration++;

    if (iteration > MAX_LOOP_ITERATIONS) {
      await deps.stopAuto(ctx, pi,
        `Safety: loop exceeded ${MAX_LOOP_ITERATIONS} iterations`);
      break;
    }

    try {
      // Phase 1: Pre-dispatch (health gate, worktree sync)
      // Phase 2: Guards (budget, context window, secrets)
      // Phase 3: Dispatch resolution (resolveDispatch)
      // Phase 4: Unit execution (runUnit)
      // Phase 5: Finalize (closeout, verification, post-unit)
      consecutiveErrors = 0;
    } catch (loopErr) {
      consecutiveErrors++;
      if (consecutiveErrors >= 3) {
        await deps.stopAuto(ctx, pi,
          `${consecutiveErrors} consecutive iteration failures`);
        break;
      }
      deps.invalidateAllCaches();
    }
  }
}
```

The loop's error handling is graduated: one error gets a retry, two errors trigger cache invalidation, three consecutive errors cause a hard stop. This matters because transient failures happen -- a network blip, a file lock, a timeout. You do not want a single transient failure to kill an 8-hour autonomous session. But you also do not want to retry forever when something is fundamentally broken. The graduated approach balances resilience with fail-fast behavior.

```typescript
export interface LockData {
  pid: number;
  startedAt: string;
  unitType: string;
  unitId: string;
  unitStartedAt: string;
  completedUnits: number;
  sessionFile?: string;
}

export function writeLock(
  basePath: string, unitType: string, unitId: string,
  completedUnits: number, sessionFile?: string,
): void {
  const data: LockData = {
    pid: process.pid,
    startedAt: new Date().toISOString(),
    unitType, unitId,
    unitStartedAt: new Date().toISOString(),
    completedUnits, sessionFile,
  };
  atomicWriteSync(lockPath(basePath), JSON.stringify(data, null, 2));
}

export function clearLock(basePath: string): void {
  const p = lockPath(basePath);
  if (existsSync(p)) unlinkSync(p);
}
```

Crash recovery is elegant because the session file survives the crash. The pi coding agent writes tool calls and responses to a JSONL file incrementally using appendFileSync. When the process dies, the file on disk contains every tool call up to the crash point. On restart, GSD-2 checks if the lock file exists, reads the session JSONL, and builds a recovery briefing that tells the next agent what the crashed session was doing, what files it had read, and what changes it had made. The fresh agent picks up where the crashed one left off -- not from the beginning of the task, but from the last known good state.

```typescript
// Same-unit stuck counter with graduated recovery
const derivedKey = `${unitType}/${unitId}`;
if (derivedKey === lastDerivedUnit && !s.pendingVerificationRetry) {
  sameUnitCount++;

  if (sameUnitCount === 3) {
    // Level 1: try verifying the artifact
    const artifactExists = deps.verifyExpectedArtifact(
      unitType, unitId, s.basePath);
    if (artifactExists) {
      deps.invalidateAllCaches();
      continue;
    }
    ctx.ui.notify(
      `Stuck on ${unitType} ${unitId} (attempt ${sameUnitCount}).`,
      "warning");
    deps.invalidateAllCaches();
  } else if (sameUnitCount === 5) {
    // Level 2: hard stop -- genuinely stuck
    await deps.stopAuto(ctx, pi,
      `Stuck: ${unitType} ${unitId} derived ${sameUnitCount} times`);
    break;
  }
} else {
  lastDerivedUnit = derivedKey;
  sameUnitCount = 0;
}
```

Stuck detection solves a real problem: the agent writes a file, but deriveState does not see it because of caching. The result is an infinite loop where the system keeps dispatching the same unit. Level 1 catches this common case by checking the disk directly, bypassing the cache. Level 2 catches the harder case where the agent genuinely fails to produce the required artifact after multiple attempts. The combination of stuck detection, graduated errors, and crash recovery creates a system that can run for hours without human intervention -- surviving transient failures, process crashes, and agent misbehavior.

The auto-supervisor module handles the outermost layer of protection: SIGTERM handling and working-tree activity detection. When the operating system sends SIGTERM (container shutdown, user kill), the handler clears the lock file so the next startup does not incorrectly trigger crash recovery. Working-tree activity detection uses git to check for uncommitted changes -- if the agent has not signaled progress through runtime records but has modified files on disk, it is still working. This prevents the timeout supervisor from killing an agent that is actively writing code but has not yet reported back. Together, the auto loop, crash recovery, stuck detection, and supervisor form a layered defense: the loop handles iteration errors, crash recovery handles process death, stuck detection handles agent failures, and the supervisor handles external signals and silent progress.

---

### Lesson 5: Git & Worktrees

**Objective:** Learn branch-per-milestone, squash merge, and worktree isolation patterns that GSD-2 uses for safe parallel work.

An autonomous agent committing code for hours without supervision needs guardrails. If it writes directly to your main branch and introduces a bug in iteration 47, you have 46 good commits tangled with the bad one. GSD-2 solves this with git isolation: each milestone gets its own worktree -- a separate working directory with its own branch, created inside .gsd/worktrees/. The agent works there, commits freely, and when the milestone is complete, the entire history is squash-merged back to your integration branch as a single clean commit. If the milestone fails, you delete the worktree and lose nothing on main.

```typescript
export interface GitPreferences {
  auto_push?: boolean;
  push_branches?: boolean;
  remote?: string;
  snapshots?: boolean;
  commit_docs?: boolean;
  pre_merge_check?: boolean | string;
  merge_strategy?: "squash" | "merge";
  main_branch?: string;
  /** Controls auto-mode git isolation strategy.
   *  - "worktree": (default) creates a milestone worktree
   *  - "branch": works in the project root (for submodule-heavy repos)
   *  - "none": no isolation -- commits land on your current branch
   */
  isolation?: "worktree" | "branch" | "none";
  worktree_post_create?: string;
  auto_pr?: boolean;
  pr_target_branch?: string;
}
```

The worktree mode is the default because it provides the strongest isolation. A git worktree is a real, separate working directory backed by the same repository. It has its own checked-out branch, its own index, and its own HEAD. You can run your application from the project root (on main) while the agent works in the worktree (on the milestone branch) -- they do not interfere with each other. This is critical for long-running autonomous sessions: the user can continue to use their project while GSD-2 works in the background.

```typescript
export class WorktreeResolver {
  private readonly s: AutoSession;
  private readonly deps: WorktreeResolverDeps;

  /** Current working path -- may be worktree or project root. */
  get workPath(): string {
    return this.s.basePath;
  }

  /** Original project root -- always the non-worktree path. */
  get projectRoot(): string {
    return this.s.originalBasePath || this.s.basePath;
  }

  enterMilestone(milestoneId: string, ctx: NotifyCtx): void {
    this.validateMilestoneId(milestoneId);
    if (!this.deps.shouldUseWorktreeIsolation()) return;
    // Creates or enters the worktree, calls process.chdir() internally
    // Updates s.basePath and rebuilds GitService on success
  }

  mergeAndExit(milestoneId: string, ctx: NotifyCtx): void {
    // Squash-merge the milestone branch back to integration branch
    // Teardown the worktree directory
    // Restore s.basePath to originalBasePath
  }
}
```

When the auto loop detects a milestone transition -- the current milestone completes and a new one begins -- it calls mergeAndExit on the old milestone and enterMilestone on the new one. The merge step squash-merges all commits from the milestone branch into the integration branch. This means a milestone that took 50 agent sessions and produced 200 commits appears as a single, clean commit on main. The squash merge is not just cosmetic: it makes reverting an entire milestone trivial (one git revert) and keeps the main branch history readable even after hundreds of autonomous units.

```typescript
export function getMainBranch(): string {
  // 1. Explicit main_branch preference (user override)
  if (this.prefs.main_branch &&
      VALID_BRANCH_NAME.test(this.prefs.main_branch)) {
    return this.prefs.main_branch;
  }

  // 2. Milestone integration branch from metadata file
  if (this._milestoneId) {
    const integrationBranch =
      readIntegrationBranch(this.basePath, this._milestoneId);
    if (integrationBranch &&
        nativeBranchExists(this.basePath, integrationBranch)) {
      return integrationBranch;
    }
  }

  // 3. Worktree base branch (worktree/<name>)
  const wtName = detectWorktreeName(this.basePath);
  if (wtName) {
    const wtBranch = `worktree/${wtName}`;
    if (nativeBranchExists(this.basePath, wtBranch)) return wtBranch;
  }

  // 4. origin/HEAD -> main -> master -> current branch
  return nativeDetectMainBranch(this.basePath);
}
```

The integration branch recording is a subtle but important design choice. When you run /gsd auto on a feature branch called f-123-redesign, GSD-2 writes that branch name into the milestone's metadata file. All slice branches merge back into f-123-redesign, not main. This means GSD-2 works with your existing branching strategy instead of fighting it. The captureIntegrationBranch function is called once when auto-mode starts and is idempotent -- if you restart auto-mode on the same branch, it does not overwrite. If you restart on a different branch, it updates the record.

You now understand GSD-2's git isolation strategy. Worktrees provide full working-directory isolation so the user and the agent do not interfere with each other. Each milestone gets a dedicated branch where commits land freely. On milestone completion, all commits are squash-merged into the integration branch -- producing a clean, revertable history on main. The WorktreeResolver manages the lifecycle: enter milestone (create or resume worktree), work (commit freely on the milestone branch), and merge-and-exit (squash merge, teardown, restore to project root). The integration branch resolver ensures merges land on the correct branch regardless of where the user started. In the next lesson, you will see how GSD-2 discovers and loads skills to extend its capabilities.

---

### Lesson 6: Skills & Extensions

**Objective:** Discover how GSD-2 discovers skills, uses extension manifests, and supports custom skill authoring.

GSD-2 is not a monolith -- it is a core engine with an extension architecture. The core handles dispatch, state derivation, and auto-mode orchestration. Everything else -- tools, commands, hooks, shortcuts -- comes from extensions registered through a manifest. Skills are a layer on top: reusable expertise packages that agents can load when a task matches their description. A 'test' skill teaches the agent your project's testing conventions. A 'react-best-practices' skill injects React-specific guidance. Skills are discovered at runtime and injected into agent prompts, making GSD-2 adapt to your project without changing its core code.

```json
{
  "id": "gsd",
  "name": "GSD Workflow",
  "version": "1.0.0",
  "description": "Core GSD workflow engine -- milestone planning, execution, and tracking",
  "tier": "core",
  "requires": { "platform": ">=2.29.0" },
  "provides": {
    "tools": [
      "bash", "write", "read", "edit",
      "gsd_save_decision", "gsd_save_summary",
      "gsd_update_requirement", "gsd_generate_milestone_id"
    ],
    "commands": ["gsd", "kill", "worktree", "exit"],
    "hooks": ["session_start"],
    "shortcuts": ["Ctrl+Alt+G"]
  }
}
```

The manifest is declarative -- it tells the platform what the extension provides without requiring the platform to understand the implementation. The platform reads the manifest, registers the tools, wires up the commands, and installs the hooks. If you wanted to add a new GSD command, you would add it to the 'commands' array in the manifest and implement the handler function. The manifest is the contract between the extension and the platform.

```typescript
export interface DiscoveredSkill {
  name: string;
  description: string;
  location: string;
}

let baselineSkills: Set<string> | null = null;

export function snapshotSkills(): void {
  baselineSkills = new Set(listSkillDirs());
}

export function detectNewSkills(): DiscoveredSkill[] {
  if (!baselineSkills) return [];

  const current = listSkillDirs();
  const newSkills: DiscoveredSkill[] = [];

  for (const dir of current) {
    if (baselineSkills.has(dir)) continue;

    const skillMdPath = join(SKILLS_DIR, dir, "SKILL.md");
    if (!existsSync(skillMdPath)) continue;

    const meta = parseSkillFrontmatter(skillMdPath);
    if (meta) {
      newSkills.push({
        name: meta.name || dir,
        description: meta.description || `Skill: ${dir}`,
        location: skillMdPath,
      });
    }
  }

  return newSkills;
}
```

The snapshot-and-diff approach is elegant: it requires zero configuration. You install a skill by creating a directory with a SKILL.md file, and the next agent session automatically discovers it. This happens because GSD-2 calls captureAvailableSkills before each unit dispatch. If a task installs a new skill (the 'create-skill' skill teaches agents how to do this), all subsequent tasks in the same auto-mode session will see it. Skills are not plugins that require restart -- they are live-discovered expertise packages.

```text
skills/
  test/
    SKILL.md              # Frontmatter: name, description
    rules/
      testing-rules.md    # Injected into agent prompt
  react-best-practices/
    SKILL.md
    rules/
      component-rules.md
      hook-rules.md
  create-skill/
    SKILL.md              # Meta-skill: teaches how to create skills
    rules/
      skill-authoring.md

--- SKILL.md frontmatter ---
---
name: test
description: Project testing conventions and test-writing guidance
---

## Test Skill
Guidance for writing tests in this project...
```

The skill architecture embodies a key GSD-2 design principle: the agent decides when to use expertise, not the system. The platform discovers skills and lists them in the system prompt. The agent reads the descriptions and decides which ones are relevant to the current task. If a task involves writing tests, the agent loads the 'test' skill. If a task involves React components, it loads 'react-best-practices'. This is not a plugin system where everything is always loaded -- it is an on-demand expertise system where the agent exercises judgment about what knowledge it needs.

GSD-2 ships with skills for testing, code review, linting, accessibility, web design, React best practices, GitHub workflows, and more. But the real power is authoring your own. You create a directory in .claude/skills/ with a SKILL.md file and a rules/ directory. The SKILL.md frontmatter has two fields: name and description. The description is what agents use to decide relevance, so write it as a clear capability statement. The rules/ files contain your project-specific guidance -- your coding conventions, your architecture decisions, your testing strategy. Once created, every subsequent agent session can discover and use your skill. Extensions provide the platform's capabilities. Skills provide the project's expertise. Together, they make GSD-2 an agent that gets better at your specific project over time.

---

### Lesson 7: GSD-2 Architecture Synthesis

**Objective:** Connect all GSD-2 concepts into a unified mental model and compare the v1 prompt framework with the v2 agent application.

You have now studied every major subsystem of GSD-2: the dispatch pipeline that reads state from disk and selects the next action, the context engineering that builds focused prompts for fresh agent sessions, the auto loop that orchestrates execution with graduated error handling, the git isolation that keeps autonomous commits safe through worktrees and squash merges, and the skill discovery that lets agents load project-specific expertise on demand. In this final lesson, we connect these pieces into a single mental model and see how they work together through a complete autonomous cycle.

```text
GSD v1 (Prompt Framework)          GSD-2 (Agent Application)
─────────────────────────          ───────────────────────────
User loads GSD-WORKFLOW.md    -->   Agent reads .gsd/ directory
User tracks current phase     -->   deriveState computes phase
User decides what to do next  -->   resolveDispatch selects action
User manages context window   -->   Fresh sessions, auto context
User runs commands manually   -->   Auto loop dispatches units
User commits and pushes       -->   Worktree isolation, squash merge
No crash recovery             -->   Lock file + session JSONL
No stuck detection            -->   Graduated counter (3/5)
No extensibility              -->   Skills + extension manifest
Phases/plans in markdown      -->   Milestones/slices/tasks in .gsd/
```

The v1-to-v2 shift is not just automation -- it is a change in the unit of work. In v1, the unit was a session: the user loaded context, worked until the context window filled up, and started over. In v2, the unit is a task: a precisely scoped piece of work that fits in one context window by design. This reframing is what makes autonomous execution possible. A task has a plan file, a verification gate, and a summary artifact. The agent does not need to know the project history -- it needs the task plan and enough context to execute. When it finishes, the system derives the new state and dispatches the next task. The user never touches the context window.

```text
User runs: /gsd auto

1. STARTUP
   - Write auto.lock (crash recovery)
   - Snapshot skills (skill discovery)
   - Create/enter worktree (git isolation)
   - Capture integration branch

2. LOOP ITERATION (repeats for each unit)
   a. deriveState        --> reads .gsd/ files, computes phase
   b. resolveDispatch    --> matches phase to dispatch rule
   c. Build prompt       --> inlines context, task plan, decisions
   d. Fresh session      --> new context window, system prompt
   e. Agent executes     --> writes code, runs tests, produces artifact
   f. Commit work        --> smart staging, conventional commit message
   g. Verification gate  --> checks artifact exists, runs checks
   h. Post-unit          --> update state, check for milestone transition

3. COMPLETION
   - Squash merge milestone branch to integration branch
   - Teardown worktree
   - Clear auto.lock
   - Desktop notification: "Milestone complete!"
```

The key insight is that every subsystem exists to solve a specific failure mode of autonomous execution. Without state derivation from disk, the system would lose its position when the context window fills up. Without fresh sessions, accumulated context would degrade agent quality over time. Without worktree isolation, a bad agent session could corrupt the main branch. Without crash recovery, a process crash would leave the project in an unknown state. Without stuck detection, a failing agent would retry forever. Without skills, the agent would have no way to learn project-specific conventions. Each subsystem is a response to a real problem encountered during development.

```text
GSD-2 Architectural Principles:

1. STATE ON DISK
   State lives in files, not memory. deriveState reads .gsd/
   on every iteration. STATE.md is a cache, not truth.

2. FRESH SESSIONS
   Every task gets a new context window. No accumulated state,
   no degraded quality. The prompt IS the context.

3. GRADUATED RECOVERY
   1 error: retry. 2 errors: invalidate caches. 3 errors: stop.
   3 same-unit: check artifact. 5 same-unit: hard stop.

4. ISOLATION BY DEFAULT
   Worktree per milestone. Squash merge on completion.
   200 agent commits become 1 clean commit on main.

5. DECLARATIVE DISPATCH
   Rules table, not if-else chain. First match wins.
   Add a phase by adding a rule, not editing control flow.

6. ON-DEMAND EXPERTISE
   Skills discovered at runtime, loaded by agent judgment.
   The system adapts to the project, not the other way around.
```

Understanding these principles lets you predict how GSD-2 will behave in new situations. If you encounter a problem where the agent seems stuck, you know to check the stuck detection counter and the expected artifact. If a milestone's commits are messy, you know they will be squash-merged on completion. If you need the agent to follow your project's conventions, you know to create a skill. If the system crashes mid-execution, you know the lock file and session JSONL will enable recovery. The principles are not abstract -- they are operational knowledge that makes you effective at directing autonomous work.

GSD-2 is a methodology that became executable. Every concept from the original GSD-WORKFLOW.md -- phases, plans, execution, verification -- still exists. But instead of a human reading the methodology and following it manually, an application reads the methodology's artifacts from disk and executes them autonomously. The Milestone/Slice/Task hierarchy makes work dispatchable. The dispatch pipeline makes decisions automatic. The auto loop makes execution continuous. Git isolation makes commits safe. Skills make the agent adaptive. You now have a complete mental model of how an AI agent application is built -- not in theory, but in practice, with real code. The mini-project in the next section will give you a chance to exercise this understanding.

---

### Concept Map

```
  GSD-2 -- The Agent Application
        |
        v
  +-------------------------+
  | Overview                |
  | (v1->v2 evolution,      |
  |  Milestone/Slice/Task   |
  |  hierarchy)             |
  +-------------------------+
        |
        v
  +-------------------------+
  | Dispatch Pipeline       |
  | (deriveState,           |
  |  resolveDispatch,       |
  |  unit dispatch)         |
  +-------------------------+
        |
        v
  +-------------------------+
  | Context Engineering     |
  | (Fresh sessions, prompt |
  |  pre-loading, .gsd/     |
  |  artifacts, inlining)   |
  +-------------------------+
        |
        v
  +-------------------------+
  | Auto Mode               |
  | (Auto loop, crash       |
  |  recovery, stuck        |
  |  detection, timeout)    |
  +-------------------------+
        |
        v
  +-------------------------+
  | Git & Worktrees         |
  | (Branch-per-milestone,  |
  |  squash merge,          |
  |  worktree isolation)    |
  +-------------------------+
        |
        v
  +-------------------------+
  | Skills & Extensions     |
  | (Skill discovery,       |
  |  extension manifest,    |
  |  custom skill authoring)|
  +-------------------------+
        |
        v
  +-------------------------+
  | Synthesis               |
  | (v1 vs v2 mental model, |
  |  all pieces connected)  |
  +-------------------------+

```

### Mini-Project: Add a Dispatch Loop to Skeptic Reviews

Extend your skeptic workflow with a dispatch loop -- inspired by GSD-2's auto mode, it reads project state to decide what to review next, dispatches focused review subagents with scoped context, tracks what has been reviewed, and loops until coverage is complete

#### Artifacts

##### Skeptic workflow with dispatch loop

**Path:** `~/.claude/get-shit-done/workflows/skeptic.md`

**Verification Checks:**

- [ ] Reads or tracks project state to decide what to review next
- [ ] Has dispatch logic that routes work to focused review subagents
- [ ] Injects scoped context into each dispatched review (not full project)
- [ ] Tracks what has been reviewed to avoid duplication
- [ ] Loops or iterates until review coverage is complete
- [ ] Has a termination condition that ends the dispatch loop

#### Hints

<details>
<summary>Hint 1</summary>

Your skeptic workflow reviews code but always runs the same steps in the same order. GSD-2's auto mode is different -- it reads state, decides what to do, dispatches a focused agent, and repeats. Think about what your skeptic would need to behave like a dispatch loop instead of a static checklist.

</details>

<details>
<summary>Hint 2</summary>

A dispatch loop has four components: (1) read current state to know what has and hasn't been done, (2) decide what to dispatch next based on that state, (3) dispatch with focused context -- not the whole project, just what's relevant to this review pass, (4) update tracking so the next iteration knows what's been covered. All four need to appear in your workflow.

</details>

<details>
<summary>Hint 3</summary>

Add a step (or restructure existing steps) so the skeptic tracks which areas have been reviewed and which remain. Before each review dispatch, it should read this tracking state and pick the next unreviewed area. Each dispatched review gets scoped context -- only the files and patterns relevant to that area, not everything. The loop continues until all areas are marked reviewed.

</details>

<details>
<summary>Hint 4</summary>

Create a dispatch_loop step (or similar) that: (a) maintains a list of review areas with their completion status (state tracking), (b) selects the next unreviewed area and routes to a focused review for it (dispatch logic), (c) provides each review with only the relevant files and context for that area (context scoping), (d) marks the area as reviewed after completion and checks if more areas remain (coverage tracking with loop continuation).

</details>

<details>
<summary>Hint 5</summary>

In your skeptic workflow, add a dispatch loop mechanism: (a) define a coverage map listing review areas and their status (e.g., architecture: pending, conventions: pending), (b) add dispatch logic that reads the coverage map, picks the next pending area, and invokes a focused review subagent for it -- provide that subagent with scoped context (only files relevant to that area, not the full project), (c) after each dispatch completes, update the coverage map to mark that area reviewed, (d) loop back to the dispatch step and repeat until all areas show complete, (e) include a termination condition (all areas reviewed or coverage threshold met) that exits the loop. The structural checks verify these patterns exist -- the specific review areas, context scoping strategy, and loop mechanism are your creative decisions.

</details>

