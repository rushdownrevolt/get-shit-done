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
