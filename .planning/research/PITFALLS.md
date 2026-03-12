# Domain Pitfalls

**Domain:** Interactive CLI learning tool (source-parsing-based, teaching a Node.js codebase)
**Researched:** 2026-03-11

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Brittle Source Parsing That Breaks on Refactors

**What goes wrong:** The parser couples tightly to specific source file structures (function names, comment formats, file paths, export patterns). When GSD's source changes -- renamed files, restructured modules, new patterns -- lessons silently produce wrong content or crash entirely. This is the single highest-risk pitfall because the core value proposition ("lessons auto-update when source changes") becomes a liability.

**Why it happens:** It is tempting to write regex-based or line-number-based parsers that extract "the function starting at line 42" or "the module.exports block." These are fast to build but assume structural stability that CommonJS files do not guarantee.

**Consequences:**
- Lessons display stale or incorrect code snippets after any source refactor
- Silent content corruption (worse than a crash -- learner reads wrong information)
- Maintenance burden grows with every source change, defeating the purpose of auto-generation
- Loss of trust in the tool if content is visibly wrong even once

**Warning signs:**
- Parser tests break when unrelated source changes land
- Hardcoded file paths or line ranges in lesson definitions
- No integration test that verifies lesson output against current source
- Parser relies on comments or formatting conventions that are not enforced by linting

**Prevention:**
- Parse using AST (Node.js built-in `require('module')` or `vm` module for CommonJS; `acorn` if zero-dep constraint allows vendoring a small parser) rather than regex/string matching
- If AST parsing violates zero-dependency constraint, build a lightweight structural parser that finds exports, function declarations, and call sites by token patterns rather than exact string matches
- Use semantic anchors (exported function names, module.exports keys) rather than positional anchors (line numbers, nth occurrence)
- Create a "source contract" test suite: a set of assertions about what the parser expects to find in GSD source files, run as part of GSD's own test suite so refactors that break lesson generation are caught immediately
- Design parser output as an intermediate representation (IR) that lessons consume, so parser changes do not cascade into lesson template changes

**Detection:** Run lesson generation in CI. If output changes unexpectedly, flag it.

**Phase relevance:** Must be addressed in the very first phase (parser/source analysis foundation). Getting this wrong means rebuilding the entire content pipeline later.

---

### Pitfall 2: Over-Engineering Lesson Content Generation Before Validating the Teaching Approach

**What goes wrong:** Significant effort goes into building a sophisticated source parser, content templating system, and progress tracker -- only to discover that the generated lessons do not actually teach effectively. The auto-generated content is technically accurate but pedagogically useless (too dense, wrong ordering, missing conceptual bridges).

**Why it happens:** Engineering the "how" (parsing, templating, tracking) is more comfortable than validating the "what" (does this sequence of information actually build understanding?). The MVP scope says "Command Lifecycle via /gsd:quick" but there is a risk of building the full pipeline before testing whether one hand-crafted lesson for that flow even works.

**Consequences:**
- Weeks of parser/template engineering wasted if the lesson design is fundamentally wrong
- Sunk cost pressure to keep a bad teaching approach because "we already built the infrastructure"
- The feedback loop (mini-project results measure lesson quality) never fires because you never ship a lesson

**Warning signs:**
- More than 2 weeks building infrastructure before a single lesson is testable end-to-end
- No hand-written lesson prototype exists to validate the pedagogical approach
- "Content auto-generation" is the first thing built rather than the last
- Mini-project design is deferred as "we will figure that out later"

**Prevention:**
- Start with a semi-manual MVP: hand-write the Command Lifecycle lesson content, wire up minimal CLI navigation and progress tracking, and test whether the lesson actually teaches. THEN automate content generation for subsequent modules.
- Build the source parser to support the hand-written lesson (extract specific code blocks the lesson references) rather than to generate the lesson wholesale
- Ship the MVP module to a real test (even if the learner is you) before building module 2 infrastructure
- Define "lesson quality measurement" concretely before building lessons: what does the mini-project test? What score/outcome means the lesson worked?

**Detection:** If you cannot describe what a learner should be able to do after completing the MVP module, the teaching approach is not validated.

**Phase relevance:** Phase 1 must produce a testable lesson, not just infrastructure. The feedback loop must fire in Phase 1.

---

### Pitfall 3: Progress Tracking State Corruption and Migration Hell

**What goes wrong:** Progress state (which lessons completed, which mini-projects passed, where the learner left off) gets corrupted, lost, or becomes incompatible with updated lesson structures. When lesson content changes (because GSD source changed), existing progress records may reference lessons that no longer exist or have different structures.

