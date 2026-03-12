'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');

describe('terminal.cjs', () => {
  describe('style()', () => {
    test('style with bold returns ANSI bold-wrapped text when color enabled', () => {
      // Force color mode by importing with clean env
      const { _styleWithColor } = require('../lib/terminal.cjs');
      const result = _styleWithColor('hello', 'bold');
      assert.strictEqual(result, '\x1b[1mhello\x1b[0m');
    });

    test('style with bold and cyan returns combined ANSI codes', () => {
      const { _styleWithColor } = require('../lib/terminal.cjs');
      const result = _styleWithColor('hello', 'bold', 'cyan');
      assert.strictEqual(result, '\x1b[1m\x1b[36mhello\x1b[0m');
    });

    test('style returns plain text when NO_COLOR mode', () => {
      const { _styleNoColor } = require('../lib/terminal.cjs');
      const result = _styleNoColor('hello', 'bold');
      assert.strictEqual(result, 'hello');
    });
  });

  describe('clearScreen()', () => {
    test('returns correct ANSI clear sequence', () => {
      const { clearScreen } = require('../lib/terminal.cjs');
      assert.strictEqual(clearScreen(), '\x1b[2J\x1b[H');
    });
  });

  describe('horizontalRule()', () => {
    test('returns dim-styled string of specified width', () => {
      const { _horizontalRuleWithColor } = require('../lib/terminal.cjs');
      const result = _horizontalRuleWithColor(40);
      assert.strictEqual(result, '\x1b[2m' + '\u2500'.repeat(40) + '\x1b[0m');
    });
  });

  describe('highlightJS()', () => {
    test('highlights const keyword with cyan', () => {
      const { _highlightJSWithColor } = require('../lib/terminal.cjs');
      const result = _highlightJSWithColor('const x = 1;');
      assert.ok(result.includes('\x1b[36mconst\x1b[0m'), 'const should be cyan');
    });

    test('returns unmodified code when NO_COLOR mode', () => {
      const { _highlightJSNoColor } = require('../lib/terminal.cjs');
      const result = _highlightJSNoColor('const x = 1;');
      assert.strictEqual(result, 'const x = 1;');
    });
  });

  describe('COLORS', () => {
    test('exports expected color codes', () => {
      const { COLORS } = require('../lib/terminal.cjs');
      assert.strictEqual(COLORS.reset, '\x1b[0m');
      assert.strictEqual(COLORS.bold, '\x1b[1m');
      assert.strictEqual(COLORS.dim, '\x1b[2m');
      assert.strictEqual(COLORS.red, '\x1b[31m');
      assert.strictEqual(COLORS.green, '\x1b[32m');
      assert.strictEqual(COLORS.yellow, '\x1b[33m');
      assert.strictEqual(COLORS.blue, '\x1b[34m');
      assert.strictEqual(COLORS.magenta, '\x1b[35m');
      assert.strictEqual(COLORS.cyan, '\x1b[36m');
      assert.strictEqual(COLORS.white, '\x1b[37m');
    });
  });

  describe('useColor', () => {
    test('exports useColor boolean', () => {
      const { useColor } = require('../lib/terminal.cjs');
      assert.strictEqual(typeof useColor, 'boolean');
    });
  });
});
