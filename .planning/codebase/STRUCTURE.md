# Codebase Structure

**Analysis Date:** 2026-03-11

## Directory Layout

```
get-shit-done/
├── bin/                      # NPM package entry point
│   └── install.js            # Multi-runtime installer (Claude/OpenCode/Gemini/Codex)
├── commands/                 # User-facing command specifications
│   └── gsd/                  # GSD command definitions (50+ commands)
├── agents/                   # Agent system prompts and roles
│   ├── gsd-planner.md        # Phase planning orchestrator
│   ├── gsd-executor.md       # Plan execution engine
│   ├── gsd-verifier.md       # Success verification
│   ├── gsd-debugger.md       # Issue diagnosis and fix
│   ├── gsd-codebase-mapper.md # Codebase analysis for STACK/ARCH/CONVENTIONS/TESTING/CONCERNS
│   ├── gsd-roadmapper.md     # Roadmap structure generation
│   └── [8 other agents]      # Researchers, synthesizers, checkers, auditors
├── get-shit-done/            # Core GSD tool and templates
│   ├── bin/
│   │   ├── gsd-tools.cjs     # CLI utility dispatcher (100+ commands)
│   │   └── lib/              # CommonJS tool modules
│   │       ├── core.cjs      # Shared utilities, model profiles, git helpers
│   │       ├── commands.cjs  # Standalone utility commands (slug, timestamp, todos)
│   │       ├── config.cjs    # Planning config CRUD operations
│   │       ├── frontmatter.cjs # YAML frontmatter parsing and serialization
│   │       ├── state.cjs     # STATE.md operations and progression engine
│   │       ├── phase.cjs     # Phase CRUD, query, and lifecycle operations
│   │       ├── milestone.cjs # Milestone and requirements lifecycle
│   │       ├── roadmap.cjs   # Roadmap parsing and update operations
│   │       ├── template.cjs  # Template selection and fill operations
│   │       ├── verify.cjs    # Verification utilities and checkers
│   │       └── init.cjs      # Compound init commands for bootstrapping
│   ├── workflows/            # Orchestration markdown files (37+ workflows)
│   │   ├── new-project.md    # Initialize new project
│   │   ├── plan-phase.md     # Plan phase execution
│   │   ├── execute-phase.md  # Execute phase with monitoring
│   │   ├── execute-plan.md   # Execute single plan
│   │   ├── discuss-phase.md  # Pre-planning user discussion
│   │   ├── discovery-phase.md # Background research workflow
│   │   ├── complete-milestone.md # Archive milestone
│   │   ├── audit-milestone.md # Audit milestone completion
│   │   └── [29 other workflows] # Add phases, insert phases, check todos, cleanup, etc.
│   ├── references/           # Technical reference documentation
│   │   ├── model-profiles.md # Model selection table
│   │   ├── planning-config.md # Configuration schema reference
│   │   ├── phase-argument-parsing.md # Phase number normalization rules
│   │   ├── decimal-phase-calculation.md # Phase numbering algebra
│   │   └── [9 other references] # Checkpoints, continuation format, TDD, etc.
│   ├── templates/            # Markdown/JSON scaffolding templates
│   │   ├── codebase/         # Codebase analysis templates (STACK.md, ARCHITECTURE.md, etc.)
│   │   ├── config.json       # Default planning configuration
│   │   ├── project.md        # New project template
│   │   ├── milestone.md      # New milestone template
│   │   ├── phase-prompt.md   # Phase-specific user prompt template
│   │   ├── requirements.md   # Requirements tracking template
│   │   └── [7 other templates]
└── docs/                     # User documentation
    └── USER-GUIDE.md         # Comprehensive user guide with examples
```

## Directory Purposes

**`bin/`:**
- Purpose: Package entry point and installer
- Contains: install.js (runtime detection, file copying, hook setup, permission configuration)
- Key files: `install.js` (1200+ lines)

