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

## Lesson 7: The Fast Lane

**Objective:** Understand how /gsd:fast skips planning overhead for trivial tasks, executing inline without subagents, plans, or verification -- and when to use it versus /gsd:quick.

Sometimes you need to fix a typo, update a config value, or add a missing import. These are trivial tasks -- under 5 minutes, touching 3 files or fewer, needing zero research. For these, /gsd:quick's planning overhead (create PLAN.md, spawn subagents, run verification) is overkill. That's where /gsd:fast comes in. It's the fastest path from intent to committed code in GSD.

```markdown
<purpose>
Execute a trivial task inline without subagent overhead. No PLAN.md, no Task spawning,
no research, no plan checking. Just: understand -> do -> commit -> log.

For tasks like: fix a typo, update a config value, add a missing import, rename a
variable, commit uncommitted work, add a .gitignore entry, bump a version number.

Use /gsd:quick for anything that needs multi-step planning or research.
</purpose>
```

The purpose section makes the contract explicit: no PLAN.md, no Task spawning, no research, no plan checking. Compare this to /gsd:quick, which creates a plan, spawns a planner subagent, runs a plan checker, then spawns an executor subagent. The fast workflow does everything inline in the current context -- Claude reads the file, makes the change, commits, and logs it. The entire operation targets under 2 minutes of wall time.

```markdown
<step name="scope_check">
**Before doing anything, verify this is actually trivial.**

A task is trivial if it can be completed in:
- <= 3 file edits
- <= 1 minute of work
- No new dependencies or architecture changes
- No research needed

If the task seems non-trivial (multi-file refactor, new feature, needs research),
say:

```
This looks like it needs planning. Use /gsd:quick instead:
  /gsd:quick "{task description}"
```

And stop.
</step>
```

The scope check is a guardrail, not a suggestion. If the task needs more than 3 file edits, introduces new dependencies, or requires research, /gsd:fast redirects you to /gsd:quick. This prevents the temptation to use the fast path for work that actually needs planning. The criteria are concrete and checkable: file count, time estimate, dependency changes, research needs. No ambiguity.

```markdown
<step name="execute_inline">
Do the work directly:

1. Read the relevant file(s)
2. Make the change(s)
3. Verify the change works (run existing tests if applicable, or do a quick sanity check)

**No PLAN.md.** Just do it.
</step>

<guardrails>
- NEVER spawn a Task/subagent -- this runs inline
- NEVER create PLAN.md or SUMMARY.md files
- NEVER run research or plan-checking
- If the task takes more than 3 file edits, STOP and redirect to /gsd:quick
- If you're unsure how to implement it, STOP and redirect to /gsd:quick
</guardrails>
```

Notice the pattern: read, change, verify -- three steps, no ceremony. The guardrails section reinforces this with NEVER rules. No subagents, no planning artifacts, no research. If uncertainty creeps in during execution, the workflow stops and redirects. This is a key design principle in GSD: each command has a clear scope boundary, and crossing it means switching to a different command rather than stretching the current one.

Here's the GSD command spectrum from fastest to most thorough: /gsd:fast (no planning, no verification, single-agent inline), /gsd:quick (lightweight planning, executor subagent, optional verification), and the full /gsd:execute-phase pipeline (research, planning, plan-checking, parallel execution, verification). Each level adds safety at the cost of speed. /gsd:fast trades all safety mechanisms for raw speed -- appropriate only when the task is genuinely trivial. If you're unsure which to use, /gsd:quick is the safe default. /gsd:fast is for when you're certain.

---

## Lesson 8: Automatic Progression

**Objective:** Understand how /gsd:next reads project state and automatically determines which GSD command to run next, eliminating the cognitive load of remembering the workflow progression.

GSD projects follow a progression: discuss a phase, plan it, execute it, verify the work, complete the phase, then move to the next one. But remembering where you left off and which command to run next adds cognitive load -- especially when you return after a break. /gsd:next solves this by reading the project state and automatically dispatching to the correct next command. You type one command; GSD figures out the rest.

