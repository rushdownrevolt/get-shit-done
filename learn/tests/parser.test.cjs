'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const FIXTURE_SOURCE = `/**
 * Core — Shared utilities, constants, and internal helpers
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── Path helpers ────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT = 30000;

/** Normalize a relative path to always use forward slashes. */
function toPosixPath(p) {
  return p.split(path.sep).join('/');
}

/**
 * Read a file safely, returning null on error.
 */
function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

module.exports = {
  toPosixPath,
  safeReadFile,
  DEFAULT_TIMEOUT,
};
`;

describe('parser.cjs', () => {
  let parseSourceFile;

  // Load the module under test
  test('module loads', () => {
    const parser = require('../lib/parser.cjs');
    parseSourceFile = parser.parseSourceFile;
    assert.ok(typeof parseSourceFile === 'function', 'parseSourceFile should be a function');
  });

  describe('parseSourceFile with fixture', () => {
    let parsed;
    const fs = require('fs');
    const os = require('os');
    let tmpFile;

    test('setup fixture', () => {
      const { parseSourceFile } = require('../lib/parser.cjs');
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-parser-test-'));
      tmpFile = path.join(tmpDir, 'fixture.cjs');
      fs.writeFileSync(tmpFile, FIXTURE_SOURCE, 'utf-8');
      parsed = parseSourceFile(tmpFile);
    });

    test('returns correct metadata', () => {
      assert.ok(parsed.filePath.endsWith('fixture.cjs'));
      assert.strictEqual(parsed.fileName, 'fixture.cjs');
      assert.strictEqual(parsed.lineCount, FIXTURE_SOURCE.split('\n').length);
    });

    test('extractModuleDoc finds top-level JSDoc', () => {
      assert.ok(parsed.moduleDoc !== null, 'moduleDoc should not be null');
      assert.ok(parsed.moduleDoc.includes('Shared utilities'), 'moduleDoc should contain module description');
    });

    test('extractRequires finds all require calls', () => {
      assert.strictEqual(parsed.requires.length, 3);

      const fsReq = parsed.requires.find(r => r.module === 'fs');
      assert.ok(fsReq, 'should find fs require');
      assert.strictEqual(fsReq.binding, 'fs');
      assert.strictEqual(fsReq.isDestructured, false);

      const execReq = parsed.requires.find(r => r.module === 'child_process');
      assert.ok(execReq, 'should find child_process require');
      assert.strictEqual(execReq.isDestructured, true);
    });

    test('extractExports parses module.exports keys', () => {
      assert.ok(Array.isArray(parsed.exports));
      assert.ok(parsed.exports.includes('toPosixPath'));
      assert.ok(parsed.exports.includes('safeReadFile'));
      assert.ok(parsed.exports.includes('DEFAULT_TIMEOUT'));
    });

    test('extractFunctions finds function declarations', () => {
      assert.ok(Array.isArray(parsed.functions));
      assert.ok(parsed.functions.length >= 2, 'should find at least 2 functions');

      const toPosix = parsed.functions.find(f => f.name === 'toPosixPath');
      assert.ok(toPosix, 'should find toPosixPath function');
      assert.ok(toPosix.startLine > 0, 'should have startLine');
      assert.ok(toPosix.endLine >= toPosix.startLine, 'endLine >= startLine');
      assert.ok(toPosix.code.includes('split'), 'code should contain function body');
      assert.ok(toPosix.jsdoc.includes('Normalize'), 'should capture preceding JSDoc');

      const safeRead = parsed.functions.find(f => f.name === 'safeReadFile');
      assert.ok(safeRead, 'should find safeReadFile function');
      assert.ok(safeRead.jsdoc.includes('Read a file safely'), 'should capture multi-line JSDoc');
    });

    test('extractSections finds separator comments', () => {
      assert.ok(Array.isArray(parsed.sections));
      assert.ok(parsed.sections.length >= 1, 'should find at least 1 section');
      const pathSection = parsed.sections.find(s => s.name === 'Path helpers');
      assert.ok(pathSection, 'should find "Path helpers" section');
      assert.ok(pathSection.line > 0, 'section should have line number');
    });

    test('extractConstants finds UPPER_CASE constants', () => {
      assert.ok(Array.isArray(parsed.constants));
      const timeout = parsed.constants.find(c => c.name === 'DEFAULT_TIMEOUT');
      assert.ok(timeout, 'should find DEFAULT_TIMEOUT constant');
      assert.ok(timeout.line > 0, 'constant should have line number');
    });
  });

  describe('integration test with real GSD file', () => {
    test('parseSourceFile handles real core.cjs', () => {
      const { parseSourceFile } = require('../lib/parser.cjs');
      const corePath = path.resolve(__dirname, '..', '..', 'get-shit-done', 'bin', 'lib', 'core.cjs');
      const fs = require('fs');

      // Skip if core.cjs doesn't exist (CI environment)
      if (!fs.existsSync(corePath)) {
        return;
      }

      const parsed = parseSourceFile(corePath);

      // Verify known exports exist
      assert.ok(parsed.exports.includes('output'), 'should find output export');
      assert.ok(parsed.exports.includes('error'), 'should find error export');
      assert.ok(parsed.exports.includes('safeReadFile'), 'should find safeReadFile export');
      assert.ok(parsed.exports.includes('toPosixPath'), 'should find toPosixPath export');
      assert.ok(parsed.exports.includes('MODEL_PROFILES'), 'should find MODEL_PROFILES export');

      // Verify it found functions
      assert.ok(parsed.functions.length > 5, 'core.cjs should have many functions');
      const toPosix = parsed.functions.find(f => f.name === 'toPosixPath');
      assert.ok(toPosix, 'should find toPosixPath function');

      // Verify it found sections
      assert.ok(parsed.sections.length > 0, 'core.cjs should have section separators');

      // Verify it found requires
      assert.ok(parsed.requires.length >= 3, 'core.cjs should have at least 3 requires');

      // Verify module doc
      assert.ok(parsed.moduleDoc !== null, 'core.cjs should have module doc');
      assert.ok(parsed.moduleDoc.includes('Core'), 'module doc should mention Core');

      // Verify constants
      assert.ok(parsed.constants.length > 0, 'core.cjs should have constants');
      const modelProfiles = parsed.constants.find(c => c.name === 'MODEL_PROFILES');
      assert.ok(modelProfiles, 'should find MODEL_PROFILES constant');
    });
  });
});
