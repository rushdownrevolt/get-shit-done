'use strict';

const fs = require('fs');
const path = require('path');

const PROGRESS_PATH = path.join('.planning', 'learn', 'progress.json');

const DEFAULT_PROGRESS = {
  version: 6,
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

/**
 * Migrate v2 progress data to v3 schema.
 * Adds `completed: false` to each module entry that lacks it.
 * If already v3 or higher, returns unchanged (idempotent).
 *
 * @param {object} progress - Progress object to migrate.
 * @returns {object} Migrated progress object (v3).
 */
function migrateV2toV3(progress) {
  if (progress.version >= 3) {
    return progress;
  }

  const migratedModules = {};
  for (const [key, modData] of Object.entries(progress.modules || {})) {
    migratedModules[key] = {
      ...modData,
      completed: modData.completed || false,
    };
  }

  return {
    version: 3,
    currentModule: progress.currentModule,
    currentLesson: progress.currentLesson,
    modules: migratedModules,
  };
}

/**
 * Migrate v3 progress data to v4 schema.
 * Structural version bump to support Module 3 tracking.
 * If already v4 or higher, returns unchanged (idempotent).
 *
 * @param {object} progress - Progress object to migrate.
 * @returns {object} Migrated progress object (v4).
 */
function migrateV3toV4(progress) {
  if (progress.version >= 4) {
    return progress;
  }

  return {
    version: 4,
    currentModule: progress.currentModule,
    currentLesson: progress.currentLesson,
    modules: { ...progress.modules },
  };
}

/**
 * Migrate v4 progress data to v5 schema.
 * Structural version bump to support Module 4 tracking.
 * If already v5 or higher, returns unchanged (idempotent).
 *
 * @param {object} progress - Progress object to migrate.
 * @returns {object} Migrated progress object (v5).
 */
function migrateV4toV5(progress) {
  if (progress.version >= 5) {
    return progress;
  }

  return {
    version: 5,
    currentModule: progress.currentModule,
    currentLesson: progress.currentLesson,
    modules: { ...progress.modules },
  };
}

/**
 * Migrate v5 progress data to v6 schema.
 * Structural version bump to support Module 5 tracking.
 * If already v6 or higher, returns unchanged (idempotent).
 *
 * @param {object} progress - Progress object to migrate.
 * @returns {object} Migrated progress object (v6).
 */
function migrateV5toV6(progress) {
  if (progress.version >= 6) {
    return progress;
  }

  return {
    version: 6,
    currentModule: progress.currentModule,
    currentLesson: progress.currentLesson,
    modules: { ...progress.modules },
  };
}

/**
 * Determine if this is the user's first run.
 * Returns true if no module has been started yet.
 *
 * @param {object} progress - Progress object to check.
 * @returns {boolean} True if first run (no modules started).
 */
function isFirstRun(progress) {
  const entries = Object.values(progress.modules || {});
  if (entries.length === 0) return true;
  return !entries.some((mod) => mod.started === true);
}

function loadProgress(cwd) {
  const filePath = path.join(cwd, PROGRESS_PATH);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle missing fields
    let progress = {
      version: parsed.version !== undefined ? parsed.version : DEFAULT_PROGRESS.version,
      currentModule: parsed.currentModule !== undefined ? parsed.currentModule : DEFAULT_PROGRESS.currentModule,
      currentLesson: parsed.currentLesson !== undefined ? parsed.currentLesson : DEFAULT_PROGRESS.currentLesson,
      modules: parsed.modules !== undefined ? parsed.modules : DEFAULT_PROGRESS.modules,
    };

    const originalVersion = progress.version;

    // Auto-migrate v1 to v2
    if (progress.version < 2) {
      progress = migrateV1toV2(progress);
    }

    // Auto-migrate v2 to v3
    if (progress.version < 3) {
      progress = migrateV2toV3(progress);
    }

    // Auto-migrate v3 to v4
    if (progress.version < 4) {
      progress = migrateV3toV4(progress);
    }

    // Auto-migrate v4 to v5
    if (progress.version < 5) {
      progress = migrateV4toV5(progress);
    }

    // Auto-migrate v5 to v6
    if (progress.version < 6) {
      progress = migrateV5toV6(progress);
    }

    // Save once if any migration occurred
    if (progress.version !== originalVersion) {
      saveProgress(cwd, progress);
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

module.exports = { loadProgress, saveProgress, migrateV1toV2, migrateV2toV3, migrateV3toV4, migrateV4toV5, migrateV5toV6, isFirstRun };
