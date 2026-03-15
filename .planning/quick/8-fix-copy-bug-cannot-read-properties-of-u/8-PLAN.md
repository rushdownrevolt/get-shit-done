---
phase: quick
plan: 8
type: execute
wave: 1
depends_on: []
files_modified:
  - learn/lib/clipboard-formatter.cjs
  - learn/lib/navigator.cjs
  - learn/bin/gsd-learn.cjs
  - learn/tests/clipboard-formatter.test.cjs
autonomous: true
must_haves:
  truths:
    - "Pressing 'c' on a lesson with conceptMap does not crash"
    - "Copied output includes concept map with YOU ARE HERE marker"
    - "Copied output for lessons without conceptMap still works"
  artifacts:
    - path: "learn/lib/clipboard-formatter.cjs"
      provides: "Updated formatter that loads concept map from file"
    - path: "learn/lib/navigator.cjs"
      provides: "Passes moduleDir to formatLessonForClipboard"
  key_links:
    - from: "learn/bin/gsd-learn.cjs"
      to: "learn/lib/navigator.cjs"
      via: "opts.moduleDir in runNavigationLoop call"
      pattern: "moduleDir"
    - from: "learn/lib/navigator.cjs"
      to: "learn/lib/clipboard-formatter.cjs"
      via: "4th argument to formatLessonForClipboard"
      pattern: "formatLessonForClipboard.*moduleDir"
    - from: "learn/lib/clipboard-formatter.cjs"
      to: "concept-map.txt + module.json"
      via: "fs.readFileSync from moduleDir"
      pattern: "readFileSync.*concept-map\\.txt"
---

<objective>
Fix crash when pressing 'c' to copy a lesson that has a conceptMap field.

Purpose: `clipboard-formatter.cjs` imports a non-existent `CONCEPT_MAP` export from `concept-map.cjs`, causing "Cannot read properties of undefined (reading 'replace')" when copying lessons with concept maps.

Output: Working copy-to-clipboard for all lessons, including those with concept maps.
</objective>

<execution_context>
@C:/Users/18182/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/18182/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@learn/lib/clipboard-formatter.cjs
@learn/lib/navigator.cjs
@learn/bin/gsd-learn.cjs
@learn/lib/concept-map.cjs

<interfaces>
<!-- How concept-map.cjs loads maps (the pattern clipboard-formatter must replicate): -->

From learn/lib/concept-map.cjs:
```javascript
// Loads ASCII art from concept-map.txt in the module directory
const mapPath = path.join(moduleDir, 'concept-map.txt');
let map = fs.readFileSync(mapPath, 'utf-8');

// Loads sectionMap from module.json
const moduleJson = JSON.parse(fs.readFileSync(path.join(moduleDir, 'module.json'), 'utf-8'));
sectionMap = moduleJson.sectionMap || null;

// Marker insertion pattern
const label = sectionMap[currentSection] || currentSection;
map = map.replace(
  new RegExp('(\\|\\s*' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*)'),
  '$1' + marker
);
```

From learn/bin/gsd-learn.cjs line 200:
```javascript
const moduleDir = path.join(contentDir, 'modules', activeModuleId);
```

From learn/bin/gsd-learn.cjs line 261:
```javascript
const result = await runNavigationLoop(mod.lessons, startIndex, renderFn, progressFn, {
  moduleMeta: { title: mod.title, lessonCount: mod.lessons.length },
  completionBannerFn: renderCompletionBanner,
  hints: moduleHints,
  hintsUsed: initialHintsUsed,
  recordHintFn: recordHintFn,
});
```

From learn/lib/navigator.cjs line 151-154 (copy handler):
```javascript
} else if (action === 'copy') {
  const { formatLessonForClipboard } = require('./clipboard-formatter.cjs');
  const { copyToClipboard } = require('./clipboard.cjs');
  const markdown = formatLessonForClipboard(lesson, currentLesson, totalLessons);
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix clipboard-formatter to load concept map from file</name>
  <files>learn/lib/clipboard-formatter.cjs</files>
  <action>
1. Remove line 3 (`const { CONCEPT_MAP } = require('./concept-map.cjs');`).
2. Add `const fs = require('fs');` and `const path = require('path');` at top.
3. Remove the hardcoded `sectionMap` object (lines 8-17).
4. Add `moduleDir` as 4th parameter to `formatLessonForClipboard(lesson, currentIndex, totalLessons, moduleDir)`.
5. Update the JSDoc to document the new `moduleDir` parameter (string, absolute path to module directory).
6. Replace the concept map block (lines 78-96) with file-based loading that mirrors `concept-map.cjs:renderConceptMap()`:
   - Read concept map from `path.join(moduleDir, 'concept-map.txt')` using `fs.readFileSync`. If file missing or moduleDir not provided, skip the concept map section entirely (no crash).
   - Read sectionMap from `path.join(moduleDir, 'module.json')` parsing JSON and getting `.sectionMap`. If missing, skip marker insertion.
   - Use the same marker logic: `const label = sectionMap[lesson.conceptMap] || lesson.conceptMap;` then regex replace to insert ` <-- YOU ARE HERE`.
   - Keep the existing output format: `## Architecture Overview` heading, triple-backtick fenced block, map.trim().
  </action>
  <verify>
    <automated>cd learn && node -e "const {formatLessonForClipboard}=require('./lib/clipboard-formatter.cjs'); console.log(typeof formatLessonForClipboard); console.log(formatLessonForClipboard.length);" 2>&1 | grep -q "4" && echo "PASS: accepts 4 params" || echo "FAIL"</automated>
  </verify>
  <done>formatLessonForClipboard accepts moduleDir as 4th param, loads concept map from file, does not crash when moduleDir is undefined or concept-map.txt is missing.</done>
