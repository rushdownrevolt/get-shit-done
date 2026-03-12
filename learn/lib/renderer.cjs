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
 * @param {string} [moduleDir] - Absolute path to the module directory (for concept map).
 * @returns {string} Formatted lesson string with ANSI codes.
 */
function renderLesson(lesson, currentIndex, totalLessons, moduleDir) {
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
    if (moduleDir) {
      parts.push(renderConceptMap(moduleDir, lesson.conceptMap));
    } else {
      parts.push(style('Architecture Overview:', 'bold', 'cyan') + '\n\n  No concept map available\n\n');
    }
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
 * Render bridge text in a Unicode box-drawing bordered section (dim styled).
 */
function renderBridgeSection(bridgeText) {
  const maxWidth = 56;
  const top = '\u250C' + '\u2500'.repeat(maxWidth + 2) + '\u2510';
  const bot = '\u2514' + '\u2500'.repeat(maxWidth + 2) + '\u2518';
  // Wrap bridge text to fit within the box
  const words = bridgeText.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if (current.length + word.length + 1 > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current);
  const body = lines.map(line => '\u2502 ' + line.padEnd(maxWidth) + ' \u2502').join('\n');
  return style(top + '\n' + body + '\n' + bot, 'dim');
}

/**
 * Render a single part (one content section) of a lesson.
 *
 * @param {object} lesson - Lesson data object.
 * @param {number} partIndex - Zero-based index of the part to render.
 * @param {number} totalParts - Total number of parts (content.length + concept map if present).
 * @param {number} currentLessonIndex - Zero-based index of current lesson.
 * @param {number} totalLessons - Total number of lessons in module.
 * @param {string} [moduleDir] - Absolute path to the module directory (for concept map).
 * @returns {string} Formatted part string with ANSI codes.
 */
function renderPart(lesson, partIndex, totalParts, currentLessonIndex, totalLessons, moduleDir) {
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

  // 4. Objective — first part only
  if (partIndex === 0) {
    parts.push(style('What you\'ll learn:', 'yellow', 'bold'));
    parts.push('\n');
    parts.push(lesson.objective);
    parts.push('\n\n');
    parts.push(horizontalRule(60));
    parts.push('\n\n');
  }

  // 5. Progressive accumulation: render groups 0..partIndex
  const groups = groupContentItems(lesson.content);
  const lastGroupIndex = Math.min(partIndex, groups.length - 1);
  const isConceptMapPart = lesson.conceptMap && partIndex === groups.length;

  // Render all accumulated groups
  for (let i = 0; i <= lastGroupIndex; i++) {
    const group = groups[i];
    const isCurrent = (i === partIndex);

    // Focus line: current group gets triangle-right marker
    if (isCurrent) {
      parts.push(style('\u25B6 ', 'cyan') + style(group.focus, 'dim'));
    } else {
      parts.push(style('  ' + group.focus, 'dim'));
    }
    parts.push('\n\n');

    // Render ALL items within the group together (text + code as one unit)
    for (const item of group.items) {
      renderContentSection(item, parts);
    }

    // Bridge section (per-group, not per-item)
    parts.push(renderBridgeSection(group.bridge));
    parts.push('\n\n');

    // Separator between accumulated groups (not between items within a group)
    if (i < partIndex) {
      parts.push(horizontalRule(60));
      parts.push('\n\n');
    }
  }

  // Concept map as synthetic final part (accumulates all content groups first)
  if (isConceptMapPart) {
    parts.push(horizontalRule(60));
    parts.push('\n\n');
    parts.push(style('Architecture Overview', 'dim'));
    parts.push('\n\n');
    if (moduleDir) {
      parts.push(renderConceptMap(moduleDir, lesson.conceptMap));
    } else {
      parts.push(style('Architecture Overview:', 'bold', 'cyan') + '\n\n  No concept map available\n\n');
    }
    parts.push('\n');
  }

  // 6. Horizontal rule
  parts.push(horizontalRule(60));
  parts.push('\n\n');

  // 7. Success criteria — last part only
  if (partIndex === totalParts - 1) {
    renderSuccessCriteria(lesson, parts);
  }

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

/**
 * Group a flat content array into logical groups where code/diagram blocks
 * merge with FOLLOWING text into single rendered "parts".
 *
 * Rules:
 * - Code blocks start new groups (they are "anchors")
 * - The NEXT text block after a code block attaches to that code's group
 *   (the explanation after the snippet gives it context)
 * - A text block NOT following a code block is its own standalone group
 * - Text+text blocks remain separate (no aggressive merging)
 * - A trailing code block with no following text is a standalone group
 *
 * Example: [text, code, text, code, text] -> [text] [code+text] [code+text]
 *
 * @param {Array} content - Flat array of content items.
 * @returns {Array<{items: Array, focus: string, bridge: string}>} Array of groups.
 */
function groupContentItems(content) {
  const groups = [];
  let pendingCode = null; // a code group waiting for its following text

  for (const item of content) {
    if (item.type === 'code') {
      // Finalize any previous pending code group (code with no following text)
      if (pendingCode) {
        groups.push(pendingCode);
      }
      // Start a new pending code group
      pendingCode = { items: [item], focus: item.focus || '', bridge: item.bridge || '' };
    } else {
      // Text or project block
      if (pendingCode) {
        // This text follows a code block -- attach to code's group
        // Use the text block's focus/bridge (the explanation carries the semantics)
        pendingCode.items.push(item);
        pendingCode.focus = item.focus || pendingCode.focus;
        pendingCode.bridge = item.bridge || pendingCode.bridge;
        groups.push(pendingCode);
        pendingCode = null;
      } else {
        // Standalone text/project block (not following a code block)
        groups.push({ items: [item], focus: item.focus, bridge: item.bridge });
      }
    }
  }
  // Finalize any trailing code group with no following text
  if (pendingCode) groups.push(pendingCode);

  return groups;
}

module.exports = { renderLesson, renderPart, renderProgressDots, renderCompletionBanner, groupContentItems };
