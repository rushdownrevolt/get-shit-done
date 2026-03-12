'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const { RUBRIC, evaluateLesson, recordIteration } = require('../lib/evaluator.cjs');

describe('RUBRIC constant', function () {
  it('has 5 dimensions with correct weights summing to 1.0', function () {
    const dimensions = Object.keys(RUBRIC.dimensions);
    assert.equal(dimensions.length, 5);
    assert.deepEqual(dimensions.sort(), [
      'accuracy', 'clarity', 'conceptMapConnection', 'depth', 'whyExplanations',
    ].sort());

    const totalWeight = Object.values(RUBRIC.dimensions)
      .reduce(function (sum, d) { return sum + d.weight; }, 0);
    assert.equal(Math.round(totalWeight * 100), 100);
  });

  it('has correct individual weights', function () {
    assert.equal(RUBRIC.dimensions.accuracy.weight, 0.25);
    assert.equal(RUBRIC.dimensions.clarity.weight, 0.20);
    assert.equal(RUBRIC.dimensions.depth.weight, 0.20);
    assert.equal(RUBRIC.dimensions.whyExplanations.weight, 0.20);
    assert.equal(RUBRIC.dimensions.conceptMapConnection.weight, 0.15);
  });

  it('has passThreshold of 3.5', function () {
    assert.equal(RUBRIC.passThreshold, 3.5);
  });
});

describe('evaluateLesson', function () {
  it('perfect scores (all 5s) produce weighted 5.0, pass true', function () {
    const result = evaluateLesson({
      accuracy: 5, clarity: 5, depth: 5,
      whyExplanations: 5, conceptMapConnection: 5,
    });
    assert.equal(result.weighted, 5.0);
    assert.equal(result.pass, true);
  });

  it('minimum scores (all 1s) produce weighted 1.0, pass false', function () {
    const result = evaluateLesson({
      accuracy: 1, clarity: 1, depth: 1,
      whyExplanations: 1, conceptMapConnection: 1,
    });
    assert.equal(result.weighted, 1.0);
    assert.equal(result.pass, false);
  });

  it('boundary: weighted exactly 3.5 passes', function () {
    // 3.5 = 0.25*a + 0.20*c + 0.20*d + 0.20*w + 0.15*m
    // All 3.5 => 3.5*(0.25+0.20+0.20+0.20+0.15) = 3.5*1.0 = 3.5
    const result = evaluateLesson({
      accuracy: 3.5, clarity: 3.5, depth: 3.5,
      whyExplanations: 3.5, conceptMapConnection: 3.5,
    });
    assert.equal(result.weighted, 3.5);
    assert.equal(result.pass, true);
  });

  it('boundary: weighted 3.49 fails', function () {
    const result = evaluateLesson({
      accuracy: 3.49, clarity: 3.49, depth: 3.49,
      whyExplanations: 3.49, conceptMapConnection: 3.49,
    });
    assert.ok(result.weighted < 3.5);
    assert.equal(result.pass, false);
  });

  it('missing dimension defaults to score 1', function () {
    const result = evaluateLesson({
      accuracy: 5, clarity: 5, depth: 5,
      whyExplanations: 5,
      // conceptMapConnection missing -> defaults to 1
    });
    // 0.25*5 + 0.20*5 + 0.20*5 + 0.20*5 + 0.15*1 = 1.25+1.0+1.0+1.0+0.15 = 4.4
    assert.equal(result.weighted, 4.4);
    assert.equal(result.pass, true);
  });

  it('dimensions object includes score, weight, contribution per dimension', function () {
    const result = evaluateLesson({
      accuracy: 4, clarity: 3, depth: 5,
      whyExplanations: 2, conceptMapConnection: 4,
    });
    assert.ok(result.dimensions);
    assert.equal(result.dimensions.accuracy.score, 4);
    assert.equal(result.dimensions.accuracy.weight, 0.25);
    assert.equal(result.dimensions.accuracy.contribution, 1.0);
    assert.equal(result.dimensions.clarity.score, 3);
    assert.equal(result.dimensions.clarity.contribution, 0.6);
  });
});

describe('recordIteration', function () {
  const scoresDir = path.join(__dirname, '..', 'content', 'rubric', 'scores');

  it('creates numbered JSON file in scores directory', function () {
    const testFile = path.join(scoresDir, 'iteration-99.json');

    // Clean up if exists
    try { fs.unlinkSync(testFile); } catch (e) { /* ignore */ }

    const lessonScores = {
      'welcome': { accuracy: 4, clarity: 4, depth: 3, whyExplanations: 3, conceptMapConnection: 3 },
    };
    recordIteration(99, lessonScores, 'test iteration');

    assert.ok(fs.existsSync(testFile), 'iteration-99.json should exist');
    const data = JSON.parse(fs.readFileSync(testFile, 'utf-8'));
    assert.equal(data.iteration, 99);
    assert.equal(data.notes, 'test iteration');
    assert.ok(data.lessons);
    assert.ok(data.summary);

    // Clean up
    fs.unlinkSync(testFile);
  });
});
