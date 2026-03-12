'use strict';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { validateEnvironment, formatError } = require('../lib/errors.cjs');

describe('validateEnvironment', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-errors-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('returns { valid: true } when gsd-tools.cjs exists at expected path', () => {
    // Create the expected file structure
    const toolsDir = path.join(tmpDir, 'get-shit-done', 'bin');
    fs.mkdirSync(toolsDir, { recursive: true });
    fs.writeFileSync(path.join(toolsDir, 'gsd-tools.cjs'), '// stub');

    const result = validateEnvironment(tmpDir);
    assert.deepStrictEqual(result, { valid: true });
  });

  test('returns { valid: false, message } when not in GSD repo', () => {
    const result = validateEnvironment(tmpDir);
    assert.strictEqual(result.valid, false);
    assert.ok(typeof result.message === 'string', 'should have error message');
    assert.ok(result.message.length > 0, 'error message should not be empty');
  });

  test('error message includes helpful context about expected file', () => {
    const result = validateEnvironment(tmpDir);
    assert.ok(result.message.includes('gsd-tools.cjs') || result.message.includes('GSD'),
      'error message should mention what was expected');
  });
});

describe('formatError', () => {
  test('returns a styled error string', () => {
    const result = formatError('Something went wrong');
    assert.ok(typeof result === 'string', 'should return a string');
    assert.ok(result.includes('Something went wrong'), 'should contain the original message');
  });

  test('includes Error prefix', () => {
    const result = formatError('test error');
    assert.ok(result.includes('Error'), 'should contain Error prefix');
  });

  test('does not include stack traces', () => {
    const result = formatError('test error');
    assert.ok(!result.includes('at '), 'should not contain stack trace lines');
    assert.ok(!result.includes('Error:'), 'should not contain stack-trace-style Error:');
  });
});