```markdown
<purpose>
Detect current project state and automatically advance to the next logical GSD workflow step.
Reads project state to determine: discuss -> plan -> execute -> verify -> complete progression.
</purpose>

<step name="detect_state">
Read project state to determine current position:

```bash
# Get state snapshot
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state json 2>/dev/null || echo "{}"
```

Also read:
- `.planning/STATE.md` -- current phase, progress, plan counts
- `.planning/ROADMAP.md` -- milestone structure and phase list

Extract:
- `current_phase` -- which phase is active
- `plan_of` / `plans_total` -- plan execution progress
- `progress` -- overall percentage
- `status` -- active, paused, etc.
</step>
```

The detect_state step loads everything GSD knows about the project: which phase is active, how many plans are complete, overall progress percentage, and whether work is paused. This is the same state that STATE.md tracks persistently across sessions. By reading it programmatically, /gsd:next can make an informed decision about what comes next without asking you anything.

```markdown
<step name="determine_next_action">
Apply routing rules based on state:

**Route 1: No phases exist yet -> discuss**
If ROADMAP has phases but no phase directories exist on disk:
-> Next action: `/gsd:discuss-phase <first-phase>`

**Route 2: Phase exists but has no CONTEXT.md or RESEARCH.md -> discuss**
If the current phase directory exists but has neither CONTEXT.md nor RESEARCH.md:
-> Next action: `/gsd:discuss-phase <current-phase>`

**Route 3: Phase has context but no plans -> plan**
If the current phase has CONTEXT.md (or RESEARCH.md) but no PLAN.md files:
-> Next action: `/gsd:plan-phase <current-phase>`

**Route 4: Phase has plans but incomplete summaries -> execute**
If plans exist but not all have matching summaries:
-> Next action: `/gsd:execute-phase <current-phase>`

**Route 5: All plans have summaries -> verify and complete**
If all plans in the current phase have summaries:
-> Next action: `/gsd:verify-work` then `/gsd:complete-phase`

**Route 6: Phase complete, next phase exists -> advance**
If the current phase is complete and the next phase exists in ROADMAP:
-> Next action: `/gsd:discuss-phase <next-phase>`

**Route 7: All phases complete -> complete milestone**
If all phases are complete:
-> Next action: `/gsd:complete-milestone`
</step>
```

The decision tree has 8 routes, and each maps a project state to exactly one GSD command. The logic follows the natural GSD lifecycle: discuss, plan, execute, verify, complete. Route 1 handles brand-new phases. Routes 2-5 handle the progression within a single phase. Route 6 advances across phases. Route 7 completes the entire milestone. Route 8 (not shown) handles paused projects by routing to /gsd:resume-work. Every possible state maps to a clear next action.

```markdown
<step name="show_and_execute">
Display the determination:

```
## GSD Next

**Current:** Phase [N] -- [name] | [progress]%
**Status:** [status description]

> **Next step:** `/gsd:[command] [args]`
  [One-line explanation of why this is the next step]
```

Then immediately invoke the determined command via SlashCommand.
Do not ask for confirmation -- the whole point of `/gsd:next` is zero-friction advancement.
</step>
```

The key line is 'Do not ask for confirmation.' /gsd:next is designed for zero-friction advancement. It shows you what it detected and what it's about to do, then immediately invokes the command. This is what makes it a true progression command rather than just a status display. Combined with GSD's auto-advance feature, /gsd:next can chain entire sequences: discuss, plan, execute, verify -- all from a single invocation.

/gsd:next embodies a core GSD principle: the system should know where you are and what comes next. By encoding the discuss-plan-execute-verify-complete lifecycle into routing rules, it transforms a multi-step workflow into a single repeatable command. Type /gsd:next, and GSD handles the rest. This is especially powerful when returning to a project after days or weeks -- instead of reading STATE.md and figuring out the next step, you let the state-driven dispatch do it for you.

---

## Lesson 9: Ship It

**Objective:** Understand how /gsd:ship creates pull requests from verified work, auto-generating rich PR bodies from planning artifacts and running pre-flight safety checks before pushing.

