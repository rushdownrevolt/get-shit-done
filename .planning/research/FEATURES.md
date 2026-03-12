# Feature Landscape

**Domain:** Interactive CLI learning tool (codebase-specific, terminal-native)
**Researched:** 2026-03-11
**Confidence:** MEDIUM (based on training knowledge of exercism, rustlings, codecrafters, NodeSchool workshoppers, tour-of-go; no live web verification available)

## Reference Tools Studied

The feature analysis below draws from established interactive CLI learning tools:

- **Rustlings** - Small exercises with compiler-driven feedback, watch mode
- **Exercism** - Track-based exercises with mentoring, CLI submission
- **NodeSchool workshoppers** (learnyounode, etc.) - Module-based Node.js tutorials with verification
- **CodeCrafters** - Build-your-own-X projects with automated testing
- **Tour of Go** - Step-by-step guided walkthrough of language concepts
- **freeCodeCamp CLI challenges** - Progressive curriculum with automated validation

GSD Learn is unique in that it teaches a specific codebase (not a language), targets a single user, parses source for content, and validates through creative mini-projects rather than test correctness.

---

## Table Stakes

Features users expect. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Clear lesson progression | Every learning tool has a linear path; without it, learners feel lost | Low | Numbered modules with a defined order. Rustlings and workshoppers both do this simply. |
| Progress persistence | Learners close terminal and come back later. Losing place = instant frustration | Low | JSON file in `.gsd-learn/` or similar. Every tool in this space does this. |
| Current position indicator | "You are on lesson 3 of 8" — learners need orientation at all times | Low | Show on launch and between lessons. Rustlings shows "Progress: [####----] 4/8". |
| Readable terminal output | Lessons displayed in terminal must be formatted well (colors, spacing, code blocks) | Medium | chalk/ANSI formatting. Bad terminal output kills trust instantly. Zero-dep constraint means hand-rolling ANSI codes. |
| Source code display in context | The tool teaches a codebase — showing relevant source snippets inline is non-negotiable | Medium | Must highlight the specific lines being discussed, not dump entire files. |
| Run/verify command | A single command to check if the mini-project/exercise is done correctly | Medium | `gsd-learn verify` or similar. Exercism has `exercism submit`, workshoppers have `verify`. Without this, "am I done?" has no answer. |
| Clear instructions per lesson | Each lesson must state: what you will learn, what to do, what success looks like | Low | Template-driven lesson structure. Ambiguous instructions are the #1 complaint in every CLI tutorial. |
| Graceful error handling | Tool crashes or confusing errors break learning flow | Low | Catch common mistakes (wrong directory, missing files) with helpful messages. |
| Help/hint system | Learner gets stuck — they need a lifeline before they quit | Medium | At minimum: `gsd-learn hint` shows a nudge. Rustlings does this well with progressive hints. |

## Differentiators

