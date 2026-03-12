'use strict';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('lessons.cjs', () => {
  let tmpDir;
  let contentDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-lessons-test-'));
    contentDir = path.join(tmpDir, 'content');

    // Create a test module structure
    const moduleDir = path.join(contentDir, 'modules', 'command-lifecycle');
    const lessonsDir = path.join(moduleDir, 'lessons');
    fs.mkdirSync(lessonsDir, { recursive: true });

    // module.json
    fs.writeFileSync(path.join(moduleDir, 'module.json'), JSON.stringify({
      id: 'command-lifecycle',
      title: 'Command Lifecycle',
      description: 'Test module description',
    }));

    // Two lesson files (out of order to test sorting)
    fs.writeFileSync(path.join(lessonsDir, '02-second.json'), JSON.stringify({
      id: 'second',
      title: 'Second Lesson',
      lessonNumber: 2,
      objective: 'Learn the second thing',
      content: [{ type: 'text', value: 'Hello' }],
      conceptMap: 'Tool Dispatch',
      successCriteria: 'You understand the second thing',
    }));

    fs.writeFileSync(path.join(lessonsDir, '01-first.json'), JSON.stringify({
      id: 'first',
      title: 'First Lesson',
      lessonNumber: 1,
      objective: 'Learn the first thing',
      content: [{ type: 'text', value: 'Welcome' }],
      conceptMap: null,
      successCriteria: 'You understand the first thing',
    }));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('loadModule()', () => {
    test('returns object with id, title, description, and ordered lessons array', () => {
      const { loadModule } = require('../lib/lessons.cjs');
      const mod = loadModule('command-lifecycle', contentDir);
      assert.strictEqual(mod.id, 'command-lifecycle');
      assert.strictEqual(mod.title, 'Command Lifecycle');
      assert.strictEqual(mod.description, 'Test module description');
      assert.ok(Array.isArray(mod.lessons), 'lessons should be an array');
      assert.strictEqual(mod.lessons.length, 2);
    });

    test('returns lessons sorted by filename prefix', () => {
      const { loadModule } = require('../lib/lessons.cjs');
      const mod = loadModule('command-lifecycle', contentDir);
      assert.strictEqual(mod.lessons[0].id, 'first');
      assert.strictEqual(mod.lessons[1].id, 'second');
    });

    test('each lesson has required fields', () => {
      const { loadModule } = require('../lib/lessons.cjs');
      const mod = loadModule('command-lifecycle', contentDir);
      const lesson = mod.lessons[0];
      assert.ok('id' in lesson, 'lesson should have id');
      assert.ok('title' in lesson, 'lesson should have title');
      assert.ok('lessonNumber' in lesson, 'lesson should have lessonNumber');
      assert.ok('objective' in lesson, 'lesson should have objective');
      assert.ok(Array.isArray(lesson.content), 'lesson content should be array');
      assert.ok('conceptMap' in lesson, 'lesson should have conceptMap');
      assert.ok('successCriteria' in lesson, 'lesson should have successCriteria');
    });

    test('throws descriptive error when module directory does not exist', () => {
      const { loadModule } = require('../lib/lessons.cjs');
      assert.throws(
        () => loadModule('nonexistent-module', contentDir),
        (err) => {
          assert.ok(err.message.includes('nonexistent-module'), 'error should mention module id');
          return true;
        }
      );
    });

    test('throws descriptive error when module.json is missing', () => {
      const { loadModule } = require('../lib/lessons.cjs');
      // Create module dir without module.json
      const noJsonDir = path.join(contentDir, 'modules', 'no-json');
      fs.mkdirSync(noJsonDir, { recursive: true });
      assert.throws(
        () => loadModule('no-json', contentDir),
        (err) => {
          assert.ok(err.message.includes('module.json'), 'error should mention module.json');
          return true;
        }
      );
    });
  });

  describe('real content files', () => {
    test('loads the actual command-lifecycle module with 5 lessons', () => {
      const { loadModule } = require('../lib/lessons.cjs');
      const realContentDir = path.join(__dirname, '..', 'content');
      const mod = loadModule('command-lifecycle', realContentDir);
      assert.strictEqual(mod.id, 'command-lifecycle');
      assert.strictEqual(mod.lessons.length, 5, 'should have 5 lessons');
      assert.strictEqual(mod.lessons[0].lessonNumber, 1);
      assert.strictEqual(mod.lessons[4].lessonNumber, 5);
    });
  });
});
