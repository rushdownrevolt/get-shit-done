# Project Research Summary

**Project:** GSD Learn
**Domain:** Interactive CLI learning tool (codebase-specific, terminal-native)
**Researched:** 2026-03-11
**Confidence:** MEDIUM-HIGH

## Executive Summary

GSD Learn is an interactive terminal-based tool that teaches contributors the GSD codebase through source-parsed lessons and validated mini-projects. The dominant pattern in this space (rustlings, exercism, NodeSchool workshoppers) is linear lesson progression with automated verification, but GSD Learn's core innovation is auto-generating lesson content directly from source code so it never drifts from reality. The recommended approach uses zero runtime dependencies -- exclusively Node.js 18+ built-ins (readline, fs, ANSI escape codes, node:test) -- matching GSD's own philosophy and existing patterns.

The architecture is a five-component pipeline: Source Parser extracts structure from GSD's CommonJS/markdown files, Content Generator transforms parsed data into lesson objects via template interpolation, Lesson Renderer presents content interactively, Progress Tracker persists state as JSON, and Mini-Project Runner validates learning through structural checks on real GSD artifacts. All components use patterns already proven in GSD's own codebase. The build order follows data flow dependencies, with standalone components (CLI entry, progress tracker, source parser) built first, then the content pipeline, then the interactive experience, and finally the validation layer.

The highest risk is building sophisticated infrastructure before validating that the teaching approach actually works. The source parser's regex-based extraction could break on refactors (Pitfall 1), and lessons that try to present GSD's graph-structured codebase as linear steps will overwhelm learners (Pitfall 5). The mitigation is clear: start with a semi-manual MVP -- hand-write the first module's lesson content, wire up minimal navigation and progress, test whether it teaches effectively, THEN automate content generation. Dogfood after Phase 1, not Phase 3.

## Key Findings

### Recommended Stack

Zero runtime dependencies. Everything uses Node.js built-ins, matching GSD's existing patterns. The only opinionated decision is raising the Node floor to 18+ (from GSD's 16.7.0) to get `readline/promises` and stable `node:test`. This is acceptable because GSD Learn is an internal dev tool, not a published package.

**Core technologies:**
- **Node.js >= 18 (CommonJS):** Runtime -- unlocks readline/promises and stable node:test while staying on GSD's module format
- **readline + ANSI escape codes:** Terminal UI -- GSD already uses these in install.js; no framework needed for paginated text with navigation
- **Regex-based source parsing:** Content extraction -- GSD's consistent CommonJS conventions make regex reliable for structural extraction (function names, exports, requires, JSDoc)
- **JSON file persistence:** Progress tracking -- matches GSD's existing .planning/ state management pattern exactly
- **node:test + node:assert:** Testing -- identical to GSD's existing test setup, zero additional dependencies

**Critical version note:** Node 18 is the floor. Do NOT require Node 21+ for util.styleText.

### Expected Features

**Must have (table stakes):**
- Lesson progression with clear instructions and position indicator
- Progress persistence across sessions (JSON file)
- Readable terminal output (ANSI colors, code blocks, spacing)
- Source code display in context (the core interaction -- showing relevant GSD code inline)
- Run/verify command for mini-project completion
- Help/hint system (at minimum, inline hints in lesson text)
- Graceful error handling with helpful messages

**Should have (differentiators):**
- Auto-generated lessons from source (the core innovation -- validates the thesis)
- Mini-project validation via structural checks (proves capability, not recall)
- Concept map / "you are here" architecture visualization
- Contextual "why" explanations pulled from comments/annotations

**Defer (v2+):**
- Watch mode for exercises (manual verify works initially)
- Lesson quality feedback dashboard (collect data in MVP, analyze later)
- Content auto-update on source change (MVP can require manual regeneration)
- Progressive hint command (inline hints suffice for MVP)

**Anti-features (do NOT build):** Multiple choice quizzes, web UI, multi-user support, gamification (points/badges/streaks), AI tutoring, plugin system, timed challenges.

### Architecture Approach

