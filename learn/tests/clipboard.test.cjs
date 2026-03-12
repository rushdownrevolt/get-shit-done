'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { getClipboardCommand, copyToClipboard, fallbackToFile } = require('../lib/clipboard.cjs');

describe('getClipboardCommand', () => {
  test('returns "clip" on win32', () => {
    const original = Object.getOwnPropertyDescriptor(process, 'platform');
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    try {
      assert.strictEqual(getClipboardCommand(), 'clip');
    } finally {
      Object.defineProperty(process, 'platform', original);
    }
  });

  test('returns "pbcopy" on darwin', () => {
    const original = Object.getOwnPropertyDescriptor(process, 'platform');
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    try {
      assert.strictEqual(getClipboardCommand(), 'pbcopy');
    } finally {
      Object.defineProperty(process, 'platform', original);
    }
  });

  test('returns "xclip -selection clipboard" on linux', () => {
    const original = Object.getOwnPropertyDescriptor(process, 'platform');
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    try {
      assert.strictEqual(getClipboardCommand(), 'xclip -selection clipboard');
    } finally {
      Object.defineProperty(process, 'platform', original);
    }
  });
});

describe('fallbackToFile', () => {
  test('writes text to a temp .md file and returns fallbackPath', () => {
    const text = '# Test Lesson\n\nSome content here.';
    const result = fallbackToFile(text, { skipOpen: true });
    assert.strictEqual(result.success, false);
    assert.ok(result.fallbackPath, 'should return a fallbackPath');
    assert.ok(result.fallbackPath.endsWith('.md'), 'path should end with .md');
    assert.ok(result.fallbackPath.includes('gsd-lesson-'), 'path should contain gsd-lesson-');

    // Verify file was written with correct content
    const content = fs.readFileSync(result.fallbackPath, 'utf-8');
    assert.strictEqual(content, text);

    // Cleanup
    fs.unlinkSync(result.fallbackPath);
  });
});

describe('copyToClipboard', () => {
  test('returns object with success property', () => {
    // This test exercises the actual copy path on the current platform
    // It may succeed (clipboard available) or fall back to file
    const result = copyToClipboard('test clipboard content');
    assert.ok(typeof result.success === 'boolean', 'result should have boolean success');
    if (!result.success && result.fallbackPath) {
      // Clean up fallback file
      try { fs.unlinkSync(result.fallbackPath); } catch {}
    }
  });
});
