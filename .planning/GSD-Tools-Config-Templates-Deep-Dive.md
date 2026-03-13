# GSD Tools, Config & Templates — Layer 5 Deep Dive

## What This Document Covers

This is the fifth and final layer in our progressive architectural exploration of Get Shit Done (GSD). Where Layer 4 examined the orchestration workflows that wire agents together, this layer examines the **tooling substrate** that everything else sits on — the CLI router, the 11 library modules that implement every low-level operation, the hooks system that integrates with Claude Code's lifecycle, and the template library that scaffolds every document GSD produces.

**Previous layers:**
- Layer 1: Codebase analysis documents (`.planning/codebase/` structure)
- Layer 2: State machine internals (`state.cjs`, `core.cjs`, `phase.cjs`, `frontmatter.cjs`)
- Layer 3: Agent prompt definitions (all 12 `.md` agent files)
- Layer 4: Orchestrators & workflows (19 workflow files, agent spawning, lifecycle pipeline)

**This layer covers:**
- The CLI router architecture (`gsd-tools.cjs`) and its pure dispatch model
- All 11 library modules and the ~50+ commands they expose
- The config hierarchy and project configuration model
- The hooks system: update checking, context monitoring, statusline rendering
- The template library: document scaffolding, heuristic selection, frontmatter contracts

---

## 1. The CLI Router — `gsd-tools.cjs`

At 592 lines, `gsd-tools.cjs` is the single entry point for every programmatic operation in GSD. It contains *zero business logic*. Its entire job is parsing `process.argv` and dispatching to the right library function.

### 1.1 The Pure Router Pattern

The file is a flat switch statement over a two-level command namespace:

```
gsd-tools <module> <command> [args] [--raw] [--cwd /path]
```

Modules map directly to library files: `state` → `state.cjs`, `phase` → `phase.cjs`, `roadmap` → `roadmap.cjs`, and so on. The router imports all 11 modules at the top, then dispatches:

```javascript
case 'state':
  switch (subcommand) {
    case 'get': cmdStateGet(cwd, arg1, raw); break;
    case 'patch': cmdStatePatch(cwd, arg1, raw); break;
    case 'update': cmdStateUpdate(cwd, arg1, arg2, raw); break;
    // ... 10+ more subcommands
  }
```

Two global flags thread through everything:
- `--raw` — forces JSON output for machine consumption (agents parsing tool output)
- `--cwd` — overrides working directory, critical for subagent sandboxing where each spawned agent operates in a different directory context

### 1.2 The Command Surface

The router exposes approximately 50+ distinct commands across 11 modules. The header comment serves as an inline reference, listing every command with its arguments — a design choice that lets agents (and humans) discover the full API without reading source code.

The modules, by category:

| Category | Module | Commands | Lines |
|----------|--------|----------|-------|
| **Foundation** | `core.cjs` | Model resolution, config loading, phase finding | 492 |
| **State** | `state.cjs` | STATE.md CRUD, progression engine, metrics | 721 |
| **Phase** | `phase.cjs` | Phase CRUD, lifecycle, plan indexing | 901 |
| **Roadmap** | `roadmap.cjs` | ROADMAP.md parsing, analysis, progress | 298 |
| **Init** | `init.cjs` | 12 compound init commands for workflows | 710 |
| **Config** | `config.cjs` | Config CRUD with hierarchy | 169 |
| **Verify** | `verify.cjs` | 9 verification functions, health checks | 820 |
| **Template** | `template.cjs` | Heuristic selection, template fill | 222 |
| **Milestone** | `milestone.cjs` | Requirements tracking, archival | 241 |
| **Commands** | `commands.cjs` | 12 standalone utilities | 548 |
| **Frontmatter** | `frontmatter.cjs` | YAML frontmatter parsing/writing | (Layer 2) |

Total: ~5,100+ lines of library code behind a zero-logic router.

---

## 2. The Foundation Layer — `core.cjs`

At 492 lines, `core.cjs` provides the primitives everything else depends on. Three subsystems dominate.

