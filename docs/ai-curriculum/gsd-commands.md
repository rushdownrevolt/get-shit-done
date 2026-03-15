# GSD Commands & Workflows

Learn how GSD slash commands dispatch through command specs to workflow files.

## Lesson 1: The Two-Layer Architecture

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

## Lesson 2: Command Spec Anatomy

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

## Lesson 3: Workflow File Anatomy

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

## Lesson 4: Command to Workflow Wiring

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

# Parse JSON for: planner_model, executor_model,
# commit_docs, next_num, slug, quick_dir, task_dir
```

This bash block from the workflow's Step 2 shows the full chain in action. The command spec granted Bash tool access, so the workflow can run node commands. The gsd-tools.cjs script initializes the quick task and returns JSON configuration. Claude parses that JSON and uses the values in subsequent steps. The same pattern repeats for every GSD command: /gsd:new-project has its own spec and workflow, /gsd:execute-phase has its own pair, and each follows the same dispatch chain.

Here's the complete dispatch chain in one view: (1) user types /gsd:quick, (2) Claude reads the command spec at commands/gsd/quick.md, (3) frontmatter sets permissions and identity, (4) execution_context's @file loads the workflow, (5) workflow's purpose and process define what to execute, (6) bash code blocks call Node.js tools, (7) sub-agents are spawned via Task calls. Every GSD command you'll encounter follows this exact chain. The two-file architecture keeps declarations separate from execution, making each piece independently readable and modifiable.

---

## Lesson 5: Bridge to Node.js

**Objective:** Understand how the markdown layer (command specs and workflows) connects to the Node.js layer that actually executes CLI commands, previewing what Module 2 covers.

You now know that GSD slash commands are defined by two types of markdown files. Command specs declare what a command is -- its name, permissions, and structure. Workflows define how it executes -- step-by-step processes with bash code blocks. You've seen how @file references wire specs to workflows, and how the dispatch chain routes /gsd:quick through the whole system. But there's a question we haven't answered yet.

When a workflow says 'run node gsd-tools.cjs state advance-plan', who executes that? The markdown files are instructions for Claude, but the actual state management, file operations, and configuration updates happen in Node.js code. There's an entire layer beneath the markdown -- a CommonJS toolkit that does the real work. This is the Node.js layer, and it's what Module 2 is all about.

The entry point is gsd-tools.cjs -- a single Node.js script that acts as the CLI router. When Claude runs a bash command like 'node gsd-tools.cjs state advance-plan', the script parses the arguments and routes them through a switch statement. The first argument (like 'state' or 'config') selects which tool module to call. The remaining arguments become the specific operation and its parameters.

Behind the switch statement are the tool modules: core.cjs handles project initialization and plan management. config.cjs reads and writes the configuration JSON. phase.cjs manages phase transitions and plan counting. state.cjs updates STATE.md -- the living document that tracks where you are in a project. Each module exports functions that the CLI router calls. Module 2 walks through each of these files, showing you exactly how they work.

Remember the <process> sections in workflow files? They contain bash commands like 'node gsd-tools.cjs state advance-plan' and 'node gsd-tools.cjs roadmap update-plan-progress'. These are the connection points between the two layers. The markdown layer tells Claude what to run; the Node.js layer makes it happen. When you read Module 2, you'll recognize every CLI command from the workflows you've already studied.

The design is intentional: markdown files are easy to read, edit, and version control. They're the interface between humans and Claude. The Node.js layer handles the mechanical work -- parsing files, updating state, managing configuration -- that would be tedious and error-prone to describe in natural language. Understanding both layers means you can modify GSD at any level: tweak a workflow's instructions, add a new command spec, or extend a tool module with new functionality.

---

## Concept Map

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

## Mini-Project: Build /gsd:skeptic

Create a command spec + workflow pair that critiques a GSD phase

### Artifacts

#### Skeptic command spec

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

#### Skeptic workflow

**Path:** `~/.claude/get-shit-done/workflows/skeptic.md`

**Verification Checks:**

- [ ] Has purpose section
- [ ] Has process section with steps

### Hints

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

