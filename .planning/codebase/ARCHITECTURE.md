# Architecture

**Analysis Date:** 2026-03-11

## Pattern Overview

**Overall:** Multi-agent orchestration system with centralized planning, execution, and verification layers

**Key Characteristics:**
- Modular CLI tool distributed as npm package with runtime-agnostic installer
- Decoupled agent system: planner, executor, researcher, verifier agents spawned via command orchestrators
- State-driven workflow: CONFIG.json, STATE.md, ROADMAP.md, REQUIREMENTS.md as source of truth
- YAML frontmatter metadata system for artifact versioning and traceability
- Atomic git commits per task with deviation tracking and checkpoint protocols
- Dynamic model selection based on budget profiles (quality/balanced/budget)

## Layers

**CLI Entry Layer:**
- Purpose: Install, initialize, and dispatch GSD commands to user's runtime environment
- Location: `bin/install.js`, `get-shit-done/bin/gsd-tools.cjs`
- Contains: Multi-runtime installer (Claude Code, OpenCode, Gemini, Codex), command dispatcher
- Depends on: Node.js filesystem, git, package.json manifests
- Used by: Terminal/user commands, orchestrator workflows

**Tool Library Layer:**
- Purpose: Centralized CommonJS utilities for state queries, git operations, config parsing
- Location: `get-shit-done/bin/lib/*.cjs`
- Contains: Core utilities (core.cjs), commands (commands.cjs), frontmatter parsing (frontmatter.cjs), phase/milestone/state operations
- Depends on: Node.js fs/path/child_process, git
- Used by: Workflow markdown files, agent prompts

**Agent Layer:**
- Purpose: Specialized multi-turn Claude agents spawned by orchestrators
- Location: `agents/*.md`
- Contains: gsd-planner, gsd-executor, gsd-verifier, gsd-debugger, gsd-codebase-mapper, gsd-project-researcher, gsd-phase-researcher, gsd-research-synthesizer, gsd-roadmapper, plus read-only checkers
- Depends on: Orchestrator context, CONTEXT.md decisions, project codebase
- Used by: Workflow orchestrators

**Workflow Orchestration Layer:**
- Purpose: Coordinate agent spawning, state transitions, and subprocess workflows
- Location: `get-shit-done/workflows/*.md`
- Contains: execute-phase, execute-plan, plan-phase, discuss-phase, audit-milestone, complete-milestone, discovery-phase, and 30+ other workflows
- Depends on: gsd-tools.cjs commands, agent prompts
- Used by: User via `/gsd:` commands

**Command/Prompt Layer:**
- Purpose: User-facing command specifications and agent role definitions
- Location: `commands/gsd/*.md`, `agents/*.md`
- Contains: Command metadata (description, flags, defaults), agent system prompts with roles and responsibilities
- Depends on: Workflow orchestrators
- Used by: Claude Code, OpenCode, Gemini CLI, Codex runtimes

**State/Artifact Layer:**
- Purpose: Persistent project context, decisions, and progress tracking
- Location: `.planning/` directories in user projects
- Contains: CONFIG.json (settings), STATE.md (current position), ROADMAP.md (phase breakdown), CONTEXT.md (user vision), PLAN.md (executable tasks), SUMMARY.md (completion records), VERIFICATION.md (success validation)
- Depends on: Project initialization
- Used by: All agents and orchestrators

## Data Flow

**Project Initialization Flow:**
1. User runs `/gsd:new-project`
2. Orchestrator calls `config-ensure-section` to create `.planning/config.json` with defaults
3. Orchestrator calls `template fill` to scaffold initial ROADMAP.md template
4. User fills ROADMAP.md with milestone structure and phase breakdown
5. STATE.md created with initial project state

**Phase Planning Flow:**
1. User requests `/gsd:plan-phase --phase <N>`
2. Orchestrator loads: CONFIG.json, STATE.md, ROADMAP.md, CONTEXT.md (if exists), phase directory
3. Orchestrator spawns gsd-planner agent with phase details, user decisions, codebase context
4. Planner produces PLAN.md with task breakdown, dependencies, and wave assignments
5. Orchestrator optionally invokes gsd-plan-checker (read-only) if `plan_checker` enabled in config
6. If gaps found, orchestrator triggers revision or gap-closure workflow
7. PLAN.md committed to git (if `commit_docs` enabled)

