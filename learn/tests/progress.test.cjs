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
    test('returns v2 default object when file missing', () => {
      const { loadProgress } = require('../lib/progress.cjs');
      const result = loadProgress(tmpDir);
      assert.strictEqual(result.version, 2);
      assert.strictEqual(result.currentModule, null);
      assert.strictEqual(result.currentLesson, 0);
      assert.deepStrictEqual(result.modules, {});
    });

    test('returns default object when file contains invalid JSON', () => {
      const { loadProgress } = require('../lib/progress.cjs');
      const dir = path.join(tmpDir, '.planning', 'learn');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'progress.json'), 'not valid json {{{{');
      const result = loadProgress(tmpDir);
      assert.strictEqual(result.version, 2);
      assert.strictEqual(result.currentModule, null);
      assert.strictEqual(result.currentLesson, 0);
      assert.deepStrictEqual(result.modules, {});
    });

    test('returns default object when progress file has missing fields', () => {
      const { loadProgress } = require('../lib/progress.cjs');
      const dir = path.join(tmpDir, '.planning', 'learn');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'progress.json'), JSON.stringify({ version: 2 }));
      const result = loadProgress(tmpDir);
      assert.strictEqual(result.version, 2);
      assert.strictEqual(result.currentModule, null);
      assert.strictEqual(result.currentLesson, 0);
      assert.deepStrictEqual(result.modules, {});
    });
  });

  describe('migrateV1toV2()', () => {
    test('migrates v1 data with currentModule to v2 per-module structure', () => {
      const { migrateV1toV2 } = require('../lib/progress.cjs');
      const v1 = {
        version: 1,
        currentModule: 'command-lifecycle',
        currentLesson: 5,
        modules: {},
      };
      const result = migrateV1toV2(v1);
      assert.strictEqual(result.version, 2);
      assert.strictEqual(result.currentModule, 'command-lifecycle');
      assert.strictEqual(result.currentLesson, 5);
      assert.deepStrictEqual(result.modules, {
        'command-lifecycle': { currentLesson: 5, started: true },
      });
    });

    test('returns v2 data unchanged', () => {
      const { migrateV1toV2 } = require('../lib/progress.cjs');
      const v2 = {
        version: 2,
        currentModule: 'command-lifecycle',
        currentLesson: 3,
        modules: { 'command-lifecycle': { currentLesson: 3, started: true } },
      };
      const result = migrateV1toV2(v2);
      assert.deepStrictEqual(result, v2);
    });

    test('handles v1 data with null currentModule', () => {
      const { migrateV1toV2 } = require('../lib/progress.cjs');
      const v1 = {
        version: 1,
        currentModule: null,
        currentLesson: 0,
        modules: {},
      };
      const result = migrateV1toV2(v1);
      assert.strictEqual(result.version, 2);
      assert.deepStrictEqual(result.modules, {});
    });
  });

  describe('loadProgress() with v1 data on disk', () => {
    test('auto-migrates v1 file to v2 and writes back', () => {
      const { loadProgress } = require('../lib/progress.cjs');
      const dir = path.join(tmpDir, '.planning', 'learn');
      fs.mkdirSync(dir, { recursive: true });
      const v1Data = {
        version: 1,
        currentModule: 'command-lifecycle',
        currentLesson: 5,
        modules: {},
      };
      fs.writeFileSync(path.join(dir, 'progress.json'), JSON.stringify(v1Data));

      const result = loadProgress(tmpDir);
      assert.strictEqual(result.version, 2);
      assert.deepStrictEqual(result.modules, {
        'command-lifecycle': { currentLesson: 5, started: true },
      });

      // Verify it was written back to disk
      const onDisk = JSON.parse(fs.readFileSync(path.join(dir, 'progress.json'), 'utf-8'));
      assert.strictEqual(onDisk.version, 2);
      assert.deepStrictEqual(onDisk.modules, {
        'command-lifecycle': { currentLesson: 5, started: true },
      });
    });

    test('does not rewrite v2 data', () => {
      const { loadProgress } = require('../lib/progress.cjs');
      const dir = path.join(tmpDir, '.planning', 'learn');
      fs.mkdirSync(dir, { recursive: true });
      const v2Data = {
        version: 2,
        currentModule: 'command-lifecycle',
        currentLesson: 3,
        modules: { 'command-lifecycle': { currentLesson: 3, started: true } },
      };
      fs.writeFileSync(path.join(dir, 'progress.json'), JSON.stringify(v2Data));

      const result = loadProgress(tmpDir);
      assert.deepStrictEqual(result, v2Data);
    });
  });

  describe('saveProgress()', () => {
    test('writes JSON to .planning/learn/progress.json creating directories', () => {
      const { saveProgress } = require('../lib/progress.cjs');
      const data = { version: 2, currentModule: 'test', currentLesson: 2, modules: {} };
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
      const data = { version: 2, currentModule: 'command-lifecycle', currentLesson: 3, modules: { 'command-lifecycle': { currentLesson: 3, started: true } } };
      saveProgress(tmpDir, data);
      const loaded = loadProgress(tmpDir);
      assert.deepStrictEqual(loaded, data);
    });
  });
});