You've discussed, planned, executed, and verified a phase. The code works, tests pass, and SUMMARY.md files document what was built. Now it's time to ship -- create a pull request that communicates all of this to reviewers. /gsd:ship automates PR creation by reading GSD's planning artifacts to generate a rich PR body, running pre-flight safety checks, and using the GitHub CLI to create the PR. No manual PR descriptions needed.

```markdown
<step name="preflight_checks">
Verify the work is ready to ship:

1. **Verification passed?**
   ```bash
   VERIFICATION=$(cat ${PHASE_DIR}/*-VERIFICATION.md 2>/dev/null)
   ```
   Check for `status: passed` or `status: human_needed` (with human approval).
   If no VERIFICATION.md or status is `gaps_found`: warn and ask user to confirm.

2. **Clean working tree?**
   ```bash
   git status --short
   ```
   If uncommitted changes exist: ask user to commit or stash first.

3. **On correct branch?**
   ```bash
   CURRENT_BRANCH=$(git branch --show-current)
   ```
   If on `main`/`master`: warn -- should be on a feature branch.

4. **Remote configured?**
   ```bash
   git remote -v | head -2
   ```
   Detect `origin` remote. If no remote: error -- can't create PR.

5. **`gh` CLI available?**
   ```bash
   which gh && gh auth status 2>&1
   ```
   If `gh` not found or not authenticated: provide setup instructions and exit.
</step>
```

Five pre-flight checks run before anything touches GitHub. Verification status is checked first -- shipping unverified work requires explicit user confirmation. Clean working tree prevents accidental inclusion of uncommitted changes. Branch verification catches the common mistake of trying to PR from main. Remote and gh CLI checks ensure the infrastructure exists. Each check either passes silently or stops with a clear message. No silent failures.

```markdown
<step name="generate_pr_body">
Auto-generate a rich PR body from planning artifacts:

**1. Title:**
```
Phase {phase_number}: {phase_name}
```

**2. Summary section:**
Read ROADMAP.md for phase goal. Read VERIFICATION.md for verification status.

```markdown
## Summary

**Phase {N}: {Name}**
**Goal:** {goal from ROADMAP.md}
**Status:** Verified

{One paragraph synthesized from SUMMARY.md files -- what was built}
```

**3. Changes section:**
For each SUMMARY.md in the phase directory:
```markdown
## Changes

### Plan {plan_id}: {plan_name}
{one_liner from SUMMARY.md frontmatter}

**Key files:**
{key-files.created and key-files.modified from SUMMARY.md frontmatter}
```
</step>
```

The PR body is not written from scratch -- it's assembled from artifacts that already exist. ROADMAP.md provides the phase goal. VERIFICATION.md provides the verification status. Each SUMMARY.md contributes its one-liner description and key files list. This means every PR body is consistent, complete, and accurate -- it reflects what actually happened, not what someone remembers happening. The artifact chain from discuss through ship creates end-to-end traceability.

```markdown
<step name="create_pr">
Create the PR using the generated body:

```bash
gh pr create \
  --title "Phase ${PHASE_NUMBER}: ${PHASE_NAME}" \
  --body "${PR_BODY}" \
  --base main
```

If `--draft` flag was passed: add `--draft`.

Report: "PR #{number} created: {url}"
</step>

<step name="track_shipping">
Update STATE.md to reflect the shipping action:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state update "Status" \
  "Phase ${PHASE_NUMBER} shipped -- PR #${PR_NUMBER}"
```
</step>
```

The gh CLI does the heavy lifting of PR creation. After the PR is created, STATE.md is updated to reflect the shipping action -- maintaining the audit trail. /gsd:ship also offers optional code review routing: skip review, self-review, or request review from a teammate. This flexibility lets solo developers ship quickly while teams can enforce review workflows.

/gsd:ship closes the GSD lifecycle loop. The full pipeline runs: /gsd:discuss-phase captures decisions, /gsd:plan-phase creates executable plans, /gsd:execute-phase builds the code, /gsd:verify-work confirms correctness, and /gsd:ship turns it all into a PR. Each step reads artifacts from previous steps, so no information is lost. The PR body proves this -- it contains the phase goal from ROADMAP.md, verification status from the checker, and change details from SUMMARY.md files. Reviewers see not just what changed, but why it changed and how it was verified.

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

