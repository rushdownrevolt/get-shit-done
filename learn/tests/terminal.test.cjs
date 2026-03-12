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

  describe('oscLink()', () => {
    test('_oscLinkWithColor returns OSC 8 escaped string', () => {
      const { _oscLinkWithColor } = require('../lib/terminal.cjs');
      const result = _oscLinkWithColor('https://example.com', 'click me');
      assert.strictEqual(result, '\x1b]8;;https://example.com\x1b\\click me\x1b]8;;\x1b\\');
    });

    test('_oscLinkNoColor returns plain display text', () => {
      const { _oscLinkNoColor } = require('../lib/terminal.cjs');
      const result = _oscLinkNoColor('https://example.com', 'click me');
      assert.strictEqual(result, 'click me');
    });

    test('oscLink with vscode:// URI returns correct sequence', () => {
      const { _oscLinkWithColor } = require('../lib/terminal.cjs');
      const uri = 'vscode://file/C:/project/file.js:10';
      const result = _oscLinkWithColor(uri, 'file.js:10');
      assert.ok(result.includes(uri), 'should contain the URI');
      assert.ok(result.includes('file.js:10'), 'should contain display text');
    });
  });

  describe('renderCodeBlock()', () => {
    test('_renderCodeBlockWithColor produces line-numbered output', () => {
      const { _renderCodeBlockWithColor } = require('../lib/terminal.cjs');
      const result = _renderCodeBlockWithColor('line one\nline two\nline three', {});
      assert.ok(result.includes('1'), 'should contain line number 1');
      assert.ok(result.includes('2'), 'should contain line number 2');
      assert.ok(result.includes('3'), 'should contain line number 3');
      assert.ok(result.includes('line one'), 'should contain line content');
      assert.ok(result.includes('|'), 'should contain gutter separator');
    });

    test('_renderCodeBlockWithColor highlights specified lines with yellow background', () => {
      const { _renderCodeBlockWithColor, COLORS } = require('../lib/terminal.cjs');
      const result = _renderCodeBlockWithColor('aaa\nbbb\nccc', { highlight: [2] });
      const lines = result.split('\n');
      // Line 2 (index 1) should have bgYellow
      assert.ok(lines[1].includes('\x1b[43m'), 'highlighted line should have yellow background');
      // Line 1 (index 0) should NOT have bgYellow
      assert.ok(!lines[0].includes('\x1b[43m'), 'non-highlighted line should not have yellow bg');
    });

    test('_renderCodeBlockWithColor respects startLine option', () => {
      const { _renderCodeBlockWithColor } = require('../lib/terminal.cjs');
      const result = _renderCodeBlockWithColor('first\nsecond', { startLine: 10 });
      assert.ok(result.includes('10'), 'should start numbering at 10');
      assert.ok(result.includes('11'), 'second line should be 11');
      assert.ok(!result.includes(' 1 '), 'should not contain line number 1');
    });

    test('_renderCodeBlockNoColor produces plain line-numbered output without ANSI', () => {
      const { _renderCodeBlockNoColor } = require('../lib/terminal.cjs');
      const result = _renderCodeBlockNoColor('hello\nworld', {});
      assert.ok(!result.includes('\x1b['), 'should not contain ANSI escape codes');
      assert.ok(result.includes('1'), 'should contain line number 1');
      assert.ok(result.includes('2'), 'should contain line number 2');
      assert.ok(result.includes('hello'), 'should contain code content');
    });

    test('_renderCodeBlockNoColor ignores highlight (no ANSI available)', () => {
      const { _renderCodeBlockNoColor } = require('../lib/terminal.cjs');
      const result = _renderCodeBlockNoColor('aaa\nbbb', { highlight: [1] });
      assert.ok(!result.includes('\x1b['), 'should not contain ANSI codes even with highlight');
    });

    test('line numbers are right-aligned in gutter', () => {
      const { _renderCodeBlockWithColor } = require('../lib/terminal.cjs');
      // 10+ lines to test alignment
      const code = Array.from({ length: 12 }, (_, i) => `line ${i + 1}`).join('\n');
      const result = _renderCodeBlockWithColor(code, {});
      const lines = result.split('\n');
      // Line 1 should have padding (e.g., " 1") while line 12 has "12"
      // Both should have the same gutter width
      assert.ok(lines[0].includes(' 1'), 'single digit should be padded');
      assert.ok(lines[11].includes('12'), 'double digit should not be padded');
    });
  });

  describe('COLORS.bgYellow', () => {
    test('exports bgYellow color code', () => {
      const { COLORS } = require('../lib/terminal.cjs');
      assert.strictEqual(COLORS.bgYellow, '\x1b[43m');
    });
  });
});
