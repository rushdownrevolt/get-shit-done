'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Load a module and all its lessons from the content directory.
 *
 * @param {string} moduleId - Module identifier (directory name).
 * @param {string} [contentDir] - Path to the content directory.
 * @returns {{ id: string, title: string, description: string, lessons: Array }}
 */
function loadModule(moduleId, contentDir) {
  const baseDir = contentDir || path.join(__dirname, '..', 'content');
  const moduleDir = path.join(baseDir, 'modules', moduleId);

  // Check module directory exists
  if (!fs.existsSync(moduleDir)) {
    throw new Error('Module directory not found: ' + moduleId + ' (looked in ' + moduleDir + ')');
  }

  // Load module.json
  const moduleJsonPath = path.join(moduleDir, 'module.json');
  if (!fs.existsSync(moduleJsonPath)) {
    throw new Error('Missing module.json for module: ' + moduleId + ' (expected at ' + moduleJsonPath + ')');
  }

  const moduleMeta = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf-8'));

  // Load lesson files sorted by filename
  const lessonsDir = path.join(moduleDir, 'lessons');
  let lessonFiles = [];
  if (fs.existsSync(lessonsDir)) {
    lessonFiles = fs.readdirSync(lessonsDir)
      .filter(f => f.endsWith('.json'))
      .sort();
  }

  const lessons = lessonFiles.map(filename => {
    const lessonPath = path.join(lessonsDir, filename);
    const lesson = JSON.parse(fs.readFileSync(lessonPath, 'utf-8'));

    // Validate required fields
    const required = ['id', 'title', 'lessonNumber', 'objective', 'content', 'conceptMap', 'successCriteria'];
    for (const field of required) {
      if (!(field in lesson)) {
        throw new Error('Lesson ' + filename + ' is missing required field: ' + field);
      }
    }

    return lesson;
  });

  return {
    id: moduleMeta.id,
    title: moduleMeta.title,
    description: moduleMeta.description,
    lessons,
  };
}

module.exports = { loadModule };