### 2.1 Model Resolution — `MODEL_PROFILES`

GSD supports 12 agent types, each assigned different Claude models depending on a project-level "profile" setting. The `MODEL_PROFILES` table encodes this:

```
Profile:   quality    balanced    budget
────────────────────────────────────
planner:   opus       sonnet      sonnet
executor:  opus       sonnet      sonnet
researcher: opus      sonnet      haiku
verifier:  opus       sonnet      sonnet
synthesizer: opus     sonnet      haiku
...
```

Resolution follows a 3-step cascade:
1. **Per-agent override** — `config.model_overrides[agentType]` (explicit user control)
2. **Profile lookup** — `MODEL_PROFILES[agentType][profile]` (table above)
3. **Default** — falls back to `sonnet`

The "opus" value resolves to the special string `"inherit"`, meaning "use whatever model the parent orchestrator is running on." This is an efficiency choice — if the user is already running on Opus, spawned agents inherit that context rather than forcing a model switch.

### 2.2 Config Loading — `loadConfig()`

Implements the 3-tier config hierarchy:

```
Hardcoded defaults → ~/.gsd/defaults.json → .planning/config.json
```

Each layer overwrites the previous via `Object.assign`. The global defaults file lets users set preferences (like `profile: "budget"`) that apply across all projects without per-project config.

### 2.3 Phase Finding — `findPhaseInternal()`

Given a phase number like `"06"`, finds the corresponding directory on disk. The search order matters: it checks the *current* `.planning/phases/` first, then falls through to archived milestone directories. This means commands work transparently across active and archived phases — you can query Phase 3's summary even after it's been archived into a completed milestone.

### 2.4 The Overflow Pattern

The `output()` function handles a subtle problem: when command output exceeds 50KB of JSON, dumping it to stdout would blow the context budget of the calling agent. Instead, GSD writes to a temp file and returns a pointer:

```javascript
if (jsonStr.length > 50000) {
  const tmpPath = `/tmp/gsd-overflow-${Date.now()}.json`;
  fs.writeFileSync(tmpPath, jsonStr);
  console.log(`@file:${tmpPath}`);
}
```

The `@file:` prefix is a convention the orchestrator workflows recognize — they read the file contents instead of trying to parse the pointer as JSON. This is particularly important for commands like `history-digest` and `roadmap analyze` that can produce very large outputs.

---

## 3. The State Engine — `state.cjs`

At 721 lines, this is the second-largest module and implements GSD's "living memory" for project execution.

### 3.1 Dual-Format Field Operations

STATE.md uses two formatting conventions for fields, and `state.cjs` handles both transparently:

```markdown
**Phase:** 3 of 8             ← Bold format (newer)
Current Plan: 02-03            ← Plain format (older/simpler)
```

Every field extraction (`stateExtractField`) tries the bold regex first, then falls back to plain. Every field replacement (`stateReplaceField`) similarly handles both. This dual support means STATE.md files authored by different template versions all work correctly.

### 3.2 The Frontmatter Sync — `writeStateMd()`

Every write to STATE.md goes through a critical pipeline:

```
Content change → syncStateFrontmatter() → buildStateFrontmatter() → write
```

`buildStateFrontmatter()` extracts structured fields from the markdown body (phase number, plan number, status, progress percentage), normalizes the status to one of seven canonical values (`planning`, `discussing`, `executing`, `verifying`, `paused`, `completed`, `unknown`), and constructs a YAML frontmatter block. The file is then reconstructed with the new frontmatter prepended.

This means STATE.md's frontmatter is *always* a derived view of its body content. You can edit the body manually and the frontmatter will self-correct on the next write. The frontmatter exists for machine consumption — agents can parse YAML faster than scanning markdown sections.

Progress calculation is milestone-scoped: `getMilestonePhaseFilter()` determines which phases belong to the current milestone, and only those are counted when computing the progress percentage.

### 3.3 The Progression Engine

`cmdStateAdvancePlan()` handles the state machine transition after a plan completes:

