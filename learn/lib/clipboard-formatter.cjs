'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Format a lesson as LLM-friendly markdown for clipboard.
 * Pure function -- no side effects, no ANSI codes.
 *
 * @param {object} lesson - Lesson data object.
 * @param {number} currentIndex - Zero-based index of current lesson.
 * @param {number} totalLessons - Total lessons in module.
 * @param {string} [moduleDir] - Absolute path to module directory (for concept map loading).
 * @returns {string} Clean markdown string.
 */
function formatLessonForClipboard(lesson, currentIndex, totalLessons, moduleDir) {
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

  // Concept map (loaded from file)
  if (lesson.conceptMap && moduleDir) {
    try {
      const mapPath = path.join(moduleDir, 'concept-map.txt');
      let map = fs.readFileSync(mapPath, 'utf-8');

      // Load sectionMap from module.json for marker insertion
      let sectionMap = null;
      try {
        const moduleJson = JSON.parse(fs.readFileSync(path.join(moduleDir, 'module.json'), 'utf-8'));
        sectionMap = moduleJson.sectionMap || null;
      } catch {
        // No module.json or no sectionMap -- skip marker
      }

      if (sectionMap) {
        const label = sectionMap[lesson.conceptMap] || lesson.conceptMap;
        if (label && sectionMap[lesson.conceptMap]) {
          const marker = ' <-- YOU ARE HERE';
          map = map.replace(
            new RegExp('(\\|\\s*' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*)'),
            '$1' + marker
          );
        }
      }

      parts.push('## Architecture Overview\n');
      parts.push('\n');
      parts.push('```\n');
      parts.push(map.trim() + '\n');
      parts.push('```\n');
      parts.push('\n');
    } catch {
      // concept-map.txt not found -- skip concept map section
    }
  }

  // Success criteria
  parts.push("## You'll know you've got it when:\n");
  parts.push('\n');
  parts.push(lesson.successCriteria + '\n');

  return parts.join('');
}

module.exports = { formatLessonForClipboard };
