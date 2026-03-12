'use strict';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('progress.cjs', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-progress-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('loadProgress()', () => {
    test('returns default object when file missing', () => {
      const { loadProgress } = require('../lib/progress.cjs');
      const result = loadProgress(tmpDir);
      assert.deepStrictEqual(result, {
        version: 1,
        currentModule: null,
        currentLesson: 0,
        modules: {},
      });
    });

    test('returns default object when file contains invalid JSON', () => {
      const { loadProgress } = require('../lib/progress.cjs');
      const dir = path.join(tmpDir, '.planning', 'learn');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'progress.json'), 'not valid json {{{{');
      const result = loadProgress(tmpDir);
      assert.deepStrictEqual(result, {
        version: 1,
        currentModule: null,
        currentLesson: 0,
        modules: {},
      });
    });

    test('returns default object when progress file has missing fields', () => {
      const { loadProgress } = require('../lib/progress.cjs');
      const dir = path.join(tmpDir, '.planning', 'learn');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'progress.json'), JSON.stringify({ version: 1 }));
      const result = loadProgress(tmpDir);
      assert.strictEqual(result.version, 1);
      assert.strictEqual(result.currentModule, null);
      assert.strictEqual(result.currentLesson, 0);
      assert.deepStrictEqual(result.modules, {});
    });
  });

  describe('saveProgress()', () => {
    test('writes JSON to .planning/learn/progress.json creating directories', () => {
      const { saveProgress } = require('../lib/progress.cjs');
      const data = { version: 1, currentModule: 'test', currentLesson: 2, modules: {} };
      saveProgress(tmpDir, data);
      const filePath = path.join(tmpDir, '.planning', 'learn', 'progress.json');
      assert.ok(fs.existsSync(filePath), 'progress.json should exist');
      const contents = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      assert.deepStrictEqual(contents, data);
    });
  });

  describe('round-trip', () => {
    test('loadProgress after saveProgress returns the same data', () => {
      const { loadProgress, saveProgress } = require('../lib/progress.cjs');
      const data = { version: 1, currentModule: 'command-lifecycle', currentLesson: 3, modules: { 'command-lifecycle': { completed: [0, 1, 2] } } };
      saveProgress(tmpDir, data);
      const loaded = loadProgress(tmpDir);
      assert.deepStrictEqual(loaded, data);
    });
  });
});