Pipeline architecture with unidirectional data flow. Five components with clear boundaries, each independently testable. Content is generated lazily (on-demand per lesson, not pre-built) to ensure freshness. Narrative templates are separated from source code injection -- templates provide stable pedagogical framing while `{{source:path:symbol}}` interpolation injects current code at render time.

**Major components:**
1. **CLI Entry** (gsd-learn.cjs) -- command parsing and dispatch; minimal args (--module, --reset, --status)
2. **Source Parser** (parser/*.cjs) -- regex extraction of function signatures, exports, requires, JSDoc, workflow steps from GSD source
3. **Content Generator** (content/*.cjs) -- transforms parsed data into lesson objects using module definition JSON files and narrative markdown templates
4. **Lesson Renderer** (renderer/*.cjs) -- paginated terminal display with ANSI formatting, navigation (next/prev/toc/quit), stateless design
5. **Progress Tracker** (progress/*.cjs) -- JSON file read/write, stable lesson IDs, completion timestamps
6. **Mini-Project Runner** (projects/*.cjs) -- scaffolding, structural validation (file exists, exports function, runs without error), self-assessment feedback

### Critical Pitfalls

1. **Brittle source parsing that breaks on refactors** -- Use semantic anchors (exported function names) not positional anchors (line numbers). Build "source contract" tests that run in CI. Design parser output as an intermediate representation.
2. **Over-engineering before validating the teaching approach** -- Start with hand-written lesson content for MVP module. Build parser to support hand-written lessons, not to generate lessons wholesale. Dogfood immediately.
3. **Progress state corruption on lesson changes** -- Use stable semantic IDs (command-lifecycle.phase-dispatch, not module-1.lesson-3). Store content hashes. Mark affected progress as "needs review" rather than silently invalidating.
4. **Terminal UI complexity trap** -- Keep it boring: paginated text, Enter to continue, numbered menus. No cursor positioning, no alternate screen buffer. Test on Windows Terminal from day one.
5. **Linear lesson design for graph-structured code** -- Use "zoom levels": architecture overview first, then single-component deep-dives, then cross-component flow traces. Each lesson has ONE focal file.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and Pedagogical Validation

**Rationale:** The architecture research and pitfalls research both converge on the same conclusion: build the skeleton and validate the teaching approach before investing in automation. CLI Entry and Progress Tracker are leaf nodes with no upstream dependencies. A hand-written first lesson proves the concept cheaply.
**Delivers:** Working CLI shell (gsd-learn command), progress persistence, terminal rendering utilities, and ONE hand-written lesson for Command Lifecycle entry point -- testable end-to-end.
**Addresses:** Lesson progression, progress persistence, readable terminal output, clear instructions, graceful error handling.
**Avoids:** Over-engineering before validation (Pitfall 2), terminal UI complexity trap (Pitfall 4), scope creep (Pitfall 9).
**Must end with:** A dogfooding session where someone completes the hand-written lesson. If the teaching approach does not work, pivot before building more infrastructure.

### Phase 2: Source Parser and Content Pipeline

**Rationale:** Source Parser is the riskiest component (regex vs. real GSD source). Build it early so failures surface before downstream work depends on it. Content Generator defines the lesson object shape consumed by the renderer -- its interface must stabilize here.
**Delivers:** Working source parser that extracts structures from GSD's CommonJS modules and markdown files. Content generator with template interpolation. Staleness detection (hash-based). Multiple lessons for the Command Lifecycle module generated from source.
**Addresses:** Auto-generated lessons from source (the core differentiator), source code display in context.
**Avoids:** Brittle parsing (Pitfall 1), CommonJS complexity (Pitfall 8), deferred auto-update (Pitfall 7).
**Key risk:** Regex parsing may not handle all of GSD's export patterns. Survey actual patterns first. Build parser coverage metrics.

### Phase 3: Mini-Project Validation and First Complete Module

**Rationale:** Mini-Project Runner is the last-mile validation and only makes sense when the full content pipeline exists. The first complete module (Command Lifecycle) serves as the end-to-end integration test.
**Delivers:** Mini-project scaffolding and structural validation. Complete Command Lifecycle module with all lessons and a capstone project. Feedback collection (time to complete, hint usage, self-assessment rating).
**Addresses:** Run/verify command, mini-project validation, help/hint system, lesson quality feedback loop (data collection).
**Avoids:** Too rigid/too loose validation (Pitfall 6), linear code assumption (Pitfall 5).

### Phase 4: Polish and Second Module

**Rationale:** With one validated module, the pattern is proven. Polish the experience and build a second module to confirm the content pipeline generalizes.
**Delivers:** Navigation improvements (table of contents, direct lesson jump), concept map visualization, a second learning module (e.g., Agent System or State Management), watch mode for exercises.
**Addresses:** Watch mode, concept map visualization, contextual "why" explanations.
**Avoids:** Not dogfooding (Pitfall 11) -- each module ships to a real user.

### Phase Ordering Rationale

- **Dependencies drive order:** CLI Entry and Progress Tracker have no upstream dependencies (Phase 1). Source Parser must exist before Content Generator. Renderer needs Generator's output format finalized. Mini-Project Runner needs all other components.
- **Risk drives priority:** Source Parser is the highest-risk component -- building it in Phase 2 (not Phase 3 or 4) means failures surface early enough to pivot.
- **Validation before automation:** Hand-written lessons in Phase 1 prove the teaching model works before Phase 2 automates content generation. This directly prevents Pitfall 2 (the most costly mistake).
- **Scope discipline:** Each phase produces a usable artifact. No phase is pure infrastructure.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Source Parser):** Needs concrete survey of GSD's actual CommonJS export patterns, markdown file structures, and workflow step formats before parser design is finalized. Run `/gsd:research-phase` here.
- **Phase 3 (Mini-Project):** Mini-project validation design is novel (no exact precedent in the reference tools). Needs prototyping. Run `/gsd:research-phase` here.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Uses patterns already in GSD's codebase (readline, ANSI, JSON persistence). Well-understood.
- **Phase 4 (Polish):** Enhancement work on established foundation. Standard CLI UX improvements.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero-dependency constraint eliminates choice paralysis. All recommended technologies are GSD's existing stack. Node 18 floor is the only opinionated call. |
| Features | MEDIUM | Reference tools (rustlings, exercism, workshoppers) are well-established but observations are from training data (pre-May 2025). Feature prioritization is sound. |
| Architecture | HIGH | Pipeline architecture follows directly from the data flow. Component boundaries map cleanly to GSD's own patterns. Build order is dependency-driven. |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls (brittle parsing, premature engineering) are well-documented across CLI tutorial ecosystems. GSD-specific pitfalls (CommonJS parsing, markdown rendering) are inferred from codebase analysis. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **GSD export pattern survey:** Before Phase 2, catalog every CommonJS export pattern in GSD source. The parser design depends on knowing what patterns it must handle. This is a 1-2 hour audit, not a research project.
- **Mini-project design prototyping:** No existing tool validates learning through structural checks on generated artifacts. The validation logic for "did the learner create a working GSD command" needs prototyping before Phase 3 planning is finalized.
- **Windows Terminal rendering verification:** GSD's primary environment is Windows. ANSI escape code behavior in Windows Terminal, PowerShell, and CMD should be tested early (Phase 1).
- **Node 18 adoption check:** Verify that GSD contributors are on Node 18+. If some are on Node 16, the learn tool needs a clear version gate with a helpful error message.

## Sources

### Primary (HIGH confidence)
- GSD `package.json` -- zero production dependencies, engine requirement
- GSD `bin/install.js` -- existing readline and ANSI color patterns
- GSD `.planning/codebase/ARCHITECTURE.md` -- system architecture
- GSD `.planning/codebase/CONVENTIONS.md` -- code style contract enabling regex parsing
- GSD `.planning/codebase/STACK.md` -- built-in module usage
- GSD `.planning/PROJECT.md` -- requirements and constraints

### Secondary (MEDIUM confidence)
- Rustlings, Exercism, NodeSchool workshoppers, CodeCrafters, Tour of Go -- feature patterns and pitfalls (training data, pre-May 2025)
- Node.js documentation for readline, readline/promises, node:test -- API availability boundaries
- CommonJS static analysis challenges -- well-documented in Node.js ecosystem

---
*Research completed: 2026-03-11*
*Ready for roadmap: yes*
