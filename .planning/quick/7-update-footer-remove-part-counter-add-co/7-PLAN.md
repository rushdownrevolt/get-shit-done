---
phase: quick-7
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - learn/lib/renderer.cjs
  - learn/tests/renderer.test.cjs
autonomous: true
requirements: [QUICK-7]
must_haves:
  truths:
    - "Footer no longer shows (X / Y) part counter"
    - "Footer shows lesson name followed by a colon"
    - "A subtitle line appears below the footer showing the current block's focus text"
  artifacts:
    - path: "learn/lib/renderer.cjs"
      provides: "Updated renderLessonProgressFooter with subtitle support"
      contains: "blockSummary"
    - path: "learn/tests/renderer.test.cjs"
      provides: "Updated tests matching new footer format"
  key_links:
    - from: "learn/lib/renderer.cjs renderPart"
      to: "renderLessonProgressFooter"
      via: "passes current group's focus text as blockSummary parameter"
      pattern: "group\\.focus"
---

<objective>
Update the lesson progress footer in three ways: remove the `(X / Y)` part counter (dots already convey position), add a colon after the lesson name, and display a subtitle line below the footer showing the current content block's `focus` text (the "summary" the user wants).

Purpose: Cleaner footer with more useful contextual information about what the learner is currently reading.
Output: Updated renderer and tests.
</objective>

<execution_context>
@C:/Users/18182/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/18182/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@learn/lib/renderer.cjs
@learn/tests/renderer.test.cjs
</context>

<interfaces>
<!-- Key function signatures the executor needs -->

From learn/lib/renderer.cjs (current signature to be modified):
```javascript
function renderLessonProgressFooter(moduleTitle, lessonTitle, currentLessonIndex, totalLessons, currentPart, totalParts)
// Currently returns:
//   '  ' + moduleTitle + '  ' + dots.join(' ') + '  ' + lessonTitle + ' (' + (currentPart + 1) + ' / ' + totalParts + ')'
```

Call sites:
```javascript
// renderLesson (line 64) - full lesson view, no per-block focus available
renderLessonProgressFooter(moduleTitle, lesson.title, currentIndex, totalLessons, 0, 1)

// renderPart (line 256) - per-block view, groups[partIndex].focus is available
renderLessonProgressFooter(moduleTitle, lesson.title, currentLessonIndex, totalLessons, partIndex, totalParts)
```

Content block structure (from lesson JSON files):
```json
{ "type": "text", "value": "...", "focus": "Three entry point questions", "bridge": "..." }
```

Groups created by groupContentItems() have shape:
```javascript
{ items: Array, focus: string, bridge: string }
```
</interfaces>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Update renderLessonProgressFooter and its call sites</name>
  <files>learn/lib/renderer.cjs, learn/tests/renderer.test.cjs</files>
  <behavior>
    - Test: renderLessonProgressFooter output does NOT contain "(X / Y)" pattern
    - Test: renderLessonProgressFooter output contains lesson title followed by colon (e.g. "Command Dispatch:")
    - Test: when blockSummary is provided, output contains the summary text on a second line
    - Test: when blockSummary is null/undefined, output is single line (no empty subtitle)
    - Test: subtitle line is right-aligned under the lesson title (indented to match)
    - Test: renderPart integration passes group.focus to renderLessonProgressFooter
    - Test: renderLesson integration passes no blockSummary (backward compatible)
  </behavior>
  <action>
1. Update `renderLessonProgressFooter` signature: remove `currentPart` and `totalParts` params, add `blockSummary` (optional string).

2. Change the return value:
   - Remove the ` (X / Y)` suffix
   - Add `:` after lessonTitle
   - If blockSummary is provided, add a second line below with the summary text, right-aligned to start at the same column as the lesson title. Use dim styling for the subtitle.

   The first line: `  <moduleTitle>  <dots>  <lessonTitle>:`
   The second line (if blockSummary): spaces to align under lessonTitle, then dim-styled blockSummary text.

   To calculate alignment: the prefix length is `2 + moduleTitle.length + 2 + dotsString.length + 2` (where dotsString is the raw dots without ANSI codes). Since ANSI codes make length counting tricky, compute the visual prefix length as: `2 (leading spaces) + moduleTitle.length + 2 (spaces) + (totalLessons * 2 - 1) (dots with spaces) + 2 (trailing spaces)`. Then pad the subtitle line with that many spaces.

3. Update call site in `renderPart` (line ~256): pass `groups[partIndex].focus` (or for concept map part, pass `'Architecture Overview'`) as the blockSummary parameter. Handle the edge case where partIndex might be the concept map (partIndex === groups.length when lesson.conceptMap exists).

4. Update call site in `renderLesson` (line ~64): pass no blockSummary (or undefined) since renderLesson shows the full lesson without per-block navigation.

5. Update tests in renderer.test.cjs:
   - Update `renderLessonProgressFooter` unit tests: remove assertions for `(X / Y)`, add assertions for colon after lesson title, add tests for blockSummary subtitle line.
   - Update `renderPart lesson progress footer integration` tests: remove `(1 / 1)` assertion, verify focus text appears as subtitle.
   - Update `renderLesson lesson progress footer integration` tests: remove `(1 / 1)` assertion.
  </action>
  <verify>
    <automated>cd C:/Users/18182/documents/get-shit-done && node --test learn/tests/renderer.test.cjs</automated>
  </verify>
  <done>Footer renders without part counter, with colon after lesson name, and with subtitle showing current block's focus text. All renderer tests pass.</done>
</task>

</tasks>

<verification>
- `node --test learn/tests/renderer.test.cjs` passes with all updated assertions
- Manual spot check: no `(X / Y)` pattern in renderLessonProgressFooter output
- Subtitle line appears only when blockSummary is provided
</verification>

<success_criteria>
- Part counter `(X / Y)` removed from footer
- Lesson name followed by colon in footer
- Current block's focus text displayed as dim subtitle below footer line
- All existing tests updated and passing
</success_criteria>

<output>
After completion, create `.planning/quick/7-update-footer-remove-part-counter-add-co/7-SUMMARY.md`
</output>