**Why it happens:** Progress tracking seems simple ("just save a JSON file") but the relationship between progress records and lesson identity is tricky. If lessons are generated from source, and source changes, lesson identity is unstable. Lesson 3 today might cover different content than Lesson 3 yesterday.

**Consequences:**
- Learner loses progress after a GSD update
- "Resume where you left off" sends learner to wrong place
- Progress percentage becomes meaningless (completed 5/10 lessons, but 3 of those no longer exist)
- Frustration drives learner to abandon the tool

**Warning signs:**
- Progress file references lessons by index/position rather than by stable identifier
- No migration strategy for when lesson structure changes
- Progress file format is undocumented
- No test for "load progress from previous version"

**Prevention:**
- Give each lesson a stable content-addressable or semantic identifier (e.g., `command-lifecycle.phase-dispatch` not `module-1.lesson-3`)
- Store progress with enough context to detect staleness (hash of lesson content at completion time, or a version field)
- When lesson content changes, mark affected progress as "needs review" rather than silently invalidating
- Keep progress schema minimal and forward-compatible (flat key-value, not deeply nested)
- Store progress in `.planning/` alongside other GSD state, using the same conventions (YAML frontmatter in a markdown file, matching GSD's own state patterns)

**Detection:** Manually change a source file that affects lesson content, then check if progress tracking still behaves correctly.

**Phase relevance:** Address in the phase that implements progress tracking. Design the identifier scheme when designing the lesson data model, not after.

---

### Pitfall 4: Terminal UI Complexity Trap

**What goes wrong:** Building a rich interactive terminal experience (syntax highlighting, scrollable panes, interactive menus, animated transitions) consumes enormous effort and introduces fragile dependencies on terminal capabilities that vary across environments. The tool ends up fighting terminal rendering instead of teaching.

**Why it happens:** CLI learning tools like `rustlings` or `exercism` have polished UIs that feel natural. Replicating that polish from scratch requires deep understanding of ANSI escape codes, terminal dimensions, stdin raw mode, and cross-platform terminal behavior (Windows Terminal vs. CMD vs. WSL vs. macOS Terminal vs. iTerm2). GSD's zero-dependency constraint means no `ink`, `blessed`, or `inquirer`.

**Consequences:**
- Windows Terminal renders differently than expected (GSD runs on Windows per the project env)
- Raw mode stdin handling breaks on certain terminal emulators
- Weeks spent on "make the menu look right" instead of "make the lesson teach well"
- Accessibility issues (screen readers, high contrast mode, narrow terminals)

**Warning signs:**
- Using ANSI escape codes for anything beyond basic coloring
- Building a custom scrollable text view
- Spending more than a day on "how to clear the screen and redraw"
- Testing only in one terminal emulator

**Prevention:**
- Use the simplest possible UI: paginated text output (press Enter for next page), numbered menu choices, clear/simple prompts. Think `man` pages, not `vim`.
- Limit ANSI usage to bold, color (with `NO_COLOR` env var support), and clear screen. No cursor positioning, no alternate screen buffer.
- Test on Windows Terminal (primary, given GSD's environment) and at least one Unix terminal from the start
- If richer UI is needed later, add it as a separate enhancement phase after the teaching approach is validated
- Accept that the terminal is a text medium. Long code blocks should be displayed with file path references so the learner can open them in their editor.

**Detection:** If the terminal rendering code is longer than the lesson content code, priorities are inverted.

**Phase relevance:** Set UI constraints in Phase 1 and do not revisit until post-MVP. The MVP should look boring but teach well.

---

### Pitfall 5: Source-to-Lesson Mapping Assumes Linear Code

**What goes wrong:** GSD's architecture is not linear. The Command Lifecycle (/gsd:quick) spans: command definition (commands/gsd/quick.md) -> workflow orchestration (workflows/quick.md or similar) -> tool dispatch (gsd-tools.cjs) -> state management (lib/state.cjs) -> agent spawning (agents/*.md) -> phase operations (lib/phase.cjs). A lesson that tries to present this as "step 1, step 2, step 3" either oversimplifies (losing the real architecture) or overwhelms (too many files at once).

**Why it happens:** Lesson designers think in linear narratives. Codebases are graphs. The tension between "follow the data flow" and "introduce one concept at a time" is hard to resolve, especially when auto-generating content from source files that were not written with pedagogical ordering in mind.

**Consequences:**
- Learner gets lost jumping between 8+ files in a single lesson
- Lesson presents code without enough context ("here is phase.cjs line 200, which is called from... somewhere")
- Learner memorizes the tour but cannot independently navigate the codebase
- Lesson structure fights the codebase structure, making auto-generation harder

**Warning signs:**
- A single lesson references more than 4-5 source files
- Lesson content requires "we will explain this later" forward references
- The lesson order does not match any natural reading order of the code
- Learner feedback (or mini-project results) shows they cannot find things independently

**Prevention:**
- Design lessons around "zoom levels": Module overview (architecture diagram, which files exist and why) -> Component deep-dive (one file/module at a time, its API and purpose) -> Flow trace (follow data through components you already understand individually)
- Each lesson should have ONE focal file with supporting references to previously-learned files
- The Command Lifecycle module should start with the entry point (gsd-tools.cjs dispatch) and expand outward, not try to cover the full flow in one lesson
- Include "navigator exercises" early: "Find the function that does X" -- building the skill of independent code navigation before trying to teach implementation details
- Let the mini-project test navigation ability, not recall of specific code locations

**Detection:** If a lesson outline has more than 3 source file references that the learner has not seen before, it needs restructuring.

**Phase relevance:** This is a lesson design concern that must be addressed when designing the module structure (likely Phase 1 or 2), before building content generation tooling.

## Moderate Pitfalls

### Pitfall 6: Mini-Project Validation That Is Too Rigid or Too Loose

**What goes wrong:** Mini-projects are the primary validation mechanism (no quizzes), but designing good validation is hard. Too rigid: "your output must match this exact string" -- fragile and does not test understanding. Too loose: "do something with GSD" -- no signal about whether learning happened.

**Prevention:**
- Define mini-projects as "achieve this outcome" not "produce this output." Example: "Create a new GSD command that lists all phases with their status" -- validate that the command exists, runs without error, and produces phase-related output. Do not validate exact formatting.
- Use structural checks: file exists, exports a function, function runs without throwing, output contains expected keywords/patterns
- Provide a rubric with the mini-project so the learner knows what "done" looks like before starting
- Keep mini-projects small (15-30 minutes). If they take longer, the lesson did not teach enough.

**Warning signs:**
- Mini-project validation uses string equality checks
- No mini-project prototype exists before the validation code is written
- Mini-projects require knowledge not covered in the lesson

**Phase relevance:** Design mini-project validation framework alongside the first module, not after.

---

### Pitfall 7: Ignoring the "Lesson Content Auto-Updates" Requirement Until Too Late

**What goes wrong:** The requirement that "lesson content auto-updates when GSD source changes" is treated as a nice-to-have enhancement. Content is hand-written or semi-generated with manual curation steps. When GSD source changes, lessons drift and nobody notices until they are visibly wrong.

**Prevention:**
- Design the content pipeline with auto-update as a first-class constraint from the start, even if early lessons are partly hand-written
- Every lesson should declare its source dependencies explicitly (which files/functions it references)
- Build a staleness detector: hash the source dependencies at lesson generation time, check hashes before displaying a lesson, warn if stale
- Accept that some lesson content (conceptual explanations, pedagogical framing) will be hand-written and will NOT auto-update. Clearly separate "source-derived content" from "authored content" in the lesson data model.

**Warning signs:**
- Lesson files contain inline code snippets copy-pasted from source
- No mechanism to detect when a lesson's source dependencies change
- "Auto-update" is a phase 4 feature

**Phase relevance:** The staleness detection mechanism should exist by Phase 2 at latest, even if full auto-regeneration comes later.

---

### Pitfall 8: CommonJS Parsing Complexity Underestimation

**What goes wrong:** GSD uses CommonJS (`module.exports`, `require()`), not ESM. CommonJS is harder to statically analyze because exports can be dynamic (`module.exports[key] = value` in a loop), conditional (`if (condition) module.exports.x = ...`), or computed. Standard AST tools are designed for ESM or TypeScript and handle CommonJS as a second-class citizen.

**Prevention:**
- Survey GSD's actual export patterns before designing the parser. GSD appears to use straightforward `module.exports = { fn1, fn2 }` patterns -- if so, a simple parser suffices
- Do not try to build a general-purpose CommonJS analyzer. Build a parser that handles GSD's specific patterns and fails loudly on patterns it does not recognize
- Add a "parser coverage" metric: what percentage of GSD's exports/functions does the parser successfully identify? Track this and alert on regression.
- If using Node.js `require()` to load modules for analysis, be aware of side effects -- some modules may execute code on load

**Warning signs:**
- Parser works on simple test files but fails on actual GSD source
- Parser silently skips functions it cannot parse (no error, just missing content)
- Parser tries to handle every possible CommonJS pattern

**Phase relevance:** Address in Phase 1 when building the source analysis layer. Start with a pattern survey of GSD's actual code.

---

### Pitfall 9: Overscoping Beyond Single-User, Single-Codebase

**What goes wrong:** The design starts accommodating "what if we want to teach other codebases later?" or "what if multiple learners use this?" These hypothetical requirements add abstraction layers (plugin systems, user databases, generic codebase adapters) that slow down the MVP without delivering value.

**Prevention:**
- Hardcode GSD-specific paths, patterns, and module names. This tool teaches GSD. Period.
- No abstraction layers for "other codebases." If that need arises later, refactor then.
- No user authentication, no multi-user progress, no server component
- The constraint from PROJECT.md is explicit: single learner, GSD only. Treat scope creep as a bug.

**Warning signs:**
- Config files for "which codebase to teach"
- Abstract base classes for "LessonProvider" or "CodebaseAdapter"
- Database for progress tracking instead of a flat file
- Discussion of "extensibility" before MVP ships

**Phase relevance:** Every phase. Scope creep is a continuous threat.

## Minor Pitfalls

### Pitfall 10: Lesson Navigation UX Friction

**What goes wrong:** Small UX issues compound: no way to jump to a specific lesson, no "where am I?" indicator, confusing back/forward navigation, unclear distinction between "lesson content" and "exercise instructions."

**Prevention:**
- Implement a simple table of contents command (`gsd-learn list`) showing all lessons with completion status
- Show current position at the top of every lesson ("Module 1: Command Lifecycle -- Lesson 3 of 7")
- Allow direct navigation (`gsd-learn go 1.3`) from the start
- Clearly separate reading content from action items (use visual markers like `[DO]` or `[READ]`)

**Phase relevance:** Build basic navigation in Phase 1. Polish in later phases.

---

### Pitfall 11: Not Dogfooding Early Enough

**What goes wrong:** The tool is built to completion before anyone actually tries to learn from it. Issues that are obvious in 5 minutes of real use (confusing ordering, too much text per screen, unclear what to do next) are discovered after the architecture is set.

**Prevention:**
- Use the tool yourself to learn a part of GSD you are less familiar with, as soon as the first lesson is functional
- Keep a running list of friction points during dogfooding
- Treat your own learning experience as the primary test, not unit tests

**Warning signs:**
- No one has completed a full lesson flow end-to-end
- "We will dogfood after Phase 3"

**Phase relevance:** Phase 1 must end with a dogfooding session.

---

### Pitfall 12: Markdown-in-Terminal Rendering Edge Cases

**What goes wrong:** GSD's source files are heavily markdown-based (workflows, agents, commands are all `.md` files). Displaying markdown content in a terminal without a renderer produces raw syntax. Rendering markdown in a terminal introduces its own set of problems (tables, nested lists, code blocks inside blockquotes).

**Prevention:**
- Strip markdown formatting to plain text for terminal display rather than trying to render it faithfully
- For code blocks, preserve them as-is (they are already terminal-friendly)
- For markdown structural elements (headers, lists, tables), convert to simple indented text
- Do not pull in a markdown rendering library. Simple regex-based stripping of `#`, `*`, `|` delimiters is sufficient for display purposes.

**Warning signs:**
- Raw `###` headers showing up in lesson output
- Tables rendered as unaligned pipe-separated text
- Attempting to render markdown tables with box-drawing characters

**Phase relevance:** Address when building the lesson display component, likely Phase 1 or 2.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Source parser/analyzer | Brittle parsing (Pitfall 1), CommonJS complexity (Pitfall 8) | Survey GSD export patterns first; use semantic anchors; build source contract tests |
| Lesson content design | Linear code assumption (Pitfall 5), over-engineering before validating (Pitfall 2) | Start with hand-written prototype; use zoom-level lesson structure |
| Progress tracking | State corruption (Pitfall 3) | Stable semantic IDs; content hashing; staleness detection |
| Terminal UI | Complexity trap (Pitfall 4), markdown rendering (Pitfall 12) | Keep it boring; paginated text; test on Windows Terminal |
| Mini-projects | Too rigid/too loose validation (Pitfall 6) | Structural checks over exact matching; define rubrics upfront |
| Auto-update pipeline | Deferred too long (Pitfall 7) | Build staleness detection early; separate source-derived from authored content |
| All phases | Scope creep (Pitfall 9), not dogfooding (Pitfall 11) | Hardcode GSD specifics; dogfood after every phase |

## Sources

- GSD codebase analysis: `.planning/codebase/STRUCTURE.md`, `.planning/codebase/ARCHITECTURE.md`
- PROJECT.md requirements and constraints
- Domain knowledge: patterns from exercism, rustlings, and similar CLI learning tools (training data, MEDIUM confidence)
- CommonJS parsing challenges are well-documented in the Node.js ecosystem (training data, HIGH confidence for the general claim)

---

*Pitfalls analysis: 2026-03-11*
