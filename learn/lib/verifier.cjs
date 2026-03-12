'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Check if a file exists and contains expected structural patterns.
 *
 * @param {string} filePath - Absolute path to check.
 * @param {Array<{pattern: RegExp, description: string}>} checks - Structural checks.
 * @returns {{ passed: boolean, results: Array<{check: string, passed: boolean}> }}
 */
function verifyArtifact(filePath, checks) {
  const results = [];

  if (!fs.existsSync(filePath)) {
    return { passed: false, results: [{ check: 'File exists: ' + filePath, passed: false }] };
  }
  results.push({ check: 'File exists: ' + filePath, passed: true });

  const content = fs.readFileSync(filePath, 'utf-8');
  for (const { pattern, description } of checks) {
    results.push({ check: description, passed: pattern.test(content) });
  }

  return {
    passed: results.every(r => r.passed),
    results,
  };
}

/**
 * Load a project spec and run verification against all artifacts.
 *
 * @param {string} cwd - Working directory for resolving artifact paths.
 * @param {string} specPath - Absolute path to spec.json.
 * @returns {{ passed: boolean, artifacts: Array<{description: string, passed: boolean, results: Array}> }}
 */
function runVerification(cwd, specPath) {
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
  const artifacts = [];

  for (const artifact of spec.artifacts) {
    const filePath = path.join(cwd, artifact.path);
    const checks = (artifact.checks || []).map(c => ({
      pattern: new RegExp(c.pattern),
      description: c.description,
    }));
    const result = verifyArtifact(filePath, checks);
    artifacts.push({
      description: artifact.description,
      passed: result.passed,
      results: result.results,
    });
  }

  return {
    passed: artifacts.every(a => a.passed),
    artifacts,
  };
}

module.exports = { verifyArtifact, runVerification };
