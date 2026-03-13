# GSD State Machine — Annotated Deep Dive

**Scope:** `state.cjs` (721 lines) → `core.cjs` (492 lines) → `phase.cjs` (901 lines), with `frontmatter.cjs` (299 lines) as supporting parser.

---

## 1. The Big Idea

GSD uses **markdown files as a database**. There's no SQLite, no JSON store, no Redis — just `.md` files with YAML frontmatter, edited in-place via regex. The "state machine" is really a collection of functions that read fields from markdown, mutate them, and write them back. The entire system's truth lives in three files: `STATE.md`, `ROADMAP.md`, and `config.json`.

This is a deliberate trade-off. Markdown is human-readable, git-diffable, and editable by hand. But it means the code is full of fragile regex patterns that need to handle two formatting styles (`**Bold:**` and plain `Field:`), multiple heading levels, and edge cases like empty sections and placeholder text.

---

## 2. Module Dependency Graph

```
frontmatter.cjs  ←── state.cjs  ←── phase.cjs
       ↑                 ↑               ↑
       └──── core.cjs ───┴───────────────┘
```

- **core.cjs** is the foundation. Everyone imports from it. It owns output helpers, config loading, git operations, model profiles, and phase-number math.
- **frontmatter.cjs** is the YAML parser. Used by state and phase for reading/writing metadata.
- **state.cjs** owns STATE.md mutations. It imports from core and frontmatter, and exports `writeStateMd` — the single chokepoint for all state writes.
- **phase.cjs** is the biggest module and the most complex. It imports from all three others and orchestrates the heaviest operations (phase removal with cascading renumber).

---

## 3. core.cjs — The Utility Belt (492 lines)

### 3.1 Output System (lines 35–56)

Every command exits through one of two functions:

```javascript
function output(result, raw, rawValue) {
  if (raw && rawValue !== undefined) {
    process.stdout.write(String(rawValue));  // Shell-friendly: just the value
  } else {
    const json = JSON.stringify(result, null, 2);
    if (json.length > 50000) {
      // Write to tmpfile, output @file:/path
      // Prevents Bash tool buffer overflow in Claude Code
    } else {
      process.stdout.write(json);
    }
  }
  process.exit(0);
}
```

**Design decision:** The dual-mode output (`--raw` for scripts, JSON for agents) is clever. The `@file:` protocol for large payloads solves a real problem — Claude Code's Bash tool has a ~50KB buffer limit. Rather than truncating, GSD writes to a temp file and returns a pointer. Callers detect the `@file:` prefix and read the file.

**Note:** `process.exit(0)` is called inside `output()`. This means every command is a one-shot: call a function, emit output, die. There's no request/response lifecycle — it's pure Unix-style "do one thing and exit."

### 3.2 Model Profile Table (lines 18–31)

```javascript
const MODEL_PROFILES = {
  'gsd-planner':         { quality: 'opus', balanced: 'opus',   budget: 'sonnet' },
  'gsd-executor':        { quality: 'opus', balanced: 'sonnet', budget: 'sonnet' },
  'gsd-codebase-mapper': { quality: 'sonnet', balanced: 'haiku', budget: 'haiku' },
  // ... 9 more
};
```

This is GSD's cost-optimization engine. Each of the 12 agent types gets a different model depending on the user's budget preference. The planner always gets the best model (opus even on balanced), while the codebase mapper gets haiku on balanced — because mapping is mechanical work that doesn't need heavy reasoning.

**Interesting quirk in `resolveModelInternal` (line 373):** When a model resolves to `'opus'`, it returns `'inherit'` instead. This means "use whatever model the parent runtime is already running" — because Claude Code is already running on a capable model, so there's no need to spawn a separate opus instance. It's an optimization that avoids unnecessary API calls.

### 3.3 Phase Number Comparator (lines 186–212)

```javascript
function comparePhaseNum(a, b) {
  // Handles: 12 < 12A < 12A.1 < 12A.1.2 < 12A.2 < 13
```

