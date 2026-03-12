'use strict';

const { style, clearScreen, horizontalRule, highlightJS } = require('./terminal.cjs');
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
    } else if (section.type === 'code') {
      parts.push(style('    \u2502 ', 'dim'));
      const highlighted = highlightJS(section.value);
      const lines = highlighted.split('\n');
      parts.push(lines.join('\n' + style('    \u2502 ', 'dim')));
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
  parts.push('  [n] Next  [p] Previous  [q] Quit');
  parts.push('\n');

  return parts.join('');
}

module.exports = { renderLesson };
