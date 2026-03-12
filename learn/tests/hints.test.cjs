'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');

describe('hints.cjs', () => {
  describe('getNextHint()', () => {
    const hints = ['Hint one', 'Hint two', 'Hint three'];

    test('returns first hint when hintsUsed is 0', () => {
      const { getNextHint } = require('../lib/hints.cjs');
      const result = getNextHint(hints, 0);
      assert.strictEqual(result.hint, 'Hint one');
      assert.strictEqual(result.hintsUsed, 1);
    });

    test('returns second hint when hintsUsed is 1', () => {
      const { getNextHint } = require('../lib/hints.cjs');
      const result = getNextHint(hints, 1);
      assert.strictEqual(result.hint, 'Hint two');
      assert.strictEqual(result.hintsUsed, 2);
    });

    test('returns { hint: null, remaining: 0 } when all hints exhausted', () => {
      const { getNextHint } = require('../lib/hints.cjs');
      const result = getNextHint(hints, 3);
      assert.strictEqual(result.hint, null);
      assert.strictEqual(result.remaining, 0);
    });

    test('remaining decrements correctly with each call', () => {
      const { getNextHint } = require('../lib/hints.cjs');
      const r0 = getNextHint(hints, 0);
      assert.strictEqual(r0.remaining, 2);
      const r1 = getNextHint(hints, 1);
      assert.strictEqual(r1.remaining, 1);
      const r2 = getNextHint(hints, 2);
      assert.strictEqual(r2.remaining, 0);
    });
  });
});