This is surprisingly sophisticated. It parses phase numbers into three components — integer, optional letter suffix, optional decimal segments — and compares them hierarchically. The letter suffix acts as an "alternate track" (12A is a variant of phase 12), while decimals act as sub-phases. The key insight: no letter sorts before any letter (`12 < 12A`), and no decimal sorts before any decimal (`12A < 12A.1`). This enables phase insertion without renumbering — you just add `12.1` between 12 and 13.

### 3.4 Phase Search with Archive Fallback (lines 259–294)

`findPhaseInternal` searches for a phase in two places: current phases first, then archived milestones (newest first). This means you can reference an old phase by number and it'll find it in the archives. The search returns a rich object with plans, summaries, research status, and completion tracking — essentially a phase "health check" in one call.

### 3.5 Config Loading with Migration (lines 68–130)

`loadConfig` does something unusual — it silently migrates deprecated keys. If it finds `depth: "quick"` it rewrites it to `granularity: "coarse"` and saves the file. It also supports nested config sections via a `get()` helper that checks both flat keys (`commit_docs`) and nested paths (`planning.commit_docs`). The entire thing falls back to hardcoded defaults if the config file is missing or corrupt.

---

## 4. state.cjs — The Heart of the Machine (721 lines)

### 4.1 The Dual Extract Pattern

The most-called function in the codebase:

```javascript
function stateExtractField(content, fieldName) {
  // Try **Field:** bold format first
  const boldPattern = new RegExp(`\\*\\*${escaped}:\\*\\*\\s*(.+)`, 'i');
  // Fall back to plain Field: format
  const plainPattern = new RegExp(`^${escaped}:\\s*(.+)`, 'im');
}
```

Every field read tries bold markdown first, then plain text. This accommodates hand-edited STATE.md files where someone might use either format. The corresponding `stateReplaceField` does the same dual-pattern replacement.

**Bug / dead code:** `stateExtractField` is defined **twice** — once at line 12 (using `escapeRegex` from core.cjs) and again at line 184 (using inline regex escaping). The second definition shadows the first. The first definition is dead code. Since JavaScript hoists function declarations, the second definition wins. Both implementations are functionally identical, but it's the kind of duplication that suggests the file grew organically.

### 4.2 The Write Chokepoint: `writeStateMd` (lines 679–682)

```javascript
function writeStateMd(statePath, content, cwd) {
  const synced = syncStateFrontmatter(content, cwd);
  fs.writeFileSync(statePath, synced, 'utf-8');
}
```

**This is the most important design decision in the entire state system.** Every STATE.md write goes through this function, which strips the old YAML frontmatter, rebuilds it from the markdown body, and prepends it. This means the YAML frontmatter is always a derived view of the markdown body — never the source of truth.

Why? Because humans (and agents) edit the markdown body directly. If frontmatter were the source of truth, edits to the body would desync. By always regenerating frontmatter from body, GSD guarantees consistency.

The `syncStateFrontmatter` chain:
1. `stripFrontmatter(content)` — Remove existing `---\n...\n---` block
2. `buildStateFrontmatter(body, cwd)` — Extract all fields from markdown, scan phase directories for progress counts, normalize status string
3. `reconstructFrontmatter(fm)` — Serialize the object back to YAML
4. Prepend `---\n{yaml}\n---\n\n` to body

### 4.3 State Progression Commands

The "game loop" of GSD is driven by these commands:

**`cmdStateAdvancePlan`** — Increments `Current Plan` by 1. When the counter reaches `Total Plans in Phase`, it sets status to "Phase complete — ready for verification" instead. This is the tick that drives execution forward.

**`cmdStateUpdateProgress`** — Scans all phase directories, counts PLAN.md vs SUMMARY.md files, and generates a visual progress bar: `[████████░░] 80%`. The ratio is simple: summaries/plans = percent complete.

**`cmdStateRecordMetric`** — Appends rows to a markdown table inside STATE.md's "Performance Metrics" section. Each row tracks a plan execution's duration, task count, and file count.

**`cmdStateAddDecision` / `cmdStateAddBlocker` / `cmdStateResolveBlocker`** — Append/remove items from markdown list sections. All of them clean up placeholder text ("None yet", "No decisions yet") when adding the first real entry, and restore "None" when removing the last entry.