</task>

<task type="auto">
  <name>Task 2: Thread moduleDir through navigator and entry point</name>
  <files>learn/lib/navigator.cjs, learn/bin/gsd-learn.cjs</files>
  <action>
1. In `learn/bin/gsd-learn.cjs` around line 261: add `moduleDir: moduleDir,` to the opts object passed to `runNavigationLoop`. The `moduleDir` variable is already defined on line 200 as `path.join(contentDir, 'modules', activeModuleId)`.

2. In `learn/lib/navigator.cjs`:
   - Update the JSDoc for `runNavigationLoop` to document `opts.moduleDir` (string, absolute path to module directory).
   - In the copy handler (line 151-163), change line 154 from:
     `const markdown = formatLessonForClipboard(lesson, currentLesson, totalLessons);`
     to:
     `const markdown = formatLessonForClipboard(lesson, currentLesson, totalLessons, opts && opts.moduleDir);`
   - No new imports needed in navigator.cjs (fs/path not required there).
  </action>
  <verify>
    <automated>cd learn && node -e "const src=require('fs').readFileSync('lib/navigator.cjs','utf-8'); const ok=src.includes('opts.moduleDir') || src.includes('opts && opts.moduleDir'); console.log(ok ? 'PASS' : 'FAIL')"</automated>
  </verify>
  <done>moduleDir flows from gsd-learn.cjs opts through navigator.cjs to formatLessonForClipboard's 4th argument.</done>
</task>

<task type="auto">
  <name>Task 3: Update tests for new moduleDir parameter</name>
  <files>learn/tests/clipboard-formatter.test.cjs</files>
  <action>
1. Read the full test file first.
2. The test fixture `testLesson` has `conceptMap: 'tool-dispatch'` but tests currently crash (the 13 pre-existing failures noted in STATE.md).
3. Create a temporary test fixture directory approach: use `path.join(__dirname, '..', 'content', 'modules', 'gsd-commands')` as moduleDir for tests that need a real concept map, since that module has concept-map.txt and module.json with sectionMap.
4. Update all `formatLessonForClipboard(testLesson, ...)` calls to pass moduleDir as 4th argument.
5. For the concept map test specifically, pass the gsd-commands moduleDir so concept-map.txt can be read. The testLesson's conceptMap value ('tool-dispatch') won't match gsd-commands' sectionMap, but that's fine -- it should still include the map text without a marker, and not crash.
6. Add a new test: "handles missing moduleDir gracefully" -- call with `undefined` as 4th arg on a lesson with conceptMap, verify it does NOT throw and output does NOT include "Architecture Overview" (since no moduleDir means no map to load).
7. Run tests and ensure all pass: `node --test tests/clipboard-formatter.test.cjs`
  </action>
  <verify>
    <automated>cd learn && node --test tests/clipboard-formatter.test.cjs 2>&1</automated>
  </verify>
  <done>All clipboard-formatter tests pass, including concept map rendering with moduleDir and graceful handling of missing moduleDir.</done>
</task>

</tasks>

<verification>
1. `cd learn && node --test tests/clipboard-formatter.test.cjs` -- all tests pass
2. `cd learn && node -e "const {formatLessonForClipboard}=require('./lib/clipboard-formatter.cjs'); console.log(formatLessonForClipboard.length)"` -- prints 4
3. `grep -r "CONCEPT_MAP" learn/lib/` -- returns no matches (old import removed)
</verification>

<success_criteria>
- Pressing 'c' on any lesson (with or without conceptMap) does not crash
- Concept map in copied output is loaded from module's concept-map.txt file
- YOU ARE HERE marker appears when sectionMap has a matching entry
- All clipboard-formatter tests pass
- No references to the old CONCEPT_MAP export remain
</success_criteria>

<output>
After completion, create `.planning/quick/8-fix-copy-bug-cannot-read-properties-of-u/8-SUMMARY.md`
</output>
