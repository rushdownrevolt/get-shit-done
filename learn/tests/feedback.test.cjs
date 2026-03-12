'use strict';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('feedback.cjs', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-feedback-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('loadFeedback()', () => {
    test('returns default structure when file missing', () => {
      const { loadFeedback } = require('../lib/feedback.cjs');
      const result = loadFeedback(tmpDir);
      assert.deepStrictEqual(result, { version: 1, projects: {} });
    });
  });

  describe('recordEvent()', () => {
    test('creates project entry and appends event with ISO timestamp', () => {
      const { recordEvent, loadFeedback } = require('../lib/feedback.cjs');
      recordEvent(tmpDir, 'test-project', 'verify_attempt', { passed: false });
      const fb = loadFeedback(tmpDir);
      assert.ok(fb.projects['test-project']);
      assert.strictEqual(fb.projects['test-project'].events.length, 1);
      const evt = fb.projects['test-project'].events[0];
      assert.strictEqual(evt.type, 'verify_attempt');
      assert.ok(evt.timestamp.match(/^\d{4}-\d{2}-\d{2}T/));
    });

    test('sets startedAt on project_started event (only first time)', () => {
      const { recordEvent, loadFeedback } = require('../lib/feedback.cjs');
      recordEvent(tmpDir, 'proj1', 'project_started', {});
      const fb1 = loadFeedback(tmpDir);
      const startedAt = fb1.projects['proj1'].startedAt;
      assert.ok(startedAt);

      // Second project_started should NOT overwrite
      recordEvent(tmpDir, 'proj1', 'project_started', {});
      const fb2 = loadFeedback(tmpDir);
      assert.strictEqual(fb2.projects['proj1'].startedAt, startedAt);
    });

    test('sets completedAt on project_completed event', () => {
      const { recordEvent, loadFeedback } = require('../lib/feedback.cjs');
      recordEvent(tmpDir, 'proj2', 'project_completed', {});
      const fb = loadFeedback(tmpDir);
      assert.ok(fb.projects['proj2'].completedAt);
    });

    test('multiple events accumulate in the events array', () => {
      const { recordEvent, loadFeedback } = require('../lib/feedback.cjs');
      recordEvent(tmpDir, 'proj3', 'project_started', {});
      recordEvent(tmpDir, 'proj3', 'verify_attempt', { passed: false });
      recordEvent(tmpDir, 'proj3', 'hint_requested', {});
      recordEvent(tmpDir, 'proj3', 'verify_attempt', { passed: true });
      const fb = loadFeedback(tmpDir);
      assert.strictEqual(fb.projects['proj3'].events.length, 4);
    });
  });

  describe('saveFeedback()', () => {
    test('creates directory recursively if missing', () => {
      const { saveFeedback } = require('../lib/feedback.cjs');
      const deepDir = path.join(tmpDir, 'nested');
      saveFeedback(deepDir, { version: 1, projects: {} });
      const filePath = path.join(deepDir, '.planning', 'learn', 'feedback.json');
      assert.ok(fs.existsSync(filePath));
    });
  });
});
