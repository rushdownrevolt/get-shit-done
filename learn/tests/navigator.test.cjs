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

  // Note: Full keypress testing for waitForKey requires a TTY which is
  // unavailable in automated test environments. The function's behavior
  // (resolving with 'next'/'prev'/'quit' on n/p/q keys) is verified
  // via the human-verify checkpoint in Task 3.
});