- If there are more plans in the current phase → increment Current Plan
- If at the last plan → set status to "Phase complete — ready for verification"

This is the bridge between execution and verification. The orchestrator calls `state advance-plan` after each plan's summary is written, and the resulting status change triggers the verification workflow.

### 3.4 Accumulated Context Operations

STATE.md maintains three context sections that grow over the project lifetime:

**Decisions** — `cmdStateAddDecision()` appends to the Decisions section, removing the "None yet" placeholder on first add. Decisions include the originating phase for traceability.

**Blockers** — `cmdStateAddBlocker()` and `cmdStateResolveBlocker()` manage a lifecycle. Resolved blockers are removed entirely (not marked as done) to keep STATE.md under its 100-line target.

**Session Continuity** — `cmdStateRecordSession()` updates the "Last session" timestamp, "Stopped at" description, and optional "Resume file" path. This is what enables instant session restoration — a new conversation reads STATE.md and knows exactly where to pick up.

---

## 4. Phase Lifecycle — `phase.cjs`

At 901 lines, this is the largest module and handles the full create-execute-complete lifecycle for phases.

### 4.1 Plan Indexing — `cmdPhasePlanIndex()`

Given a phase directory, returns a structured index of all plans with:
- Wave grouping (plans can execute in parallel waves)
- Checkpoint detection (tasks marked `autonomous: false` pause for human input)
- Completion tracking (which plans have corresponding SUMMARY.md files)

The parser handles two plan formats: XML `<task>` tags (the preferred modern format) and legacy `## Task N` markdown headers. This dual parsing ensures backward compatibility with older GSD projects.

### 4.2 Phase Insertion — Decimal Phases

GSD supports inserting urgent phases between existing ones using decimal numbering:

```
Phase 6 → Phase 6.1 (INSERTED) → Phase 6.2 (INSERTED) → Phase 7
```

`cmdPhaseInsert()` calculates the next available decimal (`cmdPhaseNextDecimal()`), creates the directory, and inserts the section into ROADMAP.md after the target phase. Decimal phases are marked with `(INSERTED)` to distinguish planned work from emergency insertions.

### 4.3 Phase Removal — The Renumbering Problem

`cmdPhaseRemove()` handles the most complex operation: removing a phase and renumbering everything downstream. The logic differs for integer vs. decimal phases:

**Integer removal** (e.g., removing Phase 4 from a 7-phase project):
- Phases 5, 6, 7 become 4, 5, 6
- All directories renamed: `05-feature-x/` → `04-feature-x/`
- All files *inside* renamed directories updated: `05-01-PLAN.md` → `04-01-PLAN.md`
- ROADMAP.md updated: headings, checkboxes, plan references, depends-on chains
- STATE.md total phase count decremented

**Decimal removal** (e.g., removing Phase 6.2):
- Only sibling decimals renumber: 6.3 → 6.2, 6.4 → 6.3
- Parent integer phases untouched

This is deliberately conservative — GSD never auto-renumbers across milestone boundaries.

### 4.4 Phase Completion — `cmdPhaseComplete()`

The most orchestrated single operation in the tools layer:

1. Mark ROADMAP.md checkbox as complete (with date)
2. Update ROADMAP progress table (status → "Complete", add completion date)
3. Update plan count text in phase detail section
4. Update REQUIREMENTS.md traceability (checkbox + traceability table row)
5. Find next phase — tries filesystem first (looks for next directory), falls back to ROADMAP.md parsing for unscaffolded phases
6. Update STATE.md — current phase, status, plan reset, last activity

