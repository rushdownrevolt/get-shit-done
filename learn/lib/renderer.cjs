'use strict';

const path = require('path');
const { style, clearScreen, horizontalRule, highlightJS, oscLink, renderCodeBlock } = require('./terminal.cjs');
const { renderConceptMap } = require('./concept-map.cjs');

/**
 * Render a lesson to a string (pure function, no stdout writes).
 *
 * @param {object} lesson - Lesson data object.
 * @param {number} currentIndex - Zero-based index of current lesson.
 * @param {number} totalLessons - Total number of lessons in module.
 * @returns {string} Formatted lesson string with ANSI codes.
 */
function renderLesson(lesson, currentIndex, totalLessons) {
  const parts = [];

  // 1. Clear screen
  parts.push(clearScreen());

  // 2. Header: lesson title
  parts.push(style(lesson.title, 'bold', 'cyan'));
  parts.push('\n');

  // 3. Position indicator
  parts.push(style('Lesson ' + (currentIndex + 1) + ' of ' + totalLessons, 'dim'));
  parts.push('\n\n');

  // 4. Horizontal rule
  parts.push(horizontalRule(60));
  parts.push('\n\n');

  // 5. Objective
  parts.push(style('What you\'ll learn:', 'yellow', 'bold'));
  parts.push('\n');
  parts.push(lesson.objective);
  parts.push('\n\n');

  // 6. Content sections
  for (const section of lesson.content) {
    if (section.type === 'text') {
      parts.push(section.value);
      parts.push('\n\n');
    } else if (section.type === 'project') {
      parts.push(style('Your Mission:', 'yellow', 'bold'));
      parts.push('\n');
      parts.push(section.task);
      parts.push('\n\n');
      if (section.deliverables && section.deliverables.length > 0) {
        parts.push(style('Deliverables:', 'bold'));
        parts.push('\n');
        section.deliverables.forEach((d, i) => {
          parts.push('  ' + (i + 1) + '. ' + d);
          parts.push('\n');
        });
        parts.push('\n');
      }
      parts.push(style('Verify: ', 'green') + section.verifyCommand);
      parts.push('\n');
      parts.push(style('Stuck? ', 'cyan') + section.hintCommand);
      parts.push('\n\n');
    } else if (section.type === 'code') {
      if (section.source) {
        const absPath = path.resolve(process.cwd(), section.source.file);
        const startLine = section.source.startLine || 1;
        const uri = 'vscode://file/' + absPath + ':' + startLine;
        const displayText = section.source.file + ':' + startLine;
        parts.push(style(oscLink(uri, displayText), 'dim', 'underline'));
        parts.push('\n');
      }
      const codeOpts = {
        highlight: section.highlight,
        startLine: section.source ? (section.source.startLine || 1) : 1,
      };
      parts.push(renderCodeBlock(section.value, codeOpts));
      parts.push('\n\n');
    }
  }

  // 7. Concept map
  if (lesson.conceptMap) {
    parts.push(renderConceptMap(lesson.conceptMap));
    parts.push('\n');
  }

  // 8. Success criteria
  parts.push(style('You\'ll know you\'ve got it when:', 'green', 'bold'));
  parts.push('\n');
  parts.push(lesson.successCriteria);
  parts.push('\n\n');

  // 9. Horizontal rule
  parts.push(horizontalRule(60));
  parts.push('\n\n');

  // 10. Navigation footer
  parts.push('  [n] Next  [p] Previous  [c] Copy  [q] Quit');
  parts.push('\n');

  return parts.join('');
}

module.exports = { renderLesson };