**`commands/gsd/`:**
- Purpose: Command metadata and specifications consumed by runtimes
- Contains: 50+ markdown files (one per user command)
- Key files: `new-project.md`, `plan-phase.md`, `execute-phase.md`, `map-codebase.md`, `health.md`
- Pattern: Each file defines command flags, defaults, description, and links to orchestrating workflow

**`agents/`:**
- Purpose: System prompts for specialized Claude agents
- Contains: 12 markdown files with role definitions, responsibilities, entry conditions, output specs
- Key files: `gsd-planner.md` (850 lines), `gsd-executor.md` (500+ lines), `gsd-verifier.md`, `gsd-codebase-mapper.md`
- Pattern: Each agent has <role>, <philosophy>, structured instructions, and tool usage guidelines

**`get-shit-done/bin/lib/`:**
- Purpose: Centralized utility library for all tool commands
- Contains: 11 CommonJS modules implementing CRUD, state management, git, verification
- Key files:
  - `core.cjs` (500+ lines): toPosixPath(), loadConfig(), MODEL_PROFILES table, isGitIgnored(), execGit(), findPhaseInternal(), comparePhaseNum()
  - `commands.cjs` (400+ lines): cmdGenerateSlug(), cmdCurrentTimestamp(), cmdListTodos(), cmdVerifyPathExists(), cmdHistoryDigest()
  - `frontmatter.cjs` (300+ lines): extractFrontmatter(), reconstructFrontmatter() with recursive YAML parsing
  - `state.cjs` (400+ lines): cmdStateLoad(), cmdStateGet(), cmdStateUpdate(), stateExtractField(), writeStateMd()
  - `phase.cjs` (600+ lines): cmdPhasesList(), cmdPhaseNextDecimal(), cmdPhaseCreate(), cmdPhaseRemove(), cmdPhaseComplete()

**`get-shit-done/workflows/`:**
- Purpose: Orchestration logic for multi-step workflows and agent spawning
- Contains: 37 markdown files defining workflows via bash code blocks and Claude Code calls
- Key files:
  - `new-project.md`: Initialize .planning/, config, roadmap
  - `plan-phase.md`: Load context, spawn planner, optionally invoke checker, handle revisions
  - `execute-phase.md`: Load state, spawn executor, monitor for deviations, invoke verifier, route to debugger if needed
  - `discuss-phase.md`: Gather user decisions before planning
  - `audit-milestone.md`: Verify phase completion, check requirements traceability
- Pattern: Bash variables for temporary state, gsd-tools.cjs commands for persistence, Claude Code calls for agent spawning

**`get-shit-done/references/`:**
- Purpose: Technical reference documentation for internal algorithms and data formats
- Contains: 11 markdown files documenting schema, parsing rules, model profiles, verification patterns
- Key files:
  - `model-profiles.md`: Model selection per agent per budget profile
  - `planning-config.md`: CONFIG.json schema with all supported keys
  - `phase-argument-parsing.md`: Phase number normalization (1, 1.1, 1.1a → 001, 001.001, 001.001a)
  - `decimal-phase-calculation.md`: Algorithm for finding next phase in sequence

**`get-shit-done/templates/`:**
- Purpose: Markdown/JSON scaffolding used by template fill commands
- Contains: 20+ template files for projects, milestones, phases, plans, summaries, verifications
- Key files:
  - `codebase/`: STACK.md, ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, INTEGRATIONS.md, CONCERNS.md templates
  - `config.json`: Default planning configuration with model_profile, branching_strategy, workflow settings
  - `project.md`: New project template with milestones section
  - `phase-prompt.md`: Phase-specific prompt generator

## Key File Locations

**Entry Points:**
- `bin/install.js`: Package installer (called by `npx get-shit-done-cc`)
- `get-shit-done/bin/gsd-tools.cjs`: Utility command dispatcher (called by workflows/agents)

**Configuration:**
- `.planning/config.json`: User project settings (model profile, branching strategy, workflow toggles)
- `.planning/STATE.md`: Current project state (milestone, phase, blockers, decisions)
- `get-shit-done/references/model-profiles.md`: Model selection rules

