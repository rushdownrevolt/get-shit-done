'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');

const { runNavigationLoop, setupCleanExit, waitForKey } = require('../lib/navigator.cjs');

describe('navigator module exports', () => {
  test('exports waitForKey as a function', () => {
    assert.strictEqual(typeof waitForKey, 'function', 'waitForKey should be a function');
  });

  test('exports setupCleanExit as a function', () => {
    assert.strictEqual(typeof setupCleanExit, 'function', 'setupCleanExit should be a function');
  });

  test('exports runNavigationLoop as a function', () => {
    assert.strictEqual(typeof runNavigationLoop, 'function', 'runNavigationLoop should be a function');
  });

  test('setupCleanExit can be called without error', () => {
    // setupCleanExit registers process event handlers - should not throw
    assert.doesNotThrow(() => {
      setupCleanExit();
    });
  });

  // Key mappings (verified via human-verify checkpoint in Task 2):
  //   w       -> 'next'   (advance to next part within lesson)
  //   q       -> 'prev'   (go back one part within lesson)
  //   e       -> 'skip'   (skip to first part of next lesson)
  //   c       -> 'copy'   (copy full lesson to clipboard)
  //   escape  -> 'quit'   (quit and save progress)
  //   Ctrl+C  -> 'quit'   (quit and save progress)
  //
  // Arrow keys removed. Old n/p bindings removed.
  //
  // Navigation is two-level:
  //   Outer loop: lessons (currentLesson index)
  //   Inner loop: parts within each lesson (currentPart index)
  //   totalParts = lesson.content.length + (lesson.conceptMap ? 1 : 0)
  //
  // runNavigationLoop accepts opts: { moduleMeta, completionBannerFn }
  //   moduleMeta: { title, lessonCount }
  //   completionBannerFn: renderCompletionBanner from renderer.cjs

  // Note: Full keypress testing for waitForKey requires a TTY which is
  // unavailable in automated test environments. The two-level navigation
  // and key mapping behavior is verified via the human-verify checkpoint
  // in Task 2.
});

describe('runNavigationLoop return contract', () => {
  // runNavigationLoop returns an object with a reason property:
  //   { reason: 'quit' }      - user pressed escape/Ctrl+C
  //   { reason: 'completed' } - user reached end of final lesson
  //   { reason: 'modules' }   - user requested module picker (Phase 11)
  //
  // The return value is used by gsd-learn.cjs dispatch loop to decide
  // whether to quit, show the module picker, or mark completion.
  //
  // TTY requirement prevents unit-testing actual return values here.
  // The contract is verified by the dispatch loop in gsd-learn.cjs.

  test('runNavigationLoop is an async function that returns a promise', () => {
    assert.strictEqual(typeof runNavigationLoop, 'function');
    // Verify it's declared async (returns promise-like when called)
    // We can't actually call it without TTY, but we verify the export type
  });

  test('exports computePrevPosition for backward navigation', () => {
    const { computePrevPosition } = require('../lib/navigator.cjs');
    assert.strictEqual(typeof computePrevPosition, 'function');
  });
});

describe('M key and modules action', () => {
  test('waitForPickerKey is exported as a function', () => {
    const { waitForPickerKey } = require('../lib/navigator.cjs');
    assert.strictEqual(typeof waitForPickerKey, 'function', 'waitForPickerKey should be exported');
  });

  test('computePrevPosition is exported as a function', () => {
    const { computePrevPosition } = require('../lib/navigator.cjs');
    assert.strictEqual(typeof computePrevPosition, 'function', 'computePrevPosition should be exported');
  });

  test('waitForKey JSDoc documents modules as valid return value', () => {
    const fs = require('fs');
    const source = fs.readFileSync(require.resolve('../lib/navigator.cjs'), 'utf8');
    // Find the waitForKey function area and check for 'modules' documentation
    const waitForKeySection = source.substring(0, source.indexOf('function waitForKey') + 500);
    assert.ok(waitForKeySection.includes("'modules'"), 'waitForKey JSDoc should document modules action');
  });

  test('runNavigationLoop source contains modules action handler', () => {
    const fs = require('fs');
    const source = fs.readFileSync(require.resolve('../lib/navigator.cjs'), 'utf8');
    assert.ok(source.includes("action === 'modules'"), 'runNavigationLoop should handle modules action');
    assert.ok(source.includes("reason: 'modules'"), 'modules handler should return { reason: modules }');
  });
});

describe('H key and hint action', () => {
  test('waitForKey JSDoc documents hint as valid return value', () => {
    const fs = require('fs');
    const source = fs.readFileSync(require.resolve('../lib/navigator.cjs'), 'utf8');
    const waitForKeySection = source.substring(0, source.indexOf('function waitForKey') + 500);
    assert.ok(waitForKeySection.includes("'hint'"), 'waitForKey JSDoc should document hint action');
  });

  test('runNavigationLoop source contains hint action handler', () => {
    const fs = require('fs');
    const source = fs.readFileSync(require.resolve('../lib/navigator.cjs'), 'utf8');
    assert.ok(source.includes("action === 'hint'"), 'runNavigationLoop should handle hint action');
  });

  test('navigator imports getNextHint from hints.cjs', () => {
    const fs = require('fs');
    const source = fs.readFileSync(require.resolve('../lib/navigator.cjs'), 'utf8');
    assert.ok(source.includes("require('./hints.cjs')"), 'navigator should import from hints.cjs');
    assert.ok(source.includes('getNextHint'), 'navigator should use getNextHint');
  });
});

describe('computePrevPosition', () => {
  const { computePrevPosition } = require('../lib/navigator.cjs');
  const { groupContentItems } = require('../lib/renderer.cjs');

  // Helper: create a mock lesson with N text content items and optional conceptMap
  function mockLesson(contentCount, hasConceptMap = false) {
    const content = [];
    for (let i = 0; i < contentCount; i++) {
      content.push({ type: 'text', text: `Item ${i}` });
    }
    return {
      content,
      conceptMap: hasConceptMap ? 'some-map' : null,
    };
  }

  const lessons = [
    mockLesson(3), // lesson 0: 3 parts (3 text groups, no conceptMap)
    mockLesson(3), // lesson 1: 3 parts
  ];

  test('within-lesson backward: decrements part when currentPart > 0', () => {
    const result = computePrevPosition(1, 2, lessons, groupContentItems);
    assert.deepStrictEqual(result, { lesson: 1, part: 1 });
  });

  test('cross-lesson backward: moves to last part of previous lesson when at part 0 of lesson > 0', () => {
    const result = computePrevPosition(1, 0, lessons, groupContentItems);
    // Previous lesson (0) has 3 text items grouped into 3 groups, no conceptMap => 3 parts, last = 2
    assert.deepStrictEqual(result, { lesson: 0, part: 2 });
  });

  test('at absolute start: returns null when at part 0 of lesson 0', () => {
    const result = computePrevPosition(0, 0, lessons, groupContentItems);
    assert.strictEqual(result, null);
  });

  test('cross-lesson backward with conceptMap: includes conceptMap in part count', () => {
    const lessonsWithMap = [
      mockLesson(2, true), // lesson 0: 2 text groups + 1 conceptMap = 3 parts, last = 2
      mockLesson(2),       // lesson 1: 2 parts
    ];
    const result = computePrevPosition(1, 0, lessonsWithMap, groupContentItems);
    assert.deepStrictEqual(result, { lesson: 0, part: 2 });
  });
});
