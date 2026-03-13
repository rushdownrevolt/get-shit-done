# Phase 11: Key Bindings & Navigation Footer - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Add M and H key bindings within the lesson navigation loop, and make the navigation footer context-dependent (showing available keys based on current screen). M returns to module picker from any lesson. H shows progressive hints inline on mini-project steps. Footer updates to reflect available actions.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
- **M key behavior**: How position is saved before jumping to picker, whether there's a visual confirmation or immediate jump. Prior context: `runNavigationLoop` already returns `{ reason: 'modules' }` and the dispatch loop already handles `action = 'picker'` — just needs the M keypress wired in `waitForKey()`.
- **H key & inline hints**: How hints display inline during mini-project steps (overlay, append, replace section). Currently hints are CLI-only via `--hint` flag with `hints.json` arrays. Need to load hints within the navigation loop and show progressively on H press. Detection of mini-project step needed to gate H availability.
- **Footer layout & context rules**: How the footer adapts based on context. Current hardcoded footer: `[w] Next  [q] Back  [e] Skip lesson  [c] Copy  [esc] Quit`. Requirements say: M always visible, H only on mini-project steps, arrows/c/q as before. Claude decides exact layout, spacing, and conditional logic.
- All wording, spacing, visual treatment, and edge case handling

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Follow existing patterns from Phase 9/10 implementations.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `waitForKey()` in navigator.cjs: Currently maps w/q/e/c/esc — add m and h handlers
- `waitForPickerKey()` in navigator.cjs: Picker key handler pattern to reference
- `renderLessonProgressFooter()` in renderer.cjs: Module context line above nav footer — already context-aware
- `renderPart()` in renderer.cjs: Hardcoded nav footer at line 262 — needs to become dynamic
- `renderLesson()` in renderer.cjs: Older nav footer at line 69 — also hardcoded
- `hints.json` files: `learn/content/modules/*/project/hints.json` — flat arrays of progressive hint strings
- `--hint` CLI logic in gsd-learn.cjs (lines 101-125): Loads hints, tracks hint index in feedback state

### Established Patterns
- Key handler pattern: `if (key.name === 'x') { cleanup(); resolve('action'); }` in waitForKey()
- Navigation return contract: `{ reason: 'quit' | 'completed' | 'modules' }` from runNavigationLoop
- Dispatch loop in gsd-learn.cjs handles return reasons to set next action
- Footer is a plain string appended at end of renderPart output
- Mini-project detection: `lesson.content.some(s => s.type === 'project')` used in multiple places

### Integration Points
- `waitForKey()`: Add 'm' -> 'modules' and 'h' -> 'hint' action mappings
- `runNavigationLoop()`: Handle 'modules' action to return `{ reason: 'modules' }` with position saved
- `runNavigationLoop()`: Handle 'hint' action to display next hint inline (needs hints data passed in opts)
- `renderPart()`: Footer needs to accept context flags (isMiniProjectStep, etc.) to show/hide M and H keys
- `gsd-learn.cjs` navigate branch: Pass hints data into runNavigationLoop opts

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-key-bindings-navigation-footer*
*Context gathered: 2026-03-13*
