---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - learn/lib/navigator.cjs
  - learn/tests/navigator.test.cjs
autonomous: true
requirements: [QUICK-4]
must_haves:
  truths:
    - "Pressing 'q' at part 0 of lesson N (where N > 0) navigates to the last part of lesson N-1"
    - "Pressing 'q' at part 0 of lesson 0 does nothing (already at absolute start)"
    - "Pressing 'q' at part > 0 still goes back one part within the same lesson"
  artifacts:
    - path: "learn/lib/navigator.cjs"
      provides: "Backward navigation across lesson boundaries"
      contains: "currentLesson--"
    - path: "learn/tests/navigator.test.cjs"
      provides: "Test coverage for cross-lesson backward navigation"
  key_links:
    - from: "learn/lib/navigator.cjs"
      to: "groupContentItems"
      via: "computing totalParts for previous lesson to set currentPart"
      pattern: "groupContentItems.*lessons\\[currentLesson\\]"
---

<objective>
Fix backward navigation so pressing 'q' at the first part (part 0) of any lesson after the first navigates to the last part of the previous lesson, instead of doing nothing.

Purpose: Users currently get stuck when trying to go back across lesson boundaries. This breaks the expected two-level navigation model.
Output: Patched navigator.cjs with test coverage.
</objective>

<execution_context>
@C:/Users/18182/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/18182/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@learn/lib/navigator.cjs
@learn/tests/navigator.test.cjs
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add test and fix backward navigation across lesson boundaries</name>
  <files>learn/lib/navigator.cjs, learn/tests/navigator.test.cjs</files>
  <behavior>
    - Test 1: When action is 'prev' and currentPart is 0 and currentLesson > 0, navigation moves to previous lesson's last part
    - Test 2: When action is 'prev' and currentPart is 0 and currentLesson is 0, navigation stays at current position (no change)
    - Test 3: When action is 'prev' and currentPart > 0, navigation decrements currentPart (existing behavior preserved)
  </behavior>
  <action>
In learn/lib/navigator.cjs, modify `runNavigationLoop` to support backward navigation across lesson boundaries.

**Step 1 -- Add startPart variable:**
Before the outer `while` loop (after `let currentLesson = startIndex;`), add: `let startPart = 0;`

**Step 2 -- Use startPart in outer loop:**
Change `let currentPart = 0;` inside the outer loop to: `let currentPart = startPart; startPart = 0;`
This allows a one-time override of the starting part when navigating backward across lessons.

**Step 3 -- Fix the prev handler:**
Replace the current prev handler (lines 122-126):
```js
} else if (action === 'prev') {
  if (currentPart > 0) {
    currentPart--;
  }
  // If currentPart === 0, do nothing (stay on first part)
}
```

With:
```js
} else if (action === 'prev') {
  if (currentPart > 0) {
    currentPart--;
  } else if (currentLesson > 0) {
    // Navigate to last part of previous lesson
    currentLesson--;
    const prevLesson = lessons[currentLesson];
    const prevGroups = groupContentItems(prevLesson.content);
    const prevTotalParts = prevGroups.length + (prevLesson.conceptMap ? 1 : 0);
    startPart = prevTotalParts - 1;
    continue outer;
  }
  // If currentPart === 0 and currentLesson === 0, do nothing (absolute start)
}
```

**Step 4 -- Add tests in navigator.test.cjs:**
Add a new describe block 'backward navigation across lessons' that tests `runNavigationLoop` with mocked `waitForKey`. Use module mocking or monkey-patching approach:

- Create 2 mock lessons, each with 3 content items (type: 'text') and no conceptMap, so each has 3 parts.
- Override the module's waitForKey by requiring the module and replacing its export, OR restructure the test to use a testable wrapper.

Simplest approach: since `runNavigationLoop` calls the module-level `waitForKey`, and the navigator module uses `waitForKey` directly (not via `module.exports`), the cleanest test strategy is to create a separate testable navigation function or to test via the public API with stdin mocking.

Given test complexity with TTY mocking, an acceptable alternative is to write a focused logic test:
- Extract the prev-navigation logic into a pure helper function `computePrevPosition(currentLesson, currentPart, lessons, groupContentItems)` that returns `{ lesson, part }` or null.
- Export it for testing.
- Test the helper directly with simple assertions.
- Keep `runNavigationLoop` calling the helper.

Export the helper as `computePrevPosition` from navigator.cjs and test it in navigator.test.cjs with cases for: cross-lesson backward, within-lesson backward, and at-absolute-start.
  </action>
  <verify>
    <automated>cd C:/Users/18182/documents/get-shit-done && node --test learn/tests/navigator.test.cjs</automated>
  </verify>
  <done>
    - Pressing 'q' at part 0 of lesson 1+ navigates to last part of previous lesson
    - Pressing 'q' at part 0 of lesson 0 does nothing
    - Pressing 'q' at part > 0 still decrements part within same lesson
    - computePrevPosition helper is exported and tested
    - All navigator tests pass
  </done>
</task>

</tasks>

<verification>
- `node --test learn/tests/navigator.test.cjs` passes
- Manual verification: run `node learn/bin/gsd-learn.cjs`, advance to lesson 2, press 'q' to go back -- should show last part of lesson 1
</verification>

<success_criteria>
Backward navigation crosses lesson boundaries correctly. Tests pass. No regressions in forward navigation or other key bindings.
</success_criteria>

<output>
After completion, create `.planning/quick/4-fix-backward-navigation-at-lesson-start-/4-SUMMARY.md`
</output>