The filesystem-then-ROADMAP fallback for finding the next phase is important: phases might exist in the roadmap but not yet have directories (they're created during the planning step). Phase completion needs to advance the pointer regardless.

---

## 5. Roadmap Operations — `roadmap.cjs`

At 298 lines, this module provides three focused operations on ROADMAP.md.

### 5.1 Phase Extraction — `cmdRoadmapGetPhase()`

Extracts a single phase section with structured fields: name, goal, and success criteria as an array. The interesting case is malformed ROADMAP detection: if a phase appears in the summary checklist but lacks a detail section, it returns `error: 'malformed_roadmap'` with a diagnostic message. This catches a common authoring mistake where someone adds a phase to the checklist but forgets the `### Phase N:` section.

### 5.2 Full Analysis — `cmdRoadmapAnalyze()`

The most comprehensive read operation, returning a structured view of the entire project:

For each phase:
- **Disk status** with 7 possible states: `complete`, `partial`, `planned`, `researched`, `discussed`, `empty`, `no_directory`
- Plan and summary counts from filesystem
- Goal and dependency chain from ROADMAP.md text
- Checkbox status from markdown

Aggregate stats: total plans, total summaries, overall progress percentage, current/next phase pointers, and any phases with missing detail sections.

This powers the progress command, the statusline display, and the orchestrator's decision about what to do next.

### 5.3 Progress Updates — `cmdRoadmapUpdatePlanProgress()`

After each plan execution, updates three things in ROADMAP.md:
1. The progress table row (e.g., `2/3` → `3/3`, status → "Complete")
2. The plan count in the phase detail section
3. The checkbox (auto-checked when all plans have summaries)

---

## 6. Init Commands — `init.cjs`

At 710 lines, this module contains 12 compound init commands — one for each major workflow. Each returns a pre-computed JSON payload that gives the calling workflow exactly the context it needs.

### 6.1 The Init Pattern

Every workflow's first step is:

```bash
gsd-tools init <workflow-name> [args] --raw
```

The returned JSON typically includes:
- Resolved model strings for agent spawning
- Config flags (parallelization settings, gate confirmations)
- File paths (phase directory, plan files, template paths)
- Phase inventory (what exists, what's complete, what's next)
- STATE.md snapshot fields

This is a context budget optimization. Rather than having the workflow read STATE.md, ROADMAP.md, config files, and phase directories separately (burning tokens on file content the workflow doesn't need), the init command reads everything server-side and returns a focused payload.

### 6.2 Notable Init Commands

**`cmdInitNewProject()`** — Includes brownfield detection. Scans for existing code files (`*.ts`, `*.js`, `*.py`, etc.) and `package.json`/`pyproject.toml` to determine if this is a greenfield or brownfield project. The returned payload includes a `brownfield` flag and `existing_files` list that the new-project workflow uses to adjust its questioning strategy.

**`cmdInitResume()`** — Handles interrupted agent recovery. Checks for a `current-agent-id.txt` breadcrumb file that indicates a previous execution was interrupted mid-agent-spawn. Returns the interrupted agent's context so the workflow can offer to resume rather than restart.

**`cmdInitProgress()`** — Runs `cmdRoadmapAnalyze()` internally and enriches it with milestone info, velocity metrics from STATE.md, and formatted progress displays.

---

## 7. Config System — `config.cjs`

At 169 lines, this is the smallest module but governs the entire project's behavior.

### 7.1 The Config Hierarchy

```
Hardcoded defaults (in core.cjs)
  ↓ overwritten by
~/.gsd/defaults.json (user global preferences)
  ↓ overwritten by
.planning/config.json (project-specific settings)
```

`cmdConfigEnsureSection()` creates the project config from the template (`templates/config.json`) and merges global defaults if they exist. This runs once during project initialization.

### 7.2 Dot-Notation Access

`cmdConfigGet` and `cmdConfigSet` support nested paths:

```bash
gsd-tools config get parallelization.max_concurrent_agents
gsd-tools config set parallelization.enabled true
```

The set command auto-parses value types: `"true"` → boolean `true`, `"3"` → number `3`, anything else stays a string.

### 7.3 The Default Config Template

The `templates/config.json` defines the full configuration surface:

```json
{
  "mode": "greenfield",
  "granularity": "standard",
  "workflow": {
    "commit_docs": false,
    "phase_research": true,
    "phase_context_discussion": true,
    "auto_advance": true,
    "auto_verify": true
  },
  "parallelization": {
    "enabled": false,
    "plan_level": false,
    "task_level": true,
    "skip_checkpoints": false,
    "max_concurrent_agents": 3,
    "min_plans_for_parallel": 2
  },
  "gates": { /* 8 confirmation gates + 2 safety gates */ }
}
```

**Granularity** controls phase decomposition: `coarse` (3-5 phases), `standard` (5-8), `fine` (8-12). This single setting cascades through the entire planning pipeline.

**Parallelization** is multi-level: `plan_level` runs multiple plans simultaneously, `task_level` runs tasks within a plan in parallel. The `max_concurrent_agents` cap prevents resource exhaustion. `skip_checkpoints` allows autonomous mode where human verification checkpoints are auto-approved.

**Gates** are confirmation points where GSD pauses for user approval: roadmap approval, plan approval, phase transition, etc. Each can be toggled independently to customize the automation/control balance.

---

## 8. Verification Suite — `verify.cjs`

At 820 lines, this module implements 9 verification functions that form GSD's quality assurance layer.

### 8.1 Summary Verification — `cmdVerifySummary()`

Four checks against a completed plan's SUMMARY.md:
1. File exists and has content
2. Required frontmatter fields present (phase, plan, subsystem, key-decisions)
3. Duration and completed date populated
4. Body sections present (Accomplishments, Files)

### 8.2 Plan Structure Validation — `cmdVerifyPlan()`

Validates PLAN.md structure:
- Frontmatter completeness (phase, plan, type, requirements — requirements MUST NOT be empty)
- Task XML parsing — each `<task>` has name, type, description
- Wave structure consistency
- Must-haves section present with at least truths or artifacts

### 8.3 Phase Completeness — `cmdVerifyPhase()`

Checks that every plan in a phase has a corresponding summary, and that the phase's success criteria (from ROADMAP.md) are satisfiable by the accumulated plan outputs.

### 8.4 Health Validation — `cmdValidateHealth()`

The comprehensive project health check with 8 named checks:

**Errors (project won't work correctly):**
- `E001` — Missing STATE.md
- `E002` — Missing ROADMAP.md
- `E003` — Missing config.json
- `E004` — STATE.md references non-existent phase
- `E005` — Orphaned phase directories (exist on disk but not in ROADMAP)

**Warnings (project works but has issues):**
- `W001-W009` — Various inconsistencies between STATE.md, ROADMAP.md, and disk state

**Info:**
- `I001` — Suggestions for improvement (e.g., "consider adding requirements")

The `--repair` flag auto-fixes what it can: creates missing files from templates, removes orphaned directories, syncs STATE.md with ROADMAP.md. Unfixable issues are reported for manual intervention.

### 8.5 Must-Haves Verification

The goal-backward verification system checks three artifact types:

**Truths** — Observable behaviors that must be true: "User can log in with email." Verified by checking if the plan's task outputs claim to have implemented them.

**Artifacts** — Files that must exist with specific properties:
- `exists` — file is on disk
- `min_lines` — file has at least N lines
- `contains` — file contains a specific string
- `exports` — file exports a specific symbol

**Key Links** — Regex patterns that must match between source and target files. For example, verifying that a component file imports from a specific module, or that a route definition references a specific handler.

---

## 9. Template System — `template.cjs`

At 222 lines, this module handles document scaffolding with an interesting heuristic selection mechanism.

### 9.1 Heuristic Template Selection — `cmdTemplateSelect()`

Given metadata about a plan (task count, file count, decision count), selects the appropriate template variant:

```
taskCount ≤ 2 AND files ≤ 3 AND no decisions → minimal
decisions present OR files > 6 OR tasks > 5  → complex
everything else                               → standard
```

This means small, straightforward plans get lightweight SUMMARY templates without the full frontmatter apparatus, while complex plans get the complete treatment including decision logs and tech-stack tracking.

### 9.2 Template Fill — `cmdTemplateFill()`

Pre-populates template fields from known context: phase number, plan number, date, subsystem. The filled template is written to disk, ready for the executing agent to complete with actual results.

---

## 10. Standalone Commands — `commands.cjs`

At 548 lines, this module houses 12 utility commands that don't fit neatly into the other modules.

### 10.1 History Digest — `cmdHistoryDigest()`

Aggregates every phase summary (current AND archived milestones) into a single structured digest. For each phase, extracts: `provides` (what was built), `affects` (what it impacts), `patterns` (architectural patterns used), and `key-decisions`. Returns accumulated `decisions` and `tech_stack` across the entire project history.

This is the "institutional memory" command — when a new phase needs to understand what was built before, the history digest provides a compressed view without requiring the agent to read every individual summary file.

### 10.2 Git Integration — `cmdCommit()`

Wraps `git commit` with GSD-specific guards:
- Checks `config.workflow.commit_docs` — if false, refuses to commit
- Verifies `.planning` is in `.gitignore` — warns if planning artifacts would be committed
- Handles the "nothing to commit" case gracefully (returns success, not error)

### 10.3 Web Search — `cmdWebsearch()`

Integrates with the Brave Search API for research agents. Requires `BRAVE_API_KEY` environment variable. When the key is absent, returns `{ available: false }` silently — research agents detect this and skip web search without failing. This graceful degradation means GSD works fully offline, just without web research augmentation.

### 10.4 Progress Rendering — `cmdProgressRender()`

Three output formats:
- **Table** — Full progress table with Unicode bar (`█░`), phase breakdown, milestone info
- **Bar** — Just the progress bar for compact display
- **JSON** — Machine-readable progress data

### 10.5 Scaffolding — `cmdScaffold()`

Creates structural scaffolds for different document types: context discussion documents, UAT test scripts, verification checklists, and phase directories. Each scaffold includes appropriate frontmatter and section stubs.

---

## 11. Milestone Management — `milestone.cjs`

At 241 lines, this module handles the transition from "phases complete" to "milestone shipped."

### 11.1 Requirements Tracking — `cmdRequirementsMarkComplete()`

Updates REQUIREMENTS.md when a requirement is satisfied:
1. Checks the requirement's checkbox (`[ ]` → `[x]`)
2. Updates the traceability table row with completion date and implementing phase

Requirements tracking flows upstream: PLAN.md declares which requirements it addresses, SUMMARY.md confirms completion, and this function closes the loop in REQUIREMENTS.md.

### 11.2 Milestone Archival — `cmdMilestoneComplete()`

The full archival pipeline:
1. Copies ROADMAP.md and REQUIREMENTS.md to `milestones/vX.Y/`
2. Creates (or updates) MILESTONES.md with a reverse-chronological entry
3. Scopes stats via `getMilestonePhaseFilter()` — only counts phases belonging to this milestone
4. Updates STATE.md to reflect the new milestone boundary

After archival, subsequent progress calculations only consider phases *after* the milestone boundary. This prevents completed work from polluting the progress bar of the next milestone.

---

## 12. The Hooks System

GSD ships three Claude Code hooks that integrate into Claude's lifecycle without any user configuration.

### 12.1 Update Checker — `gsd-check-update.js`

**Hook type:** `SessionStart`

Spawns a *detached* background process (not blocking session startup) that queries the npm registry for the latest `get-shit-done-cc` version. Results are cached to `~/.claude/cache/gsd-update-check.json`. The statusline hook reads this cache to display update notifications.

Multi-runtime aware: supports Claude Code, OpenCode, and Gemini session contexts, adapting the cache directory based on environment variables.

### 12.2 Context Monitor — `gsd-context-monitor.js`

**Hook type:** `PostToolUse`

The most sophisticated hook. Monitors context window consumption and injects advisory messages when usage gets dangerous:

**Thresholds:**
- ≤35% remaining → `WARNING` — suggests wrapping up current work
- ≤25% remaining → `CRITICAL` — urgent signal to save state and prepare for handoff

**Anti-spam mechanisms:**
- Debounce: only triggers every 5 tool invocations (prevents warning fatigue)
- Severity escalation: if severity increases (WARNING → CRITICAL), bypasses debounce
- 3-second stdin timeout guard: prevents hanging if the bridge file is stale

**GSD awareness:** When a GSD project is active (detected via STATE.md), messages reference GSD-specific actions: "update STATE.md," "run `/gsd:pause-work`." Non-GSD sessions get generic context management advice.

The hook reads context data from a bridge file (`/tmp/claude-ctx-{session_id}.json`) written by the statusline hook. This inter-hook communication avoids duplicate context measurement.

Messages are *advisory only* — they appear as `additionalContext` in the tool response, not as imperative commands. This design choice (noted in issue #884) prevents the hook from overriding Claude's agency.

### 12.3 Statusline — `gsd-statusline.js`

**Hook type:** `Statusline`

Renders a compact status bar showing: model name, current task, working directory, and context usage percentage.

**Context normalization:** Subtracts a 16.5% buffer for Claude Code's autocompact overhead, then scales to the usable range. This means 0% in the statusline = truly no context left for user work (not 16.5% consumed by framework overhead).

**Color coding:**
- Green: <50% used
- Yellow: <65% used
- Orange: <80% used
- Skull + blink: ≥80% used (critical)

**Task display:** Reads Claude Code's todos directory to find the current in-progress task, displaying it in the statusline. Falls back to "No active task" when nothing is in progress.

**Bridge file:** Writes current context data to `/tmp/claude-ctx-{session_id}.json` for the context-monitor hook to consume. This one-way data flow (statusline → file → monitor) keeps the hooks loosely coupled.

---

## 13. The Template Library

GSD ships 26 templates covering every document type the system produces. Four are architecturally significant.

### 13.1 STATE.md Template — `state.md`

Defines the project's "living memory" with a strict **<100 line** size constraint. Sections:

- **Project Reference** — Points to PROJECT.md, includes core value one-liner
- **Current Position** — Phase X of Y, Plan A of B, status, progress bar
- **Performance Metrics** — Velocity tracking: total plans, averages, per-phase breakdown, trend
- **Accumulated Context** — Decisions digest, pending todos count, active blockers
- **Session Continuity** — Last session timestamp, stop point, resume file pointer

The template documentation includes full lifecycle rules: created during init, read first in every workflow, written after every significant action. The explicit lifecycle is what makes STATE.md reliable — it's not an artifact that might be stale, it's contractually updated at every state transition.

### 13.2 ROADMAP.md Template — `roadmap.md`

Two format variants:

**Greenfield (v1.0):** Flat phase list with progress table. Phases have goals, dependencies, requirements, success criteria (2-5 observable behaviors each), and plan lists. Phase count is calibrated by granularity setting.

**Post-v1.0 (milestone-grouped):** Completed milestones collapse into `<details>` tags. Current and future milestones stay expanded. Continuous phase numbering across milestones (never restart at 01). Progress table gains a Milestone column.

Success criteria format is deliberately user-facing: "User can [action]" or "[Thing] works/exists." These flow downstream to plan `must_haves` and are verified by `verify-phase`.

### 13.3 SUMMARY.md Template — `summary-standard.md`

The richest frontmatter contract in the system:

```yaml
phase: XX-name
plan: YY
subsystem: [primary category]
tags: [searchable tech]
provides:
  - [what was built/delivered]
affects: [list of phase names or keywords]
tech-stack:
  added: [libraries/tools]
  patterns: [architectural/code patterns]
key-files:
  created: [important files created]
  modified: [important files modified]
key-decisions:
  - "Decision 1"
duration: Xmin
completed: YYYY-MM-DD
```

This frontmatter is what powers `cmdHistoryDigest()` — the structured fields enable aggregation without natural language parsing. The `provides`/`affects` fields create a dependency graph across phases: Phase 3 provides "authentication module," Phase 5 is affected by "authentication module."

### 13.4 PLAN.md Template — `phase-prompt.md`

At 570 lines, this is the largest and most sophisticated template. It defines:

**Task XML structure:**
```xml
<task name="implement-auth" type="auto" wave="1">
  <description>Implement authentication middleware</description>
  <files>src/auth.ts, src/middleware.ts</files>
</task>
```

Task types: `auto` (fully autonomous), `checkpoint:human-verify` (pause for review), `checkpoint:decision` (pause for user choice), `checkpoint:human-action` (user must do something external).

**Wave-based parallel execution:** Tasks in the same wave can run in parallel. Waves execute sequentially. This gives fine-grained control over parallelism within a plan.

**Must-haves — Goal-backward verification:**
```yaml
must_haves:
  truths:
    - "Login endpoint returns JWT on valid credentials"
  artifacts:
    - path: src/auth.ts
      min_lines: 50
      contains: "verifyToken"
      exports: "authMiddleware"
  key_links:
    - source: src/routes.ts
      target: src/auth.ts
      pattern: "import.*authMiddleware"
```

This is GSD's answer to "how do you verify the agent actually did what was asked?" — concrete, machine-checkable assertions defined *before* execution begins.

**User setup** — External services the user must configure before execution (API keys, database connections). Declared in the plan, verified before the first task runs.

**Anti-patterns documented** — The template explicitly lists what NOT to do: don't put checkpoints inside autonomous tasks, don't create single-task plans (merge into adjacent plan), don't leave `requirements` empty.

---

## 14. Cross-Cutting Architectural Patterns

### 14.1 Machine-First Output

Every command supports `--raw` for JSON output. The default (non-raw) mode produces human-readable text. This dual mode means the same tools serve both interactive debugging and agent consumption. The JSON output is consistently structured: every response includes the primary data plus an `error` field when something goes wrong.

### 14.2 Filesystem as Database

GSD uses the filesystem as its persistence layer with zero external dependencies. Phase directories are rows, markdown files are documents, frontmatter is structured metadata, directory naming encodes ordering. This is a deliberate choice that trades query power for portability — a GSD project is a folder you can `cp`, `zip`, `git push`, or `rsync` with no setup.

### 14.3 Defensive Parsing

Every parser handles malformed input gracefully. `cmdRoadmapGetPhase()` detects missing detail sections. `cmdPhasePlanIndex()` handles both XML and legacy markdown task formats. `stateExtractField()` tries two format variants. `comparePhaseNum()` handles complex patterns like `12A.1.2`. The system never crashes on unexpected input — it returns structured error data and lets the caller decide what to do.

### 14.4 Milestone-Scoped Operations

After the first milestone ships, many operations become scoped: progress calculations only count current-milestone phases, phase finding checks current before archived, history digest spans all milestones but clearly attributes per-phase. The `getMilestonePhaseFilter()` function is the boundary marker — it returns a filter predicate that operations use to scope their work.

---

## 15. The Complete Architecture — All Five Layers

Standing back, the five layers form a clear stack:

```
Layer 5: Tools & Config    ← You are here
  CLI router, 11 lib modules, hooks, templates
  "The substrate — every operation the system can perform"

Layer 4: Orchestrators
  19 workflow files, command wrappers
  "The control plane — how operations compose into workflows"

Layer 3: Agents
  12 prompt definitions with roles and constraints
  "The workers — specialized AI agents with defined capabilities"

Layer 2: State Machine
  STATE.md lifecycle, frontmatter sync, progression engine
  "The memory — tracking where we are and what happened"

Layer 1: Codebase Analysis
  .planning/codebase/ structure docs
  "The foundation — understanding what exists before changing it"
```

Data flows downward: orchestrators call tools, agents are spawned by orchestrators, state is read/written by tools. Control flows upward: tools report results, state changes trigger workflow transitions, agent outputs feed back into orchestrator decisions.

The key insight across all five layers is GSD's commitment to **structured intermediate artifacts**. Nothing is ephemeral. Every decision, every execution result, every state change is captured in a parseable format on disk. This is what enables session continuity, milestone archival, history digestion, and health validation — the filesystem is both the execution log and the project's institutional memory.
