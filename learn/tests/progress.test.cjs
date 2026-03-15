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
    test('returns v4 default object when file missing', () => {
      const { loadProgress } = require('../lib/progress.cjs');
      const result = loadProgress(tmpDir);
      assert.strictEqual(result.version, 4);
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
      assert.strictEqual(result.version, 4);
      assert.strictEqual(result.currentModule, null);
      assert.strictEqual(result.currentLesson, 0);
      assert.deepStrictEqual(result.modules, {});
    });

    test('returns default object when progress file has missing fields', () => {
      const { loadProgress } = require('../lib/progress.cjs');
      const dir = path.join(tmpDir, '.planning', 'learn');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'progress.json'), JSON.stringify({ version: 4 }));
      const result = loadProgress(tmpDir);
      assert.strictEqual(result.version, 4);
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

  describe('migrateV2toV3()', () => {
    test('v2 data with module entries gets completed: false added', () => {
      const { migrateV2toV3 } = require('../lib/progress.cjs');
      const v2 = {
        version: 2,
        currentModule: 'gsd-commands',
        currentLesson: 3,
        modules: {
          'gsd-commands': { currentLesson: 3, started: true },
        },
      };
      const result = migrateV2toV3(v2);
      assert.strictEqual(result.version, 3);
      assert.strictEqual(result.currentModule, 'gsd-commands');
      assert.strictEqual(result.currentLesson, 3);
      assert.deepStrictEqual(result.modules['gsd-commands'], {
        currentLesson: 3,
        started: true,
        completed: false,
      });
    });

    test('v2 data with empty modules map migrates cleanly', () => {
      const { migrateV2toV3 } = require('../lib/progress.cjs');
      const v2 = {
        version: 2,
        currentModule: null,
        currentLesson: 0,
        modules: {},
      };
      const result = migrateV2toV3(v2);
      assert.strictEqual(result.version, 3);
      assert.deepStrictEqual(result.modules, {});
    });

    test('v3 data passes through unchanged (idempotent)', () => {
      const { migrateV2toV3 } = require('../lib/progress.cjs');
      const v3 = {
        version: 3,
        currentModule: 'gsd-commands',
        currentLesson: 3,
        modules: {
          'gsd-commands': { currentLesson: 3, started: true, completed: false },
        },
      };
      const result = migrateV2toV3(v3);
      assert.deepStrictEqual(result, v3);
    });

    test('preserves all existing fields in module entries', () => {
      const { migrateV2toV3 } = require('../lib/progress.cjs');
      const v2 = {
        version: 2,
        currentModule: 'gsd-commands',
        currentLesson: 5,
        modules: {
          'gsd-commands': { currentLesson: 5, started: true },
          'command-lifecycle': { currentLesson: 2, started: false },
        },
      };
      const result = migrateV2toV3(v2);
      assert.strictEqual(result.version, 3);
      assert.deepStrictEqual(result.modules['gsd-commands'], {
        currentLesson: 5,
        started: true,
        completed: false,
      });
      assert.deepStrictEqual(result.modules['command-lifecycle'], {
        currentLesson: 2,
        started: false,
        completed: false,
      });
    });
  });

  describe('migrateV3toV4()', () => {
    test('v3 data with existing modules gets version bumped to 4, all module entries preserved', () => {
      const { migrateV3toV4 } = require('../lib/progress.cjs');
      const v3 = {
        version: 3,
        currentModule: 'gsd-commands',
        currentLesson: 3,
        modules: {
          'gsd-commands': { currentLesson: 3, started: true, completed: false },
          'command-lifecycle': { currentLesson: 0, started: false, completed: false },
        },
      };
      const result = migrateV3toV4(v3);
      assert.strictEqual(result.version, 4);
      assert.strictEqual(result.currentModule, 'gsd-commands');
      assert.strictEqual(result.currentLesson, 3);
      assert.deepStrictEqual(result.modules['gsd-commands'], {
        currentLesson: 3,
        started: true,
        completed: false,
      });
      assert.deepStrictEqual(result.modules['command-lifecycle'], {
        currentLesson: 0,
        started: false,
        completed: false,
      });
    });

    test('v4 data passes through unchanged (idempotent)', () => {
      const { migrateV3toV4 } = require('../lib/progress.cjs');
      const v4 = {
        version: 4,
        currentModule: 'gsd-commands',
        currentLesson: 3,
        modules: {
          'gsd-commands': { currentLesson: 3, started: true, completed: true },
        },
      };
      const result = migrateV3toV4(v4);
      assert.deepStrictEqual(result, v4);
    });

    test('v3 data with no modules migrates cleanly to v4', () => {
      const { migrateV3toV4 } = require('../lib/progress.cjs');
      const v3 = {
        version: 3,
        currentModule: null,
        currentLesson: 0,
        modules: {},
      };
      const result = migrateV3toV4(v3);
      assert.strictEqual(result.version, 4);
      assert.deepStrictEqual(result.modules, {});
    });
  });

  describe('isFirstRun()', () => {
    test('returns true for empty modules map', () => {
      const { isFirstRun } = require('../lib/progress.cjs');
      const progress = { version: 4, currentModule: null, currentLesson: 0, modules: {} };
      assert.strictEqual(isFirstRun(progress), true);
    });

    test('returns true when all module entries have started: false', () => {
      const { isFirstRun } = require('../lib/progress.cjs');
      const progress = {
        version: 4,
        currentModule: null,
        currentLesson: 0,
        modules: {
          'gsd-commands': { currentLesson: 0, started: false, completed: false },
        },
      };
      assert.strictEqual(isFirstRun(progress), true);
    });

    test('returns false when any module entry has started: true', () => {
      const { isFirstRun } = require('../lib/progress.cjs');
      const progress = {
        version: 4,
        currentModule: 'gsd-commands',
        currentLesson: 3,
        modules: {
          'gsd-commands': { currentLesson: 3, started: true, completed: false },
        },
      };
      assert.strictEqual(isFirstRun(progress), false);
    });
  });

  describe('loadProgress() with v1 data on disk', () => {
    test('auto-migrates v1 file through v1->v2->v3->v4 and writes back', () => {
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
      assert.strictEqual(result.version, 4);
      assert.deepStrictEqual(result.modules, {
        'command-lifecycle': { currentLesson: 5, started: true, completed: false },
      });

      // Verify it was written back to disk as v4
      const onDisk = JSON.parse(fs.readFileSync(path.join(dir, 'progress.json'), 'utf-8'));
      assert.strictEqual(onDisk.version, 4);
      assert.deepStrictEqual(onDisk.modules, {
        'command-lifecycle': { currentLesson: 5, started: true, completed: false },
      });
    });

    test('does not rewrite v4 data', () => {
      const { loadProgress } = require('../lib/progress.cjs');
      const dir = path.join(tmpDir, '.planning', 'learn');
      fs.mkdirSync(dir, { recursive: true });
      const v4Data = {
        version: 4,
        currentModule: 'command-lifecycle',
        currentLesson: 3,
        modules: { 'command-lifecycle': { currentLesson: 3, started: true, completed: false } },
      };
      fs.writeFileSync(path.join(dir, 'progress.json'), JSON.stringify(v4Data));

      const result = loadProgress(tmpDir);
      assert.deepStrictEqual(result, v4Data);
    });
  });

  describe('loadProgress() with v2 data on disk', () => {
    test('auto-migrates v2 file to v4 and writes back', () => {
      const { loadProgress } = require('../lib/progress.cjs');
      const dir = path.join(tmpDir, '.planning', 'learn');
      fs.mkdirSync(dir, { recursive: true });
      const v2Data = {
        version: 2,
        currentModule: 'gsd-commands',
        currentLesson: 3,
        modules: { 'gsd-commands': { currentLesson: 3, started: true } },
      };
      fs.writeFileSync(path.join(dir, 'progress.json'), JSON.stringify(v2Data));

      const result = loadProgress(tmpDir);
      assert.strictEqual(result.version, 4);
      assert.deepStrictEqual(result.modules['gsd-commands'], {
        currentLesson: 3,
        started: true,
        completed: false,
      });

      // Verify persisted to disk
      const onDisk = JSON.parse(fs.readFileSync(path.join(dir, 'progress.json'), 'utf-8'));
      assert.strictEqual(onDisk.version, 4);
    });
  });

  describe('saveProgress()', () => {
    test('writes JSON to .planning/learn/progress.json creating directories', () => {
      const { saveProgress } = require('../lib/progress.cjs');
      const data = { version: 4, currentModule: 'test', currentLesson: 2, modules: {} };
      saveProgress(tmpDir, data);
      const filePath = path.join(tmpDir, '.planning', 'learn', 'progress.json');
      assert.ok(fs.existsSync(filePath), 'progress.json should exist');
      const contents = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      assert.deepStrictEqual(contents, data);
    });
  });

  describe('round-trip', () => {
    test('loadProgress after saveProgress returns the same v4 data', () => {
      const { loadProgress, saveProgress } = require('../lib/progress.cjs');
      const data = {
        version: 4,
        currentModule: 'command-lifecycle',
        currentLesson: 3,
        modules: {
          'command-lifecycle': { currentLesson: 3, started: true, completed: false },
        },
      };
      saveProgress(tmpDir, data);
      const loaded = loadProgress(tmpDir);
      assert.deepStrictEqual(loaded, data);
    });
  });
});
