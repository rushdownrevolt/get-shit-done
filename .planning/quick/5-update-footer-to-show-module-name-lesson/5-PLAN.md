---
phase: quick-5
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - learn/lib/renderer.cjs
  - learn/tests/renderer.test.cjs
  - learn/bin/gsd-learn.cjs
autonomous: true
requirements: [QUICK-5]
must_haves:
  truths:
    - "Footer displays module name, lesson-level progress dots, lesson name, and part counter"
    - "Filled dots represent current/completed lessons, empty dots represent upcoming lessons"
    - "Part counter shows current part number out of total parts for the current lesson"
  artifacts:
    - path: "learn/lib/renderer.cjs"
      provides: "renderLessonProgressFooter function and updated renderPart/renderLesson signatures"
      exports: ["renderLessonProgressFooter"]
    - path: "learn/tests/renderer.test.cjs"
      provides: "Tests for new footer rendering"
  key_links:
    - from: "learn/bin/gsd-learn.cjs"
      to: "learn/lib/renderer.cjs"
      via: "passes moduleTitle to renderPart"
      pattern: "renderPart.*moduleTitle"
---

<objective>
Update the lesson footer to show module-level lesson progress with the format:
`<Module Name>  ● ○ ○ ○ ○ ○  <Lesson Name> (# / N)`

