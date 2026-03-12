'use strict';

const fs = require('fs');
const path = require('path');

const FEEDBACK_PATH = path.join('.planning', 'learn', 'feedback.json');

/**
 * Load feedback data from disk.
 *
 * @param {string} cwd - Working directory.
 * @returns {{ version: number, projects: object }}
 */
function loadFeedback(cwd) {
  const filePath = path.join(cwd, FEEDBACK_PATH);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return { version: 1, projects: {} };
  }
}

/**
 * Save feedback data to disk, creating directories if needed.
 *
 * @param {string} cwd - Working directory.
 * @param {object} feedback - Feedback data to persist.
 */
function saveFeedback(cwd, feedback) {
  const filePath = path.join(cwd, FEEDBACK_PATH);
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(feedback, null, 2), 'utf-8');
}

/**
 * Record a feedback event for a project.
 *
 * @param {string} cwd - Working directory.
 * @param {string} projectId - Mini-project identifier.
 * @param {string} eventType - 'verify_attempt' | 'hint_requested' | 'project_started' | 'project_completed'
 * @param {object} [data] - Additional event data.
 */
function recordEvent(cwd, projectId, eventType, data) {
  const feedback = loadFeedback(cwd);
  if (!feedback.projects[projectId]) {
    feedback.projects[projectId] = { events: [], startedAt: null, completedAt: null };
  }
  const project = feedback.projects[projectId];
  project.events.push({
    type: eventType,
    timestamp: new Date().toISOString(),
    data: data || {},
  });
  if (eventType === 'project_started' && !project.startedAt) {
    project.startedAt = new Date().toISOString();
  }
  if (eventType === 'project_completed') {
    project.completedAt = new Date().toISOString();
  }
  saveFeedback(cwd, feedback);
}

module.exports = { loadFeedback, saveFeedback, recordEvent, FEEDBACK_PATH };
