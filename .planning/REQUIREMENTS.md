# Requirements: GSD Learn

**Defined:** 2026-03-11
**Core Value:** The learner can confidently modify and extend GSD for their own needs, validated by their ability to achieve creative results with GSD commands.

## v1 Requirements

### Display

- [x] **DISP-01**: Terminal output uses ANSI formatting for colors, spacing, and code blocks
- [x] **DISP-02**: Relevant GSD source code is displayed inline within lessons with line highlighting
- [x] **DISP-03**: Current position indicator shows "Lesson N of M" and module progress

### Content

- [x] **CONT-01**: Each lesson has clear instructions: what you'll learn, what to do, what success looks like
- [x] **CONT-02**: Lessons are numbered and ordered within modules with defined progression
- [x] **CONT-03**: Lesson content is generated via prompts that use parsed GSD source files as input (source goes into prompts, prompts produce lesson content)
- [x] **CONT-04**: Lessons include contextual "why" explanations covering design decisions and rationale, not just code
- [x] **CONT-05**: An evaluation rubric scores prompt-generated lessons on accuracy, clarity, depth, and pedagogical quality -- used to iterate prompts until output is good enough

### Progress

- [x] **PROG-01**: Learning progress persists across terminal sessions via local JSON storage
- [x] **PROG-02**: Graceful error handling with helpful messages for common mistakes (wrong directory, missing files, etc.)
- [x] **PROG-03**: ASCII concept map shows where current lesson fits in overall GSD architecture ("you are HERE")

### Validation

- [x] **VALD-01**: User can run a verify command to check if mini-project is complete
- [x] **VALD-02**: Mini-project validation checks structural use of GSD (did they produce a result), not exact code match
- [x] **VALD-03**: Progressive hint system provides nudges when learner is stuck without giving answers
- [x] **VALD-04**: Quality feedback loop tracks time-to-complete, hints used, and verification attempts to measure lesson effectiveness

### Module

- [x] **MODL-01**: MVP includes one complete module: Command Lifecycle (follow `/gsd:quick` end-to-end)
- [x] **MODL-02**: Module starts with conceptual overview, then drills into GSD source code
- [x] **MODL-03**: Module ends with a mini-project where learner uses GSD to build something real
- [x] **MODL-04**: Mini-project results serve as lesson quality measurement — assess before building module 2

## v2.0 Requirements

### Infrastructure

- [ ] **INFR-01**: Progress tracking supports multiple modules with per-module lesson state (v2 schema migration preserves existing data)
- [ ] **INFR-02**: Module discovery via listModules() scans content directories and sorts by order field
- [ ] **INFR-03**: Markdown parser extracts YAML frontmatter, XML sections, code blocks, and @file references from .md files
- [ ] **INFR-04**: Concept map is parameterized per module (not hardcoded to Command Lifecycle)
- [ ] **INFR-05**: CLI entry point supports multi-module selection with smart defaults (first incomplete module)

### Module 1 Content

- [ ] **MOD1-01**: Module 1 overview lesson explains the two-layer architecture (command.md dispatches to workflow.md)
- [ ] **MOD1-02**: Command.md anatomy lesson teaches frontmatter fields, XML sections, and @file references
- [ ] **MOD1-03**: Workflow.md anatomy lesson teaches purpose, process steps, and bash code blocks
- [ ] **MOD1-04**: Wiring lesson traces the dispatch chain from /gsd:X through command.md to workflow execution
- [ ] **MOD1-05**: Mini-project: learner builds a working /gsd:greet command (command.md + workflow.md pair)
- [ ] **MOD1-06**: Module ordering: GSD Commands = Module 1, Command Lifecycle = Module 2

## v3+ Requirements

### Content Enhancement

- **CONT-06**: Content auto-updates when GSD source files change (detect staleness, regenerate)
- **CONT-07**: Watch mode re-runs verification automatically on file changes

### Navigation

- **NAV-01**: Module completion celebration with ASCII art
- **NAV-02**: Jump to any completed lesson for review

### Modules

- **MODL-05**: State Machine module (how GSD tracks project state and transitions)
- **MODL-06**: Agent Orchestration module (how commands spawn and coordinate agents)
- **MODL-07**: Tools & Config module (how gsd-tools.cjs, config.json, and templates work together)

### Module 2 Update

- **MOD2-01**: Command Lifecycle mini-project updated to full-stack (command.md + workflow.md + echo.cjs + switch case)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Web UI / browser experience | Terminal-native only — learner stays in their environment |
| Multi-user support | Single learner tool — zero infrastructure |
| Multiple choice quizzes | Validation through doing, not recall |
| Video or multimedia | Cannot display in terminal; text and code only |
| Gamification (points, badges, streaks) | Extrinsic motivation distracts from capability growth |
| AI-powered tutoring | Adds LLM dependency, cost, unpredictability |
| Plugin/extension system | Premature abstraction — build one good module first |
| Timed challenges | Single user; time pressure harms deep learning |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DISP-01 | Phase 1 | Complete |
| DISP-02 | Phase 1 | Complete |
| DISP-03 | Phase 1 | Complete |
| CONT-01 | Phase 1 | Complete |
| CONT-02 | Phase 1 | Complete |
| CONT-03 | Phase 2 | Complete |
| CONT-04 | Phase 2 | Complete |
| CONT-05 | Phase 2 | Complete |
| PROG-01 | Phase 1 | Complete |
| PROG-02 | Phase 1 | Complete |
| PROG-03 | Phase 1 | Complete |
| VALD-01 | Phase 3 | Complete |
| VALD-02 | Phase 3 | Complete |
| VALD-03 | Phase 3 | Complete |
| VALD-04 | Phase 3 | Complete |
| MODL-01 | Phase 2 | Complete |
| MODL-02 | Phase 2 | Complete |
| MODL-03 | Phase 3 | Complete |
| MODL-04 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 19 total — all complete
- v2.0 requirements: 11 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 11

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-12 after v2.0 milestone start*
