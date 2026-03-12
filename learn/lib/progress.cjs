'use strict';

const fs = require('fs');
const path = require('path');

const PROGRESS_PATH = path.join('.planning', 'learn', 'progress.json');

const DEFAULT_PROGRESS = {
  version: 2,
  currentModule: null,
  currentLesson: 0,
  modules: {},
};

/**
 * Migrate v1 progress data to v2 per-module schema.
 * If already v2 or higher, returns unchanged.
 *
 * @param {object} progress - Progress object to migrate.
 * @returns {object} Migrated progress object (v2).
 */
function migrateV1toV2(progress) {
  if (progress.version >= 2) {
    return progress;
  }

  const migrated = {
    version: 2,
    currentModule: progress.currentModule,
    currentLesson: progress.currentLesson,
    modules: { ...progress.modules },
  };

  // Copy current module's lesson position into per-module state
  if (progress.currentModule && !migrated.modules[progress.currentModule]) {
    migrated.modules[progress.currentModule] = {
      currentLesson: progress.currentLesson,
      started: true,
    };
  }

  return migrated;
}

function loadProgress(cwd) {
  const filePath = path.join(cwd, PROGRESS_PATH);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle missing fields
    const progress = {
      version: parsed.version !== undefined ? parsed.version : DEFAULT_PROGRESS.version,
      currentModule: parsed.currentModule !== undefined ? parsed.currentModule : DEFAULT_PROGRESS.currentModule,
      currentLesson: parsed.currentLesson !== undefined ? parsed.currentLesson : DEFAULT_PROGRESS.currentLesson,
      modules: parsed.modules !== undefined ? parsed.modules : DEFAULT_PROGRESS.modules,
    };

    // Auto-migrate v1 to v2
    if (progress.version < 2) {
      const migrated = migrateV1toV2(progress);
      saveProgress(cwd, migrated);
      return migrated;
    }

    return progress;
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

function saveProgress(cwd, progress) {
  const filePath = path.join(cwd, PROGRESS_PATH);
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(progress, null, 2), 'utf-8');
}

module.exports = { loadProgress, saveProgress, migrateV1toV2 };