**Core Logic:**
- `get-shit-done/bin/lib/core.cjs`: Model profiles, config loading, git operations, phase lookup
- `get-shit-done/bin/lib/phase.cjs`: Phase CRUD and lifecycle
- `get-shit-done/bin/lib/state.cjs`: STATE.md mutations and queries
- `get-shit-done/bin/lib/frontmatter.cjs`: YAML parsing for metadata

**Testing:**
- `tests/`: Test files (run via `npm test`)
- `scripts/run-tests.cjs`: Test runner

## Naming Conventions

**Files:**

- `.cjs` extension: CommonJS modules (used for gsd-tools.cjs and lib/*.cjs)
- `.md` extension: Markdown documentation (commands, agents, workflows, templates, references)
- `.js` extension: Node.js scripts (bin/install.js)
- Naming: kebab-case for file names (gsd-tools.cjs, gsd-planner.md, new-project.md)

**Directories:**

- `bin/`: Executable entry points
- `lib/`: Utility modules
- `workflows/`: Orchestration markdown
- `references/`: Technical specs
- `templates/`: Scaffolding
- `agents/`: Agent prompts
- `commands/`: Command definitions
- `.planning/phases/N/`: Phase working directories (N = phase number)
- `.planning/milestones/vX.Y-phases/`: Archived phase directories

## Where to Add New Code

**New Utility Command:**
1. Implement command function in `get-shit-done/bin/lib/<module>.cjs` or create new module
2. Export function from module (e.g., `module.exports = { cmdMyNewCommand }`)
3. Add dispatch case in `get-shit-done/bin/gsd-tools.cjs` main switch statement
4. Update gsd-tools.cjs docstring with new command signature

**New Workflow:**
1. Create `get-shit-done/workflows/<name>.md`
2. Include: frontmatter with metadata, user instructions, bash/Claude Code orchestration steps
3. Call gsd-tools.cjs commands via bash `RESULT=$(node gsd-tools.cjs ...)`
4. Spawn agents via `/claude ...` or direct prompt injection
5. Handle large results via @file: protocol

**New Agent:**
1. Create `agents/gsd-<name>.md`
2. Include: frontmatter (name, description, tools, color), <role> section, detailed instructions
3. Use <files_to_read> block for mandatory initial reads
4. Return structured JSON via output() or markdown via Write()
5. Document tool usage and expected outputs

**New Command (User-Facing):**
1. Create `commands/gsd/<name>.md`
2. Include: frontmatter (description, flags, defaults), brief help text
3. Link to orchestrating workflow in body
4. Define expected flags and their types

**Utilities:**
- Shared helpers: `get-shit-done/bin/lib/core.cjs`
- Path helpers: toPosixPath(), use everywhere for cross-platform compatibility
- Config queries: loadConfig() in core.cjs, updated STATE.md mutations in state.cjs
- Model resolution: resolveModelInternal() in core.cjs for agent model selection

## Special Directories

**`.planning/` (Project-level):**
- Purpose: User project state and artifacts
- Generated: Yes (created by new-project workflow)
- Committed: Yes (unless .gitignore excludes it)
- Contains: config.json, STATE.md, ROADMAP.md, CONTEXT.md, REQUIREMENTS.md, VERIFICATION.md, phases/, milestones/

**`node_modules/`:**
- Purpose: NPM dependencies
- Generated: Yes (via npm install)
- Committed: No (in .gitignore)

**`hooks/dist/`:**
- Purpose: Compiled git hooks for GSD integrations
- Generated: Yes (via npm run build:hooks)
- Committed: Yes (prebuilt for distribution)

**`.claude/`, `.opencode/`, `.gemini/`, `.codex/`:**
- Purpose: Runtime-specific prompt directories (created by installer)
- Generated: Yes (by bin/install.js)
- Committed: No (per-user configuration)

---

*Structure analysis: 2026-03-11*
