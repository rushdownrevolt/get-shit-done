'use strict';

const { CONCEPT_MAP } = require('./concept-map.cjs');

/**
 * Map section names to labels in the concept map diagram.
 */
const sectionMap = {
  'entry-point': 'Command Spec',
  'command-spec': 'Command Spec',
  'workflow': 'Workflow',
  'tool-dispatch': 'Tool Dispatch',
  'state': 'State',
  'config': 'Config',
  'phase': 'Phase',
  'overview': null,
};

/**
 * Format a lesson as LLM-friendly markdown for clipboard.
 * Pure function -- no side effects, no ANSI codes.
 *
 * @param {object} lesson - Lesson data object.
 * @param {number} currentIndex - Zero-based index of current lesson.
 * @param {number} totalLessons - Total lessons in module.
 * @returns {string} Clean markdown string.
 */
function formatLessonForClipboard(lesson, currentIndex, totalLessons) {
  const parts = [];

  // Preamble
  parts.push('> This is a lesson from GSD Learn (lesson ' + (currentIndex + 1) + ' of ' + totalLessons + '). Use it as context to answer follow-up questions about the material.\n');
  parts.push('\n');

  // Title
  parts.push('# ' + lesson.title + '\n');
  parts.push('\n');

  // Objective
  parts.push('## Objective\n');
  parts.push('\n');
  parts.push(lesson.objective + '\n');
  parts.push('\n');

  // Content sections
  for (const section of lesson.content) {
    if (section.type === 'text') {
      parts.push(section.value + '\n');
      parts.push('\n');
    } else if (section.type === 'code') {
      if (section.source) {
        const line = section.source.startLine || 1;
        parts.push('```javascript\n');
        parts.push('// ' + section.source.file + ':' + line + '\n');
        parts.push(section.value + '\n');
        parts.push('```\n');
      } else {
        parts.push('```javascript\n');
        parts.push(section.value + '\n');
        parts.push('```\n');
      }
      parts.push('\n');
    } else if (section.type === 'project') {
      parts.push('## Your Mission\n');
      parts.push('\n');
      parts.push(section.task + '\n');
      parts.push('\n');
      if (section.deliverables && section.deliverables.length > 0) {
        section.deliverables.forEach((d, i) => {
          parts.push((i + 1) + '. ' + d + '\n');
        });
        parts.push('\n');
      }
    }
  }

  // Concept map
  if (lesson.conceptMap) {
    parts.push('## Architecture Overview\n');
    parts.push('\n');
    parts.push('```\n');

    let map = CONCEPT_MAP;
    const label = sectionMap[lesson.conceptMap] || lesson.conceptMap;
    if (label) {
      const marker = ' <-- YOU ARE HERE';
      map = map.replace(
        new RegExp('(\\|\\s*' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*)'),
        '$1' + marker
      );
    }

    parts.push(map.trim() + '\n');
    parts.push('```\n');
    parts.push('\n');
  }

  // Success criteria
  parts.push("## You'll know you've got it when:\n");
  parts.push('\n');
  parts.push(lesson.successCriteria + '\n');

  return parts.join('');
}

module.exports = { formatLessonForClipboard };
