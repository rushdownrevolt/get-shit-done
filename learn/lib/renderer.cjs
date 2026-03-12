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
    renderContentSection(section, parts);
  }

  // 7. Concept map
  if (lesson.conceptMap) {
    parts.push(renderConceptMap(lesson.conceptMap));
    parts.push('\n');
  }

  // 8. Success criteria
  renderSuccessCriteria(lesson, parts);

  // 9. Horizontal rule
  parts.push(horizontalRule(60));
  parts.push('\n\n');

  // 10. Navigation footer
  parts.push('  [n] Next  [p] Previous  [c] Copy  [q] Quit');
  parts.push('\n');

  return parts.join('');
}

/**
 * Render a single content section to parts array.
 * Shared by renderLesson and renderPart.
 */
function renderContentSection(section, parts) {
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

/**
 * Render the success criteria footer (shared by renderLesson and renderPart).
 */
function renderSuccessCriteria(lesson, parts) {
  parts.push(style('You\'ll know you\'ve got it when:', 'green', 'bold'));
  parts.push('\n');
  const hintIdx = lesson.successCriteria.indexOf('\n\nWant to go deeper?');
  if (hintIdx !== -1) {
    parts.push(lesson.successCriteria.substring(0, hintIdx));
    parts.push('\n\n');
    parts.push(style(lesson.successCriteria.substring(hintIdx + 2), 'lightBlue'));
  } else {
    parts.push(lesson.successCriteria);
  }
  parts.push('\n\n');
}

/**
 * Get a dim block header label for a content section.
 */
function getBlockHeader(section) {
  if (section.type === 'text') {
    const trimmed = section.value.replace(/\n/g, ' ').trim();
    if (trimmed.length > 40) {
      return trimmed.substring(0, 40) + '...';
    }
    return trimmed || 'Explanation';
  } else if (section.type === 'code') {
    if (section.source) {
      return section.source.file + ':' + (section.source.startLine || 1);
    }
    return 'Code Example';
  } else if (section.type === 'project') {
    return 'Your Mission';
  }
  return 'Content';
}

/**
 * Render a single part (one content section) of a lesson.
 *
 * @param {object} lesson - Lesson data object.
 * @param {number} partIndex - Zero-based index of the part to render.
 * @param {number} totalParts - Total number of parts (content.length + concept map if present).
 * @param {number} currentLessonIndex - Zero-based index of current lesson.
 * @param {number} totalLessons - Total number of lessons in module.
 * @returns {string} Formatted part string with ANSI codes.
 */
function renderPart(lesson, partIndex, totalParts, currentLessonIndex, totalLessons) {
  const parts = [];

  // 1. Clear screen
  parts.push(clearScreen());

  // 2. Header: lesson title + position
  parts.push(style(lesson.title, 'bold', 'cyan'));
  parts.push('\n');
  parts.push(style('Lesson ' + (currentLessonIndex + 1) + ' of ' + totalLessons, 'dim'));
  parts.push('\n\n');

  // 3. Horizontal rule
  parts.push(horizontalRule(60));
  parts.push('\n\n');

  // 4. Pinned objective
  parts.push(style('What you\'ll learn:', 'yellow', 'bold'));
  parts.push('\n');
  parts.push(lesson.objective);
  parts.push('\n\n');

  // 5. Horizontal rule
  parts.push(horizontalRule(60));
  parts.push('\n\n');

  // 6. Content section or concept map
  const isConceptMapPart = lesson.conceptMap && partIndex === lesson.content.length;

  if (isConceptMapPart) {
    // Synthetic concept map part
    parts.push(style('Architecture Overview', 'dim'));
    parts.push('\n\n');
    parts.push(renderConceptMap(lesson.conceptMap));
    parts.push('\n');
  } else {
    const section = lesson.content[partIndex];
    // Block header (dim)
    parts.push(style(getBlockHeader(section), 'dim'));
    parts.push('\n\n');
    // Render the content section
    renderContentSection(section, parts);
  }

  // 7. Horizontal rule
  parts.push(horizontalRule(60));
  parts.push('\n\n');

  // 8. Pinned success criteria footer
  renderSuccessCriteria(lesson, parts);

  // 9. Progress dots
  parts.push(renderProgressDots(partIndex, totalParts));
  parts.push('\n\n');

  // 10. Navigation footer
  parts.push('  [w] Next  [q] Back  [e] Skip lesson  [c] Copy  [esc] Quit');
  parts.push('\n');

  return parts.join('');
}

/**
 * Render progress dots showing current position within a lesson's parts.
 *
 * @param {number} currentPart - Zero-based index of current part.
 * @param {number} totalParts - Total number of parts in the lesson.
 * @returns {string} Formatted progress dots with "Part X of Y" label.
 */
function renderProgressDots(currentPart, totalParts) {
  const filled = '\u25CF'; // ●
  const empty = '\u25CB';  // ○
  const dots = [];
  for (let i = 0; i < totalParts; i++) {
    if (i <= currentPart) {
      dots.push(style(filled, 'cyan'));
    } else {
      dots.push(style(empty, 'dim'));
    }
  }
  return '  ' + dots.join(' ') + '  Part ' + (currentPart + 1) + ' of ' + totalParts;
}

/**
 * Render a celebratory module completion banner.
 *
 * @param {object} opts - Banner options.
 * @param {string} opts.title - Module title.
 * @param {number} opts.lessonCount - Number of lessons in the module.
 * @param {number} opts.totalParts - Total parts across all lessons.
 * @param {number} opts.miniProjectCount - Number of mini-projects.
 * @returns {string} Formatted completion banner string.
 */
function renderCompletionBanner(opts) {
  const parts = [];
  const bar = '\u2588'.repeat(50);

  parts.push(clearScreen());
  parts.push('\n');
  parts.push(style(bar, 'cyan'));
  parts.push('\n\n');
  parts.push(style('  MODULE COMPLETE!', 'bold', 'cyan'));
  parts.push('\n\n');
  parts.push(style('  ' + opts.title, 'bold'));
  parts.push('\n\n');
  parts.push('  Lessons: ' + opts.lessonCount);
  parts.push('\n');
  parts.push('  Parts: ' + opts.totalParts);
  parts.push('\n');
  parts.push('  Mini-projects: ' + opts.miniProjectCount);
  parts.push('\n\n');
  parts.push(style(bar, 'cyan'));
  parts.push('\n');

  return parts.join('');
}

module.exports = { renderLesson, renderPart, renderProgressDots, renderCompletionBanner };
