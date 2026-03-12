# Phase 6: Module 1 Mini-Project - Research

**Researched:** 2026-03-12
**Domain:** Mini-project lesson content, structural verification, progressive hints for markdown artifacts
**Confidence:** HIGH

## Summary

Phase 6 creates the capstone mini-project for Module 1 (GSD Commands & Workflows). The learner builds `/gsd:skeptic` -- a real command spec + workflow pair that critiques a GSD phase. This requires three new content files (lesson JSON, spec.json, hints.json) in the `learn/content/modules/gsd-commands/project/` directory, plus a concept map entry for the mini-project.

All infrastructure is already built: verifier.cjs handles tilde path expansion and regex-based structural checks, hints.cjs manages progressive hint delivery, feedback.cjs tracks events, renderer.cjs renders project content sections, and gsd-learn.cjs wires `--verify` and `--hint` flags to the correct module's project directory. The `--module` flag defaults to `gsd-commands`, so verification will automatically find `learn/content/modules/gsd-commands/project/spec.json`.

**Primary recommendation:** Create three content files following the exact patterns established by the command-lifecycle module's project directory. The spec.json must verify files at tilde-expanded paths (`~/.claude/commands/gsd/skeptic.md` and `~/.claude/get-shit-done/workflows/skeptic.md`) with regex checks covering ALL structural elements taught in Lessons 2-4.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Project task: build /gsd:skeptic -- a real command that critiques a current phase, plan, or milestone
- Two files at live install paths: `~/.claude/commands/gsd/skeptic.md` (command spec) and `~/.claude/get-shit-done/workflows/skeptic.md` (workflow)
- Base version requires a phase number argument
- Verification covers full anatomy from Lessons 2-4: command.md frontmatter (name, description, allowed-tools), all XML sections (objective, execution_context, context, process), @file references, workflow purpose section, workflow process section with steps
- Cross-file wiring check: command.md's execution_context @file reference points to the workflow.md path
- Final validation is MANUAL: learner runs /gsd:skeptic {phase} in Claude Code
- Bonus challenge: auto-detect current phase via STATE.md -- presented as inline "Going Further" section, no separate verification