**Phase Execution Flow:**
1. User runs `/gsd:execute-phase --phase <N>`
2. Orchestrator calls `init execute-phase` → queries model resolution, plan inventory, branch templates
3. Orchestrator spawns gsd-executor with PLAN.md, project instructions, phase context
4. Executor loads task list from PLAN.md frontmatter and body structure
5. For each task:
   - Execute using Bash/Write/Edit tools
   - Apply deviation rules automatically (Rule 1-3: bugs, missing critical functionality, blockers)
   - Create per-task atomic git commits
   - Track completion and commit hashes
6. After all tasks, executor creates SUMMARY.md with:
   - Frontmatter: execution metadata, affected files, key decisions, tech stack changes
   - Body: accomplishments, performance metrics, key decisions, patterns established
7. Executor optionally spawns gsd-verifier (if `verifier` enabled) to validate success criteria
8. If verification fails and config allows, spawn gsd-debugger or route to gap closure
9. Executor commits SUMMARY.md

**State Progression Flow:**
1. After plan completion, orchestrator updates STATE.md:
   - Current phase → next phase or next milestone
   - Completed plans counter
   - Blockers/decisions from CONTEXT.md
2. If milestone complete, orchestrator:
   - Archives completed phases to `milestones/vX.Y-phases/`
   - Creates MILESTONES.md entry
   - Increments version in STATE.md
   - Resets phase counter for next milestone

**State Management:**

Persistent state stored across calls:
- **CONFIG.json**: Model profile, branching strategy, workflow toggles (research, plan_checker, verifier, nyquist_validation, parallelization)
- **STATE.md**: YAML frontmatter + markdown sections tracking current milestone, phase, plan number, blockers, decisions
- **ROADMAP.md**: Markdown structure: milestone summary + detailed phase sections with goals, success criteria, requirements
- **CONTEXT.md**: Phase-specific user vision, locked decisions, deferred ideas, discretionary areas (created by discuss-phase)
- **REQUIREMENTS.md**: Traceability matrix linking requirements to phases, status (pending/complete)
- **Phase Directories**: .planning/phases/1/, .planning/phases/1.1/, etc. containing PLAN.md, SUMMARY.md, VERIFICATION.md, UAT.md

In-memory transient state:
- Execution position (from completed_tasks in executor context)
- Deviation tracking (Rule 1-3 auto-fixes)
- Checkpoint pause state (checkpoint type = "pause", requires fresh agent resume)

## Key Abstractions

**Phase Model:**
- Purpose: Encapsulates work unit with number (1, 1.1, 1.1.2, etc.), name, goals, success criteria
- Examples: `get-shit-done/bin/lib/phase.cjs`, `.planning/phases/1-build-auth/`
- Pattern: Phase numbering supports integers and decimal nesting; normalized internally for comparison/sorting

**Plan Model:**
- Purpose: Executable specification for a phase with task breakdown, dependency graph, execution waves
- Examples: `.planning/phases/1/auth-PLAN.md`
- Pattern: Frontmatter contains wave assignments, depends_on arrays, task types (auto/checkpoint/tdd); body contains objective, context references (@file:), task blocks with verification criteria

**Summary Model:**
- Purpose: Completion record with execution metrics, files changed, decisions made, patterns established
- Examples: `.planning/phases/1/auth-SUMMARY.md`
- Pattern: Frontmatter metadata (phase, plan, completed timestamp), body with performance metrics, accomplishments, key decisions, patterns, tech-stack changes

**Frontmatter YAML System:**
- Purpose: Structured metadata embedding in markdown documents
- Pattern: --- YAML --- markdown-body format; recursive nesting for complex structures (tech-stack.added, must_haves.artifacts)
- Used in: PLAN.md, SUMMARY.md, VERIFICATION.md, REQUIREMENTS.md frontmatter