Where filled dots = current/completed lessons, empty dots = upcoming, and (# / N) = current part / total parts.

Purpose: Give learners clear context about where they are within the module and lesson at all times.
Output: Updated renderer with new footer line, passing tests.
</objective>

<execution_context>
@C:/Users/18182/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/18182/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@learn/lib/renderer.cjs
@learn/tests/renderer.test.cjs
@learn/bin/gsd-learn.cjs
@learn/lib/navigator.cjs

<interfaces>
From learn/lib/renderer.cjs:
```javascript
// Current renderPart signature (needs moduleTitle added):
function renderPart(lesson, partIndex, totalParts, currentLessonIndex, totalLessons, moduleDir)

// Current renderLesson signature (needs moduleTitle added):
function renderLesson(lesson, currentIndex, totalLessons, moduleDir)

// Existing progress dots for parts:
function renderProgressDots(currentPart, totalParts)

module.exports = { renderLesson, renderPart, renderProgressDots, renderCompletionBanner, groupContentItems };
```

From learn/bin/gsd-learn.cjs (the call site):
```javascript
// mod.title is available (e.g., "Command Lifecycle")
const renderFn = (lesson, partIndex, totalParts, currentLessonIdx, totalLessons) => {
    process.stdout.write(renderPart(lesson, partIndex, totalParts, currentLessonIdx, totalLessons, moduleDir));
};
// lesson.title is available on each lesson object (e.g., "Command Dispatch")
```

From learn/lib/navigator.cjs:
```javascript
// renderFn is called with: (lesson, partIndex, totalParts, currentLessonIndex, totalLessons)
renderFn(lesson, currentPart, totalParts, currentLesson, totalLessons);
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add renderLessonProgressFooter and wire into renderPart</name>
  <files>learn/lib/renderer.cjs, learn/tests/renderer.test.cjs, learn/bin/gsd-learn.cjs, learn/lib/navigator.cjs</files>
  <behavior>
    - renderLessonProgressFooter(moduleTitle, lessonTitle, currentLessonIndex, totalLessons, currentPart, totalParts) returns a string
    - With moduleTitle="Command Lifecycle", lessonTitle="Command Dispatch", currentLessonIndex=2, totalLessons=6, currentPart=1, totalParts=4:
      Output contains "Command Lifecycle", 3 filled dots (lessons 0,1,2), 3 empty dots (lessons 3,4,5), "Command Dispatch", "(2 / 4)"
    - Filled dot (U+25CF) count equals currentLessonIndex + 1
    - Empty dot (U+25CB) count equals totalLessons - currentLessonIndex - 1
    - Part counter format is "(currentPart+1 / totalParts)"
    - renderPart footer section now includes this new line BEFORE the nav key hints
    - renderLesson footer section also includes this new line (using lesson position info, part 1/1 since renderLesson shows full lesson)
  </behavior>
  <action>
    1. Write tests FIRST in renderer.test.cjs:
       - New describe block "renderLessonProgressFooter" with tests for:
         - Returns string containing module title
         - Returns correct filled/empty dot counts
         - Contains lesson title
         - Contains part counter in "(X / Y)" format
         - Edge case: first lesson (1 filled, rest empty)
         - Edge case: last lesson (all filled)
       - Update existing renderPart tests to verify the new footer line appears
       - Update renderLesson test to verify the footer line appears

    2. Run tests (expect RED).

    3. Implement in renderer.cjs:
       - Create `renderLessonProgressFooter(moduleTitle, lessonTitle, currentLessonIndex, totalLessons, currentPart, totalParts)`:
         - Build dots: filled (cyan) for i <= currentLessonIndex, empty (dim) for rest
         - Format: `  {moduleTitle}  {dots}  {lessonTitle} ({currentPart+1} / {totalParts})`
         - Return the formatted string
       - Update `renderPart` signature: add `moduleTitle` parameter (7th param, after moduleDir)
         - Insert the footer line from renderLessonProgressFooter AFTER the existing progress dots line and BEFORE the nav footer
       - Update `renderLesson` signature: add `moduleTitle` parameter (4th param becomes moduleTitle, moduleDir becomes 5th)
         - Actually, to avoid breaking changes, add moduleTitle as the LAST parameter (5th param)
         - Insert footer line before nav footer: renderLessonProgressFooter(moduleTitle, lesson.title, currentIndex, totalLessons, 0, 1)
         - Only render if moduleTitle is provided (backward compat)
       - Export renderLessonProgressFooter

    4. Update navigator.cjs:
       - `runNavigationLoop` already receives `opts` with `opts.moduleMeta.title`
       - Update the renderFn call signature: the navigator calls `renderFn(lesson, currentPart, totalParts, currentLesson, totalLessons)` -- this is the callback, so the CALLER in gsd-learn.cjs controls what args renderPart gets. No change needed in navigator.cjs.

    5. Update gsd-learn.cjs:
       - In the renderFn callback, pass `mod.title` as the new moduleTitle parameter:
         `process.stdout.write(renderPart(lesson, partIndex, totalParts, currentLessonIdx, totalLessons, moduleDir, mod.title));`

    6. Run tests (expect GREEN).
  </action>
  <verify>
    <automated>cd C:/Users/18182/documents/get-shit-done && node --test learn/tests/renderer.test.cjs</automated>
  </verify>
  <done>
    - renderLessonProgressFooter is exported and tested
    - renderPart output includes module name, lesson progress dots, lesson name, and part counter
    - renderLesson output includes the same footer when moduleTitle is provided
    - All existing tests still pass (backward compatible -- moduleTitle is optional)
    - gsd-learn.cjs passes mod.title through to renderPart
  </done>
</task>

</tasks>

<verification>
- `node --test learn/tests/renderer.test.cjs` passes all tests (existing + new)
- Manual spot check: `node learn/bin/gsd-learn.cjs --module=gsd-commands` shows the new footer line with module name, lesson dots, lesson name, and part counter
</verification>

<success_criteria>
- Footer displays: `<Module Name>  ● ○ ○ ○ ○ ○  <Lesson Name> (X / Y)` on every part view
- Filled dots represent lessons 0 through currentLessonIndex (inclusive)
- Empty dots represent remaining lessons
- Part counter shows 1-based current part and total parts
- All renderer tests pass
- Backward compatible: renderLesson/renderPart work without moduleTitle
</success_criteria>

<output>
After completion, create `.planning/quick/5-update-footer-to-show-module-name-lesson/5-SUMMARY.md`
</output>