### 4.4 Status Normalization (lines 621–638)

`buildStateFrontmatter` normalizes free-text status strings into one of seven canonical values:

```
planning | discussing | executing | verifying | paused | completed | unknown
```

The normalization is substring-based: if the status contains "paused" or "stopped", it's `paused`. If it contains "verif" (matching both "verification" and "verifying"), it's `verifying`. This is intentionally loose — it handles whatever text agents or humans write.

**Edge case:** `pausedAt` field presence overrides text matching. If `Paused At` has a value, status is `paused` regardless of what the Status field says. This prevents an agent from clearing the paused status without also clearing the timestamp.

### 4.5 The Snapshot Command (lines 454–549)

`cmdStateSnapshot` is the "give me everything" command. It parses STATE.md into a structured JSON object with all fields, the decisions table (parsed from markdown table syntax), blockers list, and session info. This is what hooks and scripts use to get a machine-readable view of project state without doing their own regex parsing.

---

## 5. phase.cjs — The Heavy Lifter (901 lines)

### 5.1 Phase Plan Index (lines 201–309)

`cmdPhasePlanIndex` is the richest query in the system. For a given phase, it:
1. Finds the phase directory
2. Reads every PLAN.md file
3. Parses frontmatter for wave assignments, autonomous flags, files_modified
4. Counts tasks using two methods: XML `<task>` tags (canonical) or `## Task N` markdown (legacy)
5. Groups plans by execution wave
6. Identifies incomplete plans (PLANs without matching SUMMARYs)

**The wave system** is interesting. Each plan has an `execution_wave` in frontmatter. Plans in wave 1 run first (in parallel if `parallelization` is enabled). Wave 2 waits for wave 1 to complete. This gives the orchestrator a simple dependency mechanism without a full DAG.

**The autonomous flag** determines whether a plan can run without human checkpoints. Non-autonomous plans (`autonomous: false`) create checkpoint pauses during execution, requiring a fresh agent to resume.

### 5.2 Phase Add vs Insert (lines 311–446)

Two ways to create phases, with different numbering strategies:

**`cmdPhaseAdd`** — Appends a new integer phase. Scans ROADMAP.md for the highest existing phase number, adds 1. Creates the directory with `.gitkeep` (so git tracks the empty folder). Appends a template section to ROADMAP.md.

**`cmdPhaseInsert`** — Inserts a decimal phase after an existing one. If phase 6 exists, it creates 6.1 (or 6.2 if 6.1 exists). The `(INSERTED)` tag in the ROADMAP heading is a visual marker that this phase was added mid-stream. This is the escape hatch for unplanned work — you don't renumber everything, you just add a sub-phase.

### 5.3 Phase Remove — The Most Complex Operation (lines 448–699)

`cmdPhaseRemove` is 250 lines of careful cascading updates. Here's what it does:

1. **Validates:** Checks for executed work (SUMMARYs). Refuses to remove without `--force` if plans have been executed.
2. **Deletes** the target directory with `fs.rmSync({ recursive: true, force: true })`.
3. **Renumbers directories.** Two different strategies:
   - **Decimal removal:** Only renumbers sibling decimals. Removing `06.2` means `06.3` → `06.2`, `06.4` → `06.3`, etc.
   - **Integer removal:** Renumbers ALL subsequent phases. Removing phase 5 means phase 6 → 5, phase 7 → 6, etc. Also renumbers their letter suffixes and decimals.
4. **Renumbers files inside directories.** If a file is named `06-01-PLAN.md` and the directory renumbered from 06 to 05, the file becomes `05-01-PLAN.md`.
5. **Updates ROADMAP.md** — Removes the phase section, removes from checkbox lists, removes from progress tables, and renumbers all references in headings, checkboxes, plan references (`18-01` → `17-01`), table rows, and "Depends on" references.
6. **Updates STATE.md** — Decrements `Total Phases` counter.

**The renaming is done in descending order** to avoid conflicts. If you rename 6→5 before 7→6, directory 6 wouldn't exist yet. By going 7→6, 6→5, each rename targets a directory that definitely exists.