### Claude's Discretion
- Hint strategy: 5 progressive hints for markdown-only artifacts (different from Module 2's Node.js hints)
- Lesson format: how Lesson 6 presents the task (ASCII diagram, paths, instructions layout)
- Exact wording of lesson instructions, hints, and bonus section
- Whether to include a cleanup mechanism for removing skeptic after the exercise
- Error messaging when verification fails
- Exact regex patterns for structural checks in spec.json

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MOD1-05 | Lesson 5 -- Mini-project: build a custom command.md + workflow.md pair, verified structurally | Lesson JSON (06-mini-project.json) with project content type, deliverables, verify/hint commands. Follows exact schema from command-lifecycle/lessons/06-mini-project.json |
| MOD1-07 | spec.json with markdown artifact checks for mini-project verification | Two artifacts (command spec + workflow) with regex checks at tilde-expanded paths. Pattern: `learn/content/modules/gsd-commands/project/spec.json` |
| MOD1-08 | hints.json with 5 progressive hints for mini-project | Array of 5 strings escalating from conceptual reframe to structural walkthrough. Pattern: `learn/content/modules/gsd-commands/project/hints.json` |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js test runner | built-in | Test framework | Already used across all learn/ tests |
| verifier.cjs | existing | Structural verification with tilde expansion | Phase 3 infrastructure, handles regex checks |
| hints.cjs | existing | Progressive hint delivery | Phase 3 infrastructure, tracks hints used |
| feedback.cjs | existing | Event tracking (verify attempts, hints, completion) | Phase 3 infrastructure |
| renderer.cjs | existing | Renders project content sections | Handles `type: "project"` sections |
| lessons.cjs | existing | Loads module lessons with validation | Validates required fields: id, title, lessonNumber, objective, content, conceptMap, successCriteria |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| gsd-learn.cjs | existing | CLI entry point for --verify and --hint | Wires to module's project/ directory via `--module` flag |

### Alternatives Considered
None -- all infrastructure exists; this phase is purely content creation.

## Architecture Patterns

### File Structure
```
learn/content/modules/gsd-commands/
  project/
    spec.json          # NEW: artifact verification spec
    hints.json         # NEW: 5 progressive hints
  lessons/
    06-mini-project.json  # NEW: mini-project lesson
  concept-map.txt      # UPDATE: add mini-project node
  module.json          # EXISTING: no changes needed
```

### Pattern 1: spec.json Artifact Definition
**What:** JSON with artifact array, each having path + checks (pattern + description)
**When to use:** Every mini-project verification
**Example:**
```json
{
  "id": "gsd-commands-project",
  "moduleId": "gsd-commands",
  "title": "Build /gsd:skeptic",
  "description": "Create a command spec + workflow pair that critiques a GSD phase",
  "artifacts": [
    {
      "description": "Skeptic command spec",
      "path": "~/.claude/commands/gsd/skeptic.md",
      "checks": [
        { "pattern": "---[\\s\\S]*?name:\\s*gsd:skeptic[\\s\\S]*?---", "description": "Has frontmatter with name: gsd:skeptic" },
        { "pattern": "description:", "description": "Has description field in frontmatter" },
        { "pattern": "allowed-tools:", "description": "Has allowed-tools field in frontmatter" },
        { "pattern": "<objective>[\\s\\S]*?</objective>", "description": "Has objective section" },
        { "pattern": "<execution_context>[\\s\\S]*?</execution_context>", "description": "Has execution_context section" },
        { "pattern": "@.*workflows/skeptic\\.md", "description": "execution_context references skeptic workflow" },
        { "pattern": "<context>[\\s\\S]*?</context>", "description": "Has context section" },
        { "pattern": "<process>[\\s\\S]*?</process>", "description": "Has process section" }
      ]
    },
    {
      "description": "Skeptic workflow",
      "path": "~/.claude/get-shit-done/workflows/skeptic.md",
      "checks": [
        { "pattern": "<purpose>[\\s\\S]*?</purpose>", "description": "Has purpose section" },
        { "pattern": "<process>[\\s\\S]*?</process>", "description": "Has process section with steps" }
      ]
    }
  ]
}
```

**Critical detail:** The verifier uses `new RegExp(c.pattern)` which does NOT have the `s` (dotAll) flag. Therefore `[\\s\\S]*?` must be used instead of `.*` for multiline matching. This is confirmed by examining verifier.cjs line 60: `pattern: new RegExp(c.pattern)`.

### Pattern 2: Cross-File Wiring Check
**What:** Regex in command spec checks that the @file reference in execution_context points to the workflow path
**Implementation:** The check `"@.*workflows/skeptic\\.md"` on the command spec artifact verifies that the execution_context section references the workflow file. This is not a true cross-file check (verifier.cjs checks each file independently), but it validates the wiring taught in Lesson 4.

### Pattern 3: Lesson JSON with Project Section
**What:** Lesson file with `type: "project"` content block
**Required fields per lesson:** id, title, lessonNumber, objective, content (with focus + bridge on each item), conceptMap, successCriteria
**Required fields per project section:** task, deliverables, verifyCommand, hintCommand, focus, bridge
**Example (from command-lifecycle):**
```json
{
  "type": "project",
  "task": "Build /gsd:skeptic ...",
  "deliverables": ["...", "..."],
  "verifyCommand": "node learn/bin/gsd-learn.cjs --verify",
  "hintCommand": "node learn/bin/gsd-learn.cjs --hint",
  "focus": "...",
  "bridge": "..."
}
```

### Pattern 4: Progressive Hints (Markdown-Focused)
**What:** 5 hints escalating from conceptual to step-by-step, focused on markdown structure rather than Node.js code
**Escalation pattern from existing hints.json:**
1. Conceptual reframe (think about the journey)
2. Point to relevant lesson (re-read Lesson X)
3. Point to directory/location (look at this path)
4. Name the structural elements needed (you need X, Y, Z)
5. Near-complete walkthrough (create file at path, include these sections)

### Anti-Patterns to Avoid
- **Testing exact content:** Verification must be structural (regex pattern matching), never exact content comparison. The learner's critique logic is their creative contribution.
- **Hardcoding absolute paths in spec.json:** Use tilde paths (`~/...`) so spec works across machines. verifier.cjs already handles tilde expansion.
- **Using `.` (dot) for multiline regex:** The RegExp constructor in verifier.cjs does NOT use the `s` flag. Always use `[\\s\\S]` for cross-line matching.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Path resolution | Custom tilde expansion | verifier.cjs `resolvePath()` | Already handles `~/` and `~\` (Windows) |
| Structural checks | Custom file parser | verifier.cjs `runVerification()` | Loads spec.json, resolves paths, runs regex checks |
| Hint delivery | Custom hint counter | hints.cjs `getNextHint()` + feedback.cjs event tracking | Already counts previous hint_requested events |
| Project UI | Custom renderer | renderer.cjs `renderContentSection()` for type "project" | Shows task, deliverables, verify/hint commands |
| Lesson loading | Custom loader | lessons.cjs `loadModule()` | Auto-discovers JSON files in lessons/ directory |

**Key insight:** All infrastructure exists from Phase 3 (v1.0 mini-project). This phase is purely content authoring -- no code changes needed.

## Common Pitfalls

### Pitfall 1: Missing focus/bridge on content items
**What goes wrong:** lessons.cjs validates that EVERY content item has `focus` (string) and `bridge` (string). Missing either causes a throw.
**Why it happens:** Project-type content sections also need focus + bridge, which is easy to forget.
**How to avoid:** Ensure all content items, including type "project", have both fields.
**Warning signs:** `loadModule()` throws "missing required field: focus" or "bridge"

### Pitfall 2: Regex patterns that don't match multiline
**What goes wrong:** Patterns like `<objective>.*</objective>` fail because `.` doesn't match newlines.
**Why it happens:** verifier.cjs uses `new RegExp(c.pattern)` without the `s` flag.
**How to avoid:** Use `[\\s\\S]*?` for any pattern that spans multiple lines.
**Warning signs:** Checks fail even on correctly structured files.

### Pitfall 3: Wrong lessonNumber
**What goes wrong:** Lesson displays wrong position indicator or sorts incorrectly.
**Why it happens:** gsd-commands module has 5 existing lessons (01-05). The mini-project must be lesson 6.
**How to avoid:** Set `"lessonNumber": 6` in the lesson JSON. File should be named `06-mini-project.json`.
**Warning signs:** Lessons appear out of order or "Lesson 6 of 6" shows wrong number.

### Pitfall 4: Concept map not updated
**What goes wrong:** Lesson references a conceptMap key that doesn't exist in concept-map.txt, or mini-project node is missing from the visual.
**Why it happens:** concept-map.txt needs a "mini-project" section entry.
**How to avoid:** Add a mini-project node at the bottom of the concept map chain. Also ensure module.json sectionMap includes the mini-project key if the concept map references it.
**Warning signs:** Concept map renders "No concept map available" or shows incomplete architecture.

### Pitfall 5: Verify command uses wrong module flag
**What goes wrong:** `--verify` checks command-lifecycle project instead of gsd-commands.
**Why it happens:** gsd-learn.cjs defaults `--module` to `gsd-commands` (line 43), so this actually works correctly for Module 1. But the verify/hint commands in the lesson JSON should NOT specify `--module` since the default is already correct.
**How to avoid:** Use `node learn/bin/gsd-learn.cjs --verify` (no --module flag needed).
**Warning signs:** Verification runs against wrong spec.json.

## Code Examples

### spec.json Structure (from command-lifecycle reference)
```json
// Source: learn/content/modules/command-lifecycle/project/spec.json
{
  "id": "command-lifecycle-project",
  "moduleId": "command-lifecycle",
  "title": "Build a GSD Echo Command",
  "artifacts": [
    {
      "description": "Echo handler module",
      "path": "get-shit-done/bin/lib/echo.cjs",
      "checks": [
        { "pattern": "module\\.exports", "description": "File exports a module" }
      ]
    }
  ]
}
```

### hints.json Structure (from command-lifecycle reference)
```json
// Source: learn/content/modules/command-lifecycle/project/hints.json
[
  "Think about the journey a command takes...",
  "Lesson 4 (Tool Modules) showed you exactly how...",
  "Look at get-shit-done/bin/lib/ -- each command domain...",
  "Your module needs to export a function that follows...",
  "Create lib/echo.cjs with a cmdEcho function..."
]
```

### Lesson JSON with Project Section (from command-lifecycle reference)
```json
// Source: learn/content/modules/command-lifecycle/lessons/06-mini-project.json
{
  "id": "mini-project",
  "title": "Mini-Project: Build a GSD Command",
  "lessonNumber": 6,
  "content": [
    { "type": "text", "value": "...", "focus": "...", "bridge": "..." },
    { "type": "project", "task": "...", "deliverables": ["..."],
      "verifyCommand": "node learn/bin/gsd-learn.cjs --verify",
      "hintCommand": "node learn/bin/gsd-learn.cjs --hint",
      "focus": "...", "bridge": "..." }
  ],
  "conceptMap": "mini-project",
  "successCriteria": "Running --verify shows all checks passing..."
}
```

### Verifier Regex Construction (critical detail)
```javascript
// Source: learn/lib/verifier.cjs, line 60
const checks = (artifact.checks || []).map(c => ({
  pattern: new RegExp(c.pattern),  // No flags! No 's' flag!
  description: c.description,
}));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Module 2 mini-project (echo command, Node.js) | Module 1 mini-project (skeptic, markdown-only) | v2.0 roadmap | Different artifact types: .md files at live install paths vs .cjs files in codebase |
| Relative paths in spec.json | Tilde paths for home directory | Phase 4 (INFRA-03) | verifier.cjs resolvePath() handles `~/` expansion |
| Single module (command-lifecycle) | Multi-module (gsd-commands is Module 1) | Phase 4 | gsd-learn.cjs defaults to `--module gsd-commands` |

## Structural Check Coverage

The following structural elements were taught in Lessons 2-4 and MUST be verified by spec.json:

### Command Spec (Lesson 2: Command Anatomy)
| Element | Regex Pattern | Lesson Reference |
|---------|--------------|------------------|
| YAML frontmatter | `---[\\s\\S]*?---` | "YAML frontmatter at the top" |
| name field | `name:\\s*gsd:skeptic` | "name field is the slash command identifier" |
| description field | `description:` | "description appears in help text" |
| allowed-tools field | `allowed-tools:` | "restricts which Claude Code tools this command can use" |
| objective section | `<objective>[\\s\\S]*?</objective>` | "the command's mission statement" |
| execution_context section | `<execution_context>[\\s\\S]*?</execution_context>` | "contains an @file reference" |
| @file reference to workflow | `@.*workflows/skeptic\\.md` | "the critical wiring between the two layers" |
| context section | `<context>[\\s\\S]*?</context>` | "passes runtime data to the command" |
| process section | `<process>[\\s\\S]*?</process>` | "high-level execution guidance" |

### Workflow (Lesson 3: Workflow Anatomy)
| Element | Regex Pattern | Lesson Reference |
|---------|--------------|------------------|
| purpose section | `<purpose>[\\s\\S]*?</purpose>` | "purpose section" |
| process section | `<process>[\\s\\S]*?</process>` | "process section with steps" |

### Cross-File Wiring (Lesson 4: Dispatch Chain)
| Element | Regex Pattern | Applied To |
|---------|--------------|------------|
| @file wiring | `@.*workflows/skeptic\\.md` | Command spec -- verifies dispatch chain concept |

## Concept Map Update

The existing concept-map.txt shows: Overview -> Command Spec -> Workflow -> Dispatch Chain -> Bridge. The mini-project node should be appended after Bridge (or before it, since Bridge is Lesson 5 and mini-project is Lesson 6). The module.json sectionMap needs a `"mini-project": "Mini-Project"` entry.

Current sectionMap:
```json
{
  "overview": "Overview",
  "command-spec": "Command Spec",
  "workflow": "Workflow",
  "dispatch": "Dispatch Chain",
  "bridge": "Bridge"
}
```

Needs: `"mini-project": "Mini-Project"` added.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner |
| Config file | none -- tests run directly |
| Quick run command | `node --test learn/tests/verifier.test.cjs learn/tests/hints.test.cjs learn/tests/lessons.test.cjs` |
| Full suite command | `node --test learn/tests/*.test.cjs` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MOD1-05 | Lesson 6 loads with valid schema (all required fields) | unit | `node --test learn/tests/lessons.test.cjs -x` | Yes (existing) |
| MOD1-07 | spec.json checks pass on well-formed skeptic files | unit | `node --test learn/tests/verifier.test.cjs -x` | Yes (existing) |
| MOD1-08 | hints.json has 5 entries, getNextHint works | unit | `node --test learn/tests/hints.test.cjs -x` | Yes (existing) |

### Sampling Rate
- **Per task commit:** `node --test learn/tests/lessons.test.cjs learn/tests/verifier.test.cjs learn/tests/hints.test.cjs`
- **Per wave merge:** `node --test learn/tests/*.test.cjs`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. The lessons.test.cjs will automatically validate the new lesson file when loadModule('gsd-commands') is called. The verifier.test.cjs validates the runVerification flow. The hints.test.cjs validates getNextHint logic.

## Open Questions

1. **Concept map visual for mini-project**
   - What we know: concept-map.txt uses ASCII art with boxes and arrows. Current chain ends at Bridge (Lesson 5).
   - What's unclear: Should mini-project appear after Bridge or replace the Bridge -> Node.js arrow since the learner now builds something before moving to Module 2?
   - Recommendation: Add mini-project as final node after Bridge. Keep it simple -- learner's focus is on building, not architecture visualization.

2. **Cleanup mechanism for skeptic command**
   - What we know: The learner creates real files at `~/.claude/commands/gsd/skeptic.md` and `~/.claude/get-shit-done/workflows/skeptic.md`.
   - What's unclear: Should the lesson suggest removing these files afterward, or encourage keeping the command?
   - Recommendation: Encourage keeping it -- the command is genuinely useful and can be refined over time (per CONTEXT.md: "refinable over time"). No cleanup mechanism needed.

## Sources

### Primary (HIGH confidence)
- `learn/content/modules/command-lifecycle/project/spec.json` -- reference spec.json structure
- `learn/content/modules/command-lifecycle/project/hints.json` -- reference hints escalation pattern
- `learn/content/modules/command-lifecycle/lessons/06-mini-project.json` -- reference mini-project lesson schema
- `learn/lib/verifier.cjs` -- verification engine: tilde expansion, regex matching, no `s` flag
- `learn/lib/hints.cjs` -- hint delivery logic
- `learn/lib/lessons.cjs` -- lesson loading with required field validation (focus + bridge per content item)
- `learn/lib/renderer.cjs` -- project section rendering (task, deliverables, verifyCommand, hintCommand)
- `learn/bin/gsd-learn.cjs` -- CLI wiring: --verify, --hint, --module defaults to gsd-commands
- `learn/content/modules/gsd-commands/lessons/02-command-anatomy.json` -- structural elements taught
- `learn/content/modules/gsd-commands/lessons/03-workflow-anatomy.json` -- workflow elements taught
- `learn/content/modules/gsd-commands/lessons/04-dispatch-chain.json` -- cross-file wiring taught

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all infrastructure exists, verified by reading source
- Architecture: HIGH -- exact file patterns confirmed from command-lifecycle reference implementation
- Pitfalls: HIGH -- verified regex behavior, field validation, and path resolution by reading source code

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable -- no external dependencies, all internal code)
