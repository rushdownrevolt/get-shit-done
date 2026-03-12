'use strict';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('verifier.cjs', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-verifier-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('verifyArtifact()', () => {
    test('returns { passed: false } when file does not exist', () => {
      const { verifyArtifact } = require('../lib/verifier.cjs');
      const result = verifyArtifact(path.join(tmpDir, 'nonexistent.cjs'), []);
      assert.strictEqual(result.passed, false);
      assert.ok(Array.isArray(result.results));
      assert.strictEqual(result.results[0].passed, false);
    });

    test('returns { passed: true, results: [...] } when file exists and all regex patterns match', () => {
      const { verifyArtifact } = require('../lib/verifier.cjs');
      const filePath = path.join(tmpDir, 'echo.cjs');
      fs.writeFileSync(filePath, 'module.exports = { cmdEcho };\nfunction cmdEcho() {}');
      const checks = [
        { pattern: /module\.exports/, description: 'File exports a module' },
        { pattern: /function\s+cmd/, description: 'Follows cmd* naming convention' },
      ];
      const result = verifyArtifact(filePath, checks);
      assert.strictEqual(result.passed, true);
      assert.strictEqual(result.results.length, 3); // File exists + 2 checks
      assert.ok(result.results.every(r => r.passed));
    });

    test('returns { passed: false } when file exists but a pattern does not match', () => {
      const { verifyArtifact } = require('../lib/verifier.cjs');
      const filePath = path.join(tmpDir, 'echo.cjs');
      fs.writeFileSync(filePath, 'module.exports = { cmdEcho };');
      const checks = [
        { pattern: /module\.exports/, description: 'File exports a module' },
        { pattern: /class\s+Echo/, description: 'Has Echo class' },
      ];
      const result = verifyArtifact(filePath, checks);
      assert.strictEqual(result.passed, false);
    });

    test('results array includes a File exists check plus one entry per structural check', () => {
      const { verifyArtifact } = require('../lib/verifier.cjs');
      const filePath = path.join(tmpDir, 'test.cjs');
      fs.writeFileSync(filePath, 'const x = 1;');
      const checks = [
        { pattern: /const/, description: 'Has const' },
      ];
      const result = verifyArtifact(filePath, checks);
      assert.strictEqual(result.results.length, 2);
      assert.ok(result.results[0].check.includes('File exists'));
    });
  });

  describe('runVerification()', () => {
    test('loads a spec.json, runs verifyArtifact for each artifact, returns aggregate', () => {
      const { runVerification } = require('../lib/verifier.cjs');

      // Create spec
      const specDir = path.join(tmpDir, 'project');
      fs.mkdirSync(specDir, { recursive: true });
      const spec = {
        id: 'test-project',
        artifacts: [
          {
            description: 'Test file',
            path: 'src/test.cjs',
            checks: [
              { pattern: 'module\\.exports', description: 'Exports a module' },
            ],
          },
        ],
      };
      fs.writeFileSync(path.join(specDir, 'spec.json'), JSON.stringify(spec));

      // Create the artifact file
      const srcDir = path.join(tmpDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(path.join(srcDir, 'test.cjs'), 'module.exports = {};');

      const result = runVerification(tmpDir, path.join(specDir, 'spec.json'));
      assert.strictEqual(result.passed, true);
      assert.ok(Array.isArray(result.artifacts));
      assert.strictEqual(result.artifacts.length, 1);
      assert.strictEqual(result.artifacts[0].description, 'Test file');
    });
  });
});