**Vulnerability:** The ROADMAP update uses a loop from 99 down to the removed phase, doing string replacements for each number. This means removing phase 5 triggers 94 regex replacements on the ROADMAP, most of which match nothing. It works, but it's O(n) where n is the arbitrary upper bound, not the actual phase count.

### 5.4 Phase Complete — The State Transition (lines 701–901)

`cmdPhaseComplete` is the "level up" command. After verification passes:

1. **Updates ROADMAP.md:**
   - Checks the phase's checkbox (`[ ]` → `[x]`)
   - Updates the progress table row (Status → "Complete", adds date)
   - Updates plan count string (`2/3 plans complete`)
   - Updates REQUIREMENTS.md traceability (marks related requirements as complete)

2. **Finds the next phase.** This is more nuanced than you'd expect:
   - First checks the filesystem for the next directory (by sort order)
   - **Falls back to ROADMAP.md** for phases that are defined but not yet scaffolded to disk
   - This prevents false "last phase" detection when phases exist in the plan but haven't been `plan-phase`'d yet

3. **Updates STATE.md:**
   - Advances `Current Phase` to the next one
   - Sets `Status` to "Ready to plan" (or "Milestone complete" if last phase)
   - Resets `Current Plan` to "Not started"
   - Records the transition in `Last Activity Description`

---

## 6. frontmatter.cjs — The Bespoke YAML Parser (299 lines)

### 6.1 Why Not Use a Library?

GSD ships zero dependencies. The frontmatter parser is a hand-rolled, stack-based YAML subset parser. It handles:
- Simple `key: value` pairs
- Inline arrays: `key: [a, b, c]`
- Block arrays: `key:\n  - item1\n  - item2`
- Nested objects (one level deep, sometimes two)
- Auto-conversion of empty objects to arrays when `- ` items are encountered

It does NOT handle: multi-line strings, anchors/aliases, type tags, flow mappings, or comments. This is enough for GSD's needs, where frontmatter is always machine-generated.

### 6.2 The Reconstruction Heuristic (lines 86–148)

`reconstructFrontmatter` makes formatting decisions:
- Arrays with ≤3 short items go inline: `tags: [auth, api, setup]`
- Longer arrays go block: `tags:\n  - item`
- Strings containing `:` or `#` get quoted: `summary: "Phase 1: Auth"`

This keeps the frontmatter readable when hand-inspecting files, while still being parseable by the same engine.

---

## 7. Cross-Cutting Observations

### 7.1 The Regex-as-Database Pattern

The entire state system is built on regex. Field reads use `new RegExp(\`\\*\\*${field}:\\*\\*\\s*(.+)\`)`. Section reads use `new RegExp(\`##\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##|$)\`)`. Table rows, checkbox lists, progress bars — all regex.

**Strengths:** No schema migrations, human-readable, git-diffable, works with any text editor.
**Weaknesses:** Fragile to formatting changes, no referential integrity, no transactions, no indexes. Adding a new field format means updating regex patterns in multiple functions.

### 7.2 The "Always Rebuild" Frontmatter Strategy

Every STATE.md write rebuilds the entire YAML frontmatter from the markdown body. This is expensive (it reads the filesystem to count phases and summaries) but guarantees consistency. It's a form of eventual consistency — the body is always the source of truth, and the frontmatter catches up on every write.

### 7.3 Missing: Any Form of Locking

There's no file locking anywhere. If two agents write STATE.md simultaneously, last-write-wins. The checkpoint protocol (pausing execution and spawning fresh agents) is the concurrency control mechanism — by design, only one agent should be writing state at a time.

### 7.4 The Ghost Definition

`stateExtractField` at line 12 is never called — the identical function at line 184 shadows it. The line 12 version uses `escapeRegex` from core.cjs; the line 184 version inlines the same escaping. Both work. One is dead code.

### 7.5 Error Philosophy

Errors are non-fatal by default. `safeReadFile` returns null, `execGit` returns an error object instead of throwing, `findPhaseInternal` returns null. This lets workflows degrade gracefully — a missing file doesn't crash the entire operation, it just means that piece of context is unavailable. The only hard errors come from `error()` which writes to stderr and exits 1, used for truly invalid states (missing required arguments, corrupt data).
