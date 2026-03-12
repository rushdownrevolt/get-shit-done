'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Assemble a prompt from a template and context data.
 *
 * @param {string} templateName - Template file name (e.g., 'overview', 'source-dive').
 * @param {object} context - Parsed source data and lesson metadata.
 * @returns {string} Assembled prompt text.
 */
function assemblePrompt(templateName, context) {
  const templateDir = path.join(__dirname, '..', 'content', 'prompts');
  const templatePath = path.join(templateDir, templateName + '.prompt.md');
  let template = fs.readFileSync(templatePath, 'utf-8');

  // Replace all known markers with context values or defaults
  template = template.replace(/\{\{FILE_NAME\}\}/g, context.fileName || '');
  template = template.replace(/\{\{MODULE_DOC\}\}/g, context.moduleDoc || 'No module documentation.');
  template = template.replace(/\{\{MODULE_OVERVIEW\}\}/g, context.moduleOverview || 'No module overview provided.');
  template = template.replace(/\{\{EXPORTS\}\}/g, formatExports(context.exports));
  template = template.replace(/\{\{FUNCTIONS\}\}/g, formatFunctions(context.functions));
  template = template.replace(/\{\{REQUIRES\}\}/g, formatRequires(context.requires));
  template = template.replace(/\{\{SOURCE_CODE\}\}/g, context.sourceCode || '');
  template = template.replace(/\{\{LESSON_NUMBER\}\}/g, String(context.lessonNumber || 1));
  template = template.replace(/\{\{LESSON_TITLE\}\}/g, context.lessonTitle || '');
  template = template.replace(/\{\{FOCUS\}\}/g, context.focus || '');

  return template;
}

/**
 * Format exports list as bullet points.
 */
function formatExports(exports) {
  if (!exports || exports.length === 0) return 'None';
  return exports.map(function (e) { return '- `' + e + '`'; }).join('\n');
}

/**
 * Format functions with code blocks and JSDoc.
 */
function formatFunctions(functions) {
  if (!functions || functions.length === 0) return 'None';
  return functions.map(function (f) {
    return '### `' + f.name + '`\n' +
      (f.jsdoc ? f.jsdoc + '\n' : '') +
      'Lines ' + f.startLine + '-' + f.endLine + '\n' +
      '```javascript\n' + f.code + '\n```';
  }).join('\n\n');
}

/**
 * Format requires list as bullet points.
 */
function formatRequires(requires) {
  if (!requires || requires.length === 0) return 'None';
  return requires.map(function (r) {
    return '- `' + r.binding + '` from `' + r.module + '`' +
      (r.isDestructured ? ' (destructured)' : '');
  }).join('\n');
}

module.exports = { assemblePrompt };
