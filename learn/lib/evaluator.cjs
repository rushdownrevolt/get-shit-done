'use strict';

const fs = require('fs');
const path = require('path');

// ─── Rubric Definition ───────────────────────────────────────────────────────

const rubricPath = path.join(__dirname, '..', 'content', 'rubric', 'rubric.json');
const RUBRIC = JSON.parse(fs.readFileSync(rubricPath, 'utf-8'));

// ─── Evaluation ──────────────────────────────────────────────────────────────

/**
 * Evaluate a lesson against the rubric dimensions.
 *
 * @param {object} scores - Object with dimension names as keys and numeric scores (1-5) as values.
 *   Missing dimensions default to score 1.
 * @returns {{ weighted: number, dimensions: object, pass: boolean }}
 */
function evaluateLesson(scores) {
  const dimensions = {};
  let weighted = 0;

  for (const [name, dim] of Object.entries(RUBRIC.dimensions)) {
    const score = scores[name] !== undefined ? scores[name] : 1;
    const contribution = score * dim.weight;
    dimensions[name] = {
      score: score,
      weight: dim.weight,
      contribution: Math.round(contribution * 100) / 100,
    };
    weighted += contribution;
  }

  // Round to avoid floating point drift
  weighted = Math.round(weighted * 100) / 100;

  return {
    weighted: weighted,
    dimensions: dimensions,
    pass: weighted >= RUBRIC.passThreshold,
  };
}

// ─── Iteration Recording ─────────────────────────────────────────────────────

/**
 * Record an iteration's scores to a numbered JSON file.
 *
 * @param {number} iterationNumber - The iteration number (1, 2, ...).
 * @param {object} lessonScores - Object mapping lesson IDs to score objects.
 * @param {string} notes - Free-text notes about this iteration.
 */
function recordIteration(iterationNumber, lessonScores, notes) {
  const scoresDir = path.join(__dirname, '..', 'content', 'rubric', 'scores');

  if (!fs.existsSync(scoresDir)) {
    fs.mkdirSync(scoresDir, { recursive: true });
  }

  const lessons = {};
  let totalWeighted = 0;
  let lessonCount = 0;

  for (const [lessonId, scores] of Object.entries(lessonScores)) {
    const result = evaluateLesson(scores);
    lessons[lessonId] = {
      scores: scores,
      weighted: result.weighted,
      pass: result.pass,
      dimensions: result.dimensions,
    };
    totalWeighted += result.weighted;
    lessonCount++;
  }

  const averageWeighted = lessonCount > 0
    ? Math.round(totalWeighted / lessonCount * 100) / 100
    : 0;

  const record = {
    iteration: iterationNumber,
    timestamp: new Date().toISOString(),
    notes: notes,
    lessons: lessons,
    summary: {
      totalLessons: lessonCount,
      averageWeighted: averageWeighted,
      allPassed: Object.values(lessons).every(function (l) { return l.pass; }),
    },
  };

  const paddedNum = String(iterationNumber).padStart(2, '0');
  const filePath = path.join(scoresDir, 'iteration-' + paddedNum + '.json');
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8');
}

module.exports = { RUBRIC, evaluateLesson, recordIteration };
