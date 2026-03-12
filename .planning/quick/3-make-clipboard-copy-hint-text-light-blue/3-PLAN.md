---
phase: quick-3
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - learn/lib/terminal.cjs
  - learn/lib/renderer.cjs
  - learn/tests/renderer.test.cjs
autonomous: true
requirements: [QUICK-3]
must_haves:
  truths:
    - "The clipboard copy hint text renders in light blue in the terminal"
    - "All other successCriteria text renders unchanged"
    - "Existing tests continue to pass"
  artifacts:
    - path: "learn/lib/terminal.cjs"
      provides: "lightBlue ANSI color code"
      contains: "lightBlue"
    - path: "learn/lib/renderer.cjs"
      provides: "Light blue styling for clipboard hint line"
      contains: "lightBlue"
  key_links:
    - from: "learn/lib/renderer.cjs"
      to: "learn/lib/terminal.cjs"
      via: "style() with lightBlue"
      pattern: "style.*lightBlue"
---

<objective>
Render the clipboard copy hint text ("Want to go deeper? Press [c] to copy...") in light blue color in the terminal lesson output.

Purpose: Visual differentiation -- the hint is secondary/meta text and should stand out from the actual success criteria content.
Output: Updated renderer that splits successCriteria at the hint line and styles it light blue.
</objective>

<execution_context>
@C:/Users/18182/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/18182/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@learn/lib/terminal.cjs
@learn/lib/renderer.cjs
@learn/tests/renderer.test.cjs
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add lightBlue color and style the clipboard hint text</name>
  <files>learn/lib/terminal.cjs, learn/lib/renderer.cjs, learn/tests/renderer.test.cjs</files>
  <behavior>
    - Test: Clipboard hint line in successCriteria renders with lightBlue ANSI codes wrapping it
    - Test: The main successCriteria text before the hint renders without lightBlue styling
    - Test: successCriteria with no hint text renders unchanged (backward compatible)
  </behavior>
  <action>
1. In terminal.cjs, add `lightBlue: '\x1b[94m'` to the COLORS object (ANSI bright blue, which appears as light blue in terminals).

2. In renderer.cjs, update the success criteria rendering (lines 87-90). Instead of pushing `lesson.successCriteria` as a single string, split on the hint text:
   - Define a constant: `const CLIPBOARD_HINT_PREFIX = 'Want to go deeper?'`
   - Check if `lesson.successCriteria` contains the hint prefix
   - If yes: split the text at the hint line boundary (split on `\n\n` before the hint), push the main criteria text normally, then push the hint line wrapped in `style(hintLine, 'lightBlue')`
   - If no: push the full text as-is (backward compatible)

   Concrete approach:
   ```
   const hintIdx = lesson.successCriteria.indexOf('\n\nWant to go deeper?');
   if (hintIdx !== -1) {
     parts.push(lesson.successCriteria.substring(0, hintIdx));
     parts.push('\n\n');
     parts.push(style(lesson.successCriteria.substring(hintIdx + 2), 'lightBlue'));
   } else {
     parts.push(lesson.successCriteria);
   }
   ```

3. In renderer.test.cjs, add three tests:
   - Test that when successCriteria contains "Want to go deeper?", the output includes the ANSI code `\x1b[94m` (lightBlue) wrapping the hint text. Use `_styleWithColor` from terminal.cjs or check raw ANSI codes.
   - Test that the main criteria text before the hint does NOT have `\x1b[94m` applied to it.
   - Test with a successCriteria that has no hint line -- output should match current behavior (no `\x1b[94m`).

   Note: The existing test fixture has `successCriteria: 'You can verify renderer output'` which has no hint, so it validates backward compatibility already. Add a new fixture with the hint text for the new tests.
  </action>
  <verify>
    <automated>cd C:/Users/18182/documents/get-shit-done && node --test learn/tests/renderer.test.cjs learn/tests/terminal.test.cjs</automated>
  </verify>
  <done>
    - lightBlue (ANSI 94) exists in terminal.cjs COLORS
    - Renderer splits successCriteria at hint line and wraps hint in lightBlue
    - Lessons without hint text render identically to before
    - All renderer and terminal tests pass
  </done>
</task>

</tasks>

<verification>
- `node --test learn/tests/renderer.test.cjs` -- all tests pass including new hint styling tests
- `node --test learn/tests/terminal.test.cjs` -- all tests pass
- `node --test learn/tests/` -- full test suite passes
- Visual: run `node learn/bin/learn.cjs command-lifecycle` and confirm the hint text at the bottom of each lesson appears in light blue
</verification>

<success_criteria>
The "Want to go deeper? Press [c]..." hint text renders in light blue (ANSI bright blue \x1b[94m) in the terminal, while all other success criteria text renders in its normal color. All existing tests continue to pass.
</success_criteria>

<output>
After completion, create `.planning/quick/3-make-clipboard-copy-hint-text-light-blue/3-SUMMARY.md`
</output>
