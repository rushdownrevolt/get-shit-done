---
phase: quick-6
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - learn/lib/renderer.cjs
  - learn/tests/renderer.test.cjs
autonomous: true
requirements: [QUICK-6]

must_haves:
  truths:
    - "renderPart output contains exactly ONE footer line (the lesson progress footer), not two"
    - "The old 'Part X of Y' progress dots line no longer appears in renderPart output"
    - "The new lesson progress footer with module name and (X / Y) counter still renders correctly"
  artifacts:
    - path: "learn/lib/renderer.cjs"
      provides: "renderPart without old progress dots call"
    - path: "learn/tests/renderer.test.cjs"
      provides: "Updated tests reflecting single footer"
  key_links:
    - from: "learn/lib/renderer.cjs"
      to: "renderLessonProgressFooter"
      via: "direct call in renderPart"
      pattern: "renderLessonProgressFooter"
---

<objective>
Remove the duplicated old "Part X of Y" progress dots footer from renderPart, keeping only the new lesson progress footer added in quick-5.

Purpose: The old renderProgressDots call on line 255 of renderer.cjs produces a redundant line (`● ○ ○ ○  Part 1 of 6`) that duplicates information already in the new renderLessonProgressFooter line (`ModuleName  ● ● ○ ○  LessonName (1 / 6)`).
Output: Single clean footer in renderPart output.
</objective>

<execution_context>
@C:/Users/18182/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/18182/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@learn/lib/renderer.cjs
@learn/tests/renderer.test.cjs
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove old progress dots from renderPart and update tests</name>
  <files>learn/lib/renderer.cjs, learn/tests/renderer.test.cjs</files>
  <action>
In `learn/lib/renderer.cjs`, in the `renderPart` function:

1. Remove lines 254-256 (the old progress dots block):
   ```
   // 9. Progress dots
   parts.push(renderProgressDots(partIndex, totalParts));
   parts.push('\n\n');
   ```
   This removes the old `● ○ ○ ○  Part 1 of 6` line. The `renderProgressDots` function itself should remain in the file since it is still exported (public API) and has its own unit tests.

2. Renumber the comment on the lesson progress footer section from `// 9b.` to `// 9.` since it is no longer a sub-item.

In `learn/tests/renderer.test.cjs`:

3. Update the test on line 326-329 titled `'includes progress dots from renderProgressDots'`. This test currently checks that renderPart output includes `'Part 2 of 2'` which comes from the old renderProgressDots call. Change this test to verify that the old-style "Part X of Y" text does NOT appear in renderPart output, confirming the duplication is gone. The test should be renamed to something like `'does not include old-style "Part X of Y" progress dots'` and assert that renderPart output does NOT include the pattern `Part 2 of 2` (which was from renderProgressDots). Note: the new footer uses `(2 / 2)` format, not `Part 2 of 2`, so there is no conflict.

4. Also update the test on line 537-544 titled `'GROUP: progress dots count reflects group count'`. This test asserts `output.includes('Part 1 of 3')` which comes from the old renderProgressDots. Change this to verify the old "Part X of Y" format is absent. You can check that the new footer format is present instead if moduleTitle is passed (add `'My Module'` as the 7th arg to renderPart).
  </action>
  <verify>
    <automated>cd C:/Users/18182/documents/get-shit-done && node --test learn/tests/renderer.test.cjs</automated>
  </verify>
  <done>renderPart produces only ONE footer line (the lesson progress footer). The old "Part X of Y" line is gone. All renderer tests pass.</done>
</task>

</tasks>

<verification>
- Run `node --test learn/tests/renderer.test.cjs` -- all tests pass
- Visually confirm: renderPart output has no "Part X of Y" string (only the new `(X / Y)` in lesson progress footer)
</verification>

<success_criteria>
- renderPart output contains exactly one progress footer (the lesson progress footer with module name)
- No "Part X of Y" text appears in renderPart output
- All existing renderer tests pass (updated where needed)
- renderProgressDots function still exists and its unit tests still pass (it remains a public export)
</success_criteria>

<output>
After completion, create `.planning/quick/6-fix-duplicated-footer-remove-old-part-x-/6-SUMMARY.md`
</output>