Features that set GSD Learn apart. Not expected, but create real value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Auto-generated lessons from source | Content never drifts from reality; unique to teaching your own codebase | High | This IS the core innovation. Parsing AST/comments from GSD source to generate lesson content. No other tool does this. |
| Mini-project validation (not quizzes) | Proves real capability, not recall. Learner builds something creative with GSD | High | Validation must check "did they use GSD to produce a result" not "did they write exact code." This is novel. |
| Watch mode for exercises | File changes trigger re-verification automatically (Rustlings' killer feature) | Medium | `gsd-learn watch` — detects file saves, re-runs verification, shows pass/fail instantly. Dramatically improves flow state. |
| Lesson quality feedback loop | Mini-project results measure whether the lesson actually taught well | Medium | Track: time to complete, hints used, verification attempts. Feed back into lesson design iteration. |
| Content auto-update on source change | When GSD source changes, lessons reflect new reality automatically | High | Requires robust source parsing. Unique differentiator — no other tutorial tool does this. |
| Concept map / architecture visualization | ASCII art showing where current lesson fits in the bigger GSD architecture | Medium | Show "You are HERE" in the system diagram. Helps learner build mental model beyond current lesson. |
| Contextual "why" explanations | Not just "this code does X" but "this code exists because Y design decision" | Medium | Pull from commit messages, inline comments, or curated annotations in source. Teaches architectural thinking. |
| Module completion certificates (terminal art) | Fun ASCII art celebration when finishing a module | Low | Low effort, high delight. Rustlings does a congratulations screen. Motivates completion. |

## Anti-Features

Features to explicitly NOT build. These are tempting but wrong for GSD Learn.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Multiple choice quizzes | PROJECT.md explicitly excludes these. They test recall, not capability. They also require maintaining a question bank that drifts from source. | Mini-projects that require using GSD commands to produce real output. |
| Web UI / browser experience | Breaks the terminal-native philosophy. Adds massive complexity (server, frontend, routing). The learner lives in the terminal. | Rich terminal formatting with ANSI colors, box-drawing characters, and clear layout. |
| Multi-user support / accounts | Single learner tool. User management adds auth, storage, and complexity for zero value. | Local JSON progress file. Simple, private, zero infrastructure. |
| Video or multimedia content | Cannot be displayed in terminal. Requires hosting, streaming, media players. Out of scope per PROJECT.md. | Well-formatted code snippets with inline annotations. ASCII diagrams for architecture. |
| Gamification (points, badges, streaks) | Extrinsic motivation distracts from the actual goal (modification confidence). Adds complexity for engagement theater. | Intrinsic motivation through visible capability growth — "look what you built." |
| AI-powered tutoring / chat | Adds LLM dependency, cost, latency, and unpredictability. GSD Learn should be deterministic and self-contained. | Well-written progressive hints that guide without giving answers. |
| Timed challenges / leaderboards | Single user. Competition is meaningless. Time pressure harms deep learning. | Self-paced progression with no time tracking visible to user. |
| Plugin/extension system for lessons | Premature abstraction. Build one good module first (MVP), then decide if extensibility is needed. | Hard-coded module structure. Refactor to extensible only if multiple modules prove the pattern. |
| Backward compatibility for lesson format | The tool is pre-1.0 and single-user. Maintaining old lesson formats adds drag for no audience. | Break freely during development. Version the progress file format, migrate on load. |

## Feature Dependencies

```
Progress Persistence --> Current Position Indicator (need stored state to show position)
Source Code Display --> Auto-generated Lessons (lessons reference source, display must work first)
Auto-generated Lessons --> Lesson Progression (content must exist before ordering it)
Clear Instructions --> Run/Verify Command (instructions say what to do, verify confirms it)
Run/Verify Command --> Mini-project Validation (verify is the mechanism, validation is the logic)
Mini-project Validation --> Lesson Quality Feedback Loop (can't measure quality without validation data)
Help/Hint System --> Run/Verify Command (hints help when verify fails)
Watch Mode --> Run/Verify Command (watch re-runs verify on file change)
Content Auto-update --> Auto-generated Lessons (auto-update requires the generation pipeline to exist)
```

### Critical Path for MVP

```
1. Readable Terminal Output (foundation — everything displays through this)
2. Source Code Display (core capability — the tool shows code)
3. Auto-generated Lessons from Source (the innovation — parse GSD source into lessons)
4. Lesson Progression + Clear Instructions (structure the generated content)
5. Progress Persistence + Position Indicator (remember where learner is)
6. Run/Verify Command (learner can check their work)
7. Mini-project Validation (the capstone of each module)
8. Help/Hint System (support for when learner gets stuck)
```

## MVP Recommendation

**Prioritize (must ship in MVP):**

1. **Readable terminal output** — Foundation. Everything renders through this. Without good formatting, nothing else matters.
2. **Lesson progression with clear instructions** — The structural backbone. Learner must know where they are and what to do.
3. **Progress persistence** — Learner closes terminal and returns. Losing place is unacceptable even in MVP.
4. **Source code display in context** — The tool teaches a codebase. Showing relevant code inline is the core interaction.
5. **Auto-generated lessons from source** — The key differentiator. Even if rough in MVP, this must work because it validates the core thesis.
6. **Run/verify command** — Without verification, mini-projects have no feedback. The "am I done?" question needs an answer.
7. **One mini-project (Command Lifecycle)** — Validates the entire learning model. Does the learner actually gain capability?

**Defer to post-MVP:**

- **Watch mode**: Nice but not essential. Manual `verify` works fine initially.
- **Lesson quality feedback loop**: Collect data in MVP (timestamps, attempt counts) but defer the analysis dashboard.
- **Content auto-update**: MVP can require manual regeneration. Auto-detection adds complexity.
- **Concept map visualization**: Helpful but not blocking. A static ASCII diagram in the lesson text suffices initially.
- **Help/hint system**: Can ship MVP with inline hints in lesson text rather than a separate `hint` command. Add progressive hints in v2.

**Rationale:** The MVP must prove that auto-generated-from-source lessons can teach effectively, validated by a mini-project. Everything else is enhancement. If the core thesis fails (source-parsed lessons are too noisy, mini-project validation is too loose), no amount of watch mode or gamification saves it.

## Sources

- Rustlings (github.com/rust-lang/rustlings) - watch mode, progressive hints, progress tracking patterns
- Exercism (exercism.org) - track-based exercise structure, CLI submission workflow
- NodeSchool workshoppers (nodeschool.io) - Node.js tutorial CLI patterns, verify command
- CodeCrafters (codecrafters.io) - build-your-own-X project validation approach
- Tour of Go (go.dev/tour) - step-by-step guided concept introduction

**Confidence note:** These observations are from training data (pre-May 2025). The tools themselves are mature and stable, so feature sets are unlikely to have changed substantially. However, any new entrants in the CLI learning space since mid-2025 are not captured here.
