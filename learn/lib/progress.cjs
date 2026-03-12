'use strict';

const fs = require('fs');
const path = require('path');

const PROGRESS_PATH = path.join('.planning', 'learn', 'progress.json');

const DEFAULT_PROGRESS = {
  version: 1,
  currentModule: null,
  currentLesson: 0,
  modules: {},
};

function loadProgress(cwd) {
  const filePath = path.join(cwd, PROGRESS_PATH);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle missing fields
    return {
      version: parsed.version !== undefined ? parsed.version : DEFAULT_PROGRESS.version,
      currentModule: parsed.currentModule !== undefined ? parsed.currentModule : DEFAULT_PROGRESS.currentModule,
      currentLesson: parsed.currentLesson !== undefined ? parsed.currentLesson : DEFAULT_PROGRESS.currentLesson,
      modules: parsed.modules !== undefined ? parsed.modules : DEFAULT_PROGRESS.modules,
    };
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

module.exports = { loadProgress, saveProgress };
