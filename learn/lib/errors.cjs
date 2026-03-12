'use strict';

const fs = require('fs');
const path = require('path');
const { style } = require('./terminal.cjs');

/**
 * Validate that the current working directory is the GSD repo root.
 *
 * @param {string} cwd - Directory to check.
 * @returns {{ valid: boolean, message?: string }}
 */
function validateEnvironment(cwd) {
  const toolsPath = path.join(cwd, 'get-shit-done', 'bin', 'gsd-tools.cjs');
  if (fs.existsSync(toolsPath)) {
    return { valid: true };
  }
  return {
    valid: false,
    message: 'gsd-learn must be run from the GSD repository root.\n' +
      'Current directory: ' + cwd + '\n' +
      'Expected to find: get-shit-done/bin/gsd-tools.cjs',
  };
}

/**
 * Format an error message for display to the user (no stack traces).
 *
 * @param {string} message - Error description.
 * @returns {string} Styled error string.
 */
function formatError(message) {
  return style('Error', 'red', 'bold') + ' ' + message + '\n';
}

module.exports = { validateEnvironment, formatError };