**Model Profile System:**
- Purpose: Dynamic model selection based on agent type and user budget preference
- Pattern: quality/balanced/budget profiles map to Claude models (opus/sonnet/haiku); resolveModelInternal() looks up agent profile, returns appropriate model
- Examples: gsd-planner uses {quality: opus, balanced: opus, budget: sonnet}; gsd-executor uses {quality: opus, balanced: sonnet, budget: sonnet}

**Deviation Rule Framework:**
- Purpose: Auto-fix categories for executor to handle unplanned work
- Pattern:
  - Rule 1: Auto-fix bugs (broken behavior, errors, incorrect output)
  - Rule 2: Auto-add critical functionality (error handling, validation, security)
  - Rule 3: Auto-fix blockers (missing dependencies, broken imports, DB connection errors)
  - Rule 4: Ask about architectural changes (new DB tables, major schema changes, new services)
- Used by: gsd-executor during task execution

**Checkpoint Protocol:**
- Purpose: Pause execution at specified points, allow fresh agent resume with state preservation
- Pattern: Task type="checkpoint:name" → executor stops, returns structured message; orchestrator spawns new agent with <completed_tasks> context block
- Used for: Verification gates, decision points, long-running workflows requiring verification between steps

## Entry Points

**Installer Entry:**
- Location: `bin/install.js`
- Triggers: `npx get-shit-done-cc@latest`, `npx get-shit-done-cc --claude --global`
- Responsibilities: Detect runtime environment (Claude Code/.claude/, OpenCode/.config/opencode/, Gemini/.gemini/, Codex/.codex/), copy agents/commands/workflows, create hooks, configure permissions

**CLI Tool Entry:**
- Location: `get-shit-done/bin/gsd-tools.cjs`
- Triggers: `node gsd-tools.cjs <command> [args]`
- Responsibilities: Dispatch utility commands (state load, phase add, commit, resolve-model, verify-summary, etc.)

**Workflow Entry (User Command):**
- Location: `get-shit-done/workflows/<name>.md` triggered by `/gsd:<command>`
- Triggers: `/gsd:new-project`, `/gsd:plan-phase`, `/gsd:execute-phase`, etc.
- Responsibilities: Orchestrate agents, parse user input, manage state transitions, handle parallelization

**Agent Entry:**
- Location: `agents/*.md`
- Triggers: Spawned by workflow with @file: context references and structured input
- Responsibilities: Execute specialized role (planning, execution, research, verification), return structured JSON or markdown output

## Error Handling

**Strategy:** Layered error handling with graceful degradation and auto-recovery

**Patterns:**

1. **Config Loading:** Falls back to hardcoded defaults if .planning/config.json missing or malformed
2. **Phase Lookup:** Returns null if phase not found; workflows handle gracefully with error messages
3. **Frontmatter Parsing:** Partial parse on malformed YAML; extractFrontmatter() returns incomplete object rather than throwing
4. **Git Operations:** Caught execGit() errors return false; commits don't block if git unavailable
5. **File I/O:** safeReadFile() returns null on missing files; allows workflows to continue with degraded context
6. **Deviation Handling:** Executor applies deviation rules automatically; tracks all deviations for Summary; never fails execution due to unplanned work

## Cross-Cutting Concerns

**Logging:**
- Approach: Stderr for errors (via error() function), stdout for structured JSON output (via output() function)
- Patterns: Large payloads (>50KB JSON) written to tmpfile with @file: prefix to avoid Bash tool buffer overflow

**Validation:**
- Approach: Structural validation in gsd-tools.cjs (validate consistency, validate health with optional repair)
- Patterns: Phase numbering syntax, disk/roadmap sync, PLAN.md structure, SUMMARY.md completeness

**Authentication:**
- Approach: Auth gates via executor deviation rules; requires fresh agent approval for architectural changes
- Patterns: Rule 4 triggers interactive approval for auth changes; model overrides in config.json allow per-agent customization

**Concurrency:**
- Approach: Parallelization controlled via config.json; orchestrator checks parallelization flag before spawning multiple agents
- Patterns: Wave-based execution in PLAN.md (execution_wave field); checkpoint protocol prevents race conditions during state mutations

---

*Architecture analysis: 2026-03-11*
