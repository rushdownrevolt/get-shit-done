# Phase 28: Lesson Content (Lessons 4-7) - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Create lesson content for Module 6 Lessons 4-7: Auto Mode (the loop, crash recovery, stuck detection), Git & Worktrees (branch-per-milestone, squash merge), Skills & Extensions (discovery, manifest, custom authoring), and Synthesis (v1 vs v2 mental model comparison). Each lesson uses real GSD-2 source code snippets.

</domain>

<decisions>
## Implementation Decisions

### Content Structure
- 8 blocks per lesson (5 text, 3 code) — established pacing pattern
- Text blocks: focus statement + bridge to next block
- Code blocks: real snippets from GSD-2 source files
- Follows concept map entries: auto-mode, git-worktrees, skills-extensions, synthesis

### Source Material for Lessons
- GSD-2 installed at: C:/Users/18182/AppData/Roaming/npm/node_modules/gsd-pi/
- Key source paths:
  - Lesson 4 (Auto Mode): src/resources/extensions/gsd/auto-loop.ts, auto-recovery.ts, auto-supervisor.ts, crash-recovery.ts (auto loop, crash recovery, stuck detection, timeouts)
  - Lesson 5 (Git & Worktrees): src/resources/extensions/gsd/worktree.ts, worktree-manager.ts, git-service.ts (worktree lifecycle, branch strategy, squash merge)
  - Lesson 6 (Skills & Extensions): src/resources/extensions/gsd/skill-discovery.ts, extension-manifest.json, skills/ directory, src/resources/skills/ (skill system, extension architecture)
  - Lesson 7 (Synthesis): draws from all prior lessons — comparison table in README.md, GSD-WORKFLOW.md overview, system.md identity

### Claude's Discretion
- Specific code snippet selection within source files
- Lesson narrative flow and conceptual framing
- How to structure the v1 vs v2 synthesis in Lesson 7
- Which auto mode recovery scenarios to highlight

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Skeleton lesson JSONs from Phase 26: lessons/04-auto-mode.json through 07-synthesis.json
- Lessons 1-3 from Phase 27 provide the pattern for content quality and pacing
- Module 6 sectionMap entries: auto-mode, git-worktrees, skills-extensions, synthesis

### Established Patterns
- Same JSON lesson format as Lessons 1-3
- Each block has type (text/code/project), title, and content fields
- Code blocks include language, code (the snippet), and explanation
- Text blocks include focus and bridge fields
- conceptMap reference matches sectionMap key

### Integration Points
- Lessons replace skeleton content in learn/content/modules/gsd2-agent-application/lessons/
- Must be consistent with Lessons 1-3 in style and terminology

</code_context>

<specifics>
## Specific Ideas

- Lesson 4 should show the actual auto-loop state machine cycle with real recovery code
- Lesson 5 should demonstrate the worktree lifecycle: create → work → squash merge → cleanup
- Lesson 6 should show a real skill file structure and the discovery mechanism
- Lesson 7 should tie everything together with a v1→v2 evolution narrative, referencing concepts from all prior lessons

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
